/**
 * Address obfuscation.
 *
 * The address used to sit in the server HTML as plain text *and* as a `mailto:`
 * href, which is exactly what address harvesters crawl for. It is assembled at
 * runtime instead, so the rendered HTML never contains it as one string.
 *
 * It deliberately stays in the JSON-LD (see components/seo/json-ld.tsx) — there
 * it is a machine-readable property of the Person entity and it helps.
 */
const LOCAL = "shivambhadoriya1605";
const HOST = ["gmail", "com"].join(".");

/** The real address. Call it; do not inline it into markup at build time. */
export function emailAddress() {
  return `${LOCAL}@${HOST}`;
}

export function emailHref() {
  return `mailto:${emailAddress()}`;
}

/** Shown before hydration and to anyone without JavaScript. Readable, unharvestable. */
export const EMAIL_MASKED = `${LOCAL} [at] ${["gmail", "dot", "com"].join(" ")}`;
