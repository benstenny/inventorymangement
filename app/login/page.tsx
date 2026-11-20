import type { Metadata } from "next";
import { readPublicEnv } from "@/lib/env";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Log in" };

/** Sign-in sheet: the shop name in bubble letters, the form in the thumb zone. */
export default function LoginPage() {
  const connected = readPublicEnv() !== null;

  return (
    <main className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-end px-gutter pt-[calc(env(safe-area-inset-top)+64px)] pb-[calc(env(safe-area-inset-bottom)+32px)] sm:justify-center">
      <h1 className="bubble-title mb-3 text-[52px]">reydiantfinds</h1>
      <p className="mb-10 text-[17px] text-muted">Your finds, from the rack to the buyer.</p>

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
