"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { classifyEntry, type EntryCategory } from "@/lib/vi/catalog";

/** Module-level: it describes the page load, which outlives a remount of this component. */
let landingSent = false;

/**
 * Fires a pageview beacon on every route change. Server no-ops if DB is unset.
 *
 * Deliberately stores NOTHING on the device. It used to keep a session id in
 * sessionStorage, which is "access to information stored on a user's terminal
 * equipment" under ePrivacy and personal-data processing under the DPDP Act —
 * both of which would require a consent banner in front of it. The session id
 * is now derived server-side from a daily-rotating salted hash instead (see
 * app/api/collect/route.ts), so the same metric survives with no cookie, no
 * storage, no banner, and nothing that can be read back to a person.
 */
export function Beacon() {
  const pathname = usePathname();
  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;
    // Phase 6b row 2: the same classifier as the journey tracker. Only the
    // first view of a page load carries how the visitor arrived; a client-side
    // navigation keeps document.referrer, so it must not repeat it.
    const entry: EntryCategory = landingSent
      ? "internal"
      : classifyEntry(document.referrer, location.search, location.hostname);
    landingSent = true;
    const payload = JSON.stringify({
      path: pathname + window.location.search,
      referrer: document.referrer,
      entry,
    });
    try {
      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/collect", new Blob([payload], { type: "application/json" }));
      } else {
        fetch("/api/collect", {
          method: "POST",
          body: payload,
          headers: { "Content-Type": "application/json" },
          keepalive: true,
        });
      }
    } catch {
      /* analytics must never break navigation */
    }
  }, [pathname]);
  return null;
}
