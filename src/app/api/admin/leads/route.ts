import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, verifyToken } from "@/lib/auth";
import { dbConnect } from "@/lib/db";
import { Lead } from "@/models/lead";

export const runtime = "nodejs";

const STATUSES = ["new", "read", "replied", "archived"];

export async function PATCH(req: NextRequest) {
  if (!verifyToken(req.cookies.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => ({}));
  const { id, status } = body as { id?: string; status?: string };
  if (!id || !status || !STATUSES.includes(status)) {
    return NextResponse.json({ ok: false, error: "Invalid input" }, { status: 400 });
  }
  const conn = await dbConnect();
  if (!conn) return NextResponse.json({ ok: false, error: "DB not configured" }, { status: 503 });

  await Lead.findByIdAndUpdate(id, { status });
  return NextResponse.json({ ok: true });
}
