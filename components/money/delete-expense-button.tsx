"use client";

import { useFormStatus } from "react-dom";
import { deleteExpenseAction } from "@/app/(app)/summary/actions";

/** Removes one expense, after a quick "are you sure". */
export function DeleteExpenseButton({ id, label }: { id: string; label: string }) {
  return (
    <form
      action={deleteExpenseAction}
      onSubmit={(e) => {
        if (!window.confirm(`Remove “${label}”?`)) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <RemoveButton label={label} />
    </form>
  );
}

function RemoveButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-label={`Remove ${label}`}
      className="flex min-h-touch items-center px-2 text-[15px] font-semibold text-danger disabled:opacity-55"
    >
      {pending ? "…" : "Remove"}
    </button>
  );
}
