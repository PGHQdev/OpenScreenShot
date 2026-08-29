// Headless browser smoke for the recorder editor: serves the built `dist/`,
// seeds a real WebM session into IndexedDB, opens the editor and exports it.
// The live capture path is not covered here — tabCapture needs a real tab
// (manual checklist in docs/).
// Run with: npm run build && npm run smoke:recorder
import { createReadStream } from 'node:fs';
import { mkdtemp, readdir, readFile, rm, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const DIST = join(ROOT, 'dist');
const PAGE = '/src/recorder/index.html';
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
  console.log(`[${stepNo}] ${message}`);
}

function assert(condition, message) {
  if (!condition) throw new Error(`assertion failed: ${message}`);
  console.log(`    ok: ${message}`);
}

/**
 * `puppeteer-core` is a dependency of the MCP workspace, not of this package —
 * this script must not add one. A git worktree has no `mcp/node_modules` of
 * its own, so walk up until the install turns up.
 */
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
  // Fall back to a normal resolution, in case it is installed elsewhere.
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

/** The page-side `chrome` stub. Runs before any app script, on every document. */
function installChromeStub(messages) {
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
        // An object argument carries defaults for keys that are not stored,
        // the same as the real API.
        const out = keys && typeof keys === 'object' && !Array.isArray(keys) ? { ...keys } : {};
        for (const key of keysOf(keys)) if (map.has(key)) out[key] = map.get(key);
        return out;
      },
      async set(items) {
        for (const [key, value] of Object.entries(items)) map.set(key, value);
      },
      async remove(keys) {
        for (const key of keysOf(keys)) map.delete(key);
      },
      async getBytesInUse(keys) {
        let bytes = 0;
        for (const key of keysOf(keys)) {
          if (map.has(key)) bytes += JSON.stringify(map.get(key)).length;
        }
        return bytes;
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
      id: 'smoke',
      getURL: (path) => '/' + String(path).replace(/^\//, ''),
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

  // The export's file size is only observable in the page: the download is an
  // anchor click on an object URL, so record every URL's blob size and read it
  // back when the anchor fires. This is what proves a non-empty file.
  const smoke = { downloads: [], toasts: [] };
  globalThis.__smoke = smoke;
  const sizes = new Map();
  const createObjectURL = URL.createObjectURL.bind(URL);
  URL.createObjectURL = (source) => {
    const url = createObjectURL(source);
    if (source && typeof source.size === 'number') sizes.set(url, source.size);
    return url;
  };
  const anchorClick = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function click() {
    if (this.download)
      smoke.downloads.push({ name: this.download, bytes: sizes.get(this.href) ?? 0 });
    return anchorClick.call(this);
  };
}

/**
 * Records a real 2 s WebM in the page and writes a complete one-segment
 * session into the app's own IndexedDB, raw rows, schema per
 * `src/shared/recording-db.ts`.
 */
async function seedSession() {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 360;
  const ctx = canvas.getContext('2d');
  let frame = 0;
  const paint = () => {
    ctx.fillStyle = '#123a5e';
    ctx.fillRect(0, 0, 640, 360);
    ctx.fillStyle = '#ff6b4a';
    ctx.fillRect((frame * 8) % 560, 120, 80, 120);
    ctx.fillStyle = '#f2f0ea';
    ctx.fillRect(40, 40, 120, 40);
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
  await new Promise((done) => {
    setTimeout(() => {
      clearInterval(painter);
      recorder.onstop = done;
      recorder.stop();
    }, 2100);
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
      duration: 2000,
      viewport: { w: 640, h: 360, dpr: 1 },
      hasWebcam: false,
    });
    const chunks = tx.objectStore('chunks');
    blobs.forEach((blob, seq) => chunks.put({ segmentId, kind: 'tab', seq, blob }));
    tx.objectStore('events').put({
      segmentId,
      seq: 0,
      // Two clicks 900 ms apart (< CLUSTER_GAP_MS) at nx 0.25 and 0.35
      // (|dnx| 0.10 <= CLUSTER_DIST_FRAC), so auto zoom merges them into one
      // block.
      events: [
        { kind: 'click', t: 500, x: 160, y: 90 },
        { kind: 'click', t: 1400, x: 224, y: 180 },
      ],
    });
    tx.oncomplete = () => done();
    tx.onerror = () => fail(tx.error);
    tx.onabort = () => fail(tx.error);
  });
  db.close();
  return {
    sessionId,
    chunks: blobs.length,
    bytes: blobs.reduce((sum, b) => sum + b.size, 0),
  };
}

