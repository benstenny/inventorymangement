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

export const LISTED_ON = ["DEPOP", "INSTAGRAM", "BOTH"] as const;
export type ListedOn = (typeof LISTED_ON)[number];

export const LISTED_ON_LABELS: Record<ListedOn, string> = {
  DEPOP: "Depop",
  INSTAGRAM: "Instagram",
  BOTH: "Both",
};

export const CONDITIONS = ["New with tags", "Like new", "Excellent", "Good", "Fair"] as const;
export type Condition = (typeof CONDITIONS)[number];
