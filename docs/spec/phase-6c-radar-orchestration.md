# Phase 6c — Radar orchestration

Approved `go` by Shivam, 2026-10-23. Branch `feat/phase-6c-radar` (off `feat/phase-6b-first-click`).

## Problem

- A rule run (`engine.infer`) skipped by the 10 s per-instance debounce in `api/vi/event` was
  dropped. Only the next event, or opening the journey in the admin, caught it up.
- An RDAP lookup that failed or hit the per-minute limit was written as permanent `unknown`
  evidence and never retried (the `exists` check in `recordNetworkEvidence` stops a second try).
- All of it ran in fire-and-forget `after()`: an instance that dies mid-run loses the work.
- Vercel cron here runs once a day (`vercel.json`), so a queue cannot rely on cron alone.

## Locked decisions

| # | Topic | Locked value |
|---|---|---|
| 1 | Queue | Collection `vi_jobs`. `_id` = idempotency key. Fields `kind` (`infer`\|`network`), `siteId`, `epochId`, `state` (`pending`\|`done`\|`failed`), `attempts`, `nextAttemptAt`, `lockedUntil`, `errorCode` (code only, never a message), `payload`, `seq`, `expiresAt` (TTL). `expiresAt` = last enqueue + 48 h for `infer` (outlives the gap between daily sweeps), + 24 h for `network` (row 6). |
| 2 | Idempotency keys | `infer:<epochId>`, `network:<sessionId>`. Enqueue is an upsert; a duplicate is a no-op. |
| 3 | Debounce replacement (amended, approved 2026-10-23) | Each accepted event upserts `infer:<epochId>` and bumps its `seq`. A job that is not `pending` becomes `pending`, due **now** (leading edge, as the old debounce). An event that arrives while the job is pending or running only bumps `seq`. A run that finishes with `seq` unchanged marks the job `done`; with `seq` changed it stays `pending`, due **10 s after the run**. So at most one run per 10 s per journey, and no event is left unscored: the trailing run is picked up by the next request, the daily sweep, or opening the journey in the admin (which already recomputes). The in-memory `lastInfer` map is removed. Was: every run due at `now + 10 s`, which on a quiet site would wait for the next visitor. |
| 4 | Retries | Max 5 attempts. Backoff `backoffMs()` from `engine.ts`: 1, 2, 4, 8 min. After the 5th failure the job is `failed`. |
| 5 | RDAP failures retried | `lookup_failed`, `rate_limited`. Terminal at once (unknown evidence, as before): `no_address`, `private_address`, `invalid_address`, `no_registry`. A job that exhausts its attempts writes `unknown` evidence with its last reason. |
| 6 | Network job payload (security) | The /24 or /48 network block only, never the full IP, sealed with AES-256-GCM under a subkey labelled `job-prefix` of the VI root key. `expiresAt` = enqueue + 24 h. Payload is unset when the job reaches `done` or `failed`. |
| 7 | Concurrency | Claim with `findOneAndUpdate`, setting `lockedUntil = now + 60 s`; a crashed run is reclaimable after 60 s. Permission and tombstone are re-checked before running (R08). |
| 8 | Drain triggers | (a) `after()` of `/api/vi/event` and `/api/vi/grant`: up to 3 due jobs or 8 s. (b) Daily sweep: up to 200 jobs or 50 s. |
| 9 | Erasure | `eraseEpochData` also deletes `vi_jobs` for the epoch. |
| 10 | Privacy policy | Organisation-lookup paragraph gains: "If the registry does not answer, the network block is kept encrypted for at most 24 hours so the lookup can be retried, then deleted." |
| 11 | Scope split | 6c = rows 1–10. **6c.2** = admin Run Radar (per journey + global) and a jobs line in journey detail. **6c.3** = per-purpose withdrawal (changes the reference policy; own spec). |

## Out of scope

- Run Radar UI (6c.2), per-purpose withdrawal (6c.3).
- Retrying `unknown` rows written before this phase: their network block was never kept.
- Paid cron, external queue services.

## Acceptance criteria

- [ ] `npm run test:vi`: the 101 existing tests plus new `jobs-core` tests (key format, coalescing,
      backoff 1/2/4/8 min, `failed` after 5, lease expiry, seal/open round trip) all pass.
- [ ] E2E on `shivambhadoriya_vi_test`: 20 events within 5 s → exactly 1 `infer` job; after
      the next drain (≥ 10 s later) the job is `done` and stored insights reflect all 20 events.
- [ ] E2E: RDAP fails once then succeeds → one `network_owner` row `inferred`, job `done`, `attempts = 2`.
- [ ] E2E: RDAP always fails → job `failed` after 5 attempts; one `unknown` row, reason `lookup_failed`.
- [ ] E2E: withdraw while a job is pending → 0 `vi_jobs` rows for that epoch; no evidence written after.
- [ ] No plaintext network block in `vi_jobs` (regex for dotted-quad and colon-hex finds nothing).
- [ ] The previous 63/63 end-to-end checks still pass.

## Risks

- On a quiet site a retry waits for the next visitor or the daily sweep, until 6c.2 adds a manual run.
- The `after()` time budget on Vercel Hobby is unmeasured; the 8 s cap guards it. Check a function
  log after deploy.
