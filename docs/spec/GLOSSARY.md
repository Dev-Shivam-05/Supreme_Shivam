# Glossary

Terms with a fixed meaning in this project. Do not redefine them in a later spec.

| Term | Meaning |
|---|---|
| Aggregate tier | The cookieless `/api/collect` → `events` collection. No consent; a keyed daily hash is the only visitor key; raw rows expire at 180 days. |
| Journey | The consented `vi_*` records of one browser epoch, inside a fixed 15-day window, erased at day 22. |
| Landing view | The first pageview of a page load. Its `entry` is the arrival category; every later view in the load is `internal`. |
| Entry | One `ENTRY_CATEGORIES` code from `lib/vi/catalog.ts`, or `unknown` in the aggregate tier when the beacon sent something else. |
| Content ID | A key of `CONTENT` in `lib/vi/catalog.ts`; `unlisted` in the aggregate tier for any path not in the catalog. |
| Network location | Country, region, time zone from Vercel's IP headers (`geoSource: "ip_network"`). Where the connection appears to be, not where the person is. |
| Compact card | The first-load consent prompt: No thanks · Allow (journey only) · Choose (opens the full card). |
| Full card | The three-switch consent card; opened by Choose or by the footer's Privacy choices. |
| Radar job | One row of `vi_jobs`: an `infer` (rule run) for a journey or a `network` (RDAP lookup) for a session. `_id` is the idempotency key. |
| Drain | `drainJobs()` in `lib/vi/jobs.ts`: claims due jobs under a 60 s lease and runs them, bounded by a count and a time budget. |
| Sealed block | A network block encrypted for a queued RDAP retry (`sealPrefix` in `lib/vi/cookies.ts`); lives ≤ 24 h. |
