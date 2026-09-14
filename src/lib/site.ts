/**
 * Single source of truth for portfolio content.
 * Dynamic parts (projects, leads, analytics) live in MongoDB; this is the
 * typed editorial seed.
 *
 * IDENTITY RULE: one job title, one company, one city — everywhere. Google
 * reconciles a person across sites; three different titles for one name weakens
 * all three. Anything user-visible that names the role must read from `site`.
 */

/**
 * The canonical origin. Set NEXT_PUBLIC_SITE_URL in Vercel the day the
 * exact-match domain is live (shivambhadoriya.com); until then the vercel.app
 * host stays canonical so nothing 301s into a domain that doesn't resolve.
 * Everything downstream — metadata, canonicals, JSON-LD, sitemap, robots and
 * the host redirect in next.config.ts — derives from this one value.
 */
const CANONICAL_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://shivam-bhadoriya-dev.vercel.app")
  .trim()
  .replace(/\/+$/, "");

export const site = {
  name: "Shivam Bhadoriya",
  firstName: "Shivam",
  lastName: "Bhadoriya",
  handle: "Dev-Shivam-05",
  role: "AI Engineer",
  roleLong: "AI Engineer — I write the spec, direct the agents, and review and test what they build.",
  company: "Aaziko Global LLP",
  /**
   * ONE city, everywhere. DEV-HANDOVER settles it as Navsari — the local search
   * strategy (the /hire pages, the Google Business Profile service area) is built
   * on it. GitHub currently says Ahmedabad and must be changed to match; three
   * cities across public profiles is what weakens the entity.
   */
  location: "Navsari, Gujarat",
  address: { locality: "Navsari", region: "Gujarat", country: "IN" },
  latitude: "20.9°N",
  /** Cities and regions the service pages and the Business Profile claim. */
  areaServed: ["Navsari", "Surat"],
  availability: "Open to full-time & freelance",
  status: "Available now",
  email: "contact@shivambhadoriya.com",
  /**
   * Public phone. E.164 for schema and tel: links, spaced for display.
   * Consumers still guard on a value, so clearing it removes the number
   * everywhere rather than rendering a blank.
   */
  phone: "+919106988376",
  phoneDisplay: "+91 91069 88376",
  university: "Vidhyadeep University",
  url: CANONICAL_URL,
  /** The page <title> and the OG/Twitter title. 30 chars — never truncated. */
  title: "Shivam Bhadoriya — AI Engineer",
  /** The meta description. 149 chars — inside Google's ~160 char render budget. */
  tagline:
    "AI Engineer in Navsari, Gujarat. I write the spec, direct the coding agents, and review and test what they build. Web, mobile and automation projects.",
  /** The short form used on social cards, where space is tighter. */
  taglineShort: "I write the spec, direct the coding agents, and review and test what they build.",
  /** Starting price quoted on every service page. Clients filter on this. */
  rateFrom: "₹30,000",
  /**
   * Stable, human-readable image paths. The filename is a ranking input for
   * Google image search and these exact strings appear in the JSON-LD and the
   * image sitemap — regenerate with `npm run images`, never rename.
   */
  images: {
    /** Square, ring intact. The ONE avatar — also upload this to LinkedIn, GitHub and X. */
    avatar: "/images/shivam-bhadoriya-ai-engineer.jpg",
    /** The full photograph, used in the hero and on /about. */
    portrait: "/images/shivam-bhadoriya-portrait.jpg",
    /** 1200x630 link-preview card, built from the profile photograph. */
    og: "/og/shivam-bhadoriya.jpg",
    /** Used verbatim as alt text on every instance of his face. */
    alt: "Shivam Bhadoriya, AI Engineer at Aaziko Global LLP, Navsari",
  },
  social: {
    github: "https://github.com/Dev-Shivam-05",
    linkedin: "https://www.linkedin.com/in/shivam-bhadoriya-dev/",
    x: "https://x.com/Dev_Shivam_05",
    xHandle: "@Dev_Shivam_05",
    // The username really is `__https_shivu` — it reads like a signup accident,
    // but it resolves, and DEV-HANDOVER lists it in sameAs.
    wakatime: "https://wakatime.com/@__https_shivu",
    instagram: "https://www.instagram.com/__https.shivu",
    email: "mailto:contact@shivambhadoriya.com",
  },
} as const;

