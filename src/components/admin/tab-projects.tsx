"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Plus, Trash2, Upload } from "lucide-react";

type Metric = { value: string; label: string };
type Project = {
  id?: string;
  slug: string;
  index: string;
  title: string;
  category: string;
  year: string;
  role: string;
  timeline: string;
  summary: string;
  description: string;
  stack: string[];
  metrics: Metric[];
  problem: string;
  approach: string[];
  architecture: string[];
  outcomes: string[];
  pattern: string;
  flagship: boolean;
  imageUrl: string;
  repo: string;
  live: string;
  order: number;
  published: boolean;
};

const blank: Project = {
  slug: "", index: "01", title: "", category: "", year: "2026", role: "", timeline: "",
  summary: "", description: "", stack: [], metrics: [], problem: "", approach: [],
  architecture: [], outcomes: [], pattern: "grid", flagship: false, imageUrl: "",
  repo: "", live: "", order: 0, published: true,
};

const lines = (a: string[]) => a.join("\n");
const toLines = (s: string) => s.split("\n").map((x) => x.trim()).filter(Boolean);
const metricsText = (m: Metric[]) => m.map((x) => `${x.value} | ${x.label}`).join("\n");
const toMetrics = (s: string): Metric[] =>
  toLines(s).map((l) => { const [value, label] = l.split("|"); return { value: (value || "").trim(), label: (label || "").trim() }; });

const field = "w-full border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-accent";
const labelCls = "hud mb-1.5 block";

