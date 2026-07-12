import { revalidatePath } from "next/cache";

const FIELDS = [
  "slug", "index", "title", "category", "year", "role", "timeline", "summary",
  "description", "stack", "metrics", "problem", "approach", "architecture",
  "outcomes", "pattern", "flagship", "imageUrl", "repo", "live", "order", "published",
] as const;

/** Whitelist the fields a client may write to a Project. */
export function pick(body: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const f of FIELDS) if (f in body) out[f] = body[f];
  return out;
}

/** Refresh the public pages that render project content. */
export function revalidateSite(slug?: string) {
  revalidatePath("/");
  revalidatePath("/work");
  if (slug) revalidatePath(`/work/${slug}`);
}
