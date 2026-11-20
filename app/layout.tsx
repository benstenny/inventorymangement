import type { Metadata, Viewport } from "next";
import { Oxanium } from "next/font/google";
import { BACKDROP_ID, backgroundBootScript } from "@/lib/backgrounds";
import "./globals.css";

// Oxanium is the Y2K kit's own typeface. next/font self-hosts it at build time.
const oxanium = Oxanium({ variable: "--font-oxanium", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "reydiantfinds", template: "%s · reydiantfinds" },
  description: "Track thrifted finds from the rack to the buyer.",
  applicationName: "reydiantfinds",
  appleWebApp: { capable: true, title: "reydiantfinds", statusBarStyle: "default" },
  icons: {
    icon: { url: "/icon", type: "image/png", sizes: "32x32" },
    apple: "/icons/apple-touch-icon.png",
  },
};

// Mirrors the --bg token in globals.css (meta tags can't read CSS variables).
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f9d3e5" },
    { media: "(prefers-color-scheme: dark)", color: "#291939" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${oxanium.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        {/* The saved background picture; the script fills it in before first paint (lib/backgrounds.ts). */}
        <div id={BACKDROP_ID} aria-hidden className="app-backdrop" suppressHydrationWarning />
        <script dangerouslySetInnerHTML={{ __html: backgroundBootScript }} />
        {children}
      </body>
    </html>
  );
}
