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

function hexToRGB(hex) {
  const m = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  return m
    ? [
        parseInt(m[1].slice(0, 2), 16),
        parseInt(m[1].slice(2, 4), 16),
        parseInt(m[1].slice(4, 6), 16),
      ]
    : null;
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

/**
 * Every page this file opens goes through here, so every assertion inherits
 * a known, forced prefers-reduced-motion state instead of whatever this
 * machine's real OS accessibility setting happens to be. That gap has now
 * shipped three separate broken assertions across three rounds of this task
 * (the original crop-confirm check, round 1's replacement of it, and round
 * 2's testDraftRestoreFailureNoOverlap) — a missing default, not three
 * unrelated mistakes.
 *
 * Default is 'no-preference': most of this file drives real CSS transitions
 * and needs the genuine (non-collapsed) duration to mean anything. A test
 * that specifically wants reduced-motion behaviour forces 'reduce' itself,
 * explicitly, at its own call site — visible there as a deliberate choice,
 * not inherited silently. A test that needs a DIFFERENT media feature too
 * (prefers-color-scheme, say) must include prefers-reduced-motion in that
 * same `Emulation.setEmulatedMedia` call — each call replaces the whole
 * feature list, it does not merge with this one.
 */
async function newSmokePage(browser, { width = 1280, height = 860 } = {}) {
  const page = await browser.newPage();
  await page.setViewport({ width, height });
  const cdp = await page.createCDPSession();
  await cdp.send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }],
  });
  return { page, cdp };
}

/**
 * storage.local seeded with one capture, plus a downloads sink for the export.
 * `messages` is `dist/_locales/en/messages.json`, read once in main() and
 * threaded through so `chrome.i18n.getMessage` resolves real strings instead
 * of echoing the key back — an editor assertion on English text must fail
 * for the right reason, not pass because the stub made every key its own
 * translation.
 */
function installChromeStub(messages, seed) {
  function getMessage(key, subs) {
    const entry = messages[key];
    if (!entry) return key;
    const list = Array.isArray(subs) ? subs : subs == null ? [] : [subs];
    let text = entry.message;
    for (const [name, placeholder] of Object.entries(entry.placeholders ?? {})) {
      const index = Number(String(placeholder.content).replace('$', '')) - 1;
      text = text.replace(new RegExp(`\\$${name}\\$`, 'gi'), list[index] ?? '');
    }
    return text;
  }

  const store = new Map(Object.entries(seed));
  globalThis.__smoke = { downloads: [] };
  globalThis.chrome = {
    i18n: { getMessage },
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
        // task 23's width-floor check: holds the export "in flight" (the
        // button showing "Exporting…") until the smoke explicitly releases
        // it, so the button's geometry can be measured mid-export instead of
        // guessing at timing.
        if (globalThis.__smoke.holdNextDownload) {
          globalThis.__smoke.holdNextDownload = false;
          await new Promise((resolve) => {
            globalThis.__smoke.releaseHold = resolve;
          });
        }
        // `url` is kept (not just its length) for task 22's export-purity
        // check, which decodes the exported PNG's real pixels.
        globalThis.__smoke.downloads.push({
          filename: opts.filename,
          bytes: opts.url.length,
          url: opts.url,
        });
        return 1;
      },
    },
    storage: {
      local: {
        get: async (key) => {
          // task 23 fix round: R-23b's storage-read failure branch — self-
          // resetting, same shape as failNextDownload above.
          if (globalThis.__smoke.failNextStorageGet) {
            globalThis.__smoke.failNextStorageGet = false;
            throw new Error('smoke-forced storage read failure');
          }
          return store.has(key) ? { [key]: store.get(key) } : {};
        },
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

/**
 * Three flat 200-row stripes, so a cut band that lands on one removes a colour
 * from the picture outright and the rows that close up over it are checkable
 * one by one. Nothing here is near black or near white, which is what lets the
 * seam marker (black over white) be counted separately from the picture.
 */
const STRIPES = [
  [200, 60, 60],
  [60, 200, 60],
  [60, 60, 200],
];

async function makeStripedCapture() {
  const sharp = createRequire(join(ROOT, 'package.json'))('sharp');
  const [w, h] = [800, 600];
  const raw = Buffer.alloc(w * h * 3);
  for (let y = 0; y < h; y++) {
    const [r, g, b] = STRIPES[Math.floor(y / 200)];
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 3;
      raw[i] = r;
      raw[i + 1] = g;
      raw[i + 2] = b;
    }
  }
  const png = await sharp(raw, { raw: { width: w, height: h, channels: 3 } })
    .png()
    .toBuffer();
  return {
    dataUrl: `data:image/png;base64,${png.toString('base64')}`,
    width: w,
    height: h,
    mode: 'visible',
    title: 'cut smoke',
    capturedAt: Date.now(),
  };
}

/** Tall enough that the default A4/portrait/8mm-margin PDF slices it into
 * several pages (task 23's real per-page progress needs more than one page
 * to prove anything). */
async function makeTallCapture() {
  const sharp = createRequire(join(ROOT, 'package.json'))('sharp');
  const png = await sharp({
    create: { width: 900, height: 6000, channels: 3, background: { r: 60, g: 110, b: 190 } },
  })
    .png()
    .toBuffer();
  return {
    dataUrl: `data:image/png;base64,${png.toString('base64')}`,
    width: 900,
    height: 6000,
    mode: 'full-page',
    title: 'tall smoke',
    capturedAt: Date.now(),
  };
}

/** A second, visibly different capture (green, and a different size than
 * makeCapture's blue 800x600) — task 28's shelf test opens this one over the
 * seeded default and checks the canvas actually swapped, not just the modal. */
async function makeGreenCapture() {
  const sharp = createRequire(join(ROOT, 'package.json'))('sharp');
  const png = await sharp({
    create: { width: 400, height: 300, channels: 3, background: { r: 40, g: 170, b: 90 } },
  })
    .png()
    .toBuffer();
  return {
    dataUrl: `data:image/png;base64,${png.toString('base64')}`,
    width: 400,
    height: 300,
    mode: 'import',
    title: 'history smoke green',
    capturedAt: Date.now(),
  };
}

/** Syntactically a data: URL, but not real image bytes — getLastCapture()
 * resolves it fine (it is just stored JSON), so the load only fails later,
 * at img.onerror, the same way a genuinely corrupt stash would. */
function makeBadCapture() {
  return {
    dataUrl: 'data:image/png;base64,bm90LWEtcG5n',
    width: 800,
    height: 600,
    mode: 'visible',
    title: 'bad smoke',
    capturedAt: Date.now(),
  };
}

/**
 * A checkerboard, 20px cells. A flat capture (makeCapture) blurs to itself at
 * every strength — nothing to tell two strengths apart by. Every patch of
 * this one has both colours in it, so downsampling it harder always blends a
 * visibly different average out of the same pixels.
 */
async function makeCheckerCapture() {
  const sharp = createRequire(join(ROOT, 'package.json'))('sharp');
  const [w, h, cell] = [800, 600, 20];
  const raw = Buffer.alloc(w * h * 3);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const even = (Math.floor(x / cell) + Math.floor(y / cell)) % 2 === 0;
      const [r, g, b] = even ? [230, 60, 60] : [60, 60, 230];
      const i = (y * w + x) * 3;
      raw[i] = r;
      raw[i + 1] = g;
      raw[i + 2] = b;
    }
  }
  const png = await sharp(raw, { raw: { width: w, height: h, channels: 3 } })
    .png()
    .toBuffer();
  return {
    dataUrl: `data:image/png;base64,${png.toString('base64')}`,
    width: w,
    height: h,
    mode: 'visible',
    title: 'blur strength smoke',
    capturedAt: Date.now(),
  };
}

/**
 * task 23 — the export dialog's own Export button cycles Export / Exporting…
 * and must not shift the modal-actions row when it does (the .btn-fixed
 * technique the topbar Copy button already uses, applied here as its own
 * class since "Exporting…" is wider than any of Copy's three words — see
 * .btn-fixed-export in editor.css). holdNextDownload freezes the export
 * mid-flight so the button's real geometry can be measured in both states,
 * and the class is stripped live afterward as a negative control: proving
 * the same DOM, same label, same font *would* have shifted without it.
 */
async function testExportButtonWidthFloor(browser, base, messages) {
  step('task 23: the export dialog Export button does not shift width when "Exporting…"');
  const { page } = await newSmokePage(browser);
  const crashes = [];
  page.on('pageerror', (err) => crashes.push(String(err)));
  await page.evaluateOnNewDocument(installChromeStub, messages, {
    'openscreenshot:last-capture': await makeCapture(),
  });
  await page.goto(`${base}${PAGE}`, { waitUntil: 'networkidle0' });
  await page.waitForSelector('.stage-canvas');
  await new Promise((r) => setTimeout(r, 900));

  await page.click('header .btn-secondary[title^="Export"]');
  await page.waitForSelector('.modal', { timeout: 5000 });

  // Stable across the negative control below, which strips the very class
  // a `.btn-fixed-export`-qualified selector would stop matching on.
  const btn = '.modal-actions .btn-primary';
  await page.waitForSelector(btn);
  assert(
    await page.$eval(btn, (el) => el.classList.contains('btn-fixed-export')),
    'the button carries .btn-fixed-export to start with',
  );
  assert(
    (await page.$eval(btn, (el) => el.textContent)) === 'Export',
    'button reads "Export" before the click',
  );
  // offsetWidth, not getBoundingClientRect().width: the latter reflects
  // :active's transform: scale(0.98) press feedback too, which (now that
  // prefers-reduced-motion: no-preference is forced — see newSmokePage)
  // genuinely animates for --dur-fast after the click that follows below,
  // so a rect read shortly after can land mid-transition and report a
  // width that has nothing to do with the layout-shift question this test
  // asks. offsetWidth is a layout metric; transform is paint-time only and
  // never touches it, click-feedback animation or not.
  const widthExport = await page.$eval(btn, (el) => el.offsetWidth);

  await page.evaluate(() => {
    globalThis.__smoke.holdNextDownload = true;
  });
  await page.click(btn);
  await page.waitForFunction(
    (sel) => document.querySelector(sel)?.textContent === 'Exporting…',
    {},
    btn,
  );
  const widthExporting = await page.$eval(btn, (el) => el.offsetWidth);
  assert(
    widthExporting === widthExport,
    `button width unchanged across the label swap: "Export" ${widthExport}px, "Exporting…" ${widthExporting}px`,
  );

  const widthWithoutFloor = await page.$eval(btn, (el) => {
    el.classList.remove('btn-fixed-export');
    return el.offsetWidth;
  });
  assert(
    widthWithoutFloor < widthExporting,
    `negative control: stripping .btn-fixed-export narrows the same "Exporting…" button to ${widthWithoutFloor}px (from ${widthExporting}px) — the floor is doing real work, not a no-op`,
  );
  await page.$eval(btn, (el) => el.classList.add('btn-fixed-export'));

  await page.evaluate(() => globalThis.__smoke.releaseHold?.());
  await page.waitForFunction(() => !document.querySelector('.modal'), { timeout: 5000 });
  const downloaded = await page.evaluate(() => globalThis.__smoke.downloads.at(-1));
  assert(
    !!downloaded?.filename?.endsWith('.png'),
    'the held export still completed and downloaded once released',
  );

  assert(crashes.length === 0, `no page errors (${crashes.join(' | ') || 'none'})`);
  await page.close();
}

/**
 * task 23 — R-23a: only the multi-page PDF path has real, discrete stages to
 * report, so this drives that one path and records every distinct progress
 * reading the dialog renders across the export's whole lifetime (a
 * MutationObserver, not a timed poll — a poll can miss a fast page and read
 * as "only saw one value" for the wrong reason). A tall seeded capture forces
 * several A4 pages at the default 8mm margin.
 */
async function testPdfRealProgress(browser, base, messages) {
  step('task 23: multi-page PDF export reports real, increasing per-page progress');
  const { page } = await newSmokePage(browser);
  const crashes = [];
  page.on('pageerror', (err) => crashes.push(String(err)));
  await page.evaluateOnNewDocument(installChromeStub, messages, {
    'openscreenshot:last-capture': await makeTallCapture(),
  });
  await page.goto(`${base}${PAGE}`, { waitUntil: 'networkidle0' });
  await page.waitForSelector('.stage-canvas');
  await new Promise((r) => setTimeout(r, 900));

  await page.click('header .btn-secondary[title^="Export"]');
  await page.waitForSelector('.modal', { timeout: 5000 });
  // waitForSelector resolves on insertion, mid-way through the modal's own
  // real (now that no-preference is forced) entrance animation — a pixel
  // sample taken too soon after can land while the modal is still fading
  // in, reading a blend with whatever is behind it instead of the actual
  // painted colour (confirmed: this is what first broke the accent-color
  // check below once the ambient-reduced-motion default stopped
  // collapsing the animation to nothing). 220ms clears the 150ms entrance
  // (--dur-mid) with margin — same value a11y-smoke.mjs uses for the same
  // reason.
  await new Promise((r) => setTimeout(r, 220));
  // PDF is the last format card — IMAGE_FORMATS.map(...) then one more
  // explicit PDF button, all inside the same .format-grid (App.tsx).
  await page.click('.format-grid .format-card:last-child');
  await page.waitForSelector('.field-label');

  await page.evaluate(() => {
    globalThis.__progressLog = [];
    const obs = new MutationObserver(() => {
      const el = document.querySelector('.export-progress');
      if (el) globalThis.__progressLog.push(el.textContent);
    });
    obs.observe(document.querySelector('.modal'), {
      childList: true,
      subtree: true,
      characterData: true,
    });
    globalThis.__progressObs = obs;
  });

  const accentInk = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--accent-ink').trim(),
  );
  const sharp = createRequire(join(ROOT, 'package.json'))('sharp');
  // A one-shot "screenshot the bar's filled region" — used once for real, once
  // more below as a negative control with accent-color stripped live. Reads
  // value/max fresh each call (not a stale rect from a previous call), since
  // the export keeps racing forward between the two.
  async function sampleFilledPixel() {
    let found = null;
    for (let i = 0; i < 200 && !found; i++) {
      const state = await page.evaluate(() => {
        const bar = document.querySelector('.export-progress-bar');
        if (!bar) return null;
        const r = bar.getBoundingClientRect();
        return {
          value: bar.value,
          max: bar.max,
          rect: { x: r.x, y: r.y, width: r.width, height: r.height },
        };
      });
      if (state && state.value > 0 && state.value < state.max) {
        const fillRatio = state.value / state.max;
        const clip = {
          x: Math.round(state.rect.x + state.rect.width * (fillRatio * 0.5) - 1),
          y: Math.round(state.rect.y + state.rect.height / 2 - 1),
          width: 3,
          height: 3,
        };
        const buf = await page.screenshot({ clip });
        const { data } = await sharp(buf).raw().toBuffer({ resolveWithObject: true });
        found = [data[0], data[1], data[2]];
      } else {
        await new Promise((r) => setTimeout(r, 5));
      }
    }
    return found;
  }

  await page.click('.modal-actions .btn-fixed-export');

  // ::-webkit-progress-bar/-value are inert in this Chromium (verified by
  // screenshot while building this fix — the rules match but nothing they
  // declare paints); accent-color is the one that actually works here, and
  // only for the filled portion (see editor.css's own comment on
  // .export-progress-bar for what was tried and ruled out). accent-color
  // styling on a native control is not a flat, exact-hex fill — Chromium
  // shades it — so the check is the fill's hue direction (warm, red over
  // blue, matching the coral token) against Chromium's own unstyled default
  // fill (a cool blue, blue over red), not a close-enough hex match.
  const filledPixel = await sampleFilledPixel();
  assert(
    !!filledPixel,
    'caught the bar with a genuine partial value and screenshotted its filled region',
  );
  const accentRGB = hexToRGB(accentInk);
  assert(
    filledPixel[0] > filledPixel[2],
    `filled region (${filledPixel}) is warm (red > blue), matching --accent-ink (${accentInk} = ${accentRGB}) rather than Chromium's cool default fill`,
  );

  // Negative control: strip accent-color live (an inline style wins over the
  // class rule) and confirm the same element's filled region actually
  // flips hue direction back to Chromium's own default (cool blue) — proving
  // the CSS is load-bearing, not coincidentally already the right colour.
  await page.evaluate(() => {
    document.querySelector('.export-progress-bar').style.setProperty('accent-color', 'auto');
  });
  const strippedPixel = await sampleFilledPixel();
  if (strippedPixel) {
    assert(
      strippedPixel[2] > strippedPixel[0],
      `negative control: stripping accent-color flips the filled pixel (${strippedPixel}, was ${filledPixel}) to cool (blue > red) — Chromium's own default, proving the token was doing real work`,
    );
  } else {
    // The export finished before this second sample landed — the first,
    // positive sample above still stands; nothing to assert here.
    console.log(
      '    (export finished before the negative-control sample — positive check above still holds)',
    );
  }

  await page.waitForFunction(() => !document.querySelector('.modal'), { timeout: 15000 });

  const log = await page.evaluate(() => {
    globalThis.__progressObs.disconnect();
    return globalThis.__progressLog;
  });
  const pages = [
    ...new Set(
      log
        .map((t) => /Exporting page (\d+) of (\d+)/.exec(t ?? ''))
        .filter(Boolean)
        .map((m) => `${m[1]}/${m[2]}`),
    ),
  ].map((s) => s.split('/').map(Number));
  assert(
    pages.length >= 3,
    `saw ${pages.length} distinct "page N of M" readings (${JSON.stringify(pages)})`,
  );
  const nums = pages.map(([n]) => n);
  assert(
    nums.every((n, i) => i === 0 || n > nums[i - 1]),
    `page numbers increased monotonically: ${nums.join(', ')}`,
  );
  const total = pages[0][1];
  assert(
    pages.every(([, t]) => t === total) && nums[nums.length - 1] === total,
    `every reading agreed on the same total (${total}) and progress reached it`,
  );

  const downloaded = await page.evaluate(() => globalThis.__smoke.downloads.at(-1));
  assert(
    !!downloaded?.filename?.endsWith('.pdf'),
    'the multi-page PDF export completed and downloaded',
  );

  assert(crashes.length === 0, `no page errors (${crashes.join(' | ') || 'none'})`);
  await page.close();
}

/**
 * task 23 — R-23b/R-23c: the stage error overlay reports the decode-failure
 * message, Retry re-runs the real load (proven by swapping in a real capture
 * behind the scenes and confirming it actually lands, not just that the
 * message clears), and Dismiss clears capture/imageSize too, not just the
 * message — confirmed by the topbar's Copy/Export buttons re-disabling.
 */
/**
 * fix round 2, promoted finding 1 — useEditor.ts's restoreDraft clears
 * draftPrompt synchronously but only sets a stage notice later, once
 * getDraftImage's promise settles (the failure path) — well inside
 * draft-restore's own 150ms exit window this task added. App.tsx now gates
 * stageNoticeT on draftPromptT.mounted (not just ed.draftPrompt) to close
 * that. Proven by polling for the two pills ever being mounted at once, not
 * by reasoning about the gate.
 */
async function testDraftRestoreFailureNoOverlap(browser, base, messages) {
  step(
    'fix round 2: a failed draft restore never shows the stage notice pill while draft-restore is still exiting',
  );
  const { page } = await newSmokePage(browser);
  const crashes = [];
  page.on('pageerror', (err) => crashes.push(String(err)));
  const capture = await makeCapture();
  await page.evaluateOnNewDocument(installChromeStub, messages, {
    'openscreenshot:last-capture': capture,
    'openscreenshot:draft': {
      sourceCapturedAt: capture.capturedAt,
      annotations: [{ id: 'a1', type: 'rect', x: 10, y: 10, w: 50, h: 50 }],
      frame: {},
      savedAt: Date.now(),
    },
    // Syntactically a data: URL, not real image bytes — getDraftImage()
    // resolves it fine, so restoreDraft's img.onerror -> refuse() path is
    // what actually fires (the failure branch that sets the stage notice).
    'openscreenshot:draft-image': 'data:image/png;base64,bm90LWEtcG5n',
  });
  await page.goto(`${base}${PAGE}`, { waitUntil: 'networkidle0' });
  await page.waitForSelector('.draft-restore', { timeout: 5000 });

  await page.click('.draft-restore .btn-primary'); // Restore

  let sawOverlap = false;
  let sawStageNotice = false;
  for (let i = 0; i < 100; i++) {
    const s = await page.evaluate(() => ({
      draft: !!document.querySelector('.draft-restore'),
      notice: !!document.querySelector('.stage-notice'),
    }));
    if (s.draft && s.notice) sawOverlap = true;
    if (s.notice) sawStageNotice = true;
    if (!s.draft && sawStageNotice) break; // draft-restore fully gone, notice landed
    await new Promise((r) => setTimeout(r, 5));
  }
  assert(!sawOverlap, 'draft-restore and the stage notice were never mounted at the same time');
  assert(sawStageNotice, 'the stage notice did eventually appear (the failure path really ran)');

  await page.waitForSelector('.stage-notice', { timeout: 5000 });
  const message = await page.$eval('.stage-notice span', (el) => el.textContent);
  assert(
    message === 'Your saved edits could not be restored.',
    `the stage notice carries the real restore-failure message ("${message}")`,
  );

  assert(crashes.length === 0, `no page errors (${crashes.join(' | ') || 'none'})`);
  await page.close();
}

/**
 * fix round 3, two promotions from round 2's own gate —
 *
 * 1. An import failure (a genuine error — "Could not read that image.")
 *    used to be gated behind a still-*pending* draft-restore prompt the
 *    same way restoreDraft's own failure notice is gated behind draft-
 *    restore's exit tail — but those are not the same situation. A pill
 *    the user has not acted on yet is not more important than a real
 *    error; it should yield, not block. App.tsx's stageNoticeT now only
 *    waits for draft-restore's bare exit tail (draftPrompt already
 *    cleared), not for an active pending prompt.
 * 2. draftPromptT's own gate used to read a plain ref that stage-notice's
 *    unmount wrote to — a ref write schedules no render, so draft-restore
 *    could stay hidden after the stage notice genuinely finished, waiting
 *    on whatever unrelated future render happened to notice. The ref is
 *    now state updated from an effect, which guarantees the follow-up
 *    render happens on its own.
 */
async function testStageNoticeDraftPromptPriority(browser, base, messages) {
  step(
    'fix round 3: an import failure interrupts a pending draft prompt instead of queuing behind it',
  );
  const { page } = await newSmokePage(browser);
  const crashes = [];
  page.on('pageerror', (err) => crashes.push(String(err)));
  const capture = await makeCapture();
  await page.evaluateOnNewDocument(installChromeStub, messages, {
    'openscreenshot:last-capture': capture,
    'openscreenshot:draft': {
      sourceCapturedAt: capture.capturedAt,
      annotations: [{ id: 'a1', type: 'rect', x: 10, y: 10, w: 50, h: 50 }],
      frame: {},
      savedAt: Date.now(),
    },
  });
  await page.goto(`${base}${PAGE}`, { waitUntil: 'networkidle0' });
  await page.waitForSelector('.draft-restore', { timeout: 5000 });
  assert(
    (await page.$('.stage-notice')) === null,
    'no stage notice yet — the draft prompt is the only pending pill so far',
  );

  // A real import failure: paste a file with an image MIME type but bytes
  // that cannot decode, driving the same importFromFile catch a genuinely
  // corrupt drag-and-drop would.
  await page.evaluate(() => {
    const file = new File([new Uint8Array([1, 2, 3, 4, 5])], 'bad.png', { type: 'image/png' });
    const dt = new DataTransfer();
    dt.items.add(file);
    window.dispatchEvent(
      new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }),
    );
  });

  await page.waitForSelector('.stage-notice', { timeout: 5000 });
  const message = await page.$eval('.stage-notice span', (el) => el.textContent);
  assert(
    message === 'Could not read that image.',
    `the import-failure notice showed up (not swallowed behind the pending draft prompt): "${message}"`,
  );
  assert(
    (await page.$('.stage-notice[role="status"]')) !== null,
    'it carries role="status", so it is actually announced',
  );
  // The draft prompt yields to the error — this is what "interrupts" means
  // rather than "queues behind": it should already be on its way out, not
  // still fully shown next to the new notice.
  const draftStillFullyShown = await page.evaluate(
    () => !document.querySelector('.draft-restore')?.classList.contains('is-closing'),
  );
  assert(!draftStillFullyShown, 'the draft prompt is closing (yielding), not still fully shown');

  // Promotion 2: dismiss the notice, then prove draft-restore comes back
  // WITHOUT any further interaction — the guarantee a plain ref write could
  // not make. Poll without touching the page again.
  await page.click('.stage-notice .text-btn'); // Dismiss
  await page.waitForFunction(() => !document.querySelector('.stage-notice'), { timeout: 5000 });
  let draftReappeared = false;
  for (let i = 0; i < 100; i++) {
    if (await page.evaluate(() => !!document.querySelector('.draft-restore'))) {
      draftReappeared = true;
      break;
    }
    await new Promise((r) => setTimeout(r, 5));
  }
  assert(
    draftReappeared,
    'the draft prompt reappeared on its own once the stage notice fully cleared — not stuck waiting on an unrelated render',
  );

  assert(crashes.length === 0, `no page errors (${crashes.join(' | ') || 'none'})`);
  await page.close();
}

