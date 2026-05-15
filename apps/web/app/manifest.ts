import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Bawarchie — QR Restaurant Ordering",
    short_name: "Bawarchie",
    description: "Scan, order, and pay — all from your table!",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#16a34a",
    orientation: "portrait",
    categories: ["food", "lifestyle"],
    icons: [
      {
        src: "/logoBawa.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/logoBawa.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    screenshots: [],
  };
}
