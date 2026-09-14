# Going live on shivambhadoriya.com — every click, in order

**For:** Shivam. You do all of this yourself; nobody needs your passwords.
**Time:** about 90 minutes of clicking, plus waiting for DNS.
**Rule:** do the steps in order. After each ✅ **CHECK**, paste me the output before moving on.

If anything does not match what this file says it should say, **stop and tell me**. Do not improvise —
the one step that is genuinely hard to undo is step 4, and the check in step 3 exists to stop you
reaching it too early.

---

## Step 0 — What you need open

- The account where you bought `shivambhadoriya.com`
- <https://vercel.com/dashboard> — logged in, with the `Supreme_Shivam` project visible
- A terminal (Git Bash on your machine is fine)
- Your Gmail

Tell me **which registrar you bought the domain from**. The rest of this file covers Cloudflare;
if you used someone else, step 1 changes and I will give you the exact variant.

---

## Step 1 — Point the domain at Vercel

### 1a. Add the domain in Vercel first

1. Vercel dashboard → click the **Supreme_Shivam** project
2. Top tabs → **Settings**
3. Left sidebar → **Domains**
4. In the input box type `shivambhadoriya.com` → click **Add**
5. When it asks which redirect you want, choose **"Redirect www.shivambhadoriya.com to shivambhadoriya.com"**
   — the apex is the canonical host and the code already assumes that
6. Vercel now shows **"Invalid Configuration"** in red with a list of DNS records. **That is expected.**
   Leave this tab open — those values are the authoritative ones. Use what Vercel shows you, not what
   any guide says, including this one.

They will look like this:

| Type | Name | Value |
|---|---|---|
| A | `@` | `76.76.21.21` |
| CNAME | `www` | `cname.vercel-dns.com` |

### 1b. Add those records at Cloudflare

1. <https://dash.cloudflare.com> → click **shivambhadoriya.com**
2. Left sidebar → **DNS** → **Records**
3. **Add record** → Type `A`, Name `@`, IPv4 address `76.76.21.21`
4. ⚠️ **Set Proxy status to "DNS only" (the cloud icon must be GREY, not orange).**
   This is the single most common way to break a Vercel site. Orange cloud means Cloudflare proxies
   the request, which fights Vercel's own SSL certificate and produces either a redirect loop or a
   certificate error. Grey cloud. Every time.
5. **Save**
6. **Add record** again → Type `CNAME`, Name `www`, Target `cname.vercel-dns.com`, Proxy status
   **DNS only (grey)** → **Save**

✅ **CHECK 1** — run this and paste me all of it:

```bash
dig +short shivambhadoriya.com A
dig +short www.shivambhadoriya.com CNAME
```

Expected: the first prints `76.76.21.21`, the second prints `cname.vercel-dns.com.`
If either is empty, wait 10 minutes and run it again. DNS is not instant.

---

## Step 2 — Wait for Vercel to issue the certificate

1. Back in the Vercel **Domains** tab → click **Refresh**
2. Wait until `shivambhadoriya.com` shows a green **Valid Configuration**
3. Vercel issues the SSL certificate automatically. This usually takes under five minutes and
   occasionally up to an hour.

✅ **CHECK 2** — paste me the output:

```bash
curl -sI https://shivambhadoriya.com | head -1
```

Expected: `HTTP/2 200`. If you get a certificate error, the proxy cloud in step 1b is orange. Go
back and make it grey.

**Do not go to step 4 until this returns 200.**

---

## Step 3 — Set up contact@shivambhadoriya.com

Free, five minutes, and it needs to exist before the site starts advertising it.

### 3a. Receiving

1. Cloudflare → **shivambhadoriya.com** → left sidebar → **Email** → **Email Routing**
2. Click **Get started**
3. Custom address: `contact` · Action: **Send to an email** · Destination: your Gmail address
4. **Create**
5. Cloudflare asks to add MX and TXT records automatically → click **Add records and enable**
6. Check your Gmail for a verification email from Cloudflare → click the link in it

### 3b. Sending (so replies come *from* contact@, not your Gmail)

