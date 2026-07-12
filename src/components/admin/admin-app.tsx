"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  FileText,
  FolderKanban,
  Image as ImageIcon,
  Inbox,
  Loader2,
  LogOut,
  RefreshCw,
} from "lucide-react";
import { BarList, Kpi, TrendChart } from "@/components/stats/charts";
import { TabProjects } from "./tab-projects";
import { TabContent } from "./tab-content";
import { TabMedia } from "./tab-media";
import { cn } from "@/lib/utils";

type Lead = { id: string; name: string; email: string; subject: string; message: string; status: string; createdAt: string };
type Group = { label: string; count: number }[];
type AdminData = {
  configured: boolean;
  totalViews: number; uniqueVisitors: number; leadCount: number; newLeads: number;
  series: { date: string; views: number; visitors: number }[];
  topPaths: Group; topReferrers: Group; topCountries: Group; devices: Group; leads: Lead[];
};

type Tab = "overview" | "projects" | "content" | "media" | "leads";
const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "overview", label: "Overview", icon: <Activity className="h-4 w-4" /> },
  { id: "projects", label: "Projects", icon: <FolderKanban className="h-4 w-4" /> },
  { id: "content", label: "Content", icon: <FileText className="h-4 w-4" /> },
  { id: "media", label: "Media", icon: <ImageIcon className="h-4 w-4" /> },
  { id: "leads", label: "Leads", icon: <Inbox className="h-4 w-4" /> },
];
const STATUSES = ["new", "read", "replied", "archived"];

export function AdminApp() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [data, setData] = useState<AdminData | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<Tab>("overview");

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/data", { cache: "no-store" });
    if (res.status === 401) { setAuthed(false); return; }
    setData(await res.json());
    setAuthed(true);
  }, []);
  useEffect(() => { load(); }, [load]);

  const login = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setError("");
    try {
      const res = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
      const json = await res.json();
      if (res.ok && json.ok) { setPassword(""); await load(); } else setError(json.error || "Login failed");
    } finally { setBusy(false); }
  };
  const logout = async () => { await fetch("/api/admin/logout", { method: "POST" }); setAuthed(false); setData(null); };
  const setStatus = async (id: string, status: string) => {
    setData((d) => (d ? { ...d, leads: d.leads.map((l) => (l.id === id ? { ...l, status } : l)) } : d));
    await fetch("/api/admin/leads", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) });
  };

  if (authed === null) return <div className="flex min-h-[60svh] items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-accent" /></div>;

  if (!authed) {
    return (
      <div className="relative flex min-h-[80svh] items-center justify-center px-6">
        <div className="grid-bg pointer-events-none absolute inset-0 opacity-30" />
        <form onSubmit={login} className="brackets relative w-full max-w-sm border border-border bg-bg-elev p-8">
          <div className="scanlines pointer-events-none absolute inset-0 opacity-40" />
          <div className="relative">
            <div className="hud tick mb-6">Restricted · command center</div>
            <h1 className="font-poster text-4xl">Admin</h1>
            <p className="mt-2 text-sm text-fg-muted">Enter the admin password to manage the site.</p>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" autoFocus className="mt-6 w-full border border-border bg-bg px-4 py-3 text-sm outline-none focus:border-accent" />
            {error && <p className="mt-3 font-mono text-xs text-signal">{error}</p>}
            <button type="submit" disabled={busy} className="mt-4 inline-flex w-full items-center justify-center gap-2 bg-accent px-5 py-3 text-sm font-semibold text-accent-ink disabled:opacity-70">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enter"}
            </button>
            <p className="mt-4 font-mono text-[0.65rem] text-fg-faint">Set ADMIN_PASSWORD &amp; ADMIN_SECRET in .env to enable.</p>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="container-x py-8">
      <div className="grid gap-6 lg:grid-cols-[15rem_1fr]">
        {/* sidebar */}
        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <div className="mb-6 flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center bg-accent font-poster text-sm text-accent-ink">SB</span>
            <div>
              <div className="hud">Command center</div>
              <div className="font-mono text-xs text-fg">admin</div>
            </div>
          </div>
          <nav className="flex gap-1 overflow-x-auto lg:flex-col">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "inline-flex shrink-0 items-center gap-2.5 border px-4 py-2.5 text-sm transition-colors lg:w-full",
                  tab === t.id ? "border-accent bg-accent/10 text-fg" : "border-transparent text-fg-muted hover:text-fg",
                )}
              >
                {t.icon}
                {t.label}
                {t.id === "leads" && data?.newLeads ? <span className="ml-auto bg-signal px-1.5 font-mono text-[0.6rem] text-white">{data.newLeads}</span> : null}
              </button>
            ))}
          </nav>
          <div className="mt-6 hidden gap-2 lg:flex lg:flex-col">
            <button onClick={load} className="inline-flex items-center gap-2 border border-border px-4 py-2 text-sm text-fg-muted hover:border-accent hover:text-fg"><RefreshCw className="h-4 w-4" /> Refresh</button>
            <button onClick={logout} className="inline-flex items-center gap-2 border border-border px-4 py-2 text-sm text-fg-muted hover:border-signal hover:text-signal"><LogOut className="h-4 w-4" /> Sign out</button>
          </div>
        </aside>

        {/* main */}
        <main className="min-w-0">
          {tab === "overview" && <Overview data={data} />}
          {tab === "leads" && <Leads data={data} setStatus={setStatus} />}
          {tab === "projects" && <TabProjects />}
          {tab === "content" && <TabContent />}
          {tab === "media" && <TabMedia />}
        </main>
      </div>
    </div>
  );
}

