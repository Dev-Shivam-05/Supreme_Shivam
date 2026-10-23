/**
 * Network-owner evidence — the server half (R25, R26, D3).
 *
 * Called inside `after()` by the event and grant routes, once per new session
 * that holds the `organization` purpose. Reduces the connecting address to its
 * /24 or /48 network (network-core.ts), asks the responsible RIR's public RDAP
 * service who holds that network, and records the answer as an `inferred`
 * `possible_network_association` — a candidate, never an employer.
 *
 * Collector controls (README "public company collector"): only the IANA
 * bootstrap and the five RIR hosts are contacted, redirects are not followed,
 * every fetch has a 3 s timeout and a byte cap, RDAP calls are rate limited
 * per instance, and results are cached for 30 days keyed by an HMAC of the
 * network so the cache never holds an address range in the clear.
 */
import { dbConnect } from "@/lib/db";
import { ERASING_ACTIONS } from "./engine.ts";
import { networkKey, scopeHash } from "./cookies.ts";
import { VIEvidence, VIGrant, VIOrgCache, VITombstone } from "./models.ts";
import { RETENTION } from "./policy.ts";
import {
  classifyNetwork,
  describeNetwork,
  isAllowedRdapUrl,
  networkPrefix,
  parseRdap,
  pickRdapBase,
  rdapFallbackUrl,
  rdapQueryUrl,
  type NetworkKind,
} from "./network-core.ts";

export type NetworkEvidenceInput = {
  siteId: string;
  epochId: string;
  sessionId: string;
  grantId: string;
  /** The connecting address. Used to derive a /24 or /48 prefix; never stored, never sent. */
  ip: string | null;
  now: Date;
  grantExpiresAt: Date;
};

type UnknownReason = "no_address" | "private_address" | "invalid_address" | "no_registry" | "lookup_failed" | "rate_limited";

type OwnerFacts = {
  owner: string;
  kind: NetworkKind;
  matchedRule: string;
  registry: string;
  handle: string | null;
  networkName: string | null;
  country: string | null;
  fetchedAt: Date;
  fromCache: boolean;
};

const FETCH_TIMEOUT_MS = 3000;
const RDAP_MAX_BYTES = 64 * 1024;
// The IANA files are a few KB today; the cap only has to stop a runaway response.
const BOOTSTRAP_MAX_BYTES = 256 * 1024;
const BOOTSTRAP_TTL_MS = 24 * 3_600_000;
const RATE_LIMIT = 30;
const RATE_WINDOW_MS = 60_000;
const USER_AGENT = "shivambhadoriya.com-vi/1 (+https://shivambhadoriya.com/privacy-policy)";
const IANA = { 4: "https://data.iana.org/rdap/ipv4.json", 6: "https://data.iana.org/rdap/ipv6.json" } as const;

class FetchFailure extends Error {}

/** Reads a body up to `max` bytes and cancels the stream past that, so a hostile server cannot exhaust memory. */
async function boundedText(res: Response, max: number): Promise<string> {
  const declared = Number(res.headers.get("content-length"));
  if (declared > max) throw new FetchFailure("too_large");
  if (!res.body) return "";
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > max) {
      await reader.cancel().catch(() => {});
      throw new FetchFailure("too_large");
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString("utf8");
}

/** One bounded GET. A 3xx is a failure: following a redirect would leave the allowlist. */
async function boundedGet(url: string, max: number): Promise<{ status: number; json: unknown }> {
  const res = await fetch(url, {
    redirect: "manual",
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    headers: { accept: "application/rdap+json, application/json", "user-agent": USER_AGENT },
  });
  if (res.status !== 200) {
    await res.body?.cancel().catch(() => {});
    return { status: res.status, json: null };
  }
  const text = await boundedText(res, max);
  try {
    return { status: 200, json: JSON.parse(text) };
  } catch {
    return { status: 200, json: null };
  }
}

/* Bootstrap: module memory, 24 h, last good copy on failure. */
const bootstrap: Record<4 | 6, { data: unknown; fetchedAt: number } | null> = { 4: null, 6: null };

