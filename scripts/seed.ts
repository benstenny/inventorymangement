/**
 * Adds ~20 realistic sample items so there's something to look at.
 *
 *   npm run seed            # only if the items table is empty
 *   npm run seed -- --force # add them anyway
 *
 * Uses SUPABASE_SECRET_KEY from .env.local (bypasses RLS). Never ship this key to the browser.
 * Runs directly on Node 24+ (built-in TypeScript support), no build step.
 */
import { createClient } from "@supabase/supabase-js";

type Status = "SOURCED" | "NEEDS_PHOTOS" | "LISTED" | "SOLD" | "SHIPPED" | "RETURNED";
type Platform = "DEPOP" | "FLEA_MARKET";

type SampleItem = {
  category: string;
  title: string;
  brand?: string;
  size?: string;
  color?: string;
  condition: string;
  description?: string;
  source: string;
  cost: number; // cents
  acquiredDaysAgo: number;
  storage: string;
  status: Status;
  listedOn?: "DEPOP" | "FLEA_MARKET" | "BOTH";
  listPrice?: number; // cents
  listedDaysAgo?: number;
  sale?: { platform: Platform; price: number; daysAgo: number; shipping: number; notes?: string };
};

const items: SampleItem[] = [
  { category: "Tops", title: "Vintage Levi's red tab tee", brand: "Levi's", size: "M", color: "White", condition: "Good", description: "Single stitch, light fade at collar.", source: "Goodwill", cost: 399, acquiredDaysAgo: 40, storage: "Tops bin", status: "LISTED", listedOn: "BOTH", listPrice: 2800, listedDaysAgo: 33 },
  { category: "Tops", title: "Striped Breton long sleeve", brand: "Saint James", size: "S", color: "Navy/White", condition: "Excellent", source: "OC Rag House", cost: 500, acquiredDaysAgo: 25, storage: "Tops bin", status: "SOLD", listedOn: "DEPOP", listPrice: 4500, listedDaysAgo: 20, sale: { platform: "DEPOP", price: 4000, daysAgo: 2, shipping: 450 } },
  { category: "Tops", title: "Cropped cable knit sweater", brand: "Urban Outfitters", size: "S", color: "Cream", condition: "Good", description: "Small pill on left sleeve.", source: "Thrift Vintage Fashion", cost: 699, acquiredDaysAgo: 12, storage: "Tops bin", status: "NEEDS_PHOTOS" },
  { category: "Tops", title: "Harley-Davidson 90s graphic tee", brand: "Harley-Davidson", size: "L", color: "Black", condition: "Fair", description: "Cracked print, small hole near hem. Priced for flaws.", source: "Thrift Vintage Fashion", cost: 800, acquiredDaysAgo: 60, storage: "Tops bin", status: "SHIPPED", listedOn: "FLEA_MARKET", listPrice: 5500, listedDaysAgo: 50, sale: { platform: "FLEA_MARKET", price: 5000, daysAgo: 9, shipping: 600, notes: "Paid cash at the Sunday market" } },
  { category: "Tops", title: "Silk button-up blouse", brand: "Equipment", size: "XS", color: "Emerald", condition: "Excellent", source: "Goodwill", cost: 599, acquiredDaysAgo: 3, storage: "Tops bin", status: "SOURCED" },
  { category: "Bottoms", title: "Levi's 501 straight jeans", brand: "Levi's", size: "W28 L30", color: "Light wash", condition: "Good", source: "Goodwill", cost: 699, acquiredDaysAgo: 30, storage: "Bottoms bin", status: "LISTED", listedOn: "DEPOP", listPrice: 4200, listedDaysAgo: 26 },
  { category: "Bottoms", title: "Carhartt double knee work pants", brand: "Carhartt", size: "W32 L32", color: "Brown", condition: "Good", description: "Nice natural wear on knees.", source: "Salvation Army", cost: 1200, acquiredDaysAgo: 45, storage: "Bottoms bin", status: "SOLD", listedOn: "BOTH", listPrice: 6500, listedDaysAgo: 40, sale: { platform: "DEPOP", price: 6000, daysAgo: 1, shipping: 800 } },
  { category: "Bottoms", title: "Pleated tennis skirt", brand: "Abercrombie", size: "S", color: "Grey", condition: "Like new", source: "Thrift Vintage Fashion", cost: 450, acquiredDaysAgo: 8, storage: "Bottoms bin", status: "NEEDS_PHOTOS" },
  { category: "Bottoms", title: "Wide leg linen trousers", brand: "Zara", size: "M", color: "Beige", condition: "Good", source: "OC Rag House", cost: 300, acquiredDaysAgo: 70, storage: "Bottoms bin", status: "SHIPPED", listedOn: "DEPOP", listPrice: 2500, listedDaysAgo: 60, sale: { platform: "DEPOP", price: 2200, daysAgo: 20, shipping: 450, notes: "Buyer asked about fit; final sale" } },
  { category: "Dresses", title: "Floral slip midi dress", brand: "Reformation", size: "S", color: "Blue floral", condition: "Excellent", source: "Goodwill", cost: 999, acquiredDaysAgo: 18, storage: "Tops bin", status: "LISTED", listedOn: "BOTH", listPrice: 6800, listedDaysAgo: 14 },
  { category: "Dresses", title: "90s black velvet mini dress", size: "M", color: "Black", condition: "Good", source: "Thrift Vintage Fashion", cost: 600, acquiredDaysAgo: 35, storage: "Tops bin", status: "SOLD", listedOn: "FLEA_MARKET", listPrice: 3800, listedDaysAgo: 30, sale: { platform: "FLEA_MARKET", price: 3800, daysAgo: 5, shipping: 500 } },
  { category: "Dresses", title: "Linen wrap sundress", brand: "Madewell", size: "L", color: "Rust", condition: "Good", description: "Faint mark on back, see photos.", source: "Thrift Vintage Fashion", cost: 799, acquiredDaysAgo: 5, storage: "Tops bin", status: "SOURCED" },
  { category: "Outerwear", title: "Carhartt Detroit jacket", brand: "Carhartt", size: "L", color: "Tan", condition: "Fair", description: "Worn cuffs and fraying collar. Lots of character.", source: "Salvation Army", cost: 2500, acquiredDaysAgo: 55, storage: "Tops bin", status: "SHIPPED", listedOn: "BOTH", listPrice: 12000, listedDaysAgo: 48, sale: { platform: "DEPOP", price: 11000, daysAgo: 12, shipping: 1200 } },
  { category: "Outerwear", title: "Wool camel overcoat", brand: "J.Crew", size: "M", color: "Camel", condition: "Excellent", source: "OC Rag House", cost: 1500, acquiredDaysAgo: 22, storage: "Tops bin", status: "LISTED", listedOn: "DEPOP", listPrice: 8500, listedDaysAgo: 15 },
  { category: "Outerwear", title: "Patagonia retro-X fleece", brand: "Patagonia", size: "S", color: "Natural", condition: "Good", source: "Goodwill", cost: 899, acquiredDaysAgo: 2, storage: "Tops bin", status: "NEEDS_PHOTOS" },
  { category: "Shoes", title: "Dr. Martens 1460 boots", brand: "Dr. Martens", size: "UK 6", color: "Cherry red", condition: "Good", description: "Creasing on toes, soles in great shape.", source: "Thrift Vintage Fashion", cost: 1800, acquiredDaysAgo: 28, storage: "Bottoms bin", status: "LISTED", listedOn: "BOTH", listPrice: 7500, listedDaysAgo: 24 },
  { category: "Shoes", title: "Adidas Samba OG", brand: "Adidas", size: "US 8", color: "White/Green", condition: "Like new", source: "Thrift Vintage Fashion", cost: 2000, acquiredDaysAgo: 15, storage: "Bottoms bin", status: "SOLD", listedOn: "DEPOP", listPrice: 8000, listedDaysAgo: 12, sale: { platform: "DEPOP", price: 7500, daysAgo: 3, shipping: 1000 } },
  { category: "Bags", title: "Coach leather shoulder bag", brand: "Coach", color: "Brown", condition: "Good", description: "Light scuffs on corners.", source: "OC Rag House", cost: 1200, acquiredDaysAgo: 50, storage: "Bottoms bin", status: "LISTED", listedOn: "FLEA_MARKET", listPrice: 6000, listedDaysAgo: 45 },
  { category: "Accessories", title: "Silk paisley scarf", color: "Red multi", condition: "Excellent", source: "Goodwill", cost: 199, acquiredDaysAgo: 10, storage: "Tops bin", status: "SOURCED" },
  { category: "Accessories", title: "Wool beanie", brand: "Carhartt", color: "Black", condition: "Good", source: "Salvation Army", cost: 250, acquiredDaysAgo: 20, storage: "Tops bin", status: "LISTED", listedOn: "DEPOP", listPrice: 1800, listedDaysAgo: 16 },
];


