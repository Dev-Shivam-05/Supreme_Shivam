"use client";

import { useEffect, useRef } from "react";
import { signatureText } from "@/lib/site";
import { SIGNATURE_PATH, SIGNATURE_VIEWBOX } from "@/lib/signature-path";
import { cn } from "@/lib/utils";

/**
 * The signature is a real SVG path (the S.D.Bhadoriya glyphs, generated from the
 * Sacramento font). It draws stroke-by-stroke, left-to-right, scrubbed by scroll —
 * the pen follows the path as you scroll it into view, like a real handwritten
 * signature. We read the element's live position each frame (rather than framer's
 * cached offsets) so it stays correct under Lenis smooth-scroll and late layout
 * shifts. pathLength=1 normalises the geometry so the dash math is exact.
 */
export function Signature({ className }: { className?: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const path = pathRef.current;
    if (!wrap || !path) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      path.style.strokeDashoffset = "0";
      return;
    }

    let raf = 0;
    const draw = () => {
      raf = 0;
      const r = wrap.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      // start drawing when the top hits 92% of the viewport, finish by 42%
      const start = vh * 0.92;
      const end = vh * 0.42;
      const p = Math.min(1, Math.max(0, (start - r.top) / (start - end)));
      path.style.strokeDashoffset = String(1 - p);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(draw);
    };

    draw();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={wrapRef} className={cn("w-full max-w-md", className)} role="img" aria-label={`${signatureText}, signature`}>
      <svg viewBox={SIGNATURE_VIEWBOX} className="w-full overflow-visible">
        <path
          ref={pathRef}
          d={SIGNATURE_PATH}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={5}
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1}
        />
      </svg>
    </div>
  );
}