async function getBootstrap(family: 4 | 6): Promise<unknown> {
  const cached = bootstrap[family];
  if (cached && Date.now() - cached.fetchedAt < BOOTSTRAP_TTL_MS) return cached.data;
  try {
    const { status, json } = await boundedGet(IANA[family], BOOTSTRAP_MAX_BYTES);
    if (status === 200 && Array.isArray((json as { services?: unknown })?.services)) {
      bootstrap[family] = { data: json, fetchedAt: Date.now() };
      return json;
    }
  } catch {
    // Fall through to the stale copy.
  }
  return cached?.data ?? null;
}

/* Rolling-minute limiter. Per instance: serverless instances do not share it, which only makes it stricter per host. */
const recentCalls: number[] = [];

function takeRateToken(): boolean {
  const now = Date.now();
  while (recentCalls.length && now - recentCalls[0] >= RATE_WINDOW_MS) recentCalls.shift();
  if (recentCalls.length >= RATE_LIMIT) return false;
  recentCalls.push(now);
  return true;
}

async function rdapGet(url: string): Promise<{ status: number; json: unknown } | "rate_limited"> {
  // Checked again here, not only in pickRdapBase: nothing reaches fetch unless it is an RIR URL.
  if (!isAllowedRdapUrl(url)) throw new FetchFailure("not_allowlisted");
  if (!takeRateToken()) return "rate_limited";
  return boundedGet(url, RDAP_MAX_BYTES);
}

async function lookupOwner(
  network: string,
  length: 24 | 48,
  family: 4 | 6,
): Promise<OwnerFacts | { reason: UnknownReason }> {
  const cacheId = networkKey(`${network}/${length}`);
  const hit = await VIOrgCache.findOne({ _id: cacheId, expiresAt: { $gt: new Date() } }).lean<Record<string, unknown>>();
  if (hit && typeof hit.owner === "string") {
    return {
      owner: hit.owner,
      kind: (hit.kind as NetworkKind) ?? "unknown",
      matchedRule: (hit.matchedRule as string) ?? "unknown:no_rule",
      registry: (hit.registry as string) ?? "",
      handle: (hit.handle as string) ?? null,
      networkName: (hit.networkName as string) ?? null,
      country: (hit.country as string) ?? null,
      fetchedAt: hit.fetchedAt as Date,
      fromCache: true,
    };
  }

  const base = pickRdapBase(await getBootstrap(family), network, family);
  if (!base) return { reason: "no_registry" };

  let res = await rdapGet(rdapQueryUrl(base, network, length));
  // Some registries reject CIDR queries; the network address alone still names the same block.
  if (res !== "rate_limited" && [400, 404, 422].includes(res.status)) res = await rdapGet(rdapFallbackUrl(base, network));
  if (res === "rate_limited") return { reason: "rate_limited" };
  if (res.status !== 200 || !res.json) return { reason: "lookup_failed" };

  const facts = parseRdap(res.json);
  if (!facts.owner) return { reason: "lookup_failed" };
  const { kind, matchedRule } = classifyNetwork(facts.owner, facts.networkName, facts.remarks);
  const registry = new URL(base).hostname;
  const fetchedAt = new Date();

  // Company data only — the remarks were used to classify and are not kept.
  await VIOrgCache.updateOne(
    { _id: cacheId },
    {
      $set: {
        owner: facts.owner,
        kind,
        registry,
        handle: facts.handle,
        networkName: facts.networkName,
        country: facts.country,
        matchedRule,
        fetchedAt,
        expiresAt: new Date(fetchedAt.getTime() + RETENTION.orgCacheMs),
      },
    },
    { upsert: true },
  );
  return {
    owner: facts.owner,
    kind,
    matchedRule,
    registry,
    handle: facts.handle,
    networkName: facts.networkName,
    country: facts.country,
    fetchedAt,
    fromCache: false,
  };
}

