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

## Rule while building
Measure each row on its own; keep only what does not make LCP worse. If mobile stays < 95 after all
rows, stop and report the trace — do not cut more design without a new decision.
