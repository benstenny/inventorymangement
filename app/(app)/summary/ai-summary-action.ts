"use server";

import { DAILY_AI_LIMIT } from "@/lib/ai/price-prompt";
import { GeminiError, askGemini } from "@/lib/ai/gemini";
import { buildSummaryPrompt } from "@/lib/ai/summary-prompt";
import { getGeminiConfig } from "@/lib/env";
import { getSummaryFacts } from "@/lib/money-data";
import { isMonth } from "@/lib/money-report";
import { createClient } from "@/lib/supabase/server";

export type AiSummaryResult = { ok: true; text: string } | { ok: false; error: string };

/**
 * "Write this month's summary": her real numbers for the month, rewritten by Gemini as a short
 * note. Logged in only, shares the daily AI cap with price checks, nothing is stored.
 */
export async function aiSummaryAction(month: unknown): Promise<AiSummaryResult> {
  if (!isMonth(month)) return { ok: false, error: "Something went wrong. Reload and try again." };

  const config = getGeminiConfig();
  if (!config) return { ok: false, error: "The AI summary isn't set up yet. Add GEMINI_API_KEY (see the README)." };

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) return { ok: false, error: "Log in again, then try once more." };

  const { data: allowed, error: quotaError } = await supabase.rpc("use_ai_quota", { daily_limit: DAILY_AI_LIMIT });
  if (quotaError) {
    console.error(quotaError);
    return { ok: false, error: "The AI summary needs a quick database update first (migration 0004 in the README)." };
  }
  if (!allowed) return { ok: false, error: `That's today's ${DAILY_AI_LIMIT} AI checks. Try again tomorrow.` };

  try {
    const facts = await getSummaryFacts(month);
    return { ok: true, text: await askGemini(buildSummaryPrompt(facts), config) };
  } catch (err) {
    console.error(err);
    if (err instanceof GeminiError && err.status === 429) {
      return { ok: false, error: "Google is busy right now. Try again in a minute." };
    }
    if (err instanceof GeminiError && (err.status === 400 || err.status === 401 || err.status === 403)) {
      return { ok: false, error: "Google didn't accept the request. Check the Gemini key and billing (see the README)." };
    }
    return { ok: false, error: "Couldn't write the summary. Check your internet connection and try again." };
  }
}
