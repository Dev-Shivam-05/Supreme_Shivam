-- SQLite 3.46 reference DDL. Proposed production mapping: PostgreSQL timestamptz,
-- uuid and jsonb; use tenant-scoped row policies and transactional authorization.
-- The local Python core is in memory and does not implement this storage adapter.
PRAGMA foreign_keys = ON;
CREATE TABLE sources (
  site_id TEXT NOT NULL, source_id TEXT NOT NULL,
  kind TEXT NOT NULL CHECK(kind IN ('browser','origin','cdn','provider','manual','registry')),
  scopes_json TEXT NOT NULL CHECK(json_valid(scopes_json)),
  enabled INTEGER NOT NULL CHECK(enabled IN (0,1)), version TEXT NOT NULL,
  PRIMARY KEY(site_id, source_id)
);
CREATE TABLE entities (
  site_id TEXT NOT NULL, entity_id TEXT NOT NULL,
  kind TEXT NOT NULL CHECK(kind IN ('request','session','browser_epoch','account','contact','organization','aggregate')),
  created_at TEXT NOT NULL, expires_at TEXT,
  PRIMARY KEY(site_id, entity_id)
);
CREATE TABLE authorizations (
  site_id TEXT NOT NULL, authorization_id TEXT NOT NULL, entity_id TEXT NOT NULL,
  policy_version TEXT NOT NULL, basis TEXT NOT NULL,
  purposes_json TEXT NOT NULL CHECK(json_valid(purposes_json)),
  source_scope_json TEXT NOT NULL CHECK(json_valid(source_scope_json)),
  state TEXT NOT NULL CHECK(state IN ('granted','denied','withdrawn','expired')),
  valid_from TEXT NOT NULL, valid_until TEXT NOT NULL, revoked_at TEXT,
  proof_ref TEXT NOT NULL, expires_at TEXT NOT NULL,
  PRIMARY KEY(site_id, authorization_id),
  FOREIGN KEY(site_id, entity_id) REFERENCES entities(site_id, entity_id)
);
CREATE TABLE windows (
  site_id TEXT NOT NULL, window_id TEXT NOT NULL, browser_epoch_id TEXT NOT NULL,
  authorization_id TEXT NOT NULL, starts_at TEXT NOT NULL, ends_at TEXT NOT NULL,
  accept_until TEXT NOT NULL, expires_at TEXT NOT NULL,
  state TEXT NOT NULL CHECK(state IN ('active','closed','withdrawn','expired')),
  PRIMARY KEY(site_id, window_id), UNIQUE(site_id, browser_epoch_id),
  CHECK(starts_at < ends_at AND ends_at <= accept_until AND accept_until <= expires_at),
  FOREIGN KEY(site_id, browser_epoch_id) REFERENCES entities(site_id, entity_id),
  FOREIGN KEY(site_id, authorization_id) REFERENCES authorizations(site_id, authorization_id)
);
CREATE TABLE events (
  site_id TEXT NOT NULL, event_id TEXT NOT NULL, schema_version TEXT NOT NULL,
  source_id TEXT NOT NULL, source_event_id TEXT NOT NULL, payload_digest TEXT NOT NULL,
  event_name TEXT NOT NULL, subject_id TEXT NOT NULL, session_id TEXT,
  window_id TEXT, authorization_id TEXT NOT NULL,
  occurred_at TEXT NOT NULL, client_reported_at TEXT, received_at TEXT NOT NULL,
  processed_at TEXT NOT NULL, expires_at TEXT NOT NULL,
  permission_snapshot_json TEXT NOT NULL CHECK(json_valid(permission_snapshot_json)),
  properties_json TEXT NOT NULL CHECK(json_valid(properties_json)),
  PRIMARY KEY(site_id, event_id), UNIQUE(site_id, source_id, source_event_id),
  FOREIGN KEY(site_id, source_id) REFERENCES sources(site_id, source_id),
  FOREIGN KEY(site_id, subject_id) REFERENCES entities(site_id, entity_id),
  FOREIGN KEY(site_id, session_id) REFERENCES entities(site_id, entity_id),
  FOREIGN KEY(site_id, window_id) REFERENCES windows(site_id, window_id),
  FOREIGN KEY(site_id, authorization_id) REFERENCES authorizations(site_id, authorization_id)
);
CREATE INDEX events_scope_time ON events(site_id, subject_id, occurred_at);
CREATE INDEX events_expiry ON events(expires_at);
CREATE TABLE evidence (
  site_id TEXT NOT NULL, evidence_id TEXT NOT NULL, entity_id TEXT NOT NULL, field_id TEXT NOT NULL,
  value_json TEXT CHECK(value_json IS NULL OR json_valid(value_json)),
  encrypted_value BLOB, source_id TEXT NOT NULL, source_record_id TEXT,
  source_kind TEXT NOT NULL, observed_at TEXT, collected_at TEXT NOT NULL,
  evidence_status TEXT NOT NULL CHECK(evidence_status IN ('observed','self_reported','verified_within_scope','inferred','unknown','not_applicable')),
  verification_scope TEXT, uncertainty_json TEXT NOT NULL CHECK(json_valid(uncertainty_json)),
  authorization_id TEXT NOT NULL, valid_from TEXT NOT NULL, expires_at TEXT NOT NULL,
  contradictions_json TEXT NOT NULL CHECK(json_valid(contradictions_json)),
  unknown_reason TEXT, PRIMARY KEY(site_id, evidence_id),
  CHECK(value_json IS NULL OR encrypted_value IS NULL),
  FOREIGN KEY(site_id, entity_id) REFERENCES entities(site_id, entity_id),
  FOREIGN KEY(site_id, source_id) REFERENCES sources(site_id, source_id),
  FOREIGN KEY(site_id, authorization_id) REFERENCES authorizations(site_id, authorization_id)
);
CREATE TABLE links (
  site_id TEXT NOT NULL, link_id TEXT NOT NULL, from_entity_id TEXT NOT NULL,
  to_entity_id TEXT NOT NULL, relationship TEXT NOT NULL,
  scope_json TEXT NOT NULL CHECK(json_valid(scope_json)), proof_evidence_id TEXT NOT NULL,
  authorization_id TEXT NOT NULL, valid_from TEXT NOT NULL, valid_until TEXT NOT NULL,
  revoked_at TEXT, reversal_reason TEXT, PRIMARY KEY(site_id, link_id),
  FOREIGN KEY(site_id, from_entity_id) REFERENCES entities(site_id, entity_id),
  FOREIGN KEY(site_id, to_entity_id) REFERENCES entities(site_id, entity_id),
  FOREIGN KEY(site_id, proof_evidence_id) REFERENCES evidence(site_id, evidence_id),
  FOREIGN KEY(site_id, authorization_id) REFERENCES authorizations(site_id, authorization_id)
);
CREATE TABLE external_refs (
  site_id TEXT NOT NULL, source_id TEXT NOT NULL, provider_tenant_id TEXT NOT NULL,
  remote_id TEXT NOT NULL, entity_id TEXT NOT NULL, authorization_id TEXT NOT NULL,
  valid_from TEXT NOT NULL, valid_until TEXT NOT NULL,
  PRIMARY KEY(site_id, source_id, provider_tenant_id, remote_id),
  FOREIGN KEY(site_id, source_id) REFERENCES sources(site_id, source_id),
  FOREIGN KEY(site_id, entity_id) REFERENCES entities(site_id, entity_id),
  FOREIGN KEY(site_id, authorization_id) REFERENCES authorizations(site_id, authorization_id)
);
CREATE TABLE insights (
  site_id TEXT NOT NULL, insight_id TEXT NOT NULL, entity_id TEXT NOT NULL,
  schema_version TEXT NOT NULL, rule_version TEXT NOT NULL, authorization_id TEXT NOT NULL,
  result_json TEXT NOT NULL CHECK(json_valid(result_json)),
  support_json TEXT NOT NULL CHECK(json_valid(support_json)),
  counterevidence_json TEXT NOT NULL CHECK(json_valid(counterevidence_json)),
  computed_at TEXT NOT NULL, expires_at TEXT NOT NULL,
  PRIMARY KEY(site_id, insight_id),
  FOREIGN KEY(site_id, entity_id) REFERENCES entities(site_id, entity_id),
  FOREIGN KEY(site_id, authorization_id) REFERENCES authorizations(site_id, authorization_id)
);
CREATE TABLE export_ledger (
  site_id TEXT NOT NULL, export_id TEXT NOT NULL, entity_id TEXT NOT NULL,
  local_record_kind TEXT NOT NULL, local_record_id TEXT NOT NULL,
  destination TEXT NOT NULL, encrypted_remote_ref BLOB NOT NULL,
  authorization_id TEXT NOT NULL, exported_at TEXT NOT NULL, expires_at TEXT NOT NULL,
  PRIMARY KEY(site_id, export_id),
  FOREIGN KEY(site_id, entity_id) REFERENCES entities(site_id, entity_id)
);
CREATE TABLE deletion_jobs (
  site_id TEXT NOT NULL, job_id TEXT NOT NULL, request_id TEXT NOT NULL,
  scope_json TEXT NOT NULL CHECK(json_valid(scope_json)), destination TEXT NOT NULL,
  encrypted_remote_ref BLOB, state TEXT NOT NULL CHECK(state IN ('pending','accepted','verified','failed')),
  attempts INTEGER NOT NULL DEFAULT 0, requested_at TEXT NOT NULL, next_attempt_at TEXT,
  deadline_at TEXT NOT NULL, verified_at TEXT, verification_ref TEXT, error_code TEXT,
  PRIMARY KEY(site_id, job_id)
);
CREATE TABLE audit_tombstones (
  site_id TEXT NOT NULL, audit_id TEXT NOT NULL, action TEXT NOT NULL,
  actor_role TEXT NOT NULL, scope_hmac TEXT, policy_version TEXT NOT NULL,
  recorded_at TEXT NOT NULL, expires_at TEXT NOT NULL,
  PRIMARY KEY(site_id, audit_id)
);
-- Never implement deletion as an unrestricted graph cascade: shared organizations,
-- other sessions on a shared device, and independently authorized CRM records are
-- not automatically in scope. Proof/export-ledger traversal is purpose-scoped.
