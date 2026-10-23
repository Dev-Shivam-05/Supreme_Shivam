<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# Traps in this repo

Learned the hard way. Each one cost real time or broke the live site.

## Never print a secret, not even while debugging

A `.env.local` value was echoed to the terminal during a debug step and ended up in the session
transcript, forcing a token rotation. Read env values into a variable, never into stdout. When
showing that a key exists, print the **key name** (`grep -oE "^[A-Z_]+=" .env.local`) and never
the value.

## `.env.local` often has no trailing newline

`printf '%s' "..." >> .env.local` then silently concatenates onto the previous line and corrupts
it. Always append with a leading guard, or rewrite the file with a parser. Note also that
`vercel link` and `vercel env pull` **write to `.env.local`** — pull to a different filename
(`--environment=production .env.verify`) or you will clobber keys that are already there.

## `scripts/seed.mjs` must never hold its own copy of the data

It used to, and the copy went stale. Running it wrote pre-brief content over the **live** site,
because the app prefers database content to the code defaults. It now imports `src/lib/site.ts`
directly — Node strips the TypeScript types on import, no build step needed. If you add a field
to `Project` or `SiteContent`, the seed picks it up for free. Keep it that way, and always read
the collection back after seeding.

## Above-the-fold content must not depend on `<Reveal>`

`Reveal` uses an IntersectionObserver with `rootMargin: "0px 0px -12% 0px"`. On a 900px viewport
that trims the bottom to ~792px, so anything starting below that never fires and stays at
`opacity: 0` until the user scrolls. This silently hid the primary CTA on every service page. For
anything in the first viewport use the CSS-only `.hero-fade` with an `animationDelay`, the way
the hero does.

## The `google-site-verification` tag in `layout.tsx` is load-bearing

It verifies the **old** `shivam-bhadoriya-dev.vercel.app` Search Console property, through the
redirect. A redesign once deleted it as dead weight, which put the Change of Address tool out of
reach after the domain move. Keep it for as long as the old host redirects.

## Search Console / Bing automation

`node scripts/cdp.mjs start` opens a Chrome Shivam signs into; `run <step.mjs>` drives it.
Search Console buttons are uppercased with CSS, so match `/^request indexing$/i`, never the
visible caps. Its comboboxes ignore locator clicks — click by position, then pick the option.
Change of Address can say "Couldn't fetch the page" for a while after a deploy; retry before
debugging the redirect.

## Infrastructure: reach for the API and a scoped token first

Before either refusing an infra task or reaching for browser automation, check whether the
service has an API and a **scoped, revocable token**. Cloudflare DNS, Cloudflare Email Routing
and Vercel all do; that is how the domain migration was done, with no password in the
conversation and every change auditable. `scripts/browser.mjs` is the fallback for consoles with
no API (Search Console, Bing, Business Profile), not the first move.

**Never automate LinkedIn or Instagram.** LinkedIn loads a PerimeterX anti-scraping frame and
hung the CDP session within three page loads (2026-09-16); pushing on risks a restriction on
Shivam's own account. Profile edits there are done by hand. GitHub profile fields have an API:
`gh api user` to read, `gh api -X PATCH user -f blog=... -f location=...` to write.

## Windows / shell

- **Node resolves `/tmp` as `D:\tmp`** while Git Bash treats it as the Git-Bash root. They are
  different directories. Use the session scratchpad path for anything both touch.
- **Backticks in `git commit -m "..."`** are command substitution and will eat part of the
  message. Write long messages to a file and use `git commit -F <file>`.
- **`pkill -f "next start"` does not kill it.** Use PowerShell
  `Get-NetTCPConnection -LocalPort <p> | Stop-Process`. A stale server keeps serving an old
  `.next` and returns **HTTP 500 for the CSS chunk** after a rebuild — the page renders unstyled
  and it looks like a CSS bug. Restart on a fresh port when in doubt.
- **`curl -w "...
"` in Git Bash** prints `/n`, which reads like a double-slash redirect.
  Use single quotes for `-w` formats.
- **Local DNS caching lies during a migration.** `curl` can hit the old IP long after the
  authoritative record has changed. Check with `nslookup <host> 1.1.1.1` and the authoritative
  nameserver before believing a failure, and `ipconfig /flushdns` between tests.

## The admin panel

`.env.local` holds **only** `MONGODB_URI` — no `ADMIN_PASSWORDS`, no `ADMIN_SECRET`. So `/admin`
locally returns "Admin is not configured" until you supply them. Pass them in the **process
environment** for that run; never append them to `.env.local` (see the trailing-newline trap
above). Generate a throwaway pair, write them to a file in the session scratchpad, and launch
`next start` from a small Node wrapper that spreads them into `env`. Print the key names, never
the values.

The visitor classifier is written **twice** — the `$switch` in `src/lib/analytics.ts` and
`classify()` in `src/app/api/collect/route.ts`. They must stay identical or events written after
a change will disagree with the 257 banked before it. The provenance strip under Overview is the
test: human + untagged + bot must equal the ALL pageview count.

`/admin` is excluded from the analytics beacon, so driving it with a browser costs nothing. Loading
a **public** page to test the live feed does write a real row to the production database.

## Recharts

**A negative `margin.left` silently clips the Y-axis labels.** `margin={{ left: -20 }}` put the
axis outside the SVG viewport and sliced the first character off every tick: `53 42 28 14` rendered
as `3 2 8 4`, which reads like corrupted data, not a layout bug. Use `left: 0` and widen the axis.

**Let recharts pick integer ticks on a small domain and it will repeat them.** With
`allowDecimals={false}` and a 0–4 domain it produced `4, 3, 2, 3, 3`. Generate the ticks yourself
and pass `ticks` — `yTicks()` in `src/components/admin/trend-chart.tsx` does it.

Colours must be `var(--token)`, not hex. Presentation attributes accept `var()`, and the hardcoded
`#cbff3c` in the old charts was invisible against the light theme.

## Playwright from a scratchpad script

`node_modules/playwright` is CommonJS, so a scratchpad ESM script cannot name-import it:
`import { chromium } from "file:///.../playwright/index.js"` throws. Default-import the package and
destructure. Scripts inside the repo are fine — only out-of-tree ones need the absolute file URL.

## Verify against the live site, not the build

`npm run verify:domain` checks the redirect, canonical, schema, images, sitemap, every service
page and that no page still carries the old identity. Run it after every production deploy.
`npm run indexnow` after any content change.
