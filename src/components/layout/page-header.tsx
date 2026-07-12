import { Reveal } from "@/components/ux/reveal";

export function PageHeader({
  index,
  label,
  title,
  accent,
  description,
}: {
  index: string;
  label: string;
  title: string;
  accent?: string;
  description?: string;
}) {
  return (
    <header className="relative overflow-hidden pt-36 md:pt-44">
      <div className="grid-bg pointer-events-none absolute inset-0 opacity-40" />
      <div className="container-x relative pb-14 md:pb-20">
        <div className="hud tick mb-8">
          {index} — {label}
        </div>
        <Reveal>
          <h1 className="font-poster display-2 max-w-5xl">
            {title} {accent && <span className="text-accent">{accent}</span>}
          </h1>
        </Reveal>
        {description && (
          <Reveal delay={0.06}>
            <p className="mt-8 max-w-2xl text-lg leading-relaxed text-fg-muted">
              {description}
            </p>
          </Reveal>
        )}
      </div>
    </header>
  );
}
