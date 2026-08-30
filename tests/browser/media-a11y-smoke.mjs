// Headless browser check for three media features: `forced-colors: active`,
// `prefers-contrast: more` and `prefers-reduced-motion: reduce`. Chrome can
// emulate all three via a raw CDP `Emulation.setEmulatedMedia` call
// (Puppeteer's own `page.emulateMediaFeatures` allowlists only
// prefers-color-scheme/prefers-reduced-motion/color-gamut and rejects the
// other two — see emulateMedia below), so this drives the real built CSS
// instead of reading source and guessing.
//
// What it actually asserts, not a snapshot of today's colours:
//   - forced-colors: the three colour-only states (active tool, selected
//     segment/format, selected swatch/zoom-block) render a *different*
//     appearance from their unselected sibling once colour is replaced by
//     the system palette, checked against a live `Highlight` reference
//     element rather than a hardcoded hex (the system palette is
//     implementation-defined). The swatch fills themselves stay their own
//     hex rather than flattening to a system colour. box-shadow is checked
//     to really go invisible under forced-colors in this browser (a plain
//     probe with no forced-color-adjust proves it, and .rec-tl-zoom's own
//     ring does too), then that .rec-tl-zoom's outline substitute paints —
//     .swatch turns out not to need one: forced-color-adjust: none (kept so
//     its fill survives) happens to keep its box-shadow ring painting too,
//     verified rather than assumed (task-17-report.md).
//   - prefers-contrast: --border is checked to still equal --text-2's
//     *computed* value in the light theme, the dark theme, and the
//     no-explicit-theme default — the compound-selector specificity the
//     override needs to win in all three is exactly the thing most likely
//     to silently fail.
//   - prefers-reduced-motion: every selector this task added to a reduce
//     block reports a zero transition-duration, and a real (non-zero) one
//     under an explicitly forced no-preference — editor.css's, recorder.css's
//     .link-btn, popup.css's six, and setup.css's .btn-primary/.btn-ghost
//     (task-21: setup.css's first reduced-motion block ever, added with no
//     smoke coverage until this one — see task-21-report.md).
//   - Baseline (no emulated feature) is captured first and re-checked last,
//     so a forced-colors or prefers-contrast rule that leaked into ordinary
//     rendering fails the same run.
//
// All four surfaces that carry these rules are opened: editor, recorder,
// popup and setup. Every selector the task's CSS diff touches has an
// assertion that fails if its rule is reverted (verified by reverting each
// one — see task-17-report.md's and task-21-report.md's negative-control
// sections), including the shared controls.css switch, which is checked on
// the editor and the recorder.
// Run with: npm run build && npm run smoke:media
import { createReadStream } from 'node:fs';
import { mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const DIST = join(ROOT, 'dist');
const CHROME =
  process.env.CHROME_BIN ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webm': 'video/webm',
  '.woff2': 'font/woff2',
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

/** Same resolution walk as the other browser smokes — puppeteer-core lives in mcp/. */
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

/** Minimal chrome stub — this script never exercises capture/record, only rendering. */
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
  const store = new Map(Object.entries(seed ?? {}));
  const area = () => ({
    async get(keys) {
      const out = keys && typeof keys === 'object' && !Array.isArray(keys) ? { ...keys } : {};
      const list =
        keys == null
          ? [...store.keys()]
          : typeof keys === 'string'
            ? [keys]
            : Array.isArray(keys)
              ? keys
              : Object.keys(keys);
      for (const key of list) if (store.has(key)) out[key] = store.get(key);
      return out;
    },
    async set(items) {
      for (const [k, v] of Object.entries(items)) store.set(k, v);
    },
    async remove(keys) {
      for (const key of Array.isArray(keys) ? keys : [keys]) store.delete(key);
    },
    async getBytesInUse(key) {
      return store.has(key) ? JSON.stringify(store.get(key)).length : 0;
    },
  });
  const noop = () => {};
  globalThis.chrome = {
    i18n: { getMessage },
    storage: {
      local: area(),
      session: area(),
      onChanged: { addListener: noop, removeListener: noop },
    },
    runtime: {
      id: 'smoke',
      getURL: (p) => '/' + String(p).replace(/^\//, ''),
      sendMessage: async () => ({}),
      onMessage: { addListener: noop, removeListener: noop },
    },
    action: { setBadgeText: noop, setBadgeBackgroundColor: noop },
    downloads: { download: async () => 1 },
    tabs: { create: async () => ({ id: 1 }), update: async () => ({}), query: async () => [] },
    windows: { update: async () => ({}) },
    commands: { getAll: async () => [] },
    permissions: {
      contains: async () => true,
      request: async () => true,
      remove: async () => true,
      onAdded: { addListener: noop, removeListener: noop },
      onRemoved: { addListener: noop, removeListener: noop },
    },
  };
}

/** A solid PNG at a known size, for the editor's seeded capture. */
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
    title: 'media-a11y smoke',
    capturedAt: Date.now(),
  };
}

/** Records a real short WebM and writes a one-segment session, per recorder-smoke.mjs. */
async function seedRecorderSession() {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 360;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#123a5e';
  ctx.fillRect(0, 0, 640, 360);
  const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
    ? 'video/webm;codecs=vp9'
    : 'video/webm';
  const recorder = new MediaRecorder(canvas.captureStream(30), { mimeType: mime });
  const blobs = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) blobs.push(e.data);
  };
  recorder.start(500);
  await new Promise((done) => {
    setTimeout(() => {
      recorder.onstop = done;
      recorder.stop();
    }, 3300);
  });
  const db = await new Promise((done, fail) => {
    const req = indexedDB.open('openscreenshot-recordings', 1);
    req.onsuccess = () => done(req.result);
    req.onerror = () => fail(req.error);
  });
  const sessionId = crypto.randomUUID();
  const segmentId = crypto.randomUUID();
  await new Promise((done, fail) => {
    const tx = db.transaction(['sessions', 'segments', 'chunks', 'events'], 'readwrite');
    tx.objectStore('sessions').put({
      id: sessionId,
      createdAt: Date.now(),
      status: 'complete',
      settings: { mic: false, tabAudio: false, webcam: false, ripple: true },
      segmentIds: [segmentId],
    });
    tx.objectStore('segments').put({
      id: segmentId,
      sessionId,
      index: 0,
      startedAt: Date.now(),
      duration: 3000,
      viewport: { w: 640, h: 360, dpr: 1 },
      // The rail's webcam-bubble controls (.rec-bubble-corner, one of the
      // selectors under test) only render when a segment has a webcam track
      // (Rail.tsx: segments.some(s => s.webcamUrl !== null)), so the fixture
      // carries one — the same blob replayed on the 'webcam' kind.
      hasWebcam: true,
    });
    const chunks = tx.objectStore('chunks');
    blobs.forEach((blob, seq) => chunks.put({ segmentId, kind: 'tab', seq, blob }));
    blobs.forEach((blob, seq) => chunks.put({ segmentId, kind: 'webcam', seq, blob }));
    tx.objectStore('events').put({ segmentId, seq: 0, events: [] });
    tx.oncomplete = () => done();
    tx.onerror = () => fail(tx.error);
    tx.onabort = () => fail(tx.error);
  });
  db.close();
  return sessionId;
}

async function newPage(browser, messages, seed) {
  const page = await browser.newPage();
  const crashes = [];
  page.on('pageerror', (err) => crashes.push(String(err)));
  page.on('console', (msg) => {
    if (msg.type() === 'error') console.log(`    console.error: ${msg.text()}`);
  });
  await page.evaluateOnNewDocument(installChromeStub, messages, seed);
  const cdp = await page.createCDPSession();
  return { page, cdp, crashes };
}

/**
 * Puppeteer's own `page.emulateMediaFeatures` hardcodes an allowlist
 * (`prefers-color-scheme`, `prefers-reduced-motion`, `color-gamut` only) and
 * rejects anything else client-side, so `forced-colors` and
 * `prefers-contrast` — both real CDP/Chrome media features — never reach the
 * browser through it. This sends the same underlying CDP command directly,
 * bypassing that allowlist. Pass `[]` to clear every emulated feature, same
 * as the high-level API.
 */
async function emulateMedia(cdp, features) {
  await cdp.send('Emulation.setEmulatedMedia', { features });
}

