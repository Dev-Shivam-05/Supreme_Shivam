import Link from "next/link";
import { ArrowUpRight, Check, Phone } from "lucide-react";
import { Reveal } from "@/components/ux/reveal";
import { type Project } from "@/lib/site";
import { site } from "@/lib/site";
import { type ServicePage } from "@/lib/services";

/**
 * The shared renderer for every /services/* and /hire/* page.
 *
 * The structure is fixed on purpose — H1 naming the service and the place,
 * prose, price, timeline, proof that links to real case studies, FAQ, CTA —
 * because that is the shape DEV-HANDOVER task 7 specifies and the shape these
 * pages have to keep to convert.
 */
export function ServicePageView({
  page,
  proof,
}: {
  page: ServicePage;
  proof: Project[];
}) {
  return (
    <>
      <header className="relative overflow-hidden pt-36 md:pt-44">
        <div className="grid-bg pointer-events-none absolute inset-0 opacity-40" />
        <div className="container-x relative pb-14 md:pb-20">
          <div className="hud tick mb-8">
            {page.index} — {page.label}
          </div>
          <h1
            className="hero-fade font-poster display-2 max-w-5xl"
            style={{ animationDelay: "0.05s" }}
          >
            {page.h1} <span className="text-accent">{page.h1Accent}</span>
          </h1>
          <p
            className="hero-fade mt-8 max-w-2xl text-lg leading-relaxed text-fg-muted"
            style={{ animationDelay: "0.14s" }}
          >
            {page.lede}
          </p>

          {/* Price and timeline sit above the fold on purpose — clients filter on
              both, and a page that hides them wastes the visit. */}
          <div
            className="hero-fade mt-10 grid max-w-3xl gap-px overflow-hidden border border-border bg-border sm:grid-cols-2"
            style={{ animationDelay: "0.22s" }}
          >
            <div className="bg-bg-elev p-6">
              <div className="hud">Starts at</div>
              <div className="mt-2 font-poster text-4xl text-accent">
                {page.priceFrom}
              </div>
              <p className="mt-2 text-sm text-fg-muted">{page.priceNote}</p>
            </div>
            <div className="bg-bg-elev p-6">
              <div className="hud">Typical timeline</div>
              <div className="mt-2 font-display text-xl font-semibold text-fg">
                {page.timeline}
              </div>
              <p className="mt-2 text-sm text-fg-muted">
                Agreed as a date in writing before anything starts.
              </p>
            </div>
          </div>

          <div
            className="hero-fade mt-8 flex flex-wrap items-center gap-3"
            style={{ animationDelay: "0.3s" }}
          >
            <Link
              href="/contact"
              className="group inline-flex items-center gap-2 bg-accent px-6 py-3.5 text-sm font-semibold text-accent-ink"
            >
              Book a free 30-minute call
              <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
            <Link
              href="/work"
              className="inline-flex items-center gap-2 border border-border px-6 py-3.5 text-sm text-fg-muted transition-colors hover:border-accent hover:text-fg"
            >
              See the work first
            </Link>
            {/* Local buyers phone. Omitted entirely when no number is set. */}
            {site.phone && (
              <a
                href={`tel:${site.phone}`}
                className="inline-flex items-center gap-2 border border-border px-6 py-3.5 text-sm text-fg-muted transition-colors hover:border-accent hover:text-fg"
              >
                <Phone className="h-4 w-4" />
                {site.phoneDisplay}
              </a>
            )}
          </div>
        </div>
      </header>

      {/* prose */}
      <section className="container-x border-t border-border py-16 md:py-24">
        <div className="grid gap-14 md:grid-cols-[1fr_0.7fr] md:gap-20">
          <div className="max-w-2xl">
            {page.sections.map((s, i) => (
              <Reveal key={s.h} delay={i * 0.04}>
                <div className={i === 0 ? "" : "mt-12"}>
                  <h2 className="font-display text-2xl font-semibold leading-tight md:text-3xl">
                    {s.h}
                  </h2>
                  <div className="mt-5 space-y-5">
                    {s.p.map((para, j) => (
                      <p
                        key={j}
                        className="text-lg leading-relaxed text-fg-muted"
                      >
                        {para}
                      </p>
                    ))}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          <aside>
            <div className="md:sticky md:top-28">
              <p className="hud tick mb-6">What you get</p>
              <ul className="space-y-5">
                {page.deliverables.map((d) => (
                  <li key={d.title} className="flex gap-3">
                    <Check className="mt-1 h-4 w-4 shrink-0 text-accent" />
                    <div>
                      <div className="text-sm font-semibold text-fg">
                        {d.title}
                      </div>
                      <p className="mt-1 text-sm leading-relaxed text-fg-muted">
                        {d.body}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </section>

      {/* proof — links to the real case studies, not logos */}
      {proof.length > 0 && (
        <section className="border-y border-border bg-bg-elev">
          <div className="container-x py-16 md:py-24">
            <p className="hud tick mb-6">Proof</p>
            <h2 className="font-poster display-3 max-w-3xl">
              Shipped, measured,{" "}
              <span className="text-accent">inspectable.</span>
            </h2>
            <div className="mt-12 grid gap-px overflow-hidden border border-border bg-border md:grid-cols-3">
              {proof.map((p) => (
                <Link
                  key={p.slug}
                  href={`/work/${p.slug}`}
                  className="group bg-bg p-8"
                >
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="font-poster text-2xl transition-colors group-hover:text-accent">
                      {p.title}
                    </h3>
                    <ArrowUpRight className="h-5 w-5 shrink-0 text-fg-faint transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent" />
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-fg-muted">
                    {p.summary}
                  </p>
                  <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 border-t border-border pt-5">
                    {p.metrics.slice(0, 2).map((m) => (
                      <div key={m.label}>
                        <div className="font-poster text-lg text-accent">
                          {m.value}
                        </div>
                        <div className="hud mt-0.5">{m.label}</div>
                      </div>
                    ))}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ — native <details>, works without JS, and matches the FAQPage schema */}
      <section className="container-x py-16 md:py-24">
        <div className="grid gap-12 md:grid-cols-[0.7fr_1fr] md:gap-20">
          <div>
            <p className="hud tick mb-6">Questions</p>
            <h2 className="font-poster display-3">
              Asked and <span className="text-accent">answered.</span>
            </h2>
            <p className="mt-6 max-w-sm text-fg-muted">
              If yours is not here, ask it on the call. I reply within 24 hours.
            </p>
          </div>
          <div className="border-t border-border">
            {page.faqs.map((f) => (
              <details key={f.q} className="group border-b border-border py-6">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                  <h3 className="font-display text-lg font-medium text-fg md:text-xl">
                    {f.q}
                  </h3>
                  <span className="grid h-7 w-7 shrink-0 place-items-center border border-border font-mono text-fg-muted transition-colors group-open:border-accent group-open:text-accent">
                    <span className="transition-transform duration-300 group-open:rotate-45">
                      +
                    </span>
                  </span>
                </summary>
                <p className="mt-4 max-w-2xl leading-relaxed text-fg-muted">
                  {f.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* closing CTA */}
      <section className="border-t border-border">
        <div className="container-x py-20 md:py-28">
          <div className="flex flex-wrap items-end justify-between gap-10">
            <div>
              <p className="hud tick mb-6">{site.availability}</p>
              <h2 className="font-poster display-2 max-w-3xl leading-[0.85]">
                Tell me the problem.
                <br />
                <span className="text-accent">
                  I&apos;ll tell you the price.
                </span>
              </h2>
              <p className="mt-8 max-w-xl text-lg text-fg-muted">
                A free 30-minute call, no obligation. If I am not the right
                person for it, I will say so and point you at who is.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/contact"
                className="group inline-flex items-center gap-3 bg-accent px-7 py-4 font-semibold text-accent-ink"
              >
                Start the conversation
                <ArrowUpRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
              {site.phone && (
                <a
                  href={`tel:${site.phone}`}
                  className="inline-flex items-center gap-3 border border-border px-7 py-4 font-semibold text-fg-muted transition-colors hover:border-accent hover:text-fg"
                >
                  <Phone className="h-5 w-5" />
                  {site.phoneDisplay}
                </a>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
