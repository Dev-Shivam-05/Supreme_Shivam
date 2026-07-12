import { NextResponse, type NextRequest } from "next/server";
import { UAParser } from "ua-parser-js";
import { dbConnect } from "@/lib/db";
import { Event } from "@/models/event";
import { rateLimit } from "@/lib/ratelimit";

export const runtime = "nodejs";

/** Analytics beacon. Never throws to the client — always returns 204. */
export async function POST(req: NextRequest) {
  try {
    // Throttle this unauthenticated write so it can't be used to spam the DB / poison analytics.
    const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "local";
    if (!rateLimit(`collect:${ip}`, 30, 60_000).ok) return new NextResponse(null, { status: 204 });

    const body = await req.json().catch(() => ({}));
    const rawPath = String(body.path || "").slice(0, 300);
    if (!rawPath || rawPath.startsWith("/admin")) return new NextResponse(null, { status: 204 });

    const conn = await dbConnect();
    if (!conn) return new NextResponse(null, { status: 204 });

    const ua = req.headers.get("user-agent") || "";
    const parsed = new UAParser(ua).getResult();
    const referrer = String(body.referrer || "");
    let referrerHost = "direct";
    try {
      if (referrer) referrerHost = new URL(referrer).hostname.replace(/^www\./, "");
    } catch {}

    const qs = rawPath.includes("?") ? new URLSearchParams(rawPath.split("?")[1]) : new URLSearchParams();

    await Event.create({
      type: "pageview",
      path: rawPath.split("?")[0],
      referrer,
      referrerHost,
      utmSource: qs.get("utm_source") || "",
      utmMedium: qs.get("utm_medium") || "",
      utmCampaign: qs.get("utm_campaign") || "",
      country: req.headers.get("x-vercel-ip-country") || "Unknown",
      device: parsed.device?.type || "desktop",
      browser: parsed.browser?.name || "",
      os: parsed.os?.name || "",
      sessionId: String(body.sessionId || "").slice(0, 64),
    });
  } catch (err) {
    console.error("[collect] ignored:", (err as Error).message);
  }
  return new NextResponse(null, { status: 204 });
}
