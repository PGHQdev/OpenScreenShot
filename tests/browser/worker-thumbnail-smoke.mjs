// Loads the built dist/ as a real, packed extension (every other browser
// smoke instead serves dist/ over plain HTTP with a stubbed chrome.* — see
// a11y-smoke.mjs's installChromeStub — which never runs inside a real
// extension process at all) and proves makeThumbnail's real chain
// (fetch(data:) -> createImageBitmap -> OffscreenCanvas -> convertToBlob ->
// btoa, src/shared/thumbnail.ts) runs inside the extension's actual
// ServiceWorkerGlobalScope, not just a window. Every other smoke's coverage
// of this chain (editor-keyboard-smoke.mjs, via migration of a seeded
// legacy capture) only proves the *editor page's* window context — this is
// the one that answers the question task-28-review.md's Important #2
// actually asked.
//
// R-28a re-review 1, finding 2: the goal needs only a worker target and one
// Worker.evaluate — no activeTab, no toolbar gesture, no real
// captureVisibleTab. Getting the extension to load at all needs two flag
// fixes on top of the obvious one:
//   - Chrome M137+ disables the --load-extension switch outright for
//     non-enterprise launches unless the DisableLoadExtensionCommandLineSwitch
//     feature is explicitly turned back off.
//   - Puppeteer's own default launch args separately pass a blanket
//     --disable-extensions, which --disable-extensions-except does not
//     override on its own.
// Round 2 applied both of those against *branded* Google Chrome and still
// found zero extension targets — the actual, round-3 cause: branded Chrome
// itself, 137 and later, ignores --load-extension unconditionally, and no
// --disable-features override brings it back (that override disables a
// *different* mechanism — the command-line-switch gate — which is not what
// branded Chrome enforces here; branded Chrome's own release notes describe
// unpacked/CLI extension loading as removed for the stable channel, not
// feature-flagged). This is exactly what the project's own recorded probe
// method (memory: "Recorder live probe method", 2026-08-21) already says:
// drive a packed extension in *Chrome for Testing*, never branded Chrome.
// See task-28-report.md's Fix round 3 for the evidence (the same host,
// same flags, branded Chrome vs. Chrome for Testing).
// Run with: npm run build && npm run smoke:worker
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdtemp, readdir, readFile, rm, stat } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { homedir, tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const DIST = join(ROOT, 'dist');

/**
 * Chrome for Testing only — never branded Google Chrome. Branded Chrome
 * 137+ ignores --load-extension unconditionally (confirmed live: round 2's
 * --disable-features override against branded Chrome 152 still found zero
 * extension targets); Chrome for Testing is built without that restriction
 * specifically so tooling like this can load unpacked/packed extensions.
 * Falling back to branded Chrome here would silently reproduce round 2's
 * failure with a misleading "environment limit" diagnosis all over again.
 *
 * Resolution order: CHROME_BIN if set (the same env var every other browser
 * smoke in this repo honours, so `CHROME_BIN=<path> npm run smoke:worker`
 * still works) — otherwise the newest "Google Chrome for Testing" binary
 * found under the puppeteer and Playwright browser caches, compared by
 * their own --version output (a cache's directory-name revision number
 * does not reliably encode the Chrome version, e.g. Playwright's
 * "chromium-1234"). No binary found in either place: fail immediately
 * rather than silently drifting onto whatever `PATH` happens to resolve.
 */
async function findChromeForTestingBinaries(root, ...archDirs) {
  const found = [];
  let entries;
  try {
    entries = await readdir(root, { withFileTypes: true });
  } catch {
    return found;
  }
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    for (const arch of archDirs) {
      const bin = join(
        root,
        entry.name,
        arch,
        'Google Chrome for Testing.app',
        'Contents',
        'MacOS',
        'Google Chrome for Testing',
      );
      if (existsSync(bin)) found.push(bin);
    }
  }
  return found;
}

function versionOf(bin) {
  // "Google Chrome for Testing 151.0.7922.34" -> [151, 0, 7922, 34]
  const out = execFileSync(bin, ['--version'], { encoding: 'utf8' });
  const match = out.match(/(\d+)\.(\d+)\.(\d+)\.(\d+)/);
  return match ? match.slice(1).map(Number) : [0, 0, 0, 0];
}

