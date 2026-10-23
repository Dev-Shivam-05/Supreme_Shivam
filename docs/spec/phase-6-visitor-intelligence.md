# Phase 6 — Visitor intelligence

**Status:** approved 2026-10-23. Shivam supplied `visitor_intelligence_reference/` and said: implement
everything, decide open questions yourself, do not stop to ask. Every decision below that the
reference left open is marked **[decided]** with the reason.
**Branch:** `feat/phase-6-visitor-intelligence` (from `feat/phase-5a-admin-deck`, unmerged).
**Contract:** this file + `visitor_intelligence_reference/` (README, reference.py, schema.sql,
examples.json, test_reference.py, source-register.json). Where the two disagree, the reference wins
unless a row here says **deviation**.

---

## 1. What the reference package is

Eight files (the `.zip` is byte-identical to them — checked by SHA-256):

| File | What it holds |
|---|---|
| `README.md` | The policy: entity semantics, evidence labels, authorization, observation window, retention, storage, collection restrictions, provider holds. |
| `reference.py` | An in-memory Python engine: purpose-gated ingest, fixed 15-day window, idempotency, allowlisted properties, scoped contact links, one unvalidated inference rule, reversal, withdrawal, expiry, deletion-job retries. |
| `test_reference.py` | 32 synthetic invariants (30 engine, 2 schema). Re-run here on Python 3.11.9: **32/32 pass**. |
| `schema.sql` | 12-table SQLite reference DDL with tenant-composite keys and temporal checks. |
| `examples.json` | Synthetic event, insight and field-provenance records — the shapes to store. |
| `source-register.json` | 44 primary sources consulted (MDN, ICO, EC GDPR, vendors). |
| `test-results.txt`, `test-status.json` | The executed run: 32 synthetic, 0 live, 0 real-visitor, not deployed. |

The package says plainly what it is not: not production, not a legal assessment, no vendor tested,
no accuracy number. "Passing tests establish only the listed synthetic invariants."

## 2. Shivam's original goals, against what the reference allows

| Goal | Verdict | What is built |
|---|---|---|
| Is the visitor male or female? | **Not built — forbidden by the reference.** README: "Reject raw emails, gender fields…", "No … sensitive-trait scoring". `test_no_gender_property` asserts a gender property is rejected. There is also no honest signal for it in web traffic. | The ingest rejects any `gender` key; the contact form has no gender field; the admin shows "Gender — not collected (policy)" as `not_applicable`. |
| Person, or organisation? | Allowed **as separate dimensions with labels** — "A company-network match is not employment or representation"; "Organization candidates remain candidates." | Self-reported: optional "Enquiring as" + "Organisation" on the contact form (`self_reported`). Inferred: the network owner of the visitor's connection from public RDAP registry data, consent-gated, shown as `possible_network_association` (`inferred`, confidence `null`). |
| How did they arrive? | Allowed with **controlled codes, not URLs**. | Each journey page view carries an `entry` category (`search`, `ai_assistant`, `social`, …) computed in the browser; the URL never leaves it. The cookieless aggregate tier keeps referrer **hosts**. |
| Why did they come? | Allowed as **explainable, abstaining, unvalidated hypotheses** with alternatives and unknowns. | Four versioned rules (§6). Plus the self-reported enquiry topic. |

## 3. Requirement matrix

Every requirement found in the reference, where it is implemented, and how it is checked.
`T:` = automated test in `src/lib/vi/engine.test.ts` (ported reference test names kept).

### Semantics (README "Core semantics")

| ID | Requirement | Implementation | Check |
|---|---|---|---|
| R01 | request ≠ session ≠ browser epoch ≠ person; account ≠ civil identity; network match ≠ employment | `entityScope` on every record (`request`/`session`/`browser_epoch`/`contact`); admin copy never says "person" for an epoch | review |
| R02 | Automation, identification, affiliation, authority, business intent are independent dimensions | Admin journey view renders one row per dimension, each with its own label | screenshot |
| R03 | Exactly six evidence labels; source kind separate; confidence separate and `null` when uncalibrated; keep conflicts and unknown reasons | `EVIDENCE_STATUS` in `policy.ts`; `sourceKind`, `confidence`, `contradictions`, `unknownReason` fields on `vi_evidence` | T: `evidence_labels_closed_set` |

### Authorization

