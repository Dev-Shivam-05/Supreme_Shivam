import { NextResponse, type NextRequest } from "next/server";
import { dbConnect } from "@/lib/db";
import { Media } from "@/models/media";
import { isAdmin } from "@/lib/admin-guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ ok: false }, { status: 401 });
  const conn = await dbConnect();
  if (!conn) return NextResponse.json({ ok: true, media: [] });
  const docs = await Media.find({}, { data: 0 }).sort({ createdAt: -1 }).limit(100).lean();
  return NextResponse.json({
    ok: true,
    media: docs.map((m) => ({
      id: String(m._id),
      url: `/api/media/${m._id}`,
      filename: m.filename,
      contentType: m.contentType,
    })),
  });
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ ok: false }, { status: 401 });
  const conn = await dbConnect();
  if (!conn) return NextResponse.json({ ok: false, error: "DB not configured" }, { status: 503 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "No file" }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ ok: false, error: "Images only" }, { status: 400 });
  }
  if (file.size > 6 * 1024 * 1024) {
    return NextResponse.json({ ok: false, error: "Max 6MB" }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const doc = await Media.create({ data: bytes, contentType: file.type, filename: file.name, size: bytes.length });
  return NextResponse.json({ ok: true, id: String(doc._id), url: `/api/media/${doc._id}` });
}
