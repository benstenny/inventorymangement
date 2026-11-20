import { describe, expect, it } from "vitest";
import {
  filterCounts,
  filterItems,
  groupBySection,
  heroPhotoPath,
  parseFilter,
  sectionOf,
  stockSummary,
  toListItem,
  type InventoryRow,
} from "./list";

const base: InventoryRow = {
  id: "1",
  sku: "BTM-0006",
  title: "Levi’s 501 straight jeans",
  brand: "Levi's",
  size: "W28 L30",
  color: "Light wash",
  categoryName: "Bottoms",
  skuPrefix: "BTM",
  storageLocation: "Bottoms bin",
  measurements: {},
  washed: false,
  photoFrontPath: null,
  photoBackPath: null,
  photoStyledPath: null,
  sourceCost: 699,
  status: "SOURCED",
  listedOn: [],
  listPrice: null,
  listedDate: null,
  soldPrice: null,
};

const photos = { photoFrontPath: "a.webp", photoBackPath: "b.webp", photoStyledPath: "c.webp" };
const ctx = { today: "2026-11-20", staleDays: 30, photoUrl: null };
const make = (over: Partial<InventoryRow>) => toListItem({ ...base, ...over }, ctx);

const fresh = make({ id: "fresh" });
const listedLong = make({
  id: "old",
  sku: "ACC-0019",
  title: "Silk paisley scarf",
  brand: null,
  categoryName: "Accessories",
  storageLocation: "Tops bin",
  ...photos,
  status: "LISTED",
  listedOn: ["DEPOP"],
  listPrice: 1800,
  listedDate: "2026-10-20",
});
const listedNew = make({ id: "new", ...photos, status: "LISTED", listPrice: 4200, listedDate: "2026-11-10" });
const sold = make({ id: "sold", status: "SOLD", listedDate: "2026-09-01", soldPrice: 4000 });
const shipped = make({ id: "shipped", title: "Harley tee", status: "SHIPPED", soldPrice: 5000 });
const all = [fresh, listedLong, listedNew, sold];
const ids = (items: { id: string }[]) => items.map((i) => i.id);

describe("toListItem", () => {
  it("counts days listed and flags it once it hits the stale limit", () => {
    expect(listedLong.daysListed).toBe(31);
    expect(listedLong.stale).toBe(true);
    expect(listedNew.daysListed).toBe(10);
    expect(listedNew.stale).toBe(false);
    expect(make({ status: "LISTED", listedDate: "2026-10-21" }).stale).toBe(true); // exactly 30 days
  });

  it("never calls a sold item stale", () => {
    expect(sold.daysListed).toBeNull();
    expect(sold.stale).toBe(false);
  });

  it("works out the prep ticks and next step", () => {
    expect(fresh.prep.washed).toBe(false);
    expect(fresh.next?.label).toBe("Mark washed");
    expect(sold.next).toEqual({ kind: "pack", label: "Pack it" });
  });
});

describe("heroPhotoPath", () => {
  it("prefers the front photo, then styled, then back", () => {
    expect(heroPhotoPath(photos)).toBe("a.webp");
    expect(heroPhotoPath({ ...photos, photoFrontPath: null })).toBe("c.webp");
    expect(heroPhotoPath({ photoFrontPath: null, photoStyledPath: null, photoBackPath: "b.webp" })).toBe("b.webp");
  });
});

describe("filterItems", () => {
  it("shows everything still in play under all", () => {
    expect(ids(filterItems(all, "all", ""))).toEqual(["fresh", "old", "new", "sold"]);
  });

  it("hides shipped items from all, and shows only them under shipped", () => {
    const withShipped = [...all, shipped];
    expect(ids(filterItems(withShipped, "all", ""))).not.toContain("shipped");
    expect(ids(filterItems(withShipped, "shipped", ""))).toEqual(["shipped"]);
    expect(ids(filterItems(withShipped, "shipped", "harley"))).toEqual(["shipped"]);
  });

  it("needs photos: unsold items missing any of the three photos", () => {
    expect(ids(filterItems(all, "needs-photos", ""))).toEqual(["fresh"]);
  });

  it("listed and unsold 30+ days", () => {
    expect(ids(filterItems(all, "listed", ""))).toEqual(["old", "new"]);
    expect(ids(filterItems(all, "unsold", ""))).toEqual(["old"]);
  });

  it("searches title, brand, SKU, size, color, category and bin, ignoring case and curly quotes", () => {
    expect(ids(filterItems(all, "all", "levi's"))).toEqual(["fresh", "new", "sold"]);
    expect(ids(filterItems(all, "all", "btm-0006")).length).toBe(3);
    expect(ids(filterItems(all, "all", "accessories"))).toEqual(["old"]);
    expect(ids(filterItems(all, "all", "  tops   BIN "))).toEqual(["old"]);
  });

  it("needs every word to match", () => {
    expect(ids(filterItems(all, "all", "silk tops"))).toEqual(["old"]);
    expect(ids(filterItems(all, "all", "silk jeans"))).toEqual([]);
  });

  it("combines search with the filter", () => {
    expect(ids(filterItems(all, "listed", "levi"))).toEqual(["new"]);
  });
});

describe("filterCounts", () => {
  it("counts each chip for the current search", () => {
    expect(filterCounts([...all, shipped], "")).toEqual({ all: 4, "needs-photos": 1, listed: 2, unsold: 1, shipped: 1 });
    expect(filterCounts(all, "scarf")).toEqual({ all: 1, "needs-photos": 0, listed: 1, unsold: 1, shipped: 0 });
  });
});

describe("parseFilter", () => {
  it("falls back to all for anything unknown", () => {
    expect(parseFilter("listed")).toBe("listed");
    expect(parseFilter("nope")).toBe("all");
    expect(parseFilter(undefined)).toBe("all");
    expect(parseFilter(["listed"])).toBe("all");
  });
});

describe("sections", () => {
  it("files each status under what she has to do next", () => {
    expect(sectionOf("SOLD")).toBe("to-ship");
    expect(sectionOf("SOURCED")).toBe("to-prep");
    expect(sectionOf("NEEDS_PHOTOS")).toBe("to-prep");
    expect(sectionOf("LISTED")).toBe("listed");
    expect(sectionOf("SHIPPED")).toBe("shipped");
    expect(sectionOf("RETURNED")).toBe("shipped");
  });

  it("puts sold items first, keeps order inside a section and drops empty sections", () => {
    const groups = groupBySection(all);
    expect(groups.map((g) => g.section)).toEqual(["to-ship", "to-prep", "listed"]);
    expect(groups.map((g) => ids(g.items))).toEqual([["sold"], ["fresh"], ["old", "new"]]);
  });

  it("sums it up in one line, skipping empty parts", () => {
    expect(stockSummary(all)).toBe("1 to ship · 1 to prep · 2 listed");
    expect(stockSummary([listedNew])).toBe("1 listed");
    expect(stockSummary([])).toBe("");
  });
});
