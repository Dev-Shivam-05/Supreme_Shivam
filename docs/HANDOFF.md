# HANDOFF — Supreme_Shivam — Phase 3g (search visibility after the domain move) — 2026-09-16

## Done

- **Audit: why "Shivam Bhadoriya" did not show shivambhadoriya.com.** Nothing on the site blocks
  Google (apex 200, `www` and old host 301 path-for-path, robots allows, `index, follow`,
  canonical correct). The cause was the move itself: the domain went live 2026-09-14 and Google
  had ranked the *vercel.app* URL for seven months.
- **Old property verification restored and deployed.** The redesign (`899c7f2`) had removed the
  `google-site-verification` tag for `shivam-bhadoriya-dev.vercel.app`. It is back in
  `layout.tsx` (`98ff772`), and legacy/www redirects now send 301. Shivam deployed it; live
  check: old host `/` → `301 https://shivambhadoriya.com/`. `npm run verify:domain` →
  **29 passed, 1 warning, 0 failed**.
- **Google Change of Address: CONFIRMED 2026-09-16.** Search Console shows "This site is
  currently moving": `shivam-bhadoriya-dev.vercel.app` → `shivambhadoriya.com`. Validation
  passed all three checks (homepage 301, both sites verified, sample pages `/about`, `/lab`).
  The first two attempts said "Couldn't fetch the page" minutes after the deploy; the third
  passed — it was Google-side lag, not a site fault.
- **Google indexing requests:** old homepage (recrawl so Google sees the 301), and on the new
  domain `/about`, `/services`, `/writing`, `/work` and all five service/hire pages. The new
  homepage was already "URL is on Google". Sitemap: Success, 26 URLs, read 2026-09-16.
- **Bing Webmaster Tools set up.** Shivam signed in with Google and granted read-only Search
  Console access; all 8 verified sites imported. `https://shivambhadoriya.com/sitemap.xml`
  submitted directly (the import brought no sitemap for the domain property) — status
  Processing.
- **`scripts/cdp.mjs`** — attaches to a Chrome window Shivam signs into by hand. Used for all of
  the above; no password or 2FA code passed through the session.

## Files changed

- `src/app/layout.tsx` — `metadata.verification.google` for the old property.
- `next.config.ts` — legacy/www redirects `statusCode: 301`.
- `scripts/cdp.mjs` — CDP driver: `start`, `tabs`, `goto`, `shot`, `text`, `dialog`, `run`,
  `click`, `fill`, `wait`.
- `.gitignore` — `.browser-profile-cdp/`.
- `docs/DOMAIN-SETUP.md` — Step 5b, Change of Address.
- `AGENTS.md` — the verification tag is load-bearing; Search Console automation notes.

## Decisions made

- **Restore the meta tag rather than exempt a verification file from the redirect** — Search
  Console follows redirects for meta tags, not for HTML files.
- **Explicit 301 over 308** — the Change of Address check is documented against 301.
- **Plain Chrome + CDP instead of Playwright-launched Chrome** — Google sign-in rejects the
  latter; the owner signs in and approves every consent screen personally.

## Known broken / deliberately skipped

- **Bing Site Move for the old host not done** — its page shows "No pages found" while Bing
  processes the newly imported sites ("up to 48 hours"). Redo after 2026-09-18.
- **Production deploys are blocked for the agent** by the permission classifier; Shivam deploys.
- Carried over: **Hostinger email trial ends 2026-10-14** (Phase 3e); SMTP unset; mobile LCP
  ~5.3s (Phase 4); `.hud` contrast; Cloudflare token + Atlas password to rotate; `sameAs`
  profiles do not link back (Phase 3f). Do **not** run `scripts/cloudflare-email.mjs --apply`
  while the Hostinger mailbox is wanted.

## Next session starts here

- Phase 3g close-out: Bing Site Move (old host → shivambhadoriya.com), then only watch Search
  Console for 2–6 weeks. Keep the redirect and the meta tag for at least 180 days.
- First command: `node scripts/cdp.mjs start` (sign in if the profile has expired), then
  `node scripts/cdp.mjs goto "https://www.bing.com/webmasters/sitemove?siteUrl=https://shivam-bhadoriya-dev.vercel.app/"`
- Watch out for: Search Console buttons are CSS-uppercased — match with `/^request indexing$/i`,
  not the exact visible text; and in Git Bash use single quotes for `curl -w` formats or `\n`
  is mangled into `/n` and looks like a double-slash redirect.
