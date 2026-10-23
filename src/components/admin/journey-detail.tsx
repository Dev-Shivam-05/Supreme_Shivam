"use client";

import { useCallback, useEffect, useState } from "react";
import type { EvidenceRow, JourneyDetail as Detail } from "@/lib/vi/admin-queries";
import { cn } from "@/lib/utils";
import { EvidenceBadge } from "./evidence-badge";
import { BarListSkeleton, Empty, ErrorState } from "./primitives";

/** Local wall-clock `YYYY-MM-DD HH:MM`. Rendered only after a fetch, so no hydration mismatch. */
export function stamp(iso: string) {
  const d = new Date(iso);
  return `${d.toLocaleDateString("en-CA")} ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })}`;
}

export function Chip({
  children,
  tone = "default",
  title,
}: {
  children: React.ReactNode;
  tone?: "default" | "accent" | "info";
  title?: string;
}) {
  return (
    <span
      title={title}
      className={cn(
        "inline-flex max-w-full items-center border px-1.5 py-0.5 font-mono text-[0.6rem] uppercase leading-tight tracking-wider",
        tone === "accent" && "border-accent text-fg",
        tone === "info" && "border-chart-2 text-chart-2",
        tone === "default" && "border-border text-fg-muted",
      )}
    >
      <span className="truncate">{children}</span>
    </span>
  );
}

function Section({ title, children, aside }: { title: string; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <section className="border-t border-border pt-4">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="hud">{title}</h3>
        {aside}
      </div>
      {children}
    </section>
  );
}

const ERASE_TEXT =
  "This deletes every event, insight, link and network record for this journey now. A tombstone is kept for 90 days so the data cannot come back.";

const NETWORK_CAVEAT =
  "From the public RDAP registry, looked up by network prefix — never the full address. The owner of a network is not the visitor's employer, and a match does not show they represent it (possible_network_association).";

