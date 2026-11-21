"use client";

import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import { addExpenseAction, type ExpenseFormState } from "@/app/(app)/summary/actions";
import { Chips } from "@/components/ui/chips";
import { Field } from "@/components/ui/field";
import { MoneyInput } from "@/components/ui/money-input";
import { inputClass, primaryButtonClass } from "@/components/ui/styles";
import { EXPENSE_KIND_LABELS, EXPENSE_KINDS } from "@/lib/items/options";
import { EXPENSE_FORM_FIELDS, parseExpenseForm, type ExpenseFieldErrors } from "@/lib/money-report";

const KIND_OPTIONS = EXPENSE_KINDS.map((k) => ({ value: k, label: EXPENSE_KIND_LABELS[k] }));

function localToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Add an expense: what it was for, what it cost, when, and an optional note. */
export function ExpenseForm() {
  const [state, formAction, pending] = useActionState<ExpenseFormState, FormData>(addExpenseAction, {});
  const [clientErrors, setClientErrors] = useState<ExpenseFieldErrors | null>(null);
  const dateRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const errors = clientErrors ?? state.errors ?? {};

  // Defaults to today in her time zone (the server only knows UTC).
  useEffect(() => {
    if (dateRef.current && !dateRef.current.value) dateRef.current.value = localToday();
  }, []);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const result = parseExpenseForm(Object.fromEntries(EXPENSE_FORM_FIELDS.map((f) => [f, String(formData.get(f) ?? "")])));
    if (!result.ok) {
      setClientErrors(result.errors);
      formRef.current
        ?.querySelector<HTMLElement>(EXPENSE_FORM_FIELDS.filter((f) => result.errors[f]).map((f) => `[name="${f}"]`).join(","))
        ?.focus();
      return;
    }
    setClientErrors(null);
    startTransition(() => formAction(formData));
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate data-push-screen className="flex flex-col gap-5">
      {state.formError && (
        <p role="alert" className="rounded-card bg-surface p-4 text-[15px] font-medium text-danger ring-1 ring-danger">
          {state.formError}
        </p>
      )}

      <Chips name="kind" label="What for" options={KIND_OPTIONS} defaultValue="SUPPLIES" error={errors.kind} />

      <div className="grid grid-cols-2 gap-3">
        <Field label="Cost" htmlFor="amount" error={errors.amount}>
          <MoneyInput id="amount" name="amount" invalid={!!errors.amount} />
        </Field>
        <Field label="Date" htmlFor="spentOn" error={errors.spentOn}>
          <input
            ref={dateRef}
            id="spentOn"
            name="spentOn"
            type="date"
            aria-invalid={errors.spentOn ? true : undefined}
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="Note" htmlFor="note" error={errors.note} hint="Optional. Like “Mailers” or “Laundromat”.">
        <input id="note" name="note" type="text" autoComplete="off" aria-invalid={errors.note ? true : undefined} className={inputClass} />
      </Field>

      <div className="h-16" aria-hidden />
      <div className="fixed inset-x-0 bottom-(--tab-offset) pb-(--save-pad) z-10 bg-gradient-to-t from-bg from-60% to-transparent pt-4 lg:bottom-0 lg:left-sidebar">
        <div className="mx-auto max-w-page px-gutter pb-3 lg:px-10 lg:pb-6">
          <button type="submit" disabled={pending} className={`${primaryButtonClass} lg:ml-auto lg:w-60`}>
            {pending ? "Saving…" : "Add expense"}
          </button>
        </div>
      </div>
    </form>
  );
}
