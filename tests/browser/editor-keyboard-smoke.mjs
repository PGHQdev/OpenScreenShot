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
        // Step 10a below flips this on to drive the export dialog's failure
        // path (role="alert") without a pointing device or a real download
        // error — it self-resets so the smoke's real export later still lands.
        if (globalThis.__smoke.failNextDownload) {
          globalThis.__smoke.failNextDownload = false;
          throw new Error('smoke-forced export failure');
        }
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

    step('the style bar renders for every tool at a fixed height — no tool swap moves the canvas');
    // task-16's report measured a real ~39px pump on this exact loop, back
    // when .stylebar unmounted for Select/Crop and had no min-height. The
    // property under test is "0px", not today's pixel height (task-16
    // review) — a future deliberate restyle should not have to come back
    // here and edit a pinned number.
    const rectOf = (sel) =>
      page.evaluate((s) => document.querySelector(s).getBoundingClientRect().toJSON(), sel);
    const barHeights = {};
    for (const t of ['V', 'R', 'A', 'L', 'P', 'H', 'T', 'S', 'B', 'O', 'I', 'C']) {
      await page.keyboard.press(t);
      await settle(60);
      const h = await page.evaluate(() => {
        const bar = document.querySelector('.stylebar');
        return bar ? bar.getBoundingClientRect().height : null;
      });
      barHeights[t] = h;
      assert(h !== null, `.stylebar is rendered for tool "${t}" (not unmounted)`);
    }
    console.log(`    style bar height per tool: ${JSON.stringify(barHeights)}`);
    const heightSet = new Set(Object.values(barHeights));
    assert(
      heightSet.size === 1,
      `every tool renders the style bar at the same height (saw: ${[...heightSet].join(', ')})`,
    );
    await page.keyboard.press('V');
    await settle(60);
    const canvasV1 = await rectOf('.stage-canvas');
    await page.keyboard.press('R');
    await settle(60);
    const canvasR = await rectOf('.stage-canvas');
    await page.keyboard.press('V');
    await settle(60);
    const canvasV2 = await rectOf('.stage-canvas');
    assert(
      canvasR.top === canvasV1.top && canvasR.height === canvasV1.height,
      `V -> R does not move the canvas (top ${canvasV1.top} -> ${canvasR.top}, height ${canvasV1.height} -> ${canvasR.height})`,
    );
    assert(
      canvasV2.top === canvasV1.top && canvasV2.height === canvasV1.height,
      `V -> R -> V moves the canvas by 0px (top delta ${canvasV2.top - canvasV1.top}, height delta ${canvasV2.height - canvasV1.height})`,
    );

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

    // The rest of this step targets specific fields by focusing them directly
    // rather than walking Tab stop by stop — still real keyboard input from
    // there (typing, Home/Shift+End to select, Tab to commit, Enter to
    // activate), just without re-deriving the tab order to reach each one.
    async function selectAllInField() {
      await page.keyboard.press('End');
      await page.keyboard.down('Shift');
      await page.keyboard.press('Home');
      await page.keyboard.up('Shift');
    }

    step('the Width field clamps on commit, not on every keystroke, and says so');
    // The notice paragraph must already be in the DOM, empty, before anything
    // is typed — a polite live region only announces reliably when the AT can
    // register it before its text changes; a region inserted with its message
    // already inside it is not what's being tested here (that shape belongs to
    // role="alert", tested separately below). Tag the node now so the later
    // assertion can prove the SAME node got new text, not a fresh one.
    const widthNoticeBefore = await page.evaluate(() => {
      const notice = document.querySelector('.field-notice');
      if (!notice) return null;
      notice.dataset.smokeTag = 'width-notice';
      return { role: notice.getAttribute('role'), text: notice.textContent };
    });
    assert(widthNoticeBefore !== null, 'the notice paragraph is already mounted, before any clamp');
    assert(widthNoticeBefore.role === 'status', 'it already carries role="status"');
    assert(widthNoticeBefore.text === '', 'and starts empty — nothing to announce yet');
    await page.$eval('.num-input-wide', (el) => el.focus());
    await selectAllInField();
    await page.keyboard.type('99999');
    await settle();
    const midWidth = await page.evaluate(() => ({
      value: document.querySelector('.num-input-wide').value,
      noticeText: document.querySelector('.field-notice')?.textContent ?? null,
    }));
    assert(midWidth.value === '99999', 'the field shows the raw typed text while still focused');
    assert(midWidth.noticeText === '', 'no clamp notice yet — nothing has been committed');
    await page.keyboard.press('Tab');
    await settle();
    const afterWidth = await page.evaluate(() => {
      const input = document.querySelector('.num-input-wide');
      const notice = document.querySelector('.field-notice');
      return {
        value: input.value,
        max: input.max,
        noticeText: notice?.textContent ?? null,
        sameNode: notice?.dataset.smokeTag === 'width-notice',
      };
    });
    assert(
      afterWidth.value === afterWidth.max,
      `99999 clamped to the declared ceiling on blur (${afterWidth.value})`,
    );
    assert(
      afterWidth.noticeText !== null && /clamp/i.test(afterWidth.noticeText),
      `a clamp notice explains it: "${afterWidth.noticeText}"`,
    );
    assert(
      afterWidth.sameNode,
      'the same node got the new text — a polite region announces by mutation, not by being inserted with text already set',
    );

    step('PDF format exposes Page size / Orientation, each carrying aria-pressed');
    const segmentedRowButtons = (rowLabel) =>
      page.evaluate((label) => {
        const row = [...document.querySelectorAll('.modal-row')].find(
          (r) => r.querySelector('.field-label')?.textContent === label,
        );
        return row
          ? [...row.querySelectorAll('.segmented-btn')].map((b) => ({
              label: b.textContent.trim(),
              pressed: b.getAttribute('aria-pressed'),
              selected: b.classList.contains('is-selected'),
            }))
          : [];
      }, rowLabel);
    await page.$eval('.format-grid .format-card:last-child', (el) => el.focus());
    await page.keyboard.press('Enter');
    await settle();
    const beforeSize = await segmentedRowButtons('Page size');
    assert(
      beforeSize.find((b) => b.label === 'A4')?.pressed === 'true' &&
        beforeSize.find((b) => b.label === 'A4')?.selected,
      'A4 starts pressed and .is-selected',
    );
    assert(
      beforeSize.find((b) => b.label === 'Letter')?.pressed === 'false',
      'Letter starts unpressed',
    );
    await page.evaluate((label) => {
      const row = [...document.querySelectorAll('.modal-row')].find(
        (r) => r.querySelector('.field-label')?.textContent === label,
      );
      row?.querySelectorAll('.segmented-btn')[1]?.focus(); // A4, Letter, Full — index 1 is Letter
    }, 'Page size');
    await page.keyboard.press('Enter');
    await settle();
    const afterSize = await segmentedRowButtons('Page size');
    assert(
      afterSize.find((b) => b.label === 'Letter')?.pressed === 'true' &&
        afterSize.find((b) => b.label === 'Letter')?.selected,
      'Enter on Letter flips it to pressed and .is-selected',
    );
    assert(
      afterSize.find((b) => b.label === 'A4')?.pressed === 'false' &&
        !afterSize.find((b) => b.label === 'A4')?.selected,
      'A4 drops both aria-pressed and .is-selected',
    );

    step('the Margin field enforces its declared 0-40mm range, and says so');
    await page.$eval('.check-row .num-input', (el) => el.focus());
    await selectAllInField();
    await page.keyboard.type('99');
    await settle();
    const midMargin = await page.evaluate(
      () => document.querySelector('.check-row .num-input').value,
    );
    assert(midMargin === '99', 'the margin field shows the raw typed text while still focused');
    // Same always-mounted check as the Width field above: tag the notice
    // node before the clamp fires, then prove the tagged node is the one
    // that ends up holding the message.
    const marginNoticeBefore = await page.evaluate(() => {
      const notice = document.querySelector('.field-notice');
      if (!notice) return null;
      notice.dataset.smokeTag = 'margin-notice';
      return { role: notice.getAttribute('role'), text: notice.textContent };
    });
    assert(
      marginNoticeBefore !== null,
      'the margin notice paragraph is already mounted, before any clamp',
    );
    assert(marginNoticeBefore.role === 'status', 'it already carries role="status"');
    assert(marginNoticeBefore.text === '', 'and starts empty — nothing to announce yet');
    await page.keyboard.press('Tab');
    await settle();
    const afterMargin = await page.evaluate(() => {
      const input = document.querySelector('.check-row .num-input');
      const notice = document.querySelector('.field-notice');
      return {
        value: input.value,
        max: input.max,
        noticeText: notice?.textContent ?? null,
        sameNode: notice?.dataset.smokeTag === 'margin-notice',
      };
    });
    assert(
      afterMargin.value === afterMargin.max,
      `99mm refused — clamped to the declared max on blur (${afterMargin.value}mm)`,
    );
    assert(
      afterMargin.noticeText !== null && /clamp/i.test(afterMargin.noticeText),
      `a clamp notice explains it: "${afterMargin.noticeText}"`,
    );
    assert(
      afterMargin.sameNode,
      'the same node got the new text — a polite region announces by mutation, not by being inserted with text already set',
    );

    step('an export failure renders role="alert", and repeating it still re-announces');
    await page.evaluate(() => {
      globalThis.__smoke.failNextDownload = true;
    });
    await page.$eval('.modal .btn-primary', (el) => el.focus());
    await page.keyboard.press('Enter');
    await settle(500);
    const err1 = await page.evaluate(() => {
      const el = document.querySelector('.export-error');
      if (!el) return null;
      el.dataset.smokeTag = 'first';
      return { text: el.textContent, role: el.getAttribute('role') };
    });
    assert(err1 !== null, 'the export error renders on failure');
    assert(err1.role === 'alert', 'it carries role="alert"');
    assert(err1.text.length > 0, 'it has text');
    await page.evaluate(() => {
      globalThis.__smoke.failNextDownload = true;
    });
    await page.$eval('.modal .btn-primary', (el) => el.focus());
    await page.keyboard.press('Enter');
    await settle(500);
    const err2 = await page.evaluate(() => {
      const el = document.querySelector('.export-error');
      return el ? { text: el.textContent, sameNode: el.dataset.smokeTag === 'first' } : null;
    });
    assert(err2 !== null, 'a second identical failure renders the error again');
    assert(err2.text === err1.text, 'the message text is identical both times');
    assert(
      !err2.sameNode,
      'the alert unmounted and remounted between attempts, so an identical message re-announces',
    );
    assert(
      (await page.evaluate(() => globalThis.__smoke.downloads.length)) === 0,
      'both forced failures produced no download',
    );

    step('back to PNG for the real export');
    await page.$eval('.format-grid .format-card:first-child', (el) => el.focus());
    await page.keyboard.press('Enter');
    await settle();
    await page.$eval('.modal .btn-primary', (el) => el.focus());
    await page.keyboard.press('Enter');
    await settle(800);
    const downloads = await page.evaluate(() => globalThis.__smoke.downloads);
    assert(
      downloads.length === 1 && downloads[0].filename.endsWith('.png') && downloads[0].bytes > 1000,
      `a PNG was exported (${downloads[0]?.filename}, ${downloads[0]?.bytes} bytes)`,
    );

    // The two menus below sit in the topbar, independent of tool/selection
    // state, so they're driven last — after every canvas-dependent step —
    // to keep this section self-contained.
    const beautifyTrigger = '.beautify-menu > .btn-secondary';
    const zoomTrigger = '.zoom-trigger';
    const activeElementIs = (sel) =>
      page.evaluate((s) => document.activeElement === document.querySelector(s), sel);
    // Deliberately a non-focusable target (a plain <span> in the footer,
    // no tabindex): clicking something that itself takes focus natively
    // would mask a "restores focus to the trigger" regression — the
    // browser's own click-to-focus would land on the clicked element
    // regardless of what the popover's own mousedown handler does. Only a
    // click that grabs no focus of its own proves the handler isn't
    // stealing it back.
    const outsideClick = async () => {
      const box = await page.$eval('.statusbar', (el) => {
        const r = el.getBoundingClientRect();
        return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
      });
      await page.mouse.click(box.x, box.y);
    };
    // A real pointer click at an element's own coordinates — as distinct
    // from page.$eval(...).focus() + Enter, which is keyboard activation and
    // never dispatches mousedown/mouseup/click at all. The Beautify
    // click-open trap (task-19 fix round 2) was invisible to every assertion
    // in this file until it opened panels this way, because only a real
    // click exercises the trigger's onMouseDown/onClick pointer-intent
    // tracking.
    const boxOf = async (sel) =>
      page.$eval(sel, (el) => {
        const r = el.getBoundingClientRect();
        return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
      });
    const clickOpen = async (sel) => {
      const box = await boxOf(sel);
      await page.mouse.click(box.x, box.y);
    };

    step('the Beautify popover is a non-modal dialog: no aria-modal, no trap, and initial focus');
    await page.$eval(beautifyTrigger, (el) => el.focus());
    await page.keyboard.press('Enter');
    await settle();
    const beautifyOpen = await page.evaluate(() => {
      const panel = document.querySelector('.beautify-popover');
      const first = panel?.querySelector('input, button, select, textarea') ?? null;
      return {
        role: panel?.getAttribute('role') ?? null,
        modal: panel?.getAttribute('aria-modal') ?? null,
        activeIsFirst: document.activeElement === first,
      };
    });
    assert(beautifyOpen.role === 'dialog', 'keeps role="dialog"');
    assert(
      beautifyOpen.modal === null,
      'no aria-modal — the panel stays perceivable while its sliders preview onto the canvas',
    );
    assert(beautifyOpen.activeIsFirst, 'opening the panel moves focus onto its first control');

    step('Escape closes the Beautify popover and returns focus to the trigger');
    await page.keyboard.press('Escape');
    await settle();
    assert((await page.$('.beautify-popover')) === null, 'Escape closed the panel');
    assert(await activeElementIs(beautifyTrigger), 'focus returned to the Beautify trigger');

    step('an outside pointer click closes the Beautify popover without stealing focus');
    await page.keyboard.press('Enter');
    await settle();
    assert((await page.$('.beautify-popover')) !== null, 'reopened for the outside-click check');
    await outsideClick();
    await settle();
    assert((await page.$('.beautify-popover')) === null, 'the outside click closed the panel');
    assert(
      !(await activeElementIs(beautifyTrigger)),
      'the outside click did not pull focus back to the Beautify trigger',
    );

    step("Tab off the panel's last control closes it — non-modal, so nothing traps it");
    await page.$eval(beautifyTrigger, (el) => el.focus());
    await page.keyboard.press('Enter');
    await settle();
    let tabs = 0;
    while ((await page.$('.beautify-popover')) !== null && tabs < 20) {
      await page.keyboard.press('Tab');
      tabs++;
    }
    assert(
      (await page.$('.beautify-popover')) === null,
      `Tab walked off the panel and closed it (${tabs} presses)`,
    );
    assert(
      !(await activeElementIs(beautifyTrigger)),
      'focus kept moving forward on Tab — it was not pulled back to the trigger',
    );

    step(
      "Shift+Tab off the panel's first control closes it too — a real keyboard trap this shape once had",
    );
    // The onFocusOut guard that fixes the trigger-click/focusout race has to
    // distinguish *why* focus reached the trigger:
    // a click on it (owned by the trigger's own onClick toggle) from a
    // plain Shift+Tab onto it (which has no toggle waiting and must close
    // here). Getting that wrong traps Tab/Shift+Tab cycling between the
    // trigger and the first control forever — this is that trap, driven in
    // the direction the original smoke never exercised.
    await page.$eval(beautifyTrigger, (el) => el.focus());
    await page.keyboard.press('Enter');
    await settle();
    assert((await page.$('.beautify-popover')) !== null, 'reopened for the Shift+Tab check');
    await chord(['Shift'], 'Tab');
    await settle();
    assert(
      (await page.$('.beautify-popover')) === null,
      'Shift+Tab off the first control closed the panel',
    );
    await page.keyboard.press('Tab');
    await settle();
    assert(
      (await page.$('.beautify-popover')) === null,
      'the panel did not reopen on the next Tab — no trigger <-> first-control cycle',
    );

    step('a real mouse click opens the Beautify popover the same as keyboard activation');
    await clickOpen(beautifyTrigger);
    await settle();
    const beautifyMouseOpen = await page.evaluate(() => {
      const panel = document.querySelector('.beautify-popover');
      const first = panel?.querySelector('input, button, select, textarea') ?? null;
      return { open: !!panel, activeIsFirst: document.activeElement === first };
    });
    assert(beautifyMouseOpen.open, 'a real click opened the panel');
    assert(
      beautifyMouseOpen.activeIsFirst,
      'and moved focus onto its first control, same as the keyboard-open path',
    );

    step(
      'Shift+Tab off the first control closes the panel even when it was opened by a real click',
    );
    // task-19 fix round 2: the trigger's onMouseDown sets a "click in
    // progress" ref that onFocusOut reads to avoid racing the trigger's own
    // click-toggle. Opening the panel this way (click, not keyboard) sets
    // that same ref — round 2's first attempt left it stuck true afterward,
    // because the only place that had ever cleared it (onFocusOut, for the
    // close-an-open-panel-by-clicking-the-trigger case) never runs during an
    // *opening* click (nothing inside the not-yet-rendered popover to blur
    // from). The next Shift+Tab off the first control then read a stale
    // "true" and silently skipped its own close — this is that exact path.
    await chord(['Shift'], 'Tab');
    await settle();
    assert(
      (await page.$('.beautify-popover')) === null,
      'Shift+Tab off the first control closed a panel that was opened by mouse',
    );
    await page.keyboard.press('Tab');
    await settle();
    assert((await page.$('.beautify-popover')) === null, 'and it did not reopen on the next Tab');

    step(
      'a mousedown on the trigger that never becomes a click (press, drag off, release elsewhere) does not strand the panel open',
    );
    // Same ref, a different way to abandon it: mousedown alone (not a full
    // click) already fires the focus-shift that makes onFocusOut skip a
    // close, believing a click is about to complete it. Drag off before
    // releasing and no click ever fires, so nothing was ever going to close
    // the panel on its own — this is what the mouseup-deferred safety net
    // (BeautifyMenu.tsx's onUp) exists to catch.
    await clickOpen(beautifyTrigger);
    await settle();
    assert((await page.$('.beautify-popover')) !== null, 'reopened for the drag-away check');
    const dragBox = await boxOf(beautifyTrigger);
    await page.mouse.move(dragBox.x, dragBox.y);
    await page.mouse.down();
    await page.mouse.move(dragBox.x + 300, dragBox.y + 200, { steps: 10 });
    await page.mouse.up();
    await settle();
    assert(
      (await page.$('.beautify-popover')) === null,
      'the abandoned drag still closed the panel instead of leaving it stuck open',
    );

    // BeautifyMenu's window-level capture-phase keydown listener is torn down
    // from its effect's cleanup, which — per this file's own opening comment —
    // commits a frame after the DOM does. Without a beat here, a key aimed at
    // ZoomMenu next can still be swallowed by that stale listener's
    // stopPropagation before it ever reaches ZoomMenu's own handler.
    await settle();

    step('ZoomMenu: ArrowDown opens with the first item focused, ArrowUp with the last');
    await page.$eval(zoomTrigger, (el) => el.focus());
    const itemText = () =>
      page.evaluate(() => document.activeElement?.querySelector('span')?.textContent ?? null);
    await page.keyboard.press('ArrowDown');
    await settle();
    assert(
      (await itemText()) === 'Zoom in',
      'ArrowDown on the closed trigger opens on the first item',
    );
    await page.keyboard.press('Escape');
    await settle();
    await page.keyboard.press('ArrowUp');
    await settle();
    assert(
      (await itemText()) === 'Actual size',
      'ArrowUp on the closed trigger opens on the last item',
    );

    step('a real mouse click opens the zoom menu the same as keyboard activation');
    // The previous step ends with the menu open (ArrowUp landed on the last
    // item and nothing closed it since) — clicking the trigger while it's
    // already open would close it via ZoomMenu's own toggle, not open it.
    await page.keyboard.press('Escape');
    await settle();
    await clickOpen(zoomTrigger);
    await settle();
    assert((await page.$('.zoom-popover')) !== null, 'a real click opened the menu');
    assert(
      (await itemText()) === 'Zoom in',
      'and moved focus onto the first item, same as the keyboard-open path',
    );
    await page.keyboard.press('Escape');
    await settle();

    step('ArrowDown/ArrowUp wrap at the ends, Home/End jump to the ends');
    await page.keyboard.press('ArrowDown');
    await settle();
    assert((await itemText()) === 'Zoom in', 'Down from the last item wraps to the first');
    await page.keyboard.press('ArrowUp');
    await settle();
    assert((await itemText()) === 'Actual size', 'Up from the first item wraps to the last');
    await page.keyboard.press('Home');
    await settle();
    assert((await itemText()) === 'Zoom in', 'Home jumps to the first item');
    await page.keyboard.press('End');
    await settle();
    assert((await itemText()) === 'Actual size', 'End jumps to the last item');

    step('Escape closes the zoom menu and returns focus to the trigger');
    await page.keyboard.press('Escape');
    await settle();
    assert((await page.$('.zoom-popover')) === null, 'Escape closed the menu');
    assert(await activeElementIs(zoomTrigger), 'focus returned to the Zoom trigger');

    step('Enter activates the focused item, runs it, and returns focus to the trigger');
    const readout = () =>
      page.evaluate(() => document.querySelector('.zoom-readout').textContent.trim());
    const beforeEnter = await readout();
    await page.keyboard.press('ArrowDown');
    await settle();
    await page.keyboard.press('Enter');
    await settle();
    assert(
      (await readout()) !== beforeEnter,
      `Enter on "Zoom in" ran the action (${beforeEnter} -> ${await readout()})`,
    );
    assert((await page.$('.zoom-popover')) === null, 'the menu closed after activation');
    assert(await activeElementIs(zoomTrigger), 'focus returned to the trigger after activation');

    step('Space also activates the focused item (native button semantics)');
    const beforeSpace = await readout();
    await page.keyboard.press('ArrowDown');
    await settle();
    await page.keyboard.press('Space');
    await settle();
    assert(
      (await readout()) !== beforeSpace,
      `Space on "Zoom in" ran the action (${beforeSpace} -> ${await readout()})`,
    );

    step('Tab closes the zoom menu without pulling focus back to the trigger');
    await page.keyboard.press('ArrowDown');
    await settle();
    await page.keyboard.press('Tab');
    await settle();
    assert((await page.$('.zoom-popover')) === null, 'Tab closed the menu');
    assert(
      !(await activeElementIs(zoomTrigger)),
      'focus kept moving forward on Tab — it was not pulled back to the trigger',
    );

    step('Tab off the actual last zoom item also closes the menu, no trap');
    // The prior Tab step always opens with ArrowDown (first item) before
    // Tabbing — every existing Tab assertion in this file, old and new,
    // started from the first item. ZoomMenu's Tab handling is an
    // unconditional check in the capture-phase keydown listener
    // (if (e.key === 'Tab') setOpen(false)), not tied to which item holds
    // the roving tabindex, so this exercises the same code path — but it
    // had never actually been driven from the last item until now.
    await page.$eval(zoomTrigger, (el) => el.focus());
    await page.keyboard.press('ArrowUp'); // opens on the last item
    await settle();
    assert((await itemText()) === 'Actual size', 'opened on the last item, as ArrowUp promises');
    await page.keyboard.press('Tab');
    await settle();
    assert((await page.$('.zoom-popover')) === null, 'Tab off the last item closed the menu');
    await page.keyboard.press('Tab');
    await settle();
    assert((await page.$('.zoom-popover')) === null, 'and it did not reopen on a further Tab');

    step('Shift+Tab off the first zoom item closes the menu too — symmetry with Beautify above');
    await page.$eval(zoomTrigger, (el) => el.focus());
    await page.keyboard.press('ArrowDown');
    await settle();
    assert((await page.$('.zoom-popover')) !== null, 'reopened for the Shift+Tab check');
    await chord(['Shift'], 'Tab');
    await settle();
    assert(
      (await page.$('.zoom-popover')) === null,
      'Shift+Tab off the first item closed the menu',
    );
    await page.keyboard.press('Tab');
    await settle();
    assert(
      (await page.$('.zoom-popover')) === null,
      'the menu did not reopen on the next Tab — no trigger <-> first-item cycle',
    );

    step('an outside pointer click closes the zoom menu without stealing focus');
    await page.$eval(zoomTrigger, (el) => el.focus());
    await page.keyboard.press('ArrowDown');
    await settle();
    assert((await page.$('.zoom-popover')) !== null, 'reopened for the outside-click check');
    await outsideClick();
    await settle();
    assert((await page.$('.zoom-popover')) === null, 'the outside click closed the menu');
    assert(
      !(await activeElementIs(zoomTrigger)),
      'the outside click did not pull focus back to the Zoom trigger',
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
