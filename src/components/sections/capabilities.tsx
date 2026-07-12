"use client";

import { Stagger, StaggerItem } from "@/components/ux/reveal";
import { capabilities } from "@/lib/site";

export function Capabilities() {
  return (
    <section id="capabilities" className="container-x py-10 md:py-16">
      <Stagger className="grid gap-px overflow-hidden border border-border bg-border md:grid-cols-2">
        {capabilities.map((group) => (
          <StaggerItem key={group.title}>
            <div className="group h-full bg-bg-elev p-8 transition-colors duration-300 hover:bg-surface md:p-10">
              <div className="flex items-baseline justify-between">
                <h3 className="font-display text-2xl font-bold">{group.title}</h3>
                <span className="font-mono text-xs text-fg-faint">{group.note}</span>
              </div>
              <div className="mt-6 flex flex-wrap gap-2.5">
                {group.items.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-border bg-glass px-4 py-2 text-sm text-fg-muted transition-colors duration-300 group-hover:border-border-strong"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  );
}
