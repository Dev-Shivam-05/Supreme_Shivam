# Portfolio visitor-intelligence: offline reference artifacts

Prompt version: 1.0. Design/reference version: 0.1. Research date: 2026-10-23.

## Status and limits

This package accompanies the research report in the conversation. It is NOT a
production application, deployed service, browser SDK, legal assessment, or tested
vendor integration. All examples and tests are synthetic. No private accounts,
visitors, email systems, or provider APIs were accessed. No purchase or deployment
was performed.

Implemented locally:
- A Python standard-library, in-memory reference model of selected invariants.
- Thirty-two synthetic checks, including SQL DDL creation and JSON parsing.
- A twelve-table SQLite reference schema and representative stored records.

Not implemented or tested:
- Actual consent UI, network ingress, authentication, CSRF protection, TLS,
  webhook signatures, token/code verification, production database transactions,
  field encryption, user interface, backups, real provider erasure, availability,
  browser delivery behavior, identity accuracy, organization matching, or intent
  prediction performance.

`Context` and `Proof` are TRUSTED SERVER ADAPTER outputs. Constructing them from a
browser request would invalidate the security design. Synthetic deletion adapters
return acknowledgements; no external system is contacted. In-memory tombstones,
proofs, grants and export references are illustrative; production requires the
retention/encryption/reconciliation controls described below.

## Run

Requires Python 3.11 or later, using only the standard library:

```bash
cd visitor_intelligence_reference
python -m unittest -v test_reference
```

Executed environment: CPython 3.13.5, SQLite 3.46.1, Linux container. See
`test-results.txt` and `test-status.json`. Passing tests establish only the listed
synthetic invariants, not a real-world accuracy percentage.

## Files

- `reference.py`: purpose-gated event ingestion, fixed observation windows,
  idempotency, allowlisted properties, event-scoped contact links, an unvalidated
  development-interest rule, reversal, withdrawal and mock deletion retries.
- `test_reference.py`: runnable synthetic checks.
- `schema.sql`: reference DDL. The Python model does not use a database adapter.
- `examples.json`: synthetic normalized event, insight and field provenance.
- `source-register.json`: primary documentation consulted; access date and known
  version/update dates. Vendor descriptions are not independent validation.
- `test-results.txt`, `test-status.json`: executed test output and environment.

## Core semantics

A request is not a session; a session is not a browser epoch; a browser epoch is
not a person. An account is an authenticated application identity, not verified
civil identity. A company-network match is not employment or representation.
Human/automation assessment, identification, affiliation, authority and business
intent are independent dimensions.

Every claim uses one evidence label: observed, self_reported,
verified_within_scope, inferred, unknown or not_applicable. Source kind
(e.g. vendor_claim) is separate. Confidence is separate and remains null when
uncalibrated. Preserve conflicts and unknown reasons.

## Proposed authorization policy

Default deny individual-journey collection until explicitly authorized. Maintain
separate purposes for journey analytics, linking, organization enrichment,
requested-service response and marketing. Do not require analytics permission for
sending an inquiry. Do not treat a browser permission prompt, a provider contract,
or the website owner's permission as universal visitor authorization.

Permission is checked at collection and processing. Stop and erase affected
optional journey data on withdrawal; suppress delayed events. Retain separately
justified operational/contact records without reusing them for analytics.

## Proposed observation/retention policy

- Start at the first accepted, permitted page-view report, not the first HTTP hit.
- The window is [t0, t0 + 15 days), not a rolling engagement window.
- Browser event time is receipt time. Provider occurrence time comes only from an
  authenticated, scoped adapter and is still a provider assertion.
- Accept eligible provider events at most 48 hours late, and strictly before the
  window's 48-hour finalization cutoff. Current authorization must still permit
  processing. Browser backdating cannot reopen a window.
- Store journey evidence until t0 + 22 days, unless authorization or evidence
  expiry requires earlier erasure. Never extend a raw-evidence expiry by creating
  an insight. A production adapter must compute the minimum of all relevant
  expiry limits; this synthetic model uses coincident grant/window starts.
- Suggested separate defaults: isolated security logs 7 days; inquiry records 90
  days after last requested activity; minimal consent/audit/suppression records
  90 days; organization cache freshness 30 days; reviewed aggregate statistics
  180 days. These are design proposals, not universal legal requirements.
- Immediately hide withdrawn data; target local live-store deletion within 24h,
  track provider deletion to verified completion, and expire backups within 30
  days. Apply deletion journals before serving restored backups. External provider
  deadlines must be negotiated and tested before production adoption.
- The reference retains synthetic metadata for inspection. Production must purge
  proofs, caches, exports and encrypted remote mappings according to purpose;
  keep only minimized, access-controlled deletion/audit evidence where justified.

## Production storage adaptation

Map SQLite TEXT timestamps to PostgreSQL timestamptz, JSON TEXT to jsonb and
appropriate identifiers to uuid. All tenant-scoped relationships must remain
composite or use validated row-level policies. Enforce type and temporal checks
in a transaction; the reference DDL alone does not enforce every graph rule.

Never use an unrestricted cascading graph delete. A shared organization or
browser is not proof that every linked contact belongs to the requesting person.
Use explicit claim scope and export lineage. Remove all derived artifacts that
depend on erased evidence. Use a durable transactional outbox for remote deletes,
retry with bounded exponential backoff, inspect provider status, and reconcile.
An HTTP 202 is acceptance, not proof of completed erasure.

## Collection restrictions

Use content IDs, controlled campaign codes and CTA IDs instead of arbitrary URLs
or text. Redact at the CDN, origin, application, queue and tracing layers. Reject
raw emails, gender fields, secret URL parameters, unsubmitted form contents,
keystrokes and arbitrary payload properties from the analytics channel.

No covert deanonymization, fingerprinting, unrelated profile collection,
cross-site search-history reconstruction, sensitive-trait scoring or identifier
resurrection. No purchased personal contact data. Organization candidates remain
candidates. The public company collector must use allowed domains/endpoints,
field allowlists, licensing/terms checks, bounded fetches, rate limits and SSRF
protection. It is not implemented in this package.

## Provider-specific implementation holds

PostHog export and deletion are documented but retention/erase behavior for the
chosen configuration must be tested. Plausible's rotating daily identifier is not
a 15-day visitor identity. IPinfo Lite's ASN/country output is not an employer
match. Leadfeeder's advertised company matching has no independently measured
precision or coverage for this portfolio. Company Surge account/topic signals
must not be turned into a person's search history. Cookiebot does not replace
server-side policy enforcement.

HubSpot's latest date-version reference retrieved during this research was
2026-09. New integrations should pin the current date version and appropriate
project-app configuration. The legacy v3 webhook and GDPR-delete documents in
the register establish specific legacy capabilities, not automatic equivalence
to every new endpoint. Verify scopes, signatures and deletion contracts in a
sandbox before enabling the adapter.
