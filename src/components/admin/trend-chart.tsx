"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { SeriesPoint } from "@/lib/analytics";
import { Empty } from "./primitives";

/**
 * Explicit Y ticks.
 *
 * recharts' own ticks produced `4, 3, 2, 3, 3` on this data: with
 * `allowDecimals={false}` it rounds a domain of 0–4 into five slots and three
 * of them collapse onto the same integer. Generating the ticks here means a
 * label can never repeat, whatever the range.
 */
export function yTicks(max: number): number[] {
  if (max <= 0) return [0, 1];
  if (max < 5) return Array.from({ length: max + 1 }, (_, i) => i);
  const step = Math.ceil(max / 4);
  const out: number[] = [];
  for (let v = 0; v <= max; v += step) out.push(v);
  if (out[out.length - 1] !== max) out.push(max);
  return [...new Set(out)];
}

const SERIES = [
  { key: "human", label: "Human", color: "var(--accent)" },
  { key: "untagged", label: "Untagged", color: "var(--chart-2)" },
  { key: "bot", label: "Bot", color: "var(--fg-faint)" },
] as const;

function TooltipBody({ active, payload, label }: {
  active?: boolean;
  payload?: { dataKey: string; value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((a, p) => a + (p.value || 0), 0);
  return (
    <div className="border border-border-strong bg-bg-elev px-3 py-2 shadow-none">
      <div className="hud mb-1.5">{label}</div>
      {SERIES.map((s) => {
        const row = payload.find((p) => p.dataKey === s.key);
        if (!row?.value) return null;
        return (
          <div key={s.key} className="flex items-center gap-2 font-mono text-xs">
            <span className="h-2 w-2 shrink-0" style={{ background: s.color }} />
            <span className="text-fg-muted">{s.label}</span>
            <span className="ml-auto pl-4 text-fg">{row.value}</span>
          </div>
        );
      })}
      <div className="mt-1.5 border-t border-border pt-1.5 font-mono text-xs text-fg-faint">
        total {total}
      </div>
    </div>
  );
}

export function TrendChart({ data }: { data: SeriesPoint[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-[280px] items-center justify-center border border-dashed border-border">
        <Empty line="Awaiting traffic" detail="Nothing has been recorded in this range yet." />
      </div>
    );
  }

  const max = Math.max(...data.map((d) => d.human + d.untagged + d.bot));
  const ticks = yTicks(max);

  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            {SERIES.map((s) => (
              <linearGradient key={s.key} id={`deck-fill-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity={0.5} />
                <stop offset="100%" stopColor={s.color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid stroke="var(--grid-line)" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: "var(--fg-faint)" }}
            tickLine={false}
            axisLine={false}
            minTickGap={24}
            tickFormatter={(d: string) => d.slice(5)}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "var(--fg-faint)" }}
            tickLine={false}
            axisLine={false}
            width={44}
            ticks={ticks}
            domain={[0, ticks[ticks.length - 1]]}
            allowDecimals={false}
          />
          <Tooltip content={<TooltipBody />} cursor={{ stroke: "var(--border-strong)" }} />
          {SERIES.map((s) => (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              stackId="views"
              stroke={s.color}
              strokeWidth={2}
              fill={`url(#deck-fill-${s.key})`}
              isAnimationActive={false}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ChartLegend() {
  return (
    <div className="flex flex-wrap items-center gap-4">
      {SERIES.map((s) => (
        <span key={s.key} className="flex items-center gap-1.5 font-mono text-[0.65rem] text-fg-muted">
          <span className="h-2 w-2" style={{ background: s.color }} />
          {s.label}
        </span>
      ))}
    </div>
  );
}
