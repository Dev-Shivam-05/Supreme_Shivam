import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

const panels = [
  {
    href: "/work",
    index: "01",
    kicker: "On the grid",
    title: "Work",
    body: "Case studies with the architecture, trade-offs and measured outcomes — not just screenshots.",
  },
  {
    href: "/about",
    index: "02",
    kicker: "Off the grid",
    title: "About",
    body: "The engineer behind the work — how I think, what I optimise for, and where I'm headed.",
  },
];

export function Gateway() {
  return (
    <section className="border-t border-border">
      <div className="grid md:grid-cols-2">
        {panels.map((p, i) => (
          <Link
            key={p.href}
            href={p.href}
            className={`group relative overflow-hidden px-6 py-20 md:px-12 md:py-32 ${
              i === 0 ? "md:border-r border-border" : ""
            }`}
          >
            <div className="pointer-events-none absolute inset-0 origin-bottom scale-y-0 bg-accent transition-transform duration-500 ease-[cubic-bezier(0.7,0,0.1,1)] group-hover:scale-y-100" />
            <div className="relative">
              <div className="mb-8 flex items-center justify-between">
                <span className="hud transition-colors group-hover:text-accent-ink">
                  {p.index} · {p.kicker}
                </span>
                <ArrowUpRight className="h-6 w-6 text-fg-faint transition-all duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-accent-ink" />
              </div>
              <h3 className="font-poster text-6xl transition-colors group-hover:text-accent-ink md:text-8xl">
                {p.title}
              </h3>
              <p className="mt-6 max-w-sm text-fg-muted transition-colors group-hover:text-accent-ink/80">
                {p.body}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