export const nav = [
  { label: "Services", href: "/services", index: "01" },
  { label: "Work", href: "/work", index: "02" },
  { label: "About", href: "/about", index: "03" },
  { label: "Writing", href: "/writing", index: "04" },
  { label: "Stack", href: "/stack", index: "05" },
  { label: "Contact", href: "/contact", index: "06" },
] as const;

/** Reachable and in the sitemap, just not in the top bar. */
export const secondaryNav = [
  { label: "Lab", href: "/lab" },
  { label: "Live stats", href: "/stats" },
  { label: "Privacy", href: "/privacy-policy" },
  { label: "Terms", href: "/terms" },
] as const;

export type Stat = { value: string; label: string; sub?: string };

export const stats: Stat[] = [
  { value: "99.77%", label: "Of my line changes", sub: "written by AI, Aug 2026" },
  { value: "0%", label: "The same figure", sub: "in October 2025" },
  { value: "Daily", label: "Unattended publishes", sub: "AI-PULSE, on CI" },
  { value: "98", label: "Lighthouse", sub: "performance budget" },
];

/** The signature I sign with — drawn live in SVG on the site. */
export const signatureText = "S.D.Bhadoriya";

export const now = {
  building: "AI-PULSE — a YouTube channel that publishes itself, daily",
  learning: "Agent orchestration, evals and spec-driven delivery",
  status: "Available for full-time & freelance",
} as const;

/** Editable site content (overridable from /admin). Client-safe type. */
export type SiteContent = {
  availability: string;
  status: string;
  roleLong: string;
  tagline: string;
  heroLead: string;
  aboutParagraphs: string[];
  now: { building: string; learning: string; status: string };
  location: string;
  email: string;
};

/**
 * The editable content with the address removed.
 *
 * Anything handed to a client component is serialised into the RSC flight
 * payload inside the HTML, where an address harvester reads it just as easily as
 * a `mailto:` href. Public surfaces take this type; only the admin sees the address.
 */
export type PublicContent = Omit<SiteContent, "email">;

export type CoverPattern = "grid" | "wave" | "nodes" | "scan" | "orbit";

export type Project = {
  slug: string;
  index: string;
  title: string;
  category: string;
  year: string;
  role: string;
  timeline: string;
  summary: string;
  description: string;
  stack: string[];
  metrics: { value: string; label: string }[];
  problem: string;
  approach: string[];
  architecture: string[];
  outcomes: string[];
  pattern: CoverPattern; // coded cover motif (no stock photos)
  flagship?: boolean;
  /** Kept in the archive and still has a case study, but never shown as featured. */
  archived?: boolean;
  imageUrl?: string; // optional uploaded image (overrides the coded motif)
  repo?: string;
  live?: string;
};

