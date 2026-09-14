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

The site now says **AI Engineer at Aaziko Global LLP, Ahmedabad** in the title, the H1 area, the
structured data and the social card. Make LinkedIn, GitHub and X say the same. Three different
titles for one name is the main reason the profiles never consolidated.

### 1.3 Buy the domain

1. Buy **`shivambhadoriya.com`** (fall back to `.dev`, then `.in`).
2. Point it at this Vercel deployment.
3. In Vercel → Settings → Environment Variables, set:
   ```
   NEXT_PUBLIC_SITE_URL=https://shivambhadoriya.com
   ```
4. Redeploy.

That one variable moves everything: canonical URLs, `metadataBase`, the JSON-LD `@id`s, the OG
image URLs, `sitemap.xml`, `robots.txt`, and the 301 from `shivam-bhadoriya-dev.vercel.app` and
from the `www` variant.

**Do not set that variable before the domain resolves.** The redirect in `next.config.ts` is
deliberately guarded so it stays off until then — a 301 into a domain that does not exist is
cached hard by browsers and is very painful to undo.

### 1.4 Search Console and Bing

- [ ] Add the new domain as a property in [Google Search Console](https://search.google.com/search-console)
- [ ] Submit `https://shivambhadoriya.com/sitemap.xml`
- [ ] Request indexing manually for `/`, `/about` and `/writing`
- [ ] Same in [Bing Webmaster Tools](https://www.bing.com/webmasters) (it can import from GSC)

Without this, expect 2–6 weeks before anything moves. With it, days.

### 1.5 Validate the structured data

Paste the live URL into <https://search.google.com/test/rich-results>. It must report
**ProfilePage** with zero errors, with `sameAs` listing GitHub, LinkedIn and X.

---

## 2. Two things in the code I could not confirm — check them

| Where | What | Why it matters |
|---|---|---|
| `src/lib/site.ts` → `university` | Currently **"VidhyaDeep University"** | Your profiles spell it three ways (`Vidyadeep`, `VidhyaDeep`, `Vidhyadeep`). Pick whatever the LinkedIn education dropdown says, put that exact string here, and make all four places match. |
| `src/components/seo/json-ld.tsx` → `sameAs` | WakaTime and Instagram are **not** listed | A `sameAs` pointing at a wrong or dead profile is worse than omitting it. Send me the URLs if they are public and yours, and they go in. |

Also unconfirmed: the **AI-PULSE** entry in `src/lib/site.ts` was written from the brief alone.
The stack list is deliberately minimal (`GitHub Actions`, `Scheduled workflows`,
`YouTube Data API`, `CI tests`) — fill in the real one and add the `repo` / `live` URLs.

---

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
- **Email.** Assembled after hydration (`src/lib/email.ts`) so the address is not in the server
  HTML or the RSC payload, but kept in the JSON-LD where it helps.

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
