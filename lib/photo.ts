/**
 * Shrinks a photo on the phone before upload: ~1600px on the long edge,
 * WebP (or JPEG where WebP isn't supported) at ~80%, aiming for 200–400 KB.
 * These are reference photos; full-quality originals stay in her camera roll.
 */

export const MAX_EDGE = 1600;
export const TARGET_BYTES = 400 * 1024;
const QUALITY_STEPS = [0.8, 0.72, 0.64, 0.56];

/** Scales width/height down so the long edge is at most `maxEdge`. Never scales up. */
export function fitWithin(width: number, height: number, maxEdge = MAX_EDGE) {
  if (width <= 0 || height <= 0) throw new Error("Image has no size");
  const scale = Math.min(1, maxEdge / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

/**
 * Picks the first quality whose result fits the target size. If none fit,
 * returns the smallest attempt. `encode` is injected so this is testable.
 */
export async function encodeUnderTarget(
  encode: (quality: number) => Promise<Blob>,
  targetBytes = TARGET_BYTES,
): Promise<Blob> {
  let smallest: Blob | null = null;
  for (const quality of QUALITY_STEPS) {
    const blob = await encode(quality);
    if (blob.size <= targetBytes) return blob;
    if (!smallest || blob.size < smallest.size) smallest = blob;
  }
  return smallest!;
}

export type CompressedPhoto = { blob: Blob; extension: "webp" | "jpg"; width: number; height: number };

/** Browser only. Resizes and re-encodes a picked photo. Respects EXIF rotation. */
export async function compressPhoto(file: File): Promise<CompressedPhoto> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  try {
    const { width, height } = fitWithin(bitmap.width, bitmap.height);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Couldn't prepare the photo.");
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bitmap, 0, 0, width, height);

    const toBlob = (type: string, quality: number) =>
      new Promise<Blob>((resolve, reject) =>
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Couldn't prepare the photo."))), type, quality),
      );

    // Older Safari silently returns PNG when asked for WebP; fall back to JPEG then.
    const probe = await toBlob("image/webp", QUALITY_STEPS[0]);
    const useWebp = probe.type === "image/webp";
    const type = useWebp ? "image/webp" : "image/jpeg";

    const blob =
      useWebp && probe.size <= TARGET_BYTES
        ? probe
        : await encodeUnderTarget((q) => toBlob(type, q));

    return { blob, extension: useWebp ? "webp" : "jpg", width, height };
  } finally {
    bitmap.close();
  }
}
