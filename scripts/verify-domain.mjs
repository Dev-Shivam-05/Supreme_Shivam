/**
 * Domain go-live verifier.
 *
 * Runs every check in docs/DOMAIN-SETUP.md against the live site and prints a
 * pass/fail table, so nobody has to eyeball curl output and guess. Written to be
 * run repeatedly during the migration — it is safe, read-only, and makes no
 * changes to anything.
 *
 *   npm run verify:domain
 *   npm run verify:domain -- https://some-other-host.com
 */
import { setTimeout as delay } from "node:timers/promises";

const TARGET = (process.argv[2] || "https://shivambhadoriya.com").replace(/\/+$/, "");
const HOST = new URL(TARGET).host;
const LEGACY = "https://shivam-bhadoriya-dev.vercel.app";

/**
 * A dry run against a local `next start` cannot pass the origin checks: the
 * build bakes in NEXT_PUBLIC_SITE_URL, which is unset locally, so canonicals and
 * the sitemap still name the vercel.app host. Those are reported as warnings
 * here rather than as failures nobody can fix locally.
 */
const LOCAL = /^https?:\/\/(localhost|127\.0\.0\.1)/.test(TARGET);
const ORIGIN_CHECKS = new Set([
  "Old vercel.app host redirects",
  "www redirects to apex",
  "Canonical URL",
  "Person image on this domain",
  "robots.txt",
  "sitemap host",
]);

const results = [];
const ok = (name, detail) => results.push({ state: "PASS", name, detail });
const bad = (name, detail) =>
  results.push(
    LOCAL && ORIGIN_CHECKS.has(name)
      ? { state: "WARN", name, detail: `${detail} (expected on a local dry run)` }
      : { state: "FAIL", name, detail },
  );
const warn = (name, detail) => results.push({ state: "WARN", name, detail });

