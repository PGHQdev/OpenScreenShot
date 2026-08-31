// Headless browser reflow check for all four surfaces (editor, popup,
// recorder, setup): serves the built `dist/`, opens each page at a 320 CSS
// px equivalent width (WCAG 1.4.10) and at a 200%-zoom-equivalent reduced
// viewport, and asserts nothing is clipped or unreachable — the tool rail
// and settings rail scroll instead of clipping, modals scroll and keep their
// keyboard focus trap while scrolled, and no surface that is meant to reflow
// grows a horizontal scrollbar.
// Run with: npm run build && npm run smoke:reflow
// Set OSS_LOCALE=de (any folder under dist/_locales) to lay the surfaces out
// in that catalog instead of English; translated strings run longer.
import { readFileSync } from 'node:fs';
import { mkdtemp, readFile, rm } from 'node:fs/promises';

import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertDistFresh, loadPuppeteer, serveDist } from './dist-server.mjs';

const ROOT = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const DIST = join(ROOT, 'dist');
const LOCALE = process.env.OSS_LOCALE || 'en';
const CHROME =
  process.env.CHROME_BIN ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

let stepNo = 0;
function step(message) {
  stepNo += 1;
  console.log(`\n[${stepNo}] ${message}`);
}

function assert(condition, message) {
  if (!condition) throw new Error(`assertion failed: ${message}`);
  console.log(`    ok: ${message}`);
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
  // The editor opens in View mode (no rail, no style bar); Markup is the
  // chrome this file measures.
  await page.click('header .markup-btn');
  await page.waitForSelector('.toolbar');
  // The Rectangle tool has a style bar (color, stroke, shape); Select does not.
  await page.click(`.tool-btn[title^="${messages.editorToolRectangle.message}"]`);
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

  step('EDITOR — 320px width: no horizontal overflow, every tool reachable');
  await page.setViewport({ width: 320, height: 800 });
  await new Promise((r) => setTimeout(r, 150));
  const overflow320 = await noHorizontalOverflow(page, 320);
  assert(overflow320.ok, `document.scrollWidth ${overflow320.scrollWidth} <= 320`);
  // Counted out of tools.ts rather than written down here, so moving a tool
  // between the rail and the More overflow does not turn this into a check
  // of a number nobody updated.
  const toolsSource = readFileSync(join(ROOT, 'src/editor/tools.ts'), 'utf8');
  const expectedTools = (toolsSource.match(/\{ id: '[a-z]+', label: /g) ?? []).length;
  const expectedPrimary = (
    toolsSource.match(/PRIMARY_TOOLS: readonly Tool\[\] = \[([^\]]+)\]/)?.[1].match(/'[a-z]+'/g) ??
    []
  ).length;
  // The rail: the primary tools plus the More trigger.
  const toolCount = await page.$$eval('.toolbar .tool-btn', (els) => els.length);
  assert(
    expectedPrimary > 0 && toolCount === expectedPrimary + 1,
    `toolbar renders ${expectedPrimary} primary tools plus More at 320px width (${toolCount} found)`,
  );
  // ...and the overflow: everything else, inside the More popover.
  await page.click(`.toolbar .tool-btn[title="${messages.editorMoreTools.message}"]`);
  await page.waitForSelector('.more-popover');
  const overflowCount = await page.$$eval('.more-item', (els) => els.length);
  assert(
    expectedTools > expectedPrimary && overflowCount === expectedTools - expectedPrimary,
    `More popover lists the ${expectedTools - expectedPrimary} overflow tools (${overflowCount} found)`,
  );
  const popoverFits = await page.evaluate(() => {
    const r = document.querySelector('.more-popover').getBoundingClientRect();
    return r.left >= 0 && r.right <= 320 && r.top >= 0 && r.bottom <= 800;
  });
  assert(popoverFits, 'More popover stays inside a 320x800 viewport');
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !document.querySelector('.more-popover'));
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
  assert(lastToolReachable, 'the last tool in the rail scrolls into view inside the toolbar');

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

  step('POPUP — the four footer entries share one row inside the 340px panel');
  // The footer used to carry six entries, ~395px of min-content against the
  // panel's 308px content box; they sat in a `flex-wrap: nowrap` row, so the
  // last one ran through the panel edge and shipped that way in the store
  // screenshot. Ko-fi and Cool stuff moved to a Support row in Settings, and
  // the four that remain are at --fs-xs so they fit on one line — measured,
  // because nothing here shrinks below min-content.
  const footerFit = await page.evaluate(() => {
    const row = document.querySelector('.footer-row');
    if (!row) return null;
    const right = row.getBoundingClientRect().right;
    const kids = [...row.children].map((c) => c.getBoundingClientRect());
    return {
      count: kids.length,
      lines: new Set(kids.map((r) => Math.round(r.top))).size,
      minContent: Math.round(kids.reduce((sum, r) => sum + r.width, 0)),
      box: Math.round(row.getBoundingClientRect().width),
      overflow: Math.round(Math.max(...kids.map((r) => r.right)) - right),
    };
  });
  assert(footerFit !== null && footerFit.count === 4, 'the footer row renders its four entries');
  // One line is the English target. Other catalogs run longer, and the row
  // wraps by design; two lines is the most the 600px cap below has room for.
  const footerLines = LOCALE === 'en' ? 1 : 2;
  assert(
    footerFit.lines <= footerLines,
    `all four fit in ${footerLines} line(s) (${footerFit.minContent}px of entries in a ${footerFit.box}px box, ${footerFit.lines} lines)`,
  );
  assert(
    footerFit.overflow <= 1,
    `no footer entry passes the panel edge (rightmost overflows by ${footerFit.overflow}px)`,
  );

  step("POPUP — the main view needs no scroll at Chrome's 600px popup cap");
  // Chrome draws the popup at most 600px tall and scrolls past that. The
  // main view has to hold inside it; the a11y smoke measures the taller
  // first-run state (pin nudge and trust line both rendered), this one the
  // settled state every later open lands on.
  await page.setViewport({ width: 340, height: 600 });
  await new Promise((r) => setTimeout(r, 150));
  const popupCap = await page.evaluate(() => ({
    scrollHeight: document.documentElement.scrollHeight,
    content: Math.ceil(document.querySelector('.app').getBoundingClientRect().bottom),
  }));
  assert(
    popupCap.scrollHeight <= 600,
    `popup content is ${popupCap.content}px tall — inside the 600px cap, no scroll`,
  );
  await page.setViewport({ width: 340, height: 260 });
  await new Promise((r) => setTimeout(r, 150));

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
  await page.click(`.icon-btn[aria-label="${messages.settingsTitle.message}"]`);
  await page.waitForSelector('.settings');
  const settingsRows = await page.$$eval('.settings-row', (els) => els.length);
  assert(settingsRows > 0, `settings view renders ${settingsRows} rows`);

  step('POPUP — every settings row keeps its label and its control on one line');
  // The four-segment rows (Format, Delay) are the ones that can lose this:
  // at 340px they share a 308px content box with a label that does not
  // shrink. `.settings-row-col` is the one row that stacks by design — the
  // filename template, whose input, chips and preview cannot sit beside a
  // label — so it is excluded by class rather than by name.
  const rowLines = await page.evaluate(() =>
    [...document.querySelectorAll('.settings-row:not(.settings-row-col)')].map((row) => {
      const label = row.querySelector('.settings-label');
      const control = [...row.children].find((el) => el !== label);
      const a = label.getBoundingClientRect();
      const b = control.getBoundingClientRect();
      return {
        label: label.textContent.trim(),
        // Centres, not tops: a 20px label beside a 28px segmented group
        // shares the line with its top 4px higher, which is the alignment
        // working, not a wrap.
        delta: Math.abs((a.top + a.bottom) / 2 - (b.top + b.bottom) / 2),
        slack: Math.round(row.getBoundingClientRect().width - a.width - b.width),
      };
    }),
  );
  assert(rowLines.length >= 7, `${rowLines.length} label/control rows to check`);
  for (const row of rowLines) {
    assert(
      row.delta <= 1 && row.slack >= 0,
      `"${row.label}" keeps its control on the label's line (centres differ by ${row.delta.toFixed(1)}px, ${row.slack}px of the row still free)`,
    );
  }
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
  // Below --bp-sm the 40px icon, the heading, the state tag and the row's
  // button have too little width side by side, so the row stacks.
  const narrowRow = await page.evaluate(
    () => getComputedStyle(document.querySelector('.row')).flexDirection,
  );
  assert(narrowRow === 'column', `a permission row stacks (${narrowRow}) at 320px`);
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
  const { sourceCount } = await assertDistFresh(ROOT);
  assert(
    sourceCount > 0,
    `dist/ is present and newer than all ${sourceCount} files under src/, public/ and manifest.json`,
  );

  const messages = JSON.parse(
    await readFile(join(DIST, '_locales', LOCALE, 'messages.json'), 'utf8'),
  );
  const puppeteer = await loadPuppeteer(ROOT);
  const work = await mkdtemp(join(tmpdir(), 'oss-reflow-smoke-'));
  const server = await serveDist(DIST);
  const base = `http://127.0.0.1:${server.address().port}`;
  step(`serving dist/ on ${base} (locale ${LOCALE})`);

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
