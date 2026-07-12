import { NextResponse, type NextRequest } from "next/server";
import { dbConnect } from "@/lib/db";
import { Project } from "@/models/project";
import { isAdmin } from "@/lib/admin-guard";
import { pick, revalidateSite } from "@/lib/project-admin";

export const runtime = "nodejs";

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!isAdmin(req)) return NextResponse.json({ ok: false }, { status: 401 });
  const { id } = await ctx.params;
  const conn = await dbConnect();
  if (!conn) return NextResponse.json({ ok: false, error: "DB not configured" }, { status: 503 });
  const body = await req.json().catch(() => ({}));
  try {
    const doc = await Project.findByIdAndUpdate(id, pick(body), { new: true });
    if (!doc) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    revalidateSite(doc.slug);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = (err as Error).message;
    if (msg.includes("duplicate")) return NextResponse.json({ ok: false, error: "Slug already exists" }, { status: 409 });
    return NextResponse.json({ ok: false, error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!isAdmin(req)) return NextResponse.json({ ok: false }, { status: 401 });
  const { id } = await ctx.params;
  const conn = await dbConnect();
  if (!conn) return NextResponse.json({ ok: false, error: "DB not configured" }, { status: 503 });
  const doc = await Project.findByIdAndDelete(id);
  revalidateSite(doc?.slug);
  return NextResponse.json({ ok: true });
}
