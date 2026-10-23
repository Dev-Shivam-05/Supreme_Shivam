import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { ADMIN_COOKIE, verifyToken } from "@/lib/auth";
import { Lead } from "@/models/lead";
import { getEngine, readJson } from "@/lib/vi/server";
import { SITE_ID } from "@/lib/vi/policy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };
const schema = z.strictObject({
  linkId: z.uuid(),
  reason: z.string().trim().min(1).max(200),
});

/**
 * Reverse a journey-to-enquiry link (reference.py `reverse_link`). The link row
 * is kept, marked revoked with the reason, and audited; the journey and the
 * lead both survive. The lead's `visitLinkId` is cleared so the Leads page
 * stops claiming a link that no longer holds.
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
  const { linkId, reason } = parsed.data;
  // reverseLink itself does not check the tenant; this route does (R19).
  const link = await engine.store.getLink(linkId);
  if (!link || link.siteId !== SITE_ID) {
    return NextResponse.json({ ok: false, error: "Link not found" }, { status: 404, headers: NO_STORE });
  }
  await engine.reverseLink(linkId, new Date(), reason, "admin");
  await Lead.updateMany({ visitLinkId: linkId }, { $set: { visitLinkId: "" } });
  return NextResponse.json({ ok: true }, { headers: NO_STORE });
}
