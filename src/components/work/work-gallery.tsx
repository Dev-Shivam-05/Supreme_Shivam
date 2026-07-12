"use client";

import Link from "next/link";
import { motion, useMotionValue, useReducedMotion, useSpring } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { useRef, useState } from "react";
import { ProjectCover } from "./project-cover";
import { useIsTouch } from "@/lib/hooks";
import { type Project } from "@/lib/site";
import { cn } from "@/lib/utils";

function Card({
  p,
  wide,
  dimmed,
  onHover,
}: {
  p: Project;
  wide: boolean;
  dimmed: boolean;
  onHover: (hovering: boolean) => void;
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  const reduced = useReducedMotion();
  const touch = useIsTouch();
  const rx = useSpring(useMotionValue(0), { stiffness: 140, damping: 15, mass: 0.35 });
  const ry = useSpring(useMotionValue(0), { stiffness: 140, damping: 15, mass: 0.35 });

  const onMove = (e: React.MouseEvent) => {
    if (reduced || touch || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    ry.set(px * 11);
    rx.set(-py * 11);
    ref.current.style.setProperty("--mx", `${((e.clientX - r.left) / r.width) * 100}%`);
    ref.current.style.setProperty("--my", `${((e.clientY - r.top) / r.height) * 100}%`);
  };
  const reset = () => {
    rx.set(0);
    ry.set(0);
    onHover(false);
  };

  return (
    <motion.div
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 1100 }}
      animate={{ opacity: dimmed ? 0.35 : 1, scale: dimmed ? 0.985 : 1 }}
      transition={{ duration: 0.4, ease: [0.7, 0, 0.1, 1] }}
      className={cn(wide && "md:col-span-2")}
    >
      <Link
        ref={ref}
        href={`/work/${p.slug}`}
        onMouseMove={onMove}
        onMouseEnter={() => onHover(true)}
        onMouseLeave={reset}
        data-cursor
        className={cn(
          "group relative block overflow-hidden border border-border transition-[border-color,box-shadow] duration-300 [transform-style:preserve-3d] hover:border-accent",
          "hover:shadow-[0_0_50px_-12px_color-mix(in_oklch,var(--accent)_45%,transparent)]",
          wide ? "aspect-[16/9] md:aspect-[16/7]" : "aspect-[4/3]",
        )}
      >
        <ProjectCover pattern={p.pattern} index={p.index} imageUrl={p.imageUrl} className="absolute inset-0 h-full" />

        {/* glossy pointer sheen */}
        <div className="spotlight pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {/* top chrome */}
        {p.flagship && (
          <span className="absolute left-4 top-4 z-20 inline-flex items-center gap-1.5 bg-accent px-2.5 py-1 font-mono text-[0.6rem] font-semibold uppercase tracking-widest text-accent-ink">
            ● Flagship
          </span>
        )}
        <span className="absolute right-4 top-4 z-20 grid h-10 w-10 place-items-center border border-border bg-bg/40 text-fg backdrop-blur-sm transition-colors group-hover:border-transparent group-hover:bg-accent group-hover:text-accent-ink">
          <ArrowUpRight className="h-4 w-4" />
        </span>

        {/* rest-state label (hidden on touch — the panel below shows everything) */}
        <div
          className={cn(
            "absolute inset-x-0 bottom-0 z-10 p-5 transition-opacity duration-300 md:p-6",
            touch ? "hidden" : "group-hover:opacity-0",
          )}
        >
          <div className="hud mb-1.5">{p.category} · {p.year}</div>
          <h3 className="font-poster text-3xl leading-none md:text-4xl">{p.title}</h3>
        </div>

        {/* reveal panel — slides up on hover; always shown on touch */}
        <div
          className={cn(
            "absolute inset-0 z-10 flex flex-col justify-end bg-gradient-to-t from-bg-elev via-bg-elev/95 to-bg-elev/30 p-5 transition-transform duration-500 ease-[cubic-bezier(0.7,0,0.1,1)] md:p-7",
            touch ? "translate-y-0 bg-gradient-to-t from-bg-elev to-transparent" : "translate-y-full group-hover:translate-y-0",
          )}
        >
          <div className="hud mb-1.5">{p.category} · {p.year}</div>
          <h3 className="font-poster text-3xl leading-none md:text-4xl">{p.title}</h3>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-fg-muted">{p.summary}</p>

          <div className="mt-5 flex flex-wrap items-end gap-x-6 gap-y-3 border-t border-border pt-4">
            {p.metrics.slice(0, 3).map((m) => (
              <div key={m.label}>
                <div className="font-poster text-xl text-accent">{m.value}</div>
                <div className="hud">{m.label}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-1.5">
            {p.stack.slice(0, wide ? 6 : 4).map((s) => (
              <span key={s} className="border border-border px-2 py-0.5 font-mono text-[0.6rem] text-fg-muted">
                {s}
              </span>
            ))}
          </div>
          <div className="mt-5 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-accent">
            View case study <ArrowUpRight className="h-3.5 w-3.5" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export function WorkGallery({ projects }: { projects: Project[] }) {
  const [hovered, setHovered] = useState<number | null>(null);
  return (
    <section className="container-x pb-20 md:pb-24">
      <div className="grid gap-4 sm:gap-5 md:grid-cols-2">
        {projects.map((p, i) => (
          <Card
            key={p.slug}
            p={p}
            wide={p.flagship === true}
            dimmed={hovered !== null && hovered !== i}
            onHover={(h) => setHovered(h ? i : null)}
          />
        ))}
      </div>
    </section>
  );
}
