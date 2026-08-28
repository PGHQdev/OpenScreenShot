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
//   - prefers-reduced-motion: two of editor.css's previously-uncovered
//     colour-transitioning selectors report a zero transition-duration.
//   - Baseline (no emulated feature) is captured first and re-checked last,
//     so a forced-colors or prefers-contrast rule that leaked into ordinary
//     rendering fails the same run.
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
      hasWebcam: false,
    });
    const chunks = tx.objectStore('chunks');
    blobs.forEach((blob, seq) => chunks.put({ segmentId, kind: 'tab', seq, blob }));
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

/** The live computed value of `background-color: Highlight` in this browser/run. */
async function highlightReference(page) {
  return page.evaluate(() => {
    const probe = document.createElement('div');
    probe.style.backgroundColor = 'Highlight';
    probe.style.position = 'fixed';
    probe.style.opacity = '0';
    document.body.appendChild(probe);
    const value = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return value;
  });
}

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
  // Chrome also outlines the pressed swatch here, on top of the box-shadow
  // moat above — reproducible, but its exact trigger was not pinned down
  // (an idle sibling in the same run stays outline: none, so it does not
  // just come from forced-color-adjust: none or from [aria-pressed] alone
  // in isolation; see task-17-report.md). Logged, not hard-asserted: it is
  // a bonus this task did not author and cannot vouch for as stable.
  console.log(
    `    note: pressed swatch outline is ${fcSwatchPressed.outlineStyle}, idle sibling is ${fcSwatchIdle.outlineStyle} (unexplained Chrome behaviour, not relied on)`,
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
  const eyedropper = await computedOf(page, '.swatch-screen', ['backgroundColor']);
  if (eyedropper) {
    assert(
      eyedropper.backgroundColor !== highlight,
      'the eyedropper (not a colour choice) still follows the system palette, not left opted out with the real swatches',
    );
  }

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
  await page.keyboard.press('Escape');
  await emulateMedia(cdp, []);

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
  await page.keyboard.down('Meta');
  await page.keyboard.press('s');
  await page.keyboard.up('Meta');
  await page.waitForSelector('.modal', { timeout: 5000 });
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
  await emulateMedia(cdp, [{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  const reducedTool = await computedOf(page, '.tool-btn', ['transitionDuration']);
  const reducedFormat = await computedOf(page, '.format-card', ['transitionDuration']);
  assert(
    /^0s(,\s*0s)*$/.test(reducedTool.transitionDuration),
    `.tool-btn transition-duration is ${reducedTool.transitionDuration} under prefers-reduced-motion: reduce`,
  );
  assert(
    /^0s(,\s*0s)*$/.test(reducedFormat.transitionDuration),
    `.format-card transition-duration is ${reducedFormat.transitionDuration} under prefers-reduced-motion: reduce`,
  );
  await page.keyboard.press('Escape');
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

  step('RECORDER — adding and selecting a zoom block (rail "Add Zoom")');
  // addBlockAtPlayhead (useRecorderSession.ts) needs total segment duration
  // >= 2*EASE_MS (1200ms) or it silently returns null — the fixture's
  // segment.duration is set well above that for exactly this reason.
  await page.click('.rail .btn-secondary');
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
