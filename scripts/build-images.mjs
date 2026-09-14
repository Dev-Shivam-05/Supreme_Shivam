/**
 * Builds the SEO image set from the two source photographs in /images.
 *
 *   images/shivam-profile-image.jpg    → the full photograph (portrait, 576×1024)
 *   images/shivam-profile-image-2.jpg  → the profile photograph, composed inside a
 *                                        decorative ring
 *
 * The ring in the second photograph was measured off the pixels, not guessed:
 * centre (288, 377), radius ≈ 270 in the 576×1024 source. That means the ring is
 * inscribed in a 576×576 square starting at y = 89, with an even ~18px margin on
 * all four sides. CIRCLE_CROP below is that square — every square/avatar output is
 * cut from it, so the ring is never sliced.
 *
 * Outputs (stable, human-readable filenames — the filename is a ranking input for
 * Google image search, and these paths are referenced from the JSON-LD and the
 * image sitemap, so they must not change):
 *
 *   public/images/shivam-bhadoriya-ai-engineer.jpg   1000×1000  canonical avatar
 *   public/images/shivam-bhadoriya-portrait.jpg       576×1024  full photograph
 *   public/og/shivam-bhadoriya.jpg                   1200× 630  social card
 *
 * Run with: npm run images
 */
import { mkdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const SRC_FULL = path.join(ROOT, "images/shivam-profile-image.jpg");
const SRC_PROFILE = path.join(ROOT, "images/shivam-profile-image-2.jpg");

/** The measured square that the decorative ring is inscribed in. */
const CIRCLE_CROP = { left: 0, top: 89, width: 576, height: 576 };

/**
 * A tighter head-and-shoulders square for the icons. At 32px the ring is an
 * unreadable smudge, so favicons crop inside it — same photograph, so the entity
 * signal stays single, just framed for the size.
 */
const ICON_CROP = { left: 78, top: 80, width: 420, height: 420 };

const BG = "#08080a";
const ACCENT = "#cbff3c";
const FG = "#f3f3ef";
const MUTED = "#9a9a92";
/* Windows-first stacks. These only have to resolve on the machine that generates
   the files — the output is a committed JPEG, not a runtime dependency. */
const POSTER = "Arial Black, Segoe UI, Arial, Helvetica, sans-serif";
const SANS = "Segoe UI, Arial, Helvetica, sans-serif";

const svg = (s) => Buffer.from(s);

/** Resize the ring crop to `size` and knock out everything outside the circle. */
async function circlePhoto(size) {
  const square = await sharp(SRC_PROFILE)
    .extract(CIRCLE_CROP)
    .resize(size, size, { kernel: "lanczos3" })
    .toBuffer();
  const mask = svg(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">` +
      `<circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#fff"/></svg>`,
  );
  return sharp(square).composite([{ input: mask, blend: "dest-in" }]).png().toBuffer();
}

/** 1000×1000 avatar — the one image reused on LinkedIn, GitHub and X. */
async function buildAvatar(out) {
  await sharp(SRC_PROFILE)
    .extract(CIRCLE_CROP)
    .resize(1000, 1000, { kernel: "lanczos3" })
    // 4:2:0 here (unlike the card, which carries text): it halves the bytes on a
    // photograph with no visible loss, and this file is also lazy-loaded on-page.
    .jpeg({ quality: 88, mozjpeg: true })
    .toFile(out);
}

/** The full photograph, re-encoded at the source resolution (no fake upscale). */
async function buildPortrait(out) {
  await sharp(SRC_FULL)
    .jpeg({ quality: 86, mozjpeg: true })
    .toFile(out);
}

/**
 * The favicon / PWA / apple-touch set.
 *
 * The originals were a *different* photograph of him — a casual selfie — and one
 * of them was 563KB for a 512px icon. Google clusters a person entity partly by
 * image similarity, so a second face in the favicon is a second weak signal
 * where there should be one strong one.
 */
async function buildIcons(targets) {
  const base = sharp(SRC_PROFILE).extract(ICON_CROP);
  for (const { file, size } of targets) {
    await base
      .clone()
      .resize(size, size, { kernel: "lanczos3" })
      // palette + dither keeps these a few KB instead of a few hundred
      .png({ compressionLevel: 9, palette: true, quality: 92, effort: 9 })
      .toFile(file);
  }
}

/**
 * A minimal .ico wrapper around a 32×32 PNG. ICO has allowed PNG-compressed
 * entries since Vista and every current browser reads them; sharp cannot write
 * the container itself, and /favicon.ico is still requested by convention.
 */
async function buildFaviconIco(out) {
  const png = await sharp(SRC_PROFILE)
    .extract(ICON_CROP)
    .resize(32, 32, { kernel: "lanczos3" })
    // RGBA, not palette: Next's ICO decoder rejects indexed-colour PNGs inside
    // an .ico ("The PNG is not in RGBA format"), and at 32x32 it costs ~1KB.
    .ensureAlpha()
    .png({ compressionLevel: 9, palette: false })
    .toBuffer();
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(1, 4); // one image
  const entry = Buffer.alloc(16);
  entry[0] = 32; // width
  entry[1] = 32; // height
  entry[2] = 0; // no colour-palette table
  entry[3] = 0; // reserved
  entry.writeUInt16LE(1, 4); // colour planes
  entry.writeUInt16LE(32, 6); // bits per pixel
  entry.writeUInt32LE(png.length, 8);
  entry.writeUInt32LE(header.length + entry.length, 12); // offset to the payload
  await writeFile(out, Buffer.concat([header, entry, png]));
}

/** 1200×630 link-preview card, built from the profile photograph. */
async function buildOgCard(out) {
  const W = 1200;
  const H = 630;
  const D = 430; // photo diameter
  const cx = 915;
  const cy = 315;

  const background = svg(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <radialGradient id="g1" cx="14%" cy="2%" r="52%">
      <stop offset="0%" stop-color="${ACCENT}" stop-opacity="0.10"/>
      <stop offset="100%" stop-color="${ACCENT}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="g2" cx="92%" cy="104%" r="46%">
      <stop offset="0%" stop-color="${ACCENT}" stop-opacity="0.07"/>
      <stop offset="100%" stop-color="${ACCENT}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="${BG}"/>
  <rect width="${W}" height="${H}" fill="url(#g1)"/>
  <rect width="${W}" height="${H}" fill="url(#g2)"/>
  <rect x="0" y="0" width="${W}" height="6" fill="${ACCENT}"/>
  <circle cx="${cx}" cy="${cy}" r="${D / 2 + 14}" fill="none" stroke="${ACCENT}" stroke-opacity="0.55" stroke-width="2"/>
</svg>`);

  const foreground = svg(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <rect x="72" y="118" width="46" height="46" fill="${ACCENT}"/>
  <text x="83" y="151" font-family="${POSTER}" font-size="24" font-weight="900" fill="${BG}">SB</text>
  <text x="140" y="148" font-family="${SANS}" font-size="17" letter-spacing="5" fill="${MUTED}">AAZIKO GLOBAL LLP</text>

  <text x="72" y="300" font-family="${POSTER}" font-size="92" font-weight="900" letter-spacing="-2" fill="${FG}">SHIVAM</text>
  <text x="72" y="392" font-family="${POSTER}" font-size="92" font-weight="900" letter-spacing="-2" fill="${ACCENT}">BHADORIYA</text>

  <rect x="72" y="432" width="560" height="1" fill="${FG}" fill-opacity="0.16"/>
  <text x="72" y="478" font-family="${SANS}" font-size="29" fill="${FG}">AI Engineer &#183; Ahmedabad, India</text>
  <text x="72" y="524" font-family="${SANS}" font-size="22" fill="${MUTED}">I write the spec, direct the agents, review and test what they build.</text>
</svg>`);

  const photo = await circlePhoto(D);

  await sharp(background)
    .composite([
      { input: photo, left: Math.round(cx - D / 2), top: Math.round(cy - D / 2) },
      { input: foreground, left: 0, top: 0 },
    ])
    .jpeg({ quality: 88, chromaSubsampling: "4:4:4", mozjpeg: true })
    .toFile(out);
}

async function main() {
  await mkdir(path.join(ROOT, "public/images"), { recursive: true });
  await mkdir(path.join(ROOT, "public/og"), { recursive: true });

  const avatar = path.join(ROOT, "public/images/shivam-bhadoriya-ai-engineer.jpg");
  const portrait = path.join(ROOT, "public/images/shivam-bhadoriya-portrait.jpg");
  const og = path.join(ROOT, "public/og/shivam-bhadoriya.jpg");

  const icons = [
    { file: path.join(ROOT, "public/icon-192.png"), size: 192 },
    { file: path.join(ROOT, "public/icon-512.png"), size: 512 },
    { file: path.join(ROOT, "src/app/icon.png"), size: 256 },
    { file: path.join(ROOT, "src/app/apple-icon.png"), size: 180 },
  ];
  const favicon = path.join(ROOT, "src/app/favicon.ico");

  await buildAvatar(avatar);
  await buildPortrait(portrait);
  await buildOgCard(og);
  await buildIcons(icons);
  await buildFaviconIco(favicon);

  for (const f of [avatar, portrait, og, ...icons.map((i) => i.file)]) {
    const m = await sharp(f).metadata();
    const kb = ((await stat(f)).size / 1024).toFixed(1);
    console.log(path.relative(ROOT, f).split(String.fromCharCode(92)).join('/') + '  ' + m.width + 'x' + m.height + '  ' + kb + 'KB');
  }
  console.log(`src/app/favicon.ico  32x32  ${((await stat(favicon)).size / 1024).toFixed(1)}KB`);
  // A README next to the generated files so nobody hand-edits them.
  await writeFile(
    path.join(ROOT, "public/images/README.txt"),
    "Generated by `npm run images` from /images/*.jpg. Do not edit by hand.\n" +
      "These paths are referenced by the JSON-LD, the image sitemap and the OG tags — do not rename them.\n",
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
