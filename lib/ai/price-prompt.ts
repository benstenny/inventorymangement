import { z } from "zod";
import { formatCents } from "@/lib/money";

/**
 * "Help me price this": the question sent to Gemini (with Google Search) about one item.
 * Gemini's answer is shown exactly as it comes back, next to Google's search suggestions,
 * as Google's terms require; so the prompt asks for a short, fixed shape.
 */

export const DAILY_AI_LIMIT = 30;

const text = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => v || null);

/** What the form sends: whatever she's typed so far, read from the item form. */
export const priceHelpSchema = z.object({
  title: z.string().trim().min(2, { message: "Add a title first, so there's something to look up." }).max(120),
  category: text(40),
  brand: text(80),
  size: text(40),
  color: text(40),
  condition: text(40),
  flaws: text(300),
  /** What she paid, in cents, when known. */
  cost: z.number().int().min(0).nullable().optional(),
});

export type PriceHelpInput = z.output<typeof priceHelpSchema>;

export function buildPricePrompt(item: PriceHelpInput, settings: { minPrice: number }): string {
  const details = [
    `Item: ${item.title}`,
    item.category && `Category: ${item.category}`,
    item.brand && `Brand: ${item.brand}`,
    item.size && `Size: ${item.size}`,
    item.color && `Color: ${item.color}`,
    item.condition && `Condition: ${item.condition}`,
    item.flaws && `Flaws: ${item.flaws}`,
    item.cost != null && `She paid: ${formatCents(item.cost)}`,
  ]
    .filter(Boolean)
    .join("\n");

  return `You help a small secondhand clothing seller (thrifted Y2K and vintage, US) price one item for Depop, Instagram or a flea market.

${details}

Search for comparable listings of this item or very close matches: sold listings first (eBay sold, Depop, Poshmark, Mercari, Etsy), then current asking prices. Then answer in exactly this shape, in plain words, under 90 words in total:

Suggested price: $X to $Y
Quick sale: $Z
Why: two or three short sentences about what comparable items sold or are listed for, and anything about this one (brand, era, condition, flaws) that moves the price up or down.

Rules: whole US dollars. Never suggest under ${formatCents(settings.minPrice, { whole: true })}, her lowest price. If you can't find good comparables, say so in "Why" and give a cautious range. No markdown, no bullet points, no headings.`;
}
