import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

/**
 * Web app manifest — makes the site installable and gives Android / PWA a proper
 * name, theme, and icon (instead of a low-res favicon). Next auto-serves this at
 * /manifest.webmanifest and links it from the document head.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${site.name} — ${site.role}`,
    short_name: site.name,
    description: site.tagline,
    start_url: "/",
    display: "standalone",
    background_color: "#08080a",
    theme_color: "#08080a",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
