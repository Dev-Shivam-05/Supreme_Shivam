# Phases

| # | Phase | Status | Notes |
|---|---|---|---|
| 1 | SEO + identity rebuild | **Done** — 2026-09-14 | Implements `portfolio-implementation-brief.md`. |
| 2 | DEV-HANDOVER: local SEO, services, legal | **Done** — 2026-09-14 | City settled as Navsari; `contact@shivambhadoriya.com`; five service/hire pages; `/privacy-policy` + `/terms`; cookieless analytics. |
| 3 | Domain, console and profile setup | **Blocked on Shivam** | Registrar is Hostinger. All clicks in `docs/DOMAIN-SETUP.md` (Path A moves DNS to Cloudflare for the free mailbox). Verify each stage with `npm run verify:domain`. |
| 4 | Above-the-fold performance | **Not started** | Deliberately not absorbed. Detail below. |
| 5 | Confirm remaining unverified facts | **Mostly closed** | Phone, timelines and the app question answered 2026-09-14. Outstanding: the Instagram URL and the real AI-PULSE stack. `docs/SEO.md` §2. |

## Phase 2 — what shipped

- **Identity settled on Navsari, Gujarat.** DEV-HANDOVER is the command file and it says Navsari
  throughout; the older implementation brief said Ahmedabad. Everything user-visible now reads from
  `site.address`. GitHub still says Ahmedabad and must be changed by hand.
- **Five commercial pages** at 1,080–1,170 words each, with `ProfessionalService` + `FAQPage` +
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
