# Phase 6b — Data from the first page load

Status: **approved `go` 2026-10-23.** First of the "Visitor Radar" master-prompt phases (6b–6g, see
`docs/PHASES.md`). Built inside `visitor_intelligence_reference/`: no per-visitor record before
consent.

## Locked decisions

| # | Ambiguity | Locked value | Why this default |
|---|---|---|---|
| 1 | When the consent card appears | On the first page load when this device has no stored choice. The card's chunk loads after `requestIdleCallback` with a 1200 ms cap (`VIRoot`; 1200 ms timeout where there is no idle callback), and the card prompts as soon as it mounts. Still bottom-left, non-modal, two equal buttons. | One click on "Allow" starts the journey on the landing page, without competing with Phase 4 LCP work. |
| 2 | Arrival category for every visitor | The beacon sends `entry`, computed with `classifyEntry()` from `lib/vi/catalog.ts` (the journey tracker's code) on the first view of a page load, `internal` after it. The server stores it only if it is in `ENTRY_CATEGORIES`, else `"unknown"`. | "How they came" for 100% of visitors, as a code, not a URL. |
| 3 | Landing page for every visitor | `contentId` derived **server-side** from the path with `contentIdForPath()`, fallback `"unlisted"`. Never taken from the browser. | README: content IDs instead of URLs. |
| 4 | Location without consent | `region` from `x-vercel-ip-country-region`, `timezone` from `x-vercel-ip-timezone`, `"Unknown"` when absent or malformed. Every row carries `geoSource: "ip_network"` — a network estimate, not the visitor's position. **No city** in this tier. | City + daily hash + device narrows to a person in a small town. City waits for consent (Phase 6d). |
| 5 | Admin | One Overview panel: arrival category and landing page across all visitors, beside Countries. | Smallest UI that proves the fields are collected. |
| 6 | Privacy policy | The anonymous-statistics section names `entry`, `contentId`, `region`, `timezone`. | It must never claim less than the code collects. |
| 7 | Network-kind aggregate counts (grey area) | **Not built** — Shivam replied `go` without `yes 7`. | Organisation lookup is a separate purpose in the reference. |

## Out of scope

- Any per-visitor record, link, network owner or hypothesis before consent; buffering pre-consent
  pages in the browser and sending them after "Allow". Forbidden by the reference.
- City, coordinates and postal code in the aggregate tier.

## Acceptance criteria (binary)

- [ ] With no stored choice, the card is visible ≤ 2 s after first load at 1440 px and 390 px (screenshots).
- [ ] Mobile Lighthouse Performance on `/` within 2 points of `main`.
- [ ] A new `/api/collect` row on the test database carries `entry`, `contentId`, `region`, `timezone`, `geoSource`; an invalid `entry` is stored as `"unknown"`.
- [ ] human + untagged + bot still sum to all pageviews.
- [ ] `npm run test:vi` green; end-to-end re-run green on the test database.
- [ ] Privacy policy names the four new fields.

## Risks

- Vercel IP headers do not exist locally: tested with injected headers, confirmed on the first deploy.
- 5a and 6 are unmerged; 6b stacks on `feat/phase-6-visitor-intelligence`.
