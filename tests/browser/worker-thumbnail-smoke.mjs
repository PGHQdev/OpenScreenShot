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
// captureVisibleTab. Getting the extension to load at all needed two fixes
// together, not one:
//   - Chrome M137+ disables the --load-extension switch outright for
//     non-enterprise launches unless the DisableLoadExtensionCommandLineSwitch
//     feature is explicitly turned back off.
//   - Puppeteer's own default launch args separately pass a blanket
//     --disable-extensions, which --disable-extensions-except does not
//     override on its own — confirmed by reading the *actual* command line
//     Chrome reports at chrome://version with only the feature flag applied
//     (a --disable-extensions --disable-extensions-except=... pair, extension
//     still not installed) and again with both fixes applied. See
//     task-28-report.md's Fix round 2 for the exact command lines observed.
// Run with: npm run build && npm run smoke:worker
import { mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const DIST = join(ROOT, 'dist');
const CHROME =
  process.env.CHROME_BIN ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

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

/** A tiny solid PNG — real image bytes, small enough that decoding and
 * re-encoding it is trivial to check by dimensions and MIME type alone. */
const TINY_PNG_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAADCAIAAAA1PPfIAAAAEUlEQVR4nGP8z8DAwMDAAAAKBAIAiK/7iQAAAABJRU5ErkJggg==';

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

  const puppeteer = await loadPuppeteer();
  const work = await mkdtemp(join(tmpdir(), 'oss-worker-smoke-'));
  let browser = null;
  try {
    step('launching the built extension for real, packed (not served over HTTP)');
    browser = await puppeteer.launch({
      executablePath: CHROME,
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
    const result = await worker.evaluate(evalThumbnailChain, TINY_PNG_DATA_URL, 240, false);
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
    const corrupted = await worker.evaluate(evalThumbnailChain, TINY_PNG_DATA_URL, 240, true);
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
    'If this is a "waiting for target" timeout: the extension did not load as a real ' +
      'packed extension in this Chrome/sandbox despite both fixes above being applied. ' +
      'See task-28-report.md Fix round 2 for the exact command lines and evidence that ' +
      'this is an environment limit, not a flag mistake.',
  );
  process.exitCode = 1;
});