/** fetch with a timeout, never throwing — a dead host is a result, not a crash. */
async function get(url, { redirect = "follow" } = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15000);
  try {
    const res = await fetch(url, { redirect, signal: ctrl.signal, headers: { "user-agent": "shivam-domain-verifier" } });
    const body = redirect === "manual" ? "" : await res.text();
    return { status: res.status, headers: res.headers, body };
  } catch (e) {
    return { error: e.name === "AbortError" ? "timed out after 15s" : e.message };
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  console.log(`\nVerifying ${TARGET}\n${"─".repeat(64)}`);
  if (LOCAL) {
    console.log('Local dry run: origin checks (canonical, redirects, sitemap host) are');
    console.log("reported as warnings — the local build has no NEXT_PUBLIC_SITE_URL.\n");
  }

  /* 1 — does the domain serve the site at all? */
  const home = await get(TARGET + "/");
  if (home.error) {
    bad("Site responds", `${TARGET} → ${home.error}. DNS has not propagated, or Vercel has not issued the certificate yet.`);
    render();
    return;
  }
  if (home.status !== 200) bad("Site responds", `expected 200, got ${home.status}`);
  else ok("Site responds", `200 from ${HOST}`);

  const html = home.body;

  /* 2 — the old host must permanently redirect, not serve a copy */
  const legacy = await get(LEGACY + "/", { redirect: "manual" });
  if (legacy.error) warn("Old vercel.app host redirects", legacy.error);
  else if ([301, 308].includes(legacy.status)) {
    const loc = legacy.headers.get("location") || "";
    loc.includes(HOST)
      ? ok("Old vercel.app host redirects", `${legacy.status} → ${loc}`)
      : bad("Old vercel.app host redirects", `${legacy.status} but to ${loc}`);
  } else {
    bad("Old vercel.app host redirects", `still serving ${legacy.status} — NEXT_PUBLIC_SITE_URL is not set, or the deploy has not finished`);
  }

  /* 3 — www folds into the apex */
  const www = await get(`https://www.${HOST}/`, { redirect: "manual" });
  if (www.error) warn("www redirects to apex", www.error);
  else if ([301, 307, 308].includes(www.status)) ok("www redirects to apex", `${www.status} → ${www.headers.get("location")}`);
  else warn("www redirects to apex", `got ${www.status} — check the Vercel domain redirect setting`);

  /* 4 — canonical, title, description */
  const canonical = /<link rel="canonical" href="([^"]+)"/.exec(html)?.[1];
  canonical === TARGET || canonical === TARGET + "/"
    ? ok("Canonical URL", canonical)
    : bad("Canonical URL", `${canonical ?? "missing"} — expected ${TARGET}`);

  const title = /<title>([^<]*)<\/title>/.exec(html)?.[1];
  title === "Shivam Bhadoriya — AI Engineer"
    ? ok("Page title", title)
    : bad("Page title", `got "${title}"`);

  /* 5 — the name really is in the HTML the server sent */
  const nameHits = (html.match(/Shivam Bhadoriya/g) || []).length;
  nameHits >= 10
    ? ok("Name in raw HTML", `${nameHits} occurrences`)
    : bad("Name in raw HTML", `only ${nameHits} — JS is rendering the name, which breaks the image pack`);

  const h1s = (html.match(/<h1/g) || []).length;
  h1s === 1 ? ok("Exactly one <h1>", "1") : bad("Exactly one <h1>", `${h1s}`);

  /* 6 — large image previews permitted */
  /max-image-preview:large/.test(html)
    ? ok("max-image-preview", "large")
    : bad("max-image-preview", "missing — the photo cannot show at usable size in results");

  /* 7 — structured data parses, and says what it should */
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  let person = null;
  let parsed = 0;
  for (const [, raw] of blocks) {
    try {
      const node = JSON.parse(raw);
      parsed++;
      const flat = node["@graph"] ?? [node];
      for (const n of flat) {
        if (n["@type"] === "Person") person = n;
        if (n["@type"] === "ProfilePage" && n.mainEntity?.["@type"] === "Person") person ??= n.mainEntity;
      }
    } catch {
      bad("JSON-LD parses", "a block is malformed JSON");
    }
  }
  parsed === blocks.length && blocks.length > 0
    ? ok("JSON-LD parses", `${parsed} blocks`)
    : bad("JSON-LD parses", `${parsed}/${blocks.length}`);

  if (!person) bad("Person entity", "not found on the home page");
  else {
    person.jobTitle === "AI Engineer" ? ok("Job title", person.jobTitle) : bad("Job title", person.jobTitle);
    const sameAs = person.sameAs ?? [];
    sameAs.length >= 3 ? ok("sameAs profiles", sameAs.join(", ")) : bad("sameAs profiles", `only ${sameAs.length}`);
    const img = Array.isArray(person.image) ? person.image[0]?.url : person.image;
    img?.startsWith(TARGET) ? ok("Person image on this domain", img) : bad("Person image on this domain", img ?? "missing");
    person.telephone ? ok("Phone in schema", person.telephone) : warn("Phone in schema", "absent on the Person node (it lives on ProfessionalService)");
  }

  if (/TODO|ASK SHIVAM/.test(html)) bad("No placeholders", "found TODO or ASK SHIVAM in the HTML");
  else ok("No placeholders", "clean");

  /* 8 — the images actually exist */
  for (const path of [
    "/images/shivam-bhadoriya-ai-engineer.jpg",
    "/images/shivam-bhadoriya-portrait.jpg",
    "/og/shivam-bhadoriya.jpg",
  ]) {
    const r = await get(TARGET + path, { redirect: "manual" });
    r.error || r.status !== 200
      ? bad(`Image ${path}`, r.error ?? `status ${r.status}`)
      : ok(`Image ${path}`, `200 · ${r.headers.get("content-type")}`);
  }

  /* 9 — robots + sitemap point at the new host */
  const robots = await get(TARGET + "/robots.txt");
  robots.body?.includes(`${TARGET}/sitemap.xml`)
    ? ok("robots.txt", "references the sitemap on this domain")
    : bad("robots.txt", "sitemap line missing or pointing at the old host");

  const sitemap = await get(TARGET + "/sitemap.xml");
  const locs = (sitemap.body?.match(/<loc>/g) || []).length;
  const imgs = (sitemap.body?.match(/<image:loc>/g) || []).length;
  locs >= 26 ? ok("sitemap.xml", `${locs} URLs, ${imgs} image entries`) : bad("sitemap.xml", `only ${locs} URLs`);
  sitemap.body?.includes(LEGACY) && bad("sitemap host", "still contains the vercel.app host");

  /* 10 — the commercial pages are live, with their schema */
  for (const path of [
    "/services",
    "/services/web-development",
    "/services/mobile-app-development",
    "/services/ai-automation",
    "/hire/web-developer-navsari",
    "/hire/web-developer-surat",
    "/privacy-policy",
    "/terms",
    "/writing",
    "/about",
  ]) {
    const r = await get(TARGET + path);
    if (r.error || r.status !== 200) {
      bad(`Page ${path}`, r.error ?? `status ${r.status}`);
      continue;
    }
    if (path.startsWith("/services/") || path.startsWith("/hire/")) {
      const hasService = /"ProfessionalService"/.test(r.body);
      const hasFaq = /"FAQPage"/.test(r.body);
      const words = r.body
        .replace(/<script[\s\S]*?<\/script>/g, ' ')
        .replace(/<style[\s\S]*?<\/style>/g, ' ')
        .replace(/<[^>]+>/g, ' ')
        .split(/\s+/)
        .filter(Boolean).length;
      hasService && hasFaq && words > 600
        ? ok(`Page ${path}`, `200 · ProfessionalService + FAQPage · ~${words} words`)
        : bad(`Page ${path}`, `service=${hasService} faq=${hasFaq} words=${words}`);
    } else {
      ok(`Page ${path}`, "200");
    }
    await delay(60); // be polite to the origin
  }

  /* 11 — nothing from the old identity survives */
  const stale = [];
  if (/Ahmedabad/.test(html)) stale.push("Ahmedabad");
  if (/shivambhadoriya1605/.test(html)) stale.push("old gmail address");
  if (/Full-Stack Developer/.test(html)) stale.push("Full-Stack Developer");
  stale.length ? bad("No stale identity strings", stale.join(", ")) : ok("No stale identity strings", "clean");

  render();
}

function render() {
  console.log("");
  const pad = Math.max(...results.map((r) => r.name.length));
  for (const r of results) {
    const mark = r.state === "PASS" ? "  ok  " : r.state === "WARN" ? " warn " : " FAIL ";
    console.log(`[${mark}] ${r.name.padEnd(pad)}  ${r.detail}`);
  }
  const failed = results.filter((r) => r.state === "FAIL");
  const warned = results.filter((r) => r.state === "WARN");
  console.log(`\n${"─".repeat(64)}`);
  console.log(`${results.length - failed.length - warned.length} passed · ${warned.length} warnings · ${failed.length} failed`);
  if (failed.length) {
    console.log("\nSend this whole output to Claude — the failures above say exactly what to fix.");
    process.exitCode = 1;
  } else {
    console.log("\nAll green. Send this output over anyway so it can be double-checked.");
  }
}

main();
