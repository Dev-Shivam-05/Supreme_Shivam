"use client";

import { motion } from "motion/react";
import { useEffect } from "react";

/**
 * Only flips after the first client render, so the server HTML and hydration both
 * see `true`. The server never runs effects, so it always renders the page visible.
 */
let firstLoad = true;

/**
 * Runs on every route change — a quick, tasteful page-in fade.
 * Opacity-only on purpose: a residual transform would create a containing
 * block and break `position: sticky` (the horizontal work drive) inside.
 *
 * Not on the first load: `initial={{ opacity: 0 }}` is written into the server
 * HTML, so the whole page stayed invisible until every script had downloaded and
 * hydrated. Nothing in <main> could be the Largest Contentful Paint; it was the
 * 32px nav badge at ~4.4 s on a throttled phone (Phase 4).
 */
export default function Template({ children }: { children: React.ReactNode }) {
  const initial = firstLoad ? false : { opacity: 0 };
  useEffect(() => {
    firstLoad = false;
  }, []);
  return (
    <motion.div
      initial={initial}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.45, ease: [0.7, 0, 0.1, 1] }}
    >
      {children}
    </motion.div>
  );
}
