"use client";

import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { type Project } from "@/lib/site";

export function WorkArchive({ projects }: { projects: Project[] }) {
  const reduced = useReducedMotion();
  return (
    <section className="container-x pb-32">
      {/* timing-board header */}
      <div className="hidden grid-cols-[3rem_1fr_10rem_3rem] items-center gap-6 border-y border-border py-3 md:grid">
        <span className="hud">Pos</span>
        <span className="hud">Project</span>
        <span className="hud">Result</span>
        <span className="hud text-right">↗</span>
      </div>

      <div>
        {projects.map((p, i) => (
          <motion.div
            key={p.slug}
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 24 }}
            whileInView={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "0px 0px -12% 0px" }}
            transition={{ duration: 0.6, ease: [0.7, 0, 0.1, 1], delay: i * 0.06 }}
          >
            <Link
              href={`/work/${p.slug}`}
              className="group relative grid grid-cols-1 items-center gap-3 overflow-hidden border-b border-border py-8 md:grid-cols-[3rem_1fr_10rem_3rem] md:gap-6 md:py-10"
            >
              <div className="pointer-events-none absolute inset-0 origin-left scale-x-0 bg-accent transition-transform duration-500 ease-[cubic-bezier(0.7,0,0.1,1)] group-hover:scale-x-100" />

              <span className="relative font-poster text-2xl text-fg-faint transition-colors group-hover:text-accent-ink md:text-3xl">
                {p.index}
              </span>

              <div className="relative">
                <h2 className="font-poster text-4xl transition-colors group-hover:text-accent-ink md:text-6xl">
                  {p.title}
                </h2>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span className="hud transition-colors group-hover:text-accent-ink/70">
                    {p.category} · {p.year}
                  </span>
                  <span className="hidden gap-2 md:flex">
                    {p.stack.slice(0, 3).map((s) => (
                      <span
                        key={s}
                        className="font-mono text-[0.65rem] text-fg-faint transition-colors group-hover:text-accent-ink/70"
                      >
                        {s}
                      </span>
                    ))}
                  </span>
                </div>
              </div>

              <div className="relative">
                <div className="font-poster text-2xl text-accent transition-colors group-hover:text-accent-ink md:text-3xl">
                  {p.metrics[0].value}
                </div>
                <div className="hud transition-colors group-hover:text-accent-ink/70">
                  {p.metrics[0].label}
                </div>
              </div>

              <div className="relative flex md:justify-end">
                <ArrowUpRight className="h-6 w-6 text-fg-faint transition-all duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-accent-ink" />
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      <p className="mt-12 max-w-xl font-mono text-sm text-fg-faint">
        More on GitHub — 50+ public repositories, a long contribution streak, and the
        occasional experiment in <Link href="/lab" className="text-accent hover:underline">the lab</Link>.
      </p>
    </section>
  );
}
