# HANDOFF — Supreme_Shivam — Phase 6c (Radar orchestration) — 2026-10-23

Branch `feat/phase-6c-radar`, pushed, **no PR yet, not deployed**. It is stacked on
`feat/phase-6b-first-click` (also unmerged), so a PR from 6c contains 6b as well.
Spec: `docs/spec/phase-6c-radar-orchestration.md` (approved `go`; row 3 amended twice, both approved).

## Done
- Rule runs and RDAP lookups now go through a durable `vi_jobs` queue. Jobs are enqueued inside the
  request and drained from `after()` (3 jobs / 8 s) and by the daily sweep (200 / 50 s).
- A burst of 20 events produces exactly 1 `infer` job. The first event runs at once, and later runs
  come at most once every 10 s per journey, with no event left unscored.
- An RDAP lookup that fails is retried after 1, 2, 4 and 8 min. If all 5 attempts fail, the job is
  `failed` and one `unknown` row is written. A retry that succeeds writes the normal `inferred` row.
- The /24 or /48 network block is kept AES-256-GCM-sealed for at most 24 h and is removed once the
  job settles. A scan of `vi_jobs` found no plaintext address.
- Withdrawal deletes the epoch's jobs, and nothing is written for that epoch afterwards.
- The privacy policy now discloses the sealed retry.
- Verified: `npm run test:vi` 114/114. The new queue end-to-end suite passed 22/22 and the
  regression end-to-end suite 63/63, both on a freshly dropped `shivambhadoriya_vi_test`, which was
  dropped again afterwards.

## Files changed
- `src/lib/vi/jobs-core.ts` (new): the queue policy as pure functions (keys, coalescing, backoff, the 5-attempt ceiling, the lease).
- `src/lib/vi/jobs-core.test.ts` (new): 13 tests for that policy and for the sealed block.
- `src/lib/vi/jobs.ts` (new): the MongoDB side: `queueInfer` (pipeline upsert), `queueNetwork`, `drainJobs`.
- `src/lib/vi/cookies.ts`: `sealPrefix` / `openPrefix` under the `job-prefix` subkey.
- `src/lib/vi/network.ts`: `recordNetworkEvidence` split into `prefixFor`, `recordUnknownNetwork` and `runNetworkLookup` (which returns whether to retry).
- `src/lib/vi/models.ts`: the `vi_jobs` schema (TTL on `expiresAt`, plus a `state,nextAttemptAt` index).
- `src/lib/vi/mongo-store.ts`: `eraseEpochData` also deletes `vi_jobs`.
- `src/lib/vi/sweep.ts`: the sweep drains radar jobs and reports `radarRun`.
- `src/app/api/vi/event/route.ts`, `src/app/api/vi/grant/route.ts`: enqueue, then drain in `after()`. The `lastInfer` debounce map is gone.
- `src/app/api/vi/sweep/route.ts`, `src/app/api/admin/vi/sweep/route.ts`: `maxDuration = 60`.
- `src/lib/legal.ts`: one sentence on the sealed retry.
- Docs: the spec, `docs/DECISIONS.md`, `docs/PHASES.md`, `docs/spec/GLOSSARY.md`, and `AGENTS.md` (traps).

## Decisions made
- The network block is sealed, not hashed: a hash cannot be looked up again. It lives at most
  24 h, and a root-key rotation makes pending jobs fail permanently (`payload_unreadable`).
- Jobs are enqueued inside the request, not in `after()`, so the work outlives the instance. The
  cost is one extra DB write per event (the beacon uses keepalive, so no visitor waits on it).
- `lastRunAt` + 10 s holds back the next run, because without it a slow-clicking visitor got one
  run per event.
- Run Radar moved to 6c.2 and per-purpose withdrawal to 6c.3, to stay within the file budget.

## Known broken / deliberately skipped
- No admin Run Radar button yet (6c.2). On a quiet site a trailing rule run or retry waits for the
  next visitor, the 03:30 sweep, or someone opening the journey in the admin.
- If no request comes within 24 h, a network job expires through TTL and leaves no `network_owner`
  row for that session (neither `inferred` nor `unknown`).
- The `after()` duration on Vercel is unmeasured: a lookup can overrun the 8 s budget (it is checked
  before each claim). Check a function log after deploy.
- Still open from 6b: `CRON_SECRET` is not set in Vercel, and the 5a/6 deploy is not confirmed.
- The old scratchpad worktree `wt-main` is still registered (`git worktree list`) because
  removing it was denied earlier.
- The end-to-end harness is still not in the repo (see below).

## Next session starts here
- Phase 6c.2: an admin Run Radar button (per journey and global) plus a pending/failed jobs line in journey detail. Spec-lock first.
- First command: `git checkout feat/phase-6c-radar && git pull && npm run test:vi`
- Watch out for: the harness lives only in
  `C:\Users\shiva\AppData\Local\Temp\claude\d--Projects-Supreme-Shivam\597078ea-0185-4dba-9de7-73d7b201374d\scratchpad\e2e\`
  (`e2e-vi.mjs`, `e2e-6c.mjs`, `serve.mjs`, `drop-test.mjs`, `register.mjs`, `alias-hooks.mjs`,
  `test.env.json`). Copy it out first. Drop the test DB before a run, or leftover rows fail 3 checks.
