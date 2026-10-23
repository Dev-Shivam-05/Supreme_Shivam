/**
 * Radar job queue — the pure half (spec 6c).
 *
 *   npm run test:vi
 *
 * Pins the queue policy: one job per journey and per session, bursts coalesce
 * without losing an event, failures back off 1/2/4/8 min and stop at five, a
 * dead run's lease expires, and the sealed network block opens only to itself.
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  INFER_COALESCE_MS,
  JOB_LEASE_MS,
  JOB_MAX_ATTEMPTS,
  claim,
  enqueueInfer,
  inferJobKey,
  isClaimable,
  networkJobKey,
  settle,
  type Job,
} from "./jobs-core.ts";
import { openPrefix, sealPrefix } from "./cookies.ts";

const T0 = new Date("2026-10-23T10:00:00Z");
const at = (ms: number) => new Date(T0.getTime() + ms);
const MIN = 60_000;

describe("keys", () => {
  test("one infer job per journey, one network job per session", () => {
    assert.equal(inferJobKey("ep-1"), "infer:ep-1");
    assert.equal(networkJobKey("s-1"), "network:s-1");
  });
});

describe("coalescing", () => {
  test("the first event is due at once", () => {
    const j = enqueueInfer(null, "site", "ep", T0);
    assert.equal(j.state, "pending");
    assert.equal(j.nextAttemptAt?.getTime(), T0.getTime());
    assert.ok(isClaimable(j, T0));
  });

  test("twenty events in a burst leave one job", () => {
    let j: Job | null = null;
    for (let i = 0; i < 20; i++) j = enqueueInfer(j, "site", "ep", at(i * 250));
    assert.equal(j!.id, "infer:ep");
    assert.equal(j!.seq, 20);
    assert.equal(j!.state, "pending");
  });

  test("an event during a run is not lost: the job stays pending, due after the gap", () => {
    let j = enqueueInfer(null, "site", "ep", T0);
    const claimed = claim(j, T0);
    j = enqueueInfer(claimed, "site", "ep", at(1000));
    const after = settle(claimed, j, { ok: true }, at(2000));
    assert.equal(after.state, "pending");
    assert.equal(after.nextAttemptAt?.getTime(), at(2000 + INFER_COALESCE_MS).getTime());
    assert.equal(after.lockedUntil, null);
    assert.ok(!isClaimable(after, at(2000 + INFER_COALESCE_MS - 1)));
    assert.ok(isClaimable(after, at(2000 + INFER_COALESCE_MS)));
  });

  test("a run with nothing new behind it is done; the next event waits out the gap", () => {
    const claimed = claim(enqueueInfer(null, "site", "ep", T0), T0);
    const done = settle(claimed, claimed, { ok: true }, at(500));
    assert.equal(done.state, "done");
    const again = enqueueInfer(done, "site", "ep", at(900));
    assert.equal(again.state, "pending");
    assert.equal(again.attempts, 0);
    assert.equal(again.nextAttemptAt?.getTime(), at(500 + INFER_COALESCE_MS).getTime());
  });

  test("events slower than a run still get at most one run per 10 s", () => {
    let j: Job | null = null;
    let runs = 0;
    // One event every 400 ms for 20 s, a drain after each, each run taking 100 ms.
    for (let t = 0; t < 20_000; t += 400) {
      j = enqueueInfer(j, "site", "ep", at(t));
      if (isClaimable(j, at(t))) {
        const c = claim(j, at(t));
        j = settle(c, c, { ok: true }, at(t + 100));
        runs++;
      }
    }
    assert.ok(runs <= 2, `${runs} runs in 20 s`);
  });

  test("an event long after the last run is due at once", () => {
    const c = claim(enqueueInfer(null, "site", "ep", T0), T0);
    const done = settle(c, c, { ok: true }, at(100));
    const later = enqueueInfer(done, "site", "ep", at(60_000));
    assert.equal(later.nextAttemptAt?.getTime(), at(60_000).getTime());
  });
});

describe("retries", () => {
  test("backoff is 1, 2, 4, 8 min, then failed on the fifth attempt", () => {
    let j = enqueueInfer(null, "site", "ep", T0);
    let now = T0;
    const gaps: number[] = [];
    for (let i = 1; i <= JOB_MAX_ATTEMPTS; i++) {
      assert.ok(isClaimable(j, now), `attempt ${i} claimable`);
      const c = claim(j, now);
      assert.equal(c.attempts, i);
      j = settle(c, c, { ok: false, code: "lookup_failed" }, now);
      if (j.state === "pending") {
        gaps.push(j.nextAttemptAt!.getTime() - now.getTime());
        now = j.nextAttemptAt!;
      }
    }
    assert.deepEqual(gaps, [1 * MIN, 2 * MIN, 4 * MIN, 8 * MIN]);
    assert.equal(j.state, "failed");
    assert.equal(j.errorCode, "lookup_failed");
    assert.ok(!isClaimable(j, at(365 * 24 * 60 * MIN)));
  });

  test("a permanent failure stops at once", () => {
    const c = claim(enqueueInfer(null, "site", "ep", T0), T0);
    const j = settle(c, c, { ok: false, code: "payload_unreadable", permanent: true }, T0);
    assert.equal(j.state, "failed");
    assert.equal(j.attempts, 1);
  });

  test("a run that died keeps its lease for 60 s, then can be claimed again", () => {
    const c = claim(enqueueInfer(null, "site", "ep", T0), T0);
    assert.ok(!isClaimable(c, at(JOB_LEASE_MS - 1)));
    assert.ok(isClaimable(c, at(JOB_LEASE_MS)));
    assert.equal(claim(c, at(JOB_LEASE_MS)).attempts, 2, "the dead run used up an attempt");
  });
});

describe("sealed network block", () => {
  process.env.VI_SECRET = "test-secret-test-secret-test-secret-00";

  test("round-trips and never contains the block in the clear", () => {
    const sealed = sealPrefix("49.36.0.0/24|4");
    assert.equal(openPrefix(sealed), "49.36.0.0/24|4");
    assert.ok(!sealed.includes("49.36"));
    assert.doesNotMatch(Buffer.from(sealed, "base64url").toString("latin1"), /49\.36\.0\.0/);
  });

  test("two seals of one block differ (random IV)", () => {
    assert.notEqual(sealPrefix("2001:db8:1::/48|6"), sealPrefix("2001:db8:1::/48|6"));
  });

  test("tampered, truncated or foreign values open to null", () => {
    const sealed = sealPrefix("49.36.0.0/24|4");
    const raw = Buffer.from(sealed, "base64url");
    raw[raw.length - 1] ^= 1;
    assert.equal(openPrefix(raw.toString("base64url")), null);
    assert.equal(openPrefix(sealed.slice(0, 20)), null);
    assert.equal(openPrefix(42), null);
    process.env.VI_SECRET = "another-secret-another-secret-another-1";
    assert.equal(openPrefix(sealed), null);
  });
});
