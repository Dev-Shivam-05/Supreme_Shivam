/**
 * The 32 invariants of visitor_intelligence_reference/test_reference.py, ported
 * one-for-one (same names) and run against the PRODUCTION engine with the
 * reference's own synthetic catalog — then the production catalog and rules.
 *
 *   npm run test:vi
 *
 * Adaptations, each forced by the language rather than chosen:
 *   - test_no_naive_time: a JS Date has no "naive" form, so the test asserts an
 *     invalid Date and an offset-less provider timestamp are both rejected.
 *   - test_explainable_rule / abstain: infer() returns a list (four rules);
 *     "None" is an empty list.
 *   - test_deletion_job_retries_until_verified: retries back off (README), so
 *     the second run is an hour later; the finished state is schema.sql's
 *     `verified` rather than the Python dict's `completed`.
 */
import { test, describe, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";
import { Engine, Rejected, backoffMs, type Context, type EngineConfig, type Proof } from "./engine.ts";
import { MemoryStore } from "./memory-store.ts";
import { developmentInterestRule } from "./rules.ts";
import { buildProdConfig } from "./config.ts";
import { EVIDENCE_STATUS, GRANT_VALIDITY_MS } from "./policy.ts";

const REF_DIR = fileURLToPath(new URL("../../../visitor_intelligence_reference/", import.meta.url));

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const T = new Date(Date.UTC(2026, 9, 23, 9));
const at = (ms: number) => new Date(T.getTime() + ms);

const scopeHash = (s: string, e: string) => createHash("sha256").update(`${s}|${e}`).digest("hex");

/** reference.py CATALOG / PROPERTIES / ALLOWED_VALUES, verbatim. */
const REFERENCE_CONFIG: EngineConfig = {
  sources: {
    web: { kind: "browser", scopes: ["journey"], enabled: true, version: "1" },
    booking: { kind: "provider", scopes: ["journey"], enabled: true, version: "1" },
  },
  properties: {
    page_view: ["content_id"],
    cta_click: ["cta_id"],
    download_requested: ["asset_id"],
    search_submitted: ["topic"],
    booking_confirmed: ["booking_state"],
  },
  allowedValues: {
    content_id: ["case_store", "case_booking", "about"],
    cta_id: ["project_brief", "hire", "collaborate"],
    asset_id: ["cv", "service_overview"],
    topic: ["development", "hiring", "collaboration", "other"],
    booking_state: ["confirmed"],
  },
  contents: { case_store: { type: "case_study" }, case_booking: { type: "case_study" }, about: { type: "about" } },
  rules: [developmentInterestRule(["project_brief"])],
  scopeHash,
};

/** A stable synthetic UUID per n, standing in for uuid5(NAMESPACE_URL, "synthetic:n"). */
function eid(n: number) {
  const h = createHash("sha1").update(`synthetic:${n}`).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-a${h.slice(17, 20)}-${h.slice(20, 32)}`;
}

function event(n: number, name = "page_view", props?: Record<string, string>, occurred?: Date) {
  const r: Record<string, unknown> = {
    schema_version: "1.0",
    event_id: eid(n),
    event_name: name,
    properties: props ?? { content_id: "case_store" },
  };
  if (occurred) r.occurred_at = occurred.toISOString();
  return r;
}

async function rejects(p: Promise<unknown>, code?: string) {
  await assert.rejects(p, (err: unknown) => {
    assert.ok(err instanceof Rejected, `expected Rejected, got ${String(err)}`);
    if (code) assert.equal(err.code, code);
    return true;
  });
}

let store: MemoryStore;
let e: Engine;
const c: Context = { siteId: "site_demo", sourceId: "web", epochId: "epoch_A", sessionId: "session_A", grantId: "grant_A" };

function setUp(config: EngineConfig = REFERENCE_CONFIG) {
  store = new MemoryStore();
  e = new Engine(store, config);
  store.grants.set("grant_A", {
    grantId: "grant_A",
    siteId: "site_demo",
    epochId: "epoch_A",
    startsAt: T,
    expiresAt: at(22 * DAY),
    purposes: ["journey", "linking"],
    sources: ["web", "booking"],
    revokedAt: null,
    state: "granted",
    basis: "consent",
    policyVersion: "test",
    proofRef: "test",
  });
}

const start = () => e.ingest(event(1), c, T);

async function proof(kind = "explicit_contact_link", session = "session_A", ids?: string[]): Promise<Proof> {
  const p: Proof = {
    proofId: "proof_A",
    siteId: "site_demo",
    grantId: "grant_A",
    sessionId: session,
    contactId: "contact_A",
    eventIds: ids ?? [eid(1)],
    kind,
    expiresAt: at(DAY),
  };
  // Stored directly, as the Python test does, so an invalid kind reaches the link check.
  await store.saveProof(p);
  return p;
}

describe("CoreTests (reference parity)", () => {
  beforeEach(() => setUp());

  test("test_start_and_fixed_window", async () => {
    await start();
    const w = await store.getWindow("site_demo", "epoch_A");
    assert.equal(w!.endsAt.getTime(), at(15 * DAY).getTime());
    assert.equal(w!.expiresAt.getTime(), at(22 * DAY).getTime());
  });

  test("test_missing_permission", async () => {
    await rejects(e.ingest(event(1), { ...c, grantId: "missing" }, T));
  });

  test("test_denied_purpose", async () => {
    store.grants.get("grant_A")!.purposes = [];
    await rejects(start());
  });

  test("test_unknown_source", async () => {
    await rejects(e.ingest(event(1), { ...c, sourceId: "unknown" }, T));
  });

  test("test_tenant_boundary", async () => {
    await rejects(e.ingest(event(1), { ...c, siteId: "other" }, T));
  });

  test("test_unknown_schema", async () => {
    const r = event(1);
    r.schema_version = "2";
    await rejects(e.ingest(r, c, T));
  });

  test("test_no_raw_email_in_event", async () => {
    const r = event(1);
    (r.properties as Record<string, string>).email = "synthetic@example.invalid";
    await rejects(e.ingest(r, c, T));
  });

  test("test_no_gender_property", async () => {
    const r = event(1);
    (r.properties as Record<string, string>).gender = "not_collected";
    await rejects(e.ingest(r, c, T));
  });

  test("test_content_allowlist", async () => {
    await rejects(e.ingest(event(1, "page_view", { content_id: "/secret?token=x" }), c, T));
  });

  test("test_duplicate_once", async () => {
    await start();
    assert.equal(await e.ingest(event(1), c, at(1000)), "duplicate");
    assert.equal(store.events.size, 1);
  });

  test("test_duplicate_conflict", async () => {
    await start();
    await rejects(e.ingest(event(1, "page_view", { content_id: "about" }), c, T), "idempotency_conflict");
  });

  test("test_day_15_excluded", async () => {
    await start();
    await rejects(e.ingest(event(2), c, at(15 * DAY)));
  });

  test("test_browser_cannot_backdate", async () => {
    await start();
    await rejects(e.ingest(event(2, "page_view", undefined, at(DAY)), c, at(15 * DAY)));
  });

  test("test_late_provider_allowed", async () => {
    await start();
    const r = event(2, "booking_confirmed", { booking_state: "confirmed" }, at(14 * DAY));
    assert.equal(await e.ingest(r, { ...c, sourceId: "booking" }, at(16 * DAY)), "accepted");
  });

  test("test_provider_too_late", async () => {
    await start();
    const r = event(2, "booking_confirmed", { booking_state: "confirmed" }, at(13 * DAY));
    await rejects(e.ingest(r, { ...c, sourceId: "booking" }, at(16 * DAY)));
  });

  test("test_provider_future_time", async () => {
    await start();
    const r = event(2, "booking_confirmed", { booking_state: "confirmed" }, at(2 * DAY));
    await rejects(e.ingest(r, { ...c, sourceId: "booking" }, at(DAY)));
  });

  test("test_provider_cannot_start_window", async () => {
    const r = event(2, "booking_confirmed", { booking_state: "confirmed" }, T);
    await rejects(e.ingest(r, { ...c, sourceId: "booking" }, T), "first_event_must_be_eligible_page_view");
  });

  test("test_no_naive_time", async () => {
    await rejects(e.ingest(event(1), c, new Date(Number.NaN)), "timezone_required");
    await start();
    const naive = event(2, "booking_confirmed", { booking_state: "confirmed" });
    naive.occurred_at = "2026-10-24T09:00:00"; // no offset
    await rejects(e.ingest(naive, { ...c, sourceId: "booking" }, at(DAY)), "provider_time_invalid");
  });

  test("test_abstain_one_page", async () => {
    await start();
    assert.deepEqual(await e.infer("site_demo", "epoch_A", T), []);
  });

  test("test_explainable_rule", async () => {
    await start();
    await e.ingest(event(2, "page_view", { content_id: "case_booking" }), c, at(60_000));
    await e.ingest(event(3, "cta_click", { cta_id: "project_brief" }), c, at(120_000));
    const [r] = await e.infer("site_demo", "epoch_A", at(180_000));
    assert.equal(r.entityScope, "browser_epoch");
    assert.equal(r.confidence.probability, null);
    assert.equal(r.evidenceIds.length, 3);
  });

  test("test_repeated_same_case_not_two_cases", async () => {
    await start();
    await e.ingest(event(2), c, at(60_000));
    await e.ingest(event(3, "cta_click", { cta_id: "project_brief" }), c, at(120_000));
    assert.deepEqual(await e.infer("site_demo", "epoch_A", at(180_000)), []);
  });

  test("test_explicit_scoped_link", async () => {
    await start();
    await proof();
    const link = await e.linkSessionToContact(c, "proof_A", T);
    assert.deepEqual(link.eventIds, [eid(1)]);
  });

  test("test_network_not_person_proof", async () => {
    await start();
    await proof("same_ip");
    await rejects(e.linkSessionToContact(c, "proof_A", T), "explicit_scoped_proof_required");
  });

  test("test_wrong_session_proof", async () => {
    await start();
    await proof("explicit_contact_link", "different");
    await rejects(e.linkSessionToContact(c, "proof_A", T));
  });

  test("test_out_of_scope_event_proof", async () => {
    await start();
    await proof("explicit_contact_link", "session_A", [eid(99)]);
    await rejects(e.linkSessionToContact(c, "proof_A", T), "proof_event_scope_mismatch");
  });

  test("test_reverse_link", async () => {
    await start();
    await proof();
    await e.linkSessionToContact(c, "proof_A", T);
    await e.reverseLink("proof_A", at(HOUR));
    assert.notEqual(store.links.get("proof_A")!.revokedAt, null);
  });

  test("test_withdrawal_purge_and_replay_block", async () => {
    await start();
    await proof();
    await e.linkSessionToContact(c, "proof_A", T);
    await e.withdraw(c, at(3 * DAY));
    assert.equal(store.events.size, 0);
    assert.equal(store.links.size, 0);
    assert.equal(store.proofs.size, 0);
    assert.deepEqual(await e.infer("site_demo", "epoch_A", at(4 * DAY)), []);
    await rejects(e.ingest(event(2), c, at(4 * DAY)));
  });

  test("test_deletion_job_retries_until_verified", async () => {
    await start();
    store.exports.push({
      siteId: "site_demo",
      exportId: "x1",
      epochId: "epoch_A",
      destination: "mock",
      remoteRef: "remote_A",
      exportedAt: T,
      expiresAt: at(22 * DAY),
    });
    await e.withdraw(c, at(3 * DAY));
    await e.runDeletionJobs(() => false, at(3 * DAY));
    let [job] = await store.listDeletionJobs();
    assert.equal(job.state, "pending");
    await e.runDeletionJobs(() => true, at(3 * DAY + HOUR));
    [job] = await store.listDeletionJobs();
    assert.equal(job.state, "verified");
    assert.equal(job.attempts, 2);
  });

  test("test_retention_expiry", async () => {
    await start();
    await e.expire(at(22 * DAY));
    assert.equal(store.events.size, 0);
    assert.equal((await store.getWindow("site_demo", "epoch_A"))!.state, "expired");
  });

  test("test_session_cannot_change_epoch", async () => {
    await store.setSessionEpoch("site_demo", "session_A", "epoch_B");
    await rejects(start(), "session_epoch_conflict");
  });
});

describe("SchemaTests (reference parity)", () => {
  test("test_schema_creation_and_integrity", () => {
    const db = new DatabaseSync(":memory:");
    db.exec(readFileSync(`${REF_DIR}schema.sql`, "utf8"));
    assert.equal((db.prepare("PRAGMA integrity_check").get() as Record<string, string>).integrity_check, "ok");
    assert.deepEqual(db.prepare("PRAGMA foreign_key_check").all(), []);
    assert.equal((db.prepare("PRAGMA foreign_keys").get() as Record<string, number>).foreign_keys, 1);
    db.close();
  });

  test("test_example_json_parses", () => {
    const data = JSON.parse(readFileSync(`${REF_DIR}examples.json`, "utf8"));
    assert.equal(data.synthetic, true);
    assert.equal(data.event.schema_version, "1.0");
  });
});

/* ------------------------------------------------ beyond the reference */

describe("Additional invariants", () => {
  beforeEach(() => setUp());

  test("evidence_labels_closed_set", () => {
    assert.deepEqual([...EVIDENCE_STATUS], [
      "observed",
      "self_reported",
      "verified_within_scope",
      "inferred",
      "unknown",
      "not_applicable",
    ]);
  });

  test("insight_shape_matches_examples_json", async () => {
    const ex = JSON.parse(readFileSync(`${REF_DIR}examples.json`, "utf8")).insight;
    await start();
    await e.ingest(event(2, "page_view", { content_id: "case_booking" }), c, at(60_000));
    await e.ingest(event(3, "cta_click", { cta_id: "project_brief" }), c, at(120_000));
    const [r] = await e.infer("site_demo", "epoch_A", at(180_000));
    assert.equal(r.ruleVersion, ex.rule_version);
    assert.equal(r.status, ex.status);
    assert.equal(r.hypothesis, ex.hypothesis);
    assert.equal(r.counterevidenceState, ex.counterevidence_state);
    assert.deepEqual(r.alternatives, ex.alternatives);
    assert.equal(r.confidence.probability, ex.confidence.probability);
  });

  test("insight_never_extends_expiry", async () => {
    await start();
    await e.ingest(event(2, "page_view", { content_id: "case_booking" }), c, at(60_000));
    await e.ingest(event(3, "cta_click", { cta_id: "project_brief" }), c, at(120_000));
    const [r] = await e.infer("site_demo", "epoch_A", at(180_000));
    const w = await store.getWindow("site_demo", "epoch_A");
    assert.ok(r.expiresAt.getTime() <= w!.expiresAt.getTime());
  });

  test("window_bounds_ordered_and_capped_by_grant", async () => {
    // A grant that ends before t0 + 22d must cap the window (README "minimum of all expiry limits").
    store.grants.get("grant_A")!.expiresAt = at(10 * DAY);
    await start();
    const w = (await store.getWindow("site_demo", "epoch_A"))!;
    assert.ok(w.startsAt < w.endsAt && w.endsAt <= w.acceptUntil && w.acceptUntil <= w.expiresAt);
    assert.equal(w.expiresAt.getTime(), at(10 * DAY).getTime());
  });

  test("link_reversal_does_not_end_the_journey", async () => {
    await start();
    await proof();
    await e.linkSessionToContact(c, "proof_A", T);
    await e.reverseLink("proof_A", at(HOUR));
    assert.equal(await e.ingest(event(2, "page_view", { content_id: "about" }), c, at(2 * HOUR)), "accepted");
  });

  test("sweep_reconciles_tombstoned_epoch", async () => {
    await start();
    await e.withdraw(c, at(DAY));
    // Simulate a restored backup putting the event back.
    await store.insertEvent({ ...(await (async () => {
      const s2 = new MemoryStore();
      const e2 = new Engine(s2, REFERENCE_CONFIG);
      s2.grants.set("grant_A", { ...store.grants.get("grant_A")!, revokedAt: null, state: "granted" });
      await e2.ingest(event(1), c, T);
      return [...s2.events.values()][0];
    })()) });
    assert.equal(store.events.size, 1);
    assert.equal(await e.reconcile("site_demo"), 1);
    assert.equal(store.events.size, 0);
  });

  test("admin_erase_revokes_and_blocks", async () => {
    await start();
    await e.adminErase("site_demo", "epoch_A", at(DAY));
    assert.equal(store.events.size, 0);
    assert.notEqual(store.grants.get("grant_A")!.revokedAt, null);
    await rejects(e.ingest(event(2), c, at(DAY + 1)), "permission_denied");
    assert.equal(store.tombstones.at(-1)!.actorRole, "admin");
  });

  test("tombstone_never_stores_the_epoch_id", async () => {
    await start();
    await e.withdraw(c, at(DAY));
    for (const t of store.tombstones) assert.ok(!JSON.stringify(t).includes("epoch_A"));
  });

  test("create_grant_requires_journey", async () => {
    await rejects(
      e.createGrant({ siteId: "site_demo", purposes: ["linking"], sources: ["web"], now: T, proofRef: "x" }),
      "journey_purpose_required",
    );
    const g = await e.createGrant({ siteId: "site_demo", purposes: ["journey"], sources: ["web"], now: T, proofRef: "x" });
    assert.equal(g.expiresAt.getTime() - g.startsAt.getTime(), GRANT_VALIDITY_MS);
    assert.notEqual(g.epochId, g.grantId);
  });

  test("backoff_is_bounded", () => {
    assert.equal(backoffMs(1), 60_000);
    assert.equal(backoffMs(2), 120_000);
    assert.equal(backoffMs(40), 24 * HOUR);
  });

  test("deletion_job_fails_after_deadline", async () => {
    await start();
    store.exports.push({ siteId: "site_demo", exportId: "x", epochId: "epoch_A", destination: "mock", remoteRef: "r", exportedAt: T, expiresAt: at(DAY) });
    await e.withdraw(c, T);
    await e.runDeletionJobs(() => "accepted", at(31 * DAY));
    const [job] = await store.listDeletionJobs();
    assert.equal(job.state, "failed");
  });

  test("accepted_is_not_verified", async () => {
    await start();
    store.exports.push({ siteId: "site_demo", exportId: "x", epochId: "epoch_A", destination: "mock", remoteRef: "r", exportedAt: T, expiresAt: at(DAY) });
    await e.withdraw(c, T);
    await e.runDeletionJobs(() => "accepted", at(HOUR));
    const [job] = await store.listDeletionJobs();
    assert.equal(job.state, "accepted");
    assert.equal(job.verifiedAt, null);
  });
});

/* ------------------------------------------------ production catalog */

/** Exactly the configuration production runs (config.ts). */
const PROD_CONFIG: EngineConfig = buildProdConfig(scopeHash);

const pv = (n: number, content_id: string, entry = "internal") => event(n, "page_view", { content_id, entry });
const cta = (n: number, cta_id: string) => event(n, "cta_click", { cta_id });

describe("Production catalog", () => {
  beforeEach(() => {
    setUp(PROD_CONFIG);
    const g = store.grants.get("grant_A")!;
    g.sources = ["web"];
  });

  test("page_view_requires_entry_category", async () => {
    await rejects(e.ingest(event(1, "page_view", { content_id: "home" }), c, T), "properties_invalid");
    assert.equal(await e.ingest(pv(1, "home", "search"), c, T), "accepted");
  });

  test("unknown_entry_category_rejected", async () => {
    await rejects(e.ingest(pv(1, "home", "https://google.com"), c, T), "property_value_not_allowlisted");
  });

  test("gender_and_email_rejected", async () => {
    for (const k of ["gender", "email"]) {
      const r = pv(1, "home");
      (r.properties as Record<string, string>)[k] = "x";
      await rejects(e.ingest(r, c, T), "properties_invalid");
    }
  });

  test("download_rejected_no_assets_exist", async () => {
    await e.ingest(pv(1, "home"), c, T);
    await rejects(e.ingest(event(2, "download_requested", { asset_id: "cv" }), c, at(1000)), "property_value_not_allowlisted");
  });

  test("booking_from_browser_rejected", async () => {
    await e.ingest(pv(1, "home"), c, T);
    await rejects(e.ingest(event(2, "booking_confirmed", { booking_state: "confirmed" }), c, at(1000)), "event_source_mismatch");
  });

  test("oversized_payload_rejected", async () => {
    await e.ingest(pv(1, "home"), c, T);
    const r = pv(2, "home");
    r.occurred_at = "x".repeat(9000);
    await rejects(e.ingest(r, c, at(1000)), "payload_too_large");
  });

  test("rule_development_interest", async () => {
    await e.ingest(pv(1, "case_ai_pulse", "search"), c, T);
    await e.ingest(pv(2, "case_cgpe_connect"), c, at(1000));
    await e.ingest(cta(3, "start_project"), c, at(2000));
    const out = await e.infer("site_demo", "epoch_A", at(3000));
    assert.ok(out.some((i) => i.ruleVersion === "development_interest_v0"));
  });

  test("rule_service_evaluation", async () => {
    await e.ingest(pv(1, "service_web", "search"), c, T);
    await e.ingest(cta(2, "phone"), c, at(1000));
    const out = await e.infer("site_demo", "epoch_A", at(2000));
    const r = out.find((i) => i.ruleVersion === "service_evaluation_v0");
    assert.ok(r);
    assert.match(r.hypothesis, /Web development/);
  });

  test("rule_candidate_evaluation", async () => {
    await e.ingest(pv(1, "about", "social"), c, T);
    await e.ingest(pv(2, "stack"), c, at(1000));
    await e.ingest(cta(3, "social_linkedin"), c, at(2000));
    const out = await e.infer("site_demo", "epoch_A", at(3000));
    assert.ok(out.some((i) => i.ruleVersion === "candidate_evaluation_v0"));
  });

  test("rule_reader_interest", async () => {
    await e.ingest(pv(1, "article_ai_wrote_my_code", "ai_assistant"), c, T);
    await e.ingest(pv(2, "article_spec_is_deliverable"), c, at(1000));
    const out = await e.infer("site_demo", "epoch_A", at(2000));
    assert.ok(out.some((i) => i.ruleVersion === "reader_interest_v0"));
  });

  test("rules_abstain_on_a_single_page", async () => {
    await e.ingest(pv(1, "home", "direct"), c, T);
    assert.deepEqual(await e.infer("site_demo", "epoch_A", at(1000)), []);
  });

  test("every_insight_has_null_confidence_and_no_outreach", async () => {
    await e.ingest(pv(1, "case_ai_pulse"), c, T);
    await e.ingest(pv(2, "case_cgpe_connect"), c, at(1000));
    await e.ingest(pv(3, "service_ai"), c, at(1500));
    await e.ingest(cta(4, "start_project"), c, at(2000));
    for (const i of await e.infer("site_demo", "epoch_A", at(3000))) {
      assert.equal(i.confidence.probability, null);
      assert.match(i.permittedNextAction, /do not initiate outreach/);
      assert.ok(i.alternatives.length > 0 && i.unknowns.length > 0);
    }
  });
});
