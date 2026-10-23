# HANDOFF — Supreme_Shivam — Phase 6 (Visitor intelligence) — 2026-10-23

Branch `feat/phase-6-visitor-intelligence` (branched from the unmerged `feat/phase-5a-admin-deck`),
pushed, **not deployed**. Spec: `docs/spec/phase-6-visitor-intelligence.md`. Contract:
`visitor_intelligence_reference/` (now committed, minus the zip, which is byte-identical).

## Done

- **Shivam's reference package implemented in full.** Every requirement in the README, every
  invariant in `reference.py`, every table in `schema.sql` and every shape in `examples.json` is
  mapped in spec §3 to where it lives and how it is checked.
- **The engine is a port of `reference.py`.** Its 32 tests run under their original names against
  the production engine — the two schema tests execute the reference `schema.sql` in Node's
  built-in SQLite. `npm run test:vi`: **101 tests, 101 pass.**
- **Nothing journey-level happens without consent.** A card appears after 20 s or 40 % scroll with
  three separate opt-ins (pages and buttons; link to an enquiry; organisation lookup) and equal-
  weight "No thanks" / "Allow selected". Verified end-to-end: no cookie, no event, no state request
  before consent; a decline sets no cookie and is not asked again.
- **Only IDs cross the wire.** Pages as content IDs, buttons as CTA IDs, arrival as a category,
  palette searches as a topic. Gender, email and URL-shaped values are rejected with a code.
- **Person or organisation, honestly.** Self-reported on the contact form, and the public registry
  owner of the visitor's network from RDAP — queried by /24 or /48, never the address. Live:
  Reliance Jio → mobile carrier, Google LLC → hosting. Shown as `possible_network_association`.
- **Why, without pretending.** Four abstaining rules with evidence, alternatives, unknowns,
  confidence `null`, and a next action that never contacts anyone.
- **Withdrawal erases at once.** Footer "Privacy choices" → tombstone, revoke, delete; the lead
  itself is kept; a replayed event is refused. Verified: only the tombstone remains.
- **Admin → Visitors.** Journey list, journey detail with the six independent dimensions (gender
  shown as "not collected — policy"), insight cards, network evidence, scoped linked enquiry,
  Reverse link, Erase, Run sweep, and panels for rejections, consent counts, arrivals, network
  kinds, deletion jobs and retention.
- **Independent security review: 9 findings, all fixed** (spec §10), including a high-severity
  scope leak of a linked enquiry's identity.
- **End-to-end 50/50** against `next start` on an isolated Atlas database, dropped afterwards. The
  production database was read (counts, referrer shapes) and never written.

## Files changed

- `src/lib/vi/` — `engine.ts`, `policy.ts`, `catalog.ts`, `rules.ts`, `config.ts`, `cookies.ts`,
  `server.ts`, `models.ts`, `mongo-store.ts`, `memory-store.ts`, `network-core.ts`, `network.ts`,
  `sweep.ts`, `admin-queries.ts`, three `*.test.ts`, `node-sqlite.d.ts`.
- `src/app/api/vi/{grant,event,withdraw,state,consent-stat,sweep}/route.ts` — public endpoints.
- `src/app/api/admin/vi/{summary,journeys,journeys/[epochId],erase,reverse-link,sweep}/route.ts`.
- `src/components/vi/{vi-client,tracker,consent-card,vi-root}` — consent and tracking.
- `src/components/admin/{visitors,journey-detail,evidence-badge}.tsx`; `admin-app.tsx`, `nav.ts`,
  `leads.tsx` updated.
- `src/app/api/contact/route.ts`, `src/models/lead.ts`, `src/lib/mail.ts`,
  `src/components/sections/contact.tsx` — self-reported fields and visit linking.
- `src/app/api/collect/route.ts` — referrer host only, token-shaped UTM, keyed visitor hash.
- `src/lib/keyed-hash.ts` — HMAC for every IP-derived hash.
- `src/lib/legal.ts`, `src/components/legal/legal-page.tsx`, `src/app/privacy-policy/page.tsx` —
  policy rewritten against the code, with a `#visit-insights` anchor.
- `src/components/layout/{chrome,footer}.tsx`, `src/components/ux/command-palette.tsx`.
- `vercel.json` (daily sweep cron), `tsconfig.json` (`allowImportingTsExtensions`), `package.json`
  (`test:vi`), `.gitignore`.

## Decisions made

- **Gender is never inferred.** The reference forbids it and there is no honest signal.
- **No vendor.** RDAP by prefix instead of IPinfo/Leadfeeder/Bombora, which the reference lists as
  unverified holds.
- **MongoDB, not PostgreSQL** — the codebase convention; tenant keys become `siteId` everywhere.
- **Enquiries stay at 24 months** against the reference's 90-day *suggestion* (deviation, D2).
- **Four rules, not one**, all in the reference rule's exact shape.
- **Tombstone → revoke → delete**, and every IP-derived hash is keyed. Full list in
  `docs/DECISIONS.md`.

## Known broken / deliberately skipped

- **Not deployed.** Merge 5a first, then 6.
- **`CRON_SECRET` is not set in Vercel.** Until it is, the daily sweep returns 401. TTL indexes
  still delete everything on schedule; only the "expired" audit rows and backup reconciliation
  wait. Set it, and Vercel sends it to the cron automatically.
- **Coverage will be small.** Journey data exists only for visitors who say yes, and organisation
  lookups only for those who also tick that box. This is what doing it honestly costs.
- **No vendor integrations, no booking provider, no downloads, no site search** — the matching
  events (`booking_confirmed`, `download_requested`) exist in the schema but can never be accepted
  here; `search_submitted` comes from the Cmd-K palette as a topic only.
- **18 ESLint warnings** (`set-state-in-effect`), 0 errors — the pattern the codebase already uses.
- **Rotating `ADMIN_SECRET`** without first setting `VI_SECRET` resets every consent (visitors are
  asked again) and orphans existing tombstone hashes for their 90 days.
- `/stats` still counts bots (open since 5a).

## Next session starts here

- **Phase 6 deploy, then Phase 5b:** merge `feat/phase-5a-admin-deck` and
  `feat/phase-6-visitor-intelligence`, set `CRON_SECRET` in Vercel, `vercel --prod`, then one
  consented visit on the live site and check it in /admin → Visitors.
- **First command:** `git checkout feat/phase-6-visitor-intelligence && npm run test:vi && npm run build`
- **Watch out for:** `src/lib/vi/engine.ts` is Shivam's written policy in code. If a change makes
  one of the 32 reference tests fail, it is a policy change: update the spec and `/privacy-policy`
  with it, or don't make it.
