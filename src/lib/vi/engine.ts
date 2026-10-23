/**
 * Visitor-intelligence engine — a port of visitor_intelligence_reference/reference.py.
 *
 * Same invariants, same order of checks, same rejection codes. The differences
 * are deliberate and listed in docs/spec/phase-6-visitor-intelligence.md:
 * storage is an async `Store` (MongoDB in production, memory in tests), the
 * catalog and rules are injected so the reference's synthetic catalog and the
 * real site catalog run through identical code, insights are a list (four
 * rules, spec §6), and deletion jobs back off exponentially (README "retry with
 * bounded exponential backoff").
 *
 * `Context` and `Proof` MUST come from trusted server adapters (README, R30):
 * the context is read from HMAC-signed httpOnly cookies, proofs are created
 * inside the contact route. Never build either from a request body.
 *
 * Server-only. Uses relative `.ts` imports so `node --test` can run it.
 */
import { createHash, randomUUID } from "node:crypto";
import {
  FINALIZATION_MS,
  GRANT_VALIDITY_MS,
  LATE_MS,
  MAX_EVENTS_PER_EPOCH,
  MAX_PAYLOAD_BYTES,
  MAX_SESSIONS_PER_EPOCH,
  POLICY_VERSION,
  PROOF_KINDS,
  RETENTION,
  SCHEMA_VERSION,
  WINDOW_MS,
  type Purpose,
  type SourceConfig,
} from "./policy.ts";

/* --------------------------------------------------------------- types */

/** A code-only rejection. Callers log `code`, never the payload (R28). */
export class Rejected extends Error {
  readonly code: string;
  constructor(code: string) {
    super(code);
    this.code = code;
    this.name = "Rejected";
  }
}

export type Context = { siteId: string; sourceId: string; epochId: string; sessionId: string; grantId: string };

export type GrantState = "granted" | "denied" | "withdrawn" | "expired";

export type Grant = {
  grantId: string;
  siteId: string;
  epochId: string;
  startsAt: Date;
  /** reference.py `expires_at`; schema.sql `valid_until`. */
  expiresAt: Date;
  purposes: Purpose[];
  sources: string[];
  revokedAt: Date | null;
  state: GrantState;
  /** True once the epoch was erased and `epochId` on the stored record was replaced by its hash. */
  erased?: boolean;
  basis: string;
  policyVersion: string;
  proofRef: string;
};

export type WindowState = "active" | "closed" | "withdrawn" | "expired";

export type ObservationWindow = {
  siteId: string;
  windowId: string;
  epochId: string;
  authorizationId: string;
  startsAt: Date;
  endsAt: Date;
  acceptUntil: Date;
  expiresAt: Date;
  state: WindowState;
};

export type StoredEvent = {
  eventId: string;
  siteId: string;
  sourceId: string;
  sourceEventId: string;
  epochId: string;
  sessionId: string;
  windowId: string;
  authorizationId: string;
  schemaVersion: string;
  eventName: string;
  properties: Record<string, string>;
  occurredAt: Date;
  clientReportedAt: Date | null;
  receivedAt: Date;
  processedAt: Date;
  expiresAt: Date;
  payloadDigest: string;
  evidenceStatus: "observed";
  permissionSnapshot: {
    authorizationId: string;
    policyVersion: string;
    purpose: Purpose;
    state: GrantState;
    resolvedBy: "server";
  };
};

export type ProofKind = (typeof PROOF_KINDS)[number] | string;

export type Proof = {
  proofId: string;
  siteId: string;
  grantId: string;
  sessionId: string;
  contactId: string;
  eventIds: string[];
  kind: ProofKind;
  expiresAt: Date;
};

export type Link = {
  linkId: string;
  siteId: string;
  epochId: string;
  sessionId: string;
  contactId: string;
  eventIds: string[];
  proofId: string;
  validFrom: Date;
  validUntil: Date;
  revokedAt: Date | null;
  reversalReason: string | null;
};

