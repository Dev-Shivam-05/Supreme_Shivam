# SEO — what's built, and what only you can do

Last updated: 2026-09-14. Source of truth for the plan: `portfolio-implementation-brief.md`.

The target is **not** ranking for the bare word `shivam` — that query belongs to Wikipedia,
cricketers, actors and three feature films, and no work on this site changes it. The target is:
when someone who has heard your name looks you up, every result is you, your face is there, and
the story is the same everywhere.

---

## 1. The five manual steps. Nothing below works without these.

### 1.1 Use the same photo everywhere — 10 minutes, biggest single win after the domain

Upload **`public/images/shivam-bhadoriya-ai-engineer.jpg`** (1000×1000) as your profile picture on:

- [ ] LinkedIn
- [ ] GitHub
- [ ] X

Google clusters a person across sites partly by image similarity. Four different photos is four
weak signals; one photo on four sites is one strong one. This is the file the site's JSON-LD,
image sitemap and favicon all point at, so it has to be the one on your profiles too.

### 1.2 Make the job title identical everywhere

The site now says **AI Engineer at Aaziko Global LLP, Navsari** in the title, the H1 area, the
structured data and the social card. Make LinkedIn, GitHub and X say the same. Three different
titles for one name is the main reason the profiles never consolidated.

### 1.3 Wire up the domain, the mailbox, Search Console and the Business Profile

`shivambhadoriya.com` is bought. **Every remaining click is in
[DOMAIN-SETUP.md](DOMAIN-SETUP.md)** — DNS records, SSL, the `contact@` mailbox, the Vercel
environment variables, Google Search Console, Bing, and the Google Business Profile, in order,
with a verification step after each one.

Two things from it worth repeating here because they are the expensive mistakes:

- **The Cloudflare proxy cloud must be grey, not orange,** on the Vercel DNS records. Orange breaks
  SSL and produces a redirect loop.
- **Do not set `NEXT_PUBLIC_SITE_URL` until `https://shivambhadoriya.com` returns 200.** The
  redirect in `next.config.ts` is deliberately guarded so it stays off until you do; setting it
  early 301s the live site into a host that does not resolve, and browsers cache that hard.

### 1.4 Google Business Profile — free, and the biggest lever for local leads

Step 7 of DOMAIN-SETUP. It is what puts you in the boxed map results for "web developer near me" in
Navsari, which for local service queries outranks anything a website alone can do.

### 1.5 Validate the structured data

<https://search.google.com/test/rich-results> — the home URL must report **ProfilePage** with zero
errors, and any `/hire/*` URL must report **FAQPage** with zero errors.

---

## 2. Two things in the code I could not confirm — check them

| Where | What | Why it matters |
|---|---|---|
| — | **Nothing outstanding.** | Phone, timelines, the app question, Instagram and the AI-PULSE stack were all answered on 2026-09-14 and are in the code. |

**AI-PULSE** is now described from the repository itself, not from the brief: Python, GitHub
Actions, FFmpeg, Playwright, text-to-speech, the YouTube Data API and pytest, with the cheat-sheet
PDFs on GitHub Pages and the Telegram/X announcements. Repo and live links are wired in.

`sameAs` now lists five profiles: GitHub, LinkedIn, X, Instagram and WakaTime.

**Settled 2026-09-14:** phone `+91 91069 88376` is live on the service pages, `/contact` and the
`ProfessionalService` schema. Timelines are your own figures — web 1–4 weeks, mobile 2–8 weeks,
automation 1–2 weeks per workflow. The mobile page now states plainly that shipped app work is under
client confidentiality and names nothing; it leads on the backend layer, which is public and
inspectable. If the app clears review and the client lets you show it, tell me and it becomes a
case study.

---

## 2b. The cookie banner you do not need

DEV-HANDOVER asks for a consent banner *if* non-essential cookies or storage are used. The
analytics used to keep a session id in `sessionStorage`, which would have required one.

It no longer does. The visitor id is now derived server-side from a daily-rotating salted hash of
IP and user-agent — the IP itself is never stored, and the hash changes at midnight UTC so days
cannot be joined together. The contact form hashes the sender's IP too, and enquiries auto-delete
after 24 months.

