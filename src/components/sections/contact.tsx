"use client";

import { motion } from "motion/react";
import { ArrowUpRight, Check, Copy, Loader2 } from "lucide-react";
import { useState } from "react";
import { Magnetic } from "@/components/ux/magnetic";
import { site } from "@/lib/site";

const channels = [
  { label: "Email", value: site.email, href: site.social.email },
  { label: "GitHub", value: site.handle, href: site.social.github },
  { label: "LinkedIn", value: "shivam-bhadoriya", href: site.social.linkedin },
];

type Status = "idle" | "sending" | "ok" | "error";

export function Contact() {
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [msg, setMsg] = useState("");
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "", website: "" });

  const copy = () => {
    navigator.clipboard?.writeText(site.email);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const mailtoFallback = () => {
    const body = `Name: ${form.name}\nEmail: ${form.email}\n\n${form.message}`;
    window.location.href = `mailto:${site.email}?subject=${encodeURIComponent(
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
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setStatus("ok");
        setMsg("Message received — I'll reply within 24 hours.");
        setForm({ name: "", email: "", subject: "", message: "", website: "" });
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
            Tell me about the problem. I reply within 24 hours — no gatekeeping, no fluff.
          </p>

          <div className="mt-12 overflow-hidden border border-border">
            {channels.map((c) => (
              <a
                key={c.label}
                href={c.href}
                target="_blank"
                rel="noopener noreferrer"
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
          <input aria-label="Subject" placeholder="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className={field} />
          <textarea required aria-label="Your message" rows={6} placeholder="What are you building?" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className={`${field} resize-none`} />

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
          <p className="font-mono text-[0.65rem] leading-relaxed text-fg-faint">
            Posts to a rate-limited API with spam protection. Set SMTP + MongoDB in{" "}
            <code>.env</code> to enable delivery &amp; the leads pipeline; falls back to your
            mail client otherwise.
          </p>
        </motion.form>
      </div>
    </section>
  );
}
