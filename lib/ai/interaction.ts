/**
 * Reads a Gemini Interactions API response (generativelanguage.googleapis.com/v1beta/interactions)
 * made with the google_search tool. Pure, so it's tested without calling Google.
 *
 * Shape (from Google's docs): { steps: [ { type: "thought" }, { type: "google_search_call",
 * arguments: { queries } }, { type: "google_search_result", result: [{ search_suggestions }] },
 * { type: "model_output", content: [{ type: "text", text, annotations: [{ type: "url_citation",
 * url, title }] }] } ] }. Read defensively: anything unexpected is skipped, not trusted.
 */

export type Citation = { url: string; title: string };

export type GroundedAnswer = {
  /** Gemini's answer, exactly as returned (shown verbatim). */
  text: string;
  /** The pages it used, in order, without repeats. Only http(s) links. */
  citations: Citation[];
  /** Google's Search Suggestions widget (HTML + CSS), shown unmodified next to the answer. */
  searchSuggestionsHtml: string | null;
};

type Json = Record<string, unknown>;
const isObject = (v: unknown): v is Json => typeof v === "object" && v !== null && !Array.isArray(v);
const asArray = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

function safeLink(url: unknown): string | null {
  if (typeof url !== "string") return null;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.toString() : null;
  } catch {
    return null;
  }
}

export function parseInteraction(body: unknown): GroundedAnswer | null {
  if (!isObject(body)) return null;
  const steps = asArray(body.steps).filter(isObject);

  const texts: string[] = [];
  const citations: Citation[] = [];
  const seen = new Set<string>();
  const suggestions: string[] = [];

  for (const step of steps) {
    if (step.type === "model_output") {
      for (const block of asArray(step.content).filter(isObject)) {
        if (block.type !== "text" || typeof block.text !== "string") continue;
        texts.push(block.text);
        for (const note of asArray(block.annotations).filter(isObject)) {
          if (note.type !== "url_citation") continue;
          const url = safeLink(note.url);
          if (!url || seen.has(url)) continue;
          seen.add(url);
          citations.push({ url, title: typeof note.title === "string" && note.title.trim() ? note.title.trim() : new URL(url).hostname });
        }
      }
    } else if (step.type === "google_search_result") {
      for (const result of asArray(step.result).filter(isObject)) {
        if (typeof result.search_suggestions === "string" && result.search_suggestions.trim()) {
          suggestions.push(result.search_suggestions);
        }
      }
    }
  }

  const text = texts.join("").trim();
  if (!text) return null;
  return { text, citations, searchSuggestionsHtml: suggestions.length ? suggestions.join("\n") : null };
}
