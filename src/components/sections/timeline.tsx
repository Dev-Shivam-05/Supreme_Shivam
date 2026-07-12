"use client";

import { motion, useReducedMotion } from "motion/react";
import { timeline } from "@/lib/site";

export function Timeline() {
  const reduced = useReducedMotion();
  return (
    <section className="container-x border-t border-border py-20 md:py-28">
      <div className="mb-12">
        <p className="hud tick mb-6">Trajectory</p>
        <h2 className="font-poster display-3">
          Where I&apos;ve <span className="text-accent">been.</span>
        </h2>
      </div>
      <div className="border-t border-border">
        {timeline.map((t, i) => (
          <motion.div
            key={i}
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 20 }}
            whileInView={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "0px 0px -12% 0px" }}
            transition={{ duration: 0.55, ease: [0.7, 0, 0.1, 1], delay: i * 0.06 }}
            className="group grid gap-3 border-b border-border py-8 md:grid-cols-[11rem_1fr] md:gap-10"
          >
            <div className="font-mono text-sm text-accent">{t.period}</div>
            <div>
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h3 className="font-poster text-2xl transition-transform duration-300 group-hover:translate-x-1 md:text-3xl">
                  {t.title}
                </h3>
                <span className="hud">{t.org}</span>
              </div>
              <p className="mt-3 max-w-2xl text-fg-muted">{t.body}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