export type Insight = {
  schemaVersion: string;
  insightId: string;
  siteId: string;
  entityScope: "browser_epoch";
  entityId: string;
  windowId: string;
  ruleVersion: string;
  status: "inferred";
  hypothesis: string;
  /** Always null probability: these rules are unvalidated (examples.json). */
  confidence: { probability: null; description: string };
  evidenceIds: string[];
  counterevidence: string[];
  counterevidenceState: "none_recorded_not_proven_absent";
  alternatives: string[];
  unknowns: string[];
  permittedNextAction: string;
  authorizationId: string;
  computedAt: Date;
  expiresAt: Date;
};

export type TombstoneAction = "withdrawn" | "expired" | "admin_erased" | "link_reversed";

/** The audit actions that end an epoch. */
export const ERASING_ACTIONS: readonly TombstoneAction[] = ["withdrawn", "expired", "admin_erased"];

export type Tombstone = {
  siteId: string;
  auditId: string;
  action: TombstoneAction;
  actorRole: "visitor" | "admin" | "system";
  /** HMAC of the epoch, so the audit row cannot be joined back without the key. */
  scopeHmac: string;
  policyVersion: string;
  recordedAt: Date;
  expiresAt: Date;
};

export type ExportRecord = {
  siteId: string;
  exportId: string;
  epochId: string;
  destination: string;
  remoteRef: string;
  exportedAt: Date;
  expiresAt: Date;
};

export type DeletionJobState = "pending" | "accepted" | "verified" | "failed";

export type DeletionJob = {
  siteId: string;
  jobId: string;
  destination: string;
  remoteRef: string;
  scope: { epochHmac: string };
  state: DeletionJobState;
  attempts: number;
  requestedAt: Date;
  nextAttemptAt: Date | null;
  deadlineAt: Date;
  verifiedAt: Date | null;
  errorCode: string | null;
};

/** What a deletion adapter may report. `true` = verified, `false` = try again. */
export type DeletionResult = boolean | "verified" | "accepted" | "pending";
export type DeletionAdapter = (job: DeletionJob) => Promise<DeletionResult> | DeletionResult;

/* --------------------------------------------------------------- store */

export interface Store {
  getGrant(grantId: string): Promise<Grant | null>;
  saveGrant(g: Grant): Promise<void>;

  /**
   * True when the epoch was erased — an audit row whose action is in
   * ERASING_ACTIONS. A `link_reversed` row shares the epoch hash and must NOT
   * count, or reversing one link would silently end the whole journey.
   */
  isTombstoned(siteId: string, scopeHmac: string): Promise<boolean>;
  addTombstone(t: Tombstone): Promise<void>;

  getWindow(siteId: string, epochId: string): Promise<ObservationWindow | null>;
  /** Inserts `w` unless a window for the epoch exists; returns whichever is stored. */
  getOrCreateWindow(w: ObservationWindow): Promise<ObservationWindow>;
  saveWindow(w: ObservationWindow): Promise<void>;
  listOpenWindows(): Promise<ObservationWindow[]>;

  getSessionEpoch(siteId: string, sessionId: string): Promise<string | null>;
  setSessionEpoch(siteId: string, sessionId: string, epochId: string, expiresAt: Date): Promise<void>;

  getEvent(siteId: string, sourceId: string, sourceEventId: string): Promise<StoredEvent | null>;
  /** "duplicate" when the unique (siteId, sourceId, sourceEventId) already exists. */
  insertEvent(e: StoredEvent): Promise<"inserted" | "duplicate">;
  listEvents(siteId: string, epochId: string): Promise<StoredEvent[]>;
  countEvents(siteId: string, epochId: string): Promise<number>;
  countSessions(siteId: string, epochId: string): Promise<number>;

  getProof(proofId: string): Promise<Proof | null>;
  saveProof(p: Proof): Promise<void>;

