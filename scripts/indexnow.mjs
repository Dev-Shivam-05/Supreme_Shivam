/**
 * Pushes every URL in the sitemap to the IndexNow network.
 *
 * IndexNow is a push protocol: instead of waiting to be crawled, the site tells
 * the engines a URL changed. One submission fans out to every participant —
 * **Bing, Yandex, Seznam and Naver** share submissions with each other. Bing
 * matters more than its search share suggests, because it is what backs
 * ChatGPT search and Copilot.
 *
 * **Google is not an IndexNow participant and there is no equivalent for it.**
 * Google's Indexing API is documented as supporting only JobPosting and
 * BroadcastEvent pages; using it for ordinary pages is against its terms, and
 * the sitemap-ping endpoint was retired in 2023. For Google the automatic route
 * is the sitemap in robots.txt (already there), and the fast route is Request
 * Indexing in Search Console, which is a manual, rate-limited button. See
 * docs/SEO.md for what that means in practice.
 *
 *   npm run indexnow            # submit every sitemap URL
 *   npm run indexnow -- /about /services   # submit specific paths only
 *
 * The key file is public by design: the engines fetch it to prove the submitter
 * controls the host. It is not a secret.
 */
import { readdir } from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "https://shivambhadoriya.com").replace(/\/+$/, "");
const HOST = new URL(SITE).host;

/** The key is whichever <32-hex>.txt file sits in public/ — one source of truth. */
async function findKey() {
  const files = await readdir(path.join(ROOT, "public"));
  const match = files.find((f) => /^[a-f0-9]{8,128}\.txt$/.test(f));
  if (!match) {
    console.error("\nNo IndexNow key file in public/. Create one:\n  openssl rand -hex 16\nthen save it as public/<key>.txt containing that same key.\n");
    process.exit(1);
  }
  return match.replace(/\.txt$/, "");
}

async function sitemapUrls() {
  const res = await fetch(`${SITE}/sitemap.xml`);
  if (!res.ok) throw new Error(`sitemap.xml returned ${res.status}`);
  const xml = await res.text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
}

async function main() {
  const key = await findKey();
  const keyLocation = `${SITE}/${key}.txt`;

  /* The engines will fetch this — fail early and loudly if it is not live. */
  const probe = await fetch(keyLocation).catch(() => null);
  if (!probe?.ok) {
    console.error(`\nKey file is not reachable at ${keyLocation}.`);
    console.error("Deploy first — the engines verify it before accepting a submission.\n");
    process.exit(1);
  }
  const served = (await probe.text()).trim();
  if (served !== key) {
    console.error(`\nKey file content does not match its filename.\n  expected ${key}\n  got      ${served}\n`);
    process.exit(1);
  }

  const args = process.argv.slice(2).filter((a) => !a.startsWith("-"));
  const urlList = args.length
    ? args.map((p) => (p.startsWith("http") ? p : `${SITE}${p.startsWith("/") ? "" : "/"}${p}`))
    : await sitemapUrls();

  if (!urlList.length) {
    console.error("Nothing to submit.");
    process.exit(1);
  }

  console.log(`Submitting ${urlList.length} URLs for ${HOST}`);
  console.log(`key file: ${keyLocation}\n`);

  const res = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ host: HOST, key, keyLocation, urlList }),
  });

  /* 200 = accepted, 202 = accepted but key still being validated. Both are fine. */
  if (res.status === 200 || res.status === 202) {
    console.log(`IndexNow accepted the submission (HTTP ${res.status}).`);
    console.log("Shared with Bing, Yandex, Seznam and Naver. Google is not a participant.");
    for (const u of urlList) console.log("  " + u);
  } else {
    const body = await res.text().catch(() => "");
    console.error(`IndexNow rejected it: HTTP ${res.status} ${body.slice(0, 300)}`);
    if (res.status === 403) console.error("403 means the key file did not validate.");
    if (res.status === 422) console.error("422 means a URL did not belong to the host.");
    process.exit(1);
  }
}

main().catch((e) => {
  console.error("\nFailed:", e.message, "\n");
  process.exit(1);
});
