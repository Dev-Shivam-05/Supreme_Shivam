/**
 * Catalog coverage and the browser-side classifiers.
 *
 * The coverage test reads lib/site.ts, lib/services.ts and lib/writing.ts as
 * text rather than importing them: services.ts imports "./site" without an
 * extension, which Node's loader cannot resolve, and the point is only to find
 * every routed slug.
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import {
  ALLOWED_VALUES,
  CONTENT,
  CTA_IDS,
  ENTRY_CATEGORIES,
  classifyEntry,
  contentIdForPath,
  ctaForHref,
  searchTopic,
} from "./catalog.ts";

const LIB = fileURLToPath(new URL("../", import.meta.url));
const read = (f: string) => readFileSync(`${LIB}${f}`, "utf8");

describe("catalog coverage", () => {
  test("every project, service, hire page and post has a content id", () => {
    const projectSlugs = [...read("site.ts").matchAll(/^\s{4}slug: "([^"]+)",/gm)].map((m) => `/work/${m[1]}`);
    const servicePaths = [...read("services.ts").matchAll(/^\s{4}slug: "(\/[^"]+)",/gm)].map((m) => m[1]);
    const postPaths = [...read("writing.ts").matchAll(/^\s{4}slug: "([^"]+)",/gm)].map((m) => `/writing/${m[1]}`);
    assert.equal(projectSlugs.length, 6);
    assert.equal(servicePaths.length, 5);
    assert.equal(postPaths.length, 4);
    for (const p of [...projectSlugs, ...servicePaths, ...postPaths]) {
      assert.ok(contentIdForPath(p), `missing from catalog: ${p}`);
    }
  });

  test("every catalog path is unique and every id is allowlisted", () => {
    const paths = Object.values(CONTENT).map((c) => c.path);
    assert.equal(new Set(paths).size, paths.length);
    assert.deepEqual([...ALLOWED_VALUES.content_id].sort(), Object.keys(CONTENT).sort());
  });

  test("unknown and query-string paths", () => {
    assert.equal(contentIdForPath("/nope"), null);
    assert.equal(contentIdForPath("/work/ai-pulse?ref=x#top"), "case_ai_pulse");
    assert.equal(contentIdForPath("/about/"), "about");
    assert.equal(contentIdForPath(""), "home");
  });
});

describe("classifyEntry", () => {
  const own = "shivambhadoriya.com";
  test("categories", () => {
    assert.equal(classifyEntry("", "", own), "direct");
    assert.equal(classifyEntry("https://www.google.com/", "", own), "search");
    assert.equal(classifyEntry("https://www.bing.com/", "", own), "search");
    assert.equal(classifyEntry("https://chatgpt.com/", "", own), "ai_assistant");
    assert.equal(classifyEntry("https://www.perplexity.ai/", "", own), "ai_assistant");
    assert.equal(classifyEntry("https://www.linkedin.com/", "", own), "social");
    assert.equal(classifyEntry("https://github.com/x", "", own), "developer_community");
    assert.equal(classifyEntry("https://mail.google.com/", "", own), "email");
    assert.equal(classifyEntry("https://example.org/a", "", own), "referral");
    assert.equal(classifyEntry("https://www.shivambhadoriya.com/work", "", own), "internal");
    assert.equal(classifyEntry("not a url", "", own), "direct");
  });
  test("utm handling never trusts an unregistered campaign", () => {
    assert.equal(classifyEntry("", "?utm_medium=email", own), "email");
    assert.equal(classifyEntry("", "?utm_source=linkedin", own), "social");
    assert.equal(classifyEntry("", "?utm_campaign=secret-launch", own), "direct");
  });
  test("every result is an allowlisted category", () => {
    for (const r of ["", "https://x.com/", "https://claude.ai/", "https://a.b/"]) {
      assert.ok(ENTRY_CATEGORIES.includes(classifyEntry(r, "", own)));
    }
  });
});

describe("ctaForHref", () => {
  const own = "shivambhadoriya.com";
  const projects = [{ repo: "https://github.com/Dev-Shivam-05/AI-PULSE", live: "https://dev-shivam-05.github.io/AI-PULSE/" }];
  test("mapping", () => {
    assert.equal(ctaForHref("/contact", own), "start_project");
    assert.equal(ctaForHref("#contact", own), "start_project");
    assert.equal(ctaForHref("https://shivambhadoriya.com/contact", own), "start_project");
    assert.equal(ctaForHref("mailto:a@b.c", own), "email");
    assert.equal(ctaForHref("tel:+91", own), "phone");
    assert.equal(ctaForHref("https://github.com/Dev-Shivam-05", own), "social_github");
    assert.equal(ctaForHref("https://github.com/Dev-Shivam-05/AI-PULSE", own, projects), "case_repo");
    assert.equal(ctaForHref("https://dev-shivam-05.github.io/AI-PULSE/", own, projects), "case_live");
    assert.equal(ctaForHref("https://www.linkedin.com/in/x/", own), "social_linkedin");
    assert.equal(ctaForHref("https://x.com/Dev_Shivam_05", own), "social_x");
    assert.equal(ctaForHref("/work", own), null);
    assert.equal(ctaForHref("https://example.com", own), null);
  });
  test("every result is an allowlisted CTA", () => {
    for (const h of ["/contact", "mailto:x", "tel:1", "https://github.com/a", "https://instagram.com/a", "https://wakatime.com/@a"]) {
      const r = ctaForHref(h, own);
      assert.ok(r && CTA_IDS.includes(r), h);
    }
  });
});

describe("searchTopic", () => {
  test("query reduced to a topic", () => {
    assert.equal(searchTopic("hire for full-time role"), "hiring");
    assert.equal(searchTopic("website price"), "development");
    assert.equal(searchTopic("open source collab"), "collaboration");
    assert.equal(searchTopic("xyz"), "other");
    assert.equal(searchTopic(""), "other");
  });
});
