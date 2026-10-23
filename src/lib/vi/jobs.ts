/**
 * The radar job queue — the MongoDB half (spec docs/spec/phase-6c-radar-orchestration.md).
 *
 * Replaces fire-and-forget `after()` for rule runs and RDAP lookups. The routes
 * enqueue inside the request, so the work survives the instance; `drainJobs`
 * then runs due jobs from `after()` (up to 3, 8 s) and from the daily sweep
 * (up to 200, 50 s). The policy — coalescing, backoff, the attempt ceiling, the
 * lease — lives in jobs-core.ts and is unit tested there; this file only maps
 * its results onto atomic updates, so two instances can never run one job.
 */
import { dbConnect } from "@/lib/db";
import { openPrefix, sealPrefix } from "./cookies.ts";
import {
  INFER_JOB_TTL_MS,
  JOB_LEASE_MS,
  JOB_MAX_ATTEMPTS,
  NETWORK_JOB_TTL_MS,
  inferJobKey,
  networkJobKey,
  settle,
  type Job,
  type RunOutcome,
} from "./jobs-core.ts";
import { VIJob } from "./models.ts";
import { prefixFor, recordUnknownNetwork, runNetworkLookup, type NetworkEvidenceInput } from "./network.ts";
import type { NetworkPrefix } from "./network-core.ts";
import { getEngine } from "./server.ts";

type Doc = Record<string, unknown>;

type NetworkPayload = {
  sealed: string;
  sessionId: string;
  grantId: string;
  observedAt: Date;
  grantExpiresAt: Date;
};

const toJob = (d: Doc): Job => ({
  id: d._id as string,
  kind: d.kind as Job["kind"],
  siteId: d.siteId as string,
  epochId: d.epochId as string,
  state: d.state as Job["state"],
  attempts: (d.attempts as number) ?? 0,
  nextAttemptAt: (d.nextAttemptAt as Date) ?? null,
  lockedUntil: (d.lockedUntil as Date) ?? null,
  errorCode: (d.errorCode as string) ?? null,
  seq: (d.seq as number) ?? 0,
  expiresAt: d.expiresAt as Date,
});

/**
 * An accepted event: one atomic upsert that mirrors `enqueueInfer` in
 * jobs-core.ts. A pipeline update, because whether the job restarts depends on
 * its current state and a read-then-write would race the run that holds it.
 */
export async function queueInfer(siteId: string, epochId: string, now: Date): Promise<string> {
  const id = inferJobKey(epochId);
  const pending = { $eq: ["$state", "pending"] };
  await VIJob.collection.updateOne(
    { _id: id as never },
    [
      {
        $set: {
          kind: "infer",
          siteId,
          epochId,
          seq: { $add: [{ $ifNull: ["$seq", 0] }, 1] },
          attempts: { $cond: [pending, "$attempts", 0] },
          nextAttemptAt: { $cond: [pending, "$nextAttemptAt", now] },
          lockedUntil: { $cond: [pending, "$lockedUntil", null] },
          errorCode: { $cond: [pending, "$errorCode", null] },
          state: "pending",
          expiresAt: new Date(now.getTime() + INFER_JOB_TTL_MS),
        },
      },
    ],
    { upsert: true },
  );
  return id;
}

const encodePrefix = (p: NetworkPrefix) => `${p.network}/${p.length}|${p.family}`;

function decodePrefix(s: string | null): NetworkPrefix | null {
  if (!s) return null;
  const [cidr, fam] = s.split("|");
  const slash = cidr?.lastIndexOf("/") ?? -1;
  const length = Number(cidr?.slice(slash + 1));
  const family = Number(fam);
  if (slash < 1 || (length !== 24 && length !== 48) || (family !== 4 && family !== 6)) return null;
  return { network: cidr.slice(0, slash), length, family };
}

/**
 * A new session with the `organization` purpose. An address that cannot be
 * looked up is recorded as `unknown` at once; anything else is queued with the
 * network block sealed. Returns the job id, or null when nothing was queued.
 */
export async function queueNetwork(input: NetworkEvidenceInput): Promise<string | null> {
  const { ip, ...ctx } = input;
  const prefix = prefixFor(ip);
  if ("reason" in prefix) {
    await recordUnknownNetwork(ctx, prefix.reason);
    return null;
  }
  const id = networkJobKey(input.sessionId);
  const payload: NetworkPayload = {
    sealed: sealPrefix(encodePrefix(prefix)),
    sessionId: input.sessionId,
    grantId: input.grantId,
    observedAt: input.now,
    grantExpiresAt: input.grantExpiresAt,
  };
  try {
    await VIJob.create({
      _id: id,
      kind: "network",
      siteId: input.siteId,
      epochId: input.epochId,
      state: "pending",
      attempts: 0,
      nextAttemptAt: input.now,
      lockedUntil: null,
      errorCode: null,
      seq: 1,
      payload,
      expiresAt: new Date(input.now.getTime() + NETWORK_JOB_TTL_MS),
    });
  } catch (err) {
    // Two first requests of one session: the first one queued it.
    if ((err as { code?: number })?.code !== 11000) throw err;
  }
  return id;
}

