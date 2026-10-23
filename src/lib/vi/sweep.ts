/**
 * The daily visitor-intelligence sweep (spec §5 step 7). Shared by the Vercel
 * cron route and the admin "run sweep" button so both do exactly the same work.
 *
 * TTL indexes delete most expired rows on their own; the sweep exists for what
 * a TTL cannot do: mark windows closed at `endsAt`, write the expiry tombstone,
 * re-delete rows of a tombstoned epoch that an interrupted erase or a restored
 * backup left behind (spec D7, D8), and drive remote deletion jobs.
 */
import type { DeletionAdapter } from "./engine.ts";
import { drainJobs } from "./jobs.ts";
import { getEngine } from "./server.ts";
import { SITE_ID } from "./policy.ts";

/**
 * One adapter per export destination, keyed by `ExportRecord.destination`.
 * Empty: nothing is exported anywhere today (spec D10). Add the adapter here in
 * the same change that adds an exporter, so erasure can never be skipped.
 */
export const DESTINATIONS: Record<string, DeletionAdapter> = {};

export type SweepResult = { expired: number; closed: number; reconciled: number; jobsRun: number; radarRun: number };

/** Null when the feature is off or the database is unreachable. */
export async function runSweep(now = new Date()): Promise<SweepResult | null> {
  const engine = await getEngine();
  if (!engine) return null;

  const { expired, closed } = await engine.expire(now);
  const reconciled = await engine.reconcile(SITE_ID);

  const jobsRun = (await engine.store.listDeletionJobs()).length;
  await engine.runDeletionJobs((job) => {
    const adapter = DESTINATIONS[job.destination];
    // An unknown destination is NOT treated as done. It stays pending, backs
    // off, and is marked failed once its 30-day deadline passes — a visible
    // failure instead of a silent "verified". README: "An HTTP 202 is
    // acceptance, not proof of completed erasure"; no answer at all is less.
    if (!adapter) return false;
    return adapter(job);
  }, now);

  // The catch-all for radar jobs no visitor's request picked up (spec 6c row 8).
  const radar = await drainJobs({ limit: 200, budgetMs: 50_000 });

  return { expired, closed, reconciled, jobsRun, radarRun: radar?.ran ?? 0 };
}
