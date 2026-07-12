/**
 * Central env access + feature flags. Everything degrades gracefully:
 * the site runs with an empty .env; features light up as you fill it in.
 * Server-only — never import from client components.
 */
export const env = {
  MONGODB_URI: process.env.MONGODB_URI ?? "",

  SMTP_HOST: process.env.SMTP_HOST ?? "",
  SMTP_PORT: Number(process.env.SMTP_PORT ?? 587),
  SMTP_USER: process.env.SMTP_USER ?? "",
  SMTP_PASS: process.env.SMTP_PASS ?? "",
  SMTP_FROM: process.env.SMTP_FROM ?? process.env.SMTP_USER ?? "",
  CONTACT_TO: process.env.CONTACT_TO ?? "shivambhadoriya1605@gmail.com",

  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD ?? "",
  ADMIN_SECRET: process.env.ADMIN_SECRET ?? "",
};

export const features = {
  db: Boolean(env.MONGODB_URI),
  mail: Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS),
  admin: Boolean(env.ADMIN_PASSWORD && env.ADMIN_SECRET),
};