async function testStageErrorRetryAndDismiss(browser, base, messages) {
  step('task 23: stage error — Retry re-runs the real load; Dismiss clears the capture');
  const crashes = [];

  const { page } = await newSmokePage(browser);
  page.on('pageerror', (err) => crashes.push(String(err)));
  await page.evaluateOnNewDocument(installChromeStub, messages, {
    'openscreenshot:last-capture': makeBadCapture(),
  });
  await page.goto(`${base}${PAGE}`, { waitUntil: 'networkidle0' });
  await page.waitForFunction(
    () => document.querySelector('.overlay-msg h2')?.textContent === 'Something went wrong',
    { timeout: 5000 },
  );
  const message = await page.$eval('.overlay-msg p', (p) => p.textContent);
  assert(
    message === 'Could not load the screenshot.',
    `the decode-failure branch reports its own message ("${message}")`,
  );
  assert(
    (await page.$('.overlay-msg[role="alert"]')) !== null,
    'the error overlay carries role="alert"',
  );

  // task 41, defect 4 — `capture` is set before the image even starts
  // decoding (loadCapture, useEditor.ts), so a decode failure used to leave
  // it set too: the topbar's old `!ed.capture` checks kept Copy/Export/Zoom/
  // Beautify enabled the whole time this overlay is up, and ⌘S/⌘C bypassed
  // even those. Checked here, before Retry or Dismiss touch anything, which
  // is exactly the window the old checks got wrong.
  step('task 41: while the error overlay is up, Copy/Export/Zoom/Beautify are disabled');
  assert(
    (await page.$eval('.btn-fixed', (el) => el.disabled)) === true,
    'Copy is disabled with no image decoded',
  );
  assert(
    (await page.$eval('header .btn-secondary[title^="Export"]', (el) => el.disabled)) === true,
    'Export is disabled with no image decoded',
  );
  assert(
    (await page.$eval('button[title="Zoom"]', (el) => el.disabled)) === true,
    'Zoom is disabled with no image decoded',
  );
  assert(
    (await page.$eval('button[title^="Beautify"]', (el) => el.disabled)) === true,
    'Beautify is disabled with no image decoded',
  );
  await page.keyboard.down('Meta');
  await page.keyboard.press('s');
  await page.keyboard.up('Meta');
  await new Promise((r) => setTimeout(r, 150));
  assert((await page.$('.modal')) === null, '⌘S does not open Export over a canvas with no image');

  // Swap in a real capture behind the scenes first — the way a transient
  // storage/network hiccup would resolve on its own — so Retry succeeding
  // proves it re-ran getSettings/getLastCapture/decode for real, not that it
  // just hid the message.
  const goodCapture = await makeCapture();
  await page.evaluate((cap) => {
    globalThis.chrome.storage.local.set({ 'openscreenshot:last-capture': cap });
  }, goodCapture);
  await page.click('.overlay-msg .btn-primary'); // Retry
  // imageSize (and so the canvas's aria-label) is set from the capture's own
  // metadata before the image actually finishes decoding, so it alone is not
  // proof the load is done — .overlay-msg (covers both the loading spinner
  // and the error state) actually clearing is.
  await page.waitForFunction(() => !document.querySelector('.overlay-msg'), { timeout: 5000 });
  await page.waitForSelector('.stage-canvas[aria-label*="800 by 600"]', { timeout: 5000 });
  assert(
    (await page.$eval('header .btn-secondary[title^="Export"]', (el) => el.disabled)) === false,
    'Export re-enables once a real capture is decoded onto the canvas',
  );
  assert(crashes.length === 0, `no page errors (${crashes.join(' | ') || 'none'})`);
  await page.close();

  // Dismiss, on its own fresh bad-capture page — independent of the retry
  // path above (retry already replaced the seed, so a shared page would not
  // exercise dismiss against a real failure).
  const { page: page2 } = await newSmokePage(browser);
  page2.on('pageerror', (err) => crashes.push(String(err)));
  await page2.evaluateOnNewDocument(installChromeStub, messages, {
    'openscreenshot:last-capture': makeBadCapture(),
  });
  await page2.goto(`${base}${PAGE}`, { waitUntil: 'networkidle0' });
  await page2.waitForFunction(
    () => document.querySelector('.overlay-msg h2')?.textContent === 'Something went wrong',
    { timeout: 5000 },
  );
  await page2.click('.overlay-msg .text-btn'); // Dismiss
  await page2.waitForSelector('.empty h2', { timeout: 5000 });
  assert(
    (await page2.$eval('.empty h2', (el) => el.textContent)) === 'Nothing to edit yet',
    'Dismiss lands on the empty state, not a blank stage',
  );
  assert(
    (await page2.$eval('header .btn-secondary[title^="Export"]', (el) => el.disabled)) === true,
    'Export disables again — dismiss cleared capture, not just the message',
  );
  assert((await page2.$eval('.btn-fixed', (el) => el.disabled)) === true, 'Copy disables too');
  assert(crashes.length === 0, `no page errors (${crashes.join(' | ') || 'none'})`);
  await page2.close();

  // The OTHER failure branch R-23b put in scope: a storage/settings read
  // that rejects (not a decode failure) — a good capture is seeded, but the
  // very first chrome.storage.local.get (inside getSettings) is forced to
  // throw once, so the load never even reaches getLastCapture.
  const { page: page3 } = await newSmokePage(browser);
  page3.on('pageerror', (err) => crashes.push(String(err)));
  await page3.evaluateOnNewDocument(installChromeStub, messages, {
    'openscreenshot:last-capture': await makeCapture(),
  });
  await page3.evaluateOnNewDocument(() => {
    globalThis.__smoke.failNextStorageGet = true;
  });
  await page3.goto(`${base}${PAGE}`, { waitUntil: 'networkidle0' });
  await page3.waitForFunction(
    () => document.querySelector('.overlay-msg h2')?.textContent === 'Something went wrong',
    { timeout: 5000 },
  );
  const storageMessage = await page3.$eval('.overlay-msg p', (p) => p.textContent);
  assert(
    storageMessage === 'Could not load your settings or the saved screenshot.',
    `the storage-read-failure branch reports its own, different message ("${storageMessage}")`,
  );
  // The forced failure is self-resetting (see installChromeStub), and the
  // capture seeded above was always good, so Retry should succeed this time.
  await page3.click('.overlay-msg .btn-primary'); // Retry
  await page3.waitForFunction(() => !document.querySelector('.overlay-msg'), { timeout: 5000 });
  await page3.waitForSelector('.stage-canvas[aria-label*="800 by 600"]', { timeout: 5000 });
  assert(
    (await page3.$eval('header .btn-secondary[title^="Export"]', (el) => el.disabled)) === false,
    'Retry after a storage failure still lands on the real capture once the read stops failing',
  );
  assert(crashes.length === 0, `no page errors (${crashes.join(' | ') || 'none'})`);
  await page3.close();
}

/**
 * task 23 fix round — R-23's own trap 1, plus the reviewer's Important-
 * adjacent minor: a Tab pressed *during* a popover's exit window (the
 * ~150ms tail useExitDelay keeps it mounted for) must not land inside it.
 * Both surfaces get `inert` on `.is-closing` (App.tsx/ZoomMenu.tsx/
 * BeautifyMenu.tsx) — this presses Tab in that exact window and checks
 * where focus actually lands, not the attribute. The "still closing at the
 * moment Tab was pressed" assertion is what proves the window was real,
 * not a race that happened to run after the exit already finished.
 */
async function testPopoverTabDuringExit(browser, base, messages) {
  step('task 23 fix: Tab pressed during a popover exit does not land inside it');
  // newSmokePage forces prefers-reduced-motion: no-preference by default —
  // load-bearing here specifically, since this test exists to probe a real,
  // non-collapsed exit window (see newSmokePage's own doc comment for why
  // that default exists at all).
  const { page } = await newSmokePage(browser);
  const crashes = [];
  page.on('pageerror', (err) => crashes.push(String(err)));
  await page.evaluateOnNewDocument(installChromeStub, messages, {
    'openscreenshot:last-capture': await makeCapture(),
  });
  await page.goto(`${base}${PAGE}`, { waitUntil: 'networkidle0' });
  await page.waitForSelector('.stage-canvas');
  await new Promise((r) => setTimeout(r, 900));

  // ZoomMenu: ArrowDown opens it with the first item focused, which is also
  // what makes focus.ts's syncRovingTabIndex set that item's live tabIndex
  // to 0 — the exact lingering tab stop the reviewer named.
  const zoomTrigger = '.zoom-trigger';
  await page.$eval(zoomTrigger, (el) => el.focus());
  await page.keyboard.press('ArrowDown');
  await page.waitForSelector('.zoom-popover', { timeout: 5000 });
  // waitForSelector resolves on insertion; the effect that actually attaches
  // the window keydown listener Escape needs lands a render later (Preact
  // flushes effects a frame after the commit — see this file's own header
  // comment). Escape pressed before that listener exists does nothing.
  await new Promise((r) => setTimeout(r, 60));
  await page.keyboard.press('Escape');
  const zoomStillClosing = await page.evaluate(
    () => document.querySelector('.zoom-popover')?.classList.contains('is-closing') ?? false,
  );
  assert(
    zoomStillClosing,
    'the zoom popover is still mounted and mid-exit at the moment Tab is pressed below',
  );
  await page.keyboard.press('Tab');
  const zoomPresentAfterTab = await page.evaluate(() => !!document.querySelector('.zoom-popover'));
  assert(
    zoomPresentAfterTab,
    'the zoom popover is still in the DOM when Tab lands — otherwise "did not land inside it" below is vacuously true (nothing left to land inside)',
  );
  const zoomLandedInside = await page.evaluate(
    () => !!document.activeElement?.closest?.('.zoom-popover'),
  );
  assert(!zoomLandedInside, 'Tab during the zoom popover exit did not land inside it');

  // The central behaviour of this whole task, checked directly for the
  // first time: a panel with a real (non-zero) exit window actually
  // unmounts, and does so only once that window has elapsed — not
  // immediately, and not "eventually" in the open-ended sense closed()'s
  // poll would also report for a window of zero length. Two bounded reads,
  // both under the no-preference emulation forced above: still present
  // partway through DUR_MID (150ms), gone once it has passed.
  await new Promise((r) => setTimeout(r, 50));
  assert(
    (await page.$('.zoom-popover')) !== null,
    'the zoom popover is still in the DOM 50ms after Escape — the exit window has not elapsed yet',
  );
  await new Promise((r) => setTimeout(r, 200)); // ~250ms since Escape, past the 150ms window
  assert(
    (await page.$('.zoom-popover')) === null,
    'the zoom popover has actually unmounted once its exit window elapsed',
  );

  // BeautifyMenu: every control is a real tab stop (no tabIndex=-1 guard at
  // all), the more direct case of the same trap.
  const beautifyTrigger = '.beautify-menu > .btn-secondary';
  await page.$eval(beautifyTrigger, (el) => el.focus());
  await page.keyboard.press('Enter');
  await page.waitForSelector('.beautify-popover', { timeout: 5000 });
  await new Promise((r) => setTimeout(r, 60)); // see the zoom step above
  await page.keyboard.press('Escape');
  const beautifyStillClosing = await page.evaluate(
    () => document.querySelector('.beautify-popover')?.classList.contains('is-closing') ?? false,
  );
  assert(
    beautifyStillClosing,
    'the Beautify popover is still mounted and mid-exit at the moment Tab is pressed below',
  );
  await page.keyboard.press('Tab');
  const beautifyPresentAfterTab = await page.evaluate(
    () => !!document.querySelector('.beautify-popover'),
  );
  assert(
    beautifyPresentAfterTab,
    'the Beautify popover is still in the DOM when Tab lands — otherwise "did not land inside it" below is vacuously true',
  );
  const beautifyLandedInside = await page.evaluate(
    () => !!document.activeElement?.closest?.('.beautify-popover'),
  );
  assert(!beautifyLandedInside, 'Tab during the Beautify popover exit did not land inside it');

  assert(crashes.length === 0, `no page errors (${crashes.join(' | ') || 'none'})`);
  await page.close();
}

/**
 * task 23 fix round — a fast reopen (Escape, then reopen before the ~150ms
 * exit timer ever unmounts it) reuses the SAME ExportDialog instance under
 * useExitDelay, so a []-only mount effect would never refocus into it again
 * — App.tsx's consolidated focus effect (keyed on `closing`, not `[]`) is
 * what fixes that. Proven by actually reopening fast and reading where
 * focus landed, not by reasoning about the effect dependency array.
 */
async function testModalFastReopen(browser, base, messages) {
  step('task 23 fix: a fast reopen before the exit timer fires still refocuses into the dialog');
  // newSmokePage forces prefers-reduced-motion: no-preference by default —
  // see testPopoverTabDuringExit's own comment: without it, this machine's
  // ambient setting would collapse the 150ms exit window this test means
  // to reopen inside of.
  const { page } = await newSmokePage(browser);
  const crashes = [];
  page.on('pageerror', (err) => crashes.push(String(err)));
  await page.evaluateOnNewDocument(installChromeStub, messages, {
    'openscreenshot:last-capture': await makeCapture(),
  });
  await page.goto(`${base}${PAGE}`, { waitUntil: 'networkidle0' });
  await page.waitForSelector('.stage-canvas');
  await new Promise((r) => setTimeout(r, 900));

  await page.click('header .btn-secondary[title^="Export"]');
  await page.waitForSelector('.modal', { timeout: 5000 });
  // A marker on the live DOM node, outside Preact's own bookkeeping — the
  // one thing that proves this test actually hit the "same instance
  // survives a fast reopen" scenario it claims to, rather than a real
  // unmount-then-remount coincidentally reinitialising everything fresh
  // (which would also produce a correctly-focused dialog below, for the
  // wrong reason — confirmed this happens on this exact machine when
  // reduced motion is not forced off, which is why that emulation call
  // above is not just about the exit animation).
  await page.evaluate(() => {
    document.querySelector('.modal').dataset.reopenMarker = 'original-instance';
  });
  // waitForSelector resolves on insertion; the mount effect that moves focus
  // onto the first control lands a render later (Preact flushes effects a
  // frame after the commit). Escape pressed before that settles would find
  // focus still on the header trigger, outside the modal's DOM subtree, so
  // its own onKeyDown (a direct prop, not a delayed listener) never even
  // sees the keydown bubble through it.
  await new Promise((r) => setTimeout(r, 60));
  await page.keyboard.press('Escape');
  // No further wait: reopen immediately, well inside the 150ms exit window.
  await page.click('header .btn-secondary[title^="Export"]');
  // Long enough that, if the bug were present, the stray unmount timer would
  // already have fired and left the reopened dialog visibly broken.
  await new Promise((r) => setTimeout(r, 250));
  const state = await page.evaluate(() => {
    const modal = document.querySelector('.modal');
    return {
      present: !!modal,
      closing: modal?.classList.contains('is-closing') ?? null,
      sameInstance: modal?.dataset.reopenMarker === 'original-instance',
      focusInside: !!modal && modal.contains(document.activeElement),
      focusIsFirstControl: document.activeElement === modal?.querySelector('.format-card'),
    };
  });
  assert(state.present, 'the dialog is open after the fast reopen');
  assert(
    state.sameInstance,
    'the reopened modal is the SAME DOM node marked above — this really did exercise the same-instance-survives path, not a real unmount+remount that would reinitialise everything fresh regardless of the fix',
  );
  assert(state.closing === false, 'it settled back to fully open, not stuck mid-exit');
  assert(state.focusInside, 'focus is back inside the reopened dialog');
  assert(state.focusIsFirstControl, 'focus landed on the first control, same as any other open');

  // And it still traps Tab correctly — the other half of "not a keyboard
  // trap the other way", confirming onKeyDown resumed trapping too.
  let stayedInModal = true;
  for (let i = 0; i < 15; i++) {
    await page.keyboard.press('Tab');
    const inside = await page.evaluate(
      () =>
        !!document.activeElement?.closest?.('.modal') && document.activeElement !== document.body,
    );
    if (!inside) stayedInModal = false;
  }
  assert(stayedInModal, 'Tab cycling stayed inside the reopened dialog');

  assert(crashes.length === 0, `no page errors (${crashes.join(' | ') || 'none'})`);
  await page.close();
}

/**
 * task 23 fix round — the Important finding: pdf.ts's per-page yield used to
 * be a bare requestAnimationFrame wait, which Chrome never runs while a tab
 * is hidden, stalling a multi-page export forever if the user switches away
 * mid-export. Fixed by racing rAF against a short timer. Proven here by
 * really backgrounding the export's tab — a second real tab, brought to
 * front, pushes it into the background the same way alt-tabbing would — and
 * confirming the download still lands while it stays hidden the whole time.
 */
async function testPdfExportInBackgroundTab(browser, base, messages) {
  step('task 23 fix: a multi-page PDF export still completes while its tab is backgrounded');
  const { page } = await newSmokePage(browser);
  const crashes = [];
  page.on('pageerror', (err) => crashes.push(String(err)));
  await page.evaluateOnNewDocument(installChromeStub, messages, {
    'openscreenshot:last-capture': await makeTallCapture(),
  });
  await page.goto(`${base}${PAGE}`, { waitUntil: 'networkidle0' });
  await page.waitForSelector('.stage-canvas');
  await new Promise((r) => setTimeout(r, 900));

  await page.click('header .btn-secondary[title^="Export"]');
  await page.waitForSelector('.modal', { timeout: 5000 });
  await page.click('.format-grid .format-card:last-child');
  await page.waitForSelector('.field-label');

  const blankPage = await browser.newPage();
  await blankPage.bringToFront();
  const hiddenAtStart = await page.evaluate(() => document.visibilityState);
  assert(
    hiddenAtStart === 'hidden',
    'the export tab is really backgrounded (document.visibilityState) before the export starts',
  );

  // Puppeteer's own page.click() dispatches synthetic input via CDP, which
  // this Chrome does not deliver to a backgrounded tab (confirmed: it just
  // hangs forever) — a real constraint of driving this scenario, not
  // something to route around by giving up on it. A plain DOM .click() call
  // fires the exact same onClick a real click would (no CDP input injection
  // involved), and still works while hidden.
  await page.evaluate(() => {
    document.querySelector('.modal-actions .btn-fixed-export').click();
  });
  // waitForFunction's default polling strategy is requestAnimationFrame —
  // the same primitive this whole fix is about, so left at its default this
  // wait would never observe the modal actually closing in a hidden tab,
  // whether or not the export itself finished. 'mutation' polls via
  // MutationObserver instead, which does fire while hidden (confirmed:
  // without this the wait times out at 15s even though the export and
  // download both genuinely completed underneath it).
  await page.waitForFunction(() => !document.querySelector('.modal'), {
    timeout: 15000,
    polling: 'mutation',
  });
  const stillHidden = await page.evaluate(() => document.visibilityState);
  assert(
    stillHidden === 'hidden',
    'the tab was hidden the entire time — this is not a lucky foreground finish',
  );

  const downloaded = await page.evaluate(() => globalThis.__smoke.downloads.at(-1));
  assert(
    !!downloaded?.filename?.endsWith('.pdf'),
    'the backgrounded multi-page export still completed and downloaded',
  );

  await blankPage.close();
  assert(crashes.length === 0, `no page errors (${crashes.join(' | ') || 'none'})`);
  await page.close();
}

/**
 * fix round 2, promoted finding 2 — .export-progress-bar's track falls
 * back to Chromium's own native rendering (accent-color only reaches the
 * filled portion — see editor.css's own comment), which reads color-scheme.
 * :root never sets one for an explicit data-theme="dark" on a light-OS
 * machine, so that combination used to paint a light track in a dark
 * panel. Fixed at the element, not the root (out of scope). Checked via
 * computed style on a probe element (a real <progress class="export-
 * progress-bar"> inserted and measured, not a screenshot) — pixel-timing
 * during a live multi-page export turned out to be too unreliable to
 * pin an unfilled-track sample to a specific fill ratio (confirmed while
 * building this: the bar can advance several pages between reading
 * value/max and a screenshot actually landing), so this checks the
 * property the fix actually sets instead of trying to outrun that race.
 */
async function testProgressBarColorScheme(browser, base, messages) {
  step('fix round 2: the export progress bar tracks the app theme, not just the OS one');
  const { page, cdp } = await newSmokePage(browser);
  const crashes = [];
  page.on('pageerror', (err) => crashes.push(String(err)));

  const probe = () =>
    page.evaluate(() => {
      const p = document.createElement('progress');
      p.className = 'export-progress-bar';
      document.body.appendChild(p);
      const v = getComputedStyle(p).colorScheme;
      p.remove();
      return v;
    });

  // The exact regression: an explicit dark theme while the OS itself
  // reports light — the one combination :root's own rules never cover.
  // Emulation.setEmulatedMedia replaces the whole feature list, so
  // prefers-reduced-motion has to be repeated here alongside prefers-
  // color-scheme — otherwise this call would silently drop newSmokePage's
  // own no-preference default back to unset.
  await cdp.send('Emulation.setEmulatedMedia', {
    features: [
      { name: 'prefers-color-scheme', value: 'light' },
      { name: 'prefers-reduced-motion', value: 'no-preference' },
    ],
  });
  await page.evaluateOnNewDocument(installChromeStub, messages, {
    'openscreenshot:last-capture': await makeCapture(),
    'openscreenshot:settings': { theme: 'dark' },
  });
  await page.goto(`${base}${PAGE}`, { waitUntil: 'networkidle0' });
  await page.waitForSelector('.stage-canvas');
  await new Promise((r) => setTimeout(r, 900));
  assert(
    (await page.evaluate(() => document.documentElement.getAttribute('data-theme'))) === 'dark',
    'the app really is themed dark for this check',
  );
  assert(
    (await probe()) === 'dark',
    'the progress bar reports color-scheme: dark under an explicit dark theme, even though the OS itself is light',
  );

  await page.close();

  // Negative-direction check, on its own fresh page (evaluateOnNewDocument
  // re-seeds the same store on every navigation of the first page, so
  // reusing it after a reload just reinstates 'dark' — a fresh page with
  // its own seed is the real way to flip the scenario): explicit light
  // theme under an OS-dark emulation reports light — proving this isn't
  // just hardcoded to dark.
  const { page: page2, cdp: cdp2 } = await newSmokePage(browser);
  page2.on('pageerror', (err) => crashes.push(String(err)));
  // See the first page's own comment: both features have to be set together.
  await cdp2.send('Emulation.setEmulatedMedia', {
    features: [
      { name: 'prefers-color-scheme', value: 'dark' },
      { name: 'prefers-reduced-motion', value: 'no-preference' },
    ],
  });
  await page2.evaluateOnNewDocument(installChromeStub, messages, {
    'openscreenshot:last-capture': await makeCapture(),
    'openscreenshot:settings': { theme: 'light' },
  });
  await page2.goto(`${base}${PAGE}`, { waitUntil: 'networkidle0' });
  await page2.waitForSelector('.stage-canvas');
  await new Promise((r) => setTimeout(r, 900));
  assert(
    (await page2.evaluate(() => document.documentElement.getAttribute('data-theme'))) === 'light',
    'the app really is themed light for this check',
  );
  const probe2 = () =>
    page2.evaluate(() => {
      const p = document.createElement('progress');
      p.className = 'export-progress-bar';
      document.body.appendChild(p);
      const v = getComputedStyle(p).colorScheme;
      p.remove();
      return v;
    });
  assert(
    (await probe2()) === 'light',
    'the progress bar reports color-scheme: light under an explicit light theme, even though the OS itself is dark',
  );

  assert(crashes.length === 0, `no page errors (${crashes.join(' | ') || 'none'})`);
  await page2.close();
}

/**
 * task 24 — multi-selection: shift-bracket, marquee, shift-click, Alt+D, and
 * every read of the selection that moved with it.
 *
 * The trap this exists for is the same one steps 4-6 of main() cover for the
 * single selection: the keydown path reads selectedIdsRef, not the state, so a
 * migration that left the ref behind renders perfectly and acts on stale
 * selection. Everything below is driven at keyboard speed, and every position
 * is read back out of the live region — the only place the annotation
 * geometry is observable without a DOM node per layer.
 */
