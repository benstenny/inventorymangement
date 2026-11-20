/**
 * Which measurements each kind of item needs, with a one-line how-to for each.
 * All in inches, taken with the item laid flat. Picked by the category's SKU
 * prefix (TOP, BTM, ...) because prefixes never change, names might.
 */

export const MEASUREMENT_KEYS = [
  "pitToPit",
  "shoulder",
  "sleeve",
  "length",
  "waist",
  "rise",
  "inseam",
  "legOpening",
  "width",
  "height",
  "strapDrop",
] as const;
export type MeasurementKey = (typeof MEASUREMENT_KEYS)[number];

/** Inches, e.g. { pitToPit: 19.5, length: 26 }. Only filled-in ones are stored. */
export type Measurements = Partial<Record<MeasurementKey, number>>;

type Guide = { key: MeasurementKey; label: string; how: string };

const PIT_TO_PIT: Guide = {
  key: "pitToPit",
  label: "Pit to pit",
  how: "Straight across the chest, from armpit seam to armpit seam.",
};
const SHOULDER: Guide = {
  key: "shoulder",
  label: "Shoulders",
  how: "Across the back, from one shoulder seam to the other.",
};
const SLEEVE: Guide = {
  key: "sleeve",
  label: "Sleeve",
  how: "From the shoulder seam down to the end of the cuff.",
};
const TOP_LENGTH: Guide = {
  key: "length",
  label: "Length",
  how: "From the top of the shoulder, next to the collar, straight down to the hem.",
};
const WAIST: Guide = {
  key: "waist",
  label: "Waist",
  how: "Buttoned up, straight across the top of the waistband. Double it.",
};
const RISE: Guide = {
  key: "rise",
  label: "Rise",
  how: "On the front, from the crotch seam up to the top of the waistband.",
};
const INSEAM: Guide = {
  key: "inseam",
  label: "Inseam",
  how: "From the crotch seam down the inside of the leg to the hem.",
};
const LEG_OPENING: Guide = {
  key: "legOpening",
  label: "Leg opening",
  how: "Straight across the bottom of one leg.",
};
const BOTTOM_LENGTH: Guide = {
  key: "length",
  label: "Length",
  how: "From the top of the waistband straight down to the hem.",
};

/** SKU prefix -> measurements to ask for. Categories not listed here don't need any. */
const BY_PREFIX: Record<string, Guide[]> = {
  TOP: [PIT_TO_PIT, SHOULDER, SLEEVE, TOP_LENGTH],
  OUT: [PIT_TO_PIT, SHOULDER, SLEEVE, TOP_LENGTH],
  DRS: [PIT_TO_PIT, WAIST, TOP_LENGTH],
  BTM: [WAIST, RISE, INSEAM, LEG_OPENING, BOTTOM_LENGTH],
  BAG: [
    { key: "width", label: "Width", how: "Across the bottom of the bag." },
    { key: "height", label: "Height", how: "From the bottom to the top edge, not counting the strap." },
    { key: "strapDrop", label: "Strap drop", how: "From the top of the bag to the top of the strap, pulled up." },
  ],
};

export function measurementsFor(skuPrefix: string | null | undefined): Guide[] {
  return (skuPrefix && BY_PREFIX[skuPrefix]) || [];
}

/** Form field name for a measurement, e.g. "m_pitToPit". */
export const measurementField = (key: MeasurementKey) => `m_${key}` as const;

/**
 * Parses what she types ("19", "19.5", "19 1/2", '19"') into inches.
 * Returns null for blank, undefined for anything that isn't a sensible size.
 */
export function parseInches(raw: string): number | null | undefined {
  const text = raw.trim().replace(/(["”]|\s*in(ches)?\.?)$/i, "").trim();
  if (text === "") return null;

  let value: number;
  const fraction = /^(\d{1,3})\s+(\d)\/(2|4|8)$/.exec(text);
  if (/^\d{0,3}(\.\d{1,2})?$/.test(text)) {
    value = Number(text);
  } else if (fraction && Number(fraction[2]) < Number(fraction[3])) {
    value = Number(fraction[1]) + Number(fraction[2]) / Number(fraction[3]);
  } else {
    return undefined;
  }
  return value > 0 && value <= 100 ? value : undefined;
}

/** True when every measurement this category asks for is filled in (or it needs none). */
export function isMeasured(skuPrefix: string | null | undefined, measurements: Measurements | null | undefined) {
  return measurementsFor(skuPrefix).every((g) => typeof measurements?.[g.key] === "number");
}

/** 19.5 -> "19.5", 26 -> "26". */
export function formatInches(value: number | undefined): string {
  return value === undefined ? "" : String(Math.round(value * 100) / 100);
}
