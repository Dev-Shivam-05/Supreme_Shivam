/**
 * Network-owner lookup — the pure half (R25, R26).
 *
 *   npm run test:vi
 *
 * Pins the parts that carry the privacy and SSRF promises: the exact address
 * never survives `networkPrefix`, reserved space is never looked up, only
 * allowlisted RIR hosts are ever chosen, and only allowlisted fields are kept.
 * The RDAP fixtures are trimmed copies of real responses (ARIN 8.8.8.0/24 and
 * APNIC 49.36.0.0/24, retrieved 2026-10-23), with the APNIC registrant moved
 * one level down to exercise the nested-entity search.
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  ALLOWED_RDAP_HOSTS,
  NETWORK_RULES,
  classifyNetwork,
  describeNetwork,
  isAllowedRdapUrl,
  networkPrefix,
  parseRdap,
  pickRdapBase,
  rdapFallbackUrl,
  rdapQueryUrl,
} from "./network-core.ts";

describe("networkPrefix", () => {
  test("IPv4 → /24 with the host octet zeroed", () => {
    assert.deepEqual(networkPrefix("49.36.17.203"), { network: "49.36.17.0", length: 24, family: 4 });
    assert.deepEqual(networkPrefix(" 8.8.8.8 "), { network: "8.8.8.0", length: 24, family: 4 });
  });

  test("IPv6 → /48 in RFC 5952 form, with :: expanded first", () => {
    assert.deepEqual(networkPrefix("2405:201:1:2::5"), { network: "2405:201:1::", length: 48, family: 6 });
    assert.deepEqual(networkPrefix("2405:0201:0001:abcd:0:0:0:1"), { network: "2405:201:1::", length: 48, family: 6 });
    assert.deepEqual(networkPrefix("2001:4860::8888"), { network: "2001:4860::", length: 48, family: 6 });
    assert.deepEqual(networkPrefix("2A00:1450:4001:80B::200E"), { network: "2a00:1450:4001::", length: 48, family: 6 });
    // Zero groups inside the /48 are compressed, so the same network always has the same key.
    assert.deepEqual(networkPrefix("2400:0:0:5::1"), { network: "2400::", length: 48, family: 6 });
  });

  test("IPv4-mapped IPv6 is treated as IPv4", () => {
    assert.deepEqual(networkPrefix("::ffff:49.36.17.203"), { network: "49.36.17.0", length: 24, family: 4 });
    assert.deepEqual(networkPrefix("::ffff:3124:11cb"), { network: "49.36.17.0", length: 24, family: 4 });
    assert.deepEqual(networkPrefix("::ffff:192.168.1.10"), { reason: "private_address" });
  });

  test("every reserved range is private_address", () => {
    const samples = [
      "0.1.2.3", "10.0.0.1", "100.64.0.1", "100.127.255.254", "127.0.0.1", "169.254.1.1",
      "172.16.0.1", "172.31.255.255", "192.0.0.8", "192.0.2.55", "192.168.1.1", "198.18.0.1",
      "198.19.255.1", "198.51.100.7", "203.0.113.9", "224.0.0.251", "239.255.255.250",
      "240.0.0.1", "255.255.255.255",
      "::", "::1", "fc00::1", "fd12:3456::1", "fe80::1", "febf::1", "ff02::1", "2001:db8::1",
      "2001:0db8:ffff::1",
    ];
    for (const ip of samples) assert.deepEqual(networkPrefix(ip), { reason: "private_address" }, ip);
  });

  test("addresses just outside the reserved ranges are public", () => {
    for (const ip of ["100.63.255.1", "100.128.0.1", "172.15.0.1", "172.32.0.1", "198.20.0.1", "223.255.255.1"]) {
      assert.equal("network" in networkPrefix(ip), true, ip);
    }
    for (const ip of ["fec0::1", "2001:db9::1", "fbff::1"]) assert.equal("network" in networkPrefix(ip), true, ip);
  });

  test("malformed input is invalid", () => {
    const bad = [
      "", "   ", "1.2.3", "1.2.3.4.5", "256.1.1.1", "01.2.3.4", "1.2.3.-4", "a.b.c.d", "1.2.3.4/24",
      "2405::201::1", "12345::1", "2405:201:1:2:3:4:5:6:7", "2405:201", "gggg::1", "::ffff:1.2.3",
      "fe80::1%eth0", "[2405:201::1]", "localhost",
    ];
    for (const ip of bad) assert.deepEqual(networkPrefix(ip), { reason: "invalid" }, ip);
    assert.deepEqual(networkPrefix(undefined as unknown as string), { reason: "invalid" });
  });
});

/* A trimmed IANA bootstrap: a broad APNIC /8, a narrower override, and a hostile entry. */
const V4_BOOT = {
  version: "1.0",
  services: [
    [["49.0.0.0/8", "14.0.0.0/8"], ["https://rdap.apnic.net/"]],
    [["8.0.0.0/8"], ["http://rdap.arin.net/registry/", "https://rdap.arin.net/registry/"]],
    [["49.36.0.0/16"], ["https://evil.example/"]],
    [["193.0.0.0/8"], ["https://rdap.db.ripe.net"]],
    [["200.0.0.0/8"], ["https://rdap.lacnic.net:8443/rdap/", "https://user@rdap.lacnic.net/rdap/"]],
    "junk",
    [["not-a-cidr", "41.0.0.0/33"], ["https://rdap.afrinic.net/rdap/"]],
  ],
};
const V6_BOOT = {
  services: [
    [["2400::/12"], ["https://rdap.apnic.net/"]],
    [["2001:4800::/23"], ["https://rdap.arin.net/registry/"]],
    [["2001:4860::/32"], ["https://rdap.example.net/"]],
  ],
};

