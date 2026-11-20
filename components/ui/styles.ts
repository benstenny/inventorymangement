/** Shared class names for the components in DESIGN.md. Tokens only, no raw values. */

/**
 * Text field, from the Y2K kit: a white pill with a pink rim. What she types is plum, so
 * her words read apart from the pink labels.
 * Focus swaps the rim for the kit's white edge and a pink halo. Red rim on error.
 * Multi-line fields add `rounded-card` so the corners don't balloon.
 */
export const inputClass =
  "min-h-touch w-full rounded-pill border-2 border-border bg-surface-raised px-4 text-base font-medium text-text placeholder:text-muted placeholder:font-normal transition-[box-shadow,border-color] duration-150 ease-out-expo focus:border-edge focus:shadow-glow focus:outline-none aria-invalid:border-danger";

/** The one primary action per screen: the kit's glossy candy pill. */
export const primaryButtonClass =
  "flex min-h-[50px] w-full items-center justify-center rounded-pill border-2 border-edge bg-accent gloss px-6 text-[17px] font-semibold tracking-[0.01em] text-on-accent shadow-candy transition-transform duration-150 ease-out-expo active:scale-[0.97] active:shadow-pressed disabled:opacity-55 disabled:shadow-pressed";

/** Outline candy: pale pink fill, hot-pink rim, pink label. */
export const secondaryButtonClass =
  "flex min-h-touch items-center justify-center rounded-pill border-2 border-ink-pink-glow bg-surface px-5 font-semibold text-ink-pink shadow-pearl transition-transform duration-150 ease-out-expo active:scale-[0.97] active:shadow-pressed disabled:opacity-55";

/**
 * Chip and small pill (filters, choices, next-step buttons). White pill with a pink rim and
 * pink label; selected ones turn into glossy candy with the kit's white rim (add the state variant:
 * `peer-checked:` for radio/checkbox chips, `aria-pressed:` for toggle buttons).
 */
export const chipClass =
  "flex min-h-touch shrink-0 items-center gap-1.5 rounded-pill border-2 border-border bg-surface-raised px-4 text-[15px] font-semibold whitespace-nowrap text-ink-pink shadow-pearl transition-[transform,background-color] duration-150 ease-out-expo active:scale-95";
export const chipSelectedPeer =
  "peer-checked:border-edge peer-checked:bg-accent peer-checked:gloss peer-checked:text-on-accent peer-checked:shadow-gloss";
export const chipSelectedPressed =
  "aria-pressed:border-edge aria-pressed:bg-accent aria-pressed:gloss aria-pressed:text-on-accent aria-pressed:shadow-gloss";

export const labelClass = "text-[15px] font-semibold text-ink-pink";

/** Grouped section: a warm near-white card with a pink rim on the bubblegum page. */
export const groupClass = "rounded-card bg-surface shadow-card ring-1 ring-border";
