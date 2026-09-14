/**
 * A shared browser session for the go-live steps that have no API.
 *
 * You log in once, by hand, in a window on your own screen. The session is kept
 * in a local profile directory that never leaves this machine, and Claude then
 * drives that same profile to read state and make the DNS changes.
 *
 * No password is ever typed by, shown to, or stored for anyone but you.
 *
 *   node scripts/browser.mjs login     # opens the window for you to sign in
 *   node scripts/browser.mjs shot <url> <name>   # screenshot a page (read-only)
 *   node scripts/browser.mjs check     # report which sites are signed in
 *
 * The profile lives in .browser-profile/, which is gitignored. Delete that
 * directory to sign out of everything.
 */
import { chromium } from "playwright";
import path from "node:path";
import { mkdir } from "node:fs/promises";

const ROOT = path.resolve(import.meta.dirname, "..");
const PROFILE = path.join(ROOT, ".browser-profile");
const SHOTS = path.join(ROOT, ".browser-shots");

const SITES = [
  { name: "Hostinger", url: "https://hpanel.hostinger.com/", signedIn: (u) => !/login/i.test(u) },
  { name: "Cloudflare", url: "https://dash.cloudflare.com/", signedIn: (u) => !/login/i.test(u) },
  { name: "Vercel", url: "https://vercel.com/dashboard", signedIn: (u) => !/login|signup/i.test(u) },
];

async function open({ headless }) {
  await mkdir(PROFILE, { recursive: true });
  await mkdir(SHOTS, { recursive: true });
  return chromium.launchPersistentContext(PROFILE, {
    headless,
    channel: "chrome",
    viewport: { width: 1440, height: 900 },
    args: ["--disable-blink-features=AutomationControlled"],
  });
}

async function login() {
  const ctx = await open({ headless: false });
  console.log("\n  A Chrome window is opening. Sign in to each tab, then LEAVE IT OPEN");
  console.log("  and tell Claude you are done. Close it only when asked.\n");
  for (const [i, s] of SITES.entries()) {
    const page = i === 0 ? ctx.pages()[0] ?? (await ctx.newPage()) : await ctx.newPage();
    await page.goto(s.url, { waitUntil: "domcontentloaded" }).catch(() => {});
    console.log(`  tab ${i + 1}: ${s.name}`);
  }
  console.log("\n  Waiting. This process stays alive until you close the window.");
  await new Promise((resolve) => ctx.on("close", resolve));
  console.log("  Window closed. Session saved.");
}

async function check() {
  const ctx = await open({ headless: true });
  for (const s of SITES) {
    const page = await ctx.newPage();
    try {
      await page.goto(s.url, { waitUntil: "domcontentloaded", timeout: 30000 });
      await page.waitForTimeout(2500);
      const url = page.url();
      console.log(`${s.name.padEnd(12)} ${s.signedIn(url) ? "SIGNED IN " : "signed out"}  → ${url.slice(0, 80)}`);
    } catch (e) {
      console.log(`${s.name.padEnd(12)} error: ${e.message.split("\n")[0].slice(0, 70)}`);
    }
    await page.close();
  }
  await ctx.close();
}

async function shot(url, name) {
  const ctx = await open({ headless: true });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(4000);
  const file = path.join(SHOTS, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  console.log("url  :", page.url());
  console.log("title:", await page.title());
  console.log("shot :", file);
  await ctx.close();
}

const [cmd, ...rest] = process.argv.slice(2);
if (cmd === "login") await login();
else if (cmd === "check") await check();
else if (cmd === "shot") await shot(rest[0], rest[1] || "shot");
else {
  console.log("usage: node scripts/browser.mjs login | check | shot <url> <name>");
  process.exit(1);
}
