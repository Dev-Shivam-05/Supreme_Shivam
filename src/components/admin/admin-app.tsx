"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Menu, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import type { ClassFilter, RangeKey } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { CommandPalette } from "./command-palette";
import { ComingSoon, Overview, type OverviewData } from "./overview";
import { Leads, type Lead } from "./leads";
import { LiveFeed } from "./live-feed";
import { PAGE_TITLE, type PageId } from "./nav";
import { ErrorState, Panel } from "./primitives";
import { Sidebar } from "./sidebar";
import { TabContent } from "./tab-content";
import { TabMedia } from "./tab-media";
import { TabProjects } from "./tab-projects";

type AdminData = OverviewData & {
  sessionExpiresAt: number | null;
  leads: Lead[];
};

export function AdminApp() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [data, setData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [page, setPage] = useState<PageId>("overview");
  const [range, setRange] = useState<RangeKey>("all");
  const [klass, setKlass] = useState<ClassFilter>("human");

  const [drawer, setDrawer] = useState(false);
  const [palette, setPalette] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/data?range=${range}&class=${klass}`, { cache: "no-store" });
      if (res.status === 401) {
        setAuthed(false);
        setData(null);
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData(await res.json());
      setAuthed(true);
      setError("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [range, klass]);

  useEffect(() => {
    void load();
  }, [load]);

  // Cmd/Ctrl-K. The public palette is not mounted on /admin (see layout/chrome),
  // so this binding has the key to itself.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPalette((v) => !v);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const signOut = useCallback(async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    setAuthed(false);
    setData(null);
  }, []);

  const navigate = useCallback((p: PageId) => {
    setPage(p);
    setDrawer(false);
  }, []);

  const setLeadStatus = useCallback(async (id: string, status: string) => {
    setData((d) => (d ? { ...d, leads: d.leads.map((l) => (l.id === id ? { ...l, status } : l)) } : d));
    await fetch("/api/admin/leads", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
  }, []);

  if (authed === null) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-accent" />
      </div>
    );
  }

  if (!authed) return <Login onDone={load} />;

  const head = PAGE_TITLE[page];

  return (
    <div className="flex min-h-svh">
      <Sidebar
        page={page}
        onNavigate={navigate}
        onRefresh={load}
        onSignOut={signOut}
        onOpenPalette={() => setPalette(true)}
        expiresAt={data?.sessionExpiresAt ?? null}
        newLeads={data?.newLeads ?? 0}
        drawerOpen={drawer}
        onCloseDrawer={() => setDrawer(false)}
      />

      <div className="deck-grid min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-bg/85 px-4 py-4 backdrop-blur-md md:px-6">
          <button
            onClick={() => setDrawer(true)}
            aria-label="Open navigation"
            className="text-fg-muted hover:text-fg lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="min-w-0">
            <div className="hud tick">{head.eyebrow}</div>
            <h1 className="font-poster text-2xl leading-tight md:text-3xl">{head.title}</h1>
          </div>

          <p className="ml-auto hidden max-w-xs text-right text-xs text-fg-muted xl:block">{head.blurb}</p>
          <ThemeToggle />
        </header>

        <div className="p-4 md:p-6">
          {error && !data ? (
            <ErrorState message={error} onRetry={load} />
          ) : data && !data.configured ? (
            <DbNotice />
          ) : (
            <>
              {page === "overview" && (
                <Overview
                  data={data}
                  loading={loading && !data}
                  range={range}
                  klass={klass}
                  onRange={setRange}
                  onClass={setKlass}
                />
              )}
              {page === "feed" && (
                <Panel title="Every pageview, newest first">
                  <LiveFeed />
                </Panel>
              )}
              {page === "audience" && (
                <ComingSoon
                  title="Audience — Phase 5b"
                  note="Who the visitors are rather than where they connected from. Waiting on the requirements file."
                />
              )}
              {page === "leads" && <Leads leads={data?.leads ?? []} onStatus={setLeadStatus} />}
              {page === "projects" && <TabProjects />}
              {page === "writing" && <TabContent />}
              {page === "media" && <TabMedia />}
              {page === "status" && (
                <ComingSoon
                  title="Status — Phase 5b"
                  note="Database, indexing and deploy health in one place."
                />
              )}
            </>
          )}
        </div>
      </div>

      <CommandPalette
        open={palette}
        onClose={() => setPalette(false)}
        onNavigate={navigate}
        onRefresh={load}
        onSignOut={signOut}
      />
    </div>
  );
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const dark = resolvedTheme !== "light";
  return (
    <button
      onClick={() => setTheme(dark ? "light" : "dark")}
      aria-label="Toggle theme"
      className="shrink-0 border border-border p-2 text-fg-muted transition-colors duration-[160ms] hover:border-accent hover:text-fg"
    >
      {mounted && !dark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
    </button>
  );
}

function Login({ onDone }: { onDone: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const json = await res.json();
      if (res.ok && json.ok) {
        setPassword("");
        onDone();
      } else {
        setError(json.error || "Login failed");
      }
    } catch {
      setError("Network error.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative flex min-h-svh items-center justify-center px-6">
      <div className="deck-grid pointer-events-none absolute inset-0 opacity-40" />
      <form onSubmit={submit} className="brackets deck-rise relative w-full max-w-sm border border-border bg-bg-elev p-8">
        <div className="scanlines pointer-events-none absolute inset-0 opacity-40" />
        <div className="relative">
          <div className="hud tick mb-6">Restricted · signal deck</div>
          <h1 className="font-poster text-4xl">Admin</h1>
          <p className="mt-2 text-sm text-fg-muted">Enter the admin password to manage the site.</p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoFocus
            className="mt-6 w-full border border-border bg-bg px-4 py-3 text-sm outline-none transition-colors duration-[160ms] focus:border-accent"
          />
          {error && <p className="mt-3 font-mono text-xs text-signal">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className={cn(
              "mt-4 inline-flex w-full items-center justify-center gap-2 bg-accent px-5 py-3 text-sm font-semibold text-accent-ink",
              busy && "opacity-70",
            )}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enter"}
          </button>
        </div>
      </form>
    </div>
  );
}

function DbNotice() {
  return (
    <div className="brackets border border-border bg-bg-elev p-10 text-center">
      <div className="hud mb-3">Database not connected</div>
      <p className="mx-auto max-w-md text-fg-muted">
        Set <code>MONGODB_URI</code> in <code>.env</code> and refresh — data and editing turn on.
      </p>
    </div>
  );
}
