#!/usr/bin/env node
/**
 * One-shot database seed. After deploying anywhere, run:
 *     npm run seed
 * It reads MONGODB_URI from web/.env.local (or the environment), then loads all
 * projects + editable site content into MongoDB. Safe to re-run (it replaces
 * the projects collection and upserts the settings doc).
 */
import mongoose from "mongoose";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/* -------- load web/.env.local without a dotenv dependency -------- */
const here = dirname(fileURLToPath(import.meta.url));
const envPath = join(here, "..", ".env.local");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) {
      let v = m[2].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      process.env[m[1]] = v;
    }
  }
}

const URI = process.env.MONGODB_URI;
if (!URI) {
  console.error("\n✖ MONGODB_URI is not set. Add it to web/.env.local, then run `npm run seed` again.\n");
  process.exit(1);
}

/* ----------------------------- data ----------------------------- */
const projects = [
  {
    slug: "cgpe-connect", index: "01", title: "CGPE Connect", category: "Flagship · Ops Platform", year: "2025",
    role: "Full-stack lead", timeline: "2024 — 2025",
    summary: "A production operations platform — realtime dashboards, document vaults and role-based workflows for agents and admins.",
    description: "A MERN platform handling policies, claims and agent workflows. Socket.io powers live dashboards; documents live in AWS S3 behind signed URLs; Twilio and email drive notifications; JWT + RBAC gate every route, with rate-limiting, request sanitisation and Winston structured logging throughout.",
    stack: ["React", "TypeScript", "Node/Express", "MongoDB", "Socket.io", "AWS S3", "Twilio", "JWT"],
    metrics: [{ value: "Realtime", label: "Dashboards" }, { value: "RBAC", label: "Multi-role auth" }, { value: "S3", label: "Document vault" }],
    problem: "Operations ran on spreadsheets and email — no realtime view, no audit trail, no separation between agent and admin.",
    approach: ["Modelled policies, claims and agents as indexed Mongo schemas with aggregation pipelines.", "Pushed live updates over Socket.io so dashboards never go stale.", "Locked every route behind JWT + role-based access, rate-limiting and input sanitisation.", "Offloaded documents to S3 with signed URLs; wired Twilio + email notifications."],
    architecture: ["Express REST API · service layer · Winston logs", "MongoDB (Mongoose) · indexes + aggregation", "Socket.io realtime · JWT / RBAC middleware", "AWS S3 storage · Twilio / email · Jest tests"],
    outcomes: ["Realtime operational visibility, replacing spreadsheets", "Role-separated, auditable workflows end-to-end", "Document handling moved off-server to S3"],
    pattern: "nodes", flagship: true,
  },
  {
    slug: "observable-machine", index: "02", title: "The Observable Machine", category: "Meta · This Site", year: "2026",
    role: "Design + full-stack", timeline: "2026",
    summary: "The site you're on — a portfolio built as a live, self-instrumenting system you can inspect.",
    description: "A Next.js 16 + React 19 front end with a WebGL hero, GSAP/Lenis motion and a ⌘K palette, over a MongoDB backend: a self-built analytics pipeline (beacon → API → rollups) feeding a public /stats page and an env-gated admin with a leads pipeline.",
    stack: ["Next.js 16", "React 19", "TypeScript", "MongoDB", "Three / R3F", "GSAP"],
    metrics: [{ value: "Live", label: "Analytics" }, { value: "WebGL", label: "Hero" }, { value: "Admin", label: "Dashboard" }],
    problem: "Most portfolios claim engineering skill but show only screenshots. I wanted one that proves it, live.",
    approach: ["Built a real analytics pipeline instead of dropping in a third-party script.", "Shipped an env-gated admin with a leads pipeline and live dashboards.", "Engineered the motion system — cursor, magnetic, Lenis, WebGL — as GPU-only and reduced-motion aware."],
    architecture: ["Next.js App Router · RSC + client islands", "MongoDB (Mongoose) · beacon → API → rollups", "Route handlers = API · HMAC-cookie admin auth", "GSAP + Lenis + Motion · R3F shader hero"],
    outcomes: ["A portfolio that's observable, not just clickable", "Real backend, analytics and admin — inspectable", "Fast, accessible and motion-rich"],
    pattern: "scan", live: "/stats",
  },
  {
    slug: "contribution-art", index: "03", title: "Contribution Art Engine", category: "Open Source · Tooling", year: "2025",
    role: "Solo — full-stack", timeline: "2025 · ongoing",
    summary: "A generator that paints custom patterns onto a GitHub contribution graph via a scheduled commit engine.",
    description: "A full-stack tool that turns a design grid into a real contribution graph. A versioned MongoDB schema stores pattern templates; an Express job engine triggers backdated commit workflows in under two minutes.",
    stack: ["Node.js", "Express", "MongoDB", "REST API", "SVG"],
    metrics: [{ value: "<2min", label: "Trigger time" }, { value: "Versioned", label: "Pattern schema" }, { value: "OSS", label: "Public repo" }],
    problem: "Contribution-graph art tools were manual, brittle and slow — no reusable templates, no fast way to trigger the workflow.",
    approach: ["Modelled patterns as a versioned MongoDB schema so templates are reusable and diffable.", "Built an Express job engine that maps a grid to backdated commit workflows.", "Reduced end-to-end trigger time to under two minutes."],
    architecture: ["Express REST API · pattern + job services", "MongoDB (Mongoose) with schema versioning", "SVG grid → commit-workflow translator"],
    outcomes: ["Sub-2-minute trigger for complex patterns", "Reusable, versioned template library", "Open-sourced with a small active user base"],
    pattern: "grid",
  },
  {
    slug: "jsclimatenow", index: "04", title: "JSClimateNow", category: "Product · Weather", year: "2025",
    role: "Solo — front-end + perf", timeline: "2025",
    summary: "A performance-obsessed weather client with intelligent caching and an offline-first fallback.",
    description: "A feature-rich weather app scoring 98/100 Lighthouse. A request-throttling cache cut bandwidth ~60%, with multi-location comparison, custom data visualisations and a localStorage offline mode.",
    stack: ["JavaScript ES6+", "OpenWeather API", "LocalStorage", "Vite"],
    metrics: [{ value: "98/100", label: "Lighthouse" }, { value: "-60%", label: "Bandwidth" }, { value: "Offline", label: "Capable" }],
    problem: "Weather clients re-fetch aggressively and fall over without a connection. I wanted one that stayed fast and useful offline.",
    approach: ["Added a request-throttling cache layer to collapse redundant API calls.", "Built an offline-first localStorage fallback for last-known data.", "Hand-rolled data visualisations instead of a heavy chart lib."],
    architecture: ["Vanilla ES6+ modules · Vite build", "Cache + throttle layer over OpenWeather API", "localStorage persistence · custom SVG charts"],
    outcomes: ["98/100 Lighthouse performance", "~60% bandwidth reduction via caching", "Usable offline with graceful degradation"],
    pattern: "wave",
  },
  {
    slug: "recipe-book", index: "05", title: "Recipe Book Platform", category: "Product · CRUD", year: "2025",
    role: "Solo — front-end", timeline: "2025",
    summary: "A full CRUD recipe platform with instant client-side search and filtering across a responsive grid.",
    description: "Create, edit and organise unlimited recipes with sub-40ms search and multi-facet filtering. Responsive across five breakpoints with a clean, componentised front end.",
    stack: ["HTML", "CSS", "Bootstrap", "JavaScript", "Vercel"],
    metrics: [{ value: "<40ms", label: "Search" }, { value: "Full", label: "CRUD" }, { value: "5+", label: "Breakpoints" }],
    problem: "Recipe managers felt sluggish and rigid. I wanted instant search/filter and a genuinely responsive grid.",
    approach: ["Indexed recipes client-side for sub-40ms search.", "Added multi-facet filtering that composes cleanly.", "Designed a grid that holds up across five breakpoints."],
    architecture: ["Componentised vanilla JS · Bootstrap grid", "In-memory index for instant search", "Deployed on Vercel"],
    outcomes: ["Sub-40ms search across the collection", "Full create / read / update / delete flows", "Responsive from mobile to widescreen"],
    pattern: "orbit",
  },
];

