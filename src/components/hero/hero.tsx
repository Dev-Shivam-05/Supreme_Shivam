"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import Link from "next/link";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { useRef } from "react";
import { HeroCanvas } from "./hero-canvas";
import { HeroReveal } from "./hero-reveal";
import { Magnetic } from "@/components/ux/magnetic";
import { site, type PublicContent } from "@/lib/site";

function PosterLine({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  // CSS animation (not motion) so the LCP headline paints without waiting on JS
  return (
    <span className="block overflow-hidden">
      <span className="poster-line block" style={{ animationDelay: `${delay}s` }}>
        {children}
      </span>
    </span>
  );
}

export function Hero({ content }: { content: PublicContent }) {
  const telemetry = [
    { k: "Role", v: site.role },
    { k: "Company", v: site.company },
    { k: "Base", v: content.location },
    { k: "Status", v: content.status },
  ];
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, reduced ? 0 : -160]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <section ref={ref} className="relative flex min-h-[100svh] flex-col overflow-hidden pb-8 pt-28">
      <HeroCanvas />
      <div className="grid-bg pointer-events-none absolute inset-0 -z-10 opacity-50" />
      <HeroReveal />

      {/* HUD corners — CSS fade so nothing large blocks on hydration */}
      <div
        className="hero-fade container-x pointer-events-none absolute inset-x-0 top-24 z-10 hidden justify-between sm:flex"
        style={{ animationDelay: "0.8s" }}
      >
        <span className="hud">{site.address.locality} · {site.latitude}</span>
        <span className="hud tick hud-accent">{content.availability}</span>
      </div>

      <motion.div style={{ y, opacity }} className="container-x relative z-10 flex flex-1 items-center">
        {/* Two columns from lg up: the name keeps the poster scale, and the
            portrait fills the dead space beside it rather than pushing the call
            to action below the fold. */}
        <div className="grid w-full gap-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-14">
          <div>
            <div className="hero-fade mb-6 flex items-center gap-3" style={{ animationDelay: "0.1s" }}>
              <span className="hud tick">{site.role}</span>
              <span className="hud">{"//"} {site.company}</span>
            </div>

            {/* The one <h1> on the page, and the only one anywhere in the app that
                carries the name. Rendered as plain text in the server HTML — the
                animation is a CSS transform on top, never a per-character split. */}
            <h1 className="font-poster display-hero">
              <PosterLine delay={0.15}>Shivam</PosterLine>
              <PosterLine delay={0.28}>
                <span className="text-accent">Bhadoriya</span>
              </PosterLine>
            </h1>

            <h2
              className="hero-fade mt-6 max-w-2xl font-display text-lg font-medium leading-snug text-fg md:text-2xl"
              style={{ animationDelay: "0.3s" }}
            >
              {content.roleLong}
            </h2>

            <p
              className="hero-fade mt-6 max-w-xl text-base leading-relaxed text-fg-muted md:text-lg"
              style={{ animationDelay: "0.36s" }}
            >
              {content.heroLead}
            </p>

            <div className="hero-fade mt-8 flex flex-wrap items-center gap-3" style={{ animationDelay: "0.46s" }}>
              <Magnetic>
                <Link
                  href="/work"
                  className="group inline-flex items-center gap-2 bg-accent px-6 py-3.5 text-sm font-semibold text-accent-ink"
                >
                  Explore the grid
                  <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
              </Magnetic>
              <Magnetic strength={0.4}>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 border border-border px-6 py-3.5 text-sm text-fg-muted transition-colors hover:border-accent hover:text-fg"
                >
                  Contact
                </Link>
              </Magnetic>
            </div>
          </div>

          {/* His face, as a plain <img> on a stable path. Deliberately NOT
              next/image and NOT inside the WebGL canvas: an image that only
              exists at /_next/image?url=… or after a GSAP timeline carries no
              filename signal and may never be indexed at all. */}
          <figure
            className="hero-fade brackets w-44 shrink-0 p-1.5 sm:w-52 lg:w-[clamp(13rem,19vw,18rem)]"
            style={{ animationDelay: "0.56s" }}
          >
            <div className="relative overflow-hidden border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element -- stable,
                  name-carrying /images/… path is the point; next/image rewrites it to
                  /_next/image?url=… which carries no filename signal for image search. */}
              <img
                src={site.images.portrait}
                alt={site.images.alt}
                width={576}
                height={1024}
                // eager, but not fetchPriority="high": React emits a <link rel=preload>
                // for a high-priority image, which put 100KB ahead of the stylesheet and
                // the fonts. The portrait is above the fold but it is not the LCP element.
                loading="eager"
                decoding="async"
                className="img-duotone block aspect-[4/5] w-full object-cover object-top"
              />
              <div className="tint-accent absolute inset-0 opacity-25" />
              <div className="scanlines pointer-events-none absolute inset-0 opacity-50" />
              <div className="absolute inset-0 bg-gradient-to-t from-bg/85 to-transparent" />
              <figcaption className="absolute inset-x-0 bottom-0 flex items-center justify-between p-3">
                <span className="hud hud-accent">{site.name}</span>
              </figcaption>
            </div>
          </figure>
        </div>
      </motion.div>

      {/* telemetry strip — in the flow, so it can never sit on top of the portrait */}
      <div className="hero-fade container-x relative z-10 mt-10" style={{ animationDelay: "0.9s" }}>
        <div className="flex flex-wrap items-center justify-between gap-6 border-t border-border pt-5">
          <div className="flex items-center gap-2 text-fg-faint">
            <ArrowDown className="h-4 w-4 animate-bounce" />
            <span className="hud">Scroll</span>
          </div>
          <div className="hidden gap-8 lg:flex">
            {telemetry.map((t) => (
              <div key={t.k} className="flex flex-col">
                <span className="hud">{t.k}</span>
                <span className="mt-1 font-mono text-xs text-fg">{t.v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
