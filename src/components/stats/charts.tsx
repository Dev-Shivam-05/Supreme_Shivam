"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Point = { date: string; views: number; visitors?: number };

export function TrendChart({ data }: { data: Point[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center border border-dashed border-border">
        <span className="hud">Awaiting traffic</span>
      </div>
    );
  }
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id="fillViews" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#cbff3c" stopOpacity={0.5} />
              <stop offset="100%" stopColor="#cbff3c" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: "#8f8f88" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(d: string) => d.slice(5)}
          />
          <YAxis tick={{ fontSize: 10, fill: "#8f8f88" }} tickLine={false} axisLine={false} width={30} allowDecimals={false} />
          <Tooltip
            contentStyle={{ background: "#0e0e11", border: "1px solid rgba(255,255,255,0.12)", fontSize: 12, borderRadius: 0 }}
            labelStyle={{ color: "#f3f3ef" }}
            itemStyle={{ color: "#cbff3c" }}
          />
          <Area type="monotone" dataKey="views" stroke="#cbff3c" strokeWidth={2} fill="url(#fillViews)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BarList({ items }: { items: { label: string; count: number }[] }) {
  const max = Math.max(1, ...items.map((i) => i.count));
  if (items.length === 0) return <p className="hud py-4">No data yet</p>;
  return (
    <div className="space-y-2">
      {items.map((it) => (
        <div key={it.label} className="relative flex items-center justify-between overflow-hidden border border-border bg-bg px-3 py-2.5">
          <div className="absolute inset-y-0 left-0 bg-accent/15" style={{ width: `${(it.count / max) * 100}%` }} />
          <span className="relative z-10 truncate pr-3 text-sm text-fg">{it.label}</span>
          <span className="relative z-10 font-mono text-sm text-accent">{it.count}</span>
        </div>
      ))}
    </div>
  );
}

export function Kpi({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="brackets relative overflow-hidden border border-border bg-bg-elev p-6">
      <div className="scanlines pointer-events-none absolute inset-0 opacity-40" />
      <div className="relative">
        <div className="hud">{label}</div>
        <div className="mt-3 font-poster text-4xl text-fg md:text-5xl">{value}</div>
        {hint && <div className="mt-1 font-mono text-xs text-fg-faint">{hint}</div>}
      </div>
    </div>
  );
}
