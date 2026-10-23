import { createHmac } from "node:crypto";

/**
 * Keyed one-way hashes for anything derived from an IP address.
 *
 * A plain `sha256(salt|ip)` with a known or default salt can be reversed by
 * hashing all 4.3 billion IPv4 addresses, which takes minutes. An HMAC under a
 * server-only secret cannot be, by anyone who does not hold that secret. The
 * key is ANALYTICS_SALT when set, otherwise a labelled subkey of ADMIN_SECRET
 * (set in production), never the admin key itself. With neither, there is no
 * secret to key with and callers store nothing rather than a weak hash.
 *
 * Server-only.
 */
function rootKey(): Buffer | null {
  const salt = process.env.ANALYTICS_SALT;
  if (salt && salt.length >= 16) return Buffer.from(salt, "utf8");
  const admin = process.env.ADMIN_SECRET;
  if (!admin) return null;
  return createHmac("sha256", admin).update("sb-keyed-hash-v1").digest();
}

/** HMAC-SHA256 of `data` under the server key, hex, truncated; null when no key exists. */
export function keyedHash(label: string, data: string, length = 32): string | null {
  const key = rootKey();
  if (!key) return null;
  return createHmac("sha256", key).update(`${label}|${data}`).digest("hex").slice(0, length);
}
