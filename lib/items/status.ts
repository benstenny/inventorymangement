import { FORM_STATUSES, sortPlatforms, type Platform, type Status } from "./options";
import { PREP_STEPS, type PrepStep } from "./prep";

/**
 * One-tap status changes from the inventory list. Each unsold item shows the
 * next thing to do. Two of them save on the spot ("Mark washed", "Mark listed");
 * the rest need the item screen (measuring, photos, a price).
 * Once it's listed and prepped, the next step is "Mark as sold", which opens the sale screen.
 * Sold and shipped items are moved on by "Pack today", not here.
 */

/** The steps that can be done with a single tap in the list. */
export const QUICK_STEPS = ["washed", "listed"] as const;
export type QuickStep = (typeof QUICK_STEPS)[number];

export type NextAction =
  | { kind: "tap"; step: QuickStep; label: string }
  | { kind: "edit"; label: string }
  | { kind: "sell"; label: string };

/** Still in her bins: sourced, waiting for photos, or listed. */
export function isInStock(status: Status): boolean {
  return (FORM_STATUSES as readonly Status[]).includes(status);
}

/** What the item's button in the list should do: the next prep step, then "Mark as sold". */
export function nextAction(item: {
  status: Status;
  listPrice: number | null;
  prep: Record<PrepStep, boolean>;
}): NextAction | null {
  if (!isInStock(item.status)) return null;
  const step = PREP_STEPS.find(({ step }) => !item.prep[step])?.step;
  switch (step) {
    case "washed":
      return { kind: "tap", step: "washed", label: "Mark washed" };
    case "measured":
      return { kind: "edit", label: "Measure" };
    case "photographed":
      return { kind: "edit", label: "Add photos" };
    case "listed":
      return item.listPrice === null
        ? { kind: "edit", label: "Add a price" }
        : { kind: "tap", step: "listed", label: "Mark listed" };
    default:
      return item.status === "LISTED" ? { kind: "sell", label: "Mark as sold" } : null;
  }
}

export type QuickStepItem = {
  status: Status;
  washed: boolean;
  listedOn: Platform[];
  listedDate: string | null;
  listPrice: number | null;
};

export type QuickStepPatch = {
  status: Status;
  washed?: boolean;
  listedOn?: Platform[];
  listedDate?: string;
};

export type QuickStepResult = { ok: true; patch: QuickStepPatch } | { ok: false; message: string };

/**
 * Works out the change for a one-tap step.
 * - Washed: ticks washed; a just-sourced item moves on to "Needs photos".
 * - Listed: needs a price. Keeps the places it's already listed, otherwise uses
 *   the places she listed on last time (Depop if she never has). Keeps the first listed date.
 */
export function quickStepPatch(
  step: QuickStep,
  item: QuickStepItem,
  ctx: { today: string; lastPlatforms?: readonly Platform[] },
): QuickStepResult {
  if (!isInStock(item.status)) return { ok: false, message: "This one's already sold." };

  if (step === "washed") {
    return {
      ok: true,
      patch: { washed: true, status: item.status === "SOURCED" ? "NEEDS_PHOTOS" : item.status },
    };
  }

  if (item.listPrice === null) return { ok: false, message: "Add a price first." };
  const listedOn = item.listedOn.length
    ? sortPlatforms(item.listedOn)
    : ctx.lastPlatforms?.length
      ? sortPlatforms(ctx.lastPlatforms)
      : (["DEPOP"] as Platform[]);
  return {
    ok: true,
    patch: { status: "LISTED", listedOn, listedDate: item.listedDate ?? ctx.today },
  };
}
