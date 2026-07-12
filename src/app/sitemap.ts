import type { MetadataRoute } from "next";
import { site } from "@/lib/site";
import { getProjects } from "@/lib/content";

// Refresh at most hourly (ISR) — picks up admin-added projects without a rebuild,
// while staying cache-fast for Googlebot. Falls back to the static project list
// when the DB is unreachable, so the sitemap is never empty.
export const revalidate = 3600;

const OG = `${site.url}/opengraph-image`;

/** Absolute URL for a possibly-relative project image. */
function abs(url?: string) {
  if (!url) return undefined;
  return url.startsWith("http") ? url : `${site.url}${url.startsWith("/") ? "" : "/"}${url}`;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const projects = await getProjects();

  // Priority is relative: it tells Google which of *our* URLs matter most, not
  // how we rank globally. Home + Work + About carry the name and the proof.
  const pages: MetadataRoute.Sitemap = [
    { url: site.url, lastModified: now, changeFrequency: "weekly", priority: 1.0, images: [OG] },
    { url: `${site.url}/work`, lastModified: now, changeFrequency: "monthly", priority: 0.9, images: [OG] },
    { url: `${site.url}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.8, images: [OG] },
    { url: `${site.url}/contact`, lastModified: now, changeFrequency: "yearly", priority: 0.7 },
    { url: `${site.url}/stack`, lastModified: now, changeFrequency: "yearly", priority: 0.6 },
    { url: `${site.url}/lab`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${site.url}/stats`, lastModified: now, changeFrequency: "daily", priority: 0.4 },
  ];

  const work: MetadataRoute.Sitemap = projects.map((p) => {
    const img = abs(p.imageUrl);
    return {
      url: `${site.url}/work/${p.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: p.flagship ? 0.85 : 0.64,
      ...(img ? { images: [img] } : {}),
    };
  });

  return [...pages, ...work];
}
