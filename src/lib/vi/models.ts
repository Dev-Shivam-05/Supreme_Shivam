/**
 * MongoDB collections for visitor intelligence — spec §4.
 *
 * Every journey collection carries `siteId` and a TTL index on `expiresAt`, so
 * the database deletes on schedule even if no code runs (R15–R17). The daily
 * sweep (api/vi/sweep) does the same work with an audit trail; the TTL is the
 * guarantee, the sweep is the record.
 */
import mongoose, { Schema } from "mongoose";

const { Mixed } = Schema.Types;
const ttl = { expireAfterSeconds: 0 };

function model(name: string, collection: string, schema: Schema) {
  return mongoose.models[name] || mongoose.model(name, schema, collection);
}

/* Grants. `validUntil` is the permission; `expiresAt` is when the consent record itself goes (90d). */
const GrantSchema = new Schema(
  {
    _id: String,
    siteId: { type: String, required: true },
    epochId: { type: String, required: true, index: true },
    startsAt: { type: Date, required: true },
    validUntil: { type: Date, required: true },
    purposes: [String],
    sources: [String],
    revokedAt: { type: Date, default: null },
    state: { type: String, enum: ["granted", "denied", "withdrawn", "expired"], required: true },
    basis: String,
    policyVersion: String,
    proofRef: String,
    expiresAt: { type: Date, required: true },
  },
  { versionKey: false },
);
GrantSchema.index({ expiresAt: 1 }, ttl);
export const VIGrant = model("VIGrant", "vi_authorizations", GrantSchema);

const WindowSchema = new Schema(
  {
    _id: String, // windowId
    siteId: { type: String, required: true },
    epochId: { type: String, required: true },
    authorizationId: String,
    startsAt: Date,
    endsAt: Date,
    acceptUntil: Date,
    expiresAt: { type: Date, required: true },
    state: { type: String, enum: ["active", "closed", "withdrawn", "expired"], required: true },
  },
  { versionKey: false },
);
// One window per browser epoch (schema.sql UNIQUE(site_id, browser_epoch_id)).
WindowSchema.index({ siteId: 1, epochId: 1 }, { unique: true });
WindowSchema.index({ state: 1 });
WindowSchema.index({ expiresAt: 1 }, ttl);
export const VIWindow = model("VIWindow", "vi_windows", WindowSchema);

const SessionSchema = new Schema(
  {
    _id: String, // `${siteId}|${sessionId}`
    siteId: String,
    sessionId: String,
    epochId: { type: String, index: true },
    expiresAt: { type: Date, required: true },
  },
  { versionKey: false },
);
SessionSchema.index({ expiresAt: 1 }, ttl);
export const VISession = model("VISession", "vi_sessions", SessionSchema);

const EventSchema = new Schema(
  {
    _id: String, // `${siteId}|${sourceId}|${sourceEventId}` — the idempotency key
    eventId: String,
    siteId: String,
    sourceId: String,
    sourceEventId: String,
    epochId: String,
    sessionId: String,
    windowId: String,
    authorizationId: String,
    schemaVersion: String,
    eventName: String,
    properties: Mixed,
    occurredAt: Date,
    clientReportedAt: Date,
    receivedAt: Date,
    processedAt: Date,
    expiresAt: { type: Date, required: true },
    payloadDigest: String,
    evidenceStatus: String,
    permissionSnapshot: Mixed,
  },
  { versionKey: false, minimize: false },
);
EventSchema.index({ siteId: 1, epochId: 1, occurredAt: 1 });
EventSchema.index({ expiresAt: 1 }, ttl);
export const VIEvent = model("VIEvent", "vi_events", EventSchema);

const ProofSchema = new Schema(
  {
    _id: String,
    siteId: String,
    grantId: { type: String, index: true },
    sessionId: String,
    contactId: String,
    eventIds: [String],
    kind: String,
    expiresAt: { type: Date, required: true },
  },
  { versionKey: false },
);
ProofSchema.index({ expiresAt: 1 }, ttl);
export const VIProof = model("VIProof", "vi_proofs", ProofSchema);

const LinkSchema = new Schema(
  {
    _id: String, // linkId (= proofId, as reference.py keys links)
    siteId: String,
    epochId: { type: String, index: true },
    sessionId: String,
    contactId: { type: String, index: true },
    eventIds: [String],
    proofId: String,
    validFrom: Date,
    validUntil: Date,
    revokedAt: { type: Date, default: null },
    reversalReason: { type: String, default: null },
    expiresAt: { type: Date, required: true },
  },
  { versionKey: false },
);
LinkSchema.index({ expiresAt: 1 }, ttl);
export const VILink = model("VILink", "vi_links", LinkSchema);

const InsightSchema = new Schema(
  {
    _id: String, // insightId
    siteId: String,
    entityScope: String,
    entityId: { type: String, index: true },
    record: Mixed, // the full Insight, as the engine produced it
    expiresAt: { type: Date, required: true },
  },
  { versionKey: false, minimize: false },
);
InsightSchema.index({ expiresAt: 1 }, ttl);
export const VIInsight = model("VIInsight", "vi_insights", InsightSchema);

