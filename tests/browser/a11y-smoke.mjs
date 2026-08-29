// Headless browser accessibility smoke: serves the built `dist/`, drives
// each of the four surfaces (editor, popup, recorder, setup) into a
// populated, interactive state — including the transient dialogs and menus
// Tasks 18 and 19 fixed — and runs axe-core against each state.
//
// A scan of an empty or loading page passes trivially and proves nothing, so
// every state scanned here seeds real content first (a capture, a recorded
// session, past onboarding) and prints an element count alongside the axe
// result, so a reader can tell a real scan from a scan of an empty page.
//
// Zero violations at critical/serious fail the run, unless the exact
// (rule id, selector) pair is on the ALLOWLIST below (printed on every run,
// each entry naming the task that owns the gap). Moderate violations are
// printed but never fail.
// Run with: npm run build && npm run smoke:a11y
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
const AXE_PATH = createRequire(import.meta.url).resolve('axe-core/axe.min.js');

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

// Every entry names the task that owns the gap and matches by axe rule id
// PLUS selector IDENTITY, via matchesAllowlistedSelector() below — never a
// raw substring and never the rule id alone — so a color-contrast failure on
// some other, unrelated element still fails the run instead of being
// swallowed by a blanket allow. (An earlier version of this file used
// `target.includes(a.selector)`, a plain substring test: a class like
// `.status-hint-mut` silently inherited the `.status-hint` entry. Fixed —
// see matchesAllowlistedSelector's own comment.) Printed on every run (see
// main()) so it cannot grow silently.
//
// Empty on purpose. task-45 raised --text-2 and --text-3 (tokens.css) so
// every real call site clears 4.5:1: `.status-hint`, `.settings-section`,
// `.token-label`, `.settings-hint` and `.rec-tl-tick` (--text-3 on
// --surface-1, was 2.21:1 light / 2.84:1 dark) and `.tag-optional`
// (--text-2 on --surface-3, was 4.26:1 light / 3.95:1 dark).
//
// Four more call sites painted --text-3 on a surface it was never meant to
// clear; each moved to a different token instead of widening --text-3's
// floor to cover it too (that would have pushed --text-3 close enough to
// --text-2 to erase the muted tier everywhere else it is used — see
// tokens.css's --text-3 doc comment and task-45-report.md):
//   - `.empty-fallback` / `.empty-alt` (editor.css) sit on --stage-bg — now
//     take --text-1, the same exception `.overlay-msg` already used.
//   - `.kbd-os` (popup.css) sits on --surface-2 once its own --surface-3
//     background goes transparent — now takes --text-2.
//   - `.zoom-item kbd` (editor.css) sits on --surface-1, but this smoke's
//     own ZoomMenu step hovers `.zoom-item` before scanning (see below),
//     which swaps in --hover-overlay and darkens that --surface-1 enough to
//     drop --text-3 back under 4.5:1 even though it clears the surface at
//     rest — now takes --text-2, matching the other <kbd> elements in the
//     file (.mode-card kbd, .sheet-row kbd).
// Full matrix and before/after ratios: task-45-report.md.
//
// (`.zoom-readout` was never on this list: it only fails when the mouse
// rests on the ZoomMenu trigger, pushing `:hover`'s --surface-3 background
// under its --text-2 — not a persistent failure, and now passes anyway
// since --text-2 on --surface-3 clears 4.5:1 post-task-45.)
const ALLOWLIST = [];

/**
 * True if `target` (axe's CSS-selector string for a violating node, e.g.
 * `.zoom-item[role="menuitem"]:nth-child(1) > kbd`) contains `selector` as a
 * whole class/id token, not merely as a substring. A prior version of this
 * file used `target.includes(selector)`; a class name that happens to start
 * with an allowlisted one — `.status-hint-mut`, unrelated in every way but
 * its first eleven characters — silently inherited that entry and passed a
 * real, new violation. The negative control for this fix is in
 * task-20-report.md.
 *
 * `selector` always starts with a literal `.` in this file's usage, so the
 * only place a false match can occur is the token continuing to the RIGHT
 * (`.status-hint` inside `.status-hint-mut`) — a CSS class selector string
 * can't accidentally grow a matching `.selector` substring to its LEFT
 * without an actual `.` character present at that boundary, which already
 * makes it a real, separate class on the same element (a legitimate
 * compound match, e.g. `.a.status-hint`). So this only guards the right
 * edge: the match must not be immediately followed by another
 * class/id-name character (word char or hyphen).
 */
export function matchesAllowlistedSelector(target, selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`${escaped}(?![\\w-])`).test(target);
}

