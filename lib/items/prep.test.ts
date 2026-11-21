import { describe, expect, it } from "vitest";
import { nextPrepStep, prepChecklist, type PrepInput, prepTodoText } from "./prep";

const fresh: PrepInput = {
  washed: false,
  skuPrefix: "BTM",
  measurements: {},
  photos: { front: null, back: null, styled: null },
  status: "SOURCED",
};

const allPhotos = { front: "a.webp", back: "b.webp", styled: "c.webp" };
const allMeasurements = { waist: 28, rise: 11, inseam: 30, legOpening: 8, length: 40 };

describe("prepChecklist", () => {
  it("starts with nothing done", () => {
    expect(prepChecklist(fresh)).toEqual({ washed: false, measured: false, photographed: false, listed: false });
    expect(nextPrepStep(fresh)).toBe("washed");
  });

  it("needs all three photos", () => {
    expect(prepChecklist({ ...fresh, photos: { ...allPhotos, styled: null } }).photographed).toBe(false);
    expect(prepChecklist({ ...fresh, photos: allPhotos }).photographed).toBe(true);
  });

  it("counts listed, sold and shipped items as listed", () => {
    expect(prepChecklist({ ...fresh, status: "NEEDS_PHOTOS" }).listed).toBe(false);
    expect(prepChecklist({ ...fresh, status: "LISTED" }).listed).toBe(true);
    expect(prepChecklist({ ...fresh, status: "SHIPPED" }).listed).toBe(true);
  });

  it("points to the next thing to do, then nothing", () => {
    const washed = { ...fresh, washed: true };
    expect(nextPrepStep(washed)).toBe("measured");
    const measured = { ...washed, measurements: allMeasurements };
    expect(nextPrepStep(measured)).toBe("photographed");
    const photographed = { ...measured, photos: allPhotos };
    expect(nextPrepStep(photographed)).toBe("listed");
    expect(nextPrepStep({ ...photographed, status: "LISTED" })).toBeNull();
  });
});

describe("prepTodoText", () => {
  const none = { washed: false, measured: false, photographed: false, listed: false };
  it("lists what's left in order, in plain words", () => {
    expect(prepTodoText(none)).toBe("To do: wash, measure, photos, list");
    expect(prepTodoText({ ...none, washed: true, listed: true })).toBe("To do: measure, photos");
  });
  it("is null when everything is done", () => {
    expect(prepTodoText({ washed: true, measured: true, photographed: true, listed: true })).toBeNull();
  });
});
