import { createHash, randomUUID } from "node:crypto";
import { after, NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { rateLimit } from "@/lib/ratelimit";
import { drainJobs, queueNetwork } from "@/lib/vi/jobs";
import { CONSENT_UI_VERSION, POLICY_VERSION, PURPOSES, SITE_ID } from "@/lib/vi/policy";
import {
  bumpConsentStat,
  clientIp,
  getEngine,
  logRejection,
  readJson,
  resolveContext,
  setEpochCookie,
  setSessionCookie,
  viEnabled,
} from "@/lib/vi/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: NO_STORE });

/**
 * Journey is required for any grant (spec §5 step 2): linking or organisation
 * enrichment without a journey would have nothing to attach to. The UI version
 * must match, so a stale cached card cannot record consent to text it did not show.
 */
const schema = z.strictObject({
  purposes: z
    .array(z.enum(PURPOSES))
    .min(1)
    .transform((p) => [...new Set(p)])
    .refine((p) => p.includes("journey")),
  uiVersion: z.literal(CONSENT_UI_VERSION),
});

/** POST /api/vi/grant — mints a browser epoch and its grant. The only place either is created. */
export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  // Per address, and a ceiling for the whole instance: rotating IPv6 addresses
  // defeats the first, and every grant is a database write.
  if (!rateLimit(`vi-grant:${ip ?? "unknown"}`, 10, 60_000).ok || !rateLimit("vi-grant:*", 120, 60_000).ok) {
    await logRejection("rate_limited");
    return json({ ok: false, error: "rate_limited" }, 429);
  }
  if (!viEnabled()) return json({ ok: false, error: "disabled" }, 503);

  const body = await readJson(req, 2048);
  if (body === "too_large") {
    await logRejection("payload_too_large");
    return json({ ok: false, error: "payload_too_large" }, 413);
  }
  const parsed = body === "malformed" ? null : schema.safeParse(body);
  if (!parsed?.success) {
    await logRejection("schema_invalid");
    return json({ ok: false, error: "schema_invalid" }, 400);
  }

  const engine = await getEngine();
  if (!engine) return json({ ok: false, error: "disabled" }, 503);

  try {
    const now = new Date();
    // One live grant per browser. A second grant would mint a second epoch and
    // orphan the first one's data from the visitor's withdraw button.
    const resolved = resolveContext(req);
    if (resolved.kind !== "none") {
      const existing = await engine.store.getGrant(resolved.epoch.grantId);
      if (existing && existing.revokedAt === null && existing.expiresAt.getTime() > now.getTime()) {
        await logRejection("already_granted");
        return json({ ok: false, error: "already_granted" }, 409);
      }
    }

    const purposes = parsed.data.purposes;
    // A digest of exactly what was agreed to, not of who agreed: the consent
    // record proves the wording and policy version without holding a person.
    const proofRef = createHash("sha256")
      .update(`${parsed.data.uiVersion}|${POLICY_VERSION}|${[...purposes].sort().join(",")}`)
      .digest("hex");
    const grant = await engine.createGrant({ siteId: SITE_ID, purposes, sources: ["web"], now, basis: "consent", proofRef });

    const sessionId = randomUUID();
    const res = json({
      ok: true,
      state: { granted: true, purposes: grant.purposes, validUntil: grant.expiresAt.toISOString(), windowEndsAt: null },
    });
    setEpochCookie(res, { siteId: grant.siteId, epochId: grant.epochId, grantId: grant.grantId }, grant.expiresAt);
    setSessionCookie(res, sessionId, grant.epochId);

    await bumpConsentStat({
      granted: 1,
      grantedLinking: purposes.includes("linking") ? 1 : 0,
      grantedOrganization: purposes.includes("organization") ? 1 : 0,
    });

    if (purposes.includes("organization")) {
      // Queued now, looked up after the response: an RDAP lookup must never
      // slow down the consent click, and a failed one is retried by the queue.
      const id = await queueNetwork({
        siteId: grant.siteId,
        epochId: grant.epochId,
        sessionId,
        grantId: grant.grantId,
        ip,
        now,
        grantExpiresAt: grant.expiresAt,
      }).catch(() => logRejection("queue_failed").then(() => null));
      if (id) after(() => drainJobs({ limit: 3, budgetMs: 8000, first: [id] }).catch(() => logRejection("drain_failed")));
    }
    return res;
  } catch {
    await logRejection("server_error");
    return json({ ok: false, error: "server_error" }, 500);
  }
}
