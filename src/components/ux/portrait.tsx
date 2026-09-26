import { site } from "@/lib/site";

/**
 * His full photograph as <picture>: AVIF (27KB) or WebP for the browser, and the
 * name-carrying /images/…-portrait.jpg as the <img src>. The .jpg is the URL in the
 * JSON-LD and the image sitemap, so image search keeps seeing the same file.
 *
 * Deliberately a plain <img>, not next/image: /_next/image?url=… carries no filename
 * signal. And no fetchPriority="high": React turns that into a <link rel=preload> for
 * the .jpg src, which would download the JPEG on top of the AVIF.
 *
 * `picture` is `display: contents`, so the <img> classes lay out exactly as before.
 */
export function Portrait({
  className,
  loading,
}: {
  className: string;
  loading: "eager" | "lazy";
}) {
  const src = site.images.portrait;
  return (
    <picture className="contents">
      <source srcSet={src.replace(/\.jpg$/, ".avif")} type="image/avif" />
      <source srcSet={src.replace(/\.jpg$/, ".webp")} type="image/webp" />
      <img
        src={src}
        alt={site.images.alt}
        width={576}
        height={1024}
        loading={loading}
        decoding="async"
        className={className}
      />
    </picture>
  );
}
