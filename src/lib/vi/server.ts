/**
 * Server glue for visitor intelligence: the engine instance, the cookie-backed
 * Context, and the two code-only logs. Imported by route handlers only.
 */
import { randomUUID } from "node:crypto";
import { isIP } from "node:net";
import type { NextRequest, NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { features } from "@/lib/env";
import { Engine, type Context } from "./engine.ts";
import { MongoStore } from "./mongo-store.ts";
import { buildProdConfig } from "./config.ts";
import { scopeHash, signEpoch, signSession, verifyEpoch, verifySession, viKeyAvailable, type EpochCookie } from "./cookies.ts";
import { VIConsentStat, VISecurityLog } from "./models.ts";
import { COOKIE_EPOCH, COOKIE_SESSION, RETENTION, SITE_ID } from "./policy.ts";

/** On only when there is a database to keep the promises in and a key to sign with. */
export function viEnabled() {
  return features.db && viKeyAvailable();
}

export async function getEngine(): Promise<Engine | null> {
  if (!viEnabled()) return null;
  if (!(await dbConnect())) return null;
  return new Engine(new MongoStore(), buildProdConfig(scopeHash));
}

export type ResolvedContext =
  | { kind: "none" }
  | { kind: "conflict"; epoch: EpochCookie }
  | { kind: "ok"; epoch: EpochCookie; ctx: Context; mintedSession: boolean };

/**
 * Builds a Context from the signed cookies — and from nothing else (R30).
 * A session cookie signed for a different epoch is a conflict, not a reset:
 * reference.py rejects `session_epoch_conflict`, and the caller clears the
 * stale cookie so the next request starts a fresh session.
 */
export function resolveContext(req: NextRequest, sourceId = "web"): ResolvedContext {
  const epoch = verifyEpoch(req.cookies.get(COOKIE_EPOCH)?.value);
  if (!epoch || epoch.siteId !== SITE_ID) return { kind: "none" };
  const session = verifySession(req.cookies.get(COOKIE_SESSION)?.value);
  if (session && session.epochId !== epoch.epochId) return { kind: "conflict", epoch };
  const sessionId = session?.sessionId ?? randomUUID();
  return {
    kind: "ok",
    epoch,
    mintedSession: !session,
    ctx: { siteId: epoch.siteId, sourceId, epochId: epoch.epochId, sessionId, grantId: epoch.grantId },
  };
}

const secure = process.env.NODE_ENV === "production";

export function setEpochCookie(res: NextResponse, p: Omit<EpochCookie, "v">, validUntil: Date) {
  res.cookies.set(COOKIE_EPOCH, signEpoch(p), {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    // Never outlives the grant it carries.
    maxAge: Math.max(0, Math.floor((validUntil.getTime() - Date.now()) / 1000)),
  });
}

/** A browser-session cookie: no maxAge, so it ends when the browser does. */
export function setSessionCookie(res: NextResponse, sessionId: string, epochId: string) {
  res.cookies.set(COOKIE_SESSION, signSession({ sessionId, epochId }), {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
  });
}

export function clearContextCookies(res: NextResponse) {
  for (const name of [COOKIE_EPOCH, COOKIE_SESSION]) {
    res.cookies.set(name, "", { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: 0 });
  }
}

export function clearSessionCookie(res: NextResponse) {
  res.cookies.set(COOKIE_SESSION, "", { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: 0 });
}

/** The connecting address, validated. Used for the RDAP prefix and rate limits; never stored. */
export function clientIp(req: NextRequest): string | null {
  const raw = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || req.headers.get("x-real-ip") || "";
  return isIP(raw) ? raw : null;
}

/**
 * Rejections written per instance per minute. Every rejection is logged, but a
 * flood of junk requests must not turn into a flood of database writes — past
 * the cap the request is still refused, just not recorded.
 */
const LOG_CAP_PER_MINUTE = 120;
let logWindowStart = 0;
let logCount = 0;

/** Code-only rejection log (R28). Never throws, never blocks a response. */
export async function logRejection(code: string, sourceId = "web") {
  const now = Date.now();
  if (now - logWindowStart > 60_000) {
    logWindowStart = now;
    logCount = 0;
  }
  if (++logCount > LOG_CAP_PER_MINUTE) return;
  try {
    if (!(await dbConnect())) return;
    await VISecurityLog.create({ code: code.slice(0, 64), sourceId, at: new Date() });
  } catch {
    /* logging must not become a failure mode */
  }
}

export type ConsentCounter = "shown" | "declined" | "granted" | "grantedLinking" | "grantedOrganization" | "withdrawn";

/** Daily aggregate counters; no identifier of any kind. */
export async function bumpConsentStat(fields: Partial<Record<ConsentCounter, number>>) {
  try {
    if (!(await dbConnect())) return;
    const now = new Date();
    const day = now.toISOString().slice(0, 10);
    await VIConsentStat.updateOne(
      { _id: day },
      {
        $inc: fields,
        $setOnInsert: { expiresAt: new Date(Date.parse(`${day}T00:00:00Z`) + RETENTION.aggregateMs) },
      },
      { upsert: true },
    );
  } catch {
    /* aggregate counters are best effort */
  }
}

/** JSON body with a hard byte cap read BEFORE parsing, so a huge body is never buffered into JSON.parse. */
export async function readJson(req: NextRequest, maxBytes: number): Promise<unknown | "too_large" | "malformed"> {
  const text = await req.text();
  if (new TextEncoder().encode(text).length > maxBytes) return "too_large";
  try {
    return JSON.parse(text);
  } catch {
    return "malformed";
  }
}
