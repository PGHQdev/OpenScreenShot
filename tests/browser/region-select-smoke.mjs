// Headless browser smoke for the region-selection overlay's rendering path.
//
// src/content/region-select.ts is injected into an arbitrary host page via
// chrome.scripting.executeScript, which serializes selectRegion() with
// toString() and drops its closure. That makes it directly callable: this
// smoke transpiles the file with the esbuild that ships inside vite (no new
// dependency, no dist/ build step), drops the result into a blank page, and
// calls it. No chrome.* stub is needed — the function touches none.
//
// Under test is the layered chrome the editor canvas cannot share, because a
// content script cannot read the extension's CSS custom properties from the
// host page: a dashed black border, a solid white outline offset 1px outside
// it, both sitting over a cutout box-shadow that dims the rest of the page.
// The claim is that this composites into something that stays visible over
// page content of any lightness, so every assertion runs twice — against a
// white host page and a black one — and names which layer carries the
// contrast in each case.
//
// Run with: npm run smoke:region
import { readFile } from 'node:fs/promises';
import { mkdtemp, rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const SOURCE = join(ROOT, 'src/content/region-select.ts');
const CHROME =
  process.env.CHROME_BIN ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

// The drag that draws the selection, and the viewport it happens in. Every
// sampled coordinate below is derived from these, never hardcoded twice.
const VIEW = { width: 1000, height: 700 };
const DRAG = { x1: 100, y1: 100, x2: 400, y2: 300 };
// Sample along the top edge, in an x span clear of both corner handles (which
// straddle x1 and x2) and of the W×H readout (which starts at x1).
const SCAN = { x0: DRAG.x1 + 100, x1: DRAG.x1 + 200 };
const SCAN_WIDTH = SCAN.x1 - SCAN.x0 + 1;

let stepNo = 0;
function step(message) {
  stepNo += 1;
  console.log(`[${stepNo}] ${message}`);
}

function assert(condition, message) {
  if (!condition) throw new Error(`assertion failed: ${message}`);
  console.log(`    ok: ${message}`);
}

/** Same resolution walk as the other smokes — puppeteer-core lives in mcp/. */
async function loadPuppeteer() {
  let dir = ROOT;
  for (;;) {
    const pkg = join(dir, 'mcp', 'node_modules', 'puppeteer-core', 'package.json');
    try {
      const manifest = JSON.parse(await readFile(pkg, 'utf8'));
      const entry = join(dirname(pkg), manifest.exports['.'].import);
      return (await import(pathToFileURL(entry).href)).default;
    } catch {
      const parent = dirname(dir);
      if (parent === dir) break;
      dir = parent;
    }
  }
  const require = createRequire(import.meta.url);
  return (await import(pathToFileURL(require.resolve('puppeteer-core')).href)).default;
}

/** TS -> a page-injectable IIFE that hangs selectRegion off window.__rs. */
async function transpileSource() {
  const { transformWithEsbuild } = await import('vite');
  const source = await readFile(SOURCE, 'utf8');
  const { code } = await transformWithEsbuild(source, SOURCE, {
    loader: 'ts',
    format: 'iife',
    globalName: '__rs',
  });
  return code;
}

/**
 * Screenshot the viewport and return a sampler over raw RGBA. Thresholds match
 * editor-keyboard-smoke.mjs: "near" black/white, so a dash's antialiased edge
 * does not read as a missing layer.
 */
async function samplePage(page) {
  const sharp = createRequire(join(ROOT, 'package.json'))('sharp');
  const shot = await page.screenshot({ type: 'png' });
  const { data, info } = await sharp(shot)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const at = (x, y) => {
    const i = (y * info.width + x) * info.channels;
    return [data[i], data[i + 1], data[i + 2]];
  };
  // Counts across the scan span of one row: how many pixels read as near-black,
  // near-white, and as the dimmed host page (the cutout's 40% black wash).
  const row = (y, dimOf) => {
    let black = 0;
    let white = 0;
    let dim = 0;
    for (let x = SCAN.x0; x <= SCAN.x1; x++) {
      const [r, g, b] = at(x, y);
      if (r < 40 && g < 40 && b < 40) black += 1;
      if (r > 215 && g > 215 && b > 215) white += 1;
      if (Math.abs(r - dimOf) < 6 && Math.abs(g - dimOf) < 6 && Math.abs(b - dimOf) < 6) dim += 1;
    }
    return { black, white, dim };
  };
  // Counts over a box, for the corner handles (white disc, black ring).
  const box = (x0, y0, x1, y1) => {
    let black = 0;
    let white = 0;
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const [r, g, b] = at(x, y);
        if (r < 40 && g < 40 && b < 40) black += 1;
        if (r > 215 && g > 215 && b > 215) white += 1;
      }
    }
    return { black, white };
  };
  return { at, row, box };
}

