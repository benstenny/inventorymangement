/** Fixed choices for item fields, with the plain-language labels shown in the app. */

export const STATUSES = ["SOURCED", "NEEDS_PHOTOS", "LISTED", "SOLD", "SHIPPED", "RETURNED"] as const;
export type Status = (typeof STATUSES)[number];

export const STATUS_LABELS: Record<Status, string> = {
  SOURCED: "Sourced",
  NEEDS_PHOTOS: "Needs photos",
  LISTED: "Listed",
  SOLD: "Sold",
  SHIPPED: "Shipped",
  RETURNED: "Returned",
};

/** Statuses she can pick in the add/edit form. Sold and shipped come from "Mark as sold" (Phase 4). */
export const FORM_STATUSES = ["SOURCED", "NEEDS_PHOTOS", "LISTED"] as const satisfies readonly Status[];

/**
 * Places she sells. An item can be listed on any of them at once (`listedOn`
 * is a list) and sells on exactly one (`soldPlatform`).
 */
export const PLATFORMS = ["DEPOP", "INSTAGRAM", "FLEA_MARKET"] as const;
export type Platform = (typeof PLATFORMS)[number];

export const PLATFORM_LABELS: Record<Platform, string> = {
  DEPOP: "Depop",
  INSTAGRAM: "Instagram",
  FLEA_MARKET: "Flea market",
};

/** Puts platforms in the usual order and drops repeats. */
export function sortPlatforms(platforms: readonly Platform[]): Platform[] {
  return PLATFORMS.filter((p) => platforms.includes(p));
}

export const PAYMENT_METHODS = ["DEPOP", "VENMO", "ZELLE", "CASH"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  DEPOP: "Depop",
  VENMO: "Venmo",
  ZELLE: "Zelle",
  CASH: "Cash",
};

export const CONDITIONS = ["New with tags", "Like new", "Excellent", "Good", "Fair"] as const;
export type Condition = (typeof CONDITIONS)[number];

/** The three photos she takes of each item, in the order she takes them. */
export const PHOTO_SLOTS = ["front", "back", "styled"] as const;
export type PhotoSlot = (typeof PHOTO_SLOTS)[number];

export const PHOTO_SLOT_LABELS: Record<PhotoSlot, string> = {
  front: "Front",
  back: "Back",
  styled: "Styled",
};

export const EXPENSE_KINDS = ["SUPPLIES", "UPKEEP", "OTHER"] as const;
export type ExpenseKind = (typeof EXPENSE_KINDS)[number];

/** Supplies: mailers, tape, tissue. Upkeep: laundromat, steamer, repairs. Other: anything else. */
export const EXPENSE_KIND_LABELS: Record<ExpenseKind, string> = {
  SUPPLIES: "Supplies",
  UPKEEP: "Upkeep",
  OTHER: "Other",
};
