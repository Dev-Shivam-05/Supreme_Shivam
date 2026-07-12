"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Scroll-reveal primitives. A tiny IntersectionObserver flips an `.in` class and
 * CSS does the fade/rise — no per-element framer-motion instance to hydrate, which
 * is what kept these off the main thread. Fires once, respects reduced motion via
 * the global media query in globals.css.
 */
function useInViewOnce(margin = "0px 0px -12% 0px") {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || inView) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          io.disconnect();
        }
      },
      { rootMargin: margin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [margin, inView]);
  return { ref, inView };
}

/** Fade + rise into view, once. */
export function Reveal({
  children,
  delay = 0,
  y = 28,
  className,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  const { ref, inView } = useInViewOnce();
  return (
    <div
      ref={ref}
      className={cn("reveal", inView && "in", className)}
      style={{ "--reveal-y": `${y}px`, "--reveal-delay": `${delay}s` } as CSSProperties}
    >
      {children}
    </div>
  );
}

/** Container that staggers its direct children as it enters view. */
export function Stagger({ children, className }: { children: ReactNode; className?: string }) {
  const { ref, inView } = useInViewOnce("0px 0px -10% 0px");
  return (
    <div ref={ref} className={cn("reveal-stagger", inView && "in", className)}>
      {children}
    </div>
  );
}

/** A staggered child. Must be a direct child of <Stagger>. */
export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}
