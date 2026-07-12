"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

type Content = {
  availability: string;
  status: string;
  roleLong: string;
  tagline: string;
  heroLead: string;
  aboutParagraphs: string[];
  now: { building: string; learning: string; status: string };
  location: string;
  email: string;
};

const field = "w-full border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-accent";
const labelCls = "hud mb-1.5 block";

export function TabContent() {
  const [c, setC] = useState<Content | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/admin/settings", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => setC(j.settings))
      .catch(() => setC(null));
  }, []);

  const set = (k: keyof Content, v: unknown) => setC((cur) => (cur ? { ...cur, [k]: v } : cur));
  const setNow = (k: keyof Content["now"], v: string) =>
    setC((cur) => (cur ? { ...cur, now: { ...cur.now, [k]: v } } : cur));

  const save = async () => {
    if (!c) return;
    setBusy(true); setMsg("");
    const r = await fetch("/api/admin/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(c) });
    const j = await r.json();
    setBusy(false);
    setMsg(j.ok ? "Saved — live on the site ✓" : j.error || "Save failed");
    setTimeout(() => setMsg(""), 3000);
  };

  if (!c) return <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-accent" /></div>;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="hud tick mb-1">Content · editable text</div>
          <h2 className="font-poster text-3xl">Site content</h2>
        </div>
        <div className="flex items-center gap-3">
          {msg && <span className="font-mono text-xs text-accent">{msg}</span>}
          <button onClick={save} disabled={busy} className="inline-flex items-center gap-2 bg-accent px-5 py-2 text-sm font-semibold text-accent-ink disabled:opacity-60">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
          </button>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div><label className={labelCls}>Availability tag (hero)</label><input className={field} value={c.availability} onChange={(e) => set("availability", e.target.value)} /></div>
        <div><label className={labelCls}>Status</label><input className={field} value={c.status} onChange={(e) => set("status", e.target.value)} /></div>
        <div><label className={labelCls}>Role (long)</label><input className={field} value={c.roleLong} onChange={(e) => set("roleLong", e.target.value)} /></div>
        <div><label className={labelCls}>Location</label><input className={field} value={c.location} onChange={(e) => set("location", e.target.value)} /></div>
        <div className="md:col-span-2"><label className={labelCls}>Tagline</label><input className={field} value={c.tagline} onChange={(e) => set("tagline", e.target.value)} /></div>
        <div className="md:col-span-2"><label className={labelCls}>Hero lead paragraph</label><textarea rows={3} className={field} value={c.heroLead} onChange={(e) => set("heroLead", e.target.value)} /></div>
        <div className="md:col-span-2"><label className={labelCls}>About paragraphs (blank line between each)</label><textarea rows={8} className={field} value={c.aboutParagraphs.join("\n\n")} onChange={(e) => set("aboutParagraphs", e.target.value.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean))} /></div>
        <div><label className={labelCls}>Now · Building</label><input className={field} value={c.now.building} onChange={(e) => setNow("building", e.target.value)} /></div>
        <div><label className={labelCls}>Now · Learning</label><input className={field} value={c.now.learning} onChange={(e) => setNow("learning", e.target.value)} /></div>
        <div><label className={labelCls}>Now · Status</label><input className={field} value={c.now.status} onChange={(e) => setNow("status", e.target.value)} /></div>
        <div><label className={labelCls}>Contact email</label><input className={field} value={c.email} onChange={(e) => set("email", e.target.value)} /></div>
      </div>
    </div>
  );
}
