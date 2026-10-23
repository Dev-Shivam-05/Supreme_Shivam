"use client";

import { useSyncExternalStore } from "react";
import { ALLOWED_VALUES, CTA_IDS, EVENT_PROPERTIES, SEARCH_TOPICS } from "@/lib/vi/catalog";
import { CONSENT_UI_VERSION, GRANT_VALIDITY_MS, PURPOSES, SCHEMA_VERSION, type Purpose } from "@/lib/vi/policy";

/**
 * The browser half of visitor intelligence (Phase 6).
 *
 * What this module never does: send a URL, a typed word, a form value or an
 * identifier. Identity lives in httpOnly cookies the server sets on a grant, so
 * there is nothing here to read or leak. Every event value is checked against
 * catalog.ts before it leaves, on top of the server's own allowlist (R21–R23).
 *
 * The only thing it stores on the device is the visitor's own answer, so the
 * card does not ask twice. A visitor who never opted in triggers no request at
 * all until the card is actually about to be shown.
 */

const KEY = "sb_vi_choice";
const DAY = 86_400_000;
/** A "No thanks" is honoured this long, then forgotten — asking once in six months is not nagging. */
const DECLINE_TTL_MS = 180 * DAY;

type Decision = "granted" | "declined";
type Choice = { v: 1; decision: Decision; purposes: Purpose[]; decidedAt: number };

export type VIState = {
  /** refreshState() has finished — whatever the answer was. */
  ready: boolean;
  /** The server answered /api/vi/state during this page load, so `enabled` is real. */
  checked: boolean;
  enabled: boolean;
  granted: boolean;
  purposes: Purpose[];
  validUntil: string | null;
  /** The answer stored on this device, or null when the visitor has not been asked. */
  decision: Decision | null;
};

type ServerState = {
  enabled?: boolean;
  granted?: boolean;
  purposes?: string[];
  validUntil?: string;
};

const INITIAL: VIState = {
  ready: false,
  checked: false,
  enabled: false,
  granted: false,
  purposes: [],
  validUntil: null,
  decision: null,
};

/* -------------------------------------------------------------------------- */
/* Store                                                                       */
/* -------------------------------------------------------------------------- */

let state: VIState = INITIAL;
const listeners = new Set<() => void>();

