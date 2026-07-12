import type { Metadata } from "next";
import { site } from "./site";

/** Build consistent per-route metadata (title uses the layout template). */
export function pageMeta({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  const url = site.url + path;
  // Explicitly carry the OG image: setting an openGraph object otherwise suppresses
  // the file-based opengraph-image on non-home routes, leaving blank social cards.
  const image = { url: "/opengraph-image", width: 1200, height: 630, alt: `${title} · ${site.name}` };
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: `${title} · ${site.name}`,
      description,
      url,
      type: "website",
      siteName: site.name,
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} · ${site.name}`,
      description,
      images: ["/opengraph-image"],
    },
  };
}
