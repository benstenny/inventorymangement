import type { Metadata } from "next";
import { readPublicEnv } from "@/lib/env";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage() {
  const connected = readPublicEnv() !== null;

  return (
    <main className="mx-auto flex w-full max-w-page flex-1 flex-col justify-end px-gutter pb-10 pt-16 sm:justify-center">
      <h1 className="mb-2 text-2xl font-semibold">Log in</h1>
      <p className="mb-8 text-muted">Your inventory, from sourcing to sale.</p>

      {!connected && (
        <p className="mb-6 rounded-card border border-border bg-surface p-4 text-sm text-warning">
          The app isn&apos;t connected to Supabase yet. Follow &ldquo;Set up Supabase&rdquo; in the
          README, then restart the app.
        </p>
      )}

      <LoginForm />
    </main>
  );
}
