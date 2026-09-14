import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

/**
 * Canonical host. An exact-match domain on the full name is the single strongest
 * signal that this site is *about* this person; a shared *.vercel.app subdomain
 * carries none of it. The day shivambhadoriya.com is pointed at this deployment,
 * set NEXT_PUBLIC_SITE_URL in Vercel and the redirect below starts 301-ing the
 * old host to it.
 *
 * The guard matters: without it, a deploy would permanently redirect the live
 * site into a domain that does not resolve yet. A 301 is cached hard by browsers
 * and is very expensive to take back.
 */
const LEGACY_HOST = "shivam-bhadoriya-dev.vercel.app";
const canonicalUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "");
const canonicalHost = (() => {
  if (!canonicalUrl) return null;
  try {
    const host = new URL(canonicalUrl).host;
    // A *.vercel.app value is not a custom domain — nothing to redirect to.
    return host.endsWith(".vercel.app") ? null : host;
  } catch {
    return null;
  }
})();

// Content-Security-Policy. Strict in production; dev needs eval + ws for Turbopack HMR.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isProd ? "" : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://picsum.photos https://fastly.picsum.photos https://*.picsum.photos",
  "font-src 'self' data:",
  `connect-src 'self'${isProd ? "" : " ws: wss:"}`,
  "media-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "fastly.picsum.photos" },
    ],
  },
  // tree-shake heavy barrel packages so only used code ships (smaller JS bundle)
  experimental: {
    optimizePackageImports: ["lucide-react", "motion", "recharts", "@react-three/drei"],
  },
  compress: true,
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  async redirects() {
    if (!canonicalHost || !canonicalUrl) return [];
    const to = { destination: `${canonicalUrl}/:path*`, permanent: true };
    const hosts = [LEGACY_HOST];
    // Fold the www/apex variant into one origin too — two hosts serving 200s is
    // two competing copies of the same page as far as Google is concerned.
    hosts.push(canonicalHost.startsWith("www.") ? canonicalHost.slice(4) : `www.${canonicalHost}`);
    return hosts.map((value) => ({
      source: "/:path*",
      has: [{ type: "host" as const, value }],
      ...to,
    }));
  },
};

export default nextConfig;