  getLink(linkId: string): Promise<Link | null>;
  saveLink(l: Link): Promise<void>;

  replaceInsights(siteId: string, epochId: string, insights: Insight[]): Promise<void>;

  /** Deletes every journey record of one epoch. Never touches leads or other epochs. */
  eraseEpochData(siteId: string, epochId: string, grantIds: string[]): Promise<void>;
  grantIdsForEpoch(siteId: string, epochId: string): Promise<string[]>;
  /** Epoch ids that still have journey data — the sweep checks each against tombstones. */
  epochsWithData(siteId: string): Promise<string[]>;

  listExports(siteId: string, epochId: string): Promise<ExportRecord[]>;
  upsertDeletionJob(j: DeletionJob): Promise<void>;
  listDeletionJobs(): Promise<DeletionJob[]>;
  saveDeletionJob(j: DeletionJob): Promise<void>;
}

/* ------------------------------------------------------------- config */

export type ContentInfo = { type: string };

export type RuleInput = {
  events: StoredEvent[];
  contents: Record<string, ContentInfo>;
};

export type RuleResult = { hypothesis: string; support: StoredEvent[] };

export type Rule = {
  version: string;
  alternatives: string[];
  unknowns: string[];
  nextAction: string;
  evaluate(input: RuleInput): RuleResult | null;
};

export type EngineConfig = {
  sources: Record<string, SourceConfig>;
  properties: Record<string, readonly string[]>;
  allowedValues: Record<string, readonly string[]>;
  contents: Record<string, ContentInfo>;
  rules: Rule[];
  /** Keyed hash of an epoch for tombstones. Production: HMAC with a server secret. */
  scopeHash: (siteId: string, epochId: string) => string;
  newId?: () => string;
};

/* ------------------------------------------------------------ helpers */

const ENVELOPE_KEYS = new Set(["schema_version", "event_id", "event_name", "properties", "occurred_at"]);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** An ISO-8601 instant that names its offset. A naive time is rejected (R29). */
const AWARE_ISO_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/;

export function aware(value: Date): Date {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) throw new Rejected("timezone_required");
  return new Date(value.getTime());
}

function parseAwareIso(value: unknown): Date {
  if (typeof value !== "string" || !AWARE_ISO_RE.test(value)) throw new Rejected("provider_time_invalid");
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) throw new Rejected("provider_time_invalid");
  return d;
}

/** JSON with sorted keys, so the idempotency digest is stable across key order. */
function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  const obj = value as Record<string, unknown>;
  return `{${Object.keys(obj)
    .sort()
    .map((k) => `${JSON.stringify(k)}:${canonicalJson(obj[k])}`)
    .join(",")}}`;
}

const minDate = (...ds: Date[]) => new Date(Math.min(...ds.map((d) => d.getTime())));
const plus = (d: Date, ms: number) => new Date(d.getTime() + ms);

/** Bounded exponential backoff: 1 min, 2 min, 4 min … capped at 24 h. */
export function backoffMs(attempts: number) {
  return Math.min(60_000 * 2 ** Math.max(0, attempts - 1), 24 * 3_600_000);
}

/* ------------------------------------------------------------- engine */

export class Engine {
  readonly store: Store;
  readonly config: EngineConfig;
  private readonly newId: () => string;

  constructor(store: Store, config: EngineConfig) {
    this.store = store;
    this.config = config;
    this.newId = config.newId ?? randomUUID;
  }

