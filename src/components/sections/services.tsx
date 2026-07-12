"use client";

import { motion, useReducedMotion } from "motion/react";
import { services } from "@/lib/site";

export function Services() {
  const reduced = useReducedMotion();
  return (
    <section className="container-x border-t border-border py-24 md:py-32">
      <div className="mb-14 flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="hud tick mb-6">What I do</p>
          <h2 className="font-poster display-2 leading-[0.85]">
            Services on
            <br />
            <span className="text-accent">the grid.</span>
          </h2>
        </div>
        <p className="max-w-sm text-fg-muted">
          Four ways I plug into a team — from a full product build to a focused performance
          rescue.
        </p>
      </div>

      <div className="grid gap-px overflow-hidden border border-border bg-border md:grid-cols-2">
        {services.map((s, i) => (
          <motion.div
            key={s.index}
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 24 }}
            whileInView={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "0px 0px -10% 0px" }}
            transition={{ duration: 0.6, ease: [0.7, 0, 0.1, 1], delay: i * 0.06 }}
            className="group relative bg-bg-elev p-8 transition-colors hover:bg-surface md:p-10"
          >
            <div className="flex items-start justify-between">
              <span className="font-poster text-3xl text-fg-faint transition-colors group-hover:text-accent">
                {s.index}
              </span>
              <div className="flex flex-wrap justify-end gap-1.5">
                {s.tags.map((t) => (
                  <span key={t} className="border border-border px-2.5 py-1 font-mono text-[0.65rem] text-fg-muted">
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <h3 className="mt-10 font-poster text-3xl md:text-4xl">{s.title}</h3>
            <p className="mt-4 max-w-md text-fg-muted">{s.body}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