function allowlistEntryFor(id, target) {
  return ALLOWLIST.find((a) => a.id === id && matchesAllowlistedSelector(target, a.selector));
}

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
 * One `chrome` stub shared by all four pages, per reflow-smoke.mjs: the
 * storage/i18n shape from recorder-smoke.mjs and setup-smoke.mjs plus the
 * tabs/permissions/windows surface the popup and setup pages touch on mount.
 * `permissions.contains` answers from `grants` — true for everything by
 * default, so the setup page's checklist renders already-granted (its "ready"
 * state) without needing a click; a page that wants the popup's
 * permission-ask surface passes the list it is missing instead.
 */
function installChromeStub(messages, seed, grants) {
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
  globalThis.__smoke = { downloads: [] };
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
    downloads: {
      download: async (opts) => {
        globalThis.__smoke.downloads.push(opts);
        return 1;
      },
    },
    tabs: {
      create: async () => ({ id: 1 }),
      update: async () => ({}),
      query: async () => [],
      getCurrent: (cb) => cb?.({ id: 1 }),
      remove: noop,
    },
    windows: { update: async () => ({}) },
    commands: { getAll: async () => [] },
    permissions: {
      contains: async (query) =>
        grants == null || (query.permissions ?? []).every((p) => grants.includes(p)),
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
    title: 'a11y smoke',
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
    tx.objectStore('events').put({
      segmentId,
      seq: 0,
      events: [
        { kind: 'click', t: 300, x: 160, y: 90 },
        { kind: 'click', t: 700, x: 224, y: 180 },
      ],
    });
    tx.oncomplete = () => done();
    tx.onerror = () => fail(tx.error);
    tx.onabort = () => fail(tx.error);
  });
  db.close();
  return sessionId;
}

async function newPage(browser, messages, seed, grants) {
  const page = await browser.newPage();
  // Forced once here so every scan below inherits a known state instead of
  // this machine's real OS accessibility setting — the four settle() waits
  // before an entrance-animated surface is scanned (the export dialog,
  // Beautify popover, ZoomMenu, shortcut sheet) exist to let a real,
  // non-collapsed entrance animation finish before axe reads computed
  // colour; on a machine with reduced motion on, those waits were no-ops
  // and the animation was already collapsed to nothing, so they proved
  // nothing about the real (non-reduced) path. This file does not test
  // reduced-motion behaviour itself — that is media-a11y-smoke.mjs's job —
  // so there is no opt-in case to preserve here.
  const cdp = await page.createCDPSession();
  await cdp.send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }],
  });
  const crashes = [];
  page.on('pageerror', (err) => crashes.push(String(err)));
  page.on('console', (msg) => {
    if (msg.type() === 'error') console.log(`    console.error: ${msg.text()}`);
  });
  await page.evaluateOnNewDocument(installChromeStub, messages, seed, grants);
  return { page, crashes };
}

async function chord(page, mods, key) {
  for (const m of mods) await page.keyboard.down(m);
  await page.keyboard.press(key);
  for (const m of mods.slice().reverse()) await page.keyboard.up(m);
}

/**
 * A beat to let Preact flush effects, which commit a frame after the DOM
 * does (documented in editor-keyboard-smoke.mjs). ZoomMenu's and
 * BeautifyMenu's window-level capture-phase keydown listeners are torn down
 * from their effect cleanup, so a key aimed elsewhere right after closing
 * one can still be swallowed by a listener that is DOM-invisible but not
 * yet unregistered. Same workaround editor-keyboard-smoke.mjs uses.
 */
function settle(ms = 150) {
  return new Promise((r) => setTimeout(r, ms));
}

const totals = { critical: 0, serious: 0, moderate: 0, minor: 0, allowlisted: 0 };
// Collected across every surface and asserted once at the end of main(), so
// one surface's failure does not hide what the remaining surfaces found.
const failures = [];

/**
 * Injects axe-core (the page carries no MV3 CSP here — it is served over
 * plain HTTP, not loaded as an extension), runs it against the current
 * document, and prints the DOM element / interactive control count so the
 * reader can see the state scanned was populated, not empty.
 */
