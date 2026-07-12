# GitHub publishing kit — copy‑paste ready

Everything you need to put this portfolio on GitHub and cut a clean `v1.0.0`
release. Copy each block into the matching GitHub field. Nothing here is
auto‑applied — it's yours to paste.

> Replace `Dev-Shivam-05` only if your GitHub username changes, and swap the
> Vercel URL for your custom domain once you buy one (strongly recommended — see
> the note at the bottom).

---

## 1. Repository name

**Recommended:**

```
shivam-bhadoriya-portfolio
```

Why this one: it contains your full name, so the repo URL itself
(`github.com/Dev-Shivam-05/shivam-bhadoriya-portfolio`) becomes another page that
ranks for **"Shivam Bhadoriya"**. GitHub repos rank well.

**Alternatives:** `portfolio` · `observable-portfolio` · `dev-portfolio`

---

## 2. Description (the "About" field, top‑right of the repo)

Keep it under ~350 chars. Paste this:

```
Award-grade full-stack developer portfolio — Next.js 16, React 19 & MongoDB. Cinematic WebGL UI, scroll-drawn signature, a self-built analytics pipeline, and an env-gated admin CMS. LCP ~1s · SEO 100 · fully responsive.
```

**Website field (right under it):**

```
https://shivam-bhadoriya-dev.vercel.app
```

---

## 3. Topics / tags (click the ⚙️ next to "About" → Topics)

Paste these one by one (GitHub topics must be lowercase, hyphenated):

```
nextjs  react  typescript  mongodb  mern  tailwindcss  threejs
react-three-fiber  framer-motion  portfolio  developer-portfolio
portfolio-website  fullstack  web-performance  seo  vercel
```

---

## 4. README.md  — paste everything below into `README.md`

<!-- ============ START README ============ -->

```markdown
<div align="center">

# Shivam Bhadoriya — Portfolio

**Full‑Stack Developer · MERN · Realtime systems & web performance**

A portfolio built as a *live, self‑instrumenting system* — not a set of
screenshots. Cinematic front end, real backend, self‑built analytics, and an
admin CMS. Every claim on it is inspectable.

[**Live site →**](https://shivam-bhadoriya-dev.vercel.app)

![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-19-20232a?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47a248?logo=mongodb&logoColor=white)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?logo=vercel)
![License](https://img.shields.io/badge/License-MIT-cbff3c)

</div>

---

## Highlights

- **Cinematic, engineered UI** — WebGL shader hero (React Three Fiber), a Lando‑style
  brand cold‑open, magnetic buttons, Lenis smooth scroll, and a signature that
  *draws itself stroke‑by‑stroke as you scroll* (real SVG path, not a GIF).
- **Multi‑page & SEO‑first** — Home, Work, project case studies, About, Stack, Lab,
  Contact, and a public live **/stats** page. JSON‑LD (`Person` / `WebSite` /
  `ProfilePage`), image‑enabled sitemap, tuned robots, dynamic OG images.
- **Real backend** — MongoDB + Mongoose. A self‑built analytics pipeline
  (`beacon → API → rollups`) powers the public stats page — no third‑party script.
- **Env‑gated admin CMS** — edit site copy, CRUD projects, upload media, and view
  a leads pipeline behind HMAC‑cookie auth. Nothing indexable, nothing exposed.
- **Fast for real** — CSS‑driven above‑the‑fold paint, tree‑shaken bundle,
  IntersectionObserver reveals. Measured **LCP ≈ 1.2 s mobile / 0.84 s desktop**,
  CLS 0, **Lighthouse SEO 100**.
- **Deploy anywhere in one command** — a self‑contained seed script provisions the
  database; the site also runs fully on static fallback content with **no DB at all**.

## Tech stack

| Layer      | Tools |
|------------|-------|
| Framework  | Next.js 16 (App Router, Turbopack), React 19, TypeScript |
| Styling    | Tailwind CSS v4 (CSS‑first `@theme`), custom design tokens |
| Motion/3D  | Motion, Lenis, React Three Fiber + three.js (desktop‑only WebGL) |
| Backend    | Next Route Handlers, MongoDB, Mongoose, Zod validation |
| Auth       | HMAC‑signed cookie admin session |
| Email      | Nodemailer (contact form, optional) |
| Tooling    | ESLint, Lighthouse, Playwright |

## Getting started

```bash
# 1. Install
npm install

# 2. Configure (see the table below)
cp .env.example .env.local   # then fill in the values

# 3. Seed the database (optional — the site works without it)
npm run seed

# 4. Develop
npm run dev                  # http://localhost:3000

# 5. Production build
npm run build && npm run start
```

> No `MONGODB_URI`? The site still runs — it falls back to typed static content,
> so you can develop the UI with zero infrastructure.

## Environment variables

| Variable | Required | Purpose |
|----------|:--------:|---------|
| `MONGODB_URI` | – | MongoDB connection string. Omit to run on static fallback content. |
| `ADMIN_PASSWORD` | ✅ (for admin) | Password for the `/admin` panel. |
| `ADMIN_SECRET` | ✅ (for admin) | Secret that signs the admin session cookie. Use a long random string. |
| `CONTACT_TO` | – | Where contact‑form submissions are emailed. |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` | – | SMTP credentials for the contact form. |

## Deploy to Vercel

