import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { ADMIN_COOKIE, verifyToken } from "@/lib/auth";
import { getJourney } from "@/lib/vi/admin-queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };
const epochSchema = z.uuid();

/** One journey in full: dimensions, timeline, freshly recomputed insights, evidence and links. */
export async function GET(req: NextRequest, ctx: { params: Promise<{ epochId: string }> }) {
  if (!verifyToken(req.cookies.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401, headers: NO_STORE });
  }
  // Params are a Promise in this Next version (route.md, v15 change).
  const parsed = epochSchema.safeParse((await ctx.params).epochId);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid journey id" }, { status: 400, headers: NO_STORE });
  }
  try {
    const journey = await getJourney(parsed.data);
    if (!journey) {
      // Erased, withdrawn, expired or never existed — deliberately indistinguishable.
      return NextResponse.json({ ok: false, error: "Journey not found" }, { status: 404, headers: NO_STORE });
    }
    return NextResponse.json({ ok: true, journey }, { headers: NO_STORE });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 503, headers: NO_STORE });
  }
}
