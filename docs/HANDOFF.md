# HANDOFF — Supreme_Shivam — Phase 6b (Data from the first page load) — 2026-10-23

Branch `feat/phase-6b-first-click`, pushed, **no PR yet, not deployed**. Spec:
`docs/spec/phase-6b-first-click.md` (approved `go`, row 8 approved `go`). It sits on `origin/main`,
which already contains Phases 5a and 6 (PRs #4 and #5).

## Done
- With no stored choice, a compact consent card (No thanks · Allow · Choose) is visible ~1.0–1.2 s
  after first load, no scroll. It is bottom-right at ≥ 640 px and a 140 px bottom strip on phones,
  and covers no hero link or button at 1440×900, 1366×768, 390×844. Allow grants `journey`; Choose
  opens the full three-switch card in place.
- Every `/api/collect` pageview now stores `entry` (arrival category on the landing view, `internal`
  after), `contentId` (derived server-side, `unlisted` fallback), `region`, `timezone`, and
  `geoSource: "ip_network"`. Bad input becomes `unknown` / `Unknown`. City is never stored.
- Admin → Overview has an "Arrival and landing — every visitor" panel.
- The privacy policy describes all of it, including the card appearing on first open.
- Verified: `npm run test:vi` 101/101; end-to-end 63/63 on `shivambhadoriya_vi_test`; mobile
  Lighthouse median 85 vs 85 on `origin/main` (5 alternating runs each, CLS 0); screenshots at
  1440/1366/390 checked by eye.

## Files changed
- `src/components/vi/vi-root.tsx` — card chunk loads on idle, capped at 1200 ms.
- `src/components/vi/consent-card.tsx` — prompts on mount; compact first-load variant (row 8).
- `src/components/analytics/beacon.tsx` — sends `entry` via `classifyEntry()` on the landing view.
- `src/app/api/collect/route.ts` — validates `entry`; derives `contentId`; reads region/timezone headers.
- `src/models/event.ts` — five new fields with defaults.
- `src/lib/analytics.ts` — `topLanding()` for landing views; `landingEntries` / `landingPages`.
- `src/components/admin/overview.tsx` — the new panel; `visitors.tsx` exports `entryLabel`.
- `src/lib/legal.ts` — privacy policy text.
- `docs/spec/phase-6b-first-click.md`, `docs/spec/GLOSSARY.md` (new), `docs/DECISIONS.md`, `docs/PHASES.md`.

## Decisions made
- The master "Visitor Radar" prompt is split into phases 6b–6g on the board. Its 60–70%
  no-consent figure is not a target; measured coverage is (6f).
- Compact first-load card, because the full card covered both hero CTAs (breaks Phase 6 D4).
- No city in the aggregate tier: city + daily hash + device narrows to one person in a small town.
- Network-kind aggregate counts (row 7) not built: Shivam replied `go` without `yes 7`.

## Known broken / deliberately skipped
- Region/timezone on real traffic are unverified. Vercel's headers exist only in production;
  tested with injected headers.
- `CRON_SECRET` is still not set in Vercel, and the deploy of 5a + 6 has not been confirmed live.
- Left behind because the cleanup command was denied: scratchpad worktree `wt-main`
  (`git worktree list` shows it) and the `shivambhadoriya_vi_test` database (holds synthetic rows).
- 18 ESLint `set-state-in-effect` warnings (pre-existing), 0 errors.

## Next session starts here
- Phase 6c: Radar orchestration. A durable `vi_jobs` queue with idempotent keys and bounded
  retries replaces fire-and-forget `after()`; plus RDAP retry and a one-click Run Radar per journey
  and global. Spec-lock first.
- First command: `git checkout feat/phase-6b-first-click && git pull && npm run test:vi`
- Watch out for: the end-to-end harness is **not in the repo**. It lives in
  `C:\Users\shiva\AppData\Local\Temp\claude\d--Projects-Supreme-Shivam\f6030c84-07b5-4ecd-873e-973fdf417b35\scratchpad\e2e-vi.mjs`
  (+ `serve.mjs`, `drop-test.mjs`, `test.env.json`, `cta-overlap.mjs`). Temp folders get
  cleaned, so copy them out before relying on them, and never point them at anything but
  `shivambhadoriya_vi_test`.
