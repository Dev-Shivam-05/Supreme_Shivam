import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, verifyToken } from "@/lib/auth";
import { getVISummary } from "@/lib/vi/admin-queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };

/** Counts for the Visitors page header and side panels. `enabled: false` is a state, not an error. */
export async function GET(req: NextRequest) {
  if (!verifyToken(req.cookies.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401, headers: NO_STORE });
  }
  try {
    const summary = await getVISummary();
    return NextResponse.json({ ok: true, ...summary }, { headers: NO_STORE });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 503, headers: NO_STORE });
  }
}
