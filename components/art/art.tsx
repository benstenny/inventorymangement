import { useId } from "react";

/**
 * Coded 3D-look decorations from the mockups: an iridescent CD, puffy chrome stars and chrome
 * sparkles. Pure CSS/SVG (no image files), so they stay crisp and tiny. Decorative only:
 * always aria-hidden, only on the login and in empty states, never behind lists or forms.
 * Colours live in app/globals.css (.art-cd, --chrome-*); see DESIGN.md > The idea.
 */

/** A tilted iridescent CD with grooves, a centre hole and a white specular sweep. */
export function IridescentCD({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`art-cd ${className}`} />;
}

/** A puffy chrome star: silver-lavender metal with a white rim and a soft highlight. */
export function ChromeStar({ className = "", size = 64 }: { className?: string; size?: number }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg aria-hidden width={size} height={size} viewBox="0 0 100 100" className={`art-chrome ${className}`}>
      <defs>
        <linearGradient id={`${id}-metal`} x1="0" y1="0" x2="0.35" y2="1">
          <stop offset="0" stopColor="var(--chrome-1)" />
          <stop offset="0.32" stopColor="var(--chrome-2)" />
          <stop offset="0.5" stopColor="var(--chrome-3)" />
          <stop offset="0.6" stopColor="var(--chrome-4)" />
          <stop offset="0.84" stopColor="var(--chrome-1)" />
          <stop offset="1" stopColor="var(--chrome-4)" />
        </linearGradient>
        <radialGradient id={`${id}-shine`} cx="0.36" cy="0.3" r="0.3">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* Round joins on a thick stroke puff the points out like an inflated sticker. */}
      <path
        d="M50 12 61 38 89 40 67 58 74 86 50 71 26 86 33 58 11 40 39 38Z"
        fill={`url(#${id}-metal)`}
        stroke={`url(#${id}-metal)`}
        strokeWidth="9"
        strokeLinejoin="round"
      />
      <path
        d="M50 12 61 38 89 40 67 58 74 86 50 71 26 86 33 58 11 40 39 38Z"
        fill="none"
        stroke="var(--chrome-rim)"
        strokeWidth="1.6"
        strokeLinejoin="round"
        transform="translate(50 50) scale(1.09) translate(-50 -50)"
      />
      <ellipse cx="40" cy="36" rx="16" ry="11" fill={`url(#${id}-shine)`} />
    </svg>
  );
}

/** A four-point chrome sparkle (glitter glint). */
export function ChromeSparkle({ className = "", size = 24 }: { className?: string; size?: number }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg aria-hidden width={size} height={size} viewBox="0 0 24 24" className={`art-chrome ${className}`}>
      <defs>
        <linearGradient id={`${id}-spark`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--chrome-1)" />
          <stop offset="0.5" stopColor="var(--chrome-3)" />
          <stop offset="1" stopColor="var(--chrome-1)" />
        </linearGradient>
      </defs>
      <path
        d="M12 0c.6 6.6 5.4 11.4 12 12-6.6.6-11.4 5.4-12 12-.6-6.6-5.4-11.4-12-12C6.6 11.4 11.4 6.6 12 0Z"
        fill={`url(#${id}-spark)`}
        stroke="var(--chrome-rim)"
        strokeWidth="0.6"
      />
    </svg>
  );
}

/** Her logo: the glossy hanger tile (public/logo.webp, baked by scripts/icons.mjs). */
export function Logo({ size, className = "" }: { size: number; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/logo.webp" width={size} height={size} alt="" className={`logo-tile ${className}`} />
  );
}

/** The login's hero: the logo with chrome sparkles around it. */
export function LoginArt() {
  return (
    <div aria-hidden className="relative mx-auto mb-4 h-40 w-[290px]">
      <Logo size={144} className="absolute top-1 left-1/2 -translate-x-1/2" />
      <ChromeStar size={44} className="absolute top-2 left-5 -rotate-12" />
      <ChromeSparkle size={22} className="absolute top-6 right-8" />
      <ChromeSparkle size={14} className="absolute bottom-4 left-14" />
      <ChromeSparkle size={12} className="absolute right-14 bottom-1" />
    </div>
  );
}

/** A small cluster for empty states: one chrome star with two sparkles. */
export function EmptyArt() {
  return (
    <div aria-hidden className="relative mb-5 size-24">
      <ChromeStar size={72} className="absolute top-3 left-3 -rotate-6" />
      <ChromeSparkle size={20} className="absolute top-0 right-0" />
      <ChromeSparkle size={13} className="absolute bottom-2 left-0" />
    </div>
  );
}
