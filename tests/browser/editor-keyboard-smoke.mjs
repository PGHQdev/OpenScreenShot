// Headless browser smoke for the editor's keyboard model: serves the built
// `dist/`, stubs `chrome` with a seeded capture, and drives create, select,
// move, resize, crop and export with no pointing device.
//
// Unit tests cover the pure model (tests/unit/editor-keyboard.test.ts,
// editor-history.test.ts). What they cannot reach is the pairing of each piece
// of state with the ref that mirrors it: Preact flushes effects a frame after
// the commit, so a ref synced from an effect is stale to anything that repeats
// faster than a frame, and every failure that causes is silent. Steps 4, 5 and
// 6 below are that pairing, re-driven at keyboard speed.
// Run with: npm run build && npm run smoke:editor
import { createReadStream } from 'node:fs';
import { mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const DIST = join(ROOT, 'dist');
const PAGE = '/src/editor/index.html';
const CHROME =
  process.env.CHROME_BIN ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

let stepNo = 0;
function step(message) {
  stepNo += 1;
  console.log(`\n[${stepNo}] ${message}`);
}

function assert(condition, message) {
  if (!condition) throw new Error(`assertion failed: ${message}`);
  console.log(`    ok: ${message}`);
}

/** Same resolution walk as recorder-smoke.mjs — puppeteer-core lives in mcp/. */
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

function serveDist() {
  const server = createServer((req, res) => {
    const path = decodeURIComponent((req.url ?? '/').split('?')[0]);
    const file = join(DIST, path);
    if (!file.startsWith(DIST)) {
      res.writeHead(403).end();
      return;
    }
    stat(file)
      .then((info) => {
        if (!info.isFile()) throw new Error('not a file');
        res.writeHead(200, {
          'content-type': MIME[extname(file)] ?? 'application/octet-stream',
          'content-length': info.size,
        });
        createReadStream(file).pipe(res);
      })
      .catch(() => res.writeHead(404).end('not found'));
  });
  return new Promise((done) => {
    server.listen(0, '127.0.0.1', () => done(server));
  });
}

/** storage.local seeded with one capture, plus a downloads sink for the export. */
function installChromeStub(seed) {
  const store = new Map(Object.entries(seed));
  globalThis.__smoke = { downloads: [] };
  globalThis.chrome = {
    runtime: { id: 'smoke', getURL: (p) => '/' + String(p).replace(/^\//, '') },
    action: { setBadgeText() {}, setBadgeBackgroundColor() {} },
    downloads: {
      download: async (opts) => {
        globalThis.__smoke.downloads.push({ filename: opts.filename, bytes: opts.url.length });
        return 1;
      },
    },
    storage: {
      local: {
        get: async (key) => (store.has(key) ? { [key]: store.get(key) } : {}),
        set: async (items) => {
          for (const [k, v] of Object.entries(items)) store.set(k, v);
        },
        remove: async (key) => void store.delete(key),
        getBytesInUse: async () => 0,
      },
      onChanged: { addListener() {}, removeListener() {} },
    },
  };
}

/**
 * Watch the live region. Two things are under test here: that the node is
 * mutated rather than replaced, and that a message repeated verbatim still
 * produces a mutation — an identical string is not a state change, and a region
 * that does not change announces nothing.
 */
function watchLiveRegion() {
  const el = document.querySelector('[aria-live="polite"][role="status"]');
  globalThis.__live = { el, records: [] };
  new MutationObserver((rs) => {
    for (const r of rs) globalThis.__live.records.push({ type: r.type, text: el.textContent });
  }).observe(el, { childList: true, characterData: true, subtree: true });
}

/** A solid PNG at a known size, so every announced coordinate is checkable. */
async function makeCapture() {
  const sharp = createRequire(join(ROOT, 'package.json'))('sharp');
  const png = await sharp({
    create: { width: 800, height: 600, channels: 3, background: { r: 60, g: 110, b: 190 } },
  })
    .png()
    .toBuffer();
  return {
    dataUrl: `data:image/png;base64,${png.toString('base64')}`,
    width: 800,
    height: 600,
    mode: 'visible',
    title: 'keyboard smoke',
    capturedAt: Date.now(),
  };
}

async function main() {
  const built = await stat(join(DIST, PAGE.slice(1))).then(
    () => true,
    () => false,
  );
  if (!built) throw new Error(`${DIST}${PAGE} is missing — run "npm run build" first`);

  const puppeteer = await loadPuppeteer();
  const work = await mkdtemp(join(tmpdir(), 'oss-editor-smoke-'));
  const server = await serveDist();
  const base = `http://127.0.0.1:${server.address().port}`;
  console.log(`serving dist/ on ${base}`);

  let browser = null;
  try {
    browser = await puppeteer.launch({
      executablePath: CHROME,
      headless: true,
      userDataDir: join(work, 'profile'),
      args: ['--no-first-run', '--no-default-browser-check', '--disable-gpu'],
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 860 });
    const crashes = [];
    page.on('pageerror', (err) => crashes.push(String(err)));
    page.on('console', (msg) => {
      if (msg.type() === 'error') console.log(`    console.error: ${msg.text()}`);
    });
    await page.evaluateOnNewDocument(installChromeStub, {
      'openscreenshot:last-capture': await makeCapture(),
    });
    await page.goto(`${base}${PAGE}`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('.stage-canvas');
    // The controller fits the image on load; interactions dispatched sooner
    // are dropped (see the editor smoke notes).
    await new Promise((r) => setTimeout(r, 900));
    await page.evaluate(watchLiveRegion);

    const say = () =>
      page.evaluate(() =>
        document.querySelector('[aria-live="polite"][role="status"]').textContent.trim(),
      );
    const count = () =>
      page.evaluate(() => document.querySelector('.toolbar-count span')?.textContent ?? '0');
    const onCanvas = () =>
      page.evaluate(() => document.activeElement === document.querySelector('.stage-canvas'));
    const records = () => page.evaluate(() => globalThis.__live.records);
    const settle = (ms = 150) => new Promise((r) => setTimeout(r, ms));
    async function chord(mods, key) {
      for (const m of mods) await page.keyboard.down(m);
      await page.keyboard.press(key);
      for (const m of mods.slice().reverse()) await page.keyboard.up(m);
    }

    step('the canvas is named, described and reachable, and does not trap focus');
    const canvas = await page.evaluate(() => {
      const c = document.querySelector('.stage-canvas');
      return {
        role: c.getAttribute('role'),
        tabindex: c.getAttribute('tabindex'),
        label: c.getAttribute('aria-label'),
        fallback: c.textContent.replace(/\s+/g, ' ').trim(),
      };
    });
    assert(
      canvas.role === 'application' && canvas.tabindex === '0',
      'role=application, tabindex=0',
    );
    assert(/800 by 600 pixels/.test(canvas.label), 'aria-label carries the image size');
    assert(/bracket/.test(canvas.fallback), 'fallback content describes the key model');
    let hops = 0;
    for (; hops < 40; hops++) {
      await page.keyboard.press('Tab');
      if (await onCanvas()) break;
    }
    assert(await onCanvas(), `Tab reaches the canvas (${hops + 1} presses)`);
    await page.keyboard.press('Tab');
    assert(!(await onCanvas()), 'Tab moves focus off again — the canvas is not a trap');
    await chord(['Shift'], 'Tab');
    assert(await onCanvas(), 'Shift+Tab brings it back');

    step('the live region is polite, atomic, rendered and empty at rest');
    const region = await page.evaluate(() => {
      const el = document.querySelector('[aria-live="polite"][role="status"]');
      const cs = getComputedStyle(el);
      return {
        live: el.getAttribute('aria-live'),
        atomic: el.getAttribute('aria-atomic'),
        hidden: el.getAttribute('aria-hidden'),
        display: cs.display,
        text: el.textContent,
      };
    });
    assert(region.live === 'polite' && region.atomic === 'true', 'aria-live=polite, atomic');
    assert(region.hidden === null && region.display !== 'none', 'not hidden from the a11y tree');
    assert(region.text === '', 'empty at rest, so the first message is a change');

    step('a tool letter followed straight by Enter places a layer');
    // No round-trip between the two: this is the pairing of `tool` with toolRef,
    // and a frame-late ref makes Enter place nothing at all, silently.
    await page.keyboard.press('r');
    await page.keyboard.press('Enter');
    await settle();
    assert((await count()) === '1', 'the rectangle landed');
    assert(/^Rectangle added at \d+, \d+\.$/.test(await say()), `announced: "${await say()}"`);
    assert(
      !(await page.$eval('[aria-label="Delete selected"]', (b) => b.disabled)),
      'the topbar Delete button is reachable — selection came from the keyboard',
    );

    step('a held arrow keeps every repeat, and is one undo step');
    const posOf = async () =>
      (await say())
        .match(/to (-?\d+), (-?\d+)/)
        .slice(1)
        .map(Number);
    const start = (await say())
      .match(/at (-?\d+), (-?\d+)/)
      .slice(1)
      .map(Number);
    await page.keyboard.down('ArrowRight');
    await page.keyboard.down('ArrowRight');
    await page.keyboard.down('ArrowRight');
    await page.keyboard.up('ArrowRight');
    await settle();
    const held = await posOf();
    assert(held[0] - start[0] === 3, `three repeats moved 3px (${start[0]} -> ${held[0]})`);
    await chord(['Meta'], 'z');
    await settle();
    await page.keyboard.press(']');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowRight');
    await settle();
    assert((await posOf())[0] === start[0], 'one undo returned the whole held run');

    step('separate presses are separate undo steps, and each undo announces');
    // Undo clears the selection, so the position is read back by re-selecting
    // and nudging one pixel each way — a net zero move that announces where the
    // layer actually is.
    const readBack = async () => {
      await page.keyboard.press(']');
      await page.keyboard.press('ArrowLeft');
      await page.keyboard.press('ArrowRight');
      await settle(60);
      return (await posOf())[0];
    };
    const anchor = await readBack();
    const before = (await records()).length;
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press('ArrowRight');
      await settle(40);
    }
    assert((await posOf())[0] === anchor + 3, 'three separate presses moved 3px');
    for (let i = 0; i < 3; i++) {
      await chord(['Meta'], 'z');
      await settle(60);
    }
    // Three identical sentences in a row. Without the alternating write in
    // `say`, only the first of them would reach the region at all.
    const undos = (await records()).slice(before).filter((r) => /^Undo\./.test(r.text.trim()));
    const ones = undos.filter((r) => r.text.trim() === 'Undo. 1 annotation.');
    assert(
      ones.length === 3,
      `three identical "Undo. 1 annotation." messages each produced a mutation (${ones.length})`,
    );
    assert((await readBack()) === anchor, 'three undos walked back exactly three one-pixel steps');

    step('a crop opened by Enter can be cancelled in the same frame');
    // No round-trip between the three: this is the pairing of `cropActive` with
    // the ref the Escape handler reads to decide what Escape means.
    await page.keyboard.press('c');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Escape');
    await settle();
    assert((await say()) === 'Crop cancelled.', 'Escape reached the crop it had just opened');
    assert((await page.$('.crop-confirm')) === null, 'the confirm bar went away');

    step('the crop rect moves, clamps and keeps announcing');
    await page.keyboard.press('Enter');
    await settle();
    assert((await say()) === 'Crop 800 by 600 pixels at 0, 0.', 'the crop covers the whole image');
    await chord(['Alt', 'Shift'], 'ArrowLeft');
    await settle();
    assert((await say()) === 'Crop 790 by 600 pixels at 0, 0.', 'Alt+Shift+Left trims 10px');
    const clampBefore = (await records()).length;
    for (let i = 0; i < 3; i++) {
      await chord(['Alt', 'Shift'], 'ArrowRight');
      await settle(40);
    }
    assert((await say()) === 'Crop 800 by 600 pixels at 0, 0.', 'the rect stops at the image edge');
    assert(
      (await records()).length - clampBefore === 3,
      'each press at the edge still announced — silence would read as "key ignored"',
    );

    step('a crop applied by Enter resizes the document');
    for (let i = 0; i < 5; i++) {
      await chord(['Alt', 'Shift'], 'ArrowLeft');
      await settle(40);
    }
    await page.keyboard.press('Enter');
    await settle(300);
    assert((await say()) === 'Cropped to 750 by 600 pixels.', 'the crop applied and announced');
    assert(
      (await page.$eval('.statusbar span', (s) => s.textContent)) === '750 × 600px',
      'the status bar shows the new size',
    );

    step('the text overlay hands focus back to the canvas');
    await page.keyboard.press('t');
    await page.keyboard.press('Enter');
    await page.waitForSelector('textarea.text-overlay');
    await page.keyboard.type('note');
    await page.keyboard.press('Enter');
    await settle(200);
    assert((await page.$('textarea.text-overlay')) === null, 'Enter closed the overlay');
    assert(await onCanvas(), 'focus is back on the canvas, not on <body>');

    step('resize, then export, all from the keyboard');
    await page.keyboard.press('v');
    await page.keyboard.press(']');
    await settle();
    const sizeOf = async () =>
      (await say())
        .match(/to (\d+) by (\d+)/)
        .slice(1)
        .map(Number);
    await chord(['Alt'], 'ArrowRight');
    const s1 = await sizeOf();
    await chord(['Alt', 'Shift'], 'ArrowRight');
    const s2 = await sizeOf();
    assert(s2[0] - s1[0] === 10, `Alt+Shift+Right widens by 10px (${s1[0]} -> ${s2[0]})`);
    await chord(['Meta'], 's');
    await page.waitForSelector('.modal');
    await page.waitForFunction(() =>
      document.querySelector('.modal').contains(document.activeElement),
    );
    await chord(['Shift'], 'Tab');
    assert(
      await page.evaluate(() => document.activeElement.matches('.modal .btn-primary')),
      'Shift+Tab lands on the Export button',
    );
    await page.keyboard.press('Enter');
    await settle(800);
    const downloads = await page.evaluate(() => globalThis.__smoke.downloads);
    assert(
      downloads.length === 1 && downloads[0].filename.endsWith('.png') && downloads[0].bytes > 1000,
      `a PNG was exported (${downloads[0]?.filename}, ${downloads[0]?.bytes} bytes)`,
    );

    step('every announcement was a text edit inside the one region node');
    const live = await page.evaluate(() => ({
      same: globalThis.__live.el === document.querySelector('[aria-live="polite"][role="status"]'),
      kinds: [...new Set(globalThis.__live.records.map((r) => r.type))],
      total: globalThis.__live.records.length,
    }));
    assert(live.same, 'the region is the same element it was at the start');
    assert(
      live.kinds.every((k) => k === 'characterData' || k === 'childList'),
      `mutations were text edits (${live.kinds.join(', ')})`,
    );
    assert(live.total >= 25, `${live.total} mutations in all`);

    assert(crashes.length === 0, `no page errors (${crashes.join(' | ') || 'none'})`);
    console.log('\nALL STEPS PASSED');
  } finally {
    if (browser) await browser.close();
    server.close();
    await rm(work, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error(`\nFAILED: ${err.message}`);
  process.exitCode = 1;
});