| ID | Requirement | Implementation | Check |
|---|---|---|---|
| R04 | Default deny journey collection | No journey event is accepted without a server-side grant; the tracker does not load until consent | T: `test_missing_permission` |
| R05 | Separate purposes | Grant purposes `journey`, `linking`, `organization`. Requested-service response needs no grant (R06). Marketing: **not offered — the site does no marketing [decided]** | T: `test_denied_purpose` |
| R06 | Enquiry must not require analytics permission | `/api/contact` never consults a grant to accept an enquiry | T: route test |
| R07 | A prompt / contract / owner permission is not universal authorization | Each purpose is a separate opt-in; grant scoped to one browser epoch and one site | review |
| R08 | Permission checked at collection **and** processing | `ingest` checks the grant; `infer`, `link`, admin reads filter on grant state and tombstones | T: `test_withdrawal_purge_and_replay_block` |
| R09 | Withdrawal stops and erases optional journey data; delayed events suppressed | `withdraw()` revokes, tombstones, erases; later events rejected by tombstone | T: same |
| R10 | Operational/contact records kept separately, not reused for analytics | Leads stay in `leads`; a link is a separate, revocable `vi_links` row | review |

### Observation and retention

| ID | Requirement | Implementation | Check |
|---|---|---|---|
| R11 | Window starts at first accepted, permitted page-view report | Window created only by an accepted browser `page_view` | T: `test_provider_cannot_start_window` |
| R12 | Fixed `[t0, t0+15d)` | `WINDOW_MS` | T: `test_start_and_fixed_window`, `test_day_15_excluded` |
| R13 | Browser time = receipt time; provider time only from a trusted adapter | `effectiveAt = receivedAt` for browser sources | T: `test_browser_cannot_backdate` |
| R14 | Provider ≤48h late, before `ends+48h`; current grant still permits | `LATE_MS`, `acceptUntil` | T: `test_late_provider_allowed`, `test_provider_too_late`, `test_provider_future_time` |
| R15 | Evidence until `t0+22d`; an insight never extends raw expiry; min of all limits | `expiresAt = min(t0+22d, grant.validUntil)`; insight `expiresAt = min(support)` | T: `insight_never_extends_expiry` |
| R16 | Separate defaults | security log 7d · consent/audit 90d · org cache 30d · aggregates 180d (existing). Enquiries: **deviation, see D2** | TTL indexes |
| R17 | Hide withdrawn data immediately; local delete ≤24h; restored backups reconciled | Tombstone written first, reads filter on it; deletes are synchronous; daily sweep re-deletes anything belonging to a tombstoned epoch | T: `sweep_reconciles_tombstoned_epoch` |
| R18 | Purge proofs, caches, exports, mappings by purpose | Erasure removes proofs, links, insights, evidence, sessions; org cache holds no personal data and expires at 30d | T: withdrawal test |

### Storage

| ID | Requirement | Implementation | Check |
|---|---|---|---|
| R19 | tz-aware time, JSON, UUIDs; tenant-composite scope; checks in a transaction | MongoDB (codebase convention, **D1**); every query filters `siteId`; window ordering asserted in code; unique indexes for idempotency and one window per epoch | T: `window_bounds_ordered` |
| R20 | No cascading graph delete; scoped lineage; outbox with bounded backoff; 202 ≠ done | Erasure is scoped to one `(siteId, epochId)`; shared contacts are never traversed; `vi_deletion_jobs` with exponential backoff, `verified` only on adapter confirmation | T: `test_deletion_job_retries_until_verified` |

### Collection restrictions

| ID | Requirement | Implementation | Check |
|---|---|---|---|
| R21 | Content IDs, campaign codes, CTA IDs — not URLs or text | `catalog.ts`: every page has an ID; the browser sends the ID | T: `test_content_allowlist` |
| R22 | Redact at every layer | Aggregate tier now stores referrer **host** only and constrains UTM values; journey tier never receives a URL | T: collect test |
| R23 | Reject emails, gender, secret URL params, form contents, keystrokes, arbitrary props | Exact key-set and value allowlists | T: `test_no_raw_email_in_event`, `test_no_gender_property` |
| R24 | No deanonymization, fingerprinting, sensitive traits, identifier resurrection, purchased data | No such code exists; epoch is a random UUID in a consented cookie; withdrawn epochs are tombstoned and never reissued | review |
| R25 | Organization candidates stay candidates | `relationship: "possible_network_association"`, `inferred`, confidence `null` | T: network tests |
| R26 | Company collector: allowlisted endpoints, field allowlist, terms, bounded fetch, rate limit, SSRF protection | `network.ts`: IANA bootstrap + five RIR RDAP hosts only, no redirects followed, 3s timeout, 64 KB cap, per-instance rate limit, 30d cache; queries the **/24 (v4) or /48 (v6) network, never the exact address** | T: network tests |
| R27 | Vendor holds (PostHog, Plausible, IPinfo, Leadfeeder, Bombora, Cookiebot, HubSpot, Companies House) | **None integrated.** No account, key, contract or sandbox test exists for any; the README says each must be verified first | — |

