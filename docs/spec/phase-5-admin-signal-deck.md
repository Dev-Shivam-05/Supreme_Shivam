# Phase 5 — Admin v2 "Signal Deck"

**Status:** 5a approved `go` 2026-10-23. 5b not started.
**Supersedes:** the flat five-tab admin built in Phase 3b.
**Scope split:** 5a = shell, sidebar, Overview, live feed, visitor classification, APIs.
5b = Leads, Projects, Writing, Media, Status pages.

---

## Why this phase exists

The old panel reported `257 pageviews / 161 unique visitors / 1 lead` and every one of those
numbers was true as a database read and misleading as a statement about the site:

- **38 of 257 events are headless Chrome** — PageSpeed/Lighthouse runs and `scripts/cdp.mjs`.
  2026-09-26 alone logged 53 views across 7 sessions; that was Phase 4 PageSpeed day.
- **40 more have no `x-vercel-ip-country` header.** Provably ungeolocated; not provably self.
- **`sessionId` rotates at UTC midnight** (`sha256(salt|date|ip|ua)`), so "unique visitors" counts
  session-days. One person over ten days reads as ten visitors.
- **The one lead was created 34 seconds after the first pageview in the database** — a contact-form
  smoke test, not an enquiry.
- `utmSource` has never been populated. Not once, in 257 events.
- 16 of 149 clean sessions viewed more than one page. 85% of views land on `/` and stop.

A panel that cannot tell you this is worse than no panel. Phase 5 makes the numbers say what they
mean.

## Measured baseline (2026-10-23, live Atlas `shivambhadoriya`)

| Metric | ALL | HUMAN only |
|---|---|---|
| Pageviews | 257 | 179 |
| Sessions (session-days) | 161 | 149 |
| Sessions with >1 pageview | — | 16 (11%) |
| Bot / untagged events | 38 bot, 40 untagged | — |
| Leads | 1 (test record) | — |

Date range 2026-09-14 to 2026-10-23: 40 days, 30 of them with traffic.

Verifying the live feed added one pageview of its own (a headless browser hitting `/services` on
localhost). It classified as `bot`, so ALL moved to 258 / 162 while HUMAN stayed at 179 / 149 —
which is the whole point of row 5, demonstrated on the way in.

These are regression fixtures. If a change moves these numbers without the database changing, the
change is wrong.

---

## Locked decisions

