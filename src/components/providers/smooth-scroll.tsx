"use client";

import Lenis from "lenis";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { usePrefersReducedMotion } from "@/lib/hooks";

type ScrollTo = (target: string | number | HTMLElement, opts?: { offset?: number }) => void;
const ScrollContext = createContext<{ scrollTo: ScrollTo }>({ scrollTo: () => {} });

export const useSmoothScroll = () => useContext(ScrollContext);

export function SmoothScroll({ children }: { children: ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      touchMultiplier: 1.8,
      wheelMultiplier: 1,
    });
    lenisRef.current = lenis;
    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [reduced]);

  const scrollTo: ScrollTo = (target, opts) => {
    const offset = opts?.offset ?? -80;
    if (lenisRef.current) {
      lenisRef.current.scrollTo(target as string, { offset });
      return;
    }
    // reduced-motion / native fallback
    const el =
      typeof target === "string" ? document.querySelector(target) : target;
    if (el instanceof HTMLElement) {
      window.scrollTo({ top: el.offsetTop + offset, behavior: "smooth" });
    } else if (typeof target === "number") {
      window.scrollTo({ top: target + offset, behavior: "smooth" });
    }
  };

  return (
    <ScrollContext.Provider value={{ scrollTo }}>{children}</ScrollContext.Provider>
  );
}
