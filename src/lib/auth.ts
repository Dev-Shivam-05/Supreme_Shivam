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

/** Constant-time password check. */
export function checkPassword(input: string): boolean {
  if (!env.ADMIN_PASSWORD) return false;
  const a = Buffer.from(input);
  const b = Buffer.from(env.ADMIN_PASSWORD);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export const cookieMaxAge = MAX_AGE;
