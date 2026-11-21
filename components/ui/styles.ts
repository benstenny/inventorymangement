/** Shared class names for the components in DESIGN.md. Tokens only, no raw values. */

/**
 * Text field: a bright glass pill with a crisp white rim and a soft lavender edge; what she
 * types is deep indigo. Focus: lavender outline plus a soft lavender halo. Red outline on error.
 * Multi-line fields use `textareaClass` instead, so the corners don't balloon.
 */
export const inputClass =
  "min-h-touch w-full rounded-pill border-[1.5px] border-border bg-surface-raised px-4 text-base font-semibold text-text placeholder:text-muted placeholder:font-normal shadow-pearl transition-[box-shadow,border-color] duration-150 ease-out-expo focus:border-accent focus:shadow-glow focus:outline-none aria-invalid:border-danger";

/** Multi-line text box: same look as a field, card corners instead of pill ends. */
export const textareaClass = `${inputClass.replace("rounded-pill", "rounded-card")} py-2.5`;

/** The one primary action per screen: the glossy pink-to-lavender gel pill. */
export const primaryButtonClass =
  "flex min-h-[52px] w-full items-center justify-center rounded-pill border-[1.5px] border-edge bg-candy gloss px-6 text-[17px] font-extrabold tracking-[0.01em] text-on-accent shadow-candy transition-transform duration-150 ease-out-expo active:scale-[0.97] active:shadow-pressed disabled:opacity-55 disabled:shadow-pressed";

/** Glass pill with a lavender outline and violet label. */
export const secondaryButtonClass =
  "flex min-h-touch items-center justify-center rounded-pill border-[1.5px] border-border bg-surface-raised px-5 font-bold text-ink-violet shadow-pearl transition-transform duration-150 ease-out-expo active:scale-[0.97] active:shadow-pressed disabled:opacity-55";

/**
 * Chip and small pill (filters, choices, next-step buttons): a glass pill with a lavender outline
 * and violet label; selected ones turn deep indigo with a white label and a gel shine (add the
 * state variant: `peer-checked:` for radio/checkbox chips, `aria-pressed:` for toggle buttons).
 */
export const chipClass =
  "flex min-h-touch shrink-0 items-center gap-1.5 rounded-pill border-[1.5px] border-border bg-surface-raised px-4 text-[15px] font-bold whitespace-nowrap text-ink-violet shadow-pearl transition-[transform,background-color] duration-150 ease-out-expo active:scale-95";
export const chipSelectedPeer =
  "peer-checked:border-selected peer-checked:bg-selected peer-checked:gloss peer-checked:text-on-selected peer-checked:shadow-gloss";
export const chipSelectedPressed =
  "aria-pressed:border-selected aria-pressed:bg-selected aria-pressed:gloss aria-pressed:text-on-selected aria-pressed:shadow-gloss";

export const labelClass = "text-[15px] font-bold text-ink-violet";

/** Grouped section: frosted pearl glass with a crisp white rim and soft lavender lighting. */
export const groupClass = "glass rounded-card bg-surface shadow-card ring-[1.5px] ring-edge";
