"use client";

import { useActionState } from "react";
import type { LoginState } from "@/lib/auth";
import { logIn } from "./actions";

const inputClass =
  "min-h-touch w-full rounded-control border border-border bg-surface px-3 text-base";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(logIn, {});

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Email</span>
        <input
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          defaultValue={state.email}
          className={inputClass}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Password</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={inputClass}
        />
      </label>

      <p role="alert" aria-live="polite" className="min-h-5 text-sm text-danger">
        {state.error}
      </p>

      <button
        type="submit"
        disabled={pending}
        className="min-h-touch w-full rounded-control bg-accent font-medium text-on-accent disabled:opacity-60"
      >
        {pending ? "Logging in…" : "Log in"}
      </button>
    </form>
  );
}
