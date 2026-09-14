# HANDOFF — Supreme_Shivam — Phase 3 (domain, database, admin) — 2026-09-14

## Done

- **https://shivambhadoriya.com serves the site over SSL.** `www` and the old
  `shivam-bhadoriya-dev.vercel.app` host both 308 to the apex. `npm run verify:domain`
  reports **29 passed, 1 warning, 0 failed**.
- **DNS is correct and mail-safe.** Hostinger registration, Cloudflare nameservers,
  `A @ → 76.76.21.21` and `CNAME www → cname.vercel-dns.com`, both proxy-off. MX, SPF and
  DMARC untouched. Five DKIM/autoconfig CNAMEs that Cloudflare had imported *proxied* were
  un-proxied — left as they were, DKIM would have failed and outbound mail would have
  started landing in spam.
- **Identity is one person everywhere.** AI Engineer at Aaziko Global LLP, Navsari, Gujarat.
  Title, H1, H2, hero copy, `ProfilePage` → `Person` with five `sameAs` profiles, phone
  `+91 91069 88376` on the `ProfessionalService` nodes.
- **Five commercial pages live**, 1,223–1,421 words each, each with `ProfessionalService` +
  `FAQPage` + `BreadcrumbList`, a ₹30,000 starting price and a real timeline.
- **Database live.** Dedicated `shivambhadoriya` database on Atlas; `projects`, `settings`,
  `leads`, `events`, `media`. `/api/stats` returns `configured: true`. A submitted enquiry is
  stored and visible in the admin.
- **Admin works at /admin** with two passwords, verified against the live domain
  (both 200, wrong password 401).
- **Indexing: IndexNow done** — all 26 URLs accepted, reaching Bing, Yandex, Seznam, Naver.
  Google Search Console property is verified by Shivam.

## Files changed

- `src/lib/site.ts` — single source of truth: identity, Navsari address, phone, rate,
  `contentDefaults` (moved here so the seed can read it without mongoose), real AI-PULSE stack.
- `src/lib/services.ts` — five service/hire pages with Shivam's own timelines.
- `src/lib/legal.ts`, `src/app/privacy-policy/`, `src/app/terms/` — written from what the code
  actually does, not a template.
- `src/lib/writing.ts`, `src/app/writing/` — four posts, the text layer the site had none of.
- `src/components/seo/json-ld.tsx` — Person/WebSite graph, ProfilePage with the Person node
  embedded, ProfessionalService and FAQPage builders.
- `src/lib/auth.ts`, `src/lib/env.ts` — `ADMIN_PASSWORDS` list, SHA-256 digest comparison.
- `src/app/api/collect/route.ts`, `src/components/analytics/beacon.tsx` — cookieless analytics.
- `src/models/lead.ts`, `src/app/api/contact/route.ts` — IP hashed not stored, 24-month TTL.
- `scripts/build-images.mjs` — every derived image from the two source photographs.
- `scripts/seed.mjs` — **rewritten** to import `src/lib/site.ts` instead of a stale duplicate.
- `scripts/verify-domain.mjs`, `scripts/cloudflare-dns.mjs`, `scripts/indexnow.mjs`,
  `scripts/cloudflare-email.mjs`, `scripts/browser.mjs` — the operational tooling.
- `src/components/layout/nav.tsx` + `globals.css` — `.nav-panel`; the scrolled bar was 3.5%
  white and page headings read straight through it.

## Decisions made

- **Navsari, not Ahmedabad.** DEV-HANDOVER is the command file and the whole local-SEO play is
  built on Navsari + Surat. GitHub still says Ahmedabad and must be changed by hand.
- **Scoped API tokens, never account passwords.** Cloudflare DNS was done over the API with a
  `Zone:DNS:Edit` token; Vercel over its CLI after Shivam authenticated. Nothing was typed into
  a dashboard by an agent and no password passed through the conversation.
- **No cookie banner, because there is nothing to consent to.** The analytics session id moved
  from `sessionStorage` to a server-side daily-rotating salted hash. Removing the requirement
  beat satisfying it.
- **Google indexing is not automated, deliberately.** Google is not an IndexNow participant and
  its Indexing API is documented as JobPosting/BroadcastEvent only — using it for ordinary pages
  violates the terms. Sitemap in robots.txt is the automatic route; Request Indexing is manual.
- **Plain `<img>` on stable paths, not `next/image`,** for the three photographs. A
  `/_next/image?url=…` URL carries no filename signal and changes between deploys.

## Known broken / deliberately skipped

- **`contact@shivambhadoriya.com` does not receive mail.** Hostinger mailboxes are a paid
  add-on, so the panel shows the address as created while nothing is delivered. The address is
  printed on five service pages, so this is the highest-priority open item.
  `scripts/cloudflare-email.mjs` is written and ready but needs a token with Email Routing
  permissions — the current one is DNS-only and returns 403.
- **SMTP is unset**, so the contact form stores the lead but sends no notification. Leads are
  safe in the `leads` collection and visible in /admin.
- **Mobile LCP is ~5.3s** against the brief's 2.5s target. It was ~5.1s before this work, so it
  is pre-existing, not a regression. Ruled out the cold-open, the nav entrance and the portrait
  preload. It is paint and compositing cost in the effects system. Phase 4.
- **`.hud` fails WCAG AA** (`--fg-faint` on dark, ~3.2:1). A design-token decision, so it needs
  Shivam's call.
- **Two credentials are in the session transcript** and should be rotated: the Cloudflare API
  token (printed to the terminal by mistake while debugging `.env.local`) and the Atlas password.

## Next session starts here

- **Phase 3e:** finish inbound mail so `contact@shivambhadoriya.com` actually receives, then
  wire SMTP so the contact form notifies.
- **First command:**
  ```
  node scripts/cloudflare-email.mjs aaziko.com@gmail.com
  ```
  (dry run; needs a replacement `CLOUDFLARE_API_TOKEN` in `.env.local` carrying
  `Zone:DNS:Edit`, `Zone:Email Routing Rules:Edit` and `Account:Email Routing Addresses:Edit`)
- **Watch out for:** enabling Cloudflare Email Routing **rewrites the MX records** and cuts
  Hostinger mail off. That is the intent here, but confirm Shivam is not relying on a Hostinger
  mailbox for anything else first. And the destination inbox must be verified by clicking a link
  Cloudflare emails — forwarding silently does nothing until then.
