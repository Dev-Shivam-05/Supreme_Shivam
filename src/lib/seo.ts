import type { Metadata } from "next";
import { site } from "./site";

/**
 * Build consistent per-route metadata (title uses the layout template).
 *
 * The social card is a static file at a stable, name-carrying path rather than a
 * runtime-rendered route: the filename is a ranking input for image search, and
 * a `/_next/…` or `/opengraph-image` URL carries none of that signal and changes
 * between deploys.
 */
export function pageMeta({
  title,
  description,
  path,
  image = site.images.og,
  imageAlt = site.images.alt,
}: {
  title: string;
  description: string;
  path: string;
  image?: string;
  imageAlt?: string;
}): Metadata {
  const url = site.url + path;
  const fullTitle = `${title} · ${site.name}`;
  const og = { url: image, width: 1200, height: 630, alt: imageAlt };
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: fullTitle,
      description,
      url,
      type: "website",
      siteName: site.name,
      locale: "en_IN",
      images: [og],
    },
    twitter: {
      card: "summary_large_image",
      site: site.social.xHandle,
      creator: site.social.xHandle,
      title: fullTitle,
      description,
      images: [image],
    },
  };
}
