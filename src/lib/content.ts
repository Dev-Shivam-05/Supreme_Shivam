import { dbConnect } from "./db";
import { Project as ProjectModel } from "@/models/project";
import { Setting } from "@/models/setting";
import { contentDefaults, projects as staticProjects, type Project, type PublicContent, type SiteContent } from "./site";

/* ---------------- editable site content (text/images) ---------------- */

export type { PublicContent, SiteContent };

/** Drops the address before the content crosses into a client component. */
export function toPublicContent(content: SiteContent): PublicContent {
  const { email: _email, ...rest } = content;
  return rest;
}

export { contentDefaults };

export async function getSettings(): Promise<SiteContent> {
  const conn = await dbConnect();
  if (!conn) return contentDefaults;
  try {
    const doc = await Setting.findOne({ key: "site" }).lean<{ value?: Partial<SiteContent> }>();
    if (!doc?.value) return contentDefaults;
    return { ...contentDefaults, ...doc.value, now: { ...contentDefaults.now, ...(doc.value.now ?? {}) } };
  } catch {
    return contentDefaults;
  }
}

/* ---------------- projects (CRUD-backed, static fallback) ---------------- */

type LeanProject = Record<string, unknown> & { _id: unknown };

function normalize(d: LeanProject): Project {
  const s = (k: string) => (typeof d[k] === "string" ? (d[k] as string) : "");
  const arr = (k: string) => (Array.isArray(d[k]) ? (d[k] as string[]) : []);
  return {
    slug: s("slug"),
    index: s("index") || "01",
    title: s("title"),
    category: s("category"),
    year: s("year"),
    role: s("role"),
    timeline: s("timeline"),
    summary: s("summary"),
    description: s("description"),
    stack: arr("stack"),
    metrics: (Array.isArray(d.metrics) ? d.metrics : []) as Project["metrics"],
    problem: s("problem"),
    approach: arr("approach"),
    architecture: arr("architecture"),
    outcomes: arr("outcomes"),
    pattern: (s("pattern") || "grid") as Project["pattern"],
    flagship: Boolean(d.flagship),
    archived: Boolean(d.archived),
    imageUrl: s("imageUrl") || undefined,
    repo: s("repo") || undefined,
    live: s("live") || undefined,
  };
}

export async function getProjects(): Promise<Project[]> {
  const conn = await dbConnect();
  if (!conn) return staticProjects;
  try {
    const docs = await ProjectModel.find({ published: true }).sort({ order: 1, createdAt: 1 }).lean();
    if (!docs || docs.length === 0) return staticProjects;
    return (docs as LeanProject[]).map(normalize);
  } catch {
    return staticProjects;
  }
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  const all = await getProjects();
  return all.find((p) => p.slug === slug) ?? null;
}
