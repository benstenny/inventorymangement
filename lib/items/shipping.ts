import { z } from "zod";
import { daysBetween } from "@/lib/dates";
import { PHOTO_PATH } from "./schema";
import type { Status } from "./options";

/**
 * Pack today: sold items waiting to ship, oldest sale first, each with a ship-by date
 * (sold date + her "ship within" setting, 5 days to start). She photographs the item
 * before sealing the package as proof, then marks it shipped. All sales are final.
 */

/** "2026-11-20" + 5 days -> "2026-11-25". Plain calendar dates, no time zones. */
export function addDays(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

export function shipByDate(soldDate: string, shipWithinDays: number): string {
  return addDays(soldDate, shipWithinDays);
}

export type ShipUrgency = { tone: "ok" | "soon" | "late"; label: string };

/** How urgent it is, in her words: "3 days left", "Ship by tomorrow", "Ship today", "2 days late". */
export function shipUrgency(shipBy: string, today: string): ShipUrgency {
  if (today > shipBy) {
    const late = daysBetween(shipBy, today);
    return { tone: "late", label: late === 1 ? "1 day late" : `${late} days late` };
  }
  const left = daysBetween(today, shipBy);
  if (left === 0) return { tone: "late", label: "Ship today" };
  if (left === 1) return { tone: "soon", label: "Ship by tomorrow" };
  return { tone: "ok", label: `${left} days left` };
}

/** Oldest sale first, so nothing waits past its ship-by date. Ties keep their order. */
export function sortForPacking<T extends { soldDate: string | null }>(items: readonly T[]): T[] {
  return [...items].sort((a, b) => (a.soldDate ?? "9999").localeCompare(b.soldDate ?? "9999"));
}

/** "Mark shipped": the proof photo is required, and must be one she just uploaded. */
export const shipFormSchema = z.object({
  id: z.uuid({ message: "Something went wrong. Reload and try again." }),
  proofPath: z
    .string()
    .trim()
    .regex(PHOTO_PATH, { message: "Take a photo of it before you seal the package." }),
  shippedDate: z.iso.date({ message: "Something went wrong with the date. Reload and try again." }),
});

export type ShipValues = z.output<typeof shipFormSchema>;

/** The status change: only sold items can ship. */
export function shippedPatch(
  item: { status: Status },
  values: Pick<ShipValues, "proofPath" | "shippedDate">,
): { ok: true; patch: { status: "SHIPPED"; shipProofPath: string; shippedDate: string } } | { ok: false; message: string } {
  if (item.status === "SHIPPED") return { ok: false, message: "This one's already marked shipped." };
  if (item.status !== "SOLD") return { ok: false, message: "Only sold items can be shipped." };
  return { ok: true, patch: { status: "SHIPPED", shipProofPath: values.proofPath, shippedDate: values.shippedDate } };
}
