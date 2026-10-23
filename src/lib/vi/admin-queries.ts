/**
 * Read models for the admin Visitors page (spec §3 R01–R03, R17, R25).
 *
 * Server-only: imported by the /api/admin/vi/* route handlers, never by a
 * client component (client code may `import type` from here — types erase).
 *
 * Two rules shape everything below:
 * - A tombstoned epoch is invisible the moment its tombstone lands (R17, D7),
 *   even if an interrupted erase left rows behind for the sweep to finish.
 * - Dimensions are never merged (R02). Each source of a claim gets its own row
 *   with its own evidence label, and disagreeing sources sit side by side
 *   (README "Preserve conflicts").
 *
 * No IP address is read or returned — none is stored.
 */
import { Types } from "mongoose";
import { dbConnect } from "@/lib/db";
import { Lead } from "@/models/lead";
import { CONTENT } from "./catalog.ts";
import { scopeHash } from "./cookies.ts";
import { ERASING_ACTIONS, type Insight, type Link } from "./engine.ts";
import {
  VIConsentStat,
  VIDeletionJob,
  VIEvent,
  VIEvidence,
  VIGrant,
  VIInsight,
  VILink,
  VISecurityLog,
  VITombstone,
  VIWindow,
} from "./models.ts";
import { toLink } from "./mongo-store.ts";
import { FINALIZATION_MS, RETENTION, SITE_ID, WINDOW_MS, type EvidenceStatus } from "./policy.ts";
import { getEngine, viEnabled } from "./server.ts";

type Doc = Record<string, unknown>;

const DAY = 86_400_000;

/* ----------------------------------------------------------------- types */

export type JourneyState = "active" | "closed";
export type JourneyFilter = JourneyState | "all";

export type VISummary = {
  enabled: boolean;
  journeys: { active: number; closed: number; withdrawn: number; expired: number };
  consent30d: {
    shown: number;
    declined: number;
    granted: number;
    grantedLinking: number;
    grantedOrganization: number;
    withdrawn: number;
    /** granted / shown; null when nothing was shown, so 0/0 never reads as 0%. */
    rate: number | null;
  };
  linkedEnquiries: number;
  rejections7d: { code: string; count: number }[];
  deletionJobs: { pending: number; accepted: number; verified: number; failed: number };
  networkKinds: { label: string; count: number }[];
  entries: { label: string; count: number }[];
  retention: {
    windowDays: number;
    evidenceDays: number;
    securityLogDays: number;
    consentAuditDays: number;
    orgCacheDays: number;
    aggregateDays: number;
    enquiryMonths: number;
  };
};

/**
 * The enquiry a visitor linked, and exactly what it covers. A link is
 * event-scoped (reference.py `link_session_to_contact`): the identity applies
 * to `eventIds` in one session, never to the rest of the journey.
 */
export type LinkedLead = {
  linkId: string;
  leadId: string;
  name: string;
  email: string;
  enquiringAs: string;
  organization: string;
  topic: string;
  sessionHint: string;
  eventIds: string[];
};

/** What the list carries: that a link exists, never who it names. */
export type LinkedRef = { linkId: string; leadId: string; eventCount: number };

export type NetworkSummary = { owner: string; kind: string; status: EvidenceStatus; reason: string | null };

export type JourneyListItem = {
  epochId: string;
  epochHint: string;
  state: JourneyState;
  startsAt: string;
  endsAt: string;
  expiresAt: string;
  /** Whole days left in the 15-day observation window; 0 once it has closed. */
  daysLeft: number;
  eventCount: number;
  sessionCount: number;
  /** Distinct pages viewed. */
  pageCount: number;
  entry: string | null;
  pages: string[];
  ctas: string[];
  purposes: string[];
  linked: LinkedRef | null;
  network: NetworkSummary[];
  insights: { ruleVersion: string; hypothesis: string }[];
};

export type TimelineRow = {
  at: string;
  eventId: string;
  sessionHint: string;
  eventName: string;
  label: string;
  detail: string;
  evidenceStatus: EvidenceStatus;
  /** Inside the linked enquiry's scope — the only events the identity applies to. */
  inLink: boolean;
};

export type InsightView = Omit<Insight, "computedAt" | "expiresAt"> & { computedAt: string; expiresAt: string };

