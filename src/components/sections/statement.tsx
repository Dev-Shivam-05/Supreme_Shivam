"use client";

import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import { useRef, type ReactNode } from "react";

const TEXT =
  "I don't just style screens. I architect the system underneath — auth, data, realtime, observability — and make it feel effortless.";

function Word({
  children,
  progress,
  range,
}: {
  children: ReactNode;
  progress: MotionValue<number>;
  range: [number, number];
}) {
  const opacity = useTransform(progress, range, [0.12, 1]);
  return (
    <motion.span style={{ opacity }} className="mr-[0.28em] inline-block">
      {children}
    </motion.span>
  );
}

export function Statement() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.85", "end 0.55"],
  });
  const words = TEXT.split(" ");

  return (
    <section className="container-x py-32 md:py-48">
      <p className="eyebrow mb-10">Philosophy</p>
      <div
        ref={ref}
        className="display-3 max-w-5xl font-display font-semibold leading-[1.15] tracking-[-0.02em]"
      >
        {words.map((w, i) => {
          const start = i / words.length;
          const end = start + 1 / words.length;
          const emphasised = ["architect", "system", "effortless."].includes(w);
          return (
            <Word key={i} progress={scrollYProgress} range={[start, end]}>
              {emphasised ? (
                <span className="text-gradient">{w}</span>
              ) : (
                w
              )}
            </Word>
          );
        })}
      </div>
    </section>
  );
}
