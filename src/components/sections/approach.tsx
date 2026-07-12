"use client";

import { motion, useReducedMotion } from "motion/react";
import { approach } from "@/lib/site";

export function Approach() {
  const reduced = useReducedMotion();
  return (
    <section id="approach" className="container-x border-t border-border py-24 md:py-36">
      <p className="eyebrow mb-6">04 — Approach</p>
      <h2 className="display-3 mb-16 max-w-xl font-display font-bold">
        What makes it <span className="serif-accent">different.</span>
      </h2>

      <div className="divide-y divide-border border-y border-border">
        {approach.map((a, i) => (
          <motion.div
            key={a.title}
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 24 }}
            whileInView={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "0px 0px -15% 0px" }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: i * 0.05 }}
            className="group grid grid-cols-1 gap-4 py-8 md:grid-cols-[6rem_1fr_1.2fr] md:items-baseline md:gap-10"
          >
            <span className="font-mono text-sm text-fg-faint">0{i + 1}</span>
            <h3 className="font-display text-2xl font-bold tracking-tight transition-transform duration-300 group-hover:translate-x-1 md:text-3xl">
              {a.title}
            </h3>
            <p className="max-w-md text-fg-muted">{a.body}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
