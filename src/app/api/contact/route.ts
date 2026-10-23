import { randomUUID } from "node:crypto";
import { keyedHash } from "@/lib/keyed-hash";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { dbConnect } from "@/lib/db";
import { Lead } from "@/models/lead";
import { sendLeadMail } from "@/lib/mail";
import { features } from "@/lib/env";
import { rateLimit } from "@/lib/ratelimit";
import { Rejected } from "@/lib/vi/engine";
import { getEngine, logRejection, resolveContext } from "@/lib/vi/server";

export const runtime = "nodejs";

const schema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email").max(200),
  subject: z.string().max(200).optional().default(""),
  message: z.string().min(1).max(5000),
  website: z.string().optional(), // honeypot — bots fill this
  // Self-reported context. Optional, but a value outside these lists fails the
  // whole request exactly like any other invalid field: free text is not an enum.
  enquiringAs: z.enum(["individual", "organization", "recruiter", "agency", "other"]).optional(),
  organization: z.string().trim().max(120).optional(),
  topic: z.enum(["development", "hiring", "collaboration", "other"]).optional(),
  // The visitor ticked "link this visit to my enquiry". Shown only with the linking grant.
  linkVisit: z.boolean().optional(),
});

/**
 * Links this browser session's journey to the new lead (spec §5 step 5). The
 * proof is created here, inside the trusted server route, and is scoped to
 * exactly this session's unexpired events (R30, R46). Returns the link id, or
 * null when there is nothing permitted to link.
 */
async function linkVisitToLead(req: NextRequest, contactId: string): Promise<string | null> {
  const resolved = resolveContext(req);
  if (resolved.kind !== "ok") return null;
  const engine = await getEngine();
  if (!engine) return null;

  const { ctx } = resolved;
  const now = new Date();
  // Full grant check (revoked, expired, tombstoned, purpose) BEFORE any write:
  // a proof names the lead, so it must never exist for a journey that is gone.
  await engine.checkGrant(ctx, now, "linking");

  const eventIds = (await engine.store.listEvents(ctx.siteId, ctx.epochId))
    .filter((e) => e.sessionId === ctx.sessionId && e.expiresAt.getTime() > now.getTime())
    .map((e) => e.eventId);
  if (eventIds.length === 0) return null;
  const window = await engine.store.getWindow(ctx.siteId, ctx.epochId);
  if (!window) return null;

  const proofId = randomUUID();
  await engine.registerProof({
    proofId,
    siteId: ctx.siteId,
    grantId: ctx.grantId,
    sessionId: ctx.sessionId,
    contactId,
    eventIds,
    kind: "explicit_contact_link",
    // The proof never outlives the evidence it points at.
    expiresAt: window.expiresAt,
  });
  // linkSessionToContact re-checks the grant for "linking" and the event scope.
  const link = await engine.linkSessionToContact(ctx, proofId, now);
  return link.linkId;
}

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

  const { website, linkVisit: wantsLink, ...lead } = parsed.data;
  if (website) return NextResponse.json({ ok: true }); // silently drop spam

  let stored = false;
  let leadId: string | null = null;
  const conn = await dbConnect();
  if (conn) {
    try {
      // A keyed hash rather than the address — see the note on the model. With
      // no server secret there is nothing to key with, so nothing is stored.
      const ipHash = keyedHash("contact-ip", ip) ?? "";
      const doc = await Lead.create({ ...lead, ipHash, userAgent: req.headers.get("user-agent") || "" });
      leadId = String(doc._id);
      stored = true;
    } catch (err) {
      console.error("[contact] store failed:", (err as Error).message);
    }
  }

  // README: "Do not require analytics permission for sending an inquiry". The
  // enquiry is already stored; nothing in this block may change that outcome,
  // so every failure is swallowed and logged as a code, never the payload.
  let linked = false;
  if (wantsLink === true && leadId) {
    try {
      const linkId = await linkVisitToLead(req, leadId);
      if (linkId) {
        await Lead.updateOne({ _id: leadId }, { $set: { visitLinkId: linkId } });
        linked = true;
      }
    } catch (err) {
      await logRejection(err instanceof Rejected ? err.code : "link_failed", "contact_form");
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
    linked,
    configured: features.db || features.mail,
  });
}
