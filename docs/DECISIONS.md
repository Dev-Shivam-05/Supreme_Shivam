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

## 2026-09-16 — Keep the old vercel.app Search Console property verified via its meta tag

After the move to shivambhadoriya.com the name search stopped showing the site. Technical SEO
on the new domain was clean; the gap was that the redesign had dropped the
`google-site-verification` tag that verified `shivam-bhadoriya-dev.vercel.app`. Change of Address
needs that property verified. Search Console follows redirects for meta-tag verification (not
for HTML files), so the tag is served on the new site and reaches Google through the redirect.
Legacy and www redirects now send an explicit 301 instead of Next's default 308, since the
Change of Address check is documented against 301.

## 2026-09-16 — Console automation drives a hand-signed-in Chrome over CDP

Google sign-in refuses Playwright-launched Chrome. `scripts/cdp.mjs start` opens plain Chrome
with a localhost-only debugging port and its own profile; Shivam signs in and approves every
OAuth consent personally, then the script attaches. Used to confirm the Google Change of Address
and set up Bing Webmaster Tools. Final confirm buttons are clicked only for steps Shivam asked for.

## 2026-09-16 — Social profiles are edited by hand, except GitHub

Phase 3f needed shivambhadoriya.com on every `sameAs` profile. GitHub profile fields have an API
(`gh api -X PATCH user`), so GitHub is the only one the agent edits. LinkedIn loads a PerimeterX
anti-scraping frame that froze the CDP session, and editing the profile risks a restriction on
Shivam's account. The permission classifier also blocks the agent from changing a real account.
Instagram needs a sign-in the agent does not have. LinkedIn's "Greater Surat Area" is accepted
as the location: it is LinkedIn's metro area for Navsari.

## 2026-10-23 — Analytics events are classified, never deleted, and the rule runs at read time

The admin panel reported 257 pageviews and 161 unique visitors. Both were true reads and both
flattered the site: 38 events were this project's own headless Chrome (Lighthouse and
`scripts/cdp.mjs` — 2026-09-26 alone logged 53 views across 7 sessions, Phase 4 PageSpeed day),
40 more carried no `x-vercel-ip-country` header, and `sessionId` rotates at UTC midnight so the
"unique visitors" figure was always counting session-days rather than people.

Every event is now labelled `human | untagged | bot`. The rule runs as a `$switch` inside the
aggregation rather than reading a stored field, because 257 rows were banked before the field
existed and a number that only counts rows written after the fix is worse than no number;
`api/collect` writes the same label going forward, so one rule governs old and new rows and the
two implementations must be changed together. Bot rows are classified, never deleted — removing
evidence to improve a chart is how the panel became untrustworthy in the first place.

`country: "Unknown"` is its own `untagged` class and is never described as self-traffic. The
missing header is provable; "it was localhost" is not. A provenance strip prints the full split
under every view, and human + untagged + bot summing to the ALL total is the regression test that
the two copies of the rule have not drifted.

## 2026-10-23 — /admin renders without the public nav, footer and Lenis

The admin deck is a full-height application, not a page on the site, and the public shell actively
prevented three things it needs: a sidebar pinned to the viewport (Lenis's transformed wrapper
breaks `position: sticky` inside it), the whole viewport height (the fixed nav and footer eat
~220px), and Cmd-K for its own palette (the public one binds that key globally).

A nested layout cannot remove a parent layout's chrome in the App Router, so the split lives in
one client component, `src/components/layout/chrome.tsx`, which checks `usePathname()`. Public
routes render exactly what `layout.tsx` rendered before; `/admin` gets a bare `<main>`. This was
preferred over duplicating the root layout or adding a pathname check inside each of Nav, Footer,
ScrollProgress and the public CommandPalette.


## 2026-10-23 — Visitor intelligence is consent-gated and gender is never inferred

Shivam asked to know whether a visitor is male or female, a person or an organisation, how they
arrived and why. His own research package, `visitor_intelligence_reference/`, settles the first
one: its README rejects "gender fields" and "sensitive-trait scoring", and `test_no_gender_property`
asserts the rejection. There is also no honest signal for gender in web traffic. The ingest refuses
any `gender` key and the admin shows "Gender — not collected (policy)" as `not_applicable`, so the
decision is visible rather than silent.

The other three are built the way the reference allows. Person-or-organisation becomes two separate
rows that are never merged: what the visitor typed on the contact form (`self_reported`), and the
public registry owner of their network (`inferred`, `possible_network_association`, confidence
null) — never "they work at X". Arrival is a controlled category, not a URL. "Why" is four
abstaining, unvalidated rules that list their evidence, the alternatives and the unknowns, and
never trigger outreach. Nothing journey-level is collected until the visitor opts in to each
purpose separately; the cookieless aggregate tier from Phase 2 keeps running for everyone.

## 2026-10-23 — Network owner from public RDAP, by prefix, with no vendor

The reference lists IPinfo, Leadfeeder, Bombora and others as holds: none has a measured accuracy
for this site, and each needs an account and a contract. Public RDAP gives the registered owner of
a network for free. The lookup uses the IANA bootstrap and five allowlisted registries, follows no
redirects, and sends the /24 (IPv4) or /48 (IPv6) network address — never the visitor's address,
which is not stored anywhere. Results are cached 30 days under an HMAC of the prefix. It runs only
for visitors who granted the `organization` purpose, so it will cover few visits; that is the cost
of doing it honestly.

## 2026-10-23 — Enquiries stay at 24 months, against the reference's 90-day suggestion

