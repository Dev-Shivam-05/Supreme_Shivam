/**
 * The radar job queue — the pure half (spec docs/spec/phase-6c-radar-orchestration.md).
 *
 * Every state change a job can go through is a function here, so the test
 * suite pins the policy (keys, coalescing, backoff, the attempt ceiling, the
 * lease) and jobs.ts only translates these results into MongoDB updates.
 */
import { backoffMs } from "./engine.ts";

export type JobKind = "infer" | "network";
export type JobState = "pending" | "done" | "failed";

export type Job = {
  id: string;
  kind: JobKind;
  siteId: string;
  epochId: string;
  state: JobState;
  /** Counted at claim time, so a run that dies mid-way still uses up an attempt. */
  attempts: number;
  nextAttemptAt: Date | null;
  lockedUntil: Date | null;
  errorCode: string | null;
  /** Bumped by every enqueue. A run that finishes with a different seq missed an event. */
  seq: number;
  expiresAt: Date;
};

export const JOB_MAX_ATTEMPTS = 5;
export const JOB_LEASE_MS = 60_000;
/** At most one rule run per journey per this interval (Phase 6 security finding #2). */
export const INFER_COALESCE_MS = 10_000;
/** A pending infer job must outlive the gap between two daily sweeps. */
export const INFER_JOB_TTL_MS = 48 * 3_600_000;
/** The sealed network block is kept no longer than this. */
export const NETWORK_JOB_TTL_MS = 24 * 3_600_000;

/** Lookup failures worth another try. Everything else is a fact about the address and is final. */
export const RETRYABLE_NETWORK_REASONS = ["lookup_failed", "rate_limited"] as const;

export const inferJobKey = (epochId: string) => `infer:${epochId}`;
export const networkJobKey = (sessionId: string) => `network:${sessionId}`;

const plus = (d: Date, ms: number) => new Date(d.getTime() + ms);

/**
 * An accepted event for this journey. A job that is not pending becomes due
 * now (the leading edge); one that is pending or running only records, via
 * `seq`, that there is something new to score.
 */
export function enqueueInfer(existing: Job | null, siteId: string, epochId: string, now: Date): Job {
  const expiresAt = plus(now, INFER_JOB_TTL_MS);
  if (existing && existing.state === "pending") return { ...existing, seq: existing.seq + 1, expiresAt };
  return {
    id: inferJobKey(epochId),
    kind: "infer",
    siteId,
    epochId,
    state: "pending",
    attempts: 0,
    nextAttemptAt: now,
    lockedUntil: null,
    errorCode: null,
    seq: (existing?.seq ?? 0) + 1,
    expiresAt,
  };
}

export function isClaimable(job: Job, now: Date) {
  if (job.state !== "pending") return false;
  if (job.nextAttemptAt && job.nextAttemptAt.getTime() > now.getTime()) return false;
  return !job.lockedUntil || job.lockedUntil.getTime() <= now.getTime();
}

export function claim(job: Job, now: Date): Job {
  return { ...job, attempts: job.attempts + 1, lockedUntil: plus(now, JOB_LEASE_MS) };
}

export type RunOutcome = { ok: true } | { ok: false; code: string };

/**
 * What a finished run leaves behind. `current` is the job as stored now, which
 * may have been re-enqueued while the run held the lease.
 */
export function settle(claimed: Job, current: Job, outcome: RunOutcome, now: Date): Job {
  if (outcome.ok) {
    if (current.seq !== claimed.seq) {
      // Events arrived during the run: score them once, after the coalescing gap.
      return { ...current, attempts: 0, errorCode: null, lockedUntil: null, nextAttemptAt: plus(now, INFER_COALESCE_MS) };
    }
    return { ...current, state: "done", errorCode: null, lockedUntil: null, nextAttemptAt: null };
  }
  if (claimed.attempts >= JOB_MAX_ATTEMPTS) {
    return { ...current, state: "failed", errorCode: outcome.code, lockedUntil: null, nextAttemptAt: null };
  }
  return {
    ...current,
    errorCode: outcome.code,
    lockedUntil: null,
    nextAttemptAt: plus(now, backoffMs(claimed.attempts)),
  };
}