async function scan(page, label) {
  await page.addScriptTag({ path: AXE_PATH });
  const stats = await page.evaluate(() => ({
    elements: document.querySelectorAll('*').length,
    controls: document.querySelectorAll(
      'button, input, select, textarea, a[href], [role="button"], [role="menuitem"], [role="tab"], [role="slider"], [role="dialog"], [role="menu"]',
    ).length,
  }));
  assert(
    stats.elements > 20 && stats.controls > 0,
    `${label}: ${stats.elements} DOM elements, ${stats.controls} interactive controls (populated, not empty)`,
  );

  const violations = await page.evaluate(async () => {
    const result = await window.axe.run(document, { resultTypes: ['violations'] });
    return result.violations.map((v) => ({
      id: v.id,
      impact: v.impact ?? 'minor',
      help: v.help,
      nodes: v.nodes.map((n) => n.target.join(' ')),
    }));
  });

  let unallowedCount = 0;
  let moderateCount = 0;
  for (const v of violations) {
    if (v.impact === 'critical' || v.impact === 'serious') {
      const allowedNodes = [];
      const unallowedNodes = [];
      for (const target of v.nodes) {
        const entry = allowlistEntryFor(v.id, target);
        if (entry) allowedNodes.push({ target, entry });
        else unallowedNodes.push(target);
      }
      totals[v.impact] += unallowedNodes.length;
      totals.allowlisted += allowedNodes.length;
      unallowedCount += unallowedNodes.length;
      for (const { target, entry } of allowedNodes) {
        console.log(
          `    ALLOWLISTED [${v.impact}] ${v.id} (${entry.task}): ${entry.note} — ${target}`,
        );
      }
      if (unallowedNodes.length > 0) {
        console.log(`    VIOLATION [${v.impact}] ${v.id}: ${v.help}`);
        console.log(`      nodes: ${unallowedNodes.join(', ')}`);
      }
    } else {
      totals[v.impact] += v.nodes.length;
      moderateCount += v.nodes.length;
      console.log(`    moderate/minor [${v.impact}] ${v.id}: ${v.help} — ${v.nodes.join(', ')}`);
    }
  }

  if (unallowedCount > 0) {
    failures.push(`${label}: ${unallowedCount} unallowed critical/serious violation(s)`);
    console.log(`    FAIL: ${label} has ${unallowedCount} unallowed critical/serious violation(s)`);
  } else {
    console.log(
      `    ok: ${label}: 0 unallowed critical/serious violations (${violations.length} rule(s) flagged, ${moderateCount} moderate/minor node(s))`,
    );
  }
}

// ---------------------------------------------------------------- editor ---
async function testEditor(browser, base, messages) {
  const { page, crashes } = await newPage(browser, messages, {
    'openscreenshot:last-capture': await makeCapture(),
  });
  await page.setViewport({ width: 1280, height: 860 });

  step('EDITOR — main surface with a seeded capture and the Rectangle tool active');
  await page.goto(`${base}/src/editor/index.html`, { waitUntil: 'networkidle0' });
  await page.waitForSelector('.stage-canvas');
  await new Promise((r) => setTimeout(r, 900)); // controller's initial fit, see editor-keyboard-smoke
  await page.click('.tool-btn[title^="Rectangle"]');
  await page.waitForSelector('.stylebar');
  await scan(page, 'editor main surface');

  step('EDITOR — export dialog (Cmd+S)');
  await chord(page, ['Meta'], 's');
  await page.waitForSelector('.modal', { timeout: 5000 });
  // waitForSelector resolves on insertion, mid-way through the modal's own
  // entrance animation (task 23) — scanning before it settles reads faded,
  // still-animating opacity as the element's colour, which axe's
  // color-contrast rule can (and did, for the Beautify popover below) flag
  // as a false failure. 220ms clears the animation's own 150ms with margin.
  await settle(220);
  await scan(page, 'editor export dialog');
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !document.querySelector('.modal'), { timeout: 5000 });

  step('EDITOR — Beautify popover');
  await page.click('.beautify-menu > .btn-secondary');
  await page.waitForSelector('.beautify-popover', { timeout: 5000 });
  await settle(220); // see the export dialog step above
  await scan(page, 'editor Beautify popover');
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !document.querySelector('.beautify-popover'), {
    timeout: 5000,
  });
  await settle();

  step('EDITOR — ZoomMenu');
  await page.click('.zoom-trigger');
  await page.waitForSelector('.zoom-popover', { timeout: 5000 });
  // Puppeteer's virtual cursor stays wherever the last click landed —
  // the trigger — unless moved. Left there, the scan runs against the
  // trigger's :hover state (background swaps to --surface-3), not its
  // normal rendered state. A real mouse user opening this menu moves
  // toward the popover items next, so hover the first one instead —
  // realistic, and it's what the scan should reflect.
  await page.hover('.zoom-item');
  await settle(220); // see the export dialog step above
  await scan(page, 'editor ZoomMenu');
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !document.querySelector('.zoom-popover'), { timeout: 5000 });
  await settle();

  step('EDITOR — shortcut sheet (?)');
  await page.keyboard.type('?');
  await page.waitForSelector('.sheet', { timeout: 5000 });
  await settle(220); // see the export dialog step above
  await scan(page, 'editor shortcut sheet');
  await page.keyboard.press('Escape');

  assert(crashes.length === 0, `no uncaught page errors ${crashes.join('; ')}`);
  await page.close();
}