function newerVersion(a, b) {
  for (let i = 0; i < 4; i++) {
    if (a[i] !== b[i]) return a[i] > b[i] ? a : b;
  }
  return a;
}

async function resolveChrome() {
  if (process.env.CHROME_BIN) return process.env.CHROME_BIN;

  const archDirs = ['chrome-mac-arm64', 'chrome-mac-x64'];
  const candidates = [
    ...(await findChromeForTestingBinaries(
      join(homedir(), '.cache', 'puppeteer', 'chrome'),
      ...archDirs,
    )),
    ...(await findChromeForTestingBinaries(
      join(homedir(), 'Library', 'Caches', 'ms-playwright'),
      ...archDirs,
    )),
  ];
  if (candidates.length === 0) {
    throw new Error(
      'no Chrome for Testing found; run: npx @puppeteer/browsers install chrome@stable',
    );
  }
  let best = candidates[0];
  let bestVersion = versionOf(best);
  for (const bin of candidates.slice(1)) {
    const version = versionOf(bin);
    if (newerVersion(version, bestVersion) === version && version !== bestVersion) {
      best = bin;
      bestVersion = version;
    }
  }
  return best;
}

let stepNo = 0;
function step(message) {
  stepNo += 1;
  console.log(`[${stepNo}] ${message}`);
}

function assert(condition, message) {
  if (!condition) throw new Error(`assertion failed: ${message}`);
  console.log(`    ok: ${message}`);
}

/** Same resolution walk as every other browser smoke — puppeteer-core lives in mcp/. */
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

/**
 * A tiny solid PNG, generated for real via `sharp` rather than a
 * hand-transcribed base64 literal — the first version of this file used a
 * literal that turned out not to be a valid PNG at all (confirmed: it also
 * failed InvalidStateError in an ordinary window, not just the worker),
 * which is exactly the class of bug generating the bytes avoids. Same
 * approach `editor-keyboard-smoke.mjs`'s `makeCapture()` uses.
 */
async function makeTinyPngDataUrl() {
  const require = createRequire(import.meta.url);
  const sharp = require('sharp');
  const png = await sharp({
    create: { width: 8, height: 6, channels: 3, background: { r: 200, g: 60, b: 60 } },
  })
    .png()
    .toBuffer();
  return `data:image/png;base64,${png.toString('base64')}`;
}

/**
 * The exact chain from src/shared/thumbnail.ts's makeThumbnail, inlined for
 * `Worker.evaluate` — it serializes this function's source and re-parses it
 * inside the target, so it cannot `import` the real module. Kept in
 * lockstep by hand; a change to thumbnail.ts's algorithm should update this
 * too. `corrupt` is the negative control: an unsupported convertToBlob
 * type, per spec (and confirmed live — see the report), does not throw —
 * it silently falls back to image/png, which is the measurably wrong value
 * the corrupted run is expected to produce.
 */
async function evalThumbnailChain(dataUrl, maxDim, corrupt) {
  const blob = await (await fetch(dataUrl)).blob();
  const bitmap = await createImageBitmap(blob);
  try {
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = new OffscreenCanvas(w, h);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('2d context unavailable');
    ctx.drawImage(bitmap, 0, 0, w, h);
    const outBlob = await canvas.convertToBlob(
      corrupt ? { type: 'image/bmp' } : { type: 'image/jpeg', quality: 0.5 },
    );
    const buf = await outBlob.arrayBuffer();
    const bytes = new Uint8Array(buf);
    let binary = '';
    const CHUNK = 0x8000;
    for (let i = 0; i < bytes.length; i += CHUNK) {
      binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
    }
    return {
      dataUrl: `data:${outBlob.type};base64,${btoa(binary)}`,
      width: w,
      height: h,
      env: {
        offscreenCanvas: typeof OffscreenCanvas,
        createImageBitmap: typeof createImageBitmap,
        // globalThis.ServiceWorkerGlobalScope, not the bare identifier: this
        // file's own eslint env has no service-worker globals (it runs under
        // Node, evaluating this function's *source* inside the real worker —
        // see this function's own doc comment), and a bare reference to a
        // global that env does not declare fails lint here even though it
        // would resolve fine at the point this actually runs.
        isServiceWorker:
          typeof globalThis.ServiceWorkerGlobalScope !== 'undefined' &&
          self instanceof globalThis.ServiceWorkerGlobalScope,
      },
    };
  } finally {
    bitmap.close();
  }
}