  /** A new browser epoch and its grant. Called by the trusted grant route only. */
  async createGrant(input: {
    siteId: string;
    purposes: Purpose[];
    sources: string[];
    now: Date;
    basis?: string;
    proofRef: string;
  }): Promise<Grant> {
    const now = aware(input.now);
    const purposes = [...new Set(input.purposes)];
    if (!purposes.includes("journey")) throw new Rejected("journey_purpose_required");
    const g: Grant = {
      grantId: this.newId(),
      siteId: input.siteId,
      epochId: this.newId(),
      startsAt: now,
      expiresAt: plus(now, GRANT_VALIDITY_MS),
      purposes,
      sources: [...new Set(input.sources)],
      revokedAt: null,
      state: "granted",
      basis: input.basis ?? "consent",
      policyVersion: POLICY_VERSION,
      proofRef: input.proofRef,
    };
    await this.store.saveGrant(g);
    return g;
  }

  /** reference.py `_grant`. */
  async checkGrant(c: Context, now: Date, purpose: Purpose): Promise<Grant> {
    now = aware(now);
    const g = await this.store.getGrant(c.grantId);
    if (
      !g ||
      g.siteId !== c.siteId ||
      g.epochId !== c.epochId ||
      g.revokedAt !== null ||
      !(g.startsAt.getTime() <= now.getTime() && now.getTime() < g.expiresAt.getTime()) ||
      !g.purposes.includes(purpose) ||
      !g.sources.includes(c.sourceId) ||
      (await this.store.isTombstoned(c.siteId, this.config.scopeHash(c.siteId, c.epochId)))
    ) {
      throw new Rejected("permission_denied");
    }
    return g;
  }

