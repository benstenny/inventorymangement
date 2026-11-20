import { describe, expect, it } from "vitest";
import { platformFee, suggestPrices, worstCaseFees } from "./pricing";

const DEPOP = { percent: 3.3, fixedCents: 45 };
const FLEA = { percent: 0, fixedCents: 0 };
const SETTINGS = { minPrice: 1000, haggleRoom: 300 };

describe("platformFee", () => {
  it("applies percent plus fixed fee, rounded to the cent", () => {
    expect(platformFee(3800, DEPOP)).toBe(125 + 45); // 3.3% of $38 = $1.254
  });
  it("is free at a flea market and for no preset", () => {
    expect(platformFee(3800, FLEA)).toBe(0);
    expect(platformFee(3800, undefined)).toBe(0);
  });
  it("charges nothing on a $0 sale", () => {
    expect(platformFee(0, DEPOP)).toBe(0);
  });
});

describe("worstCaseFees", () => {
  it("picks the platform that takes the most", () => {
    expect(worstCaseFees({ DEPOP, FLEA_MARKET: FLEA })).toEqual(DEPOP);
  });
  it("is free with no presets", () => {
    expect(worstCaseFees({})).toEqual({ percent: 0, fixedCents: 0 });
  });
});

describe("suggestPrices", () => {
  it("never goes under the minimum price for cheap finds", () => {
    expect(suggestPrices(299, DEPOP, SETTINGS)).toEqual({ lowest: 1000, listAt: 1300 });
  });

  it("aims to take home double the cost after fees, rounded up to a dollar", () => {
    // $8 cost -> take home $16 -> (1600 + 45) / 0.967 = 1701.1 -> $18
    expect(suggestPrices(800, DEPOP, SETTINGS)).toEqual({ lowest: 1800, listAt: 2100 });
  });

  it("leaves room to haggle without dropping below the lowest price", () => {
    const { lowest, listAt } = suggestPrices(1500, DEPOP, SETTINGS);
    expect(listAt - SETTINGS.haggleRoom).toBe(lowest);
    expect(lowest - platformFee(lowest, DEPOP)).toBeGreaterThanOrEqual(3000);
  });

  it("handles free items", () => {
    expect(suggestPrices(0, DEPOP, SETTINGS).lowest).toBe(1000);
  });
});