Net effect: no cookies, no device storage for analytics, nothing to consent to, no banner hurting
your conversion rate, and the `/stats` page keeps working. `/privacy-policy` says exactly this and
is linked in the footer of every page.

**If you ever add Google Analytics, the banner becomes mandatory again.** Tell me before you do.

## 3. What the code already does

- **One identity.** Everything user-visible that names the role reads from `site.role`,
  `site.company` and `site.address` in `src/lib/site.ts`. Change it once, it changes everywhere.
- **The name is in the raw HTML.** `curl -s <url> | grep "Shivam Bhadoriya"` returns 50+ hits,
  including a contiguous instance inside the first 100 words of `<main>`. Exactly one `<h1>`.
- **The photographs are indexable.** Plain `<img>` on stable, name-carrying paths — *not*
  `next/image`, because `/_next/image?url=…` carries no filename signal and changes between
  deploys. Every instance has alt text containing your full name.
- **`max-image-preview: large`** is set, which is what permits a full-size thumbnail next to the
  result. Without it the photo cannot show at usable size.
- **Structured data.** `ProfilePage` → `Person` (with the full node embedded, not just an `@id`
  reference) + a `WebSite` node on every route. No `TODO`s.
- **Image sitemap.** Both photographs are listed against the pages they actually appear on.
- **`/writing`.** Four posts, `BlogPosting` + `BreadcrumbList` per post, author pointing at the
  Person node. This is the page that gives the site something to rank *with*.
- **Email.** `contact@shivambhadoriya.com`, assembled after hydration (`src/lib/email.ts`) so it is
  not in the server HTML or the RSC payload, but kept in the JSON-LD where it helps. The old Gmail
  address is gone from the site entirely.
- **Five commercial pages.** `/services/web-development`, `/services/mobile-app-development`,
  `/services/ai-automation`, `/hire/web-developer-navsari`, `/hire/web-developer-surat` — each
  1,000+ words, with an H1 naming the service and the place, a starting price, a timeline, proof
  linking to real case studies, a six-question FAQ, and `ProfessionalService` + `FAQPage` +
  `BreadcrumbList` schema. Indexed from `/services` and the footer.
- **Legal.** `/privacy-policy` and `/terms`, written from what the code actually does, linked in
  the footer of every page.

## 3b. Verifying a deploy

```
npm run verify:domain              # checks https://shivambhadoriya.com
npm run verify:domain -- http://localhost:3000   # dry run against a local build
```

Read-only, changes nothing, and checks all of it: the 301 off the old host, the canonical, the
title, the name in raw HTML, one `<h1>`, `max-image-preview`, that the JSON-LD parses and says
`AI Engineer` with at least three `sameAs` profiles, that all three photographs return 200, that
robots and the sitemap name the right host, that every service page returns 200 with
`ProfessionalService` + `FAQPage` and 600+ words, and that no page still says Ahmedabad or carries
the old address. Run it after every deploy and send me the output.

## 4. Regenerating the images

```
npm run images
```

Rebuilds every derived image from the two source photographs in `/images`. It measures the
decorative ring in the profile shot rather than guessing at it, so square crops never slice it.
**Do not rename the outputs** — the JSON-LD, the image sitemap and the OG tags reference the
exact paths.

**Do not resize the icons either.** Google only uses a site's own favicon in a search result if
the file is a **multiple of 48px square** (48, 96, 144, 192…). `icon.png` shipped at 256×256 and
`favicon.ico` at 32×32 — both held the right photograph, but neither size qualifies, so the
listing showed Google's grey globe placeholder instead of his face. Fixed 2026-09-20 to 192×192
and 48×48. `apple-icon.png` stays 180×180; that is Apple's spec and never appears in results.

After any favicon change Google has to **recrawl the home page** before the result updates —
days to a few weeks, and there is no API to force it. The only push available is Search Console →
URL Inspection → Request Indexing on `https://shivambhadoriya.com/`.

## 5. How to judge this, 4–8 weeks after the domain is live

Search `shivam bhadoriya` in a logged-out incognito window. The win condition is your site,
LinkedIn, GitHub and X holding four of the top five results, with your photo in the image row.

`shivam` on its own is not the win condition, and was never reachable.
