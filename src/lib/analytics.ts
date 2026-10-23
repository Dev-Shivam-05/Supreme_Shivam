import { dbConnect } from "./db";
import { Event } from "@/models/event";
import { Lead } from "@/models/lead";

const DAY = 86_400_000;

export type VisitorClass = "human" | "untagged" | "bot";
export type ClassFilter = VisitorClass | "all";
export type RangeKey = "7d" | "30d" | "all";

/**
 * Labels one event `human`, `untagged` or `bot`.
 *
 * This runs as a `$switch` inside the aggregation rather than reading a stored
 * field, because 257 events were already banked before the field existed and a
 * number that only counts rows written after the fix is worse than no number.
 * New events also store the same label (see api/collect) — this stage simply
 * recomputes it, so one rule governs old and new rows alike.
 *
 * `bot` is the conservative branch: headless Chrome is the project's own
 * Lighthouse and `scripts/cdp.mjs` runs, and an empty browser or OS means
 * ua-parser could not identify the client at all.
 *
 * `untagged` means `x-vercel-ip-country` was absent. That proves the request
 * did not carry a geo header — it does NOT prove the visit was local, so it is
 * never counted as human and never described as self-traffic.
 */
const VISITOR_CLASS = {
  $switch: {
    branches: [
      {
        case: {
          $or: [
            { $in: [{ $ifNull: ["$browser", ""] }, ["Chrome Headless", ""]] },
            { $eq: [{ $ifNull: ["$os", ""] }, ""] },
          ],
        },
        then: "bot",
      },
      { case: { $eq: [{ $ifNull: ["$country", "Unknown"] }, "Unknown"] }, then: "untagged" },
    ],
    default: "human",
  },
};

const WITH_CLASS = { $addFields: { visitorClass: VISITOR_CLASS } };

/** Days each range covers, or null for "every event ever recorded". */
const RANGE_DAYS: Record<RangeKey, number | null> = { "7d": 7, "30d": 30, all: null };

function rangeMatch(range: RangeKey) {
  const days = RANGE_DAYS[range];
  if (!days) return { type: "pageview" } as Record<string, unknown>;
  return { type: "pageview", createdAt: { $gte: new Date(Date.now() - days * DAY) } };
}

function classMatch(klass: ClassFilter) {
  return klass === "all" ? {} : { visitorClass: klass };
}

export type SeriesPoint = { date: string; human: number; untagged: number; bot: number };

