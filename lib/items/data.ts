import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { FeePresets, PricingSettings } from "@/lib/pricing";
import type { Measurements } from "./measurements";
import { FORM_STATUSES, PHOTO_SLOTS, type ListedOn, type PhotoSlot, type Status } from "./options";
import type { ItemFormValues } from "./schema";

/**
 * All item reads and writes go through here. Runs on the server with the
 * logged-in user's session, so Row Level Security still applies.
 */

export const PHOTO_BUCKET = "item-photos";
const SIGNED_URL_SECONDS = 60 * 60;

export type Category = { id: string; name: string; skuPrefix: string };

export type LastUsed = { source?: string; storageLocation?: string; platform?: ListedOn };

/** Everything the add/edit form needs from the settings row. */
export type FormSettings = {
  lastUsed: LastUsed;
  sources: string[];
  storageSpots: string[];
  pricing: PricingSettings;
  feePresets: FeePresets;
};

export type ItemRow = {
  id: string;
  sku: string;
  category_id: string;
  title: string;
  brand: string | null;
  size: string | null;
  color: string | null;
  condition: string | null;
  flaws: string | null;
  description: string | null;
  measurements: Measurements;
  washed: boolean;
  photo_front_path: string | null;
  photo_back_path: string | null;
  photo_styled_path: string | null;
  source: string | null;
  source_cost: number;
  acquired_date: string;
  storage_location: string | null;
  status: Status;
  listed_on: ListedOn | null;
  list_price: number | null;
  listed_date: string | null;
  archived_at: string | null;
};

export const PHOTO_COLUMN = {
  front: "photo_front_path",
  back: "photo_back_path",
  styled: "photo_styled_path",
} as const satisfies Record<PhotoSlot, keyof ItemRow>;

type PhotoColumn = (typeof PHOTO_COLUMN)[PhotoSlot];

export type PhotoUrls = Record<PhotoSlot, string | null>;

export async function getCategories(): Promise<Category[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, sku_prefix")
    .is("archived_at", null)
    .order("sort_order")
    .order("name");
  if (error) throw new Error(`Couldn't load categories: ${error.message}`);
  return data.map((c) => ({ id: c.id, name: c.name, skuPrefix: c.sku_prefix }));
}

export async function getFormSettings(): Promise<FormSettings> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("settings")
    .select("last_used, sources, storage_spots, min_price, haggle_room, fee_presets")
    .single();
  if (error) throw new Error(`Couldn't load settings: ${error.message}`);
  return {
    lastUsed: (data.last_used ?? {}) as LastUsed,
    sources: data.sources ?? [],
    storageSpots: data.storage_spots ?? [],
    pricing: { minPrice: data.min_price, haggleRoom: data.haggle_room },
    feePresets: (data.fee_presets ?? {}) as FeePresets,
  };
}

/** Returns the item and short-lived links to its photos, or null if it doesn't exist. */
export async function getItem(id: string): Promise<{ item: ItemRow; photoUrls: PhotoUrls } | null> {
  const supabase = await createClient();
  const { data: item, error } = await supabase.from("items").select("*").eq("id", id).maybeSingle<ItemRow>();
  if (error) throw new Error(`Couldn't load the item: ${error.message}`);
  if (!item) return null;

  const urls = await Promise.all(PHOTO_SLOTS.map((slot) => signedPhotoUrl(item[PHOTO_COLUMN[slot]])));
  const photoUrls = Object.fromEntries(PHOTO_SLOTS.map((slot, i) => [slot, urls[i]])) as PhotoUrls;
  return { item, photoUrls };
}

export async function signedPhotoUrl(path: string | null): Promise<string | null> {
  if (!path) return null;
  const supabase = await createClient();
  const { data } = await supabase.storage.from(PHOTO_BUCKET).createSignedUrl(path, SIGNED_URL_SECONDS);
  return data?.signedUrl ?? null;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function toColumns(values: ItemFormValues) {
  return {
    title: values.title,
    category_id: values.categoryId,
    source_cost: values.sourceCost,
    storage_location: values.storageLocation,
    brand: values.brand,
    size: values.size,
    color: values.color,
    condition: values.condition,
    flaws: values.flaws,
    description: values.description,
    measurements: values.measurements,
    washed: values.washed,
    source: values.source,
    acquired_date: values.acquiredDate,
    status: values.status,
    listed_on: values.listedOn,
    list_price: values.listPrice,
    photo_front_path: values.photoFrontPath,
    photo_back_path: values.photoBackPath,
    photo_styled_path: values.photoStyledPath,
  };
}

export async function createItem(values: ItemFormValues): Promise<{ id: string; sku: string }> {
  const supabase = await createClient();

  const { data: sku, error: skuError } = await supabase.rpc("next_sku", { p_category_id: values.categoryId });
  if (skuError || typeof sku !== "string") throw new Error(`Couldn't create a SKU: ${skuError?.message}`);

  const { data, error } = await supabase
    .from("items")
    .insert({ ...toColumns(values), sku, listed_date: values.listedOn ? today() : null })
    .select("id, sku")
    .single();
  if (error) throw new Error(`Couldn't save the item: ${error.message}`);

  await rememberLastUsed(values);
  return data;
}

export async function updateItem(id: string, values: ItemFormValues): Promise<void> {
  const supabase = await createClient();

  const { data: before, error: readError } = await supabase
    .from("items")
    .select("photo_front_path, photo_back_path, photo_styled_path, listed_date, status")
    .eq("id", id)
    .single<Pick<ItemRow, PhotoColumn | "listed_date" | "status">>();
  if (readError) throw new Error(`Couldn't find the item: ${readError.message}`);

  // The edit form can't change a sold, shipped or returned item's status.
  const statusLocked = !(FORM_STATUSES as readonly Status[]).includes(before.status);
  const columns = toColumns(values);

  const { error } = await supabase
    .from("items")
    .update({
      ...columns,
      status: statusLocked ? before.status : values.status,
      // First time it's listed: stamp the date. Keep the original date after that.
      listed_date: values.listedOn ? (before.listed_date ?? today()) : before.listed_date,
    })
    .eq("id", id);
  if (error) throw new Error(`Couldn't save the item: ${error.message}`);

  // Photos that were replaced or removed: tidy them up (best effort).
  const kept = new Set(PHOTO_SLOTS.map((slot) => columns[PHOTO_COLUMN[slot]]));
  const orphans = PHOTO_SLOTS.map((slot) => before[PHOTO_COLUMN[slot]]).filter(
    (path): path is string => !!path && !kept.has(path),
  );
  if (orphans.length) await supabase.storage.from(PHOTO_BUCKET).remove(orphans);

  await rememberLastUsed(values);
}

export async function archiveItem(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("items").update({ archived_at: new Date().toISOString() }).eq("id", id);
  if (error) throw new Error(`Couldn't archive the item: ${error.message}`);
}

/** Saves source, storage spot and platform so the next form starts with them. */
async function rememberLastUsed(values: ItemFormValues) {
  const supabase = await createClient();
  const { data } = await supabase.from("settings").select("last_used").single();
  const next: LastUsed = {
    ...((data?.last_used ?? {}) as LastUsed),
    ...(values.source ? { source: values.source } : {}),
    ...(values.storageLocation ? { storageLocation: values.storageLocation } : {}),
    ...(values.listedOn ? { platform: values.listedOn } : {}),
  };
  // Single-row table: the primary key is always true.
  await supabase.from("settings").update({ last_used: next }).eq("id", true);
}