async function testMultiSelection(browser, base, messages) {
  step('task 24: multi-selection by keyboard, marquee and shift-click');
  const { page } = await newSmokePage(browser);
  const crashes = [];
  page.on('pageerror', (err) => crashes.push(String(err)));
  await page.evaluateOnNewDocument(installChromeStub, messages, {
    'openscreenshot:last-capture': await makeCapture(),
  });
  await page.goto(`${base}${PAGE}`, { waitUntil: 'networkidle0' });
  await page.waitForSelector('.stage-canvas');
  await new Promise((r) => setTimeout(r, 900));

  const say = () =>
    page.evaluate(() =>
      document.querySelector('[aria-live="polite"][role="status"]').textContent.trim(),
    );
  const count = () =>
    page.evaluate(() => document.querySelector('.toolbar-count span')?.textContent ?? '0');
  const settle = (ms = 120) => new Promise((r) => setTimeout(r, ms));
  const focusCanvas = () => page.$eval('.stage-canvas', (el) => el.focus());
  const drag = async (x1, y1, x2, y2) => {
    await page.mouse.move(x1, y1);
    await page.mouse.down();
    await page.mouse.move(x2, y2, { steps: 8 });
    await page.mouse.up();
    await settle(80);
  };
  async function chord(mods, key) {
    for (const m of mods) await page.keyboard.down(m);
    await page.keyboard.press(key);
    for (const m of mods.slice().reverse()) await page.keyboard.up(m);
  }
  // A layer's position, read the only way the page exposes it: select it, nudge
  // one pixel each way (a net-zero move), and take the coordinates the live
  // region reads out. `]` walks one layer up the paint order per call.
  const readNextLayer = async (key = ']') => {
    await page.keyboard.press(key);
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowRight');
    await settle(60);
    const m = (await say()).match(/to (-?\d+), (-?\d+)/);
    if (!m) throw new Error(`expected a move announcement, got "${await say()}"`);
    return m.slice(1).map(Number);
  };

  await focusCanvas();
  // Two rectangles, 30px apart, so a move that touches one and not the other
  // is visible in the coordinates each reads back.
  await page.keyboard.press('r');
  await page.keyboard.press('Enter');
  await settle();
  for (let i = 0; i < 3; i++) {
    await chord(['Shift'], 'ArrowLeft');
    await settle(40);
  }
  await page.keyboard.press('r');
  await page.keyboard.press('Enter');
  await settle();
  assert((await count()) === '2', 'two rectangles on the canvas');

  await page.keyboard.press('Escape');
  const [ax0] = await readNextLayer();
  const [bx0] = await readNextLayer();
  assert(ax0 + 30 === bx0, `the two layers are 30px apart (${ax0} and ${bx0})`);

  step('task 24: Shift and a bracket extends the selection, and says how many');
  // Selection here is the layer readNextLayer just left selected (layer 2).
  await chord(['Shift'], ']');
  await settle();
  assert(
    (await say()) === '2 of 2 annotations selected.',
    `Shift+] added the other layer: "${await say()}"`,
  );
  assert(
    !(await page.$eval('[aria-label="Delete selected"]', (b) => b.disabled)),
    'the topbar Delete button is live for a multi-selection',
  );

  step('task 24: an arrow nudge moves every selected layer, as one undo step');
  for (let i = 0; i < 3; i++) {
    await page.keyboard.press('ArrowRight');
    await settle(40);
  }
  assert(
    (await say()) === '2 annotations moved.',
    `the live region counted the layers the nudge touched: "${await say()}"`,
  );
  await page.keyboard.press('Escape');
  const [ax1] = await readNextLayer();
  const [bx1] = await readNextLayer();
  assert(
    ax1 - ax0 === 3 && bx1 - bx0 === 3,
    `both selected layers moved 3px (${ax0}->${ax1}, ${bx0}->${bx1})`,
  );

  // Negative control for the assertion above: with only one of the two
  // selected, the same key moves that one and leaves the other where it is.
  // Without it, "both moved" would also pass on a build where an arrow moved
  // every annotation on the canvas regardless of the selection.
  await page.keyboard.press('Escape');
  await page.keyboard.press(']');
  await page.keyboard.press('ArrowRight');
  await settle(60);
  assert(
    /^Rectangle moved to /.test(await say()),
    `a lone selection still announces itself by name: "${await say()}"`,
  );
  await page.keyboard.press('Escape');
  const [ax2] = await readNextLayer();
  const [bx2] = await readNextLayer();
  assert(
    ax2 - ax1 === 1 && bx2 === bx1,
    `negative control: one selected layer moved and the other did not (${ax1}->${ax2}, ${bx1}->${bx2})`,
  );

  step('task 24: Alt+D duplicates the selection, and undo puts the selection back');
  await page.keyboard.press('Escape');
  await page.keyboard.press(']');
  await chord(['Shift'], ']');
  await settle();
  assert((await say()) === '2 of 2 annotations selected.', 'both layers selected again');
  await chord(['Meta'], 'd');
  await settle();
  assert(
    (await count()) === '2' && (await say()) === '2 of 2 annotations selected.',
    'the mod chord is not bound: Cmd+D duplicated nothing and said nothing',
  );
  await chord(['Alt'], 'd');
  await settle();
  assert((await say()) === '2 annotations duplicated.', `Alt+D announced: "${await say()}"`);
  assert((await count()) === '4', 'the two copies landed on the canvas');

  await chord(['Meta'], 'z');
  await settle();
  assert((await count()) === '2', 'undo took the copies away again');
  assert(
    !(await page.$eval('[aria-label="Delete selected"]', (b) => b.disabled)),
    'undo restored a selection rather than clearing it — the history entry carries one',
  );
  await page.keyboard.press('ArrowRight');
  await settle(60);
  assert(
    (await say()) === '2 annotations moved.',
    `and the restored selection is both originals, not one of them: "${await say()}"`,
  );
  await chord(['Meta'], 'z');
  await settle();

  step('task 24: each copy lands offset from the layer it was made from');
  await chord(['Alt'], 'd');
  await settle();
  assert((await count()) === '4', 'a second duplicate, this time to measure');
  await page.keyboard.press('Escape');
  const [ax3, ay3] = await readNextLayer();
  const [bx3, by3] = await readNextLayer();
  const [cx, cy] = await readNextLayer();
  const [dx, dy] = await readNextLayer();
  assert(
    cx - ax3 === 16 && cy - ay3 === 16 && dx - bx3 === 16 && dy - by3 === 16,
    `both copies sit 16px down and right of their originals (${ax3},${ay3} -> ${cx},${cy}; ${bx3},${by3} -> ${dx},${dy})`,
  );
  assert(
    ax3 === ax2 && bx3 === bx2,
    `negative control: duplicating did not move the originals (${ax2}->${ax3}, ${bx2}->${bx3})`,
  );

  step('task 24: a marquee drag on the Select tool catches what it covers');
  await page.keyboard.press('Escape');
  await page.keyboard.press('v');
  await settle(60);
  const box = await page.$eval('.stage-canvas', (el) => {
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height };
  });
  await drag(box.x + 4, box.y + 4, box.x + box.w - 4, box.y + box.h - 4);
  assert(
    (await say()) === '4 of 4 annotations selected.',
    `a marquee over the whole stage caught every layer: "${await say()}"`,
  );
  // Negative control: the same gesture over an empty corner catches nothing,
  // so the reading above is the rect doing work rather than any drag
  // selecting everything.
  await drag(box.x + 4, box.y + 4, box.x + 20, box.y + 20);
  assert(
    (await say()) === 'Selection cleared.',
    `a marquee over empty stage caught nothing: "${await say()}"`,
  );

  step('task 24: shift-click adds a layer to the selection and takes it back out');
  await drag(box.x + 4, box.y + 4, box.x + box.w - 4, box.y + box.h - 4);
  assert((await say()) === '4 of 4 annotations selected.', 'four selected going in');
  const cx0 = box.x + box.w / 2;
  const cy0 = box.y + box.h / 2;
  await page.keyboard.down('Shift');
  await page.mouse.click(cx0, cy0);
  await page.keyboard.up('Shift');
  await settle(80);
  assert(
    (await say()) === '3 of 4 annotations selected.',
    `shift-clicking a selected layer removed it: "${await say()}"`,
  );
  await page.keyboard.down('Shift');
  await page.mouse.click(cx0, cy0);
  await page.keyboard.up('Shift');
  await settle(80);
  assert(
    (await say()) === '4 of 4 annotations selected.',
    `shift-clicking it again put it back: "${await say()}"`,
  );
  await page.mouse.click(cx0, cy0);
  await settle(80);
  assert(
    /^Rectangle selected, layer \d+ of 4\.$/.test(await say()),
    `a plain click drops back to one layer: "${await say()}"`,
  );

  step('task 24: a multi-selection outlines every layer and moves the handles onto the group');
  // Two readings off the live canvas, neither of them a raw colour count: the
  // marching ants land on fractional screen coordinates and anti-alias, so
  // "how many pure black pixels" answers a question about rounding rather than
  // about what was drawn.
  //   - `seeds`: the top-left corner of every 5x5 patch of pure white. A handle
  //     is an 8x8 white fill; a dash is 1px, so only handles produce one. Eight
  //     seeds is one set of handles, sixteen would be a set per layer.
  //   - `diff` / `width`: the pixels that differ from the canvas with nothing
  //     selected, and how wide that region is.
  const baseline = () =>
    page.evaluate(() => {
      const canvas = document.querySelector('.stage-canvas');
      globalThis.__base = canvas
        .getContext('2d')
        .getImageData(0, 0, canvas.width, canvas.height)
        .data.slice();
    });
  const chrome = () =>
    page.evaluate(() => {
      const canvas = document.querySelector('.stage-canvas');
      const { width, height } = canvas;
      const data = canvas.getContext('2d').getImageData(0, 0, width, height).data;
      const base = globalThis.__base;
      const pure = (i) =>
        data[i + 3] === 255 && data[i] === 255 && data[i + 1] === 255 && data[i + 2] === 255;
      const solid = (x, y) => {
        if (x + 4 >= width || y + 4 >= height) return false;
        for (let yy = y; yy <= y + 4; yy++) {
          for (let xx = x; xx <= x + 4; xx++) if (!pure((yy * width + xx) * 4)) return false;
        }
        return true;
      };
      let diff = 0;
      let x0 = Infinity;
      let x1 = -Infinity;
      const seeds = [];
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const i = (y * width + x) * 4;
          if (
            data[i] !== base[i] ||
            data[i + 1] !== base[i + 1] ||
            data[i + 2] !== base[i + 2] ||
            data[i + 3] !== base[i + 3]
          ) {
            diff++;
            if (x < x0) x0 = x;
            if (x > x1) x1 = x;
          }
          // One seed per white square: the pixel that starts it, with no pure
          // white immediately above or to its left.
          if (solid(x, y) && !pure((y * width + x - 1) * 4) && !pure(((y - 1) * width + x) * 4)) {
            seeds.push({ x, y });
          }
        }
      }
      return { diff, seeds, width: x1 >= x0 ? x1 - x0 + 1 : 0 };
    });
  const seedSpan = (c) =>
    c.seeds.length === 0
      ? 0
      : Math.max(...c.seeds.map((s) => s.x)) - Math.min(...c.seeds.map((s) => s.x));
  await focusCanvas();
  await page.keyboard.press('Escape');
  await settle(80);
  await baseline();
  const none = await chrome();
  assert(
    none.diff === 0 && none.seeds.length === 0,
    'nothing selected: no chrome on the canvas, and it matches its own baseline',
  );
  await page.keyboard.press(']');
  await settle(80);
  const one = await chrome();
  assert(
    one.diff > 200 && one.seeds.length === 8,
    `a lone selection paints an outline and its eight handles (${one.diff} pixels changed, ${one.seeds.length} handle squares)`,
  );
  await chord(['Shift'], ']');
  await settle(80);
  assert(
    (await say()) === '2 of 4 annotations selected.',
    'two layers selected for the pixel read',
  );
  const two = await chrome();
  assert(
    two.width > one.width + 20,
    `the second layer got its own outline: the changed region widened from ${one.width}px to ${two.width}px, the two layers being 30 image px apart`,
  );
  assert(
    two.seeds.length === 8,
    `still one set of eight handles, not one set per layer (${two.seeds.length} handle squares — 16 would mean each layer kept its own)`,
  );
  assert(
    seedSpan(two) > seedSpan(one) + 20,
    `and that set moved onto the box around both layers: the handles now span ${seedSpan(two)}px, against ${seedSpan(one)}px for the lone selection`,
  );

  step('task 24: none of that selection chrome reaches an exported image');
  await chord(['Meta'], 's');
  await page.waitForSelector('.modal');
  await page.waitForFunction(() =>
    document.querySelector('.modal').contains(document.activeElement),
  );
  await page.$eval('.format-grid .format-card:first-child', (el) => el.focus());
  await page.keyboard.press('Enter');
  await settle();
  await page.$eval('.modal .btn-primary', (el) => el.focus());
  await page.keyboard.press('Enter');
  await settle(800);
  const download = await page.evaluate(() => globalThis.__smoke.downloads.at(-1));
  assert(download.filename.endsWith('.png'), 'exported a PNG with two layers selected');
  const sharp = createRequire(join(ROOT, 'package.json'))('sharp');
  const { data, info } = await sharp(
    Buffer.from(download.url.slice(download.url.indexOf(',') + 1), 'base64'),
  )
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  // The capture is a flat blue and every annotation is drawn in the palette
  // red, so nothing in a clean export comes near black or white — while the
  // canvas at this same moment is full of both (the counts above).
  let extremes = 0;
  for (let i = 0; i < data.length; i += info.channels) {
    const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
    if ((r < 40 && g < 40 && b < 40) || (r > 215 && g > 215 && b > 215)) extremes++;
  }
  assert(
    info.width === 800 && info.height === 600,
    `the export is the whole capture (${info.width}x${info.height}), so the scan below covers where the outlines were`,
  );
  assert(
    extremes === 0,
    `no near-black or near-white pixel anywhere in the export (${extremes} found), while the same selection puts ${two.diff} pixels of chrome on the live canvas`,
  );

  step('task 24: Alt and an arrow resizes every selected layer, about the group box');
  // A layer's size, read the way its position is read: select it alone, resize
  // one pixel each way, and take the size the live region reads out.
  // The size of whatever is selected right now, with no bracket press: reading
  // one layer's size must not move the selection onto the next one.
  const sizeOfSelected = async () => {
    await chord(['Alt'], 'ArrowRight');
    await chord(['Alt'], 'ArrowLeft');
    await settle(60);
    const m = (await say()).match(/resized to (\d+) by (\d+)/);
    if (!m) throw new Error(`expected a resize announcement, got "${await say()}"`);
    return m.slice(1).map(Number);
  };
  const readNextLayerSize = async (key = ']') => {
    await page.keyboard.press(key);
    await chord(['Alt'], 'ArrowRight');
    await chord(['Alt'], 'ArrowLeft');
    await settle(60);
    const m = (await say()).match(/resized to (\d+) by (\d+)/);
    if (!m) throw new Error(`expected a resize announcement, got "${await say()}"`);
    return m.slice(1).map(Number);
  };
  await focusCanvas();
  await page.keyboard.press('Escape');
  const [w1, h1] = await readNextLayerSize();
  const [w2] = await readNextLayerSize();
  await chord(['Shift'], '[');
  await settle(60);
  assert((await say()) === '2 of 4 annotations selected.', 'the same two layers selected');
  await chord(['Alt', 'Shift'], 'ArrowRight');
  await settle(80);
  assert(
    (await say()) === '2 annotations resized.',
    `the live region counted the layers the resize touched: "${await say()}"`,
  );
  await page.keyboard.press('Escape');
  const [w1b, h1b] = await readNextLayerSize();
  const [w2b] = await readNextLayerSize();
  assert(
    w1b > w1 && w2b > w2,
    `both selected layers grew with the group box (${w1}->${w1b}, ${w2}->${w2b})`,
  );
  assert(
    h1b === h1,
    `and only on the axis the key named: the first layer's height held at ${h1b}px`,
  );
  // Negative control: one selected layer, the same chord — that layer grows and
  // the other does not, so "both grew" above is the selection doing the work.
  await page.keyboard.press('Escape');
  await page.keyboard.press(']');
  await chord(['Alt', 'Shift'], 'ArrowRight');
  await settle(80);
  await page.keyboard.press('Escape');
  const [w1c] = await readNextLayerSize();
  const [w2c] = await readNextLayerSize();
  assert(
    w1c > w1b && w2c === w2b,
    `negative control: one selected layer grew and the other did not (${w1b}->${w1c}, ${w2b}->${w2c})`,
  );

  step('task 24: dragging a group handle scales every selected layer');
  await page.keyboard.press('Escape');
  await page.keyboard.press(']');
  await chord(['Shift'], ']');
  await settle(80);
  assert((await say()) === '2 of 4 annotations selected.', 'two layers selected for the drag');
  await baseline();
  const handles = await chrome();
  assert(
    handles.seeds.length === 8,
    `the group carries eight handles to grab (${handles.seeds.length})`,
  );
  const dpr = await page.evaluate(() => window.devicePixelRatio || 1);
  const rect = await page.$eval('.stage-canvas', (el) => {
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y };
  });
  // Row-major scan order, so the first seed is the top-left handle: dragging it
  // up and to the left grows the box every selected layer sits in.
  const nw = handles.seeds[0];
  await drag(
    rect.x + nw.x / dpr + 3,
    rect.y + nw.y / dpr + 3,
    rect.x + nw.x / dpr - 17,
    rect.y + nw.y / dpr - 17,
  );
  assert(
    (await say()) === '2 annotations resized.',
    `the handle drag resized the whole selection: "${await say()}"`,
  );
  await page.keyboard.press('Escape');
  const [w1d] = await readNextLayerSize();
  const [w2d] = await readNextLayerSize();
  assert(
    w1d > w1c && w2d > w2c,
    `both layers grew from one handle drag (${w1c}->${w1d}, ${w2c}->${w2d})`,
  );

  step('task 24: a text member scales with the group box and comes back exactly');
  // Text and step badges cannot be stretched on one axis, so a group hands them
  // a uniform factor. Taking the larger of the two used to scale their POSITION
  // by it as well, which threw them out of the box being dragged — by more the
  // further they sat from the anchored corner — and made every widen-and-narrow
  // pair leave the glyph permanently bigger.
  await focusCanvas();
  await page.keyboard.press('Escape');
  await page.keyboard.press('t');
  await page.keyboard.press('Enter');
  await page.waitForSelector('textarea.text-overlay');
  await page.keyboard.type('note');
  await page.keyboard.press('Enter');
  await settle(200);
  await page.keyboard.press('Escape');
  await page.keyboard.press('[');
  await settle(60);
  assert(/^Text selected/.test(await say()), `the text layer is on top: "${await say()}"`);
  // Down and right, clear of the rectangle that follows: away from the box's
  // top-left, because a member sitting on the anchored corner cannot show a
  // position error, and out past the rectangle's right edge, because a glyph
  // tucked inside a wider neighbour never sets the box's edge — and a glyph
  // that does not set the edge cannot show the round trip failing either.
  for (let i = 0; i < 10; i++) await chord(['Shift'], 'ArrowDown');
  for (let i = 0; i < 20; i++) await chord(['Shift'], 'ArrowRight');
  await settle(80);
  await page.keyboard.press('Escape');
  const [tx0, ty0] = await readNextLayer('[');
  assert(/^Text moved to /.test(await say()), `the text layer, before the rectangle exists`);
  await page.keyboard.press('r');
  await page.keyboard.press('Enter');
  await settle(80);
  await chord(['Shift'], '[');
  await settle(60);
  assert(
    /^2 of \d+ annotations selected\.$/.test(await say()),
    `the text and the rectangle over it, selected together: "${await say()}"`,
  );
  for (let i = 0; i < 10; i++) await chord(['Alt', 'Shift'], 'ArrowRight');
  await settle(120);
  assert((await say()) === '2 annotations resized.', `the group widened: "${await say()}"`);
  await page.keyboard.press('Escape');
  await page.keyboard.press('[');
  const [tx1, ty1] = await readNextLayer('[');
  assert(/^Text moved to /.test(await say()), `measuring the text after the widen`);
  assert(
    ty1 === ty0,
    `a width-only group resize left the text where it was on the other axis (y ${ty0} -> ${ty1})`,
  );
  assert(tx1 > tx0, `and carried it across with the box (x ${tx0} -> ${tx1})`);

  // The round trip, measured from its own baseline. Reading a layer's position
  // selects it alone and nudges it a pixel each way, and a move of one member
  // of a carried box is not a move of the box, so the reading drops it. The
  // pairs below therefore run with no reading inside them.
  await page.keyboard.press('Escape');
  // `[` from nothing selects the top layer, which is the rectangle; a second
  // one walks down to the text. Every reading below names the layer it read,
  // so measuring the wrong one fails here rather than passing quietly. The
  // rectangle is read first because it is the member the drift hit hardest.
  const [rx3, ry3] = await readNextLayer('[');
  assert(/^Rectangle moved to /.test(await say()), `measuring the rectangle: "${await say()}"`);
  const [rw3] = await sizeOfSelected();
  await page.keyboard.press('Escape');
  await page.keyboard.press('[');
  const [tx3, ty3] = await readNextLayer('[');
  assert(/^Text moved to /.test(await say()), `measuring the text layer: "${await say()}"`);
  const [tw3] = await sizeOfSelected();
  await page.keyboard.press('Escape');
  await page.keyboard.press('[');
  await chord(['Shift'], '[');
  await settle(60);
  assert(
    /^2 of \d+ annotations selected\.$/.test(await say()),
    `both selected for the round trip: "${await say()}"`,
  );
  // Three pairs, not one: the drift this covers is a few percent per pair, so
  // one pair can hide inside the whole-pixel rounding the live region reads
  // out. Three cannot.
  //
  // And every pair is interrupted: narrow, click away, click back on the same
  // two layers, widen back. The box the widen resizes has to be the one the
  // narrow produced, or the widen starts from a union a glyph has overhung and
  // gets a smaller factor than the exact inverse. Escape and the two bracket
  // presses go through nothing-selected and then one layer, so the box has to
  // survive a subset of itself, not only the same set (carryGroupBox).
  const reselect = async () => {
    await page.keyboard.press('Escape');
    await page.keyboard.press('[');
    await chord(['Shift'], '[');
    await settle(60);
  };
  for (let pair = 0; pair < 3; pair++) {
    for (let i = 0; i < 10; i++) await chord(['Alt', 'Shift'], 'ArrowLeft');
    await reselect();
    for (let i = 0; i < 10; i++) await chord(['Alt', 'Shift'], 'ArrowRight');
    await reselect();
  }
  await settle(150);
  // The rectangle first: it is the member that did not set the box's edge, and
  // the one the drift hit hardest — ~3.3% a cycle when each resize recomputed
  // the box from the members instead of carrying it.
  await page.keyboard.press('Escape');
  const [rx4, ry4] = await readNextLayer('[');
  assert(
    /^Rectangle moved to /.test(await say()),
    `measuring the rectangle again: "${await say()}"`,
  );
  const [rw4] = await sizeOfSelected();
  assert(
    rw4 === rw3,
    `three interrupted 100px pairs left the rectangle its exact width: ${rw3}px before, ${rw4}px after`,
  );
  assert(rx4 === rx3 && ry4 === ry3, `and its exact origin (${rx3},${ry3} -> ${rx4},${ry4})`);
  await page.keyboard.press('Escape');
  await page.keyboard.press('[');
  const [tx4, ty4] = await readNextLayer('[');
  assert(/^Text moved to /.test(await say()), `measuring the text layer again: "${await say()}"`);
  const [tw4] = await sizeOfSelected();
  assert(
    tx4 === tx3 && ty4 === ty3,
    `the text came back to its own origin too (${tx3},${ty3} -> ${tx4},${ty4})`,
  );
  // Each size reading grows a lone text layer by one pixel and does not shrink
  // it back — the single-annotation rule, unchanged by this task and left
  // alone deliberately. So one pixel is the whole expected difference here.
  assert(
    tw4 - tw3 === 1,
    `and to its size: ${tw3}px before, ${tw4}px after, the 1px being this reading itself`,
  );

  step('task 24: a nudge between the two halves of a resize does not break the pair');
  // The other ordinary interruption, and the one edit the box can follow: the
  // members translate, the box translates with them. Every other list edit
  // drops it, which is right — the members really have moved somewhere the box
  // cannot describe. Three pairs again, and the nudges are all one direction,
  // so a box that failed to follow shows up as a wrong x, not only a wrong
  // size.
  await page.keyboard.press('Escape');
  await page.keyboard.press('[');
  await chord(['Shift'], '[');
  await settle(60);
  assert(
    /^2 of \d+ annotations selected\.$/.test(await say()),
    `both selected for the nudged round trip: "${await say()}"`,
  );
  for (let pair = 0; pair < 3; pair++) {
    for (let i = 0; i < 10; i++) await chord(['Alt', 'Shift'], 'ArrowLeft');
    for (let i = 0; i < 5; i++) await page.keyboard.press('ArrowLeft');
    for (let i = 0; i < 10; i++) await chord(['Alt', 'Shift'], 'ArrowRight');
    for (let i = 0; i < 5; i++) await page.keyboard.press('ArrowLeft');
  }
  await settle(150);
  await page.keyboard.press('Escape');
  const [rx5, ry5] = await readNextLayer('[');
  assert(/^Rectangle moved to /.test(await say()), `measuring the rectangle: "${await say()}"`);
  const [rw5] = await sizeOfSelected();
  assert(
    rw5 === rw4,
    `the rectangle kept its exact width across three nudged pairs: ${rw4}px before, ${rw5}px after`,
  );
  assert(
    rx5 === rx4 - 30 && ry5 === ry4,
    `and moved by the 30px of nudges, no more (${rx4},${ry4} -> ${rx5},${ry5})`,
  );
  await page.keyboard.press('Escape');
  await page.keyboard.press('[');
  const [tx5, ty5] = await readNextLayer('[');
  assert(/^Text moved to /.test(await say()), `measuring the text layer: "${await say()}"`);
  assert(
    tx5 === tx4 - 30 && ty5 === ty4,
    `the text moved by the same 30px and nothing else (${tx4},${ty4} -> ${tx5},${ty5})`,
  );

  step('task 24: a colour change between the two halves does not break the pair');
  // The edit that moves nothing. A number key with a selection writes that
  // colour to every member, through the same applyAnnotations every list edit
  // goes through, and keepBoxThroughEdit is what reads the members and decides
  // the frame still describes them.
  await page.keyboard.press('Escape');
  await page.keyboard.press('[');
  await chord(['Shift'], '[');
  await settle(60);
  assert(
    /^2 of \d+ annotations selected\.$/.test(await say()),
    `both selected for the recoloured round trip: "${await say()}"`,
  );
  for (let pair = 0; pair < 3; pair++) {
    for (let i = 0; i < 10; i++) await chord(['Alt', 'Shift'], 'ArrowLeft');
    await page.keyboard.press('1');
    await settle(60);
    for (let i = 0; i < 10; i++) await chord(['Alt', 'Shift'], 'ArrowRight');
    await page.keyboard.press('2');
    await settle(60);
  }
  await settle(150);
  await page.keyboard.press('Escape');
  const [rx6, ry6] = await readNextLayer('[');
  assert(/^Rectangle moved to /.test(await say()), `measuring the rectangle: "${await say()}"`);
  const [rw6] = await sizeOfSelected();
  assert(
    rw6 === rw5,
    `the rectangle kept its exact width across three recoloured pairs: ${rw5}px before, ${rw6}px after`,
  );
  assert(rx6 === rx5 && ry6 === ry5, `and its exact origin (${rx5},${ry5} -> ${rx6},${ry6})`);
  await page.keyboard.press('Escape');
  await page.keyboard.press('[');
  const [tx6, ty6] = await readNextLayer('[');
  assert(/^Text moved to /.test(await say()), `measuring the text layer: "${await say()}"`);
  assert(
    tx6 === tx5 && ty6 === ty5,
    `and the text came back to its own origin (${tx5},${ty5} -> ${tx6},${ty6})`,
  );

  step(
    'task 24: the style bar keeps its value when the selection disagrees, and adopts when it agrees',
  );
  const pressedSwatch = () =>
    page.$$eval('.swatches .swatch[aria-pressed="true"]', (els) =>
      els.map((e) => e.getAttribute('aria-label')),
    );
  await focusCanvas();
  await page.keyboard.press('Escape');
  // The Rectangle tool, so the bar renders its colour swatches: with the Select
  // tool and nothing selected there are no fields at all (stylebar.ts).
  await page.keyboard.press('r');
  // A number key with nothing selected only sets what the next shape is drawn
  // in; with a selection it would write that colour to it, which is the other
  // half of this decision and not what is under test here.
  await page.keyboard.press('1');
  await settle(60);
  const [colorA] = await pressedSwatch();
  await page.keyboard.press('r');
  await page.keyboard.press('Enter');
  await settle(80);
  await page.keyboard.press('Escape');
  await page.keyboard.press('r');
  await page.keyboard.press('2');
  await settle(60);
  const [colorB] = await pressedSwatch();
  assert(
    !!colorA && !!colorB && colorA !== colorB,
    `two different palette colours (${colorA}, ${colorB})`,
  );
  await page.keyboard.press('r');
  await page.keyboard.press('Enter');
  await settle(80);
  assert(
    (await pressedSwatch()).join() === colorB,
    `the lone new layer's colour is what the bar shows: "${colorB}"`,
  );
  await chord(['Shift'], '[');
  await settle(80);
  assert(
    /^2 of \d+ annotations selected\.$/.test(await say()),
    `extended onto the layer drawn in the other colour: "${await say()}"`,
  );
  assert(
    (await pressedSwatch()).join() === colorB,
    `the bar held its value rather than adopt one member's: still "${colorB}", not "${colorA}"`,
  );
  await page.keyboard.press('v');
  await settle(60);
  const centre = await page.$eval('.stage-canvas', (el) => {
    const r = el.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  });
  await page.keyboard.down('Shift');
  await page.mouse.click(centre.x, centre.y);
  await page.keyboard.up('Shift');
  await settle(80);
  assert(
    /^Rectangle selected, layer \d+ of \d+\.$/.test(await say()),
    `shift-click took the topmost layer back out, leaving one: "${await say()}"`,
  );
  assert(
    (await pressedSwatch()).join() === colorA,
    `and with the disagreement gone the bar adopted the remaining layer's colour: "${colorA}"`,
  );
  // The discriminating case for "held, not adopted": from this state, the
  // newest member of the selection and its topmost member are both the other
  // colour, so any rule that picked one of them would flip the bar. It does
  // not — the disagreement leaves the bar where it was.
  await focusCanvas();
  await chord(['Shift'], ']');
  await settle(80);
  assert(
    /^2 of \d+ annotations selected\.$/.test(await say()),
    `extended back onto the other colour: "${await say()}"`,
  );
  assert(
    (await pressedSwatch()).join() === colorA,
    `the bar is still "${colorA}", though both the newest and the topmost selected layer are "${colorB}"`,
  );

  step('task 24: a nudge past the image edge is not clamped');
  // Recording the behaviour as it stands. Nothing in the nudge path clamps to
  // the image, and that was true of the single selection before this task —
  // this is here so a future clamp is a deliberate change, not a surprise.
  await focusCanvas();
  await page.keyboard.press('Escape');
  await page.keyboard.press(']');
  await chord(['Shift'], ']');
  await settle(60);
  assert(/^2 of \d+ annotations selected\.$/.test(await say()), 'two layers selected to push off');
  for (let i = 0; i < 40; i++) {
    await chord(['Shift'], 'ArrowLeft');
  }
  await settle(120);
  await page.keyboard.press('Escape');
  const [offX] = await readNextLayer();
  assert(
    offX < 0,
    `400px of Shift-nudges walked the first layer off the left edge to x=${offX}, unclamped`,
  );

  step('task 24: Escape says the selection went, like every other way of losing it');
  await page.keyboard.press('Escape');
  await settle(60);
  assert((await say()) === 'Selection cleared.', `Escape announced: "${await say()}"`);

  assert(crashes.length === 0, `no page errors (${crashes.join(' | ') || 'none'})`);
  await page.close();
}

