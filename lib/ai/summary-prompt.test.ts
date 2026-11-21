import { describe, expect, it } from "vitest";
import { buildSummaryPrompt, type SummaryFacts } from "./summary-prompt";

const facts: SummaryFacts = {
  month: "2026-11",
  sales: 10000,
  itemCosts: 1700,
  fees: 430,
  shipping: 1250,
  expenses: 2090,
  profit: 4530,
  sold: [
    {
      title: "Carhartt pants",
      brand: "Carhartt",
      category: "Bottoms",
      source: "Salvation Army",
      platform: "Depop",
      soldPrice: 6000,
      cost: 1200,
      profit: 4000,
      daysListed: 12,
    },
    { title: "Scarf", brand: null, category: null, source: null, platform: null, soldPrice: 4000, cost: 500, profit: 530, daysListed: null },
  ],
  expensesByKind: { SUPPLIES: 890, UPKEEP: 1200, OTHER: 0 },
  budgets: { stock: { spent: 9600, budget: 13000 }, upkeep: { spent: 2090, budget: 7000 } },
  listedCount: 5,
  stale: [{ title: "Coach bag", days: 45 }],
  staleDays: 30,
};

describe("buildSummaryPrompt", () => {
  const prompt = buildSummaryPrompt(facts);

  it("gives the month's real numbers", () => {
    expect(prompt).toContain("November 2026");
    expect(prompt).toContain("Sales $100.00");
    expect(prompt).toContain("profit $45.30");
    expect(prompt).toContain("expenses $20.90 (supplies $8.90, upkeep $12.00)");
    expect(prompt).toContain("stock $96.00 of $130.00");
  });

  it("describes each sale with only the details it has", () => {
    expect(prompt).toContain(
      "- Carhartt pants, brand Carhartt, category Bottoms, bought at Salvation Army, sold on Depop, sold for $60.00, paid $12.00, profit $40.00, 12 days listed",
    );
    expect(prompt).toContain("- Scarf, sold for $40.00, paid $5.00, profit $5.30");
  });

  it("names what's sitting and forbids inventing", () => {
    expect(prompt).toContain("Listed over 30 days without selling: Coach bag (45 days)");
    expect(prompt).toContain("Never invent numbers");
  });

  it("says so when nothing sold", () => {
    expect(buildSummaryPrompt({ ...facts, sold: [] })).toContain("- Nothing sold this month.");
  });
});
