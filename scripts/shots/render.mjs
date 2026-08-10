// Renders the marketing shots (docs/assets/shot-N.{jpg,webp}) from the poster
// pages in this directory, using headless Chrome + sharp.
// Run with: npm run shots
import sharp from 'sharp';
import { execFile } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { promisify } from 'node:util';

const run = execFile;
const execFileP = promisify(run);

const CHROME =
  process.env.CHROME_BIN ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUT_DIR = 'docs/assets';
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
  }
} finally {
  await rm(work, { recursive: true, force: true });
}
console.log('Shots rendered.');