### Engine invariants (`reference.py`)

| ID | Requirement | Check |
|---|---|---|
| R28 | Rejections are codes; no payload in logs | `vi_security_log` stores `{code, sourceId, at}` only |
| R29 | Timezone required | T: `test_no_naive_time` (adapted: provider times without an offset are rejected; invalid Dates rejected) |
| R30 | Context and Proof come from trusted server adapters only | Context comes from HMAC-signed httpOnly cookies; proofs are created only inside `/api/contact` |
| R31 | Grant: site, epoch, not revoked, in validity, purpose, source, not tombstoned | T: `test_tenant_boundary`, `test_unknown_source` |
| R32–R45 | Envelope allowlist, 8 KB cap, UUID, exact properties, provider⇔booking, time bounds, session/epoch, idempotency, first-event rule, window bounds, stored fields | T: the 22 ingest tests |
| R46–R47 | Scoped links, reversal | T: `test_explicit_scoped_link`, `test_network_not_person_proof`, `test_wrong_session_proof`, `test_out_of_scope_event_proof`, `test_reverse_link` |
| R48 | Inference recomputes, abstains, explains, never scores | T: `test_abstain_one_page`, `test_explainable_rule`, `test_repeated_same_case_not_two_cases` |
| R49–R52 | Withdraw, erase, expire, deletion jobs | T: `test_withdrawal_purge_and_replay_block`, `test_retention_expiry`, `test_deletion_job_retries_until_verified` |

### Shapes (`schema.sql`, `examples.json`)

R53–R55: every column with a meaning in this deployment is carried into a Mongo field of the same
name in camelCase (`permission_snapshot_json` → `permissionSnapshot`, `counterevidence_state`,
`permitted_next_action`, `confidence: {probability: null, description}` …). Columns for capabilities
that do not exist here (`encrypted_value`, `external_refs` provider tenants) are documented in §8.

## 4. Data model (MongoDB, prefix `vi_`)

| Collection | Reference table | TTL |
|---|---|---|
| `vi_authorizations` | authorizations | `validFrom + 90d` (consent record) |
| `vi_windows` | windows | `expiresAt` |
| `vi_sessions` | Engine.sessions | `expiresAt` (= window) |
| `vi_events` | events | `expiresAt` |
| `vi_evidence` | evidence | `expiresAt` |
| `vi_proofs` | Engine.proofs | `expiresAt` |
| `vi_links` | links | `expiresAt` (= `validUntil`) |
| `vi_insights` | insights | `expiresAt` |
| `vi_export_ledger` | export_ledger | `expiresAt` |
| `vi_deletion_jobs` | deletion_jobs | `deadlineAt + 30d` |
| `vi_tombstones` | audit_tombstones | `recordedAt + 90d` |
| `vi_security_log` | (README: security logs) | 7d |
| `vi_org_cache` | (README: org cache) | 30d |
| `vi_consent_stats` | (README: aggregate statistics) | 180d |

`sources` and `entities` are code, not collections: `SOURCES` in `policy.ts`, and `entityScope` +
`entityId` on each record **[decided — D1]**.

## 5. Flows

1. **Prompt.** No choice stored → after 20 s or 40% scroll, a small card offers three toggles
   (journey on by default *in the card*, nothing sent until "Allow"). "No thanks" has equal weight.
2. **Grant.** `POST /api/vi/grant {purposes}` → server mints `epochId`, `grantId`, sets two
   httpOnly signed cookies (`sb_vi` epoch, 22d; `sb_vi_s` session, browser-session). `journey` is
   required for any grant.
3. **Events.** `POST /api/vi/event {schema_version, event_id, event_name, properties}`. Context is
   read from the cookies, never the body. A missing session cookie mints one.
