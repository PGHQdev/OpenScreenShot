// Run with: node tests/browser/capture-overlay-smoke.mjs
// Execute the serialized injection in real Chrome and compare clean pixels.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { transform } from 'esbuild';
import puppeteer from '../../mcp/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js';

const source = await readFile(
  new URL('../../src/content/capture-overlay.ts', import.meta.url),
  'utf8',
);
const scrollSource = await readFile(
  new URL('../../src/content/scroll-capture.ts', import.meta.url),
  'utf8',
);
const overlay = await transform(source, {
  loader: 'ts',
  format: 'iife',
  globalName: 'overlayModule',
  target: 'es2022',
});
const scrolling = await transform(scrollSource, {
  loader: 'ts',
  format: 'iife',
  globalName: 'scrollModule',
  target: 'es2022',
});
const browser = await puppeteer.launch({
  executablePath:
    process.env.CHROME_BIN ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
});
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1000, height: 700 });
  await page.setContent(
    '<style>body{margin:0;background:#e4edf2} div{color:red !important} </style><h1>Capture fixture</h1>',
  );
  await page.addScriptTag({ content: overlay.code + scrolling.code });
  // Match Chrome executeScript: the function must survive losing module scope.
  await page.evaluate(() => {
    window.injectOverlay = (0, eval)(`(${window.overlayModule.updateCaptureOverlay.toString()})`);
  });
  const clean = await page.screenshot();
  await page.evaluate(() =>
    window.injectOverlay('show', 25, 'Capturing screenshot…', 'Keep this tab open.'),
  );
  const visible = await page.screenshot();
  assert(!clean.equals(visible), 'overlay should visibly render');
  const host = await page.evaluateHandle(() =>
    document.querySelector('[data-oss-capture-overlay]'),
  );
  assert(
    await page.evaluate(() => !!document.querySelector('[data-oss-capture-overlay]')),
    'overlay should be mounted',
  );
  await page.evaluate(() => window.scrollModule.hideFixedElements());
  assert(
    await page.evaluate(
      () =>
        getComputedStyle(document.querySelector('[data-oss-capture-overlay]')).visibility ===
        'visible',
    ),
    'fixed-element hiding must preserve overlay',
  );
  await page.evaluate(() => window.injectOverlay('hide'));
  assert(
    clean.equals(await page.screenshot()),
    'hidden overlay must leave captured pixels identical',
  );
  await page.evaluate(() =>
    window.injectOverlay('show', 50, 'Capturing screenshot…', 'Keep this tab open.'),
  );
  assert(
    await page.evaluate(() => document.querySelectorAll('[data-oss-capture-overlay]').length === 1),
    'updates must reuse a single host',
  );
  // Puppeteer accessibility snapshot traverses the closed shadow tree.
  const a11y = JSON.stringify(await page.accessibility.snapshot({ interestingOnly: false }));
  assert(a11y.includes('Capturing screenshot'), 'status must expose an accessible name');
  assert(a11y.includes('progressbar'), 'progress must expose progressbar semantics');
  const client = await page.createCDPSession();
  const { root } = await client.send('DOM.getDocument', { depth: -1, pierce: true });
  const findNode = (node, attribute) => {
    if (node.attributes?.includes(attribute)) return node;
    for (const child of [...(node.children ?? []), ...(node.shadowRoots ?? [])]) {
      const found = findNode(child, attribute);
      if (found) return found;
    }
  };
  const progress = findNode(root, 'progressbar');
  assert(progress, 'progressbar should exist in closed shadow root');
  assert(progress.attributes.includes('50'), 'determinate progress must update its value');
  const spinner = findNode(root, 'spinner');
  const { object } = await client.send('DOM.resolveNode', { nodeId: spinner.nodeId });
  async function spinnerAnimation() {
    const { result } = await client.send('Runtime.callFunctionOn', {
      objectId: object.objectId,
      functionDeclaration: 'function() { return getComputedStyle(this).animationName; }',
      returnByValue: true,
    });
    return result.value;
  }
  assert.notEqual(await spinnerAnimation(), 'none', 'normal motion should animate the spinner');
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  assert.equal(await spinnerAnimation(), 'none', 'reduced motion should stop decorative animation');
  await page.evaluate(() => window.injectOverlay('remove'));
  assert(
    await page.evaluate(() => !document.querySelector('[data-oss-capture-overlay]')),
    'cleanup must remove the host',
  );
  assert(clean.equals(await page.screenshot()), 'cleanup must restore clean pixels');
  await page.evaluate(() => window.injectOverlay('remove'));
  await host.dispose();
  console.log(
    'Capture overlay: clean pixels, isolation, progress, reduced motion and cleanup passed.',
  );
} finally {
  await browser.close();
}
