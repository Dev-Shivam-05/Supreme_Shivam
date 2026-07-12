"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Signature } from "@/components/ux/signature";
import { nav, site, type SiteContent } from "@/lib/site";

export function Footer({ content }: { content: SiteContent }) {
  const year = new Date().getFullYear();
  return (
    <footer className="relative overflow-hidden border-t border-border bg-bg-elev">
      <div className="grid-bg pointer-events-none absolute inset-0 opacity-40" />
      <div className="container-x relative py-20">
        <div className="flex flex-col gap-16">
          {/* CTA */}
          <div className="flex flex-wrap items-end justify-between gap-10">
            <div>
              <div className="hud tick mb-6">{content.status}</div>
              <Link href="/contact" className="block">
                <h2 className="font-poster display-2 leading-[0.82]">
                  Let&apos;s build
                  <br />
                  <span className="text-accent">something fast.</span>
                </h2>
              </Link>
            </div>
            <Link
              href="/contact"
              className="group inline-flex items-center gap-3 bg-accent px-7 py-4 font-semibold text-accent-ink"
            >
              Start a project
              <ArrowUpRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>

          {/* NOW + signature — the closing beat */}
          <div className="grid gap-10 border-t border-border pt-12 md:grid-cols-[1fr_1.1fr]">
            <div>
              <div className="hud mb-6">/ Now</div>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <span className="mt-1.5 h-2 w-2 shrink-0 animate-pulse rounded-full bg-accent" />
                  <div>
                    <div className="hud">Building</div>
                    <div className="text-sm text-fg">{content.now.building}</div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-fg-faint" />
                  <div>
                    <div className="hud">Learning</div>
                    <div className="text-sm text-fg">{content.now.learning}</div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-signal" />
                  <div>
                    <div className="hud">Status</div>
                    <div className="text-sm text-fg">{content.now.status}</div>
                  </div>
                </li>
              </ul>
            </div>

            <div className="flex items-end justify-between gap-6">
              <div>
                <div className="hud mb-3">Signed</div>
                <Signature className="max-w-md" />
                <div className="mt-3 font-mono text-xs text-fg-faint">
                  {site.name} · Full-Stack Engineer
                </div>
              </div>
              <div className="brackets hidden shrink-0 p-1.5 sm:block">
                <div className="relative h-28 w-24 overflow-hidden">
                  <Image
                    src="/personal/portrait-01.webp"
                    alt={site.name}
                    fill
                    sizes="96px"
                    className="img-duotone object-cover"
                  />
                  <div className="tint-accent absolute inset-0 opacity-40" />
                </div>
              </div>
            </div>
          </div>

          {/* index */}
          <div className="grid gap-10 border-t border-border pt-10 md:grid-cols-[1.5fr_1fr_1fr]">
            <div>
              <div className="hud mb-4">Index</div>
              <div className="flex flex-col gap-1.5">
                <Link href="/" className="w-fit text-sm text-fg-muted hover:text-fg">Home</Link>
                {nav.map((n) => (
                  <Link key={n.href} href={n.href} className="w-fit text-sm text-fg-muted hover:text-fg">
                    {n.label}
                  </Link>
                ))}
                <Link href="/stats" className="w-fit text-sm text-accent hover:underline">Live stats ●</Link>
              </div>
            </div>
            <div>
              <div className="hud mb-4">Elsewhere</div>
              <div className="flex flex-wrap gap-2">
                <a href={site.social.github} target="_blank" rel="noopener noreferrer" className="sweep border border-border px-4 py-2 text-sm text-fg-muted">GitHub</a>
                <a href={site.social.linkedin} target="_blank" rel="noopener noreferrer" className="sweep border border-border px-4 py-2 text-sm text-fg-muted">LinkedIn</a>
                <a href={site.social.email} className="sweep border border-border px-4 py-2 text-sm text-fg-muted">Email</a>
              </div>
            </div>
            <div>
              <div className="hud mb-4">Colophon</div>
              <p className="text-sm leading-relaxed text-fg-muted">
                Built with Next.js, React Three Fiber &amp; GSAP. Designed and engineered
                end-to-end by {site.name.split(" ")[0]}.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-8">
            <p className="font-mono text-xs text-fg-faint">© {year} {site.name}. All rights reserved.</p>
            <p className="font-mono text-xs text-fg-faint">{content.location} · {content.availability}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
