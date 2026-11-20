"use client";

import { useActionState } from "react";
import { inputClass, labelClass, primaryButtonClass } from "@/components/ui/styles";
import type { LoginState } from "@/lib/auth";
import { logIn } from "./actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(logIn, {});

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <label className="flex flex-col gap-1.5">
        <span className={labelClass}>Email</span>
        <input
          name="email"
          type="email"
          autoComplete="username"
          inputMode="email"
          autoCapitalize="none"
          required
          defaultValue={state.email}
          aria-invalid={state.error ? true : undefined}
          className={inputClass}
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className={labelClass}>Password</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          aria-invalid={state.error ? true : undefined}
          className={inputClass}
        />
      </label>

      <p role="alert" aria-live="polite" className="min-h-5 text-[15px] font-medium text-danger">
        {state.error}
      </p>

      <button type="submit" disabled={pending} className={primaryButtonClass}>
        {pending ? "Logging in…" : "Log in"}
      </button>
    </form>
  );
}