async function main() {
  const built = await stat(join(DIST, 'manifest.json')).then(
    () => true,
    () => false,
  );
  if (!built) throw new Error(`${DIST}/manifest.json is missing — run "npm run build" first`);

  const chrome = await resolveChrome();
  const puppeteer = await loadPuppeteer();
  const work = await mkdtemp(join(tmpdir(), 'oss-worker-smoke-'));
  let browser = null;
  try {
    step(`launching the built extension for real, packed, on Chrome for Testing (${chrome})`);
    browser = await puppeteer.launch({
      executablePath: chrome,
      headless: true,
      userDataDir: join(work, 'profile'),
      // Puppeteer's own default args include a blanket --disable-extensions,
      // which --disable-extensions-except does not override on its own —
      // confirmed by reading the real chrome://version command line with
      // only the feature flag below applied (see task-28-report.md).
      ignoreDefaultArgs: ['--disable-extensions'],
      args: [
        '--no-first-run',
        '--no-default-browser-check',
        `--disable-extensions-except=${DIST}`,
        `--load-extension=${DIST}`,
        // Chrome M137+ disables --load-extension outright for
        // non-enterprise launches unless this is turned back off.
        '--disable-features=DisableLoadExtensionCommandLineSwitch',
      ],
    });

    step('finding the extension service worker target');
    const sw = await browser.waitForTarget(
      (t) => t.type() === 'service_worker' && t.url().startsWith('chrome-extension://'),
      { timeout: 15000 },
    );
    assert(true, `service worker target found: ${sw.url()}`);
    const worker = await sw.worker();

    step("makeThumbnail's real chain runs inside the extension's own ServiceWorkerGlobalScope");
    const tinyPng = await makeTinyPngDataUrl();
    const result = await worker.evaluate(evalThumbnailChain, tinyPng, 240, false);
    assert(
      result.env.offscreenCanvas === 'function',
      `OffscreenCanvas is a constructor in this worker (${result.env.offscreenCanvas})`,
    );
    assert(
      result.env.createImageBitmap === 'function',
      `createImageBitmap exists in this worker (${result.env.createImageBitmap})`,
    );
    assert(
      result.env.isServiceWorker === true,
      'self is a real ServiceWorkerGlobalScope here, not a window — the probe did not silently run somewhere else',
    );
    assert(
      result.dataUrl.startsWith('data:image/jpeg;base64,'),
      `encoded a JPEG data URL (${result.dataUrl.slice(0, 32)}...)`,
    );
    assert(
      result.width <= 240 && result.height <= 240,
      `decoded and scaled within THUMB_MAX_DIM=240 (${result.width}x${result.height})`,
    );

    step('negative control: an unsupported convertToBlob type produces a measurably wrong result');
    const corrupted = await worker.evaluate(evalThumbnailChain, tinyPng, 240, true);
    assert(
      corrupted.dataUrl.startsWith('data:image/png'),
      `requesting 'image/bmp' silently falls back to PNG, not the JPEG the real path asserts (${corrupted.dataUrl.slice(0, 24)}...)`,
    );

    console.log('\nWorker thumbnail smoke passed.');
  } finally {
    if (browser) await browser.close();
    await rm(work, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error(`\nWorker thumbnail smoke FAILED: ${err.message}`);
  console.error(
    'If this is a "no Chrome for Testing found" error: install one, e.g. ' +
      'npx @puppeteer/browsers install chrome@stable — see resolveChrome() above for why ' +
      'branded Chrome is never used as a fallback.\n' +
      'If this is a "waiting for target" timeout on a real Chrome for Testing binary: the ' +
      "next suspect is dist/manifest.json's commands — more than four suggested_key " +
      'entries is known to fail extension load (see task-28-report.md Fix round 3).',
  );
  process.exitCode = 1;
});
