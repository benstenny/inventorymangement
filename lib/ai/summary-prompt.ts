import { formatCents } from "@/lib/money";
import { monthLabel, type Month } from "@/lib/money-report";

/**
 * The AI monthly summary on the Money tab: her month's real numbers, turned into a short
 * plain-language note. Gemini only rewrites the facts given here; the prompt forbids inventing.
 */

export type SummarySale = {
  title: string;
  brand: string | null;
  category: string | null;
  source: string | null;
  platform: string | null;
  soldPrice: number;
  cost: number;
  profit: number;
  /** Days from listing to sale, when both dates are known. */
  daysListed: number | null;
};

export type SummaryFacts = {
  month: Month;
  sales: number;
  itemCosts: number;
  fees: number;
  shipping: number;
  expenses: number;
  profit: number;
  sold: SummarySale[];
  expensesByKind: Record<string, number>;
  budgets: { stock: { spent: number; budget: number }; upkeep: { spent: number; budget: number } };
  listedCount: number;
  /** Listed longer than her nudge setting without selling. */
  stale: { title: string; days: number }[];
  staleDays: number;
};

const $ = (cents: number) => formatCents(cents);

export function buildSummaryPrompt(f: SummaryFacts): string {
  const sold = f.sold.length
    ? f.sold
        .map((s) =>
          [
            `- ${s.title}`,
            s.brand && `brand ${s.brand}`,
            s.category && `category ${s.category}`,
            s.source && `bought at ${s.source}`,
            s.platform && `sold on ${s.platform}`,
            `sold for ${$(s.soldPrice)}`,
            `paid ${$(s.cost)}`,
            `profit ${$(s.profit)}`,
            s.daysListed !== null && `${s.daysListed} days listed`,
          ]
            .filter(Boolean)
            .join(", "),
        )
        .join("\n")
    : "- Nothing sold this month.";

  const expenses = Object.entries(f.expensesByKind)
    .filter(([, cents]) => cents > 0)
    .map(([kind, cents]) => `${kind.toLowerCase()} ${$(cents)}`)
    .join(", ");

  const stale = f.stale.length
    ? f.stale.map((s) => `${s.title} (${s.days} days)`).join("; ")
    : "none";

  return `You're a warm, practical coach for a new thrift reseller (Y2K and vintage clothing, sells on Depop, Instagram and at flea markets). Her goal for the first months is learning what sells. Write her a short note about ${monthLabel(f.month)} using ONLY the facts below. Never invent numbers, items, brands or trends that aren't in the facts.

Facts for ${monthLabel(f.month)}:
Sales ${$(f.sales)}; paid for those items ${$(f.itemCosts)}; fees ${$(f.fees)}; shipping ${$(f.shipping)}; expenses ${$(f.expenses)}${expenses ? ` (${expenses})` : ""}; profit ${$(f.profit)}.
Sold:
${f.sold.length ? sold : "- Nothing sold this month."}
Budgets: stock ${$(f.budgets.stock.spent)} of ${$(f.budgets.stock.budget)}; upkeep ${$(f.budgets.upkeep.spent)} of ${$(f.budgets.upkeep.budget)}.
Currently listed: ${f.listedCount}. Listed over ${f.staleDays} days without selling: ${stale}.

Write 3 or 4 short sentences in plain, friendly words: what made her the most money and why it might have (brand, category, store or platform, only if the facts show it), what's sitting and could use a lower price, how the budgets look, and one concrete thing to try next month. If there's too little data to see a pattern, say so kindly and suggest what to track. Under 90 words. No markdown, no bullet points, no headings, no emoji.`;
}