  /** reference.py `ingest`. Returns "accepted" or "duplicate"; anything else throws `Rejected`. */
  async ingest(raw: unknown, c: Context, receivedAtInput: Date): Promise<"accepted" | "duplicate"> {
    const receivedAt = aware(receivedAtInput);
    const source = this.config.sources[c.sourceId];
    const kind = source && source.enabled ? source.kind : undefined;
    if (kind !== "browser" && kind !== "provider") throw new Rejected("source_not_authorized");
    const g = await this.checkGrant(c, receivedAt, "journey");

    if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new Rejected("schema_invalid");
    const r = raw as Record<string, unknown>;
    if (Object.keys(r).some((k) => !ENVELOPE_KEYS.has(k)) || r.schema_version !== SCHEMA_VERSION) {
      throw new Rejected("schema_invalid");
    }
    if (new TextEncoder().encode(JSON.stringify(r)).length > MAX_PAYLOAD_BYTES) {
      throw new Rejected("payload_too_large");
    }
    if (typeof r.event_id !== "string" || !UUID_RE.test(r.event_id)) throw new Rejected("event_id_invalid");
    const eventId = r.event_id.toLowerCase();

    const name = r.event_name;
    const props = r.properties;
    const expected = typeof name === "string" ? this.config.properties[name] : undefined;
    if (
      !expected ||
      !props ||
      typeof props !== "object" ||
      Array.isArray(props) ||
      !sameKeySet(Object.keys(props), expected)
    ) {
      throw new Rejected("properties_invalid");
    }
    const p = props as Record<string, unknown>;
    for (const [k, v] of Object.entries(p)) {
      if (typeof v !== "string" || !(this.config.allowedValues[k] ?? []).includes(v)) {
        throw new Rejected("property_value_not_allowlisted");
      }
    }
    const eventName = name as string;
    if ((kind === "provider") !== (eventName === "booking_confirmed")) throw new Rejected("event_source_mismatch");

    // Browser time never authorizes historical collection or backdating (R13).
    let effectiveAt = receivedAt;
    if (kind === "provider") {
      effectiveAt = parseAwareIso(r.occurred_at);
      const lag = receivedAt.getTime() - effectiveAt.getTime();
      if (!(lag >= 0 && lag <= LATE_MS)) throw new Rejected("provider_time_out_of_bounds");
    }
    if (!(g.startsAt.getTime() <= effectiveAt.getTime() && effectiveAt.getTime() < g.expiresAt.getTime())) {
      throw new Rejected("no_permission_at_occurrence");
    }

    const knownEpoch = await this.store.getSessionEpoch(c.siteId, c.sessionId);
    if ((knownEpoch ?? c.epochId) !== c.epochId) throw new Rejected("session_epoch_conflict");
    if (knownEpoch === null && (await this.store.countSessions(c.siteId, c.epochId)) >= MAX_SESSIONS_PER_EPOCH) {
      throw new Rejected("epoch_session_cap");
    }

    // Fingerprint only the event envelope for idempotency, never the visitor.
    const canonical = {
      name: eventName,
      props: p,
      epoch: c.epochId,
      session: c.sessionId,
      provider_time: kind === "provider" ? effectiveAt.toISOString() : null,
    };
    const digest = createHash("sha256").update(canonicalJson(canonical)).digest("hex");

    const prior = await this.store.getEvent(c.siteId, c.sourceId, eventId);
    if (prior) {
      if (prior.payloadDigest !== digest) throw new Rejected("idempotency_conflict");
      return "duplicate";
    }

    if ((await this.store.countEvents(c.siteId, c.epochId)) >= MAX_EVENTS_PER_EPOCH) {
      throw new Rejected("epoch_event_cap");
    }

    let w = await this.store.getWindow(c.siteId, c.epochId);
    if (!w) {
      if (kind !== "browser" || eventName !== "page_view") {
        throw new Rejected("first_event_must_be_eligible_page_view");
      }
      // README: "A production adapter must compute the minimum of all relevant
      // expiry limits" — the window never outlives the grant that permits it.
      const expiresAt = minDate(plus(receivedAt, WINDOW_MS + FINALIZATION_MS), g.expiresAt);
      const endsAt = minDate(plus(receivedAt, WINDOW_MS), expiresAt);
      const acceptUntil = minDate(plus(receivedAt, WINDOW_MS + LATE_MS), expiresAt);
      w = await this.store.getOrCreateWindow({
        siteId: c.siteId,
        windowId: this.newId(),
        epochId: c.epochId,
        authorizationId: c.grantId,
        startsAt: receivedAt,
        endsAt,
        acceptUntil,
        expiresAt,
        state: "active",
      });
    }
    if (
      !(w.startsAt.getTime() <= effectiveAt.getTime() && effectiveAt.getTime() < w.endsAt.getTime()) ||
      receivedAt.getTime() >= w.acceptUntil.getTime()
    ) {
      throw new Rejected("outside_observation_window");
    }

    await this.store.setSessionEpoch(c.siteId, c.sessionId, c.epochId, w.expiresAt);
    let clientReportedAt: Date | null = null;
    if (kind === "browser" && typeof r.occurred_at === "string") {
      const d = new Date(r.occurred_at);
      // Kept for diagnosis only. It never moves a window or an expiry.
      clientReportedAt = Number.isNaN(d.getTime()) ? null : d;
    }
    const stored: StoredEvent = {
      eventId,
      siteId: c.siteId,
      sourceId: c.sourceId,
      sourceEventId: eventId,
      epochId: c.epochId,
      sessionId: c.sessionId,
      windowId: w.windowId,
      authorizationId: c.grantId,
      schemaVersion: SCHEMA_VERSION,
      eventName,
      properties: { ...(p as Record<string, string>) },
      occurredAt: effectiveAt,
      clientReportedAt,
      receivedAt,
      processedAt: receivedAt,
      expiresAt: w.expiresAt,
      payloadDigest: digest,
      evidenceStatus: "observed",
      permissionSnapshot: {
        authorizationId: g.grantId,
        policyVersion: g.policyVersion,
        purpose: "journey",
        state: "granted",
        resolvedBy: "server",
      },
    };
    if ((await this.store.insertEvent(stored)) === "duplicate") {
      // Lost a race with an identical request: settle it exactly as above.
      const winner = await this.store.getEvent(c.siteId, c.sourceId, eventId);
      if (winner && winner.payloadDigest !== digest) throw new Rejected("idempotency_conflict");
      return "duplicate";
    }
    // A withdrawal can land between the grant check above and this write. The
    // tombstone already hides the row; deleting the epoch's data again here
    // means the late event is gone now rather than at the next sweep (R09).
    if (await this.store.isTombstoned(c.siteId, this.config.scopeHash(c.siteId, c.epochId))) {
      await this.store.eraseEpochData(c.siteId, c.epochId, await this.store.grantIdsForEpoch(c.siteId, c.epochId));
      throw new Rejected("permission_denied");
    }
    return "accepted";
  }

