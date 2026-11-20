import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { BACKGROUNDS, backgroundBootScript, backgroundUrls, parseBackground } from "./backgrounds";

describe("parseBackground", () => {
  it("accepts known ids", () => {
    expect(parseBackground("rainbow")).toBe("rainbow");
    expect(parseBackground("candy-hearts")).toBe("candy-hearts");
  });

  it("treats anything else as the plain page", () => {
    expect(parseBackground(null)).toBeNull();
    expect(parseBackground("")).toBeNull();
    expect(parseBackground("nope")).toBeNull();
    expect(parseBackground("rainbow);background:red")).toBeNull();
    expect(parseBackground(3)).toBeNull();
  });
});

describe("background files", () => {
  it("has a light and a dark picture for every choice", () => {
    for (const { id } of BACKGROUNDS) {
      const urls = backgroundUrls(id);
      expect(existsSync(`public${urls.light}`), urls.light).toBe(true);
      expect(existsSync(`public${urls.dark}`), urls.dark).toBe(true);
    }
  });
});

describe("backgroundBootScript", () => {
  function run(saved: string | null) {
    const props: Record<string, string> = {};
    const root = { dataset: {} as Record<string, string>, style: { setProperty: (k: string, v: string) => (props[k] = v) } };
    const localStorage = { getItem: () => saved };
    const document = { getElementById: (id: string) => (id === "app-backdrop" ? root : null) };
    new Function("localStorage", "document", backgroundBootScript)(localStorage, document);
    return { bg: root.dataset.bg, props };
  }

  it("applies a saved background before paint", () => {
    expect(run("twinkle")).toEqual({
      bg: "twinkle",
      props: {
        "--bg-image-light": "url(/backgrounds/twinkle-light.webp)",
        "--bg-image-dark": "url(/backgrounds/twinkle-dark.webp)",
      },
    });
  });

  it("ignores missing or unknown values", () => {
    expect(run(null)).toEqual({ bg: undefined, props: {} });
    expect(run("evil)")).toEqual({ bg: undefined, props: {} });
  });
});
