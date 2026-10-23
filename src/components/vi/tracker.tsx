"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { classifyEntry, contentIdForPath, ctaForHref, type EntryCategory } from "@/lib/vi/catalog";
import { projects } from "@/lib/site";
import { sendEvent, trackCta, useVI } from "./vi-client";

/** So a click on a project's own repo or live link reads as `case_repo` / `case_live`. */
const PROJECT_LINKS = projects.map((p) => ({ repo: p.repo, live: p.live }));

/*
 * Module-level, not state: they describe the page load, which outlives this
 * component (it unmounts on /admin and remounts on the way back).
 */
/** How the visitor arrived, captured on the landing page before any client navigation changes `location`. */
let landingEntry: EntryCategory | null = null;
/** The first view sent carries the landing entry; every later one is a navigation inside the site. */
let firstViewSent = false;
/** Guards against a double report of one view (React dev double-effects, a re-grant on the same page). */
let lastSentPath: string | null = null;

/**
 * The consented journey tracker. Renders nothing and does nothing until the
 * visitor has granted `journey`; then it reports content IDs and CTA IDs —
 * never a URL, link text, form value or keystroke (R21–R23).
 */
export function Tracker() {
  const pathname = usePathname();
  const vi = useVI();
  const tracking = vi.granted && vi.purposes.includes("journey");

  useEffect(() => {
    // `hostname`, not `host`: the classifiers compare against URL.hostname,
    // which carries no port, so `host` would misread every link on localhost.
    if (landingEntry === null) landingEntry = classifyEntry(document.referrer, location.search, location.hostname);
  }, []);

  // Runs on every route change and the moment consent arrives mid-visit, so
  // the page the visitor is on when they say yes is reported straight away.
  useEffect(() => {
    if (!tracking) {
      lastSentPath = null;
      return;
    }
    if (!pathname || pathname === lastSentPath) return;
    const contentId = contentIdForPath(pathname);
    if (!contentId) return;
    const entry: EntryCategory = firstViewSent ? "internal" : (landingEntry ?? "direct");
    firstViewSent = true;
    lastSentPath = pathname;
    sendEvent("page_view", { content_id: contentId, entry });
  }, [pathname, tracking]);

  useEffect(() => {
    if (!tracking) return;
    // One capture-phase listener for the whole document: it sees the click
    // before any handler can stop it, and no component has to be annotated.
    const onClick = (e: MouseEvent) => {
      const target = e.target;
      if (!(target instanceof Element)) return;
      const el = target.closest("a[href], [data-vi-cta]");
      if (!el) return;
      const tagged = el.getAttribute("data-vi-cta");
      if (tagged) {
        trackCta(tagged);
        return;
      }
      const cta = ctaForHref(el.getAttribute("href") ?? "", location.hostname, PROJECT_LINKS);
      if (cta) trackCta(cta);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [tracking]);

  return null;
}
