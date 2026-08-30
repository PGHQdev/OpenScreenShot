// Headless browser reflow check for all four surfaces (editor, popup,
// recorder, setup): serves the built `dist/`, opens each page at a 320 CSS
// px equivalent width (WCAG 1.4.10) and at a 200%-zoom-equivalent reduced
// viewport, and asserts nothing is clipped or unreachable — the tool rail
// and settings rail scroll instead of clipping, modals scroll and keep their
// keyboard focus trap while scrolled, and no surface that is meant to reflow
// grows a horizontal scrollbar.
// Run with: npm run build && npm run smoke:reflow
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

/**
 * One `chrome` stub shared by all four pages. Combines the storage/i18n
 * shape from recorder-smoke.mjs and setup-smoke.mjs with the extra
 * tabs/permissions/windows surface the popup touches on mount; every method
 * is a harmless no-op or in-memory store, since this script never exercises
 * capture/record/export — only layout.
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
    tabs: {
      create: async () => ({ id: 1 }),
      update: async () => ({}),
      query: async () => [],
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
    title: 'reflow smoke',
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
    }, 1100);
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
      duration: 1000,
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

/** No horizontal scrollbar: the document is never wider than its viewport. */
async function noHorizontalOverflow(page, width) {
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  return { ok: scrollWidth <= width + 1, scrollWidth };
}

async function newPage(browser, messages, seed) {
  const page = await browser.newPage();
  const crashes = [];
  page.on('pageerror', (err) => crashes.push(String(err)));
  page.on('console', (msg) => {
    if (msg.type() === 'error') console.log(`    console.error: ${msg.text()}`);
  });
  await page.evaluateOnNewDocument(installChromeStub, messages, seed);
  return { page, crashes };
}

async function chord(page, mods, key) {
  for (const m of mods) await page.keyboard.down(m);
  await page.keyboard.press(key);
  for (const m of mods.slice().reverse()) await page.keyboard.up(m);
}

