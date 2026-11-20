import { describe, expect, it } from "vitest";
import { nextAction, quickStepPatch, type QuickStepItem } from "./status";

const nothingDone = { washed: false, measured: false, photographed: false, listed: false };
const readyToList = { washed: true, measured: true, photographed: true, listed: false };

describe("nextAction", () => {
  it("walks through the prep steps in order", () => {
    expect(nextAction({ status: "SOURCED", listPrice: null, prep: nothingDone })).toEqual({
      kind: "tap",
      step: "washed",
      label: "Mark washed",
    });
    expect(nextAction({ status: "NEEDS_PHOTOS", listPrice: null, prep: { ...nothingDone, washed: true } })).toEqual({
      kind: "edit",
      label: "Measure",
    });
    expect(
      nextAction({ status: "NEEDS_PHOTOS", listPrice: null, prep: { ...readyToList, photographed: false } }),
    ).toEqual({ kind: "edit", label: "Add photos" });
  });

  it("asks for a price before it can be listed with one tap", () => {
    expect(nextAction({ status: "NEEDS_PHOTOS", listPrice: null, prep: readyToList })).toEqual({
      kind: "edit",
      label: "Add a price",
    });
    expect(nextAction({ status: "NEEDS_PHOTOS", listPrice: 2500, prep: readyToList })).toEqual({
      kind: "tap",
      step: "listed",
      label: "Mark listed",
    });
  });

  it("offers Mark as sold once it's listed and prepped", () => {
    expect(nextAction({ status: "LISTED", listPrice: 2500, prep: { ...readyToList, listed: true } })).toEqual({
      kind: "sell",
      label: "Mark as sold",
    });
  });

  it("still points out a missed step on a listed item", () => {
    const prep = { ...readyToList, listed: true, washed: false };
    expect(nextAction({ status: "LISTED", listPrice: 2500, prep })?.label).toBe("Mark washed");
  });

  it("leaves sold and shipped items alone", () => {
    for (const status of ["SOLD", "SHIPPED", "RETURNED"] as const) {
      expect(nextAction({ status, listPrice: 2500, prep: nothingDone })).toBeNull();
    }
  });
});

describe("quickStepPatch", () => {
  const item: QuickStepItem = { status: "SOURCED", washed: false, listedOn: [], listedDate: null, listPrice: 2500 };
  const ctx = { today: "2026-11-20" };

  it("washing a new find moves it on to needs photos", () => {
    expect(quickStepPatch("washed", item, ctx)).toEqual({
      ok: true,
      patch: { washed: true, status: "NEEDS_PHOTOS" },
    });
  });

  it("washing doesn't move a listed item backwards", () => {
    expect(quickStepPatch("washed", { ...item, status: "LISTED" }, ctx)).toEqual({
      ok: true,
      patch: { washed: true, status: "LISTED" },
    });
  });

  it("lists on the places she used last time, stamping today", () => {
    expect(quickStepPatch("listed", item, { ...ctx, lastPlatforms: ["INSTAGRAM", "DEPOP"] })).toEqual({
      ok: true,
      patch: { status: "LISTED", listedOn: ["DEPOP", "INSTAGRAM"], listedDate: "2026-11-20" },
    });
  });

  it("falls back to Depop when she's never listed anything", () => {
    const result = quickStepPatch("listed", item, ctx);
    expect(result.ok && result.patch.listedOn).toEqual(["DEPOP"]);
  });

  it("keeps the places and first listed date it already has", () => {
    const result = quickStepPatch(
      "listed",
      { ...item, status: "NEEDS_PHOTOS", listedOn: ["FLEA_MARKET"], listedDate: "2026-10-01" },
      { ...ctx, lastPlatforms: ["DEPOP"] },
    );
    expect(result).toEqual({
      ok: true,
      patch: { status: "LISTED", listedOn: ["FLEA_MARKET"], listedDate: "2026-10-01" },
    });
  });

  it("won't list without a price", () => {
    expect(quickStepPatch("listed", { ...item, listPrice: null }, ctx)).toEqual({
      ok: false,
      message: "Add a price first.",
    });
  });

  it("won't touch sold or shipped items", () => {
    for (const status of ["SOLD", "SHIPPED", "RETURNED"] as const) {
      expect(quickStepPatch("washed", { ...item, status }, ctx).ok).toBe(false);
      expect(quickStepPatch("listed", { ...item, status }, ctx).ok).toBe(false);
    }
  });
});
