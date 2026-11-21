"use client";

import { useActionState } from "react";
import { deleteItemForeverAction, type DeleteForeverState } from "@/app/(app)/items/actions";

/**
 * Hard delete: the item, its sale and profit record, and every photo. Can't be undone, so it asks
 * first and says exactly what goes. Archive is the gentle option above it.
 */
export function DeleteForeverButton({ id, title }: { id: string; title: string }) {
  const [state, formAction, pending] = useActionState<DeleteForeverState, FormData>(deleteItemForeverAction, {});
  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        const ok = window.confirm(
          `Delete “${title}” forever?\n\nThis removes the item, its photos, and its sale and profit from your money reports. It can't be undone.`,
        );
        if (!ok) e.preventDefault();
      }}
      className="mt-2 flex flex-col items-center gap-1 lg:items-start"
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        disabled={pending}
        className="min-h-touch rounded-pill px-4 text-[15px] font-semibold text-danger underline underline-offset-4 transition-colors hover:bg-surface-muted disabled:opacity-55"
      >
        {pending ? "Deleting…" : "Delete forever"}
      </button>
      {state.error && (
        <p role="alert" className="text-[13px] font-medium text-danger">
          {state.error}
        </p>
      )}
    </form>
  );
}