/**
 * The topmost canvas row painted in the palette purple, which no stripe comes
 * near: the drawn top edge of the highest mark drawn in it. Read off the
 * canvas because a test may need it without moving a mark — a nudge changes a
 * member's bbox, and that is what drops a carried group frame.
 */
function topPaintedRow(page) {
  return paintedRow(page, 1);
}

/** The same, from the bottom of the canvas up. */
function bottomPaintedRow(page) {
  return paintedRow(page, -1);
}

function paintedRow(page, dir) {
  return page.evaluate((step) => {
    const cv = document.querySelector('.stage-canvas');
    const { data } = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height);
    const from = step > 0 ? 0 : cv.height - 1;
    for (let y = from; y >= 0 && y < cv.height; y += step) {
      for (let x = 0; x < cv.width; x++) {
        const i = (y * cv.width + x) * 4;
        if (
          data[i + 3] === 255 &&
          Math.abs(data[i] - 175) < 40 &&
          Math.abs(data[i + 1] - 82) < 45 &&
          Math.abs(data[i + 2] - 222) < 40
        ) {
          return y;
        }
      }
    }
    return -1;
  }, dir);
}

/**
 * Where the picture sits on screen, measured off the canvas rather than
 * recomputed from the viewport maths this is meant to be checking: the first
 * and last rows and columns holding an opaque stripe colour, converted to page
 * coordinates the mouse can be driven with. `y(imageY)` takes a composed row.
 */
async function pictureGeometry(page, composedH) {
  const g = await page.evaluate(() => {
    const cv = document.querySelector('.stage-canvas');
    const r = cv.getBoundingClientRect();
    const { data } = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height);
    const isPicture = (i) => {
      const [red, green, blue, a] = [data[i], data[i + 1], data[i + 2], data[i + 3]];
      if (a !== 255) return false;
      return (
        (red > 150 && green < 110 && blue < 110) ||
        (green > 150 && red < 110 && blue < 110) ||
        (blue > 150 && red < 110 && green < 110)
      );
    };
    let top = -1;
    let bottom = -1;
    let left = -1;
    let right = -1;
    for (let y = 0; y < cv.height; y++) {
      for (let x = 0; x < cv.width; x++) {
        if (!isPicture((y * cv.width + x) * 4)) continue;
        if (top < 0) top = y;
        bottom = y;
        if (left < 0 || x < left) left = x;
        if (x > right) right = x;
      }
    }
    return {
      rect: { left: r.left, top: r.top },
      sx: cv.width / r.width,
      sy: cv.height / r.height,
      top,
      bottom,
      left,
      right,
    };
  });
  // The zoom is uniform, so one scale serves both axes.
  const scale = (g.bottom - g.top + 1) / composedH;
  return {
    x: g.rect.left + (g.left + g.right) / 2 / g.sx,
    xAt: (imageX) => g.rect.left + (g.left + imageX * scale) / g.sx,
    y: (imageY) => g.rect.top + (g.top + imageY * scale) / g.sy,
    /** A canvas backing-store row, back to the composed image row it shows. */
    imageY: (row) => (row - g.top) / scale,
  };
}

/**
 * Task 25: the Cut tool, end to end.
 *
 * A cut is a band on a list applied where the picture is drawn, so the two
 * things worth driving in a real browser are the two the unit tests cannot
 * reach: that the live canvas and the exported file are the same picture with
 * the same rows missing, and that a cut survives the round trip through
 * storage. The capture is three flat stripes, so "the middle stripe is gone
 * and the rows closed up" is a pixel fact, not a judgement.
 */
async function testCutTool(browser, base, messages) {
  step('task 25: a cut removes a band from the live canvas and from every export');
  const { page } = await newSmokePage(browser);
  const crashes = [];
  page.on('pageerror', (err) => crashes.push(String(err)));
  const capture = await makeStripedCapture();
  // The theme is pinned rather than left to the machine: the census below
  // reads the whole canvas, and the stage plate behind the picture is
  // near-black in the dark theme — which is exactly the bucket the seam
  // marker's own hairline is counted in.
  await page.evaluateOnNewDocument(installChromeStub, messages, {
    'openscreenshot:last-capture': capture,
    'openscreenshot:settings': { theme: 'light' },
  });
  await page.goto(`${base}${PAGE}`, { waitUntil: 'networkidle0' });
  await page.waitForSelector('.stage-canvas');
  await new Promise((r) => setTimeout(r, 900));

  const settle = (ms = 120) => new Promise((r) => setTimeout(r, ms));
  const say = () =>
    page.evaluate(() =>
      document.querySelector('[aria-live="polite"][role="status"]').textContent.trim(),
    );
  const size = () => page.$eval('.statusbar > span', (el) => el.textContent.trim());
  async function chord(mods, key) {
    for (const m of mods) await page.keyboard.down(m);
    await page.keyboard.press(key);
    for (const m of mods.slice().reverse()) await page.keyboard.up(m);
  }
  /**
   * A colour census of the live canvas. The stage around the picture is the
   * light plate and its checkerboard, so it lands in none of these buckets:
   * the three stripe buckets are picture, and black/white are the seam
   * marker's two hairlines.
   */
  const census = () =>
    page.evaluate(() => {
      const cv = document.querySelector('.stage-canvas');
      const { data } = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height);
      const out = { red: 0, green: 0, blue: 0, black: 0 };
      for (let i = 0; i < data.length; i += 4) {
        const [r, g, b, a] = [data[i], data[i + 1], data[i + 2], data[i + 3]];
        // Opaque pixels only. The drop shadow the stage paints around the
        // plate is black at an alpha of 1 to 4, and it covers thousands of
        // pixels — far more than the seam's own hairline.
        if (a !== 255) continue;
        if (r > 150 && g < 110 && b < 110) out.red++;
        else if (g > 150 && r < 110 && b < 110) out.green++;
        else if (b > 150 && r < 110 && g < 110) out.blue++;
        else if (r < 40 && g < 40 && b < 40) out.black++;
      }
      return out;
    });
  const band = async () => {
    const m = (await say()).match(/Cut band (\d+) pixels tall at (\d+)\./);
    if (!m) throw new Error(`expected a drafted band, got "${await say()}"`);
    return { h: Number(m[1]), y: Number(m[2]) };
  };
  /** Walk a drafted band to an exact height and top edge, 10px then 1px. */
  const walk = async (mods, delta) => {
    const key = delta > 0 ? 'ArrowDown' : 'ArrowUp';
    for (let i = 0; i < Math.floor(Math.abs(delta) / 10); i++) await chord([...mods, 'Shift'], key);
    for (let i = 0; i < Math.abs(delta) % 10; i++) await chord(mods, key);
    await settle(60);
  };

  await page.$eval('.stage-canvas', (el) => el.focus());
  const before = await census();
  assert(
    before.green > 1000 && before.black === 0,
    `the picture starts with its middle stripe (${before.green} green pixels) and no seam (${before.black} black)`,
  );
  assert(
    (await size()) === '800 × 600px',
    `the status bar starts at the capture's size (${await size()})`,
  );

  step('task 25: Enter with the Cut tool drafts a band, and the arrows drive it');
  await page.keyboard.press('x');
  await page.keyboard.press('Enter');
  await settle();
  const placed = await band();
  assert(placed.h > 0, `Enter drafted a band (${placed.h} pixels tall at ${placed.y})`);
  await walk(['Alt'], 200 - placed.h);
  const sized = await band();
  assert(sized.h === 200, `Alt and the arrows resized it to exactly 200 (${sized.h})`);
  await walk([], 200 - sized.y);
  const aimed = await band();
  assert(
    aimed.y === 200 && aimed.h === 200,
    `the band sits on the middle stripe, rows 200 to 400 (at ${aimed.y}, ${aimed.h} tall)`,
  );
  // Nothing is cut yet: the draft is a preview, and the picture is whole.
  assert((await size()) === '800 × 600px', 'the drafted band has not shortened the picture yet');

  step('task 25: Enter takes the band out — the middle stripe leaves the live canvas');
  await page.keyboard.press('Enter');
  await settle();
  assert(
    (await say()) === 'Cut 200 pixels. Image 400 pixels tall.',
    `the live region reports what went and what is left ("${await say()}")`,
  );
  const cut = await census();
  assert(cut.green === 0, `no green pixel is left on the canvas (${cut.green})`);
  assert(
    cut.red > 1000 && cut.blue > 1000,
    `the stripes either side are still there (${cut.red} red, ${cut.blue} blue)`,
  );
  assert(cut.black > 200, `a seam marker was drawn where the band was (${cut.black} black pixels)`);
  assert(
    (await size()) === '800 × 400px',
    `the status bar reports the shorter picture (${await size()})`,
  );

  step('task 25: the cut is in the saved draft, so it survives a crash');
  await settle(1000); // past DRAFT_DEBOUNCE_MS
  const saved = await page.evaluate(async () => {
    const got = await chrome.storage.local.get('openscreenshot:draft');
    return got['openscreenshot:draft'] ?? null;
  });
  assert(
    JSON.stringify(saved?.bands) === JSON.stringify([{ y: 200, h: 200 }]),
    `the autosave wrote the band (${JSON.stringify(saved?.bands)})`,
  );

  step('task 25: the export is the same picture, row for row, and carries no seam marker');
  const sharp = createRequire(join(ROOT, 'package.json'))('sharp');
  const exportAs = async (cardIndex) => {
    await chord(['Meta'], 's');
    await page.waitForSelector('.modal');
    await page.waitForFunction(() =>
      document.querySelector('.modal').contains(document.activeElement),
    );
    await page.$$eval('.format-grid .format-card', (cards, i) => cards[i].focus(), cardIndex);
    await page.keyboard.press('Enter');
    await settle();
    await page.$eval('.modal .btn-primary', (el) => el.focus());
    await page.keyboard.press('Enter');
    await settle(900);
    const download = await page.evaluate(() => globalThis.__smoke.downloads.at(-1));
    const { data, info } = await sharp(
      Buffer.from(download.url.slice(download.url.indexOf(',') + 1), 'base64'),
    )
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    return { download, data, info };
  };

  const png = await exportAs(0);
  assert(png.download.filename.endsWith('.png'), `exported a PNG (${png.download.filename})`);
  assert(
    png.info.width === 800 && png.info.height === 400,
    `the PNG is 800 by 400 — the capture's 600 rows less the 200 cut (${png.info.width}x${png.info.height})`,
  );
  // Every composed row must hold the colour of the source row the band map
  // sends it to: rows above the cut unchanged, rows below pulled up by 200.
  let wrongRow = -1;
  let extremes = 0;
  for (let y = 0; y < png.info.height; y++) {
    const i = (y * png.info.width + 400) * png.info.channels;
    const want = STRIPES[Math.floor((y < 200 ? y : y + 200) / 200)];
    const got = [png.data[i], png.data[i + 1], png.data[i + 2]];
    if (wrongRow === -1 && want.some((v, k) => v !== got[k])) wrongRow = y;
  }
  for (let i = 0; i < png.data.length; i += png.info.channels) {
    const [r, g, b] = [png.data[i], png.data[i + 1], png.data[i + 2]];
    if ((r < 40 && g < 40 && b < 40) || (r > 215 && g > 215 && b > 215)) extremes++;
  }
  assert(
    wrongRow === -1,
    `every exported row holds the source row the cut maps it to (first mismatch: ${wrongRow})`,
  );
  assert(
    extremes === 0,
    `no seam marker reached the file (${extremes} near-black or near-white pixels), while the canvas at this moment carries ${cut.black}`,
  );

  const jpeg = await exportAs(1);
  assert(
    jpeg.download.filename.endsWith('.jpg'),
    `exported a JPEG too (${jpeg.download.filename})`,
  );
  assert(
    jpeg.info.width === 800 && jpeg.info.height === 400,
    `the JPEG is the same cut picture (${jpeg.info.width}x${jpeg.info.height})`,
  );

  step('task 25: undo puts the strip back, and does not clear the stack behind it');
  await page.$eval('.stage-canvas', (el) => el.focus());
  await chord(['Meta'], 'z');
  await settle();
  const undone = await census();
  assert(undone.green > 1000, `the middle stripe is back (${undone.green} green pixels)`);
  assert(undone.black === 0, `and the seam went with it (${undone.black} black pixels)`);
  assert((await size()) === '800 × 600px', `the picture is whole again (${await size()})`);

  step('task 25: Delete with the Cut tool puts back the nearest cut');
  await chord(['Meta'], 'y'); // redo the cut
  await settle();
  assert((await size()) === '800 × 400px', 'redo took the band out again');
  await page.keyboard.press('Delete');
  await settle();
  assert(
    (await say()) === 'Put back 200 pixels. Image 600 pixels tall.',
    `Delete named what it put back ("${await say()}")`,
  );
  assert((await size()) === '800 × 600px', `and the picture is whole (${await size()})`);

  step('task 25: a drag cuts a band, and a click on the seam puts it back');
  /**
   * Where the picture sits on screen, measured off the canvas rather than
   * recomputed from the viewport maths this is meant to be checking: the first
   * and last rows and columns holding an opaque stripe colour, converted to
   * page coordinates the mouse can be driven with.
   */
  const whole = await pictureGeometry(page, 600);
  await page.mouse.move(whole.x, whole.y(100));
  await page.mouse.down();
  await page.mouse.move(whole.x, whole.y(180), { steps: 8 });
  await page.mouse.up();
  await settle(150);
  const dragged = (await say()).match(/Cut (\d+) pixels\. Image (\d+) pixels tall\./);
  assert(
    dragged && Math.abs(Number(dragged[1]) - 80) <= 2,
    `the drag took the 80 rows it covered ("${await say()}")`,
  );
  assert(
    Number(dragged[2]) === 600 - Number(dragged[1]),
    `and the picture lost exactly those rows (${dragged?.[2]} left of 600)`,
  );
  const afterDrag = await census();
  assert(afterDrag.black > 200, `the drag left a seam behind it (${afterDrag.black} black pixels)`);

  const shortened = await pictureGeometry(page, Number(dragged[2]));
  await page.mouse.click(shortened.x, shortened.y(100));
  await settle(150);
  assert(
    (await say()) === `Put back ${dragged[1]} pixels. Image 600 pixels tall.`,
    `a click on the seam put the strip back ("${await say()}")`,
  );
  assert((await size()) === '800 × 600px', `the picture is whole again (${await size()})`);
  assert((await census()).black === 0, 'and the seam went with the cut it marked');

  step('task 25: a cut carries the marks below it up with the picture');
  // A rectangle in a palette colour none of the stripes come near, so where it
  // lands in an export is a pixel search rather than a guess.
  await page.$eval('.stage-canvas', (el) => el.focus());
  await page.keyboard.press('6'); // Purple
  await page.keyboard.press('r');
  await page.keyboard.press('Enter');
  await settle();
  const added = (await say()).match(/Rectangle added at (-?\d+), (-?\d+)\./);
  assert(added !== null, `a rectangle was placed ("${await say()}")`);
  const markY = Number(added[2]);
  await page.keyboard.press('Escape'); // so the band walk below cannot move it
  await settle();

  /** The topmost row of an export holding the mark's colour, or -1. */
  const firstMark = ({ data, info }) => {
    for (let y = 0; y < info.height; y++) {
      for (let x = 0; x < info.width; x++) {
        const i = (y * info.width + x) * info.channels;
        if (
          Math.abs(data[i] - 175) < 30 &&
          Math.abs(data[i + 1] - 82) < 40 &&
          Math.abs(data[i + 2] - 222) < 30
        ) {
          return y;
        }
      }
    }
    return -1;
  };
  /** Draft a band with Enter, walk it to an exact place, and take it out. */
  const cutExactly = async (y, h) => {
    await page.$eval('.stage-canvas', (el) => el.focus());
    await page.keyboard.press('x');
    await page.keyboard.press('Enter');
    await settle();
    const placed = await band();
    await walk(['Alt'], h - placed.h);
    await walk([], y - (await band()).y);
    const aimed = await band();
    assert(
      aimed.y === y && aimed.h === h,
      `band drafted at exactly ${y}, ${h} tall (${aimed.y}, ${aimed.h})`,
    );
    await page.keyboard.press('Enter');
    await settle();
  };

  const uncut = await exportAs(0);
  const wholeTop = firstMark(uncut);
  assert(
    wholeTop > 0 && Math.abs(wholeTop - markY) <= 4,
    `the mark is in the uncut export, where it was placed (row ${wholeTop}, placed at ${markY})`,
  );

  await cutExactly(0, 100);
  const shifted = await exportAs(0);
  assert(shifted.info.height === 500, `the export lost the 100 cut rows (${shifted.info.height})`);
  assert(
    firstMark(shifted) === wholeTop - 100,
    `the mark came up with the picture under it, by the whole band (row ${firstMark(shifted)}, was ${wholeTop})`,
  );

  await cutExactly(markY, 20);
  const covered = await exportAs(0);
  assert(
    firstMark(covered) === -1,
    `a mark whose top edge is on a removed row leaves with those rows (found at row ${firstMark(covered)})`,
  );

  await page.$eval('.stage-canvas', (el) => el.focus());
  await chord(['Meta'], 'z');
  await settle();
  assert(
    (await say()) === 'Undo. Image 500 pixels tall. 1 annotation.',
    `undoing a cut says the strip came back and how tall the picture is now ("${await say()}")`,
  );
  await chord(['Meta'], 'z');
  await settle();
  const restored = await exportAs(0);
  assert(
    restored.info.height === 600 && firstMark(restored) === wholeTop,
    `undoing both cuts puts the picture and the mark back exactly (${restored.info.height} tall, mark at row ${firstMark(restored)})`,
  );

  step('task 25 fix: undo carries on past the cuts, into the stack they were made on');
  await page.$eval('.stage-canvas', (el) => el.focus());
  await chord(['Meta'], 'z');
  await settle();
  assert(
    (await say()) === 'Undo. 0 annotations.',
    `a third undo reached the edit the cuts were made on top of ("${await say()}")`,
  );
  assert(
    (await page.$('.toolbar-count')) === null,
    'the rectangle placed before the two cuts is gone, so the stack behind them survived them',
  );
  assert(
    (await size()) === '800 × 600px',
    `and that step named no height, because it crossed no cut (${await size()})`,
  );
  await chord(['Meta'], 'y');
  await settle();
  assert(
    (await page.$eval('.toolbar-count span', (el) => el.textContent)) === '1',
    'redo puts the rectangle back for the checks below',
  );

  step('task 25 fix: a mark a cut crosses stays grabbable everywhere it is drawn');
  // The band starts inside the rectangle, below its top edge, so the mark is
  // drawn its full height while the rows under the band close up beneath it.
  await cutExactly(250, 80);
  assert((await size()) === '800 × 520px', `the picture lost the 80 rows (${await size()})`);
  const crossed = await pictureGeometry(page, 520);
  await page.keyboard.press('v');
  // Composed row 340: inside the mark as drawn (230 to 370), and 50 rows below
  // where a hit box built out of the piecewise row map would end.
  await page.mouse.click(crossed.x, crossed.y(340));
  await settle(150);
  assert(
    (await say()) === 'Rectangle selected, layer 1 of 1.',
    `a click on the mark's drawn lower half selects it ("${await say()}")`,
  );
  await page.keyboard.press('Escape');
  await chord(['Meta'], 'z');
  await settle();

  step('task 25 fix: a mark a cut hides takes no clicks and no bracket');
  await page.keyboard.press(']');
  await settle();
  assert(
    (await say()) === 'Rectangle selected, layer 1 of 1.',
    `the mark is selected before the band that hides it ("${await say()}")`,
  );
  // The band covers the mark's top edge, so the mark leaves the picture.
  await cutExactly(200, 60);
  assert(
    await page.$eval('[aria-label="Delete selected"]', (b) => b.disabled),
    'the cut dropped the hidden mark from the selection — it cannot be dragged or nudged',
  );
  const hidden = await pictureGeometry(page, 540);
  await page.keyboard.press('v');
  // Composed row 280: inside the box the piecewise row map would give the
  // hidden mark (200 to 310), and over picture it does not paint.
  await page.mouse.click(hidden.x, hidden.y(280));
  await settle(150);
  assert(
    await page.$eval('[aria-label="Delete selected"]', (b) => b.disabled),
    'a click where the hidden mark used to be selects nothing',
  );
  await page.$eval('.stage-canvas', (el) => el.focus());
  await page.keyboard.press(']');
  await settle();
  assert(
    (await say()) === 'Selection cleared.',
    `and the brackets walk past it rather than name it ("${await say()}")`,
  );
  await chord(['Meta'], 'z');
  await settle();

  step('task 25 fix: a drafted cut does not outlive its tool, and Delete cancels it');
  await page.$eval('.stage-canvas', (el) => el.focus());
  await page.keyboard.press('Escape');
  await page.keyboard.press('x');
  await page.keyboard.press('Enter');
  await settle();
  await page.keyboard.press('r');
  await page.keyboard.press('Enter');
  await settle();
  assert(
    /^Rectangle added at /.test(await say()),
    `Enter after switching to Rectangle drew a rectangle, it did not take the band out ("${await say()}")`,
  );
  assert((await size()) === '800 × 600px', `and the picture is untouched (${await size()})`);
  await chord(['Meta'], 'z');
  await settle();
  // A committed cut first, so Delete has something to reach for: with a band
  // drafted it must cancel the draft rather than put that cut back.
  await cutExactly(0, 40);
  assert((await size()) === '800 × 560px', `one cut committed (${await size()})`);
  await page.keyboard.press('x');
  await page.keyboard.press('Enter');
  await settle();
  await page.keyboard.press('Delete');
  await settle();
  assert(
    (await say()) === 'Cut cancelled.',
    `Delete with a band drafted cancels the draft ("${await say()}")`,
  );
  assert(
    (await size()) === '800 × 560px',
    `and leaves the cut already taken alone (${await size()})`,
  );

  step('task 25 fix: a band inside one already cut takes nothing, and leaves no undo step');
  await cutExactly(10, 20); // wholly inside the band taken above
  assert(
    (await say()) === 'Those rows are cut already.',
    `it says so rather than announcing a cut of nothing ("${await say()}")`,
  );
  assert((await size()) === '800 × 560px', `and the picture is unchanged (${await size()})`);
  await chord(['Meta'], 'z');
  await settle();
  assert(
    (await size()) === '800 × 600px',
    `one undo reached the real cut, so the no-op put nothing on the timeline (${await size()})`,
  );

  step('task 25: a crop bakes the cuts into the image it makes');
  await cutExactly(200, 200);
  assert((await size()) === '800 × 400px', `the middle stripe is cut again (${await size()})`);
  await page.keyboard.press('c');
  await page.keyboard.press('Enter'); // a crop over the whole picture
  await page.keyboard.press('Enter'); // apply it
  await settle(500);
  assert(
    (await say()) === 'Cropped to 800 by 400 pixels.',
    `the crop took the picture as it was drawn, not the capture behind it ("${await say()}")`,
  );
  assert((await size()) === '800 × 400px', `and the new image is that picture (${await size()})`);
  assert(
    (await page.$('.toolbar-count')) === null,
    'the mark that sat on the cut rows went with them',
  );
  const cropped = await exportAs(0);
  let greenInCrop = 0;
  for (let i = 0; i < cropped.data.length; i += cropped.info.channels) {
    const [r, g, b] = [cropped.data[i], cropped.data[i + 1], cropped.data[i + 2]];
    if (g > 150 && r < 110 && b < 110) greenInCrop++;
  }
  assert(
    cropped.info.height === 400 && greenInCrop === 0,
    `the cropped export is 400 rows with no cut stripe in it (${cropped.info.height} tall, ${greenInCrop} green pixels) — a crop that had rasterised the capture instead would be 600 and full of it`,
  );

  assert(crashes.length === 0, `no page errors (${crashes.join(' | ') || 'none'})`);
  await page.close();
}

