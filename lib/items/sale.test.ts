import { describe, expect, it } from "vitest";
import {
  feesFor,
  parseSaleForm,
  profitMargin,
  saleDefaults,
  salePatch,
  saleProfit,
  takeDownFrom,
} from "./sale";

const presets = {
  DEPOP: { percent: 10, fixedCents: 30 },
  INSTAGRAM: { percent: 0, fixedCents: 0 },
  FLEA_MARKET: { percent: 0, fixedCents: 0 },
};

const form = (over: Record<string, string> = {}) => ({
  platform: "DEPOP",
  soldPrice: "28",
  soldDate: "2026-11-20",
  fees: "3.10",
  shipping: "4.50",
  paymentMethod: "",
  buyerNotes: "",
  ...over,
});

describe("saleProfit", () => {
  it("takes cost, fees and shipping off what it sold for", () => {
    expect(saleProfit({ soldPrice: 2800, cost: 399, fees: 310, shipping: 450 })).toBe(1641);
  });

  it("can go negative when it sells under cost", () => {
    expect(saleProfit({ soldPrice: 1000, cost: 1200, fees: 130, shipping: 0 })).toBe(-330);
  });
});

describe("profitMargin", () => {
  it("is a whole percent of the sale price", () => {
    expect(profitMargin(1641, 2800)).toBe(59);
  });

  it("is null when it sold for nothing", () => {
    expect(profitMargin(-399, 0)).toBeNull();
  });
});

describe("fees and defaults", () => {
  it("uses the platform's preset; Instagram and flea market are free", () => {
    expect(feesFor("DEPOP", 2800, presets)).toBe(310);
    expect(feesFor("INSTAGRAM", 2800, presets)).toBe(0);
    expect(feesFor("FLEA_MARKET", 2800, presets)).toBe(0);
  });

  it("starts from where it's listed (Depop first) at the list price", () => {
    expect(saleDefaults({ listedOn: ["INSTAGRAM", "DEPOP"], listPrice: 2800 }, presets)).toEqual({
      platform: "DEPOP",
      soldPrice: 2800,
      fees: 310,
      shipping: 0,
    });
    expect(saleDefaults({ listedOn: ["FLEA_MARKET"], listPrice: null }, presets)).toEqual({
      platform: "FLEA_MARKET",
      soldPrice: null,
      fees: 0,
      shipping: 0,
    });
  });

  it("falls back to Depop when it isn't listed anywhere", () => {
    expect(saleDefaults({ listedOn: [], listPrice: 1500 }, presets).platform).toBe("DEPOP");
  });
});

describe("takeDownFrom", () => {
  it("lists the other places it's still up", () => {
    expect(takeDownFrom(["DEPOP", "INSTAGRAM"], "DEPOP")).toEqual(["INSTAGRAM"]);
    expect(takeDownFrom(["DEPOP"], "DEPOP")).toEqual([]);
    expect(takeDownFrom(["DEPOP", "FLEA_MARKET"], "INSTAGRAM")).toEqual(["DEPOP", "FLEA_MARKET"]);
  });
});

describe("parseSaleForm", () => {
  it("turns a Depop sale into cents, paid through Depop", () => {
    const result = parseSaleForm(form());
    expect(result).toEqual({
      ok: true,
      values: {
        platform: "DEPOP",
        soldPrice: 2800,
        soldDate: "2026-11-20",
        fees: 310,
        shipping: 450,
        paymentMethod: "DEPOP",
        buyerNotes: null,
      },
    });
  });

  it("needs a price and a date", () => {
    const result = parseSaleForm(form({ soldPrice: "", soldDate: "" }));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.soldPrice).toBe("Enter what it sold for.");
      expect(result.errors.soldDate).toBe("Pick the date it sold.");
    }
  });

  it("rejects money it can't read", () => {
    const result = parseSaleForm(form({ fees: "three" }));
    expect(!result.ok && result.errors.fees).toBe("Enter the fees like 12 or 12.50.");
  });

  it("asks how she was paid for Instagram and flea market sales", () => {
    const result = parseSaleForm(form({ platform: "INSTAGRAM", fees: "0" }));
    expect(!result.ok && result.errors.paymentMethod).toBe("Pick how you were paid.");
    const ok = parseSaleForm(form({ platform: "INSTAGRAM", fees: "0", paymentMethod: "VENMO" }));
    expect(ok.ok && ok.values.paymentMethod).toBe("VENMO");
  });

  it("drops shipping for flea market sales and treats blank amounts as $0", () => {
    const result = parseSaleForm(form({ platform: "FLEA_MARKET", fees: "", shipping: "6", paymentMethod: "CASH" }));
    expect(result.ok && result.values).toMatchObject({ fees: 0, shipping: 0, paymentMethod: "CASH" });
  });
});

describe("salePatch", () => {
  const sale = (over: Record<string, string> = {}) => {
    const parsed = parseSaleForm(form(over));
    if (!parsed.ok) throw new Error("bad test form");
    return parsed.values;
  };

  it("moves a shipped sale to Sold, waiting to pack", () => {
    const result = salePatch({ status: "LISTED" }, sale());
    expect(result).toMatchObject({ ok: true, patch: { status: "SOLD", shippedDate: null, platformFees: 310 } });
  });

  it("finishes a flea market sale on the spot", () => {
    const result = salePatch({ status: "LISTED" }, sale({ platform: "FLEA_MARKET", paymentMethod: "CASH" }));
    expect(result).toMatchObject({ ok: true, patch: { status: "SHIPPED", shippedDate: "2026-11-20", shippingCost: 0 } });
  });

  it("can sell something that was never marked listed", () => {
    expect(salePatch({ status: "NEEDS_PHOTOS" }, sale()).ok).toBe(true);
  });

  it("won't sell something twice", () => {
    expect(salePatch({ status: "SOLD" }, sale())).toEqual({ ok: false, message: "This one's already sold." });
    expect(salePatch({ status: "SHIPPED" }, sale()).ok).toBe(false);
  });
});