export function TabProjects() {
  const [list, setList] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState(true);
  const [editing, setEditing] = useState<Project | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch("/api/admin/projects", { cache: "no-store" });
    const j = await r.json();
    setList(j.projects || []);
    setConfigured(j.configured !== false);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const del = async (id: string) => {
    if (!confirm("Delete this project?")) return;
    await fetch(`/api/admin/projects/${id}`, { method: "DELETE" });
    load();
  };
  const seed = async () => {
    await fetch("/api/admin/seed", { method: "POST" });
    load();
  };

  if (editing) {
    return <ProjectForm initial={editing} onDone={() => { setEditing(null); load(); }} onCancel={() => setEditing(null)} />;
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="hud tick mb-1">Content · CRUD</div>
          <h2 className="font-poster text-3xl">Projects</h2>
        </div>
        <div className="flex gap-2">
          {list.length === 0 && configured && (
            <button onClick={seed} className="border border-border px-4 py-2 text-sm text-fg-muted hover:border-accent hover:text-fg">
              Seed defaults
            </button>
          )}
          <button onClick={() => setEditing({ ...blank, order: list.length })} className="inline-flex items-center gap-2 bg-accent px-4 py-2 text-sm font-semibold text-accent-ink">
            <Plus className="h-4 w-4" /> New project
          </button>
        </div>
      </div>

      {!configured ? (
        <p className="border border-border bg-bg-elev p-6 text-sm text-fg-muted">Set <code>MONGODB_URI</code> in .env to enable editing.</p>
      ) : loading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin text-accent" /></div>
      ) : list.length === 0 ? (
        <p className="border border-border bg-bg-elev p-6 text-sm text-fg-muted">No projects yet. Click <strong>Seed defaults</strong> to import the current ones, or <strong>New project</strong>.</p>
      ) : (
        <div className="divide-y divide-border border border-border">
          {list.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-4 bg-bg-elev p-4">
              <div className="flex min-w-0 items-center gap-3">
                <span className="font-mono text-xs text-fg-faint">{p.index}</span>
                <div className="min-w-0">
                  <div className="truncate font-medium text-fg">{p.title} {p.flagship && <span className="text-accent">●</span>}</div>
                  <div className="truncate font-mono text-xs text-fg-faint">/{p.slug} · {p.published ? "published" : "draft"}</div>
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <button onClick={() => setEditing(p)} className="border border-border px-3 py-1.5 text-xs text-fg-muted hover:border-accent hover:text-fg">Edit</button>
                <button onClick={() => del(p.id!)} className="border border-border px-2 py-1.5 text-fg-faint hover:border-signal hover:text-signal"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProjectForm({ initial, onDone, onCancel }: { initial: Project; onDone: () => void; onCancel: () => void }) {
  const [p, setP] = useState<Project>(initial);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const set = (k: keyof Project, v: unknown) => setP((cur) => ({ ...cur, [k]: v }));

  const upload = async (file: File) => {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const r = await fetch("/api/admin/media", { method: "POST", body: fd });
    const j = await r.json();
    if (j.ok) set("imageUrl", j.url);
    setUploading(false);
  };

  const save = async () => {
    if (!p.title || !p.slug) { setErr("Title and slug are required"); return; }
    setBusy(true); setErr("");
    const method = p.id ? "PATCH" : "POST";
    const url = p.id ? `/api/admin/projects/${p.id}` : "/api/admin/projects";
    const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(p) });
    const j = await r.json();
    setBusy(false);
    if (j.ok) onDone(); else setErr(j.error || "Save failed");
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-poster text-3xl">{p.id ? "Edit" : "New"} project</h2>
        <div className="flex gap-2">
          <button onClick={onCancel} className="border border-border px-4 py-2 text-sm text-fg-muted hover:text-fg">Cancel</button>
          <button onClick={save} disabled={busy} className="inline-flex items-center gap-2 bg-accent px-5 py-2 text-sm font-semibold text-accent-ink disabled:opacity-60">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
          </button>
        </div>
      </div>
      {err && <p className="mb-4 font-mono text-xs text-signal">{err}</p>}

      <div className="grid gap-5 md:grid-cols-2">
        <div><label className={labelCls}>Title *</label><input className={field} value={p.title} onChange={(e) => set("title", e.target.value)} /></div>
        <div><label className={labelCls}>Slug *</label><input className={field} value={p.slug} onChange={(e) => set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))} /></div>
        <div><label className={labelCls}>Index</label><input className={field} value={p.index} onChange={(e) => set("index", e.target.value)} /></div>
        <div><label className={labelCls}>Category</label><input className={field} value={p.category} onChange={(e) => set("category", e.target.value)} /></div>
        <div><label className={labelCls}>Year</label><input className={field} value={p.year} onChange={(e) => set("year", e.target.value)} /></div>
        <div><label className={labelCls}>Role</label><input className={field} value={p.role} onChange={(e) => set("role", e.target.value)} /></div>
        <div><label className={labelCls}>Timeline</label><input className={field} value={p.timeline} onChange={(e) => set("timeline", e.target.value)} /></div>
        <div>
          <label className={labelCls}>Cover motif (if no image)</label>
          <select className={field} value={p.pattern} onChange={(e) => set("pattern", e.target.value)}>
            {["grid", "wave", "nodes", "scan", "orbit"].map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <div className="md:col-span-2"><label className={labelCls}>Summary</label><textarea rows={2} className={field} value={p.summary} onChange={(e) => set("summary", e.target.value)} /></div>
        <div className="md:col-span-2"><label className={labelCls}>Description</label><textarea rows={3} className={field} value={p.description} onChange={(e) => set("description", e.target.value)} /></div>

        <div className="md:col-span-2">
          <label className={labelCls}>Cover image (optional — overrides the motif)</label>
          <div className="flex items-center gap-4">
            <div className="relative h-20 w-28 shrink-0 overflow-hidden border border-border bg-bg">
              {p.imageUrl ? <img src={p.imageUrl} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center hud">motif</div>}
            </div>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
            <button onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-2 border border-border px-4 py-2 text-sm text-fg-muted hover:border-accent hover:text-fg">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Upload
            </button>
            {p.imageUrl && <button onClick={() => set("imageUrl", "")} className="text-xs text-fg-faint hover:text-signal">remove</button>}
          </div>
        </div>

        <div><label className={labelCls}>Stack (one per line)</label><textarea rows={5} className={field} value={lines(p.stack)} onChange={(e) => set("stack", toLines(e.target.value))} /></div>
        <div><label className={labelCls}>Metrics (value | label, one per line)</label><textarea rows={5} className={field} value={metricsText(p.metrics)} onChange={(e) => set("metrics", toMetrics(e.target.value))} /></div>
        <div className="md:col-span-2"><label className={labelCls}>Problem</label><textarea rows={2} className={field} value={p.problem} onChange={(e) => set("problem", e.target.value)} /></div>
        <div><label className={labelCls}>Approach (one per line)</label><textarea rows={4} className={field} value={lines(p.approach)} onChange={(e) => set("approach", toLines(e.target.value))} /></div>
        <div><label className={labelCls}>Architecture (one per line)</label><textarea rows={4} className={field} value={lines(p.architecture)} onChange={(e) => set("architecture", toLines(e.target.value))} /></div>
        <div className="md:col-span-2"><label className={labelCls}>Outcomes (one per line)</label><textarea rows={3} className={field} value={lines(p.outcomes)} onChange={(e) => set("outcomes", toLines(e.target.value))} /></div>
        <div><label className={labelCls}>Repo URL</label><input className={field} value={p.repo} onChange={(e) => set("repo", e.target.value)} /></div>
        <div><label className={labelCls}>Live URL</label><input className={field} value={p.live} onChange={(e) => set("live", e.target.value)} /></div>
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 text-sm text-fg-muted"><input type="checkbox" checked={p.flagship} onChange={(e) => set("flagship", e.target.checked)} /> Flagship</label>
          <label className="flex items-center gap-2 text-sm text-fg-muted"><input type="checkbox" checked={p.published} onChange={(e) => set("published", e.target.checked)} /> Published</label>
        </div>
        <div><label className={labelCls}>Order</label><input type="number" className={field} value={p.order} onChange={(e) => set("order", Number(e.target.value))} /></div>
      </div>
    </div>
  );
}
