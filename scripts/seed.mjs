#!/usr/bin/env node
/**
 * One-shot database seed.
 *     npm run seed
 *
 * Loads the projects and the editable site content into MongoDB. Safe to
 * re-run: it replaces the projects collection and upserts the settings doc.
 *
 * It imports `src/lib/site.ts` directly rather than keeping its own copy of the
 * data. That matters — this script used to carry a duplicate of both, and the
 * duplicate went stale: it had no AI-PULSE, it left the Contribution Art Engine
 * un-archived, and its site content still said "Full-Stack Engineer" and
 * "India". Seeding wrote all of that over the live site, because the app reads
 * content from the database in preference to the defaults. One source of truth
 * is the fix.
 *
 * Node strips the TypeScript types on import (Node 22.6+), so there is no build
 * step and no extra dependency.
 */
import mongoose from "mongoose";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

/* -------- load .env.local without a dotenv dependency -------- */
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
  console.error("\n✖ MONGODB_URI is not set. Add it to .env.local, then run `npm run seed` again.\n");
  process.exit(1);
}

/* -------- the single source of truth -------- */
const { projects, contentDefaults, site } = await import(
  new URL("../src/lib/site.ts", import.meta.url).href
);

const Project =
  mongoose.models.Project ||
  mongoose.model("Project", new mongoose.Schema({}, { strict: false, timestamps: true }));
const Setting =
  mongoose.models.Setting ||
  mongoose.model("Setting", new mongoose.Schema({}, { strict: false, timestamps: true }));

async function run() {
  console.log("→ connecting to MongoDB…");
  await mongoose.connect(URI, { serverSelectionTimeoutMS: 15000 });
  console.log(`→ connected to database "${mongoose.connection.db.databaseName}"`);

  await Project.deleteMany({});
  await Project.insertMany(
    projects.map((p, i) => ({
      ...p,
      imageUrl: p.imageUrl || "",
      repo: p.repo || "",
      live: p.live || "",
      flagship: Boolean(p.flagship),
      archived: Boolean(p.archived),
      order: i,
      published: true,
    })),
  );
  console.log(`→ seeded ${projects.length} projects`);
  for (const p of projects) {
    console.log(`     ${p.index} ${p.slug}${p.flagship ? " · flagship" : ""}${p.archived ? " · archived" : ""}`);
  }

  await Setting.findOneAndUpdate(
    { key: "site" },
    { key: "site", value: contentDefaults },
    { upsert: true },
  );
  console.log(`→ seeded site content (role: ${site.role}, location: ${site.location})`);

  await mongoose.disconnect();
  console.log("✔ seed complete\n");
}

run().catch((e) => {
  console.error("\n✖ seed failed:", e.message, "\n");
  process.exit(1);
});
