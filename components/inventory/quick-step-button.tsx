"use client";

import Link from "next/link";
import { useActionState } from "react";
import { quickStepAction, type QuickStepState } from "@/app/(app)/items/actions";
import type { NextAction } from "@/lib/items/status";

const pillClass =
  "relative z-10 flex min-h-touch shrink-0 items-center rounded-pill bg-surface-muted px-4 text-[15px] font-semibold text-ink-lilac transition-transform duration-150 ease-out-expo active:scale-95 disabled:opacity-55";

/**
 * The item's next step in the list. "Mark washed" and "Mark listed" save with one tap;
 * the others open the item, because they need the camera, a tape measure or a price.
 */
export function QuickStepButton({ id, action }: { id: string; action: NextAction }) {
  const [state, formAction, pending] = useActionState<QuickStepState, FormData>(quickStepAction, {});

  if (action.kind === "edit") {
    return (
      <Link href={`/items/${id}`} className={pillClass}>
        {action.label}
      </Link>
    );
  }

  return (
    <form action={formAction} className="flex flex-col items-end gap-1">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="step" value={action.step} />
      <button type="submit" disabled={pending} className={pillClass}>
        {pending ? "Saving…" : action.label}
      </button>
      {state.error && (
        <p role="alert" className="relative z-10 text-right text-[13px] font-medium text-danger">
          {state.error}
        </p>
      )}
    </form>
  );
}
