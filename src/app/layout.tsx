import type { Metadata, Viewport } from "next";
import { Anton, Inter, JetBrains_Mono, Sacramento, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { SmoothScroll } from "@/components/providers/smooth-scroll";
import { Nav } from "@/components/layout/nav";
import { Footer } from "@/components/layout/footer";
import { ScrollProgress } from "@/components/ux/scroll-progress";
import { CommandPalette } from "@/components/ux/command-palette";
import { Beacon } from "@/components/analytics/beacon";
import { JsonLd, siteGraphLd } from "@/components/seo/json-ld";
import { getSettings, toPublicContent } from "@/lib/content";
import { site } from "@/lib/site";

const anton = Anton({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-anton",
});
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});
const sacramento = Sacramento({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-sacramento",
  // Only the signature far down the page uses it, so it must not compete with
  // the hero fonts for the first bytes.
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    // One title, one role, everywhere — see the IDENTITY RULE in lib/site.ts.
    default: site.title,
    template: `%s · ${site.name}`,
  },
  description: site.tagline,
  applicationName: site.name,
  keywords: [
    "Shivam Bhadoriya",
    "Shivam Bhadoriya AI Engineer",
    "Shivam Bhadoriya portfolio",
    "Shivam Bhadoriya Navsari",
    "AI Engineer Navsari",
    "web developer Navsari",
    "website developer Surat",
    "AI automation developer India",
    "Aaziko Global LLP",
    "Dev-Shivam-05",
    "spec-driven development",
    "AI coding agents",
  ],
  authors: [{ name: site.name, url: site.url }],
  creator: site.name,
  publisher: site.name,
  alternates: { canonical: "/" },
  openGraph: {
    type: "profile",
    firstName: site.firstName,
    lastName: site.lastName,
    username: site.handle,
    title: site.title,
    description: site.taglineShort,
    url: site.url,
    siteName: site.name,
    locale: "en_IN",
    images: [
      {
        url: site.images.og,
        width: 1200,
        height: 630,
        alt: site.images.alt,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: site.social.xHandle,
    creator: site.social.xHandle,
    title: site.title,
    description: site.taglineShort,
    images: [site.images.og],
  },
  // `max-image-preview: large` is what permits a full-size thumbnail in results.
  // Without it his photograph cannot appear at usable size next to the listing.
  robots: {
    index: true,
    follow: true,
    "max-image-preview": "large",
    "max-snippet": -1,
    "max-video-preview": -1,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  // Ownership token for the OLD `shivam-bhadoriya-dev.vercel.app` Search Console property.
  // That host now redirects here, and Search Console follows redirects for meta-tag
  // verification, so this tag is what keeps the old property verified. Without it the
  // Change of Address tool cannot be used and Google has to discover the move on its own.
  // It was dropped once in a redesign — do not remove it again.
  verification: { google: "FpMq1620MPw97ShOx5JxKpvxsk0ON2uvsx7jUCBk_Ks" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#08080a",
  colorScheme: "dark",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const content = await getSettings();
  return (
    <html
      lang="en-IN"
      suppressHydrationWarning
      className={`${anton.variable} ${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable} ${sacramento.variable} antialiased`}
    >
      <body>
        {/* The person entity rides on every route, not just the home page — it is
            what ties this site, LinkedIn, GitHub, X and the photograph together. */}
        <JsonLd data={siteGraphLd} />
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <Beacon />
          <SmoothScroll>
            <ScrollProgress />
            <div className="grain-overlay" aria-hidden />
            <Nav />
            <CommandPalette />
            <main>{children}</main>
            <Footer content={toPublicContent(content)} />
          </SmoothScroll>
        </ThemeProvider>
      </body>
    </html>
  );
}
