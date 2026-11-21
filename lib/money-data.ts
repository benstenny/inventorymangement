import "server-only";
import { createClient } from "@/lib/supabase/server";
import { PLATFORM_LABELS, type ExpenseKind, type Platform } from "@/lib/items/options";
import type { SummaryFacts } from "@/lib/ai/summary-prompt";
import { daysBetween, todayIso } from "@/lib/dates";
import {
  buildMonthReport,
  centsForCsv,
  monthRange,
  toCsv,
  type ExpenseValues,
  type Month,
  type MonthReport,
} from "@/lib/money-report";

/**
 * Money reads and writes: the monthly report, expenses, budgets and the CSV backup.
 * Runs on the server with her session, so Row Level Security still applies.
 */

export async function getMonthReport(month: Month): Promise<MonthReport> {
  const supabase = await createClient();
  const { from, to } = monthRange(month);

  const [soldResult, expensesResult, stockResult, settingsResult] = await Promise.all([
    // Every sale in the month, archived or not: sale history always counts.
    supabase
      .from("items")
      .select("id, sku, title, sold_platform, sold_date, sold_price, source_cost, platform_fees, shipping_cost")
      .gte("sold_date", from)
      .lt("sold_date", to)
      .not("sold_price", "is", null)
      .returns<
        {
          id: string;
          sku: string;
          title: string;
          sold_platform: Platform | null;
          sold_date: string;
          sold_price: number;
          source_cost: number;
          platform_fees: number | null;
          shipping_cost: number | null;
        }[]
      >(),
    supabase
      .from("expenses")
      .select("id, spent_on, kind, amount, note")
      .gte("spent_on", from)
      .lt("spent_on", to)
      .returns<{ id: string; spent_on: string; kind: ExpenseKind; amount: number; note: string | null }[]>(),
    // What she paid for finds picked up this month (the stock budget).
    supabase
      .from("items")
      .select("source_cost")
      .gte("acquired_date", from)
      .lt("acquired_date", to)
      .returns<{ source_cost: number }[]>(),
    supabase
      .from("settings")
      .select("inventory_budget, upkeep_budget")
      .single<{ inventory_budget: number; upkeep_budget: number }>(),
  ]);

  for (const result of [soldResult, expensesResult, stockResult, settingsResult]) {
    if (result.error) throw new Error(`Couldn't load the money report: ${result.error.message}`);
  }

  return buildMonthReport({
    sold: (soldResult.data ?? []).map((r) => ({
      id: r.id,
      sku: r.sku,
      title: r.title,
      soldPlatform: r.sold_platform,
      soldDate: r.sold_date,
      soldPrice: r.sold_price,
      cost: r.source_cost,
      fees: r.platform_fees ?? 0,
      shipping: r.shipping_cost ?? 0,
    })),
    expenses: (expensesResult.data ?? []).map((e) => ({
      id: e.id,
      spentOn: e.spent_on,
      kind: e.kind,
      amount: e.amount,
      note: e.note,
    })),
    stockCosts: (stockResult.data ?? []).map((r) => r.source_cost),
    budgets: {
      inventory: settingsResult.data?.inventory_budget ?? 0,
      upkeep: settingsResult.data?.upkeep_budget ?? 0,
    },
  });
}

export async function addExpense(values: ExpenseValues): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("expenses").insert({
    spent_on: values.spentOn,
    kind: values.kind,
    amount: values.amount,
    note: values.note,
  });
  if (error) throw new Error(`Couldn't save the expense: ${error.message}`);
}

export async function deleteExpense(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("expenses").delete().eq("id", id);
  if (error) throw new Error(`Couldn't remove the expense: ${error.message}`);
}

const ITEM_COLUMNS = [
  "sku",
  "title",
  "brand",
  "size",
  "color",
  "condition",
  "flaws",
  "description",
  "source",
  "source_cost",
  "acquired_date",
  "storage_location",
  "washed",
  "status",
  "listed_on",
  "list_price",
  "listed_date",
  "sold_platform",
  "sold_price",
  "sold_date",
  "platform_fees",
  "shipping_cost",
  "payment_method",
  "buyer_notes",
  "shipped_date",
  "archived_at",
] as const;

