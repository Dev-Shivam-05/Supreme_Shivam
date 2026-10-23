/**
 * Network-owner lookup — the pure half (R25, R26, D3).
 *
 * Answers "whose network is this connection on?" from public RDAP registry
 * data, located through the IANA bootstrap (RFC 9224). No vendor, account or
 * key. Everything here is a pure function so `node --test` can pin the
 * security-relevant behaviour: the visitor's exact address is reduced to a /24
 * or /48 network inside `networkPrefix` and never leaves it; only the five RIR
 * RDAP hosts are ever contacted; only an allowlisted handful of fields is kept.
 *
 * A network owner is a CANDIDATE, never an employer (README "A company-network
 * match is not employment or representation").
 *
 * No Node, Next, mongoose or `@/` imports — the server half lives in network.ts.
 */

export type NetworkPrefix = { network: string; length: 24 | 48; family: 4 | 6 };
export type PrefixRejection = { reason: "invalid" | "private_address" };

/* ------------------------------------------------------------------ */
/* Address parsing                                                     */
/* ------------------------------------------------------------------ */

/** Strict dotted-quad. Leading zeros are rejected: some parsers read them as octal. */
function parseV4(s: string): number[] | null {
  const parts = s.split(".");
  if (parts.length !== 4) return null;
  const out: number[] = [];
  for (const p of parts) {
    if (!/^(0|[1-9][0-9]{0,2})$/.test(p)) return null;
    const n = Number(p);
    if (n > 255) return null;
    out.push(n);
  }
  return out;
}

/** Eight 16-bit groups, with `::` expanded and a trailing dotted quad folded into the last two. */
function parseV6(s: string): number[] | null {
  if (!s.includes(":") || s.length > 45) return null;
  let text = s.toLowerCase();
  let tail: number[] = [];
  const lastColon = text.lastIndexOf(":");
  if (text.slice(lastColon + 1).includes(".")) {
    const v4 = parseV4(text.slice(lastColon + 1));
    if (!v4) return null;
    tail = [(v4[0] << 8) | v4[1], (v4[2] << 8) | v4[3]];
    // Keep the colon so "::1.2.3.4" still ends in "::" after the cut.
    text = text.slice(0, lastColon + 1);
    if (text.endsWith(":") && !text.endsWith("::")) text = text.slice(0, -1);
  }
  const halves = text.split("::");
  if (halves.length > 2) return null;
  const group = (h: string) => (h === "" ? [] : h.split(":"));
  const head = group(halves[0]);
  const rest = halves.length === 2 ? group(halves[1]) : [];
  const parseGroup = (g: string) => (/^[0-9a-f]{1,4}$/.test(g) ? parseInt(g, 16) : NaN);
  const left = head.map(parseGroup);
  const right = [...rest.map(parseGroup), ...tail];
  if ([...left, ...right].some(Number.isNaN)) return null;
  const missing = 8 - left.length - right.length;
  if (halves.length === 2) {
    if (missing < 1) return null;
    return [...left, ...new Array<number>(missing).fill(0), ...right];
  }
  return missing === 0 ? [...left, ...right] : null;
}

/** RFC 5952 text form: lower case, no leading zeros, the longest zero run (≥2) as `::`. */
function formatV6(groups: number[]): string {
  let bestStart = -1;
  let bestLen = 0;
  for (let i = 0; i < 8; ) {
    if (groups[i] !== 0) {
      i++;
      continue;
    }
    let j = i;
    while (j < 8 && groups[j] === 0) j++;
    if (j - i > bestLen) {
      bestStart = i;
      bestLen = j - i;
    }
    i = j;
  }
  const hex = groups.map((g) => g.toString(16));
  if (bestLen < 2) return hex.join(":");
  return `${hex.slice(0, bestStart).join(":")}::${hex.slice(bestStart + bestLen).join(":")}`;
}

/** True when the first `len` bits of `a` and `b` agree. Works on octets (v4) or 16-bit groups (v6). */
function prefixMatch(a: number[], b: number[], len: number, width: 8 | 16): boolean {
  for (let i = 0; len > 0; i++, len -= width) {
    const bits = Math.min(width, len);
    const shift = width - bits;
    if (a[i] >> shift !== b[i] >> shift) return false;
  }
  return true;
}

/** Reserved, private, shared, documentation, benchmarking, multicast and future-use space. */
const V4_RESERVED: [number[], number][] = [
  [[0, 0, 0, 0], 8],
  [[10, 0, 0, 0], 8],
  [[100, 64, 0, 0], 10],
  [[127, 0, 0, 0], 8],
  [[169, 254, 0, 0], 16],
  [[172, 16, 0, 0], 12],
  [[192, 0, 0, 0], 24],
  [[192, 0, 2, 0], 24],
  [[192, 168, 0, 0], 16],
  [[198, 18, 0, 0], 15],
  [[198, 51, 100, 0], 24],
  [[203, 0, 113, 0], 24],
  [[224, 0, 0, 0], 4],
  [[240, 0, 0, 0], 4],
];