/** Daily rollup, split by class so the chart can stack human over bot. */
async function dailySeries(range: RangeKey) {
  const rows = await Event.aggregate([
    { $match: rangeMatch(range) },
    WITH_CLASS,
    {
      $group: {
        _id: {
          date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          klass: "$visitorClass",
        },
        views: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: "$_id.date",
        buckets: { $push: { k: "$_id.klass", v: "$views" } },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const byDate = new Map<string, SeriesPoint>();
  for (const r of rows as { _id: string; buckets: { k: VisitorClass; v: number }[] }[]) {
    const point: SeriesPoint = { date: r._id, human: 0, untagged: 0, bot: 0 };
    for (const b of r.buckets) point[b.k] = b.v;
    byDate.set(r._id, point);
  }
  if (byDate.size === 0) return [];

  // Days with no traffic are absent from the aggregation. Plotting only the
  // days that exist would compress a three-week gap into one flat segment and
  // read as steady traffic, so every missing day is filled with an explicit
  // zero and the gap stays visible.
  const keys = [...byDate.keys()].sort();
  const start = RANGE_DAYS[range] ? new Date(Date.now() - RANGE_DAYS[range]! * DAY) : new Date(`${keys[0]}T00:00:00Z`);
  const out: SeriesPoint[] = [];
  for (let t = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()); t <= Date.now(); t += DAY) {
    const key = new Date(t).toISOString().slice(0, 10);
    out.push(byDate.get(key) ?? { date: key, human: 0, untagged: 0, bot: 0 });
  }
  return out;
}

async function topBy(field: string, range: RangeKey, klass: ClassFilter, limit = 6) {
  const rows = await Event.aggregate([
    { $match: rangeMatch(range) },
    WITH_CLASS,
    { $match: classMatch(klass) },
    { $group: { _id: `$${field}`, count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: limit },
  ]);
  return rows.map((r: { _id: string | null; count: number }) => ({ label: r._id || "—", count: r.count }));
}

/** How many events fall in each class — the provenance strip reads this. */
async function classBreakdown(range: RangeKey) {
  const rows = await Event.aggregate([
    { $match: rangeMatch(range) },
    WITH_CLASS,
    { $group: { _id: "$visitorClass", count: { $sum: 1 } } },
  ]);
  const out: Record<VisitorClass, number> = { human: 0, untagged: 0, bot: 0 };
  for (const r of rows as { _id: VisitorClass; count: number }[]) out[r._id] = r.count;
  return out;
}

/**
 * Sessions, and how many of them read more than one page.
 *
 * `sessionId` is a salted hash that rotates at UTC midnight, so one person
 * across ten days produces ten ids. These are session-days, not people, and the
 * UI labels them that way.
 */
async function sessionStats(range: RangeKey, klass: ClassFilter) {
  const rows = await Event.aggregate([
    { $match: rangeMatch(range) },
    WITH_CLASS,
    { $match: classMatch(klass) },
    { $group: { _id: "$sessionId", views: { $sum: 1 } } },
    { $group: { _id: null, sessions: { $sum: 1 }, engaged: { $sum: { $cond: [{ $gt: ["$views", 1] }, 1, 0] } } } },
  ]);
  const r = rows[0] as { sessions: number; engaged: number } | undefined;
  return { sessions: r?.sessions ?? 0, engaged: r?.engaged ?? 0 };
}

async function pageviewCount(range: RangeKey, klass: ClassFilter) {
  const rows = await Event.aggregate([
    { $match: rangeMatch(range) },
    WITH_CLASS,
    { $match: classMatch(klass) },
    { $count: "n" },
  ]);
  return (rows[0] as { n: number } | undefined)?.n ?? 0;
}

const EMPTY_ADMIN = {
  configured: false as const,
  range: "all" as RangeKey,
  klass: "human" as ClassFilter,
  pageviews: 0,
  visitors: 0,
  engaged: 0,
  leadCount: 0,
  newLeads: 0,
  series: [] as SeriesPoint[],
  topPaths: [] as { label: string; count: number }[],
  topReferrers: [] as { label: string; count: number }[],
  topCountries: [] as { label: string; count: number }[],
  devices: [] as { label: string; count: number }[],
  provenance: { human: 0, untagged: 0, bot: 0, firstEvent: null as string | null, retentionDays: 180 },
  leads: [] as unknown[],
};

export async function getAdminStats(range: RangeKey = "all", klass: ClassFilter = "human") {
  const conn = await dbConnect();
  if (!conn) return { ...EMPTY_ADMIN, range, klass };

  const [pageviews, sessions, series, topPaths, topReferrers, topCountries, devices, provenance, firstEvent, leadCount, newLeads, leads] =
    await Promise.all([
      pageviewCount(range, klass),
      sessionStats(range, klass),
      dailySeries(range),
      topBy("path", range, klass),
      topBy("referrerHost", range, klass),
      topBy("country", range, klass),
      topBy("device", range, klass, 4),
      classBreakdown(range),
      Event.findOne({}).sort({ createdAt: 1 }).select("createdAt").lean(),
      Lead.countDocuments({}),
      Lead.countDocuments({ status: "new" }),
      Lead.find({}).sort({ createdAt: -1 }).limit(50).lean(),
    ]);

  return {
    configured: true as const,
    range,
    klass,
    pageviews,
    visitors: sessions.sessions,
    engaged: sessions.engaged,
    leadCount,
    newLeads,
    series,
    topPaths,
    topReferrers,
    topCountries,
    devices,
    provenance: {
      ...provenance,
      firstEvent: (firstEvent as { createdAt?: Date } | null)?.createdAt?.toISOString() ?? null,
      retentionDays: 180,
    },
    leads: (leads as Record<string, unknown>[]).map((l) => ({
      id: String(l._id),
      name: l.name,
      email: l.email,
      subject: l.subject,
      message: l.message,
      status: l.status,
      createdAt: l.createdAt,
      // Phase 6: self-reported on the contact form, and the journey link if the visitor ticked it.
      enquiringAs: l.enquiringAs ?? "",
      organization: l.organization ?? "",
      topic: l.topic ?? "",
      visitLinkId: l.visitLinkId ?? "",
    })),
  };
}

export type FeedRow = {
  id: string;
  at: string;
  path: string;
  referrerHost: string;
  country: string;
  device: string;
  browser: string;
  visitorClass: VisitorClass;
};

/** The newest events, for the live feed. Includes bots — the feed labels them. */
export async function getLiveFeed(limit = 25): Promise<FeedRow[]> {
  const conn = await dbConnect();
  if (!conn) return [];
  const rows = await Event.aggregate([
    { $match: { type: "pageview" } },
    { $sort: { createdAt: -1 } },
    { $limit: Math.min(limit, 100) },
    WITH_CLASS,
  ]);
  return (rows as Record<string, unknown>[]).map((r) => ({
    id: String(r._id),
    at: (r.createdAt as Date).toISOString(),
    path: (r.path as string) || "/",
    referrerHost: (r.referrerHost as string) || "direct",
    country: (r.country as string) || "Unknown",
    device: (r.device as string) || "desktop",
    browser: (r.browser as string) || "",
    visitorClass: r.visitorClass as VisitorClass,
  }));
}

export async function getPublicStats() {
  const conn = await dbConnect();
  if (!conn) {
    return { configured: false, totalViews: 0, uniqueVisitors: 0, topPaths: [], series: [] };
  }
  const [totalViews, sessions, topPaths, series] = await Promise.all([
    Event.countDocuments({ type: "pageview" }),
    Event.distinct("sessionId"),
    topBy("path", "all", "all"),
    dailySeries("30d"),
  ]);
  return {
    configured: true,
    totalViews,
    uniqueVisitors: sessions.filter(Boolean).length,
    topPaths,
    series: series.map((p) => ({ date: p.date, views: p.human + p.untagged + p.bot })),
  };
}