function DbNotice() {
  return (
    <div className="brackets border border-border bg-bg-elev p-10 text-center">
      <div className="hud mb-3">Database not connected</div>
      <p className="mx-auto max-w-md text-fg-muted">Set <code>MONGODB_URI</code> in <code>.env</code> and refresh — data and editing turn on.</p>
    </div>
  );
}

function Overview({ data }: { data: AdminData | null }) {
  if (!data?.configured) return <DbNotice />;
  return (
    <div>
      <div className="mb-6"><div className="hud tick mb-1">Live telemetry</div><h2 className="font-poster text-3xl">Analytics</h2></div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Kpi label="Pageviews" value={data.totalViews.toLocaleString()} hint="all time" />
        <Kpi label="Unique visitors" value={data.uniqueVisitors.toLocaleString()} hint="by session" />
        <Kpi label="Leads" value={data.leadCount} hint={`${data.newLeads} new`} />
        <Kpi label="New enquiries" value={data.newLeads} hint="need triage" />
      </div>
      <div className="mt-4 border border-border bg-bg-elev p-6">
        <div className="hud mb-4">Pageviews · last 14 days</div>
        <TrendChart data={data.series} />
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Panel title="Top pages"><BarList items={data.topPaths} /></Panel>
        <Panel title="Referrers (how)"><BarList items={data.topReferrers} /></Panel>
        <Panel title="Countries (where)"><BarList items={data.topCountries} /></Panel>
        <Panel title="Devices"><BarList items={data.devices} /></Panel>
      </div>
    </div>
  );
}

function Leads({ data, setStatus }: { data: AdminData | null; setStatus: (id: string, s: string) => void }) {
  if (!data?.configured) return <DbNotice />;
  return (
    <div>
      <div className="mb-6"><div className="hud tick mb-1">CRM-lite</div><h2 className="font-poster text-3xl">Leads pipeline</h2></div>
      <div className="overflow-x-auto border border-border">
        {data.leads.length === 0 ? (
          <p className="p-6 text-sm text-fg-muted">No leads yet.</p>
        ) : (
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-fg-faint">
                <th className="p-3 font-mono text-xs font-normal uppercase tracking-wider">Name</th>
                <th className="p-3 font-mono text-xs font-normal uppercase tracking-wider">Message</th>
                <th className="p-3 font-mono text-xs font-normal uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.leads.map((l) => (
                <tr key={l.id} className="border-b border-border align-top">
                  <td className="p-3"><div className="font-medium text-fg">{l.name}</div><a href={`mailto:${l.email}`} className="font-mono text-xs text-accent">{l.email}</a></td>
                  <td className="max-w-md p-3 text-fg-muted">{l.subject && <div className="mb-1 text-xs text-fg-faint">{l.subject}</div>}<div className="line-clamp-3">{l.message}</div></td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      {STATUSES.map((s) => (
                        <button key={s} onClick={() => setStatus(l.id, s)} className={cn("px-2 py-1 font-mono text-[0.6rem] uppercase tracking-wider transition-colors", l.status === s ? "bg-accent text-accent-ink" : "border border-border text-fg-muted hover:border-accent")}>{s}</button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="border border-border bg-bg-elev p-6"><div className="hud mb-4">{title}</div>{children}</div>;
}
