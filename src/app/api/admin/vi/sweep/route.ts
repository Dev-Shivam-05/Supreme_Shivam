import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, verifyToken } from "@/lib/auth";
import { runSweep } from "@/lib/vi/sweep";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// The radar drain is budgeted at 50 s (spec 6c row 8); the platform default can be lower.
export const maxDuration = 60;

const NO_STORE = { "Cache-Control": "no-store" };

/** The admin "Run sweep" button: the same work as the daily cron, on demand. */
export async function POST(req: NextRequest) {
  if (!verifyToken(req.cookies.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401, headers: NO_STORE });
  }
  const result = await runSweep();
  if (!result) {
    return NextResponse.json(
      { ok: false, error: "Visitor intelligence is off or the database is unreachable." },
      { status: 503, headers: NO_STORE },
    );
  }
  return NextResponse.json({ ok: true, result }, { headers: NO_STORE });
}
