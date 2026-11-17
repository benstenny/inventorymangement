import type { MetadataRoute } from "next";

// Colors mirror the light tokens in globals.css (the manifest can't read CSS variables).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Resale Inventory",
    short_name: "Inventory",
    description: "Track thrifted stock from sourcing to sale.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f7f6f4",
    theme_color: "#f7f6f4",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
