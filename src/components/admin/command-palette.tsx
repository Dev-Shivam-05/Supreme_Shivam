"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { LogOut, RefreshCw, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { ALL_ITEMS, type PageId } from "./nav";

type Action =
  | { kind: "page"; id: PageId; label: string; group: string }
  | { kind: "command"; id: "refresh" | "signout"; label: string; group: string };

export function CommandPalette({
  open,
  onClose,
  onNavigate,
  onRefresh,
  onSignOut,
}: {
  open: boolean;
  onClose: () => void;
  onNavigate: (p: PageId) => void;
  onRefresh: () => void;
  onSignOut: () => void;
}) {
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  // Where focus came from, so Esc hands it back rather than dropping it on body.
  const restoreTo = useRef<Element | null>(null);

  const actions = useMemo<Action[]>(
    () => [
      ...ALL_ITEMS.map((i) => ({ kind: "page" as const, id: i.id, label: i.label, group: "Go to" })),
      { kind: "command" as const, id: "refresh" as const, label: "Refresh data", group: "Actions" },
      { kind: "command" as const, id: "signout" as const, label: "Sign out", group: "Actions" },
    ],
    [],
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return actions;
    return actions.filter((a) => a.label.toLowerCase().includes(q));
  }, [actions, query]);

  useEffect(() => {
    if (!open) return;
    restoreTo.current = document.activeElement;
    setQuery("");
    setIndex(0);
    input.current?.focus();
    return () => {
      (restoreTo.current as HTMLElement | null)?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  const run = (a: Action) => {
    onClose();
    if (a.kind === "page") onNavigate(a.id);
    else if (a.id === "refresh") onRefresh();
    else onSignOut();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") return onClose();
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIndex((i) => (results.length ? (i + 1) % results.length : 0));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setIndex((i) => (results.length ? (i - 1 + results.length) % results.length : 0));
    }
    if (e.key === "Enter" && results[index]) {
      e.preventDefault();
      run(results[index]);
    }
  };

  let lastGroup = "";

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[18vh]">
      <button aria-label="Close" onClick={onClose} className="absolute inset-0 bg-bg/80 backdrop-blur-sm" />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        onKeyDown={onKeyDown}
        className="brackets deck-rise relative w-full max-w-[480px] border border-border-strong bg-bg-elev"
      >
        <div className="flex items-center gap-2.5 border-b border-border px-4">
          <Search className="h-4 w-4 shrink-0 text-fg-faint" />
          <input
            ref={input}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIndex(0);
            }}
            placeholder="Jump to a page, or run a command"
            className="w-full bg-transparent py-3.5 font-mono text-sm text-fg outline-none placeholder:text-fg-faint"
          />
          <kbd className="shrink-0 border border-border px-1.5 py-0.5 font-mono text-[0.6rem] text-fg-faint">esc</kbd>
        </div>

        <div className="max-h-[320px] overflow-y-auto p-2">
          {results.length === 0 ? (
            <p className="px-2 py-6 text-center font-mono text-xs text-fg-faint">Nothing matches “{query}”</p>
          ) : (
            results.map((a, i) => {
              const header = a.group !== lastGroup ? ((lastGroup = a.group), a.group) : null;
              return (
                <div key={`${a.kind}-${a.id}`}>
                  {header && <div className="hud px-2 pb-1 pt-2">{header}</div>}
                  <button
                    onMouseEnter={() => setIndex(i)}
                    onClick={() => run(a)}
                    className={cn(
                      "flex w-full items-center gap-2.5 px-2 py-2 text-left text-sm transition-colors duration-[160ms]",
                      i === index ? "bg-accent/12 text-fg" : "text-fg-muted",
                    )}
                  >
                    {a.kind === "command" ? (
                      a.id === "refresh" ? (
                        <RefreshCw className="h-3.5 w-3.5 text-fg-faint" />
                      ) : (
                        <LogOut className="h-3.5 w-3.5 text-fg-faint" />
                      )
                    ) : (
                      <span className={cn("h-1.5 w-1.5", i === index ? "bg-accent" : "bg-fg-faint")} />
                    )}
                    {a.label}
                    {i === index && (
                      <span className="ml-auto font-mono text-[0.6rem] text-fg-faint">enter</span>
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