export function JourneyDetail({
  epochId,
  onErased,
  onChanged,
}: {
  epochId: string;
  onErased: (epochId: string) => void;
  onChanged: () => void;
}) {
  const [data, setData] = useState<Detail | null>(null);
  const [error, setError] = useState("");
  const [missing, setMissing] = useState(false);

  const load = useCallback(async () => {
    setError("");
    try {
      const res = await fetch(`/api/admin/vi/journeys/${epochId}`, { cache: "no-store" });
      if (res.status === 404) {
        setMissing(true);
        return;
      }
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(res.status === 401 ? "Session expired." : json.error || `HTTP ${res.status}`);
      setData(json.journey as Detail);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [epochId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (missing) {
    return (
      <Empty
        line="Journey not found"
        detail="It was erased, withdrawn by the visitor, or has expired since this list loaded."
      />
    );
  }
  if (error && !data) return <ErrorState message={error} onRetry={load} />;
  if (!data) return <DetailSkeleton />;

  const network = data.evidence.filter((e) => e.fieldId === "network_owner");
  const revoked = data.links.filter((l) => l.revokedAt);

  return (
    <div className="space-y-5">
      <Section title="Dimensions — independent, never merged">
        <Dimensions rows={data.dimensions} />
      </Section>

      <Section title={`Timeline — ${data.timeline.length} events`} aside={<span className="font-mono text-[0.65rem] text-fg-faint">epoch {data.epochId}</span>}>
        {data.timeline.length === 0 ? (
          <Empty line="No events left" detail="Every event in this journey has passed its expiry." />
        ) : (
          <ol className="max-h-[22rem] divide-y divide-border overflow-y-auto border border-border">
            {data.timeline.map((t, i) => (
              <li key={`${t.at}-${i}`} className="flex flex-wrap items-center gap-x-3 gap-y-1 bg-bg px-3 py-2 text-sm">
                <span className="w-[8.5rem] shrink-0 font-mono text-[0.68rem] text-fg-faint">{stamp(t.at)}</span>
                <span className="w-16 shrink-0 font-mono text-[0.6rem] text-fg-faint" title="Session">s·{t.sessionHint}</span>
                <span className="min-w-0 flex-1 truncate text-fg">{t.label}</span>
                {t.detail && <span className="font-mono text-[0.68rem] text-fg-muted">{t.detail}</span>}
                {/* The identity of a linked enquiry reaches these events and no others. */}
                {t.inLink && (
                  <span
                    title="Inside the linked enquiry's scope"
                    className="border border-chart-2 px-1.5 py-0.5 font-mono text-[0.6rem] uppercase leading-none tracking-wider text-chart-2"
                  >
                    linked
                  </span>
                )}
                <EvidenceBadge status={t.evidenceStatus} />
              </li>
            ))}
          </ol>
        )}
      </Section>

      <Section title={`Insights — ${data.insights.length}`}>
        {data.insights.length === 0 ? (
          <Empty
            line="No rule fired"
            detail="Every rule abstains unless its whole condition holds. Abstaining is the honest answer for most journeys."
          />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {data.insights.map((ins) => (
              <article key={ins.insightId} className="border border-dashed border-fg-muted bg-bg p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm text-fg">{ins.hypothesis}</p>
                  <EvidenceBadge status="inferred" />
                </div>
                <dl className="mt-3 space-y-1 font-mono text-[0.68rem] text-fg-muted">
                  <div>rule {ins.ruleVersion}</div>
                  <div>confidence: none — unvalidated rule</div>
                  <div>
                    evidence: {ins.evidenceIds.length} event{ins.evidenceIds.length === 1 ? "" : "s"}
                  </div>
                  <div>counterevidence: none recorded, not proven absent</div>
                </dl>
                <ChipRow label="Alternatives" items={ins.alternatives} />
                <ChipRow label="Unknowns" items={ins.unknowns} />
                <p className="mt-3 border-t border-border pt-2 text-xs text-fg-muted">
                  <span className="hud mr-2">Permitted next action</span>
                  {ins.permittedNextAction}
                </p>
              </article>
            ))}
          </div>
        )}
      </Section>

      <Section title="Network evidence">
        {network.length === 0 ? (
          <Empty
            line="No network record"
            detail="Recorded only when the visitor also allowed organisation lookup."
          />
        ) : (
          <ul className="space-y-1.5">
            {network.map((e) => (
              <NetworkRow key={e.id} e={e} />
            ))}
          </ul>
        )}
        <p className="mt-3 text-xs text-fg-muted">{NETWORK_CAVEAT}</p>
      </Section>

      <Section title="Linked enquiry">
        {data.linked ? (
          <LinkedBlock
            linked={data.linked}
            link={data.links.find((l) => l.linkId === data.linked?.linkId) ?? null}
            onReversed={() => {
              void load();
              onChanged();
            }}
          />
        ) : (
          <Empty line="No enquiry linked" detail="A link exists only when the visitor ticks the box on the contact form." />
        )}
        {revoked.length > 0 && (
          <ul className="mt-3 space-y-1 font-mono text-[0.65rem] text-fg-faint">
            {revoked.map((l) => (
              <li key={l.linkId}>
                reversed {l.revokedAt ? stamp(l.revokedAt) : ""} · {l.reversalReason ?? "no reason"}
              </li>
            ))}
          </ul>
        )}
      </Section>

      <EraseBlock epochId={data.epochId} onErased={onErased} />
    </div>
  );
}

/* ------------------------------------------------------------ pieces */

function Dimensions({ rows }: { rows: Detail["dimensions"] }) {
  return (
    <div className="border border-border">
      {/* Column heads only where there are columns; below md each row stacks. */}
      <div className="hidden border-b border-border px-3 py-2 md:grid md:grid-cols-[8rem_minmax(0,1fr)_9.5rem_9rem_minmax(0,1.3fr)] md:gap-3">
        {["Dimension", "Value", "Label", "Source", "Caveat"].map((h) => (
          <span key={h} className="font-mono text-[0.6rem] uppercase tracking-wider text-fg-faint">
            {h}
          </span>
        ))}
      </div>
      <ul className="divide-y divide-border">
        {rows.map((r, i) => (
          <li
            key={`${r.dimension}-${i}`}
            className="grid gap-1 bg-bg px-3 py-2.5 md:grid-cols-[8rem_minmax(0,1fr)_9.5rem_9rem_minmax(0,1.3fr)] md:items-start md:gap-3"
          >
            <span className="font-mono text-[0.68rem] uppercase tracking-wider text-fg-muted">{r.dimension}</span>
            <span className="break-words text-sm text-fg">{r.value}</span>
            <span>
              <EvidenceBadge status={r.evidenceStatus} />
            </span>
            <span className="font-mono text-[0.68rem] text-fg-muted">{r.source}</span>
            <span className="text-xs text-fg-muted">{r.caveat}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ChipRow({ label, items }: { label: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="mt-3">
      <div className="hud mb-1.5">{label}</div>
      <div className="flex flex-wrap gap-1">
        {items.map((it) => (
          <Chip key={it}>{it}</Chip>
        ))}
      </div>
    </div>
  );
}

function NetworkRow({ e }: { e: EvidenceRow }) {
  const v = (e.value ?? {}) as Record<string, unknown>;
  const s = (k: string) => (typeof v[k] === "string" ? (v[k] as string) : "");
  const facts = [s("networkName"), s("registry"), s("country")].filter(Boolean);
  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-1 border border-border bg-bg px-3 py-2 text-sm">
      {e.evidenceStatus === "unknown" ? (
        <span className="min-w-0 flex-1 text-fg-muted">
          No owner found{e.unknownReason ? ` — ${e.unknownReason}` : ""}
        </span>
      ) : (
        <>
          <span className="min-w-0 flex-1 truncate text-fg">{s("candidateOrganization") || "unknown"}</span>
          {s("networkKind") && <Chip>{s("networkKind")}</Chip>}
        </>
      )}
      {facts.length > 0 && <span className="font-mono text-[0.65rem] text-fg-faint">{facts.join(" · ")}</span>}
      <EvidenceBadge status={e.evidenceStatus} />
      {e.explanation && <p className="w-full text-xs text-fg-muted">{e.explanation}</p>}
    </li>
  );
}

function LinkedBlock({
  linked,
  link,
  onReversed,
}: {
  linked: NonNullable<Detail["linked"]>;
  link: Detail["links"][number] | null;
  onReversed: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/vi/reverse-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ linkId: linked.linkId, reason: reason.trim() }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setOpen(false);
      onReversed();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const extra = [linked.enquiringAs, linked.organization, linked.topic].filter(Boolean);

  return (
    <div className="border border-border bg-bg p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-fg">{linked.name}</span>
            <EvidenceBadge status="self_reported" />
          </div>
          <a href={`mailto:${linked.email}`} className="font-mono text-xs text-chart-2 hover:underline">
            {linked.email}
          </a>
          {extra.length > 0 && <p className="mt-1 text-xs text-fg-muted">{extra.join(" · ")}</p>}
          {link && (
            <p className="mt-2 font-mono text-[0.65rem] text-fg-faint">
              linked {stamp(link.validFrom)} · {link.eventIds.length} events in scope · until {stamp(link.validUntil)}
            </p>
          )}
          <p className="mt-1 max-w-md text-xs leading-relaxed text-fg-muted">
            This enquiry covers the {linked.eventIds.length} events marked “linked” in session {linked.sessionHint} — the
            pages the visitor chose to attach. It says nothing about the rest of the journey or the network lookup.
          </p>
        </div>
        {!open && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="border border-border px-3 py-1.5 font-mono text-[0.65rem] uppercase tracking-wider text-fg-muted transition-colors duration-[160ms] hover:border-accent hover:text-fg"
          >
            Reverse link
          </button>
        )}
      </div>

      {open && (
        <form onSubmit={submit} className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
          <label htmlFor={`reason-${linked.linkId}`} className="sr-only">
            Reason for reversing this link
          </label>
          <input
            id={`reason-${linked.linkId}`}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={200}
            autoFocus
            placeholder="Reason (kept in the audit record)"
            className="min-w-0 flex-1 border border-border bg-bg-elev px-3 py-1.5 text-sm outline-none transition-colors duration-[160ms] focus:border-accent"
          />
          <button
            type="submit"
            disabled={busy || !reason.trim()}
            className="bg-accent px-3 py-1.5 font-mono text-[0.65rem] uppercase tracking-wider text-accent-ink disabled:opacity-50"
          >
            {busy ? "Reversing…" : "Reverse"}
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="px-2 py-1.5 font-mono text-[0.65rem] uppercase tracking-wider text-fg-muted hover:text-fg"
          >
            Cancel
          </button>
          {error && <p className="w-full font-mono text-xs text-signal">{error}</p>}
        </form>
      )}
    </div>
  );
}

function EraseBlock({ epochId, onErased }: { epochId: string; onErased: (id: string) => void }) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const erase = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/vi/erase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ epochId }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      onErased(epochId);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };

  return (
    <div className="border-t border-border pt-4">
      {!confirming ? (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="border border-signal px-4 py-2 font-mono text-xs uppercase tracking-wider text-signal transition-colors duration-[160ms] hover:bg-signal hover:text-accent-ink"
        >
          Erase this journey
        </button>
      ) : (
        <div role="alertdialog" aria-labelledby={`erase-${epochId}`} className="border border-signal bg-bg p-4">
          <div id={`erase-${epochId}`} className="hud mb-2 text-signal">
            Erase this journey?
          </div>
          <p className="text-sm text-fg">{ERASE_TEXT}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={erase}
              disabled={busy}
              autoFocus
              className="bg-signal px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wider text-accent-ink disabled:opacity-60"
            >
              {busy ? "Erasing…" : "Erase now"}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={busy}
              className="border border-border px-4 py-2 font-mono text-xs uppercase tracking-wider text-fg-muted hover:text-fg"
            >
              Keep it
            </button>
          </div>
          {error && <p className="mt-2 font-mono text-xs text-signal">{error}</p>}
        </div>
      )}
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-4">
      <div className="deck-skeleton h-[220px]" />
      <BarListSkeleton rows={4} />
      <div className="grid gap-3 md:grid-cols-2">
        <div className="deck-skeleton h-[160px]" />
        <div className="deck-skeleton h-[160px]" />
      </div>
    </div>
  );
}
