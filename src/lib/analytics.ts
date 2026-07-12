import { dbConnect } from "./db";
import { Event } from "@/models/event";
import { Lead } from "@/models/lead";

const DAY = 86_400_000;

async function dailySeries(days: number) {
  const since = new Date(Date.now() - days * DAY);
  const rows = await Event.aggregate([
    { $match: { type: "pageview", createdAt: { $gte: since } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        views: { $sum: 1 },
        sessions: { $addToSet: "$sessionId" },
      },
    },
    { $project: { date: "$_id", views: 1, visitors: { $size: "$sessions" }, _id: 0 } },
    { $sort: { date: 1 } },
  ]);
  return rows as { date: string; views: number; visitors: number }[];
}

async function topBy(field: string, limit = 6) {
  const rows = await Event.aggregate([
    { $match: { type: "pageview" } },
    { $group: { _id: `$${field}`, count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: limit },
  ]);
  return rows.map((r) => ({ label: r._id || "—", count: r.count }));
}

export async function getPublicStats() {
  const conn = await dbConnect();
  if (!conn) {
    return { configured: false, totalViews: 0, uniqueVisitors: 0, topPaths: [], series: [] };
  }
  const [totalViews, sessions, topPaths, series] = await Promise.all([
    Event.countDocuments({ type: "pageview" }),
    Event.distinct("sessionId"),
    topBy("path"),
    dailySeries(14),
  ]);
  return {
    configured: true,
    totalViews,
    uniqueVisitors: sessions.filter(Boolean).length,
    topPaths,
    series,
  };
}

export async function getAdminStats() {
  const conn = await dbConnect();
  if (!conn) {
    return {
      configured: false,
      totalViews: 0,
      uniqueVisitors: 0,
      leadCount: 0,
      newLeads: 0,
      series: [],
      topPaths: [],
      topReferrers: [],
      topCountries: [],
      devices: [],
      leads: [],
    };
  }
  const [totalViews, sessions, series, topPaths, topReferrers, topCountries, devices, leadCount, newLeads, leads] =
    await Promise.all([
      Event.countDocuments({ type: "pageview" }),
      Event.distinct("sessionId"),
      dailySeries(14),
      topBy("path"),
      topBy("referrerHost"),
      topBy("country"),
      topBy("device", 4),
      Lead.countDocuments({}),
      Lead.countDocuments({ status: "new" }),
      Lead.find({}).sort({ createdAt: -1 }).limit(50).lean(),
    ]);

  return {
    configured: true,
    totalViews,
    uniqueVisitors: sessions.filter(Boolean).length,
    leadCount,
    newLeads,
    series,
    topPaths,
    topReferrers,
    topCountries,
    devices,
    leads: leads.map((l) => ({
      id: String(l._id),
      name: l.name,
      email: l.email,
      subject: l.subject,
      message: l.message,
      status: l.status,
      createdAt: l.createdAt,
    })),
  };
}
