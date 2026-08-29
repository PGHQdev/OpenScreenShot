// Headless browser smoke for the recording permission flow, across both of
// its surfaces: the popup, which asks for `tabCapture` inline from the Record
// click, and the setup page, which is now only the recovery route for a
// refused prompt or a blocked device. Serves the built `dist/` and stubs
// `chrome` with a mutable permission store whose request outcome is set per
// case — the refusal path is a real case here, not a stub that always grants.
// Run with: npm run build && npm run smoke:setup
import { createReadStream } from 'node:fs';
import { mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const DIST = join(ROOT, 'dist');
const SETUP_PAGE = '/src/setup/index.html';
const POPUP_PAGE = '/src/popup/index.html';
const PENDING_RECORD_KEY = 'openscreenshot:pending-record';
const REC_FAILURE_KEY = 'openscreenshot:rec-failure';
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
  console.log(`[${stepNo}] ${message}`);
}

function assert(condition, message) {
  if (!condition) throw new Error(`assertion failed: ${message}`);
  console.log(`    ok: ${message}`);
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
 * The page-side `chrome` stub: i18n from the built locales plus a mutable
 * permission store whose request/remove fire the onAdded/onRemoved events the
 * setup page listens to — that event path IS its live-status behavior under
 * test. `opts.grants` seeds what is already granted and `opts.allowRequest`
 * decides what Chrome's dialog answers, so a case can enter the refused path
 * the recovery route exists for.
 */
function installChromeStub(messages, opts) {
  const PENDING_KEY = 'openscreenshot:pending-record';

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

  const granted = {
    permissions: new Set(opts.grants ?? []),
    origins: new Set(opts.origins ?? []),
  };
  const added = new Set();
  const removed = new Set();
  const fire = (listeners, arg) => listeners.forEach((fn) => fn(arg));
  const matches = (query, presentOnly) => {
    const perms = query.permissions ?? [];
    const origins = query.origins ?? [];
    return (
      perms.every((p) => granted.permissions.has(p) === presentOnly) &&
      origins.every((o) => granted.origins.has(o) === presentOnly)
    );
  };

  const store = new Map();
  const session = new Map(Object.entries(opts.session ?? {}));
  const sessionRemoved = [];
  const area = (map) => ({
    async get(keys) {
      const out = {};
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
      if (opts.failPark && map === session && PENDING_KEY in items) {
        throw new Error('quota exceeded');
      }
      for (const [k, v] of Object.entries(items)) map.set(k, v);
    },
    async remove(keys) {
      for (const key of Array.isArray(keys) ? keys : [keys]) {
        if (map === session) sessionRemoved.push(key);
        map.delete(key);
      }
    },
    async getBytesInUse(key) {
      return map.has(key) ? JSON.stringify(map.get(key)).length : 0;
    },
  });

  const noop = () => {};
  globalThis.__smoke = {
    created: [],
    removed: [],
    sent: [],
    // Every permissions.contains answer, recorded as the stub returns it, so
    // a test can settle on the popup's permission read having resolved rather
    // than on some unrelated element that happens to render first.
    contains: [],
    sessionRemoved,
    granted,
    store,
    session,
    closed: 0,
  };
  // window.close() is a no-op on a tab the script did not open, so the popup's
  // hand-off has to be observable some other way.
  globalThis.close = () => {
    globalThis.__smoke.closed += 1;
  };
  globalThis.chrome = {
    i18n: { getMessage },
    storage: {
      local: area(store),
      session: area(session),
      onChanged: { addListener: noop, removeListener: noop },
    },
    runtime: {
      id: 'smoke',
      getURL: (p) => '/' + String(p).replace(/^\//, ''),
      sendMessage: async (msg) => {
        globalThis.__smoke.sent.push(msg);
        // `recActive` puts the popup in its live-recording state, which is
        // the only state its Stop and Cancel buttons exist in.
        return opts.recActive
          ? { active: true, paused: false, sessionId: 'live-1', elapsedMs: 4000 }
          : { active: false, paused: false };
      },
      onMessage: { addListener: noop, removeListener: noop },
    },
    action: { getUserSettings: async () => ({ isOnToolbar: opts.pinned !== false }) },
    commands: { getAll: async () => [] },
    windows: { update: async () => ({}) },
    tabs: {
      create: async (o) => {
        globalThis.__smoke.created.push(o.url);
        return { id: 1 };
      },
      update: async () => ({}),
      // A url-filtered query is the popup looking for an open setup tab;
      // there is never one here, so the hand-off has to create it.
      query: async (q) => (q?.url ? [] : [{ id: 5, url: 'https://example.com/' }]),
      getCurrent: (cb) => cb({ id: 7 }),
      remove: (id) => {
        globalThis.__smoke.removed.push(id);
      },
    },
    permissions: {
      contains: async (query) => {
        const answer = matches(query, true);
        globalThis.__smoke.contains.push({ query, answer });
        return answer;
      },
      request: async (query) => {
        if (opts.allowRequest === false) return false;
        (query.permissions ?? []).forEach((p) => granted.permissions.add(p));
        (query.origins ?? []).forEach((o) => granted.origins.add(o));
        fire(added, { permissions: [...(query.permissions ?? [])], origins: [] });
        return true;
      },
      remove: async (query) => {
        (query.permissions ?? []).forEach((p) => granted.permissions.delete(p));
        (query.origins ?? []).forEach((o) => granted.origins.delete(o));
        fire(removed, { permissions: [], origins: [] });
        return true;
      },
      onAdded: { addListener: (fn) => added.add(fn), removeListener: (fn) => added.delete(fn) },
      onRemoved: {
        addListener: (fn) => removed.add(fn),
        removeListener: (fn) => removed.delete(fn),
      },
    },
  };
}

/**
 * Wait until the popup's `permissions.contains({permissions:['tabCapture']})`
 * has been answered. The stub records the answer as it returns it, and a
 * `waitForFunction` poll is a CDP round trip — orders of magnitude more time
 * than the microtasks the popup's own continuation takes — so an assertion
 * placed after this is reading a chain that has run, not one that has not
 * started.
 */
async function settlePermissionRead(page) {
  await page.waitForFunction(() =>
    globalThis.__smoke.contains.some((c) => (c.query.permissions ?? []).includes('tabCapture')),
  );
  // One further round trip through the same storage the chain uses, so a
  // consume that costs an extra await would also have landed by now.
  await page.evaluate(() => chrome.storage.session.get('smoke:flush'));
}

async function main() {
  step('checking the build');
  const built = await stat(join(DIST, SETUP_PAGE.slice(1))).then(
    () => true,
    () => false,
  );
  if (!built) throw new Error(`${DIST}${SETUP_PAGE} is missing — run "npm run build" first`);
  assert(built, `dist${SETUP_PAGE} exists`);

  const messages = JSON.parse(await readFile(join(DIST, '_locales/en/messages.json'), 'utf8'));
  const puppeteer = await loadPuppeteer();
  const work = await mkdtemp(join(tmpdir(), 'oss-setup-smoke-'));
  const server = await serveDist();
  const base = `http://127.0.0.1:${server.address().port}`;
  step(`serving dist/ on ${base}`);

  let browser = null;
  const crashes = [];
  try {
    browser = await puppeteer.launch({
      executablePath: CHROME,
      headless: true,
      userDataDir: join(work, 'profile'),
      args: ['--no-first-run', '--no-default-browser-check', '--disable-gpu'],
    });

    /**
     * Every page is pinned to `no-preference` so this machine's own
     * accessibility setting cannot change what the smoke drives. Nothing here
     * asserts motion; the pin is what keeps that true on a reduced-motion box
     * as well as a plain one.
     */
    async function open(url, opts) {
      const page = await browser.newPage();
      const cdp = await page.createCDPSession();
      await cdp.send('Emulation.setEmulatedMedia', {
        features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }],
      });
      page.on('pageerror', (err) => crashes.push(String(err)));
      page.on('console', (msg) => {
        if (msg.type() === 'error') console.log(`    console.error: ${msg.text()}`);
      });
      await page.evaluateOnNewDocument(installChromeStub, messages, opts);
      await page.setViewport({ width: opts.width ?? 360, height: 700 });
      await page.goto(base + url, { waitUntil: 'networkidle0' });
      return page;
    }

    // ---------------------------------------------------------------- popup ---
    step('popup, tabCapture missing: the ask carries its assurance');
    let page = await open(POPUP_PAGE, { grants: [] });
    await page.waitForSelector('[data-testid="rec-trust"]');
    const trust = await page.$eval('[data-testid="rec-trust"]', (el) => el.textContent);
    for (const claim of [/open source/i, /100% local/i, /no tracking/i, /never leave/i]) {
      assert(claim.test(trust), `the Record ask states ${claim}`);
    }
    assert(
      !/audit/i.test(trust),
      'the assurance claims nothing about an audit (there is no audit to cite)',
    );
    const repo = await page.$eval('[data-testid="rec-trust"] a', (el) => el.href);
    assert(
      /github\.com\/pghqdev\/OpenScreenShot/.test(repo),
      `the open-source pill links to ${repo}`,
    );

    step('popup Record click: the permission is asked for inline, not in a setup tab');
    await page.click('.mode-card[aria-disabled]');
    await page.waitForFunction(() => globalThis.__smoke.granted.permissions.has('tabCapture'));
    let state = await page.evaluate(
      (key) => ({
        parked: globalThis.__smoke.session.get(key),
        created: globalThis.__smoke.created,
        sent: globalThis.__smoke.sent.map((m) => m.type),
        closed: globalThis.__smoke.closed,
      }),
      PENDING_RECORD_KEY,
    );
    assert(state.created.length === 0, 'the Record click opened no setup tab');
    assert(
      state.parked != null && state.parked.tabId === 5 && typeof state.parked.at === 'number',
      `the click is parked for the worker (tab ${state.parked?.tabId})`,
    );
    assert(
      state.parked.settings != null,
      'the parked click carries the recording settings it was made with',
    );
    assert(
      !state.sent.includes('REC_START'),
      'the popup starts nothing itself — permissions.onAdded in the worker owns that',
    );
    await page.waitForFunction(() => globalThis.__smoke.closed > 0);
    assert(true, 'the popup closes once the grant lands');
    await page.close();

    step('popup Record click, prompt refused: the parked click is dropped, recovery offered');
    page = await open(POPUP_PAGE, { grants: [], allowRequest: false });
    await page.waitForSelector('[data-testid="rec-trust"]');
    await page.click('.mode-card[aria-disabled]');
    await page.waitForSelector('[data-testid="rec-refused"]');
    state = await page.evaluate(
      (key) => ({
        parked: globalThis.__smoke.session.get(key),
        granted: [...globalThis.__smoke.granted.permissions],
        closed: globalThis.__smoke.closed,
        sent: globalThis.__smoke.sent.map((m) => m.type),
      }),
      PENDING_RECORD_KEY,
    );
    assert(state.granted.length === 0, 'nothing was granted');
    assert(state.parked === undefined, 'the parked click is cleared, so no later grant hijacks it');
    assert(!state.sent.includes('REC_START'), 'no recording is started on a refusal');
    assert(state.closed === 0, 'the popup stays open to show the way out');
    await page.click('[data-testid="rec-refused"]');
    await page.waitForFunction(() => globalThis.__smoke.created.length > 0);
    const routed = await page.evaluate(() => globalThis.__smoke.created[0]);
    assert(/setup\/index\.html\?from=record/.test(routed), `refusal routes to ${routed}`);
    await page.close();

    step('popup reopened after a refusal it never got to show');
    // The popup that asked was torn down by Chrome's dialog, so the parked
    // click outlived it. That leftover is the only evidence a request went
    // unanswered, and it is what the recovery route now hangs off.
    page = await open(POPUP_PAGE, {
      grants: [],
      session: {
        [PENDING_RECORD_KEY]: {
          settings: { mic: false, tabAudio: true, webcam: false, ripple: true },
          tabId: 5,
          at: Date.now() - 30_000,
          asked: true,
        },
      },
    });
    await page.waitForSelector('[data-testid="rec-refused"]');
    assert(true, 'the refusal shows on the next open, not nowhere');
    state = await page.evaluate(
      (key) => ({
        parked: globalThis.__smoke.session.get(key),
        sent: globalThis.__smoke.sent.map((m) => m.type),
      }),
      PENDING_RECORD_KEY,
    );
    assert(state.parked === undefined, 'the leftover is consumed, so it shows once and not again');
    assert(!state.sent.includes('REC_START'), 'nothing is started on the strength of a leftover');
    await page.close();

    step("popup reopened after the grant landed: the leftover is the worker's, not the popup's");
    page = await open(POPUP_PAGE, {
      grants: ['tabCapture'],
      session: {
        [PENDING_RECORD_KEY]: {
          settings: { mic: false, tabAudio: true, webcam: false, ripple: true },
          tabId: 5,
          at: Date.now() - 200,
          asked: true,
        },
      },
    });
    // Settle on the state this case is about: the tabCapture read answering.
    // `.mode-card` is gated on the recorder state, not on this, so waiting for
    // it would leave the assertions below resting on incidental ordering.
    await settlePermissionRead(page);
    assert(
      (await page.$('[data-testid="rec-refused"]')) === null,
      'a granted permission shows no refusal',
    );
    state = await page.evaluate(
      (key) => ({
        parked: globalThis.__smoke.session.get(key),
        removed: globalThis.__smoke.sessionRemoved,
      }),
      PENDING_RECORD_KEY,
    );
    assert(
      state.parked !== undefined && !state.removed.includes(PENDING_RECORD_KEY),
      'and the popup neither eats nor deletes the click the worker is about to start',
    );
    await page.close();

    step('popup Record click whose park fails: the popup starts it itself');
    // With no parked click the worker has nothing to act on, so the popup —
    // which by then has evidently survived the dialog — is the only context
    // left that can start the recording.
    page = await open(POPUP_PAGE, { grants: [], failPark: true });
    await page.waitForSelector('[data-testid="rec-trust"]');
    await page.click('.mode-card[aria-disabled]');
    await page.waitForFunction(() => globalThis.__smoke.sent.some((m) => m.type === 'REC_START'));
    state = await page.evaluate(
      (key) => ({
        parked: globalThis.__smoke.session.get(key),
        granted: [...globalThis.__smoke.granted.permissions],
      }),
      PENDING_RECORD_KEY,
    );
    assert(state.granted.includes('tabCapture'), 'the grant still lands');
    assert(state.parked === undefined, 'nothing is parked — the write is what failed');
    assert(
      (await page.$('[data-testid="rec-refused"]')) === null,
      'and a failed park is not reported as a refusal',
    );
    await page.close();

    step('popup reopened after a click that was dismissed before it could ask');
    // Torn down between the durable park and the request going out. Nothing
    // was ever asked, so nothing may be claimed about permission.
    page = await open(POPUP_PAGE, {
      grants: [],
      session: {
        [PENDING_RECORD_KEY]: {
          settings: { mic: false, tabAudio: true, webcam: false, ripple: true },
          tabId: 5,
          at: Date.now() - 30_000,
        },
      },
    });
    await page.waitForSelector('[data-testid="rec-trust"]');
    await settlePermissionRead(page);
    assert(
      (await page.$('[data-testid="rec-refused"]')) === null,
      'a park that never asked is not reported as a refusal',
    );
    state = await page.evaluate((key) => globalThis.__smoke.session.get(key), PENDING_RECORD_KEY);
    assert(state === undefined, 'and it is cleared rather than left to age');
    await page.close();

    step('popup, unpinned: the pin nudge has a home again');
    page = await open(POPUP_PAGE, { grants: ['tabCapture'], pinned: false });
    await page.waitForSelector('[data-testid="pin-hint"]');
    const pin = await page.$eval('[data-testid="pin-hint"]', (el) => el.textContent);
    assert(/pin/i.test(pin), `the popup asks to be pinned ("${pin.trim()}")`);
    await page.close();
    page = await open(POPUP_PAGE, { grants: ['tabCapture'], pinned: true });
    await page.waitForSelector('.mode-card[aria-disabled]');
    assert(
      (await page.$('[data-testid="pin-hint"]')) === null,
      'and stops asking once it is pinned',
    );
    await page.close();

    step('popup settings: the record-across-sites ask carries the assurance too');
    page = await open(POPUP_PAGE, { grants: ['tabCapture'] });
    await page.waitForSelector('.mode-card[aria-disabled]');
    await page.click('.icon-btn[aria-label]');
    await page.waitForSelector('.settings');
    await page.waitForSelector('[data-testid="sites-trust"]');
    const sites = await page.$eval('[data-testid="sites-trust"]', (el) => el.textContent);
    for (const claim of [/open source/i, /100% local/i, /no tracking/i, /never leave/i]) {
      assert(claim.test(sites), `the all-sites ask states ${claim}`);
    }
    assert(!/audit/i.test(sites), 'and claims nothing about an audit');
    await page.close();
    page = await open(POPUP_PAGE, { grants: ['tabCapture'], origins: ['<all_urls>'] });
    await page.waitForSelector('.mode-card[aria-disabled]');
    await page.click('.icon-btn[aria-label]');
    await page.waitForSelector('.settings');
    // The row reads its grant asynchronously and renders "off" for the frame
    // before the answer lands, so wait for the settled state rather than
    // sampling a frame that has not read it yet.
    await page.waitForFunction(() => {
      const row = [...document.querySelectorAll('.settings-row')].find((r) =>
        /across sites/i.test(r.querySelector('.settings-label')?.textContent ?? ''),
      );
      return row?.querySelectorAll('.seg-btn')[1]?.getAttribute('aria-pressed') === 'true';
    });
    assert(
      (await page.$('[data-testid="sites-trust"]')) === null,
      'the assurance leaves once all-sites is granted',
    );
    await page.close();

    step('popup with tabCapture already granted: no ask, no assurance to carry');
    page = await open(POPUP_PAGE, { grants: ['tabCapture'] });
    await page.waitForSelector('.mode-card[aria-disabled]');
    assert(
      (await page.$('[data-testid="rec-trust"]')) === null,
      'the trust strip is gone once there is nothing left to ask for',
    );
    await page.click('.mode-card[aria-disabled]');
    await page.waitForFunction(() => globalThis.__smoke.sent.some((m) => m.type === 'REC_START'));
    state = await page.evaluate(
      (key) => ({
        parked: globalThis.__smoke.session.get(key),
        created: globalThis.__smoke.created,
      }),
      PENDING_RECORD_KEY,
    );
    assert(state.parked === undefined, 'a granted Record click parks nothing');
    assert(state.created.length === 0, 'a granted Record click opens no tab');
    await page.close();

    step('popup Record click the worker never received: the popup stays to say so');
    page = await open(POPUP_PAGE, { grants: ['tabCapture'] });
    await page.waitForSelector('.mode-card[aria-disabled]');
    // The worker is unreachable from here on. Every worker failure used to
    // land on `.catch(() => {}).finally(() => window.close())`, so the popup
    // went away whether the start happened or not.
    await page.evaluate(() => {
      chrome.runtime.sendMessage = async (msg) => {
        globalThis.__smoke.sent.push(msg);
        throw new Error('Could not establish connection. Receiving end does not exist.');
      };
    });
    await page.click('.mode-card[aria-disabled]');
    await page.waitForSelector('.toast-error .toast-text');
    let failText = await page.$eval('.toast-error .toast-text', (el) => el.textContent.trim());
    assert(
      failText === messages.recFailStartUnreachable.message,
      `the popup names the failure ("${failText}")`,
    );
    assert(
      (await page.evaluate(() => globalThis.__smoke.closed)) === 0,
      'and stays open, instead of closing over a start that never happened',
    );
    await page.close();

    step('popup Stop the worker never received: the recording is still running, so say so');
    page = await open(POPUP_PAGE, { grants: ['tabCapture'], recActive: true });
    await page.waitForSelector('.rec-live');
    // The other half of the same `.finally` defect: a stop that never arrived
    // used to close the popup, leaving the recording running with the REC
    // badge as the user's only evidence that nothing had happened.
    await page.evaluate(() => {
      chrome.runtime.sendMessage = async (msg) => {
        globalThis.__smoke.sent.push(msg);
        throw new Error('Could not establish connection. Receiving end does not exist.');
      };
    });
    const [stopBtn] = await page.$$('.rec-live .seg-btn');
    await stopBtn.click();
    await page.waitForSelector('.toast-error .toast-text');
    failText = await page.$eval('.toast-error .toast-text', (el) => el.textContent.trim());
    assert(
      failText === messages.recFailControlUnreachable.message,
      `the popup names the failed stop ("${failText}")`,
    );
    assert(
      (await page.evaluate(() => globalThis.__smoke.closed)) === 0,
      'and stays open, with the Stop button still there to press',
    );
    await page.close();

    step('popup reopened after a failure the worker had nowhere to show');
    // Every worker failure lands with the popup already gone, so the worker
    // parks it and this is the read-out. Consumed on sight, so the open after
    // this one is quiet.
    page = await open(POPUP_PAGE, {
      grants: ['tabCapture'],
      session: { [REC_FAILURE_KEY]: { code: 'engine-failed', at: Date.now() } },
    });
    await page.waitForSelector('.toast-error .toast-text');
    failText = await page.$eval('.toast-error .toast-text', (el) => el.textContent.trim());
    assert(
      failText === messages.recFailEngine.message,
      `the parked failure is read out ("${failText}")`,
    );
    assert(
      await page.evaluate(
        (key) => globalThis.__smoke.sessionRemoved.includes(key),
        REC_FAILURE_KEY,
      ),
      'and consumed, so it says its piece once rather than nagging every open',
    );
    await page.close();

    // ---------------------------------------------------------------- setup ---
    step('the setup page is a recovery surface, with no walkthrough in front of it');
    page = await open(`${SETUP_PAGE}?from=install`, { grants: [], width: 1100 });
    await page.waitForSelector('[data-testid="row-tabcapture"]');
    assert((await page.$('[data-testid="hero"]')) === null, 'no marketing hero on the way in');
    assert((await page.$$('.feature')).length === 0, 'no feature grid to click through');
    await page.close();

    step('opening the setup page from a failed record (nothing granted)');
    page = await open(`${SETUP_PAGE}?from=record`, { grants: [], width: 1100 });
    await page.waitForSelector('[data-testid="row-tabcapture"]');
    const initial = await page.$eval('[data-testid="row-tabcapture"]', (el) => el.dataset.state);
    assert(initial === 'required', 'tab recording row starts as required');
    assert(
      (await page.$('[data-testid="ready-banner"]')) === null,
      'no ready banner before the grant',
    );
    const banner = await page.$eval('.banner-attention', (el) => el.textContent);
    assert(banner.length > 0, `?from=record shows the routed banner ("${banner.trim()}")`);
    const strip = await page.$eval('[data-testid="trust-strip"]', (el) => el.textContent);
    assert(
      /open source/i.test(strip) && /local/i.test(strip) && !/audit/i.test(strip),
      'trust strip renders with the open-source and local pills, and claims no audit',
    );

    step('clicking Enable on the tab recording row');
    await page.click('[data-testid="row-tabcapture"] .btn-primary');
    await page.waitForSelector('[data-testid="row-tabcapture"][data-state="granted"]');
    assert(true, 'tab recording row flips to granted via the onAdded event');
    await page.waitForSelector('[data-testid="ready-banner"]');
    assert(true, 'ready banner appears once tabCapture is granted');

    step('toggling record-across-sites on and off');
    await page.click('[data-testid="row-allurls"] input.switch');
    await page.waitForSelector('[data-testid="row-allurls"][data-state="granted"]');
    assert(true, 'across-sites row flips to granted');
    await page.click('[data-testid="row-allurls"] input.switch');
    await page.waitForSelector('[data-testid="row-allurls"][data-state="optional"]');
    assert(true, 'across-sites row returns to optional via the onRemoved event');

    step('camera and mic keep their own recovery rows');
    for (const row of ['row-camera', 'row-mic']) {
      const rowState = await page.$eval(`[data-testid="${row}"]`, (el) => el.dataset.state);
      assert(rowState === 'optional' || rowState === 'granted', `${row} renders as ${rowState}`);
    }

    step('finishing: the ready banner closes the tab');
    await page.waitForSelector('[data-testid="finish-btn"]');
    assert(true, 'finish button renders on the ready banner');
    await page.click('[data-testid="finish-btn"]');
    const closed = await page
      .evaluate(() => globalThis.__smoke.removed.length + globalThis.__smoke.closed)
      .then((n) => n > 0)
      .catch(() => true); // window.close() beat the tabs fallback — also a close
    assert(closed, 'finish click closes the tab');
    await page.close();

    assert(crashes.length === 0, `no uncaught page errors ${crashes.join('; ')}`);
    console.log('\nSetup smoke passed.');
  } finally {
    if (browser) await browser.close();
    server.close();
    await rm(work, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error(`\nSetup smoke FAILED: ${err.message}`);
  process.exitCode = 1;
});