/**
 * The live computed value of a CSS system colour in this browser/run. The
 * forced-colors palette is implementation-defined, so every "resolves to
 * Highlight" check below compares against this rather than a hardcoded hex.
 * Must be called *while* forced-colors is emulated — the same keyword
 * resolves to a different value in ordinary rendering.
 */
async function systemColor(page, keyword) {
  return page.evaluate((name) => {
    const probe = document.createElement('div');
    probe.style.backgroundColor = name;
    probe.style.position = 'fixed';
    probe.style.opacity = '0';
    document.body.appendChild(probe);
    const value = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return value;
  }, keyword);
}

const highlightReference = (page) => systemColor(page, 'Highlight');

/** Computed style of a pseudo-element (::before / ::after), which querySelector cannot reach. */
async function computedOfPseudo(page, selector, pseudo, props) {
  return page.evaluate(
    (sel, pe, ps) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const cs = getComputedStyle(el, pe);
      const out = {};
      for (const p of ps) out[p] = cs[p];
      return out;
    },
    selector,
    pseudo,
    props,
  );
}

/**
 * transition-duration is a comma list, one entry per transitioned property;
 * `transition: none` collapses every entry to 0s.
 */
const allZero = (duration) => /^0s(,\s*0s)*$/.test(duration);

async function computedOf(page, selector, props) {
  return page.evaluate(
    (sel, ps) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const cs = getComputedStyle(el);
      const out = {};
      for (const p of ps) out[p] = cs[p];
      return out;
    },
    selector,
    props,
  );
}

