import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { logRejection } from "@/lib/vi/server";
import { runSweep } from "@/lib/vi/sweep";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: NO_STORE });

/**
 * Compares SHA-256 digests so both sides are the same length: neither a length
 * mismatch nor an early exit can reveal anything about the secret.
 */
function sameSecret(given: string, expected: string) {
  const a = createHash("sha256").update(given, "utf8").digest();
  const b = createHash("sha256").update(expected, "utf8").digest();
  return timingSafeEqual(a, b);
}

/**
 * GET /api/vi/sweep — the daily Vercel cron (vercel.json). Vercel sends
 * `Authorization: Bearer $CRON_SECRET`; without CRON_SECRET set the route is
 * closed rather than open, so a missing variable can never expose it.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const header = req.headers.get("authorization") ?? "";
  if (!secret || !sameSecret(header, `Bearer ${secret}`)) {
    await logRejection("unauthorized", "cron");
    return json({ ok: false, error: "unauthorized" }, 401);
  }

  try {
    const result = await runSweep();
    if (!result) return json({ ok: false, error: "disabled" }, 503);
    return json({ ok: true, ...result });
  } catch {
    await logRejection("server_error", "cron");
    return json({ ok: false, error: "server_error" }, 500);
  }
}