export const projects: Project[] = [
  {
    slug: "ai-pulse",
    index: "01",
    title: "AI-PULSE",
    category: "Flagship · Autonomous Pipeline",
    year: "2026",
    role: "Solo — pipeline design + delivery",
    timeline: "2026 · running daily",
    summary:
      "A YouTube channel that publishes itself: one video and one Short about a trending AI tool, every day, unattended — on GitHub Actions at zero infrastructure cost.",
    description:
      "An unattended content pipeline in Python. A scheduled GitHub Actions workflow picks the AI tool trending that day, researches it with Playwright, narrates it with text-to-speech, cuts a long-form video and a Short with FFmpeg, and publishes both through the YouTube Data API. It also builds a cheat-sheet PDF onto GitHub Pages and announces each video on Telegram and X. There is no server and no cron box — the whole thing runs inside CI minutes, and pytest gates every run.",
    stack: ["Python", "GitHub Actions", "FFmpeg", "Playwright", "Text-to-speech", "YouTube Data API", "pytest"],
    metrics: [
      { value: "Daily", label: "Unattended publishes" },
      { value: "$0", label: "Infrastructure cost" },
      { value: "CI", label: "Tested every run" },
    ],
    problem:
      "Publishing daily is a discipline problem, not a creative one. Doing it by hand costs an hour a day; doing it on a server costs money and babysitting.",
    approach: [
      "Moved the whole pipeline into scheduled GitHub Actions — no server, no cron box, no bill.",
      "Made one run produce both formats: a long-form video and a Short, from the same source material.",
      "Put tests in CI so a broken run fails loudly instead of publishing something wrong.",
    ],
    architecture: [
      "Three GitHub Actions workflows · publish, notify, test",
      "Playwright research → TTS narration → FFmpeg cut",
      "YouTube Data API upload · cheat-sheet PDF to GitHub Pages",
      "pytest in CI gates the publish step · Telegram + X announce",
    ],
    outcomes: [
      "Publishes a video and a Short every day without a human in the loop",
      "Zero infrastructure cost — it runs entirely inside CI minutes",
      "Failures surface as red CI runs, not as bad uploads",
    ],
    pattern: "orbit",
    flagship: true,
    repo: "https://github.com/Dev-Shivam-05/AI-PULSE",
    live: "https://dev-shivam-05.github.io/AI-PULSE/",
  },
  {
    slug: "cgpe-connect",
    index: "02",
    title: "CGPE Connect",
    category: "Flagship · Ops Platform",
    year: "2025",
    role: "Full-stack lead",
    timeline: "2024 — 2025",
    summary:
      "Replaced spreadsheet-and-email operations with realtime, role-separated workflows — live dashboards, an S3 document vault and an audit trail behind every action.",
    description:
      "A MERN platform handling policies, claims and agent workflows. Socket.io powers live dashboards; documents live in AWS S3 behind signed URLs; Twilio and email drive notifications; JWT + RBAC gate every route, with rate-limiting, request sanitisation and Winston structured logging throughout.",
    stack: ["React", "TypeScript", "Node/Express", "MongoDB", "Socket.io", "AWS S3", "Twilio", "JWT"],
    metrics: [
      { value: "Realtime", label: "Dashboards" },
      { value: "RBAC", label: "Multi-role auth" },
      { value: "S3", label: "Document vault" },
    ],
    problem:
      "Operations ran on spreadsheets and email — no realtime view, no audit trail, no separation between agent and admin.",
    approach: [
      "Modelled policies, claims and agents as indexed Mongo schemas with aggregation pipelines.",
      "Pushed live updates over Socket.io so dashboards never go stale.",
      "Locked every route behind JWT + role-based access, rate-limiting and input sanitisation.",
      "Offloaded documents to S3 with signed URLs; wired Twilio + email notifications.",
    ],
    architecture: [
      "Express REST API · service layer · Winston logs",
      "MongoDB (Mongoose) · indexes + aggregation",
      "Socket.io realtime · JWT / RBAC middleware",
      "AWS S3 storage · Twilio / email · Jest tests",
    ],
    outcomes: [
      "Realtime operational visibility, replacing spreadsheets",
      "Role-separated, auditable workflows end-to-end",
      "Document handling moved off-server to S3",
    ],
    pattern: "nodes",
    flagship: true,
  },
  {
    slug: "observable-machine",
    index: "03",
    title: "The Observable Machine",
    category: "Meta · This Site",
    year: "2026",
    role: "Design + full-stack",
    timeline: "2026",
    summary:
      "The site you are reading — a portfolio that instruments itself: its own analytics pipeline, a public /stats page and an admin, all inspectable.",
    description:
      "A Next.js 16 + React 19 front end with a WebGL hero, GSAP/Lenis motion and a ⌘K palette, over a MongoDB backend: a self-built analytics pipeline (beacon → API → rollups) feeding a public /stats page and an env-gated admin with a leads pipeline.",
    stack: ["Next.js 16", "React 19", "TypeScript", "MongoDB", "Three / R3F", "GSAP"],
    metrics: [
      { value: "Live", label: "Analytics" },
      { value: "WebGL", label: "Hero" },
      { value: "Admin", label: "Dashboard" },
    ],
    problem:
      "Most portfolios claim engineering skill but show only screenshots. I wanted one that proves it, live.",
    approach: [
      "Built a real analytics pipeline instead of dropping in a third-party script.",
      "Shipped an env-gated admin with a leads pipeline and live dashboards.",
      "Engineered the motion system — cursor, magnetic, Lenis, WebGL — as GPU-only and reduced-motion aware.",
    ],
    architecture: [
      "Next.js App Router · RSC + client islands",
      "MongoDB (Mongoose) · beacon → API → rollups",
      "Route handlers = API · HMAC-cookie admin auth",
      "GSAP + Lenis + Motion · R3F shader hero",
    ],
    outcomes: [
      "A portfolio that's observable, not just clickable",
      "Real backend, analytics and admin — inspectable",
      "Fast, accessible and motion-rich",
    ],
    pattern: "scan",
    live: "/stats",
  },
  {
    slug: "jsclimatenow",
    index: "04",
    title: "JSClimateNow",
    category: "Product · Weather",
    year: "2025",
    role: "Solo — front-end + perf",
    timeline: "2025",
    summary:
      "98/100 Lighthouse and ~60% less bandwidth — a weather client with a request-throttling cache and an offline-first fallback.",
    description:
      "A feature-rich weather app scoring 98/100 Lighthouse. A request-throttling cache cut bandwidth ~60%, with multi-location comparison, custom data visualisations and a localStorage offline mode.",
    stack: ["JavaScript ES6+", "OpenWeather API", "LocalStorage", "Vite"],
    metrics: [
      { value: "98/100", label: "Lighthouse" },
      { value: "-60%", label: "Bandwidth" },
      { value: "Offline", label: "Capable" },
    ],
    problem:
      "Weather clients re-fetch aggressively and fall over without a connection. I wanted one that stayed fast and useful offline.",
    approach: [
      "Added a request-throttling cache layer to collapse redundant API calls.",
      "Built an offline-first localStorage fallback for last-known data.",
      "Hand-rolled data visualisations instead of a heavy chart lib.",
    ],
    architecture: [
      "Vanilla ES6+ modules · Vite build",
      "Cache + throttle layer over OpenWeather API",
      "localStorage persistence · custom SVG charts",
    ],
    outcomes: [
      "98/100 Lighthouse performance",
      "~60% bandwidth reduction via caching",
      "Usable offline with graceful degradation",
    ],
    pattern: "wave",
  },
  {
    slug: "recipe-book",
    index: "05",
    title: "Recipe Book Platform",
    category: "Product · CRUD",
    year: "2025",
    role: "Solo — front-end",
    timeline: "2025",
    summary:
      "Sub-40ms client-side search across a full CRUD recipe library, responsive from mobile to widescreen across five breakpoints.",
    description:
      "Create, edit and organise unlimited recipes with sub-40ms search and multi-facet filtering. Responsive across five breakpoints with a clean, componentised front end.",
    stack: ["HTML", "CSS", "Bootstrap", "JavaScript", "Vercel"],
    metrics: [
      { value: "<40ms", label: "Search" },
      { value: "Full", label: "CRUD" },
      { value: "5+", label: "Breakpoints" },
    ],
    problem:
      "Recipe managers felt sluggish and rigid. I wanted instant search/filter and a genuinely responsive grid.",
    approach: [
      "Indexed recipes client-side for sub-40ms search.",
      "Added multi-facet filtering that composes cleanly.",
      "Designed a grid that holds up across five breakpoints.",
    ],
    architecture: [
      "Componentised vanilla JS · Bootstrap grid",
      "In-memory index for instant search",
      "Deployed on Vercel",
    ],
    outcomes: [
      "Sub-40ms search across the collection",
      "Full create / read / update / delete flows",
      "Responsive from mobile to widescreen",
    ],
    pattern: "orbit",
  },
  {
    slug: "contribution-art",
    index: "06",
    title: "Contribution Art Engine",
    category: "Archived · Tooling",
    year: "2025",
    role: "Solo — full-stack",
    timeline: "2025 · ongoing",
    summary:
      "An archived experiment: a generator that painted patterns onto a GitHub contribution graph via a scheduled commit engine.",
    description:
      "A full-stack tool that turns a design grid into a real contribution graph. A versioned MongoDB schema stores pattern templates; an Express job engine triggers backdated commit workflows in under two minutes.",
    stack: ["Node.js", "Express", "MongoDB", "REST API", "SVG"],
    metrics: [
      { value: "<2min", label: "Trigger time" },
      { value: "Versioned", label: "Pattern schema" },
      { value: "OSS", label: "Public repo" },
    ],
    problem:
      "Contribution-graph art tools were manual, brittle and slow — no reusable templates, no fast way to trigger the workflow.",
    approach: [
      "Modelled patterns as a versioned MongoDB schema so templates are reusable and diffable.",
      "Built an Express job engine that maps a grid to backdated commit workflows.",
      "Reduced end-to-end trigger time to under two minutes.",
    ],
    architecture: [
      "Express REST API · pattern + job services",
      "MongoDB (Mongoose) with schema versioning",
      "SVG grid → commit-workflow translator",
    ],
    outcomes: [
      "Sub-2-minute trigger for complex patterns",
      "Reusable, versioned template library",
      "Open-sourced with a small active user base",
    ],
    pattern: "grid",
    archived: true,
  },
];

