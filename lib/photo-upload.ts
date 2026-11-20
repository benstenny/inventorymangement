import { compressPhoto } from "@/lib/photo";
import { createClient } from "@/lib/supabase/client";

const BUCKET = "item-photos";

/**
 * Browser only. Shrinks the picked photo and uploads it to the private
 * photo bucket. Returns the storage path to save on the item.
 */
export async function uploadItemPhoto(file: File): Promise<{ path: string; bytes: number }> {
  if (!file.type.startsWith("image/")) throw new Error("That file isn't a photo.");

  const { blob, extension } = await compressPhoto(file);
  const path = `items/${uuid()}.${extension}`;

  const supabase = createClient();
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    contentType: extension === "webp" ? "image/webp" : "image/jpeg",
    upsert: false,
  });
  if (error) throw new Error("The photo didn't upload. Check your connection and try again.");

  return { path, bytes: blob.size };
}

/**
 * Random v4 UUID. crypto.randomUUID only exists on https/localhost, so testing
 * from a phone at http://192.168.x.x needs this getRandomValues fallback.
 */
export function uuid(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40; // version 4
  b[8] = (b[8] & 0x3f) | 0x80; // variant
  const h = [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}