// ----------------------------------------------------------------- popup ---
async function testPopup(browser, base, messages) {
  await popupFirstRun(browser, base, messages);
  await popupMain(browser, base, messages);
}

/**
 * First run: `tabCapture` is not granted yet, so the Record card carries the
 * trust strip that rides with the inline permission ask. That strip only
 * exists in this state, so scanning the granted popup alone would never see
 * its contrast.
 */
async function popupFirstRun(browser, base, messages) {
  const { page, crashes } = await newPage(browser, messages, {}, []);
  await page.setViewport({ width: 340, height: 600 });
  step('POPUP — first run (Record carries the permission-ask trust strip)');
  await page.goto(`${base}/src/popup/index.html`, { waitUntil: 'networkidle0' });
  await page.waitForSelector('[data-testid="rec-trust"]');
  await scan(page, 'popup first run');
  assert(crashes.length === 0, `no uncaught page errors ${crashes.join('; ')}`);
  await page.close();
}

async function popupMain(browser, base, messages) {
  const { page, crashes } = await newPage(browser, messages, {});
  await page.setViewport({ width: 340, height: 600 });

  step('POPUP — main surface (mode cards + record + options)');
  await page.goto(`${base}/src/popup/index.html`, { waitUntil: 'networkidle0' });
  await page.waitForSelector('.mode-card');
  await scan(page, 'popup main surface');

  step('POPUP — settings view');
  await page.click('.icon-btn[aria-label]');
  await page.waitForSelector('.settings');
  await scan(page, 'popup settings view');

  assert(crashes.length === 0, `no uncaught page errors ${crashes.join('; ')}`);
  await page.close();
}

// --------------------------------------------------------------- recorder ---
async function testRecorder(browser, base, messages) {
  const { page, crashes } = await newPage(browser, messages, {});
  await page.setViewport({ width: 1280, height: 860 });
  await page.goto(`${base}/src/recorder/index.html`, { waitUntil: 'load' });
  await page.waitForSelector('.rec-empty', { timeout: 15_000 });
  const sessionId = await page.evaluate(seedRecorderSession);

  step('RECORDER — session list, populated with one seeded session');
  await page.goto(`${base}/src/recorder/index.html`, { waitUntil: 'load' });
  await page.waitForSelector('.rec-row', { timeout: 15_000 });
  await scan(page, 'recorder session list');

  step('RECORDER — editor timeline for the seeded session');
  await page.goto(`${base}/src/recorder/index.html?session=${sessionId}`, { waitUntil: 'load' });
  await page.waitForSelector('.rail', { timeout: 15_000 });
  await page.waitForFunction(() => document.querySelectorAll('.rec-tl-strip').length > 0, {
    timeout: 15_000,
  });
  await scan(page, 'recorder editor timeline');

  assert(crashes.length === 0, `no uncaught page errors ${crashes.join('; ')}`);
  await page.close();
}

// ------------------------------------------------------------------ setup ---
async function testSetup(browser, base, messages) {
  const { page, crashes } = await newPage(browser, messages, {});
  await page.setViewport({ width: 1280, height: 860 });

  step('SETUP — permission checklist, all granted (ready banner)');
  await page.goto(`${base}/src/setup/index.html?from=record`, { waitUntil: 'networkidle0' });
  await page.waitForSelector('[data-testid="ready-banner"]', { timeout: 15_000 });
  await scan(page, 'setup checklist (ready)');

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

  console.log(
    `\nAllowlist (${ALLOWLIST.length} entries) — printed every run so it cannot rot silently:`,
  );
  if (ALLOWLIST.length === 0) {
    console.log('    (empty)');
  } else {
    for (const a of ALLOWLIST) console.log(`    ${a.id} — owned by ${a.task}: ${a.note}`);
  }

  const messages = JSON.parse(await readFile(join(DIST, '_locales/en/messages.json'), 'utf8'));
  const puppeteer = await loadPuppeteer();
  const work = await mkdtemp(join(tmpdir(), 'oss-a11y-smoke-'));
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

  console.log(
    `\nTotals: ${totals.critical} critical, ${totals.serious} serious (${totals.allowlisted} allowlisted), ${totals.moderate} moderate, ${totals.minor} minor.`,
  );
  assert(
    failures.length === 0,
    `no unallowed critical/serious violations across any surface (${failures.length} failing state(s))`,
  );
  console.log('\nAccessibility smoke passed.');
}

// Guarded so a verification script can `import` matchesAllowlistedSelector
// above (a pure function, safe to unit-test directly) without also
// launching a full browser run as an import side effect.
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(`\nAccessibility smoke FAILED: ${err.message}`);
    process.exitCode = 1;
  });
}