/** R08: permission is checked at processing time, not trusted from when the request arrived. */
async function stillPermitted(input: NetworkEvidenceInput): Promise<boolean> {
  const now = new Date();
  const grant = await VIGrant.findOne({
    _id: input.grantId,
    siteId: input.siteId,
    epochId: input.epochId,
    revokedAt: null,
    validUntil: { $gt: now },
    purposes: "organization",
  }).lean();
  if (!grant) return false;
  const tombstoned = await VITombstone.exists({
    siteId: input.siteId,
    scopeHmac: scopeHash(input.siteId, input.epochId),
    action: { $in: ERASING_ACTIONS },
  });
  return tombstoned === null;
}

const NOTES = [
  "RDAP names who holds the address block, not who is using the connection.",
  "Shared networks (offices, carriers, VPNs, cloud desktops) carry many unrelated people.",
  "Only the /24 or /48 network was queried; the exact address was neither sent nor stored.",
];

const UNKNOWN_TEXT: Record<UnknownReason, string> = {
  no_address: "No connecting address was available.",
  private_address: "The connection came from a private or reserved address, which no registry describes.",
  invalid_address: "The connecting address could not be parsed.",
  no_registry: "No allowlisted registry covers this network.",
  lookup_failed: "The registry lookup failed or returned no owner.",
  rate_limited: "The registry lookup was skipped: the per-minute lookup limit was reached.",
};

/** Records `network_owner` evidence for one session. Never throws. */
export async function recordNetworkEvidence(input: NetworkEvidenceInput): Promise<void> {
  try {
    if (!(await dbConnect())) return;
    if (!(await stillPermitted(input))) return;
    const exists = await VIEvidence.exists({
      siteId: input.siteId,
      entityScope: "session",
      entityId: input.sessionId,
      fieldId: "network_owner",
    });
    if (exists) return;

    let result: OwnerFacts | { reason: UnknownReason };
    if (!input.ip) result = { reason: "no_address" };
    else {
      const prefix = networkPrefix(input.ip);
      if ("reason" in prefix) result = { reason: prefix.reason === "invalid" ? "invalid_address" : "private_address" };
      else {
        try {
          result = await lookupOwner(prefix.network, prefix.length, prefix.family);
        } catch {
          result = { reason: "lookup_failed" };
        }
      }
    }

    // The lookup can take seconds; the visitor may have withdrawn meanwhile.
    if (!(await stillPermitted(input))) return;

    const now = input.now;
    const expiresAt = new Date(Math.min(now.getTime() + RETENTION.orgCacheMs, input.grantExpiresAt.getTime()));
    const common = {
      siteId: input.siteId,
      epochId: input.epochId,
      entityScope: "session",
      entityId: input.sessionId,
      fieldId: "network_owner",
      sourceId: "rdap",
      sourceKind: "registry",
      observedAt: now,
      collectedAt: now,
      validFrom: now,
      verificationScope: null,
      confidence: { probability: null, description: "Registry data about the network owner; not independently evaluated" },
      authorizationId: input.grantId,
      contradictions: [],
      unknowns: ["visitor_identity", "employment", "representation_authority"],
      expiresAt,
    };

    if ("reason" in result) {
      await VIEvidence.create({
        ...common,
        value: null,
        sourceRecordId: null,
        evidenceStatus: "unknown",
        unknownReason: result.reason,
        uncertainty: { notes: NOTES },
        explanation: UNKNOWN_TEXT[result.reason],
      });
      return;
    }

    await VIEvidence.create({
      ...common,
      value: {
        candidateOrganization: result.owner,
        relationship: "possible_network_association",
        networkKind: result.kind,
        networkName: result.networkName,
        registry: result.registry,
        country: result.country,
      },
      sourceRecordId: result.handle,
      evidenceStatus: "inferred",
      unknownReason: null,
      uncertainty: {
        notes: result.fromCache
          ? [...NOTES, `Served from the 30-day registry cache, fetched ${result.fetchedAt.toISOString()}.`]
          : NOTES,
      },
      explanation: `${describeNetwork(result.kind, result.owner)} Matched ${result.matchedRule}.`,
    });
  } catch (err) {
    // Code only: the message could carry a registry URL, which embeds the network.
    console.error("[vi] network evidence skipped:", (err as { name?: string })?.name ?? "error");
  }
}
