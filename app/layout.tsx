import type { Metadata, Viewport } from "next";
import { Chewy } from "next/font/google";
import "./globals.css";

// Bubble-letter display face for large titles. next/font self-hosts it at build time.
const chewy = Chewy({
  variable: "--font-chewy",
  weight: "400",
  subsets: ["latin"],
});

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
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#160d29" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${chewy.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