export type EvidenceRow = {
  id: string;
  entityScope: string;
  entityId: string;
  fieldId: string;
  value: Record<string, unknown> | null;
  sourceId: string | null;
  sourceKind: string | null;
  sourceRecordId: string | null;
  observedAt: string | null;
  collectedAt: string | null;
  evidenceStatus: EvidenceStatus;
  verificationScope: string | null;
  confidence: unknown;
  contradictions: unknown[];
  unknownReason: string | null;
  unknowns: string[];
  explanation: string | null;
  expiresAt: string;
};

export type LinkView = Omit<Link, "validFrom" | "validUntil" | "revokedAt"> & {
  validFrom: string;
  validUntil: string;
  revokedAt: string | null;
};

export type Dimension = {
  dimension: "Automation" | "Identification" | "Affiliation" | "Authority" | "Business intent" | "Gender";
  value: string;
  evidenceStatus: EvidenceStatus;
  source: string;
  caveat: string;
};

export type JourneyDetail = Omit<JourneyListItem, "insights" | "linked"> & {
  /** The full identity, scoped — see LinkedLead. Only the detail view carries it. */
  linked: LinkedLead | null;
  timeline: TimelineRow[];
  insights: InsightView[];
  evidence: EvidenceRow[];
  links: LinkView[];
  dimensions: Dimension[];
};

/* --------------------------------------------------------------- helpers */

const iso = (d: unknown) => (d instanceof Date ? d.toISOString() : typeof d === "string" ? d : "");
const isoOrNull = (d: unknown) => (d ? iso(d) : null);
const str = (v: unknown) => (typeof v === "string" ? v : "");

/** Labels for the controlled CTA codes in catalog.ts. A code without one falls back to itself. */
const CTA_LABEL: Record<string, string> = {
  start_project: "Start a project",
  enquiry_submitted: "Enquiry submitted",
  email: "Email link",
  copy_email: "Copied email",
  phone: "Phone link",
  social_github: "GitHub profile",
  social_linkedin: "LinkedIn profile",
  social_x: "X profile",
  social_instagram: "Instagram profile",
  social_wakatime: "WakaTime profile",
  case_repo: "Project repository",
  case_live: "Live project",
};

const EVENT_LABEL: Record<string, string> = {
  search_submitted: "Palette search",
  download_requested: "Download requested",
  booking_confirmed: "Booking confirmed",
};

/** Throws rather than returning empty data, so "unreachable" never renders as "no visitors". */
async function connect() {
  if (!(await dbConnect())) throw new Error("Database unreachable.");
}

/**
 * The set of epoch scope-hashes with an erasing tombstone. One query instead of
 * one `isTombstoned` call per epoch; the comparison is the same `scopeHash`
 * the engine writes, filtered on the same ERASING_ACTIONS.
 */
async function tombstonedScopes(): Promise<Set<string>> {
  const rows = await VITombstone.find({ siteId: SITE_ID, action: { $in: ERASING_ACTIONS } })
    .select("scopeHmac")
    .lean<Doc[]>();
  return new Set(rows.map((r) => r.scopeHmac as string));
}

const isHidden = (dead: Set<string>, epochId: string) => dead.has(scopeHash(SITE_ID, epochId));

/**
 * Epochs whose grant was revoked. Erasure writes the tombstone before it
 * revokes, so this should always be a subset of the tombstoned set — it is a
 * second fence, so a withdrawal interrupted on some older path can never leave
 * a journey readable (R08, R17).
 */
async function revokedEpochs(): Promise<Set<string>> {
  const rows = await VIGrant.find({ siteId: SITE_ID, revokedAt: { $ne: null } }).select("epochId").lean<Doc[]>();
  return new Set(rows.map((r) => String(r.epochId)));
}

/** A window whose 15 days have run out is closed whether or not the sweep has marked it yet. */
function effectiveState(w: Doc, now: Date): JourneyState {
  return w.state === "active" && now.getTime() < (w.endsAt as Date).getTime() ? "active" : "closed";
}

/** Lead `_id`s are ObjectIds; anything else would throw a CastError inside the query. */
const isObjectId = (id: string) => /^[a-f0-9]{24}$/i.test(id) && Types.ObjectId.isValid(id);

