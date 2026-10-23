import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { ADMIN_COOKIE, verifyToken } from "@/lib/auth";
import { getEngine, readJson } from "@/lib/vi/server";
import { SITE_ID } from "@/lib/vi/policy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };
const schema = z.strictObject({ epochId: z.uuid() });

/**
 * Erase one journey on the visitor's behalf. Same scope as a withdrawal: the
 * tombstone lands first, then every event, insight, link, session, proof and
 * network record for this epoch is deleted. Never touches the Lead itself
 * (R10, R20) — the enquiry is a separate record with its own retention.
 */
export async function POST(req: NextRequest) {
  if (!verifyToken(req.cookies.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401, headers: NO_STORE });
  }
  const parsed = schema.safeParse(await readJson(req, 1024));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid input" }, { status: 400, headers: NO_STORE });
  }
  const engine = await getEngine();
  if (!engine) {
    return NextResponse.json(
      { ok: false, error: "Visitor intelligence is off or the database is unreachable." },
      { status: 503, headers: NO_STORE },
    );
  }
  // An unknown id would still write a tombstone; refuse it so the audit trail stays meaningful.
  // "Known" means a grant exists — an epoch with network evidence but no page
  // view in the catalogue has no window, and must still be erasable.
  if ((await engine.store.grantIdsForEpoch(SITE_ID, parsed.data.epochId)).length === 0) {
    return NextResponse.json({ ok: false, error: "Journey not found" }, { status: 404, headers: NO_STORE });
  }
  await engine.adminErase(SITE_ID, parsed.data.epochId, new Date());
  return NextResponse.json({ ok: true }, { headers: NO_STORE });
}
