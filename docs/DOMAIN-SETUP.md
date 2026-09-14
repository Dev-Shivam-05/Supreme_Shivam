# Going live on shivambhadoriya.com — every click, in order

**Registrar:** Hostinger · **DNS:** Cloudflare · **Host:** Vercel · **For:** Shivam

---

## Progress

| Step | State |
|---|---|
| Domain bought at Hostinger | ✅ done |
| Nameservers moved to Cloudflare (`patrick` / `vera`) | ✅ done, propagated |
| `shivambhadoriya.com` added to the Vercel account | ✅ done |
| **DNS A/CNAME still point at Hostinger `2.57.91.91`** | ⬅ **you are here** |
| Vercel env vars + redeploy | pending (Claude does this by CLI) |
| `contact@` mailbox | pending |
| Search Console / Bing / Business Profile | pending |

### Was moving to Cloudflare compulsory?

**No.** Registration and DNS are separate things. You could have stayed entirely on Hostinger DNS
and just edited one A record there — Vercel's own panel offers exactly that as the recommended
option.

It was still the better call, and now that it is done you get two things Hostinger would have
charged for or not offered: **free email routing** for `contact@shivambhadoriya.com`, and an API
that lets DNS changes be made precisely and verifiably instead of by clicking. Nothing was lost —
the domain is still registered at Hostinger and still renews there.

---

## Step 1 — Create a scoped Cloudflare API token *(6 clicks, then Claude does the rest)*

This is instead of handing over a password. The token can edit DNS on this one domain and nothing
else — it cannot touch billing, your other domains, your account settings or your password — and it
is one click to revoke when the migration is done.

1. <https://dash.cloudflare.com/profile/api-tokens>
2. **Create Token**
3. Find **Edit zone DNS** in the template list → **Use template**
4. Under **Zone Resources**, set: `Include` · `Specific zone` · `shivambhadoriya.com`
5. **Continue to summary** → **Create Token**
6. Copy the token — it is shown **once**

Then, in the project folder, open `.env.local` and add this as a new line:

```
CLOUDFLARE_API_TOKEN=paste_the_token_here
```

⚠️ **Paste it into that file, not into the chat.** `.env.local` is gitignored, so it never reaches
GitHub, and the script never prints it.

Tell Claude when it is saved.

---

## Step 2 — Claude points DNS at Vercel

```bash
npm run dns            # dry run: shows exactly what it would change
npm run dns -- --apply # makes the change
```

It sets:

| Type | Name | Value | Proxy |
|---|---|---|---|
| A | `@` | `76.76.21.21` | **off** |
| CNAME | `www` | `cname.vercel-dns.com` | **off** |

and removes the leftover Hostinger records at those two names. **MX and TXT records are never
touched**, which is what keeps email working.

Proxy must be off (grey cloud). Cloudflare's proxy terminates TLS itself, which collides with the
certificate Vercel issues for the same hostname — that is the redirect loop / certificate error
everyone hits.

✅ **CHECK** — Vercel issues the certificate within a few minutes:

```bash
curl -sI https://shivambhadoriya.com | head -1
```

Must be `HTTP/2 200` **and** served by Vercel, not Hostinger. Right now it returns 200 from
Hostinger's parking page, so the check is `server:` in the headers — it must stop saying `hcdn`.

---

## Step 3 — Create contact@shivambhadoriya.com

Free, five minutes. Do it before step 4, because step 4 makes the site start advertising the address.

### 3a. Receiving

1. Cloudflare → **shivambhadoriya.com** → left sidebar → **Email** → **Email Routing**
2. **Get started**
3. Custom address `contact` · Action **Send to an email** · Destination = your Gmail
4. **Create** → Cloudflare offers to add the MX and TXT records → **Add records and enable**
5. Check Gmail for Cloudflare's verification email → click the link

### 3b. Sending, so replies come *from* contact@

1. Create a Gmail **App Password**: <https://myaccount.google.com/apppasswords> → name it
   `shivambhadoriya.com` → copy the 16-character password. **Keep this — step 4 needs it.**
2. Gmail → gear → **See all settings** → **Accounts and Import**
3. **Send mail as** → **Add another email address**
4. Name `Shivam Bhadoriya` · Email `contact@shivambhadoriya.com` · **untick** "Treat as an alias"
5. Next → SMTP `smtp.gmail.com` · Port `587` · Username = your full Gmail · Password = the App
   Password · **TLS**
6. **Add Account** → Gmail emails a code to contact@, Cloudflare forwards it to your inbox → paste it

✅ **CHECK** — email `contact@shivambhadoriya.com` from another account. It must arrive in Gmail.

---

## Step 4 — Flip the site onto the new domain — *Claude does this over the Vercel CLI*

You are already signed in to the CLI, so Claude runs `vercel env add` for each variable and then
`vercel --prod`. You do not need to open the dashboard. For reference, these are the values going
in:

| Key | Value |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://shivambhadoriya.com` |
| `ANALYTICS_SALT` | run `openssl rand -hex 32` and paste the output |
| `CONTACT_TO` | `contact@shivambhadoriya.com` |
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | your full Gmail address |
| `SMTP_PASS` | the App Password from step 3b.1 |
| `SMTP_FROM` | `contact@shivambhadoriya.com` |