The reference suggests deleting inquiry records 90 days after last activity and calls it "a design
proposal, not a universal legal requirement". The privacy policy already discloses 24 months, and
an enquiry is how an agreement with a client is evidenced; three months could destroy that trail.
Everything else in the reference's retention table is followed as written.

## 2026-10-23 — The engine is a port of reference.py, tested by the reference's own tests

Rather than reinterpret the Python model, `src/lib/vi/engine.ts` ports it check for check, over an
async `Store` so MongoDB serves production and memory serves tests. The 32 tests of
`test_reference.py` run under their original names against the production engine with the
reference's synthetic catalog — the two schema tests execute the reference `schema.sql` in Node's
built-in SQLite. Where TypeScript forced an adaptation (no naive Date; retries now back off), the
test header says so. Storage stays MongoDB rather than the PostgreSQL the reference suggests,
because the codebase is Mongo; tenant keys become `siteId` in every filter.


## 2026-10-23 — A link names a session's events, not a journey

The independent review caught the admin presenting a linked enquiry's name and email as if they
described the whole 22-day journey. The reference's links are event-scoped, and the privacy policy
promises that only "the pages you viewed in that browser session" are attached. The list view now
knows only that a link exists; the detail shows the identity with its scope on every row it
touches and marks exactly the linked events. Network evidence and other sessions are never shown
as belonging to the person.

## 2026-10-23 — Erasure order is tombstone, revoke, delete

Revoking first meant a failed tombstone write left a revoked grant that every retry and sweep
skipped, with the journey still readable. The tombstone now lands first: from that instant every
read and every new event treats the epoch as gone, and a retry of an idempotent withdraw finishes
whatever was interrupted. On erasure the production store also drops the window and replaces the
epoch id on the 90-day consent record with its keyed hash, so nothing left behind can be joined
back to anything.

## 2026-10-23 — Every IP-derived hash is keyed

`sha256(salt|ip)` with a default salt is reversible by hashing the whole IPv4 space. The contact
form's spam hash and the aggregate tier's daily visitor id are now HMACs under ANALYTICS_SALT or a
labelled subkey of ADMIN_SECRET. The contact form stores no hash at all when neither exists. The
privacy policy now says "without the server's key it cannot be turned back", which is true,
instead of "cannot be turned back", which was not.


## 2026-10-23 — "Data from the first click" goes to Phase 6b, inside the reference

At the end of Phase 6 Shivam restated the goal: gather data from the moment a visitor opens the
site with one click, and said the reference file was written for that. The reference says the
opposite for per-visitor data — "Default deny individual-journey collection until explicitly
authorized", "Start at the first accepted, permitted page-view report, not the first HTTP hit" —
and makes organisation enrichment a separately authorized purpose. What is already collected for
every visitor on the first hit is the cookieless aggregate tier (path, referrer host, campaign
codes, country, device, browser, OS, a keyed daily hash).

Phase 6b closes the gap within those rules: the consent card on the first page load so one click on
"Allow" starts the journey at the landing page, and the arrival category plus landing content ID
added to the anonymous aggregate tier for every visitor. Aggregate network-kind counts without
consent are a grey area and go to Shivam as an explicit question. Per-visitor collection before
consent is not built by default; if Shivam reaffirms it after hearing the conflict, that is his
decision to record here, and the privacy policy must then say exactly what is collected.

## 2026-10-23 — Phase 6b: first-load consent card is compact; the aggregate tier gains arrival, landing page and region

Approved `go` (spec `docs/spec/phase-6b-first-click.md`). The consent card now prompts on the first
page load (idle, capped at 1200 ms) so one click on Allow starts the journey at the landing page.
Shown at full size there, it covered both hero CTAs at 1440 and 390, against Phase 6 D4, so the
first-load card is compact (row 8, approved `go`): bottom-right from 640 px, a 150 px strip below
that, Allow granting `journey` only, Choose opening the full card in place.

Every pageview in the cookieless tier now carries `entry` (a closed category), `contentId`
(derived on the server from the path), `region` and `timezone` (Vercel IP headers, shape-checked)
and `geoSource: "ip_network"`. City is deliberately not stored there: city + daily hash + device
narrows to one person in a small town; it waits for consent (Phase 6d). Aggregate network-kind
counts were not built (no `yes 7`).

The master "Visitor Radar" prompt of the same day is split into phases 6b–6g on the board. Its
"60–70% collection without consent" figure is not adopted as a target; measured coverage is
(Phase 6f). Per-visitor 30/60-day forecasts are not possible while journeys are erased at day 22.

## 2026-10-23 — Phase 6c: radar work goes through a durable queue; the network block is sealed for retries

Approved `go` (spec `docs/spec/phase-6c-radar-orchestration.md`). Rule runs and RDAP lookups move
from fire-and-forget `after()` to `vi_jobs`, enqueued inside the request and drained from `after()`
(3 jobs / 8 s) and the daily sweep (200 / 50 s). Vercel cron here is daily, so traffic has to drive
most runs.

A retry needs the network after the request is gone, and a keyed hash cannot be looked up. So the
/24 or /48 block (never the address) is stored AES-256-GCM-sealed under a labelled subkey of the VI
root key, for at most 24 h, and unset the moment the job settles. The privacy policy says so.
Rotating the root key makes pending blocks unreadable: those jobs fail permanently and record
`unknown` (`payload_unreadable`), they are not retried forever.

Row 3 was amended twice during the build, both approved: the first event of a burst runs at once
(not after 10 s, which on a quiet site waited for the next visitor), and a job is not re-run within
10 s of its last run (found end-to-end: a visitor clicking slower than a run takes got one run per
event). The 10 s / O(n²) protection from Phase 6 security finding #2 holds.