/**
 * Append a segment row with no chunks to `sessionId`. A continue whose engine
 * died after the row was written leaves exactly this: a segment whose blob is
 * zero bytes, whose metadata never loads, and which the export has to skip
 * rather than die on. Skipping it silently would hand the user a file shorter
 * than the timeline they exported.
 */
async function seedEmptySegment(sessionId) {
  const db = await new Promise((done, fail) => {
    const req = indexedDB.open('openscreenshot-recordings', 1);
    req.onsuccess = () => done(req.result);
    req.onerror = () => fail(req.error);
  });
  const segmentId = crypto.randomUUID();
  await new Promise((done, fail) => {
    const tx = db.transaction(['sessions', 'segments'], 'readwrite');
    const sessions = tx.objectStore('sessions');
    const read = sessions.get(sessionId);
    read.onsuccess = () => {
      const row = read.result;
      row.segmentIds = [...row.segmentIds, segmentId];
      sessions.put(row);
      tx.objectStore('segments').put({
        id: segmentId,
        sessionId,
        index: 1,
        startedAt: Date.now(),
        duration: 0,
        viewport: { w: 640, h: 360, dpr: 1 },
        hasWebcam: false,
      });
    };
    tx.oncomplete = () => done();
    tx.onerror = () => fail(tx.error);
    tx.onabort = () => fail(tx.error);
  });
  db.close();
  return segmentId;
}

/**
 * A session holding one chunk-less segment and nothing else. Every part of
 * the export is unplayable, so no frame is ever recorded and `exportVideo`
 * throws rather than writing a zero-byte file.
 */
async function seedEmptySession() {
  const db = await new Promise((done, fail) => {
    const req = indexedDB.open('openscreenshot-recordings', 1);
    req.onsuccess = () => done(req.result);
    req.onerror = () => fail(req.error);
  });
  const sessionId = crypto.randomUUID();
  const segmentId = crypto.randomUUID();
  await new Promise((done, fail) => {
    const tx = db.transaction(['sessions', 'segments'], 'readwrite');
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
      duration: 0,
      viewport: { w: 640, h: 360, dpr: 1 },
      hasWebcam: false,
    });
    tx.oncomplete = () => done();
    tx.onerror = () => fail(tx.error);
    tx.onabort = () => fail(tx.error);
  });
  db.close();
  return sessionId;
}