export type CapabilityGroup = { title: string; note: string; items: string[] };

export const capabilities: CapabilityGroup[] = [
  {
    title: "Frontend",
    note: "Interfaces that feel engineered",
    items: ["React", "TypeScript", "Next.js", "Tailwind", "GSAP", "Three / R3F"],
  },
  {
    title: "Backend",
    note: "APIs built to be trusted",
    items: ["Node.js", "Express", "REST", "JWT Auth", "Socket.io", "Zod"],
  },
  {
    title: "Data",
    note: "Modelled, indexed, observable",
    items: ["MongoDB", "Mongoose", "PostgreSQL", "Aggregation", "Indexing", "Redis"],
  },
  {
    title: "Platform",
    note: "Ship it and keep it up",
    items: ["Git", "Vercel", "Docker", "CI/CD", "AWS S3", "Render"],
  },
];

export type Proficiency = { name: string; level: number; years: string };
export const proficiency: Proficiency[] = [
  { name: "JavaScript / TypeScript", level: 92, years: "3 yrs" },
  { name: "React & Next.js", level: 88, years: "2 yrs" },
  { name: "Node.js & Express", level: 90, years: "3 yrs" },
  { name: "MongoDB & Mongoose", level: 87, years: "3 yrs" },
  { name: "UI / Motion (GSAP, R3F)", level: 80, years: "2 yrs" },
  { name: "DevOps (Docker, CI/CD)", level: 68, years: "1 yr" },
];

