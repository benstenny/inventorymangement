import { createBrowserClient } from "@supabase/ssr";
import { getPublicEnv } from "@/lib/env";

/** Supabase client for Client Components (used for photo uploads later). */
export function createClient() {
  const { url, publishableKey } = getPublicEnv();
  return createBrowserClient(url, publishableKey);
}
