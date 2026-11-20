import { describe, expect, it } from "vitest";
import { formatInches, isMeasured, measurementsFor, parseInches } from "./measurements";

describe("parseInches", () => {
  it.each([
    ["19", 19],
    ["19.5", 19.5],
    [".5", 0.5],
    ["19 1/2", 19.5],
    ["19 3/4", 19.75],
    ["30 1/8", 30.125],
    ['19"', 19],
    ["19 in", 19],
    [" 19 inches ", 19],
  ])("reads %j as %d inches", (raw, inches) => {
    expect(parseInches(raw)).toBe(inches);
  });

  it("treats blank as not measured", () => {
    expect(parseInches("")).toBeNull();
    expect(parseInches("   ")).toBeNull();
  });

  it.each(["abc", "0", "-3", "150", "19 5/4", "19.555", "1/2"])("rejects %j", (raw) => {
    expect(parseInches(raw)).toBeUndefined();
  });
});

describe("measurementsFor", () => {
  it("asks tops for chest, shoulders, sleeve and length", () => {
    expect(measurementsFor("TOP").map((g) => g.key)).toEqual(["pitToPit", "shoulder", "sleeve", "length"]);
  });
  it("asks bottoms for waist, rise, inseam, leg opening and length", () => {
    expect(measurementsFor("BTM").map((g) => g.key)).toEqual(["waist", "rise", "inseam", "legOpening", "length"]);
  });
  it("asks nothing for categories without measurements", () => {
    expect(measurementsFor("ACC")).toEqual([]);
    expect(measurementsFor(null)).toEqual([]);
  });
});

describe("isMeasured", () => {
  it("needs every measurement for the category", () => {
    expect(isMeasured("DRS", { pitToPit: 17, waist: 14 })).toBe(false);
    expect(isMeasured("DRS", { pitToPit: 17, waist: 14, length: 36 })).toBe(true);
  });
  it("counts categories without measurements as done", () => {
    expect(isMeasured("ACC", {})).toBe(true);
  });
});

describe("formatInches", () => {
  it("drops trailing zeros", () => {
    expect(formatInches(26)).toBe("26");
    expect(formatInches(19.5)).toBe("19.5");
    expect(formatInches(undefined)).toBe("");
  });
});
