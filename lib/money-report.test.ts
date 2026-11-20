import { describe, expect, it } from "vitest";
import {
  budgetUse,
  buildMonthReport,
  centsForCsv,
  isMonth,
  monthLabel,
  monthOf,
  monthRange,
  parseExpenseForm,
  shiftMonth,
  toCsv,
  type SoldRow,
} from "./money-report";

const sold = (over: Partial<SoldRow>): SoldRow => ({
  id: "1",
  sku: "TOP-0001",
  title: "Tee",
  soldPlatform: "DEPOP",
  soldDate: "2026-11-10",
  soldPrice: 4000,
  cost: 500,
  fees: 430,
  shipping: 450,
  ...over,
});

describe("months", () => {
  it("reads, shifts and labels months", () => {
    expect(isMonth("2026-11")).toBe(true);
    expect(isMonth("2026-13")).toBe(false);
    expect(isMonth("nov")).toBe(false);
    expect(monthOf("2026-11-20")).toBe("2026-11");
    expect(shiftMonth("2026-11", 1)).toBe("2026-12");
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
    expect(monthRange("2026-12")).toEqual({ from: "2026-12-01", to: "2027-01-01" });
    expect(monthLabel("2026-11")).toBe("November 2026");
  });
});

describe("budgetUse", () => {
  it("is ok, then near from 90%, then over past the budget", () => {
    expect(budgetUse(9600, 13000)).toMatchObject({ left: 3400, state: "ok" });
    expect(budgetUse(6700, 7000)).toMatchObject({ left: 300, state: "near" });
    expect(budgetUse(7000, 7000).state).toBe("near");
    expect(budgetUse(8000, 7000)).toMatchObject({ left: -1000, state: "over" });
  });

  it("handles a zero budget", () => {
    expect(budgetUse(0, 0).state).toBe("ok");
    expect(budgetUse(500, 0).state).toBe("over");
  });
});

describe("buildMonthReport", () => {
  const report = buildMonthReport({
    sold: [
      sold({ id: "a", title: "Breton", soldDate: "2026-11-05" }),
      sold({ id: "b", title: "Pants", soldDate: "2026-11-18", soldPrice: 6000, cost: 1200, fees: 630, shipping: 800 }),
      sold({ id: "c", title: "Scarf", soldDate: "2026-11-18", soldPrice: 1500, cost: 199, fees: 0, shipping: 0, soldPlatform: "FLEA_MARKET" }),
    ],
    expenses: [
      { id: "e1", spentOn: "2026-11-02", kind: "SUPPLIES", amount: 890, note: "Mailers" },
      { id: "e2", spentOn: "2026-11-15", kind: "UPKEEP", amount: 1200, note: "Laundromat" },
    ],
    stockCosts: [500, 1200, 199, 2500],
    budgets: { inventory: 13000, upkeep: 7000 },
  });

  it("adds up sales, what she paid for them, fees and shipping", () => {
    expect(report).toMatchObject({ sales: 11500, itemCosts: 1899, fees: 1060, shipping: 1250, expenses: 2090, soldCount: 3 });
  });

  it("takes expenses off the month's profit", () => {
    expect(report.profit).toBe(11500 - 1899 - 1060 - 1250 - 2090);
  });

  it("gives each item its profit, newest sale first", () => {
    expect(report.items.map((i) => [i.id, i.profit])).toEqual([
      ["b", 3370],
      ["c", 1301],
      ["a", 2620],
    ]);
    expect(report.items[0].margin).toBe(56);
  });

  it("lists expenses newest first and checks both budgets", () => {
    expect(report.expenseRows.map((e) => e.id)).toEqual(["e2", "e1"]);
    expect(report.budgets.stock).toMatchObject({ spent: 4399, budget: 13000, left: 8601, state: "ok" });
    expect(report.budgets.upkeep).toMatchObject({ spent: 2090, budget: 7000, state: "ok" });
  });

  it("is all zeros for an empty month", () => {
    const empty = buildMonthReport({ sold: [], expenses: [], stockCosts: [], budgets: { inventory: 13000, upkeep: 7000 } });
    expect(empty).toMatchObject({ sales: 0, profit: 0, soldCount: 0 });
  });
});

describe("parseExpenseForm", () => {
  it("turns the form into cents", () => {
    expect(parseExpenseForm({ spentOn: "2026-11-15", kind: "UPKEEP", amount: "12", note: " Laundromat " })).toEqual({
      ok: true,
      values: { spentOn: "2026-11-15", kind: "UPKEEP", amount: 1200, note: "Laundromat" },
    });
  });

  it("needs an amount above zero, a kind and a date", () => {
    const result = parseExpenseForm({ spentOn: "", kind: "", amount: "0", note: "" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.amount).toBe("Enter what it cost, like 12 or 12.50.");
      expect(result.errors.kind).toBe("Pick what it was for.");
      expect(result.errors.spentOn).toBe("Pick the date.");
    }
  });
});

describe("CSV", () => {
  it("quotes what needs quoting and defuses spreadsheet formulas", () => {
    expect(toCsv(["title", "note"], [["Levi's, 501", 'said "hi"'], ["=SUM(A1)", null]])).toBe(
      'title,note\r\n"Levi\'s, 501","said ""hi"""\r\n\'=SUM(A1),\r\n',
    );
  });

  it("writes cents as plain decimals", () => {
    expect(centsForCsv(1250)).toBe("12.50");
    expect(centsForCsv(5)).toBe("0.05");
    expect(centsForCsv(-330)).toBe("-3.30");
    expect(centsForCsv(null)).toBe("");
  });
});
