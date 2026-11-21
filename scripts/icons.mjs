/**
 * Bakes the app icons from her logo: `node scripts/icons.mjs`.
 * Reads assets/app-logo.png (the glossy hanger tile on a transparent background) and writes:
 *   public/icons/apple-touch-icon.png, icon-192.png, icon-512.png, icon-maskable-512.png
 *     square, no transparency (iPhone and Android round the corners themselves)
 *   app/icon.png   browser tab icon, keeps the tile's own rounded corners
 *   public/logo.webp   the tile for in-app use (login, start-up screen, sidebar)
 * Uses sharp, which ships with Next.js.
 */
import sharp from "sharp";
import { mkdirSync, statSync } from "node:fs";

const SRC = "assets/app-logo.png";
/** The tile sits at about 82..1169 x 86..1148 in the 1254px source. */
const TILE = { left: 82, top: 86, width: 1088, height: 1063 };
/** A square inside the tile's glass rim: fills the whole icon with no transparent corners. */
const INNER = { left: 112, top: 112, width: 1028, height: 1028 };
/** Edge colour of the tile, for padding the maskable icon. */
const EDGE = "#b3b9f1";
/** Palette PNG with dithering: a quarter of the size, no visible banding on the gradients. */
const PNG = { palette: true, quality: 90, dither: 1, compressionLevel: 9 };

mkdirSync("public/icons", { recursive: true });

// The source has faint specks in its transparent margin: drop anything nearly invisible.
const { data, info } = await sharp(SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
for (let i = 3; i < data.length; i += 4) if (data[i] < 48) data[i] = 0;
const clean = () => sharp(data, { raw: info });

const opaque = (size) => clean().extract(INNER).resize(size, size).flatten({ background: EDGE }).png(PNG);
const tile = (size) =>
  clean()
    .extract(TILE)
    .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } });

const jobs = [
  [opaque(180), "public/icons/apple-touch-icon.png"],
  [opaque(192), "public/icons/icon-192.png"],
  [opaque(512), "public/icons/icon-512.png"],
  // Maskable: Android may crop to a circle, so keep the hanger inside the middle 80%.
  [
    sharp(await opaque(420).toBuffer())
      .extend({ top: 46, bottom: 46, left: 46, right: 46, background: EDGE })
      .png(PNG),
    "public/icons/icon-maskable-512.png",
  ],
  [tile(64).png(PNG), "app/icon.png"],
  [tile(480).webp({ quality: 82, alphaQuality: 90 }), "public/logo.webp"],
];

for (const [img, out] of jobs) {
  await img.toFile(out);
  console.log(out, `${Math.round(statSync(out).size / 1024)} KB`);
}
