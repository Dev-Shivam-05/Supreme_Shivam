import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, tokenExpiry, verifyToken } from "@/lib/auth";
import { getAdminStats, type ClassFilter, type RangeKey } from "@/lib/analytics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RANGES: RangeKey[] = ["7d", "30d", "all"];
const CLASSES: ClassFilter[] = ["human", "untagged", "bot", "all"];

export async function GET(req: NextRequest) {
  if (!verifyToken(req.cookies.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  // Anything unrecognised falls back to the default rather than reaching the
  // aggregation, so a hand-edited query string cannot shape a $match.
  const rangeParam = req.nextUrl.searchParams.get("range") as RangeKey | null;
  const classParam = req.nextUrl.searchParams.get("class") as ClassFilter | null;
  const range = rangeParam && RANGES.includes(rangeParam) ? rangeParam : "all";
  const klass = classParam && CLASSES.includes(classParam) ? classParam : "human";

  const data = await getAdminStats(range, klass);
  return NextResponse.json({
    ok: true,
    sessionExpiresAt: tokenExpiry(req.cookies.get(ADMIN_COOKIE)?.value),
    ...data,
  });
}
