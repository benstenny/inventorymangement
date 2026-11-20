/** Shared class names for the components in DESIGN.md. Tokens only, no raw values. */

/** iOS-style filled field: no border at rest, a lilac ring when focused, red ring on error. */
export const inputClass =
  "min-h-touch w-full rounded-control border border-transparent bg-surface-muted px-3.5 text-base text-text placeholder:text-muted transition-colors focus:border-ink-lilac focus:bg-surface focus:outline-none aria-invalid:border-danger";

/** The one primary action per screen: pink gel. */
export const primaryButtonClass =
  "flex min-h-[50px] w-full items-center justify-center rounded-control bg-accent px-5 text-[17px] font-semibold text-on-accent shadow-float transition-transform duration-150 ease-out-expo active:scale-[0.97] disabled:opacity-55 disabled:shadow-none";

export const secondaryButtonClass =
  "flex min-h-touch items-center justify-center rounded-control bg-surface-muted px-4 font-semibold text-text transition-transform duration-150 ease-out-expo active:scale-[0.97] disabled:opacity-55";

export const labelClass = "text-[15px] font-semibold";

/** iOS inset grouped section: a white card on phones, sits on the page. */
export const groupClass = "rounded-card bg-surface shadow-card ring-1 ring-hairline";
