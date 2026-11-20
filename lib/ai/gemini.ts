import "server-only";
import { parseInteraction, type GroundedAnswer } from "./interaction";

/**
 * Calls Gemini through the Interactions API with Google Search grounding.
 * The key travels only from this server to Google, in the x-goog-api-key header.
 */

const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/interactions";
/** The API revision Google's docs use in their REST examples. */
const API_REVISION = "2026-05-20";

export class GeminiError extends Error {
  constructor(
    public status: number,
    detail: string,
  ) {
    super(`Gemini ${status}: ${detail}`);
    this.name = "GeminiError";
  }
}

export async function askWithGoogleSearch(prompt: string, config: { apiKey: string; model: string }): Promise<GroundedAnswer> {
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": config.apiKey,
      "Api-Revision": API_REVISION,
    },
    body: JSON.stringify({ model: config.model, input: prompt, tools: [{ type: "google_search" }] }),
    cache: "no-store",
    signal: AbortSignal.timeout(60_000),
  });

  if (!response.ok) {
    // Log Google's reason for debugging; never send it (or the key) to the browser.
    throw new GeminiError(response.status, (await response.text()).slice(0, 500));
  }
  const answer = parseInteraction(await response.json());
  if (!answer) throw new GeminiError(502, "No answer text in the response");
  return answer;
}
