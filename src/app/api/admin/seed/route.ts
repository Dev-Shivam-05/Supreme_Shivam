import { NextResponse, type NextRequest } from "next/server";
import { dbConnect } from "@/lib/db";
import { Project } from "@/models/project";
import { Setting } from "@/models/setting";
import { isAdmin } from "@/lib/admin-guard";
import { contentDefaults } from "@/lib/content";
import { revalidateSite } from "@/lib/project-admin";
import { projects as staticProjects } from "@/lib/site";

export const runtime = "nodejs";

/** Populate the DB from the built-in content so nothing starts empty. */
export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ ok: false }, { status: 401 });
  const conn = await dbConnect();
  if (!conn) return NextResponse.json({ ok: false, error: "DB not configured" }, { status: 503 });

  let seededProjects = 0;
  const count = await Project.countDocuments({});
  if (count === 0) {
    await Project.insertMany(
      staticProjects.map((p, i) => ({ ...p, imageUrl: "", order: i, published: true })),
    );
    seededProjects = staticProjects.length;
  }

  const hasSettings = await Setting.findOne({ key: "site" });
  if (!hasSettings) {
    await Setting.create({ key: "site", value: contentDefaults });
  }

  revalidateSite();
  return NextResponse.json({ ok: true, seededProjects, seededSettings: !hasSettings });
}
