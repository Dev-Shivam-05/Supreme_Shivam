import { NextResponse, type NextRequest } from "next/server";
import { scopeHash, verifyEpoch } from "@/lib/vi/cookies";
import { COOKIE_EPOCH, SITE_ID } from "@/lib/vi/policy";
import { clearContextCookies, getEngine, logRejection, viEnabled } from "@/lib/vi/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: NO_STORE });

/**
 * GET /api/vi/state — what this browser has agreed to, for the consent card and
 * the "Privacy choices" panel. The cookies are httpOnly, so page script cannot
 * read them; this is how it learns the state. Only the epoch cookie matters
 * here — the session is irrelevant to what was granted.
 */
export async function GET(req: NextRequest) {
  const epoch = verifyEpoch(req.cookies.get(COOKIE_EPOCH)?.value);
  if (!epoch || epoch.siteId !== SITE_ID) return json({ enabled: viEnabled(), granted: false });

  try {
    const engine = await getEngine();
    if (!engine) return json({ enabled: false, granted: false });

    const now = new Date();
    const grant = await engine.store.getGrant(epoch.grantId);
    const tombstoned = await engine.store.isTombstoned(epoch.siteId, scopeHash(epoch.siteId, epoch.epochId));
    const active =
      !!grant &&
      grant.siteId === epoch.siteId &&
      grant.epochId === epoch.epochId &&
      grant.revokedAt === null &&
      grant.expiresAt.getTime() > now.getTime() &&
      !tombstoned;

    if (!active) {
      // Revoked or tombstoned reads as withdrawn (the visitor or the owner ended
      // it); a grant that simply ran out, or whose consent record aged away, is expired.
      const reason = grant?.revokedAt || tombstoned ? "withdrawn" : "expired";
      const res = json({ enabled: true, granted: false, reason });
      clearContextCookies(res);
      return res;
    }

    const window = await engine.store.getWindow(epoch.siteId, epoch.epochId);
    return json({
      enabled: true,
      granted: true,
      purposes: grant.purposes,
      validUntil: grant.expiresAt.toISOString(),
      windowEndsAt: window ? window.endsAt.toISOString() : null,
      // A short prefix lets the visitor match what they see to an erasure
      // request without the page ever holding the full identifier.
      epochHint: epoch.epochId.slice(0, 8),
    });
  } catch {
    await logRejection("server_error");
    return json({ enabled: true, granted: false, error: "server_error" }, 500);
  }
}
