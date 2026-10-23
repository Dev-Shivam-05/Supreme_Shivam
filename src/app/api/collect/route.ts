import { createHash } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { UAParser } from "ua-parser-js";
import { dbConnect } from "@/lib/db";
import { Event } from "@/models/event";
import { rateLimit } from "@/lib/ratelimit";

export const runtime = "nodejs";

/**
 * A session identifier that never touches the visitor's device.
 *
 * sha256(salt | UTC date | ip | user-agent), truncated. The raw IP is never
 * stored — only this digest is — and the date component rotates it at UTC
 * midnight, so yesterday's id cannot be joined to today's. That makes it a
 * per-day visitor counter rather than a tracker, which is what lets the site
 * run without a consent banner. Set ANALYTICS_SALT to a long random string in
 * production so the digest cannot be brute-forced back to an IP.
 */
function dailySessionId(ip: string, ua: string) {
  const salt = process.env.ANALYTICS_SALT || "sb-portfolio";
  const day = new Date().toISOString().slice(0, 10);
  return createHash("sha256").update(`${salt}|${day}|${ip}|${ua}`).digest("hex").slice(0, 32);
}

/**
 * The same human | untagged | bot rule the admin aggregation applies, so a row
 * carries its label from the moment it is written. Kept in step with the
 * `$switch` in lib/analytics.ts — change one and you must change the other.
 */
function classify(browser: string, os: string, country: string) {
  if (!browser || browser === "Chrome Headless" || !os) return "bot";
  if (country === "Unknown") return "untagged";
  return "human";
}

/**
 * README "Redact … secret URL parameters": this tier keeps only what an
 * aggregate needs. A full referrer path can be someone's profile URL, and a UTM
 * value is free text that can carry an email address — so the referrer is cut
 * to its host and a UTM value survives only as a short campaign-code token.
 */
const UTM_CODE_RE = /^[a-z0-9][a-z0-9._-]{0,39}$/i;
function utmCode(value: string | null) {
  return value && UTM_CODE_RE.test(value) ? value.toLowerCase() : "";
}

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
    const sessionId = dailySessionId(ip, ua);
    const referrer = String(body.referrer || "");
    let referrerHost = "direct";
    try {
      if (referrer) referrerHost = new URL(referrer).hostname.replace(/^www\./, "");
    } catch {}

    const qs = rawPath.includes("?") ? new URLSearchParams(rawPath.split("?")[1]) : new URLSearchParams();

    const country = req.headers.get("x-vercel-ip-country") || "Unknown";
    const browser = parsed.browser?.name || "";
    const os = parsed.os?.name || "";

    await Event.create({
      type: "pageview",
      path: rawPath.split("?")[0],
      // The full URL is read above only to derive the host; it is never written.
      referrer: "",
      referrerHost,
      utmSource: utmCode(qs.get("utm_source")),
      utmMedium: utmCode(qs.get("utm_medium")),
      utmCampaign: utmCode(qs.get("utm_campaign")),
      country,
      device: parsed.device?.type || "desktop",
      browser,
      os,
      sessionId,
      visitorClass: classify(browser, os, country),
    });
  } catch (err) {
    console.error("[collect] ignored:", (err as Error).message);
  }
  return new NextResponse(null, { status: 204 });
}
