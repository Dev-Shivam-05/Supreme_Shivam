import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { rateLimit } from "@/lib/ratelimit";
import { Rejected, type Context } from "@/lib/vi/engine";
import {
  bumpConsentStat,
  clearContextCookies,
  clientIp,
  getEngine,
  logRejection,
  resolveContext,
} from "@/lib/vi/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: NO_STORE });

/**
 * POST /api/vi/withdraw — revoke, tombstone, erase (R09). Withdrawal is scoped
 * to the browser epoch, so a stale or conflicting session cookie must not stand
 * in the way: the epoch cookie alone decides what is erased.
 */
export async function POST(req: NextRequest) {
  if (!rateLimit(`vi-withdraw:${clientIp(req) ?? "unknown"}`, 10, 60_000).ok) {
    await logRejection("rate_limited");
    return json({ ok: false, error: "rate_limited" }, 429);
  }

  let erased = false;
  const resolved = resolveContext(req);
  if (resolved.kind !== "none") {
    try {
      const engine = await getEngine();
      // Without the database nothing can be erased. Keep the cookies in that case:
      // the epoch id they carry is the only handle a retry has on the data.
      if (!engine) return json({ ok: false, error: "unavailable" }, 503);
      const { siteId, epochId, grantId } = resolved.epoch;
      const grant = await engine.store.getGrant(grantId);
      // An already-revoked grant was withdrawn or erased before; its tombstone
      // exists and the sweep finishes any leftover delete. Nothing new to do.
      if (grant && grant.revokedAt === null) {
        const ctx: Context = {
          siteId,
          epochId,
          grantId,
          sourceId: "web",
          sessionId: resolved.kind === "ok" ? resolved.ctx.sessionId : randomUUID(),
        };
        try {
          await engine.withdraw(ctx, new Date());
          erased = true;
        } catch (err) {
          // Scope mismatch means the grant is not this epoch's: treat as already gone.
          if (!(err instanceof Rejected && err.code === "withdrawal_scope_invalid")) throw err;
        }
      }
    } catch {
      await logRejection("server_error");
      // Same reasoning as above: a failed erase keeps its handle so it can be retried.
      // The tombstone is written first (spec D7), so a partial erase is already hidden.
      return json({ ok: false, error: "server_error" }, 500);
    }
  }

  if (erased) await bumpConsentStat({ withdrawn: 1 });
  const res = json({ ok: true, erased });
  clearContextCookies(res);
  return res;
}
