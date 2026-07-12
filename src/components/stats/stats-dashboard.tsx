"use client";

import { useEffect, useState } from "react";
import { BarList, Kpi, TrendChart } from "./charts";

type Stats = {
  configured: boolean;
  totalViews: number;
  uniqueVisitors: number;
  topPaths: { label: string; count: number }[];
  series: { date: string; views: number; visitors: number }[];
};

export function StatsDashboard() {
  const [data, setData] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="container-x pb-24">
        <div className="h-64 animate-pulse border border-border bg-bg-elev" />
      </div>
    );
  }

  if (!data?.configured) {
    return (
      <section className="container-x pb-24">
        <div className="brackets border border-border bg-bg-elev p-10 text-center">
          <div className="hud tick mb-4 justify-center">Pipeline armed · awaiting data</div>
          <h2 className="font-poster text-3xl md:text-4xl">Live analytics switch on with one env var</h2>
          <p className="mx-auto mt-4 max-w-xl text-fg-muted">
            The full pipeline — a client beacon → <code>/api/collect</code> → MongoDB → rollups →
            this dashboard — is already built and wired. Set <code>MONGODB_URI</code> in{" "}
            <code>.env</code> and traffic starts flowing here in real time.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="container-x pb-24">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Kpi label="Pageviews" value={data.totalViews.toLocaleString()} hint="all time" />
        <Kpi label="Unique visitors" value={data.uniqueVisitors.toLocaleString()} hint="by session" />
        <Kpi label="Tracked pages" value={data.topPaths.length} hint="with traffic" />
        <Kpi label="Window" value="14d" hint="trend below" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div className="border border-border bg-bg-elev p-6">
          <div className="hud mb-4">Pageviews · last 14 days</div>
          <TrendChart data={data.series} />
        </div>
        <div className="border border-border bg-bg-elev p-6">
          <div className="hud mb-4">Top pages</div>
          <BarList items={data.topPaths} />
        </div>
      </div>
    </section>
  );
}
