import { Stagger, StaggerItem } from "@/components/ux/reveal";
import { values } from "@/lib/site";

export function Values() {
  return (
    <section className="container-x border-t border-border py-20 md:py-28">
      <div className="mb-12">
        <p className="hud tick mb-6">Operating principles</p>
        <h2 className="font-poster display-3">
          What I <span className="text-accent">stand on.</span>
        </h2>
      </div>
      <Stagger className="grid gap-px overflow-hidden border border-border bg-border sm:grid-cols-2">
        {values.map((v) => (
          <StaggerItem key={v.title}>
            <div className="group h-full bg-bg-elev p-8 transition-colors hover:bg-surface md:p-10">
              <h3 className="font-poster text-2xl transition-colors group-hover:text-accent md:text-3xl">
                {v.title}
              </h3>
              <p className="mt-4 text-fg-muted">{v.body}</p>
            </div>
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  );
}