4. **Organisation.** On each new session with `organization` granted, after the response: RDAP on
   the /24 or /48 → evidence row on the session.
5. **Link.** Contact form checkbox (shown only with `linking`) → `/api/contact` registers an
   `explicit_contact_link` proof for this session's events and links them to the new lead.
6. **Withdraw.** Footer "Privacy choices" → `POST /api/vi/withdraw` → revoke, tombstone, erase,
   clear cookies.
7. **Expire.** TTL indexes, plus `/api/vi/sweep` (Vercel cron daily, `CRON_SECRET`) and an admin
   button: close at `endsAt`, erase at `expiresAt`, reconcile tombstones, run deletion jobs.

## 6. Insight rules (all unvalidated, all abstain, confidence always `null`)

| Rule | Fires when | Alternatives kept |
|---|---|---|
| `development_interest_v0` | ≥2 distinct case studies **and** a project CTA (`start_project` / `enquiry_submitted`) — the reference rule | portfolio research, peer review, recruiter evaluation |
| `service_evaluation_v0` | ≥1 service or hire page **and** a contact CTA (`start_project`, `email`, `phone`, `enquiry_submitted`) | competitor research, price comparison, student research |
| `candidate_evaluation_v0` | `about` **and** (`stack` or ≥1 case study) **and** a profile CTA (`social_linkedin`, `social_github`) | peer curiosity, client due diligence, recruiter sourcing |
| `reader_interest_v0` | ≥2 distinct articles | arrived from a shared link, research for their own writing |

Every insight carries `evidenceIds`, `unknowns` and `permittedNextAction` that never initiates
contact. Rules 2–4 are **[decided]** extensions in the reference rule's exact shape.

## 7. Decisions

- **D1 MongoDB, not PostgreSQL.** The codebase is Mongo/Mongoose (CLAUDE rule 3). Composite tenant
  keys become `siteId` in every filter; FK integrity is enforced in the engine.
- **D2 Enquiries stay at 24 months — deviation.** The reference *suggests* 90 days after last
  activity and calls it "a design proposal, not a universal legal requirement". The privacy policy
  already discloses 24 months and the record is how an agreement is evidenced; cutting it to 90
  days could destroy a client's paper trail. Everything new follows the reference.
- **D3 No vendor.** Organisation data comes from public RDAP registries via the IANA bootstrap,
  queried by network prefix. No account, key or purchase.
- **D4 Consent card, not a wall.** Bottom-left, non-modal, never over the hero CTA, lazy-loaded so
  Phase 4 PageSpeed work is not undone.
- **D5 Four rules, not one.** Same shape, same abstention, same null confidence.
- **D6 `entry` on `page_view`.** A controlled category is what the README asks for in place of a URL.
- **D7 Tombstone-first erasure** instead of a multi-document transaction: data is hidden the moment
  the tombstone lands; the sweep finishes any interrupted delete.
- **D8 Backups.** Atlas backup retention is not controllable from this repo. Tombstones (90 d) are
  the deletion journal; the sweep deletes any restored row that belongs to a tombstoned epoch.
- **D9 No field encryption.** Nothing personal is stored in `vi_evidence`: the network owner is a
  company. Atlas encrypts at rest.
- **D10 Export ledger and deletion jobs are built with zero destinations,** so adding an exporter
  later cannot skip erasure.
- **D11 Search.** The site has no search box; the public Cmd-K palette's query is classified in the
  browser into the reference topic set and only the topic is sent.
- **D12 No downloads exist,** so `download_requested` has an empty asset allowlist and is rejected.
- **D13 No booking provider exists,** so `booking_confirmed` is provider-only and tested with a mock.
- **D14 Aggregate tier stays cookieless** and now keeps referrer hosts only.

## 8. Not applicable here (and why)

`encrypted_value` (D9) · `external_refs` provider tenants (no providers) · `authenticated_subject`
proofs (the site has no visitor accounts — the kind is accepted by the engine, never issued) ·
marketing purpose (no marketing) · Companies House (UK registry; Shivam's audience is Indian and
nothing here needs company registration data).

## 9. Acceptance criteria (binary) — verified 2026-10-23

- [x] All 32 reference invariants pass as TypeScript tests against the production engine
      (`npm run test:vi`: 101 tests, 101 pass — the 32 under their original names, plus 69 more).
