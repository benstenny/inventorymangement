import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { ExpenseKind, Platform } from "@/lib/items/options";
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
