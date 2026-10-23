/**
 * The content catalog and the controlled vocabularies of the journey channel.
 *
 * README "Collection restrictions": use content IDs, controlled campaign codes
 * and CTA IDs instead of arbitrary URLs or text. The browser maps the page it
 * is on to an ID from this file and sends only the ID; the server accepts only
 * IDs from this file. A URL, a query string or a typed word never crosses.
 *
 * Shared by the client tracker, the API and `node --test`, so it must stay free
 * of Node, Next and `@/` imports. `catalog.test.ts` fails if a routed page in
 * lib/site.ts, lib/services.ts or lib/writing.ts is missing here.
 */

export type ContentType =
  | "home"
  | "service_index"
  | "service"
  | "hire"
  | "work_index"
  | "case_study"
  | "article_index"
  | "article"
  | "about"
  | "stack"
  | "contact"
  | "lab"
  | "stats"
  | "legal";

export type ContentTopic = "general" | "development" | "mobile" | "ai_automation" | "hiring" | "writing" | "legal";

export type ContentEntry = { path: string; type: ContentType; topic: ContentTopic; title: string };

export const CONTENT: Record<string, ContentEntry> = {
  home: { path: "/", type: "home", topic: "general", title: "Home" },
  services: { path: "/services", type: "service_index", topic: "development", title: "Services" },
  service_web: { path: "/services/web-development", type: "service", topic: "development", title: "Web development" },
  service_mobile: { path: "/services/mobile-app-development", type: "service", topic: "mobile", title: "Mobile app development" },
  service_ai: { path: "/services/ai-automation", type: "service", topic: "ai_automation", title: "AI automation" },
  hire_navsari: { path: "/hire/web-developer-navsari", type: "hire", topic: "development", title: "Hire — web developer, Navsari" },
  hire_surat: { path: "/hire/web-developer-surat", type: "hire", topic: "development", title: "Hire — web developer, Surat" },
  work: { path: "/work", type: "work_index", topic: "development", title: "Work" },
  case_ai_pulse: { path: "/work/ai-pulse", type: "case_study", topic: "ai_automation", title: "Case study — AI-PULSE" },
  case_cgpe_connect: { path: "/work/cgpe-connect", type: "case_study", topic: "development", title: "Case study — CGPE Connect" },
  case_observable_machine: { path: "/work/observable-machine", type: "case_study", topic: "development", title: "Case study — Observable Machine" },
  case_jsclimatenow: { path: "/work/jsclimatenow", type: "case_study", topic: "development", title: "Case study — JSClimateNow" },
  case_recipe_book: { path: "/work/recipe-book", type: "case_study", topic: "development", title: "Case study — Recipe Book" },
  case_contribution_art: { path: "/work/contribution-art", type: "case_study", topic: "development", title: "Case study — Contribution Art" },
  writing: { path: "/writing", type: "article_index", topic: "writing", title: "Writing" },
  article_ai_wrote_my_code: { path: "/writing/the-month-ai-wrote-99-percent-of-my-code", type: "article", topic: "ai_automation", title: "Article — The month AI wrote 99.77% of my code" },
  article_spec_is_deliverable: { path: "/writing/the-spec-is-the-deliverable", type: "article", topic: "ai_automation", title: "Article — The spec is the deliverable" },
  article_ai_pulse_channel: { path: "/writing/ai-pulse-a-channel-that-publishes-itself", type: "article", topic: "ai_automation", title: "Article — AI-PULSE, a channel that publishes itself" },
  article_unpinned_contribution_art: { path: "/writing/why-i-unpinned-my-contribution-art-generator", type: "article", topic: "development", title: "Article — Why I unpinned my contribution-art generator" },
  about: { path: "/about", type: "about", topic: "general", title: "About" },
  stack: { path: "/stack", type: "stack", topic: "development", title: "Stack" },
  contact: { path: "/contact", type: "contact", topic: "general", title: "Contact" },
  lab: { path: "/lab", type: "lab", topic: "development", title: "Lab" },
  stats: { path: "/stats", type: "stats", topic: "general", title: "Live stats" },
  privacy: { path: "/privacy-policy", type: "legal", topic: "legal", title: "Privacy policy" },
  terms: { path: "/terms", type: "legal", topic: "legal", title: "Terms" },
};

const BY_PATH: Record<string, string> = Object.fromEntries(
  Object.entries(CONTENT).map(([id, c]) => [c.path, id]),
);