| # | Ambiguity | Locked value | Why |
|---|---|---|---|
| 1 | "totally different design" | Dark mission-control, existing tokens only: `--bg #08080a`, `--bg-elev #101015`, `--accent #cbff3c`, `--signal #ff4438` (live/alert **only**), mono `.hud` labels, `.brackets`, `.scanlines`. Light theme must work. | Reference is a light-grey SaaS panel; inverting it is the differentiation and matches the public site. |
| 2 | Sidebar | 264px fixed at >=1280px, 68px icon rail 1024-1279px, slide-over drawer below 1024px (280ms). Groups render a `.hud` heading plus an 11px `--fg-muted` subtitle. | The one idea worth taking from the reference. |
| 3 | Sidebar groups | **TELEMETRY** "Who is here, from where, why" to Overview, Live feed, Audience. **PIPELINE** "Enquiries and who sent them" to Leads. **CONTENT** "What the site says" to Projects, Writing, Media. **SYSTEM** "Health, indexing, deploys" to Status. | Replaces 5 flat tabs; leaves a slot for visitor identification. |
| 4 | Bottom user card | 56px, `SB` lime tile plus `admin` plus session expiry countdown, Sign out on hover. | Expiry is genuinely useful; the session token is 12h (`MAX_AGE` in lib/auth.ts), not 7 days as first assumed. |
| 5 | **Visitor classification** | Segmented `HUMAN / ALL / BOT`, default **HUMAN**. `bot` when `browser` is `Chrome Headless` or empty, or `os` is empty; else `untagged` when `country` is `Unknown`; else `human`. Computed in a `$switch` at query time so it applies to every existing row, and also stored as `visitorClass` on new events. | The core fix. Must work retroactively on the 257 rows already banked. |
| 6 | KPI cards (4) | **VISITORS** distinct sessions, hint `session-days, not people`. **PAGEVIEWS**, hint `N bot hits excluded`. **ENGAGED** count plus `N% of M` (sessions with >=2 views). **ENQUIRIES** count, hint `N new`. Value 48px `--font-poster`, label 11px `.hud`, 140px tall, 1px border, no shadow. | Kills the duplicate `Leads` / `New enquiries` pair. |
| 7 | Trend chart | 280px, stacked area human/untagged/bot, 30d default with 7/30/90 toggle. Y ticks explicit: when `dataMax < 5` use integers `0..dataMax`, else 5 evenly spaced deduped integers. Stroke 2px, fill 0.5 to 0. | Fixes the `4,3,2,3,3` duplicate-tick bug. |
| 8 | Live feed | 25 most recent events, polls `/api/admin/feed` every **20s**, only while `document.visibilityState === "visible"`. Row is `HH:MM`, country, device, path, referrer. New rows fade and slide 180ms. An 8px `--signal` dot pulses 2s when an event arrived under 60s ago. | Nothing like it in the reference. This is where visitor identification lands later. |
| 9 | Breakdown panels | 2x2: Top pages, Sources, Countries, Devices. Bar fill `--accent` at 15%, count in mono lime, rows 40px. Sources marks AI referrers (`chatgpt.com`, `perplexity.ai`, `claude.ai`, `gemini.google.com`, `copilot.microsoft.com`) with a diamond and an AEO legend. | Best detail in the reference, and on-identity for an SEO/AI engineer. |
| 10 | Provenance strip | `179 human / 40 untagged / 38 bot / since 2026-09-14 / raw events expire after 180d` | So the panel never lies again. |
| 11 | Chart colours | human `var(--accent)`, untagged `--chart-2` (`#5aa9ff` dark, `#1f6fd0` light), bot `var(--fg-faint)`. | Three series distinguishable in both themes; `--signal` stays reserved. |
| 12 | Command palette | `Ctrl/Cmd+K` to any of the 8 pages, plus Refresh and Sign out. 480px, mono input, arrows and Enter, Esc closes. | The public header already ships a Cmd-K affordance. |
| 13 | Motion | Hover 160ms `cubic-bezier(.4,0,.2,1)`, panel mount 240ms fade plus 4px rise, stagger 40ms. All disabled under `prefers-reduced-motion`. | Matches `.sweep` and Button in globals.css. |
| 14 | Loading / empty / error | Skeleton is a 1px border plus an 8% lime shimmer at 1.2s, never a spinner, no layout shift. Empty is a `.hud` line plus one sentence. Error is a `--signal` border plus Retry. | Per the `ui-contract` skill. |
| 15 | Scope | 5a: shell, sidebar, Overview, feed, classification, APIs. 5b: the remaining five pages. | Rule 4, one phase per session. |

## Out of scope (will NOT build)

- **Visitor identification** — gender, person-versus-organisation, intent inference. Rows 3 and 8
  leave the slot open; nothing is built. Shivam is supplying a separate requirements file.
- IP-to-company reverse lookup, third-party enrichment, cookies, device fingerprinting. All three
  would falsify `/privacy-policy`, whose cookieless claim is currently true.
- Backfilling or deleting the 38 bot rows. They are classified at read time, never destroyed.
- Deleting the `Kimberly Morrow` test lead. That is Shivam's call.
- Any public page, and Phase 4's undeployed `perf/phase-4` work.

## Acceptance criteria (binary)

- [ ] `/admin` login card contains no environment variable name.
- [ ] Overview defaults to HUMAN and shows **179** pageviews and **149** visitors; ALL shows **257** and **161**.
- [ ] The trend chart Y axis has no repeated tick label at 7d, 30d or 90d.
- [ ] ENGAGED reads `16` and `11% of 149`.
- [ ] The live feed appends a row within 20s of a pageview on any public page.
- [ ] The provenance strip prints four counts, and human + untagged + bot equals the ALL pageview total.
- [ ] The sidebar shows 4 group headings with subtitles at >=1280px, a 68px icon rail at 1100px, and a drawer at 480px.
- [ ] Every panel passes 4.5:1 contrast in light theme, checked rather than assumed.
- [ ] `Ctrl+K` opens the palette, Enter navigates, Esc closes, focus returns to the trigger.
- [ ] `npm run build` passes with zero new ESLint errors.
- [ ] Screenshots captured: login, Overview-HUMAN, Overview-ALL, empty feed, light theme.

## Risks

- **179 human views over 40 days means the panel will mostly show small numbers.** The design has to
  be good at small numbers; rows 7 and 14 exist for that. Build Overview first and screenshot it
  against the real database before building anything else.
- `country: "Unknown"` proves the geo header was absent, **not** that the visit was local. It stays
  its own `untagged` class and is never described as self-traffic.
- Polling at 20s costs roughly 180 serverless invocations per open hour. If that matters on the
  current plan, row 8 becomes 60s, which is a one-constant change.
