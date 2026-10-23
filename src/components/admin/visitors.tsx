"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { JourneyFilter, JourneyListItem, VISummary } from "@/lib/vi/admin-queries";
import { cn } from "@/lib/utils";
import { EvidenceBadge } from "./evidence-badge";
import { Chip, JourneyDetail } from "./journey-detail";
import { BarList, BarListSkeleton, Empty, ErrorState, Kpi, KpiSkeleton, Panel, Segmented } from "./primitives";

const FILTERS: { id: JourneyFilter; label: string; title: string }[] = [
  { id: "all", label: "All", title: "Every journey still inside its 22-day retention" },
  { id: "active", label: "Active", title: "Inside the 15-day observation window" },
  { id: "closed", label: "Closed", title: "Window over; evidence awaiting deletion at day 22" },
];

/** Display names for catalog.ts ENTRY_CATEGORIES. The stored value stays the code. */
const ENTRY_LABEL: Record<string, string> = {
  internal: "Internal",
  direct: "Direct",
  search: "Search",
  ai_assistant: "AI assistant",
  social: "Social",
  developer_community: "Developer community",
  email: "Email",
  campaign: "Campaign",
  referral: "Referral",
  unknown: "Unknown",
};
export const entryLabel = (code: string | null) => (code ? (ENTRY_LABEL[code] ?? code) : "Unknown");

