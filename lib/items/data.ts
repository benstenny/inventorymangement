import "server-only";
import { createClient } from "@/lib/supabase/server";
import { todayIso } from "@/lib/dates";
import type { FeePresets, PricingSettings } from "@/lib/pricing";
import { heroPhotoPath, toListItem, type InventoryRow, type ListItem } from "./list";
import type { Measurements } from "./measurements";
import { quickStepPatch, type QuickStep, type QuickStepResult } from "./status";
import { FORM_STATUSES, PHOTO_SLOTS, type PhotoSlot, type Platform, type Status } from "./options";
import type { ItemFormValues } from "./schema";
import { salePatch, type SalePatch, type SaleValues } from "./sale";

/**
 * All item reads and writes go through here. Runs on the server with the
 * logged-in user's session, so Row Level Security still applies.
 */

export const PHOTO_BUCKET = "item-photos";
const SIGNED_URL_SECONDS = 60 * 60;

export type Category = { id: string; name: string; skuPrefix: string };

export type LastUsed = { source?: string; storageLocation?: string; platforms?: Platform[] };

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
  /** Empty when it isn't listed anywhere yet. */
  listed_on: Platform[];
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

type InventoryQueryRow = Pick<
  ItemRow,
  | "id"
  | "sku"
  | "title"
  | "brand"
  | "size"
  | "color"
  | "storage_location"
  | "measurements"
  | "washed"
  | "photo_front_path"
  | "photo_back_path"
  | "photo_styled_path"
  | "source_cost"
  | "status"
  | "listed_on"
  | "list_price"
  | "listed_date"
> & {
  sold_price: number | null;
  categories: { name: string; sku_prefix: string } | null;
};

/** Every item that isn't archived, newest first, ready for the inventory list. */
export async function getInventory(): Promise<{ items: ListItem[]; staleDays: number }> {
  const supabase = await createClient();
  const [itemsResult, settingsResult] = await Promise.all([
    supabase
      .from("items")
      .select(
        "id, sku, title, brand, size, color, storage_location, measurements, washed, photo_front_path, photo_back_path, photo_styled_path, source_cost, status, listed_on, list_price, listed_date, sold_price, categories ( name, sku_prefix )",
      )
      .is("archived_at", null)
      .order("created_at", { ascending: false })
      .returns<InventoryQueryRow[]>(),
    supabase.from("settings").select("stale_days").single(),
  ]);
  if (itemsResult.error) throw new Error(`Couldn't load your items: ${itemsResult.error.message}`);
  if (settingsResult.error) throw new Error(`Couldn't load settings: ${settingsResult.error.message}`);

  const rows: InventoryRow[] = itemsResult.data.map((r) => ({
    id: r.id,
    sku: r.sku,
    title: r.title,
    brand: r.brand,
    size: r.size,
    color: r.color,
    categoryName: r.categories?.name ?? null,
    skuPrefix: r.categories?.sku_prefix ?? null,
    storageLocation: r.storage_location,
    measurements: r.measurements,
    washed: r.washed,
    photoFrontPath: r.photo_front_path,
    photoBackPath: r.photo_back_path,
    photoStyledPath: r.photo_styled_path,
    sourceCost: r.source_cost,
    status: r.status,
    listedOn: r.listed_on ?? [],
    listPrice: r.list_price,
    listedDate: r.listed_date,
    soldPrice: r.sold_price,
  }));

  const urls = await signedPhotoUrls(rows.map(heroPhotoPath));
  const staleDays = settingsResult.data.stale_days;
  const ctx = { today: today(), staleDays };
  return { items: rows.map((row, i) => toListItem(row, { ...ctx, photoUrl: urls[i] })), staleDays };
}

/** Signs many photo paths in one request. Same order as `paths`; null where there's no photo. */
async function signedPhotoUrls(paths: (string | null)[]): Promise<(string | null)[]> {
  const wanted = [...new Set(paths.filter((p): p is string => !!p))];
  if (!wanted.length) return paths.map(() => null);
  const supabase = await createClient();
  const { data } = await supabase.storage.from(PHOTO_BUCKET).createSignedUrls(wanted, SIGNED_URL_SECONDS);
  const byPath = new Map((data ?? []).map((d) => [d.path, d.signedUrl]));
  return paths.map((p) => (p ? (byPath.get(p) ?? null) : null));
}

