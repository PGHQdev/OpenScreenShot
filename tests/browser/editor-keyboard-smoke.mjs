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
 * task 23 — the export dialog's own Export button cycles Export / Exporting…
 * and must not shift the modal-actions row when it does (the .btn-fixed
 * technique the topbar Copy button already uses, applied here as its own
 * class since "Exporting…" is wider than any of Copy's three words — see
 * .btn-fixed-export in editor.css). holdNextDownload freezes the export
 * mid-flight so the button's real geometry can be measured in both states,
 * and the class is stripped live afterward as a negative control: proving
 * the same DOM, same label, same font *would* have shifted without it.
 */
async function testExportButtonWidthFloor(browser, base) {
  step('task 23: the export dialog Export button does not shift width when "Exporting…"');
  const { page } = await newSmokePage(browser);
  const crashes = [];
  page.on('pageerror', (err) => crashes.push(String(err)));
  await page.evaluateOnNewDocument(installChromeStub, {
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
async function testPdfRealProgress(browser, base) {
  step('task 23: multi-page PDF export reports real, increasing per-page progress');
  const { page } = await newSmokePage(browser);
  const crashes = [];
  page.on('pageerror', (err) => crashes.push(String(err)));
  await page.evaluateOnNewDocument(installChromeStub, {
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
async function testDraftRestoreFailureNoOverlap(browser, base) {
  step(
    'fix round 2: a failed draft restore never shows the stage notice pill while draft-restore is still exiting',
  );
  const { page } = await newSmokePage(browser);
  const crashes = [];
  page.on('pageerror', (err) => crashes.push(String(err)));
  const capture = await makeCapture();
  await page.evaluateOnNewDocument(installChromeStub, {
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
async function testStageNoticeDraftPromptPriority(browser, base) {
  step(
    'fix round 3: an import failure interrupts a pending draft prompt instead of queuing behind it',
  );
  const { page } = await newSmokePage(browser);
  const crashes = [];
  page.on('pageerror', (err) => crashes.push(String(err)));
  const capture = await makeCapture();
  await page.evaluateOnNewDocument(installChromeStub, {
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

async function testStageErrorRetryAndDismiss(browser, base) {
  step('task 23: stage error — Retry re-runs the real load; Dismiss clears the capture');
  const crashes = [];

  const { page } = await newSmokePage(browser);
  page.on('pageerror', (err) => crashes.push(String(err)));
  await page.evaluateOnNewDocument(installChromeStub, {
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
  await page2.evaluateOnNewDocument(installChromeStub, {
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
  await page3.evaluateOnNewDocument(installChromeStub, {
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
async function testPopoverTabDuringExit(browser, base) {
  step('task 23 fix: Tab pressed during a popover exit does not land inside it');
  // newSmokePage forces prefers-reduced-motion: no-preference by default —
  // load-bearing here specifically, since this test exists to probe a real,
  // non-collapsed exit window (see newSmokePage's own doc comment for why
  // that default exists at all).
  const { page } = await newSmokePage(browser);
  const crashes = [];
  page.on('pageerror', (err) => crashes.push(String(err)));
  await page.evaluateOnNewDocument(installChromeStub, {
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
async function testModalFastReopen(browser, base) {
  step('task 23 fix: a fast reopen before the exit timer fires still refocuses into the dialog');
  // newSmokePage forces prefers-reduced-motion: no-preference by default —
  // see testPopoverTabDuringExit's own comment: without it, this machine's
  // ambient setting would collapse the 150ms exit window this test means
  // to reopen inside of.
  const { page } = await newSmokePage(browser);
  const crashes = [];
  page.on('pageerror', (err) => crashes.push(String(err)));
  await page.evaluateOnNewDocument(installChromeStub, {
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
async function testPdfExportInBackgroundTab(browser, base) {
  step('task 23 fix: a multi-page PDF export still completes while its tab is backgrounded');
  const { page } = await newSmokePage(browser);
  const crashes = [];
  page.on('pageerror', (err) => crashes.push(String(err)));
  await page.evaluateOnNewDocument(installChromeStub, {
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
async function testProgressBarColorScheme(browser, base) {
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
  await page.evaluateOnNewDocument(installChromeStub, {
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
  await page2.evaluateOnNewDocument(installChromeStub, {
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
async function testMultiSelection(browser, base) {
  step('task 24: multi-selection by keyboard, marquee and shift-click');
  const { page } = await newSmokePage(browser);
  const crashes = [];
  page.on('pageerror', (err) => crashes.push(String(err)));
  await page.evaluateOnNewDocument(installChromeStub, {
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
  async function chord(mods, key) {
    for (const m of mods) await page.keyboard.down(m);
    await page.keyboard.press(key);
    for (const m of mods.slice().reverse()) await page.keyboard.up(m);
  }
  // A layer's position, read the only way the page exposes it: select it, nudge
  // one pixel each way (a net-zero move), and take the coordinates the live
  // region reads out. `]` walks one layer up the paint order per call.
  const readNextLayer = async () => {
    await page.keyboard.press(']');
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
    ax3 === ax2 + 0 && bx3 === bx2,
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
  const drag = async (x1, y1, x2, y2) => {
    await page.mouse.move(x1, y1);
    await page.mouse.down();
    await page.mouse.move(x2, y2, { steps: 8 });
    await page.mouse.up();
    await settle(80);
  };
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

  step('task 24: a multi-selection draws an outline per layer and no handles at all');
  // Two readings off the live canvas, neither of them a raw colour count: the
  // marching ants land on fractional screen coordinates and anti-alias, so
  // "how many pure black pixels" answers a question about rounding rather than
  // about what was drawn.
  //   - `block`: is there a 5x5 patch of pure white anywhere? A handle is an
  //     8x8 white fill; a dash is 1px. Only handles can produce one.
  //   - `box`: the bounding box of every pixel that differs from the canvas
  //     with nothing selected. One outline bounds one layer; a second outline
  //     30 image px away widens it.
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
      let diff = 0;
      let block = false;
      let x0 = Infinity;
      let x1 = -Infinity;
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
          if (!block && pure(i) && x + 4 < width && y + 4 < height) {
            block = true;
            for (let yy = y; yy <= y + 4 && block; yy++) {
              for (let xx = x; xx <= x + 4 && block; xx++) {
                if (!pure((yy * width + xx) * 4)) block = false;
              }
            }
          }
        }
      }
      return { diff, block, width: x1 >= x0 ? x1 - x0 + 1 : 0 };
    });
  await focusCanvas();
  await page.keyboard.press('Escape');
  await settle(80);
  await baseline();
  const none = await chrome();
  assert(
    none.diff === 0 && !none.block,
    'nothing selected: no chrome on the canvas, and it matches its own baseline',
  );
  await page.keyboard.press(']');
  await settle(80);
  const one = await chrome();
  assert(
    one.diff > 200 && one.block,
    `a lone selection paints an outline and solid white handles (${one.diff} pixels changed, handle block found)`,
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
    !two.block,
    'and no handle block anywhere once a second layer joins — handles belong to a single selection, which is the only thing a drag can resize',
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

  assert(crashes.length === 0, `no page errors (${crashes.join(' | ') || 'none'})`);
  await page.close();
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
    const { page } = await newSmokePage(browser);
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
    await testExportButtonWidthFloor(browser, base);
    await testPdfRealProgress(browser, base);
    await testStageErrorRetryAndDismiss(browser, base);
    await testDraftRestoreFailureNoOverlap(browser, base);
    await testStageNoticeDraftPromptPriority(browser, base);
    await testPopoverTabDuringExit(browser, base);
    await testModalFastReopen(browser, base);
    await testPdfExportInBackgroundTab(browser, base);
    await testProgressBarColorScheme(browser, base);
    await testMultiSelection(browser, base);

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