function ago(iso: string) {
  const s = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.round(s / 60)}m ago`;
  if (s < 86_400) return `${Math.round(s / 3600)}h ago`;
  return `${Math.round(s / 86_400)}d ago`;
}

const daysUntil = (iso: string) => Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000));

type SweepResult = { expired: number; closed: number; reconciled: number; jobsRun: number };

export function Visitors() {
  const [filter, setFilter] = useState<JourneyFilter>("all");
  const [summary, setSummary] = useState<VISummary | null>(null);
  const [summaryError, setSummaryError] = useState("");
  const [journeys, setJourneys] = useState<JourneyListItem[] | null>(null);
  const [journeysError, setJourneysError] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [sweeping, setSweeping] = useState(false);
  const [sweepNote, setSweepNote] = useState("");

  const loadSummary = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/vi/summary", { cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(res.status === 401 ? "Session expired." : json.error || `HTTP ${res.status}`);
      setSummary(json as VISummary);
      setSummaryError("");
    } catch (e) {
      setSummaryError((e as Error).message);
    }
  }, []);

  const loadJourneys = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/vi/journeys?state=${filter}`, { cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(res.status === 401 ? "Session expired." : json.error || `HTTP ${res.status}`);
      setJourneys(json.journeys as JourneyListItem[]);
      setJourneysError("");
    } catch (e) {
      setJourneysError((e as Error).message);
    }
  }, [filter]);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    void loadJourneys();
  }, [loadJourneys]);

  // The sweep note is a receipt, not a state: it clears itself.
  useEffect(() => {
    if (!sweepNote) return;
    const t = setTimeout(() => setSweepNote(""), 6000);
    return () => clearTimeout(t);
  }, [sweepNote]);

  const changeFilter = (f: JourneyFilter) => {
    setFilter(f);
    setJourneys(null);
    setOpen(null);
  };

  const sweep = async () => {
    setSweeping(true);
    try {
      const res = await fetch("/api/admin/vi/sweep", { method: "POST" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      const r = json.result as SweepResult;
      setSweepNote(`${r.expired} expired · ${r.closed} closed · ${r.reconciled} reconciled · ${r.jobsRun} jobs`);
      await Promise.all([loadSummary(), loadJourneys()]);
    } catch (e) {
      setSweepNote(`Sweep failed: ${(e as Error).message}`);
    } finally {
      setSweeping(false);
    }
  };

  const onErased = (epochId: string) => {
    setJourneys((js) => (js ? js.filter((j) => j.epochId !== epochId) : js));
    setOpen(null);
    void loadSummary();
  };

  const onChanged = () => {
    void loadSummary();
    void loadJourneys();
  };

  if (summaryError && !summary) {
    return <ErrorState message={summaryError} onRetry={loadSummary} />;
  }
  if (summary && !summary.enabled) return <Disabled />;

  const rejected = summary?.rejections7d.reduce((n, r) => n + r.count, 0) ?? 0;
  const rate = summary?.consent30d.rate;

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Segmented label="Journey state" options={FILTERS} value={filter} onChange={changeFilter} />
        <button
          type="button"
          onClick={sweep}
          disabled={sweeping}
          className="border border-border px-3 py-1.5 font-mono text-[0.65rem] uppercase tracking-wider text-fg-muted transition-colors duration-[160ms] hover:border-accent hover:text-fg disabled:opacity-60"
        >
          {sweeping ? "Sweeping…" : "Run sweep"}
        </button>
        {sweepNote && (
          <span role="status" className="deck-rise font-mono text-[0.65rem] text-fg-muted">
            {sweepNote}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {!summary ? (
          Array.from({ length: 4 }).map((_, i) => <KpiSkeleton key={i} />)
        ) : (
          <>
            <Kpi
              label="Active journeys"
              value={summary.journeys.active}
              hint={`${summary.journeys.closed} closed, awaiting deletion`}
              tone="accent"
            />
            <Kpi
              label="Consent rate"
              value={rate == null ? "—" : `${Math.round(rate * 100)}%`}
              hint="granted of shown, 30d"
            />
            <Kpi label="Linked enquiries" value={summary.linkedEnquiries} hint="visitor ticked the link box" />
            <Kpi label="Rejected events" value={rejected} hint="7 days, by code" />
          </>
        )}
      </div>

      <p className="mt-4 border-t border-border pt-3 font-mono text-[0.65rem] text-fg-faint">
        15-day window · evidence deleted at 22 days · consent required · gender never collected · organisation =
        network owner, not employer
      </p>

      <div className="mt-4">
        {journeysError && !journeys ? (
          <ErrorState message={journeysError} onRetry={loadJourneys} />
        ) : !journeys ? (
          <BarListSkeleton rows={4} />
        ) : journeys.length === 0 ? (
          <div className="border border-dashed border-border p-12">
            {filter === "all" ? (
              <Empty
                line="No consented journeys yet."
                detail="The consent card is live. Visitors who choose “Allow selected” appear here for 15 days."
              />
            ) : (
              <Empty line={`No ${filter} journeys`} detail="Switch to All to see every journey still retained." />
            )}
          </div>
        ) : (
          <ul className="space-y-2">
            {journeys.map((j) => (
              <JourneyRow
                key={j.epochId}
                j={j}
                open={open === j.epochId}
                onToggle={() => setOpen((o) => (o === j.epochId ? null : j.epochId))}
                onErased={onErased}
                onChanged={onChanged}
              />
            ))}
          </ul>
        )}
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
        <Panel title="Rejected events (7d)">
          {!summary ? (
            <BarListSkeleton rows={3} />
          ) : summary.rejections7d.length === 0 ? (
            <Empty line="Nothing rejected" detail="Every event in the last 7 days passed the allowlists." />
          ) : (
            <BarList items={summary.rejections7d.map((r) => ({ label: r.code, count: r.count }))} />
          )}
        </Panel>

        <Panel title="Consent prompt (30d)">
          {!summary ? <BarListSkeleton rows={3} /> : <ConsentPanel c={summary.consent30d} />}
        </Panel>

        <Panel title="How consented visitors arrived">
          {!summary ? (
            <BarListSkeleton rows={4} />
          ) : summary.entries.length === 0 ? (
            <Empty line="No journeys to count" />
          ) : (
            <BarList items={summary.entries.map((e) => ({ label: entryLabel(e.label), count: e.count }))} />
          )}
        </Panel>

        <Panel title="Network kinds">
          {!summary ? (
            <BarListSkeleton rows={3} />
          ) : summary.networkKinds.length === 0 ? (
            <Empty line="No network records" detail="Only journeys that also allowed organisation lookup have one." />
          ) : (
            <BarList items={summary.networkKinds} />
          )}
        </Panel>

        <Panel title="Deletion jobs">
          {!summary ? <BarListSkeleton rows={2} /> : <DeletionPanel d={summary.deletionJobs} />}
        </Panel>

        <Panel title="Retention">
          {!summary ? <BarListSkeleton rows={4} /> : <RetentionPanel r={summary.retention} />}
        </Panel>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- list row */

function JourneyRow({
  j,
  open,
  onToggle,
  onErased,
  onChanged,
}: {
  j: JourneyListItem;
  open: boolean;
  onToggle: () => void;
  onErased: (id: string) => void;
  onChanged: () => void;
}) {
  const shown = j.insights.slice(0, 2);
  const more = j.insights.length - shown.length;
  const network = j.network.find((n) => n.status !== "unknown");

  return (
    <li className={cn("deck-rise border bg-bg-elev", open ? "border-border-strong" : "border-border")}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="block w-full px-4 py-3 text-left transition-colors duration-[160ms] hover:bg-glass"
      >
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <span className="font-mono text-sm text-fg" title="First 8 characters of the browser epoch — not a person">
            {j.epochHint}
          </span>
          <Chip tone={j.state === "active" ? "accent" : "default"}>{j.state}</Chip>
          <Chip title="How the first page view arrived">{entryLabel(j.entry)}</Chip>
          {j.linked && (
            <Chip tone="accent" title="An enquiry is linked to this journey">
              linked
            </Chip>
          )}
          <span className="font-mono text-[0.68rem] text-fg-muted">started {ago(j.startsAt)}</span>
          <span className="font-mono text-[0.68rem] text-fg-muted">
            {j.state === "active" ? `${j.daysLeft}d left` : `deleted in ${daysUntil(j.expiresAt)}d`}
          </span>
          <span className="font-mono text-[0.68rem] text-fg-muted">
            {j.pageCount} page{j.pageCount === 1 ? "" : "s"} · {j.sessionCount} session{j.sessionCount === 1 ? "" : "s"}
          </span>
          <ChevronDown
            className={cn(
              "ml-auto h-4 w-4 shrink-0 text-fg-faint transition-transform duration-[160ms]",
              open && "rotate-180",
            )}
            aria-hidden
          />
        </div>

        {(j.ctas.length > 0 || network || shown.length > 0) && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {j.ctas.map((c) => (
              <Chip key={c} tone="info">
                {c.replace(/_/g, " ")}
              </Chip>
            ))}
            {network && (
              <span className="inline-flex min-w-0 items-center gap-1.5 text-xs text-fg-muted">
                <span className="truncate">
                  {network.owner} ({network.kind})
                </span>
                <EvidenceBadge status={network.status} />
              </span>
            )}
            {shown.map((i) => (
              <span key={i.ruleVersion} className="inline-flex min-w-0 items-center gap-1.5 text-xs text-fg-muted">
                <span className="truncate">{i.hypothesis}</span>
                <EvidenceBadge status="inferred" />
              </span>
            ))}
            {more > 0 && <span className="font-mono text-[0.65rem] text-fg-faint">+{more}</span>}
          </div>
        )}
      </button>

      {open && (
        <div className="border-t border-border px-4 py-4">
          <JourneyDetail epochId={j.epochId} onErased={onErased} onChanged={onChanged} />
        </div>
      )}
    </li>
  );
}

/* --------------------------------------------------------------- panels */

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border border-border bg-bg px-3 py-2">
      <div className="font-mono text-[0.6rem] uppercase tracking-wider text-fg-faint">{label}</div>
      <div className="mt-0.5 font-mono text-lg text-fg">{value}</div>
    </div>
  );
}

function ConsentPanel({ c }: { c: VISummary["consent30d"] }) {
  return (
    <div>
      <div className="grid grid-cols-2 gap-1.5">
        <Stat label="Shown" value={c.shown} />
        <Stat label="Declined" value={c.declined} />
        <Stat label="Granted" value={c.granted} />
        <Stat label="Withdrawn" value={c.withdrawn} />
      </div>
      <p className="mt-3 font-mono text-[0.65rem] text-fg-muted">
        of {c.granted} granted: {c.grantedLinking} also allowed linking · {c.grantedOrganization} also allowed
        organisation lookup
      </p>
      <p className="mt-1 font-mono text-[0.65rem] text-fg-faint">
        rate {c.rate == null ? "— (prompt not shown yet)" : `${Math.round(c.rate * 100)}%`} · daily counters, no identifier
      </p>
    </div>
  );
}

function DeletionPanel({ d }: { d: VISummary["deletionJobs"] }) {
  const total = d.pending + d.accepted + d.verified + d.failed;
  if (total === 0) {
    return (
      <p className="text-sm text-fg-muted">
        No external destinations are configured, so nothing has been exported and nothing awaits remote deletion.
      </p>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-1.5">
      <Stat label="Pending" value={d.pending} />
      <Stat label="Accepted" value={d.accepted} />
      <Stat label="Verified" value={d.verified} />
      <div className={cn("border bg-bg px-3 py-2", d.failed > 0 ? "border-signal" : "border-border")}>
        <div className="font-mono text-[0.6rem] uppercase tracking-wider text-fg-faint">Failed</div>
        <div className={cn("mt-0.5 font-mono text-lg", d.failed > 0 ? "text-signal" : "text-fg")}>{d.failed}</div>
      </div>
    </div>
  );
}

function RetentionPanel({ r }: { r: VISummary["retention"] }) {
  const rows: [string, string][] = [
    ["Observation window", `${r.windowDays} days`],
    ["Journey evidence", `${r.evidenceDays} days`],
    ["Rejection log", `${r.securityLogDays} days`],
    ["Consent and audit records", `${r.consentAuditDays} days`],
    ["Network-owner cache", `${r.orgCacheDays} days`],
    ["Aggregate counters", `${r.aggregateDays} days`],
    ["Enquiries", `${r.enquiryMonths} months`],
  ];
  return (
    <dl className="divide-y divide-border border border-border">
      {rows.map(([k, v]) => (
        <div key={k} className="flex items-center justify-between gap-3 bg-bg px-3 py-2">
          <dt className="text-sm text-fg-muted">{k}</dt>
          <dd className="font-mono text-sm text-fg">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function Disabled() {
  return (
    <div className="brackets border border-border bg-bg-elev p-10 text-center">
      <div className="hud mb-3">Visitor intelligence is off</div>
      <p className="mx-auto max-w-lg text-sm text-fg-muted">
        It turns on only when there is a database to keep its retention promises in and a key to sign its
        cookies with: set <code>MONGODB_URI</code>, and either <code>VI_SECRET</code> (32+ characters) or{" "}
        <code>ADMIN_SECRET</code>, from which a separate key is derived.
      </p>
    </div>
  );
}