// ---------------------------------------------------------------- editor ---
async function testEditor(browser, base, messages) {
  step('EDITOR — opening with a seeded capture');
  const { page, crashes } = await newPage(browser, messages, {
    'openscreenshot:last-capture': await makeCapture(),
  });
  await page.setViewport({ width: 1280, height: 860 });
  await page.goto(`${base}/src/editor/index.html`, { waitUntil: 'networkidle0' });
  await page.waitForSelector('.stage-canvas');
  await new Promise((r) => setTimeout(r, 900)); // controller's initial fit, see editor-keyboard-smoke
  // The Rectangle tool has a style bar (color, stroke, shape); Select does not.
  await page.click('.tool-btn[title^="Rectangle"]');
  await page.waitForSelector('.stylebar');

  step(
    'EDITOR — 1280px width (ordinary desktop): topbar and style bar stay one row, toolbar does not scroll',
  );
  const wideEditor = await page.evaluate(() => {
    const oneRow = (els) => {
      const rects = [...els].map((el) => el.getBoundingClientRect());
      return rects.every((a) => rects.every((b) => a.top < b.bottom && a.bottom > b.top));
    };
    const toolbar = document.querySelector('.toolbar');
    return {
      topbarOneRow: oneRow(document.querySelectorAll('.topbar > *')),
      stylebarOneRow: oneRow(document.querySelectorAll('.stylebar-group')),
      toolbarScrollH: toolbar.scrollHeight,
      toolbarClientH: toolbar.clientHeight,
    };
  });
  assert(wideEditor.topbarOneRow, 'topbar brand, actions and controls share one row at 1280px');
  assert(wideEditor.stylebarOneRow, 'style bar groups share one row at 1280px');
  assert(
    wideEditor.toolbarScrollH === wideEditor.toolbarClientH,
    `toolbar does not need to scroll at 1280px (${wideEditor.toolbarScrollH}px content in ${wideEditor.toolbarClientH}px box)`,
  );

  step('EDITOR — 320px width: no horizontal overflow, all 12 tools present');
  await page.setViewport({ width: 320, height: 800 });
  await new Promise((r) => setTimeout(r, 150));
  const overflow320 = await noHorizontalOverflow(page, 320);
  assert(overflow320.ok, `document.scrollWidth ${overflow320.scrollWidth} <= 320`);
  const toolCount = await page.$$eval('.tool-btn', (els) => els.length);
  assert(toolCount === 12, `toolbar renders all ${toolCount} tools at 320px width`);
  const stylebarWraps = await page.$eval('.stylebar', (el) => el.scrollHeight > 40);
  assert(stylebarWraps, 'stylebar wraps to more than one row rather than clipping horizontally');

  step('EDITOR — 200% zoom equivalent (640x400): toolbar scrolls, all tools reachable');
  await page.setViewport({ width: 640, height: 400 });
  await new Promise((r) => setTimeout(r, 150));
  const toolbarScroll = await page.evaluate(() => {
    const el = document.querySelector('.toolbar');
    return { scrollHeight: el.scrollHeight, clientHeight: el.clientHeight };
  });
  assert(
    toolbarScroll.scrollHeight > toolbarScroll.clientHeight,
    `toolbar needs scroll (${toolbarScroll.scrollHeight}px content in ${toolbarScroll.clientHeight}px box)`,
  );
  const lastToolReachable = await page.evaluate(() => {
    const toolbar = document.querySelector('.toolbar');
    toolbar.scrollTop = toolbar.scrollHeight;
    const last = document.querySelectorAll('.tool-btn');
    const btn = last[last.length - 1];
    const r = btn.getBoundingClientRect();
    const box = toolbar.getBoundingClientRect();
    return r.top >= box.top - 1 && r.bottom <= box.bottom + 1;
  });
  assert(lastToolReachable, 'the last tool (Crop) scrolls into view inside the toolbar');

  step('EDITOR — export modal scrolls and keeps its focus trap while scrolled');
  await chord(page, ['Meta'], 's');
  await page.waitForSelector('.modal', { timeout: 5000 });
  const modalFits = await page.evaluate(() => {
    const m = document.querySelector('.modal');
    const r = m.getBoundingClientRect();
    return { top: r.top, bottom: r.bottom, vh: window.innerHeight };
  });
  assert(
    modalFits.top >= 0 && modalFits.bottom <= modalFits.vh,
    `modal box (${modalFits.top.toFixed(0)}..${modalFits.bottom.toFixed(0)}) stays within the ${modalFits.vh}px viewport, not clipped past its edge`,
  );
  const modalScrolls = await page.evaluate(() => {
    const m = document.querySelector('.modal');
    return m.scrollHeight > m.clientHeight;
  });
  assert(modalScrolls, 'export modal content is taller than its box — it scrolls, not clips');
  // Scroll partway down, then Tab through every focusable control plus a
  // few extra hops; focus must stay inside the modal the whole time (the
  // caution this task calls out: a scrollable modal that leaks Tab into the
  // page behind it).
  const focusableCount = await page.$$eval(
    '.modal button:not(:disabled), .modal input:not(:disabled)',
    (els) => els.length,
  );
  assert(focusableCount >= 5, `export modal has ${focusableCount} focusable controls to cycle`);
  await page.evaluate(() => {
    document.querySelector('.modal').scrollTop = 200;
  });
  let stayedInModal = true;
  for (let i = 0; i < focusableCount + 3; i++) {
    await page.keyboard.press('Tab');
    const inside = await page.evaluate(
      () =>
        !!document.activeElement?.closest?.('.modal') && document.activeElement !== document.body,
    );
    if (!inside) stayedInModal = false;
  }
  assert(stayedInModal, `Tab pressed ${focusableCount + 3} times stayed inside the scrolled modal`);
  await page.keyboard.press('Escape');

  step('EDITOR — shortcut sheet (?) also scrolls and stacks its grid below --bp-sm');
  await page.keyboard.type('?');
  await page.waitForSelector('.sheet', { timeout: 5000 });
  const sheetColumns = await page.evaluate(() => {
    // 640px viewport is above --bp-sm (480px), so this checks the base case.
    return getComputedStyle(document.querySelector('.sheet-grid')).gridTemplateColumns.split(' ')
      .length;
  });
  assert(sheetColumns === 2, `shortcut sheet grid has ${sheetColumns} columns above --bp-sm`);
  await page.setViewport({ width: 320, height: 400 });
  await new Promise((r) => setTimeout(r, 150));
  const sheetColumnsNarrow = await page.evaluate(
    () =>
      getComputedStyle(document.querySelector('.sheet-grid')).gridTemplateColumns.split(' ').length,
  );
  assert(
    sheetColumnsNarrow === 1,
    `shortcut sheet grid stacks to ${sheetColumnsNarrow} column below --bp-sm`,
  );
  const sheetFits = await page.evaluate(() => {
    const m = document.querySelector('.modal');
    const r = m.getBoundingClientRect();
    return r.top >= 0 && r.bottom <= window.innerHeight;
  });
  assert(sheetFits, 'shortcut sheet stays within the 320x400 viewport, not clipped past its edge');
  await page.keyboard.press('Escape');

  assert(crashes.length === 0, `no uncaught page errors ${crashes.join('; ')}`);
  await page.close();
}

