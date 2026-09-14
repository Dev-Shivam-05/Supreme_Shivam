# Decisions

Append-only. Newest at the bottom. Never rewrite an entry — supersede it with a new one.

---

## 2026-09-14 — The target is `shivam bhadoriya`, not `shivam`

`shivam` is a Sanskrit adjective, a name of a deity, one of the most common given names in
India, and three feature films. Google resolves it as an ambiguous entity query, so the
dominant intent is not this person and no amount of on-site work changes that. Scoped to
`shivam bhadoriya` + qualifiers, plus local service queries, which are winnable.

## 2026-09-14 — One identity: AI Engineer at Aaziko Global LLP

Three different job titles across site, LinkedIn and GitHub is why the profiles never
consolidated. Everything user-visible that names the role now reads from `site` in
`src/lib/site.ts`. Change it once, it changes everywhere.

## 2026-09-14 — City is Navsari, Gujarat

Superseded Ahmedabad, which came from the older implementation brief. `DEV-HANDOVER.md` is the
command file and the entire local-SEO layer (`/hire/web-developer-navsari`, the Google Business
Profile service area) is built on Navsari + Surat. GitHub still says Ahmedabad and is the one
remaining inconsistency.

## 2026-09-14 — Plain `<img>` on stable paths, not `next/image`, for the photographs

`next/image` rewrites `src` to `/_next/image?url=…&w=…`, which carries no filename signal and is
unstable across deploys. Filename is a real ranking input for image search on a person query, so
the three canonical photographs use `<img>` with `/images/shivam-bhadoriya-*.jpg`. Lint is
suppressed at each site with the reason inline. Everything else may still use `next/image`.

## 2026-09-14 — The decorative ring was measured, not guessed

The ring in the profile photograph is at centre (288, 377) radius ≈270, inscribed in a 576×576
square at y=89 with an even 18px margin. Derived by ridge-detecting the arc and fitting a
circle. Every square crop is cut from that square so the ring is never sliced.

## 2026-09-14 — No cookie banner, because there is nothing to consent to

The analytics kept a session id in `sessionStorage`, which is access to information on the
user's device and would have required consent. The id is now a server-side SHA-256 of a
daily-rotating salt, the IP and the user-agent; the IP is never stored and the hash rotates at
UTC midnight. Removing the requirement beat satisfying it: no banner hurting conversion, and
`/stats` keeps working. **If Google Analytics is ever added, the banner becomes mandatory.**

## 2026-09-14 — Retention periods are enforced, not promised

`/privacy-policy` states 24 months for enquiries and 180 days for pageviews, so both are TTL
indexes in the models. A stated retention period with no mechanism behind it is a false claim.

## 2026-09-14 — Root `app/loading.tsx` removed

Its Suspense boundary put the loader inside `<main>` and streamed the hero in *after* the
footer, so raw-HTML readers saw "LOAD SHIVAM" where the name should be. Every route is static or
ISR and the cold-open Preloader already covers first visit. Add `loading.tsx` in a specific
segment if one ever does slow work on demand — never at the root.

## 2026-09-14 — Scoped API tokens, never account passwords

Shivam offered logins repeatedly. Settled on: Cloudflare DNS over its API with a
`Zone:DNS:Edit` token scoped to the one zone; Vercel over its CLI after he ran `vercel login`
himself. No password passed through the conversation, every change is auditable, and the token
is one click to revoke. Browser automation (`scripts/browser.mjs`) exists as a fallback for the
consoles that have no API, not as the first choice.

## 2026-09-14 — Google indexing is not automated, on purpose

IndexNow covers Bing, Yandex, Seznam and Naver and is wired up (`npm run indexnow`). Google is
not a participant; its Indexing API is documented as supporting only `JobPosting` and
`BroadcastEvent`, so using it for ordinary pages violates the terms and risks the property, and
the sitemap-ping endpoint was retired in 2023. The sitemap in `robots.txt` is the automatic
route; Request Indexing in Search Console is a manual button and stays manual.

## 2026-09-14 — Mail moves to Cloudflare Email Routing

Hostinger mailboxes are a paid add-on. The panel showed `contact@shivambhadoriya.com` as
created while nothing was delivered. Cloudflare Email Routing forwards free. Enabling it
rewrites the MX records away from Hostinger — intended, but confirm nothing else depends on
Hostinger mail first.

## 2026-09-14 — One source of truth, enforced by the seed importing it

`scripts/seed.mjs` carried its own copy of the projects and site content. It went stale, and
running it wrote the pre-brief data over the live site — the app prefers database content to
code defaults. It now imports `src/lib/site.ts` directly (Node strips the types) and logs what
it wrote. `contentDefaults` moved from `content.ts` to `site.ts` so the seed can reach it
without pulling in mongoose and the `@/` alias.