/** The content ID for a pathname, or null — an unknown page is never reported. */
export function contentIdForPath(pathname: string): string | null {
  const clean = pathname.split(/[?#]/)[0].replace(/\/+$/, "") || "/";
  return BY_PATH[clean] ?? null;
}

/**
 * CTA IDs. The tracker derives them from what a link points at, so no
 * component needs to be annotated — and an unrecognised link sends nothing.
 */
export const CTA_IDS = [
  "start_project", // any link to /contact, including the nav "Hire me"
  "enquiry_submitted", // the contact form accepted an enquiry
  "email",
  "copy_email",
  "phone",
  "social_github",
  "social_linkedin",
  "social_x",
  "social_instagram",
  "social_wakatime",
  "case_repo", // a project's source repository
  "case_live", // a project's live deployment
] as const;
export type CtaId = (typeof CTA_IDS)[number];

/** How a visitor arrived, as a category — the referrer URL itself never leaves the browser. */
export const ENTRY_CATEGORIES = [
  "internal", // a navigation inside this site
  "direct", // no referrer
  "search", // a search engine
  "ai_assistant", // an answer engine citing the site
  "social",
  "developer_community",
  "email",
  "campaign", // a registered campaign code (CAMPAIGN_CODES)
  "referral", // any other site
] as const;
export type EntryCategory = (typeof ENTRY_CATEGORIES)[number];

/** README: "controlled campaign codes". None are registered yet; add one here to use it. */
export const CAMPAIGN_CODES: readonly string[] = [];

/** reference.py ALLOWED_VALUES["topic"], unchanged. */
export const SEARCH_TOPICS = ["development", "hiring", "collaboration", "other"] as const;

/** The site offers nothing to download, so this is empty and the event is always rejected. */
export const ASSET_IDS: readonly string[] = [];

/** Exact property key sets per event name (reference.py PROPERTIES, adapted — spec D6). */
export const EVENT_PROPERTIES: Record<string, readonly string[]> = {
  page_view: ["content_id", "entry"],
  cta_click: ["cta_id"],
  download_requested: ["asset_id"],
  search_submitted: ["topic"],
  booking_confirmed: ["booking_state"],
};

export const ALLOWED_VALUES: Record<string, readonly string[]> = {
  content_id: Object.keys(CONTENT),
  entry: ENTRY_CATEGORIES,
  cta_id: CTA_IDS,
  asset_id: ASSET_IDS,
  topic: SEARCH_TOPICS,
  booking_state: ["confirmed"],
};

/* -------------------------------------------------------------------------- */
/* Browser-side classifiers. Pure functions: the raw input stays on the device. */
/* -------------------------------------------------------------------------- */

const SEARCH_HOSTS = [/(^|\.)google\./, /(^|\.)bing\.com$/, /(^|\.)duckduckgo\.com$/, /(^|\.)yahoo\./, /(^|\.)yandex\./, /(^|\.)baidu\.com$/, /(^|\.)ecosia\.org$/, /(^|\.)search\.brave\.com$/, /^com\.google\.android\.googlequicksearchbox$/];
const AI_HOSTS = [/(^|\.)chatgpt\.com$/, /(^|\.)chat\.openai\.com$/, /(^|\.)perplexity\.ai$/, /(^|\.)claude\.ai$/, /(^|\.)gemini\.google\.com$/, /(^|\.)copilot\.microsoft\.com$/];
const SOCIAL_HOSTS = [/(^|\.)linkedin\.com$/, /(^|\.)lnkd\.in$/, /(^|\.)x\.com$/, /(^|\.)t\.co$/, /(^|\.)twitter\.com$/, /(^|\.)facebook\.com$/, /(^|\.)instagram\.com$/, /(^|\.)reddit\.com$/, /(^|\.)youtube\.com$/, /(^|\.)whatsapp\.com$/];
const DEV_HOSTS = [/(^|\.)github\.com$/, /(^|\.)stackoverflow\.com$/, /(^|\.)dev\.to$/, /(^|\.)hashnode\.(com|dev)$/, /(^|\.)medium\.com$/, /(^|\.)news\.ycombinator\.com$/, /(^|\.)wakatime\.com$/];
const MAIL_HOSTS = [/(^|\.)mail\.google\.com$/, /(^|\.)outlook\.(live|office)\.com$/, /(^|\.)mail\.yahoo\.com$/, /(^|\.)mail\.zoho\.(com|in)$/];

const matches = (host: string, list: RegExp[]) => list.some((r) => r.test(host));

function categoryForHost(host: string): EntryCategory {
  // Most specific first: gemini.google.com and mail.google.com would otherwise
  // both match the broad google.* search pattern.
  if (matches(host, AI_HOSTS)) return "ai_assistant";
  if (matches(host, MAIL_HOSTS)) return "email";
  if (matches(host, SEARCH_HOSTS)) return "search";
  if (matches(host, SOCIAL_HOSTS)) return "social";
  if (matches(host, DEV_HOSTS)) return "developer_community";
  return "referral";
}

/**
 * The entry category of a page load. `search` is `location.search`; only a
 * registered campaign code or a recognised `utm_source` changes the answer.
 */
export function classifyEntry(referrer: string, search: string, ownHost: string): EntryCategory {
  const qs = new URLSearchParams(search);
  const campaign = (qs.get("utm_campaign") || "").toLowerCase();
  if (campaign && CAMPAIGN_CODES.includes(campaign)) return "campaign";
  const medium = (qs.get("utm_medium") || "").toLowerCase();
  if (medium === "email") return "email";
  const source = (qs.get("utm_source") || "").toLowerCase();
  if (source) {
    const asHost = source.includes(".") ? source : `${source}.com`;
    const cat = categoryForHost(asHost);
    if (cat !== "referral") return cat;
  }
  if (!referrer) return "direct";
  let host = "";
  try {
    host = new URL(referrer).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "direct";
  }
  if (!host) return "direct";
  if (host === ownHost.toLowerCase().replace(/^www\./, "")) return "internal";
  return categoryForHost(host);
}

/** Project links, so a click on one reads as `case_repo` / `case_live` rather than a profile visit. */
export type ProjectLinks = { repo?: string; live?: string }[];

/** The CTA a link stands for, or null when it stands for nothing we track. */
export function ctaForHref(href: string, ownHost: string, projects: ProjectLinks = []): CtaId | null {
  if (!href) return null;
  const h = href.trim();
  if (h.startsWith("mailto:")) return "email";
  if (h.startsWith("tel:")) return "phone";
  if (h === "#contact" || /^\/contact(?:[/?#]|$)/.test(h)) return "start_project";
  let url: URL;
  try {
    url = new URL(h, `https://${ownHost}`);
  } catch {
    return null;
  }
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  const own = ownHost.toLowerCase().replace(/^www\./, "");
  if (host === own) return /^\/contact(?:[/?#]|$)/.test(url.pathname) ? "start_project" : null;
  const norm = (u: string) => u.replace(/\/+$/, "").toLowerCase();
  const target = norm(url.href);
  for (const p of projects) {
    if (p.repo && norm(p.repo) === target) return "case_repo";
    if (p.live && /^https?:/.test(p.live) && norm(p.live) === target) return "case_live";
  }
  if (host === "github.com") {
    const parts = url.pathname.split("/").filter(Boolean);
    return parts.length >= 2 ? "case_repo" : "social_github";
  }
  if (host.endsWith("linkedin.com")) return "social_linkedin";
  if (host === "x.com" || host === "twitter.com") return "social_x";
  if (host.endsWith("instagram.com")) return "social_instagram";
  if (host.endsWith("wakatime.com")) return "social_wakatime";
  return null;
}

const TOPIC_WORDS: Record<Exclude<(typeof SEARCH_TOPICS)[number], "other">, RegExp> = {
  hiring: /\b(hire|hiring|job|jobs|resume|cv|recruit\w*|full[- ]?time|role|salary|candidate|interview|available|availability)\b/i,
  collaboration: /\b(collab\w*|partner\w*|open[- ]?source|together|contribut\w*|speak\w*|podcast|guest)\b/i,
  development: /\b(web|website|app|apps|mobile|android|ios|build|project|develop\w*|ai|automation|agent\w*|service\w*|price|pricing|cost|quote|work|case|stack|next|react)\b/i,
};

/** A palette query reduced to a topic in the browser. The words themselves are never sent. */
export function searchTopic(query: string): (typeof SEARCH_TOPICS)[number] {
  if (TOPIC_WORDS.hiring.test(query)) return "hiring";
  if (TOPIC_WORDS.collaboration.test(query)) return "collaboration";
  if (TOPIC_WORDS.development.test(query)) return "development";
  return "other";
}