  /** Registers a proof. Only a trusted server adapter (the contact route) may call this. */
  async registerProof(p: Proof): Promise<void> {
    if (!PROOF_KINDS.includes(p.kind as (typeof PROOF_KINDS)[number])) throw new Rejected("proof_kind_invalid");
    await this.store.saveProof({ ...p, eventIds: [...new Set(p.eventIds)] });
  }

  /** reference.py `link_session_to_contact`. */
  async linkSessionToContact(c: Context, proofId: string, nowInput: Date): Promise<Link> {
    const now = aware(nowInput);
    await this.checkGrant(c, now, "linking");
    const p = await this.store.getProof(proofId);
    if (
      !p ||
      !PROOF_KINDS.includes(p.kind as (typeof PROOF_KINDS)[number]) ||
      p.siteId !== c.siteId ||
      p.grantId !== c.grantId ||
      p.sessionId !== c.sessionId ||
      now.getTime() >= p.expiresAt.getTime() ||
      p.eventIds.length === 0
    ) {
      throw new Rejected("explicit_scoped_proof_required");
    }
    const eligible = new Set(
      (await this.store.listEvents(c.siteId, c.epochId))
        .filter((e) => e.sessionId === c.sessionId && now.getTime() < e.expiresAt.getTime())
        .map((e) => e.eventId),
    );
    if (!p.eventIds.every((id) => eligible.has(id))) throw new Rejected("proof_event_scope_mismatch");
    const w = await this.store.getWindow(c.siteId, c.epochId);
    if (!w) throw new Rejected("proof_event_scope_mismatch");
    const link: Link = {
      linkId: p.proofId,
      siteId: c.siteId,
      epochId: c.epochId,
      sessionId: c.sessionId,
      contactId: p.contactId,
      eventIds: [...p.eventIds].sort(),
      proofId: p.proofId,
      validFrom: now,
      validUntil: minDate(p.expiresAt, w.expiresAt),
      revokedAt: null,
      reversalReason: null,
    };
    await this.store.saveLink(link);
    return link;
  }

  /** reference.py `reverse_link`, plus an audit row. */
  async reverseLink(linkId: string, nowInput: Date, reason = "reversed", actorRole: Tombstone["actorRole"] = "admin") {
    const now = aware(nowInput);
    const link = await this.store.getLink(linkId);
    if (!link) throw new Rejected("link_not_found");
    link.revokedAt = now;
    link.reversalReason = reason;
    await this.store.saveLink(link);
    await this.audit(link.siteId, link.epochId, "link_reversed", actorRole, now);
    return link;
  }

