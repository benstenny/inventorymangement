import { describe, expect, it } from "vitest";
import { addDays, shipByDate, shipFormSchema, shipUrgency, shippedPatch, sortForPacking } from "./shipping";

const proof = "items/0b6f2a3e-1c4d-4e5f-8a9b-0c1d2e3f4a5b.webp";

describe("ship-by date", () => {
  it("adds her ship-within days to the sale date, across months and years", () => {
    expect(shipByDate("2026-11-20", 5)).toBe("2026-11-25");
    expect(addDays("2026-11-28", 5)).toBe("2026-12-03");
    expect(addDays("2026-12-30", 5)).toBe("2027-01-04");
  });
});

describe("shipUrgency", () => {
  it("counts down, then says today, then counts days late", () => {
    expect(shipUrgency("2026-11-25", "2026-11-20")).toEqual({ tone: "ok", label: "5 days left" });
    expect(shipUrgency("2026-11-25", "2026-11-24")).toEqual({ tone: "soon", label: "Ship by tomorrow" });
    expect(shipUrgency("2026-11-25", "2026-11-25")).toEqual({ tone: "late", label: "Ship today" });
    expect(shipUrgency("2026-11-25", "2026-11-26")).toEqual({ tone: "late", label: "1 day late" });
    expect(shipUrgency("2026-11-25", "2026-11-28")).toEqual({ tone: "late", label: "3 days late" });
  });
});

describe("sortForPacking", () => {
  it("puts the oldest sale first", () => {
    const items = [
      { id: "b", soldDate: "2026-11-19" },
      { id: "a", soldDate: "2026-11-15" },
      { id: "c", soldDate: null },
      { id: "d", soldDate: "2026-11-19" },
    ];
    expect(sortForPacking(items).map((i) => i.id)).toEqual(["a", "b", "d", "c"]);
  });
});

describe("shipFormSchema", () => {
  it("needs the proof photo", () => {
    const result = shipFormSchema.safeParse({ id: "0b6f2a3e-1c4d-4e5f-8a9b-0c1d2e3f4a5b", proofPath: "", shippedDate: "2026-11-20" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe("Take a photo of it before you seal the package.");
  });

  it("rejects paths outside the photo folder", () => {
    const result = shipFormSchema.safeParse({
      id: "0b6f2a3e-1c4d-4e5f-8a9b-0c1d2e3f4a5b",
      proofPath: "../secrets.webp",
      shippedDate: "2026-11-20",
    });
    expect(result.success).toBe(false);
  });

  it("accepts a fresh upload", () => {
    const result = shipFormSchema.safeParse({ id: "0b6f2a3e-1c4d-4e5f-8a9b-0c1d2e3f4a5b", proofPath: proof, shippedDate: "2026-11-20" });
    expect(result.success).toBe(true);
  });
});

describe("shippedPatch", () => {
  it("moves a sold item to shipped with its proof photo", () => {
    expect(shippedPatch({ status: "SOLD" }, { proofPath: proof, shippedDate: "2026-11-21" })).toEqual({
      ok: true,
      patch: { status: "SHIPPED", shipProofPath: proof, shippedDate: "2026-11-21" },
    });
  });

  it("won't ship something twice or something that isn't sold", () => {
    expect(shippedPatch({ status: "SHIPPED" }, { proofPath: proof, shippedDate: "2026-11-21" }).ok).toBe(false);
    expect(shippedPatch({ status: "LISTED" }, { proofPath: proof, shippedDate: "2026-11-21" })).toEqual({
      ok: false,
      message: "Only sold items can be shipped.",
    });
  });
});
