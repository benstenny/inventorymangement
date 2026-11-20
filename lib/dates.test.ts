import { describe, expect, it } from "vitest";
import { daysBetween, todayIso } from "./dates";

describe("daysBetween", () => {
  it("counts whole days", () => {
    expect(daysBetween("2026-11-01", "2026-11-20")).toBe(19);
    expect(daysBetween("2026-10-31", "2026-11-01")).toBe(1);
    expect(daysBetween("2026-11-20", "2026-11-20")).toBe(0);
  });

  it("never goes negative and shrugs off bad dates", () => {
    expect(daysBetween("2026-11-21", "2026-11-20")).toBe(0);
    expect(daysBetween("not a date", "2026-11-20")).toBe(0);
  });

  it("is not thrown off by daylight saving", () => {
    expect(daysBetween("2026-03-01", "2026-03-31")).toBe(30);
  });
});

describe("todayIso", () => {
  it("formats as YYYY-MM-DD", () => {
    expect(todayIso(new Date("2026-11-20T23:30:00Z"))).toBe("2026-11-20");
  });
});