// ----------------------------------------------------------------- popup ---
async function testPopup(browser, base, messages) {
  step('POPUP — opening (mode-card view)');
  const { page, crashes } = await newPage(browser, messages, {});
  // The popup's width is fixed at 340px by design — it is a browser-drawn
  // menu, not a navigable page, and its width does not track the viewport
  // the way a tab's does. There is no width breakpoint for it; the check
  // here is that a short viewport (its 200%-zoom equivalent) never clips or
  // strands content, which relies on the page's own vertical scroll, not on
  // any layout that reflows by width.
  await page.setViewport({ width: 340, height: 260 });
  await page.goto(`${base}/src/popup/index.html`, { waitUntil: 'networkidle0' });
  await page.waitForSelector('.mode-card');
  const width340 = await page.evaluate(() => document.documentElement.scrollWidth);
  console.log(
    `    note: popup content is ${width340}px wide at a 340px viewport (fixed by design)`,
  );

  step('POPUP — 200% zoom equivalent (340x260): every mode card and the footer reach via scroll');
  const bodyScrolls = await page.evaluate(
    () => document.documentElement.scrollHeight > window.innerHeight,
  );
  assert(bodyScrolls, 'popup content is taller than the short viewport — the document scrolls');
  const footerReachable = await page.evaluate(() => {
    const footer = document.querySelector('.footer-row, .kofi-link, .link-btn');
    if (!footer) return false;
    footer.scrollIntoView();
    const r = footer.getBoundingClientRect();
    return r.top >= -1 && r.bottom <= window.innerHeight + 1;
  });
  assert(footerReachable, 'the last footer control scrolls into view');

  step('POPUP — settings view scrolls at a short viewport too');
  await page.click('.icon-btn[aria-label]');
  await page.waitForSelector('.settings');
  const settingsRows = await page.$$eval('.settings-row', (els) => els.length);
  assert(settingsRows > 0, `settings view renders ${settingsRows} rows`);
  const settingsReachable = await page.evaluate(() => {
    const rows = document.querySelectorAll('.settings-row');
    const last = rows[rows.length - 1];
    last.scrollIntoView();
    const r = last.getBoundingClientRect();
    return r.top >= -1 && r.bottom <= window.innerHeight + 1;
  });
  assert(settingsReachable, 'the last settings row scrolls into view at 340x260');

  assert(crashes.length === 0, `no uncaught page errors ${crashes.join('; ')}`);
  await page.close();
}

