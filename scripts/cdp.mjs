/**
 * Drive a Chrome window that YOU opened and signed in to, over the DevTools protocol.
 *
 * Why not scripts/browser.mjs: Playwright-launched Chrome carries automation flags,
 * and Google sign-in refuses it ("This browser or app may not be secure"). A plain
 * Chrome started with a debugging port does not, so you sign in normally — password
 * and 2FA stay on your screen — and this script attaches to the same window.
 *
 *   node scripts/cdp.mjs start                 # opens Chrome (profile: .browser-profile-cdp/)
 *   node scripts/cdp.mjs tabs                  # list open tabs
 *   node scripts/cdp.mjs goto <url> [tab]      # navigate a tab (default: first tab)
 *   node scripts/cdp.mjs shot <name> [tab]     # screenshot to .browser-shots/<name>.png
 *   node scripts/cdp.mjs text [tab]            # visible text of the page
 *   node scripts/cdp.mjs click <text> [tab]    # click the first element with this exact text
 *   node scripts/cdp.mjs fill <selector> <value> [tab]
 *   node scripts/cdp.mjs wait <urlSubstring> [seconds] [tab]  # wait e.g. for 2FA to finish
 *
 * The debugging port is bound to 127.0.0.1 only. Close the window to end the session.
 */
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import path from "node:path";
import { mkdir } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const ROOT = path.resolve(import.meta.dirname, "..");
const PROFILE = path.join(ROOT, ".browser-profile-cdp");
const SHOTS = path.join(ROOT, ".browser-shots");
const PORT = 9333;
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

async function attach() {
  const browser = await chromium.connectOverCDP(`http://127.0.0.1:${PORT}`);
  const pages = browser.contexts()[0].pages();
  return { browser, pages };
}

function pick(pages, tab) {
  const i = Number(tab ?? 0);
  if (!pages[i]) throw new Error(`no tab ${i}; there are ${pages.length}`);
  return pages[i];
}

const [cmd, ...a] = process.argv.slice(2);

if (cmd === "start") {
  await mkdir(PROFILE, { recursive: true });
  const child = spawn(
    CHROME,
    [
      `--remote-debugging-port=${PORT}`,
      "--remote-debugging-address=127.0.0.1",
      `--user-data-dir=${PROFILE}`,
      "--no-first-run",
      "--no-default-browser-check",
      "https://accounts.google.com/",
    ],
    { detached: true, stdio: "ignore" },
  );
  child.unref();
  console.log("Chrome started. Sign in to Google in that window.");
  process.exit(0);
}

const { browser, pages } = await attach();
try {
  if (cmd === "tabs") {
    for (const [i, p] of pages.entries()) console.log(i, p.url().slice(0, 120));
  } else if (cmd === "goto") {
    const p = pick(pages, a[1]);
    await p.goto(a[0], { waitUntil: "domcontentloaded", timeout: 60000 });
    await p.waitForTimeout(3000);
    console.log(p.url());
  } else if (cmd === "shot") {
    await mkdir(SHOTS, { recursive: true });
    const p = pick(pages, a[1]);
    const file = path.join(SHOTS, `${a[0]}.png`);
    await p.screenshot({ path: file });
    console.log(p.url());
    console.log(file);
  } else if (cmd === "text") {
    const p = pick(pages, a[0]);
    console.log(p.url());
    console.log((await p.innerText("body")).slice(0, 6000));
  } else if (cmd === "dialog") {
    // Material dialogs render outside <body>'s visible text flow; read them directly.
    const p = pick(pages, a[0]);
    for (const d of await p.locator('[role="dialog"], [role="alertdialog"]').all()) {
      console.log("---\n" + (await d.innerText().catch(() => "")).slice(0, 4000));
    }
    for (const f of p.frames().slice(1)) console.log("frame:", f.url().slice(0, 120));
  } else if (cmd === "run") {
    // Run a small step file: `export default async (page) => { ... }`.
    const p = pick(pages, a[1]);
    const mod = await import(pathToFileURL(path.resolve(a[0])).href);
    const out = await mod.default(p);
    if (out !== undefined) console.log(out);
  } else if (cmd === "click") {
    const p = pick(pages, a[1]);
    await p.getByText(a[0], { exact: true }).first().click({ timeout: 15000 });
    await p.waitForTimeout(2500);
    console.log(p.url());
  } else if (cmd === "fill") {
    const p = pick(pages, a[2]);
    await p.fill(a[0], a[1], { timeout: 15000 });
    console.log("filled", a[0]);
  } else if (cmd === "wait") {
    const p = pick(pages, a[2]);
    const until = Date.now() + Number(a[1] ?? 300) * 1000;
    while (!p.url().includes(a[0])) {
      if (Date.now() > until) throw new Error(`timed out; still at ${p.url()}`);
      await p.waitForTimeout(2000);
    }
    console.log("reached", p.url());
  } else {
    console.log("usage: see the header of scripts/cdp.mjs");
  }
} catch (e) {
  console.error("error:", e.message.split(/\r?\n/).slice(0, 3).join(" | "));
  process.exitCode = 1;
} finally {
  // Exit without browser.close(): the window and its signed-in session belong to you,
  // and simply dropping the connection is the one way that cannot touch them.
  void browser;
  process.exit(process.exitCode ?? 0);
}
