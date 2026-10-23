"use client";

import { cn } from "@/lib/utils";

/**
 * Referrers that are answer engines rather than search engines. A click from
 * one of these means the site was cited inside a generated answer, which is a
 * different signal from a blue-link click and worth marking as such.
 */
const AI_REFERRERS = new Set([
  "chatgpt.com",
  "chat.openai.com",
  "perplexity.ai",
  "www.perplexity.ai",
  "claude.ai",
  "gemini.google.com",
  "copilot.microsoft.com",
]);

export const isAiReferrer = (host: string) => AI_REFERRERS.has(host.toLowerCase());

/* ---------------------------------------------------------------- KPI */

export function Kpi({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "accent";
}) {
  return (
    <div className="brackets deck-rise relative flex h-[140px] flex-col justify-between overflow-hidden border border-border bg-bg-elev p-5">
      <div className="scanlines pointer-events-none absolute inset-0 opacity-30" />
      <div className="hud relative">{label}</div>
      <div className="relative">
        <div
          className={cn(
            "font-poster text-[2.75rem] leading-none",
            tone === "accent" ? "text-accent" : "text-fg",
          )}
        >
          {value}
        </div>
        {hint && <div className="mt-1.5 font-mono text-[0.68rem] text-fg-faint">{hint}</div>}
      </div>
    </div>
  );
}

export function KpiSkeleton() {
  return <div className="deck-skeleton h-[140px]" />;
}

/* -------------------------------------------------------------- Panel */

export function Panel({
  title,
  action,
  children,
  className,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("deck-rise border border-border bg-bg-elev", className)}>
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5">
        <div className="hud">{title}</div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------ BarList */

export function BarList({
  items,
  markAi = false,
}: {
  items: { label: string; count: number }[];
  markAi?: boolean;
}) {
  if (items.length === 0) return <Empty line="No data in this range" />;
  const max = Math.max(1, ...items.map((i) => i.count));
  const showLegend = markAi && items.some((i) => isAiReferrer(i.label));

  return (
    <div>
      <div className="space-y-1.5">
        {items.map((it) => {
          const ai = markAi && isAiReferrer(it.label);
          return (
            <div
              key={it.label}
              className="relative flex h-10 items-center justify-between overflow-hidden border border-border bg-bg px-3"
            >
              <div
                className={cn("absolute inset-y-0 left-0", ai ? "bg-chart-2/25" : "bg-accent/15")}
                style={{ width: `${(it.count / max) * 100}%` }}
              />
              <span className="relative z-10 flex min-w-0 items-center gap-2 pr-3">
                {ai && <span className="text-[0.6rem] leading-none text-chart-2">◆</span>}
                <span className="truncate text-sm text-fg">{it.label}</span>
              </span>
              <span className={cn("relative z-10 font-mono text-sm", ai ? "text-chart-2" : "text-accent")}>
                {it.count}
              </span>
            </div>
          );
        })}
      </div>
      {showLegend && (
        <p className="mt-3 font-mono text-[0.65rem] text-fg-faint">
          <span className="text-chart-2">◆</span> answer engine — the site was cited inside a generated answer
        </p>
      )}
    </div>
  );
}

export function BarListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-1.5">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="deck-skeleton h-10" />
      ))}
    </div>
  );
}

/* ---------------------------------------------------- Empty and error */

export function Empty({ line, detail }: { line: string; detail?: string }) {
  return (
    <div className="py-6 text-center">
      <div className="hud">{line}</div>
      {detail && <p className="mx-auto mt-2 max-w-xs text-sm text-fg-muted">{detail}</p>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="border border-signal bg-bg-elev p-6 text-center">
      <div className="hud mb-2 text-signal">Request failed</div>
      <p className="mb-4 text-sm text-fg-muted">{message}</p>
      <button
        onClick={onRetry}
        className="border border-signal px-4 py-2 font-mono text-xs uppercase tracking-wider text-signal transition-colors duration-[160ms] hover:bg-signal hover:text-white"
      >
        Retry
      </button>
    </div>
  );
}

/* -------------------------------------------------- Segmented control */

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { id: T; label: string; title?: string }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div role="group" aria-label={label} className="inline-flex border border-border">
      {options.map((o, i) => (
        <button
          key={o.id}
          type="button"
          title={o.title}
          aria-pressed={value === o.id}
          onClick={() => onChange(o.id)}
          className={cn(
            "px-3 py-1.5 font-mono text-[0.65rem] uppercase tracking-wider transition-colors duration-[160ms]",
            i > 0 && "border-l border-border",
            value === o.id
              ? "bg-accent text-accent-ink"
              : "text-fg-muted hover:bg-glass hover:text-fg",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