/** The one-tap "Mark washed" / "Mark listed" from the inventory list. */
export async function applyQuickStep(id: string, step: QuickStep): Promise<QuickStepResult> {
  const supabase = await createClient();
  const [itemResult, settingsResult] = await Promise.all([
    supabase
      .from("items")
      .select("status, washed, listed_on, listed_date, list_price")
      .eq("id", id)
      .single<Pick<ItemRow, "status" | "washed" | "listed_on" | "listed_date" | "list_price">>(),
    supabase.from("settings").select("last_used").single(),
  ]);
  if (itemResult.error) throw new Error(`Couldn't find the item: ${itemResult.error.message}`);
  const item = itemResult.data;

  const result = quickStepPatch(
    step,
    {
      status: item.status,
      washed: item.washed,
      listedOn: item.listed_on ?? [],
      listedDate: item.listed_date,
      listPrice: item.list_price,
    },
    { today: today(), lastPlatforms: (settingsResult.data?.last_used as LastUsed | undefined)?.platforms },
  );
  if (!result.ok) return result;

  const { patch } = result;
  const { error } = await supabase
    .from("items")
    .update({
      status: patch.status,
      ...(patch.washed !== undefined ? { washed: patch.washed } : {}),
      ...(patch.listedOn ? { listed_on: patch.listedOn } : {}),
      ...(patch.listedDate ? { listed_date: patch.listedDate } : {}),
    })
    .eq("id", id)
    // Only if nothing else changed its status in the meantime.
    .eq("status", item.status);
  if (error) throw new Error(`Couldn't update the item: ${error.message}`);
  return result;
}

function today() {
  return todayIso();
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
    .insert({ ...toColumns(values), sku, listed_date: values.listedOn.length ? today() : null })
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
      listed_date: values.listedOn.length ? (before.listed_date ?? today()) : before.listed_date,
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

/** Saves source, storage spot and platforms so the next form starts with them. */
async function rememberLastUsed(values: ItemFormValues) {
  const supabase = await createClient();
  const { data } = await supabase.from("settings").select("last_used").single();
  const next: LastUsed = {
    ...((data?.last_used ?? {}) as LastUsed),
    ...(values.source ? { source: values.source } : {}),
    ...(values.storageLocation ? { storageLocation: values.storageLocation } : {}),
    ...(values.listedOn.length ? { platforms: values.listedOn } : {}),
  };
  // Single-row table: the primary key is always true.
  await supabase.from("settings").update({ last_used: next }).eq("id", true);
}

/** Everything the "Mark as sold" screen needs: the item, its front photo and the fee presets. */
export async function getSaleItem(id: string): Promise<{
  item: Pick<ItemRow, "id" | "sku" | "title" | "status" | "source_cost" | "list_price" | "listed_on">;
  photoUrl: string | null;
  feePresets: FeePresets;
} | null> {
  const supabase = await createClient();
  const [itemResult, settingsResult] = await Promise.all([
    supabase
      .from("items")
      .select("id, sku, title, status, source_cost, list_price, listed_on, photo_front_path, photo_styled_path, photo_back_path")
      .eq("id", id)
      .is("archived_at", null)
      .maybeSingle<
        Pick<ItemRow, "id" | "sku" | "title" | "status" | "source_cost" | "list_price" | "listed_on"> & {
          photo_front_path: string | null;
          photo_styled_path: string | null;
          photo_back_path: string | null;
        }
      >(),
    supabase.from("settings").select("fee_presets").single(),
  ]);
  if (itemResult.error) throw new Error(`Couldn't load the item: ${itemResult.error.message}`);
  if (!itemResult.data) return null;
  const { photo_front_path, photo_styled_path, photo_back_path, ...item } = itemResult.data;
  const photoUrl = await signedPhotoUrl(photo_front_path ?? photo_styled_path ?? photo_back_path);
  return { item, photoUrl, feePresets: (settingsResult.data?.fee_presets ?? {}) as FeePresets };
}

/** Records a sale. Re-checks on the server that it's still unsold, so it can't be sold twice. */
export async function markSold(id: string, sale: SaleValues): Promise<{ ok: true; patch: SalePatch } | { ok: false; message: string }> {
  const supabase = await createClient();
  const { data: item, error: loadError } = await supabase
    .from("items")
    .select("status")
    .eq("id", id)
    .is("archived_at", null)
    .maybeSingle<Pick<ItemRow, "status">>();
  if (loadError) throw new Error(`Couldn't load the item: ${loadError.message}`);
  if (!item) return { ok: false, message: "Couldn't find this item. It may have been removed." };

  const result = salePatch(item, sale);
  if (!result.ok) return result;
  const { patch } = result;

  const { data: updated, error } = await supabase
    .from("items")
    .update({
      status: patch.status,
      sold_platform: patch.soldPlatform,
      sold_price: patch.soldPrice,
      sold_date: patch.soldDate,
      platform_fees: patch.platformFees,
      shipping_cost: patch.shippingCost,
      payment_method: patch.paymentMethod,
      buyer_notes: patch.buyerNotes,
      shipped_date: patch.shippedDate,
    })
    .eq("id", id)
    // Only if nothing else changed its status in the meantime.
    .eq("status", item.status)
    .select("id");
  if (error) throw new Error(`Couldn't save the sale: ${error.message}`);
  if (!updated?.length) return { ok: false, message: "This one's already sold." };
  return result;
}

/** What she paid for an item, for the profit shown after a sale. */
export async function getItemCost(id: string): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("items").select("source_cost").eq("id", id).single<{ source_cost: number }>();
  if (error) throw new Error(`Couldn't load the item: ${error.message}`);
  return data.source_cost;
}
