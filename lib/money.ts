/**
 * Money is stored as integer cents everywhere. Convert only at the edges:
 * parse what she types into cents, and format cents for display.
 */

/** The shop's currency. Change here if she sells in another currency. */
export const CURRENCY = "USD";
export const LOCALE = "en-US";

const formatter = new Intl.NumberFormat(LOCALE, { style: "currency", currency: CURRENCY });
const wholeFormatter = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: CURRENCY,
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/** 1250 -> "$12.50". Pass `{ whole: true }` to drop cents on round amounts: 1200 -> "$12". */
export function formatCents(cents: number, opts: { whole?: boolean } = {}): string {
  if (!Number.isInteger(cents)) throw new Error(`Money must be integer cents, got ${cents}`);
  if (opts.whole && cents % 100 === 0) return wholeFormatter.format(cents / 100);
  return formatter.format(cents / 100);
}

/**
 * Parses what someone types into a price field into cents.
 * Accepts "12", "12.5", "12.50", "$12.50", "1,200", ".50", " 7 ". Returns null
 * for anything else (empty, negative, letters, more than 2 decimal places).
 * Works on the digits as text, so there's no floating-point rounding.
 */
export function parseMoneyToCents(input: string): number | null {
  const cleaned = input.trim().replace(/^\$/, "").replace(/,/g, "").trim();
  if (!/\d/.test(cleaned)) return null;
  const match = /^(\d*)(?:\.(\d{0,2}))?$/.exec(cleaned);
  if (!match) return null;
  const [, whole = "", fraction = ""] = match;
  const cents = Number(whole || "0") * 100 + Number(fraction.padEnd(2, "0"));
  return Number.isSafeInteger(cents) ? cents : null;
}

/** Turns cents back into an editable field value: 1250 -> "12.50", 1200 -> "12". */
export function centsToInput(cents: number): string {
  if (!Number.isInteger(cents)) throw new Error(`Money must be integer cents, got ${cents}`);
  const whole = Math.trunc(cents / 100);
  const rest = Math.abs(cents % 100);
  return rest === 0 ? String(whole) : `${whole}.${String(rest).padStart(2, "0")}`;
}
