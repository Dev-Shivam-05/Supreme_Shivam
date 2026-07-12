import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/db";
import { Lead } from "@/models/lead";
import { sendLeadMail } from "@/lib/mail";
import { features } from "@/lib/env";
import { rateLimit } from "@/lib/ratelimit";

export const runtime = "nodejs";

const schema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email").max(200),
  subject: z.string().max(200).optional().default(""),
  message: z.string().min(1).max(5000),
  website: z.string().optional(), // honeypot — bots fill this
});

export async function POST(req: NextRequest) {
  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "local";
  const rl = rateLimit(`contact:${ip}`, 5, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ ok: false, error: "Too many requests. Try again shortly." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Malformed request." }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Please fill in the required fields." }, { status: 400 });
  }

  const { website, ...lead } = parsed.data;
  if (website) return NextResponse.json({ ok: true }); // silently drop spam

  let stored = false;
  const conn = await dbConnect();
  if (conn) {
    try {
      await Lead.create({ ...lead, ip, userAgent: req.headers.get("user-agent") || "" });
      stored = true;
    } catch (err) {
      console.error("[contact] store failed:", (err as Error).message);
    }
  }

  const mail = await sendLeadMail(lead);

  // Only report success if the lead was actually captured somewhere. Otherwise the
  // client falls back to opening the user's mail client instead of faking success.
  if (!stored && !mail.sent) {
    return NextResponse.json(
      { ok: false, stored, emailed: false, error: "Couldn't deliver right now — opening your mail client…" },
      { status: 200 },
    );
  }

  return NextResponse.json({
    ok: true,
    stored,
    emailed: mail.sent,
    configured: features.db || features.mail,
  });
}
