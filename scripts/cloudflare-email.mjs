/**
 * Sets up contact@shivambhadoriya.com on Cloudflare Email Routing.
 *
 * Why not Hostinger: mailboxes there are a paid add-on. Registering the domain
 * does not include one, so the panel can show an address as created while
 * nothing is actually delivered — which is exactly what happened. Cloudflare
 * Email Routing forwards to an existing inbox for free, and it replaces the
 * Hostinger MX records when enabled.
 *
 * Needs a token with MORE than DNS:Edit. When you create the replacement token,
 * give it all three:
 *   Zone    → DNS                      → Edit
 *   Zone    → Email Routing Rules      → Edit
 *   Account → Email Routing Addresses  → Edit
 *
 *   node scripts/cloudflare-email.mjs <your-gmail@gmail.com>          # dry run
 *   node scripts/cloudflare-email.mjs <your-gmail@gmail.com> --apply
 *
 * Cloudflare emails the destination a verification link. That click is yours —
 * forwarding does not start until it is done, and nothing else can do it.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const ZONE_ID = "fdf4ecc32a204cf35bb09059845ef67c";
const ACCOUNT_ID = "ce14861c0b8b36089a498d316a8faf1d";
const ZONE_NAME = "shivambhadoriya.com";
const LOCAL_PART = "contact";

const APPLY = process.argv.includes("--apply");
const DEST = process.argv.slice(2).find((a) => a.includes("@"));

if (!DEST) {
  console.error("\nUsage: node scripts/cloudflare-email.mjs <destination-inbox@example.com> [--apply]\n");
  process.exit(1);
}

async function token() {
  if (process.env.CLOUDFLARE_API_TOKEN) return process.env.CLOUDFLARE_API_TOKEN.trim();
  for (const f of [".env.local", ".env"]) {
    try {
      const txt = await readFile(path.join(ROOT, f), "utf8");
      const m = /^\s*CLOUDFLARE_API_TOKEN\s*=\s*(.+)$/m.exec(txt);
      if (m) return m[1].trim().replace(/^["']|["']$/g, "");
    } catch {}
  }
  console.error("\nNo CLOUDFLARE_API_TOKEN in .env.local.\n");
  process.exit(1);
}

let TOKEN;
async function cf(pathname, init = {}) {
  const res = await fetch(`https://api.cloudflare.com/client/v4${pathname}`, {
    ...init,
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json", ...(init.headers || {}) },
  });
  const json = await res.json().catch(() => ({}));
  return { ok: Boolean(json.success), status: res.status, result: json.result, errors: json.errors };
}

function needsPermission(r, what) {
  if (r.status === 403 || r.errors?.some((e) => e.code === 10000)) {
    console.error(`\n✖ The token cannot ${what}.`);
    console.error("  Create a token with these three permissions and put it in .env.local:");
    console.error("    Zone    → DNS                     → Edit");
    console.error("    Zone    → Email Routing Rules     → Edit");
    console.error("    Account → Email Routing Addresses → Edit\n");
    process.exit(1);
  }
}

async function main() {
  TOKEN = await token();
  const address = `${LOCAL_PART}@${ZONE_NAME}`;

  const status = await cf(`/zones/${ZONE_ID}/email/routing`);
  needsPermission(status, "read Email Routing");
  console.log(`Email Routing: enabled=${status.result?.enabled} status=${status.result?.status}`);

  const dests = await cf(`/accounts/${ACCOUNT_ID}/email/routing/addresses`);
  needsPermission(dests, "read destination addresses");
  const existing = (dests.result || []).find((d) => d.email.toLowerCase() === DEST.toLowerCase());
  console.log(
    `Destination ${DEST}: ${existing ? (existing.verified ? "already verified" : "added but NOT yet verified") : "not added"}`,
  );

  const rules = await cf(`/zones/${ZONE_ID}/email/routing/rules`);
  const hasRule = (rules.result || []).some((r) =>
    r.matchers?.some((m) => m.type === "literal" && m.value?.toLowerCase() === address.toLowerCase()),
  );
  console.log(`Rule for ${address}: ${hasRule ? "exists" : "missing"}`);

  console.log("\nPlan:");
  if (!status.result?.enabled) console.log("  ENABLE  Email Routing (this replaces the Hostinger MX records)");
  if (!existing) console.log(`  ADD     destination ${DEST} (Cloudflare emails it a verification link)`);
  if (!hasRule) console.log(`  ROUTE   ${address} → ${DEST}`);
  if (status.result?.enabled && existing?.verified && hasRule) console.log("  nothing to do — already working.");

  if (!APPLY) {
    console.log("\nDry run. Re-run with --apply.\n");
    return;
  }

  console.log("\nApplying…");

  if (!existing) {
    const add = await cf(`/accounts/${ACCOUNT_ID}/email/routing/addresses`, {
      method: "POST",
      body: JSON.stringify({ email: DEST }),
    });
    needsPermission(add, "add a destination address");
    console.log(add.ok ? `  added destination ${DEST}` : `  destination: ${JSON.stringify(add.errors)?.slice(0, 160)}`);
  }

  if (!status.result?.enabled) {
    const en = await cf(`/zones/${ZONE_ID}/email/routing/enable`, { method: "POST", body: "{}" });
    console.log(en.ok ? "  enabled Email Routing (MX records rewritten to Cloudflare)" : `  enable: ${JSON.stringify(en.errors)?.slice(0, 160)}`);
  }

  if (!hasRule) {
    const rule = await cf(`/zones/${ZONE_ID}/email/routing/rules`, {
      method: "POST",
      body: JSON.stringify({
        name: `${address} → ${DEST}`,
        enabled: true,
        matchers: [{ type: "literal", field: "to", value: address }],
        actions: [{ type: "forward", value: [DEST] }],
      }),
    });
    console.log(rule.ok ? `  routed ${address} → ${DEST}` : `  rule: ${JSON.stringify(rule.errors)?.slice(0, 160)}`);
  }

  const after = await cf(`/accounts/${ACCOUNT_ID}/email/routing/addresses`);
  const d = (after.result || []).find((x) => x.email.toLowerCase() === DEST.toLowerCase());
  console.log("");
  if (d && !d.verified) {
    console.log(`  ⚠ ${DEST} is NOT verified yet.`);
    console.log("    Cloudflare has emailed it a verification link — open it and click.");
    console.log("    Mail to contact@ will not forward until you do.");
  } else if (d?.verified) {
    console.log(`  ${DEST} is verified. Send a test to ${address} — it should arrive.`);
  }
}

main().catch((e) => {
  console.error("\nFailed:", e.message, "\n");
  process.exit(1);
});
