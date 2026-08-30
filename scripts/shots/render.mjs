// Renders the marketing shots (site/src/assets/shot-N.webp) and the Chrome
// Web Store screenshots (media/store/) from real screenshots of the built
// extension, plus the poster HTML in this directory for the marketing chrome
// (device frames, captions, backgrounds) around them. No JPEG is written for
// the on-page shots; astro:assets re-encodes each .webp into AVIF + WebP at
// build time, so a JPEG source here would just be dead weight.
//
// The editor, popup and recorder pixels shown in every image below are real
// screenshots of `dist/` — driven headless the same way
// `tests/browser/recorder-smoke.mjs` drives it, over an HTTP server with a
// stubbed `chrome` API and seeded storage/IndexedDB — not hand-built HTML
// replicas. That couples marketing renders to the build: a broken build
// blocks image regeneration until it is fixed, same as any other consumer of
// `dist/`. That coupling is accepted; it is what keeps these images from
// silently drifting out of date with the real UI the way the old replicas did.
//
// The real captures are not byte-reproducible run to run. Every id and
// timestamp the seeds carry is fixed (SEED_TIME, SEED_SESSION_ID below), and
// the recorder's scene is painted by frame count, but the recorder session's
// video is a live MediaRecorder encode of a canvas stream, and an encoder
// paced by wall-clock never emits the same bytes twice. recorder.png (and so
// cws-4.jpg) differs on every run. The editor and popup captures, and every
// poster downstream of them, reproduced byte for byte across consecutive runs
// on one machine; a Chrome upgrade or a font change moves them. Expect `git
// status` to show cws-4.jpg touched after a run whose inputs did not change;
// a run's output is checked by looking at it, not by diffing it.
//
// Run with: npm run build && npm run shots
import sharp from 'sharp';
import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { assertDistFresh, loadPuppeteer, serveDist } from '../../tests/browser/dist-server.mjs';

const execFileP = promisify(execFile);

const CHROME =
  process.env.CHROME_BIN ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const DIST = join(ROOT, 'dist');
const SHOTS_DIR = join(ROOT, 'scripts', 'shots');
// Real screenshots of dist/, written here before the poster HTML below is
// rendered, so those pages can embed them as plain <img> files. Not an
// output path in its own right (Task 1 fixed those as OUT_DIR/STORE_DIR
// below) — just scratch space, rebuilt fresh on every run.
const CAPTURES_DIR = join(SHOTS_DIR, 'captures');
// Output paths, as Task 1 set them.
const OUT_DIR = join(ROOT, 'site/src/assets');
// The Chrome Web Store accepts screenshots at exactly 1280x800 or 640x400, as
// JPEG or 24-bit PNG with no alpha.
const STORE_DIR = join(ROOT, 'media/store');
const STORE_SIZE = { w: 1280, h: 800 };
// Every capture is taken at 2x so the posters, which render at 2x themselves,
// and the store shots, which downscale from it, both get crisp pixels.
const CAPTURE_DPR = 2;
// Fixed seed values: the editor's capture timestamp and the recorder session's
// ids and clock. Fixed so a run's inputs never differ from the last run's —
// see the module doc for what still does.
const SEED_TIME = Date.UTC(2026, 7, 30, 9, 0, 0);
const SEED_SESSION_ID = 'shots-session-0001';
const SEED_SEGMENT_ID = 'shots-segment-0001';

/** `path`, relative to the repo root, for a shorter log line. */
const rel = (path) => relative(ROOT, path);

/* -------------------------------------------------------------------------
 * Real UI captures. Each `install*ChromeStub` below follows the pattern in
 * tests/browser/recorder-smoke.mjs and editor-keyboard-smoke.mjs (an
 * in-memory chrome.storage, i18n from the built locale) but is not imported
 * from there: the three surfaces need different stub shapes (the popup reads
 * storage.session too; the recorder needs no `downloads`), and none of them
 * has a second caller beyond its own smoke test today. serveDist/
 * loadPuppeteer, which *are* identical across every caller, live in
 * tests/browser/dist-server.mjs instead.
 * ---------------------------------------------------------------------- */