const MONEY_COLUMNS = new Set(["source_cost", "list_price", "sold_price", "platform_fees", "shipping_cost"]);

/** Every item, archived ones too, as a spreadsheet-ready CSV. Money in dollars. */
export async function exportItemsCsv(): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("items")
    .select(ITEM_COLUMNS.join(", "))
    .order("sku")
    .returns<Record<(typeof ITEM_COLUMNS)[number], unknown>[]>();
  if (error) throw new Error(`Couldn't export the items: ${error.message}`);
  const rows = (data ?? []).map((row) =>
    ITEM_COLUMNS.map((col) => {
      const value = row[col];
      if (MONEY_COLUMNS.has(col)) return centsForCsv(value as number | null);
      if (Array.isArray(value)) return value.join(" ");
      return value as string | number | boolean | null;
    }),
  );
  return toCsv(ITEM_COLUMNS, rows);
}

/** Every expense as CSV. Money in dollars. */
export async function exportExpensesCsv(): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("expenses")
    .select("spent_on, kind, amount, note")
    .order("spent_on")
    .returns<{ spent_on: string; kind: string; amount: number; note: string | null }[]>();
  if (error) throw new Error(`Couldn't export the expenses: ${error.message}`);
  return toCsv(
    ["spent_on", "kind", "amount", "note"],
    (data ?? []).map((e) => [e.spent_on, e.kind, centsForCsv(e.amount), e.note]),
  );
}

/** Everything the AI monthly summary is allowed to talk about: her real numbers, nothing else. */
export async function getSummaryFacts(month: Month): Promise<SummaryFacts> {
  const supabase = await createClient();
  const { from, to } = monthRange(month);
  const [report, soldResult, listedResult, settingsResult] = await Promise.all([
    getMonthReport(month),
    supabase
      .from("items")
      .select("id, brand, source, listed_date, sold_date, categories ( name )")
      .gte("sold_date", from)
      .lt("sold_date", to)
      .not("sold_price", "is", null)
      .returns<
        { id: string; brand: string | null; source: string | null; listed_date: string | null; sold_date: string; categories: { name: string } | null }[]
      >(),
    supabase
      .from("items")
      .select("title, listed_date")
      .eq("status", "LISTED")
      .is("archived_at", null)
      .returns<{ title: string; listed_date: string | null }[]>(),
    supabase.from("settings").select("stale_days").single<{ stale_days: number }>(),
  ]);
  for (const result of [soldResult, listedResult]) {
    if (result.error) throw new Error(`Couldn't load the summary facts: ${result.error.message}`);
  }

  const extra = new Map((soldResult.data ?? []).map((r) => [r.id, r]));
  const staleDays = settingsResult.data?.stale_days ?? 30;
  const today = todayIso();
  const listed = listedResult.data ?? [];
  const expensesByKind: Record<string, number> = {};
  for (const e of report.expenseRows) expensesByKind[e.kind] = (expensesByKind[e.kind] ?? 0) + e.amount;

  return {
    month,
    sales: report.sales,
    itemCosts: report.itemCosts,
    fees: report.fees,
    shipping: report.shipping,
    expenses: report.expenses,
    profit: report.profit,
    sold: report.items.map((item) => {
      const more = extra.get(item.id);
      return {
        title: item.title,
        brand: more?.brand ?? null,
        category: more?.categories?.name ?? null,
        source: more?.source ?? null,
        platform: item.soldPlatform ? PLATFORM_LABELS[item.soldPlatform] : null,
        soldPrice: item.soldPrice,
        cost: item.cost,
        profit: item.profit,
        daysListed: more?.listed_date ? daysBetween(more.listed_date, item.soldDate) : null,
      };
    }),
    expensesByKind,
    budgets: {
      stock: { spent: report.budgets.stock.spent, budget: report.budgets.stock.budget },
      upkeep: { spent: report.budgets.upkeep.spent, budget: report.budgets.upkeep.budget },
    },
    listedCount: listed.length,
    stale: listed
      .filter((l) => l.listed_date && daysBetween(l.listed_date, today) >= staleDays)
      .map((l) => ({ title: l.title, days: daysBetween(l.listed_date as string, today) }))
      .sort((a, b) => b.days - a.days)
      .slice(0, 5),
    staleDays,
  };
}