const V6_RESERVED: [number[], number][] = [
  [[0, 0, 0, 0, 0, 0, 0, 0], 128], // unspecified
  [[0, 0, 0, 0, 0, 0, 0, 1], 128], // loopback
  [[0xfc00, 0, 0, 0, 0, 0, 0, 0], 7], // unique local
  [[0xfe80, 0, 0, 0, 0, 0, 0, 0], 10], // link local
  [[0xff00, 0, 0, 0, 0, 0, 0, 0], 8], // multicast
  [[0x2001, 0x0db8, 0, 0, 0, 0, 0, 0], 32], // documentation
];

function v4Prefix(o: number[]): NetworkPrefix | PrefixRejection {
  if (V4_RESERVED.some(([net, len]) => prefixMatch(o, net, len, 8))) return { reason: "private_address" };
  return { network: `${o[0]}.${o[1]}.${o[2]}.0`, length: 24, family: 4 };
}

/**
 * The only place the visitor's exact address is read. Returns the /24 (IPv4)
 * or /48 (IPv6) network that contains it; everything downstream — the cache
 * key, the RDAP query — uses that network and nothing finer.
 */
export function networkPrefix(ip: string): NetworkPrefix | PrefixRejection {
  if (typeof ip !== "string") return { reason: "invalid" };
  const s = ip.trim();
  if (!s) return { reason: "invalid" };
  if (!s.includes(":")) {
    const o = parseV4(s);
    return o ? v4Prefix(o) : { reason: "invalid" };
  }
  const g = parseV6(s);
  if (!g) return { reason: "invalid" };
  // IPv4-mapped (::ffff:a.b.c.d): the connection is really IPv4, so it gets the IPv4 rules.
  if (g.slice(0, 5).every((x) => x === 0) && g[5] === 0xffff) {
    return v4Prefix([g[6] >> 8, g[6] & 0xff, g[7] >> 8, g[7] & 0xff]);
  }
  if (V6_RESERVED.some(([net, len]) => prefixMatch(g, net, len, 16))) return { reason: "private_address" };
  return { network: formatV6([g[0], g[1], g[2], 0, 0, 0, 0, 0]), length: 48, family: 6 };
}

/* ------------------------------------------------------------------ */
/* IANA RDAP bootstrap (RFC 9224)                                      */
/* ------------------------------------------------------------------ */

/**
 * The five Regional Internet Registries. A bootstrap file is fetched over the
 * network, so it is input like any other: a URL it names is followed only if
 * its host is on this list (SSRF protection, R26).
 */
export const ALLOWED_RDAP_HOSTS = [
  "rdap.arin.net",
  "rdap.db.ripe.net",
  "rdap.apnic.net",
  "rdap.lacnic.net",
  "rdap.afrinic.net",
] as const;

/** https, an allowlisted host, default port, no credentials. Used before every fetch, not just here. */
export function isAllowedRdapUrl(raw: string): boolean {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return false;
  }
  return (
    u.protocol === "https:" &&
    (ALLOWED_RDAP_HOSTS as readonly string[]).includes(u.hostname.toLowerCase()) &&
    u.port === "" &&
    u.username === "" &&
    u.password === ""
  );
}

function parseCidr(cidr: unknown, family: 4 | 6): { addr: number[]; len: number } | null {
  if (typeof cidr !== "string") return null;
  const [addr, lenText, extra] = cidr.split("/");
  if (extra !== undefined || !/^[0-9]{1,3}$/.test(lenText ?? "")) return null;
  const len = Number(lenText);
  const parsed = family === 4 ? parseV4(addr) : parseV6(addr);
  if (!parsed || len > (family === 4 ? 32 : 128)) return null;
  return { addr: parsed, len };
}

/**
 * Longest-prefix match of `network` against a bootstrap file, then the first
 * base URL of that service that passes `isAllowedRdapUrl`. If the most
 * specific service has no allowlisted URL the answer is null — falling back to
 * a less specific service would ask the wrong registry.
 */
