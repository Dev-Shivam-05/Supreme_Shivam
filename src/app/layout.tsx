import type { Metadata, Viewport } from "next";
import { Anton, Inter, JetBrains_Mono, Sacramento, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { SmoothScroll } from "@/components/providers/smooth-scroll";
import { Nav } from "@/components/layout/nav";
import { Footer } from "@/components/layout/footer";
import { ScrollProgress } from "@/components/ux/scroll-progress";
import { CommandPalette } from "@/components/ux/command-palette";
import { Preloader } from "@/components/ux/preloader";
import { Beacon } from "@/components/analytics/beacon";
import { getSettings } from "@/lib/content";
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
});

export const metadata: Metadata = {
  metadataBase: new URL("https://shivam-bhadoriya-dev.vercel.app"),
  title: {
    default: `${site.name} — ${site.role}`,
    template: `%s · ${site.name}`,
  },
  description: site.tagline,
  keywords: [
    "Shivam Bhadoriya",
    "full-stack developer",
    "MERN developer",
    "React engineer",
    "Node.js",
    "MongoDB",
    "portfolio",
  ],
  authors: [{ name: site.name }],
  openGraph: {
    type: "website",
    title: `${site.name} — ${site.role}`,
    description: site.tagline,
    siteName: site.name,
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.name} — ${site.role}`,
    description: site.tagline,
  },
  robots: { index: true, follow: true },
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
      lang="en"
      suppressHydrationWarning
      className={`${anton.variable} ${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable} ${sacramento.variable} antialiased`}
    >
      <body>
        {/* skip the cold-open on repeat visits in the same tab — runs before paint */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{if(sessionStorage.getItem('booted'))document.documentElement.classList.add('booted')}catch(e){}",
          }}
        />
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <Preloader />
          <Beacon />
          <SmoothScroll>
            <ScrollProgress />
            <div className="grain-overlay" aria-hidden />
            <Nav />
            <CommandPalette />
            <main>{children}</main>
            <Footer content={content} />
          </SmoothScroll>
        </ThemeProvider>
      </body>
    </html>
  );
}
