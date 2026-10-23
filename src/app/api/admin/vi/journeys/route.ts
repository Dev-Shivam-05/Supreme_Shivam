import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, verifyToken } from "@/lib/auth";
import { listJourneys, type JourneyFilter } from "@/lib/vi/admin-queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };
const STATES: JourneyFilter[] = ["active", "closed", "all"];

/** The 100 newest visible journeys. The UI shows only the 8-character epoch hint. */
export async function GET(req: NextRequest) {
  if (!verifyToken(req.cookies.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401, headers: NO_STORE });
  }
  // Anything unrecognised falls back to the default rather than reaching a query.
  const param = req.nextUrl.searchParams.get("state") as JourneyFilter | null;
  const state = param && STATES.includes(param) ? param : "all";
  try {
    const journeys = await listJourneys(state);
    return NextResponse.json({ ok: true, state, journeys }, { headers: NO_STORE });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 503, headers: NO_STORE });
  }
}
