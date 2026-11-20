import { z } from "zod";
import { centsToInput, parseMoneyToCents } from "@/lib/money";
import { PLATFORMS, type Platform } from "@/lib/items/options";
import type { FeePresets } from "@/lib/pricing";

/**
 * The Settings page: her pricing rules, fee presets, shipping window, budgets and suggestion
 * lists, all in the one `settings` row. Validated in the browser and again on the server.
 * Money in cents; fee percents as plain numbers (10 = 10%).
 */

export type ShopSettings = {
  minPrice: number;
  haggleRoom: number;
  staleDays: number;
  shipWithinDays: number;
  inventoryBudget: number;
  upkeepBudget: number;
  fees: Record<Platform, { percent: number; fixedCents: number }>;
  sources: string[];
  storageSpots: string[];
};

/** Fills in any platform missing from the stored presets with 0%. */
export function feesFromPresets(presets: FeePresets): ShopSettings["fees"] {
  return Object.fromEntries(
    PLATFORMS.map((p) => [p, { percent: presets[p]?.percent ?? 0, fixedCents: presets[p]?.fixedCents ?? 0 }]),
  ) as ShopSettings["fees"];
}

const money = (label: string) =>
  z
    .string()
    .trim()
    .transform((v, ctx) => {
      const cents = v === "" ? 0 : parseMoneyToCents(v);
      if (cents === null) {
        ctx.addIssue({ code: "custom", message: `Enter ${label} like 10 or 10.50.` });
        return z.NEVER;
      }
      return cents;
    });

const wholeNumber = (label: string, min: number, max: number) =>
  z
    .string()
    .trim()
    .transform((v, ctx) => {
      const n = /^\d+$/.test(v) ? Number(v) : NaN;
      if (!Number.isInteger(n) || n < min || n > max) {
        ctx.addIssue({ code: "custom", message: `Enter ${label} between ${min} and ${max}.` });
        return z.NEVER;
      }
      return n;
    });

const percent = z
  .string()
  .trim()
  .transform((v, ctx) => {
    if (v === "") return 0;
    const n = /^\d{1,2}(\.\d{1,2})?$/.test(v) ? Number(v) : NaN;
    if (!Number.isFinite(n) || n > 50) {
      ctx.addIssue({ code: "custom", message: "Enter a percent between 0 and 50, like 10 or 3.3." });
      return z.NEVER;
    }
    return n;
  });

/** One name per line in the form; trimmed, no blanks, no repeats (case-insensitive), at most 20. */
const nameList = (label: string) =>
  z
    .string()
    .transform((v) => {
      const seen = new Set<string>();
      return v
        .split("\n")
        .map((s) => s.trim().replace(/\s+/g, " "))
        .filter((s) => s && !seen.has(s.toLowerCase()) && seen.add(s.toLowerCase()));
    })
    .pipe(
      z
        .array(z.string().max(40, { message: `Keep each ${label} under 40 characters.` }))
        .max(20, { message: `Keep it to 20 ${label}s or fewer.` }),
    );

const feeFields = Object.fromEntries(
  PLATFORMS.flatMap((p) => [
    [`fee_${p}_percent`, percent],
    [`fee_${p}_fixed`, money("the fixed fee")],
  ]),
) as Record<`fee_${Platform}_percent`, typeof percent> & Record<`fee_${Platform}_fixed`, ReturnType<typeof money>>;

export const settingsFormSchema = z
  .object({
    minPrice: money("your lowest price"),
    haggleRoom: money("your haggle room"),
    staleDays: wholeNumber("the days", 7, 365),
    shipWithinDays: wholeNumber("the days", 1, 30),
    inventoryBudget: money("the stock budget"),
    upkeepBudget: money("the upkeep budget"),
    sources: nameList("place"),
    storageSpots: nameList("spot"),
    ...feeFields,
  })
  .transform(
    (v): ShopSettings => ({
      minPrice: v.minPrice,
      haggleRoom: v.haggleRoom,
      staleDays: v.staleDays,
      shipWithinDays: v.shipWithinDays,
      inventoryBudget: v.inventoryBudget,
      upkeepBudget: v.upkeepBudget,
      sources: v.sources,
      storageSpots: v.storageSpots,
      fees: Object.fromEntries(
        PLATFORMS.map((p) => [p, { percent: v[`fee_${p}_percent`], fixedCents: v[`fee_${p}_fixed`] }]),
      ) as ShopSettings["fees"],
    }),
  );

export type SettingsFormInput = z.input<typeof settingsFormSchema>;
export type SettingsFieldErrors = Partial<Record<keyof SettingsFormInput, string>>;

export const SETTINGS_FORM_FIELDS = [
  "minPrice",
  "haggleRoom",
  "staleDays",
  "shipWithinDays",
  "inventoryBudget",
  "upkeepBudget",
  "sources",
  "storageSpots",
  ...PLATFORMS.flatMap((p) => [`fee_${p}_percent`, `fee_${p}_fixed`] as const),
] as const;

export function parseSettingsForm(
  input: Record<string, string>,
): { ok: true; values: ShopSettings } | { ok: false; errors: SettingsFieldErrors } {
  const result = settingsFormSchema.safeParse(input);
  if (result.success) return { ok: true, values: result.data };
  const errors: SettingsFieldErrors = {};
  for (const issue of result.error.issues) {
    const key = issue.path[0] as keyof SettingsFormInput | undefined;
    if (key && !errors[key]) errors[key] = issue.message;
  }
  return { ok: false, errors };
}

/** The form's starting text for each field. */
export function settingsToInput(s: ShopSettings): Record<string, string> {
  return {
    minPrice: centsToInput(s.minPrice),
    haggleRoom: centsToInput(s.haggleRoom),
    staleDays: String(s.staleDays),
    shipWithinDays: String(s.shipWithinDays),
    inventoryBudget: centsToInput(s.inventoryBudget),
    upkeepBudget: centsToInput(s.upkeepBudget),
    sources: s.sources.join("\n"),
    storageSpots: s.storageSpots.join("\n"),
    ...Object.fromEntries(
      PLATFORMS.flatMap((p) => [
        [`fee_${p}_percent`, String(s.fees[p].percent)],
        [`fee_${p}_fixed`, centsToInput(s.fees[p].fixedCents)],
      ]),
    ),
  };
}
