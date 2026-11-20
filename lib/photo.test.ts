import { describe, expect, it } from "vitest";
import { encodeUnderTarget, fitWithin } from "./photo";

describe("fitWithin", () => {
  it("shrinks a portrait phone photo to 1600px tall", () => {
    expect(fitWithin(3024, 4032)).toEqual({ width: 1200, height: 1600 });
  });

  it("shrinks a landscape photo to 1600px wide", () => {
    expect(fitWithin(4032, 3024)).toEqual({ width: 1600, height: 1200 });
  });

  it("never enlarges small photos", () => {
    expect(fitWithin(800, 600)).toEqual({ width: 800, height: 600 });
  });

  it("handles squares and custom limits", () => {
    expect(fitWithin(2000, 2000)).toEqual({ width: 1600, height: 1600 });
    expect(fitWithin(1000, 500, 100)).toEqual({ width: 100, height: 50 });
  });

  it("rejects empty images", () => {
    expect(() => fitWithin(0, 100)).toThrow();
  });
});

/** Fake encoder: size shrinks as quality drops. */
const fakeEncoder = (bytesAt: Record<number, number>) => {
  const calls: number[] = [];
  const encode = async (q: number) => {
    calls.push(q);
    return new Blob([new Uint8Array(bytesAt[q] ?? 0)]);
  };
  return { encode, calls };
};

describe("encodeUnderTarget", () => {
  it("keeps the first quality that fits", async () => {
    const { encode, calls } = fakeEncoder({ 0.8: 300_000 });
    const blob = await encodeUnderTarget(encode, 400_000);
    expect(blob.size).toBe(300_000);
    expect(calls).toEqual([0.8]);
  });

  it("steps quality down until it fits", async () => {
    const { encode, calls } = fakeEncoder({ 0.8: 600_000, 0.72: 450_000, 0.64: 380_000 });
    const blob = await encodeUnderTarget(encode, 400_000);
    expect(blob.size).toBe(380_000);
    expect(calls).toEqual([0.8, 0.72, 0.64]);
  });

  it("returns the smallest attempt if nothing fits", async () => {
    const { encode } = fakeEncoder({ 0.8: 900_000, 0.72: 800_000, 0.64: 700_000, 0.56: 650_000 });
    const blob = await encodeUnderTarget(encode, 400_000);
    expect(blob.size).toBe(650_000);
  });
});
