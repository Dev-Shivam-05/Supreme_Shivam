# Going live on shivambhadoriya.com — every click, in order

**Registrar:** Hostinger · **Host:** Vercel · **For:** Shivam
**Time:** ~60 minutes of clicking, plus DNS waiting
**After every ✅ CHECK, run `npm run verify:domain` and send me the output before continuing.**

If a screen does not look like this file says it should, **stop and tell me what you see**. Do not
improvise. Hostinger moves menu labels around, and the one step that is genuinely painful to undo is
step 5.

---

## The one decision, first

Your domain is registered at Hostinger. Its **DNS** — which is a separate thing from registration —
can live in one of two places.

|  | Path A: Cloudflare DNS **(recommended)** | Path B: stay on Hostinger DNS |
|---|---|---|
| Domain stays registered at | Hostinger | Hostinger |
| `contact@shivambhadoriya.com` | **Free forever** (Cloudflare Email Routing) | Hostinger email is a paid add-on on most plans |
| DNS speed | Fastest network available | Fine |
| Extra step | One nameserver change, up to 24h | None |
| Cost | ₹0 | ₹0 for DNS, ~₹700+/yr if you need the mailbox |

**Take Path A.** The mailbox is the deciding factor — you need `contact@shivambhadoriya.com` because
it is now printed on five service pages and in your structured data, and Cloudflare gives it away
free. Everything below is Path A. Path B is in the appendix if you would rather not move.

---

## Step 1 — Create the Cloudflare account and add the domain

1. <https://dash.cloudflare.com/sign-up> → sign up with your Gmail → verify the email
2. On the dashboard click **Add a domain**
3. Type `shivambhadoriya.com` → **Continue**
4. Plan → choose **Free** → **Continue**
5. Cloudflare scans for existing records and shows a list. It will find Hostinger's parking records.
   **Delete every A, AAAA and CNAME record it found** (leave any TXT alone for now) — they point at
   Hostinger's parking page and would fight Vercel.
6. **Continue** → Cloudflare shows you **two nameservers**, something like:
   ```
   xxxx.ns.cloudflare.com
   yyyy.ns.cloudflare.com
   ```
   **Copy both.** They are unique to your account — do not use anyone else's.

---

## Step 2 — Point Hostinger at Cloudflare

1. <https://hpanel.hostinger.com> → sign in
2. Top menu → **Domains** → click **shivambhadoriya.com**
3. Left sidebar → **DNS / Nameservers**
4. Find the **Nameservers** section (not the DNS records section) → **Change nameservers**
5. Select **Use custom nameservers** (Hostinger's default is `ns1.dns-parking.com` /
   `ns2.dns-parking.com` — you are replacing those)
6. Paste the two Cloudflare nameservers from step 1.6 → **Save**
7. Back in Cloudflare → **Check nameservers now**

This is the slow part. Usually 15 minutes to 2 hours, occasionally up to 24. Cloudflare emails you
when it is active.

✅ **CHECK 1** — run this; when it prints the Cloudflare names instead of `dns-parking.com`, you can
continue:

```bash
nslookup -type=ns shivambhadoriya.com 8.8.8.8
```

---

## Step 3 — Add the domain in Vercel and get the records

1. <https://vercel.com/dashboard> → click the **Supreme_Shivam** project
2. Top tabs → **Settings** → left sidebar → **Domains**
3. Type `shivambhadoriya.com` → **Add**
4. Choose **"Redirect www.shivambhadoriya.com to shivambhadoriya.com"** — the apex is the canonical
   host and the code already assumes that
5. Vercel shows **Invalid Configuration** in red with the DNS records it wants. **Expected.**
   **Leave this tab open — those values are the authoritative ones. Use what Vercel shows you, not
   what this file says.** They normally are:

   | Type | Name | Value |
   |---|---|---|
   | A | `@` | `76.76.21.21` |
   | CNAME | `www` | `cname.vercel-dns.com` |

---

## Step 4 — Add those records in Cloudflare

1. Cloudflare → **shivambhadoriya.com** → left sidebar → **DNS** → **Records**
2. **Add record** → Type `A` · Name `@` · IPv4 `76.76.21.21`
3. ⚠️ **Proxy status must be "DNS only" — the cloud icon GREY, not orange.**
   This is the single most common way to break a Vercel site. Orange means Cloudflare proxies the
   request, which fights Vercel's own SSL certificate and gives you either a redirect loop or a
   certificate error. Grey. Every time.
