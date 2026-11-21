import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import { Splash } from "@/components/splash";
import { BACKDROP_ID, backgroundBootScript } from "@/lib/backgrounds";
import "./globals.css";

// Nunito: rounded, bold and friendly, close to the mockups' lettering. next/font self-hosts it.
const nunito = Nunito({ variable: "--font-nunito", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "reydiantfinds", template: "%s · reydiantfinds" },
  description: "Track thrifted finds from the rack to the buyer.",
  applicationName: "reydiantfinds",
  appleWebApp: { capable: true, title: "reydiantfinds", statusBarStyle: "default" },
  // The tab icon is app/icon.png; all icons are baked from her logo by scripts/icons.mjs.
  icons: { apple: "/icons/apple-touch-icon.png" },
};

// Mirrors the --bg token in globals.css (meta tags can't read CSS variables).
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#eee9fd" },
    { media: "(prefers-color-scheme: dark)", color: "#1d1840" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${nunito.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        {/* The saved background picture; the script fills it in before first paint (lib/backgrounds.ts). */}
        <div id={BACKDROP_ID} aria-hidden className="app-backdrop" suppressHydrationWarning />
        <script dangerouslySetInnerHTML={{ __html: backgroundBootScript }} />
        <Splash />
        {children}
      </body>
    </html>
  );
}
