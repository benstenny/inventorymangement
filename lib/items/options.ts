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

/** Where an item is up for sale. */
export const LISTED_ON = ["DEPOP", "FLEA_MARKET", "BOTH"] as const;
export type ListedOn = (typeof LISTED_ON)[number];

export const LISTED_ON_LABELS: Record<ListedOn, string> = {
  DEPOP: "Depop",
  FLEA_MARKET: "Flea market",
  BOTH: "Both",
};

/** Where an item actually sold. */
export const SALE_PLATFORMS = ["DEPOP", "FLEA_MARKET"] as const;
export type SalePlatform = (typeof SALE_PLATFORMS)[number];

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