/** Load a blank host page of one flat colour and draw the selection on it. */
async function drawSelection(page, code, background) {
  await page.setContent(
    `<style>html,body{margin:0;height:100%;background:${background};}</style><body></body>`,
    { waitUntil: 'load' },
  );
  await page.addScriptTag({ content: code });
  await page.evaluate(() => {
    globalThis.__done = null;
    globalThis.__rs.selectRegion().then((r) => {
      globalThis.__done = { value: r };
    });
  });
  await page.mouse.move(DRAG.x1, DRAG.y1);
  await page.mouse.down();
  await page.mouse.move(DRAG.x2, DRAG.y2, { steps: 8 });
  await page.mouse.up();
  await new Promise((done) => setTimeout(done, 120));
}

async function main() {
  step('transpiling src/content/region-select.ts with vite’s esbuild');
  const code = await transpileSource();
  assert(
    code.includes('outline-offset') && code.includes('9999px'),
    'the transpiled bundle carries the overlay’s layered chrome',
  );

  const puppeteer = await loadPuppeteer();
  const work = await mkdtemp(join(tmpdir(), 'oss-region-smoke-'));

  let browser = null;
  try {
    browser = await puppeteer.launch({
      executablePath: CHROME,
      headless: true,
      userDataDir: join(work, 'profile'),
      args: ['--no-first-run', '--no-default-browser-check', '--disable-gpu'],
    });
    const page = await browser.newPage();
    const crashes = [];
    page.on('pageerror', (err) => crashes.push(String(err)));
    await page.setViewport({ ...VIEW, deviceScaleFactor: 1 });

    // ---- White host page: the black layer is the one that has to carry it ----
    step('drawing a selection over a white host page');
    await drawSelection(page, code, '#ffffff');
    const white = await samplePage(page);

    step('the cutout composited: the page dims outside the rectangle, stays clear inside');
    // 40% black over #fff -> 153. Well above the selection, and well inside it.
    const outsideWhite = white.row(DRAG.y1 - 40, 153);
    const insideWhite = white.row(DRAG.y1 + 10, 153);
    assert(
      outsideWhite.dim === SCAN_WIDTH,
      `outside the rectangle every sampled pixel is dimmed to ~153 (${outsideWhite.dim}/${SCAN_WIDTH})`,
    );
    assert(
      insideWhite.white === SCAN_WIDTH && insideWhite.dim === 0,
      `inside the rectangle every sampled pixel is undimmed page (${insideWhite.white}/${SCAN_WIDTH} white, ${insideWhite.dim} dimmed)`,
    );

    step('the dashed border layer rendered, and rendered dashed');
    // Scan the rows the border box can occupy and find the one carrying dashes:
    // partial coverage is the signature of "dashed", full coverage would mean a
    // solid border and zero would mean no border at all.
    let dashRow = null;
    for (let y = DRAG.y1 - 4; y <= DRAG.y1 + 4; y++) {
      const r = white.row(y, 153);
      if (r.black > 0 && r.black < SCAN_WIDTH && (dashRow === null || r.black > dashRow.black)) {
        dashRow = { y, ...r };
      }
    }
    assert(
      dashRow !== null,
      'a row on the top edge carries near-black pixels over the white page (the dashed border)',
    );
    assert(
      dashRow.black > SCAN_WIDTH * 0.2 && dashRow.black < SCAN_WIDTH * 0.9,
      `that row is dashed, not solid: ${dashRow.black}/${SCAN_WIDTH} near-black at y=${dashRow.y}`,
    );

    step('the white outline layer sits offset outside the border, with a gap between');
    // On white the outline reads as white-on-dim; the gap row between outline
    // and border is the only thing proving outline-offset composited, so find
    // the outline row and require the row under it to be neither layer.
    let outlineWhiteRow = null;
    for (let y = DRAG.y1 - 6; y < dashRow.y; y++) {
      if (white.row(y, 153).white === SCAN_WIDTH) outlineWhiteRow = y;
    }
    assert(
      outlineWhiteRow !== null,
      `a fully solid white row sits above the dashes at y=${outlineWhiteRow} (the 1px outline)`,
    );
    const gapWhite = white.row(outlineWhiteRow + 1, 153);
    assert(
      gapWhite.white === 0 && gapWhite.black === 0,
      `the row between outline and border is neither layer — outline-offset composited (${gapWhite.white} white, ${gapWhite.black} black)`,
    );

    step('the corner handle is two-tone over the white page');
    // ne handle: 13px box whose left edge is the rectangle's right edge.
    const handleWhite = white.box(DRAG.x2, DRAG.y1 - 6, DRAG.x2 + 12, DRAG.y1 + 6);
    assert(
      handleWhite.black > 20 && handleWhite.white > 20,
      `the handle carries both tones over white (${handleWhite.black} near-black, ${handleWhite.white} near-white)`,
    );

    step('the overlay resolves with the drawn rectangle');
    await page.keyboard.press('Enter');
    await new Promise((done) => setTimeout(done, 80));
    const confirmed = await page.evaluate(() => globalThis.__done);
    assert(
      confirmed?.value?.x === DRAG.x1 &&
        confirmed?.value?.y === DRAG.y1 &&
        confirmed?.value?.width === DRAG.x2 - DRAG.x1 &&
        confirmed?.value?.height === DRAG.y2 - DRAG.y1,
      `Enter resolves the real drag geometry ${JSON.stringify(confirmed?.value)}`,
    );
    assert(
      (await page.evaluate(() => document.body.children.length)) === 0,
      'the overlay root is removed from the host page on finish',
    );

    // ---- Black host page: now the white layer is the one that has to carry it ----
    step('drawing the same selection over a black host page');
    await drawSelection(page, code, '#000000');
    const black = await samplePage(page);

    step('the two-tone adapts: the white layer carries the contrast here');
    let outlineBlackRow = null;
    for (let y = DRAG.y1 - 6; y <= DRAG.y1 + 4; y++) {
      if (black.row(y, 0).white === SCAN_WIDTH) outlineBlackRow = y;
    }
    assert(
      outlineBlackRow !== null,
      `a fully solid white row is visible on the black page at y=${outlineBlackRow}, where the dashed black border is not`,
    );
    assert(
      outlineBlackRow === outlineWhiteRow,
      `it is the same outline row as on the white page (y=${outlineBlackRow}), so one mechanism serves both`,
    );
    const insideBlack = black.row(DRAG.y1 + 10, 0);
    assert(
      insideBlack.black === SCAN_WIDTH,
      `the cutout still clears the interior on black (${insideBlack.black}/${SCAN_WIDTH})`,
    );

    step('the corner handle is two-tone over the black page');
    const handleBlack = black.box(DRAG.x2, DRAG.y1 - 6, DRAG.x2 + 12, DRAG.y1 + 6);
    assert(
      handleBlack.black > 20 && handleBlack.white > 20,
      `the handle carries both tones over black (${handleBlack.black} near-black, ${handleBlack.white} near-white)`,
    );

    step('Escape cancels');
    await page.keyboard.press('Escape');
    await new Promise((done) => setTimeout(done, 80));
    const cancelled = await page.evaluate(() => globalThis.__done);
    assert(cancelled?.value === null, 'Escape resolves null');

    assert(crashes.length === 0, `no uncaught page errors ${crashes.join('; ')}`);
    console.log('\nRegion select smoke passed.');
  } finally {
    if (browser) await browser.close();
    await rm(work, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error(`\nRegion select smoke FAILED: ${err.message}`);
  process.exitCode = 1;
});
