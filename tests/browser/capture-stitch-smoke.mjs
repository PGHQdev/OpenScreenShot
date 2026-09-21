// Real-browser regression for scrollbar-free tiles and exact pixel placement.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { transform } from 'esbuild';
import sharp from 'sharp';
import { loadPuppeteer } from './dist-server.mjs';

const puppeteer = await loadPuppeteer(fileURLToPath(new URL('../../', import.meta.url)));
const source = await readFile(
  new URL('../../src/content/scroll-capture.ts', import.meta.url),
  'utf8',
);
const script = await transform(source, {
  loader: 'ts',
  format: 'iife',
  globalName: 'captureModule',
  target: 'es2022',
});
const geometry = await transform(
  await readFile(new URL('../../src/shared/geometry.ts', import.meta.url), 'utf8'),
  { loader: 'ts', format: 'iife', globalName: 'geometryModule', target: 'es2022' },
);
const browser = await puppeteer.launch({
  executablePath:
    process.env.CHROME_BIN ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
  ignoreDefaultArgs: ['--hide-scrollbars'],
});
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 800, height: 600, deviceScaleFactor: 2 });
  await page.setContent(`<!doctype html><style>
    html { scrollbar-gutter: stable; scroll-behavior: smooth !important; }
    body { margin:0; }
    .content { width:1100px;height:1753px;background:repeating-linear-gradient(#112233 0px,#112233 37px,#789abc 37px,#789abc 74px); }
    ::-webkit-scrollbar { width:18px;height:16px; }
    ::-webkit-scrollbar-thumb { background:rgb(255,0,255); }
    ::-webkit-scrollbar-track { background:rgb(0,255,0); }
  </style><div class="content"></div>`);
  await page.addScriptTag({ content: script.code + geometry.code });
  const metrics = await page.evaluate(() => window.captureModule.getMetrics(true));
  await page.evaluate(() => window.captureModule.prepareCapture());
  assert.deepEqual(
    await page.evaluate(() => window.captureModule.getMetrics(true)),
    metrics,
    'hiding scrollbars must preserve layout',
  );
  const positions = await page.evaluate(
    (m) => window.geometryModule.computeScrollPositions(m.scrollHeight, m.viewportHeight),
    metrics,
  );
  const tiles = [];
  for (const y of positions) {
    const actual = await page.evaluate((y) => window.captureModule.scrollToPosition(y), y);
    await page.evaluate(
      () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))),
    );
    const data = await page.screenshot();
    const pixels = await sharp(data).raw().toBuffer();
    let scrollbarPixels = 0;
    for (let i = 0; i < pixels.length; i += 3) {
      if (
        (pixels[i] === 255 && pixels[i + 1] === 0 && pixels[i + 2] === 255) ||
        (pixels[i] === 0 && pixels[i + 1] === 255 && pixels[i + 2] === 0)
      )
        scrollbarPixels++;
    }
    assert.equal(scrollbarPixels, 0, 'captured viewport must not contain scrollbar paint');
    tiles.push({
      dataUrl: `data:image/png;base64,${data.toString('base64')}`,
      y: Math.round(actual.scrollY * 2),
    });
  }
  const width = metrics.viewportWidth * 2,
    height = metrics.scrollHeight * 2;
  const stitched = await page.evaluate(
    async ({ tiles, width, height, h }) =>
      window.captureModule.stitchTiles(tiles, width, height, { x: 0, y: 0, w: width, h }),
    { tiles, width, height, h: metrics.viewportHeight * 2 },
  );
  const actual = await sharp(Buffer.from(stitched.split(',')[1], 'base64'))
    .removeAlpha()
    .raw()
    .toBuffer();
  const baseline = await sharp(await page.screenshot({ fullPage: true }))
    .extract({ left: 0, top: 0, width, height })
    .removeAlpha()
    .raw()
    .toBuffer();
  assert(
    actual.equals(baseline),
    'stitched content must match native full-page pixels, including overlap joins',
  );
  await page.evaluate(() => window.captureModule.restoreCapture());
  await page.evaluate(
    () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))),
  );
  assert.equal(
    await page.evaluate(() => document.documentElement.style.getPropertyValue('scroll-behavior')),
    '',
  );
  // The page stylesheet and geometry survive cleanup.
  assert.equal(
    await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior),
    'smooth',
  );

  await page.setContent(
    '<!doctype html><style>html,body{margin:0;height:100%;overflow:hidden}#scroller{width:700px;height:500px;border:7px solid red;overflow:auto;scroll-behavior:smooth!important}#content{height:1800px}</style><div id="scroller"><div id="content"></div></div>',
  );
  await page.addScriptTag({ content: script.code + geometry.code });
  const nested = await page.evaluate(() => window.captureModule.getMetrics(true));
  assert.equal(nested.container.x, 7, 'nested crop excludes left border');
  assert.equal(nested.container.y, 7, 'nested crop excludes top border');
  await page.evaluate(() => {
    const el = document.querySelector('#scroller');
    el.style.setProperty('scroll-behavior', 'smooth', 'important');
    window.captureModule.prepareCapture();
    window.captureModule.scrollToPosition(400);
    window.captureModule.restoreCapture();
  });
  assert.equal(
    await page.evaluate(() =>
      document.querySelector('#scroller').style.getPropertyValue('scroll-behavior'),
    ),
    'smooth',
    'restore pre-existing inline styles',
  );
  for (const direction of ['ltr', 'rtl']) {
    await page.setContent(
      `<!doctype html><html dir="${direction}"><style>html{scrollbar-gutter:stable;scrollbar-color:rgb(255,0,255) rgb(0,255,0)}body{margin:0;height:1800px;background:#112233}</style></html>`,
    );
    await page.addScriptTag({ content: script.code });
    const before = await page.evaluate(() => window.captureModule.getMetrics(true));
    const colors = await page.evaluate(
      () => getComputedStyle(document.documentElement).scrollbarColor,
    );
    await page.evaluate(() => window.captureModule.prepareCapture());
    assert.deepEqual(await page.evaluate(() => window.captureModule.getMetrics(true)), before);
    assert.equal(
      await page.evaluate(() => getComputedStyle(document.documentElement).scrollbarColor),
      'rgba(0, 0, 0, 0) rgba(0, 0, 0, 0)',
    );
    assert.equal(
      before.viewportLeft,
      await page.evaluate(() => document.documentElement.clientLeft),
    );
    await page.evaluate(() => window.captureModule.restoreCapture());
    assert.equal(
      await page.evaluate(() => getComputedStyle(document.documentElement).scrollbarColor),
      colors,
    );
  }
  console.log(
    'Capture stitching: hidden scrollbars, native 2× pixels, exact seams, nested borders and restoration passed.',
  );
} finally {
  await browser.close();
}
