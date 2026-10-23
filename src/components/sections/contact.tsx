"use client";

import { motion } from "motion/react";
import { ArrowUpRight, Check, ChevronDown, Copy, Loader2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Magnetic } from "@/components/ux/magnetic";
import { EMAIL_MASKED, emailAddress, emailHref } from "@/lib/email";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";
import { trackCta, useVI } from "@/components/vi/vi-client";

/** Everything except the address — that one is assembled after hydration. */
const channels = [
  ...(site.phone ? [{ label: "Phone", value: site.phoneDisplay, href: `tel:${site.phone}` }] : []),
  { label: "GitHub", value: site.handle, href: site.social.github },
  { label: "LinkedIn", value: "shivam-bhadoriya-dev", href: site.social.linkedin },
  { label: "X", value: site.social.xHandle, href: site.social.x },
];

type Status = "idle" | "sending" | "ok" | "error";

/*
 * Self-reported context (spec §2: person or organisation is asked, never
 * inferred about the person). Values match the /api/contact enums exactly.
 */
const ENQUIRING_AS = [
  { value: "individual", label: "An individual" },
  { value: "organization", label: "On behalf of an organisation" },
  { value: "recruiter", label: "A recruiter" },
  { value: "agency", label: "An agency" },
  { value: "other", label: "Something else" },
] as const;

const TOPICS = [
  { value: "development", label: "Project" },
  { value: "hiring", label: "Hiring" },
  { value: "collaboration", label: "Collaboration" },
  { value: "other", label: "Other" },
] as const;

type Topic = (typeof TOPICS)[number]["value"];

