import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  title: "Lab",
  description:
    "The lab — experiments, interactions and infrastructure Shivam Bhadoriya is building, including this site's own systems.",
  path: "/lab",
});

const experiments = [
  {
    tag: "WebGL",
    title: "Aurora shader hero",
    body: "A domain-warped fbm shader running in React Three Fiber, tuned to sit behind type and react to the cursor.",
    status: "Live · this site",
  },
  {
    tag: "Interaction",
    title: "⌘K command palette",
    body: "Fuzzy navigation, theme switching and quick actions. Press ⌘K anywhere on this site to try it.",
    status: "Live · this site",
  },
  {
    tag: "Realtime",
    title: "Self-built analytics pipeline",
    body: "A beacon → API → Postgres → rollup pipeline feeding a live admin dashboard over Socket.io. Where visitors come from, why, and how.",
    status: "In build",
  },
  {
    tag: "Open source",
    title: "GitHub contribution art",
    body: "A generator that paints custom patterns onto a contribution graph via a scheduled commit engine.",
    status: "Shipped",
    href: "/work/contribution-art",
  },
];

export default function LabPage() {
  return (
    <>
      <PageHeader
        index="04"
        label="The garage"
        title="Experiments &"
        accent="infrastructure."
        description="Where I test ideas and build the systems that power this site. Some ship, some stay parked — all of it is real."
      />
      <section className="container-x pb-32">
        <div className="grid gap-px overflow-hidden border border-border bg-border md:grid-cols-2">
          {experiments.map((e) => {
            const inner = (
              <div className="group flex h-full flex-col bg-bg-elev p-8 transition-colors hover:bg-surface md:p-10">
                <div className="flex items-center justify-between">
                  <span className="border border-border px-2.5 py-1 font-mono text-[0.65rem] uppercase tracking-widest text-fg-muted">
                    {e.tag}
                  </span>
                  <span className="hud">{e.status}</span>
                </div>
                <h3 className="mt-8 font-poster text-3xl transition-colors group-hover:text-accent md:text-4xl">
                  {e.title}
                </h3>
                <p className="mt-4 max-w-md text-fg-muted">{e.body}</p>
              </div>
            );
            return e.href ? (
              <Link key={e.title} href={e.href}>
                {inner}
              </Link>
            ) : (
              <div key={e.title}>{inner}</div>
            );
          })}
        </div>
      </section>
    </>
  );
}
