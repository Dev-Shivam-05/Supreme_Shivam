import { NextResponse, type NextRequest } from "next/server";
import { dbConnect } from "@/lib/db";
import { Project } from "@/models/project";
import { isAdmin } from "@/lib/admin-guard";
import { pick, revalidateSite } from "@/lib/project-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ ok: false }, { status: 401 });
  const conn = await dbConnect();
  if (!conn) return NextResponse.json({ ok: true, projects: [], configured: false });
  const docs = await Project.find({}).sort({ order: 1, createdAt: 1 }).lean();
  return NextResponse.json({
    ok: true,
    configured: true,
    projects: docs.map((d) => ({ ...d, id: String(d._id), _id: undefined })),
  });
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ ok: false }, { status: 401 });
  const conn = await dbConnect();
  if (!conn) return NextResponse.json({ ok: false, error: "DB not configured" }, { status: 503 });
  const body = await req.json().catch(() => ({}));
  if (!body.title || !body.slug) {
    return NextResponse.json({ ok: false, error: "Title and slug are required" }, { status: 400 });
  }
  try {
    const count = await Project.countDocuments({});
    const doc = await Project.create({ ...pick(body), order: body.order ?? count });
    revalidateSite(doc.slug);
    return NextResponse.json({ ok: true, id: String(doc._id) });
  } catch (err) {
    const msg = (err as Error).message;
    if (msg.includes("duplicate")) return NextResponse.json({ ok: false, error: "Slug already exists" }, { status: 409 });
    return NextResponse.json({ ok: false, error: "Create failed" }, { status: 500 });
  }
}
