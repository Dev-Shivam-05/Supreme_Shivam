/**
 * Single source of truth for portfolio content.
 * Dynamic parts (projects, leads, analytics) live in MongoDB; this is the
 * typed editorial seed. Swap the placeholder `picsum.photos` images for your
 * own files in /public when you have them.
 */

export const site = {
  name: "Shivam Bhadoriya",
  handle: "Dev-Shivam-05",
  role: "Full-Stack Developer",
  roleLong: "Full-Stack Engineer — MERN, realtime systems & performance",
  location: "India",
  availability: "Open to full-time & freelance",
  status: "Available now",
  email: "shivambhadoriya1605@gmail.com",
  url: "https://shivam-bhadoriya-dev.vercel.app",
  tagline:
    "I build fast, observable, production-grade web systems — and the interfaces that make them feel effortless.",
  social: {
    github: "https://github.com/Dev-Shivam-05",
    linkedin: "https://linkedin.com/in/shivam-bhadoriya-dev",
    email: "mailto:shivambhadoriya1605@gmail.com",
  },
} as const;

export const nav = [
  { label: "Work", href: "/work", index: "01" },
  { label: "About", href: "/about", index: "02" },
  { label: "Stack", href: "/stack", index: "03" },
  { label: "Lab", href: "/lab", index: "04" },
  { label: "Contact", href: "/contact", index: "05" },
] as const;

export type Stat = { value: string; label: string; sub?: string };

export const stats: Stat[] = [
  { value: "3", label: "Shipped products", sub: "live & maintained" },
  { value: "40+", label: "REST endpoints", sub: "authored & documented" },
  { value: "70%", label: "Faster queries", sub: "indexing + aggregation" },
  { value: "98", label: "Lighthouse", sub: "performance budget" },
];

/** The signature I sign with — drawn live in SVG on the site. */
export const signatureText = "S.D.Bhadoriya";

export const now = {
  building: "An observable, self-instrumenting portfolio engine",
  learning: "Advanced Next.js, Docker & distributed systems",
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
  imageUrl?: string; // optional uploaded image (overrides the coded motif)
  repo?: string;
  live?: string;
};

export const projects: Project[] = [
  {
    slug: "cgpe-connect",
    index: "01",
    title: "CGPE Connect",
    category: "Flagship · Ops Platform",
    year: "2025",
    role: "Full-stack lead",
    timeline: "2024 — 2025",
    summary:
      "A production operations platform — realtime dashboards, document vaults and role-based workflows for agents and admins.",
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
    index: "02",
    title: "The Observable Machine",
    category: "Meta · This Site",
    year: "2026",
    role: "Design + full-stack",
    timeline: "2026",
    summary:
      "The site you're on — a portfolio built as a live, self-instrumenting system you can inspect.",
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
    slug: "contribution-art",
    index: "03",
    title: "Contribution Art Engine",
    category: "Open Source · Tooling",
    year: "2025",
    role: "Solo — full-stack",
    timeline: "2025 · ongoing",
    summary:
      "A generator that paints custom patterns onto a GitHub contribution graph via a scheduled commit engine.",
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
      "A performance-obsessed weather client with intelligent caching and an offline-first fallback.",
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
      "A full CRUD recipe platform with instant client-side search and filtering across a responsive grid.",
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
    title: "Relentlessly consistent",
    body: "A long GitHub streak isn't the point — showing up and shipping every day is. Discipline compounds.",
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
export const process: Step[] = [
  { n: "01", title: "Scope", body: "Understand the problem, the constraints and what 'done' actually means before writing code." },
  { n: "02", title: "Architect", body: "Model the data, design the API surface, decide the trade-offs — on paper first." },
  { n: "03", title: "Build", body: "Ship in vertical slices with types, validation and tests at every boundary." },
  { n: "04", title: "Measure", body: "Instrument it, watch the numbers, and iterate until it's fast and reliable." },
];

export type TimelineItem = { period: string; title: string; org: string; body: string };
export const timeline: TimelineItem[] = [
  {
    period: "2024 — now",
    title: "Full-Stack Developer",
    org: "Freelance & open source",
    body: "Shipping MERN products end-to-end, contributing to open source, and going deep on Next.js, realtime and systems design.",
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
    org: "VidhyaDeep University",
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
    a: "Yes — open to full-time roles, internships and freelance projects. I reply to enquiries within 24 hours.",
  },
  {
    q: "What's your core stack?",
    a: "MERN — MongoDB, Express, React, Node — with TypeScript, Next.js, and realtime via Socket.io. Comfortable across the whole slice.",
  },
  {
    q: "Do you work remotely?",
    a: "Always. I'm based in India and collaborate with teams across time zones, async-first.",
  },
  {
    q: "Can you handle both design and engineering?",
    a: "Yes. This site is a proof point — design system, motion, backend, analytics and admin, all built end-to-end.",
  },
];

export const facts = [
  { k: "Education", v: "B.Sc. IT · VidhyaDeep University" },
  { k: "Based in", v: "India · Open to remote" },
  { k: "Focus", v: "MERN · Realtime · Performance" },
  { k: "Currently", v: "Deep on Next.js, Docker & systems design" },
] as const;
