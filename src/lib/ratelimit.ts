/**
 * Tiny in-memory fixed-window limiter. Per-instance only — fine for a
 * portfolio; swap for Redis/Upstash when you scale horizontally.
 */
const hits = new Map<string, { count: number; ts: number }>();

/** Above this many keys, expired windows are swept so the map cannot grow without bound. */
const PRUNE_AT = 5_000;

export function rateLimit(key: string, limit = 5, windowMs = 60_000) {
  const now = Date.now();
  if (hits.size > PRUNE_AT) {
    for (const [k, r] of hits) if (now - r.ts > windowMs) hits.delete(k);
  }
  const rec = hits.get(key);
  if (!rec || now - rec.ts > windowMs) {
    hits.set(key, { count: 1, ts: now });
    return { ok: true, remaining: limit - 1 };
  }
  rec.count += 1;
  if (rec.count > limit) return { ok: false, remaining: 0 };
  return { ok: true, remaining: limit - rec.count };
}
