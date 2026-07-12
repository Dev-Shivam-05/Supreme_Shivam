"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ProjectCover } from "@/components/work/project-cover";
import { useIsMobile } from "@/lib/hooks";
import { type Project } from "@/lib/site";
import { cn } from "@/lib/utils";

function ProjectCard({ p, full = false }: { p: Project; full?: boolean }) {
  return (
    <Link
      href={`/work/${p.slug}`}
      className={cn(
        "group relative flex h-full flex-col overflow-hidden border border-border bg-bg-elev transition-colors hover:border-accent",
        full ? "w-full" : "w-[86vw] shrink-0 md:w-[40rem]",
      )}
      data-cursor
    >
      <div className="relative h-[45%] overflow-hidden">
        <ProjectCover pattern={p.pattern} index={p.index} imageUrl={p.imageUrl} className="h-full" />
        <div className="spotlight pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        {p.flagship && (
          <span className="absolute left-5 top-5 bg-accent px-2.5 py-1 font-mono text-[0.6rem] font-semibold uppercase tracking-widest text-accent-ink">
            ● Flagship
          </span>
        )}
        <span className="absolute right-5 top-5 grid h-10 w-10 place-items-center border border-border bg-bg/50 text-fg backdrop-blur-sm transition-colors group-hover:border-transparent group-hover:bg-accent group-hover:text-accent-ink">
          <ArrowUpRight className="h-4 w-4" />
        </span>
      </div>

      <div className="flex flex-1 flex-col justify-between p-8 md:p-10">
        <div>
          <p className="hud">{p.category} · {p.year}</p>
          <h3 className="mt-3 font-poster text-4xl md:text-5xl">{p.title}</h3>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-fg-muted">{p.summary}</p>
        </div>

        <div className="mt-6 flex items-end justify-between gap-6 border-t border-border pt-5">
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {p.metrics.slice(0, 2).map((m) => (
              <div key={m.label}>
                <div className="font-poster text-xl text-accent">{m.value}</div>
                <div className="hud mt-0.5">{m.label}</div>
              </div>
            ))}
          </div>
          <div className="hidden flex-wrap justify-end gap-1.5 sm:flex">
            {p.stack.slice(0, 3).map((s) => (
              <span key={s} className="border border-border px-2.5 py-1 font-mono text-xs text-fg-muted">
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
}

function Header() {
  return (
    <div className="w-[85vw] shrink-0 pr-4 md:w-[34rem]">
      <p className="hud tick mb-6">01 — Selected Work</p>
      <h2 className="font-poster display-2 leading-[0.85]">
        Systems that
        <br />
        <span className="text-accent">ship &amp; scale.</span>
      </h2>
      <p className="mt-8 max-w-sm text-fg-muted">
        Real constraints, measurable outcomes, inspectable engineering. Drag through, or hit{" "}
        <kbd className="border border-border px-1.5 py-0.5 font-mono text-[0.7rem]">⌘K</kbd> to
        jump anywhere.
      </p>
    </div>
  );
}

export function FeaturedWork({ projects }: { projects: Project[] }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const mobile = useIsMobile();
  const stacked = reduced || mobile;
  const [dims, setDims] = useState({ distance: 0, height: 0 });

  const { scrollYProgress } = useScroll({ target: wrapRef, offset: ["start start", "end end"] });
  const x = useTransform(scrollYProgress, [0, 1], [0, -dims.distance]);

  useEffect(() => {
    if (stacked) return;
    const measure = () => {
      const track = trackRef.current;
      if (!track) return;
      const distance = Math.max(0, track.scrollWidth - window.innerWidth + 32);
      setDims({ distance, height: distance + window.innerHeight });
    };
    measure();
    window.addEventListener("resize", measure);
    const t = setTimeout(measure, 300);
    return () => {
      window.removeEventListener("resize", measure);
      clearTimeout(t);
    };
  }, [stacked]);

  if (stacked) {
    return (
      <section id="work" className="container-x py-16 md:py-24">
        <Header />
        <div className="mt-12 grid gap-5">
          {projects.map((p) => (
            <div key={p.slug} className="h-[26rem] sm:h-[32rem]">
              <ProjectCard p={p} full />
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section ref={wrapRef} style={{ height: dims.height || undefined }} className="relative">
      <div className="sticky top-0 flex h-[100svh] items-center overflow-hidden">
        <motion.div ref={trackRef} style={{ x }} className="flex items-stretch gap-6 pl-[max(1.25rem,4vw)]">
          <div className="flex items-center">
            <Header />
          </div>
          {projects.map((p) => (
            <div key={p.slug} className="h-[72vh] max-h-[40rem]">
              <ProjectCard p={p} />
            </div>
          ))}
          <div className="flex w-[24vw] shrink-0 items-center">
            <Link href="/work" className="group inline-flex items-center gap-2 font-mono text-sm text-fg-faint transition-colors hover:text-accent">
              View all work
              <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
