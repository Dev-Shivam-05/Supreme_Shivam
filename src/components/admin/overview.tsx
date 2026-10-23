"use client";

import type { ClassFilter, RangeKey, SeriesPoint } from "@/lib/analytics";
import { BarList, BarListSkeleton, Empty, Kpi, KpiSkeleton, Panel, Segmented } from "./primitives";
import { ChartLegend, TrendChart } from "./trend-chart";
import { LiveFeed } from "./live-feed";

export type OverviewData = {
  configured: boolean;
  pageviews: number;
  visitors: number;
  engaged: number;
  leadCount: number;
  newLeads: number;
  series: SeriesPoint[];
  topPaths: { label: string; count: number }[];
  topReferrers: { label: string; count: number }[];
  topCountries: { label: string; count: number }[];
  devices: { label: string; count: number }[];
  provenance: { human: number; untagged: number; bot: number; firstEvent: string | null; retentionDays: number };
};

const CLASS_OPTIONS: { id: ClassFilter; label: string; title: string }[] = [
  { id: "human", label: "Human", title: "A real browser that reported a country" },
  { id: "all", label: "All", title: "Every recorded event, including this project's own tooling" },
  { id: "bot", label: "Bot", title: "Headless Chrome, or a client ua-parser could not identify" },
];

const RANGE_OPTIONS: { id: RangeKey; label: string }[] = [
  { id: "7d", label: "7d" },
  { id: "30d", label: "30d" },
  { id: "all", label: "All" },
];

export function Overview({
  data,
  loading,
  range,
  klass,
  onRange,
  onClass,
}: {
  data: OverviewData | null;
  loading: boolean;
  range: RangeKey;
  klass: ClassFilter;
  onRange: (r: RangeKey) => void;
  onClass: (c: ClassFilter) => void;
}) {
  const p = data?.provenance;
  const engagedPct = data && data.visitors > 0 ? Math.round((data.engaged / data.visitors) * 100) : 0;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Segmented label="Visitor class" options={CLASS_OPTIONS} value={klass} onChange={onClass} />
        <Segmented label="Date range" options={RANGE_OPTIONS} value={range} onChange={onRange} />
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {loading || !data ? (
          Array.from({ length: 4 }).map((_, i) => <KpiSkeleton key={i} />)
        ) : (
          <>
            <Kpi
              label="Visitors"
              value={data.visitors.toLocaleString()}
              hint="session-days, not people"
              tone="accent"
            />
            <Kpi
              label="Pageviews"
              value={data.pageviews.toLocaleString()}
              hint={
                klass === "human" && p
                  ? `${p.bot} bot · ${p.untagged} untagged excluded`
                  : klass === "all"
                    ? "every event, tooling included"
                    : "this class only"
              }
            />
            <Kpi
              label="Engaged"
              value={data.engaged.toLocaleString()}
              hint={`${engagedPct}% of ${data.visitors} read a 2nd page`}
            />
            <Kpi
              label="Enquiries"
              value={data.leadCount.toLocaleString()}
              hint={`${data.newLeads} new`}
            />
          </>
        )}
      </div>

      <div className="mt-3 grid items-start gap-3 2xl:grid-cols-[1fr_380px]">
        <Panel title="Pageviews by day" action={<ChartLegend />}>
          {loading || !data ? <div className="deck-skeleton h-[280px]" /> : <TrendChart data={data.series} />}
        </Panel>

        <Panel title="Live feed">
          <LiveFeed />
        </Panel>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-2 2xl:grid-cols-4">
        <Panel title="Top pages">
          {loading || !data ? <BarListSkeleton /> : <BarList items={data.topPaths} />}
        </Panel>
        <Panel title="Sources — how they arrived">
          {loading || !data ? <BarListSkeleton /> : <BarList items={data.topReferrers} markAi />}
        </Panel>
        <Panel title="Countries">
          {loading || !data ? <BarListSkeleton /> : <BarList items={data.topCountries} />}
        </Panel>
        <Panel title="Devices">
          {loading || !data ? <BarListSkeleton rows={4} /> : <BarList items={data.devices} />}
        </Panel>
      </div>

      {p && !loading && <Provenance p={p} />}
    </div>
  );
}

/**
 * The line that keeps the panel honest.
 *
 * Every number above is a slice of the same collection; this says how the whole
 * was cut and when it started, so a figure can never be read as more than it is.
 */
function Provenance({ p }: { p: OverviewData["provenance"] }) {
  const since = p.firstEvent ? new Date(p.firstEvent).toISOString().slice(0, 10) : "—";
  const total = p.human + p.untagged + p.bot;
  return (
    <p className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-border pt-3 font-mono text-[0.65rem] text-fg-faint">
      <span className="text-accent">{p.human} human</span>
      <span aria-hidden>·</span>
      <span className="text-chart-2">{p.untagged} untagged</span>
      <span aria-hidden>·</span>
      <span>{p.bot} bot</span>
      <span aria-hidden>·</span>
      <span>{total} total</span>
      <span aria-hidden>·</span>
      <span>since {since}</span>
      <span aria-hidden>·</span>
      <span>raw events expire after {p.retentionDays}d</span>
    </p>
  );
}

/** Placeholder pages. 5b replaces these; saying so beats an empty screen. */
export function ComingSoon({ title, note }: { title: string; note: string }) {
  return (
    <div className="border border-dashed border-border p-12">
      <Empty line={title} detail={note} />
    </div>
  );
}
