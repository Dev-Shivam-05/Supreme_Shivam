/**
 * Visitor-intelligence policy constants — Phase 6.
 *
 * Every number here comes from visitor_intelligence_reference/README.md or
 * reference.py. Change one and you are changing a written policy: update
 * docs/spec/phase-6-visitor-intelligence.md and /privacy-policy with it.
 *
 * Imported by both server and client code, and run directly by `node --test`,
 * so it must stay free of Node, Next and `@/` imports.
 */

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

/** The single tenant. Still checked on every record — R19, `test_tenant_boundary`. */
export const SITE_ID = "shivambhadoriya.com";

/** Bumped whenever what a visitor agreed to changes. Stored on every grant. */
export const POLICY_VERSION = "2026-10-v1";
export const CONSENT_UI_VERSION = "consent-card-v1";
export const SCHEMA_VERSION = "1.0";

/** The observation window is [t0, t0 + 15 days) — fixed, not rolling. */
export const WINDOW_MS = 15 * DAY;
/** Evidence lives until t0 + 22 days: the window plus a 7-day finalization period. */
export const FINALIZATION_MS = 7 * DAY;
/** Provider events may arrive at most 48 hours after they occurred. */
export const LATE_MS = 48 * HOUR;
/** A grant is valid for as long as the evidence it permits can live. */
export const GRANT_VALIDITY_MS = WINDOW_MS + FINALIZATION_MS;

/** README "Suggested separate defaults". */
export const RETENTION = {
  securityLogMs: 7 * DAY,
  consentAuditMs: 90 * DAY,
  orgCacheMs: 30 * DAY,
  aggregateMs: 180 * DAY,
  /** Deletion jobs are kept a further 30 days past their deadline for reconciliation. */
  deletionJobGraceMs: 30 * DAY,
  /** How long a finished remote deletion may take before it counts as failed. */
  deletionDeadlineMs: 30 * DAY,
} as const;

export const MAX_PAYLOAD_BYTES = 8192;

export const PURPOSES = ["journey", "linking", "organization"] as const;
export type Purpose = (typeof PURPOSES)[number];

/**
 * README "Core semantics": every claim uses exactly one of these. Source kind
 * and confidence are separate fields, never folded into this label.
 */
export const EVIDENCE_STATUS = [
  "observed",
  "self_reported",
  "verified_within_scope",
  "inferred",
  "unknown",
  "not_applicable",
] as const;
export type EvidenceStatus = (typeof EVIDENCE_STATUS)[number];

export const ENTITY_SCOPES = [
  "request",
  "session",
  "browser_epoch",
  "account",
  "contact",
  "organization",
  "aggregate",
] as const;
export type EntityScope = (typeof ENTITY_SCOPES)[number];

/** schema.sql `sources.kind`. */
export type SourceKind = "browser" | "origin" | "cdn" | "provider" | "manual" | "registry";

export type SourceConfig = { kind: SourceKind; scopes: Purpose[]; enabled: boolean; version: string };

/**
 * Registered sources (schema.sql `sources`). Only `browser` and `provider`
 * sources may emit journey events (reference.py `ingest`). There is no booking
 * provider on this site — `booking_confirmed` can never be accepted in
 * production, and the provider path is exercised only by tests.
 */
export const SOURCES: Record<string, SourceConfig> = {
  web: { kind: "browser", scopes: ["journey"], enabled: true, version: "1" },
  contact_form: { kind: "origin", scopes: ["linking"], enabled: true, version: "1" },
  rdap: { kind: "registry", scopes: ["organization"], enabled: true, version: "1" },
};

export const PROOF_KINDS = ["explicit_contact_link", "authenticated_subject"] as const;

export const COOKIE_EPOCH = "sb_vi";
export const COOKIE_SESSION = "sb_vi_s";

/** The one rule that a visitor may not be asked about, and that is never stored. */
export const FORBIDDEN_PROPERTY_KEYS = ["gender", "sex", "email", "name", "phone", "age"] as const;