4. **Save**
5. **Add record** → Type `CNAME` · Name `www` · Target `cname.vercel-dns.com` · Proxy **DNS only
   (grey)** → **Save**
6. Back in Vercel → **Domains** → **Refresh**. Wait for green **Valid Configuration**. Vercel issues
   the SSL certificate automatically — usually under five minutes.

✅ **CHECK 2** — this must return `200` before you touch step 5:

```bash
curl -sI https://shivambhadoriya.com | head -1
```

A certificate error here means the cloud in step 4.3 is orange. Go back and make it grey.

---

## Step 5 — Create contact@shivambhadoriya.com

Free, five minutes. Do it before step 6, because step 6 makes the site start advertising the address.

### 5a. Receiving

1. Cloudflare → **shivambhadoriya.com** → left sidebar → **Email** → **Email Routing**
2. **Get started**
3. Custom address `contact` · Action **Send to an email** · Destination = your Gmail
4. **Create** → Cloudflare offers to add the MX and TXT records → **Add records and enable**
5. Check Gmail for Cloudflare's verification email → click the link

### 5b. Sending, so replies come *from* contact@

1. Create a Gmail **App Password**: <https://myaccount.google.com/apppasswords> → name it
   `shivambhadoriya.com` → copy the 16-character password. **Keep this — step 6 needs it.**
2. Gmail → gear → **See all settings** → **Accounts and Import**
3. **Send mail as** → **Add another email address**
4. Name `Shivam Bhadoriya` · Email `contact@shivambhadoriya.com` · **untick** "Treat as an alias"
5. Next → SMTP `smtp.gmail.com` · Port `587` · Username = your full Gmail · Password = the App
   Password · **TLS**
6. **Add Account** → Gmail emails a code to contact@, Cloudflare forwards it to your inbox → paste it

✅ **CHECK 3** — email `contact@shivambhadoriya.com` from another account. It must arrive in Gmail.

---

## Step 6 — Flip the site onto the new domain

**Only once CHECK 2 returned 200.** This is the step that permanently redirects the old address.

1. Vercel → **Supreme_Shivam** → **Settings** → **Environment Variables**
2. Add each row below. Tick **Production**, **Preview** and **Development** on every one.

| Key | Value |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://shivambhadoriya.com` |
| `ANALYTICS_SALT` | run `openssl rand -hex 32` and paste the output |
| `CONTACT_TO` | `contact@shivambhadoriya.com` |
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | your full Gmail address |
| `SMTP_PASS` | the App Password from step 5b.1 |
| `SMTP_FROM` | `contact@shivambhadoriya.com` |

3. **Save**
4. **Deployments** tab → newest deployment → **⋯** → **Redeploy** → **untick "Use existing Build
   Cache"** → **Redeploy**
5. Wait for green

✅ **CHECK 4** — the big one:

```bash
npm run verify:domain
```

It checks the redirect, the canonical, the schema, the images, the sitemap, all five service pages
and that no page still says Ahmedabad. **Send me the whole output.**

---

## Step 7 — Google Search Console

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

## Step 8 — Bing (10 minutes, also feeds ChatGPT search)

1. <https://www.bing.com/webmasters> → sign in
2. **Import from Google Search Console** → authorise → select `shivambhadoriya.com`

Done — it copies the verification and the sitemap across.

---

## Step 9 — Google Business Profile

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

## Step 10 — Make your profiles match the site

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

## Step 11 — Final verification

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

## Appendix — Path B, staying entirely on Hostinger DNS

Only if you do not want to move nameservers. You lose free email routing.

1. hPanel → **Domains** → `shivambhadoriya.com` → **DNS / Nameservers** → **DNS records**
2. **Delete** the existing `A` record for `@` (it points at Hostinger parking) and the `CNAME` for
   `www`
3. **Add record** → Type `A` · Name `@` · Points to `76.76.21.21` · TTL leave default → **Add**
4. **Add record** → Type `CNAME` · Name `www` · Target `cname.vercel-dns.com` → **Add**
5. Continue from **step 3** above (Vercel), skipping Cloudflare entirely
6. For `contact@shivambhadoriya.com` you then need Hostinger's email add-on, or a free tier
   elsewhere. Tell me which and I will give you the records.

---

## What to send me

1. `npm run verify:domain` output after step 6
2. The Rich Results Test verdicts from step 11
3. Anything that did not look like this file said it would
