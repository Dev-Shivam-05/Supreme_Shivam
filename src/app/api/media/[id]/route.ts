import { NextResponse } from "next/server";
import { dbConnect } from "@/lib/db";
import { Media } from "@/models/media";

export const runtime = "nodejs";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const conn = await dbConnect();
  if (!conn) return new NextResponse(null, { status: 404 });
  try {
    const doc = await Media.findById(id).lean<{ data: Buffer; contentType: string }>();
    if (!doc) return new NextResponse(null, { status: 404 });
    const buf = Buffer.isBuffer(doc.data) ? doc.data : Buffer.from(doc.data as unknown as ArrayBuffer);
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": doc.contentType || "image/jpeg",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