1. Push this repo to GitHub.
2. In Vercel → **New Project** → import the repo.
   *(If the Next app lives in a subfolder, set **Root Directory** to that folder.)*
3. Add the environment variables above in **Project → Settings → Environment Variables**.
4. Deploy. Then add your custom domain under **Settings → Domains**.

After the first deploy, submit `https://<your-domain>/sitemap.xml` in
[Google Search Console](https://search.google.com/search-console).

## Scripts

| Command | Does |
|---------|------|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build (Turbopack) |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run seed` | Provision MongoDB with projects + default content |

## Project structure

```
src/
├── app/            # App Router routes, sitemap.ts, robots.ts, opengraph-image
│   ├── api/        # Route handlers: analytics, contact, admin CRUD
│   └── admin/      # Env-gated admin panel
├── components/
│   ├── hero/       # WebGL hero + reveal
│   ├── sections/   # Homepage sections
│   ├── work/       # Project gallery + case studies
│   ├── ux/         # Preloader, signature, command palette, reveal
│   └── seo/        # JSON-LD
├── lib/            # site content, SEO helpers, db, signature path
└── models/         # Mongoose models
```

## Performance & SEO

- Real‑world **LCP ≈ 1.2 s (mobile, throttled) / 0.84 s (desktop)**, CLS 0.
- Lighthouse **SEO 100 · Best Practices 100 · Accessibility 96**.
- Structured data, image sitemap, canonical URLs, dynamic Open Graph images.

## License

MIT © Shivam Bhadoriya — see [`LICENSE`](LICENSE).

## Contact

- **Portfolio:** https://shivam-bhadoriya-dev.vercel.app
- **GitHub:** [@Dev-Shivam-05](https://github.com/Dev-Shivam-05)
- **LinkedIn:** [shivam-bhadoriya-dev](https://linkedin.com/in/shivam-bhadoriya-dev)
- **Email:** shivambhadoriya1605@gmail.com
```

<!-- ============ END README ============ -->

---

## 5. Release notes — for the `v1.0.0` release

Go to **Releases → Draft a new release**. Tag: `v1.0.0`. Title: `v1.0.0 — Launch`.
Paste the body below.

```markdown
## v1.0.0 — Launch 🚀

The first public release of my portfolio — a full‑stack, self‑instrumenting
system built to be inspected, not just clicked.

### ✨ Front end
- Cinematic homepage with a WebGL shader hero (React Three Fiber) and a CSS
  liquid fallback for phones / reduced‑motion.
- Brand cold‑open ("LOAD SHIVAM") and a signature that draws itself
  stroke‑by‑stroke on scroll — a real SVG font path.
- ⌘K command palette, magnetic buttons, Lenis smooth scroll, full dark/light.
- Fully responsive, accessible (reduced‑motion aware), keyboard‑navigable.

### 🧠 Back end
- MongoDB + Mongoose with a self‑built analytics pipeline (beacon → API →
  rollups) feeding a public **/stats** page.
- Env‑gated admin CMS: edit copy, CRUD projects, upload media, view leads —
  behind HMAC‑cookie auth.
- One‑command seed script; runs on static fallback content with no DB.

### ⚡ Performance & SEO
- Real‑world LCP ≈ 1.2 s mobile / 0.84 s desktop, CLS 0.
- Lighthouse SEO 100, Best Practices 100, Accessibility 96.
- JSON‑LD (`Person` / `WebSite` / `ProfilePage`), image‑enabled sitemap, tuned
  robots, dynamic Open Graph images.

### 🛠 Stack
Next.js 16 · React 19 · TypeScript · Tailwind v4 · MongoDB · Motion · R3F

**Live:** https://shivam-bhadoriya-dev.vercel.app
```

---

## 6. First commit message

```
feat: launch award-grade full-stack portfolio (v1.0.0)

Next.js 16 + React 19 + MongoDB. Cinematic WebGL UI, scroll-drawn signature,
self-built analytics pipeline, env-gated admin CMS. LCP ~1s, SEO 100.
```

---

## 7. Extra polish (optional but worth 10 minutes)

- **Social preview image** — Settings → General → *Social preview* → upload a
  1280×640 screenshot of the hero (or your `/opengraph-image`). This is the card
  people see when the repo is shared.
- **Pin the repo** on your GitHub profile (Profile → Customize your pins).
- **Add a `LICENSE`** — GitHub → *Add file* → *Create new file* → name it
  `LICENSE` → GitHub offers an MIT template. Put your name in it.
- **Link it from your GitHub profile README and LinkedIn** — those backlinks are
  the single biggest lever for ranking #1 on your name (see below).

---

## 8. ⚠️ One thing that matters more than all of the above

You're on a **`vercel.app` subdomain**. Google treats `*.vercel.app` as a shared
domain, which caps how strongly the site ranks for **"Shivam Bhadoriya"** and
makes you ineligible for a proper knowledge panel.

**Buy a custom domain** — `shivambhadoriya.dev` or `shivambhadoriya.com` (~₹1,000/yr).
Point it at Vercel (Settings → Domains). Then:

1. Update `site.url` in `src/lib/site.ts` and `metadataBase` in `src/app/layout.tsx`.
2. Re‑submit the new sitemap in Google Search Console.

That single change does more for ranking #1 on your name than any on‑page tweak.