export function pickRdapBase(bootstrap: unknown, network: string, family: 4 | 6): string | null {
  const services = (bootstrap as { services?: unknown })?.services;
  if (!Array.isArray(services)) return null;
  const target = family === 4 ? parseV4(network) : parseV6(network);
  if (!target) return null;
  const width = family === 4 ? 8 : 16;
  const ownLen = family === 4 ? 24 : 48;

  let best: unknown[] | null = null;
  let bestLen = -1;
  for (const service of services) {
    if (!Array.isArray(service) || !Array.isArray(service[0]) || !Array.isArray(service[1])) continue;
    for (const raw of service[0]) {
      const c = parseCidr(raw, family);
      // A block narrower than our /24 or /48 cannot contain the whole network.
      if (!c || c.len > ownLen || c.len <= bestLen) continue;
      if (prefixMatch(target, c.addr, c.len, width)) {
        best = service[1];
        bestLen = c.len;
      }
    }
  }
  if (!best) return null;
  for (const url of best) {
    if (typeof url === "string" && isAllowedRdapUrl(url)) return url.endsWith("/") ? url : `${url}/`;
  }
  return null;
}

const withSlash = (base: string) => (base.endsWith("/") ? base : `${base}/`);

/** RFC 9082 IP network query by CIDR. Carries the network address, never the visitor's. */
export function rdapQueryUrl(base: string, network: string, length: 24 | 48): string {
  return `${withSlash(base)}ip/${network}/${length}`;
}

/**
 * Plain-address query, for a registry that rejects CIDR lookups. The address
 * is the network address (x.y.z.0 or the /48 base) — still never the visitor's.
 */
export function rdapFallbackUrl(base: string, network: string): string {
  return `${withSlash(base)}ip/${network}`;
}

/* ------------------------------------------------------------------ */
/* RDAP response — field allowlist                                     */
/* ------------------------------------------------------------------ */

export type RdapFacts = {
  owner: string | null;
  networkName: string | null;
  handle: string | null;
  country: string | null;
  remarks: string;
};

const MAX_FIELD = 200;

/**
 * Registry text is shown in the admin. Control characters and bidi overrides
 * are dropped so a registrant name cannot rewrite the line it is shown on.
 * Done by code point rather than a regex to keep the intent readable.
 */
function clean(value: unknown): string | null {
  if (typeof value !== "string") return null;
  let out = "";
  for (const ch of value) {
    const c = ch.codePointAt(0) ?? 0;
    const control = c < 0x20 || (c >= 0x7f && c <= 0x9f);
    const bidi = (c >= 0x202a && c <= 0x202e) || (c >= 0x2066 && c <= 0x2069) || c === 0x200e || c === 0x200f;
    out += control || bidi ? " " : ch;
  }
  out = out.replace(/\s+/g, " ").trim().slice(0, MAX_FIELD).trim();
  return out || null;
}

type Entity = { roles?: unknown; vcardArray?: unknown; entities?: unknown };

/** The vCard `fn` and `kind` of an entity (jCard, RFC 7095: ["vcard", [[name, params, type, value], …]]). */
function vcard(entity: Entity): { fn: string | null; kind: string | null } {
  const props = Array.isArray(entity.vcardArray) ? entity.vcardArray[1] : null;
  let fn: string | null = null;
  let kind: string | null = null;
  if (Array.isArray(props)) {
    for (const p of props) {
      if (!Array.isArray(p)) continue;
      if (p[0] === "fn" && fn === null) fn = clean(p[3]);
      if (p[0] === "kind" && typeof p[3] === "string") kind = p[3].toLowerCase();
    }
  }
  return { fn, kind };
}

/** Depth-first: an entity, then its nested entities, in document order. */
function findEntityFn(entities: unknown, role: string, skipIndividuals: boolean, depth = 0): string | null {
  if (!Array.isArray(entities) || depth > 4) return null;
  for (const e of entities as Entity[]) {
    if (!e || typeof e !== "object") continue;
    const roles = Array.isArray(e.roles) ? e.roles : [];
    if (roles.includes(role)) {
      const { fn, kind } = vcard(e);
      if (fn && !(skipIndividuals && kind === "individual")) return fn;
    }
    const nested = findEntityFn(e.entities, role, skipIndividuals, depth + 1);
    if (nested) return nested;
  }
  return null;
}

/**
 * Keeps five facts from an RDAP IP network object and drops everything else
 * (R26 field allowlist). The administrative fallback skips vCards of kind
 * `individual`: an admin contact can be a named person, and a person's name is
 * not a network owner.
 */
export function parseRdap(json: unknown): RdapFacts {
  const o = (json && typeof json === "object" ? json : {}) as Record<string, unknown>;
  const remarkText = Array.isArray(o.remarks)
    ? (o.remarks as { description?: unknown }[])
        .flatMap((r) => (Array.isArray(r?.description) ? r.description : []))
        .filter((d): d is string => typeof d === "string")
        .join(" ")
    : "";
  const networkName = clean(o.name);
  const owner =
    findEntityFn(o.entities, "registrant", false) ?? findEntityFn(o.entities, "administrative", true) ?? networkName;
  return {
    owner,
    networkName,
    handle: clean(o.handle),
    country: clean(o.country),
    remarks: clean(remarkText) ?? "",
  };
}