/** Mirrors `isClaimable` + `claim` in jobs-core.ts, as one atomic update. */
async function claimOne(now: Date, id?: string): Promise<{ job: Job; payload: unknown } | null> {
  const filter: Doc = {
    state: "pending",
    nextAttemptAt: { $lte: now },
    $or: [{ lockedUntil: null }, { lockedUntil: { $lte: now } }],
  };
  if (id) filter._id = id;
  const d = await VIJob.findOneAndUpdate(
    filter,
    { $set: { lockedUntil: new Date(now.getTime() + JOB_LEASE_MS) }, $inc: { attempts: 1 } },
    { sort: { nextAttemptAt: 1 }, returnDocument: "after" },
  ).lean<Doc>();
  return d ? { job: toJob(d), payload: d.payload } : null;
}

async function run(job: Job, payload: unknown): Promise<RunOutcome> {
  if (job.kind === "infer") {
    const engine = await getEngine();
    if (!engine) return { ok: false, code: "disabled" };
    try {
      // infer() re-checks grants and tombstones itself (R08, R48).
      await engine.infer(job.siteId, job.epochId, new Date());
      return { ok: true };
    } catch {
      return { ok: false, code: "infer_failed" };
    }
  }

  const p = payload as Partial<NetworkPayload> | null;
  const ctx = {
    siteId: job.siteId,
    epochId: job.epochId,
    sessionId: p?.sessionId ?? "",
    grantId: p?.grantId ?? "",
    now: p?.observedAt ? new Date(p.observedAt) : new Date(),
    grantExpiresAt: p?.grantExpiresAt ? new Date(p.grantExpiresAt) : new Date(),
  };
  const prefix = decodePrefix(openPrefix(p?.sealed));
  if (!prefix || !ctx.sessionId || !ctx.grantId) {
    // The key changed or the row was altered: no retry can read it.
    if (ctx.sessionId && ctx.grantId) await recordUnknownNetwork(ctx, "lookup_failed");
    return { ok: false, code: "payload_unreadable", permanent: true };
  }
  try {
    return await runNetworkLookup(ctx, prefix, job.attempts >= JOB_MAX_ATTEMPTS);
  } catch {
    return { ok: false, code: "server_error" };
  }
}

/**
 * Writes `settle()`'s result, conditional on still holding the lease and on
 * `seq` being what was read. If an event slipped in between, re-read and
 * settle again, so its run is never marked done by mistake.
 */
async function finish(claimed: Job, outcome: RunOutcome): Promise<Job["state"] | null> {
  for (let i = 0; i < 3; i++) {
    const d = await VIJob.findOne({ _id: claimed.id }).lean<Doc>();
    // Erased while it ran (withdrawal deletes the epoch's jobs), or reclaimed after the lease lapsed.
    if (!d) return null;
    const current = toJob(d);
    if (current.lockedUntil?.getTime() !== claimed.lockedUntil?.getTime()) return null;

    const next = settle(claimed, current, outcome, new Date());
    const terminal = next.state !== "pending";
    const res = await VIJob.updateOne(
      { _id: claimed.id, lockedUntil: claimed.lockedUntil, seq: current.seq },
      {
        $set: {
          state: next.state,
          attempts: next.attempts,
          nextAttemptAt: next.nextAttemptAt,
          lockedUntil: null,
          errorCode: next.errorCode,
        },
        // The sealed block goes the moment it is no longer needed (spec row 6).
        ...(terminal ? { $unset: { payload: 1 } } : {}),
      },
    );
    if (res.matchedCount === 1) return next.state;
  }
  return null;
}

export type DrainResult = { ran: number; done: number; pending: number; failed: number };

/**
 * Runs due jobs until `limit` have run or `budgetMs` has passed. `first` names
 * jobs to try before the rest (the request's own). The budget is checked before
 * each claim, so one slow lookup can overrun it, never start another.
 */
export async function drainJobs(opts: { limit: number; budgetMs: number; first?: string[] }): Promise<DrainResult | null> {
  if (!(await dbConnect())) return null;
  const result: DrainResult = { ran: 0, done: 0, pending: 0, failed: 0 };
  const started = Date.now();
  const first = [...(opts.first ?? [])];

  while (result.ran < opts.limit && Date.now() - started < opts.budgetMs) {
    const now = new Date();
    let claimed: Awaited<ReturnType<typeof claimOne>> = null;
    while (!claimed && first.length) claimed = await claimOne(now, first.shift());
    claimed ??= await claimOne(now);
    if (!claimed) break;

    const outcome = await run(claimed.job, claimed.payload);
    const state = await finish(claimed.job, outcome);
    result.ran += 1;
    if (state === "done") result.done += 1;
    else if (state === "failed") result.failed += 1;
    else if (state === "pending") result.pending += 1;
  }
  return result;
}