function networkOf(ev: Doc): NetworkSummary {
  const v = (ev.value ?? {}) as Doc;
  const status = ev.evidenceStatus as EvidenceStatus;
  if (status === "unknown") {
    return { owner: "unknown", kind: "unknown", status, reason: str(ev.unknownReason) || null };
  }
  return {
    owner: str(v.candidateOrganization) || "unknown",
    kind: str(v.networkKind) || "unknown",
    status,
    reason: null,
  };
}

function leadView(link: Doc, l: Doc): LinkedLead {
  return {
    linkId: String(link._id),
    leadId: String(l._id),
    name: str(l.name),
    email: str(l.email),
    enquiringAs: str(l.enquiringAs),
    organization: str(l.organization),
    topic: str(l.topic),
    sessionHint: str(link.sessionId).slice(0, 8),
    eventIds: ((link.eventIds as string[]) ?? []).map(String),
  };
}

/* --------------------------------------------------------------- summary */

const EMPTY_SUMMARY: Omit<VISummary, "enabled" | "retention"> = {
  journeys: { active: 0, closed: 0, withdrawn: 0, expired: 0 },
  consent30d: { shown: 0, declined: 0, granted: 0, grantedLinking: 0, grantedOrganization: 0, withdrawn: 0, rate: null },
  linkedEnquiries: 0,
  rejections7d: [],
  deletionJobs: { pending: 0, accepted: 0, verified: 0, failed: 0 },
  networkKinds: [],
  entries: [],
};

/** The policy numbers, read from policy.ts so the page cannot drift from the code. */
function retention(): VISummary["retention"] {
  return {
    windowDays: WINDOW_MS / DAY,
    evidenceDays: (WINDOW_MS + FINALIZATION_MS) / DAY,
    securityLogDays: RETENTION.securityLogMs / DAY,
    consentAuditDays: RETENTION.consentAuditMs / DAY,
    orgCacheDays: RETENTION.orgCacheMs / DAY,
    aggregateDays: RETENTION.aggregateMs / DAY,
    // Spec D2: enquiries keep the 24 months the privacy policy already discloses (Lead TTL 730d).
    enquiryMonths: 24,
  };
}

const countBy = (keys: string[]) => {
  const m = new Map<string, number>();
  for (const k of keys) m.set(k, (m.get(k) ?? 0) + 1);
  return [...m.entries()].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);
};