/**
 * Fix round 2: the three consumers that were still outside the projection rule,
 * and the precedence Delete reads its own meaning from.
 *
 * The rule is that everything about a mark — where it is drawn, outlined,
 * grabbed, caught and moved — goes through the same offset. These are the
 * places where it did not.
 */
async function testCutSelectionRules(browser, base, messages) {
  step('task 25 fix 2: a marquee catches what it visibly crosses, cuts and all');
  const { page } = await newSmokePage(browser);
  const crashes = [];
  page.on('pageerror', (err) => crashes.push(String(err)));
  await page.evaluateOnNewDocument(installChromeStub, messages, {
    'openscreenshot:last-capture': await makeStripedCapture(),
    'openscreenshot:settings': { theme: 'light' },
  });
  await page.goto(`${base}${PAGE}`, { waitUntil: 'networkidle0' });
  await page.waitForSelector('.stage-canvas');
  await new Promise((r) => setTimeout(r, 900));

  const settle = (ms = 130) => new Promise((r) => setTimeout(r, ms));
  const say = () =>
    page.evaluate(() =>
      document.querySelector('[aria-live="polite"][role="status"]').textContent.trim(),
    );
  const size = () => page.$eval('.statusbar > span', (el) => el.textContent.trim());
  const layers = () =>
    page.$eval('.toolbar', (el) => el.querySelector('.toolbar-count span')?.textContent ?? '0');
  async function chord(mods, key) {
    for (const m of mods) await page.keyboard.down(m);
    await page.keyboard.press(key);
    for (const m of mods.slice().reverse()) await page.keyboard.up(m);
  }
  const band = async () => {
    const m = (await say()).match(/Cut band (\d+) pixels tall at (\d+)\./);
    if (!m) throw new Error(`expected a drafted band, got "${await say()}"`);
    return { h: Number(m[1]), y: Number(m[2]) };
  };
  const walk = async (mods, delta) => {
    const key = delta > 0 ? 'ArrowDown' : 'ArrowUp';
    for (let i = 0; i < Math.floor(Math.abs(delta) / 10); i++) await chord([...mods, 'Shift'], key);
    for (let i = 0; i < Math.abs(delta) % 10; i++) await chord(mods, key);
    await settle(60);
  };
  const cutExactly = async (y, h) => {
    await page.$eval('.stage-canvas', (el) => el.focus());
    await page.keyboard.press('x');
    await page.keyboard.press('Enter');
    await settle();
    const placed = await band();
    await walk(['Alt'], h - placed.h);
    await walk([], y - (await band()).y);
    const aimed = await band();
    assert(
      aimed.y === y && aimed.h === h,
      `band drafted at exactly ${y}, ${h} tall (${aimed.y}, ${aimed.h})`,
    );
    await page.keyboard.press('Enter');
    await settle();
  };

  await page.$eval('.stage-canvas', (el) => el.focus());
  await page.keyboard.press('6'); // Purple, so nothing in the stripes is near it
  await page.keyboard.press('r');
  await page.keyboard.press('Enter');
  await settle();
  const placed = (await say()).match(/Rectangle added at (-?\d+), (-?\d+)\./);
  assert(placed !== null, `a rectangle was placed ("${await say()}")`);
  const markY = Number(placed[2]);
  await page.keyboard.press('Escape');
  await settle();

  step('task 25 fix 4: a cut names the marks it took out of the picture, and only those');
  // The layer count keeps counting a mark on cut rows, so the cut says how
  // many it took — otherwise the user sees more layers than marks with no
  // explanation.
  await cutExactly(markY, 20);
  assert(
    (await say()) === 'Cut 20 pixels. Image 580 pixels tall. 1 annotation out of the picture.',
    `the cut named the mark it took out of the picture ("${await say()}")`,
  );
  // A second, disjoint band takes nothing with it. The mark already out of the
  // picture belongs to the first cut and is not counted again.
  await cutExactly(500, 20);
  assert(
    (await say()) === 'Cut 20 pixels. Image 560 pixels tall.',
    `a band that took no mark says so by saying nothing more ("${await say()}")`,
  );
  await page.$eval('.stage-canvas', (el) => el.focus());
  await chord(['Meta'], 'z');
  await chord(['Meta'], 'z');
  await settle();

  // The band starts inside the mark, below its top edge, so the mark keeps its
  // full drawn height while the rows under the band close up beneath it.
  await cutExactly(markY + 20, 80);
  assert((await size()) === '800 × 520px', `the picture lost the 80 rows (${await size()})`);
  const g = await pictureGeometry(page, 520);
  await page.keyboard.press('v');
  // A marquee across composed rows 340 to 360, started clear of the mark's own
  // box so it is a marquee and not a drag, and drawn over rows the mark is
  // painted on. In source coordinates that band of rows is 420 to 440 — past
  // the mark entirely, which is what the catch used to compare against.
  await page.mouse.move(g.xAt(100), g.y(340));
  await page.mouse.down();
  await page.mouse.move(g.xAt(600), g.y(360), { steps: 8 });
  await page.mouse.up();
  await settle(150);
  assert(
    (await say()) === 'Rectangle selected, layer 1 of 1.',
    `the marquee caught the mark it was dragged across ("${await say()}")`,
  );
  await page.keyboard.press('Escape');
  await chord(['Meta'], 'z');
  await settle();
  assert((await size()) === '800 × 600px', 'the picture is whole again');

  step('task 25 fix 2: a mark nudged onto cut rows leaves the selection instead of moving unseen');
  await cutExactly(100, 100);
  await page.$eval('.stage-canvas', (el) => el.focus());
  await page.keyboard.press(']');
  await settle();
  assert(
    (await say()) === 'Rectangle selected, layer 1 of 1.',
    `the mark is selected before it is nudged ("${await say()}")`,
  );
  // The band covers rows 100 to 199, and the mark's top starts at 230. Three
  // coarse nudges put it on row 200, the last row above the band.
  for (let i = 0; i < 3; i++) await chord(['Shift'], 'ArrowUp');
  await settle();
  assert(
    (await say()) === `Rectangle moved to 330, ${markY - 30}.`,
    `three nudges leave it on the last row above the band ("${await say()}")`,
  );
  // The fourth takes its top onto a cut row. It was in the picture when the
  // key came down, so that press is still a move.
  await chord(['Shift'], 'ArrowUp');
  await settle();
  assert(
    (await say()) === `Rectangle moved to 330, ${markY - 40}.`,
    `the press that hides it still reports the move it made ("${await say()}")`,
  );
  await chord(['Shift'], 'ArrowUp');
  await settle();
  assert(
    (await say()) === '1 annotation out of the picture. Selection cleared.',
    `and the next press says the mark left the picture, not that it moved unseen ("${await say()}")`,
  );
  await chord(['Meta'], 'z');
  await chord(['Meta'], 'z');
  await settle();

  step('task 25 fix 2: Delete cancels a drafted band before it deletes a selection');
  await page.$eval('.stage-canvas', (el) => el.focus());
  await page.keyboard.press(']');
  await settle();
  assert(
    (await say()) === 'Rectangle selected, layer 1 of 1.',
    `a mark is selected and a band is about to be drafted ("${await say()}")`,
  );
  await page.keyboard.press('x');
  await page.keyboard.press('Enter');
  await settle();
  await band(); // a band really is drafted
  await page.keyboard.press('Delete');
  await settle();
  assert(
    (await say()) === 'Cut cancelled.',
    `Delete took the band, the newest thing on screen ("${await say()}")`,
  );
  assert(
    (await layers()) === '1',
    `and left the selected mark where it was (${await layers()} layer on the canvas)`,
  );
  await page.keyboard.press('Escape');
  await settle();

  assert(crashes.length === 0, `no page errors (${crashes.join(' | ') || 'none'})`);
  await page.close();
}

/**
 * The group resize frame is a source-space box, and a cut can take the row it
 * is anchored on while every member it holds stays in the picture. Only a
 * frame of glyphs reaches that state — a badge scales by one factor on both
 * axes (uniformFactor), so growing the frame vertically leaves both badges'
 * top edges strictly below the frame's own.
 */
async function testCutGroupFrame(browser, base, messages) {
  step('task 25 fix 2: a group frame whose anchor row is cut falls back to one that is drawn');
  const { page } = await newSmokePage(browser);
  const crashes = [];
  page.on('pageerror', (err) => crashes.push(String(err)));
  await page.evaluateOnNewDocument(installChromeStub, messages, {
    'openscreenshot:last-capture': await makeStripedCapture(),
    'openscreenshot:settings': { theme: 'light' },
  });
  await page.goto(`${base}${PAGE}`, { waitUntil: 'networkidle0' });
  await page.waitForSelector('.stage-canvas');
  await new Promise((r) => setTimeout(r, 900));

  const settle = (ms = 130) => new Promise((r) => setTimeout(r, ms));
  const say = () =>
    page.evaluate(() =>
      document.querySelector('[aria-live="polite"][role="status"]').textContent.trim(),
    );
  async function chord(mods, key) {
    for (const m of mods) await page.keyboard.down(m);
    await page.keyboard.press(key);
    for (const m of mods.slice().reverse()) await page.keyboard.up(m);
  }
  const band = async () => {
    const m = (await say()).match(/Cut band (\d+) pixels tall at (\d+)\./);
    if (!m) throw new Error(`expected a drafted band, got "${await say()}"`);
    return { h: Number(m[1]), y: Number(m[2]) };
  };
  const walk = async (mods, delta) => {
    const key = delta > 0 ? 'ArrowDown' : 'ArrowUp';
    for (let i = 0; i < Math.floor(Math.abs(delta) / 10); i++) await chord([...mods, 'Shift'], key);
    for (let i = 0; i < Math.abs(delta) % 10; i++) await chord(mods, key);
    await settle(60);
  };
  /** A layer's top edge, read the way this file reads every coordinate. */
  const topOfNext = async () => {
    await page.keyboard.press(']');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowRight');
    await settle(60);
    const m = (await say()).match(/moved to (-?\d+), (-?\d+)\./);
    if (!m) throw new Error(`expected a move announcement, got "${await say()}"`);
    return Number(m[2]);
  };

  await page.$eval('.stage-canvas', (el) => el.focus());
  await page.keyboard.press('6'); // Purple: no stripe colour, so it reads apart from the picture
  await page.keyboard.press('s');
  await page.keyboard.press('Enter');
  await settle();
  for (let i = 0; i < 10; i++) await chord(['Shift'], 'ArrowDown');
  await page.keyboard.press('Enter');
  await settle();
  await page.keyboard.press('Escape');
  await settle();
  const first = await topOfNext();
  const second = await topOfNext();
  // The announced top edge is rounded and a badge's own is fractional (its
  // radius is four fifths of the font size), so the band is aimed one row
  // higher than the reading to be sure it covers the frame's anchor row.
  const frameTop = Math.min(first, second) - 1;
  assert(
    Math.abs(first - second) === 100,
    `two badges, a hundred rows apart (tops at ${first} and ${second})`,
  );

  await chord(['Shift'], ']');
  await settle();
  assert(
    (await say()) === '2 of 2 annotations selected.',
    `both badges selected, so the frame is the box around them ("${await say()}")`,
  );
  // Growing the frame downward keeps its top where the union was, while both
  // badges scale by the square root of the one axis that moved — so their own
  // top edges end up well below it, and a band on the frame's anchor row hides
  // neither of them. Nothing below may move a badge: the frame under test is
  // the carried one, and an edit to a member's bbox drops it.
  for (let i = 0; i < 30; i++) await chord(['Alt', 'Shift'], 'ArrowDown');
  await settle();

  await page.keyboard.press('x');
  await page.keyboard.press('Enter');
  await settle();
  const placed = await band();
  await walk(['Alt'], 6 - placed.h);
  await walk([], frameTop - (await band()).y);
  const aimed = await band();
  assert(
    aimed.y === frameTop && aimed.h === 6,
    `a band drafted on the frame's own anchor row (${aimed.y}, ${aimed.h} tall)`,
  );
  await page.keyboard.press('Enter');
  await settle();
  assert(
    (await say()) === 'Cut 6 pixels. Image 594 pixels tall.',
    `the frame's anchor row is gone ("${await say()}")`,
  );

  const g = await pictureGeometry(page, 594);
  const cut = g.imageY(await topPaintedRow(page));
  assert(
    cut > frameTop + 12,
    `both badges are drawn clear of that row (upper badge drawn at ${Math.round(cut)}, band at ${frameTop})`,
  );

  /**
   * Which frame the arrows resized through, read off where the members land.
   * A downward resize holds the frame's top edge still and stretches
   * everything below it, so the upper badge's own top moves down by more the
   * further above it the frame's top sits. Anchored on the carried frame,
   * thirty rows above the badge, it moves about twice as far as it does
   * anchored on the drawn union, where the frame's top IS the badge's top.
   */
  const resizeAndMeasure = async () => {
    const from = g.imageY(await topPaintedRow(page));
    for (let i = 0; i < 30; i++) await chord(['Alt', 'Shift'], 'ArrowDown');
    await settle();
    return g.imageY(await topPaintedRow(page)) - from;
  };

  step('task 25 fix 3: a move carries the frame across a band rather than dropping it');
  // The carried frame's anchor row is on the cut rows right now. A move maps
  // onto the frame exactly, so it travels with the members and comes out the
  // other side still theirs — the drawable question belongs to what is drawn
  // and grabbed, not to what a translate does.
  await chord(['Shift'], 'ArrowDown');
  await settle();
  const carried = await resizeAndMeasure();
  assert(
    (await say()) === '2 annotations resized.',
    `both badges are still the selection being resized ("${await say()}")`,
  );
  assert(
    carried > 25,
    `the move carried the frame, so the resize is still anchored above the members (upper badge's top moved ${Math.round(carried)} rows)`,
  );

  step('task 25 fix 3: and a frame left on cut rows falls back to one that is drawn');
  // Cut the carried frame's anchor row again — it is thirty rows above the
  // badges once more after that resize — and the fallback takes over.
  // The frame's anchor row is where it was, one coarse nudge lower: the move
  // above translated it by ten source rows and the resize since holds its top
  // edge still.
  const frameTop2 = frameTop + 10;
  await page.keyboard.press('x');
  await page.keyboard.press('Enter');
  await settle();
  const placed2 = await band();
  await walk(['Alt'], 6 - placed2.h);
  await walk([], frameTop2 - (await band()).y);
  await page.keyboard.press('Enter');
  await settle();
  const fellBack = await resizeAndMeasure();
  assert(
    (await say()) === '2 annotations resized.',
    `both badges survived the second cut too ("${await say()}")`,
  );
  assert(
    fellBack < 25,
    `the arrows resized through the frame drawn around the members (upper badge's top moved ${Math.round(fellBack)} rows)`,
  );

  assert(crashes.length === 0, `no page errors (${crashes.join(' | ') || 'none'})`);
  await page.close();
}

/**
 * Fix round 3: the frame that is drawn and the frame that is grabbed are one
 * frame. A selection can hold a mark a cut hides — Alt+D offsets its copies by
 * sixteen pixels and selects them with no prune, so a copy can land on cut
 * rows — and the two used to be computed apart: chrome around the marks that
 * are there, a grab box built from every selected mark including the hidden
 * one. Nothing in this suite grabbed a group handle with a pointer before, and
 * that is why it survived two rounds.
 */
async function testCutMixedSelectionGrab(browser, base, messages) {
  step('task 25 fix 3: a group handle is grabbable exactly where it is painted');
  const { page } = await newSmokePage(browser);
  const crashes = [];
  page.on('pageerror', (err) => crashes.push(String(err)));
  await page.evaluateOnNewDocument(installChromeStub, messages, {
    'openscreenshot:last-capture': await makeStripedCapture(),
    'openscreenshot:settings': { theme: 'light' },
  });
  await page.goto(`${base}${PAGE}`, { waitUntil: 'networkidle0' });
  await page.waitForSelector('.stage-canvas');
  await new Promise((r) => setTimeout(r, 900));

  const settle = (ms = 130) => new Promise((r) => setTimeout(r, ms));
  const say = () =>
    page.evaluate(() =>
      document.querySelector('[aria-live="polite"][role="status"]').textContent.trim(),
    );
  async function chord(mods, key) {
    for (const m of mods) await page.keyboard.down(m);
    await page.keyboard.press(key);
    for (const m of mods.slice().reverse()) await page.keyboard.up(m);
  }
  const nudge = async (rows) => {
    const key = rows > 0 ? 'ArrowDown' : 'ArrowUp';
    for (let i = 0; i < Math.abs(rows) / 10; i++) await chord(['Shift'], key);
    await settle(60);
  };
  const band = async () => {
    const m = (await say()).match(/Cut band (\d+) pixels tall at (\d+)\./);
    if (!m) throw new Error(`expected a drafted band, got "${await say()}"`);
    return { h: Number(m[1]), y: Number(m[2]) };
  };
  const walk = async (mods, delta) => {
    const key = delta > 0 ? 'ArrowDown' : 'ArrowUp';
    for (let i = 0; i < Math.floor(Math.abs(delta) / 10); i++) await chord([...mods, 'Shift'], key);
    for (let i = 0; i < Math.abs(delta) % 10; i++) await chord(mods, key);
    await settle(60);
  };

  // Three rectangles: one just above the band, two well below it. Alt+D then
  // offsets every copy by sixteen rows, which puts the first copy on the cut
  // rows and leaves the other two in the picture.
  await page.$eval('.stage-canvas', (el) => el.focus());
  await page.keyboard.press('r');
  await page.keyboard.press('Enter');
  await nudge(-40); // top 190
  await page.keyboard.press('Enter');
  await nudge(90); // top 320
  await page.keyboard.press('Enter');
  await nudge(170); // top 400
  await settle();

  await page.keyboard.press('x');
  await page.keyboard.press('Enter');
  await settle();
  const placed = await band();
  await walk(['Alt'], 100 - placed.h);
  await walk([], 200 - (await band()).y);
  const aimed = await band();
  assert(
    aimed.y === 200 && aimed.h === 100,
    `band at exactly 200, 100 tall (${aimed.y}, ${aimed.h})`,
  );
  await page.keyboard.press('Enter');
  await settle();
  assert(
    (await say()) === 'Cut 100 pixels. Image 500 pixels tall.',
    `the band came out with nothing on it ("${await say()}")`,
  );

  await page.keyboard.press('v');
  await page.$eval('.stage-canvas', (el) => el.focus());
  await page.keyboard.press(']');
  await chord(['Shift'], ']');
  await chord(['Shift'], ']');
  await settle();
  assert(
    (await say()) === '3 of 3 annotations selected.',
    `all three marks selected ("${await say()}")`,
  );
  await chord(['Alt'], 'd');
  await settle();
  assert(
    (await say()) === '3 annotations duplicated.',
    `Alt+D selected three copies, with no prune between ("${await say()}")`,
  );
  // The first copy landed on the cut rows: six layers, five in the picture.
  assert(
    (await page.$eval('.toolbar-count span', (el) => el.textContent)) === '6',
    'six layers on the canvas',
  );

  // Only the copies go purple, so the topmost purple row is the top edge of
  // the upper copy and nothing else.
  await page.keyboard.press('6');
  await settle();
  const g = await pictureGeometry(page, 500);
  const beforeGrab = g.imageY(await topPaintedRow(page));
  const beforeBottom = g.imageY(await bottomPaintedRow(page));

  // The frame around the two copies that are in the picture spans source rows
  // 336 to 556, drawn a hundred rows higher. Grab its bottom handle and pull:
  // a resize about that frame holds the upper copy's top edge still, while a
  // drag that missed the handle and caught a layer instead carries every
  // selected copy down with it.
  await page.mouse.move(g.xAt(416), g.y(456));
  await page.mouse.down();
  await page.mouse.move(g.xAt(416), g.y(486), { steps: 6 });
  await page.mouse.up();
  await settle(150);
  assert(
    (await say()) === '1 annotation out of the picture. 2 annotations selected.',
    `the copy on the cut rows was in the selection right up to the mouse-up ("${await say()}")`,
  );
  const afterGrab = g.imageY(await topPaintedRow(page));
  const afterBottom = g.imageY(await bottomPaintedRow(page));
  // Two readings, because one of them alone cannot tell a resize from nothing
  // happening at all: the top edge stays where it was and the bottom edge
  // follows the handle down by the thirty rows it was dragged. A drag that
  // caught a layer instead carries both down together.
  assert(
    Math.abs(afterGrab - beforeGrab) < 4,
    `the grab held the upper copy's top edge (row ${Math.round(beforeGrab)} -> ${Math.round(afterGrab)})`,
  );
  assert(
    Math.abs(afterBottom - beforeBottom - 30) < 5,
    `and pulled the frame's bottom edge down with the handle (row ${Math.round(beforeBottom)} -> ${Math.round(afterBottom)})`,
  );

  assert(crashes.length === 0, `no page errors (${crashes.join(' | ') || 'none'})`);
  await page.close();
}

/**
 * The PDF path, the one export the choke-point argument was left to carry.
 * The picture is sliced into A4 pages, so cutting a third of a tall capture
 * out has to cost whole pages — a page count read out of the PDF's own /Count
 * entry, before and after the same cut.
 */
async function testCutInPdfExport(browser, base, messages) {
  step('task 25 fix: a cut reaches the PDF export — the page count drops with the picture');
  const { page } = await newSmokePage(browser);
  const crashes = [];
  page.on('pageerror', (err) => crashes.push(String(err)));
  await page.evaluateOnNewDocument(installChromeStub, messages, {
    'openscreenshot:last-capture': await makeTallCapture(),
    'openscreenshot:settings': { theme: 'light' },
  });
  await page.goto(`${base}${PAGE}`, { waitUntil: 'networkidle0' });
  await page.waitForSelector('.stage-canvas');
  await new Promise((r) => setTimeout(r, 900));
  const settle = (ms = 150) => new Promise((r) => setTimeout(r, ms));
  const say = () =>
    page.evaluate(() =>
      document.querySelector('[aria-live="polite"][role="status"]').textContent.trim(),
    );

  /**
   * Export a PDF and read the page count out of its own /Pages object. The PDF
   * path hands chrome.downloads a blob: URL rather than a data: one, so the
   * bytes are fetched back inside the page (pdf.ts keeps the blob alive for
   * ten seconds) instead of being decoded from what the stub recorded.
   */
  const pdfPages = async () => {
    await page.click('header .btn-secondary[title^="Export"]');
    await page.waitForSelector('.modal', { timeout: 5000 });
    await settle(220);
    await page.click('.format-grid .format-card:last-child');
    await page.waitForSelector('.field-label');
    await page.click('.modal-actions .btn-primary');
    await page.waitForFunction(() => !document.querySelector('.modal'), { timeout: 20000 });
    const download = await page.evaluate(() => globalThis.__smoke.downloads.at(-1));
    const read = await page.evaluate(async (url) => {
      const bytes = new Uint8Array(await (await fetch(url)).arrayBuffer());
      // The /Pages object is the second in the file, so the head holds it
      // whatever the page count.
      const head = String.fromCharCode(...bytes.slice(0, 4096));
      const m = head.match(/\/Type \/Pages \/Kids \[[^\]]*\] \/Count (\d+)/);
      return { pages: m ? Number(m[1]) : -1, bytes: bytes.length };
    }, download.url);
    if (read.pages < 0) throw new Error(`no /Pages /Count in ${download.filename}`);
    return { pages: read.pages, bytes: read.bytes, filename: download.filename };
  };

  const before = await pdfPages();
  assert(
    before.filename.endsWith('.pdf') && before.pages > 2,
    `the uncut 900x6000 capture makes ${before.pages} A4 pages (${before.filename})`,
  );

  // A third of the picture, taken with the keyboard: place, grow by 10px a
  // press, take it out.
  await page.$eval('.stage-canvas', (el) => el.focus());
  await page.keyboard.press('x');
  await page.keyboard.press('Enter');
  await settle();
  for (let i = 0; i < 200; i++) {
    await page.keyboard.down('Shift');
    await page.keyboard.down('Alt');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.up('Alt');
    await page.keyboard.up('Shift');
  }
  await settle();
  await page.keyboard.press('Enter');
  await settle(300);
  const cut = (await say()).match(/Cut (\d+) pixels\. Image (\d+) pixels tall\./);
  assert(
    cut !== null && Number(cut[1]) > 1500,
    `a band of over 1500 rows came out ("${await say()}")`,
  );

  const after = await pdfPages();
  const shrink = 1 - Number(cut[2]) / 6000;
  assert(
    after.pages < before.pages,
    `the PDF lost pages with the picture: ${before.pages} -> ${after.pages}, the picture down ${Math.round(shrink * 100)}%`,
  );
  assert(
    after.pages === Math.ceil(before.pages * (Number(cut[2]) / 6000)) ||
      after.pages === Math.ceil(before.pages * (Number(cut[2]) / 6000)) + 1,
    `and lost about the right number: ${after.pages} pages for ${cut[2]} of 6000 rows, against ${before.pages} for the whole`,
  );

  assert(crashes.length === 0, `no page errors (${crashes.join(' | ') || 'none'})`);
  await page.close();
}

