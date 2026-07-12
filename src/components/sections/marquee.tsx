"use client";

import { motion, useReducedMotion } from "motion/react";

const TECH = [
  "React", "TypeScript", "Node.js", "Express", "MongoDB", "PostgreSQL",
  "Next.js", "Socket.io", "Tailwind", "GSAP", "Three.js", "Redis",
  "Docker", "AWS", "Vercel", "Zod", "REST", "JWT",
];

export function Marquee() {
  const reduced = useReducedMotion();
  const row = [...TECH, ...TECH];

  return (
    <section
      aria-hidden
      className="hairline border-b border-border py-6 overflow-hidden"
    >
      <motion.div
        className="flex w-max gap-10 whitespace-nowrap"
        animate={reduced ? undefined : { x: ["0%", "-50%"] }}
        transition={{ duration: 32, ease: "linear", repeat: Infinity }}
      >
        {row.map((t, i) => (
          <span key={i} className="flex items-center gap-10 font-mono text-sm text-fg-faint">
            {t}
            <span className="h-1 w-1 rounded-full bg-accent/60" />
          </span>
        ))}
      </motion.div>
    </section>
  );
}
