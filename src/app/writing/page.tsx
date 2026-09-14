import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { JsonLd } from "@/components/seo/json-ld";
import { PERSON_ID } from "@/components/seo/json-ld";
import { pageMeta } from "@/lib/seo";
import { site } from "@/lib/site";
import { postsByDate } from "@/lib/writing";

export const metadata = pageMeta({
  title: "Writing",
  description:
    "Notes from Shivam Bhadoriya on working as an AI Engineer — specification-driven delivery, directing coding agents, review, tests and unattended pipelines.",
  path: "/writing",
});

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

export default function WritingPage() {
  const blogLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "@id": `${site.url}/writing#blog`,
    name: `Writing · ${site.name}`,
    description:
      "Notes on specification-driven delivery, directing AI coding agents, review and unattended pipelines.",
    url: `${site.url}/writing`,
    inLanguage: "en-IN",
    author: { "@id": PERSON_ID },
    publisher: { "@id": PERSON_ID },
    blogPost: postsByDate.map((p) => ({
      "@type": "BlogPosting",
      headline: p.title,
      description: p.summary,
      url: `${site.url}/writing/${p.slug}`,
      datePublished: p.published,
      dateModified: p.updated ?? p.published,
      author: { "@id": PERSON_ID },
    })),
  };

  return (
    <>
      <JsonLd data={blogLd} />
      <PageHeader
        index="04"
        label="In writing"
        title="Notes on the"
        accent="new job."
        description="Short pieces on what changed when agents started writing the implementation — specification, review, tests, and the systems I build around them."
      />

      <section className="container-x pb-32">
        <div className="border-t border-border">
          {postsByDate.map((p) => (
            <Link
              key={p.slug}
              href={`/writing/${p.slug}`}
              className="group relative grid gap-3 overflow-hidden border-b border-border py-9 md:grid-cols-[11rem_1fr_3rem] md:items-baseline md:gap-8 md:py-11"
            >
              <div className="pointer-events-none absolute inset-0 origin-left scale-x-0 bg-accent transition-transform duration-500 ease-[cubic-bezier(0.7,0,0.1,1)] group-hover:scale-x-100" />

              <div className="relative font-mono text-sm text-accent transition-colors group-hover:text-accent-ink">
                <time dateTime={p.published}>{fmt(p.published)}</time>
              </div>

              <div className="relative">
                <h2 className="font-display text-2xl font-semibold leading-tight transition-colors group-hover:text-accent-ink md:text-4xl">
                  {p.title}
                </h2>
                <p className="mt-3 max-w-2xl text-fg-muted transition-colors group-hover:text-accent-ink/80">
                  {p.summary}
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
                  <span className="hud transition-colors group-hover:text-accent-ink/70">
                    {p.readingMinutes} min read
                  </span>
                  {p.tags.map((t) => (
                    <span
                      key={t}
                      className="border border-border px-2.5 py-1 font-mono text-xs text-fg-muted transition-colors group-hover:border-accent-ink/30 group-hover:text-accent-ink/80"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <ArrowUpRight className="relative hidden h-6 w-6 justify-self-end text-fg-faint transition-all duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-accent-ink md:block" />
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