Only after `https://shivambhadoriya.com` serves from Vercel — setting `NEXT_PUBLIC_SITE_URL` while
Hostinger's parking page is still answering would 301 the live site into a dead end.

✅ **CHECK** — the big one:

```bash
npm run verify:domain
```

It checks the redirect, the canonical, the schema, the images, the sitemap, all five service pages
and that no page still says Ahmedabad. **Send me the whole output.**

---

## Step 5 — Google Search Console

1. <https://search.google.com/search-console> → sign in
2. **Add property** → the **Domain** box on the left (not "URL prefix")
3. `shivambhadoriya.com` → **Continue**
4. Google gives a **TXT record** starting `google-site-verification=`. Copy the value
5. Cloudflare → **DNS** → **Records** → **Add record** → Type `TXT` · Name `@` · Content = that value
   → **Save**
6. Search Console → **Verify** (retry after five minutes if it fails the first time)
7. Left sidebar → **Sitemaps** → type `sitemap.xml` → **Submit**. It should find **26 URLs**
8. Top search box ("Inspect any URL") → paste each of these, wait for the report, click
   **Request Indexing**. Google throttles this — finish the rest tomorrow if it stops you:

```
https://shivambhadoriya.com/
https://shivambhadoriya.com/about
https://shivambhadoriya.com/services
https://shivambhadoriya.com/services/web-development
https://shivambhadoriya.com/services/mobile-app-development
https://shivambhadoriya.com/services/ai-automation
https://shivambhadoriya.com/hire/web-developer-navsari
https://shivambhadoriya.com/hire/web-developer-surat
https://shivambhadoriya.com/writing
https://shivambhadoriya.com/work
```

---

## Step 6 — Bing (10 minutes, also feeds ChatGPT search)

1. <https://www.bing.com/webmasters> → sign in
2. **Import from Google Search Console** → authorise → select `shivambhadoriya.com`

Done — it copies the verification and the sitemap across.

---

## Step 7 — Google Business Profile

**The biggest single lever for local leads.** It is what puts you in the boxed map results for
"web developer near me" in Navsari. Free.

1. <https://business.google.com> → **Manage now**
2. Name: `Shivam Bhadoriya — Web & App Development`
3. Primary category: **Website designer**
4. "Add a location customers can visit?" → **No**. You are a service-area business; saying yes
   publishes your home address
5. Service areas: **Navsari**, then **Surat**
6. Website `https://shivambhadoriya.com` · Phone `+91 91069 88376`
7. Verification — choose **video** over postcard, it is far faster. It wants to see your workspace,
   your equipment and you. Follow the prompts exactly; a failed video costs you a two-week retry
8. Once verified:
   - Secondary category → `Software company`
   - Services → `Web development`, `Mobile app development`, `AI automation`
   - Profile photo → `public/images/shivam-bhadoriya-ai-engineer.jpg`, the same file as everywhere else
   - Description → paste the site's meta description
9. Ask every client for a Google review. Reviews are the largest ranking factor in the map pack.

---

## Step 8 — Make your profiles match the site

The whole plan depends on Google seeing one person. Ten minutes.

| Where | Change to |
|---|---|
| **LinkedIn** | Headline `AI Engineer at Aaziko Global LLP` · Location **Navsari, Gujarat** · Website `https://shivambhadoriya.com` · Photo = `shivam-bhadoriya-ai-engineer.jpg` |
| **GitHub** | Bio `AI Engineer at Aaziko Global LLP` · Location **Navsari, Gujarat** · Website + same avatar |
| **X** | Same bio, location, website, avatar |
| **WakaTime** | Same avatar |

⚠️ **GitHub currently says Ahmedabad. That is not optional to change.** The site, the schema and the
Business Profile all say Navsari now. Leaving GitHub on Ahmedabad rebuilds the exact split-identity
problem this whole job exists to fix.

---

## Step 9 — Final verification

```bash
npm run verify:domain
```

Then by hand:

1. <https://search.google.com/test/rich-results> → `https://shivambhadoriya.com` →
   must say **ProfilePage**, zero errors
2. Same tool → `https://shivambhadoriya.com/hire/web-developer-navsari` →
   must say **FAQPage** and **ProfessionalService**, zero errors
3. <https://pagespeed.web.dev> → the home URL → send me the mobile numbers
4. WhatsApp the homepage link to yourself — the preview must show your photo, your name and
   "AI Engineer · Navsari, Gujarat"
5. Submit the contact form once and confirm the email lands in Gmail

---

## Optional, later

- **`shivambhadoriya.in`** (~₹700/yr at Hostinger) → redirect to the `.com`. Defensive only.
- **Email deliverability.** Cloudflare Email Routing handles receiving. For *sending* from contact@
  via Gmail without landing in spam, add at Cloudflare → DNS:
  - TXT · Name `@` · `v=spf1 include:_spf.google.com include:_spf.mx.cloudflare.net ~all`
  - TXT · Name `_dmarc` · `v=DMARC1; p=none; rua=mailto:contact@shivambhadoriya.com`

  ⚠️ **Tell me before you add the SPF one.** Cloudflare Email Routing already creates an SPF record.
  Two SPF records is worse than none — they have to be merged into one line, not duplicated.

---

## What to send me

1. `npm run verify:domain` output after step 6
2. The Rich Results Test verdicts from step 11
3. Anything that did not look like this file said it would
