# Shivam Bhadoriya — Portfolio Flagship

A **multi-page, SEO-friendly, performance-expert** developer portfolio that clones the
*caliber* of landonorris.com (cinematic, chaptered, bold identity) and points it at real
engineering. The site itself is the flagship project; an extraordinary realtime
admin/analytics panel is the planned centerpiece.

## Art direction — "Velocity / Pit-Lane"
Carbon black + one loud **acid-lime** accent · huge uppercase **Anton** poster type ·
**JetBrains Mono** HUD/telemetry chrome · Space Grotesk headings · Inter body ·
motorsport motifs (start-lights preloader, timing-board work list, telemetry strips,
corner brackets, engineering grid).

## Stack
Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 (CSS-first `@theme`) ·
Motion · GSAP · Lenis · React Three Fiber/three · next-themes · lucide-react.

## Run
```bash
cd web
npm run dev     # http://localhost:3000
npm run build   # 14 routes, all statically prerendered — passes clean
```

## Pages (multi-page IA, mapped from Lando)
| Route | Content | Lando analog |
|---|---|---|
| `/` | Velocity hero · telemetry stats · scroll-lit statement · pinned horizontal work drive · Work/About gateway | Home |
| `/work` | Timing-board archive of projects (hover reveals) | On Track / Hall of Fame |
| `/work/[slug]` | Full case study: problem → approach → architecture → outcomes (SSG, 3 studies) | helmet detail |
| `/about` | The engineer + philosophy | Off Track |
| `/stack` | Capabilities / tech wall | Partnerships |
| `/lab` | Experiments + the site's own infra | Calendar |
| `/contact` | Channels + form | Store/enquiries |
| `/sitemap.xml`, `/robots.txt`, branded `/404` (DNF) | SEO + polish | — |

Every route has unique metadata + canonical, JSON-LD (Person/WebSite/ItemList/CreativeWork),
and is statically prerendered.

## Backend (MongoDB + env-configured) — all degrade gracefully when unset
| Piece | Env it needs | Endpoint / UI |
|---|---|---|
| Contact → lead store + email | `MONGODB_URI`, `SMTP_*` | `POST /api/contact` · form on `/contact` |
| Analytics pipeline (beacon → API → Mongo → rollups) | `MONGODB_URI` | `POST /api/collect` · client beacon |
| Public live analytics | `MONGODB_URI` | `GET /api/stats` · page `/stats` |
| Admin command center (auth + KPIs + charts + leads pipeline) | `MONGODB_URI`, `ADMIN_PASSWORD`, `ADMIN_SECRET` | `/admin` · `GET /api/admin/data` · `PATCH /api/admin/leads` |

Everything runs with an empty `.env`; features light up as you fill `.env.local` (see `.env.example`).
Models: `src/models/{lead,event}.ts` · connection `src/lib/db.ts` · aggregations `src/lib/analytics.ts`.

## Phase status
- [x] **Phase 3 — cinematic foundation** (design system, UX shell, R3F hero, ⌘K)
- [x] **Phase 3.5 — Velocity re-theme + full multi-page + per-route SEO**
- [x] **Phase 4 — Backend & data:** MongoDB + Mongoose, `/api/*`, Zod, real contact endpoint + email
- [x] **Phase 7/8 (first cut) — analytics pipeline + `/stats` + env-gated `/admin`** with Recharts + leads pipeline
- [x] **Density pass:** hover-image gallery, services, process, timeline, values, FAQ, proficiency, portrait imagery
- [ ] Phase 5 — move project/case-study content into the DB + an admin CRUD editor
- [ ] Phase 6 — full RBAC (owner/editor/viewer) + 2FA (currently single-password admin)
- [ ] Phase 8+ — realtime push (Socket.io), geo map, session journeys, heatmaps, dynamic OG images
- [ ] Phase 10/11 — Lighthouse CI, a11y audit, deploy

## Notes
- Content is a typed seed in `src/lib/site.ts`. Project imagery uses `picsum.photos` placeholders
  (allowed in `next.config.ts`) — drop your own files in `/public` and update `image`/`imageHover`.
- Contact posts to a rate-limited API (honeypot + Zod); mailto is the fallback if the API errors.
- Preloader greets once per session; all motion honors `prefers-reduced-motion`.