1. Gmail → gear icon → **See all settings** → **Accounts and Import**
2. **Send mail as** → **Add another email address**
3. Name: `Shivam Bhadoriya` · Email: `contact@shivambhadoriya.com` · **untick** "Treat as an alias"
4. Next → SMTP Server `smtp.gmail.com`, Port `587`, Username = your full Gmail address,
   Password = an **App Password** (not your Gmail password — make one at
   <https://myaccount.google.com/apppasswords>), TLS selected
5. **Add Account** → Gmail sends a confirmation code to contact@, which Cloudflare forwards back to
   your inbox → paste the code

✅ **CHECK 3** — send an email from any other account to `contact@shivambhadoriya.com`. It should
land in your Gmail. Tell me when it does.

---

## Step 4 — Flip the site to the new domain

**Only do this once CHECK 2 returned 200.** This is the step that 301-redirects the old address, and
browsers cache a 301 hard.

1. Vercel → **Supreme_Shivam** → **Settings** → **Environment Variables**
2. Add each of these. For every one, tick **Production**, **Preview** and **Development**:

| Key | Value |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://shivambhadoriya.com` |
| `ANALYTICS_SALT` | a long random string — run `openssl rand -hex 32` and paste the output |
| `CONTACT_TO` | `contact@shivambhadoriya.com` |
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | your full Gmail address |
| `SMTP_PASS` | the App Password from step 3b |
| `SMTP_FROM` | `contact@shivambhadoriya.com` |

3. **Save**
4. Top tabs → **Deployments** → the newest one → **⋯** menu → **Redeploy** →
   **untick "Use existing Build Cache"** → **Redeploy**
5. Wait for it to go green

✅ **CHECK 4** — paste me all four outputs:

```bash
curl -sI https://shivam-bhadoriya-dev.vercel.app | head -3
curl -sI https://www.shivambhadoriya.com | head -3
curl -s https://shivambhadoriya.com | grep -o '<link rel="canonical" href="[^"]*"'
curl -s https://shivambhadoriya.com/robots.txt
```

Expected: the first two show `HTTP/2 308` (Next.js uses 308, which is a permanent redirect — this is
correct) with `location: https://shivambhadoriya.com/`; the canonical prints
`https://shivambhadoriya.com`; robots.txt lists the sitemap on the new domain.

---

## Step 5 — Google Search Console

1. <https://search.google.com/search-console> → sign in
2. **Add property** → choose the **Domain** box on the left (not "URL prefix" — Domain covers every
   subdomain and both http/https at once)
3. Type `shivambhadoriya.com` → **Continue**
4. Google gives you a **TXT record**. Copy the value — it starts `google-site-verification=`
5. Cloudflare → **DNS** → **Records** → **Add record** → Type `TXT`, Name `@`, Content = the value
   you copied → **Save**
6. Back in Search Console → **Verify**. If it fails, wait five minutes and press it again

### Submit the sitemap

7. Left sidebar → **Sitemaps**
8. In "Add a new sitemap" type `sitemap.xml` → **Submit**
9. Status should become **Success** within a few minutes

### Request indexing — this is what turns weeks into days

10. Use the search box at the very top ("Inspect any URL")
11. Paste `https://shivambhadoriya.com/` → Enter → wait for the report → click **Request Indexing**
12. Repeat for each of these, one at a time. Google throttles this, so if it stops you, finish the
    rest tomorrow:

```
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

✅ **CHECK 5** — screenshot or tell me the sitemap status and how many URLs it found. It should say
**26**.

---

## Step 6 — Bing Webmaster Tools

Ten minutes, and it also feeds ChatGPT's search.

1. <https://www.bing.com/webmasters> → sign in
2. **Import from Google Search Console** → authorise → pick `shivambhadoriya.com`
3. That copies the verification and the sitemap across. Done.

---

## Step 7 — Google Business Profile

**This is the biggest single lever for local leads.** It is what puts you in the boxed map results
for "web developer near me" in Navsari. It is free.

1. <https://business.google.com> → **Manage now**
2. Business name: `Shivam Bhadoriya — Web & App Development`
3. Business category: **Website designer**
4. "Do you want to add a location customers can visit?" → **No** (you are a service-area business;
   saying yes publishes your home address)
5. Service areas: add **Navsari**, then **Surat**
6. Contact details: website `https://shivambhadoriya.com`, plus your phone number
7. Verification — Google will ask for a video or a postcard. Video is faster. It wants to see your
   workspace, your equipment and you. Follow its prompts exactly; a failed video means a two-week
   retry.
8. Once verified:
   - **Add a secondary category**: `Software company`
   - **Services**: add `Web development`, `Mobile app development`, `AI automation`
   - **Photos**: upload `public/images/shivam-bhadoriya-ai-engineer.jpg` as the profile photo —
     the same file as everywhere else — plus screenshots of your work
   - **Description**: paste the meta description from the site
9. Ask every client you finish work for to leave a Google review. Reviews are the single largest
   ranking factor in the map pack.

---

## Step 8 — Make your profiles match the site

The whole plan depends on Google seeing one person, not four. Ten minutes.

| Where | Change |
|---|---|
| **LinkedIn** | Headline → `AI Engineer at Aaziko Global LLP`. Location → **Navsari, Gujarat**. Profile photo → `shivam-bhadoriya-ai-engineer.jpg`. Website → `https://shivambhadoriya.com` |
| **GitHub** | Bio → `AI Engineer at Aaziko Global LLP`. Location → **Navsari, Gujarat** (it currently says Ahmedabad — this must change). Website → `https://shivambhadoriya.com`. Avatar → the same file |
| **X** | Bio and location the same. Website link. Same avatar |
| **WakaTime** | Same avatar if it lets you |

⚠️ **The GitHub location is not optional.** The site, the structured data and the Business Profile
all say Navsari now. If GitHub says Ahmedabad, you have rebuilt the exact split-identity problem
this whole job is fixing.

---

## Step 9 — Final verification

Paste me the output of all of these:

```bash
curl -s https://shivambhadoriya.com | grep -c "Shivam Bhadoriya"
curl -s https://shivambhadoriya.com | grep -o "<title>[^<]*</title>"
curl -sI https://shivambhadoriya.com/images/shivam-bhadoriya-ai-engineer.jpg | head -1
curl -s https://shivambhadoriya.com/sitemap.xml | grep -c "<loc>"
```

Then, by hand:

1. <https://search.google.com/test/rich-results> → paste `https://shivambhadoriya.com` →
   must report **ProfilePage** with **zero errors**
2. Same tool → paste `https://shivambhadoriya.com/hire/web-developer-navsari` →
   must report **FAQPage** with zero errors
3. <https://pagespeed.web.dev> → paste the home URL → tell me the mobile numbers
4. Paste your homepage link into a WhatsApp message to yourself — the preview card should show your
   photo, your name and "AI Engineer · Navsari, Gujarat"

---

## Step 10 — Optional, but do it eventually

- **Buy `shivambhadoriya.in`** (~₹700/yr) at the same registrar and redirect it to the `.com`.
  Defensive only.
- **Email hardening (SPF/DMARC).** Cloudflare Email Routing adds what receiving needs. For *sending*
  from contact@ via Gmail without landing in spam, add these TXT records at Cloudflare:
  - Name `@`, Content `v=spf1 include:_spf.google.com include:_spf.mx.cloudflare.net ~all`
  - Name `_dmarc`, Content `v=DMARC1; p=none; rua=mailto:contact@shivambhadoriya.com`
  Tell me before you add these — if you already have an SPF record you must merge, not duplicate.
  Two SPF records is worse than none.

---

## What to send me when you are done

1. The four outputs from CHECK 4
2. The sitemap URL count from CHECK 5
3. The Rich Results Test verdict for both URLs
4. **Your phone number**, so I can wire it into the service pages and the schema — that is the last
   `ASK SHIVAM` item left in the code

I will verify each one and tell you if anything is wrong before it costs you ranking.
