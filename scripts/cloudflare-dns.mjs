/**
 * Points shivambhadoriya.com at Vercel, via the Cloudflare API.
 *
 * Uses a scoped API token — Zone:DNS:Edit on this one zone — which you create,
 * paste into .env.local (gitignored, never into chat), and revoke when the
 * migration is done. That is least privilege: the token cannot touch billing,
 * other domains, your account settings or your password, and it is one click to
 * kill. The token is never printed by this script.
 *
 *   node scripts/cloudflare-dns.mjs            # dry run — shows what it WOULD do
 *   node scripts/cloudflare-dns.mjs --apply    # makes the changes
 *
 * What it enforces:
 *   A      @      76.76.21.21           proxy OFF
 *   CNAME  www    cname.vercel-dns.com  proxy OFF
 *
 * Proxy must be OFF (grey cloud). Cloudflare's proxy terminates TLS itself,
 * which collides with the certificate Vercel issues for the same hostname and
 * produces either a redirect loop or a certificate error.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const ZONE_NAME = "shivambhadoriya.com";
const APPLY = process.argv.includes("--apply");

/** The records we want to exist, exactly. Anything conflicting is removed. */
const DESIRED = [
  { type: "A", name: ZONE_NAME, content: "76.76.21.21", proxied: false },
  { type: "CNAME", name: `www.${ZONE_NAME}`, content: "cname.vercel-dns.com", proxied: false },
];

/** Records at these names that are not in DESIRED get deleted. MX/TXT are never touched. */
const MANAGED_NAMES = new Set([ZONE_NAME, `www.${ZONE_NAME}`]);
const MANAGED_TYPES = new Set(["A", "AAAA", "CNAME"]);

async function token() {
  const fromEnv = process.env.CLOUDFLARE_API_TOKEN;
  if (fromEnv) return fromEnv.trim();
  for (const f of [".env.local", ".env"]) {
    try {
      const txt = await readFile(path.join(ROOT, f), "utf8");
      const m = /^\s*CLOUDFLARE_API_TOKEN\s*=\s*(.+)$/m.exec(txt);
      if (m) return m[1].trim().replace(/^["']|["']$/g, "");
    } catch {}
  }
  console.error(
    "\nNo CLOUDFLARE_API_TOKEN found.\n" +
      "Create a scoped token, then put it in .env.local as:\n" +
      "  CLOUDFLARE_API_TOKEN=...\n" +
      "Instructions are in docs/DOMAIN-SETUP.md step 4.\n",
  );
  process.exit(1);
}

let TOKEN;
async function cf(pathname, init = {}) {
  const res = await fetch(`https://api.cloudflare.com/client/v4${pathname}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  const json = await res.json().catch(() => ({}));
  if (!json.success) {
    const msg = (json.errors || []).map((e) => `${e.code}: ${e.message}`).join("; ") || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return json.result;
}

const fmt = (r) =>
  `${r.type.padEnd(5)} ${String(r.name).padEnd(28)} → ${String(r.content).padEnd(24)} proxy=${r.proxied ? "ON" : "off"}`;

async function main() {
  TOKEN = await token();

  /* Verify the token before doing anything with it. */
  const verify = await cf("/user/tokens/verify").catch((e) => {
    console.error(`\nToken rejected: ${e.message}\nCheck it was copied whole, and that it has not expired.\n`);
    process.exit(1);
  });
  console.log(`Token OK (${verify.status}).`);

  const zones = await cf(`/zones?name=${ZONE_NAME}`);
  if (!zones.length) {
    console.error(`\nZone ${ZONE_NAME} not visible to this token. The token must include this zone.\n`);
    process.exit(1);
  }
  const zone = zones[0];
  console.log(`Zone ${zone.name} · status=${zone.status} · plan=${zone.plan?.name ?? "?"}\n`);

  const existing = await cf(`/zones/${zone.id}/dns_records?per_page=200`);
  console.log("Current records:");
  for (const r of existing) console.log("  " + fmt(r));

  /* Work out the plan. */
  const toDelete = existing.filter(
    (r) =>
      MANAGED_NAMES.has(r.name) &&
      MANAGED_TYPES.has(r.type) &&
      !DESIRED.some((d) => d.type === r.type && d.name === r.name && d.content === r.content),
  );
  const toCreate = DESIRED.filter(
    (d) => !existing.some((r) => r.type === d.type && r.name === d.name && r.content === d.content),
  );
  const toUnproxy = existing.filter(
    (r) =>
      r.proxied &&
      DESIRED.some((d) => d.type === r.type && d.name === r.name && d.content === r.content),
  );

  console.log("\nPlan:");
  if (!toDelete.length && !toCreate.length && !toUnproxy.length) {
    console.log("  nothing to change — DNS already points at Vercel.");
  }
  for (const r of toDelete) console.log("  DELETE  " + fmt(r));
  for (const r of toUnproxy) console.log("  UNPROXY " + fmt(r));
  for (const d of toCreate) console.log("  CREATE  " + fmt(d));

  console.log("\nMX and TXT records are never touched — that is what keeps email working.");

  if (!APPLY) {
    console.log("\nDry run. Re-run with --apply to make these changes.\n");
    return;
  }

  console.log("\nApplying…");
  for (const r of toDelete) {
    await cf(`/zones/${zone.id}/dns_records/${r.id}`, { method: "DELETE" });
    console.log("  deleted  " + fmt(r));
  }
  for (const r of toUnproxy) {
    await cf(`/zones/${zone.id}/dns_records/${r.id}`, {
      method: "PATCH",
      body: JSON.stringify({ proxied: false }),
    });
    console.log("  unproxied " + fmt(r));
  }
  for (const d of toCreate) {
    await cf(`/zones/${zone.id}/dns_records`, {
      method: "POST",
      body: JSON.stringify({ ...d, ttl: 1, comment: "Vercel — set by scripts/cloudflare-dns.mjs" }),
    });
    console.log("  created  " + fmt(d));
  }

  const after = await cf(`/zones/${zone.id}/dns_records?per_page=200`);
  console.log("\nRecords now:");
  for (const r of after) console.log("  " + fmt(r));
  console.log("\nDNS is set. Cloudflare propagates in seconds; Vercel then issues the certificate.");
  console.log("Next: node scripts/verify-domain.mjs\n");
}

main().catch((e) => {
  console.error("\nFailed:", e.message, "\n");
  process.exit(1);
});
