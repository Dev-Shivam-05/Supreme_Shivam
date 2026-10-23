"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type { Purpose } from "@/lib/vi/policy";
import { cn } from "@/lib/utils";
import { decline, grant, probe, readChoice, reportShown, useVI, withdraw } from "./vi-client";

const TOGGLES: { purpose: Purpose; label: string; hint?: string }[] = [
  { purpose: "journey", label: "Pages and buttons" },
  { purpose: "linking", label: "Link to an enquiry I send", hint: "Only if you tick a box on the contact form" },
  {
    purpose: "organization",
    label: "Organisation lookup",
    hint: "The public registry owner of your network, e.g. an ISP or company. Not who you are.",
  },
];

/** Phase 6b row 8: the first-load card is compact, so it never covers the hero CTAs. */
const COMPACT_BODY =
  "May I record which pages and buttons you use here, for 15 days? No URLs or personal traits; deleted at 22 days or when you withdraw.";

const BODY =
  "With your permission this site records which of its pages you open and which buttons you use, for 15 days, so I can see what brought you here. No URLs, no typing, no gender or other personal traits, no advertising. Everything is deleted after 22 days, or the moment you withdraw.";

type Mode = "hidden" | "prompt" | "manage";
type Check = "checking" | "failed" | "ok";

const ERRORS = {
  disabled: "Visit insights are switched off right now.",
  rate_limited: "Too many attempts — try again in a minute.",
  failed: "Couldn't save that — please try again.",
} as const;

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

/**
 * The consent card (spec D4): a small, non-modal panel bottom-left — never a
 * wall, never over the hero CTA, no focus trap. Two equal buttons, because a
 * "yes" that is easier to press than a "no" is not consent.
 *
 * `openRequest` counts "vi:open" events (the footer's Privacy choices); each
 * new value opens the manage panel.
 */
