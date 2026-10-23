# HANDOFF — Supreme_Shivam — Phase 6 (Visitor intelligence) — 2026-10-23

Branch `feat/phase-6-visitor-intelligence` (on top of the unmerged `feat/phase-5a-admin-deck`),
pushed, **not deployed**. Spec: `docs/spec/phase-6-visitor-intelligence.md`. Contract:
`visitor_intelligence_reference/`.

## Done

- `visitor_intelligence_reference/` implemented: engine ported from `reference.py`, its 32 tests
  passing under their original names; `npm run test:vi` → 101/101.
- Consent card (three separate opt-ins) → journey events as content/CTA IDs, arrival category,
  contact-form linking, RDAP network owner by /24 or /48, four abstaining rules, withdrawal that
  erases at once, admin → Visitors with every claim labelled.
- Independent security review: 9 findings, all fixed. End-to-end 50/50 on an isolated database.
- Gender is not inferred anywhere — the reference forbids it.

## What happens when a visitor opens the site today — read this first

Shivam's stated goal (2026-10-23): **gather data from the moment a visitor opens the site with one
click.** Today that is only partly true:

| Moment | What is collected | Consent needed |
|---|---|---|
| First page load, every visitor | Path, referrer **host**, campaign codes, country, device, browser, OS, a keyed daily visitor hash (the Phase 2 aggregate tier) | No |
| After 20 s or 40 % scroll | The consent card appears | — |
| After "Allow selected" | Journey: content IDs, CTA IDs, arrival category, optional link and network owner, hypotheses | **Yes** |

So journey data starts at the click on "Allow", which today cannot happen before 20 s / 40 %
scroll. Pages viewed before that are never recorded at journey level.

**The reference itself forbids collecting journey data before consent.** README: "Default deny
individual-journey collection until explicitly authorized" and "Start at the first accepted,
permitted page-view report, not the first HTTP hit". `reference.py` rejects events outside the
grant. Organisation enrichment is a separate purpose that needs its own authorization. India's DPDP
Act 2023 and the GDPR point the same way. Phase 6b must close the gap **inside** those rules.

## Files changed this session

See `git log main..feat/phase-6-visitor-intelligence`: core in `src/lib/vi/`, public endpoints in
`src/app/api/vi/`, admin endpoints in `src/app/api/admin/vi/`, client in `src/components/vi/`,
admin UI in `src/components/admin/{visitors,journey-detail,evidence-badge}.tsx`, contact form
and lead model, `src/lib/keyed-hash.ts`, the privacy policy, `vercel.json`.

## Decisions made

- Gender never inferred; RDAP by prefix, no vendor; MongoDB; enquiries 24 months (deviation);
  tombstone → revoke → delete; every IP-derived hash keyed. Full list in `docs/DECISIONS.md`.
- **2026-10-23 (end of session):** the "data from the first click" goal goes to Phase 6b, built
  within the reference, with the one grey-area item put to Shivam as an explicit decision.

## Known broken / deliberately skipped

- Not deployed. `CRON_SECRET` not set in Vercel (the TTL indexes still delete on schedule).
- Journey collection starts at "Allow", not at page open — Phase 6b below.
- 18 ESLint warnings (`set-state-in-effect`), 0 errors. `/stats` still counts bots.

## Next session starts here

- **Phase 6b — data from the first click, within the reference.** Run `/spec-lock` first and put
  this exact table to Shivam; build only the rows he approves:

  | # | Change | Reference status | Default |
  |---|---|---|---|
  | 1 | Consent card on the **first page load** (0 s, no scroll trigger), still non-modal with equal buttons, so one click on "Allow" starts the journey on the landing page | Allowed | Build |
  | 2 | Add the arrival **category** and the landing **content ID** to the cookieless aggregate event, so "how they came" and "where they landed" are known for 100 % of visitors from the first hit, with no identifier and no profile | Allowed (aggregate statistics) | Build |
  | 3 | Aggregate **network-kind counts** for every visitor without consent: RDAP by prefix on first hit, kept only as daily counters (e.g. "mobile carrier: 12, corporate network: 3") with no link to any visit, address never stored | **Grey area** — README makes organisation enrichment a separate authorized purpose | Ask Shivam explicitly; do not build without a yes |
  | 4 | Any per-visitor journey, link, network owner or hypothesis **before** consent; buffering pre-consent pages in the browser and sending them after "Allow"; gender | **Forbidden** by the reference (default deny; browser time never authorizes historical collection) and a DPDP/GDPR risk | Not built by default. State the conflict in one line; if Shivam reaffirms after hearing it, that is his call — record it in DECISIONS and make the privacy policy say exactly what is collected |

  Acceptance for rows 1–2: the card visible within 2 s of first load at 1440 and 390 widths
  without hurting Phase 4 PageSpeed; `/api/collect` rows carry `entry` and `content_id`; privacy
  policy updated to match; `npm run test:vi` green; end-to-end re-run on the test database.

- **Before or alongside 6b:** merge and deploy (Shivam). Merge order: `feat/phase-5a-admin-deck`,
  then `feat/phase-6-visitor-intelligence`. Set `CRON_SECRET` in Vercel.
- **First command:** `git checkout feat/phase-6-visitor-intelligence && git pull && npm run test:vi`
- **Watch out for:** row 4. "Collect on open" is the goal, but per-visitor collection before
  consent is exactly what Shivam's own reference forbids. Say so in one line, offer rows 1–3, and
  never let the privacy policy claim less than the code collects.
