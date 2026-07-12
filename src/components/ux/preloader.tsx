"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Brand cold-open (Lando-style): a cursive SB monogram draws itself on bright
 * lime with "LOAD SHIVAM", then the panel wipes up to reveal the dark site.
 *
 * The reveal is driven ENTIRELY by CSS (see .preloader in globals.css), so it
 * plays on first paint and never waits on React hydration — that keeps it off
 * the LCP critical path. JS here only unlocks scroll when the wipe ends and
 * lets the user skip. Repeat visits in the same tab are hidden before paint by
 * the inline <head> script (html.booted .preloader { display:none }).
 */
export function Preloader() {
  const [done, setDone] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const finish = useCallback(() => {
    document.documentElement.style.overflow = "";
    setDone(true);
  }, []);

  useEffect(() => {
    // Already booted this session → nothing to do (CSS hid it pre-paint).
    let booted = false;
    try {
      booted = Boolean(sessionStorage.getItem("booted"));
    } catch {}
    if (booted) {
      setDone(true);
      return;
    }
    try {
      sessionStorage.setItem("booted", "1");
    } catch {}
    document.documentElement.style.overflow = "hidden";
    // Safety net in case the animationend event is missed.
    const t = setTimeout(finish, 1200);
    return () => {
      clearTimeout(t);
      document.documentElement.style.overflow = "";
    };
  }, [finish]);

  if (done) return null;

  return (
    <div
      ref={ref}
      className="preloader fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[#cbff3c] text-[#0a0a08]"
      onClick={finish}
      onAnimationEnd={(e) => {
        if (e.animationName === "preloader-wipe") finish();
      }}
      role="status"
      aria-label="Loading Shivam Bhadoriya"
    >
      {/* SB monogram — cursive, drawn left-to-right */}
      <div
        className="preloader-mark font-signature leading-none"
        style={{ fontSize: "clamp(7rem, 26vw, 20rem)", WebkitTextStroke: "1.5px #0a0a08" }}
      >
        SB
      </div>

      {/* progress + wordmark */}
      <div className="absolute inset-x-0 bottom-8 flex flex-col items-center gap-3">
        <div className="h-px w-40 overflow-hidden bg-[#0a0a08]/20">
          <div className="preloader-bar h-px bg-[#0a0a08]" />
        </div>
        <div className="font-poster text-sm tracking-[0.35em]">LOAD SHIVAM</div>
      </div>

      <button
        onClick={finish}
        className="absolute right-6 top-6 font-mono text-[0.7rem] uppercase tracking-[0.2em] underline-offset-4 hover:underline"
      >
        Skip →
      </button>
    </div>
  );
}
