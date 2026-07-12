import Image from "next/image";
import { Reveal } from "@/components/ux/reveal";
import { facts, site } from "@/lib/site";

export function About({ paragraphs }: { paragraphs: string[] }) {
  return (
    <section id="about" className="container-x py-16 md:py-24">
      <div className="grid gap-14 md:grid-cols-[1fr_0.85fr] md:gap-20">
        <div>
          <div className="space-y-6 text-lg leading-relaxed text-fg-muted">
            {paragraphs.map((para, i) => (
              <Reveal key={i} delay={i * 0.06}>
                <p>{para}</p>
              </Reveal>
            ))}
          </div>

          <div className="mt-12 grid grid-cols-1 gap-px overflow-hidden border border-border bg-border sm:grid-cols-2">
            {facts.map((f) => (
              <div key={f.k} className="bg-bg-elev p-6">
                <div className="hud">{f.k}</div>
                <div className="mt-2 text-sm font-medium text-fg">{f.v}</div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="brackets md:sticky md:top-28">
            <div className="group relative aspect-[4/5] overflow-hidden border border-border">
              <Image
                src="/personal/portrait-02.webp"
                alt={`${site.name} — portrait`}
                fill
                sizes="(max-width: 768px) 100vw, 40vw"
                className="img-duotone object-cover transition-all duration-700 group-hover:scale-[1.03]"
              />
              <div className="tint-accent absolute inset-0 opacity-30 transition-opacity duration-700 group-hover:opacity-0" />
              <div className="scanlines pointer-events-none absolute inset-0 opacity-60" />
              <div className="absolute inset-0 bg-gradient-to-t from-bg/80 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between p-4">
                <span className="hud hud-accent">{site.name}</span>
                <span className="hud">IND · 26°N</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