describe("RDAP bootstrap", () => {
  test("longest prefix wins and only allowlisted https URLs are returned", () => {
    assert.equal(pickRdapBase(V4_BOOT, "49.37.4.0", 4), "https://rdap.apnic.net/");
    assert.equal(pickRdapBase(V4_BOOT, "8.8.8.0", 4), "https://rdap.arin.net/registry/");
    assert.equal(pickRdapBase(V4_BOOT, "193.0.6.0", 4), "https://rdap.db.ripe.net/");
    assert.equal(pickRdapBase(V6_BOOT, "2405:201:1::", 6), "https://rdap.apnic.net/");
  });

  test("a more specific service pointing off the allowlist yields null, not the broader match", () => {
    assert.equal(pickRdapBase(V4_BOOT, "49.36.17.0", 4), null);
    assert.equal(pickRdapBase(V6_BOOT, "2001:4860::", 6), null);
  });

  test("non-default ports, credentials, junk entries and unknown space yield null", () => {
    assert.equal(pickRdapBase(V4_BOOT, "200.1.2.0", 4), null);
    assert.equal(pickRdapBase(V4_BOOT, "41.1.2.0", 4), null);
    assert.equal(pickRdapBase(V4_BOOT, "99.1.2.0", 4), null);
    assert.equal(pickRdapBase(null, "8.8.8.0", 4), null);
    assert.equal(pickRdapBase({ services: "x" }, "8.8.8.0", 4), null);
  });

  test("isAllowedRdapUrl is exactly the five RIR hosts over https", () => {
    for (const h of ALLOWED_RDAP_HOSTS) assert.equal(isAllowedRdapUrl(`https://${h}/ip/1.2.3.0/24`), true, h);
    for (const u of [
      "http://rdap.arin.net/registry/",
      "https://rdap.arin.net.evil.example/",
      "https://evil.example/?h=rdap.arin.net",
      "https://rdap.arin.net:444/",
      "https://a:b@rdap.apnic.net/",
      "file:///etc/passwd",
      "not a url",
    ]) {
      assert.equal(isAllowedRdapUrl(u), false, u);
    }
  });

  test("query URLs carry the network address, never the visitor's host part", () => {
    const visitor = "49.36.17.203";
    const p = networkPrefix(visitor);
    assert.ok("network" in p);
    for (const url of [rdapQueryUrl("https://rdap.apnic.net/", p.network, p.length), rdapFallbackUrl("https://rdap.apnic.net", p.network)]) {
      assert.equal(url.includes(visitor), false, url);
      assert.equal(url.includes(".203"), false, url);
      assert.match(url, /^https:\/\/rdap\.apnic\.net\/ip\/49\.36\.17\.0(\/24)?$/);
      assert.equal(url.split("/ip/")[1].split("/")[0].split(".")[3], "0");
    }
    const v6 = networkPrefix("2405:201:1:2::5");
    assert.ok("network" in v6);
    assert.equal(rdapQueryUrl("https://rdap.apnic.net/", v6.network, v6.length), "https://rdap.apnic.net/ip/2405:201:1::/48");
  });
});

