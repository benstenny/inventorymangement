import { ImageResponse } from "next/og";

// App icon: a white hanger on a glossy lavender orb. Swap it when the shop has a logo.
// Colors mirror the --text and --ink-violet-glow tokens (images can't read CSS variables).
const ACCENT = "#6e55d4";
const ON_ACCENT = "#ffffff";

const hanger = encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" stroke="${ON_ACCENT}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"><path d="M43 28a7 7 0 1 1 10 6.3c-2 1-3 2.4-3 4.7v3L15 64c-3 2-1.8 6 2 6h66c3.8 0 5-4 2-6L50 42"/></svg>`,
);

/** Renders a square PNG icon. `padding` shrinks the glyph for maskable icons. */
export function renderIcon(size: number, padding = 0.18) {
  const glyph = Math.round(size * (1 - padding * 2));
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: ACCENT,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`data:image/svg+xml,${hanger}`} width={glyph} height={glyph} alt="" />
      </div>
    ),
    { width: size, height: size },
  );
}