/**
 * A cut in a stored draft comes back with the picture, and a draft written
 * before the Cut tool existed — no `bands` key at all — still restores.
 */
async function testCutDraftRestore(browser, base, messages) {
  step('task 25: a stored draft restores its cuts, and a pre-Cut draft still restores');
  const capture = await makeStripedCapture();
  const settle = (ms = 200) => new Promise((r) => setTimeout(r, ms));

  const open = async (draft) => {
    const { page } = await newSmokePage(browser);
    const crashes = [];
    page.on('pageerror', (err) => crashes.push(String(err)));
    await page.evaluateOnNewDocument(installChromeStub, messages, {
      'openscreenshot:last-capture': capture,
      'openscreenshot:draft': draft,
    });
    await page.goto(`${base}${PAGE}`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('.draft-restore', { timeout: 5000 });
    return { page, crashes };
  };

  const withBands = await open({
    sourceCapturedAt: capture.capturedAt,
    annotations: [],
    bands: [{ y: 200, h: 200 }],
    frame: {},
    savedAt: Date.now(),
  });
  const offer = await withBands.page.$eval('.draft-restore span', (el) => el.textContent);
  assert(
    offer === 'Unsaved edits from your last session (1 cut).',
    `a draft of nothing but a cut still offers itself, in its own words ("${offer}")`,
  );
  await withBands.page.click('.draft-restore .btn-primary');
  await settle(400);
  const restoredSize = await withBands.page.$eval('.statusbar > span', (el) =>
    el.textContent.trim(),
  );
  assert(restoredSize === '800 × 400px', `the restored cut is applied (${restoredSize})`);
  assert(
    withBands.crashes.length === 0,
    `no page errors (${withBands.crashes.join(' | ') || 'none'})`,
  );
  await withBands.page.close();

  // Exactly the shape every draft on disk has today: no `bands` key.
  const legacy = await open({
    sourceCapturedAt: capture.capturedAt,
    annotations: [{ id: 'a1', type: 'rect', x: 10, y: 10, w: 50, h: 50 }],
    frame: {},
    savedAt: Date.now(),
  });
  const legacyOffer = await legacy.page.$eval('.draft-restore span', (el) => el.textContent);
  assert(
    legacyOffer === 'Unsaved edits from your last session (1 annotation).',
    `a draft written before the Cut tool is still offered ("${legacyOffer}")`,
  );
  await legacy.page.click('.draft-restore .btn-primary');
  await settle(400);
  const count = await legacy.page.$eval('.toolbar-count span', (el) => el.textContent);
  assert(count === '1', `and it restores its annotation (${count})`);
  const legacySize = await legacy.page.$eval('.statusbar > span', (el) => el.textContent.trim());
  assert(legacySize === '800 × 600px', `with nothing cut (${legacySize})`);
  assert(legacy.crashes.length === 0, `no page errors (${legacy.crashes.join(' | ') || 'none'})`);
  await legacy.page.close();
}

async function testBeautifyLooks(browser, base, messages) {
  step('task 26: a named look sets every frame value at once, and says when it has been changed');
  // The theme is pinned for the same reason testCutTool pins it: the census
  // below reads the whole canvas, and the stage plate behind the picture is
  // near-black in the dark theme.
  const capture = await makeCapture();
  const seed = {
    'openscreenshot:last-capture': capture,
    'openscreenshot:settings': { theme: 'light' },
  };
  const { page } = await newSmokePage(browser);
  const crashes = [];
  page.on('pageerror', (err) => crashes.push(String(err)));
  await page.evaluateOnNewDocument(installChromeStub, messages, seed);
  await page.goto(`${base}${PAGE}`, { waitUntil: 'networkidle0' });
  await page.waitForSelector('.stage-canvas');
  await new Promise((r) => setTimeout(r, 900));

  const settle = (ms = 150) => new Promise((r) => setTimeout(r, ms));
  const looks = (p = page) =>
    p.evaluate(() =>
      [...document.querySelectorAll('.look-btn')].map((b) => ({
        label: b.textContent.trim(),
        pressed: b.getAttribute('aria-pressed') === 'true',
        modified: b.classList.contains('is-modified'),
        name: b.getAttribute('aria-label'),
      })),
    );
  const sliders = () =>
    page.evaluate(() =>
      Object.fromEntries(
        [...document.querySelectorAll('.beautify-popover .range')].map((r) => [
          r.getAttribute('aria-label'),
          Number(r.value),
        ]),
      ),
    );
  /**
   * A range's value has to go through the native setter for Preact's onInput
   * to see it — assigning `.value` fires nothing, and the panel would read
   * back unchanged whatever this test did.
   */
  const setSlider = (name, value) =>
    page.evaluate(
      (n, v) => {
        const el = document.querySelector(`.beautify-popover .range[aria-label="${n}"]`);
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(
          el,
          String(v),
        );
        el.dispatchEvent(new Event('input', { bubbles: true }));
      },
      name,
      value,
    );
  const clickLook = async (label) => {
    await page.evaluate((l) => {
      [...document.querySelectorAll('.look-btn')].find((b) => b.textContent.trim() === l).click();
    }, label);
    await settle();
  };
  /**
   * Opaque red-dominant pixels on the live canvas. The capture is solid blue
   * and the light stage plate is near-white, so neither lands in this bucket;
   * the Coral gradient (#ff7a59 -> #e0326b) is all of it.
   */
  const coral = () =>
    page.evaluate(() => {
      const cv = document.querySelector('.stage-canvas');
      const { data } = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height);
      let n = 0;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] === 255 && data[i] > 180 && data[i] - data[i + 2] > 40) n++;
      }
      return n;
    });
  const beautifyOn = () =>
    page.evaluate(() => !!document.querySelector('.beautify-menu > .is-active'));

  const coralOff = await coral();
  assert(!(await beautifyOn()), 'beautify starts off, as it ships');
  assert(coralOff === 0, `and the stage carries no Coral frame (${coralOff} px)`);

  await page.click('.beautify-menu > .btn-secondary');
  await page.waitForSelector('.beautify-popover', { timeout: 5000 });
  await settle();

  const start = await looks();
  assert(
    start.map((l) => l.label).join(', ') === 'Clean, Airy, Snug, Flat, Poster, Cutout',
    `the panel offers six named looks (${start.map((l) => l.label).join(', ')})`,
  );
  assert(
    start
      .filter((l) => l.pressed)
      .map((l) => l.label)
      .join() === 'Clean',
    'exactly one is shown as chosen, and on a fresh install it is Clean — the shipped defaults',
  );
  assert(
    start.every((l) => !l.modified),
    'none is marked modified before anything has been touched',
  );

  step('task 26: one click sets padding, corners, shadow and background, and turns beautify on');
  await clickLook('Poster');
  const posterSliders = await sliders();
  assert(
    JSON.stringify(posterSliders) === JSON.stringify({ Padding: 70, Corners: 55, Shadow: 80 }),
    `Poster moved all three sliders at once (${JSON.stringify(posterSliders)})`,
  );
  const swatch = await page.evaluate(() =>
    document.querySelector('.swatch[aria-label="Coral"]')?.getAttribute('aria-pressed'),
  );
  assert(swatch === 'true', `and took the Coral background with it (aria-pressed=${swatch})`);
  assert(await beautifyOn(), 'and turned beautify on, so the click changes something on screen');
  const coralOn = await coral();
  assert(
    coralOn > 20000,
    `the Coral frame is really painted on the stage (${coralOff} px -> ${coralOn} px)`,
  );

  step('task 26: moving a slider afterwards leaves the look chosen, and marks it modified');
  await setSlider('Padding', 33);
  await settle();
  const adjusted = (await looks()).find((l) => l.label === 'Poster');
  assert(adjusted.pressed, 'Poster is still the chosen look after the padding moved');
  assert(adjusted.modified, 'and it is marked modified rather than silently mismatched');
  assert(
    adjusted.name === 'Poster, modified',
    `the mark is in the accessible name too, not colour alone ("${adjusted.name}")`,
  );
  const dot = await page.evaluate(() => {
    const b = [...document.querySelectorAll('.look-btn')].find((x) =>
      x.classList.contains('is-modified'),
    );
    const s = getComputedStyle(b, '::after');
    return { content: s.content, w: s.width, bg: s.backgroundColor };
  });
  assert(
    dot.content === '""' && dot.w === '4px',
    `and a dot is drawn on the button (content ${dot.content}, ${dot.w}, ${dot.bg})`,
  );

  step('task 26: moving it back clears the mark — modified is a comparison, not a flag');
  await setSlider('Padding', 70);
  await settle();
  const restored = (await looks()).find((l) => l.label === 'Poster');
  assert(restored.pressed && !restored.modified, 'Poster reads as unmodified again');
  assert(restored.name === null, 'and its accessible name is back to the plain label');

  step('task 26: a background picked by hand modifies the look the same way');
  await page.click('.swatch[aria-label="Mint"]');
  await settle();
  const bgChanged = (await looks()).find((l) => l.label === 'Poster');
  assert(
    bgChanged.pressed && bgChanged.modified,
    'the background is part of the comparison, not just the three sliders',
  );
  await clickLook('Poster');
  const reapplied = (await looks()).find((l) => l.label === 'Poster');
  assert(
    reapplied.pressed && !reapplied.modified,
    'clicking the look again puts every value back and clears the mark',
  );

  step('task 26: the adjusted look reaches the autosaved draft');
  // The autosave only writes when there is work to keep, so one rectangle
  // goes on first. It is drawn now rather than at the top because the census
  // above counts red pixels, and the default annotation colour is red.
  // The panel has to close for the canvas to see the keys at all: its own
  // capture-phase keydown handler swallows every key while it is open.
  await page.keyboard.press('Escape');
  await settle();
  await page.$eval('.stage-canvas', (el) => el.focus());
  await page.keyboard.press('r');
  await page.keyboard.press('Enter');
  await settle();
  await page.click('.beautify-menu > .btn-secondary');
  await page.waitForSelector('.beautify-popover', { timeout: 5000 });
  await settle();
  await setSlider('Padding', 33);
  await new Promise((r) => setTimeout(r, 1200)); // past DRAFT_DEBOUNCE_MS
  const stored = await page.evaluate(async () => ({
    draft: (await chrome.storage.local.get('openscreenshot:draft'))['openscreenshot:draft'] ?? null,
    settings:
      (await chrome.storage.local.get('openscreenshot:settings'))['openscreenshot:settings'] ??
      null,
  }));
  assert(
    stored.draft?.frame?.beautifyLook === 'poster' && stored.draft?.frame?.beautifyPadding === 33,
    `the draft holds the look id beside the changed value (look=${stored.draft?.frame?.beautifyLook}, padding=${stored.draft?.frame?.beautifyPadding})`,
  );
  assert(
    stored.settings?.beautifyLook === 'poster' && stored.settings?.beautifyPadding === 33,
    `and so do the settings, which is what carries the look across a restart (look=${stored.settings?.beautifyLook}, padding=${stored.settings?.beautifyPadding})`,
  );
  assert(crashes.length === 0, `no page errors (${crashes.join(' | ') || 'none'})`);
  await page.close();

  step('task 26: restoring that draft brings the look back, still modified');
  const { page: back, cdp: backCdp } = await newSmokePage(browser);
  const backCrashes = [];
  back.on('pageerror', (err) => backCrashes.push(String(err)));
  await back.evaluateOnNewDocument(installChromeStub, messages, {
    ...seed,
    'openscreenshot:settings': { ...stored.settings },
    'openscreenshot:draft': stored.draft,
  });
  await back.goto(`${base}${PAGE}`, { waitUntil: 'networkidle0' });
  await back.waitForSelector('.draft-restore', { timeout: 5000 });
  await back.click('.draft-restore .btn-primary');
  await settle(400);
  await back.click('.beautify-menu > .btn-secondary');
  await back.waitForSelector('.beautify-popover', { timeout: 5000 });
  await settle();
  const afterRestore = (await looks(back)).find((l) => l.label === 'Poster');
  assert(
    afterRestore.pressed && afterRestore.modified,
    'the restored frame is Poster, modified — the id survived the crash, not just the numbers',
  );
  const restoredPadding = await back.$eval('.beautify-popover .range[aria-label="Padding"]', (el) =>
    Number(el.value),
  );
  assert(restoredPadding === 33, `with the adjustment intact (padding ${restoredPadding})`);
  step('task 26: the look row goes still under prefers-reduced-motion: reduce');
  const motion = () => back.$eval('.look-btn', (el) => getComputedStyle(el).transitionDuration);
  const fullMotion = await motion();
  assert(
    fullMotion !== '0s',
    `.look-btn has a real transition at no-preference (${fullMotion}) — otherwise the reduce check below proves nothing`,
  );
  // Replaces the whole feature list newSmokePage set, which is this one alone.
  await backCdp.send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
  });
  const reducedMotion = await motion();
  assert(
    reducedMotion.split(',').every((d) => d.trim() === '0s'),
    `and none of it under reduce (${reducedMotion})`,
  );

  assert(backCrashes.length === 0, `no page errors (${backCrashes.join(' | ') || 'none'})`);
  await back.close();

  step('task 26: and so does a plain restart, with no draft to restore');
  // The settings path on its own: same stored settings, no draft at all, so
  // nothing but `beautifyLook` can say this frame is Poster rather than a
  // hand-dialled one. Deriving the look from the values cannot answer this.
  // Opened last, and after every read from `back`: a new tab takes browser
  // focus, and the popover on the old page closes on its own focusout.
  const { page: fresh } = await newSmokePage(browser);
  const freshCrashes = [];
  fresh.on('pageerror', (err) => freshCrashes.push(String(err)));
  await fresh.evaluateOnNewDocument(installChromeStub, messages, {
    ...seed,
    'openscreenshot:settings': { ...stored.settings },
  });
  await fresh.goto(`${base}${PAGE}`, { waitUntil: 'networkidle0' });
  await fresh.waitForSelector('.stage-canvas');
  await new Promise((r) => setTimeout(r, 900));
  assert(
    (await fresh.$('.draft-restore')) === null,
    'no draft is offered on this page — the settings are carrying it alone',
  );
  await fresh.click('.beautify-menu > .btn-secondary');
  await fresh.waitForSelector('.beautify-popover', { timeout: 5000 });
  await settle();
  const afterRestart = (await looks(fresh)).find((l) => l.label === 'Poster');
  assert(
    afterRestart.pressed && afterRestart.modified,
    'Poster comes back chosen and modified from settings alone',
  );
  assert(freshCrashes.length === 0, `no page errors (${freshCrashes.join(' | ') || 'none'})`);
  await fresh.close();
}

/**
 * task 27 — the crop's eight handles, and the crop as an ordinary undo step.
 *
 * Two things unit tests cannot reach. The handles are canvas chrome measured
 * off real pixels: how many squares are drawn, which of them the small-rect
 * rule withholds, which one the keyboard is aimed at, and whether any of them
 * survives into an exported PNG. The undo is the whole editor — applyCrop
 * pushes a timeline entry holding the pre-crop picture, and only the real app
 * can show that Ctrl+Z puts that picture, its rows and its layers back.
 */
async function testCropHandlesAndUndo(browser, base, messages) {
  step('task 27: a crop draft carries eight handles, and a small rect only its corners');
  const { page } = await newSmokePage(browser);
  const crashes = [];
  page.on('pageerror', (err) => crashes.push(String(err)));
  await page.evaluateOnNewDocument(installChromeStub, messages, {
    'openscreenshot:last-capture': await makeStripedCapture(),
  });
  await page.goto(`${base}${PAGE}`, { waitUntil: 'networkidle0' });
  await page.waitForSelector('.stage-canvas');
  await new Promise((r) => setTimeout(r, 900));

  const sharp = createRequire(join(ROOT, 'package.json'))('sharp');
  const say = () =>
    page.evaluate(() =>
      document.querySelector('[aria-live="polite"][role="status"]').textContent.trim(),
    );
  const count = () =>
    page.evaluate(() => document.querySelector('.toolbar-count span')?.textContent ?? '0');
  const settle = (ms = 120) => new Promise((r) => setTimeout(r, ms));
  const focusCanvas = () => page.$eval('.stage-canvas', (el) => el.focus());
  async function chord(mods, key) {
    for (const m of mods) await page.keyboard.down(m);
    await page.keyboard.press(key);
    for (const m of mods.slice().reverse()) await page.keyboard.up(m);
  }
  const repeat = async (n, fn) => {
    for (let i = 0; i < n; i++) await fn();
  };

  // Handle squares, read off the live canvas the way task 24 reads selection
  // handles: the top-left pixel of every run of pure white, plus how wide that
  // run is. A handle is the only pure-white block the editor draws — the crop
  // preview's dim is 45% black over stripes that never reach white, and the
  // dashed outline is one pixel of black-then-white that no 5x5 patch fits in.
  const handles = () =>
    page.evaluate(() => {
      const canvas = document.querySelector('.stage-canvas');
      const { width, height } = canvas;
      const data = canvas.getContext('2d').getImageData(0, 0, width, height).data;
      const pure = (x, y) => {
        if (x < 0 || y < 0 || x >= width || y >= height) return false;
        const i = (y * width + x) * 4;
        return data[i + 3] === 255 && data[i] === 255 && data[i + 1] === 255 && data[i + 2] === 255;
      };
      const solid = (x, y) => {
        for (let yy = y; yy <= y + 4; yy++) {
          for (let xx = x; xx <= x + 4; xx++) if (!pure(xx, yy)) return false;
        }
        return true;
      };
      const out = [];
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          if (solid(x, y) && !pure(x - 1, y) && !pure(x, y - 1)) {
            let run = 0;
            while (pure(x + run, y + 2)) run++;
            out.push({ x, y, run });
          }
        }
      }
      return out;
    });
  const whiteInPng = (data, info) => {
    let n = 0;
    for (let i = 0; i < data.length; i += info.channels) {
      if (data[i] > 215 && data[i + 1] > 215 && data[i + 2] > 215) n++;
    }
    return n;
  };
  const exportPng = async () => {
    await chord(['Meta'], 's');
    await page.waitForSelector('.modal');
    await page.waitForFunction(() =>
      document.querySelector('.modal').contains(document.activeElement),
    );
    await page.$eval('.format-grid .format-card:first-child', (el) => el.focus());
    await page.keyboard.press('Enter');
    await settle();
    await page.$eval('.modal .btn-primary', (el) => el.focus());
    await page.keyboard.press('Enter');
    await settle(900);
    const download = await page.evaluate(() => globalThis.__smoke.downloads.at(-1));
    const { data, info } = await sharp(
      Buffer.from(download.url.slice(download.url.indexOf(',') + 1), 'base64'),
    )
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    return { download, data, info };
  };
  // The colour of one pixel of an exported PNG.
  const pixel = ({ data, info }, x, y) => {
    const i = (y * info.width + x) * info.channels;
    return [data[i], data[i + 1], data[i + 2]];
  };

  const geom = await page.$eval('.stage-canvas', (el) => {
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height, bw: el.width, bh: el.height };
  });
  // Backing store to CSS pixels, then to the page — the handle positions above
  // are read out of the backing store.
  const toPage = (p) => ({
    x: geom.x + (p.x * geom.w) / geom.bw,
    y: geom.y + (p.y * geom.h) / geom.bh,
  });

  await focusCanvas();
  await page.keyboard.press('c');
  await settle(80);
  await page.keyboard.press('Enter');
  await settle(120);
  assert(
    (await say()) === 'Crop 800 by 600 pixels at 0, 0.',
    `Enter opened a crop over the whole picture: "${await say()}"`,
  );
  const full = await handles();
  assert(
    full.length === 8,
    `the whole-picture crop draws eight handles (${full.length} white squares)`,
  );
  // The drawn square is 8px with a 1.5px black ring on its edge, so its pure
  // white core reads narrower than 8. What matters is that the eight agree.
  const plain = full[0].run;
  assert(
    plain >= 5 && full.every((h) => h.run === plain),
    `the eight are all one size (runs ${full.map((h) => h.run).join(',')})`,
  );

  step('task 27: the keyboard walks the eight handles, and the live one is drawn larger');
  await page.keyboard.press('[');
  await settle(80);
  assert(
    (await say()) === 'Right handle. Crop 800 by 600 pixels at 0, 0.',
    `a bracket names the handle it moved to: "${await say()}"`,
  );
  const aimed = await handles();
  const big = aimed.filter((h) => h.run > plain);
  assert(
    aimed.length === 8 && big.length === 1,
    `exactly one of the eight is emphasised (${big.length} of ${aimed.length} wider than ${plain}px)`,
  );
  // 'e' is the right edge midpoint: the emphasised square must be on the right
  // edge, vertically between the two corners there.
  const rightmost = Math.max(...aimed.map((h) => h.x));
  assert(
    big[0].x >= rightmost - 2,
    `and it is the right-edge handle the announcement named (x ${big[0].x} of a rightmost ${rightmost})`,
  );

  step('task 27: Alt and an arrow resize from that handle, not from a fixed corner');
  // Four more brackets walk on to the left edge — the handle the crop had no
  // way to reach before, its keyboard resize being nailed to the far corner.
  await repeat(4, () => page.keyboard.press('['));
  await settle(80);
  assert(
    (await say()) === 'Left handle. Crop 800 by 600 pixels at 0, 0.',
    `the walk reached the left edge: "${await say()}"`,
  );
  await repeat(5, () => chord(['Alt', 'Shift'], 'ArrowRight'));
  await settle(120);
  assert(
    (await say()) === 'Crop 750 by 600 pixels at 50, 0.',
    `the left edge came in 50px, taking the origin with it: "${await say()}"`,
  );

  step('task 27: a crop rect too small for edge handles keeps its four corners');
  await page.keyboard.press('Escape');
  await settle(80);
  const mid = { x: geom.x + geom.w / 2, y: geom.y + geom.h / 2 };
  await page.mouse.move(mid.x - 15, mid.y - 15);
  await page.mouse.down();
  await page.mouse.move(mid.x + 15, mid.y + 15, { steps: 6 });
  await page.mouse.up();
  await settle(120);
  const small = await handles();
  assert(
    small.length === 4,
    `a 30px crop offers corners only — an edge handle's target would sit on top of them (${small.length} squares)`,
  );

  step('task 27: dragging a handle adjusts the open crop instead of starting a new one');
  await page.keyboard.press('Escape');
  await settle(80);
  await focusCanvas();
  await page.keyboard.press('Enter');
  await settle(120);
  const corners = await handles();
  const nw = corners.reduce((a, b) => (b.x + b.y < a.x + a.y ? b : a));
  const from = toPage({ x: nw.x + 4, y: nw.y + 4 });
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(from.x + 60, from.y + 40, { steps: 8 });
  await page.mouse.up();
  await settle(150);
  const moved = (await say()).match(/^Crop (\d+) by (\d+) pixels at (\d+), (\d+)\.$/);
  assert(moved !== null, `the drag announced a crop: "${await say()}"`);
  const [w, h, x, y] = moved.slice(1).map(Number);
  assert(x > 0 && y > 0, `the top-left corner came in (now at ${x}, ${y})`);
  // The discriminator: a mousedown that started a fresh rect would leave a box
  // the size of the drag. This one kept the far corner it was never asked to
  // move, so it adjusted the crop that was already open.
  assert(
    x + w === 800 && y + h === 600,
    `and the opposite corner stayed on the picture's own corner (${x}+${w}, ${y}+${h})`,
  );

  step('task 27: a handle that is drawn is grabbable whatever tool is armed');
  // The draft outlives a tool change by design and render() keeps drawing its
  // handles, so a press on one has to reach the crop rather than start a
  // marquee under Select or an annotation under Rectangle.
  await focusCanvas();
  await page.keyboard.press('Escape');
  await page.keyboard.press('c');
  await page.keyboard.press('Enter');
  await settle(120);
  await page.keyboard.press('v');
  await settle(100);
  const afterTool = await handles();
  assert(
    afterTool.length === 8,
    `the crop keeps its eight handles after the tool change (${afterTool.length})`,
  );
  const se = afterTool.reduce((a, b) => (b.x + b.y > a.x + a.y ? b : a));
  const grab = toPage({ x: se.x + 3, y: se.y + 3 });
  await page.mouse.move(grab.x, grab.y);
  await page.mouse.down();
  await page.mouse.move(grab.x - 80, grab.y - 60, { steps: 8 });
  await page.mouse.up();
  await settle(150);
  assert(
    (await say()) === 'Crop 720 by 540 pixels at 0, 0.',
    `the Select tool's press took the handle, not a marquee: "${await say()}"`,
  );

  step('task 27: a fresh rect drops the aim picked on the one it replaces');
  await focusCanvas();
  await page.keyboard.press('Escape');
  await page.keyboard.press('c');
  await page.keyboard.press('Enter');
  await settle(120);
  await page.keyboard.press('[');
  await settle(100);
  assert(
    (await handles()).filter((hh) => hh.run > plain).length === 1,
    'an aim is armed on the rect about to be replaced',
  );
  await page.mouse.move(mid.x - 100, mid.y - 75);
  await page.mouse.down();
  await page.mouse.move(mid.x + 100, mid.y + 75, { steps: 8 });
  await page.mouse.up();
  await settle(150);
  const drawnFresh = await handles();
  assert(
    drawnFresh.length === 8 && drawnFresh.every((hh) => hh.run === plain),
    `the new rect carries eight plain handles and no inherited marker (runs ${drawnFresh
      .map((hh) => hh.run)
      .join(',')})`,
  );

  step('task 27: no crop chrome reaches an exported image');
  const onCanvas = await handles();
  const withDraft = await exportPng();
  assert(
    withDraft.info.width === 800 && withDraft.info.height === 600,
    `the export is still the whole picture while a crop is only drafted (${withDraft.info.width}x${withDraft.info.height})`,
  );
  assert(
    whiteInPng(withDraft.data, withDraft.info) === 0,
    `not one near-white pixel in the export, while the same canvas carries ${onCanvas.length} white handle squares`,
  );

  step('task 27: applying a crop keeps the undo history it used to throw away');
  await focusCanvas();
  await page.keyboard.press('Escape');
  await settle(80);
  await page.keyboard.press('r');
  await page.keyboard.press('Enter');
  await settle(120);
  const placed = (await say()).match(/added at (-?\d+), (-?\d+)/);
  assert(placed !== null, `a rectangle was placed: "${await say()}"`);
  // Walk it up onto the top stripe, which the crop below takes away. The
  // placement is 140 image px tall at this zoom, so a top edge under 60 puts
  // the whole of it above the crop's first kept row.
  await repeat(20, () => chord(['Shift'], 'ArrowUp'));
  await settle(120);
  const high = (await say()).match(/moved to (-?\d+), (-?\d+)/);
  const topY = high === null ? NaN : Number(high[2]);
  assert(
    topY >= 0 && topY + 140 <= 200,
    `and nudged wholly onto the top stripe the crop removes (y ${high?.[2]})`,
  );
  await page.keyboard.press('Escape');
  await page.keyboard.press('c');
  await page.keyboard.press('Enter');
  await settle(120);
  await repeat(3, () => page.keyboard.press('['));
  await settle(80);
  assert(
    (await say()) === 'Top handle. Crop 800 by 600 pixels at 0, 0.',
    `three brackets reached the top handle: "${await say()}"`,
  );
  await repeat(20, () => chord(['Alt', 'Shift'], 'ArrowDown'));
  await settle(150);
  assert(
    (await say()) === 'Crop 800 by 400 pixels at 0, 200.',
    `the top edge came down 200 rows, onto the stripe boundary: "${await say()}"`,
  );
  await page.keyboard.press('Enter');
  await settle(250);
  assert((await say()) === 'Cropped to 800 by 400 pixels.', `the crop applied: "${await say()}"`);
  assert(
    (await count()) === '0',
    `the layer on the removed stripe went with it (${await count()})`,
  );
  const cropped = await exportPng();
  assert(
    cropped.info.width === 800 && cropped.info.height === 400,
    `the export is the cropped picture (${cropped.info.width}x${cropped.info.height})`,
  );
  assert(
    pixel(cropped, 400, 5).join(',') === '60,200,60',
    `and its top row is the middle stripe, the red one having been cropped away (${pixel(cropped, 400, 5)})`,
  );

  step('task 27: Ctrl+Z puts the picture, its rows and the layer on them back');
  await focusCanvas();
  await chord(['Meta'], 'z');
  await settle(400);
  assert(
    (await say()) === 'Undo. Image 800 by 600 pixels. 1 annotation.',
    `undo announced the picture it restored: "${await say()}"`,
  );
  assert((await count()) === '1', `the cropped-away layer is back (${await count()})`);
  const undone = await exportPng();
  assert(
    undone.info.width === 800 && undone.info.height === 600,
    `the export is the whole capture again (${undone.info.width}x${undone.info.height})`,
  );
  assert(
    pixel(undone, 400, 5).join(',') === '200,60,60',
    `and the red stripe the crop threw away is back, pixel for pixel (${pixel(undone, 400, 5)})`,
  );

  step('task 27: and redo takes the crop again, layer and all');
  await focusCanvas();
  await chord(['Meta', 'Shift'], 'z');
  await settle(400);
  assert(
    (await say()) === 'Redo. Image 800 by 400 pixels. 0 annotations.',
    `redo announced the cropped picture: "${await say()}"`,
  );
  assert((await count()) === '0', `and dropped the layer again (${await count()})`);

  step('task 27: an undo taken while the crop is still decoding is not overwritten by it');
  // Undo the redo above, back to the whole picture with its one layer.
  await focusCanvas();
  await chord(['Meta'], 'z');
  await settle(400);
  assert((await count()) === '1', 'back on the whole picture for the decode-window check');
  // Hold the next PNG data URL a page image is given, so the window between
  // applyCrop and its onload is wide enough to press Ctrl+Z inside. Nothing
  // else in the editor assigns a PNG data URL to an <img> at this moment.
  await page.evaluate(() => {
    const d = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');
    globalThis.__hold = 0;
    globalThis.__held = 0;
    Object.defineProperty(HTMLImageElement.prototype, 'src', {
      configurable: true,
      enumerable: d.enumerable,
      get() {
        return d.get.call(this);
      },
      set(v) {
        const ms = globalThis.__hold;
        if (ms > 0 && String(v).startsWith('data:image/png')) {
          globalThis.__hold = 0;
          globalThis.__held += 1;
          setTimeout(() => d.set.call(this, v), ms);
          return;
        }
        d.set.call(this, v);
      },
    });
  });
  await page.keyboard.press('c');
  await page.keyboard.press('Enter');
  await settle(120);
  await repeat(3, () => page.keyboard.press('['));
  await repeat(20, () => chord(['Alt', 'Shift'], 'ArrowDown'));
  await settle(150);
  assert(
    (await say()) === 'Crop 800 by 400 pixels at 0, 200.',
    `the same 800 by 400 crop is drafted again: "${await say()}"`,
  );
  await page.evaluate(() => {
    globalThis.__hold = 1500;
  });
  await page.keyboard.press('Enter');
  await settle(80);
  await chord(['Meta'], 'z');
  await settle(2400); // well past the hold, so the late decode has landed
  assert(
    (await page.evaluate(() => globalThis.__held)) === 1,
    'exactly one decode was really held, so the undo landed inside the window',
  );
  const late = await exportPng();
  assert(
    late.info.width === 800 && late.info.height === 600,
    `the late decode did not replace the picture the undo restored (${late.info.width}x${late.info.height})`,
  );
  assert(
    pixel(late, 400, 5).join(',') === '200,60,60',
    `the red stripe is still there, so picture and marks describe one document (${pixel(late, 400, 5)})`,
  );
  assert((await count()) === '1', `and the restored layer is still there (${await count()})`);

  assert(crashes.length === 0, `no page errors (${crashes.join(' | ') || 'none'})`);
  await page.close();
}

