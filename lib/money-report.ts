import { z } from "zod";
import { parseMoneyToCents } from "@/lib/money";
import { EXPENSE_KINDS, type ExpenseKind, type Platform } from "@/lib/items/options";
import { profitMargin, saleProfit } from "@/lib/items/sale";

/**
 * The monthly money report. A month's profit counts the items SOLD that month (what they
 * sold for, minus what she paid for them, fees and shipping) minus that month's expenses.
 * Budgets compare what she SPENT that month: stock = what she paid for items she picked up
 * that month; upkeep = that month's expenses. All money is integer cents.
 */

/** "2026-11". */
export type Month = string;
const MONTH = /^(\d{4})-(0[1-9]|1[0-2])$/;

export function isMonth(value: unknown): value is Month {
  return typeof value === "string" && MONTH.test(value);
}

/** The month a date falls in: "2026-11-20" -> "2026-11". */
export function monthOf(isoDate: string): Month {
  return isoDate.slice(0, 7);
}

/** "2026-11" + 1 -> "2026-12"; "2026-01" - 1 -> "2025-12". */
export function shiftMonth(month: Month, by: number): Month {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + by, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** First day of the month, and first day of the next one (exclusive end), for date filters. */
export function monthRange(month: Month): { from: string; to: string } {
  return { from: `${month}-01`, to: `${shiftMonth(month, 1)}-01` };
}

const monthFormatter = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
/** "2026-11" -> "November 2026". */
export function monthLabel(month: Month): string {
  return monthFormatter.format(new Date(`${month}-01T00:00:00Z`));
}

export type SoldRow = {
  id: string;
  sku: string;
  title: string;
  soldPlatform: Platform | null;
  soldDate: string;
  soldPrice: number;
  cost: number;
  fees: number;
  shipping: number;
};

export type ExpenseRow = { id: string; spentOn: string; kind: ExpenseKind; amount: number; note: string | null };

export type Budget = { spent: number; budget: number; left: number; share: number; state: "ok" | "near" | "over" };

export type MonthReport = {
  sales: number;
  itemCosts: number;
  fees: number;
  shipping: number;
  expenses: number;
  profit: number;
  soldCount: number;
  items: (SoldRow & { profit: number; margin: number | null })[];
  expenseRows: ExpenseRow[];
  budgets: { stock: Budget; upkeep: Budget };
};

/** Spend against a budget. "near" from 90%, "over" past 100%. */
export function budgetUse(spent: number, budget: number): Budget {
  const share = budget > 0 ? spent / budget : spent > 0 ? Infinity : 0;
  return {
    spent,
    budget,
    left: budget - spent,
    share,
    state: share > 1 ? "over" : share >= 0.9 ? "near" : "ok",
  };
}

const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);

export function buildMonthReport(input: {
  sold: SoldRow[];
  expenses: ExpenseRow[];
  /** What she paid for items she picked up this month. */
  stockCosts: number[];
  budgets: { inventory: number; upkeep: number };
}): MonthReport {
  const items = input.sold
    .map((row) => {
      const profit = saleProfit({ soldPrice: row.soldPrice, cost: row.cost, fees: row.fees, shipping: row.shipping });
      return { ...row, profit, margin: profitMargin(profit, row.soldPrice) };
    })
    .sort((a, b) => b.soldDate.localeCompare(a.soldDate) || a.title.localeCompare(b.title));

  const sales = sum(items.map((i) => i.soldPrice));
  const itemCosts = sum(items.map((i) => i.cost));
  const fees = sum(items.map((i) => i.fees));
  const shipping = sum(items.map((i) => i.shipping));
  const expenses = sum(input.expenses.map((e) => e.amount));

  return {
    sales,
    itemCosts,
    fees,
    shipping,
    expenses,
    profit: sales - itemCosts - fees - shipping - expenses,
    soldCount: items.length,
    items,
    expenseRows: [...input.expenses].sort((a, b) => b.spentOn.localeCompare(a.spentOn)),
    budgets: {
      stock: budgetUse(sum(input.stockCosts), input.budgets.inventory),
      upkeep: budgetUse(expenses, input.budgets.upkeep),
    },
  };
}

/** The "Add expense" form. Used in the browser and again on the server. */
export const expenseFormSchema = z.object({
  spentOn: z.iso.date({ message: "Pick the date." }),
  kind: z.enum(EXPENSE_KINDS, { message: "Pick what it was for." }),
  amount: z
    .string()
    .trim()
    .transform((v, ctx) => {
      const cents = v === "" ? null : parseMoneyToCents(v);
      if (cents === null || cents <= 0) {
        ctx.addIssue({ code: "custom", message: "Enter what it cost, like 12 or 12.50." });
        return z.NEVER;
      }
      return cents;
    }),
  note: z
    .string()
    .trim()
    .max(200, { message: "Keep this under 200 characters." })
    .optional()
    .transform((v) => (v ? v : null)),
});

export type ExpenseValues = z.output<typeof expenseFormSchema>;
export type ExpenseFieldErrors = Partial<Record<keyof z.input<typeof expenseFormSchema>, string>>;
export const EXPENSE_FORM_FIELDS = ["spentOn", "kind", "amount", "note"] as const;

export function parseExpenseForm(
  input: Record<string, string>,
): { ok: true; values: ExpenseValues } | { ok: false; errors: ExpenseFieldErrors } {
  const result = expenseFormSchema.safeParse(input);
  if (result.success) return { ok: true, values: result.data };
  const errors: ExpenseFieldErrors = {};
  for (const issue of result.error.issues) {
    const key = issue.path[0] as keyof ExpenseFieldErrors | undefined;
    if (key && !errors[key]) errors[key] = issue.message;
  }
  return { ok: false, errors };
}

/**
 * CSV for the monthly backup: header row, then one line per record. Quotes every field that
 * needs it, and defuses spreadsheet formulas (a cell starting with = + - @ is prefixed with ').
 */
export function toCsv(header: readonly string[], rows: readonly (readonly (string | number | boolean | null | undefined)[])[]): string {
  const cell = (value: string | number | boolean | null | undefined) => {
    if (value === null || value === undefined) return "";
    let text = String(value);
    if (typeof value === "string" && /^[=+\-@\t\r]/.test(text)) text = `'${text}`;
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  return [header, ...rows].map((r) => r.map(cell).join(",")).join("\r\n") + "\r\n";
}

/** Cents as a plain decimal for spreadsheets: 1250 -> "12.50"; null stays blank. */
export function centsForCsv(cents: number | null | undefined): string {
  if (cents === null || cents === undefined) return "";
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  return `${sign}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, "0")}`;
}
