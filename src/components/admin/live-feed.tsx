"use client";

import { useCallback, useEffect, useState } from "react";
import { Monitor, Smartphone, Tablet } from "lucide-react";
import type { FeedRow } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { BarListSkeleton, Empty, ErrorState, isAiReferrer } from "./primitives";

/** Row 8 of the spec. One constant, so dropping to 60s is a one-line change. */
const POLL_MS = 20_000;
/** An event newer than this makes the live dot pulse. */
const FRESH_MS = 60_000;

const DEVICE_ICON = {
  mobile: Smartphone,
  tablet: Tablet,
} as const;

function timeOf(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
}

function ago(iso: string) {
  const s = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.round(s / 60)}m`;
  if (s < 86_400) return `${Math.round(s / 3600)}h`;
  return `${Math.round(s / 86_400)}d`;
}

const CLASS_STYLE: Record<FeedRow["visitorClass"], string> = {
  human: "text-accent",
  untagged: "text-chart-2",
  bot: "text-fg-faint",
};

/** A feed row plus whether it arrived on this poll, so only it animates in. */
type Row = FeedRow & { isNew: boolean };

export function LiveFeed() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState("");
  const [fresh, setFresh] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/feed", { cache: "no-store" });
      if (!res.ok) throw new Error(res.status === 401 ? "Session expired." : `HTTP ${res.status}`);
      const json = await res.json();
      const incoming = json.rows as FeedRow[];
      // Diffed here, against the rows already in state, rather than against a
      // ref read during render. The first load marks nothing new, so the list
      // arrives as one block instead of 25 staggered entrances.
      setRows((prev) => {
        const known = new Set((prev ?? []).map((r) => r.id));
        return incoming.map((r) => ({ ...r, isNew: prev !== null && !known.has(r.id) }));
      });
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    // Polling only while the tab is visible. A forgotten open tab would
    // otherwise bill ~180 serverless invocations an hour for nobody.
    const start = () => {
      if (timer) return;
      void load();
      timer = setInterval(load, POLL_MS);
    };
    const stop = () => {
      if (timer) clearInterval(timer);
      timer = null;
    };
    const onVisibility = () => (document.visibilityState === "visible" ? start() : stop());

    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [load]);

  // Recompute freshness on a short timer as well as on new data, so the dot
  // stops pulsing on its own once the newest event ages past a minute.
  useEffect(() => {
    const tick = () => {
      const newest = rows?.[0]?.at;
      setFresh(!!newest && Date.now() - new Date(newest).getTime() < FRESH_MS);
    };
    tick();
    const t = setInterval(tick, 5_000);
    return () => clearInterval(t);
  }, [rows]);

  if (error && !rows) return <ErrorState message={error} onRetry={load} />;
  if (!rows) return <BarListSkeleton rows={8} />;
  if (rows.length === 0) {
    return <Empty line="Feed is quiet" detail="No pageview has been recorded yet. Open any public page to test it." />;
  }

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <span
          className={cn("h-2 w-2 rounded-full", fresh ? "deck-pulse bg-signal" : "bg-fg-faint")}
          aria-hidden
        />
        <span className="font-mono text-[0.65rem] uppercase tracking-wider text-fg-muted">
          {fresh ? "Live · event under a minute old" : `Last event ${ago(rows[0].at)} ago`}
        </span>
      </div>

      {/* Capped so 25 rows cannot stretch the row it shares with the chart. */}
      <ol className="max-h-[22rem] divide-y divide-border overflow-y-auto border border-border">
        {rows.map((r) => {
          const Icon = DEVICE_ICON[r.device as keyof typeof DEVICE_ICON] ?? Monitor;
          return (
            <li
              key={r.id}
              className={cn(
                "flex items-center gap-3 bg-bg px-3 py-2.5 text-sm",
                r.isNew && "deck-row-in",
              )}
            >
              <span className="w-10 shrink-0 font-mono text-[0.68rem] text-fg-faint">{timeOf(r.at)}</span>
              <span
                className={cn("w-7 shrink-0 font-mono text-[0.68rem]", CLASS_STYLE[r.visitorClass])}
                title={`${r.visitorClass}${r.browser ? ` · ${r.browser}` : ""}`}
              >
                {r.country === "Unknown" ? "··" : r.country}
              </span>
              <Icon className="h-3.5 w-3.5 shrink-0 text-fg-faint" aria-label={r.device} />
              <span className="min-w-0 flex-1 truncate text-fg">{r.path}</span>
              <span className="flex shrink-0 items-center gap-1 font-mono text-[0.68rem] text-fg-muted">
                {isAiReferrer(r.referrerHost) && <span className="text-chart-2">◆</span>}
                {r.referrerHost}
              </span>
            </li>
          );
        })}
      </ol>

      {error && <p className="mt-2 font-mono text-[0.65rem] text-signal">Refresh failed: {error}</p>}
    </div>
  );
}