  /** reference.py `infer`, generalised to every configured rule. Recomputed from scratch each call. */
  async infer(siteId: string, epochId: string, nowInput: Date): Promise<Insight[]> {
    const now = aware(nowInput);
    await this.store.replaceInsights(siteId, epochId, []);
    if (await this.store.isTombstoned(siteId, this.config.scopeHash(siteId, epochId))) return [];

    const all = await this.store.listEvents(siteId, epochId);
    const grants = new Map<string, Grant | null>();
    for (const id of new Set(all.map((e) => e.authorizationId))) grants.set(id, await this.store.getGrant(id));
    const events = all.filter((e) => {
      const g = grants.get(e.authorizationId);
      return (
        e.occurredAt.getTime() <= now.getTime() &&
        now.getTime() < e.expiresAt.getTime() &&
        !!g &&
        g.revokedAt === null &&
        now.getTime() < g.expiresAt.getTime()
      );
    });
    if (events.length === 0) return [];

    const out: Insight[] = [];
    for (const rule of this.config.rules) {
      const res = rule.evaluate({ events, contents: this.config.contents });
      if (!res || res.support.length === 0) continue;
      out.push({
        schemaVersion: SCHEMA_VERSION,
        insightId: this.newId(),
        siteId,
        entityScope: "browser_epoch",
        entityId: epochId,
        windowId: res.support[0].windowId,
        ruleVersion: rule.version,
        status: "inferred",
        hypothesis: res.hypothesis,
        confidence: { probability: null, description: "Unvalidated rule, not a probability" },
        evidenceIds: res.support.map((e) => e.eventId),
        counterevidence: [],
        counterevidenceState: "none_recorded_not_proven_absent",
        alternatives: [...rule.alternatives],
        unknowns: [...rule.unknowns],
        permittedNextAction: rule.nextAction,
        authorizationId: res.support[0].authorizationId,
        computedAt: now,
        // An insight never extends raw-evidence expiry (R15).
        expiresAt: minDate(...res.support.map((e) => e.expiresAt)),
      });
    }
    await this.store.replaceInsights(siteId, epochId, out);
    return out;
  }

  /**
   * reference.py `withdraw`. Idempotent: a retry after a failure part-way
   * through erases again rather than reporting success over surviving data.
   * The revocation happens inside eraseEpoch, AFTER the tombstone — revoking
   * first would let a failed tombstone write leave a revoked-but-visible epoch
   * that no later retry or sweep would ever touch.
   */
  async withdraw(c: Context, nowInput: Date): Promise<void> {
    const now = aware(nowInput);
    const g = await this.store.getGrant(c.grantId);
    if (!g || g.siteId !== c.siteId || (g.epochId !== c.epochId && !g.erased)) {
      throw new Rejected("withdrawal_scope_invalid");
    }
    await this.eraseEpoch(c.siteId, c.epochId, now, "withdrawn", "visitor");
  }

  /** Erasure requested by the site owner on a visitor's behalf. Same scope as withdrawal. */
  async adminErase(siteId: string, epochId: string, nowInput: Date): Promise<void> {
    await this.eraseEpoch(siteId, epochId, aware(nowInput), "admin_erased", "admin");
  }

  /**
   * reference.py `_erase_epoch`. The tombstone is written FIRST: from that
   * moment every read and every new event treats the epoch as gone, so an
   * interrupted delete cannot leave data visible (spec D7). Deliberately does
   * NOT traverse shared organisation or contact records (R20).
   */
  async eraseEpoch(
    siteId: string,
    epochId: string,
    nowInput: Date,
    state: "withdrawn" | "expired" | "admin_erased",
    actorRole: Tombstone["actorRole"],
  ): Promise<void> {
    const now = aware(nowInput);
    // 1. Tombstone — hides everything below from this instant, even if a later step fails.
    if (!(await this.store.isTombstoned(siteId, this.config.scopeHash(siteId, epochId)))) {
      await this.audit(siteId, epochId, state, actorRole, now);
    }
    const grantIds = await this.store.grantIdsForEpoch(siteId, epochId);
    // 2. Revoke (withdrawal and admin erasure; an expiring grant simply lapses).
    if (state !== "expired") {
      for (const gid of grantIds) {
        const g = await this.store.getGrant(gid);
        if (g && g.revokedAt === null) {
          g.revokedAt = now;
          g.state = "withdrawn";
          await this.store.saveGrant(g);
        }
      }
    }
    const w = await this.store.getWindow(siteId, epochId);
    if (w) {
      w.state = state === "admin_erased" ? "withdrawn" : state;
      await this.store.saveWindow(w);
    }
    // 3. Delete. The production store also drops the window and replaces the
    // epoch id on the consent record with its keyed hash.
    await this.store.eraseEpochData(siteId, epochId, grantIds);
    for (const x of await this.store.listExports(siteId, epochId)) {
      await this.store.upsertDeletionJob({
        siteId,
        jobId: `${x.destination}:${x.remoteRef}`,
        destination: x.destination,
        remoteRef: x.remoteRef,
        scope: { epochHmac: this.config.scopeHash(siteId, epochId) },
        state: "pending",
        attempts: 0,
        requestedAt: now,
        nextAttemptAt: now,
        deadlineAt: plus(now, RETENTION.deletionDeadlineMs),
        verifiedAt: null,
        errorCode: null,
      });
    }
  }

