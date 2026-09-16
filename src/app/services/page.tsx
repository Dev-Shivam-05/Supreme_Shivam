import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { JsonLd, PERSON_ID } from "@/components/seo/json-ld";
import { pageMeta } from "@/lib/seo";
import { hireOnly, serviceOnly, servicePages } from "@/lib/services";
import { site } from "@/lib/site";

export const metadata = pageMeta({
  title: "Services",
  description: `Web development, mobile apps and AI automation for businesses in ${site.address.locality}, Surat and across India. Fixed quotes from ${site.rateFrom}, by Shivam Bhadoriya.`,
  path: "/services",
});

/** Links every service page from one place — a page nothing links to gets crawled late. */
export default function ServicesIndex() {
  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Services",
    itemListElement: servicePages.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: p.title,
      description: p.description,
      url: `${site.url}${p.slug}`,
    })),
  };

  const groups = [
    { heading: "What I build", pages: serviceOnly },
    { heading: "Hire locally", pages: hireOnly },
  ];

  return (
    <>
      <JsonLd data={itemListLd} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          "@id": `${site.url}/services`,
          url: `${site.url}/services`,
          name: "Services",
          about: { "@id": PERSON_ID },
        }}
      />
      <PageHeader
        index="01"
        label="Work with me"
        title="Websites, apps and"
        accent="automation."
        description={`Fixed quotes from ${site.rateFrom}, agreed before anything starts. I am based in ${site.address.locality} and work with businesses there, in Surat, and remotely across India.`}
      />

      <section className="container-x pb-28">
        {groups.map((g) => (
          <div key={g.heading} className="mb-14">
            <p className="hud tick mb-6">{g.heading}</p>
            <div className="grid gap-px overflow-hidden border border-border bg-border md:grid-cols-2">
              {g.pages.map((p) => (
                <Link key={p.slug} href={p.slug} className="group bg-bg-elev p-8 md:p-10">
                  <div className="flex items-start justify-between gap-4">
                    <h2 className="font-poster text-3xl transition-colors group-hover:text-accent md:text-4xl">
                      {p.h1} {p.h1Accent}
                    </h2>
                    <ArrowUpRight className="h-5 w-5 shrink-0 text-fg-faint transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent" />
                  </div>
                  <p className="mt-4 max-w-md leading-relaxed text-fg-muted">{p.lede}</p>
                  <div className="mt-6 flex flex-wrap gap-x-8 gap-y-2 border-t border-border pt-5">
                    <div>
                      <div className="font-poster text-xl text-accent">{p.priceFrom}</div>
                      <div className="hud mt-0.5">Starts at</div>
                    </div>
                    <div>
                      <div className="font-mono text-sm text-fg">{p.timeline.split(" · ")[0]}</div>
                      <div className="hud mt-0.5">Typical timeline</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </section>
    </>
  );
}
