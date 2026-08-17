// Renders the marketing shots (docs/assets/shot-N.{jpg,webp}) from the poster
// pages in this directory, using headless Chrome + sharp.
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
const OUT_DIR = 'docs/assets';
// The Chrome Web Store accepts screenshots at exactly 1280x800 or 640x400, as
// JPEG or 24-bit PNG with no alpha. The posters render at 1800x1126 for the
// landing page, so each one is downscaled into a second, store-sized file.
const STORE_DIR = 'docs/assets/store';
const STORE_SIZE = { w: 1280, h: 800 };
const STORE_SHOTS = new Set(['shot-1', 'shot-2', 'shot-3', 'shot-4']);
const SHOTS = [
  { name: 'shot-1', w: 900, h: 563 },
  { name: 'shot-2', w: 900, h: 563 },
  { name: 'shot-3', w: 900, h: 563 },
  { name: 'shot-4', w: 900, h: 563 },
  { name: 'hero', w: 1160, h: 680 },
  { name: 'step-1', w: 560, h: 420 },
  { name: 'step-2', w: 560, h: 420 },
  { name: 'step-3', w: 560, h: 420 },
];

const work = await mkdtemp(join(tmpdir(), 'oss-shots-'));
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
    await sharp(png).jpeg({ quality: 84 }).toFile(`${OUT_DIR}/${name}.jpg`);
    await sharp(png).webp({ quality: 84 }).toFile(`${OUT_DIR}/${name}.webp`);
    console.log(`✓ ${OUT_DIR}/${name}.jpg + .webp`);

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
  // Promo tile: the store wants exactly 440x280, JPEG or 24-bit PNG. Rendered
  // at 2x like the shots, then downscaled straight into the store directory.
  {
    const src = resolve('scripts/shots/promo-tile.html');
    const png = join(work, 'promo-tile.png');
    await execFileP(
      CHROME,
      [
        '--headless=new',
        '--disable-gpu',
        '--hide-scrollbars',
        '--no-first-run',
        '--disable-extensions',
        `--user-data-dir=${join(work, 'profile-promo-tile')}`,
        `--screenshot=${png}`,
        '--window-size=440,280',
        '--force-device-scale-factor=2',
        `file://${src}`,
      ],
      { timeout: 30_000 },
    );
    const tile = `${STORE_DIR}/promo-tile.jpg`;
    await sharp(png)
      .resize(440, 280, { fit: 'cover' })
      .flatten({ background: '#f2f0ea' })
      .jpeg({ quality: 92 })
      .toFile(tile);
    console.log(`✓ ${tile} (440x280)`);
  }
} finally {
  await rm(work, { recursive: true, force: true });
}
console.log('Shots rendered.');