/** Share of the stage canvas that is painted, 0..1. */
function stageOpacity() {
  const canvas = document.querySelector('.rec-canvas');
  if (!canvas || canvas.width === 0) return 0;
  const data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
  let painted = 0;
  for (let i = 3; i < data.length; i += 4) if (data[i] > 0) painted += 1;
  return painted / (data.length / 4);
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
  const work = await mkdtemp(join(tmpdir(), 'oss-recorder-smoke-'));
  const downloads = join(work, 'downloads');
  const server = await serveDist();
  const base = `http://127.0.0.1:${server.address().port}`;
  step(`serving dist/ on ${base}`);

  // Everything from here on runs inside the cleanup frame: a failure before
  // the server closes would otherwise hold the event loop open forever.
  let browser = null;
  try {
    browser = await puppeteer.launch({
      executablePath: CHROME,
      headless: true,
      userDataDir: join(work, 'profile'),
      args: ['--no-first-run', '--no-default-browser-check', '--disable-gpu', '--hide-scrollbars'],
    });
    const session = await browser.target().createCDPSession();
    await session.send('Browser.setDownloadBehavior', {
      behavior: 'allow',
      downloadPath: downloads,
      eventsEnabled: true,
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    const crashes = [];
    page.on('pageerror', (err) => crashes.push(String(err)));
    page.on('console', (msg) => {
      if (msg.type() === 'error') console.log(`    console.error: ${msg.text()}`);
    });
    page.on('response', (res) => {
      if (res.status() >= 400)
        console.log(`    http ${res.status()} ${new URL(res.url()).pathname}`);
    });
    await page.evaluateOnNewDocument(installChromeStub, messages);
    step('chrome stub installed');

    step('opening the empty session list');
    await page.goto(base + PAGE, { waitUntil: 'load' });
    await page.waitForSelector('.rec-empty', { timeout: 15_000 });
    const empty = await page.$eval('.rec-empty', (el) => el.textContent?.trim());
    assert(empty === messages.recorderEmpty.message, `empty list shows recorderEmpty ("${empty}")`);

    step('seeding a fixture session into IndexedDB');
    const seeded = await page.evaluate(seedSession);
    assert(seeded.chunks >= 2, `fixture recorded ${seeded.chunks} chunks, ${seeded.bytes} bytes`);

    step(`opening the editor on ?session=${seeded.sessionId}`);
    await page.goto(`${base}${PAGE}?session=${seeded.sessionId}`, { waitUntil: 'load' });
    await page.waitForSelector('.rec-timeline.timeline', { timeout: 15_000 });
    await page.waitForFunction(() => document.querySelectorAll('.rec-tl-zoom').length > 0, {
      timeout: 15_000,
    });
    const timeline = await page.evaluate(() => ({
      strips: document.querySelectorAll('.rec-tl-strip').length,
      zooms: document.querySelectorAll('.rec-tl-zoom').length,
      time: document.querySelector('.rec-time')?.textContent,
    }));
    assert(timeline.strips >= 1, `timeline has ${timeline.strips} segment strip(s)`);
    // The seeded clicks fall in one cluster, and a cluster is one block:
    // 500 - EASE_MS to 1400 + HOLD_MS + EASE_MS, clamped to the timeline.
    assert(timeline.zooms === 1, `auto zoom produced ${timeline.zooms} block(s)`);
    console.log(`    transport: ${timeline.time}`);

    await page.waitForFunction(`(${stageOpacity.toString()})() > 0.9`, { timeout: 15_000 });
    const painted = await page.evaluate(stageOpacity);
    const canvasSize = await page.$eval('.rec-canvas', (el) => `${el.width}x${el.height}`);
    assert(painted > 0.9, `stage canvas ${canvasSize} is painted (${(painted * 100).toFixed(1)}%)`);

    step('exporting');
    await page.evaluate(() => {
      const seen = new Set();
      new MutationObserver(() => {
        for (const el of document.querySelectorAll('.toast-text')) {
          const text = el.textContent ?? '';
          if (text && !seen.has(text)) {
            seen.add(text);
            window.__smoke.toasts.push(text);
          }
        }
      }).observe(document.body, { childList: true, subtree: true, characterData: true });
    });
    const button = await page.waitForSelector('.rec-btn-primary', { timeout: 15_000 });
    const label = await button.evaluate((el) => el.textContent?.trim());
    assert(label === messages.recorderExport.message, `export button reads "${label}"`);
    // A trusted CDP click: the export plays the segments, and a scripted
    // .click() carries no user activation for autoplay.
    await button.click();
    await page.waitForFunction(() => window.__smoke.toasts.length > 0, { timeout: 120_000 });

    const result = await page.evaluate(() => window.__smoke);
    // The toast text comes from `recorderExported`, whose $SIZE$ is the file
    // size rounded to 0.1 MB — a short fixture rounds to "0.0", so the toast
    // proves the export path reported a size and the recorded blob size below
    // proves the file is not empty.
    const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const [head, tail] = messages.recorderExported.message.split(/\$SIZE\$/i);
    const pattern = new RegExp(`^${escape(head)}([0-9]+(?:\\.[0-9]+)?)${escape(tail)}$`);
    const toast = result.toasts[0];
    assert(pattern.test(toast), `export toast reads "${toast}"`);
    const download = result.downloads[0];
    assert(!!download, `a download fired: ${download?.name}`);
    assert(download.bytes > 0, `the exported file is ${download.bytes} bytes`);
    assert(download.name.endsWith('.webm'), `the exported file is named ${download.name}`);

    const onDisk = await readdir(downloads).catch(() => []);
    console.log(`    download directory: ${onDisk.join(', ') || '(empty)'}`);

    step('exporting a session that holds a segment the export cannot play');
    await page.evaluate(seedEmptySegment, seeded.sessionId);
    await page.goto(`${base}${PAGE}?session=${seeded.sessionId}`, { waitUntil: 'load' });
    await page.waitForSelector('.rec-timeline.timeline', { timeout: 15_000 });
    await page.evaluate(() => {
      window.__smoke.toasts = [];
      const seen = new Set();
      new MutationObserver(() => {
        for (const el of document.querySelectorAll('.toast-text')) {
          const text = el.textContent ?? '';
          if (text && !seen.has(text)) {
            seen.add(text);
            window.__smoke.toasts.push(text);
          }
        }
      }).observe(document.body, { childList: true, subtree: true, characterData: true });
    });
    const retry = await page.waitForSelector('.rec-btn-primary', { timeout: 15_000 });
    await retry.click();
    // The file is still written; the toast slot goes to what it is missing.
    await page.waitForSelector('.toast-error .toast-text', { timeout: 180_000 });
    const asError = await page.$eval('.toast-error .toast-text', (el) => el.textContent?.trim());
    assert(
      asError === messages.recFailSegmentSkipped.message,
      `the skipped segment is named as a failure, not just logged ("${asError}")`,
    );
    const second = await page.evaluate(() => window.__smoke.downloads.length);
    assert(second === 1, `the export still produced a file (${second} download)`);

    step('exporting a session with nothing playable in it at all');
    const emptyId = await page.evaluate(seedEmptySession);
    await page.goto(`${base}${PAGE}?session=${emptyId}`, { waitUntil: 'load' });
    await page.waitForSelector('.rec-btn-primary', { timeout: 15_000 });
    await (await page.$('.rec-btn-primary')).click();
    await page.waitForSelector('.toast-error .toast-text', { timeout: 180_000 });
    const failedToast = await page.$eval('.toast-error .toast-text', (el) =>
      el.textContent?.trim(),
    );
    assert(
      failedToast === messages.recFailExport.message,
      `an export that produced nothing says so ("${failedToast}")`,
    );

    step('the recorder page repeats the warning the message sent the user here for');
    // "Stop it and check what you have on the Recorder page" pointed at a page
    // that said nothing. Seeded into the stub's session storage before the app
    // boots, which is where the worker parks it.
    // Keyed on the URL, because evaluateOnNewDocument re-runs on every later
    // navigation and a seed that leaked would answer the next step's assertion.
    await page.evaluateOnNewDocument(() => {
      if (!location.search.includes('seedfail=1')) return;
      void chrome.storage.session.set({
        'openscreenshot:rec-failure': { code: 'chunk-write-failed', at: Date.now() },
      });
    });
    await page.goto(`${base}${PAGE}?session=${seeded.sessionId}&seedfail=1`, {
      waitUntil: 'load',
    });
    await page.waitForSelector('.toast-error .toast-text', { timeout: 15_000 });
    const writeToast = await page.$eval('.toast-error .toast-text', (el) => el.textContent?.trim());
    assert(
      writeToast === messages.recFailChunkWrite.message,
      `the page the message names repeats it ("${writeToast}")`,
    );

    step('opening a session whose media the page cannot read');
    // The failure the hook was already computing into `error` and no one was
    // reading. Injected at the one place a load can realistically break after
    // the rows are read: turning the assembled chunks into a playable URL.
    await page.evaluateOnNewDocument(() => {
      const real = URL.createObjectURL.bind(URL);
      let first = true;
      URL.createObjectURL = (source) => {
        if (first && source instanceof Blob && source.type === 'video/webm') {
          first = false;
          throw new Error('object URL refused');
        }
        return real(source);
      };
    });
    await page.goto(`${base}${PAGE}?session=${seeded.sessionId}`, { waitUntil: 'load' });
    await page.waitForSelector('.toast-error .toast-text', { timeout: 15_000 });
    const loadToast = await page.$eval('.toast-error .toast-text', (el) => el.textContent?.trim());
    assert(
      loadToast === messages.recFailSessionLoad.message,
      `a session that will not load says so ("${loadToast}")`,
    );
    await page.waitForSelector('.rec-list', { timeout: 15_000 });
    assert(true, 'and the page falls back to the session list rather than a blank stage');

    step('the in-page control bar carries a chunk-write failure while it is happening');
    // The bar is a content script with a CLOSED shadow root, so page script
    // cannot reach into it — this reads the real rendered DOM through CDP with
    // `pierce`, not a stub and not a reimplementation. The worker injects the
    // same built function with `chrome.scripting.executeScript`; the dynamic
    // import here stands in for that one API and nothing else.
    const overlayFile = (await readdir(join(DIST, 'assets'))).find((name) =>
      /^recording-overlay-.*\.js$/.test(name),
    );
    assert(!!overlayFile, `the built control bar module is ${overlayFile}`);
    await page.goto(`${base}${PAGE}`, { waitUntil: 'load' });
    const dom = await page.createCDPSession();

    /** A rendered node inside the closed shadow root, by testid, or null. */
    const pierced = async (testid) => {
      const { root } = await dom.send('DOM.getDocument', { depth: -1, pierce: true });
      const stack = [root];
      while (stack.length > 0) {
        const node = stack.pop();
        const attrs = node.attributes ?? [];
        for (let i = 0; i < attrs.length; i += 2) {
          if (attrs[i] === 'data-testid' && attrs[i + 1] === testid) {
            const { outerHTML } = await dom.send('DOM.getOuterHTML', { nodeId: node.nodeId });
            // backendNodeId is stable for the lifetime of a node, unlike
            // nodeId, so it is what tells a replaced node from a kept one.
            return { html: outerHTML, id: node.backendNodeId };
          }
        }
        for (const child of [
          ...(node.children ?? []),
          ...(node.shadowRoots ?? []),
          ...(node.contentDocument ? [node.contentDocument] : []),
        ]) {
          stack.push(child);
        }
      }
      return null;
    };

    const mounted = await page.evaluate(async (file) => {
      const mod = await import(`/assets/${file}`);
      const mount = Object.values(mod).find((v) => typeof v === 'function' && v.length >= 4);
      window.__mount = mount;
      // Mount clean, exactly as a healthy recording does.
      return mount('seg-1', 0, false, { mic: false, tabAudio: true, webcam: false }, false);
    }, overlayFile);
    const warningChip = () => pierced('rec-overlay-warning');
    const announcer = () => pierced('rec-overlay-announcer');
    assert(mounted === 'fresh', `the bar mounted (${mounted})`);
    assert((await warningChip()) === null, 'a healthy recording shows no warning chip');
    // The live region is in the document from mount, empty: a text change in
    // a region already there is what assistive tech announces, and an alert
    // inserted as part of a subtree is what it mostly ignores.
    const quiet = await announcer();
    assert(
      quiet?.html.includes('role="alert"') &&
        !quiet.html.includes(messages.recOverlayNotSaving.message),
      `the announcer is mounted and silent (${quiet?.html})`,
    );

    // The worker re-heals with the flag set: the 'synced' branch, which is the
    // one production takes mid-recording (see handleEngineWriteFailed).
    const synced = await page.evaluate(() =>
      window.__mount('seg-1', 4000, false, { mic: false, tabAudio: true, webcam: false }, true),
    );
    assert(synced === 'synced', `the re-heal updated the live bar (${synced})`);
    const chipHtml = await warningChip();
    assert(
      chipHtml?.html.includes(messages.recOverlayNotSaving.message),
      `the warning is rendered in the bar (${chipHtml?.html})`,
    );
    const spoken = await announcer();
    assert(
      spoken?.html.includes(messages.recOverlayNotSaving.message),
      `and the live region speaks it, on the edge (${spoken?.html})`,
    );

    // A second heal is what every popup open and every navigation does. It
    // must not re-announce, and the only way to be sure is that the live
    // region is the same node with the same text — a replaced alert node is
    // a fresh announcement.
    await page.evaluate(() =>
      window.__mount('seg-1', 5000, false, { mic: false, tabAudio: true, webcam: false }, true),
    );
    const chipAgain = await warningChip();
    const spokenAgain = await announcer();
    assert(
      chipAgain?.html.includes(messages.recOverlayNotSaving.message),
      'a later heal keeps the chip',
    );
    assert(
      chipAgain?.id !== chipHtml?.id,
      `and rebuilds the chip row (${chipHtml?.id} -> ${chipAgain?.id}) — which is why the alert cannot live in it`,
    );
    assert(
      spokenAgain?.id === spoken?.id && spokenAgain?.html === spoken?.html,
      `while the live region is untouched, so it does not speak again (${spoken?.id})`,
    );

    // Well past OVERLAY_GRACE_MS with the pointer nowhere near the bar: the
    // host is light DOM, so its computed opacity is readable directly.
    await new Promise((done) => setTimeout(done, 3400));
    const opacity = await page.evaluate(() => {
      const host = [...document.documentElement.children].at(-1);
      const value = getComputedStyle(host).opacity;
      window.__ossRecOverlay?.();
      return value;
    });
    assert(opacity === '1', `and holds the bar open past its 3s idle hide (opacity ${opacity})`);
    await dom.detach();

    assert(crashes.length === 0, `no uncaught page errors ${crashes.join('; ')}`);
  } finally {
    await browser?.close();
    server.closeAllConnections();
    server.close();
    await rm(work, { recursive: true, force: true });
  }
  console.log('\nRecorder smoke passed.');
}

main().catch((err) => {
  console.error(`\nRecorder smoke FAILED: ${err.message}`);
  process.exitCode = 1;
});