const ARIN_8_8_8 = {
  rdapConformance: ["nro_rdap_profile_0", "rdap_level_0"],
  objectClassName: "ip network",
  handle: "NET-8-8-8-0-2",
  startAddress: "8.8.8.0",
  endAddress: "8.8.8.255",
  ipVersion: "v4",
  name: "GOGL",
  type: "DIRECT ALLOCATION",
  parentHandle: "NET-8-0-0-0-0",
  entities: [
    {
      objectClassName: "entity",
      handle: "GOGL",
      roles: ["registrant"],
      vcardArray: [
        "vcard",
        [
          ["version", {}, "text", "4.0"],
          ["fn", {}, "text", "Google LLC"],
          ["adr", { label: "1600 Amphitheatre Parkway\nMountain View\nCA\n94043\nUnited States" }, "text", ["", "", "", "", "", "", ""]],
          ["kind", {}, "text", "org"],
        ],
      ],
      entities: [
        {
          handle: "ABUSE5250-ARIN",
          roles: ["abuse"],
          vcardArray: ["vcard", [["version", {}, "text", "4.0"], ["fn", {}, "text", "Abuse"], ["kind", {}, "text", "group"], ["email", {}, "text", "network-abuse@google.com"]]],
        },
      ],
    },
  ],
};

const APNIC_49_36 = {
  objectClassName: "ip network",
  handle: "49.32.0.0 - 49.47.255.255",
  startAddress: "49.32.0.0",
  endAddress: "49.47.255.255",
  ipVersion: "v4",
  name: "RELIANCEJIO-IN",
  type: "ALLOCATED PORTABLE",
  country: "IN",
  remarks: [
    { title: "description", description: ["Reliance Jio Infocomm Limited"] },
    { title: "remarks", description: ["To report network abuse, please contact mnt-irt", "For troubleshooting, please contact tech-c and admin-c"] },
  ],
  entities: [
    {
      handle: "IRT-RELIANCEJIO-IN",
      roles: ["abuse"],
      vcardArray: ["vcard", [["version", {}, "text", "4.0"], ["fn", {}, "text", "IRT-RELIANCEJIO-IN"], ["kind", {}, "text", "group"]]],
      entities: [
        {
          handle: "ORG-RJIL1-AP",
          roles: ["registrant"],
          vcardArray: ["vcard", [["version", {}, "text", "4.0"], ["fn", {}, "text", "Reliance Jio Infocomm Limited"], ["kind", {}, "text", "org"]]],
        },
      ],
    },
    {
      handle: "RJIL1-AP",
      roles: ["administrative", "technical"],
      vcardArray: ["vcard", [["version", {}, "text", "4.0"], ["fn", {}, "text", "Jio Network Admin"], ["kind", {}, "text", "group"]]],
    },
  ],
};

describe("parseRdap", () => {
  test("ARIN 8.8.8.0/24 — registrant vCard fn", () => {
    assert.deepEqual(parseRdap(ARIN_8_8_8), {
      owner: "Google LLC",
      networkName: "GOGL",
      handle: "NET-8-8-8-0-2",
      country: null,
      remarks: "",
    });
  });

  test("APNIC 49.36.0.0/24 — nested registrant, country, remarks", () => {
    const f = parseRdap(APNIC_49_36);
    assert.equal(f.owner, "Reliance Jio Infocomm Limited");
    assert.equal(f.networkName, "RELIANCEJIO-IN");
    assert.equal(f.country, "IN");
    assert.equal(f.handle, "49.32.0.0 - 49.47.255.255");
    assert.match(f.remarks, /^Reliance Jio Infocomm Limited To report network abuse/);
  });

  test("keeps only the five allowlisted fields", () => {
    assert.deepEqual(Object.keys(parseRdap(ARIN_8_8_8)).sort(), ["country", "handle", "networkName", "owner", "remarks"]);
  });

  test("administrative fallback skips individuals; name is the last resort", () => {
    const admin = (kind: string) => ({
      name: "NET-X",
      entities: [{ roles: ["administrative"], vcardArray: ["vcard", [["fn", {}, "text", "Example Admin"], ["kind", {}, "text", kind]]] }],
    });
    assert.equal(parseRdap(admin("group")).owner, "Example Admin");
    assert.equal(parseRdap(admin("individual")).owner, "NET-X");
    assert.equal(parseRdap({}).owner, null);
    assert.equal(parseRdap(null).owner, null);
    assert.equal(parseRdap("<html>").owner, null);
  });

  test("strips control and bidi characters and caps every string at 200", () => {
    const f = parseRdap({
      name: "A\u0000B\u001b[31mC‮D",
      handle: "x".repeat(500),
      entities: [{ roles: ["registrant"], vcardArray: ["vcard", [["fn", {}, "text", "  Evil\nCorp\t "]]] }],
      remarks: [{ description: ["y".repeat(300)] }],
    });
    assert.equal(f.networkName, "A B [31mC D");
    assert.equal(f.owner, "Evil Corp");
    assert.equal(f.handle?.length, 200);
    assert.equal(f.remarks.length, 200);
  });
});

