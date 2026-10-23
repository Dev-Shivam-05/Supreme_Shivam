"use client";

import { useEffect, useRef } from "react";
import { Command, LogOut, RefreshCw, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV, type PageId } from "./nav";

/**
 * Three layouts from one component:
 *   >= 1280px  264px rail, group titles and subtitles visible
 *   1024-1279  68px icon rail, labels hidden, titles become a hairline
 *   < 1024px   off-canvas drawer over a scrim, opened from the header
 */
export function Sidebar({
  page,
  onNavigate,
  onRefresh,
  onSignOut,
  onOpenPalette,
  expiresAt,
  newLeads,
  drawerOpen,
  onCloseDrawer,
}: {
  page: PageId;
  onNavigate: (p: PageId) => void;
  onRefresh: () => void;
  onSignOut: () => void;
  onOpenPalette: () => void;
  expiresAt: number | null;
  newLeads: number;
  drawerOpen: boolean;
  onCloseDrawer: () => void;
}) {
  const panel = useRef<HTMLDivElement>(null);

  // Esc closes the drawer; it is a modal surface on small screens.
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCloseDrawer();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [drawerOpen, onCloseDrawer]);

  return (
    <>
      {drawerOpen && (
        <button
          aria-label="Close navigation"
          onClick={onCloseDrawer}
          className="fixed inset-0 z-40 bg-bg/80 backdrop-blur-sm lg:hidden"
        />
      )}

      <div
        ref={panel}
        className={cn(
          "z-50 flex flex-col border-r border-border bg-bg-elev",
          // drawer on small screens
          "fixed inset-y-0 left-0 w-[280px] transition-transform duration-[280ms] ease-[cubic-bezier(0.4,0,0.2,1)] lg:transition-none",
          drawerOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          // icon rail, then full rail
          "lg:sticky lg:top-0 lg:h-svh lg:w-[68px] xl:w-[264px]",
        )}
      >
        <div className="flex items-center gap-3 border-b border-border px-4 py-4 lg:justify-center xl:justify-start">
          <span className="grid h-9 w-9 shrink-0 place-items-center bg-accent font-poster text-sm text-accent-ink">
            SB
          </span>
          <div className="min-w-0 lg:hidden xl:block">
            <div className="hud truncate">Signal deck</div>
            <div className="truncate font-mono text-xs text-fg">shivambhadoriya.com</div>
          </div>
          <button
            onClick={onCloseDrawer}
            aria-label="Close navigation"
            className="ml-auto text-fg-muted hover:text-fg lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 lg:px-2 xl:px-3">
          {NAV.map((group) => (
            <div key={group.id} className="mb-5 last:mb-0">
              <div className="mb-2 px-1 lg:hidden xl:block">
                <div className="hud">{group.title}</div>
                <p className="mt-0.5 text-[0.69rem] leading-snug text-fg-muted">{group.subtitle}</p>
              </div>
              {/* the icon rail keeps a divider where the heading would be */}
              <div className="mb-2 hidden h-px bg-border lg:block xl:hidden" />

              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = page === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onNavigate(item.id)}
                      aria-current={active ? "page" : undefined}
                      title={item.label}
                      className={cn(
                        "group relative flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors duration-[160ms] lg:justify-center lg:px-0 xl:justify-start xl:px-3",
                        active ? "bg-accent/10 text-fg" : "text-fg-muted hover:bg-glass hover:text-fg",
                      )}
                    >
                      <span
                        className={cn(
                          "absolute inset-y-0 left-0 w-0.5 transition-colors duration-[160ms]",
                          active ? "bg-accent" : "bg-transparent",
                        )}
                      />
                      <item.icon className={cn("h-4 w-4 shrink-0", active && "text-accent")} />
                      <span className="lg:hidden xl:inline">{item.label}</span>
                      {item.id === "leads" && newLeads > 0 && (
                        <span className="ml-auto bg-signal px-1.5 font-mono text-[0.6rem] text-white lg:hidden xl:inline">
                          {newLeads}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-border p-3 lg:px-2 xl:px-3">
          <div className="mb-2 flex gap-1.5 lg:flex-col xl:flex-row">
            <button
              onClick={onRefresh}
              title="Refresh"
              className="flex flex-1 items-center justify-center gap-2 border border-border px-3 py-2 text-xs text-fg-muted transition-colors duration-[160ms] hover:border-accent hover:text-fg"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span className="lg:hidden xl:inline">Refresh</span>
            </button>
            <button
              onClick={onOpenPalette}
              title="Command palette"
              className="flex items-center justify-center gap-1.5 border border-border px-3 py-2 text-xs text-fg-muted transition-colors duration-[160ms] hover:border-accent hover:text-fg"
            >
              <Command className="h-3.5 w-3.5" />
              <span className="font-mono lg:hidden xl:inline">K</span>
            </button>
          </div>

          <div className="flex h-[56px] items-center gap-2.5 border border-border bg-bg px-3 lg:justify-center lg:px-0 xl:justify-start xl:px-3">
            <span className="grid h-7 w-7 shrink-0 place-items-center border border-accent font-mono text-[0.6rem] text-accent">
              SB
            </span>
            <div className="min-w-0 lg:hidden xl:block">
              <div className="truncate font-mono text-xs text-fg">admin</div>
              <div className="truncate font-mono text-[0.62rem] text-fg-faint">
                {expiresAt ? `expires in ${untilText(expiresAt)}` : "session active"}
              </div>
            </div>
            <button
              onClick={onSignOut}
              title="Sign out"
              aria-label="Sign out"
              className="ml-auto text-fg-faint transition-colors duration-[160ms] hover:text-signal lg:hidden xl:block"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function untilText(ts: number) {
  const ms = ts - Date.now();
  if (ms <= 0) return "0h";
  const d = Math.floor(ms / 86_400_000);
  const h = Math.floor((ms % 86_400_000) / 3_600_000);
  return d > 0 ? `${d}d ${h}h` : `${h}h`;
}
