"use client";

import { usePathname } from "next/navigation";
import { SmoothScroll } from "@/components/providers/smooth-scroll";
import { Nav } from "@/components/layout/nav";
import { Footer } from "@/components/layout/footer";
import { ScrollProgress } from "@/components/ux/scroll-progress";
import { CommandPalette } from "@/components/ux/command-palette";

/**
 * Public chrome, everywhere except /admin.
 *
 * The admin deck is a full-height application, not a page on the site. It needs
 * three things the public shell actively prevents: a sidebar pinned to the
 * viewport (Lenis's transformed wrapper breaks `position: sticky` inside it),
 * the whole viewport height (the fixed nav and footer eat ~220px of it), and
 * Cmd-K for its own palette — the public one binds that key globally and would
 * open the site search on top of the deck.
 *
 * A nested layout cannot remove a parent layout's chrome in the App Router, so
 * the split happens here, in one client component, rather than by duplicating
 * the root layout.
 */
export function Chrome({
  content,
  children,
}: {
  content: React.ComponentProps<typeof Footer>["content"];
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  if (pathname?.startsWith("/admin")) {
    return <main className="min-h-svh">{children}</main>;
  }

  return (
    <SmoothScroll>
      <ScrollProgress />
      <div className="grain-overlay" aria-hidden />
      <Nav />
      <CommandPalette />
      <main>{children}</main>
      <Footer content={content} />
    </SmoothScroll>
  );
}
