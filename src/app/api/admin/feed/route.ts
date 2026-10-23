import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, verifyToken } from "@/lib/auth";
import { getLiveFeed } from "@/lib/analytics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The 25 newest pageviews, for the live feed. Polled every 20s while the admin
 * tab is visible — the client stops polling on blur, so a forgotten open tab
 * does not bill invocations overnight.
 */
export async function GET(req: NextRequest) {
  if (!verifyToken(req.cookies.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const rows = await getLiveFeed(25);
  return NextResponse.json({ ok: true, rows, at: new Date().toISOString() });
}
