import { z } from "zod";

/**
 * Public Supabase settings. Safe for the browser: the publishable key only
 * gets what Row Level Security allows, which is nothing until you log in.
 *
 * NEXT_PUBLIC_ vars must be read with their full literal names so Next.js
 * can inline them into the browser bundle.
 */
const publicSchema = z.object({
  url: z.url({ message: "NEXT_PUBLIC_SUPABASE_URL must be your Supabase project URL" }),
  publishableKey: z
    .string()
    .min(20, { message: "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is missing" }),
});

export type PublicEnv = z.infer<typeof publicSchema>;

export class MissingEnvError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MissingEnvError";
  }
}

/** Returns the public Supabase settings, or null if they aren't set up yet. */
export function readPublicEnv(): PublicEnv | null {
  const parsed = publicSchema.safeParse({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });
  return parsed.success ? parsed.data : null;
}

/** Same as readPublicEnv, but throws a readable error when settings are missing. */
export function getPublicEnv(): PublicEnv {
  const env = readPublicEnv();
  if (!env) {
    throw new MissingEnvError(
      "Supabase isn't connected yet. Copy .env.example to .env.local and fill in your project URL and publishable key.",
    );
  }
  return env;
}

/** Optional shared secret the daily cron sends to /api/health. Server only. */
export function getCronSecret(): string | undefined {
  return process.env.CRON_SECRET || undefined;
}

/**
 * Gemini, for "Help me price this". Server only: never give these a NEXT_PUBLIC_ prefix.
 * Returns null when no key is set, and the price helper says it isn't set up yet.
 */
export function getGeminiConfig(): { apiKey: string; model: string } | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return null;
  return { apiKey, model: process.env.GEMINI_MODEL?.trim() || "gemini-3.8-flash" };
}
