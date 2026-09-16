import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { EmailLink } from "@/components/ux/email-link";
import { LEGAL_UPDATED, type LegalSection } from "@/lib/legal";

/** Shared renderer for /privacy-policy and /terms. Plain prose, no theatre. */
export function LegalPageView({
  index,
  label,
  title,
  accent,
  description,
  sections,
}: {
  index: string;
  label: string;
  title: string;
  accent: string;
  description: string;
  sections: LegalSection[];
}) {
  return (
    <>
      <PageHeader index={index} label={label} title={title} accent={accent} description={description} />

      <section className="container-x pb-28">
        <div className="max-w-2xl">
          <p className="hud">Last updated · {LEGAL_UPDATED}</p>

          {sections.map((s, i) => (
            <div key={s.h} className={i === 0 ? "mt-10" : "mt-12"}>
              <h2 className="font-display text-2xl font-semibold leading-tight md:text-3xl">{s.h}</h2>
              {s.p && (
                <div className="mt-5 space-y-5">
                  {s.p.map((para, j) => (
                    <p key={j} className="text-lg leading-relaxed text-fg-muted">
                      {para}
                    </p>
                  ))}
                </div>
              )}
              {s.list && (
                <ul className="mt-5 space-y-3">
                  {s.list.map((item, j) => (
                    <li key={j} className="flex gap-3 text-lg leading-relaxed text-fg-muted">
                      <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}

          <div className="mt-14 border-t border-border pt-8">
            <p className="text-fg-muted">
              Questions about this page:{" "}
              <EmailLink className="text-accent underline-offset-4 hover:underline" />, or use the{" "}
              <Link href="/contact" className="text-accent underline-offset-4 hover:underline">
                contact form
              </Link>
              .
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
