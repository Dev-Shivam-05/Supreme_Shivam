import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { Reveal } from "@/components/ux/reveal";
import { DeepDive } from "@/components/work/deep-dive";
import { site, type Project } from "@/lib/site";

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-border py-10">
      <h2 className="hud tick mb-6">{title}</h2>
      {children}
    </div>
  );
}

export function CaseStudy({ project: p, projects }: { project: Project; projects: Project[] }) {
  const idx = projects.findIndex((x) => x.slug === p.slug);
  const next = projects[(idx + 1) % projects.length] ?? p;

  return (
    <article>
      <header className="relative overflow-hidden pt-36 md:pt-44">
        <div className="grid-bg pointer-events-none absolute inset-0 opacity-40" />
        <div className="container-x relative pb-12">
          <Link href="/work" className="hud tick mb-8 inline-flex hover:text-accent">
            <ArrowLeft className="h-3.5 w-3.5" /> All work
          </Link>
          <div className="hud mb-6">Case Study · /{p.index}</div>
          <Reveal>
            <h1 className="font-poster display-2 max-w-5xl">{p.title}</h1>
          </Reveal>
          <Reveal delay={0.06}>
            <p className="mt-8 max-w-2xl text-lg leading-relaxed text-fg-muted">{p.summary}</p>
          </Reveal>
        </div>
      </header>

      {/* metrics band */}
      <div className="container-x">
        <div className="grid grid-cols-2 gap-px overflow-hidden border border-border bg-border md:grid-cols-3">
          {p.metrics.map((m) => (
            <div key={m.label} className="bg-bg-elev p-8">
              <div className="font-poster text-4xl text-accent md:text-5xl">{m.value}</div>
              <div className="hud mt-2">{m.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="container-x grid gap-12 py-16 md:grid-cols-[1fr_18rem] md:gap-16">
        <div>
          <Block title="The problem">
            <p className="max-w-2xl text-lg leading-relaxed text-fg-muted">{p.problem}</p>
          </Block>
          <Block title="Approach">
            <ul className="max-w-2xl space-y-4">
              {p.approach.map((a, i) => (
                <li key={i} className="flex gap-4 text-fg-muted">
                  <span className="font-mono text-sm text-accent">{String(i + 1).padStart(2, "0")}</span>
                  <span className="leading-relaxed">{a}</span>
                </li>
              ))}
            </ul>
          </Block>
          <DeepDive count={p.architecture.length}>
            <div className="flex flex-col gap-2">
              {p.architecture.map((a, i) => (
                <div key={i} className="flex items-center gap-3 border border-border bg-bg-elev px-4 py-3 font-mono text-sm text-fg-muted">
                  <span className="text-accent">▸</span>
                  {a}
                </div>
              ))}
            </div>
          </DeepDive>
          <Block title="Outcomes">
            <ul className="max-w-2xl space-y-3">
              {p.outcomes.map((o, i) => (
                <li key={i} className="flex gap-3 text-fg">
                  <span className="text-accent">✓</span>
                  <span>{o}</span>
                </li>
              ))}
            </ul>
          </Block>
        </div>

        <aside className="h-fit md:sticky md:top-28">
          <div className="border border-border bg-bg-elev p-6">
            <dl className="space-y-5">
              {[
                { k: "Role", v: p.role },
                { k: "Timeline", v: p.timeline },
                { k: "Category", v: p.category },
              ].map((row) => (
                <div key={row.k}>
                  <dt className="hud">{row.k}</dt>
                  <dd className="mt-1 text-sm text-fg">{row.v}</dd>
                </div>
              ))}
              <div>
                <dt className="hud mb-2">Stack</dt>
                <dd className="flex flex-wrap gap-2">
                  {p.stack.map((s) => (
                    <span key={s} className="border border-border px-2.5 py-1 font-mono text-xs text-fg-muted">
                      {s}
                    </span>
                  ))}
                </dd>
              </div>
            </dl>
            <div className="mt-6 flex flex-col gap-2 border-t border-border pt-6">
              <a href={p.repo ?? site.social.github} target="_blank" rel="noopener noreferrer" className="group inline-flex items-center justify-between border border-border px-4 py-3 text-sm transition-colors hover:border-accent">
                View source <ArrowUpRight className="h-4 w-4 text-fg-faint group-hover:text-accent" />
              </a>
              {p.live && (
                <a href={p.live} target="_blank" rel="noopener noreferrer" className="group inline-flex items-center justify-between bg-accent px-4 py-3 text-sm font-semibold text-accent-ink">
                  Live demo <ArrowUpRight className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* next project */}
      <Link href={`/work/${next.slug}`} className="group block border-t border-border">
        <div className="container-x flex items-center justify-between py-14">
          <div>
            <div className="hud mb-3">Next case</div>
            <div className="font-poster text-4xl transition-colors group-hover:text-accent md:text-6xl">
              {next.title}
            </div>
          </div>
          <ArrowUpRight className="h-8 w-8 text-fg-faint transition-all duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-accent" />
        </div>
      </Link>
    </article>
  );
}
