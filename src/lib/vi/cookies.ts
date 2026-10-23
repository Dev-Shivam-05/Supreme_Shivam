/**
 * The trusted server adapter for `Context` (README, R30).
 *
 * The browser epoch and the session live in two httpOnly cookies, each an
 * HMAC-signed payload. The event route reads identity from these and only
 * these — a field in a request body can never name an epoch, a session or a
 * grant. Nothing here is readable by page script.
 *
 * Key: VI_SECRET if set; otherwise a subkey derived from ADMIN_SECRET with a
 * fixed label, so production works without a new variable and the admin
 * signing key itself is never reused verbatim. No key → the feature is off.
 */
import { createCipheriv, createDecipheriv, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

function rootKey(): Buffer | null {
  const vi = process.env.VI_SECRET;
  if (vi && vi.length >= 32) return Buffer.from(vi, "utf8");
  const admin = process.env.ADMIN_SECRET;
  if (!admin) return null;
  return createHmac("sha256", admin).update("sb-visitor-intelligence-v1").digest();
}

export function viKeyAvailable() {
  return rootKey() !== null;
}

function mac(label: string, data: string) {
  const key = rootKey();
  if (!key) throw new Error("vi_key_unavailable");
  return createHmac("sha256", key).update(`${label}|${data}`).digest("base64url");
}

function sign(label: string, payload: object) {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${data}.${mac(label, data)}`;
}

function verify<T>(label: string, value: string | undefined | null): T | null {
  if (!value || !rootKey()) return null;
  const [data, sig] = value.split(".");
  if (!data || !sig) return null;
  const a = Buffer.from(sig);
  const b = Buffer.from(mac(label, data));
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    return JSON.parse(Buffer.from(data, "base64url").toString()) as T;
  } catch {
    return null;
  }
}

export type EpochCookie = { v: 1; siteId: string; epochId: string; grantId: string };
export type SessionCookie = { v: 1; sessionId: string; epochId: string };

export const signEpoch = (p: Omit<EpochCookie, "v">) => sign("epoch", { v: 1, ...p });
export const signSession = (p: Omit<SessionCookie, "v">) => sign("session", { v: 1, ...p });

export function verifyEpoch(value?: string | null): EpochCookie | null {
  const p = verify<EpochCookie>("epoch", value);
  return p && p.v === 1 && p.siteId && p.epochId && p.grantId ? p : null;
}

export function verifySession(value?: string | null): SessionCookie | null {
  const p = verify<SessionCookie>("session", value);
  return p && p.v === 1 && p.sessionId && p.epochId ? p : null;
}

/** Keyed hash of an epoch for tombstones — the audit row cannot be joined back without the key. */
export function scopeHash(siteId: string, epochId: string) {
  return mac("scope", `${siteId}|${epochId}`).slice(0, 43);
}

/** Keyed hash of a network prefix, so the org cache never stores an address range in the clear. */
export function networkKey(prefix: string) {
  return mac("network", prefix).slice(0, 43);
}

/*
 * A queued RDAP retry needs the network block after the request is gone, and a
 * hash cannot be looked up. So the block is encrypted, under its own subkey,
 * for the at most 24 h the job lives (spec 6c row 6). GCM also authenticates:
 * a tampered or foreign value opens to null, never to a different network.
 */
const SEAL_LABEL = "job-prefix";

function sealKey() {
  const key = rootKey();
  if (!key) throw new Error("vi_key_unavailable");
  return createHmac("sha256", key).update(SEAL_LABEL).digest();
}

export function sealPrefix(prefix: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", sealKey(), iv);
  cipher.setAAD(Buffer.from(SEAL_LABEL));
  const body = Buffer.concat([cipher.update(prefix, "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), body]).toString("base64url");
}

export function openPrefix(sealed: unknown): string | null {
  if (typeof sealed !== "string" || !rootKey()) return null;
  try {
    const raw = Buffer.from(sealed, "base64url");
    if (raw.length < 29) return null;
    const decipher = createDecipheriv("aes-256-gcm", sealKey(), raw.subarray(0, 12));
    decipher.setAAD(Buffer.from(SEAL_LABEL));
    decipher.setAuthTag(raw.subarray(12, 28));
    return Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
}
