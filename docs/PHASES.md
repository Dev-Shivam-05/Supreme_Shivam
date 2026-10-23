# Phases

## Now

**Phase 6 — Visitor intelligence: built on `feat/phase-6-visitor-intelligence`, not deployed.**
Implements Shivam's `visitor_intelligence_reference/` in full. Consent card with three separate
opt-ins, journey tracking by content and CTA IDs, contact-form linking, public-RDAP network owner,
four explainable rules, withdrawal that erases at once, admin Visitors page. An independent
security review found nine issues; all fixed. 101 unit tests (the 32 reference tests among them)
and 50/50 end-to-end checks. Gender is not inferred — the reference forbids it.
Spec: `docs/spec/phase-6-visitor-intelligence.md`.

**Phase 5a — Admin "Signal Deck": built, not deployed** (Phase 6 is branched from it).
**Phase 4 — PageSpeed: merged to main** (PR #3).

## Next 3

1. **Deploy 5a + 6 (Shivam).** Merge `feat/phase-5a-admin-deck`, then
   `feat/phase-6-visitor-intelligence`; set `CRON_SECRET` in Vercel; `vercel --prod`; one consented
   visit on the live site checked in /admin → Visitors.
2. **Phase 6b — data from the first click, within the reference.** Spec-lock first. Consent card on
   first load; arrival category + landing content ID in the anonymous aggregate tier; ask about
   aggregate network-kind counts. Exact table in `docs/HANDOFF.md`.
3. **Phase 5b — the rest of the deck** (Leads, Projects, Writing, Media, Status; `/stats` bots).

---

| # | Phase | Status | Notes |
|---|---|---|---|
| 1 | SEO + identity rebuild | **Done** — 2026-09-14 | Implements `portfolio-implementation-brief.md`. |
| 2 | DEV-HANDOVER: local SEO, services, legal | **Done** — 2026-09-14 | City settled as Navsari; `contact@shivambhadoriya.com`; five service/hire pages; `/privacy-policy` + `/terms`; cookieless analytics. |
| 3 | Domain live on shivambhadoriya.com | **Done** — 2026-09-14 | DNS, SSL, www, 308 off the old host, production env vars, deploy. `npm run verify:domain` → 29 passed, 0 failed. |
| 3b | Admin panel | **Done** — 2026-09-14 | Two passwords accepted, wrong ones rejected, verified against the live domain. Database wired, so it has real data. |
| 3c | Indexing | **Partly automated** | IndexNow done (Bing/Yandex/Seznam/Naver). Google has no sanctioned push API — sitemap is in robots.txt; Request Indexing is manual. GSC property verified by Shivam. |
| 3d | Database | **Done** — 2026-09-14 | Dedicated `shivambhadoriya` database on Atlas. `projects` + `settings` seeded from lib/site.ts. Live `/api/stats` reports `configured: true`. |
| 3e | Mailbox + SMTP | **Open — decision, deadline 2026-10-14** | Inbound **is** working (verified 2026-09-15: MX → Hostinger, SPF intact, message delivered). Hostinger email trial expires 2026-10-14. Renew vs Cloudflare Email Routing is Shivam's call; SMTP follows it. |
| 3f | Off-site entity signals | **Nearly done — 2026-09-16; two hand edits left** | Verified 2026-09-16. Link back + Navsari: GitHub (`gh api user`), X, WakaTime. LinkedIn: Website field now shivambhadoriya.com (Portfolio), location Greater Surat Area (LinkedIn's metro area for Navsari). **Left, by hand:** (1) LinkedIn About ends with `Portfolio: shivam-bhadoriya-dev.vercel.app` — change to `shivambhadoriya.com`; the agent is blocked from editing the profile. (2) Instagram `__https.shivu` is a personal account with no link — add the site or drop it from `sameAs` (Shivam's call). Do not automate LinkedIn: it loads PerimeterX (`uc=scraping`) and hung the CDP session. |
| 3g | Search visibility after the move | **Nearly done** — 2026-09-16 | Verification tag restored, 301s live, Google Change of Address confirmed, 10 URLs requested, Bing imported + sitemap. Bing Site Move pending Bing's 48h processing. |
| 4 | Above-the-fold performance | **Built, not deployed** — 2026-09-26 | Spec `docs/spec/phase-4-pagespeed.md` (approved `GO`). A11y 96 → 100; shader deferred to first interaction; preloader gone; AVIF portrait; `template.tsx` no longer hides the page until hydration (row 11, pending OK). Mobile perf ~85 locally, target 95 not met — needs a design decision. Detail below is the older investigation. |
| 5a | Admin v2 — Signal Deck | **Built, not deployed** — 2026-10-23 | Spec `docs/spec/phase-5-admin-signal-deck.md`, approved `go`. Visitor classification (human/untagged/bot) computed in a `$switch` so it applies to the 257 events banked before the field existed; 38 were this project's own headless Chrome. Grouped sidebar, live feed polling `/api/admin/feed` at 20s while visible, Cmd-K palette, provenance strip. `/admin` no longer renders the public nav/footer/Lenis (`components/layout/chrome.tsx`) — a nested layout cannot remove a parent's chrome. Verified against the live database and screenshotted in both themes at 1600/1100/480px. |
| 6 | Visitor intelligence | **Built, not deployed** — 2026-10-23 | Implements `visitor_intelligence_reference/` (README, reference.py, schema.sql, examples.json, tests). Engine ported from reference.py; its 32 tests pass under their original names, 94 in all. Consent-gated journeys (15-day window, deleted at 22 days), contact-form linking, RDAP network owner by prefix, four abstaining rules, tombstone-first erasure, daily sweep, admin Visitors page. Independent security review: 9 findings, all fixed. 101 unit tests; 50/50 end-to-end on an isolated test database. Gender not inferred (forbidden by the reference). Enquiries kept at 24 months (deviation, see DECISIONS). |
| 6b | Data from the first click | **Open — next session** | Shivam's goal: collect from the moment a visitor opens the site. Today journey data starts only at "Allow" (card after 20 s / 40 % scroll). Build within the reference: card on first load; entry category + landing content ID in the cookieless aggregate tier; ask about aggregate network-kind counts. Per-visitor collection before consent is forbidden by the reference — see DECISIONS 2026-10-23. |
| 5b | Admin v2 — remaining pages | **Open** | Leads, Projects, Writing, Media, Status redesigned to match the deck. (The Audience slot became Visitors in Phase 6.) |
| 5 | Confirm unverified facts | **Done** — 2026-09-14 | Phone, timelines, app confidentiality, Instagram and the real AI-PULSE stack (read from the GitHub API, not guessed) are all in the code. |

## Phase 2 — what shipped

- **Identity settled on Navsari, Gujarat.** DEV-HANDOVER is the command file and it says Navsari
  throughout; the older implementation brief said Ahmedabad. Everything user-visible now reads from
  `site.address`. GitHub still says Ahmedabad and must be changed by hand.
- **Five commercial pages** at 1,223–1,421 words each, with `ProfessionalService` + `FAQPage` +
  `BreadcrumbList` schema, targeting the local and specialist queries that are actually winnable.
- **`/privacy-policy` and `/terms`**, written from the code rather than a template, linked in the
  footer of every page.
- **No cookie banner, because there is nothing to consent to.** The analytics session id moved from
  `sessionStorage` to a server-side daily-rotating salted hash of IP + user-agent; the contact form
  stores a hash instead of the IP; enquiries auto-expire after 24 months and pageviews after 180
  days, both enforced by TTL indexes so the policy's claims are true.
- **Nav reordered** with Services first; Lab moved to the footer to keep the bar at six items.

---

## Phase 4 — above-the-fold performance

**Why it is its own phase:** the brief sets a target of mobile LCP < 2.5 s on throttled 4G. That
target is not met and was not met before this work either. Reaching it means changing the motion
and effects system, which is a different piece of work from the SEO and identity change, and it
is more than eight files.

### Measured, local `next start`, Lighthouse mobile, simulated 4G

| | Before (`main`) | After phases 1–2 |
|---|---|---|
| Performance | 32 | 68 |
| LCP | 5.1 s | 5.3 s |
| Total blocking time | 980 ms | 320 ms |
| FCP | 1.0 s | 1.8 s |
| CLS | 0 | 0 |
| SEO | 100 | 100 |
| Accessibility | 96 | 96 |

The score doubled and blocking time dropped by ~two thirds, mostly from removing the root
`loading.tsx`. LCP did not move.

Note these numbers are pessimistic: they are HTTP/1.1 off `next start` on localhost, with no
brotli and no CDN. Vercel will be better. But not 3 s better.

### What was ruled out

- **Not the cold-open panel.** Measured with it force-skipped: LCP got *worse* (5.7 s). Leave
  the preloader alone.
- **Not the nav entrance.** It used to SSR at `translateY(-100px)` and wait for framer to
  hydrate; that is fixed (`initial={false}`), and LCP did not move.
- **Not the hero portrait.** Dropping its `fetchPriority="high"` preload helped the score a
  little; it is not the LCP element.

### What the trace actually says

Main-thread work 5.8 s, of which script evaluation 1.75 s and **style & layout 1.47 s**. LCP
render delay is 4.9 s. Lighthouse cannot find a large contentful element and settles on a 32 px
nav badge, which means nothing big is both painted and visible early. The cost is paint and
compositing, not bytes (614 KiB total).

### Where to start

1. The expensive paint stack in and around the hero: `blur-[60px]`/`blur-[70px]` blobs,
   `.grain-overlay`, `.grid-bg`, `.scanlines`, `mix-blend-mode: color` on `.tint-accent`, and the
   `filter: url(#heroLiquid)` SVG displacement in `HeroReveal`. Measure each, keep the ones that
   earn their cost.
2. `HeroReveal` mounts on the server and on the first client render, then unmounts on touch
   devices — it does a full SVG-filter paint on phones for nothing. Gate it before render.
3. Bundle: `motion` + `lenis` + `gsap` + `three` all load on the home route. The shader is
   already dynamic and off on mobile; the rest is not.
4. The `.hud` class uses `--fg-faint` on dark, which is roughly 3.2:1 — below WCAG AA for small
   text, and the one remaining accessibility failure. It is a design-token decision, so it needs
   a call from Shivam before changing.
