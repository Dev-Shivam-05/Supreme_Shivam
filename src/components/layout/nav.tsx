"use client";

import { AnimatePresence, motion } from "motion/react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Moon, Search, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Magnetic } from "@/components/ux/magnetic";
import { useMounted } from "@/lib/hooks";
import { nav, site } from "@/lib/site";
import { cn } from "@/lib/utils";

function ThemeToggle() {
  const mounted = useMounted();
  const { theme, setTheme } = useTheme();
  return (
    <button
      aria-label="Toggle theme"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="sweep inline-flex h-10 w-10 items-center justify-center border border-border text-fg-muted transition-colors"
    >
      {!mounted ? <span className="h-4 w-4" /> : theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}

export function Nav() {
  const pathname = usePathname();
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 40);
      setHidden(y > last && y > 400 && !menuOpen);
      last = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [menuOpen]);

  useEffect(() => setMenuOpen(false), [pathname]);

  useEffect(() => {
    document.documentElement.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [menuOpen]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: hidden ? -110 : 0 }}
        transition={{ duration: 0.4, ease: [0.7, 0, 0.1, 1] }}
        className="fixed inset-x-0 top-0 z-[90]"
      >
        <div className="container-x py-4">
          <div
            className={cn(
              "flex items-center justify-between px-5 py-3 transition-all duration-300",
              scrolled ? "glass-panel" : "border border-transparent",
            )}
          >
            <Link href="/" className="group flex items-center gap-3" aria-label="Home">
              <span className="grid h-8 w-8 place-items-center bg-accent font-poster text-sm text-accent-ink">
                SB
              </span>
              <span className="hidden font-mono text-xs uppercase tracking-[0.2em] text-fg-muted transition-colors group-hover:text-fg sm:block">
                {site.name}
              </span>
            </Link>

            <nav className="hidden items-center gap-1 md:flex">
              {nav.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className={cn(
                    "group flex items-center gap-1.5 px-3 py-2 text-sm transition-colors",
                    isActive(n.href) ? "text-fg" : "text-fg-muted hover:text-fg",
                  )}
                >
                  <span className="font-mono text-[0.6rem] text-fg-faint group-hover:text-accent">
                    {n.index}
                  </span>
                  {n.label}
                  {isActive(n.href) && (
                    <motion.span layoutId="nav-active" className="h-1 w-1 rounded-full bg-accent" />
                  )}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <button
                aria-label="Open command palette"
                onClick={() => window.dispatchEvent(new Event("command:open"))}
                className="sweep hidden h-10 items-center gap-2 border border-border px-3 text-fg-muted transition-colors sm:inline-flex"
              >
                <Search className="h-3.5 w-3.5" />
                <kbd className="font-mono text-[0.65rem]">⌘K</kbd>
              </button>
              <ThemeToggle />
              <Magnetic className="hidden md:block">
                <Link
                  href="/contact"
                  className="flex items-center gap-2 bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-accent-ink" />
                  Hire me
                </Link>
              </Magnetic>

              <button
                aria-label="Menu"
                onClick={() => setMenuOpen((o) => !o)}
                className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 md:hidden"
              >
                <span className={cn("h-px w-5 bg-fg transition-transform duration-300", menuOpen && "translate-y-[3.5px] rotate-45")} />
                <span className={cn("h-px w-5 bg-fg transition-transform duration-300", menuOpen && "translate-y-[-3.5px] -rotate-45")} />
              </button>
            </div>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ clipPath: "inset(0 0 100% 0)" }}
            animate={{ clipPath: "inset(0 0 0% 0)" }}
            exit={{ clipPath: "inset(0 0 100% 0)" }}
            transition={{ duration: 0.6, ease: [0.7, 0, 0.1, 1] }}
            className="fixed inset-0 z-[80] bg-bg md:hidden"
          >
            <div className="grid-bg absolute inset-0 opacity-40" />
            <div className="relative flex h-full flex-col justify-between px-6 pb-12 pt-28">
              <nav className="flex flex-col">
                {nav.map((n, i) => (
                  <Link
                    key={n.href}
                    href={n.href}
                    className="group flex items-baseline gap-4 border-b border-border py-3.5 active:text-accent"
                  >
                    <span className="font-mono text-sm text-accent">{n.index}</span>
                    <span className="block overflow-hidden">
                      <motion.span
                        className="block font-poster text-[15vw] leading-none text-fg"
                        initial={{ y: "110%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "110%" }}
                        transition={{ delay: 0.18 + i * 0.06, duration: 0.6, ease: [0.7, 0, 0.1, 1] }}
                      >
                        {n.label}
                      </motion.span>
                    </span>
                  </Link>
                ))}
              </nav>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="flex flex-col gap-5"
              >
                <div className="hud tick">{site.availability}</div>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: "GitHub", href: site.social.github },
                    { label: "LinkedIn", href: site.social.linkedin },
                    { label: "Email", href: site.social.email },
                  ].map((s) => (
                    <a
                      key={s.label}
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="sweep border border-border px-4 py-2.5 text-sm text-fg-muted"
                    >
                      {s.label}
                    </a>
                  ))}
                  <Link href="/contact" className="sweep border border-accent bg-accent px-5 py-2.5 text-sm font-semibold text-accent-ink">
                    Hire me
                  </Link>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
