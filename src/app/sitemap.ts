import type { MetadataRoute } from "next";
import { site } from "@/lib/site";
import { getProjects } from "@/lib/content";
import { posts } from "@/lib/writing";
import { servicePages } from "@/lib/services";

// Refresh at most hourly (ISR) — picks up admin-added projects without a rebuild,
// while staying cache-fast for Googlebot. Falls back to the static project list
// when the DB is unreachable, so the sitemap is never empty.
export const revalidate = 3600;

const abs = (path: string) => `${site.url}${path}`;

/** The photographs, as absolute URLs. These are the image-sitemap entries. */
const OG = abs(site.images.og);
const AVATAR = abs(site.images.avatar);
const PORTRAIT = abs(site.images.portrait);

/** Absolute URL for a possibly-relative project image. */
function absMaybe(url?: string) {
  if (!url) return undefined;
  return url.startsWith("http") ? url : `${site.url}${url.startsWith("/") ? "" : "/"}${url}`;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const projects = await getProjects();

  // Priority is relative: it tells Google which of *our* URLs matter most, not
  // how we rank globally. Home + About carry the name, the face and the prose.
  const pages: MetadataRoute.Sitemap = [
    {
      url: site.url,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
      // Both photographs are listed against the page they actually appear on —
      // an image sitemap entry for an image that is not on the page is ignored.
      images: [PORTRAIT, AVATAR, OG],
    },
    {
      url: abs("/about"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
      images: [PORTRAIT, AVATAR],
    },
    // The service and hire pages are the commercial half of the site (Goal B) —
    // they rank for "web developer navsari" and friends, so they sit high.
    { url: abs("/services"), lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: abs("/work"), lastModified: now, changeFrequency: "monthly", priority: 0.85, images: [OG] },
    { url: abs("/writing"), lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: abs("/contact"), lastModified: now, changeFrequency: "yearly", priority: 0.7 },
    { url: abs("/stack"), lastModified: now, changeFrequency: "yearly", priority: 0.6 },
    { url: abs("/lab"), lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: abs("/stats"), lastModified: now, changeFrequency: "daily", priority: 0.4 },
  ];

  const services: MetadataRoute.Sitemap = servicePages.map((p) => ({
    url: abs(p.slug),
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.85,
    images: [AVATAR],
  }));

  const legal: MetadataRoute.Sitemap = ["/privacy-policy", "/terms"].map((path) => ({
    url: abs(path),
    lastModified: now,
    changeFrequency: "yearly" as const,
    priority: 0.2,
  }));

  const writing: MetadataRoute.Sitemap = posts.map((p) => ({
    url: abs(`/writing/${p.slug}`),
    lastModified: new Date(p.updated ?? p.published),
    changeFrequency: "yearly" as const,
    priority: 0.7,
    images: [AVATAR],
  }));

  const work: MetadataRoute.Sitemap = projects.map((p) => {
    const img = absMaybe(p.imageUrl);
    return {
      url: abs(`/work/${p.slug}`),
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: p.archived ? 0.4 : p.flagship ? 0.8 : 0.64,
      ...(img ? { images: [img] } : {}),
    };
  });

  return [...pages, ...services, ...writing, ...work, ...legal];
}
