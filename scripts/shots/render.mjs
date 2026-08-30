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
// Run with: npm run build && npm run shots
import sharp from 'sharp';
import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, readdir, readFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { loadPuppeteer, serveDist } from '../../tests/browser/dist-server.mjs';

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

/** `path`, relative to the repo root, for a shorter log line. */
const rel = (path) => relative(ROOT, path);

/* -------------------------------------------------------------------------
 * dist/ freshness check. Pure decision in `checkDistFreshness` (unit-tested
 * in tests/unit/); the file-system walk that feeds it lives in
 * `assertDistFresh` below.
 * ---------------------------------------------------------------------- */

/**
 * Decides whether `dist/` is fit to render from, given nothing but file
 * lists and mtimes — no I/O, so a test can hand it fixtures directly.
 * `sourceFiles` is every file under src/, public/ and manifest.json;
 * `distNewestMtimeMs` is the newest mtime anywhere under dist/ (or -Infinity
 * if dist/ has no files at all). Missing takes priority over stale: an absent
 * manifest means there is nothing to compare mtimes against in the first
 * place.
 */
export function checkDistFreshness({ manifestExists, sourceFiles, distNewestMtimeMs }) {
  if (!manifestExists) return { fresh: false, reason: 'missing' };
  let newest = null;
  for (const file of sourceFiles) {
    if (file.mtimeMs > distNewestMtimeMs && (!newest || file.mtimeMs > newest.mtimeMs)) {
      newest = file;
    }
  }
  if (newest) return { fresh: false, reason: 'stale', file: newest.path, mtimeMs: newest.mtimeMs };
  return { fresh: true };
}

/** Every file under `dir`, recursively, as absolute paths. */
async function listFiles(dir) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  const out = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await listFiles(full)));
    else if (entry.isFile()) out.push(full);
  }
  return out;
}

/** Reads `checkDistFreshness`'s inputs off disk, then exits non-zero on a stale or missing dist/. */
async function assertDistFresh() {
  const manifestExists = await stat(join(DIST, 'manifest.json')).then(
    () => true,
    () => false,
  );
  const distFiles = await listFiles(DIST);
  let distNewestMtimeMs = -Infinity;
  for (const file of distFiles) {
    const info = await stat(file);
    if (info.mtimeMs > distNewestMtimeMs) distNewestMtimeMs = info.mtimeMs;
  }

  const sourcePaths = [
    ...(await listFiles(join(ROOT, 'src'))),
    ...(await listFiles(join(ROOT, 'public'))),
    join(ROOT, 'manifest.json'),
  ];
  const sourceFiles = [];
  for (const path of sourcePaths) {
    const info = await stat(path).catch(() => null);
    if (info) sourceFiles.push({ path, mtimeMs: info.mtimeMs });
  }

  const result = checkDistFreshness({ manifestExists, sourceFiles, distNewestMtimeMs });
  if (result.fresh) return;
  if (result.reason === 'missing') {
    console.error('dist/manifest.json is missing. Run `npm run build` first.');
  } else {
    console.error(`${result.file} is newer than dist/. Run \`npm run build\` first.`);
  }
  process.exitCode = 1;
  process.exit(1);
}

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
 */