export type Approach = { title: string; body: string };
export const approach: Approach[] = [
  {
    title: "Performance is a feature",
    body: "70% faster queries, 60% less bandwidth, 98 Lighthouse. I treat speed as a requirement, not a nice-to-have.",
  },
  {
    title: "Systems, not screens",
    body: "Auth, rate limiting, validation, realtime, logging — I build the parts reviewers can inspect, not just the surface.",
  },
  {
    title: "Observable by design",
    body: "This very site runs a self-built analytics pipeline. If it moves, I want to measure it.",
  },
  {
    title: "The spec is the work",
    body: "Agents write most of my lines now. What decides whether the result is any good is the specification they were given, and the review and tests that came after.",
  },
];

export type Service = { index: string; title: string; body: string; tags: string[] };
export const services: Service[] = [
  {
    index: "01",
    title: "Full-stack web apps",
    body: "End-to-end products on the MERN stack — data modelling, REST APIs, auth, and a polished React front end.",
    tags: ["React", "Node", "MongoDB", "Auth"],
  },
  {
    index: "02",
    title: "Performance & optimisation",
    body: "Audits and rebuilds that cut query time, bandwidth and bundle size — measured against a Lighthouse budget.",
    tags: ["Indexing", "Caching", "Core Web Vitals"],
  },
  {
    index: "03",
    title: "Realtime & automation",
    body: "Socket.io features, event pipelines, cron jobs and integrations that quietly do the work for you.",
    tags: ["Socket.io", "Pipelines", "Cron"],
  },
  {
    index: "04",
    title: "Interface engineering",
    body: "Cinematic, accessible front ends with real motion design — the kind of surface that makes people stay.",
    tags: ["GSAP", "R3F", "Tailwind", "A11y"],
  },
];

