import { after, NextResponse, type NextRequest } from "next/server";
import { rateLimit } from "@/lib/ratelimit";
import { Rejected } from "@/lib/vi/engine";
import { recordNetworkEvidence } from "@/lib/vi/network";
import {
  clearContextCookies,
  clearSessionCookie,
  clientIp,
  getEngine,
  logRejection,
  readJson,
  resolveContext,
  setSessionCookie,
} from "@/lib/vi/server";

export const runtime = "nodejs";

/**
 * At most one inference per epoch per 10 s per instance. infer() reads every
 * event of the epoch; per-event runs would cost O(n²) for a burst. A skipped
 * run is caught up by the next event or by opening the journey in the admin.
 */
const INFER_DEBOUNCE_MS = 10_000;
const lastInfer = new Map<string, number>();
function shouldInfer(epochId: string, now: number) {
  if (lastInfer.size > 5_000) {
    for (const [k, t] of lastInfer) if (now - t > INFER_DEBOUNCE_MS) lastInfer.delete(k);
  }
  const last = lastInfer.get(epochId) ?? 0;
  if (now - last < INFER_DEBOUNCE_MS) return false;
  lastInfer.set(epochId, now);
  return true;
}
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: NO_STORE });

/**
 * POST /api/vi/event — one journey event. Identity comes from the signed
 * cookies only (R30); the body can name an event, never an epoch, session or
 * grant. Cap is a little above the engine's 8 KB so the engine, not this
 * route, owns the `payload_too_large` rule for anything that parses.
 */
export async function POST(req: NextRequest) {
  const body = await readJson(req, 9000);
  if (body === "too_large") {
    await logRejection("payload_too_large");
    return json({ ok: false, error: "payload_too_large" }, 413);
  }
  if (body === "malformed") {
    await logRejection("schema_invalid");
    return json({ ok: false, error: "schema_invalid" }, 400);
  }

  const resolved = resolveContext(req);
  if (resolved.kind === "none") {
    // No grant cookie means default deny (R04). `reset` tells the tracker to stop.
    await logRejection("permission_denied");
    return json({ ok: false, error: "permission_denied", reset: true }, 403);
  }
  if (resolved.kind === "conflict") {
    await logRejection("session_epoch_conflict");
    const res = json({ ok: false, error: "session_epoch_conflict" }, 409);
    clearSessionCookie(res);
    return res;
  }

  const { ctx, mintedSession } = resolved;
  if (!rateLimit(`vi-event:${ctx.epochId}`, 120, 60_000).ok) {
    await logRejection("rate_limited");
    return json({ ok: false, error: "rate_limited" }, 429);
  }

  try {
    const engine = await getEngine();
    if (!engine) return json({ ok: false, error: "disabled" }, 503);

    const now = new Date();
    const result = await engine.ingest(body, ctx, now);
    const res = json({ ok: true, result });
    if (result === "accepted" && shouldInfer(ctx.epochId, now.getTime())) {
      // Keep the stored hypotheses current so the admin list can show them
      // without a write on read. infer() recomputes from scratch and abstains,
      // so running it per event can never accumulate a stale claim.
      after(() => engine.infer(ctx.siteId, ctx.epochId, new Date()).catch(() => logRejection("infer_failed")));
    }

    if (mintedSession && result === "accepted") {
      setSessionCookie(res, ctx.sessionId, ctx.epochId);
      // A new session is the trigger for organisation enrichment (spec §5 step 4).
      // Re-read the grant rather than trusting the cookie: purposes live server-side.
      const grant = await engine.store.getGrant(ctx.grantId);
      if (grant?.purposes.includes("organization")) {
        const ip = clientIp(req);
        after(() =>
          recordNetworkEvidence({
            siteId: ctx.siteId,
            epochId: ctx.epochId,
            sessionId: ctx.sessionId,
            grantId: ctx.grantId,
            ip,
            now,
            grantExpiresAt: grant.expiresAt,
          }),
        );
      }
    }
    return res;
  } catch (err) {
    if (err instanceof Rejected) {
      await logRejection(err.code);
      if (err.code === "permission_denied") {
        // The grant expired, was withdrawn or was erased: drop both cookies so the
        // browser stops presenting an epoch the server will never accept again.
        const res = json({ ok: false, error: err.code, reset: true }, 403);
        clearContextCookies(res);
        return res;
      }
      return json({ ok: false, error: err.code }, 422);
    }
    await logRejection("server_error");
    return json({ ok: false, error: "server_error" }, 500);
  }
}
