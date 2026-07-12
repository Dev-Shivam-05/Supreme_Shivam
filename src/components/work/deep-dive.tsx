"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Serves two readers from one page: recruiters skim, engineers dig.
 * The architecture is collapsed to a one-line teaser by default; one tap
 * reveals the full technical layer.
 */
export function DeepDive({ count, children }: { count: number; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-t border-border py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h2 className="hud tick">Architecture</h2>
        <div className="inline-flex border border-border p-0.5 font-mono text-xs">
          <button
            onClick={() => setOpen(false)}
            className={cn("px-3 py-1.5 transition-colors", !open ? "bg-accent text-accent-ink" : "text-fg-muted hover:text-fg")}
          >
            Recruiter
          </button>
          <button
            onClick={() => setOpen(true)}
            className={cn("px-3 py-1.5 transition-colors", open ? "bg-accent text-accent-ink" : "text-fg-muted hover:text-fg")}
          >
            Engineer
          </button>
        </div>
      </div>
      <AnimatePresence initial={false} mode="wait">
        {open ? (
          <motion.div
            key="deep"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4, ease: [0.7, 0, 0.1, 1] }}
            className="overflow-hidden"
          >
            {children}
          </motion.div>
        ) : (
          <motion.p
            key="teaser"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="max-w-2xl text-lg leading-relaxed text-fg-muted"
          >
            {count} architecture decisions documented. Switch to{" "}
            <span className="text-accent">Engineer view</span> to inspect the system underneath.
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
