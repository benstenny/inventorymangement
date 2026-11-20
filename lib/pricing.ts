/**
 * Fees and price suggestions. All amounts are integer cents.
 * Fee presets come from the settings table; never hardcode a platform's fees.
 */

export type FeePreset = { percent: number; fixedCents: number };
export type FeePresets = Partial<Record<string, FeePreset>>;

export type PricingSettings = {
  /** Lowest price she'll accept for anything ($10 to start). */
  minPrice: number;
  /** How far she'll come down when a buyer haggles ($3 to start). */
  haggleRoom: number;
};

/** What the platform takes from a sale at this price. */
export function platformFee(price: number, preset: FeePreset | undefined): number {
  if (!preset || price <= 0) return 0;
  return Math.round((price * preset.percent) / 100) + preset.fixedCents;
}

/** The priciest preset, so suggestions hold up wherever the item sells. */
export function worstCaseFees(presets: FeePresets): FeePreset {
  const all = Object.values(presets).filter((p): p is FeePreset => !!p);
  return all.reduce<FeePreset>(
    (worst, p) => (platformFee(10000, p) > platformFee(10000, worst) ? p : worst),
    { percent: 0, fixedCents: 0 },
  );
}

const roundUpToDollar = (cents: number) => Math.ceil(cents / 100) * 100;

export type PriceSuggestion = {
  /** Don't accept less than this: at least double the cost after fees, and never under the minimum price. */
  lowest: number;
  /** Ask at least this much, so haggling still lands at or above `lowest`. */
  listAt: number;
};

/**
 * Suggests the lowest price to accept and a starting list price for an item that cost `cost`.
 * Rule of thumb for a new reseller: after fees, take home at least twice what you paid.
 */
export function suggestPrices(cost: number, fees: FeePreset, settings: PricingSettings): PriceSuggestion {
  const takeHomeGoal = cost * 2;
  const keepRatio = 1 - fees.percent / 100;
  const breakEvenPrice = keepRatio > 0 ? (takeHomeGoal + fees.fixedCents) / keepRatio : takeHomeGoal;
  const lowest = Math.max(settings.minPrice, roundUpToDollar(breakEvenPrice));
  return { lowest, listAt: lowest + settings.haggleRoom };
}