export function Contact() {
  const [copied, setCopied] = useState(false);
  // null until hydration, so the address never ships in the server HTML.
  const [mail, setMail] = useState<string | null>(null);
  useEffect(() => setMail(emailHref()), []);
  const [status, setStatus] = useState<Status>("idle");
  const [msg, setMsg] = useState("");
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "", website: "" });
  const [enquiringAs, setEnquiringAs] = useState("");
  const [organization, setOrganization] = useState("");
  const [topic, setTopic] = useState<Topic | null>(null);
  const [linkVisit, setLinkVisit] = useState(false);
  // The link box exists only for a visitor who granted "linking" on the consent
  // card — sending an enquiry never requires any analytics permission (R06).
  const vi = useVI();
  const canLink = vi.granted && vi.purposes.includes("linking");

  const copy = () => {
    navigator.clipboard?.writeText(emailAddress());
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const mailtoFallback = () => {
    const body = `Name: ${form.name}\nEmail: ${form.email}\n\n${form.message}`;
    window.location.href = `${emailHref()}?subject=${encodeURIComponent(
      form.subject || "Portfolio enquiry",
    )}&body=${encodeURIComponent(body)}`;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "sending") return;
    setStatus("sending");
    setMsg("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Empty optional fields are left out (undefined drops from JSON) rather
        // than sent as "", so the server's enums never see a blank.
        body: JSON.stringify({
          ...form,
          enquiringAs: enquiringAs || undefined,
          organization: organization.trim() || undefined,
          topic: topic ?? undefined,
          linkVisit: canLink && linkVisit ? true : undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setStatus("ok");
        setMsg("Message received — I'll reply within 24 hours.");
        setForm({ name: "", email: "", subject: "", message: "", website: "" });
        setEnquiringAs("");
        setOrganization("");
        setTopic(null);
        setLinkVisit(false);
        trackCta("enquiry_submitted");
      } else {
        setStatus("error");
        setMsg(data.error || "Something went wrong. Opening your mail client…");
        setTimeout(mailtoFallback, 800);
      }
    } catch {
      setStatus("error");
      setMsg("Network issue — opening your mail client…");
      setTimeout(mailtoFallback, 800);
    }
  };

  const field =
    "w-full border border-border bg-bg-elev px-4 py-3.5 text-sm text-fg outline-none transition-colors placeholder:text-fg-faint focus:border-accent";

  return (
    <section id="contact" className="container-x py-12 md:py-16">
      <div className="grid gap-16 md:grid-cols-[1fr_1fr] md:gap-20">
        <div>
          <p className="max-w-sm text-lg text-fg-muted">
            Prefer to talk? The phone number is real and it reaches me directly. Otherwise the
            form is the fastest route — it lands in my inbox and my leads board at once.
          </p>

          <div className="mt-12 overflow-hidden border border-border">
            {/* The address is not in the server HTML — see lib/email.ts. */}
            <a
              href={mail ?? "/contact"}
              className="group flex items-center justify-between border-b border-border bg-bg-elev px-6 py-5 transition-colors hover:bg-surface"
            >
              <div>
                <div className="hud">Email</div>
                <div className="mt-1 text-sm text-fg">{mail ? emailAddress() : EMAIL_MASKED}</div>
              </div>
              <ArrowUpRight className="h-4 w-4 text-fg-faint transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent" />
            </a>
            {channels.map((c) => (
              <a
                key={c.label}
                href={c.href}
                // tel: must not open a new tab — on desktop that is a blank window.
                {...(c.href.startsWith("http")
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
                className="group flex items-center justify-between border-b border-border bg-bg-elev px-6 py-5 transition-colors hover:bg-surface"
              >
                <div>
                  <div className="hud">{c.label}</div>
                  <div className="mt-1 text-sm text-fg">{c.value}</div>
                </div>
                <ArrowUpRight className="h-4 w-4 text-fg-faint transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent" />
              </a>
            ))}
            <button
              onClick={copy}
              data-vi-cta="copy_email"
              className="flex w-full items-center justify-between bg-bg-elev px-6 py-5 text-left transition-colors hover:bg-surface"
            >
              <div>
                <div className="hud">Quick copy</div>
                <div className="mt-1 text-sm text-fg">Copy email to clipboard</div>
              </div>
              {copied ? <Check className="h-4 w-4 text-accent" /> : <Copy className="h-4 w-4 text-fg-faint" />}
            </button>
          </div>
        </div>

        <motion.form
          onSubmit={submit}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.7, 0, 0.1, 1] }}
          className="flex flex-col gap-4"
        >
          {/* honeypot — hidden from humans */}
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            value={form.website}
            onChange={(e) => setForm({ ...form, website: e.target.value })}
            className="absolute left-[-9999px] h-0 w-0"
            aria-hidden
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <input required aria-label="Your name" placeholder="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={field} />
            <input required type="email" aria-label="Your email address" placeholder="you@company.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={field} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="enquiring-as" className="hud mb-2 block">I&apos;m enquiring as</label>
              <div className="relative">
                <select
                  id="enquiring-as"
                  value={enquiringAs}
                  onChange={(e) => setEnquiringAs(e.target.value)}
                  className={cn(field, "appearance-none pr-10", !enquiringAs && "text-fg-faint")}
                >
                  <option value="" className="bg-bg-elev">Choose…</option>
                  {ENQUIRING_AS.map((o) => (
                    <option key={o.value} value={o.value} className="bg-bg-elev text-fg">
                      {o.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-faint" />
              </div>
            </div>
            <div>
              <label htmlFor="organization" className="hud mb-2 block">Organisation (optional)</label>
              <input id="organization" maxLength={120} value={organization} onChange={(e) => setOrganization(e.target.value)} className={field} />
            </div>
          </div>
          <div>
            <p id="topic-label" className="hud mb-2">Topic</p>
            <div role="group" aria-labelledby="topic-label" className="flex flex-wrap gap-2">
              {TOPICS.map((t) => {
                const on = topic === t.value;
                return (
                  <button
                    key={t.value}
                    type="button"
                    aria-pressed={on}
                    // Single choice, but pressing the chosen one again clears it — it is optional.
                    onClick={() => setTopic(on ? null : t.value)}
                    className={cn(
                      "border px-4 py-2 text-sm transition-colors",
                      on ? "border-accent bg-accent text-accent-ink" : "border-border text-fg-muted hover:border-border-strong hover:text-fg",
                    )}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>
          <input aria-label="Subject" placeholder="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className={field} />
          <textarea required aria-label="Your message" rows={6} placeholder="What are you building?" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className={`${field} resize-none`} />
          {canLink && (
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={linkVisit}
                onChange={(e) => setLinkVisit(e.target.checked)}
                className="mt-1 h-4 w-4 shrink-0 accent-accent"
              />
              <span>
                <span className="block text-sm text-fg">Attach the pages I viewed this session to this enquiry</span>
                <span className="mt-0.5 block font-mono text-[0.65rem] leading-relaxed text-fg-faint">
                  So I can see what you read. Nothing else is attached.
                </span>
              </span>
            </label>
          )}

          <Magnetic>
            <button
              type="submit"
              disabled={status === "sending"}
              className="inline-flex w-full items-center justify-center gap-2 bg-accent px-6 py-4 text-sm font-semibold text-accent-ink disabled:opacity-70"
            >
              {status === "sending" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Sending…
                </>
              ) : (
                <>
                  Send message <ArrowUpRight className="h-4 w-4" />
                </>
              )}
            </button>
          </Magnetic>

          {msg && (
            <p className={`font-mono text-xs ${status === "ok" ? "text-accent" : "text-signal"}`}>{msg}</p>
          )}
          {/* A setup note for whoever is running this locally — never for a visitor,
              who has no idea what SMTP is and should not be told the site is half-wired. */}
          {process.env.NODE_ENV !== "production" && (
            <p className="font-mono text-[0.65rem] leading-relaxed text-fg-faint">
              Dev only: posts to a rate-limited API with spam protection. Set SMTP + MongoDB in{" "}
              <code>.env.local</code> to enable delivery and the leads pipeline; falls back to the
              visitor&apos;s mail client otherwise.
            </p>
          )}
          <p className="font-mono text-[0.65rem] leading-relaxed text-fg-faint">
            Your details are used to reply to you and nothing else — see the{" "}
            <Link href="/privacy-policy" className="underline underline-offset-2 hover:text-fg">
              privacy policy
            </Link>
            .
          </p>
        </motion.form>
      </div>
    </section>
  );
}
