import { describe, expect, it } from "vitest";
import { centsToInput, formatCents, parseMoneyToCents } from "./money";

describe("formatCents", () => {
  it("formats cents as dollars", () => {
    expect(formatCents(1250)).toBe("$12.50");
    expect(formatCents(0)).toBe("$0.00");
    expect(formatCents(5)).toBe("$0.05");
    expect(formatCents(123456)).toBe("$1,234.56");
  });

  it("shows losses with a minus sign", () => {
    expect(formatCents(-350)).toBe("-$3.50");
  });

  it("drops .00 on whole amounts when asked", () => {
    expect(formatCents(1200, { whole: true })).toBe("$12");
    expect(formatCents(1250, { whole: true })).toBe("$12.50");
  });

  it("rejects non-integer cents", () => {
    expect(() => formatCents(12.5)).toThrow();
  });
});

describe("parseMoneyToCents", () => {
  it.each([
    ["12", 1200],
    ["12.5", 1250],
    ["12.50", 1250],
    ["12.", 1200],
    ["$12.50", 1250],
    ["1,200", 120000],
    [".50", 50],
    ["  7 ", 700],
    ["0", 0],
    ["0.1", 10],
    ["19.99", 1999],
  ])("parses %j as %i cents", (input, cents) => {
    expect(parseMoneyToCents(input)).toBe(cents);
  });

  it("avoids floating-point rounding errors", () => {
    // 0.29 * 100 = 28.999999999999996 in plain JS math
    expect(parseMoneyToCents("0.29")).toBe(29);
    expect(parseMoneyToCents("1.15")).toBe(115);
  });

  it.each(["", " ", ".", "$", "-5", "abc", "12.345", "12.3.4", "1e3", "12 50"])(
    "rejects %j",
    (input) => {
      expect(parseMoneyToCents(input)).toBeNull();
    },
  );
});

describe("centsToInput", () => {
  it("round-trips with parseMoneyToCents", () => {
    for (const cents of [0, 5, 50, 1200, 1250, 1999, 120000]) {
      expect(parseMoneyToCents(centsToInput(cents))).toBe(cents);
    }
  });

  it("keeps whole amounts short", () => {
    expect(centsToInput(1200)).toBe("12");
    expect(centsToInput(1205)).toBe("12.05");
  });
});
