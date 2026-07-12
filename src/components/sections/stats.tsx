"use client";

import { animate, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Reveal } from "@/components/ux/reveal";
import { stats } from "@/lib/site";

function CountUp({ value }: { value: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -20% 0px" });
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(value);

  const match = value.match(/^(\D*)(\d+(?:\.\d+)?)(\D*)$/);

  useEffect(() => {
    if (!match || reduced) {
      setDisplay(value);
      return;
    }
    if (!inView) {
      setDisplay(`${match[1]}0${match[3]}`);
      return;
    }
    const [, prefix, num, suffix] = match;
    const target = parseFloat(num);
    const isFloat = num.includes(".");
    const controls = animate(0, target, {
      duration: 1.6,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        setDisplay(`${prefix}${isFloat ? v.toFixed(1) : Math.round(v)}${suffix}`);
      },
    });
    return () => controls.stop();
  }, [inView, reduced, value]); // eslint-disable-line react-hooks/exhaustive-deps

  return <span ref={ref}>{display}</span>;
}

export function Stats() {
  return (
    <section className="container-x border-b border-border py-20 md:py-28">
      <div className="grid grid-cols-2 gap-x-8 gap-y-14 md:grid-cols-4">
        {stats.map((s, i) => (
          <Reveal key={s.label} delay={i * 0.08}>
            <div className="flex flex-col gap-2">
              <div className="font-display text-5xl font-bold tracking-tight md:text-6xl">
                <CountUp value={s.value} />
              </div>
              <div className="text-sm font-medium text-fg">{s.label}</div>
              {s.sub && <div className="font-mono text-xs text-fg-faint">{s.sub}</div>}
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
