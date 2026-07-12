"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import Link from "next/link";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { useRef } from "react";
import { HeroCanvas } from "./hero-canvas";
import { HeroReveal } from "./hero-reveal";
import { Magnetic } from "@/components/ux/magnetic";
import { type SiteContent } from "@/lib/site";

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

export function Hero({ content }: { content: SiteContent }) {
  const telemetry = [
    { k: "Role", v: "Full-Stack Engineer" },
    { k: "Base", v: content.location },
    { k: "Stack", v: "MERN · Next · Realtime" },
    { k: "Status", v: content.status },
  ];
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, reduced ? 0 : -160]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <section ref={ref} className="relative flex min-h-[100svh] flex-col justify-center overflow-hidden pt-28">
      <HeroCanvas />
      <div className="grid-bg pointer-events-none absolute inset-0 -z-10 opacity-50" />
      <HeroReveal />

      {/* HUD corners — CSS fade so nothing large blocks on hydration */}
      <div
        className="hero-fade container-x pointer-events-none absolute inset-x-0 top-24 z-10 hidden justify-between sm:flex"
        style={{ animationDelay: "0.8s" }}
      >
        <span className="hud">LAT 26.2°N · IND</span>
        <span className="hud tick hud-accent">{content.availability}</span>
      </div>

      <motion.div style={{ y, opacity }} className="container-x relative z-10">
        <div className="hero-fade mb-8 flex items-center gap-3" style={{ animationDelay: "0.1s" }}>
          <span className="hud tick">Portfolio</span>
          <span className="hud">// {content.roleLong}</span>
        </div>

        <h1 className="font-poster display-1">
          <PosterLine delay={0.15}>Shivam</PosterLine>
          <PosterLine delay={0.28}>
            <span className="text-accent">Bhadoriya</span>
          </PosterLine>
        </h1>

        <div className="mt-8 flex flex-wrap items-end justify-between gap-x-12 gap-y-8">
          <p
            className="hero-fade max-w-lg text-lg leading-relaxed text-fg-muted"
            style={{ animationDelay: "0.32s" }}
          >
            {content.heroLead}
          </p>

          <div className="hero-fade flex items-center gap-3" style={{ animationDelay: "0.42s" }}>
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
      </motion.div>

      {/* telemetry strip */}
      <div className="hero-fade container-x absolute inset-x-0 bottom-8 z-10" style={{ animationDelay: "0.9s" }}>
        <div className="flex flex-wrap items-center justify-between gap-6 border-t border-border pt-5">
          <div className="flex items-center gap-2 text-fg-faint">
            <ArrowDown className="h-4 w-4 animate-bounce" />
            <span className="hud">Scroll</span>
          </div>
          <div className="hidden gap-8 md:flex">
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
