// Headless browser smoke for the recording setup page: serves the built
// `dist/`, stubs `chrome` with a mutable permission store, and walks the page
// through grant, revoke, and the ready banner.
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
const PAGE = '/src/setup/index.html';
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
 * page listens to — that event path IS the live-status behavior under test.
 */
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

  const granted = { permissions: new Set(), origins: new Set() };
  const added = new Set();
  const removed = new Set();
  const fire = (listeners) => listeners.forEach((fn) => fn());
  const matches = (query, presentOnly) => {
    const perms = query.permissions ?? [];
    const origins = query.origins ?? [];
    return (
      perms.every((p) => granted.permissions.has(p) === presentOnly) &&
      origins.every((o) => granted.origins.has(o) === presentOnly)
    );
  };

  const store = new Map();
  globalThis.__smoke = { created: [], removed: [], granted, store };
  globalThis.chrome = {
    i18n: { getMessage },
    storage: {
      local: {
        get: async (key) => (store.has(key) ? { [key]: store.get(key) } : {}),
        set: async (items) => {
          for (const [k, v] of Object.entries(items)) store.set(k, v);
        },
      },
      onChanged: { addListener() {}, removeListener() {} },
    },
    runtime: { id: 'smoke', getURL: (p) => '/' + String(p).replace(/^\//, '') },
    tabs: {
      create: async (opts) => {
        globalThis.__smoke.created.push(opts.url);
        return { id: 1 };
      },
      getCurrent: (cb) => cb({ id: 7 }),
      remove: (id) => {
        globalThis.__smoke.removed.push(id);
      },
    },
    permissions: {
      contains: async (query) => matches(query, true),
      request: async (query) => {
        (query.permissions ?? []).forEach((p) => granted.permissions.add(p));
        (query.origins ?? []).forEach((o) => granted.origins.add(o));
        fire(added);
        return true;
      },
      remove: async (query) => {
        (query.permissions ?? []).forEach((p) => granted.permissions.delete(p));
        (query.origins ?? []).forEach((o) => granted.origins.delete(o));
        fire(removed);
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

async function main() {
  step('checking the build');
  const built = await stat(join(DIST, PAGE.slice(1))).then(
    () => true,
    () => false,
  );
  if (!built) throw new Error(`${DIST}${PAGE} is missing — run "npm run build" first`);
  assert(built, `dist${PAGE} exists`);

  const messages = JSON.parse(await readFile(join(DIST, '_locales/en/messages.json'), 'utf8'));
  const puppeteer = await loadPuppeteer();
  const work = await mkdtemp(join(tmpdir(), 'oss-setup-smoke-'));
  const server = await serveDist();
  const base = `http://127.0.0.1:${server.address().port}`;
  step(`serving dist/ on ${base}`);

  let browser = null;
  try {
    browser = await puppeteer.launch({
      executablePath: CHROME,
      headless: true,
      userDataDir: join(work, 'profile'),
      args: ['--no-first-run', '--no-default-browser-check', '--disable-gpu'],
    });
    const page = await browser.newPage();
    const crashes = [];
    page.on('pageerror', (err) => crashes.push(String(err)));
    page.on('console', (msg) => {
      if (msg.type() === 'error') console.log(`    console.error: ${msg.text()}`);
    });
    await page.evaluateOnNewDocument(installChromeStub, messages);

    step('opening from install: the feature welcome shows first');
    await page.goto(`${base}${PAGE}?from=install`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('[data-testid="hero"]');
    const tiles = await page.$$eval('.feature', (els) => els.length);
    assert(tiles === 4, `welcome view renders ${tiles} feature tiles`);
    await page.click('.btn-hero');
    await page.waitForSelector('[data-testid="row-tabcapture"]');
    assert(true, 'welcome CTA advances to the permission checklist');

    step('opening the setup page fresh (nothing granted)');
    await page.goto(`${base}${PAGE}?from=record`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('[data-testid="row-tabcapture"]');
    const initial = await page.$eval('[data-testid="row-tabcapture"]', (el) => el.dataset.state);
    assert(initial === 'required', 'tab recording row starts as required');
    assert(
      (await page.$('[data-testid="ready-banner"]')) === null,
      'no ready banner before the grant',
    );
    const banner = await page.$eval('.banner-attention', (el) => el.textContent);
    assert(banner.length > 0, `?from=record shows the routed banner ("${banner.trim()}")`);
    const trust = await page.$eval('[data-testid="trust-strip"]', (el) => el.textContent);
    assert(
      /open source/i.test(trust) && /local/i.test(trust),
      'trust strip renders with the open-source and local pills',
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

    step('camera and mic rows are present and skippable');
    for (const row of ['row-camera', 'row-mic']) {
      const state = await page.$eval(`[data-testid="${row}"]`, (el) => el.dataset.state);
      assert(state === 'optional' || state === 'granted', `${row} renders as ${state}`);
    }

    step('the setup page marks onboarding as seen');
    const settings = await page.evaluate(() =>
      globalThis.__smoke.store.get('openscreenshot:settings'),
    );
    assert(
      settings?.showOnboarding === false,
      'showOnboarding is false after the setup page loads',
    );

    step('finishing: the ready banner closes the tab');
    await page.waitForSelector('[data-testid="finish-btn"]');
    assert(true, 'finish button renders on the ready banner');
    await page.click('[data-testid="finish-btn"]');
    const closed = await page
      .evaluate(() => globalThis.__smoke.removed.length)
      .then((n) => n > 0)
      .catch(() => true); // window.close() beat the tabs fallback — also a close
    assert(closed, 'finish click closes the tab');

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
