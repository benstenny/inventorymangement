import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { FeePresets } from "@/lib/pricing";
import { feesFromPresets, type ShopSettings } from "@/lib/settings";

/** The one settings row, as the Settings page edits it. */
export async function getShopSettings(): Promise<ShopSettings> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("settings")
    .select("min_price, haggle_room, stale_days, ship_within_days, inventory_budget, upkeep_budget, fee_presets, sources, storage_spots")
    .single<{
      min_price: number;
      haggle_room: number;
      stale_days: number;
      ship_within_days: number;
      inventory_budget: number;
      upkeep_budget: number;
      fee_presets: FeePresets | null;
      sources: string[] | null;
      storage_spots: string[] | null;
    }>();
  if (error) throw new Error(`Couldn't load settings: ${error.message}`);
  return {
    minPrice: data.min_price,
    haggleRoom: data.haggle_room,
    staleDays: data.stale_days,
    shipWithinDays: data.ship_within_days,
    inventoryBudget: data.inventory_budget,
    upkeepBudget: data.upkeep_budget,
    fees: feesFromPresets(data.fee_presets ?? {}),
    sources: data.sources ?? [],
    storageSpots: data.storage_spots ?? [],
  };
}

export async function saveShopSettings(s: ShopSettings): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("settings")
    .update({
      min_price: s.minPrice,
      haggle_room: s.haggleRoom,
      stale_days: s.staleDays,
      ship_within_days: s.shipWithinDays,
      inventory_budget: s.inventoryBudget,
      upkeep_budget: s.upkeepBudget,
      fee_presets: s.fees,
      sources: s.sources,
      storage_spots: s.storageSpots,
    })
    .eq("id", true);
  if (error) throw new Error(`Couldn't save settings: ${error.message}`);
}