async function seedRecorderSession() {
  const canvas = document.createElement('canvas');
  canvas.width = 960;
  canvas.height = 600;
  const ctx = canvas.getContext('2d');
  let frame = 0;
  const paint = () => {
    ctx.fillStyle = '#152643';
    ctx.fillRect(0, 0, 960, 600);
    ctx.fillStyle = '#e8503a';
    ctx.fillRect((frame * 5) % 820, 220, 120, 160);
    ctx.fillStyle = '#f2f0ea';
    ctx.fillRect(48, 44, 260, 60);
    frame += 1;
  };
  const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
    ? 'video/webm;codecs=vp9'
    : 'video/webm';
  const recorder = new MediaRecorder(canvas.captureStream(30), { mimeType: mime });
  const blobs = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) blobs.push(e.data);
  };
  paint();
  recorder.start(1000);
  const painter = setInterval(paint, 1000 / 30);
  const durationMs = 5200;
  await new Promise((done) => {
    setTimeout(() => {
      clearInterval(painter);
      recorder.onstop = done;
      recorder.stop();
    }, durationMs);
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
      settings: { mic: false, tabAudio: true, webcam: false, ripple: true },
      segmentIds: [segmentId],
    });
    tx.objectStore('segments').put({
      id: segmentId,
      sessionId,
      index: 0,
      startedAt: Date.now(),
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

/**
 * Screenshots the four real surfaces this pipeline needs, into CAPTURES_DIR:
 *  - editor.png: the editor with a rect + arrow annotation and the Poster
 *    beautify look applied.
 *  - editor-crop.png: the editor with an open crop draft, its eight handles
 *    visible.
 *  - popup.png: the popup at its natural size.
 *  - recorder.png: the recorder editor open on a session with two auto-zoom
 *    blocks in its timeline.
 * All four also double as source material for the poster HTML rendered
 * afterwards (hero, shot-1..5, marquee, og-card embed editor.png/popup.png).
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
    capturedAt: Date.now(),
  };
  const editorSeed = {
    'openscreenshot:last-capture': capture,
    'openscreenshot:settings': { theme: 'light' },
  };

  // ---- editor: rect + arrow annotations, Poster beautify look ----
  {
    const page = await browser.newPage();
    await page.setViewport({ width: STORE_SIZE.w, height: STORE_SIZE.h });
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

    await page.click('.beautify-menu > .btn-secondary');
    await page.waitForSelector('.beautify-popover');
    await page.evaluate(() => {
      [...document.querySelectorAll('.look-btn')]
        .find((b) => b.textContent.trim() === 'Poster')
        ?.click();
    });
    await settle(300);
    await page.keyboard.press('Escape');
    await settle(200);

    await page.screenshot({ path: join(CAPTURES_DIR, 'editor.png') });
    await page.close();
  }

  // ---- editor: an open crop draft, inset from the full picture ----
  {
    const page = await browser.newPage();
    await page.setViewport({ width: STORE_SIZE.w, height: STORE_SIZE.h });
    await page.evaluateOnNewDocument(installEditorChromeStub, messages, editorSeed);
    await page.goto(`${base}/src/editor/index.html`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('.stage-canvas');
    await settle(500);

    await page.$eval('.stage-canvas', (el) => el.focus());
    await page.keyboard.press('c');
    await settle(80);
    await page.keyboard.press('Enter');
    await settle(150);
    const box = await page.$eval('.stage-canvas', (el) => el.getBoundingClientRect().toJSON());
    await page.mouse.move(box.x + 20, box.y + 20);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.18, box.y + box.height * 0.18, { steps: 8 });
    await page.mouse.up();
    await settle(200);

    await page.screenshot({ path: join(CAPTURES_DIR, 'editor-crop.png') });
    await page.close();
  }

  // ---- popup, at its natural size ----
  {
    const page = await browser.newPage();
    await page.setViewport({ width: 340, height: 900 });
    await page.evaluateOnNewDocument(installPopupChromeStub, messages, {
      'openscreenshot:last-capture': capture,
      'openscreenshot:settings': { theme: 'light' },
    });
    await page.goto(`${base}/src/popup/index.html`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('.app');
    await settle(300);
    await page.screenshot({ path: join(CAPTURES_DIR, 'popup.png'), fullPage: true });
    await page.close();
  }

  // ---- recorder editor, on a session with two auto-zoom blocks ----
  {
    const page = await browser.newPage();
    await page.setViewport({ width: STORE_SIZE.w, height: STORE_SIZE.h });
    await page.evaluateOnNewDocument(installRecorderChromeStub, messages);
    await page.goto(`${base}/src/recorder/index.html`, { waitUntil: 'load' });
    const sessionId = await page.evaluate(seedRecorderSession);
    await page.goto(`${base}/src/recorder/index.html?session=${sessionId}`, {
      waitUntil: 'load',
    });
    await page.waitForSelector('.rec-canvas', { timeout: 15_000 });
    await settle(600);
    await page.screenshot({ path: join(CAPTURES_DIR, 'recorder.png') });
    await page.close();
  }
}

/* -------------------------------------------------------------------------
 * Chrome Web Store screenshots: the four real captures above, exactly
 * 1280x800, JPEG.
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

  // The popup is far smaller than the store's frame at its natural size, so
  // it is composited onto a branded canvas instead of stretched to fill one.
  const popupPath = join(CAPTURES_DIR, 'popup.png');
  const popupMeta = await sharp(popupPath).metadata();
  const targetH = Math.round(STORE_SIZE.h * 0.82);
  const scale = targetH / popupMeta.height;
  const popupResized = await sharp(popupPath)
    .resize(Math.round(popupMeta.width * scale), targetH)
    .toBuffer();
  const popupOut = join(STORE_DIR, 'cws-3.jpg');
  await sharp({
    create: {
      width: STORE_SIZE.w,
      height: STORE_SIZE.h,
      channels: 3,
      background: '#f2f0ea',
    },
  })
    .composite([{ input: popupResized, gravity: 'center' }])
    .jpeg({ quality: 90 })
    .toFile(popupOut);
  console.log(`✓ ${rel(popupOut)} (${STORE_SIZE.w}x${STORE_SIZE.h})`);
}

/* -------------------------------------------------------------------------
 * Poster HTML: marketing chrome (device frames, captions, backgrounds)
 * around the real captures above, plus the pure-copy shots that need no
 * capture at all. Same headless-screenshot mechanism the pipeline always
 * used for these — nothing here reads from dist/.
 * ---------------------------------------------------------------------- */

// shot-2..5 are the homepage's four FRAME product shots (Capture, Annotate,
// Export, Record) and hero is the homepage's top shot — every one of those
// five is used on the page. There is no shot-1 or step-1..3 entry: shot-1
// only ever fed the store screenshots (now rendered directly from the real
// captures above, see renderStoreShots), and the old three-step "how it
// works" section was folded into the FRAME sections — nothing on the site
// references either any more.
const PAGE_SHOTS = new Set(['shot-2', 'shot-3', 'shot-4', 'shot-5', 'hero']);
const SHOTS = [
  { name: 'shot-2', w: 900, h: 563 },
  { name: 'shot-3', w: 900, h: 563 },
  { name: 'shot-4', w: 900, h: 563 },
  { name: 'shot-5', w: 900, h: 563 },
  { name: 'hero', w: 1160, h: 680 },
];

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

async function renderPosters() {
  const work = await mkdtemp(join(tmpdir(), 'oss-shots-'));
  try {
    for (const { name, w, h } of SHOTS) {
      const png = await screenshotPoster(name, w, h, work);
      if (PAGE_SHOTS.has(name)) {
        const out = join(OUT_DIR, `${name}.webp`);
        await sharp(png).webp({ quality: 84 }).toFile(out);
        console.log(`✓ ${rel(out)}`);
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

    // Store promo images: exact sizes, JPEG. Rendered at 2x like the shots,
    // then downscaled straight into the store directory.
    for (const { name, w, h } of [
      { name: 'promo-tile', w: 440, h: 280 },
      { name: 'marquee', w: 1400, h: 560 },
    ]) {
      const png = await screenshotPoster(name, w, h, work);
      const out = join(STORE_DIR, `${name}.jpg`);
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
  await assertDistFresh();
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
  } finally {
    await browser?.close();
    server.close();
    await rm(work, { recursive: true, force: true });
  }

  await renderStoreShots();
  await renderPosters();
  console.log('Shots rendered.');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