/** The editor's chrome stub: i18n plus a `storage.local` seeded with `seed`. */
function installEditorChromeStub(messages, seed) {
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
  globalThis.chrome = {
    i18n: { getMessage },
    runtime: { id: 'shots', getURL: (p) => '/' + String(p).replace(/^\//, '') },
    action: { setBadgeText() {}, setBadgeBackgroundColor() {} },
    downloads: { download: async () => 1 },
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

/** The popup's chrome stub: i18n, `storage.local`+`storage.session`, tabs/windows/permissions. */
function installPopupChromeStub(messages, seed) {
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
  const area = (initial) => {
    const map = new Map(Object.entries(initial ?? {}));
    const keysOf = (keys) =>
      keys == null
        ? [...map.keys()]
        : typeof keys === 'string'
          ? [keys]
          : Array.isArray(keys)
            ? keys
            : Object.keys(keys);
    return {
      async get(keys) {
        const out = keys && typeof keys === 'object' && !Array.isArray(keys) ? { ...keys } : {};
        for (const key of keysOf(keys)) if (map.has(key)) out[key] = map.get(key);
        return out;
      },
      async set(items) {
        for (const [k, v] of Object.entries(items)) map.set(k, v);
      },
      async remove(keys) {
        for (const key of keysOf(keys)) map.delete(key);
      },
      async getBytesInUse() {
        return 0;
      },
    };
  };
  const noop = () => {};
  globalThis.chrome = {
    i18n: { getMessage },
    storage: {
      local: area(seed),
      session: area(),
      onChanged: { addListener: noop, removeListener: noop },
    },
    runtime: {
      id: 'shots',
      getURL: (p) => '/' + String(p).replace(/^\//, ''),
      sendMessage: async () => ({}),
      onMessage: { addListener: noop, removeListener: noop },
    },
    action: {
      setBadgeText: noop,
      setBadgeBackgroundColor: noop,
      getUserSettings: async () => ({ isOnToolbar: true }),
    },
    tabs: {
      create: async () => ({ id: 1 }),
      update: async () => ({}),
      query: async () => [{ id: 1, url: 'https://thecoastalalmanac.com/' }],
      remove: noop,
    },
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

/** The recorder's chrome stub: i18n, empty storage, no live-recording surface. */
function installRecorderChromeStub(messages) {
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
  const area = () => {
    const map = new Map();
    return {
      async get(keys) {
        const list = keys == null ? [...map.keys()] : Array.isArray(keys) ? keys : [keys];
        const out = {};
        for (const key of list) if (map.has(key)) out[key] = map.get(key);
        return out;
      },
      async set(items) {
        for (const [k, v] of Object.entries(items)) map.set(k, v);
      },
      async remove(keys) {
        for (const key of Array.isArray(keys) ? keys : [keys]) map.delete(key);
      },
      async getBytesInUse() {
        return 0;
      },
    };
  };
  const noop = () => {};
  globalThis.chrome = {
    i18n: { getMessage },
    storage: {
      local: area(),
      session: area(),
      onChanged: { addListener: noop, removeListener: noop },
    },
    runtime: {
      id: 'shots',
      getURL: (p) => '/' + String(p).replace(/^\//, ''),
      sendMessage: async () => ({}),
      onMessage: { addListener: noop, removeListener: noop },
    },
    permissions: {
      contains: async () => true,
      request: async () => true,
      remove: async () => true,
    },
    tabs: { create: async () => ({ id: 1 }), query: async () => [] },
  };
}

/**
 * Runs inside the recorder page: paints a small looping scene into a canvas,
 * records it as a real WebM through MediaRecorder, and writes it into
 * IndexedDB as a finished session with two click clusters far enough apart
 * (> zoom.ts's CLUSTER_GAP_MS) to become two separate auto-zoom blocks —
 * the recorder editor's timeline has nothing to draw without at least one.
 * Adapted from tests/browser/recorder-smoke.mjs's seedSession, which is not
 * imported here because it hardcodes a one-cluster fixture this pipeline
 * does not want (see the module doc for why the stub functions above are
 * likewise pattern-followed, not shared).
 *
 * The scene is painted by frame count, not by the clock: FRAMES paints at
 * FPS, each advancing the scene one step, so the last frame always shows the
 * same picture. The encode of that stream is still wall-clock paced inside
 * MediaRecorder (module doc), which is why the WebM itself is not reproducible.
 */
async function seedRecorderSession({ sessionId, segmentId, seedTime, pageDataUrl }) {
  const FPS = 30;
  const FRAMES = 156;
  const durationMs = Math.round((FRAMES * 1000) / FPS);
  const canvas = document.createElement('canvas');
  canvas.width = 960;
  canvas.height = 600;
  const ctx = canvas.getContext('2d');

  // What gets recorded is the same sample page the editor and popup shots
  // show, scrolling past — cws-4's whole job is to sell tab recording, and
  // the flat rectangles this used to paint sold an abstraction. A data: URL
  // is same-origin, so the canvas stays untainted and captureStream works.
  // A decode failure throws: a frame with nothing in it is the outcome this
  // replaced, and it must not reach the store silently.
  const shot = await new Promise((done, fail) => {
    const img = new Image();
    img.onload = () => done(img);
    img.onerror = () => fail(new Error('the sample-page capture did not decode'));
    img.src = pageDataUrl;
  });
  const scale = canvas.width / shot.naturalWidth;
  const drawnHeight = shot.naturalHeight * scale;
  const travel = Math.max(0, drawnHeight - canvas.height);

  let frame = 0;
  const paint = () => {
    // Panned by frame, like everything else here, so the last frame is
    // always the same picture.
    const top = -travel * (frame / Math.max(1, FRAMES - 1));
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(shot, 0, top, canvas.width, drawnHeight);
    frame += 1;
  };
  const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
    ? 'video/webm;codecs=vp9'
    : 'video/webm';
  const recorder = new MediaRecorder(canvas.captureStream(FPS), { mimeType: mime });
  const blobs = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) blobs.push(e.data);
  };
  paint();
  recorder.start(1000);
  await new Promise((done) => {
    const painter = setInterval(() => {
      if (frame < FRAMES) {
        paint();
        return;
      }
      clearInterval(painter);
      recorder.onstop = done;
      recorder.stop();
    }, 1000 / FPS);
  });

  const db = await new Promise((done, fail) => {
    const req = indexedDB.open('openscreenshot-recordings', 1);
    req.onsuccess = () => done(req.result);
    req.onerror = () => fail(req.error);
  });
  await new Promise((done, fail) => {
    const tx = db.transaction(['sessions', 'segments', 'chunks', 'events'], 'readwrite');
    tx.objectStore('sessions').put({
      id: sessionId,
      createdAt: seedTime,
      status: 'complete',
      settings: { mic: false, tabAudio: true, webcam: false, ripple: true },
      segmentIds: [segmentId],
    });
    tx.objectStore('segments').put({
      id: segmentId,
      sessionId,
      index: 0,
      startedAt: seedTime,
      duration: durationMs,
      viewport: { w: 960, h: 600, dpr: 1 },
      hasWebcam: false,
    });
    const chunks = tx.objectStore('chunks');
    blobs.forEach((blob, seq) => chunks.put({ segmentId, kind: 'tab', seq, blob }));
    tx.objectStore('events').put({
      segmentId,
      seq: 0,
      events: [
        // Cluster A: two clicks 400ms apart, dnx ~0.06 — merges into one block.
        { kind: 'click', t: 500, x: 200, y: 260 },
        { kind: 'click', t: 900, x: 260, y: 300 },
        // Cluster B: 3300ms after cluster A's last click (> the 2500ms gap
        // that would merge them) — a second, separate block.
        { kind: 'click', t: 4200, x: 700, y: 340 },
        { kind: 'click', t: 4700, x: 760, y: 380 },
      ],
    });
    tx.oncomplete = () => done();
    tx.onerror = () => fail(tx.error);
    tx.onabort = () => fail(tx.error);
  });
  db.close();
  return sessionId;
}

/** A settle delay after an interaction whose effect is not itself awaited. */
const settle = (ms) => new Promise((r) => setTimeout(r, ms));
/** `{ w, h }` as puppeteer's `{ width, height }`. */
const viewport = ({ w, h }) => ({ width: w, height: h });

/**
 * Screenshots the five real surfaces this pipeline needs, into CAPTURES_DIR:
 *  - editor.png: the editor with a rect + arrow annotation and the Poster
 *    beautify look applied.
 *  - editor-export.png: the same editor with its export dialog open.
 *  - editor-crop.png: the editor with an open crop draft, its eight handles
 *    visible.
 *  - popup.png: the popup at its natural size.
 *  - recorder.png: the recorder editor open on a session with two auto-zoom
 *    blocks in its timeline.
 * All five also double as source material for the poster HTML rendered
 * afterwards (every poster but shot-2 embeds one of them), and all are taken
 * at CAPTURE_DPR.
 */
async function renderRealCaptures(browser, base, messages) {
  await rm(CAPTURES_DIR, { recursive: true, force: true });
  await mkdir(CAPTURES_DIR, { recursive: true });

  // The picture the editor and popup show: the same fake article
  // sample-page.html already stands in for elsewhere in this pipeline,
  // screenshotted once so both surfaces show a real, plausible screenshot
  // rather than a solid color rectangle.
  const sampleWork = await mkdtemp(join(tmpdir(), 'oss-shots-sample-'));
  const samplePng = join(sampleWork, 'sample.png');
  await execFileP(
    CHROME,
    [
      '--headless=new',
      '--disable-gpu',
      '--hide-scrollbars',
      '--no-first-run',
      '--disable-extensions',
      `--user-data-dir=${join(sampleWork, 'profile')}`,
      `--screenshot=${samplePng}`,
      '--window-size=1100,1500',
      `file://${resolve(SHOTS_DIR, 'sample-page.html')}`,
    ],
    { timeout: 30_000 },
  );
  const captureDataUrl = `data:image/png;base64,${(await readFile(samplePng)).toString('base64')}`;
  await rm(sampleWork, { recursive: true, force: true });
  const capture = {
    dataUrl: captureDataUrl,
    width: 1100,
    height: 1500,
    mode: 'full-page',
    title: 'The Coastal Almanac',
    url: 'https://thecoastalalmanac.com/',
    capturedAt: SEED_TIME,
  };
  const editorSeed = {
    'openscreenshot:last-capture': capture,
    'openscreenshot:settings': { theme: 'light' },
  };

  // Every interaction below checks that it did what it was for, and throws
  // when it did not. A seeded click whose target has moved must not degrade
  // into a shot with the feature quietly missing and a ✓ in the log — that
  // silent drift is what this pipeline replaced the replicas to be rid of.
  const say = (page) =>
    page.$eval('[aria-live="polite"][role="status"]', (el) => el.textContent.trim());
  const annotationCount = (page) =>
    page.$eval('.toolbar-count span', (el) => Number(el.textContent)).catch(() => 0);

  // ---- editor: rect + arrow annotations, Poster beautify look ----
  {
    const page = await browser.newPage();
    await page.setViewport({ ...viewport(STORE_SIZE), deviceScaleFactor: CAPTURE_DPR });
    await page.evaluateOnNewDocument(installEditorChromeStub, messages, editorSeed);
    await page.goto(`${base}/src/editor/index.html`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('.stage-canvas');
    await settle(500);

    const box = await page.$eval('.stage-canvas', (el) => el.getBoundingClientRect().toJSON());
    await page.$eval('.stage-canvas', (el) => el.focus());
    await page.keyboard.press('r');
    await page.mouse.move(box.x + box.width * 0.08, box.y + box.height * 0.1);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.4, box.y + box.height * 0.32, { steps: 10 });
    await page.mouse.up();
    await settle(120);

    await page.keyboard.press('a');
    await page.mouse.move(box.x + box.width * 0.6, box.y + box.height * 0.2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.82, box.y + box.height * 0.45, { steps: 10 });
    await page.mouse.up();
    await settle(120);
    const drawn = await annotationCount(page);
    if (drawn !== 2) {
      throw new Error(
        `editor capture: expected 2 annotations after the rect and arrow drags, found ${drawn}`,
      );
    }

    await page.click('.beautify-menu > .btn-secondary');
    await page.waitForSelector('.beautify-popover');
    const lookFound = await page.evaluate(() => {
      const btn = [...document.querySelectorAll('.look-btn')].find(
        (b) => b.textContent.trim() === 'Poster',
      );
      btn?.click();
      return !!btn;
    });
    if (!lookFound)
      throw new Error('editor capture: no "Poster" .look-btn in the beautify popover');
    await settle(300);
    const pressed = await page.evaluate(
      () => document.querySelector('.look-btn[aria-pressed="true"]')?.textContent.trim() ?? null,
    );
    if (pressed !== 'Poster') {
      throw new Error(`editor capture: the Poster look did not take (pressed look: ${pressed})`);
    }
    await page.keyboard.press('Escape');
    await settle(200);

    await page.screenshot({ path: join(CAPTURES_DIR, 'editor.png') });

    // ---- the same editor, with the export dialog open ----
    // Taken from the same page, so the annotations and the Poster look are
    // behind the dialog: shot-4 is shot-3 one click later.
    const exportOpened = await page.evaluate(() => {
      const btn = [...document.querySelectorAll('header button')].find(
        (b) => b.textContent.trim() === 'Export',
      );
      btn?.click();
      return !!btn;
    });
    if (!exportOpened) throw new Error('editor-export capture: no "Export" button in the header');
    await page.waitForSelector('.modal[role="dialog"]');
    // The dialog fades in over --dur-mid; wait it out so the capture is not
    // mid-animation.
    await settle(500);
    const formats = await page.$$eval('.format-card', (els) => els.length);
    if (formats !== 4) {
      throw new Error(
        `editor-export capture: expected 4 format cards in the dialog, found ${formats}`,
      );
    }
    await page.screenshot({ path: join(CAPTURES_DIR, 'editor-export.png') });
    await page.close();
  }

  // ---- editor: an open crop draft, inset from the full picture ----
  {
    const page = await browser.newPage();
    await page.setViewport({ ...viewport(STORE_SIZE), deviceScaleFactor: CAPTURE_DPR });
    await page.evaluateOnNewDocument(installEditorChromeStub, messages, editorSeed);
    await page.goto(`${base}/src/editor/index.html`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('.stage-canvas');
    await settle(500);

    await page.$eval('.stage-canvas', (el) => el.focus());
    await page.keyboard.press('c');
    await settle(80);
    await page.keyboard.press('Enter');
    await settle(150);
    const opened = await say(page);
    if (opened !== `Crop ${capture.width} by ${capture.height} pixels at 0, 0.`) {
      throw new Error(`editor-crop capture: Enter did not open a whole-picture crop ("${opened}")`);
    }

    // The NW handle sits on the picture's own corner, and the picture is
    // centred in the stage with a margin on every side — so the corner is
    // read off the canvas rather than assumed: the first pixel along a row
    // and a column well inside the picture that differs from the stage's
    // background. Row and column are kept off the picture's midlines, where
    // the N/S and E/W handles would be the first thing hit instead.
    const corner = await page.$eval('.stage-canvas', (el) => {
      const ctx = el.getContext('2d');
      const row = Math.round(el.height * 0.3);
      const col = Math.round(el.width * 0.4);
      const differs = (data, i, bg) =>
        data[i] !== bg[0] || data[i + 1] !== bg[1] || data[i + 2] !== bg[2];
      const rowData = ctx.getImageData(0, row, el.width, 1).data;
      const colData = ctx.getImageData(col, 0, 1, el.height).data;
      const bg = [rowData[0], rowData[1], rowData[2]];
      let left = -1;
      for (let x = 0; x < el.width; x += 1) {
        if (differs(rowData, x * 4, bg)) {
          left = x;
          break;
        }
      }
      let top = -1;
      for (let y = 0; y < el.height; y += 1) {
        if (differs(colData, y * 4, bg)) {
          top = y;
          break;
        }
      }
      const r = el.getBoundingClientRect();
      return {
        x: r.x + (left * r.width) / el.width,
        y: r.y + (top * r.height) / el.height,
        left,
        top,
      };
    });
    if (corner.left < 0 || corner.top < 0) {
      throw new Error('editor-crop capture: could not find the picture on the stage canvas');
    }
    await page.mouse.move(corner.x + 2, corner.y + 2);
    await page.mouse.down();
    await page.mouse.move(corner.x + 96, corner.y + 72, { steps: 8 });
    await page.mouse.up();
    await settle(200);
    const after = (await say(page)).match(/^Crop (\d+) by (\d+) pixels at (\d+), (\d+)\.$/);
    const [w, h, x, y] = after ? after.slice(1).map(Number) : [];
    const inset = after && x > 0 && y > 0 && x + w === capture.width && y + h === capture.height;
    if (!inset) {
      throw new Error(
        `editor-crop capture: the NW handle drag did not inset the crop ("${await say(page)}")`,
      );
    }

    // The keyboard route in left a focus ring on the stage; a pointer user
    // never sees one, and the crop draft outlives the blur.
    await page.evaluate(() => document.activeElement?.blur());
    await settle(120);
    await page.screenshot({ path: join(CAPTURES_DIR, 'editor-crop.png') });
    await page.close();
  }

  // ---- popup, at its natural size ----
  {
    const page = await browser.newPage();
    await page.setViewport({ width: 340, height: 900, deviceScaleFactor: CAPTURE_DPR });
    await page.evaluateOnNewDocument(installPopupChromeStub, messages, {
      'openscreenshot:last-capture': capture,
      'openscreenshot:settings': { theme: 'light' },
    });
    await page.goto(`${base}/src/popup/index.html`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('.app');
    await settle(300);
    const reopen = await page.evaluate(() => {
      const btn = [...document.querySelectorAll('button')].find(
        (b) => b.textContent.trim() === 'Reopen last',
      );
      return btn ? { disabled: btn.disabled } : null;
    });
    if (!reopen || reopen.disabled) {
      throw new Error('popup capture: the seeded last capture did not enable "Reopen last"');
    }
    // Clipped to the popup's own box: the page is as tall as the viewport,
    // and everything below `.app` is empty body. Width is the document's,
    // which is what a real popup window sizes itself to.
    const clip = await page.evaluate(() => {
      const app = document.querySelector('.app').getBoundingClientRect();
      return {
        x: 0,
        y: 0,
        width: document.documentElement.scrollWidth,
        height: Math.ceil(app.bottom),
      };
    });
    await page.screenshot({ path: join(CAPTURES_DIR, 'popup.png'), clip });
    await page.close();
  }

  // ---- recorder editor, on a session with two auto-zoom blocks ----
  {
    const page = await browser.newPage();
    await page.setViewport({ ...viewport(STORE_SIZE), deviceScaleFactor: CAPTURE_DPR });
    await page.evaluateOnNewDocument(installRecorderChromeStub, messages);
    await page.goto(`${base}/src/recorder/index.html`, { waitUntil: 'load' });
    await page.evaluate(seedRecorderSession, {
      sessionId: SEED_SESSION_ID,
      segmentId: SEED_SEGMENT_ID,
      seedTime: SEED_TIME,
      pageDataUrl: captureDataUrl,
    });
    await page.goto(`${base}/src/recorder/index.html?session=${SEED_SESSION_ID}`, {
      waitUntil: 'load',
    });
    await page.waitForSelector('.rec-canvas', { timeout: 15_000 });
    await page
      .waitForFunction(() => document.querySelectorAll('.rec-tl-zoom').length === 2, {
        timeout: 5_000,
      })
      .catch(async () => {
        const n = await page.$$eval('.rec-tl-zoom', (els) => els.length);
        throw new Error(
          `recorder capture: expected 2 auto-zoom blocks on the timeline, found ${n}`,
        );
      });
    await settle(600);
    await page.screenshot({ path: join(CAPTURES_DIR, 'recorder.png') });
    await page.close();
  }
}

/* -------------------------------------------------------------------------
 * Chrome Web Store screenshots: three of the real captures above straight
 * off the 2x capture, exactly 1280x800, JPEG. The fourth, the popup, is far
 * smaller than the store frame at its natural size, so it is rendered in
 * place over the sample page by store-popup.html (with the other posters,
 * below) instead of being stretched or floated on a blank canvas.
 * ---------------------------------------------------------------------- */

async function renderStoreShots() {
  const direct = [
    ['editor.png', 'cws-1.jpg'], // the editor: annotations + a beautify look
    ['editor-crop.png', 'cws-2.jpg'], // the crop tool, eight handles
    ['recorder.png', 'cws-4.jpg'], // the recorder editor, auto-zoom timeline
  ];
  for (const [src, name] of direct) {
    const out = join(STORE_DIR, name);
    await sharp(join(CAPTURES_DIR, src))
      .resize(STORE_SIZE.w, STORE_SIZE.h, { fit: 'cover' })
      .flatten({ background: '#f2f0ea' })
      .jpeg({ quality: 90 })
      .toFile(out);
    console.log(`✓ ${rel(out)} (${STORE_SIZE.w}x${STORE_SIZE.h})`);
  }
}

/* -------------------------------------------------------------------------
 * Poster HTML: marketing chrome (device frames, captions, backgrounds)
 * around the real captures above, plus the pure-copy shots that need no
 * capture at all. Same headless-screenshot mechanism the pipeline always
 * used for these — nothing here reads from dist/.
 * ---------------------------------------------------------------------- */

// shot-2..5 are the homepage's four gallery shots (region capture, the
// editor, the export dialog, the recorder) and hero is the homepage's top
// shot — every one of those five is used on the page. The hero is also
// written as media/hero.jpg for the README, which GitHub renders from the
// repo. There is no shot-1 or step-1..3 entry: shot-1 only ever fed the
// store screenshots (now rendered directly from the real captures above,
// see renderStoreShots), and the old three-step "how it works" section is
// gone — nothing on the site references either any more.
const PAGE_SHOTS = new Set(['shot-2', 'shot-3', 'shot-4', 'shot-5', 'hero']);
const SHOTS = [
  { name: 'shot-2', w: 900, h: 563 },
  { name: 'shot-3', w: 900, h: 563 },
  { name: 'shot-4', w: 900, h: 563 },
  { name: 'shot-5', w: 900, h: 563 },
  { name: 'hero', w: 1200, h: 720 },
];
const README_HERO = join(ROOT, 'media/hero.jpg');
const README_HERO_WIDTH = 1600;

async function screenshotPoster(name, w, h, work) {
  const src = resolve(SHOTS_DIR, `${name}.html`);
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
  return png;
}

/**
 * Every `<img>` in a poster really has pixels, checked in the page before it
 * is screenshotted.
 *
 * `chrome --screenshot` exits 0 for a page with a broken `<img>`, so a
 * renamed capture, a changed clip or a zero-byte file used to emit a poster
 * with a hole in it and a `✓` in the log — the same silent-degradation class
 * the dist/ freshness guard closed on the other half of this pipeline. Every
 * poster but shot-2 embeds a real capture, and all of them ship: hero.webp
 * and media/hero.jpg, shot-3..5.webp, og-card.png, marquee.jpg,
 * promo-tile.jpg and cws-3.jpg.
 */
async function assertPosterImagesLoad(browser, name) {
  const src = resolve(SHOTS_DIR, `${name}.html`);
  const page = await browser.newPage();
  try {
    await page.goto(`file://${src}`, { waitUntil: 'networkidle0' });
    const broken = await page.evaluate(() =>
      [...document.images]
        .filter((img) => !img.complete || img.naturalWidth === 0)
        .map((img) => img.getAttribute('src') ?? '(no src)'),
    );
    if (broken.length > 0) {
      throw new Error(`${name}.html: ${broken.length} image(s) did not load: ${broken.join(', ')}`);
    }
  } finally {
    await page.close();
  }
}

async function renderPosters(browser) {
  const work = await mkdtemp(join(tmpdir(), 'oss-shots-'));
  try {
    for (const { name, w, h } of SHOTS) {
      await assertPosterImagesLoad(browser, name);
      const png = await screenshotPoster(name, w, h, work);
      if (PAGE_SHOTS.has(name)) {
        const out = join(OUT_DIR, `${name}.webp`);
        await sharp(png).webp({ quality: 84 }).toFile(out);
        console.log(`✓ ${rel(out)}`);
      }
      if (name === 'hero') {
        // JPEG, because GitHub's README renderer is the consumer and a
        // 1600px JPEG is a third of the 2x WebP's weight at that width.
        await sharp(png).resize(README_HERO_WIDTH).jpeg({ quality: 86 }).toFile(README_HERO);
        console.log(`✓ ${rel(README_HERO)} (${README_HERO_WIDTH}w)`);
      }
    }

    // The OG/social card: exactly 1200x630, PNG. Social un-furlers (LinkedIn,
    // iMessage, some Slack previews) do not reliably decode AVIF or WebP
    // og:image URLs, so this one file stays outside the AVIF+WebP policy
    // that governs every on-page <img>: it never touches the Lighthouse
    // transfer-weight budget because it is never rendered inside the page.
    {
      const w = 1200;
      const h = 630;
      await assertPosterImagesLoad(browser, 'og-card');
      const png = await screenshotPoster('og-card', w, h, work);
      const out = join(OUT_DIR, 'og-card.png');
      // `palette: true` quantizes to an indexed palette (libimagequant,
      // bundled with sharp) instead of relying on zlib effort alone —
      // roughly 140KB down to 60KB for this mostly-flat card, with no
      // visible banding.
      await sharp(png)
        .resize(w, h)
        .png({ palette: true, compressionLevel: 9, effort: 10 })
        .toFile(out);
      console.log(`✓ ${rel(out)} (${w}x${h})`);
    }

    // Store promo images and the popup store screenshot: exact sizes, JPEG.
    // Rendered at 2x like the shots, then downscaled straight into the store
    // directory.
    for (const { name, out: outName = name, w, h } of [
      { name: 'promo-tile', w: 440, h: 280 },
      { name: 'marquee', w: 1400, h: 560 },
      { name: 'store-popup', out: 'cws-3', w: STORE_SIZE.w, h: STORE_SIZE.h },
    ]) {
      await assertPosterImagesLoad(browser, name);
      const png = await screenshotPoster(name, w, h, work);
      const out = join(STORE_DIR, `${outName}.jpg`);
      await sharp(png)
        .resize(w, h, { fit: 'cover' })
        .flatten({ background: '#f2f0ea' })
        .jpeg({ quality: 92 })
        .toFile(out);
      console.log(`✓ ${rel(out)} (${w}x${h})`);
    }
  } finally {
    await rm(work, { recursive: true, force: true });
  }
}

/* -------------------------------------------------------------------------
 * Entry point.
 * ---------------------------------------------------------------------- */

async function main() {
  const { sourceCount } = await assertDistFresh(ROOT);
  console.log(`dist/ is newer than all ${sourceCount} files under src/, public/ and manifest.json`);
  await mkdir(OUT_DIR, { recursive: true });
  await mkdir(STORE_DIR, { recursive: true });

  const messages = JSON.parse(await readFile(join(DIST, '_locales/en/messages.json'), 'utf8'));
  const puppeteer = await loadPuppeteer(ROOT);
  const work = await mkdtemp(join(tmpdir(), 'oss-shots-captures-'));
  const server = await serveDist(DIST);
  const base = `http://127.0.0.1:${server.address().port}`;

  let browser = null;
  try {
    browser = await puppeteer.launch({
      executablePath: CHROME,
      headless: true,
      userDataDir: join(work, 'profile'),
      args: ['--no-first-run', '--no-default-browser-check', '--disable-gpu', '--hide-scrollbars'],
    });
    await renderRealCaptures(browser, base, messages);
    await renderStoreShots();
    // Inside the same browser lifetime: renderPosters checks each poster's
    // embedded captures in a real page before it screenshots the poster.
    await renderPosters(browser);
  } finally {
    await browser?.close();
    server.close();
    await rm(work, { recursive: true, force: true });
  }

  console.log('Shots rendered.');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
