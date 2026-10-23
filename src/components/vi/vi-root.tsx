"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Tracker } from "./tracker";
import { refreshState } from "./vi-client";

/*
 * The card is a separate chunk that is not even requested until the browser is
 * idle: neither its markup nor its code sits in the initial render path, so the
 * Phase 4 PageSpeed work is untouched (spec D4).
 */
const ConsentCard = dynamic(() => import("./consent-card"), { ssr: false });

/**
 * Phase 6b row 1: the card prompts on the first page load. Idle first, so it
 * never competes with the hero for the LCP — but on a busy page (shader, GSAP)
 * the browser may not go idle for seconds, and the card must be visible within
 * 2 s, so the wait is capped here. The same cap stands in where there is no
 * requestIdleCallback (Safari).
 */
const CARD_IDLE_TIMEOUT_MS = 1200;

type IdleWindow = Window & {
  requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
  cancelIdleCallback?: (id: number) => void;
};

/** Visitor intelligence on the public site: the consented tracker, and the consent card once idle. */
export function VIRoot() {
  const pathname = usePathname();
  const [loadCard, setLoadCard] = useState(false);
  // Every "vi:open" (the footer's Privacy choices) bumps this. It is counted
  // here rather than in the card so a click that lands before the card's chunk
  // has arrived still opens the panel once it does.
  const [openRequest, setOpenRequest] = useState(0);

  useEffect(() => {
    void refreshState();
  }, []);

  useEffect(() => {
    const w = window as IdleWindow;
    if (w.requestIdleCallback) {
      const id = w.requestIdleCallback(() => setLoadCard(true), { timeout: CARD_IDLE_TIMEOUT_MS });
      return () => w.cancelIdleCallback?.(id);
    }
    const t = setTimeout(() => setLoadCard(true), CARD_IDLE_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const onOpen = () => {
      setOpenRequest((n) => n + 1);
      setLoadCard(true);
    };
    window.addEventListener("vi:open", onOpen);
    return () => window.removeEventListener("vi:open", onOpen);
  }, []);

  // Chrome already keeps the admin deck out of the public shell; this is the belt to that brace.
  if (pathname?.startsWith("/admin")) return null;

  return (
    <>
      <Tracker />
      {loadCard && <ConsentCard openRequest={openRequest} />}
    </>
  );
}