/* ------------------------------------------------------------------ */
/* Classification                                                      */
/* ------------------------------------------------------------------ */

export type NetworkKind =
  | "hosting"
  | "mobile_carrier"
  | "residential_isp"
  | "education"
  | "government"
  | "corporate"
  | "unknown";

export type NetworkRule = {
  kind: Exclude<NetworkKind, "unknown">;
  /** Which text the rule reads. Corporate reads the owner only: a legal suffix in a remark says nothing. */
  fields: "all" | "owner";
  keywords: readonly string[];
};

/**
 * Checked top to bottom; the first keyword that matches wins. Order matters:
 * a cloud provider is also a "limited company", and a carrier's broadband arm
 * is still the carrier. Keywords match on word boundaries, so "iit" never
 * matches inside "Biit" and "act" never inside "Contact".
 */
export const NETWORK_RULES: readonly NetworkRule[] = [
  {
    kind: "hosting",
    fields: "all",
    keywords: [
      "amazon", "aws", "google llc", "google cloud", "microsoft", "azure", "digitalocean", "linode",
      "akamai", "ovh", "hetzner", "vultr", "oracle", "alibaba", "tencent", "cloudflare", "fastly",
      "contabo", "leaseweb", "hostinger", "godaddy", "scaleway", "choopa", "m247", "datacamp", "ionos",
      "rackspace", "equinix", "hosting", "datacenter", "data center", "colocation",
    ],
  },
  {
    kind: "mobile_carrier",
    fields: "all",
    keywords: [
      "jio", "airtel", "vodafone", "idea cellular", "bsnl", "mtnl", "t-mobile", "verizon wireless",
      "mobility", "cellular", "wireless", "mobile",
    ],
  },
  {
    kind: "education",
    fields: "all",
    keywords: ["university", "college", "institute of", "iit", "school", "academic", "ernet", "research and education"],
  },
  {
    kind: "government",
    fields: "all",
    keywords: ["government", "ministry", "national informatics", "nic", "municipal", "gov"],
  },
  {
    kind: "residential_isp",
    fields: "all",
    // Named ISPs first, so `matchedRule` cites the most specific evidence.
    keywords: [
      "hathway", "act", "tata play", "comcast", "charter", "spectrum", "broadband", "fibernet", "fibre",
      "fiber", "cable", "telecom", "telecommunications", "communications", "communication", "isp",
      "internet service",
    ],
  },
  {
    kind: "corporate",
    fields: "owner",
    keywords: [
      "ltd", "limited", "pvt", "private limited", "inc", "llc", "llp", "gmbh", "corp", "corporation",
      "technologies", "software", "solutions", "systems", "consultancy", "services", "bank",
    ],
  },
];

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const RULE_PATTERNS = NETWORK_RULES.map((r) => ({
  ...r,
  patterns: r.keywords.map((k) => ({ k, re: new RegExp(`(?:^|[^a-z0-9])${escapeRe(k)}(?=$|[^a-z0-9])`) })),
}));

const norm = (s: string | null | undefined) => (s ?? "").toLowerCase().replace(/\s+/g, " ");

export function classifyNetwork(
  owner: string | null,
  networkName: string | null,
  remarks: string | null,
): { kind: NetworkKind; matchedRule: string } {
  const ownerText = norm(owner);
  const allText = [ownerText, norm(networkName), norm(remarks)].join(" | ");
  for (const rule of RULE_PATTERNS) {
    const text = rule.fields === "owner" ? ownerText : allText;
    for (const { k, re } of rule.patterns) {
      if (re.test(text)) return { kind: rule.kind, matchedRule: `${rule.kind}:${k}` };
    }
  }
  return { kind: "unknown", matchedRule: "unknown:no_rule" };
}

/** One plain sentence for the admin. Every variant says what it is NOT. */
export function describeNetwork(kind: NetworkKind, owner: string | null): string {
  const o = owner ?? "an unnamed registrant";
  switch (kind) {
    case "mobile_carrier":
      return `Mobile connection via ${o} — most likely an individual.`;
    case "residential_isp":
      return `Home or small-office broadband via ${o} — most likely an individual.`;
    case "corporate":
      return `Network registered to ${o} — possibly an organisation's network. Not proof of employment.`;
    case "hosting":
      return `Hosting/cloud network (${o}) — automation, VPN or a cloud desktop.`;
    case "education":
      return `Education or research network (${o}) — a student, staff member or campus guest. Not proof of affiliation.`;
    case "government":
      return `Government network (${o}) — possibly a public-sector office. Not proof of employment.`;
    default:
      return `Network registered to ${o}; its type is unclassified. Not proof of employment.`;
  }
}