describe("classifyNetwork", () => {
  const cases: [string, string | null, string, string][] = [
    ["Google LLC", "GOGL", "hosting", "hosting:google llc"],
    ["Reliance Jio Infocomm Limited", "RELIANCEJIO-IN", "mobile_carrier", "mobile_carrier:jio"],
    ["Bharti Airtel Ltd.", "AIRTEL-IN", "mobile_carrier", "mobile_carrier:airtel"],
    ["Hathway IP Over Cable Internet", "HATHWAY-NET", "residential_isp", "residential_isp:hathway"],
    ["Indian Institute of Technology Bombay", "IITB-IN", "education", "education:institute of"],
    ["National Informatics Centre", "NIC-IN", "government", "government:national informatics"],
    ["Tata Consultancy Services Limited", "TCS-IN", "corporate", "corporate:limited"],
    ["Amazon Technologies Inc.", "AT-88-Z", "hosting", "hosting:amazon"],
    ["Xqzv Plorb", "XQZV", "unknown", "unknown:no_rule"],
  ];
  for (const [owner, name, kind, rule] of cases) {
    test(`${owner} → ${kind}`, () => {
      assert.deepEqual(classifyNetwork(owner, name, ""), { kind, matchedRule: rule });
    });
  }

  test("word boundaries: 'Biit Systems' is not the iit education rule", () => {
    const r = classifyNetwork("Biit Systems", null, null);
    assert.notEqual(r.kind, "education");
    assert.equal(r.matchedRule, "corporate:systems");
    assert.equal(classifyNetwork("IIT Delhi", null, null).matchedRule, "education:iit");
    assert.equal(classifyNetwork("Contact Point", null, null).kind, "unknown");
  });

  test("the corporate rule reads the owner only", () => {
    assert.equal(classifyNetwork("Xqzv Plorb", "XQZV", "Registered office: Example Pvt Ltd").kind, "unknown");
  });

  test("the rule table is ordered hosting → mobile → education → government → residential → corporate", () => {
    assert.deepEqual(
      NETWORK_RULES.map((r) => r.kind),
      ["hosting", "mobile_carrier", "education", "government", "residential_isp", "corporate"],
    );
  });
});

describe("describeNetwork", () => {
  test("one sentence per kind, none claiming employment", () => {
    assert.equal(describeNetwork("mobile_carrier", "Reliance Jio Infocomm Limited"), "Mobile connection via Reliance Jio Infocomm Limited — most likely an individual.");
    assert.equal(describeNetwork("residential_isp", "Hathway"), "Home or small-office broadband via Hathway — most likely an individual.");
    assert.equal(
      describeNetwork("corporate", "Tata Consultancy Services Limited"),
      "Network registered to Tata Consultancy Services Limited — possibly an organisation's network. Not proof of employment.",
    );
    assert.equal(describeNetwork("hosting", "Google LLC"), "Hosting/cloud network (Google LLC) — automation, VPN or a cloud desktop.");
    for (const k of ["education", "government", "unknown"] as const) {
      const s = describeNetwork(k, "X");
      assert.match(s, /Not proof of/);
      assert.doesNotMatch(s, /\bworks (at|for)\b|\bemployee\b/i);
    }
    assert.match(describeNetwork("corporate", null), /an unnamed registrant/);
  });
});
