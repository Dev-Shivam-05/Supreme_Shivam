import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { JsonLd, blogPostingLd, PERSON_ID } from "@/components/seo/json-ld";
import { pageMeta } from "@/lib/seo";
import { site } from "@/lib/site";
import { getPost, posts, postsByDate } from "@/lib/writing";

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  const meta = pageMeta({ title: post.title, description: post.summary, path: `/writing/${slug}` });
  return {
    ...meta,
    openGraph: {
      ...meta.openGraph,
      type: "article",
      publishedTime: post.published,
      modifiedTime: post.updated ?? post.published,
      authors: [site.url],
      tags: post.tags,
    },
  };
}

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

export default async function PostPage({ params }: Params) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const others = postsByDate.filter((p) => p.slug !== post.slug).slice(0, 2);

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: site.url },
      { "@type": "ListItem", position: 2, name: "Writing", item: `${site.url}/writing` },
      { "@type": "ListItem", position: 3, name: post.title, item: `${site.url}/writing/${post.slug}` },
    ],
  };

  return (
    <>
      <JsonLd data={blogPostingLd(post)} />
      <JsonLd data={breadcrumbLd} />

      <article className="relative">
        <header className="relative overflow-hidden pt-36 md:pt-44">
          <div className="grid-bg pointer-events-none absolute inset-0 opacity-40" />
          <div className="container-x relative pb-12 md:pb-16">
            <Link
              href="/writing"
              className="hud mb-8 inline-flex items-center gap-2 transition-colors hover:text-accent"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              All writing
            </Link>
            <h1 className="font-poster display-3 max-w-4xl">{post.title}</h1>
            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border pt-6">
              <time dateTime={post.published} className="font-mono text-sm text-accent">
                {fmt(post.published)}
              </time>
              <span className="hud">{post.readingMinutes} min read</span>
              <span className="hud">
                {site.name} · {site.role}
              </span>
            </div>
          </div>
        </header>

        <div className="container-x pb-24">
          <div className="max-w-2xl">
            <p className="border-l-2 border-accent pl-6 text-lg leading-relaxed text-fg md:text-xl">
              {post.summary}
            </p>

            {post.body.map((block, i) => (
              <section key={i} className="mt-12">
                {block.h && (
                  <h2 className="font-display text-2xl font-semibold leading-tight md:text-3xl">
                    {block.h}
                  </h2>
                )}
                <div className={block.h ? "mt-5 space-y-5" : "space-y-5"}>
                  {block.p.map((para, j) => (
                    <p key={j} className="text-lg leading-relaxed text-fg-muted">
                      {para}
                    </p>
                  ))}
                </div>
              </section>
            ))}

            {/* A face and a name at the end of every article — the strongest place
                to restate the entity, and the block Google most often lifts. */}
            <aside className="mt-16 flex flex-wrap items-center gap-6 border-t border-border pt-10">
              {/* eslint-disable-next-line @next/next/no-img-element -- stable,
                  name-carrying /images/… path is the point; next/image rewrites it to
                  /_next/image?url=… which carries no filename signal for image search. */}
              <img
                src={site.images.avatar}
                alt={site.images.alt}
                width={1000}
                height={1000}
                loading="lazy"
                decoding="async"
                className="h-20 w-20 shrink-0 rounded-full object-cover"
              />
              <div className="min-w-[16rem] flex-1">
                <p className="font-display text-lg font-semibold text-fg">{site.name}</p>
                <p className="mt-1 text-sm text-fg-muted">
                  {site.role} at {site.company}, based in {site.address.locality}. {site.taglineShort}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link href="/about" className="sweep border border-border px-4 py-2 text-sm text-fg-muted">
                    About
                  </Link>
                  <a
                    href={site.social.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="sweep border border-border px-4 py-2 text-sm text-fg-muted"
                  >
                    LinkedIn
                  </a>
                  <a
                    href={site.social.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="sweep border border-border px-4 py-2 text-sm text-fg-muted"
                  >
                    GitHub
                  </a>
                </div>
              </div>
            </aside>
          </div>
        </div>

        {others.length > 0 && (
          <section className="border-t border-border">
            <div className="container-x py-16">
              <p className="hud tick mb-8">Read next</p>
              <div className="grid gap-px overflow-hidden border border-border bg-border md:grid-cols-2">
                {others.map((p) => (
                  <Link key={p.slug} href={`/writing/${p.slug}`} className="group bg-bg-elev p-8">
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="font-display text-xl font-semibold leading-tight transition-colors group-hover:text-accent">
                        {p.title}
                      </h3>
                      <ArrowUpRight className="h-5 w-5 shrink-0 text-fg-faint transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent" />
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-fg-muted">{p.summary}</p>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </article>

      {/* Keeps the author reference resolvable even if this page is read alone. */}
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          "@id": `${site.url}/writing/${post.slug}`,
          url: `${site.url}/writing/${post.slug}`,
          name: post.title,
          about: { "@id": PERSON_ID },
        }}
      />
    </>
  );
}
