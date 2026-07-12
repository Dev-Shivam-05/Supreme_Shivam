import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { dbConnect } from "@/lib/db";
import { Setting } from "@/models/setting";
import { isAdmin } from "@/lib/admin-guard";
import { getSettings } from "@/lib/content";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ ok: false }, { status: 401 });
  const settings = await getSettings();
  return NextResponse.json({ ok: true, settings });
}

export async function PUT(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ ok: false }, { status: 401 });
  const conn = await dbConnect();
  if (!conn) return NextResponse.json({ ok: false, error: "DB not configured" }, { status: 503 });
  const value = await req.json().catch(() => ({}));
  await Setting.findOneAndUpdate({ key: "site" }, { key: "site", value }, { upsert: true });
  revalidatePath("/");
  revalidatePath("/about");
  revalidatePath("/contact");
  return NextResponse.json({ ok: true });
}
