"use client";

import { AnimatePresence, motion } from "motion/react";
import { useTheme } from "next-themes";
import {
  ArrowUpRight,
  Command as CommandIcon,
  Copy,
  CornerDownLeft,
  Mail,
  Moon,
  Search,
  Sun,
} from "lucide-react";

/* lucide 1.x dropped brand glyphs — inline the two we need. */
function Github({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className}>
      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function Linkedin({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className={className}>
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="2" y="9" width="4" height="12" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="4" cy="4" r="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { nav, site } from "@/lib/site";
import { cn } from "@/lib/utils";

type Item = {
  id: string;
  label: string;
  hint?: string;
  icon: React.ReactNode;
  run: () => void;
  keywords?: string;
};

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setActive(0);
  }, []);

  const items = useMemo<Item[]>(() => {
    const go = (href: string) => () => {
      close();
      router.push(href);
    };
    const open_ = (url: string) => () => {
      close();
      window.open(url, "_blank", "noopener,noreferrer");
    };
    return [
      {
        id: "nav-home",
        label: "Go to Home",
        hint: "Page",
        icon: <Search className="h-4 w-4" />,
        run: go("/"),
        keywords: "home index",
      },
      ...nav.map((n) => ({
        id: `nav-${n.href}`,
        label: `Go to ${n.label}`,
        hint: "Page",
        icon: <Search className="h-4 w-4" />,
        run: go(n.href),
        keywords: n.label,
      })),
      {
        id: "copy-email",
        label: "Copy email address",
        hint: site.email,
        icon: <Copy className="h-4 w-4" />,
        run: () => {
          navigator.clipboard?.writeText(site.email);
          close();
        },
      },
      {
        id: "github",
        label: "Open GitHub",
        hint: site.handle,
        icon: <Github className="h-4 w-4" />,
        run: open_(site.social.github),
      },
      {
        id: "linkedin",
        label: "Open LinkedIn",
        icon: <Linkedin className="h-4 w-4" />,
        run: open_(site.social.linkedin),
      },
      {
        id: "email",
        label: "Send an email",
        icon: <Mail className="h-4 w-4" />,
        run: open_(site.social.email),
      },
      {
        id: "theme",
        label: `Switch to ${theme === "dark" ? "light" : "dark"} mode`,
        hint: "Theme",
        icon: theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />,
        run: () => {
          setTheme(theme === "dark" ? "light" : "dark");
          close();
        },
      },
    ];
  }, [close, router, theme, setTheme]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) =>
      `${it.label} ${it.hint ?? ""} ${it.keywords ?? ""}`.toLowerCase().includes(q),
    );
  }, [items, query]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") close();
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("command:open", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("command:open", onOpen);
    };
  }, [close]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 40);
  }, [open]);

  const onListKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      filtered[active]?.run();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[120] flex items-start justify-center px-4 pt-[16vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-bg/70 backdrop-blur-sm"
            onClick={close}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            className="glass-panel relative w-full max-w-xl overflow-hidden rounded-2xl shadow-[var(--shadow-soft)]"
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            onKeyDown={onListKey}
          >
            <div className="flex items-center gap-3 border-b border-border px-4">
              <Search className="h-4 w-4 text-fg-faint" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActive(0);
                }}
                placeholder="Search or jump to…"
                className="w-full bg-transparent py-4 text-sm text-fg outline-none placeholder:text-fg-faint"
              />
              <kbd className="hidden items-center gap-1 rounded-md border border-border px-1.5 py-0.5 font-mono text-[0.6rem] text-fg-faint sm:flex">
                ESC
              </kbd>
            </div>
            <ul className="max-h-[46vh] overflow-y-auto p-2">
              {filtered.length === 0 && (
                <li className="px-3 py-6 text-center text-sm text-fg-faint">
                  No matches.
                </li>
              )}
              {filtered.map((it, i) => (
                <li key={it.id}>
                  <button
                    onMouseEnter={() => setActive(i)}
                    onClick={() => it.run()}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors",
                      i === active ? "bg-glass-strong text-fg" : "text-fg-muted",
                    )}
                  >
                    <span className="text-fg-faint">{it.icon}</span>
                    <span className="flex-1">{it.label}</span>
                    {it.hint && (
                      <span className="truncate font-mono text-[0.65rem] text-fg-faint">
                        {it.hint}
                      </span>
                    )}
                    {i === active && (
                      <CornerDownLeft className="h-3.5 w-3.5 text-fg-faint" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-between border-t border-border px-4 py-2.5 text-[0.65rem] text-fg-faint">
              <span className="inline-flex items-center gap-1.5 font-mono">
                <CommandIcon className="h-3 w-3" /> Command palette
              </span>
              <span className="inline-flex items-center gap-1.5">
                <ArrowUpRight className="h-3 w-3" /> {site.name}
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
