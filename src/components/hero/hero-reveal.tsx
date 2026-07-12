"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { useIsTouch, usePrefersReducedMotion } from "@/lib/hooks";

/**
 * Lando-style reveal: a portrait bleeds through only in a circle around the
 * cursor, warped by an SVG liquid displacement filter. Hover-only; off on
 * touch / reduced-motion. pointer-events-none so it never blocks the hero UI.
 */
export function HeroReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const touch = useIsTouch();
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (touch || reduced) return;
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    let tx = 0.5, ty = 0.5, cx = 0.5, cy = 0.5, target = 0, cur = 0;
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const inside = e.clientY >= r.top && e.clientY <= r.bottom;
      tx = e.clientX - r.left;
      ty = e.clientY - r.top;
      target = inside ? 1 : 0;
    };
    const loop = () => {
      cx += (tx - cx) * 0.18;
      cy += (ty - cy) * 0.18;
      cur += (target - cur) * 0.08;
      el.style.setProperty("--mx", `${cx}px`);
      el.style.setProperty("--my", `${cy}px`);
      el.style.setProperty("--o", `${cur}`);
      raf = requestAnimationFrame(loop);
    };
    window.addEventListener("mousemove", onMove);
    raf = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, [touch, reduced]);

  if (touch || reduced) return null;

  const mask =
    "radial-gradient(circle 200px at var(--mx, 50%) var(--my, 50%), #000 0%, #000 32%, transparent 72%)";

  return (
    <div ref={ref} className="pointer-events-none absolute inset-0 z-[1] overflow-hidden">
      <svg className="absolute h-0 w-0" aria-hidden>
        <filter id="heroLiquid">
          <feTurbulence type="fractalNoise" baseFrequency="0.012 0.02" numOctaves={2} seed={7} result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale={24} xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>
      <div
        className="absolute inset-0"
        style={{
          opacity: "var(--o, 0)",
          maskImage: mask,
          WebkitMaskImage: mask,
          filter: "url(#heroLiquid)",
        }}
      >
        <Image
          src="/personal/portrait-02.webp"
          alt=""
          fill
          loading="lazy"
          sizes="(max-width: 768px) 0px, 100vw"
          className="img-duotone object-cover object-[70%_center] opacity-90"
        />
        <div className="tint-accent absolute inset-0 opacity-50" />
      </div>
    </div>
  );
}