// --------------------------------------------------------------- recorder ---
async function testRecorder(browser, base, messages) {
  step('RECORDER — seeding a fixture session');
  const { page, crashes } = await newPage(browser, messages, {});
  await page.setViewport({ width: 1280, height: 860 });
  await page.goto(`${base}/src/recorder/index.html`, { waitUntil: 'load' });
  await page.waitForSelector('.rec-empty', { timeout: 15_000 });
  const sessionId = await page.evaluate(seedRecorderSession);
  await page.goto(`${base}/src/recorder/index.html?session=${sessionId}`, { waitUntil: 'load' });
  await page.waitForSelector('.rail', { timeout: 15_000 });

  step('RECORDER — 1280px width (ordinary desktop): rail stays beside the stage at full height');
  const wideRecorder = await page.evaluate(() => {
    const direction = getComputedStyle(document.querySelector('.rec-session')).flexDirection;
    const session = document.querySelector('.rec-session').getBoundingClientRect();
    const rail = document.querySelector('.rail').getBoundingClientRect();
    return { direction, sessionHeight: session.height, railHeight: rail.height };
  });
  assert(
    wideRecorder.direction === 'row',
    `.rec-session is flex-direction: ${wideRecorder.direction} at 1280px`,
  );
  assert(
    Math.abs(wideRecorder.railHeight - wideRecorder.sessionHeight) <= 1,
    `rail (${wideRecorder.railHeight.toFixed(0)}px) stretches to the session's full height (${wideRecorder.sessionHeight.toFixed(0)}px)`,
  );

  step('RECORDER — 320px width: rail stacks below the stage, no horizontal overflow');
  await page.setViewport({ width: 320, height: 900 });
  await new Promise((r) => setTimeout(r, 150));
  const overflow320 = await noHorizontalOverflow(page, 320);
  assert(overflow320.ok, `document.scrollWidth ${overflow320.scrollWidth} <= 320`);
  const stacked = await page.evaluate(
    () => getComputedStyle(document.querySelector('.rec-session')).flexDirection,
  );
  assert(stacked === 'column', `.rec-session is flex-direction: ${stacked} below --bp-md`);
  const railWidth = await page.evaluate(() => document.querySelector('.rail').clientWidth);
  assert(railWidth <= 320, `stacked rail is ${railWidth}px wide, at or under the viewport`);

  // Task 39 shrank the rail (Beautify's twelve controls collapsed behind one
  // popover, Add Zoom moved to the timeline), so 380px of height no longer
  // forces a scroll — 260px, the same "200%-zoom-shaped" height the popup
  // case above uses, still does.
  step('RECORDER — wide but short (900x260, a 200%-zoom-shaped viewport): rail scrolls');
  await page.setViewport({ width: 900, height: 260 });
  await new Promise((r) => setTimeout(r, 150));
  const sideBySide = await page.evaluate(
    () => getComputedStyle(document.querySelector('.rec-session')).flexDirection,
  );
  assert(sideBySide === 'row', `.rec-session stays side-by-side (${sideBySide}) above --bp-md`);
  const railScroll = await page.evaluate(() => {
    const el = document.querySelector('.rail');
    return { scrollHeight: el.scrollHeight, clientHeight: el.clientHeight };
  });
  assert(
    railScroll.scrollHeight > railScroll.clientHeight,
    `rail needs scroll (${railScroll.scrollHeight}px content in ${railScroll.clientHeight}px box)`,
  );
  const exportReachable = await page.evaluate(() => {
    const rail = document.querySelector('.rail');
    const btn = document.querySelector('.rail .rec-btn-primary, .rail .rail-export');
    if (!btn) return false;
    rail.scrollTop = rail.scrollHeight;
    const r = btn.getBoundingClientRect();
    const box = rail.getBoundingClientRect();
    return r.bottom <= box.bottom + 1;
  });
  assert(exportReachable, 'the export control scrolls into view inside the rail');

  assert(crashes.length === 0, `no uncaught page errors ${crashes.join('; ')}`);
  await page.close();
}

// ------------------------------------------------------------------ setup ---
async function testSetup(browser, base, messages) {
  step('SETUP — opening the permission checklist');
  const { page, crashes } = await newPage(browser, messages, {});
  await page.setViewport({ width: 1280, height: 860 });
  await page.goto(`${base}/src/setup/index.html?from=record`, { waitUntil: 'networkidle0' });
  await page.waitForSelector('[data-testid="row-tabcapture"]');
  const wideRow = await page.evaluate(
    () => getComputedStyle(document.querySelector('.row')).flexDirection,
  );
  assert(wideRow === 'row', `a permission row lays out side-by-side (${wideRow}) at 1280px`);

  step('SETUP — 320px width: the checklist reflows without horizontal overflow');
  await page.setViewport({ width: 320, height: 800 });
  await new Promise((r) => setTimeout(r, 150));
  const overflow320 = await noHorizontalOverflow(page, 320);
  assert(overflow320.ok, `document.scrollWidth ${overflow320.scrollWidth} <= 320`);
  const wrapped = await page.evaluate(() => {
    const pills = [...document.querySelectorAll('[data-testid="trust-strip"] .trust-pill')];
    return new Set(pills.map((el) => el.getBoundingClientRect().top)).size;
  });
  assert(wrapped > 1, `the trust strip wraps onto ${wrapped} lines rather than overflowing`);

  step('SETUP — 200% zoom equivalent (640x400): the last row reaches via document scroll');
  await page.setViewport({ width: 640, height: 400 });
  await new Promise((r) => setTimeout(r, 150));
  const lastReachable = await page.evaluate(() => {
    const rows = document.querySelectorAll('.setup-rows .row');
    const last = rows[rows.length - 1];
    last.scrollIntoView();
    const r = last.getBoundingClientRect();
    return r.top >= -1 && r.bottom <= window.innerHeight + 1;
  });
  assert(lastReachable, 'the last permission row scrolls into view at 640x400');

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
  const work = await mkdtemp(join(tmpdir(), 'oss-reflow-smoke-'));
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
    await testPopup(browser, base, messages);
    await testRecorder(browser, base, messages);
    await testSetup(browser, base, messages);
  } finally {
    await browser?.close();
    server.closeAllConnections();
    server.close();
    await rm(work, { recursive: true, force: true });
  }
  console.log('\nReflow smoke passed.');
}

main().catch((err) => {
  console.error(`\nReflow smoke FAILED: ${err.message}`);
  process.exitCode = 1;
});
