// Renders the marketing shots (site/src/assets/shot-N.webp) from the poster
// pages in this directory, using headless Chrome + sharp. No JPEG is written
// for the on-page shots; astro:assets re-encodes each .webp into AVIF + WebP
// at build time, so a JPEG source here would just be dead weight.
// Run with: npm run shots
import sharp from 'sharp';
import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { promisify } from 'node:util';

const run = execFile;
const execFileP = promisify(run);

const CHROME =
  process.env.CHROME_BIN ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUT_DIR = 'site/src/assets';
// The Chrome Web Store accepts screenshots at exactly 1280x800 or 640x400, as
// JPEG or 24-bit PNG with no alpha. The posters render at 1800x1126 for the
// landing page, so each one is downscaled into a second, store-sized file.
const STORE_DIR = 'media/store';
const STORE_SIZE = { w: 1280, h: 800 };
const STORE_SHOTS = new Set(['shot-1', 'shot-2', 'shot-3', 'shot-4']);
// shot-1 is the wordmark/headline slide the Chrome Web Store's first
// screenshot needs; nothing on the site renders it, so it gets no OUT_DIR
// write. shot-2..5 are the homepage's four FRAME product shots (Capture,
// Annotate, Export, Record) and hero is the homepage's top shot — every one
// of those five is used on the page. There is no step-1..3 entry: the old
// three-step "how it works" section was folded into the FRAME sections, and
// nothing on the site references those shots any more.
const PAGE_SHOTS = new Set(['shot-2', 'shot-3', 'shot-4', 'shot-5', 'hero']);
const SHOTS = [
  { name: 'shot-1', w: 900, h: 563 },
  { name: 'shot-2', w: 900, h: 563 },
  { name: 'shot-3', w: 900, h: 563 },
  { name: 'shot-4', w: 900, h: 563 },
  { name: 'shot-5', w: 900, h: 563 },
  { name: 'hero', w: 1160, h: 680 },
];

const work = await mkdtemp(join(tmpdir(), 'oss-shots-'));
await mkdir(OUT_DIR, { recursive: true });
await mkdir(STORE_DIR, { recursive: true });
try {
  for (const { name, w, h } of SHOTS) {
    const src = resolve(`scripts/shots/${name}.html`);
    const png = join(work, `${name}.png`);
    await execFileP(
      CHROME,
      [
        '--headless=new',
        '--disable-gpu',
        '--hide-scrollbars',
        '--no-first-run',
        '--disable-extensions',
        `--user-data-dir=${join(work, 'profile-' + name)}`,
        `--screenshot=${png}`,
        `--window-size=${w},${h}`,
        '--force-device-scale-factor=2',
        `file://${src}`,
      ],
      { timeout: 30_000 },
    );
    if (PAGE_SHOTS.has(name)) {
      await sharp(png).webp({ quality: 84 }).toFile(`${OUT_DIR}/${name}.webp`);
      console.log(`✓ ${OUT_DIR}/${name}.webp`);
    }

    if (STORE_SHOTS.has(name)) {
      // `cover` holds the aspect ratio and trims a half-pixel row top and
      // bottom; the poster is 1.5986:1 against the store's 1.6:1. `flatten`
      // drops any alpha the store would reject.
      const store = `${STORE_DIR}/${name.replace('shot-', 'cws-')}.jpg`;
      await sharp(png)
        .resize(STORE_SIZE.w, STORE_SIZE.h, { fit: 'cover' })
        .flatten({ background: '#f2f0ea' })
        .jpeg({ quality: 90 })
        .toFile(store);
      console.log(`✓ ${store} (${STORE_SIZE.w}x${STORE_SIZE.h})`);
    }
  }
  // The OG/social card: exactly 1200x630, PNG. Social un-furlers (LinkedIn,
  // iMessage, some Slack previews) do not reliably decode AVIF or WebP og:image
  // URLs, so this one file stays outside the AVIF+WebP policy that governs
  // every on-page <img>: it is never rendered inside the page itself, so it
  // never touches the Lighthouse transfer-weight budget.
  {
    const name = 'og-card';
    const w = 1200;
    const h = 630;
    const src = resolve(`scripts/shots/${name}.html`);
    const png = join(work, `${name}.png`);
    await execFileP(
      CHROME,
      [
        '--headless=new',
        '--disable-gpu',
        '--hide-scrollbars',
        '--no-first-run',
        '--disable-extensions',
        `--user-data-dir=${join(work, 'profile-' + name)}`,
        `--screenshot=${png}`,
        `--window-size=${w},${h}`,
        '--force-device-scale-factor=2',
        `file://${src}`,
      ],
      { timeout: 30_000 },
    );
    const out = `${OUT_DIR}/${name}.png`;
    await sharp(png).resize(w, h).png({ compressionLevel: 9 }).toFile(out);
    console.log(`✓ ${out} (${w}x${h})`);
  }

  // Store promo images: exact sizes, JPEG or 24-bit PNG. Rendered at 2x like
  // the shots, then downscaled straight into the store directory.
  for (const { name, w, h } of [
    { name: 'promo-tile', w: 440, h: 280 },
    { name: 'marquee', w: 1400, h: 560 },
  ]) {
    const src = resolve(`scripts/shots/${name}.html`);
    const png = join(work, `${name}.png`);
    await execFileP(
      CHROME,
      [
        '--headless=new',
        '--disable-gpu',
        '--hide-scrollbars',
        '--no-first-run',
        '--disable-extensions',
        `--user-data-dir=${join(work, 'profile-' + name)}`,
        `--screenshot=${png}`,
        `--window-size=${w},${h}`,
        '--force-device-scale-factor=2',
        `file://${src}`,
      ],
      { timeout: 30_000 },
    );
    const out = `${STORE_DIR}/${name}.jpg`;
    await sharp(png)
      .resize(w, h, { fit: 'cover' })
      .flatten({ background: '#f2f0ea' })
      .jpeg({ quality: 92 })
      .toFile(out);
    console.log(`✓ ${out} (${w}x${h})`);
  }
} finally {
  await rm(work, { recursive: true, force: true });
}
console.log('Shots rendered.');
