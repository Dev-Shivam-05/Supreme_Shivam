"use client";

import { motion } from "motion/react";

/**
 * Runs on every route change — a quick, tasteful page-in fade.
 * Opacity-only on purpose: a residual transform would create a containing
 * block and break `position: sticky` (the horizontal work drive) inside.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.45, ease: [0.7, 0, 0.1, 1] }}
    >
      {children}
    </motion.div>
  );
}