function set(patch: Partial<VIState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

export function getVIState() {
  return state;
}

export function subscribeVI(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/** Re-renders on every store change. Server render always sees the initial, ungranted state. */
export function useVI(): VIState {
  return useSyncExternalStore(subscribeVI, getVIState, () => INITIAL);
}

/* -------------------------------------------------------------------------- */
/* The stored choice. Storage can throw (private mode, blocked site data), so  */
/* every access is guarded and a failure reads as "not asked yet".             */
/* -------------------------------------------------------------------------- */

const asPurposes = (list: unknown): Purpose[] =>
  Array.isArray(list) ? PURPOSES.filter((p) => list.includes(p)) : [];

export function readChoice(): Choice | null {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
  if (!raw) return null;
  try {
    const c = JSON.parse(raw) as Partial<Choice>;
    if (c.v !== 1 || (c.decision !== "granted" && c.decision !== "declined") || typeof c.decidedAt !== "number") {
      clearChoice();
      return null;
    }
    // A grant cannot outlive its validity on the server, and a decline is only
    // honoured for six months — past either, the record means nothing.
    const ttl = c.decision === "declined" ? DECLINE_TTL_MS : GRANT_VALIDITY_MS;
    if (Date.now() - c.decidedAt > ttl) {
      clearChoice();
      return null;
    }
    return { v: 1, decision: c.decision, purposes: asPurposes(c.purposes), decidedAt: c.decidedAt };
  } catch {
    clearChoice();
    return null;
  }
}

function writeChoice(decision: Decision, purposes: Purpose[]) {
  const choice: Choice = { v: 1, decision, purposes, decidedAt: Date.now() };
  try {
    window.localStorage.setItem(KEY, JSON.stringify(choice));
  } catch {
    /* the decision still holds for this page load */
  }
  set({ decision });
}

function clearChoice() {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* nothing to clear */
  }
  if (state.decision !== null) set({ decision: null });
}

/* -------------------------------------------------------------------------- */
/* Server state                                                                */
/* -------------------------------------------------------------------------- */

const json = { "Content-Type": "application/json" };

/** Folds a /api/vi/state answer into the store and keeps the stored choice honest. */
function apply(s: ServerState) {
  const enabled = s.enabled === true;
  const granted = enabled && s.granted === true;
  const purposes = granted ? asPurposes(s.purposes) : [];
  const local = readChoice();
  if (granted) {
    // The cookie outlived the local record (cleared storage, another tab): the
    // server is the source of truth, so remember the grant it still holds.
    if (local?.decision !== "granted") writeChoice("granted", purposes);
  } else if (local?.decision === "granted") {
    // Expired, withdrawn elsewhere, or switched off: the grant is gone, so the
    // card may ask again later rather than pretending it is still on.
    clearChoice();
  }
  set({
    checked: true,
    enabled,
    granted,
    purposes,
    validUntil: granted ? (s.validUntil ?? null) : null,
    decision: readChoice()?.decision ?? null,
  });
}

let inflight: Promise<VIState | null> | null = null;

/**
 * Asks the server where this browser stands. Used by the card right before it
 * would appear, and when the visitor opens Privacy choices — both moments when
 * the answer is needed. Returns null when the server cannot be reached.
 */
export function probe(): Promise<VIState | null> {
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const res = await fetch("/api/vi/state", { credentials: "same-origin", cache: "no-store" });
      if (!res.ok) return null;
      apply((await res.json()) as ServerState);
      return state;
    } catch {
      return null;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

/**
 * Called once on mount. Only a browser that said yes asks the server anything:
 * a visitor who never opted in, or said no, costs no request here.
 */
export async function refreshState() {
  const local = readChoice();
  set({ decision: local?.decision ?? null });
  if (local?.decision === "granted") await probe();
  set({ ready: true });
}

/* -------------------------------------------------------------------------- */
/* Decisions                                                                   */
/* -------------------------------------------------------------------------- */

export type GrantResult = { ok: true } | { ok: false; error: "disabled" | "rate_limited" | "failed" };

export async function grant(selected: Purpose[]): Promise<GrantResult> {
  // `journey` is required for any grant: linking and the organisation lookup
  // both describe a journey, so they mean nothing without one.
  const purposes = asPurposes(selected);
  if (!purposes.includes("journey")) return { ok: false, error: "failed" };
  try {
    const res = await fetch("/api/vi/grant", {
      method: "POST",
      headers: json,
      credentials: "same-origin",
      body: JSON.stringify({ purposes, uiVersion: CONSENT_UI_VERSION }),
    });
    if (res.status === 409) {
      // Already granted in this browser — pick up what the server holds.
      await probe();
      return { ok: true };
    }
    if (res.status === 503) {
      set({ checked: true, enabled: false, granted: false, purposes: [] });
      return { ok: false, error: "disabled" };
    }
    if (res.status === 429) return { ok: false, error: "rate_limited" };
    const data = (await res.json()) as { ok?: boolean; state?: ServerState };
    if (!res.ok || !data.ok) return { ok: false, error: "failed" };
    const s = data.state ?? {};
    const got = asPurposes(s.purposes ?? purposes);
    writeChoice("granted", got);
    set({ checked: true, enabled: true, granted: true, purposes: got, validUntil: s.validUntil ?? null });
    return { ok: true };
  } catch {
    return { ok: false, error: "failed" };
  }
}

/** An aggregate counter with no identifier — the server learns only that a card was shown or declined. */
function consentStat(result: "shown" | "declined") {
  try {
    void fetch("/api/vi/consent-stat", {
      method: "POST",
      headers: json,
      credentials: "same-origin",
      body: JSON.stringify({ result }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* a counter must never break the page */
  }
}

export function decline() {
  // Counted once per answer: re-confirming a "no" from Privacy choices is not a second decline.
  const already = readChoice()?.decision === "declined";
  writeChoice("declined", []);
  if (!already) consentStat("declined");
}

let shownReported = false;
/** Once per page load, however often the card re-renders. */
export function reportShown() {
  if (shownReported) return;
  shownReported = true;
  consentStat("shown");
}

export type WithdrawResult = { ok: true; erased: boolean } | { ok: false };

export async function withdraw(): Promise<WithdrawResult> {
  try {
    const res = await fetch("/api/vi/withdraw", { method: "POST", headers: json, credentials: "same-origin" });
    const data = (await res.json()) as { ok?: boolean; erased?: boolean };
    if (!res.ok || !data.ok) return { ok: false };
    // Withdrawing is a "no": record it as one so the card does not ask again
    // on the next page. Privacy choices still lets the visitor opt back in.
    writeChoice("declined", []);
    set({ granted: false, purposes: [], validUntil: null });
    return { ok: true, erased: data.erased === true };
  } catch {
    return { ok: false };
  }
}

/* -------------------------------------------------------------------------- */
/* Events                                                                      */
/* -------------------------------------------------------------------------- */

/** The exact key set and value allowlist from catalog.ts — anything else is dropped here, not sent. */
function allowed(name: string, props: Record<string, string>) {
  const keys = EVENT_PROPERTIES[name];
  if (!keys) return false;
  const given = Object.keys(props);
  if (given.length !== keys.length || !keys.every((k) => given.includes(k))) return false;
  return keys.every((k) => ALLOWED_VALUES[k]?.includes(props[k]));
}

export function sendEvent(name: string, props: Record<string, string>) {
  if (!state.granted || !state.purposes.includes("journey")) return;
  if (!allowed(name, props)) return;
  if (typeof crypto === "undefined" || typeof crypto.randomUUID !== "function") return;
  const body = JSON.stringify({
    schema_version: SCHEMA_VERSION,
    event_id: crypto.randomUUID(),
    event_name: name,
    properties: props,
  });
  try {
    fetch("/api/vi/event", {
      method: "POST",
      headers: json,
      credentials: "same-origin",
      body,
      // A CTA is often a link away from the page; keepalive lets the report finish.
      keepalive: true,
    })
      .then((res) => res.json())
      .then((data: { ok?: boolean; reset?: boolean }) => {
        if (data && data.ok === false && data.reset) {
          // The grant is gone server-side (expired, withdrawn, tombstoned): stop
          // at once and forget the choice, so the card may ask again later.
          clearChoice();
          set({ granted: false, purposes: [], validUntil: null });
        }
      })
      .catch(() => {});
  } catch {
    /* analytics must never break navigation */
  }
}

export function trackCta(id: string) {
  if ((CTA_IDS as readonly string[]).includes(id)) sendEvent("cta_click", { cta_id: id });
}

export function trackSearch(topic: string) {
  if ((SEARCH_TOPICS as readonly string[]).includes(topic)) sendEvent("search_submitted", { topic });
}
