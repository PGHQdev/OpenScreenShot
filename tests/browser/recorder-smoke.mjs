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

/** Mirrors `formatBytes` in `src/recorder/App.tsx`, to predict a row's size text. */
function formatBytesForTest(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(value < 10 ? 1 : 0)} ${units[unit]}`;
}

/**
 * Polls `read()` inside the page every `intervalMs`, collecting every
 * non-null reading, stopping as soon as `read()` returns null (the state
 * being watched is gone) or `timeoutMs` runs out. The two loading states this
 * drives are both real but brief; CPU throttling (set by the caller before
 * this runs) stretches them out enough for this to catch more than one frame
 * of them, proving the state actually moved rather than just existed.
 */
async function pollUntilGone(page, read, { intervalMs = 15, timeoutMs = 5000 } = {}) {
  const readings = [];
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const value = await page.evaluate(read);
    if (value === null) break;
    readings.push(value);
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  return readings;
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

/**
 * A second server for the cross-origin iframe case, on a different hostname
 * of the same loopback address — `localhost` and `127.0.0.1` are different
 * origins to Chrome, so a real origin boundary sits between this and `dist/`
 * without needing a real second machine. The page it serves is static: a
 * click counter, standing in for a chat widget or an embedded player that
 * might sit at the bottom of a real page.
 */
function serveChild() {
  const server = createServer((req, res) => {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(
      '<!doctype html><html><body style="margin:0;background:#234166">' +
        '<script>' +
        'window.__clicks = 0;' +
        'document.addEventListener("click", () => { window.__clicks += 1; });' +
        '</script></body></html>',
    );
  });
  return new Promise((done) => {
    server.listen(0, '127.0.0.1', () => done(server));
  });
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

  // `chrome.downloads`: the export saves through this now (`save-export.ts`),
  // not a bare anchor click. `download()` still triggers the same
  // anchor-click patch above when `downloadMode` is 'real', so a real file
  // lands in the CDP-managed downloads directory and the size/name capture
  // above still fires — the harness bridges the real `Browser.downloadProgress`
  // CDP event back into `onChanged` for that case (see the browser-level
  // `session.on('Browser.downloadProgress', ...)` below). `downloadMode` set
  // to 'stub' skips the real download entirely, so the harness can fire
  // `onChanged` itself and drive the cancel/interrupted paths deterministically
  // — with no real download in flight, there is nothing for that to race.
  smoke.downloadMode = 'real';
  smoke.lastDownloadId = null;
  let nextDownloadId = 1;
  const downloadListeners = [];
  globalThis.chrome.downloads = {
    async download(opts) {
      const id = nextDownloadId++;
      smoke.lastDownloadId = id;
      if (smoke.downloadMode === 'real') {
        const a = document.createElement('a');
        a.href = opts.url;
        a.download = opts.filename;
        a.click();
      }
      return id;
    },
    onChanged: {
      addListener: (fn) => downloadListeners.push(fn),
      removeListener: (fn) => {
        const i = downloadListeners.indexOf(fn);
        if (i >= 0) downloadListeners.splice(i, 1);
      },
    },
  };
  smoke.fireDownloadChanged = (delta) => {
    for (const fn of [...downloadListeners]) fn(delta);
  };
}

/** Whether `sessionId` still has a row in the app's own IndexedDB store. */
async function sessionExists(sessionId) {
  const db = await new Promise((done, fail) => {
    const req = indexedDB.open('openscreenshot-recordings', 1);
    req.onsuccess = () => done(req.result);
    req.onerror = () => fail(req.error);
  });
  const found = await new Promise((done, fail) => {
    const tx = db.transaction(['sessions'], 'readonly');
    const get = tx.objectStore('sessions').get(sessionId);
    get.onsuccess = () => done(get.result !== undefined);
    get.onerror = () => fail(get.error);
  });
  db.close();
  return found;
}

/** The undo stack as the session record on disk holds it, or null. */
async function savedHistory(sessionId) {
  const db = await new Promise((done, fail) => {
    const req = indexedDB.open('openscreenshot-recordings', 1);
    req.onsuccess = () => done(req.result);
    req.onerror = () => fail(req.error);
  });
  const row = await new Promise((done, fail) => {
    const tx = db.transaction(['sessions'], 'readonly');
    const get = tx.objectStore('sessions').get(sessionId);
    get.onsuccess = () => done(get.result);
    get.onerror = () => fail(get.error);
  });
  db.close();
  const history = row?.editorState?.history;
  return history ? { past: history.past.length, future: history.future.length } : null;
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

/**
 * A session with real-sized (but content-empty) chunks across two segments,
 * mic, tab audio and webcam all requested — a stand-in for the "multi-hundred-
 * MB recording" the loading states exist for, and for a row whose mic/webcam
 * tracks can only be hedged as "requested" (the combined recorder-#2 stream
 * has evidence — some 'webcam'-kind chunks — but that evidence cannot say
 * which of the two tracks it actually is; see `trackStatuses` in
 * session-load.ts). The real fixture (`seedSession`) is a real 2 s WebM and
 * loads before a poll can ever catch it mid-flight; this fixture's chunks are
 * large enough that reading them back out of IndexedDB is itself real,
 * observable work, which is what actually stretches the window — CPU
 * throttling alone does not, since a chunk read is mostly IPC/storage-service
 * latency, not renderer JS time.
 */
async function seedManyChunksSession() {
  const db = await new Promise((done, fail) => {
    const req = indexedDB.open('openscreenshot-recordings', 1);
    req.onsuccess = () => done(req.result);
    req.onerror = () => fail(req.error);
  });
  const sessionId = crypto.randomUUID();
  const CHUNK_BYTES = 100_000;
  const segments = [
    // webcamChunkCount > 0 on this one segment is the only chunk-level
    // evidence a row gets that the combined mic/webcam stream exists at
    // all — it cannot say which of the two tracks it actually is.
    { id: crypto.randomUUID(), index: 0, duration: 90_000, chunkCount: 150, webcamChunkCount: 20 },
    { id: crypto.randomUUID(), index: 1, duration: 45_000, chunkCount: 150, webcamChunkCount: 0 },
  ];
  await new Promise((done, fail) => {
    const tx = db.transaction(['sessions', 'segments', 'chunks'], 'readwrite');
    tx.objectStore('sessions').put({
      id: sessionId,
      createdAt: Date.now(),
      status: 'complete',
      settings: { mic: true, tabAudio: true, webcam: true, ripple: true },
      segmentIds: segments.map((s) => s.id),
    });
    const segStore = tx.objectStore('segments');
    const chunkStore = tx.objectStore('chunks');
    for (const seg of segments) {
      segStore.put({
        id: seg.id,
        sessionId,
        index: seg.index,
        startedAt: Date.now(),
        duration: seg.duration,
        viewport: { w: 640, h: 360, dpr: 1 },
        hasWebcam: seg.webcamChunkCount > 0,
      });
      for (let seq = 0; seq < seg.chunkCount; seq++) {
        chunkStore.put({
          segmentId: seg.id,
          kind: 'tab',
          seq,
          blob: new Blob([new Uint8Array(CHUNK_BYTES)]),
        });
      }
      for (let seq = 0; seq < seg.webcamChunkCount; seq++) {
        chunkStore.put({
          segmentId: seg.id,
          kind: 'webcam',
          seq,
          blob: new Blob([new Uint8Array(CHUNK_BYTES)]),
        });
      }
    }
    tx.oncomplete = () => done();
    tx.onerror = () => fail(tx.error);
    tx.onabort = () => fail(tx.error);
  });
  db.close();
  const chunks = segments.reduce((sum, s) => sum + s.chunkCount + s.webcamChunkCount, 0);
  return {
    sessionId,
    chunks,
    bytes: chunks * CHUNK_BYTES,
    totalDurationMs: segments.reduce((sum, s) => sum + s.duration, 0),
  };
}

/**
 * The `chrome` stub the popup page needs to mount at all — a superset of
 * `installChromeStub` above (tabs/permissions/commands/action), trimmed from
 * the shape `a11y-smoke.mjs` already carries for the same page. Every
 * `chrome.tabs.create` call is recorded on `window.__smokePopup.tabCreates`,
 * which is the one thing this file's popup step reads back.
 */
function installPopupChromeStub(messages) {
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
        const out = keys && typeof keys === 'object' && !Array.isArray(keys) ? { ...keys } : {};
        const list =
          keys == null
            ? [...map.keys()]
            : typeof keys === 'string'
              ? [keys]
              : Array.isArray(keys)
                ? keys
                : Object.keys(keys);
        for (const key of list) if (map.has(key)) out[key] = map.get(key);
        return out;
      },
      async set(items) {
        for (const [k, v] of Object.entries(items)) map.set(k, v);
      },
      async remove(keys) {
        for (const key of Array.isArray(keys) ? keys : [keys]) map.delete(key);
      },
      async getBytesInUse(keys) {
        let bytes = 0;
        for (const key of Array.isArray(keys) ? keys : [keys]) {
          if (map.has(key)) bytes += JSON.stringify(map.get(key)).length;
        }
        return bytes;
      },
    };
  };
  const noop = () => {};
  globalThis.__smokePopup = { tabCreates: [] };
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
    action: {
      setBadgeText: noop,
      setBadgeBackgroundColor: noop,
      getUserSettings: async () => ({ isOnToolbar: true }),
    },
    tabs: {
      create: async (opts) => {
        globalThis.__smokePopup.tabCreates.push(opts);
        return { id: 1 };
      },
      update: async () => ({}),
      query: async () => [{ id: 1, url: 'https://example.com/' }],
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
  const childServer = await serveChild();
  const childBase = `http://localhost:${childServer.address().port}`;
  step(`serving a cross-origin child on ${childBase}`);

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
    // A page-level session — `session` above is the browser-level one
    // `Browser.setDownloadBehavior` needs; `Emulation.setCPUThrottlingRate`
    // is a Page/Target-domain command and lives on this one instead.
    const pageCdp = await page.createCDPSession();
    const crashes = [];
    page.on('pageerror', (err) => crashes.push(String(err)));
    page.on('console', (msg) => {
      if (msg.type() === 'error') console.log(`    console.error: ${msg.text()}`);
    });
    page.on('response', (res) => {
      if (res.status() >= 400)
        console.log(`    http ${res.status()} ${new URL(res.url()).pathname}`);
    });
    // Bridges a real download's completion back into the page's fake
    // `chrome.downloads.onChanged` — the only way `saveExport` (which now
    // owns the save) ever resolves for `smoke.downloadMode === 'real'`. Only
    // fires on `completed`; a 'canceled'/`interrupted` browser-level download
    // is exercised via `downloadMode: 'stub'` instead (see installChromeStub).
    session.on('Browser.downloadProgress', (evt) => {
      if (evt.state !== 'completed') return;
      page
        .evaluate(() => {
          const id = window.__smoke.lastDownloadId;
          if (id === window.__smoke.__firedForId) return;
          window.__smoke.__firedForId = id;
          window.__smoke.fireDownloadChanged({ id, state: { current: 'complete' } });
        })
        .catch(() => {});
    });
    await page.evaluateOnNewDocument(installChromeStub, messages);
    step('chrome stub installed');

    step('opening the empty session list');
    await page.goto(base + PAGE, { waitUntil: 'load' });
    await page.waitForSelector('.rec-empty', { timeout: 15_000 });
    const empty = await page.$eval('.rec-empty', (el) => el.textContent?.trim());
    assert(empty === messages.recorderEmpty.message, `empty list shows recorderEmpty ("${empty}")`);

    step('the editor shows a determinate loading state while its chunks load');
    // The real 2 s fixture below loads too fast to ever be seen loading, even
    // throttled — this fixture exists only to give that window something
    // real to measure.
    const many = await page.evaluate(seedManyChunksSession);
    assert(many.chunks === 320, `fixture has ${many.chunks} chunks across two segments`);
    await pageCdp.send('Emulation.setCPUThrottlingRate', { rate: 20 });
    await page.goto(`${base}${PAGE}?session=${many.sessionId}`, { waitUntil: 'load' });
    const editorReadings = await pollUntilGone(
      page,
      () => {
        const el = document.querySelector('.rec-session-loading [role="progressbar"]');
        if (!el) return null;
        return {
          now: el.getAttribute('aria-valuenow'),
          max: el.getAttribute('aria-valuemax'),
          text: el.getAttribute('aria-valuetext'),
        };
      },
      { timeoutMs: 10_000 },
    );
    await pageCdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    // `max` is null (indeterminate — no aria-valuenow at all) until the
    // chunk count resolves, then fixed for the rest of the load — the two
    // readings this splits into are session-load.ts's "total not known yet"
    // and "total known, reading chunk N of it" phases.
    const indeterminate = editorReadings.filter((r) => r.max === null);
    const determinate = editorReadings.filter((r) => r.max !== null);
    assert(
      indeterminate.length >= 1,
      `saw the total-not-yet-known phase at least once (${indeterminate.length} reading(s))`,
    );
    assert(
      determinate.length >= 2,
      `captured ${determinate.length} determinate reading(s) once the total was known: ` +
        JSON.stringify(determinate.slice(0, 3)),
    );
    assert(
      determinate.every((r) => r.max === String(many.chunks)),
      `every determinate reading already carried the full total (${many.chunks}) up front, first: ` +
        JSON.stringify(determinate[0]),
    );
    const editorNows = determinate.map((r) => Number(r.now));
    assert(
      editorNows.some((n, i) => i > 0 && n > editorNows[i - 1]),
      `aria-valuenow advanced across readings (${editorNows.join(',')})`,
    );
    assert(
      determinate.every((r) => r.text === `${Math.round((Number(r.now) / many.chunks) * 100)}%`),
      'aria-valuetext mirrors the percentage aria-valuenow/aria-valuemax already say',
    );
    await page.waitForSelector('.rec-timeline.timeline', { timeout: 20_000 });
    assert(true, 'and the editor renders once the load finishes');

    step('the session list shows a busy loading state, then real row fields');
    await pageCdp.send('Emulation.setCPUThrottlingRate', { rate: 20 });
    await page.goto(base + PAGE, { waitUntil: 'load' });
    const listReadings = await pollUntilGone(
      page,
      () => {
        const list = document.querySelector('.rec-list');
        if (!list || list.getAttribute('aria-busy') !== 'true') return null;
        const status = list.querySelector('[role="status"]');
        return { statusText: status ? status.textContent.trim() : null };
      },
      { timeoutMs: 10_000 },
    );
    await pageCdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    assert(
      listReadings.length >= 1,
      `captured ${listReadings.length} busy reading(s) before the rows loaded`,
    );
    assert(
      listReadings[0].statusText === messages.recorderLoadingList.message,
      `the busy region announces itself via role="status" ("${listReadings[0].statusText}")`,
    );
    await page.waitForSelector(`.rec-row[data-session-id="${many.sessionId}"]`, {
      timeout: 15_000,
    });
    const rowMeta = await page.$eval(
      `.rec-row[data-session-id="${many.sessionId}"] .rec-row-meta`,
      (el) => el.textContent?.trim(),
    );
    const middot = '·';
    // Both mic and webcam were requested and the combined stream has
    // evidence (segment 0's 20 'webcam'-kind chunks), which can only be
    // hedged as "requested" — it cannot say which of the two tracks that
    // evidence actually is (trackStatuses, session-load.ts). Tab audio has
    // no such ambiguity and renders plain.
    const hedge = (label) => messages.recorderTrackRequested.message.replace('$TRACK$', label);
    const expectedMeta = [
      '2',
      '2:15', // 90_000 + 45_000 ms, formatTimer
      formatBytesForTest(many.bytes),
      messages.recorderSourceTab.message,
      [
        hedge(messages.recMic.message),
        messages.recTabAudio.message,
        hedge(messages.recWebcam.message),
      ].join(', '),
    ].join(` ${middot} `);
    assert(
      rowMeta === expectedMeta,
      `row hedges mic/webcam as requested rather than asserting them ("${rowMeta}")`,
    );

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

    step('undo and redo the timeline, and carry the stack through a reload');
    const blockCount = () => page.evaluate(() => document.querySelectorAll('.rec-tl-zoom').length);
    const waitForBlocks = (n) =>
      page.waitForFunction(
        (want) => document.querySelectorAll('.rec-tl-zoom').length === want,
        { timeout: 5000 },
        n,
      );
    const historyState = () =>
      page.evaluate(() => ({
        undoDisabled: document.querySelector('.rec-undo-btn')?.disabled ?? null,
        redoDisabled: document.querySelector('.rec-redo-btn')?.disabled ?? null,
        announced: document.querySelector('.sr-only[role="status"]')?.textContent?.trim() ?? null,
      }));
    // A real chord, not a synthetic KeyboardEvent: the handler reads
    // ctrlKey/shiftKey off the event the browser itself built.
    const chord = async (shift) => {
      await page.keyboard.down('Control');
      if (shift) await page.keyboard.down('Shift');
      await page.keyboard.press('KeyZ');
      if (shift) await page.keyboard.up('Shift');
      await page.keyboard.up('Control');
    };
    const zoomPhrase = (n) =>
      n === 1
        ? messages.recorderZoomBlockOne.message
        : messages.recorderZoomBlockMany.message.replace(/\$COUNT\$/i, String(n));
    const announcementFor = (key, n) => messages[key].message.replace(/\$BLOCKS\$/i, zoomPhrase(n));
    const announcementNaming = (key, labelKey) =>
      messages[key].message.replace(/\$BLOCKS\$/i, messages[labelKey].message);

    const fresh = await historyState();
    assert(
      fresh.undoDisabled === true && fresh.redoDisabled === true,
      'undo and redo start disabled — the auto zoom is not a step the user took',
    );

    // Seven of the eight editable fields are not zoom blocks, and an undo of
    // one has to say so: the live region is the only feedback a screen-reader
    // user gets for a step. The ripple switch is the cheapest of the seven to
    // drive, and it leaves the draft where it found it.
    await page.click('.rail-section input.switch');
    await page.waitForFunction(
      () => document.querySelector('.rail-section input.switch')?.checked === false,
      { timeout: 5000 },
    );
    await chord(false);
    await page.waitForFunction(
      () => document.querySelector('.rail-section input.switch')?.checked === true,
      { timeout: 5000 },
    );
    const afterSwitchUndo = await historyState();
    assert(true, 'Ctrl+Z puts the click-ripple switch back');
    assert(
      afterSwitchUndo.announced === announcementNaming('recorderUndoAnnounce', 'recorderRipple'),
      `a non-zoom undo names the control it took back ("${afterSwitchUndo.announced}")`,
    );

    await page.click('.rec-tl-zoom');
    await page.waitForSelector('.rec-zoom-delete', { timeout: 5000 });

    // Re-picking the scale already in force rebuilds the block without moving
    // a value in it. That is not a step, so the redo the switch's undo armed
    // must still be there — a banked step would have dropped it.
    await page.click('.rec-seg-btn[aria-pressed="true"]');
    const afterNoOp = await historyState();
    assert(
      afterNoOp.redoDisabled === false,
      're-picking the zoom scale already in force banked no step, so its redo survived',
    );

    // Deleting the only zoom block is the edit the removed `Regenerate auto
    // zoom` button used to be the sole (dishonest) escape from.
    await page.click('.rec-zoom-delete');
    await waitForBlocks(0);
    assert(true, 'deleting the selected zoom block empties the zoom track');

    await chord(false);
    await waitForBlocks(1);
    const afterUndo = await historyState();
    assert(true, 'Ctrl+Z puts the deleted zoom block back');
    assert(
      afterUndo.announced === announcementFor('recorderUndoAnnounce', 1),
      `the undo is announced as "${afterUndo.announced}"`,
    );
    assert(afterUndo.redoDisabled === false, 'an undo arms redo');

    await chord(true);
    await waitForBlocks(0);
    const afterRedo = await historyState();
    assert(true, 'Ctrl+Shift+Z takes the block away again');
    assert(
      afterRedo.announced === announcementFor('recorderRedoAnnounce', 0),
      `the redo is announced as "${afterRedo.announced}"`,
    );

    // The draft lands RECORDER_DRAFT_DEBOUNCE_MS after the last edit; poll
    // the record itself rather than sleep past a number this file would then
    // have to keep in sync.
    let saved = null;
    for (const deadline = Date.now() + 10_000; Date.now() < deadline;) {
      saved = await page.evaluate(savedHistory, seeded.sessionId);
      if (saved && saved.past > 0) break;
      await new Promise((done) => setTimeout(done, 100));
    }
    assert(
      saved?.past === 1 && saved?.future === 0,
      `the saved draft carries the stack (past ${saved?.past}, future ${saved?.future})`,
    );

    await page.goto(`${base}${PAGE}?session=${seeded.sessionId}`, { waitUntil: 'load' });
    await page.waitForSelector('.rec-timeline.timeline', { timeout: 15_000 });
    const restored = await blockCount();
    assert(restored === 0, `the reloaded session shows the edited timeline (${restored} block(s))`);
    const restoredState = await historyState();
    assert(restoredState.undoDisabled === false, 'undo survived the reload');
    await chord(false);
    await waitForBlocks(1);
    assert(true, 'undo against the restored draft puts the deleted block back');

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

    // Mid-export UI, read out of the live DOM while the render is still
    // running (the fixture's ~2.1s source, played at 1x) — not described.
    // The remaining-time figure, the tab-visible warning, three of the
    // draft-editing controls Task 36 locks, and the Cancel button's armed
    // two-step (arm, then Escape disarms without aborting).
    await page.waitForSelector('.rec-export-warning', { timeout: 5000 });
    // The placeholder text ("0:00 remaining") is also what the element reads
    // before the first real frame updates it, so waiting for it to move off
    // that placeholder is what proves the figure is actually live — not
    // stuck, not decorative.
    const placeholder = messages.recorderExportRemaining.message.replace('$TIME$', '0:00');
    await page.waitForFunction(
      (ph) => document.querySelector('.rec-export-remaining')?.textContent !== ph,
      { timeout: 1800 },
      placeholder,
    );
    const mid = await page.evaluate(() => {
      const inertOf = (el) => el?.closest('.rail-section')?.inert ?? null;
      return {
        remainingText: document.querySelector('.rec-export-remaining')?.textContent ?? null,
        warningText: document.querySelector('.rec-export-warning')?.textContent ?? null,
        cancelLabel: document.querySelector('.rec-cancel-btn')?.textContent?.trim() ?? null,
        trimAriaDisabled: document.querySelector('.rec-tl-handle')?.getAttribute('aria-disabled'),
        redoDisabled: document.querySelector('.rec-redo-btn')?.disabled ?? null,
        addZoomLocked: inertOf(document.querySelector('.rail-section .btn-secondary')),
        rippleLocked: inertOf(document.querySelector('.rail-section input.switch')),
        beautifyLocked: inertOf(document.querySelector('.swatches')),
      };
    });
    assert(
      /^\d+:\d{2} .+/.test(mid.remainingText ?? '') && mid.remainingText !== placeholder,
      `remaining time reads "${mid.remainingText}"`,
    );
    assert(
      mid.warningText === messages.recorderExportStayVisible.message,
      `stay-visible warning reads "${mid.warningText}"`,
    );
    assert(
      mid.cancelLabel === messages.recorderCancel.message,
      `cancel button reads "${mid.cancelLabel}"`,
    );
    assert(mid.trimAriaDisabled === 'true', 'a trim handle is aria-disabled during export');
    // The undo it would take back is still on the stack, so this is a real
    // lock rather than an empty one.
    assert(mid.redoDisabled === true, 'the redo button is disabled during export');
    assert(mid.addZoomLocked === true, 'the Add Zoom section is locked (inert)');
    assert(mid.rippleLocked === true, 'the ripple/pointer section is locked (inert)');
    assert(mid.beautifyLocked === true, 'the beautify section is locked (inert)');

    const cancelBtn = await page.$('.rec-cancel-btn');
    await cancelBtn.click();
    const armed = await page.$eval('.rec-cancel-btn', (el) => ({
      armed: el.getAttribute('data-armed'),
      label: el.textContent?.trim(),
    }));
    assert(armed.armed === 'true', 'a first click arms Cancel');
    assert(
      armed.label === messages.recorderCancelConfirm.message,
      `armed cancel reads "${armed.label}"`,
    );
    await page.evaluate(() => {
      document
        .querySelector('.rec-cancel-btn')
        .dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });
    const disarmed = await page.$eval('.rec-cancel-btn', (el) => el.getAttribute('data-armed'));
    assert(disarmed === null, 'Escape disarms Cancel');
    assert(!!(await page.$('.rec-progress')), 'the export is still running — Escape did not abort');

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
    // Not just clicked — actually on disk. This is what a real
    // `Browser.downloadProgress` 'completed' event, bridged back into the
    // page's `chrome.downloads.onChanged`, proves that the anchor click above
    // does not: `saveExport` only resolves 'complete' (and only then does the
    // toast above fire) once Chrome itself reports the file finished writing.
    assert(
      onDisk.length > 0,
      `the real download landed in ${downloads} (${onDisk.length} file(s))`,
    );

    step('cancel, confirmed, discards the render');
    const beforeCancel = await page.evaluate(() => window.__smoke.downloads.length);
    const exportAgain = await page.waitForSelector('.rec-btn-primary', { timeout: 15_000 });
    await exportAgain.click();
    const cancelBtn2 = await page.waitForSelector('.rec-cancel-btn', { timeout: 5000 });
    // The chord has to be locked too, not just the buttons: the redo waiting
    // on the stack would otherwise empty the zoom track mid-render.
    const beforeChord = await blockCount();
    await chord(true);
    const afterChord = await blockCount();
    assert(
      afterChord === beforeChord && beforeChord === 1,
      `the redo chord is inert during an export (${beforeChord} -> ${afterChord} block)`,
    );
    // Two clicks: the first arms, the second — while still armed — confirms.
    await cancelBtn2.click();
    await cancelBtn2.click();
    await page.waitForSelector('.rec-btn-primary', { timeout: 15_000 });
    const afterCancel = await page.evaluate(() => window.__smoke.downloads.length);
    assert(
      afterCancel === beforeCancel,
      `a confirmed cancel produced no download (${beforeCancel} -> ${afterCancel})`,
    );

    step('delete after export only deletes once the download is confirmed complete');
    const deleteReal = await page.evaluate(seedSession);
    await page.goto(`${base}${PAGE}?session=${deleteReal.sessionId}`, { waitUntil: 'load' });
    await page.waitForSelector('.rec-btn-primary', { timeout: 15_000 });
    await page.click('.rail-check input[type="checkbox"]');
    assert(
      await page.evaluate(sessionExists, deleteReal.sessionId),
      'the fresh session exists before its export',
    );
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
    await (await page.$('.rec-btn-primary')).click();
    // `downloadMode` stays 'real' (the default after every fresh navigation),
    // so this is the same live browser download + CDP bridge as above — a
    // second, independent proof that "delete after export" is gated on the
    // same real completion signal, not on `a.click()` having been called.
    await page.waitForFunction(() => window.__smoke.toasts.length > 0, { timeout: 120_000 });
    const deleteRealToast = await page.evaluate(() => window.__smoke.toasts[0]);
    assert(pattern.test(deleteRealToast), `delete-after export toast reads "${deleteRealToast}"`);
    assert(
      !(await page.evaluate(sessionExists, deleteReal.sessionId)),
      'a completed, verified save deletes the session when delete-after is checked',
    );

    step('a save the user cancels keeps delete-after from touching the session');
    const deleteCancel = await page.evaluate(seedSession);
    await page.goto(`${base}${PAGE}?session=${deleteCancel.sessionId}`, { waitUntil: 'load' });
    await page.waitForSelector('.rec-btn-primary', { timeout: 15_000 });
    await page.click('.rail-check input[type="checkbox"]');
    await page.evaluate(() => {
      window.__smoke.toasts = [];
      // No real download in flight for this one — the harness fires
      // `onChanged` itself below, deterministically, rather than racing a
      // real Save-dialog dismissal it cannot drive headlessly.
      window.__smoke.downloadMode = 'stub';
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
    await (await page.$('.rec-btn-primary')).click();
    await page.waitForFunction(() => window.__smoke.lastDownloadId !== null, { timeout: 15_000 });
    await page.evaluate(() => {
      window.__smoke.fireDownloadChanged({
        id: window.__smoke.lastDownloadId,
        state: { current: 'interrupted' },
        error: { current: 'USER_CANCELED' },
      });
    });
    await page.waitForFunction(() => window.__smoke.toasts.length > 0, { timeout: 15_000 });
    const cancelToast = await page.evaluate(() => window.__smoke.toasts[0]);
    assert(
      cancelToast === messages.recorderSaveCancelled.message,
      `a dismissed Save dialog's toast reads "${cancelToast}"`,
    );
    assert(
      await page.evaluate(sessionExists, deleteCancel.sessionId),
      'a cancelled save with delete-after checked keeps the session (defect 9)',
    );

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

    /** Live computed `background-color` of a shadow-internal node, by
     *  testid — what the paused-dot/grip source-literal tests above cannot
     *  give us: the value the browser actually painted, not the rule text. */
    const computedBackground = async (testid) => {
      const found = await pierced(testid);
      if (!found) return null;
      const { object } = await dom.send('DOM.resolveNode', { backendNodeId: found.id });
      const { result } = await dom.send('Runtime.callFunctionOn', {
        objectId: object.objectId,
        functionDeclaration: 'function() { return getComputedStyle(this).backgroundColor; }',
        returnByValue: true,
      });
      return result.value;
    };

    const mounted = await page.evaluate(async (file) => {
      const mod = await import(`/assets/${file}`);
      // 6 arity is unique to the mount; `isNearBar` also takes 4.
      const mount = Object.values(mod).find((v) => typeof v === 'function' && v.length === 6);
      window.__mount = mount;
      // Mount clean, exactly as a healthy recording does.
      return mount('seg-1', 0, false, { mic: false, tabAudio: true, webcam: false }, false, true);
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
      window.__mount(
        'seg-1',
        4000,
        false,
        { mic: false, tabAudio: true, webcam: false },
        true,
        true,
      ),
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
      window.__mount(
        'seg-1',
        5000,
        false,
        { mic: false, tabAudio: true, webcam: false },
        true,
        true,
      ),
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

    step("the bar's clock anchors once and never runs backwards");
    // Same built module, same closed shadow root, read through CDP. The bar
    // mounts at step 7 of the start and the engine reports in at step 10, so
    // every mount begins in the unanchored state this first call describes.
    const timerText = async () => {
      const node = await pierced('rec-overlay-timer');
      return node?.html.replace(/<[^>]*>/g, '').trim();
    };
    const sync = (elapsed, anchored) =>
      page.evaluate(
        (args) =>
          window.__mount(
            'seg-1',
            args[0],
            false,
            { mic: false, tabAudio: true, webcam: false },
            false,
            args[1],
          ),
        [elapsed, anchored],
      );

    await page.evaluate(() =>
      window.__mount(
        'seg-1',
        12_000,
        false,
        { mic: false, tabAudio: true, webcam: false },
        false,
        false,
      ),
    );
    const starting = await timerText();
    assert(
      starting === messages.recOverlayStarting.message,
      `an unanchored bar shows no number at all (${starting})`,
    );

    await sync(0, true);
    const anchoredAt = await timerText();
    assert(anchoredAt === '0:00', `the anchor sets the zero (${anchoredAt})`);

    await sync(64_000, true);
    assert((await timerText()) === '1:04', 'and the clock runs from it');

    // A heal computed before the anchor, delivered after it: two
    // executeScript injections have no ordering guarantee between them.
    await sync(1000, true);
    const afterStale = await timerText();
    assert(afterStale === '1:04', `a stale heal cannot move the clock back (${afterStale})`);

    // The same race the other way: an unanchored heal landing after the
    // anchor must not put the bar back to "starting" mid-recording.
    await sync(0, false);
    const afterUnanchored = await timerText();
    assert(afterUnanchored === '1:04', `and cannot un-anchor a running clock (${afterUnanchored})`);
    await page.evaluate(() => window.__ossRecOverlay?.());

    /** The rendered `opacity` of the light-DOM bar host, read directly (not
     *  through CDP pierce — the host itself sits outside the closed shadow
     *  root, in the page's own DOM). */
    const hostOpacity = () =>
      page.evaluate(
        () => document.querySelector('[data-testid="rec-overlay-host"]')?.style.opacity,
      );
    /** `.inert` on the same host — what actually removes Stop/Cancel/Pause
     *  from the tab order and the accessibility tree while hidden. */
    const hostInert = () =>
      page.evaluate(() => document.querySelector('[data-testid="rec-overlay-host"]')?.inert);
    /** Past `OVERLAY_GRACE_MS` with the pointer away from both the bar and
     *  the catcher: the bar's one path to actually being hidden. */
    async function letBarHide() {
      await page.mouse.move(50, 50);
      await new Promise((done) => setTimeout(done, 3400));
    }

    step('the reveal catcher survives a cross-origin iframe over the reveal zone');
    await page.evaluate(() =>
      window.__mount(
        'seg-1',
        0,
        false,
        { mic: false, tabAudio: false, webcam: false },
        false,
        true,
      ),
    );
    await page.evaluate((src) => {
      const iframe = document.createElement('iframe');
      iframe.id = 'oss-smoke-cross-origin';
      iframe.src = src;
      iframe.style.cssText =
        'position:fixed;left:0;right:0;bottom:0;width:100vw;height:200px;border:0;z-index:1000;';
      document.body.appendChild(iframe);
    }, `${childBase}/child.html`);
    await page.waitForSelector('#oss-smoke-cross-origin');
    // The child page is a few bytes of static HTML; a short settle is enough
    // for its own script (the click counter) to have run.
    await new Promise((done) => setTimeout(done, 300));
    const childFrame = page.frames().find((f) => f.url().startsWith(childBase));
    assert(!!childFrame, `the cross-origin iframe loaded (${childFrame?.url()})`);

    await letBarHide();
    assert((await hostOpacity()) === '0', 'bar is hidden before any cross-origin hover');

    // A point inside the classic 400x120 reveal zone (|x - winW/2| <= 200,
    // y >= winH - 120 — see isNearBar), over the iframe, but outside the
    // catcher's own 64x24 footprint: proof the classic zone really is dead
    // there, not just that the catcher happens to cover the whole thing.
    await page.mouse.move(600, 800, { steps: 5 });
    await new Promise((done) => setTimeout(done, 200));
    assert(
      (await hostOpacity()) === '0',
      'hovering the classic zone over the iframe stays dead — mousemove never reaches window',
    );

    const catcherRect = await page.evaluate(() => {
      const r = document
        .querySelector('[data-testid="rec-overlay-catcher"]')
        .getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    });
    await page.mouse.move(catcherRect.x, catcherRect.y, { steps: 5 });
    await new Promise((done) => setTimeout(done, 200));
    assert(
      (await hostOpacity()) === '1',
      'hovering the catcher reveals the bar despite the cross-origin iframe under it',
    );

    step('the catcher costs the page only its own small footprint, not the whole zone');
    await letBarHide();
    const clicksBefore = await childFrame.evaluate(() => window.__clicks ?? 0);
    // A click on the catcher's own patch: intercepted, the iframe sees nothing.
    await page.mouse.click(catcherRect.x, catcherRect.y);
    const clicksAfterCatcher = await childFrame.evaluate(() => window.__clicks ?? 0);
    assert(
      clicksAfterCatcher === clicksBefore,
      `a click on the catcher never reaches the iframe (${clicksBefore} -> ${clicksAfterCatcher})`,
    );
    // The same iframe, a point well outside the catcher: reaches it normally
    // — the cost is the 64x24 patch, not the 400x120 zone around it.
    await page.mouse.click(200, 750);
    const clicksAfterElsewhere = await childFrame.evaluate(() => window.__clicks ?? 0);
    assert(
      clicksAfterElsewhere === clicksBefore + 1,
      `a click just outside the catcher reaches the iframe normally (${clicksBefore} -> ${clicksAfterElsewhere})`,
    );
    await page.evaluate(() => document.querySelector('#oss-smoke-cross-origin')?.remove());

    step('the catcher paints nothing while idle, so it is not burned into every recorded frame');
    // Away from the catcher and blurred — the previous step's last click
    // landed a real button focus, and Chromium does not always resolve
    // :focus-visible away from a stale mouse-click focus without an actual
    // blur, so this clears both inputs the rule reacts to before reading it.
    await page.mouse.move(50, 50);
    await page.evaluate(() => document.activeElement?.blur?.());
    const idleBg = await computedBackground('rec-overlay-catcher-grip');
    assert(
      idleBg === 'rgba(0, 0, 0, 0)',
      `the catcher is transparent at rest, before any hover or focus (${idleBg})`,
    );
    await page.mouse.move(catcherRect.x, catcherRect.y, { steps: 5 });
    const hoveredBg = await computedBackground('rec-overlay-catcher-grip');
    assert(hoveredBg !== 'rgba(0, 0, 0, 0)', `and paints only once hovered (${hoveredBg})`);
    await page.mouse.move(50, 50);

    step('the keyboard command reveals the bar without depending on pointer position');
    await letBarHide();
    assert((await hostOpacity()) === '0', 'bar hidden before the command');
    // Stands in for the worker's chrome.scripting.executeScript injection
    // that handleRevealBar performs on the real 'reveal-recording-bar'
    // command — same window global, same call, no in-page key listener
    // involved (that command is delivered by Chrome at the browser level).
    await page.evaluate(() => window.__ossRecReveal?.());
    assert((await hostOpacity()) === '1', 'the command reveals the bar');

    step(
      'hidden removes Stop, Cancel and Pause from the tab order, and the catcher is the way back in',
    );
    await letBarHide();
    assert((await hostInert()) === true, 'the hidden host is inert');
    await page.evaluate(() => document.body.focus());

    /** Which of our own testid'd elements currently has focus, retargeted
     *  the way `document.activeElement` retargets across a shadow boundary
     *  (both `host` and `catcherHost` are shadow hosts; this is what makes
     *  a focus landing on a button *inside* either one visible from here). */
    const focusedTestid = () =>
      page.evaluate(() => document.activeElement?.getAttribute?.('data-testid') ?? null);
    const tabUntil = async (testid, rounds) => {
      for (let i = 0; i < rounds; i++) {
        await page.keyboard.press('Tab');
        if ((await focusedTestid()) === testid) return true;
      }
      return false;
    };

    // Bounded well short of the catcher: the hidden host must not be a Tab
    // stop at all, not even reachable in a longer walk that happens to pass
    // it — this is deliberately checked before the catcher is ever reached.
    assert(
      !(await tabUntil('rec-overlay-host', 6)),
      'Tab does not land directly on the hidden host',
    );
    assert(await tabUntil('rec-overlay-catcher', 60), 'and instead reaches the focusable catcher');
    assert(
      (await hostInert()) === false,
      'focusing the catcher reveals the bar — no separate reveal call, no pointer involved',
    );
    assert(
      await tabUntil('rec-overlay-host', 3),
      'and the very next stops land inside the now-revealed bar',
    );

    step(
      'focus on Stop survives the grace timer — a keyboard user is never blurred out mid-interaction',
    );
    // One placeholder mount produced by test 20 has kept the previous bar's
    // clock 1:04-ish; this is a fresh scenario, so start clean.
    await page.mouse.move(50, 50); // away from both the classic zone and the catcher — no hover to lean on
    // pauseBtn is the first control after the catcher (mountRecordingOverlay
    // appends pause, then stop, then cancel); one more Tab reaches Stop. The
    // closed shadow root means this is inferred from the append order, not
    // read back directly — see the paused-dot tests' own note on that limit.
    await page.keyboard.press('Tab');
    assert((await focusedTestid()) === 'rec-overlay-host', 'landed inside the bar (on Pause)');
    await page.keyboard.press('Tab'); // -> Stop
    assert((await focusedTestid()) === 'rec-overlay-host', 'and again (on Stop)');
    await new Promise((done) => setTimeout(done, 3400)); // past OVERLAY_GRACE_MS, no hover, focus held only
    assert(
      (await hostOpacity()) === '1',
      'the bar is still shown past the grace window with focus inside it',
    );
    assert(
      (await hostInert()) === false,
      'and the host never went inert under its own focused control',
    );
    assert(
      (await focusedTestid()) === 'rec-overlay-host',
      'focus is still on Stop, not blurred out to <body> by inert flipping underneath it',
    );

    step('a real paused treatment, distinct from recording');
    await page.evaluate(() =>
      window.__mount('seg-1', 0, true, { mic: false, tabAudio: false, webcam: false }, false, true),
    );
    const pausedDot = await pierced('rec-overlay-dot');
    assert(
      pausedDot?.html.includes('class="dot paused"'),
      `the dot carries a distinct paused class, not just a dimmer recording one (${pausedDot?.html})`,
    );

    step('the bubble position persists across navigation, via the mount contract');
    // healOverlay re-mounts fresh on every navigation, handing back whatever
    // it read from storage as this function's 7th argument — this is that
    // argument, exercised on the built mount function directly.
    await page.evaluate(() => window.__ossRecOverlay?.());
    const camPos = () =>
      page.evaluate(() => {
        const el = document.querySelector('[data-testid="rec-overlay-cam"]');
        return { left: el.style.left, top: el.style.top };
      });
    const freshWithPos = await page.evaluate(() =>
      window.__mount(
        'seg-1',
        0,
        false,
        { mic: false, tabAudio: false, webcam: true },
        false,
        true,
        { x: 300, y: 220 },
      ),
    );
    assert(freshWithPos === 'fresh', `mounted fresh with a persisted position (${freshWithPos})`);
    assert(
      (await camPos()).left === '300px' && (await camPos()).top === '220px',
      `the bubble mounts exactly where healOverlay would hand it back (${JSON.stringify(await camPos())})`,
    );

    await page.evaluate(() => window.__ossRecOverlay?.());
    const clampedPos = await page.evaluate(() =>
      window.__mount(
        'seg-1',
        0,
        false,
        { mic: false, tabAudio: false, webcam: true },
        false,
        true,
        { x: 5000, y: -50 },
      ),
    );
    assert(clampedPos === 'fresh', `mounted fresh with an out-of-bounds position (${clampedPos})`);
    assert(
      (await camPos()).left === '1236px' && (await camPos()).top === '0px',
      // 1440 (viewport) - 204 (BUBBLE_PX 180 + HANDLE_PX 12 * 2) = 1236
      `an out-of-bounds persisted position is clamped to this window (${JSON.stringify(await camPos())})`,
    );

    await page.evaluate(() => window.__ossRecOverlay?.());
    await dom.detach();

    step("the popup opens the recorder's session list, not a specific session");
    const popupCrashes = [];
    const popupPage = await browser.newPage();
    popupPage.on('pageerror', (err) => popupCrashes.push(String(err)));
    await popupPage.evaluateOnNewDocument(installPopupChromeStub, messages);
    await popupPage.goto(`${base}/src/popup/index.html`, { waitUntil: 'load' });
    await popupPage.waitForSelector('.footer-row .link-btn', { timeout: 15_000 });
    const recordingsLabel = messages.recRecordings.message;
    const clicked = await popupPage.evaluate((label) => {
      const btn = [...document.querySelectorAll('.footer-row .link-btn')].find(
        (el) => el.textContent?.trim() === label,
      );
      if (!btn) return false;
      btn.click();
      return true;
    }, recordingsLabel);
    assert(clicked, `found a footer link labeled "${recordingsLabel}" beside Reopen last`);
    await popupPage.waitForFunction(() => window.__smokePopup.tabCreates.length > 0, {
      timeout: 15_000,
    });
    const tabCreates = await popupPage.evaluate(() => window.__smokePopup.tabCreates);
    assert(tabCreates.length === 1, `Recordings click called chrome.tabs.create once`);
    const opened = new URL(tabCreates[0].url, base);
    assert(
      opened.pathname === '/src/recorder/index.html',
      `it opens the recorder page (${opened.pathname})`,
    );
    assert(
      !opened.search.includes('session='),
      `with no session param — that's the list route, not a specific session (${opened.search || '(none)'})`,
    );
    assert(popupCrashes.length === 0, `no uncaught popup page errors ${popupCrashes.join('; ')}`);
    await popupPage.close();

    assert(crashes.length === 0, `no uncaught page errors ${crashes.join('; ')}`);
  } finally {
    await browser?.close();
    server.closeAllConnections();
    server.close();
    childServer.closeAllConnections();
    childServer.close();
    await rm(work, { recursive: true, force: true });
  }
  console.log('\nRecorder smoke passed.');
}

main().catch((err) => {
  console.error(`\nRecorder smoke FAILED: ${err.message}`);
  process.exitCode = 1;
});
