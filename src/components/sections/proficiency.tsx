"use client";

import { motion, useReducedMotion } from "motion/react";
import { proficiency } from "@/lib/site";

export function Proficiency() {
  const reduced = useReducedMotion();
  return (
    <section className="container-x border-t border-border py-20 md:py-28">
      <div className="mb-12">
        <p className="hud tick mb-6">Telemetry</p>
        <h2 className="font-poster display-3">
          Where I&apos;m <span className="text-accent">quick.</span>
        </h2>
      </div>
      <div className="grid gap-x-16 gap-y-8 md:grid-cols-2">
        {proficiency.map((p, i) => (
          <div key={p.name}>
            <div className="mb-2 flex items-baseline justify-between">
              <span className="font-display text-sm font-medium text-fg">{p.name}</span>
              <span className="hud">{p.years}</span>
            </div>
            <div className="h-2 w-full overflow-hidden bg-border">
              <motion.div
                className="h-full bg-accent"
                initial={{ width: reduced ? `${p.level}%` : 0 }}
                whileInView={{ width: `${p.level}%` }}
                viewport={{ once: true, margin: "0px 0px -10% 0px" }}
                transition={{ duration: 1.1, ease: [0.7, 0, 0.1, 1], delay: i * 0.05 }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
