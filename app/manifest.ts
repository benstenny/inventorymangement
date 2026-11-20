import type { MetadataRoute } from "next";

// Colors mirror the light tokens in globals.css (the manifest can't read CSS variables).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "reydiantfinds",
    short_name: "reydiantfinds",
    description: "Track thrifted finds from the rack to the buyer.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
