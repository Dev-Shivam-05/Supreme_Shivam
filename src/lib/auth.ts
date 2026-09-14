import crypto from "node:crypto";
import { env } from "./env";

export const ADMIN_COOKIE = "sb_admin";
const MAX_AGE = 60 * 60 * 12; // 12h

/** Sign a short session token: base64url(payload).hmac */
export function signToken(): string {
  const payload = { exp: Date.now() + MAX_AGE * 1000 };
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", env.ADMIN_SECRET).update(data).digest("base64url");
  return `${data}.${sig}`;
}

/** Verify a token; returns true when valid and unexpired. */
export function verifyToken(token?: string | null): boolean {
  if (!token || !env.ADMIN_SECRET) return false;
  const [data, sig] = token.split(".");
  if (!data || !sig) return false;
  const expected = crypto.createHmac("sha256", env.ADMIN_SECRET).update(data).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
  try {
    const payload = JSON.parse(Buffer.from(data, "base64url").toString());
    return typeof payload.exp === "number" && Date.now() < payload.exp;
  } catch {
    return false;
  }
}

/**
 * Constant-time check against every accepted password.
 *
 * Compares SHA-256 digests rather than the raw strings for two reasons: digests
 * are always the same length, so a mismatched length cannot be distinguished
 * from a mismatched value, and it removes the early `a.length === b.length`
 * return that leaked the password's length. Every candidate is checked with no
 * early exit, so the time taken does not reveal which one matched.
 */
export function checkPassword(input: string): boolean {
  const accepted = env.ADMIN_PASSWORDS;
  if (accepted.length === 0) return false;
  const given = crypto.createHash("sha256").update(input, "utf8").digest();
  let matched = false;
  for (const candidate of accepted) {
    const expected = crypto.createHash("sha256").update(candidate, "utf8").digest();
    if (crypto.timingSafeEqual(given, expected)) matched = true;
  }
  return matched;
}

export const cookieMaxAge = MAX_AGE;
