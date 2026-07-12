"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

function getSessionId() {
  try {
    let id = sessionStorage.getItem("sb_sid");
    if (!id) {
      id = `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
      sessionStorage.setItem("sb_sid", id);
    }
    return id;
  } catch {
    return "";
  }
}

/** Fires a pageview beacon on every route change. Server no-ops if DB is unset. */
export function Beacon() {
  const pathname = usePathname();
  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;
    const payload = JSON.stringify({
      path: pathname + window.location.search,
      referrer: document.referrer,
      sessionId: getSessionId(),
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
