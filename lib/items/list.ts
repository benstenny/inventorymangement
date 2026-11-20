import { daysBetween } from "@/lib/dates";
import type { Measurements } from "./measurements";
import type { Platform, Status } from "./options";
import { prepChecklist, type PrepStep } from "./prep";
import { isInStock, nextAction, type NextAction } from "./status";

/**
 * The inventory list: what each row shows, plus search and the filter chips.
 * Everything here is worked out on the server, then filtered in the browser so
 * search feels instant.
 */

/** The item columns the list reads. */
export type InventoryRow = {
  id: string;
  sku: string;
  title: string;
  brand: string | null;
  size: string | null;
  color: string | null;
  categoryName: string | null;
  skuPrefix: string | null;
  storageLocation: string | null;
  measurements: Measurements;
  washed: boolean;
  photoFrontPath: string | null;
  photoBackPath: string | null;
  photoStyledPath: string | null;
  sourceCost: number;
  status: Status;
  listedOn: Platform[];
  listPrice: number | null;
  listedDate: string | null;
  soldPrice: number | null;
};

export type ListItem = {
  id: string;
  sku: string;
  title: string;
  storageLocation: string | null;
  status: Status;
  photoUrl: string | null;
  cost: number;
  listPrice: number | null;
  soldPrice: number | null;
  listedOn: Platform[];
  prep: Record<PrepStep, boolean>;
  next: NextAction | null;
  /** Days since it was first listed, while it's still listed. */
  daysListed: number | null;
  /** Listed for `staleDays` or more without selling: time to lower the price. */
  stale: boolean;
  /** Lower-cased words to search in. */
  searchText: string;
};

/** The photo to show in the list: front first, then whatever she has. */
export function heroPhotoPath(row: Pick<InventoryRow, "photoFrontPath" | "photoBackPath" | "photoStyledPath">) {
  return row.photoFrontPath ?? row.photoStyledPath ?? row.photoBackPath;
}

export function toListItem(
  row: InventoryRow,
  ctx: { today: string; staleDays: number; photoUrl: string | null },
): ListItem {
  const prep = prepChecklist({
    washed: row.washed,
    skuPrefix: row.skuPrefix,
    measurements: row.measurements,
    photos: { front: row.photoFrontPath, back: row.photoBackPath, styled: row.photoStyledPath },
    status: row.status,
  });
  const daysListed =
    row.status === "LISTED" && row.listedDate ? daysBetween(row.listedDate, ctx.today) : null;

  return {
    id: row.id,
    sku: row.sku,
    title: row.title,
    storageLocation: row.storageLocation,
    status: row.status,
    photoUrl: ctx.photoUrl,
    cost: row.sourceCost,
    listPrice: row.listPrice,
    soldPrice: row.soldPrice,
    listedOn: row.listedOn,
    prep,
    next: nextAction({ status: row.status, listPrice: row.listPrice, prep }),
    daysListed,
    stale: daysListed !== null && daysListed >= ctx.staleDays,
    searchText: normalize(
      [row.title, row.brand, row.sku, row.size, row.color, row.categoryName, row.storageLocation]
        .filter(Boolean)
        .join(" "),
    ),
  };
}

/**
 * "All" is everything she still has to deal with: shipped (and returned) items drop out of it once
 * they're gone, and live under the "Shipped" filter instead.
 */
export const FILTERS = ["all", "needs-photos", "listed", "unsold", "shipped"] as const;
export type Filter = (typeof FILTERS)[number];

export function filterLabels(staleDays: number): Record<Filter, string> {
  return {
    all: "All",
    "needs-photos": "Needs photos",
    listed: "Listed",
    unsold: `Unsold ${staleDays}+ days`,
    shipped: "Shipped",
  };
}

/** Reads the `show` search param; anything unknown means "all". */
export function parseFilter(value: unknown): Filter {
  return (FILTERS as readonly unknown[]).includes(value) ? (value as Filter) : "all";
}

/** Gone for good: shipped, or handed over at a market (also SHIPPED), or returned. */
function isDone(status: ListItem["status"]): boolean {
  return status === "SHIPPED" || status === "RETURNED";
}

const MATCHES: Record<Filter, (item: ListItem) => boolean> = {
  all: (item) => !isDone(item.status),
  "needs-photos": (item) => isInStock(item.status) && !item.prep.photographed,
  listed: (item) => item.status === "LISTED",
  unsold: (item) => item.stale,
  shipped: (item) => isDone(item.status),
};

/** Lower case, no accents, single spaces: "  Levi’s Café " -> "levi's cafe". */
function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[‘’]/g, "'")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Every word she typed has to appear somewhere (title, brand, SKU, size, color, category, bin). */
export function matchesSearch(item: ListItem, query: string): boolean {
  const words = normalize(query).split(" ").filter(Boolean);
  return words.every((word) => item.searchText.includes(word));
}

export function filterItems(items: readonly ListItem[], filter: Filter, query: string): ListItem[] {
  return items.filter((item) => MATCHES[filter](item) && matchesSearch(item, query));
}

/** How many items each chip would show, for the current search. */
export function filterCounts(items: readonly ListItem[], query: string): Record<Filter, number> {
  const found = items.filter((item) => matchesSearch(item, query));
  return Object.fromEntries(FILTERS.map((f) => [f, found.filter(MATCHES[f]).length])) as Record<Filter, number>;
}

/**
 * The home list is grouped by what she has to do next, most urgent first:
 * sold items to pack (she ships within days), finds still being prepped, what's listed,
 * then what's already gone.
 */
export const SECTIONS = ["to-ship", "to-prep", "listed", "shipped"] as const;
export type Section = (typeof SECTIONS)[number];

export const SECTION_LABELS: Record<Section, string> = {
  "to-ship": "To ship",
  "to-prep": "To prep",
  listed: "Listed",
  shipped: "Shipped",
};

export function sectionOf(status: ListItem["status"]): Section {
  switch (status) {
    case "SOLD":
      return "to-ship";
    case "SOURCED":
    case "NEEDS_PHOTOS":
      return "to-prep";
    case "LISTED":
      return "listed";
    default:
      return "shipped";
  }
}

/** Items in section order, keeping their order within a section. Empty sections are left out. */
export function groupBySection(items: readonly ListItem[]): { section: Section; items: ListItem[] }[] {
  return SECTIONS.map((section) => ({ section, items: items.filter((item) => sectionOf(item.status) === section) })).filter(
    (group) => group.items.length > 0,
  );
}

/** "1 to ship · 3 to prep · 7 listed": the line under the title. Only parts with something in them. */
export function stockSummary(items: readonly ListItem[]): string {
  const count = (section: Section) => items.filter((item) => sectionOf(item.status) === section).length;
  return [
    [count("to-ship"), "to ship"],
    [count("to-prep"), "to prep"],
    [count("listed"), "listed"],
  ]
    .filter(([n]) => (n as number) > 0)
    .map(([n, label]) => `${n} ${label}`)
    .join(" · ");
}
