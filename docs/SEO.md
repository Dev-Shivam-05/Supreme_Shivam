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
| `src/lib/site.ts` → `phone` | **Empty.** | You said the number should be public on the site and the Business Profile. Send it and it goes into the service pages, /contact and the `ProfessionalService` schema. Until then every consumer omits the block rather than rendering a blank. |
| `src/components/seo/json-ld.tsx` → `sameAs` | Instagram is **not** listed | The handle linked from your GitHub (`__https.https`) could not be verified. A `sameAs` pointing at a wrong profile is worse than omitting it. Confirm the URL and it goes in. |
| `src/lib/services.ts` → `timeline` | Conventional ranges, not measured | "2–6 weeks", "6–10 weeks", "1–3 weeks per workflow" are normal for a solo developer but are not drawn from your own past jobs. They live in one place — correct them if they are wrong. |

Also unconfirmed: the **AI-PULSE** entry in `src/lib/site.ts` was written from the brief alone.
The stack list is deliberately minimal (`GitHub Actions`, `Scheduled workflows`,
`YouTube Data API`, `CI tests`) — fill in the real one and add the `repo` / `live` URLs.

And the **mobile app** service page: your shipped work is all web. The page is written honestly —
it leads on the backend, which is where your production experience actually is — but if you have
not shipped a React Native app, either ship one or tell me and I will soften it further.

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

## 4. Regenerating the images

```
npm run images
```

Rebuilds every derived image from the two source photographs in `/images`. It measures the
decorative ring in the profile shot rather than guessing at it, so square crops never slice it.
**Do not rename the outputs** — the JSON-LD, the image sitemap and the OG tags reference the
exact paths.

## 5. How to judge this, 4–8 weeks after the domain is live

Search `shivam bhadoriya` in a logged-out incognito window. The win condition is your site,
LinkedIn, GitHub and X holding four of the top five results, with your photo in the image row.

`shivam` on its own is not the win condition, and was never reachable.
