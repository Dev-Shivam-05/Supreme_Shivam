import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

/**
 * Crawlers may index everything public, but never the admin or the API — those
 * waste crawl budget and must never surface in search. The sitemap + host lines
 * point Google straight at the canonical index.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api/"],
      },
    ],
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
