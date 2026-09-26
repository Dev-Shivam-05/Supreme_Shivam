# HANDOFF — Supreme_Shivam — Phase 4 (PageSpeed) — 2026-09-26

## Done

- **Spec approved (`GO`) and built on branch `perf/phase-4`** (from `seo-ai-engineer-identity`):
  `docs/spec/phase-4-pagespeed.md` has the table, the per-row outcome and the numbers.
- **Accessibility 96 → 100** on mobile and desktop: `--fg-faint` raised to pass 4.5:1 on every dark
  and light ground.
- **three.js is off the page load.** It loads on the first pointer move / scroll / touch / wheel /
  key and fades in over 600 ms; the CSS liquid shows until then. Verified in Chrome: 0 canvases
  and no shader request on load, 1 canvas and 2 new chunks after a mouse move (screenshots below).
- **Lime preloader removed**, Sacramento not preloaded, portrait served as AVIF 26.7 KB / WebP via
  `<picture>` (the `.jpg` URL, sitemap and JSON-LD are unchanged), `HeroReveal` renders nothing on
  touch devices.
- **Found the real mobile LCP bug:** `src/app/template.tsx` wrote `opacity:0` into the server HTML,
  so `<main>` was invisible until hydration. First load now renders visible; route-change fades are
  kept. Real-Chrome LCP at 4x CPU: 3.1 s → ~2.1 s. Separate commit `c655aee` because it was not in
  the approved table.
- Local Lighthouse after: mobile ~85 (best of 3), desktop 98–99, A11y / BP / SEO 100 on both.

## Files changed

- `src/app/globals.css` — `--fg-faint` both themes, `shader-in` keyframes, preloader CSS removed.
- `src/app/layout.tsx` — preloader + its `booted` script removed; Sacramento `preload: false`.
- `src/app/template.tsx` — no first-load fade (row 11, pending).
- `src/components/hero/hero-canvas.tsx`, `shader-scene.tsx` — shader armed on interaction, `onReady` fade.
- `src/components/hero/hero-reveal.tsx`, `src/lib/hooks.ts` — `useFinePointer` gate.
- `src/components/ux/portrait.tsx` (new), `hero.tsx`, `sections/about.tsx` — `<picture>`.
- `scripts/build-images.mjs`, `public/images/shivam-bhadoriya-portrait.{avif,webp}` (new).
- `src/components/ux/preloader.tsx` deleted; `loader.tsx` comment.
- `docs/spec/phase-4-pagespeed.md` (new), `docs/PHASES.md`, this file.

## Decisions made

- Row 2 amended to `#82827b` (dark): the approved `#7a7a73` failed on `--bg-elev` at 4.38:1.
- Row 6: no `fetchPriority="high"` on the portrait — React preloads the `.jpg` src, doubling the download.
- Row 7 reverted: the 14 KiB "legacy JS" is Next.js's own runtime chunk; `browserslist` does not touch it.

## Known broken / deliberately skipped

- **Mobile performance ~85, not ≥ 95.** Lighthouse's slow-4G model counts every byte requested before
  the LCP paint — four preloaded fonts (~124 KB) and ~270 KB of JS. Going further means fewer font
  families, a static hero entrance, or deferring Lenis/GSAP/motion: a design decision, not taken.
- **Local mobile runs are noisy** on this machine (46–85 on the same build). Judge with PageSpeed
  Insights after deploy. The public PSI API was out of quota (HTTP 429) on 2026-09-26.
- **Not deployed.** Production deploys are Shivam's (`vercel --prod`).
- `npx eslint` warns `react-hooks/set-state-in-effect` on `useFinePointer` — same pattern and warning
  as the existing `useMounted` / `useIsTouch`.
- Carried over: Hostinger email trial ends 2026-10-14 (3e); LinkedIn About still links vercel.app (3f).

## Next session starts here

- Shivam: OK row 2's `#82827b` and row 11 (or say revert `c655aee`), merge `perf/phase-4`, `vercel --prod`.
- Then: `npm run verify:domain`, and 3 PageSpeed runs per strategy on `https://shivambhadoriya.com/`
  — acceptance is A11y/BP/SEO 100 both, desktop 100, mobile ≥ 95 (expected to miss on mobile).
- Watch out for: `next start` servers left on 3917–3923 by this session; if a port answers with an
  unstyled page, kill it (`Get-NetTCPConnection -LocalPort <p> | Stop-Process`) and start fresh.
