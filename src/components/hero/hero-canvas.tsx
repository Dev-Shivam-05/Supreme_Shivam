"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { useIsMobile, useMounted, usePrefersReducedMotion } from "@/lib/hooks";
import { WebGLBoundary } from "./webgl-boundary";

const ShaderScene = dynamic(() => import("./shader-scene"), { ssr: false });

/**
 * Liquid CSS fallback (mobile / reduced-motion / no-WebGL): two blurred lime
 * blobs drifting over carbon — the "liquid" read without a GPU cost.
 */
function LiquidFallback({ animate }: { animate: boolean }) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div
        className="absolute left-[20%] top-[24%] h-[45vh] w-[45vh] rounded-full blur-[60px]"
        style={{
          background: "radial-gradient(circle, color-mix(in oklch, var(--accent) 40%, transparent), transparent 70%)",
          animation: animate ? "blob-a 14s ease-in-out infinite" : undefined,
        }}
      />
      <div
        className="absolute right-[16%] top-[54%] h-[38vh] w-[38vh] rounded-full blur-[70px]"
        style={{
          background: "radial-gradient(circle, color-mix(in oklch, var(--accent-2) 34%, transparent), transparent 70%)",
          animation: animate ? "blob-b 18s ease-in-out infinite" : undefined,
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_50%,transparent,var(--bg)_78%)]" />
    </div>
  );
}

export function HeroCanvas() {
  const mounted = useMounted();
  const reduced = usePrefersReducedMotion();
  const mobile = useIsMobile();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(true);

  // Pause the shader's render loop while the hero is scrolled out of view (saves GPU/battery).
  useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // WebGL only on capable desktops; phones + reduced-motion get the CSS liquid.
  const useWebGL = mounted && !reduced && !mobile;
  const fallback = <LiquidFallback animate={mounted && !reduced} />;

  return (
    <div ref={wrapRef} className="absolute inset-0 -z-10 overflow-hidden">
      {useWebGL ? (
        <WebGLBoundary fallback={fallback}>
          <ShaderScene active={inView} />
        </WebGLBoundary>
      ) : (
        fallback
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-bg/20 via-transparent to-bg" />
    </div>
  );
}
