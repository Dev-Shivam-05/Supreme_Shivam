import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { rateLimit } from "@/lib/ratelimit";
import { bumpConsentStat, clientIp, logRejection, readJson } from "@/lib/vi/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };

const schema = z.strictObject({ result: z.enum(["shown", "declined"]) });

/**
 * POST /api/vi/consent-stat — counts how often the card is shown and declined.
 * Deliberately reads no cookie and stores no identifier: a "no thanks" must not
 * itself become a tracked event about the visitor. The IP is a rate-limit key only.
 */
export async function POST(req: NextRequest) {
  if (!rateLimit(`vi-consent-stat:${clientIp(req) ?? "unknown"}`, 20, 60_000).ok) {
    await logRejection("rate_limited");
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429, headers: NO_STORE });
  }

  const body = await readJson(req, 256);
  if (body === "too_large") {
    await logRejection("payload_too_large");
    return NextResponse.json({ ok: false, error: "payload_too_large" }, { status: 413, headers: NO_STORE });
  }
  const parsed = body === "malformed" ? null : schema.safeParse(body);
  if (!parsed?.success) {
    await logRejection("schema_invalid");
    return NextResponse.json({ ok: false, error: "schema_invalid" }, { status: 400, headers: NO_STORE });
  }

  await bumpConsentStat({ [parsed.data.result]: 1 });
  return new NextResponse(null, { status: 204, headers: NO_STORE });
}
