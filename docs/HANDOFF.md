# HANDOFF — Supreme_Shivam — Phase 3f (off-site entity signals) — 2026-09-16

## Done

- **Four of the five `sameAs` profiles now link back, checked against the live pages.**
  - GitHub: website `https://shivambhadoriya.com/`, location "Navsari, Gujarat, India" (read with `gh api user`).
  - X: website shivambhadoriya.com, location "Navsari, Gujarat, 396445".
  - WakaTime: website `http://shivambhadoriya.com/`, location "Navsari, India".
  - LinkedIn: the contact-info Website field is `shivambhadoriya.com (Portfolio)` and the location
    is "Greater Surat Area", LinkedIn's metro area for Navsari. Shivam made both edits by hand.
- **Phase 3g re-checked:** the Bing Site Move page for the old host still says "No pages found".
  Bing has not finished processing it, so the move was not done.

## Files changed

- `docs/PHASES.md` — Phase 3f status and notes; `## Now` and `## Next 3` updated.
- `AGENTS.md` — new rule: never automate LinkedIn or Instagram; GitHub profile fields go through `gh api`.
- `docs/DECISIONS.md` — decision on profile edits (below).
- `docs/HANDOFF.md` — this file.

## Decisions made

- **Edit social profiles by hand, except GitHub.** LinkedIn loads a PerimeterX anti-scraping frame
  (`uc=scraping`), and it hung the CDP session within three page loads. The permission classifier
  also blocks the agent from editing a real account. GitHub has an API, so use that instead.
- **Accept "Greater Surat Area" on LinkedIn.** It is the metro area LinkedIn offers for Navsari.
  It is no longer Ahmedabad, which was the actual conflict with the site's address.

## Known broken / deliberately skipped

- **LinkedIn About section** still ends with `Portfolio: shivam-bhadoriya-dev.vercel.app`. The
  agent was blocked from editing it; Shivam changes it to `shivambhadoriya.com`.
- **Instagram `__https.shivu`** is a personal account and has no website link. The agent cannot
  sign in to it. Shivam decides: add the site, or remove Instagram from `sameAs` in
  `src/components/seo/json-ld.tsx`.
- **Bing Site Move** is not done because Bing is still processing (shows "No pages found").
  It can be done on or after 2026-09-18.
- Carried over: **Hostinger email trial ends 2026-10-14** (Phase 3e, Shivam's decision); SMTP
  unset; mobile LCP ~5.3s (Phase 4); `.hud` contrast needs a design call; Cloudflare token and
  Atlas password still need rotating; production deploys are done by Shivam.

## Next session starts here

- Phase 4: bring mobile LCP from ~5.3s toward 2.5s by measuring and trimming the hero paint
  stack (see Phase 4 in `docs/PHASES.md`). **If the date is 2026-09-18 or later, first finish the
  Phase 3g Bing Site Move.**
- First command: `node scripts/cdp.mjs start`, then
  `node scripts/cdp.mjs goto "https://www.bing.com/webmasters/sitemove?siteUrl=https://shivam-bhadoriya-dev.vercel.app/"`
- Watch out for: `scripts/cdp.mjs` hangs for 30s on `connectOverCDP` once a tab freezes (a
  screenshot timeout or LinkedIn's bot check). `curl http://127.0.0.1:9333/json` still answers;
  close the frozen tabs with `/json/close/<id>` or restart with `cdp.mjs start`.