/** Plausible lay-flat measurements (inches) so the prep checklist has something to show. */
function sampleMeasurements(category: string, status: Status): Record<string, number> {
  if (status === "SOURCED") return {};
  switch (category) {
    case "Tops":
    case "Outerwear":
      return { pitToPit: 19.5, shoulder: 17, sleeve: 24, length: 26 };
    case "Dresses":
      return { pitToPit: 17, waist: 14, length: 36 };
    case "Bottoms":
      return { waist: 28, rise: 10.5, inseam: 30, legOpening: 8, length: 40 };
    case "Bags":
      return { width: 11, height: 8, strapDrop: 10 };
    default:
      return {};
  }
}
function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

/** Starting-guess fee calculation for sample data; the app will use lib/ code and settings. */
function sampleFees(platform: Platform, price: number, presets: Record<string, { percent: number; fixedCents: number }>) {
  const p = presets[platform] ?? { percent: 0, fixedCents: 0 };
  return Math.round((price * p.percent) / 100) + p.fixedCents;
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local.");
    process.exit(1);
  }

  const supabase = createClient(url, secret, { auth: { persistSession: false } });
  const force = process.argv.includes("--force");

  const { count, error: countError } = await supabase.from("items").select("id", { count: "exact", head: true });
  if (countError) throw new Error(`Can't read items. Did you run the migration? ${countError.message}`);
  if ((count ?? 0) > 0 && !force) {
    console.log(`There are already ${count} items. Nothing added. Use "npm run seed -- --force" to add samples anyway.`);
    return;
  }

  const { data: categories, error: catError } = await supabase.from("categories").select("id, name");
  if (catError) throw catError;
  const categoryId = new Map(categories.map((c) => [c.name, c.id]));

  const { data: settings, error: settingsError } = await supabase.from("settings").select("fee_presets").single();
  if (settingsError) throw settingsError;

  for (const item of items) {
    const catId = categoryId.get(item.category);
    if (!catId) throw new Error(`Unknown category "${item.category}"`);

    const { data: sku, error: skuError } = await supabase.rpc("next_sku", { p_category_id: catId });
    if (skuError) throw skuError;

    const { error } = await supabase.from("items").insert({
      sku,
      category_id: catId,
      title: item.title,
      brand: item.brand ?? null,
      size: item.size ?? null,
      color: item.color ?? null,
      condition: item.condition,
      description: item.description ?? null,
      measurements: sampleMeasurements(item.category, item.status),
      washed: item.status !== "SOURCED",
      source: item.source,
      source_cost: item.cost,
      acquired_date: daysAgo(item.acquiredDaysAgo),
      storage_location: item.storage,
      status: item.status,
      listed_on: item.listedOn ?? null,
      list_price: item.listPrice ?? null,
      listed_date: item.listedDaysAgo === undefined ? null : daysAgo(item.listedDaysAgo),
      sold_platform: item.sale?.platform ?? null,
      sold_price: item.sale?.price ?? null,
      sold_date: item.sale ? daysAgo(item.sale.daysAgo) : null,
      platform_fees: item.sale ? sampleFees(item.sale.platform, item.sale.price, settings.fee_presets) : null,
      shipping_cost: item.sale ? (item.sale.platform === "FLEA_MARKET" ? 0 : item.sale.shipping) : null,
      payment_method: item.sale ? (item.sale.platform === "DEPOP" ? "DEPOP" : "CASH") : null,
      buyer_notes: item.sale?.notes ?? null,
    });
    if (error) throw new Error(`Couldn't add "${item.title}": ${error.message}`);
    console.log(`  ${sku}  ${item.title}`);
  }

  console.log(`Added ${items.length} sample items.`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
