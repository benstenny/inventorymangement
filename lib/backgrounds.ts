/**
 * Background pictures she can pick for the page. The choice is saved on the device
 * (localStorage), not in the database, so each phone or laptop keeps its own.
 *
 * The files in public/backgrounds/ are softened by scripts/backgrounds.mjs so every
 * text colour stays readable on top of them. Keep the ids here and in the script in sync.
 */

export const BACKGROUNDS = [
  { id: "candy-hearts", label: "Candy hearts" },
  { id: "heart-confetti", label: "Heart confetti" },
  { id: "pink-hearts", label: "Pink hearts" },
  { id: "lilac-hearts", label: "Lilac hearts" },
  { id: "galaxy-hearts", label: "Galaxy hearts" },
  { id: "stars", label: "Stars" },
  { id: "twinkle", label: "Twinkle" },
  { id: "chrome-stars", label: "Chrome stars" },
  { id: "xo", label: "XO" },
  { id: "rainbow", label: "Rainbow" },
] as const;

export type BackgroundId = (typeof BACKGROUNDS)[number]["id"];

export const BACKGROUND_STORAGE_KEY = "background";
/** The fixed layer behind every screen (rendered in app/layout.tsx). */
export const BACKDROP_ID = "app-backdrop";
/** Fired on window when the choice changes in this tab (`storage` only fires in other tabs). */
export const BACKGROUND_CHANGE_EVENT = "background-change";

const IDS: readonly string[] = BACKGROUNDS.map((b) => b.id);

/** A saved value back to a known background, or null for the plain page. */
export function parseBackground(value: unknown): BackgroundId | null {
  return typeof value === "string" && IDS.includes(value) ? (value as BackgroundId) : null;
}

export function backgroundUrls(id: BackgroundId) {
  return { light: `/backgrounds/${id}-light.webp`, dark: `/backgrounds/${id}-dark.webp` };
}

/**
 * Points the backdrop layer (see `.app-backdrop` in globals.css) at a background, or clears it.
 * Works on the layer itself, not <html>: React resets <html>'s attributes when it hydrates.
 */
export function applyBackground(root: HTMLElement | null, id: BackgroundId | null) {
  if (!root) return;
  if (!id) {
    delete root.dataset.bg;
    root.style.removeProperty("--bg-image-light");
    root.style.removeProperty("--bg-image-dark");
    return;
  }
  const urls = backgroundUrls(id);
  root.dataset.bg = id;
  root.style.setProperty("--bg-image-light", `url(${urls.light})`);
  root.style.setProperty("--bg-image-dark", `url(${urls.dark})`);
}

/**
 * Inline script placed right after the backdrop layer: applies the saved background
 * before the first paint, so the page never flashes plain pink first. Mirrors applyBackground.
 */
export const backgroundBootScript = `(function(){try{var ids=${JSON.stringify(IDS)};var id=localStorage.getItem(${JSON.stringify(
  BACKGROUND_STORAGE_KEY,
)});var r=document.getElementById(${JSON.stringify(BACKDROP_ID)});if(!r||ids.indexOf(id)<0)return;r.dataset.bg=id;r.style.setProperty("--bg-image-light","url(/backgrounds/"+id+"-light.webp)");r.style.setProperty("--bg-image-dark","url(/backgrounds/"+id+"-dark.webp)");}catch(e){}})();`;