/**
 * task 28: the capture history shelf — lists shelf entries, opens one onto
 * the canvas (a real swap, not just closing the modal), and deletes one
 * behind a two-tap confirm. Seeds `openscreenshot:captures` +
 * `openscreenshot:capture-image:{id}` directly (the shape setLastCapture
 * itself writes) rather than driving a live import, so this test is about
 * the shelf's own list/open/delete wiring — real thumbnail encoding is
 * already exercised for real by every other test in this file (they all
 * seed the legacy `openscreenshot:last-capture` key, which migrates through
 * the real makeThumbnail encoder on first read; task-28-report.md has that
 * regression run).
 */
async function testCaptureHistoryShelf(browser, base, messages) {
  step('task 28: the capture history shelf lists, opens and deletes shelf entries');
  const { page } = await newSmokePage(browser);
  const crashes = [];
  page.on('pageerror', (err) => crashes.push(String(err)));

  const capBlue = await makeCapture(); // 800x600
  const capGreen = await makeGreenCapture(); // 400x300, newer
  const idBlue = 'hist-blue';
  const idGreen = 'hist-green';
  const tinyThumb =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
  await page.evaluateOnNewDocument(installChromeStub, messages, {
    'openscreenshot:captures': [
      {
        id: idGreen,
        thumbnail: tinyThumb,
        width: capGreen.width,
        height: capGreen.height,
        mode: capGreen.mode,
        title: capGreen.title,
        capturedAt: 2000,
      },
      {
        id: idBlue,
        thumbnail: tinyThumb,
        width: capBlue.width,
        height: capBlue.height,
        mode: capBlue.mode,
        title: capBlue.title,
        capturedAt: 1000,
      },
    ],
    [`openscreenshot:capture-image:${idGreen}`]: capGreen.dataUrl,
    [`openscreenshot:capture-image:${idBlue}`]: capBlue.dataUrl,
  });
  await page.goto(`${base}${PAGE}`, { waitUntil: 'networkidle0' });
  await page.waitForSelector('.stage-canvas');
  await new Promise((r) => setTimeout(r, 900));

  // The newest entry (green, capturedAt 2000) autoloads — same as
  // getLastCapture always has.
  await page.waitForSelector('.stage-canvas[aria-label*="400 by 300"]', { timeout: 5000 });

  step('task 28: opening the shelf lists both seeded entries, thumbnails included');
  await page.click('button[title="Capture history"]');
  await page.waitForSelector('.modal[aria-label="Capture history"]');
  // The row list loads async (listCaptureHistory reads storage) — wait for
  // it, rather than reading the modal's still-empty first render.
  await page.waitForSelector('.history-row', { timeout: 5000 });
  const rowCount = await page.$$eval('.history-row', (els) => els.length);
  assert(rowCount === 2, `the shelf lists both seeded entries (${rowCount})`);
  const thumbSrcs = await page.$$eval('.history-thumb', (els) =>
    els.map((el) => el.getAttribute('src')),
  );
  assert(
    thumbSrcs.every((s) => s?.startsWith('data:image/')),
    'every row renders its own thumbnail as an <img>',
  );

  step('task 28: Open carries a date-qualified name (R-28a Important #3), not a duplicate');
  const openLabels = await page.$$eval('.history-row-actions button:first-child', (els) =>
    els.map((el) => el.getAttribute('aria-label')),
  );
  assert(
    openLabels.every((l) => /^Open, captured /.test(l ?? '')),
    `every Open button carries a date-qualified name (${JSON.stringify(openLabels)})`,
  );
  assert(
    new Set(openLabels).size === openLabels.length,
    "the two rows' Open names are distinct, not identical duplicates",
  );

  step(
    'task 28: the row list is one roving-tabindex stop (R-28a Important #4), not one per button',
  );
  const tabIndexes = () =>
    page.$$eval('.history-list button', (els) => els.map((el) => el.tabIndex));
  let idx = await tabIndexes();
  assert(
    idx.filter((t) => t === 0).length === 1 &&
      idx.filter((t) => t === -1).length === idx.length - 1,
    `exactly one button in the list is a tab stop, the rest are -1 (${JSON.stringify(idx)})`,
  );
  const focusedLabel = () =>
    page.evaluate(() => document.activeElement?.getAttribute('aria-label') ?? null);
  // :last-of-type is scoped per parent (each row's own actions div), not
  // across the whole list — the last button in *document order* across all
  // rows is what End should reach.
  const lastButtonLabel = await page.$$eval('.history-list button', (els) =>
    els[els.length - 1].getAttribute('aria-label'),
  );
  await page.$eval('.history-list button[tabindex="0"]', (el) => el.focus());
  const firstLabel = await focusedLabel();
  await page.keyboard.press('ArrowDown');
  const secondLabel = await focusedLabel();
  assert(
    secondLabel !== firstLabel,
    `ArrowDown moved real focus onto a different button (${firstLabel} -> ${secondLabel})`,
  );
  idx = await tabIndexes();
  assert(
    idx.filter((t) => t === 0).length === 1,
    'the roving stop followed focus — still exactly one tabindex=0 after ArrowDown',
  );
  await page.keyboard.press('End');
  const endLabel = await focusedLabel();
  assert(endLabel === lastButtonLabel, `End jumps to the last button in the list (${endLabel})`);
  await page.keyboard.press('Home');
  const homeLabel = await focusedLabel();
  assert(homeLabel === firstLabel, 'Home returns to the first button in the list');
  // The list is one stop in the modal's own Tab cycle, not four (or, at
  // real N=12, twenty-four) — Tab off the roving stop leaves the list in
  // one press, landing on Close (the next focusable element in the modal).
  await page.keyboard.press('Tab');
  const offList = await page.evaluate(() => !document.activeElement?.closest('.history-list'));
  assert(offList, 'Tab off the list stop leaves the list entirely, in one press');

  step('task 28: Open on the older entry swaps the canvas to its picture');
  // Row order follows the seeded array: index 0 = green (newest), index 1 =
  // blue (older) — nth-child is 1-based.
  await page.click('.history-row:nth-child(2) .history-row-actions button:first-child');
  await page.waitForFunction(() => !document.querySelector('.modal[aria-label="Capture history"]'));
  await page.waitForSelector('.stage-canvas[aria-label*="800 by 600"]', { timeout: 5000 });

  step('task 28: Delete needs a second click to confirm, then removes the row');
  await page.click('button[title="Capture history"]');
  await page.waitForSelector('.modal[aria-label="Capture history"]');
  const deleteBtn = '.history-row:nth-child(1) .history-delete-btn';
  await page.waitForSelector(deleteBtn, { timeout: 5000 });
  await page.click(deleteBtn);
  assert(
    (await page.$eval(deleteBtn, (el) => el.getAttribute('data-armed'))) === 'true',
    'the first click arms the confirm, without deleting yet',
  );
  assert(
    (await page.$$eval('.history-row', (els) => els.length)) === 2,
    'the row is still there after the first click',
  );
  await page.click(deleteBtn);
  await page.waitForFunction(() => document.querySelectorAll('.history-row').length === 1);
  assert(
    (await page.$$eval('.history-row', (els) => els.length)) === 1,
    'the second click actually deletes the row',
  );

  step('task 28: Escape closes the shelf and returns focus to its trigger');
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !document.querySelector('.modal[aria-label="Capture history"]'));
  const onTrigger = await page.evaluate(
    () => document.activeElement === document.querySelector('button[title="Capture history"]'),
  );
  assert(onTrigger, 'focus returns to the History trigger on Escape');

  assert(crashes.length === 0, `no page errors (${crashes.join(' | ') || 'none'})`);
  await page.close();
}

/**
 * task 29: Pin a capture via Document Picture-in-Picture.
 *
 * This headless Chrome turns out to genuinely implement
 * documentPictureInPicture on a real http(s) page (confirmed separately:
 * `typeof window.documentPictureInPicture` reads "undefined" only on
 * about:blank, an opaque-origin quirk — on the dist server's own origin it
 * is a real object with a real requestWindow). So the open path is driven
 * for real below: a trusted click (page.click(), CDP Input events — see
 * testPdfExportInBackgroundTab's module comment for why that counts as
 * real, not synthetic, input) opens a genuine Document Picture-in-Picture
 * window, which Puppeteer attaches to as its own page (found by diffing
 * browser.targets() around the click) and every assertion below reads back
 * from that real window: its title, its stylesheet, its <img>, and — after
 * an edit on the opener — its redrawn picture.
 *
 * Two things this Chrome build cannot be made to do stand in for
 * themselves instead:
 *   - The absent-API case: since the real API is present here, it is forced
 *     absent (a getter override before the app's own scripts run) rather
 *     than found missing on its own.
 *   - The rejected-request case: this build does not enforce user
 *     activation on requestWindow() at all (confirmed separately: even a
 *     call with no click anywhere resolves), so a real NotAllowedError
 *     cannot be produced here. That branch runs against a stubbed
 *     documentPictureInPicture instead, the same shape
 *     tests/unit/pin.test.ts stubs for the same branch.
 */
async function testPinToFloatingWindow(browser, base, messages) {
  const pinBtn = 'button[aria-label="Pin in a floating window"]';

  step('task 29: the Pin button is absent when Document Picture-in-Picture is unavailable');
  {
    const { page } = await newSmokePage(browser);
    const crashes = [];
    page.on('pageerror', (err) => crashes.push(String(err)));
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(window, 'documentPictureInPicture', {
        get: () => undefined,
        configurable: true,
      });
    });
    await page.evaluateOnNewDocument(installChromeStub, messages, {
      'openscreenshot:last-capture': await makeCapture(),
    });
    await page.goto(`${base}${PAGE}`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('.stage-canvas');
    await new Promise((r) => setTimeout(r, 900));
    assert(
      (await page.evaluate(() => window.documentPictureInPicture)) === undefined,
      'the override really reads as undefined, the way a browser without the API would',
    );
    assert(
      (await page.$(pinBtn)) === null,
      'the Pin button does not render — never a disabled no-op, just absent',
    );
    assert(crashes.length === 0, `no page errors (${crashes.join(' | ') || 'none'})`);
    await page.close();
  }

  step('task 29: with the API present, Pin opens a real Document Picture-in-Picture window');
  const { page } = await newSmokePage(browser);
  const crashes = [];
  page.on('pageerror', (err) => crashes.push(String(err)));
  await page.evaluateOnNewDocument(installChromeStub, messages, {
    'openscreenshot:last-capture': await makeCapture(),
  });
  await page.goto(`${base}${PAGE}`, { waitUntil: 'networkidle0' });
  await page.waitForSelector('.stage-canvas');
  await new Promise((r) => setTimeout(r, 900));

  await page.waitForSelector(pinBtn, { timeout: 5000 });
  const pinTitle = await page.$eval(pinBtn, (el) => el.getAttribute('title'));
  assert(
    /closes with this tab/.test(pinTitle ?? ''),
    `the button's own tooltip says the window closes with the tab (${pinTitle})`,
  );

  const knownTargets = new Set(browser.targets());
  await page.click(pinBtn); // trusted click, dispatched via CDP Input events

  let pipTarget = null;
  for (let i = 0; i < 25 && !pipTarget; i++) {
    pipTarget = browser
      .targets()
      .find((t) => t.type() === 'page' && t.url() === 'about:blank' && !knownTargets.has(t));
    if (!pipTarget) await new Promise((r) => setTimeout(r, 200));
  }
  assert(pipTarget != null, 'a real Document Picture-in-Picture window opened');
  const pipPage = await pipTarget.page();

  const pipTitle = await pipPage.title();
  assert(
    pipTitle.startsWith('Pinned capture') && pipTitle.includes('updates as you edit'),
    `the window's title says what it shows and that it stays live (${pipTitle})`,
  );
  const styleText = await pipPage.$eval('style', (el) => el.textContent);
  assert(
    styleText.includes('object-fit:contain') && styleText.includes('overflow:hidden'),
    'the pinned window carries its own stylesheet: the picture fitted, no scrollbars',
  );
  const firstSrc = await pipPage.$eval('img', (el) => el.src);
  assert(
    firstSrc.startsWith('data:image/png;base64,'),
    'the composed picture landed as a PNG <img>, same encoding Copy/Export use',
  );

  step('task 29: the pinned window redraws live as the capture is edited');
  await page.click('button[title^="Rectangle"]');
  const box = await page.$eval('.stage-canvas', (el) => {
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height };
  });
  await page.mouse.move(box.x + box.w * 0.3, box.y + box.h * 0.3);
  await page.mouse.down();
  await page.mouse.move(box.x + box.w * 0.6, box.y + box.h * 0.6, { steps: 8 });
  await page.mouse.up();
  await pipPage.waitForFunction(
    (before) => document.querySelector('img').src !== before,
    { timeout: 5000 },
    firstSrc,
  );
  const secondSrc = await pipPage.$eval('img', (el) => el.src);
  assert(
    secondSrc !== firstSrc,
    'drawing an annotation re-composed the pinned image — not a snapshot from when Pin was clicked',
  );

  step('task 29: the pinned window closes with the tab that opened it');
  let pipClosed = false;
  const onDestroyed = (t) => {
    if (t === pipTarget) pipClosed = true;
  };
  browser.on('targetdestroyed', onDestroyed);
  await page.close();
  for (let i = 0; i < 15 && !pipClosed; i++) await new Promise((r) => setTimeout(r, 200));
  browser.off('targetdestroyed', onDestroyed);
  assert(pipClosed, 'closing the tab that opened it closes the pinned window too');
  assert(crashes.length === 0, `no page errors (${crashes.join(' | ') || 'none'})`);

  step('task 29: a rejected request surfaces its reason in the stage-notice pill');
  // Stubbed, per the module comment above: this build does not enforce user
  // activation, so a real rejection cannot be produced against it.
  const { page: page3 } = await newSmokePage(browser);
  const crashes3 = [];
  page3.on('pageerror', (err) => crashes3.push(String(err)));
  // A plain assignment silently no-ops here: the real API (confirmed present
  // on this origin) sits behind a getter-only accessor, so overriding it
  // needs defineProperty, the same way the absent-API case above does.
  await page3.evaluateOnNewDocument(() => {
    Object.defineProperty(window, 'documentPictureInPicture', {
      configurable: true,
      get: () => ({
        requestWindow: () => Promise.reject(new DOMException('blocked', 'NotAllowedError')),
      }),
    });
  });
  await page3.evaluateOnNewDocument(installChromeStub, messages, {
    'openscreenshot:last-capture': await makeCapture(),
  });
  await page3.goto(`${base}${PAGE}`, { waitUntil: 'networkidle0' });
  await page3.waitForSelector('.stage-canvas');
  await new Promise((r) => setTimeout(r, 900));
  await page3.waitForSelector(pinBtn, { timeout: 5000 });
  await page3.click(pinBtn);
  await page3.waitForSelector('.stage-notice', { timeout: 5000 });
  const noticeText = await page3.$eval('.stage-notice span', (el) => el.textContent);
  assert(
    noticeText === 'Could not open the pinned window — try clicking Pin again.',
    `the pill names the rejection (${noticeText})`,
  );
  assert(crashes3.length === 0, `no page errors (${crashes3.join(' | ') || 'none'})`);
  await page3.close();
}

/**
 * task 30 — the blur strength slider: opens at the fixed default, carries an
 * accessible name and a value text, steps by keyboard including Home/End,
 * and — the thing none of that proves by itself — actually changes what the
 * redaction paints into an export.
 */
async function testBlurStrength(browser, base, messages) {
  step('task 30: the strength slider opens at the fixed default, with a range and a value text');
  const { page } = await newSmokePage(browser);
  const crashes = [];
  page.on('pageerror', (err) => crashes.push(String(err)));
  await page.evaluateOnNewDocument(installChromeStub, messages, {
    'openscreenshot:last-capture': await makeCheckerCapture(),
  });
  await page.goto(`${base}${PAGE}`, { waitUntil: 'networkidle0' });
  await page.waitForSelector('.stage-canvas');
  await new Promise((r) => setTimeout(r, 900));

  const sharp = createRequire(join(ROOT, 'package.json'))('sharp');
  const settle = (ms = 120) => new Promise((r) => setTimeout(r, ms));
  const focusCanvas = () => page.$eval('.stage-canvas', (el) => el.focus());
  const say = () =>
    page.evaluate(() =>
      document.querySelector('[aria-live="polite"][role="status"]').textContent.trim(),
    );
  const strengthInput = 'input[aria-label="Blur strength"]';
  const strengthState = () =>
    page.$eval(strengthInput, (el) => ({
      value: el.value,
      min: el.min,
      max: el.max,
      step: el.step,
      valuetext: el.getAttribute('aria-valuetext'),
    }));

  await focusCanvas();
  await page.keyboard.press('b');
  await settle(80);
  await page.waitForSelector(strengthInput);
  const initial = await strengthState();
  assert(
    initial.value === '8',
    `a fresh blur strength opens at the fixed default (${initial.value})`,
  );
  assert(
    initial.valuetext === '8',
    `and the value text reads the same number a sighted user sees (${initial.valuetext})`,
  );
  assert(
    initial.min === '2' && initial.max === '32' && initial.step === '1',
    `range 2-32, step 1 (${initial.min}-${initial.max} step ${initial.step})`,
  );

  step('task 30: Enter places a blur at that default, selected and ready to re-edit');
  await page.keyboard.press('Enter');
  await settle(120);
  const added = /added at (\d+), (\d+)\./.exec(await say());
  assert(added, `placing a blur announces where it landed ("${await say()}")`);
  const [cx, cy] = [Number(added[1]) + 70, Number(added[2]) + 70]; // PLACE_SIZE_PX is 140

  // The checker's own two colours are a 50/50 split, so a patch big enough to
  // catch a cell either strength averages straight back to the same midpoint
  // — mean colour cannot tell them apart. Local contrast can: strength 8's
  // tile is still finer than one 20px cell, so the patch holds both colours
  // close to full-strength; strength 32's tile is coarser than the whole
  // region, so every pixel in it is already blended toward that midpoint.
  // Red channel only — it is the one that differs between the two colours.
  const patchRedStdDev = ({ data, info }, x, y, half = 24) => {
    let sum = 0;
    let sumSq = 0;
    let n = 0;
    for (let yy = Math.max(0, y - half); yy < Math.min(info.height, y + half); yy++) {
      for (let xx = Math.max(0, x - half); xx < Math.min(info.width, x + half); xx++) {
        const r = data[(yy * info.width + xx) * info.channels];
        sum += r;
        sumSq += r * r;
        n++;
      }
    }
    const mean = sum / n;
    return Math.sqrt(Math.max(0, sumSq / n - mean * mean));
  };
  const exportPng = async () => {
    await page.click('header .btn-secondary[title^="Export"]');
    await page.waitForSelector('.modal-actions .btn-primary');
    await page.click('.modal-actions .btn-primary');
    await page.waitForFunction(() => !document.querySelector('.modal'), { timeout: 5000 });
    const download = await page.evaluate(() => globalThis.__smoke.downloads.at(-1));
    return sharp(Buffer.from(download.url.slice(download.url.indexOf(',') + 1), 'base64'))
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
  };

  const atDefault = await exportPng();
  const defaultStdDev = patchRedStdDev(atDefault, cx, cy);

  step('task 30: arrow keys, Home and End move the strength, each announced in its value text');
  await page.$eval(strengthInput, (el) => el.focus());
  await page.keyboard.press('ArrowRight');
  await settle(60);
  const afterArrow = await strengthState();
  assert(
    afterArrow.value === '9' && afterArrow.valuetext === '9',
    `ArrowRight steps by 1 (${afterArrow.value}), value text matches (${afterArrow.valuetext})`,
  );
  await page.keyboard.press('Home');
  await settle(60);
  assert(
    (await strengthState()).value === '2',
    `Home jumps to the minimum (${(await strengthState()).value})`,
  );
  await page.keyboard.press('End');
  await settle(60);
  const afterEnd = await strengthState();
  assert(
    afterEnd.value === '32' && afterEnd.valuetext === '32',
    `End jumps to the maximum, value text matches (${afterEnd.value}/${afterEnd.valuetext})`,
  );

  step(
    'task 30: strength 32 on the same blur paints a measurably different export than the default 8',
  );
  const atMax = await exportPng();
  const maxStdDev = patchRedStdDev(atMax, cx, cy);
  assert(
    defaultStdDev > maxStdDev + 15,
    `strength alone flattens the same rect's local contrast (red std-dev default ${defaultStdDev.toFixed(1)}, max ${maxStdDev.toFixed(1)})`,
  );

  step(
    'task 30: Solid redaction has no strength — the slider disables rather than lying about one',
  );
  await page.click('.stylebar .segmented-btn[title="Opaque fill — nothing survives"]');
  await settle(80);
  assert(
    await page.$eval(strengthInput, (el) => el.disabled),
    'the strength slider disables under Solid, which reads no strength at all (drawBlur, annotations.ts)',
  );

  assert(crashes.length === 0, `no page errors (${crashes.join(' | ') || 'none'})`);
  await page.close();
}

