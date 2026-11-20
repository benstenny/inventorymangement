import "server-only";
import { createClient } from "@/lib/supabase/server";
import { FORM_STATUSES, type ListedOn, type Status } from "./options";
import type { ItemFormValues } from "./schema";

/**
 * All item reads and writes go through here. Runs on the server with the
 * logged-in user's session, so Row Level Security still applies.
 */

export const PHOTO_BUCKET = "item-photos";
const SIGNED_URL_SECONDS = 60 * 60;

export type Category = { id: string; name: string };

export type LastUsed = { source?: string; storageLocation?: string; platform?: ListedOn };

export type ItemRow = {
  id: string;
  sku: string;
  category_id: string;
  title: string;
  brand: string | null;
  size: string | null;
  color: string | null;
  condition: string | null;
  description: string | null;
  photo_path: string | null;
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

export async function getCategories(): Promise<Category[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, name")
    .is("archived_at", null)
    .order("sort_order")
    .order("name");
  if (error) throw new Error(`Couldn't load categories: ${error.message}`);
  return data;
}

export async function getLastUsed(): Promise<LastUsed> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("settings").select("last_used").single();
  if (error) throw new Error(`Couldn't load settings: ${error.message}`);
  return (data.last_used ?? {}) as LastUsed;
}

/** Returns the item and a short-lived link to its photo, or null if it doesn't exist. */
export async function getItem(id: string): Promise<{ item: ItemRow; photoUrl: string | null } | null> {
  const supabase = await createClient();
  const { data: item, error } = await supabase.from("items").select("*").eq("id", id).maybeSingle<ItemRow>();
  if (error) throw new Error(`Couldn't load the item: ${error.message}`);
  if (!item) return null;
  return { item, photoUrl: await signedPhotoUrl(item.photo_path) };
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
    description: values.description,
    source: values.source,
    acquired_date: values.acquiredDate,
    status: values.status,
    listed_on: values.listedOn,
    list_price: values.listPrice,
    photo_path: values.photoPath,
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
    .select("photo_path, listed_date, status")
    .eq("id", id)
    .single<Pick<ItemRow, "photo_path" | "listed_date" | "status">>();
  if (readError) throw new Error(`Couldn't find the item: ${readError.message}`);

  // The edit form can't change a sold, shipped or returned item's status.
  const statusLocked = !(FORM_STATUSES as readonly Status[]).includes(before.status);

  const { error } = await supabase
    .from("items")
    .update({
      ...toColumns(values),
      status: statusLocked ? before.status : values.status,
      // First time it's listed: stamp the date. Keep the original date after that.
      listed_date: values.listedOn ? (before.listed_date ?? today()) : before.listed_date,
    })
    .eq("id", id);
  if (error) throw new Error(`Couldn't save the item: ${error.message}`);

  // The old photo was replaced or removed: tidy it up (best effort).
  if (before.photo_path && before.photo_path !== values.photoPath) {
    await supabase.storage.from(PHOTO_BUCKET).remove([before.photo_path]);
  }

  await rememberLastUsed(values);
}

export async function archiveItem(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("items").update({ archived_at: new Date().toISOString() }).eq("id", id);
  if (error) throw new Error(`Couldn't archive the item: ${error.message}`);
}

/** Saves source, storage spot and platform so the next form starts with them. */
async function rememberLastUsed(values: ItemFormValues) {
  const next: LastUsed = {
    ...(await getLastUsed()),
    ...(values.source ? { source: values.source } : {}),
    ...(values.storageLocation ? { storageLocation: values.storageLocation } : {}),
    ...(values.listedOn ? { platform: values.listedOn } : {}),
  };
  const supabase = await createClient();
  // Single-row table: the primary key is always true.
  await supabase.from("settings").update({ last_used: next }).eq("id", true);
}
