import { isMeasured, type Measurements } from "./measurements";
import type { Status } from "./options";

/**
 * The per-item prep checklist from her business plan: washed, measured,
 * photographed, listed. Only "washed" is stored; the rest are worked out.
 */

export type PrepStep = "washed" | "measured" | "photographed" | "listed";

export const PREP_STEPS: { step: PrepStep; label: string }[] = [
  { step: "washed", label: "Washed" },
  { step: "measured", label: "Measured" },
  { step: "photographed", label: "Photographed" },
  { step: "listed", label: "Listed" },
];

export type PrepInput = {
  washed: boolean;
  skuPrefix: string | null | undefined;
  measurements: Measurements | null | undefined;
  photos: { front: string | null; back: string | null; styled: string | null };
  status: Status;
};

export function prepChecklist(item: PrepInput): Record<PrepStep, boolean> {
  return {
    washed: item.washed,
    measured: isMeasured(item.skuPrefix, item.measurements),
    photographed: !!(item.photos.front && item.photos.back && item.photos.styled),
    listed: item.status !== "SOURCED" && item.status !== "NEEDS_PHOTOS",
  };
}

/** The first step still to do, or null when it's ready. */
export function nextPrepStep(item: PrepInput): PrepStep | null {
  const done = prepChecklist(item);
  return PREP_STEPS.find(({ step }) => !done[step])?.step ?? null;
}

const TODO_WORDS: Record<PrepStep, string> = {
  washed: "wash",
  measured: "measure",
  photographed: "photos",
  listed: "list",
};

/** What's left, in her words: "To do: measure, photos, list". Null when every step is done. */
export function prepTodoText(done: Record<PrepStep, boolean>): string | null {
  const left = PREP_STEPS.filter(({ step }) => !done[step]).map(({ step }) => TODO_WORDS[step]);
  return left.length ? `To do: ${left.join(", ")}` : null;
}
