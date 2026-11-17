import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getCronSecret, readPublicEnv } from "@/lib/env";

/**
 * GET /api/health
 * Used by the daily Vercel cron to keep the free Supabase project awake,
 * and handy for checking the app is connected.
 */
export async function GET(request: Request) {
  const secret = getCronSecret();
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const env = readPublicEnv();
  if (!env) {
    return Response.json(
      { ok: false, db: "not configured", error: "Supabase env vars are missing. See .env.example." },
      { status: 503 },
    );
  }

  // No cookies needed: health_check() is the one function the public key may call.
  const supabase = createSupabaseClient(env.url, env.publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase.rpc("health_check");
  if (error || data !== true) {
    return Response.json(
      { ok: false, db: "down", error: error?.message ?? "Database not set up. Run the migration." },
      { status: 503 },
    );
  }

  return Response.json({ ok: true, db: "up" });
}
