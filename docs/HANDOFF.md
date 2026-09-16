# HANDOFF — Supreme_Shivam — Phase 3g (search visibility after the domain move) — 2026-09-16

## Done

- **Audit: why "Shivam Bhadoriya" does not show shivambhadoriya.com yet.** The site itself is
  clean on the live domain (checked 2026-09-16): apex 200, `www` and the old
  `shivam-bhadoriya-dev.vercel.app` redirect to the apex path-for-path, `robots.txt` allows and
  lists the sitemap, `<meta name="robots" content="index, follow, …">`, canonical
  `https://shivambhadoriya.com`, title `Shivam Bhadoriya — AI Engineer`. Nothing blocks Google.
- **The cause is the domain move, not a site defect.** The domain went live 2026-09-14, two days
  before this audit. Google ranked the *vercel.app* URL for seven months; that URL now redirects,
  and Google has to re-crawl, notice the move and transfer the ranking to a brand-new domain.
  The earlier "indexed in 2–4 hours" was a Google-verified vercel.app property with the
  `google-site-verification` tag on it.
- **Found a real gap:** the redesign (commit `899c7f2`) removed that verification meta tag
  (`FpMq1620…`). With the tag gone and the host redirecting, the old Search Console property is
  at risk of losing verification — and without it the **Change of Address** tool cannot be used.
- **Fixed in code, verified on a local production build** (`next start` on port 3917): the home
  page serves `<meta name="google-site-verification" content="FpMq1620…"/>`; legacy host
  `/about` → `301 https://shivambhadoriya.com/about`; `www` → `301`; apex → `200`.
  Commit `98ff772`, pushed to `seo-ai-engineer-identity`.
- **NOT deployed to production.** `vercel --prod` was blocked by the session's permission
  classifier. The live site still sends 308 and has no verification tag until Shivam deploys.

## Files changed

- `src/app/layout.tsx` — `metadata.verification.google` restores the old property's token, with
  a comment saying why it must never be removed.
- `next.config.ts` — legacy/www redirects use `statusCode: 301` instead of `permanent: true` (308).
- `docs/DOMAIN-SETUP.md` — new Step 5b: the Change of Address procedure.

## Decisions made

- **Restore the meta tag rather than exempt a verification file from the redirect.** Search
  Console follows redirects for meta-tag verification but not for HTML-file verification, and
  the tag's value is already known from git history. One line, no redirect exceptions.
- **Explicit 301 over 308.** Google treats both as permanent; the Change of Address check is
  documented as "301", so remove the doubt for free.

## Known broken / deliberately skipped

- **Production deploy** — blocked by the permission classifier; Shivam must run it.
- **Change of Address in Search Console** — manual, needs Shivam's Google account. DOMAIN-SETUP
  Step 5b.
- **Could not see Google's own results.** The web search tool here is not Google; it returned
  other people named Shivam Bhadoriya and no result for either domain. Real state is only
  visible in Search Console → URL Inspection / Performance.
- Carried over, unchanged: **Hostinger email trial ends 2026-10-14** (Phase 3e); SMTP unset;
  mobile LCP ~5.3s (Phase 4); `.hud` contrast; Cloudflare token + Atlas password to rotate;
  `sameAs` profiles do not link back (Phase 3f). Do **not** run
  `scripts/cloudflare-email.mjs --apply` while the Hostinger mailbox is wanted.

## Next session starts here

- Phase 3g finish: deploy, run Change of Address, request indexing for `/`, then watch Search
  Console for 2–4 weeks before changing anything else.
- First command: `vercel --prod` then `npm run verify:domain`
- Watch out for: the Change of Address tool must be run **from the old vercel.app property**,
  on the **same Google account** that owns `shivambhadoriya.com`. If the old property is not in
  that account, add it as a URL-prefix property with the HTML-tag method — after the deploy.
