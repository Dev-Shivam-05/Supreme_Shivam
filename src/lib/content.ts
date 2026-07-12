import { dbConnect } from "./db";
import { Project as ProjectModel } from "@/models/project";
import { Setting } from "@/models/setting";
import { projects as staticProjects, site, type Project, type SiteContent } from "./site";

/* ---------------- editable site content (text/images) ---------------- */

export type { SiteContent };

export const contentDefaults: SiteContent = {
  availability: site.availability,
  status: site.status,
  roleLong: site.roleLong,
  tagline: site.tagline,
  heroLead:
    "I build fast, observable, production-grade web systems — realtime, indexed, engineered to be inspected — and the interfaces that make them feel effortless.",
  aboutParagraphs: [
    `I'm ${site.name.split(" ")[0]} — a full-stack developer who cares as much about the query plan as the pixel. My work spans production Express/MongoDB backends with JWT auth, rate limiting and realtime sockets, and React front-ends engineered for speed.`,
    "I optimise for outcomes that hold up under inspection: 70% faster queries via indexing and aggregation, 60% less bandwidth through smart caching, 98 Lighthouse. Discipline over hype — I show up and ship, every day.",
    "This site is the proof: a Next.js front end, a Mongo-backed API, a self-built analytics pipeline and an admin dashboard — all designed and engineered end-to-end.",
  ],
  now: {
    building: "An observable, self-instrumenting portfolio engine",
    learning: "Advanced Next.js, Docker & distributed systems",
    status: "Available for full-time & freelance",
  },
  location: site.location,
  email: site.email,
};

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
