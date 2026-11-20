"use server";

import { DAILY_AI_LIMIT, buildPricePrompt, priceHelpSchema } from "@/lib/ai/price-prompt";
import { GeminiError, askWithGoogleSearch } from "@/lib/ai/gemini";
import type { GroundedAnswer } from "@/lib/ai/interaction";
import { getGeminiConfig } from "@/lib/env";
import { getFormSettings } from "@/lib/items/data";
import { createClient } from "@/lib/supabase/server";

export type PriceHelpResult = { ok: true; answer: GroundedAnswer } | { ok: false; error: string };

/**
 * "Help me price this". Logged in only (server actions run with her session), capped at
 * DAILY_AI_LIMIT a day, and nothing is stored: Google's terms don't allow keeping grounded answers.
 */
export async function priceHelpAction(input: unknown): Promise<PriceHelpResult> {
  const parsed = priceHelpSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Add a title first." };

  const config = getGeminiConfig();
  if (!config) return { ok: false, error: "Price help isn't set up yet. Add GEMINI_API_KEY (see the README)." };

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) return { ok: false, error: "Log in again, then try once more." };

  const { data: allowed, error: quotaError } = await supabase.rpc("use_ai_quota", { daily_limit: DAILY_AI_LIMIT });
  if (quotaError) {
    console.error(quotaError);
    return { ok: false, error: "Price help needs a quick database update first (migration 0004 in the README)." };
  }
  if (!allowed) return { ok: false, error: `That's today's ${DAILY_AI_LIMIT} price checks. Try again tomorrow.` };

  try {
    const { pricing } = await getFormSettings();
    const answer = await askWithGoogleSearch(buildPricePrompt(parsed.data, pricing), config);
    return { ok: true, answer };
  } catch (err) {
    console.error(err);
    if (err instanceof GeminiError && err.status === 429) {
      return { ok: false, error: "Google is busy right now. Try again in a minute." };
    }
    if (err instanceof GeminiError && (err.status === 400 || err.status === 401 || err.status === 403)) {
      return { ok: false, error: "Google didn't accept the request. Check the Gemini key and billing (see the README)." };
    }
    return { ok: false, error: "Couldn't get a price check. Check your internet connection and try again." };
  }
}