/**
 * task 41, defect 1 — an annotation dragged past the image's edge used to
 * render in the live preview (the on-screen canvas is bigger than the
 * picture) and vanish at export (composeFinal always clips) — whichever a
 * user looked at told a different story. render() now clips unconditionally,
 * the same as composeFinal always has, so this pins the preview side down:
 * a rect nudged out past the picture's right edge leaves no ink beyond it.
 */
async function testAnnotationClipMatchesExport(browser, base, messages) {
  step('task 41: an annotation dragged past the image edge is clipped in the preview too');
  const { page } = await newSmokePage(browser);
  const crashes = [];
  page.on('pageerror', (err) => crashes.push(String(err)));
  await page.evaluateOnNewDocument(installChromeStub, messages, {
    'openscreenshot:last-capture': await makeCapture(), // 800x600, solid rgb(60,110,190)
  });
  await page.goto(`${base}${PAGE}`, { waitUntil: 'networkidle0' });
  await page.waitForSelector('.stage-canvas');
  await new Promise((r) => setTimeout(r, 900));

  const snap = () =>
    page.evaluate(() => {
      const canvas = document.querySelector('.stage-canvas');
      const { width, height } = canvas;
      return {
        width,
        height,
        data: Array.from(canvas.getContext('2d').getImageData(0, 0, width, height).data),
      };
    });
  /** The rectangle of (x,y) positions `accepts` picks out, or null for none. */
  const scanBox = (width, height, accepts) => {
    let x0 = Infinity;
    let x1 = -Infinity;
    let y0 = Infinity;
    let y1 = -Infinity;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (accepts(x, y, (y * width + x) * 4)) {
          if (x < x0) x0 = x;
          if (x > x1) x1 = x;
          if (y < y0) y0 = y;
          if (y > y1) y1 = y;
        }
      }
    }
    return x1 >= x0 ? { x0, x1, y0, y1 } : null;
  };
  const matchBox = (snap, matches) =>
    scanBox(snap.width, snap.height, (x, y, i) =>
      matches(snap.data[i], snap.data[i + 1], snap.data[i + 2], snap.data[i + 3]),
    );
  /** Where `b` disagrees with `a` — what a change against `a` painted. */
  const diffBox = (a, b) =>
    scanBox(
      a.width,
      a.height,
      (x, y, i) =>
        a.data[i] !== b.data[i] ||
        a.data[i + 1] !== b.data[i + 1] ||
        a.data[i + 2] !== b.data[i + 2] ||
        a.data[i + 3] !== b.data[i + 3],
    );

  const before = await snap();
  const image = matchBox(before, (r, g, b) => r === 60 && g === 110 && b === 190);
  assert(image, 'found the solid-colour image footprint in the preview');

  const focusCanvas = () => page.$eval('.stage-canvas', (el) => el.focus());
  await focusCanvas();
  await page.keyboard.press('r'); // Rect tool
  await page.keyboard.press('Enter'); // places a default rect, selected, ~140 screen px square
  await new Promise((r) => setTimeout(r, 150)); // the state update that repaints the canvas lands async

  const afterPlace = await snap();
  const rectBoxAfterPlace = diffBox(before, afterPlace);
  assert(rectBoxAfterPlace, 'placing the rect changed pixels on the preview');

  // The image's on-screen width tells the current zoom (PLACE_SIZE_PX is
  // screen-space-constant by construction, but STEP_COARSE is image pixels).
  const zoom = (image.x1 - image.x0 + 1) / 800;
  const margin = 24; // comfortably past the edge, on screen
  const target = image.x1 + margin;
  const stepPx = 10 * zoom; // STEP_COARSE, keyboard.ts
  const nudges = Math.max(0, Math.ceil((target - rectBoxAfterPlace.x1) / stepPx));
  for (let i = 0; i < nudges; i++) {
    await page.keyboard.down('Shift');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.up('Shift');
  }
  await new Promise((r) => setTimeout(r, 150));
  await page.keyboard.press('Escape'); // deselect: drop the (deliberately unclipped) handle chrome
  await new Promise((r) => setTimeout(r, 150));

  const afterNudge = await snap();
  const inkBox = diffBox(before, afterNudge);
  assert(inkBox, 'the moved rect still left some ink on the preview');
  assert(
    inkBox.x1 <= image.x1,
    `the rect's ink stops at the image's right edge (ink to ${inkBox.x1}, image edge ${image.x1}) — it does not bleed into the checkerboard the way it used to`,
  );

  assert(crashes.length === 0, `no page errors (${crashes.join(' | ') || 'none'})`);
  await page.close();
}

/**
 * task 41, defect 5 — the style bar's stroke-width preview bars used to draw
 * at `Math.min(w, 8)px` (App.tsx), so the 6px and 12px buttons rendered 6px
 * and 8px tall: two pixels apart, hard to tell apart at a glance. This reads
 * the three `.width-bar` heights the built page actually lays out and checks
 * they are clearly stepped, not just non-equal (annotations.test.ts's
 * strokeBarHeight unit tests cover the exact px values; this proves the CSS
 * custom property actually reaches the DOM).
 */
async function testStrokeWidthPreviewDistinct(browser, base, messages) {
  step('task 41: the stroke-width preview bars are clearly stepped, not clamped alike');
  const { page } = await newSmokePage(browser);
  const crashes = [];
  page.on('pageerror', (err) => crashes.push(String(err)));
  await page.evaluateOnNewDocument(installChromeStub, messages, {
    'openscreenshot:last-capture': await makeCapture(),
  });
  await page.goto(`${base}${PAGE}`, { waitUntil: 'networkidle0' });
  await page.waitForSelector('.stage-canvas');
  await new Promise((r) => setTimeout(r, 900));

  await page.$eval('.stage-canvas', (el) => el.focus());
  await page.keyboard.press('r'); // Rect tool — brings up the Stroke group
  await page.waitForSelector('.stylebar .width-bar');

  const heights = await page.$$eval('.width-btn .width-bar', (els) =>
    els.map((el) => Math.round(el.getBoundingClientRect().height)),
  );
  assert(heights.length === 3, `three stroke-width presets rendered (${heights.length})`);
  const sorted = [...heights].sort((a, b) => a - b);
  assert(
    JSON.stringify(sorted) === JSON.stringify(heights),
    `the presets render smallest-to-largest, left to right (${heights.join(', ')})`,
  );
  for (let i = 1; i < sorted.length; i++) {
    assert(
      sorted[i] - sorted[i - 1] >= 4,
      `adjacent presets are clearly stepped (${sorted[i - 1]}px vs ${sorted[i]}px)`,
    );
  }

  assert(crashes.length === 0, `no page errors (${crashes.join(' | ') || 'none'})`);
  await page.close();
}

async function main() {
  const built = await stat(join(DIST, PAGE.slice(1))).then(
    () => true,
    () => false,
  );
  if (!built) throw new Error(`${DIST}${PAGE} is missing — run "npm run build" first`);

  const messages = JSON.parse(await readFile(join(DIST, '_locales/en/messages.json'), 'utf8'));
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
    const { page } = await newSmokePage(browser);
    const crashes = [];
    page.on('pageerror', (err) => crashes.push(String(err)));
    page.on('console', (msg) => {
      if (msg.type() === 'error') console.log(`    console.error: ${msg.text()}`);
    });
    await page.evaluateOnNewDocument(installChromeStub, messages, {
      'openscreenshot:last-capture': await makeCapture(),
    });
    await page.goto(`${base}${PAGE}`, { waitUntil: 'networkidle0' });

    // Proves the stub above actually resolves from messages.json instead of
    // echoing the key back — every English assertion below (and every editor
    // string an English-locale user reads) is only checking the right thing
    // because this is true. `editorUndoLabel` is real dist/_locales content,
    // not something this file invents.
    step('the chrome.i18n stub resolves a real string, not the key');
    assert(
      (await page.evaluate(() => chrome.i18n.getMessage('editorUndoLabel'))) === 'Undo',
      'chrome.i18n.getMessage("editorUndoLabel") resolves to "Undo", not the key itself',
    );

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
    // task-23: popovers/modals/notices now stay mounted through a DUR_MID
    // (150ms) exit transition (transition.ts's useExitDelay) before actually
    // leaving the DOM, so a bare `(await page.$(sel)) === null` right after a
    // close action races that timer instead of proving anything — this polls
    // until the node is genuinely gone (or the timeout below fails loudly).
    const closed = async (selector, timeout = 2000) => {
      try {
        await page.waitForFunction((sel) => !document.querySelector(sel), { timeout }, selector);
        return true;
      } catch {
        return false;
      }
    };
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
    assert(await closed('.crop-confirm'), 'the confirm bar went away');

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

    // --- Task 22: the canvas plate/checkerboard/hairline follow a live theme
    // flip (not just a reload), and the selection outline is a real
    // black+white two-tone rather than one flat colour. ---

    step('task 22: the plate/checkerboard/hairline follow a live theme flip, not just reload');
    const currentTheme = () =>
      page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    // No value baked in on purpose — headless Chrome's default colour scheme
    // is an environment detail, not something this smoke should assume.
    // Whichever theme the page loaded with is theme A; the flip below goes
    // to whichever theme A is not.
    const themeA = await currentTheme();
    const themeB = themeA === 'dark' ? 'light' : 'dark';
    const maxChannelDelta = (bandA, bandB) => {
      let worst = 0;
      for (let r = 0; r < Math.min(bandA.length, bandB.length); r++) {
        for (let c = 0; c < 3; c++) worst = Math.max(worst, Math.abs(bandA[r][c] - bandB[r][c]));
      }
      return worst;
    };
    // The hairline is a 1px stroke laid over the image's own top edge, only
    // painted with the beautify frame off (the state at this point — nothing
    // before this step touches it). The drop shadow (canvas.ts's unthemed
    // `rgba(0, 0, 0, 0.24)`, deliberately left alone by this task) blurs a
    // soft, partially-transparent black halo above that same edge — so this
    // scans for the first FULLY opaque row (alpha === 255), not merely
    // alpha > 0, to land past the shadow's gradient and on the actual
    // image/hairline content. A short band of rows, not just that one, then
    // tolerates sub-pixel rounding in exactly where the stroke lands.
    const hairlineBand = () =>
      page.evaluate(() => {
        const canvas = document.querySelector('.stage-canvas');
        const ctx = canvas.getContext('2d');
        const { width, height } = canvas;
        const data = ctx.getImageData(0, 0, width, height).data;
        const midX = Math.floor(width / 2);
        let top = -1;
        for (let y = 0; y < height; y++) {
          if (data[(y * width + midX) * 4 + 3] === 255) {
            top = y;
            break;
          }
        }
        if (top < 0) return null;
        const rows = [];
        for (let y = top; y < Math.min(top + 4, height); y++) {
          const i = (y * width + midX) * 4;
          rows.push([data[i], data[i + 1], data[i + 2]]);
        }
        return rows;
      });
    const hairlineA = await hairlineBand();
    assert(hairlineA !== null, 'the image edge is visible on the canvas (frame off)');

    // Checkerboard/plate: only visible with the frame on and its background
    // set to Transparent — the image itself is opaque and otherwise fully
    // covers the same-sized plate/checkerboard drawn underneath it, so the
    // padding around a beautified, transparent-background image is the one
    // place this paints. The scan below locates that padding band from the
    // canvas's own alpha (outside the canvas content) and colour (inside the
    // fixed-fill test image) rather than any assumed geometry.
    await clickOpen(beautifyTrigger);
    await settle();
    await page.click('.swatch-transparent');
    await settle();
    const padBand = () =>
      page.evaluate(() => {
        const canvas = document.querySelector('.stage-canvas');
        const ctx = canvas.getContext('2d');
        const { width, height } = canvas;
        const data = ctx.getImageData(0, 0, width, height).data;
        const midY = Math.floor(height / 2);
        const at = (x) => {
          const i = (midY * width + x) * 4;
          return [data[i], data[i + 1], data[i + 2], data[i + 3]];
        };
        let outer = -1;
        for (let x = 0; x < width; x++) {
          if (at(x)[3] > 0) {
            outer = x;
            break;
          }
        }
        if (outer < 0) return null;
        // The synthetic capture's fixed fill colour (makeCapture, top of file).
        const isImageFill = (p) =>
          Math.abs(p[0] - 60) < 12 && Math.abs(p[1] - 110) < 12 && Math.abs(p[2] - 190) < 12;
        let inner = -1;
        for (let x = outer; x < width; x++) {
          if (isImageFill(at(x))) {
            inner = x;
            break;
          }
        }
        if (inner < 0 || inner - outer < 4) return null;
        return at(Math.floor((outer + inner) / 2)).slice(0, 3);
      });
    const padA = await padBand();
    assert(padA !== null, 'a transparent-background padding band is visible around the image');

    // emulateMediaFeatures replaces the whole feature list — repeating
    // prefers-reduced-motion here keeps newSmokePage's no-preference default
    // from silently reverting to this machine's ambient setting for every
    // step after this one.
    await page.emulateMediaFeatures([
      { name: 'prefers-color-scheme', value: themeB },
      { name: 'prefers-reduced-motion', value: 'no-preference' },
    ]);
    await settle(300);
    assert(
      (await currentTheme()) === themeB,
      `an OS-level colour-scheme flip alone (no click) changed data-theme (${themeA} -> ${themeB})`,
    );
    const padB = await padBand();
    assert(padB !== null, 'the padding band is still visible after the flip');
    assert(
      maxChannelDelta([padA], [padB]) > 20,
      `the checkerboard/plate colour changed with the theme (${padA} -> ${padB})`,
    );

    // Back to frame-off to read the hairline under theme B too.
    await page.click('.beautify-toggle input');
    await settle();
    const hairlineB = await hairlineBand();
    assert(hairlineB !== null, 'the image edge is still visible with the frame off again');
    assert(
      maxChannelDelta(hairlineA, hairlineB) > 20,
      `the hairline colour changed with the theme (row band ${JSON.stringify(hairlineA)} -> ${JSON.stringify(hairlineB)})`,
    );

    // Restore theme A so nothing later in this file inherits a flipped OS
    // preference, and close the panel — the Beautify a11y steps right below
    // this one assume it starts closed.
    // See the flip to themeB above for why prefers-reduced-motion repeats here.
    await page.emulateMediaFeatures([
      { name: 'prefers-color-scheme', value: themeA },
      { name: 'prefers-reduced-motion', value: 'no-preference' },
    ]);
    await settle(300);
    assert(
      (await currentTheme()) === themeA,
      'the OS preference flip back restored the original theme',
    );
    await page.keyboard.press('Escape');
    await settle();
    assert(
      await closed('.beautify-popover'),
      'closed the panel — back to the state the steps below expect',
    );

    step(
      'task 22: the selection outline is a genuine black+white two-tone, present only when selected',
    );
    // Exact opaque black/white pixel counts: nothing else on this canvas
    // paints pure (0,0,0) or pure (255,255,255) at full alpha in this
    // frame-off, opaque-image, light-or-dark-plate state (the plate/
    // checkerboard read --surface-1/--surface-3, and the image is fully
    // opaque so they never show through it anyway) — so a jump in both
    // counts specifically when something is selected isolates the
    // selection chrome, not an incidental match elsewhere.
    const opaqueColorCounts = () =>
      page.evaluate(() => {
        const canvas = document.querySelector('.stage-canvas');
        const ctx = canvas.getContext('2d');
        const { width, height } = canvas;
        const data = ctx.getImageData(0, 0, width, height).data;
        let black = 0;
        let white = 0;
        for (let i = 0; i < data.length; i += 4) {
          if (data[i + 3] !== 255) continue;
          if (data[i] === 0 && data[i + 1] === 0 && data[i + 2] === 0) black++;
          else if (data[i] === 255 && data[i + 1] === 255 && data[i + 2] === 255) white++;
        }
        return { black, white };
      });
    if (await page.$eval('[aria-label="Delete selected"]', (b) => b.disabled)) {
      // Enter-to-place is bound to the canvas element itself, not window
      // (useEditor.ts's onCanvasKeyDown docstring), so it needs the canvas to
      // actually hold focus — no longer true after the Beautify popover's
      // buttons above took it.
      await page.$eval('.stage-canvas', (el) => el.focus());
      await page.keyboard.press('r');
      await page.keyboard.press('Enter');
      await settle();
    }
    assert(
      !(await page.$eval('[aria-label="Delete selected"]', (b) => b.disabled)),
      'an annotation is selected going into the pixel check',
    );
    const selectedCounts = await opaqueColorCounts();
    await page.keyboard.press('Escape');
    await settle();
    const deselectedCounts = await opaqueColorCounts();
    assert(
      selectedCounts.black > deselectedCounts.black + 20,
      `selecting adds pure-black pixels (selected ${selectedCounts.black}, deselected ${deselectedCounts.black})`,
    );
    assert(
      selectedCounts.white > deselectedCounts.white + 20,
      `and pure-white pixels too — a genuine two-tone, not one flat colour (selected ${selectedCounts.white}, deselected ${deselectedCounts.white})`,
    );

    step('task 22: the selection chrome (marching ants, handles) never reaches an exported image');
    // Same reason as above: Enter-to-place and the Alt+Arrow resize below are
    // both bound to the canvas element, so it must hold focus first.
    await page.$eval('.stage-canvas', (el) => el.focus());
    await page.keyboard.press('r');
    await page.keyboard.press('Enter');
    await settle();
    const placedAt = (await say())
      .match(/at (-?\d+), (-?\d+)/)
      .slice(1)
      .map(Number);
    await chord(['Alt'], 'ArrowRight');
    await settle();
    const [placedW] = await sizeOf();
    await chord(['Alt'], 'ArrowLeft'); // net-zero: back to the placed size
    await settle();
    const [rx, ry] = placedAt;
    const rw = placedW - 1;
    await chord(['Meta'], 's');
    await page.waitForSelector('.modal');
    await page.waitForFunction(() =>
      document.querySelector('.modal').contains(document.activeElement),
    );
    await page.$eval('.format-grid .format-card:first-child', (el) => el.focus());
    await page.keyboard.press('Enter');
    await settle();
    await page.$eval('.modal .btn-primary', (el) => el.focus());
    await page.keyboard.press('Enter');
    await settle(800);
    const exportedDownload = await page.evaluate(() => globalThis.__smoke.downloads.at(-1));
    assert(exportedDownload.filename.endsWith('.png'), 'exported a PNG for the pixel check');
    const sharp = createRequire(join(ROOT, 'package.json'))('sharp');
    const exportedBase64 = exportedDownload.url.slice(exportedDownload.url.indexOf(',') + 1);
    const { data: exportedData, info: exportedInfo } = await sharp(
      Buffer.from(exportedBase64, 'base64'),
    )
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const exportedAt = (x, y) => {
      const i = (y * exportedInfo.width + x) * exportedInfo.channels;
      return [exportedData[i], exportedData[i + 1], exportedData[i + 2], exportedData[i + 3]];
    };
    // The frame is off (m.pad === 0), so export image coordinates equal
    // annotation image coordinates directly. Sample a band around the
    // annotation's top-edge handle position — where the preview draws an
    // 8x8 white-fill/black-ring handle square that composeFinal() never
    // draws — for the presence of near-black or near-white pixels.
    const handleMidX = Math.round(rx + rw / 2);
    let exportSawContent = false;
    let exportClean = true;
    for (let y = ry - 6; y <= ry + 6; y++) {
      if (y < 0 || y >= exportedInfo.height) continue;
      for (let x = handleMidX - 5; x <= handleMidX + 5; x++) {
        if (x < 0 || x >= exportedInfo.width) continue;
        const [er, eg, eb] = exportedAt(x, y);
        const isBlack = er < 40 && eg < 40 && eb < 40;
        const isWhite = er > 215 && eg > 215 && eb > 215;
        if (isBlack || isWhite) exportClean = false;
        else exportSawContent = true;
      }
    }
    assert(exportSawContent, 'sampled real content around the selection handle (sanity check)');
    assert(
      exportClean,
      'no near-black or near-white handle/marching-ants pixel in the export at the selection boundary',
    );

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
    assert(await closed('.beautify-popover'), 'Escape closed the panel');
    assert(await activeElementIs(beautifyTrigger), 'focus returned to the Beautify trigger');

    step('an outside pointer click closes the Beautify popover without stealing focus');
    await page.keyboard.press('Enter');
    await settle();
    assert((await page.$('.beautify-popover')) !== null, 'reopened for the outside-click check');
    await outsideClick();
    await settle();
    assert(await closed('.beautify-popover'), 'the outside click closed the panel');
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
      await closed('.beautify-popover'),
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
    assert(await closed('.beautify-popover'), 'Shift+Tab off the first control closed the panel');
    await page.keyboard.press('Tab');
    await settle();
    assert(
      await closed('.beautify-popover'),
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
      await closed('.beautify-popover'),
      'Shift+Tab off the first control closed a panel that was opened by mouse',
    );
    await page.keyboard.press('Tab');
    await settle();
    assert(await closed('.beautify-popover'), 'and it did not reopen on the next Tab');

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
      await closed('.beautify-popover'),
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
    assert(await closed('.zoom-popover'), 'Escape closed the menu');
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
    assert(await closed('.zoom-popover'), 'the menu closed after activation');
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
    assert(await closed('.zoom-popover'), 'Tab closed the menu');
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
    assert(await closed('.zoom-popover'), 'Tab off the last item closed the menu');
    await page.keyboard.press('Tab');
    await settle();
    assert(await closed('.zoom-popover'), 'and it did not reopen on a further Tab');

    step('Shift+Tab off the first zoom item closes the menu too — symmetry with Beautify above');
    await page.$eval(zoomTrigger, (el) => el.focus());
    await page.keyboard.press('ArrowDown');
    await settle();
    assert((await page.$('.zoom-popover')) !== null, 'reopened for the Shift+Tab check');
    await chord(['Shift'], 'Tab');
    await settle();
    assert(await closed('.zoom-popover'), 'Shift+Tab off the first item closed the menu');
    await page.keyboard.press('Tab');
    await settle();
    assert(
      await closed('.zoom-popover'),
      'the menu did not reopen on the next Tab — no trigger <-> first-item cycle',
    );

    step('an outside pointer click closes the zoom menu without stealing focus');
    await page.$eval(zoomTrigger, (el) => el.focus());
    await page.keyboard.press('ArrowDown');
    await settle();
    assert((await page.$('.zoom-popover')) !== null, 'reopened for the outside-click check');
    await outsideClick();
    await settle();
    assert(await closed('.zoom-popover'), 'the outside click closed the menu');
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

    // task 23 — each opens its own page/seed, independent of the state built
    // up above.
    await testExportButtonWidthFloor(browser, base, messages);
    await testPdfRealProgress(browser, base, messages);
    await testStageErrorRetryAndDismiss(browser, base, messages);
    await testDraftRestoreFailureNoOverlap(browser, base, messages);
    await testStageNoticeDraftPromptPriority(browser, base, messages);
    await testPopoverTabDuringExit(browser, base, messages);
    await testModalFastReopen(browser, base, messages);
    await testPdfExportInBackgroundTab(browser, base, messages);
    await testProgressBarColorScheme(browser, base, messages);
    await testMultiSelection(browser, base, messages);
    await testCutTool(browser, base, messages);
    await testCutSelectionRules(browser, base, messages);
    await testCutGroupFrame(browser, base, messages);
    await testCutMixedSelectionGrab(browser, base, messages);
    await testCutInPdfExport(browser, base, messages);
    await testCutDraftRestore(browser, base, messages);
    await testBeautifyLooks(browser, base, messages);
    await testCropHandlesAndUndo(browser, base, messages);
    await testCaptureHistoryShelf(browser, base, messages);
    await testPinToFloatingWindow(browser, base, messages);
    await testBlurStrength(browser, base, messages);
    await testAnnotationClipMatchesExport(browser, base, messages);
    await testStrokeWidthPreviewDistinct(browser, base, messages);

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
