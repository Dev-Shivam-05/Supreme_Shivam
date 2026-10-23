import nodemailer from "nodemailer";
import { env, features } from "./env";

type LeadInput = {
  name: string;
  email: string;
  subject?: string;
  message: string;
  /** Self-reported by the sender, never verified — labelled as such in the email. */
  enquiringAs?: string;
  organization?: string;
  topic?: string;
};

/** Sends the lead notification via SMTP. No-ops (sent:false) when SMTP is unset. */
export async function sendLeadMail(lead: LeadInput): Promise<{ sent: boolean; reason?: string }> {
  if (!features.mail) return { sent: false, reason: "SMTP not configured" };

  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  });

  const subject = `New enquiry — ${lead.subject || "Portfolio"}`;
  // Only the fields the sender actually filled in, each marked as their own claim.
  const rows: [string, string | undefined][] = [
    ["Enquiring as", lead.enquiringAs],
    ["Organisation", lead.organization],
    ["Topic", lead.topic],
  ];
  const selfReported = rows.filter((row): row is [string, string] => !!row[1]);
  const text =
    `Name: ${lead.name}\nEmail: ${lead.email}\nSubject: ${lead.subject || "—"}\n` +
    selfReported.map(([k, v]) => `${k} (self-reported): ${v}\n`).join("") +
    `\n${lead.message}`;
  const html = `
    <div style="font-family:system-ui,sans-serif;line-height:1.6">
      <h2 style="margin:0 0 12px">New portfolio enquiry</h2>
      <p><strong>Name:</strong> ${escapeHtml(lead.name)}</p>
      <p><strong>Email:</strong> ${escapeHtml(lead.email)}</p>
      <p><strong>Subject:</strong> ${escapeHtml(lead.subject || "—")}</p>
      ${selfReported.map(([k, v]) => `<p><strong>${k} (self-reported):</strong> ${escapeHtml(v)}</p>`).join("")}
      <p style="white-space:pre-wrap;border-left:3px solid #cbff3c;padding-left:12px">${escapeHtml(lead.message)}</p>
    </div>`;

  try {
    await transporter.sendMail({
      from: env.SMTP_FROM || env.SMTP_USER,
      to: env.CONTACT_TO,
      replyTo: lead.email,
      subject,
      text,
      html,
    });
    return { sent: true };
  } catch (err) {
    console.error("[mail] send failed:", (err as Error).message);
    return { sent: false, reason: "send failed" };
  }
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
