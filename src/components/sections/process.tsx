"use client";

import { motion, useReducedMotion } from "motion/react";
import { process } from "@/lib/site";

export function Process() {
  const reduced = useReducedMotion();
  return (
    <section className="border-y border-border bg-bg-elev">
      <div className="container-x py-24 md:py-32">
        <div className="mb-16 flex flex-wrap items-end justify-between gap-6">
          <h2 className="font-poster display-3 leading-[0.9]">
            How I <span className="text-accent">work.</span>
          </h2>
          <p className="hud">Repeatable · measured · shipped</p>
        </div>

        <div className="grid gap-px overflow-hidden border border-border bg-border md:grid-cols-4">
          {process.map((step, i) => (
            <motion.div
              key={step.n}
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 24 }}
              whileInView={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "0px 0px -8% 0px" }}
              transition={{ duration: 0.55, ease: [0.7, 0, 0.1, 1], delay: i * 0.08 }}
              className="group relative bg-bg p-8"
            >
              <div className="font-mono text-sm text-accent">{step.n}</div>
              <div className="mt-8 h-px w-full bg-border">
                <div className="h-px w-0 bg-accent transition-all duration-700 group-hover:w-full" />
              </div>
              <h3 className="mt-6 font-poster text-2xl">{step.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-fg-muted">{step.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
