# HANDOFF — Supreme_Shivam — Phase 5a (Admin v2 "Signal Deck") — 2026-10-23

Branch `feat/phase-5a-admin-deck`, pushed, **not deployed**. Two commits:
`a325aff` (the deck) and `1630864` (palette height). Spec:
`docs/spec/phase-5-admin-signal-deck.md`, approved `go`.

## Done

- **The panel's numbers are now honest.** Every event is labelled `human | untagged | bot` by a
  `$switch` in the aggregation, so the rule applies to the 257 events banked before the field
  existed. Default view is HUMAN: **179 pageviews, 149 session-days, 16 of them reading a second
  page**. ALL shows 258 / 162. A provenance strip prints the whole split and the four counts sum
  to the total.
- **What the old numbers were hiding, now visible:** 38 events are this project's own headless
  Chrome (Lighthouse, `scripts/cdp.mjs`); 2026-09-26 alone logged 53 views across 7 sessions,
  which was Phase 4 PageSpeed day. 40 more carried no `x-vercel-ip-country` header. `sessionId`
  rotates at UTC midnight, so "unique visitors" was always counting session-days, and the KPI now
  says so on its face. 85% of human views land on `/` and stop. `utmSource` has never once been
  populated.
- **The one lead is a test record.** `Kimberly Morrow`, created 34 seconds after the first pageview
  in the database. Left in place — deleting it is Shivam's call.
- **Login card no longer names `ADMIN_PASSWORDS` / `ADMIN_SECRET`** to anonymous visitors.
  Verified by reading the rendered form text, not by eye.
- **Grouped sidebar**, each group stating what it answers. 264px rail at >=1280px, 68px icon rail
  1024–1279, drawer below 1024. Session expiry counts down in the user card.
- **Live feed** polling `/api/admin/feed` every 20s, only while the tab is visible. Verified: a
  pageview on `/services` appeared in the feed in **12 seconds** and the live dot fired.
- **Cmd-K palette** — 8 pages plus Refresh and Sign out; Enter navigates, Esc closes and returns
  focus to the trigger.
- **Trend chart** stacked by class, with the duplicate-tick bug fixed. It now reads
  `53 · 42 · 28 · 14 · 0` where it used to read `4 · 3 · 2 · 3 · 3`.
- **Verified, not assumed:** `npm run build` clean, 0 ESLint errors (10 pre-existing warnings),
  light-theme contrast measured at **4.96** and **6.93** on the sidebar, no page errors in console.
  Ten screenshots in `.browser-shots/phase-5a/` at 1600, 1100 and 480px in both themes.

## Files changed

- `src/lib/analytics.ts` — rewritten. `$switch` classifier, range + class filters, stacked daily
  series with zero-filled gaps, session/engagement stats, provenance, `getLiveFeed`.
- `src/models/event.ts` — `visitorClass` field, indexed.
- `src/app/api/collect/route.ts` — classifies at write time with the same rule.
- `src/app/api/admin/data/route.ts` — `range` and `class` params, allowlisted; returns session expiry.
- `src/app/api/admin/feed/route.ts` — **new.** 25 newest events.
- `src/lib/auth.ts` — `tokenExpiry()`, because the cookie is httpOnly and the UI cannot read it.
- `src/components/layout/chrome.tsx` — **new.** Public nav/footer/Lenis everywhere except `/admin`.
- `src/app/layout.tsx` — routes the chrome through it.
- `src/app/admin/page.tsx` — dropped `pt-28`; the deck owns the viewport.
- `src/components/admin/` — `admin-app.tsx` rewritten; **new**: `sidebar.tsx`, `nav.ts`,
  `overview.tsx`, `live-feed.tsx`, `trend-chart.tsx`, `primitives.tsx`, `command-palette.tsx`,
  `leads.tsx`.
- `src/app/globals.css` — `--chart-2` in both themes, `deck-*` utilities (shimmer, rise, row-in,
  pulse, grid).
- `docs/spec/phase-5-admin-signal-deck.md` — **new**, the contract.

## Decisions made

- **Classification runs in the aggregation, not off the stored field.** 257 rows predate the field;
  a number that only counts rows written after the fix is worse than no number. `collect` stores
  the same label too, so one rule governs both — change one, change the other.
- **`country: "Unknown"` is its own `untagged` class, never "self-traffic".** The absent header is
  provable; "it was localhost" is not.
- **Bot rows are classified at read time, never deleted.** Deleting evidence to make a chart look
  better is how the panel got untrustworthy in the first place.
- **`/admin` drops the public chrome.** Lenis's transformed wrapper breaks `position: sticky`
  inside it, the fixed nav and footer eat ~220px, and the public Cmd-K binding would fight the
  deck's own palette. A nested layout cannot remove a parent layout's chrome in the App Router,
  so the split is one client component.
- **Default range is ALL, not 30d** as row 7 first said. With 40 days of data, 30d would have
  contradicted the acceptance criteria in the same spec. Noted here rather than silently changed.
- **No enrichment, no cookies, no fingerprinting.** `/privacy-policy`'s cookieless claim is
  currently true and nothing in this phase makes it false.

## Known broken / deliberately skipped

- **Audience and Status pages are placeholders.** Phase 5b. Audience waits on Shivam's
  visitor-identification requirements file.
- **Leads, Projects, Writing and Media still use the Phase 3b components.** They work and are
  mounted in the new shell, but they have not been redesigned. Phase 5b.
- **`getPublicStats()` still counts bots**, so `/stats` shows 258 while `/admin` shows 179. The
  spec put public pages out of scope. One-line fix in 5b, but it needs a decision: the public
  number going down is a visible change.
- **Verifying the feed wrote one real event** to the production database — a headless hit on
  `/services`. It classified as `bot`, so HUMAN stayed at 179 / 149 while ALL moved to 258 / 162.
  Left in place, correctly labelled.
- **10 pre-existing ESLint warnings** (`react-hooks/set-state-in-effect`), 4 of them in new files,
  the same rule the Phase 3b admin tabs already trip. 0 errors.
- **Not deployed.** Phase 4's `perf/phase-4` is also still unmerged; decide the order before
  running `vercel --prod`.

## Next session starts here

- **Phase 5b:** redesign Leads, Projects, Writing, Media and Status to match the deck, and build
  the Audience page from Shivam's requirements file once it arrives.
- **First command:** `git checkout feat/phase-5a-admin-deck && npm run build`
- **Watch out for:** the classifier lives in **two** places — the `$switch` in
  `src/lib/analytics.ts` and `classify()` in `src/app/api/collect/route.ts`. They must stay
  identical or new rows will disagree with old ones and the provenance strip will stop summing to
  the total. That strip is the regression test: if human + untagged + bot does not equal the ALL
  pageview count, the two rules have drifted.
