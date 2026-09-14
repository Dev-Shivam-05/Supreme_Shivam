import { dbConnect } from "./db";
import { Project as ProjectModel } from "@/models/project";
import { Setting } from "@/models/setting";
import { now, projects as staticProjects, site, type Project, type PublicContent, type SiteContent } from "./site";

/* ---------------- editable site content (text/images) ---------------- */

export type { PublicContent, SiteContent };

/** Drops the address before the content crosses into a client component. */
export function toPublicContent(content: SiteContent): PublicContent {
  const { email: _email, ...rest } = content;
  return rest;
}

export const contentDefaults: SiteContent = {
  availability: site.availability,
  status: site.status,
  roleLong: site.roleLong,
  tagline: site.tagline,
  heroLead:
    `I'm ${site.name} — an ${site.role} at ${site.company}, in ${site.address.locality}. In August 2026, AI made 99.77% of my line changes. In October 2025 it made 0%. What I do with the hours I no longer spend typing: specs, architecture, tests and reviews.`,
  aboutParagraphs: [
    `I'm ${site.name}, an ${site.role} at ${site.company}, based in ${site.address.locality}, ${site.address.region}. My job title changed in 2026, and so did the work behind it. I write the specification, direct the coding agents that implement it, and review and test what comes back. The judgement calls — what to build, how it should be shaped, whether the result is actually correct — stayed with me. The typing did not.`,
    "The clearest way to describe the shift is with one number. In October 2025, AI wrote 0% of the lines I changed. In August 2026, it wrote 99.77% of them. Nothing about that makes the engineering easier; it moves where the engineering happens. A vague ticket used to produce slow code. Now it produces confident, well-formatted, wrong code — much faster. So the specification stopped being paperwork and became the actual deliverable.",
    "What that looks like day to day: I write down the exact behaviour, the field names, the status values and the acceptance criteria before anything is generated. I keep the work in phases small enough to review properly. I read every diff. I write the tests myself, or I make sure the agent's tests fail for the right reasons before I trust them. When a path is going wrong, I stop and rewind rather than argue the build forward. Most of my value now sits in the review, and in knowing which 0.23% of the lines had to be mine.",
    "I did not start here. Before this I shipped full-stack MERN products end-to-end — production Express and MongoDB backends with JWT auth, rate limiting, realtime sockets and structured logging, behind React front ends built to a performance budget. The habits came from there: 70% faster queries through indexing and aggregation, roughly 60% less bandwidth through caching, 98 Lighthouse. Numbers settle arguments that opinions cannot, and that has not changed just because something else is writing the lines.",
    `I studied B.Sc. Information Technology at ${site.university}, and won a pair of inter-college technical competitions along the way. Outside the day job I run AI-PULSE — a YouTube channel that publishes itself, one video and one Short about a trending AI tool every day, entirely on GitHub Actions with no server and no bill. This site is the other proof: a Next.js front end, a MongoDB-backed API, a self-built analytics pipeline and an admin dashboard, all designed and engineered end-to-end and all inspectable from the outside.`,
  ],
  now: { ...now },
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