  /** reference.py `expire`: erase at `expiresAt`, close at `endsAt`. */
  async expire(nowInput: Date): Promise<{ expired: number; closed: number }> {
    const now = aware(nowInput);
    let expired = 0;
    let closed = 0;
    for (const w of await this.store.listOpenWindows()) {
      if (now.getTime() >= w.expiresAt.getTime() && w.state !== "expired" && w.state !== "withdrawn") {
        await this.eraseEpoch(w.siteId, w.epochId, now, "expired", "system");
        expired++;
      } else if (now.getTime() >= w.endsAt.getTime() && w.state === "active") {
        w.state = "closed";
        await this.store.saveWindow(w);
        closed++;
      }
    }
    return { expired, closed };
  }

  /**
   * Deletes anything still stored for an epoch that has a tombstone — an
   * interrupted erase, or rows brought back by a restored backup (spec D8).
   */
  async reconcile(siteId: string): Promise<number> {
    let removed = 0;
    for (const epochId of await this.store.epochsWithData(siteId)) {
      if (await this.store.isTombstoned(siteId, this.config.scopeHash(siteId, epochId))) {
        await this.store.eraseEpochData(siteId, epochId, await this.store.grantIdsForEpoch(siteId, epochId));
        removed++;
      }
    }
    return removed;
  }

  /**
   * reference.py `run_deletion_jobs`. Only "verified" completes a job; an
   * accepted request (HTTP 202) is not proof of erasure. Retries back off
   * exponentially and a job past its deadline is marked failed.
   */
  async runDeletionJobs(adapter: DeletionAdapter, nowInput: Date): Promise<void> {
    const now = aware(nowInput);
    for (const job of await this.store.listDeletionJobs()) {
      if (job.state === "verified" || job.state === "failed") continue;
      if (job.nextAttemptAt && job.nextAttemptAt.getTime() > now.getTime()) continue;
      job.attempts += 1;
      let result: DeletionResult;
      try {
        result = await adapter(job);
      } catch {
        result = false;
        job.errorCode = "adapter_error";
      }
      if (result === true || result === "verified") {
        job.state = "verified";
        job.verifiedAt = now;
        job.nextAttemptAt = null;
      } else {
        job.state = result === "accepted" ? "accepted" : "pending";
        job.nextAttemptAt = plus(now, backoffMs(job.attempts));
        if (now.getTime() > job.deadlineAt.getTime()) {
          job.state = "failed";
          job.errorCode = job.errorCode ?? "deadline_exceeded";
        }
      }
      await this.store.saveDeletionJob(job);
    }
  }

  private async audit(
    siteId: string,
    epochId: string,
    action: TombstoneAction,
    actorRole: Tombstone["actorRole"],
    now: Date,
  ) {
    await this.store.addTombstone({
      siteId,
      auditId: this.newId(),
      action,
      actorRole,
      scopeHmac: this.config.scopeHash(siteId, epochId),
      policyVersion: POLICY_VERSION,
      recordedAt: now,
      expiresAt: plus(now, RETENTION.consentAuditMs),
    });
  }
}

function sameKeySet(actual: string[], expected: readonly string[]) {
  return actual.length === expected.length && expected.every((k) => actual.includes(k));
}
