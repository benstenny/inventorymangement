import { describe, expect, it } from "vitest";
import { parseInteraction } from "./interaction";
import { buildPricePrompt, priceHelpSchema } from "./price-prompt";

/** Mirrors the example response on Google's "Grounding with Google Search" page. */
const sample = {
  steps: [
    { type: "thought", summary: [{ type: "text", text: "Looking up comparables" }], signature: "abc" },
    { type: "google_search_call", arguments: { queries: ["levi's red tab tee vintage sold"] } },
    { type: "google_search_result", call_id: "search_001", result: [{ search_suggestions: "<div class='chips'>levi's</div>" }] },
    {
      type: "model_output",
      content: [
        {
          type: "text",
          text: "Suggested price: $24 to $32\nQuick sale: $20\nWhy: Similar tees sold for $25 to $35.",
          annotations: [
            { type: "url_citation", url: "https://www.ebay.com/itm/1", title: "ebay.com", start_index: 0, end_index: 10 },
            { type: "url_citation", url: "https://www.ebay.com/itm/1", title: "ebay.com", start_index: 11, end_index: 20 },
            { type: "url_citation", url: "javascript:alert(1)", title: "bad" },
            { type: "url_citation", url: "https://www.depop.com/products/x", title: "" },
          ],
        },
      ],
    },
  ],
};

describe("parseInteraction", () => {
  it("reads the answer, its sources and Google's search suggestions", () => {
    expect(parseInteraction(sample)).toEqual({
      text: "Suggested price: $24 to $32\nQuick sale: $20\nWhy: Similar tees sold for $25 to $35.",
      citations: [
        { url: "https://www.ebay.com/itm/1", title: "ebay.com" },
        { url: "https://www.depop.com/products/x", title: "www.depop.com" },
      ],
      searchSuggestionsHtml: "<div class='chips'>levi's</div>",
    });
  });

  it("returns null when there's no answer text", () => {
    expect(parseInteraction({ steps: [{ type: "thought" }] })).toBeNull();
    expect(parseInteraction("oops")).toBeNull();
    expect(parseInteraction(null)).toBeNull();
  });

  it("works without search suggestions or citations", () => {
    expect(parseInteraction({ steps: [{ type: "model_output", content: [{ type: "text", text: "Hi" }] }] })).toEqual({
      text: "Hi",
      citations: [],
      searchSuggestionsHtml: null,
    });
  });
});

describe("price prompt", () => {
  it("needs a title to look up", () => {
    expect(priceHelpSchema.safeParse({ title: " " }).success).toBe(false);
  });

  it("includes what she's filled in and her lowest price, and skips blanks", () => {
    const item = priceHelpSchema.parse({ title: "Levi's red tab tee", brand: "Levi's", size: "", cost: 399 });
    const prompt = buildPricePrompt(item, { minPrice: 1000 });
    expect(prompt).toContain("Item: Levi's red tab tee");
    expect(prompt).toContain("Brand: Levi's");
    expect(prompt).toContain("She paid: $3.99");
    expect(prompt).toContain("Never suggest under $10");
    expect(prompt).not.toContain("Size:");
  });

  it("passes on her notes and measurements", () => {
    const item = priceHelpSchema.parse({ title: "Tee", notes: "Single stitch, made in USA", measurements: "Pit to pit 20.5 in" });
    const prompt = buildPricePrompt(item, { minPrice: 1000 });
    expect(prompt).toContain("Notes: Single stitch, made in USA");
    expect(prompt).toContain("Measurements (laid flat): Pit to pit 20.5 in");
  });
});
