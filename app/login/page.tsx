import type { Metadata } from "next";
import { readPublicEnv } from "@/lib/env";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Log in" };

/** Sign-in: the shop name and the form, centred so nothing sits under the keyboard or the home bar. */
export default function LoginPage() {
  const connected = readPublicEnv() !== null;

  return (
    <main className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center px-gutter pt-[calc(env(safe-area-inset-top)+24px)] pb-[calc(env(safe-area-inset-bottom)+24px)]">
      <h1 className="wordmark text-[46px]">reydiantfinds</h1>
      <p className="mt-2 mb-8 text-[17px] font-bold text-ink-violet">Log in to your shop</p>

      {!connected && (
        <p className="mb-6 rounded-card bg-surface-muted p-4 text-[15px] font-medium text-warning">
          The app isn&apos;t connected to Supabase yet. Follow &ldquo;Set up Supabase&rdquo; in the README, then
          restart the app.
        </p>
      )}

      <LoginForm />
    </main>
  );
}