export async function getVISummary(now = new Date()): Promise<VISummary> {
  if (!viEnabled()) return { enabled: false, ...EMPTY_SUMMARY, retention: retention() };
  await connect();

  const since30 = new Date(now.getTime() - 30 * DAY).toISOString().slice(0, 10);
  const since7 = new Date(now.getTime() - 7 * DAY);

  const [dead, revoked, erasures, windows, stats, linkedEnquiries, rejections, jobs] = await Promise.all([
    tombstonedScopes(),
    revokedEpochs(),
    // Erased journeys leave no window behind (mongo-store eraseEpochData), so
    // "withdrawn" and "expired" are counted from the 90-day tombstones instead.
    VITombstone.aggregate<{ _id: string; count: number }>([
      { $match: { siteId: SITE_ID, action: { $in: ERASING_ACTIONS } } },
      { $group: { _id: "$action", count: { $sum: 1 } } },
    ]),
    VIWindow.find({ siteId: SITE_ID }).select("epochId state endsAt").lean<Doc[]>(),
    // Day keys are YYYY-MM-DD, so a string comparison is a date comparison.
    VIConsentStat.find({ _id: { $gte: since30 } }).lean<Doc[]>(),
    VILink.countDocuments({ siteId: SITE_ID, revokedAt: null }),
    VISecurityLog.aggregate<{ _id: string; count: number }>([
      { $match: { at: { $gte: since7 } } },
      { $group: { _id: "$code", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    VIDeletionJob.aggregate<{ _id: string; count: number }>([
      { $match: { siteId: SITE_ID } },
      { $group: { _id: "$state", count: { $sum: 1 } } },
    ]),
  ]);

  const journeys = { active: 0, closed: 0, withdrawn: 0, expired: 0 };
  for (const t of erasures) {
    if (t._id === "expired") journeys.expired += t.count;
    else journeys.withdrawn += t.count; // withdrawn by the visitor, or erased by the admin
  }
  const live: string[] = [];
  for (const w of windows) {
    const epochId = w.epochId as string;
    if (w.state === "withdrawn" || w.state === "expired") continue;
    if (isHidden(dead, epochId) || revoked.has(epochId)) continue;
    journeys[effectiveState(w, now)]++;
    live.push(epochId);
  }

  const c = { shown: 0, declined: 0, granted: 0, grantedLinking: 0, grantedOrganization: 0, withdrawn: 0 };
  for (const s of stats) {
    for (const k of Object.keys(c) as (keyof typeof c)[]) c[k] += Number(s[k] ?? 0);
  }

  const deletionJobs = { pending: 0, accepted: 0, verified: 0, failed: 0 };
  for (const j of jobs) if (j._id in deletionJobs) deletionJobs[j._id as keyof typeof deletionJobs] = j.count;

  // Entry category of each live window's FIRST page view: how the journey began.
  const [firstViews, evidence] = live.length
    ? await Promise.all([
        VIEvent.aggregate<{ _id: string; entry: string | null }>([
          { $match: { siteId: SITE_ID, epochId: { $in: live }, eventName: "page_view", expiresAt: { $gt: now } } },
          { $sort: { occurredAt: 1 } },
          { $group: { _id: "$epochId", entry: { $first: "$properties.entry" } } },
        ]),
        VIEvidence.find({ siteId: SITE_ID, epochId: { $in: live }, fieldId: "network_owner", expiresAt: { $gt: now } })
          .select("epochId evidenceStatus value unknownReason")
          .lean<Doc[]>(),
      ])
    : [[], []];

  // One count per (journey, kind): a visitor on the same network across three sessions is one.
  const kindPairs = new Set(evidence.map((e) => `${e.epochId}|${networkOf(e).kind}`));

  return {
    enabled: true,
    journeys,
    consent30d: { ...c, rate: c.shown > 0 ? c.granted / c.shown : null },
    linkedEnquiries,
    rejections7d: rejections.map((r) => ({ code: String(r._id), count: r.count })),
    deletionJobs,
    networkKinds: countBy([...kindPairs].map((p) => p.split("|")[1])),
    entries: countBy(firstViews.map((f) => f.entry || "unknown")),
    retention: retention(),
  };
}

/* -------------------------------------------------------------- journeys */

type Batch = {
  events: Map<string, Doc[]>;
  grants: Map<string, Doc[]>;
  linked: Map<string, LinkedLead>;
  network: Map<string, Doc[]>;
  insights: Map<string, Doc[]>;
};

const group = (rows: Doc[], key: string) => {
  const m = new Map<string, Doc[]>();
  for (const r of rows) {
    const k = String(r[key]);
    m.set(k, [...(m.get(k) ?? []), r]);
  }
  return m;
};

/** Every related collection for a set of epochs, in one round of parallel queries. */
async function loadBatch(epochIds: string[], now: Date): Promise<Batch> {
  const scope = { siteId: SITE_ID, epochId: { $in: epochIds } };
  const [events, grants, links, network, insights] = await Promise.all([
    VIEvent.find({ ...scope, expiresAt: { $gt: now } })
      .select("epochId sessionId eventId eventName properties occurredAt evidenceStatus")
      .sort({ occurredAt: 1 })
      .lean<Doc[]>(),
    VIGrant.find(scope).select("epochId purposes revokedAt validUntil").lean<Doc[]>(),
    VILink.find({ ...scope, revokedAt: null, validUntil: { $gt: now } }).sort({ validFrom: -1 }).lean<Doc[]>(),
    VIEvidence.find({ ...scope, fieldId: "network_owner", expiresAt: { $gt: now } }).lean<Doc[]>(),
    VIInsight.find({ siteId: SITE_ID, entityId: { $in: epochIds }, expiresAt: { $gt: now } }).lean<Doc[]>(),
  ]);

  const contactIds = [...new Set(links.map((l) => String(l.contactId)).filter(isObjectId))];
  const leads = contactIds.length
    ? await Lead.find({ _id: { $in: contactIds } })
        .select("name email enquiringAs organization topic")
        .lean<Doc[]>()
    : [];
  const leadById = new Map(leads.map((l) => [String(l._id), l]));

  // Newest unrevoked link wins when one journey produced two enquiries.
  const linked = new Map<string, LinkedLead>();
  for (const l of links) {
    const epochId = String(l.epochId);
    const lead = leadById.get(String(l.contactId));
    if (lead && !linked.has(epochId)) linked.set(epochId, leadView(l, lead));
  }

  return {
    events: group(events, "epochId"),
    grants: group(grants, "epochId"),
    linked,
    network: group(network, "epochId"),
    insights: group(insights, "entityId"),
  };
}

const refOf = (l: LinkedLead | null): LinkedRef | null =>
  l ? { linkId: l.linkId, leadId: l.leadId, eventCount: l.eventIds.length } : null;

function toItem(w: Doc, b: Batch, now: Date): JourneyListItem {
  const epochId = w.epochId as string;
  const events = b.events.get(epochId) ?? [];
  const views = events.filter((e) => e.eventName === "page_view");
  const props = (e: Doc) => (e.properties ?? {}) as Record<string, string>;

  const contentIds = [...new Set(views.map((e) => props(e).content_id))];
  const ctas = [
    ...new Set(events.filter((e) => e.eventName === "cta_click").map((e) => props(e).cta_id).filter(Boolean)),
  ];
  const purposes = [
    ...new Set(
      (b.grants.get(epochId) ?? [])
        .filter((g) => g.revokedAt == null && (g.validUntil as Date).getTime() > now.getTime())
        .flatMap((g) => (g.purposes as string[]) ?? []),
    ),
  ];

  const seen = new Set<string>();
  const network = (b.network.get(epochId) ?? []).map(networkOf).filter((n) => {
    const k = `${n.owner}|${n.kind}|${n.status}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  const state = effectiveState(w, now);
  const endsAt = w.endsAt as Date;

  return {
    epochId,
    epochHint: epochId.slice(0, 8),
    state,
    startsAt: iso(w.startsAt),
    endsAt: iso(endsAt),
    expiresAt: iso(w.expiresAt),
    daysLeft: state === "active" ? Math.max(0, Math.ceil((endsAt.getTime() - now.getTime()) / DAY)) : 0,
    eventCount: events.length,
    sessionCount: new Set(events.map((e) => e.sessionId)).size,
    pageCount: contentIds.length,
    entry: views.length ? props(views[0]).entry || null : null,
    pages: contentIds.slice(0, 5).map((id) => CONTENT[id]?.title ?? id),
    ctas,
    purposes,
    linked: refOf(b.linked.get(epochId) ?? null),
    network,
    insights: (b.insights.get(epochId) ?? []).map((i) => {
      const r = (i.record ?? {}) as Doc;
      return { ruleVersion: str(r.ruleVersion), hypothesis: str(r.hypothesis) };
    }),
  };
}

const LIST_LIMIT = 100;

export async function listJourneys(filter: JourneyFilter = "all", now = new Date()): Promise<JourneyListItem[]> {
  if (!viEnabled()) return [];
  await connect();

  const [dead, revoked, windows] = await Promise.all([
    tombstonedScopes(),
    revokedEpochs(),
    // Withdrawn and expired windows hold no data any more; only these two can be shown.
    // Bounded: grants are free to mint, so windows can pile up. Newest first.
    VIWindow.find({ siteId: SITE_ID, state: { $in: ["active", "closed"] } })
      .sort({ startsAt: -1 })
      .limit(LIST_LIMIT * 20)
      .lean<Doc[]>(),
  ]);

  const visible = windows
    .filter((w) => !isHidden(dead, w.epochId as string) && !revoked.has(w.epochId as string))
    .filter((w) => filter === "all" || effectiveState(w, now) === filter)
    .slice(0, LIST_LIMIT);
  if (visible.length === 0) return [];

  const batch = await loadBatch(
    visible.map((w) => w.epochId as string),
    now,
  );
  return visible.map((w) => toItem(w, batch, now));
}

/* ---------------------------------------------------------------- detail */

function timelineOf(events: Doc[], linkedIds: Set<string>): TimelineRow[] {
  return events.map((e) => {
    const p = (e.properties ?? {}) as Record<string, string>;
    const name = String(e.eventName);
    let label = EVENT_LABEL[name] ?? name;
    let detail = "";
    if (name === "page_view") {
      label = CONTENT[p.content_id]?.title ?? p.content_id;
      detail = p.entry ?? "";
    } else if (name === "cta_click") {
      label = CTA_LABEL[p.cta_id] ?? p.cta_id;
      detail = "cta";
    } else {
      detail = Object.values(p).join(" · ");
    }
    return {
      at: iso(e.occurredAt),
      eventId: str(e.eventId),
      sessionHint: str(e.sessionId).slice(0, 8),
      eventName: name,
      label,
      detail,
      evidenceStatus: (e.evidenceStatus as EvidenceStatus) ?? "observed",
      inLink: linkedIds.has(str(e.eventId)),
    };
  });
}

function evidenceRow(d: Doc): EvidenceRow {
  return {
    id: String(d._id),
    entityScope: str(d.entityScope),
    entityId: str(d.entityId),
    fieldId: str(d.fieldId),
    value: (d.value as Record<string, unknown>) ?? null,
    sourceId: str(d.sourceId) || null,
    sourceKind: str(d.sourceKind) || null,
    sourceRecordId: str(d.sourceRecordId) || null,
    observedAt: isoOrNull(d.observedAt),
    collectedAt: isoOrNull(d.collectedAt),
    evidenceStatus: d.evidenceStatus as EvidenceStatus,
    verificationScope: str(d.verificationScope) || null,
    confidence: d.confidence ?? null,
    contradictions: (d.contradictions as unknown[]) ?? [],
    unknownReason: str(d.unknownReason) || null,
    unknowns: (d.unknowns as string[]) ?? [],
    explanation: str(d.explanation) || null,
    expiresAt: iso(d.expiresAt),
  };
}

const sourceOf = (e: EvidenceRow) => [e.sourceId, e.sourceKind].filter(Boolean).join(" · ") || "registry";

const SELF_REPORTED_CAVEAT = "Typed by the visitor; not verified.";

/** Every row that comes from the linked enquiry says how far it reaches. */
const scopeNote = (l: LinkedLead) =>
  ` Applies only to the ${l.eventIds.length} linked events of session ${l.sessionHint}, not to the rest of this journey.`;

/**
 * R02: one row per dimension per source. Nothing here combines two claims into
 * one, and nothing upgrades a label — a network owner stays `inferred` even
 * when the visitor typed the same organisation name into the form.
 */
function dimensionsOf(linked: LinkedLead | null, network: EvidenceRow[], insights: InsightView[]): Dimension[] {
  const rows: Dimension[] = [
    {
      dimension: "Automation",
      value: "likely human",
      evidenceStatus: "inferred",
      source: "consent interaction",
      caveat: "A person clicked Allow; nothing about the device was examined.",
    },
  ];
  const hosting = network.find((e) => e.evidenceStatus !== "unknown" && e.value?.networkKind === "hosting");
  if (hosting) {
    rows.push({
      dimension: "Automation",
      value: "hosting network",
      evidenceStatus: "inferred",
      source: sourceOf(hosting),
      caveat: "Cloud, VPN or automation possible.",
    });
  }

  rows.push(
    linked
      ? {
          dimension: "Identification",
          value: `${linked.name} <${linked.email}>`,
          evidenceStatus: "self_reported",
          source: "contact form",
          caveat: SELF_REPORTED_CAVEAT + scopeNote(linked),
        }
      : {
          dimension: "Identification",
          value: "unknown",
          evidenceStatus: "unknown",
          source: "none",
          caveat: "No enquiry linked.",
        },
  );

  const affiliation: Dimension[] = [];
  if (linked && (linked.enquiringAs || linked.organization)) {
    affiliation.push({
      dimension: "Affiliation",
      value: [linked.enquiringAs, linked.organization].filter(Boolean).join(" — "),
      evidenceStatus: "self_reported",
      source: "contact form",
      caveat: SELF_REPORTED_CAVEAT + scopeNote(linked),
    });
  }
  for (const e of network) {
    if (e.evidenceStatus === "unknown") {
      affiliation.push({
        dimension: "Affiliation",
        value: "unknown",
        evidenceStatus: "unknown",
        source: sourceOf(e),
        caveat: `Network lookup gave no owner${e.unknownReason ? `: ${e.unknownReason}` : "."}`,
      });
      continue;
    }
    affiliation.push({
      dimension: "Affiliation",
      value: `${str(e.value?.candidateOrganization) || "unknown"} (${str(e.value?.networkKind) || "unknown"})`,
      evidenceStatus: "inferred",
      source: sourceOf(e),
      caveat: "Network owner, not employer (possible_network_association).",
    });
  }
  rows.push(
    ...(affiliation.length
      ? affiliation
      : [
          {
            dimension: "Affiliation" as const,
            value: "unknown",
            evidenceStatus: "unknown" as const,
            source: "none",
            caveat: "No organisation typed and no network owner recorded.",
          },
        ]),
  );

  rows.push({
    dimension: "Authority",
    value: "unknown",
    evidenceStatus: "unknown",
    source: "none",
    caveat: "Never collected. Enquiring for an organisation does not establish authority.",
  });

  const intent: Dimension[] = [];
  if (linked?.topic) {
    intent.push({
      dimension: "Business intent",
      value: linked.topic,
      evidenceStatus: "self_reported",
      source: "contact form",
      caveat: SELF_REPORTED_CAVEAT + scopeNote(linked),
    });
  }
  for (const i of insights) {
    intent.push({
      dimension: "Business intent",
      value: i.hypothesis,
      evidenceStatus: "inferred",
      source: `rule ${i.ruleVersion}`,
      caveat: "Unvalidated rule; confidence not calibrated.",
    });
  }
  rows.push(
    ...(intent.length
      ? intent
      : [
          {
            dimension: "Business intent" as const,
            value: "unknown",
            evidenceStatus: "unknown" as const,
            source: "none",
            caveat: "No topic given and no rule fired.",
          },
        ]),
  );

  rows.push({
    dimension: "Gender",
    value: "not collected",
    evidenceStatus: "not_applicable",
    source: "policy",
    caveat: "By policy: the reference rejects gender fields and sensitive-trait scoring.",
  });
  return rows;
}

const linkView = (l: Link): LinkView => ({
  ...l,
  validFrom: iso(l.validFrom),
  validUntil: iso(l.validUntil),
  revokedAt: isoOrNull(l.revokedAt),
});

/** Null when the journey does not exist, is erased, or the feature is off — the route answers 404. */
export async function getJourney(epochId: string, now = new Date()): Promise<JourneyDetail | null> {
  const engine = await getEngine();
  if (!engine) {
    if (!viEnabled()) return null;
    throw new Error("Database unreachable.");
  }
  if (await engine.store.isTombstoned(SITE_ID, scopeHash(SITE_ID, epochId))) return null;
  if (await VIGrant.exists({ siteId: SITE_ID, epochId, revokedAt: { $ne: null } })) return null;

  const w = await VIWindow.findOne({ siteId: SITE_ID, epochId, state: { $in: ["active", "closed"] } }).lean<Doc>();
  if (!w) return null;

  const [batch, insights, evidenceDocs, linkDocs] = await Promise.all([
    loadBatch([epochId], now),
    // Recomputed on every open: the stored set may predate the latest events,
    // and infer() re-checks grants and tombstones as it goes (R08, R48).
    engine.infer(SITE_ID, epochId, now),
    VIEvidence.find({ siteId: SITE_ID, epochId, expiresAt: { $gt: now } }).sort({ collectedAt: 1 }).lean<Doc[]>(),
    VILink.find({ siteId: SITE_ID, epochId }).sort({ validFrom: -1 }).lean<Doc[]>(),
  ]);

  const item = toItem(w, batch, now);
  const linked = batch.linked.get(epochId) ?? null;
  const insightViews = insights.map(
    (i): InsightView => ({ ...i, computedAt: iso(i.computedAt), expiresAt: iso(i.expiresAt) }),
  );
  const evidence = evidenceDocs.map(evidenceRow);

  return {
    ...item,
    linked,
    timeline: timelineOf(batch.events.get(epochId) ?? [], new Set(linked?.eventIds ?? [])),
    insights: insightViews,
    evidence,
    links: linkDocs.map((d) => linkView(toLink(d))),
    dimensions: dimensionsOf(
      linked,
      evidence.filter((e) => e.fieldId === "network_owner"),
      insightViews,
    ),
  };
}