const settings = {
  availability: "Open to full-time & freelance",
  status: "Available now",
  roleLong: "Full-Stack Engineer — MERN, realtime systems & performance",
  tagline: "I build fast, observable, production-grade web systems — and the interfaces that make them feel effortless.",
  heroLead: "I build fast, observable, production-grade web systems — realtime, indexed, engineered to be inspected — and the interfaces that make them feel effortless.",
  aboutParagraphs: [
    "I'm Shivam — a full-stack developer who cares as much about the query plan as the pixel. My work spans production Express/MongoDB backends with JWT auth, rate limiting and realtime sockets, and React front-ends engineered for speed.",
    "I optimise for outcomes that hold up under inspection: 70% faster queries via indexing and aggregation, 60% less bandwidth through smart caching, 98 Lighthouse. Discipline over hype — I show up and ship, every day.",
    "This site is the proof: a Next.js front end, a Mongo-backed API, a self-built analytics pipeline and an admin dashboard — all designed and engineered end-to-end.",
  ],
  now: {
    building: "An observable, self-instrumenting portfolio engine",
    learning: "Advanced Next.js, Docker & distributed systems",
    status: "Available for full-time & freelance",
  },
  location: "India",
  email: "shivambhadoriya1605@gmail.com",
};

/* ----------------------------- run ----------------------------- */
const Project = mongoose.models.Project || mongoose.model("Project", new mongoose.Schema({}, { strict: false, timestamps: true }));
const Setting = mongoose.models.Setting || mongoose.model("Setting", new mongoose.Schema({}, { strict: false, timestamps: true }));

async function run() {
  console.log("→ connecting to MongoDB…");
  await mongoose.connect(URI, { serverSelectionTimeoutMS: 12000 });
  console.log("→ connected");

  await Project.deleteMany({});
  await Project.insertMany(projects.map((p, i) => ({ ...p, imageUrl: p.imageUrl || "", order: i, published: true })));
  console.log(`→ seeded ${projects.length} projects`);

  await Setting.findOneAndUpdate({ key: "site" }, { key: "site", value: settings }, { upsert: true });
  console.log("→ seeded site content");

  await mongoose.disconnect();
  console.log("✔ seed complete\n");
}

run().catch((e) => { console.error("\n✖ seed failed:", e.message, "\n"); process.exit(1); });