- [x] No journey event is stored before `POST /api/vi/grant` — end-to-end against `next start`:
      no cookie, no event and no state request before consent.
- [x] Grant → page views → CTA → enquiry with "link" ticked appears in `/admin` → Visitors with
      entry `search`, the pages, `start_project`, the linked lead, Reliance Jio as network owner
      and `development_interest_v0` with its alternatives.
- [x] Withdrawal leaves only the tombstone (events, insights, links, proofs, sessions, evidence all
      0) and the replayed event is refused; the lead itself is kept.
- [x] `gender` and URL-shaped properties rejected with a code; the log row holds code, source and
      time only.
- [x] RDAP returns owners for 8.8.8.0/24 (Google LLC, hosting) and 49.36.0.0/24 (Reliance Jio,
      mobile carrier); queries carry the network address only.
- [x] `npm run build` passes; ESLint 0 errors (18 warnings, all `set-state-in-effect`, the pattern
      the codebase already uses).
- [x] `/privacy-policy` rewritten against the code (claims table at the top of `lib/legal.ts`).
- [x] Screenshots in `.browser-shots/phase-6/`.

End-to-end: **50/50** checks, run against an isolated Atlas database
(`shivambhadoriya_vi_test`, dropped afterwards). The production database was read, never written.

## 10. Independent security review (2026-10-23)

A separate agent with no access to the design reasoning reviewed the code adversarially. Nine
findings, all traced, all fixed, all pinned by unit tests and the end-to-end run:

| # | Severity | Finding | Fix |
|---|---|---|---|
| 1 | High | A linked enquiry's identity was presented across the whole journey, not the one linked session | List payload carries a link reference only; detail scopes identity to the linked events and marks them |
| 2 | Med-high | One free grant could drive unbounded writes and O(n²) inference | 500 events / 50 sessions per epoch; inference debounced; instance grant ceiling; pruned limiter; bounded admin query |
| 3 | Medium | A withdrawal failing part-way could leave a revoked-but-visible journey | Tombstone before revocation; idempotent withdraw; admin reads hide revoked grants |
| 4 | Medium | Contact IP hash was plain sha256 with a default salt; policy called it irreversible | HMAC under a server-only key for every IP-derived hash; nothing stored without a key; policy corrected |
| 5 | Low-med | The lead kept its visit-link pointer after erasure | Erasure clears it |
| 6 | Low | Erasure left the window and a plain epoch id on the consent record | Window deleted; epoch id replaced by its keyed hash |
| 7 | Low | A proof was written before the grant was re-checked | Full grant check first |
| 8 | Low | A private-person registrant could be shown as owner; registry handles spell out address ranges | Individuals skipped; handles not cached or stored |
| 9 | Low | Late event after withdrawal survived until the sweep; TTL removed windows before the sweep saw them; window-less epochs not erasable | Late event deleted at once; window kept one day past expiry for the sweep; erase keyed on the grant |

Areas the reviewer checked and found sound: cookie/context forging, admin auth and input
validation, NoSQL injection, the RDAP fetch (allowlist, no redirects, caps, prefix only), the
IDs-only journey channel, and the time-window boundaries against `reference.py`.

## 11. Sources added to the register

The reference's 44 sources stand. The network lookup added these, consulted 2026-10-23:

| Source | Supports |
|---|---|
| RFC 9224 — https://www.rfc-editor.org/rfc/rfc9224 | IANA RDAP bootstrap format, longest-prefix match |
| RFC 9082 — https://www.rfc-editor.org/rfc/rfc9082 | `ip/<addr>` and `ip/<addr>/<len>` query paths |
| RFC 9083 — https://www.rfc-editor.org/rfc/rfc9083 | IP network response: entities, roles, vcardArray, country |
| RFC 7095 — https://www.rfc-editor.org/rfc/rfc7095 | jCard `fn` and `kind` (a `kind: individual` admin contact is never stored as an owner) |
| RFC 5952 — https://www.rfc-editor.org/rfc/rfc5952 | Canonical IPv6 text form |
| RFC 6890, RFC 4193, RFC 3849; IANA special-purpose registries | Reserved and private ranges that are never looked up |
| https://data.iana.org/rdap/ipv4.json, ipv6.json | Live registry mapping |
| https://rdap.arin.net/registry/ip/8.8.8.0/24, https://rdap.apnic.net/ip/49.36.0.0/24 | Real response shapes behind the test fixtures |