async function rootVar(page, name) {
  return page.evaluate(
    (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim(),
    name,
  );
}

/**
 * Average RGB of a small screenshot region. getComputedStyle(el, pseudo)
 * does not reach ::-webkit-slider-thumb/::-webkit-slider-runnable-track in
 * this Chromium (verified: it silently returns the host element's own
 * style instead of the pseudo's) — a real rendered pixel is the only way to
 * check what colour a slider's thumb and track actually paint.
 */
async function pixelAt(page, x, y) {
  const sharp = createRequire(join(ROOT, 'package.json'))('sharp');
  const buf = await page.screenshot({ clip: { x: x - 1, y: y - 1, width: 3, height: 3 } });
  const { data, info } = await sharp(buf).raw().toBuffer({ resolveWithObject: true });
  let r = 0,
    g = 0,
    b = 0;
  const n = info.width * info.height;
  for (let i = 0; i < data.length; i += info.channels) {
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
  }
  return [Math.round(r / n), Math.round(g / n), Math.round(b / n)];
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

function closeRGB(a, b, tol = 30) {
  return (
    !!a &&
    !!b &&
    Math.abs(a[0] - b[0]) <= tol &&
    Math.abs(a[1] - b[1]) <= tol &&
    Math.abs(a[2] - b[2]) <= tol
  );
}

// ---------------------------------------------------------------- editor ---
async function testEditor(browser, base, messages) {
  step('EDITOR — opening with a seeded capture, Rectangle tool selected');
  const { page, cdp, crashes } = await newPage(browser, messages, {
    'openscreenshot:last-capture': await makeCapture(),
  });
  await page.setViewport({ width: 1280, height: 860 });
  await page.goto(`${base}/src/editor/index.html`, { waitUntil: 'networkidle0' });
  await page.waitForSelector('.stage-canvas');
  await new Promise((r) => setTimeout(r, 900));
  await page.click('.tool-btn[title^="Rectangle"]');
  await page.waitForSelector('.stylebar');
  // A real swatch selection, not just the default, so [aria-pressed='true'] has a target.
  await page.click('.swatch[aria-label="Orange"]');
  // Chrome's forced-colors mode force-injects a visible outline on whatever
  // is :focus-visible, overriding even an author `outline: none` (a WCAG
  // 2.4.7 safety net) — and page.click() leaves this element focus-visible
  // in this browser (the same heuristic gotcha task-15-report.md hit).
  // Blurred here so the pressed/selected checks below measure that state on
  // its own, not entangled with an unrelated focus outline.
  await page.evaluate(() => document.activeElement?.blur());

  step('EDITOR — baseline (no emulated feature): the forced-colors CSS has not leaked in');
  const baseActive = await computedOf(page, '.tool-btn.is-active', ['backgroundColor']);
  const baseSwatchPressed = await computedOf(page, '.swatch[aria-pressed="true"]', [
    'boxShadow',
    'outlineStyle',
  ]);
  assert(
    baseActive.backgroundColor !== 'rgba(0, 0, 0, 0)',
    'active tool has a background at baseline',
  );
  assert(
    baseSwatchPressed.boxShadow !== 'none',
    'selected swatch still shows its box-shadow moat at baseline',
  );
  assert(
    baseSwatchPressed.outlineStyle === 'none',
    'selected swatch has no outline at baseline (forced-colors outline is not leaking)',
  );
  const baseBorder = await rootVar(page, '--border');
  const baseEyedropper = await computedOf(page, '.swatch-screen', ['backgroundColor']);

  step(
    'EDITOR — the range slider: styled track and thumb in the coral tokens, no Chrome default blue',
  );
  // The fontSize field is the style bar's only slider (stylebar.ts) — Text
  // switches it in. Restored to Rectangle at the end so the rest of this
  // function sees the tool state it expects.
  await page.click('.tool-btn[title^="Text"]');
  await page.waitForSelector('.stylebar-range');
  await page.evaluate(() => {
    const el = document.querySelector('.stylebar-range');
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    setter.call(el, el.min);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await new Promise((r) => setTimeout(r, 60));
  const rangeBox = await page.evaluate(() =>
    document.querySelector('.stylebar-range').getBoundingClientRect().toJSON(),
  );
  // Pinned to min, so the thumb sits at the track's left edge — sampled 8px
  // in (half its 16px width); the track sample is the opposite end, far
  // enough from the thumb's own radius to be plain track.
  const thumbPoint = {
    x: Math.round(rangeBox.left + 8),
    y: Math.round(rangeBox.top + rangeBox.height / 2),
  };
  const trackPoint = { x: Math.round(rangeBox.right - 4), y: thumbPoint.y };
  const accentHex = await rootVar(page, '--accent');
  const surface3Hex = await rootVar(page, '--surface-3');
  const thumbPixel = await pixelAt(page, thumbPoint.x, thumbPoint.y);
  const trackPixel = await pixelAt(page, trackPoint.x, trackPoint.y);
  assert(
    closeRGB(thumbPixel, hexToRGB(accentHex)),
    `slider thumb pixel (${thumbPixel}) renders --accent (${accentHex}), not Chrome's default blue thumb`,
  );
  assert(
    closeRGB(trackPixel, hexToRGB(surface3Hex)),
    `slider track pixel (${trackPixel}) renders --surface-3 (${surface3Hex})`,
  );
  // .range { width: 100% } and .stylebar-range { width: 140px } are an equal-
  // specificity cascade tie; .range being declared *after* .stylebar-range in
  // source used to win it, squeezing this slider to whatever its flex row
  // left over (measured 129px) instead of the 140px .stylebar-range asks
  // for. Fixed by compounding the selector to .range.stylebar-range (0,2,0
  // beats 0,1,0 regardless of source order) — pinned here so a future edit
  // reordering the two rules cannot silently reintroduce the squeeze.
  assert(
    rangeBox.width === 140,
    `.stylebar-range is 140px wide (${rangeBox.width}), not squeezed by the .range/.stylebar-range cascade tie`,
  );

  step(
    'EDITOR — forced-colors: active — the range slider keeps its thumb visible against its track',
  );
  await emulateMedia(cdp, [{ name: 'forced-colors', value: 'active' }]);
  await new Promise((r) => setTimeout(r, 60));
  const thumbPixelFC = await pixelAt(page, thumbPoint.x, thumbPoint.y);
  const trackPixelFC = await pixelAt(page, trackPoint.x, trackPoint.y);
  // Verified live (task-21-report.md): Chromium repaints input[type='range']'s
  // UA-shadow track/thumb under forced-colors on its own, even styled with
  // appearance: none — unlike input[type='checkbox'] (.switch), where Task
  // 17 had to supply the Highlight/ButtonFace split by hand. An author
  // background-color on ::-webkit-slider-thumb/::-webkit-slider-runnable-track
  // is inert here (confirmed by removing it and re-running — no change), so
  // this checks the property the trap actually cares about — the thumb
  // never flattens into its track — rather than asserting a specific
  // colour this file's own CSS does not control.
  assert(
    !closeRGB(thumbPixelFC, trackPixelFC, 10),
    `the thumb (${thumbPixelFC}) stays visually distinct from its track (${trackPixelFC}) under forced-colors`,
  );
  await emulateMedia(cdp, []);
  await page.click('.tool-btn[title^="Rectangle"]');
  await page.waitForSelector('.stylebar');

  step('EDITOR — forced-colors: active — box-shadow really is dropped, generally, in this browser');
  await emulateMedia(cdp, [{ name: 'forced-colors', value: 'active' }]);
  // A plain probe (no forced-color-adjust) proves the browser really does
  // strip box-shadow under forced-colors in this environment — the trap
  // this task's brief calls out — before checking why .swatch is exempt.
  const probeShadow = await page.evaluate(() => {
    const probe = document.createElement('div');
    probe.style.boxShadow = '0 0 0 4px blue';
    probe.style.position = 'fixed';
    probe.style.opacity = '0';
    document.body.appendChild(probe);
    const value = getComputedStyle(probe).boxShadow;
    probe.remove();
    return value;
  });
  assert(
    probeShadow === 'none',
    'an ordinary element with no forced-color-adjust drops box-shadow',
  );

  step(
    'EDITOR — forced-colors: active — the selected swatch keeps its ring anyway (forced-color-adjust: none)',
  );
  const fcSwatchPressed = await computedOf(page, '.swatch[aria-pressed="true"]', [
    'boxShadow',
    'outlineStyle',
  ]);
  const fcSwatchIdle = await computedOf(page, '.swatch[aria-pressed="false"]', [
    'boxShadow',
    'outlineStyle',
  ]);
  assert(
    fcSwatchPressed.boxShadow !== 'none',
    'forced-color-adjust: none (kept for the fill) opts the whole swatch out, box-shadow included, so the ring still paints — this is the authored fix',
  );
  assert(
    fcSwatchIdle.boxShadow === 'none',
    'an unpressed sibling still has no ring — the selected swatch stays distinguishable under forced-colors',
  );

  step('EDITOR — forced-colors: active — active tool distinguishable from its unselected sibling');
  const highlight = await highlightReference(page);
  const activeTool = await computedOf(page, '.tool-btn.is-active', ['backgroundColor', 'color']);
  const idleTool = await computedOf(page, '.tool-btn:not(.is-active)', ['backgroundColor']);
  assert(
    activeTool.backgroundColor === highlight,
    `active tool background (${activeTool.backgroundColor}) resolves to the system Highlight colour`,
  );
  assert(
    idleTool.backgroundColor !== highlight,
    `idle tool background (${idleTool.backgroundColor}) does not — the two are distinguishable`,
  );

  step('EDITOR — forced-colors: active — selected stroke width, and its inner .width-bar');
  const highlightText = await systemColor(page, 'HighlightText');
  const pressedWidth = await computedOf(page, ".width-btn[aria-pressed='true']", [
    'backgroundColor',
  ]);
  const idleWidth = await computedOf(page, ".width-btn[aria-pressed='false']", ['backgroundColor']);
  assert(
    pressedWidth.backgroundColor === highlight,
    'the selected stroke-width button resolves to Highlight',
  );
  assert(
    idleWidth.backgroundColor !== highlight,
    `an unselected width button does not (${idleWidth.backgroundColor}) — the two are distinguishable`,
  );
  // .width-bar paints via background, not the inherited color property, so
  // the button's Highlight fill never reaches it. What is checked here is the
  // requirement — the bar stays visible against the Highlight track — not the
  // authored HighlightText value: measured in this Chrome, an un-overridden
  // background maps to Canvas, and Canvas equals HighlightText in both its
  // light (white) and dark (black) forced-colors palettes, so no computed
  // value can tell the override apart from its fallback here. The override
  // stays because Canvas/Highlight contrast is a coincidence of this palette
  // while HighlightText/Highlight is a guarantee; see task-17-report.md.
  const pressedBar = await computedOf(page, ".width-btn[aria-pressed='true'] .width-bar", [
    'backgroundColor',
  ]);
  assert(
    pressedBar.backgroundColor !== highlight,
    `the selected button's .width-bar (${pressedBar.backgroundColor}) still contrasts with its Highlight track, so the width is readable`,
  );

  step('EDITOR — forced-colors: active — a keyboard-focused swatch keeps its focus ring');
  // :focus-visible's ring is a box-shadow moat too, and forced-colors drops
  // box-shadow — .swatch's forced-color-adjust: none is what keeps it. The
  // style bar is a roving-tabindex toolbar (focus.ts), so Tab is one stop for
  // the whole group and ArrowRight is what walks it; driving the real arrow
  // keys is also what makes :focus-visible match, which a bare .focus() does
  // not. An unpressed swatch is the target, so this measures the focus ring
  // on its own rather than [aria-pressed='true']'s.
  await page.evaluate(() => {
    document.querySelector('.stylebar [tabindex="0"]')?.focus();
  });
  let focused = null;
  for (let i = 0; i < 40; i += 1) {
    await page.keyboard.press('ArrowRight');
    focused = await page.evaluate(() => {
      const el = document.activeElement;
      if (
        !el?.classList?.contains('swatch') ||
        el.classList.contains('swatch-custom') ||
        el.classList.contains('swatch-screen') ||
        el.getAttribute('aria-pressed') === 'true'
      ) {
        return null;
      }
      return {
        label: el.getAttribute('aria-label'),
        focusVisible: el.matches(':focus-visible'),
        boxShadow: getComputedStyle(el).boxShadow,
      };
    });
    if (focused) break;
  }
  assert(
    focused !== null && focused.focusVisible,
    `ArrowRight walked the style bar onto an unpressed swatch (${focused?.label}) and it matches :focus-visible`,
  );
  assert(
    focused.boxShadow !== 'none',
    'that focus ring still paints under forced-colors (the same forced-color-adjust: none that keeps the fill)',
  );
  await page.evaluate(() => document.activeElement?.blur());

  step('EDITOR — populating 5 recent colours, so all 13 swatches (8 preset + 5 recent) exist');
  await emulateMedia(cdp, []); // ordinary rendering while driving the custom-colour input
  for (const hex of ['#123456', '#654321', '#abcdef', '#fedcba', '#0f0f0f']) {
    await page.evaluate((h) => {
      const input = document.querySelector(".swatch-custom input[type='color']");
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      setter.call(input, h);
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }, hex);
  }
  await page.waitForFunction(
    () => document.querySelectorAll('.swatches .swatch').length >= 15, // 8 preset + 5 recent + custom
  );

  step('EDITOR — forced-colors: active — all 13 swatches keep their own fill');
  await emulateMedia(cdp, [{ name: 'forced-colors', value: 'active' }]);
  const swatchFills = await page.evaluate(() => {
    const els = [...document.querySelectorAll('.swatches .swatch')].filter(
      (el) => !el.classList.contains('swatch-custom') && !el.classList.contains('swatch-screen'),
    );
    return els.map((el) => ({
      inline: el.style.backgroundColor,
      computed: getComputedStyle(el).backgroundColor,
    }));
  });
  assert(
    swatchFills.length >= 13,
    `found ${swatchFills.length} plain colour swatches (need >= 13)`,
  );
  const flattened = swatchFills.filter((s) => s.computed !== s.inline);
  assert(
    flattened.length === 0,
    `every swatch's computed fill still matches its own inline colour under forced-colors (forced-color-adjust: none); ${flattened.length} flattened`,
  );
  // The opt-back-in is only proved by the eyedropper's own fill *changing*:
  // with forced-color-adjust: auto its --surface-2 background is replaced by
  // a system colour, whereas inheriting .swatch's `none` would leave it
  // exactly as authored — which is what a comparison against Highlight alone
  // would have failed to catch.
  const eyedropper = await computedOf(page, '.swatch-screen', ['backgroundColor']);
  assert(
    eyedropper.backgroundColor !== baseEyedropper.backgroundColor,
    `the eyedropper (not a colour choice) opts back in: its fill moved from its authored ${baseEyedropper.backgroundColor} to the system ${eyedropper.backgroundColor}, unlike the swatches beside it`,
  );

  step('EDITOR — forced-colors: active — selected format card in the export modal');
  await emulateMedia(cdp, []); // clear, so the modal opens under ordinary rendering first
  await page.keyboard.down('Meta');
  await page.keyboard.press('s');
  await page.keyboard.up('Meta');
  await page.waitForSelector('.modal', { timeout: 5000 });
  await emulateMedia(cdp, [{ name: 'forced-colors', value: 'active' }]);
  const selectedFormat = await computedOf(page, '.format-card.is-selected', ['backgroundColor']);
  const idleFormat = await computedOf(page, '.format-card:not(.is-selected)', ['backgroundColor']);
  assert(
    selectedFormat.backgroundColor === highlight,
    'the selected export format resolves to Highlight',
  );
  assert(
    idleFormat.backgroundColor !== highlight,
    'an unselected format card does not — the two are distinguishable',
  );
  // .format-hint sets its own colour rather than inheriting the card's, so
  // without its own override it keeps painting --text-2 on the Highlight
  // fill above.
  const selectedHint = await computedOf(page, '.format-card.is-selected .format-hint', ['color']);
  assert(
    selectedHint.color === highlightText,
    `the selected card's .format-hint resolves to HighlightText (${selectedHint.color}), so it stays legible on the Highlight fill`,
  );

  step('EDITOR — forced-colors: active — selected output-width segment in the same modal');
  const selectedSegment = await computedOf(page, '.segmented-btn.is-selected', ['backgroundColor']);
  const idleSegment = await computedOf(page, '.segmented-btn:not(.is-selected)', [
    'backgroundColor',
  ]);
  assert(
    selectedSegment.backgroundColor === highlight,
    'the selected .segmented-btn resolves to Highlight',
  );
  assert(
    idleSegment.backgroundColor !== highlight,
    `an unselected segment does not (${idleSegment.backgroundColor}) — the two are distinguishable`,
  );
  await emulateMedia(cdp, []);
  // The dialog's Escape handler is on .modal itself, and focus is still on
  // the style bar here, so the backdrop's own onMouseDown is what closes it.
  await page.mouse.click(4, 4);
  await page.waitForFunction(() => !document.querySelector('.modal'));

  step('EDITOR — forced-colors: active — the Beautify toggle once it is on');
  // .btn-secondary.is-active is the only "this is on" state in the header,
  // and it is carried entirely by colour in ordinary rendering.
  await page.click('.beautify-menu .btn-secondary');
  await page.waitForSelector('.beautify-popover');
  await page.click('.beautify-toggle .switch');
  await page.waitForSelector('.beautify-menu .btn-secondary.is-active');
  await emulateMedia(cdp, [{ name: 'forced-colors', value: 'active' }]);
  const beautifyOn = await computedOf(page, '.beautify-menu .btn-secondary.is-active', [
    'backgroundColor',
  ]);
  const beautifyOff = await computedOf(page, 'header .btn-secondary:not(.is-active)', [
    'backgroundColor',
  ]);
  assert(
    beautifyOn.backgroundColor === highlight,
    'the active Beautify toggle resolves to Highlight',
  );
  assert(
    beautifyOff.backgroundColor !== highlight,
    `an ordinary secondary button does not (${beautifyOff.backgroundColor}) — on and off stay distinguishable`,
  );

  step('EDITOR — forced-colors: active — the chosen Beautify look');
  // The look row's chosen state is colour-only too (--accent-subtle fill,
  // --accent border), and forced colors maps author colours by element role,
  // not by hue — six sibling buttons would otherwise flatten to one face.
  const lookOn = await computedOf(page, ".look-btn[aria-pressed='true']", ['backgroundColor']);
  const lookOff = await computedOf(page, ".look-btn[aria-pressed='false']", ['backgroundColor']);
  assert(lookOn.backgroundColor === highlight, 'the chosen look resolves to Highlight');
  assert(
    lookOff.backgroundColor !== highlight,
    `an unchosen look does not (${lookOff.backgroundColor}) — the row still says which one is on`,
  );

  step('EDITOR — forced-colors: active — the shared .switch inside the Beautify popover');
  const switchOn = await computedOf(page, '.beautify-toggle .switch', ['backgroundColor']);
  const switchKnobOn = await computedOfPseudo(page, '.beautify-toggle .switch', '::before', [
    'backgroundColor',
  ]);
  assert(
    switchOn.backgroundColor === highlight,
    'a checked shared switch (controls.css) resolves to Highlight',
  );
  assert(
    switchKnobOn.backgroundColor !== switchOn.backgroundColor,
    `its knob (${switchKnobOn.backgroundColor}) differs from the track (${switchOn.backgroundColor}), so it survives the dropped box-shadow`,
  );
  await emulateMedia(cdp, []);
  await page.click('.beautify-toggle .switch'); // back off
  await page.click('.beautify-menu .btn-secondary'); // close the popover
  await page.waitForFunction(() => !document.querySelector('.beautify-popover'));

  step('EDITOR — prefers-contrast: more — --border tracks --text-2 in light, dark and default');
  // --text-2's *un-raised* value in each theme, read with prefers-contrast
  // off — it also raises --text-2 itself (to --text-1), so reading it back
  // while the override is live would just compare --border against its own
  // already-raised sibling, not the original --text-2 --border-strong is
  // meant to track (the identical var()-resolution-order trap tokens.css's
  // --border-strong doc comment explains, sidestepped in the CSS itself by
  // holding a literal instead of a live reference). "Default" (no explicit
  // data-theme) is not assumed to be light — this headless Chrome's OS
  // default is dark — so it is checked for self-consistency with whatever
  // --text-2 resolves to in that same condition, not against a guessed value.
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
  const lightText2 = await rootVar(page, '--text-2');
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  const darkText2 = await rootVar(page, '--text-2');
  await page.evaluate(() => document.documentElement.removeAttribute('data-theme'));
  const defaultText2 = await rootVar(page, '--text-2');

  await emulateMedia(cdp, [{ name: 'prefers-contrast', value: 'more' }]);
  const contrastBorderDefault = await rootVar(page, '--border');
  assert(
    contrastBorderDefault === defaultText2 && contrastBorderDefault !== baseBorder,
    `--border under prefers-contrast: more with no explicit data-theme (${contrastBorderDefault}) equals --text-2 in that same condition (${defaultText2}), raised from the baseline (${baseBorder})`,
  );
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
  const contrastBorderLight = await rootVar(page, '--border');
  assert(
    contrastBorderLight === lightText2,
    `--border under prefers-contrast: more with data-theme="light" (${contrastBorderLight}) equals light --text-2's original value (${lightText2})`,
  );
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  const contrastBorderDark = await rootVar(page, '--border');
  assert(
    contrastBorderDark === darkText2,
    `--border under prefers-contrast: more with data-theme="dark" (${contrastBorderDark}) equals dark --text-2's original value (${darkText2}) — the [data-theme='dark'] specificity tie is won correctly`,
  );
  await page.evaluate(() => document.documentElement.removeAttribute('data-theme'));
  await emulateMedia(cdp, []);
  const afterBorder = await rootVar(page, '--border');
  assert(
    afterBorder === baseBorder,
    'clearing prefers-contrast restores the original --border — the override does not stick',
  );

  step('EDITOR — prefers-reduced-motion: reduce — previously-uncovered colour transitions');
  // This machine's real OS "Reduce Motion" accessibility setting is on, so
  // Chrome reports prefers-reduced-motion: reduce even with nothing
  // emulated (emulateMedia(cdp, []) reverts to *ambient*, not a guaranteed
  // "no preference" — a real gotcha for a portable smoke). no-preference is
  // forced explicitly for the "baseline" side of this check so it holds on
  // any machine, reduced-motion setting or not.
  await emulateMedia(cdp, [{ name: 'prefers-reduced-motion', value: 'no-preference' }]);
  // .width-btn is a style-bar control (Rectangle's Stroke group, already on
  // screen) — the one this task's own trap calls out as the surface a
  // pressed-state transform must not leave animating under reduced motion.
  const baseWidthTransition = await computedOf(page, '.width-btn', ['transitionDuration']);
  assert(
    baseWidthTransition.transitionDuration !== '0s',
    `.width-btn has a real transition under prefers-reduced-motion: no-preference (${baseWidthTransition.transitionDuration})`,
  );
  // The header button, not ⌘S: the editor's shortcut listener is scoped away
  // from a focused control, and focus is still in the header after the
  // Beautify step above.
  await page.click('header .btn-secondary[title^="Export"]');
  await page.waitForSelector('.modal', { timeout: 5000 });
  // waitForSelector resolves on insertion, before two things settle: the
  // modal's own mount effect that moves focus onto its first control lands a
  // render later (Preact flushes effects a frame after the commit — see
  // editor-keyboard-smoke.mjs's own header comment), and its entrance
  // `animation` is still mid-flight — a *running* CSS animation keeps the
  // duration it started with in computedOf's own reading even after
  // emulateMedia flips the reduced-motion rule live (Chromium does not
  // retroactively reduce an in-flight animation's reported duration; the
  // rule is real, this call just can't observe it until the animation that
  // was already playing finishes). 220ms clears the 150ms entrance
  // (--dur-mid) with margin, and gives focus a render to land. Without the
  // first half, the Escape pressed below would reach whatever still had
  // focus outside the modal instead of the modal's own onKeyDown.
  await new Promise((r) => setTimeout(r, 220));
  const baseToolTransition = await computedOf(page, '.tool-btn', ['transitionDuration']);
  const baseFormatTransition = await computedOf(page, '.format-card', ['transitionDuration']);
  assert(
    baseToolTransition.transitionDuration !== '0s',
    `.tool-btn has a real transition under prefers-reduced-motion: no-preference (${baseToolTransition.transitionDuration})`,
  );
  assert(
    baseFormatTransition.transitionDuration !== '0s',
    `.format-card has a real transition under prefers-reduced-motion: no-preference (${baseFormatTransition.transitionDuration})`,
  );
  // task 23: the modal's own entrance animation + exit transition (the same
  // pair every surface built on transition.ts's useExitDelay carries).
  const baseModal = await computedOf(page, '.modal', ['animationDuration', 'transitionDuration']);
  const baseBackdrop = await computedOf(page, '.modal-backdrop', [
    'animationDuration',
    'transitionDuration',
  ]);
  assert(
    baseModal.animationDuration !== '0s',
    `.modal has a real entrance animation under prefers-reduced-motion: no-preference (${baseModal.animationDuration})`,
  );
  assert(
    baseModal.transitionDuration !== '0s',
    `.modal has a real exit transition under prefers-reduced-motion: no-preference (${baseModal.transitionDuration})`,
  );
  assert(
    baseBackdrop.animationDuration !== '0s',
    `.modal-backdrop has a real entrance animation under prefers-reduced-motion: no-preference (${baseBackdrop.animationDuration})`,
  );
  await emulateMedia(cdp, [{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  const reducedWidth = await computedOf(page, '.width-btn', ['transitionDuration']);
  const reducedTool = await computedOf(page, '.tool-btn', ['transitionDuration']);
  const reducedFormat = await computedOf(page, '.format-card', ['transitionDuration']);
  assert(
    allZero(reducedWidth.transitionDuration),
    `.width-btn transition-duration is ${reducedWidth.transitionDuration} under prefers-reduced-motion: reduce`,
  );
  assert(
    allZero(reducedTool.transitionDuration),
    `.tool-btn transition-duration is ${reducedTool.transitionDuration} under prefers-reduced-motion: reduce`,
  );
  assert(
    allZero(reducedFormat.transitionDuration),
    `.format-card transition-duration is ${reducedFormat.transitionDuration} under prefers-reduced-motion: reduce`,
  );
  const reducedModal = await computedOf(page, '.modal', [
    'animationDuration',
    'transitionDuration',
  ]);
  const reducedBackdrop = await computedOf(page, '.modal-backdrop', [
    'animationDuration',
    'transitionDuration',
  ]);
  assert(
    allZero(reducedModal.animationDuration) && allZero(reducedModal.transitionDuration),
    `.modal animation/transition durations are ${reducedModal.animationDuration}/${reducedModal.transitionDuration} under prefers-reduced-motion: reduce`,
  );
  assert(
    allZero(reducedBackdrop.animationDuration) && allZero(reducedBackdrop.transitionDuration),
    `.modal-backdrop animation/transition durations are ${reducedBackdrop.animationDuration}/${reducedBackdrop.transitionDuration} under prefers-reduced-motion: reduce`,
  );
  await page.keyboard.press('Escape');
  // Still under reduce here, so useExitDelay's own reduced-motion check
  // collapses its unmount wait to ~0ms (see transition.ts) — this is that
  // hang-avoidance actually exercised, not just asserted about.
  await page.waitForFunction(() => !document.querySelector('.modal'), { timeout: 2000 });

  step('EDITOR — prefers-reduced-motion: reduce — zoom-popover and beautify-popover');
  await emulateMedia(cdp, [{ name: 'prefers-reduced-motion', value: 'no-preference' }]);
  await page.click('.zoom-trigger');
  await page.waitForSelector('.zoom-popover', { timeout: 5000 });
  await new Promise((r) => setTimeout(r, 220)); // see the modal step above
  const baseZoom = await computedOf(page, '.zoom-popover', [
    'animationDuration',
    'transitionDuration',
  ]);
  assert(
    baseZoom.animationDuration !== '0s' && baseZoom.transitionDuration !== '0s',
    `.zoom-popover has a real animation/transition under prefers-reduced-motion: no-preference (${baseZoom.animationDuration}/${baseZoom.transitionDuration})`,
  );
  await emulateMedia(cdp, [{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  const reducedZoom = await computedOf(page, '.zoom-popover', [
    'animationDuration',
    'transitionDuration',
  ]);
  assert(
    allZero(reducedZoom.animationDuration) && allZero(reducedZoom.transitionDuration),
    `.zoom-popover animation/transition durations are ${reducedZoom.animationDuration}/${reducedZoom.transitionDuration} under prefers-reduced-motion: reduce`,
  );
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !document.querySelector('.zoom-popover'), { timeout: 2000 });

  await emulateMedia(cdp, [{ name: 'prefers-reduced-motion', value: 'no-preference' }]);
  await page.click('.beautify-menu > .btn-secondary');
  await page.waitForSelector('.beautify-popover', { timeout: 5000 });
  await new Promise((r) => setTimeout(r, 220)); // see the modal step above
  const baseBeautify = await computedOf(page, '.beautify-popover', [
    'animationDuration',
    'transitionDuration',
  ]);
  assert(
    baseBeautify.animationDuration !== '0s' && baseBeautify.transitionDuration !== '0s',
    `.beautify-popover has a real animation/transition under prefers-reduced-motion: no-preference (${baseBeautify.animationDuration}/${baseBeautify.transitionDuration})`,
  );
  await emulateMedia(cdp, [{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  const reducedBeautify = await computedOf(page, '.beautify-popover', [
    'animationDuration',
    'transitionDuration',
  ]);
  assert(
    allZero(reducedBeautify.animationDuration) && allZero(reducedBeautify.transitionDuration),
    `.beautify-popover animation/transition durations are ${reducedBeautify.animationDuration}/${reducedBeautify.transitionDuration} under prefers-reduced-motion: reduce`,
  );
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !document.querySelector('.beautify-popover'), {
    timeout: 2000,
  });

  step('EDITOR — prefers-reduced-motion: reduce — entrance-only .text-overlay');
  await emulateMedia(cdp, [{ name: 'prefers-reduced-motion', value: 'no-preference' }]);
  await page.click('.stage-canvas');
  await page.keyboard.press('t');
  await page.keyboard.press('Enter');
  await page.waitForSelector('textarea.text-overlay', { timeout: 5000 });
  await new Promise((r) => setTimeout(r, 220)); // see the modal step above
  const baseText = await computedOf(page, '.text-overlay', ['animationDuration']);
  assert(
    baseText.animationDuration !== '0s',
    `.text-overlay has a real entrance animation under prefers-reduced-motion: no-preference (${baseText.animationDuration})`,
  );
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !document.querySelector('textarea.text-overlay'), {
    timeout: 5000,
  });
  await page.click('.stage-canvas');
  await page.keyboard.press('t');
  await page.keyboard.press('Enter');
  await page.waitForSelector('textarea.text-overlay', { timeout: 5000 });
  await new Promise((r) => setTimeout(r, 220)); // see the modal step above
  await emulateMedia(cdp, [{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  const reducedText = await computedOf(page, '.text-overlay', ['animationDuration']);
  assert(
    allZero(reducedText.animationDuration),
    `.text-overlay animation-duration is ${reducedText.animationDuration} under prefers-reduced-motion: reduce`,
  );
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !document.querySelector('textarea.text-overlay'), {
    timeout: 5000,
  });
  await page.keyboard.press('v'); // back to Select, so later steps don't inherit the Text tool
  await emulateMedia(cdp, []);

  assert(crashes.length === 0, `no uncaught page errors ${crashes.join('; ')}`);
  await page.close();
}

// --------------------------------------------------------------- recorder ---
async function testRecorder(browser, base, messages) {
  step('RECORDER — seeding a fixture session and selecting a zoom block');
  const { page, cdp, crashes } = await newPage(browser, messages, {});
  await page.setViewport({ width: 1280, height: 860 });
  await page.goto(`${base}/src/recorder/index.html`, { waitUntil: 'load' });
  await page.waitForSelector('.rec-empty', { timeout: 15_000 });
  const sessionId = await page.evaluate(seedRecorderSession);
  await page.goto(`${base}/src/recorder/index.html?session=${sessionId}`, { waitUntil: 'load' });
  await page.waitForSelector('.rail', { timeout: 15_000 });

  step('RECORDER — adding and selecting a zoom block (timeline toolbar "Add Zoom")');
  // addBlockAtPlayhead (useRecorderSession.ts) needs total segment duration
  // >= 2*EASE_MS (1200ms) or it silently returns null — the fixture's
  // segment.duration is set well above that for exactly this reason.
  // Add Zoom lives in Timeline.tsx's own toolbar, not inside Rail.tsx's
  // <aside class="rail"> — a sibling, not an ancestor — since rail
  // simplification moved it there.
  await page.click('.rec-tl-toolbar .btn-secondary');
  await page.waitForSelector(".rec-tl-zoom[data-selected='true']");
  await page.waitForSelector('.rec-zoom-tools .rec-seg-btn');

  step('RECORDER — baseline: the selected-zoom-block ring is a box-shadow, no outline');
  const baseZoom = await computedOf(page, ".rec-tl-zoom[data-selected='true']", [
    'boxShadow',
    'outlineStyle',
  ]);
  assert(
    baseZoom.boxShadow !== 'none',
    'selected zoom block shows its box-shadow moat at baseline',
  );
  assert(
    baseZoom.outlineStyle === 'none',
    'no outline at baseline (forced-colors outline not leaking)',
  );

  step(
    'RECORDER — the bubble-size slider: styled track and thumb in the coral tokens, no Chrome default blue',
  );
  // The rail always renders the beautify padding/corners/shadow sliders too,
  // but frame.enabled defaults to false (recorder-draft.ts), which disables
  // those three — the webcam-bubble-size slider is the only enabled .range
  // at this point, and this fixture always seeds a webcam segment (above),
  // so it is always present.
  await page.waitForSelector('.rail-slider input.range:not([disabled])');
  await page.evaluate(() => {
    const el = document.querySelector('.rail-slider input.range:not([disabled])');
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    setter.call(el, el.min);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await new Promise((r) => setTimeout(r, 60));
  const recRangeBox = await page.evaluate(() =>
    document
      .querySelector('.rail-slider input.range:not([disabled])')
      .getBoundingClientRect()
      .toJSON(),
  );
  const recThumbPoint = {
    x: Math.round(recRangeBox.left + 8),
    y: Math.round(recRangeBox.top + recRangeBox.height / 2),
  };
  const recTrackPoint = { x: Math.round(recRangeBox.right - 4), y: recThumbPoint.y };
  const recAccentHex = await rootVar(page, '--accent');
  const recSurface3Hex = await rootVar(page, '--surface-3');
  const recThumbPixel = await pixelAt(page, recThumbPoint.x, recThumbPoint.y);
  const recTrackPixel = await pixelAt(page, recTrackPoint.x, recTrackPoint.y);
  assert(
    closeRGB(recThumbPixel, hexToRGB(recAccentHex)),
    `bubble-size slider thumb pixel (${recThumbPixel}) renders --accent (${recAccentHex}), not Chrome's default blue thumb`,
  );
  assert(
    closeRGB(recTrackPixel, hexToRGB(recSurface3Hex)),
    `bubble-size slider track pixel (${recTrackPixel}) renders --surface-3 (${recSurface3Hex})`,
  );

  step(
    'RECORDER — forced-colors: active — the box-shadow ring goes invisible, an outline stands in',
  );
  await emulateMedia(cdp, [{ name: 'forced-colors', value: 'active' }]);
  // Highlight only resolves to the forced-colors system value while forced
  // colors is actually active — captured after emulateMedia above, not
  // before (its ordinary rendering is a different colour on macOS).
  const highlight = await highlightReference(page);
  const fcZoom = await computedOf(page, ".rec-tl-zoom[data-selected='true']", [
    'boxShadow',
    'outlineStyle',
    'outlineColor',
  ]);
  assert(
    fcZoom.boxShadow === 'none',
    'box-shadow is dropped under forced-colors, same as the swatch trap',
  );
  assert(
    fcZoom.outlineStyle !== 'none',
    'the selected zoom block carries a paintable outline instead',
  );
  assert(fcZoom.outlineColor === highlight, 'that outline resolves to the system Highlight colour');

  step('RECORDER — forced-colors: active — selected zoom-scale segment vs its unpressed siblings');
  const pressedSeg = await computedOf(page, ".rec-seg-btn[aria-pressed='true']", [
    'backgroundColor',
  ]);
  const idleSeg = await computedOf(page, ".rec-seg-btn[aria-pressed='false']", ['backgroundColor']);
  assert(
    pressedSeg.backgroundColor === highlight,
    'the pressed zoom-scale segment resolves to Highlight',
  );
  assert(
    idleSeg.backgroundColor !== highlight,
    'an unpressed sibling segment does not — the two stay distinguishable',
  );

  step('RECORDER — forced-colors: active — selected webcam-bubble corner, and its ::after dot');
  const pressedCorner = await computedOf(page, ".rec-bubble-corner[aria-pressed='true']", [
    'backgroundColor',
  ]);
  const idleCorner = await computedOf(page, ".rec-bubble-corner[aria-pressed='false']", [
    'backgroundColor',
  ]);
  assert(
    pressedCorner.backgroundColor === highlight,
    'the selected bubble corner resolves to Highlight',
  );
  assert(
    idleCorner.backgroundColor !== highlight,
    `an unselected corner does not (${idleCorner.backgroundColor}) — the two are distinguishable`,
  );
  // Same shape as .width-bar in the editor, and the same limit: the dot's
  // own background cannot be told apart from its Canvas fallback by computed
  // value in Chrome's palette, so the requirement is what is asserted.
  const pressedDot = await computedOfPseudo(
    page,
    ".rec-bubble-corner[aria-pressed='true']",
    '::after',
    ['backgroundColor'],
  );
  assert(
    pressedDot.backgroundColor !== highlight,
    `its ::after dot (${pressedDot.backgroundColor}) still contrasts with the Highlight fill, so the chosen corner is readable`,
  );

  step(
    'RECORDER — forced-colors: active — the bubble-size slider keeps its thumb visible against its track',
  );
  await new Promise((r) => setTimeout(r, 60));
  const recThumbPixelFC = await pixelAt(page, recThumbPoint.x, recThumbPoint.y);
  const recTrackPixelFC = await pixelAt(page, recTrackPoint.x, recTrackPoint.y);
  // Same verified-live finding as the editor (task-21-report.md, restated in
  // shared/controls.css): Chromium repaints input[type='range']'s track and
  // thumb under forced-colors on its own, so this checks the two stay
  // distinct rather than asserting a colour this file does not control.
  assert(
    !closeRGB(recThumbPixelFC, recTrackPixelFC, 10),
    `the bubble-size thumb (${recThumbPixelFC}) stays visually distinct from its track (${recTrackPixelFC}) under forced-colors`,
  );

  step('RECORDER — forced-colors: active — the shared .switch, checked vs unchecked');
  // controls.css's toggle carried its whole state as colour plus a knob
  // separated from the track only by a box-shadow, which forced-colors
  // drops — checked and unchecked rendered identically with no visible knob.
  // Rail simplification collapsed Beautify's switch behind a popover and its
  // own default is off (frame.enabled: false, recorder-draft.ts), same as
  // the webcam-bubble switch's own default (bubble.hidden: false) — so
  // nothing is checked until the popover opens and its switch is turned on,
  // giving the on/off pair this assertion compares.
  await page.click('.rec-beautify > .btn-secondary');
  await page.waitForSelector('.rec-beautify-popover');
  await page.click('.rec-beautify-popover .switch');
  await page.waitForSelector('.rec-beautify-popover .switch:checked');
  const switches = await page.evaluate(() => {
    const list = [...document.querySelectorAll('input.switch')];
    const on = list.find((el) => el.checked);
    const off = list.find((el) => !el.checked);
    if (!on || !off) return null;
    const read = (el) => ({
      track: getComputedStyle(el).backgroundColor,
      knob: getComputedStyle(el, '::before').backgroundColor,
      knobX: getComputedStyle(el, '::before').transform,
    });
    return { on: read(on), off: read(off) };
  });
  assert(
    switches !== null,
    'the rail shows both a checked and an unchecked switch to compare in the same run',
  );
  assert(
    switches.on.track === highlight && switches.off.track !== highlight,
    `a checked switch's track resolves to Highlight (${switches.on.track}) and an unchecked one does not (${switches.off.track}) — the two states are distinguishable`,
  );
  assert(
    switches.on.knob !== switches.on.track,
    `the checked knob (${switches.on.knob}) differs from its track (${switches.on.track}), so it is visible without the dropped box-shadow`,
  );
  assert(
    switches.off.knob !== switches.off.track,
    `the unchecked knob (${switches.off.knob}) differs from its track (${switches.off.track}) too`,
  );
  assert(
    switches.on.knobX !== switches.off.knobX,
    `knob position still carries the state as a non-colour signal (checked ${switches.on.knobX} vs unchecked ${switches.off.knobX})`,
  );
  await page.click('.rec-beautify-popover .switch'); // back off
  await page.click('.rec-beautify > .btn-secondary'); // close the popover
  await page.waitForFunction(() => !document.querySelector('.rec-beautify-popover'));
  await emulateMedia(cdp, []);

  step('RECORDER — prefers-reduced-motion: reduce — .link-btn and .rec-bubble-corner');
  // `.rail .link-btn` used to hit the rail's always-present Regenerate
  // button; dropping auto zoom (c695647) removed Regenerate outright, and
  // the rail's one remaining .link-btn (Cancel) only renders mid-export. The
  // timeline's own .rec-zoom-delete is a .link-btn too, and it is on screen
  // for exactly the same reason .rec-seg-btn is above: this test already
  // added and selected a zoom block.
  await emulateMedia(cdp, [{ name: 'prefers-reduced-motion', value: 'no-preference' }]);
  const baseLink = await computedOf(page, '.rec-zoom-delete', ['transitionDuration']);
  const baseCorner = await computedOf(page, '.rec-bubble-corner', ['transitionDuration']);
  assert(
    !allZero(baseLink.transitionDuration),
    `.link-btn has a real transition under no-preference (${baseLink.transitionDuration})`,
  );
  assert(
    !allZero(baseCorner.transitionDuration),
    `.rec-bubble-corner has a real transition under no-preference (${baseCorner.transitionDuration})`,
  );
  await emulateMedia(cdp, [{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  const reducedLink = await computedOf(page, '.rec-zoom-delete', ['transitionDuration']);
  const reducedCorner = await computedOf(page, '.rec-bubble-corner', ['transitionDuration']);
  assert(
    allZero(reducedLink.transitionDuration),
    `.link-btn transition-duration is ${reducedLink.transitionDuration} under reduce`,
  );
  assert(
    allZero(reducedCorner.transitionDuration),
    `.rec-bubble-corner transition-duration is ${reducedCorner.transitionDuration} under reduce`,
  );
  await emulateMedia(cdp, []);

  assert(crashes.length === 0, `no uncaught page errors ${crashes.join('; ')}`);
  await page.close();
}

// ------------------------------------------------------------------ popup ---
async function testPopup(browser, base, messages) {
  step('POPUP — opening');
  const { page, cdp, crashes } = await newPage(browser, messages, {});
  await page.setViewport({ width: 420, height: 900 });
  await page.goto(`${base}/src/popup/index.html`, { waitUntil: 'networkidle0' });
  await page.waitForSelector('.seg-btn');
  // The recording-source chips all start unpressed, so one is pressed here
  // to give .chip-toggle[aria-pressed='true'] a target.
  await page.click('.chip-row .chip-toggle');
  await page.waitForSelector(".chip-toggle[aria-pressed='true']");

  step('POPUP — baseline: the forced-colors CSS has not leaked into ordinary rendering');
  const basePressedSeg = await computedOf(page, ".seg-btn[aria-pressed='true']", [
    'backgroundColor',
  ]);
  const baseIdleSeg = await computedOf(page, ".seg-btn[aria-pressed='false']", ['backgroundColor']);
  assert(
    basePressedSeg.backgroundColor !== baseIdleSeg.backgroundColor,
    'pressed and unpressed segments already differ at baseline',
  );

  step('POPUP — forced-colors: active — pressed segment and pressed source chip');
  await emulateMedia(cdp, [{ name: 'forced-colors', value: 'active' }]);
  // Switching palette re-triggers these controls' colour transitions, and a
  // computed style read mid-transition returns an interpolated colour, not
  // the declared one. Found by a negative control: reverting popup.css's
  // reduced-motion fix (which is what zeroes these transitions on a machine
  // with Reduce Motion on) made this step fail for a timing reason rather
  // than the reason under test. Settled explicitly so the two stay
  // independent.
  await new Promise((r) => setTimeout(r, 400));
  const highlight = await highlightReference(page);
  const pressedSeg = await computedOf(page, ".seg-btn[aria-pressed='true']", ['backgroundColor']);
  const idleSeg = await computedOf(page, ".seg-btn[aria-pressed='false']", ['backgroundColor']);
  assert(pressedSeg.backgroundColor === highlight, 'the pressed .seg-btn resolves to Highlight');
  assert(
    idleSeg.backgroundColor !== highlight,
    `an unpressed sibling does not (${idleSeg.backgroundColor}) — the two are distinguishable`,
  );
  const pressedChip = await computedOf(page, ".chip-toggle[aria-pressed='true']", [
    'backgroundColor',
  ]);
  const idleChip = await computedOf(page, ".chip-toggle[aria-pressed='false']", [
    'backgroundColor',
  ]);
  assert(
    pressedChip.backgroundColor === highlight,
    'the pressed .chip-toggle resolves to Highlight',
  );
  assert(
    idleChip.backgroundColor !== highlight,
    `an unpressed chip does not (${idleChip.backgroundColor}) — the two are distinguishable`,
  );
  await emulateMedia(cdp, []);

  step(
    'POPUP — the quality slider: styled track and thumb in the coral tokens, no Chrome default blue',
  );
  // The quality slider only renders for a lossy default format (App.tsx
  // showQuality) — Settings starts on PNG, so Settings is opened and JPEG
  // (the seg-grid's 2nd of 4 format buttons) selected first. Targeted by
  // aria-label, not just `.icon-btn` — task 28 added a second header
  // icon-btn (History) ahead of Settings in the DOM.
  await page.click('.icon-btn[aria-label="Settings"]');
  await page.waitForSelector('.seg-grid');
  await page.click('.seg-grid .seg-btn:nth-child(2)');
  await page.waitForSelector('.range');
  await page.evaluate(() => {
    const el = document.querySelector('.range');
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    setter.call(el, el.min);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await new Promise((r) => setTimeout(r, 60));
  const popupRangeBox = await page.evaluate(() =>
    document.querySelector('.range').getBoundingClientRect().toJSON(),
  );
  const popupThumbPoint = {
    x: Math.round(popupRangeBox.left + 8),
    y: Math.round(popupRangeBox.top + popupRangeBox.height / 2),
  };
  const popupTrackPoint = { x: Math.round(popupRangeBox.right - 4), y: popupThumbPoint.y };
  const popupAccentHex = await rootVar(page, '--accent');
  const popupSurface3Hex = await rootVar(page, '--surface-3');
  const popupThumbPixel = await pixelAt(page, popupThumbPoint.x, popupThumbPoint.y);
  const popupTrackPixel = await pixelAt(page, popupTrackPoint.x, popupTrackPoint.y);
  assert(
    closeRGB(popupThumbPixel, hexToRGB(popupAccentHex)),
    `quality slider thumb pixel (${popupThumbPixel}) renders --accent (${popupAccentHex}), not Chrome's default blue thumb`,
  );
  assert(
    closeRGB(popupTrackPixel, hexToRGB(popupSurface3Hex)),
    `quality slider track pixel (${popupTrackPixel}) renders --surface-3 (${popupSurface3Hex})`,
  );

  step(
    'POPUP — forced-colors: active — the quality slider keeps its thumb visible against its track',
  );
  await emulateMedia(cdp, [{ name: 'forced-colors', value: 'active' }]);
  await new Promise((r) => setTimeout(r, 60));
  const popupThumbPixelFC = await pixelAt(page, popupThumbPoint.x, popupThumbPoint.y);
  const popupTrackPixelFC = await pixelAt(page, popupTrackPoint.x, popupTrackPoint.y);
  // Same verified-live finding as the editor (task-21-report.md, restated in
  // shared/controls.css): Chromium repaints input[type='range']'s track and
  // thumb under forced-colors on its own, so this checks the two stay
  // distinct rather than asserting a colour this file does not control.
  assert(
    !closeRGB(popupThumbPixelFC, popupTrackPixelFC, 10),
    `the quality slider thumb (${popupThumbPixelFC}) stays visually distinct from its track (${popupTrackPixelFC}) under forced-colors`,
  );
  await emulateMedia(cdp, []);
  // Back to the main view, so the reduced-motion selectors below find their
  // real elements (.mode-icon/.mode-title/.chip-toggle) again rather than
  // falling back to a detached probe.
  await page.click('.icon-btn');
  await page.waitForSelector('.chip-row');

  step('POPUP — prefers-reduced-motion: reduce — the six previously-uncovered transitions');
  const SELECTORS = [
    '.mode-icon',
    '.mode-title',
    '.chip-toggle',
    '.seg-btn',
    '.token-chip',
    '.link-btn',
  ];
  // Some of these only render in a state the popup is not in here (a
  // recoverable session, a filename template). A detached probe carrying the
  // class exercises the same rule — CSS matches on the class, not on where
  // the element sits — and is used only where the real element is absent.
  await emulateMedia(cdp, [{ name: 'prefers-reduced-motion', value: 'no-preference' }]);
  const baseline = await page.evaluate((sels) => {
    const out = {};
    for (const sel of sels) {
      const real = document.querySelector(sel);
      const el = real ?? document.createElement('button');
      if (!real) {
        el.className = sel.slice(1);
        document.body.appendChild(el);
      }
      out[sel] = { duration: getComputedStyle(el).transitionDuration, real: Boolean(real) };
      if (!real) el.remove();
    }
    return out;
  }, SELECTORS);
  for (const sel of SELECTORS) {
    assert(
      baseline[sel].duration !== '0s',
      `${sel} has a real transition under no-preference (${baseline[sel].duration}${baseline[sel].real ? '' : ', via a probe — not rendered in this popup state'})`,
    );
  }
  await emulateMedia(cdp, [{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  const reduced = await page.evaluate((sels) => {
    const out = {};
    for (const sel of sels) {
      const real = document.querySelector(sel);
      const el = real ?? document.createElement('button');
      if (!real) {
        el.className = sel.slice(1);
        document.body.appendChild(el);
      }
      out[sel] = getComputedStyle(el).transitionDuration;
      if (!real) el.remove();
    }
    return out;
  }, SELECTORS);
  for (const sel of SELECTORS) {
    assert(allZero(reduced[sel]), `${sel} transition-duration is ${reduced[sel]} under reduce`);
  }
  await emulateMedia(cdp, []);

  assert(crashes.length === 0, `no uncaught page errors ${crashes.join('; ')}`);
  await page.close();
}

// ------------------------------------------------------------------ setup ---
async function testSetup(browser, base, messages) {
  step('SETUP — opening the permission checklist');
  // this task's own near-miss (the -webkit-/-moz- comma-list bug that
  // silently dropped reduced-motion from six unrelated editor.css selectors,
  // caught only because an unrelated forced-colors smoke happened to sample
  // one of them mid-transition) is exactly why setup.css's own new
  // reduced-motion block — its first ever — gets a real assertion here
  // instead of staying hand-reviewed.
  const { page, cdp, crashes } = await newPage(browser, messages, {});
  await page.setViewport({ width: 1280, height: 860 });
  await page.goto(`${base}/src/setup/index.html?from=record`, { waitUntil: 'networkidle0' });
  await page.waitForSelector('[data-testid="row-tabcapture"]');

  step('SETUP — prefers-reduced-motion: reduce — .btn-primary and .btn-ghost');
  // This file's stub answers `permissions.contains` true, so the page renders
  // in its ready state and .btn-primary is the ready banner's finish button —
  // the row's own Enable button only exists while a grant is missing.
  // .btn-ghost only renders for a blocked-permission device row, a fixture
  // this smoke does not seed — a detached probe carrying the class exercises
  // the same rule, the same fallback testPopup above already uses for
  // selectors that are not always mounted.
  await emulateMedia(cdp, [{ name: 'prefers-reduced-motion', value: 'no-preference' }]);
  const SELECTORS = ['.btn-primary', '.btn-ghost'];
  const readTransitions = () =>
    page.evaluate((sels) => {
      const out = {};
      for (const sel of sels) {
        const real = document.querySelector(sel);
        const el = real ?? document.createElement('button');
        if (!real) {
          el.className = sel.slice(1);
          document.body.appendChild(el);
        }
        out[sel] = { duration: getComputedStyle(el).transitionDuration, real: Boolean(real) };
        if (!real) el.remove();
      }
      return out;
    }, SELECTORS);
  const baseline = await readTransitions();
  for (const sel of SELECTORS) {
    assert(
      baseline[sel].duration !== '0s',
      `${sel} has a real transition under no-preference (${baseline[sel].duration}${baseline[sel].real ? '' : ', via a probe — not rendered on this view'})`,
    );
  }
  await emulateMedia(cdp, [{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  const reduced = await readTransitions();
  for (const sel of SELECTORS) {
    assert(
      allZero(reduced[sel].duration),
      `${sel} transition-duration is ${reduced[sel].duration} under reduce`,
    );
  }
  await emulateMedia(cdp, []);

  assert(crashes.length === 0, `no uncaught page errors ${crashes.join('; ')}`);
  await page.close();
}

async function main() {
  step('checking the build');
  const built = await stat(join(DIST, 'manifest.json')).then(
    () => true,
    () => false,
  );
  if (!built) throw new Error(`${DIST}/manifest.json is missing — run "npm run build" first`);
  assert(built, 'dist/manifest.json exists');

  const messages = JSON.parse(await readFile(join(DIST, '_locales/en/messages.json'), 'utf8'));
  const puppeteer = await loadPuppeteer();
  const work = await mkdtemp(join(tmpdir(), 'oss-media-a11y-smoke-'));
  const server = await serveDist();
  const base = `http://127.0.0.1:${server.address().port}`;
  step(`serving dist/ on ${base}`);

  let browser = null;
  try {
    browser = await puppeteer.launch({
      executablePath: CHROME,
      headless: true,
      userDataDir: join(work, 'profile'),
      args: ['--no-first-run', '--no-default-browser-check', '--disable-gpu', '--hide-scrollbars'],
    });

    await testEditor(browser, base, messages);
    await testRecorder(browser, base, messages);
    await testPopup(browser, base, messages);
    await testSetup(browser, base, messages);
  } finally {
    await browser?.close();
    server.closeAllConnections();
    server.close();
    await rm(work, { recursive: true, force: true });
  }
  console.log('\nMedia a11y smoke passed.');
}

main().catch((err) => {
  console.error(`\nMedia a11y smoke FAILED: ${err.message}`);
  process.exitCode = 1;
});
