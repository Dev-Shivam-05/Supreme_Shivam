# Phase 4 — PageSpeed to 100 (approved `GO`, 2026-09-26)

Baseline, PageSpeed Insights on `https://shivambhadoriya.com/`, 2026-09-26 20:19 IST:

| | Performance | Accessibility | Best Practices | SEO |
|---|---|---|---|---|
| Mobile | 82 (LCP 4.1 s, SI 4.9 s, TBT 30 ms) | 96 | 100 | 100 |
| Desktop | 60 (TBT 1,490 ms, SI 5.7 s, main-thread 25.0 s) | 96 | 100 | 100 |

## Locked decisions

| # | Item | Locked value |
|---|---|---|
| 1 | Target | Accessibility, Best Practices, SEO = 100 on mobile and desktop. Performance: desktop 100, mobile ≥ 95. Median of 3 PageSpeed runs per strategy, after deploy. |
| 2 | Contrast | `--fg-faint`: dark `#565650` → `#7a7a73` (4.63:1 on `#08080a`); light `#9a9a90` → `#6b6b63` (4.53:1 on `#ecece7`). No other token changes. |
| 3 | Desktop WebGL shader | Not loaded on page load. The three.js chunk loads on the first `pointermove`, `scroll`, `touchstart`, `wheel` or `keydown`, then fades in over 600 ms above the CSS liquid fallback, which is what shows until then. |
| 4 | Lime preloader (1,200 ms, first visit) | Removed. |
| 5 | Fonts | Sacramento: `preload: false`. Anton, Space Grotesk, Inter, JetBrains Mono unchanged. |
| 6 | Photos | AVIF + WebP variants through `<picture>`; the `.jpg` stays the `<img src>` so filenames, image sitemap and JSON-LD are unchanged. Portrait AVIF ≤ 35 KB. Hero portrait `fetchPriority="high"`. |
| 7 | Legacy JS | `browserslist`: `chrome 111, edge 111, firefox 111, safari 16.4`. |
| 8 | `HeroReveal` SVG filter | Not rendered on touch devices (`(hover: hover) and (pointer: fine)` checked before render). |
| 9 | "Missing source maps" | Left alone (Best Practices already 100; publishing maps exposes source). |
| 10 | Branch / deploy | `perf/phase-4` from `seo-ai-engineer-identity`. Local Lighthouse on `next start`; Shivam runs `vercel --prod`. |

## Out of scope
- Search ranking itself; freelance profiles in `sameAs` (no public URLs recorded); LinkedIn edits; Bing Site Move.

## Acceptance criteria
- [ ] Accessibility, Best Practices, SEO = 100, mobile and desktop
- [ ] Performance: desktop 100, mobile ≥ 95 (median of 3 PageSpeed runs)
- [ ] `npm run verify:domain` → 0 failed after deploy
- [ ] Screenshots: desktop hero before and after first pointer move; mobile hero

## Results — 2026-09-26, local `next start`, Lighthouse 12 (not yet deployed)

| Row | Outcome |
|---|---|
| 2 | Done, amended: `#7a7a73` failed on `--bg-elev` (4.38:1), so dark is `#82827b` (5.17 / 4.90 / 4.52 on bg / bg-elev / surface). **Accessibility 96 → 100 on mobile and desktop.** Needs Shivam's OK on the amended hex. |
| 3 | Done. No canvas and no three.js request on load; after the first pointer move the chunk loads and the shader fades in (screenshots). |
| 4 | Done. |
| 5 | Done. |
| 6 | Done: AVIF 26.7 KB (q40), WebP 61.3 KB. **Deviation:** no `fetchPriority="high"` — React turns it into a preload of the `.jpg` src, which would download the JPEG on top of the AVIF. |
| 7 | **Reverted.** The 14 KiB "legacy JS" is Next.js's own runtime chunk; `browserslist` did not change it. |
| 8 | Done (`useFinePointer`). |
| 11 (new, pending) | `template.tsx` rendered `<main>` at `opacity:0` in the server HTML until hydration. First load now renders visible. Real-Chrome LCP at 4x CPU: 3.1 s (a button) → ~2.1 s (the h1). Commit `c655aee`, separate so it can be reverted. |

Lighthouse, local (mobile runs vary 46–85 on this Windows machine; best-of-3 shown):

| | Perf mobile | Perf desktop | A11y | BP | SEO |
|---|---|---|---|---|---|
| Before (local) | 84, LCP 4.4 s | 99 | 96 | 100 | 100 |
| After (local) | 85, LCP 4.3 s | 98–99 | 100 | 100 | 100 |

**Mobile performance did not reach 95.** The simulated LCP (~4.3 s) is network-bound: Lighthouse's
slow-4G model counts every byte requested before the LCP paint — four preloaded fonts (~124 KB) and
~270 KB of JS — and no row in this table removes those. The desktop PSI score of 60 came from the
WebGL shader running under PageSpeed's software GL; row 3 removes it from page load, so expect desktop
in the high 90s after deploy (not measurable locally — local desktop was already 97–99).

Getting mobile ≥ 95 needs a new decision on design (fewer font families, a static hero entrance,
deferring Lenis/GSAP/motion). Not done, per the rule below.

## Rule while building
Measure each row on its own; keep only what does not make LCP worse. If mobile stays < 95 after all
rows, stop and report the trace — do not cut more design without a new decision.