export type Step = { n: string; title: string; body: string };
/** Named `processSteps`, not `process` — the bare name shadows the Node global. */
export const processSteps: Step[] = [
  { n: "01", title: "Scope", body: "Understand the problem, the constraints and what 'done' actually means before writing code." },
  { n: "02", title: "Architect", body: "Model the data, design the API surface, decide the trade-offs — on paper first." },
  { n: "03", title: "Build", body: "Ship in vertical slices with types, validation and tests at every boundary." },
  { n: "04", title: "Measure", body: "Instrument it, watch the numbers, and iterate until it's fast and reliable." },
];

export type TimelineItem = { period: string; title: string; org: string; body: string };
export const timeline: TimelineItem[] = [
  {
    period: "2026 — now",
    title: "AI Engineer",
    org: "Aaziko Global LLP",
    body: "I write the spec, direct the coding agents, and review and test what they build. In August 2026 agents made 99.77% of my line changes; in October 2025 they made none. The hours that used to go into typing now go into specification, architecture, tests and review.",
  },
  {
    period: "2024 — 2026",
    title: "Full-Stack Developer",
    org: "Freelance & open source",
    body: "Shipped MERN products end-to-end — Express/MongoDB backends with JWT auth, rate limiting and realtime sockets, behind React front-ends built to a performance budget.",
  },
  {
    period: "2024",
    title: "Tech War — Champion",
    org: "Inter-college competition",
    body: "Won a high-pressure engineering competition; 2× technical competition winner across the year.",
  },
  {
    period: "2023 — 2026",
    title: "B.Sc. Information Technology",
    org: site.university,
    body: "Computer science fundamentals alongside a relentless self-taught build cadence and a long GitHub streak.",
  },
];

export const values = [
  { title: "Own the outcome", body: "Not just the ticket — the result. I care whether it actually worked in production." },
  { title: "Measure everything", body: "Opinions are cheap. Numbers — query time, bundle size, Lighthouse — settle arguments." },
  { title: "Simple beats clever", body: "Readable, boring, correct code that the next person can maintain wins every time." },
  { title: "Ship, then iterate", body: "80% live and improving beats 100% that never launches. Momentum compounds." },
];

export const faqs = [
  {
    q: "Are you available right now?",
    a: "Yes — open to full-time roles and freelance projects alongside my work at Aaziko Global LLP. I reply to enquiries within 24 hours.",
  },
  {
    q: "What does an AI Engineer actually do here?",
    a: "I write the spec, direct the coding agents, and review and test what they build. The judgement calls — what to build, how it should be shaped, whether the result is correct — stay with me; the typing does not.",
  },
  {
    q: "What's your core stack?",
    a: "TypeScript, Next.js and React on the front, Node/Express and MongoDB behind, with AI coding agents driving the implementation under a written spec and a test suite.",
  },
  {
    q: "Do you work remotely?",
    a: "Always. I'm based in Navsari, Gujarat — an hour from Surat — and collaborate with teams across time zones, async-first.",
  },
  {
    q: "Can you handle both design and engineering?",
    a: "Yes. This site is a proof point — design system, motion, backend, analytics and admin, all built end-to-end.",
  },
];

export const facts = [
  { k: "Role", v: `${site.role} · ${site.company}` },
  { k: "Based in", v: "Navsari, Gujarat · Open to remote" },
  { k: "Education", v: `B.Sc. Information Technology · ${site.university}` },
  { k: "Focus", v: "Spec-driven delivery · AI coding agents · Review & tests" },
] as const;