export default function ConsentCard({ openRequest }: { openRequest: number }) {
  const vi = useVI();
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const modeRef = useRef<Mode>("hidden");
  /** Esc on the prompt hides it for this page load without recording anything. */
  const dismissedRef = useRef(false);

  const [mode, setMode] = useState<Mode>("hidden");
  const [check, setCheck] = useState<Check>("checking");
  const [selected, setSelected] = useState<Record<Purpose, boolean>>({
    journey: true,
    linking: false,
    organization: false,
  });
  /** The prompt starts compact; "Choose" opens the three switches in place. */
  const [expanded, setExpanded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ text: string; tone: "ok" | "error" } | null>(null);

  // A new open request is a prop change, handled during render (React's
  // "adjusting state when a prop changes") rather than in an effect.
  const [seenRequest, setSeenRequest] = useState(0);
  if (openRequest !== seenRequest) {
    setSeenRequest(openRequest);
    if (openRequest > 0) {
      setMode("manage");
      setNote(null);
      setCheck("checking");
    }
  }

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  // Phase 6b row 1: prompt on the first page load, so one click on "Allow"
  // starts the journey on the landing page. VIRoot already held this chunk
  // back until the browser was idle (capped), so it fires on mount. Only a
  // visitor with no stored answer is ever asked, and the server is consulted
  // only now, at the moment the card would appear.
  useEffect(() => {
    if (readChoice()) return;
    let live = true;
    void probe().then((s) => {
      if (!live || !s || !s.enabled || s.granted || readChoice() || dismissedRef.current) return;
      if (modeRef.current !== "hidden") return;
      setMode("prompt");
      reportShown();
    });
    return () => {
      live = false;
    };
  }, []);

  // The manage panel always shows the server's answer, not a stale local one.
  useEffect(() => {
    if (mode !== "manage") return;
    let live = true;
    void probe().then((s) => {
      if (live) setCheck(s ? "ok" : "failed");
    });
    // Opened on purpose, so focus moves to it; the prompt never steals focus.
    panelRef.current?.focus();
    return () => {
      live = false;
    };
  }, [mode, openRequest]);

  useEffect(() => {
    if (mode === "hidden") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (modeRef.current === "prompt") dismissedRef.current = true;
      setMode("hidden");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mode]);

  if (mode === "hidden") return null;

  const toggle = (p: Purpose) =>
    setSelected((s) => {
      // Linking and the organisation lookup describe a journey; without one
      // they mean nothing, so switching journey off switches them off too.
      if (p === "journey") return s.journey ? { journey: false, linking: false, organization: false } : { ...s, journey: true };
      return s.journey ? { ...s, [p]: !s[p] } : s;
    });

  const onAllow = async () => {
    setBusy(true);
    setNote(null);
    const res = await grant(TOGGLES.map((t) => t.purpose).filter((p) => selected[p]));
    setBusy(false);
    if (!res.ok) {
      setNote({ text: ERRORS[res.error], tone: "error" });
      return;
    }
    if (mode === "prompt") setMode("hidden");
  };

  const onDecline = () => {
    decline();
    setMode("hidden");
  };

  const onWithdraw = async () => {
    setBusy(true);
    setNote(null);
    const res = await withdraw();
    setBusy(false);
    setNote(
      res.ok
        ? { text: "Erased. Nothing from this visit is kept.", tone: "ok" }
        : { text: "Couldn't withdraw — please try again.", tone: "error" },
    );
  };

  const isManage = mode === "manage";
  const canChoose = !isManage || (check === "ok" && vi.enabled && !vi.granted);
  const purposeLabels = TOGGLES.filter((t) => vi.purposes.includes(t.purpose)).map((t) => t.label);

  let status = "";
  if (isManage) {
    if (check === "checking") status = "Checking…";
    else if (check === "failed") status = "Couldn't reach the server. Try again in a moment.";
    else if (!vi.enabled) status = "Not enabled — this site is not recording visit insights right now.";
    else if (vi.granted)
      status = `On — ${purposeLabels.join(" · ")}${vi.validUntil ? ` · until ${formatDate(vi.validUntil)}` : ""}`;
    else if (vi.decision === "declined") status = "Off — you turned visit insights off.";
    else status = "Off — nothing is recorded.";
  }

  const button =
    "sweep inline-flex items-center justify-center border border-border-strong px-4 py-3 text-sm font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50";

  // Entrance: 240ms fade + 8px rise, pure CSS; globals.css zeroes it for reduced motion.
  const entrance = "transition-[opacity,translate] duration-[240ms] ease-out starting:translate-y-2 starting:opacity-0";

  // Phase 6b row 8. The hero CTAs sit bottom-left, so on a wide screen the
  // compact card sits bottom-right; on a phone it is a strip of at most 150px
  // under them. Everything the full card says is one click away (Choose).
  if (mode === "prompt" && !expanded) {
    return (
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="false"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          "fixed inset-x-0 bottom-0 z-[70] max-h-[150px] border-t border-border bg-bg-elev px-4 py-3 shadow-[var(--shadow-soft)] outline-none",
          "sm:inset-x-auto sm:bottom-4 sm:right-4 sm:max-h-none sm:w-[380px] sm:border sm:p-5",
          entrance,
        )}
      >
        <h2 id={titleId} className="text-sm font-semibold leading-tight text-fg sm:text-base">
          Help me understand why people visit
        </h2>
        <p className="mt-1 text-[0.72rem] leading-snug text-fg-muted sm:mt-2 sm:text-[0.8rem] sm:leading-relaxed">
          {COMPACT_BODY}{" "}
          <Link href="/privacy-policy#visit-insights" className="text-fg-faint underline underline-offset-2 hover:text-fg">
            Details
          </Link>
        </p>
        <div className="mt-2 grid grid-cols-[1fr_1fr_auto] items-center gap-2 sm:mt-4 sm:gap-3">
          <button type="button" onClick={onDecline} disabled={busy} className={cn(button, "px-3 py-2 text-fg sm:py-3")}>
            No thanks
          </button>
          <button type="button" onClick={onAllow} disabled={busy} className={cn(button, "px-3 py-2 text-accent sm:py-3")}>
            Allow
          </button>
          <button
            type="button"
            onClick={() => setExpanded(true)}
            disabled={busy}
            className="px-1 font-mono text-xs text-fg-muted underline underline-offset-2 hover:text-fg disabled:opacity-50"
          >
            Choose
          </button>
        </div>
        {note && <p className={cn("mt-2 font-mono text-xs", note.tone === "ok" ? "text-accent" : "text-signal")}>{note.text}</p>}
      </div>
    );
  }

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="false"
      aria-labelledby={titleId}
      tabIndex={-1}
      // Lenis captures the wheel; this lets a long card scroll natively.
      data-lenis-prevent
      className={cn(
        // Under the nav (z-90), the mobile menu (z-80) and the palette (z-120);
        // capped in height so it never reaches the middle of a phone screen.
        "fixed inset-x-4 bottom-4 z-[70] max-h-[46svh] overflow-y-auto border border-border bg-bg-elev p-5 shadow-[var(--shadow-soft)] outline-none",
        // An expanded prompt stays where the compact one was; Privacy choices opens bottom-left.
        isManage ? "sm:right-auto" : "sm:left-auto",
        "sm:w-[380px] lg:max-h-[calc(100svh-2rem)]",
        entrance,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <p className="hud">Optional · visit insights</p>
        {isManage && (
          <button
            type="button"
            onClick={() => setMode("hidden")}
            aria-label="Close"
            className="-m-1 p-1 text-fg-faint transition-colors hover:text-fg"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <h2 id={titleId} className="mt-3 text-lg leading-tight text-fg">
        {isManage ? "Privacy choices" : "Help me understand why people visit"}
      </h2>

      {isManage && <p className="mt-3 font-mono text-xs leading-relaxed text-fg-muted">{status}</p>}

      {canChoose && (
        <>
          <p className="mt-3 text-[0.8rem] leading-relaxed text-fg-muted">{BODY}</p>
          <div className="mt-4 divide-y divide-border border-y border-border">
            {TOGGLES.map((t) => {
              const on = selected[t.purpose];
              const locked = t.purpose !== "journey" && !selected.journey;
              return (
                <button
                  key={t.purpose}
                  type="button"
                  role="switch"
                  aria-checked={on}
                  disabled={locked}
                  onClick={() => toggle(t.purpose)}
                  className="flex w-full items-start justify-between gap-4 py-3 text-left disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <span>
                    <span className="block text-sm text-fg">{t.label}</span>
                    {t.hint && (
                      <span className="mt-0.5 block font-mono text-[0.65rem] leading-relaxed text-fg-faint">{t.hint}</span>
                    )}
                  </span>
                  <span
                    aria-hidden
                    className={cn(
                      "relative mt-0.5 h-5 w-9 shrink-0 rounded-full border transition-colors",
                      on ? "border-accent bg-accent" : "border-border-strong",
                    )}
                  >
                    <span
                      className={cn(
                        "absolute left-0.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full transition-transform",
                        on ? "translate-x-4 bg-accent-ink" : "bg-fg-faint",
                      )}
                    />
                  </span>
                </button>
              );
            })}
          </div>
          {/* Pinned to the bottom edge of the card: on a phone the card scrolls
              inside a 46svh cap, and both choices must stay visible without
              scrolling — a hidden "No thanks" is a dark pattern by omission. */}
          <div className="sticky -bottom-5 -mx-5 mt-4 grid grid-cols-2 gap-3 border-t border-border bg-bg-elev px-5 pb-5 pt-3">
            <button type="button" onClick={onDecline} disabled={busy} className={cn(button, "text-fg")}>
              No thanks
            </button>
            <button
              type="button"
              onClick={onAllow}
              disabled={busy || !selected.journey}
              className={cn(button, "text-accent")}
            >
              Allow selected
            </button>
          </div>
        </>
      )}

      {isManage && check === "ok" && vi.granted && (
        <button type="button" onClick={onWithdraw} disabled={busy} className={cn(button, "mt-4 w-full text-fg")}>
          Withdraw and erase
        </button>
      )}

      {note && (
        <p className={cn("mt-3 font-mono text-xs", note.tone === "ok" ? "text-accent" : "text-signal")}>{note.text}</p>
      )}

      <Link
        href="/privacy-policy#visit-insights"
        className="mt-4 inline-block font-mono text-[0.65rem] text-fg-faint underline underline-offset-2 hover:text-fg"
      >
        What exactly is recorded
      </Link>
    </div>
  );
}