/**
 * Field-level evidence (schema.sql `evidence`). Written by trusted adapters only
 * — today, the RDAP network lookup. Erased with its epoch.
 */
const EvidenceSchema = new Schema(
  {
    siteId: { type: String, required: true },
    epochId: { type: String, required: true, index: true },
    entityScope: { type: String, required: true },
    entityId: { type: String, required: true },
    fieldId: { type: String, required: true },
    value: Mixed,
    sourceId: String,
    sourceKind: String,
    sourceRecordId: String,
    observedAt: Date,
    collectedAt: Date,
    evidenceStatus: {
      type: String,
      enum: ["observed", "self_reported", "verified_within_scope", "inferred", "unknown", "not_applicable"],
      required: true,
    },
    verificationScope: { type: String, default: null },
    confidence: Mixed,
    uncertainty: Mixed,
    authorizationId: String,
    validFrom: Date,
    contradictions: { type: [Mixed], default: [] },
    unknownReason: { type: String, default: null },
    unknowns: [String],
    explanation: String,
    expiresAt: { type: Date, required: true },
  },
  { versionKey: false, minimize: false },
);
EvidenceSchema.index({ expiresAt: 1 }, ttl);
// One network_owner row per session. recordNetworkEvidence runs inside after()
// and two first requests of a session can race; the index settles it in the
// database rather than in a read-then-write check.
EvidenceSchema.index(
  { siteId: 1, entityScope: 1, entityId: 1, fieldId: 1 },
  { unique: true, partialFilterExpression: { fieldId: "network_owner" } },
);
export const VIEvidence = model("VIEvidence", "vi_evidence", EvidenceSchema);

const TombstoneSchema = new Schema(
  {
    _id: String, // auditId
    siteId: String,
    action: String,
    actorRole: String,
    scopeHmac: String,
    policyVersion: String,
    recordedAt: Date,
    expiresAt: { type: Date, required: true },
  },
  { versionKey: false },
);
TombstoneSchema.index({ siteId: 1, scopeHmac: 1, action: 1 });
TombstoneSchema.index({ expiresAt: 1 }, ttl);
export const VITombstone = model("VITombstone", "vi_tombstones", TombstoneSchema);

const ExportSchema = new Schema(
  {
    _id: String,
    siteId: String,
    epochId: { type: String, index: true },
    destination: String,
    remoteRef: String,
    exportedAt: Date,
    expiresAt: { type: Date, required: true },
  },
  { versionKey: false },
);
ExportSchema.index({ expiresAt: 1 }, ttl);
export const VIExport = model("VIExport", "vi_export_ledger", ExportSchema);

const DeletionJobSchema = new Schema(
  {
    _id: String, // jobId
    siteId: String,
    destination: String,
    remoteRef: String,
    scope: Mixed,
    state: { type: String, enum: ["pending", "accepted", "verified", "failed"] },
    attempts: Number,
    requestedAt: Date,
    nextAttemptAt: Date,
    deadlineAt: Date,
    verifiedAt: Date,
    errorCode: String,
    purgeAt: { type: Date, required: true },
  },
  { versionKey: false, minimize: false },
);
DeletionJobSchema.index({ purgeAt: 1 }, ttl);
export const VIDeletionJob = model("VIDeletionJob", "vi_deletion_jobs", DeletionJobSchema);

/** Code-only rejection log (R28). No IP, no payload, no identifier. */
const SecurityLogSchema = new Schema(
  { code: String, sourceId: String, at: { type: Date, required: true } },
  { versionKey: false },
);
SecurityLogSchema.index({ at: 1 }, { expireAfterSeconds: 7 * 24 * 3600 });
export const VISecurityLog = model("VISecurityLog", "vi_security_log", SecurityLogSchema);

/** Network-owner cache. Keyed by an HMAC of the network prefix; holds company data, not personal data. */
const OrgCacheSchema = new Schema(
  {
    _id: String,
    owner: String,
    kind: String,
    registry: String,
    handle: String,
    networkName: String,
    country: String,
    matchedRule: String,
    fetchedAt: Date,
    expiresAt: { type: Date, required: true },
  },
  { versionKey: false },
);
OrgCacheSchema.index({ expiresAt: 1 }, ttl);
export const VIOrgCache = model("VIOrgCache", "vi_org_cache", OrgCacheSchema);

/** Daily consent-prompt counters. No identifier of any kind. */
const ConsentStatSchema = new Schema(
  {
    _id: String, // YYYY-MM-DD (UTC)
    shown: { type: Number, default: 0 },
    declined: { type: Number, default: 0 },
    granted: { type: Number, default: 0 },
    grantedLinking: { type: Number, default: 0 },
    grantedOrganization: { type: Number, default: 0 },
    withdrawn: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true },
  },
  { versionKey: false },
);
ConsentStatSchema.index({ expiresAt: 1 }, ttl);
export const VIConsentStat = model("VIConsentStat", "vi_consent_stats", ConsentStatSchema);
