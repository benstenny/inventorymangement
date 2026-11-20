/**
 * Bakes the background picker images: `node scripts/backgrounds.mjs`.
 * Reads the originals in bg-images/, writes public/backgrounds/<id>-light.webp and
 * <id>-dark.webp (the picker shows these same files). Uses sharp, which ships with Next.js.
 *
 * Text sits straight on the page, so each image is squeezed into a band where every
 * text colour still reads at 4.5:1 or better (checked at the darkest/lightest 1% of
 * pixels): light mode lifts the picture toward white, dark mode presses it toward the
 * plum page. Each image gets the strongest pattern that still passes.
 * The list of ids and labels lives in lib/backgrounds.ts; keep the two in sync.
 */
import sharp from "sharp";
import { mkdirSync, statSync } from "node:fs";

const SOURCES = [
  ["Background Image-1.png", "stars"],
  ["Background Image-2.png", "lilac-hearts"],
  ["Background Image-3.png", "chrome-stars"],
  ["Background Image-4.png", "xo"],
  ["Background Image-5.png", "candy-hearts"],
  ["Background Image-6.png", "pink-hearts"],
  ["Background Image.png", "galaxy-hearts"],
  ["Background with Hearts.png", "heart-confetti"],
  ["Background.png", "twinkle"],
  ["Rainbow Image.png", "rainbow"],
];

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const lum = ([r, g, b]) => {
  const f = (v) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const contrast = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

// Must match the tokens in app/globals.css.
const MODES = {
  light: { page: hex("#fbddec"), texts: ["#ad2967", "#6b5577", "#b0232a", "#291939"], toward: 255, tint: 0.3 },
  dark: { page: hex("#291939"), texts: ["#f78dc3", "#ddccee", "#fceef6"], toward: 0, tint: 0.45 },
};
const TARGET = 4.6;
const WIDTH = 750;

function bake(data, channels, { page, toward, tint }, strength) {
  const out = Buffer.alloc((data.length / channels) * 3);
  for (let i = 0, o = 0; i < data.length; i += channels, o += 3) {
    for (let c = 0; c < 3; c++) {
      const squeezed = toward + strength * (data[i + c] - toward); // keep `strength` of the picture
      out[o + c] = Math.round(tint * page[c] + (1 - tint) * squeezed);
    }
  }
  return out;
}

function worstContrast(px, texts, dark) {
  const lums = [];
  for (let i = 0; i < px.length; i += 3) lums.push(lum([px[i], px[i + 1], px[i + 2]]));
  lums.sort((a, b) => a - b);
  const edge = dark ? lums[Math.floor(lums.length * 0.99)] : lums[Math.floor(lums.length * 0.01)];
  return Math.min(...texts.map((t) => contrast(lum(hex(t)), edge)));
}

mkdirSync("public/backgrounds", { recursive: true });
for (const [file, id] of SOURCES) {
  const src = sharp(`bg-images/${file}`).flatten({ background: "#ffffff" });
  const { data, info } = await src
    .clone()
    .resize({ width: WIDTH })
    .blur(1.2)
    .modulate({ saturation: 0.8 })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const report = [];
  for (const [mode, cfg] of Object.entries(MODES)) {
    // Largest strength (most visible pattern) that keeps every text colour readable.
    let lo = 0, hi = 1;
    for (let step = 0; step < 14; step++) {
      const mid = (lo + hi) / 2;
      if (worstContrast(bake(data, info.channels, cfg, mid), cfg.texts, mode === "dark") >= TARGET) lo = mid;
      else hi = mid;
    }
    const px = bake(data, info.channels, cfg, lo);
    const outFile = `public/backgrounds/${id}-${mode}.webp`;
    await sharp(px, { raw: { width: info.width, height: info.height, channels: 3 } }).webp({ quality: 70 }).toFile(outFile);
    report.push(`${mode} ${Math.round(lo * 100)}% ${Math.round(statSync(outFile).size / 1024)}KB`);
  }
  console.log(id.padEnd(15), report.join("  "));
}
