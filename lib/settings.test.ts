import { describe, expect, it } from "vitest";
import { feesFromPresets, parseSettingsForm, settingsToInput, type ShopSettings } from "./settings";

const current: ShopSettings = {
  minPrice: 1000,
  haggleRoom: 300,
  staleDays: 30,
  shipWithinDays: 5,
  inventoryBudget: 13000,
  upkeepBudget: 7000,
  fees: {
    DEPOP: { percent: 10, fixedCents: 30 },
    INSTAGRAM: { percent: 0, fixedCents: 0 },
    FLEA_MARKET: { percent: 0, fixedCents: 0 },
  },
  sources: ["Goodwill", "Salvation Army"],
  storageSpots: ["Tops bin", "Bottoms bin"],
};

describe("settings form", () => {
  it("round-trips: the form's starting values parse back to the same settings", () => {
    expect(parseSettingsForm(settingsToInput(current))).toEqual({ ok: true, values: current });
  });

  it("reads money, days, percents and lists", () => {
    const input = {
      ...settingsToInput(current),
      minPrice: "12",
      fee_DEPOP_percent: "3.3",
      fee_DEPOP_fixed: "0.45",
      sources: " Goodwill \n\ngoodwill\nOC  Rag House\n",
    };
    const result = parseSettingsForm(input);
    expect(result.ok && result.values).toMatchObject({
      minPrice: 1200,
      fees: { DEPOP: { percent: 3.3, fixedCents: 45 } },
      sources: ["Goodwill", "OC Rag House"],
    });
  });

  it("explains what's wrong", () => {
    const result = parseSettingsForm({
      ...settingsToInput(current),
      staleDays: "3",
      shipWithinDays: "five",
      fee_DEPOP_percent: "80",
      haggleRoom: "lots",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.staleDays).toBe("Enter the days between 7 and 365.");
      expect(result.errors.shipWithinDays).toBe("Enter the days between 1 and 30.");
      expect(result.errors.fee_DEPOP_percent).toBe("Enter a percent between 0 and 50, like 10 or 3.3.");
      expect(result.errors.haggleRoom).toBe("Enter your haggle room like 10 or 10.50.");
    }
  });

  it("keeps lists short", () => {
    const result = parseSettingsForm({ ...settingsToInput(current), storageSpots: "x".repeat(41) });
    expect(!result.ok && result.errors.storageSpots).toBe("Keep each spot under 40 characters.");
  });
});

describe("feesFromPresets", () => {
  it("fills in platforms that have no preset yet", () => {
    expect(feesFromPresets({ DEPOP: { percent: 10, fixedCents: 30 } })).toEqual(current.fees);
  });
});
