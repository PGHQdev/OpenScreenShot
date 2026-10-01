// Real-layout controller checks; serializes the function exactly like executeScript.
import assert from 'node:assert/strict';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const SOURCE = join(ROOT, 'src/content/element-select.ts');
const CHROME =
  process.env.CHROME_BIN ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const labels = {
  title: 'Select an element',
  instructions: 'Hover or use arrows; Enter captures; Escape cancels',
  empty: 'Choose an element',
  clipped: 'Scroll until fully visible or capture the full page',
  capture: 'Capture',
  fullPage: 'Capture full page',
  cancel: 'Cancel',
  larger: 'Larger',
  smaller: 'Smaller',
};

async function loadPuppeteer() {
  let dir = ROOT;
  for (;;) {
    const pkg = join(dir, 'mcp', 'node_modules', 'puppeteer-core', 'package.json');
    try {
      const manifest = JSON.parse(await readFile(pkg, 'utf8'));
      return (await import(pathToFileURL(join(dirname(pkg), manifest.exports['.'].import)).href))
        .default;
    } catch {
      const parent = dirname(dir);
      if (parent === dir) break;
      dir = parent;
    }
  }
  return (
    await import(pathToFileURL(createRequire(import.meta.url).resolve('puppeteer-core')).href)
  ).default;
}

const fixture = `<!doctype html><style>
html,body{margin:0;background:white;min-height:1600px;font:16px Arial}
#group{position:absolute;left:80px;top:80px;width:480px;height:320px;background:#eee}
#card{position:absolute;left:20px;top:20px;width:300px;height:180px;background:white;border-radius:8px}
#link{position:absolute;left:20px;top:20px}
#image{position:absolute;left:620px;top:100px;width:140px;height:100px}
#clipped{position:absolute;left:800px;top:350px;width:300px;height:160px;background:white}
#scroller{position:absolute;left:620px;top:450px;width:150px;height:80px;overflow:hidden}
#overflow{width:200px;height:120px;background:white}
#shadow{position:absolute;left:80px;top:440px;width:240px;height:100px}
iframe{position:absolute;left:360px;top:440px;width:180px;height:100px;border:0}
</style><button id="prior">Before picker</button><section id="group"><article id="card"><a id="link" href="#activated"><span>Read this card</span></a></article></section><img id="image" alt="Image" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='100'%3E%3Crect width='140' height='100' fill='white'/%3E%3C/svg%3E"><article id="clipped"></article><div id="scroller"><article id="overflow"></article></div><div id="shadow"></div><iframe srcdoc="<button>Frame action</button>"></iframe>`;

let browser;
let work;
try {
  const { transformWithEsbuild } = await import('vite');
  const source = await readFile(SOURCE, 'utf8');
  const { code } = await transformWithEsbuild(source, SOURCE, {
    loader: 'ts',
    format: 'iife',
    globalName: '__ep',
  });
  const puppeteer = await loadPuppeteer();
  work = await mkdtemp(join(tmpdir(), 'oss-element-smoke-'));
  browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    userDataDir: join(work, 'profile'),
    args: ['--no-first-run', '--no-default-browser-check', '--disable-gpu'],
  });
  const page = await browser.newPage();
  const crashes = [];
  page.on('pageerror', (error) => crashes.push(String(error)));
  await page.setViewport({ width: 1000, height: 700, deviceScaleFactor: 1 });
  async function setup() {
    await page.setContent(fixture);
    await page.addScriptTag({ content: code });
    await page.evaluate(() => {
      document.querySelector('#shadow').attachShadow({ mode: 'open' }).innerHTML =
        '<article style="width:220px;height:90px;background:white"><span>Shadow card</span></article>';
      globalThis.activations = 0;
      document.querySelector('#link').addEventListener('click', () => globalThis.activations++);
      document.querySelector('#prior').focus();
      // Drop all transpiler closure state: executeScript only receives this function.
      globalThis.picker = (0, eval)(`(${globalThis.__ep.selectElement.toString()})`);
    });
    await start();
  }
  async function start() {
    await page.evaluate((labels) => {
      globalThis.result = undefined;
      globalThis.picker(labels).then((value) => {
        globalThis.result = {
          value,
          overlayAtResolution: !!document.querySelector('[data-openscreenshot-element-picker]'),
        };
      });
    }, labels);
  }
  async function result() {
    await page.waitForFunction(() => globalThis.result !== undefined);
    return page.evaluate(() => globalThis.result);
  }
  async function selectedRect() {
    return page.evaluate(() => {
      const box = document
        .querySelector('[data-openscreenshot-element-picker]')
        ?.shadowRoot.querySelector('[data-selection]');
      if (!box || box.hidden) return null;
      const r = box.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height };
    });
  }
  async function control(label) {
    return page.evaluate((label) => {
      const root = document.querySelector('[data-openscreenshot-element-picker]').shadowRoot;
      const button = [...root.querySelectorAll('button')].find(
        (button) => button.textContent === label,
      );
      return button
        ? {
            disabled: button.disabled,
            hidden: button.hidden,
            focused: root.activeElement === button,
          }
        : null;
    }, label);
  }
  async function clickControl(label) {
    const point = await page.evaluate((label) => {
      const button = [
        ...document
          .querySelector('[data-openscreenshot-element-picker]')
          .shadowRoot.querySelectorAll('button'),
      ].find((button) => button.textContent === label);
      const r = button.getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    }, label);
    await page.mouse.click(point.x, point.y);
  }

  await setup();
  await page.mouse.move(130, 130);
  assert.deepEqual(
    await selectedRect(),
    { x: 100, y: 100, width: 300, height: 180 },
    'inline text targets its meaningful card',
  );
  const sharp = createRequire(import.meta.url)('sharp');
  const shot = await sharp(await page.screenshot())
    .raw()
    .toBuffer({ resolveWithObject: true });
  const pixel = (x, y) => shot.data[(y * shot.info.width + x) * shot.info.channels];
  assert.ok(
    pixel(300, 200) > 245 && pixel(600, 200) < 200,
    'selected content stays clear and the surrounding page dims',
  );
  await page.keyboard.press('ArrowUp');
  assert.deepEqual(
    await selectedRect(),
    { x: 80, y: 80, width: 480, height: 320 },
    'up selects containing section',
  );
  await page.mouse.move(131, 131);
  assert.deepEqual(
    await selectedRect(),
    { x: 80, y: 80, width: 480, height: 320 },
    'small pointer movement does not reset the selected ancestor',
  );

  await page.keyboard.press('ArrowDown');
  assert.deepEqual(
    await selectedRect(),
    { x: 100, y: 100, width: 300, height: 180 },
    'down restores smaller selection',
  );
  await page.mouse.click(130, 130);
  assert.deepEqual((await result()).value, {
    kind: 'element',
    rect: { x: 100, y: 100, width: 300, height: 180 },
  });
  assert.equal(
    (await result()).overlayAtResolution,
    false,
    'overlay removed before caller captures',
  );
  assert.equal(
    await page.evaluate(() => globalThis.activations),
    0,
    'selection click never activates link',
  );
  assert.equal(
    await page.evaluate(() => document.activeElement.id),
    'prior',
    'restores prior focus',
  );
  await page.mouse.click(130, 130);
  assert.equal(
    await page.evaluate(() => globalThis.activations),
    1,
    'event handlers removed after finish',
  );
  console.log('PASS meaningful hover, dimming, ancestor traversal, click capture and cleanup');

  await setup();
  await page.evaluate(() => {
    const card = document.querySelector('#card');
    const first = document.createElement('div');
    first.style.cssText = 'position:absolute;left:20px;top:70px;width:80px;height:50px';
    first.innerHTML = '<span>First detail</span>';
    const second = document.createElement('div');
    second.style.cssText = 'position:absolute;left:140px;top:70px;width:120px;height:50px';
    second.innerHTML = '<span>Hovered detail</span>';
    card.append(first, second);
  });
  await page.mouse.move(250, 180);
  assert.deepEqual(await selectedRect(), { x: 100, y: 100, width: 300, height: 180 });
  assert.equal(
    (await control(labels.smaller)).disabled,
    false,
    'initial card offers a smaller descendant without first growing',
  );
  await page.keyboard.press('ArrowDown');
  assert.deepEqual(
    await selectedRect(),
    { x: 240, y: 170, width: 120, height: 50 },
    'down prefers the eligible descendant under the pointer',
  );
  await page.keyboard.press('ArrowUp');
  await page.mouse.move(251, 181);
  assert.deepEqual(
    await selectedRect(),
    { x: 100, y: 100, width: 300, height: 180 },
    'tiny pointer movement preserves explicit enlargement',
  );
  await page.keyboard.press('ArrowDown');
  assert.deepEqual(
    await selectedRect(),
    { x: 240, y: 170, width: 120, height: 50 },
    'down still restores the enlarged selection history',
  );
  await page.mouse.move(330, 250);
  assert.deepEqual(await selectedRect(), { x: 100, y: 100, width: 300, height: 180 });
  await clickControl(labels.smaller);
  assert.deepEqual(
    await selectedRect(),
    { x: 120, y: 170, width: 80, height: 50 },
    'smaller control finds a sensible child when hover has no descendant',
  );
  await page.keyboard.press('Escape');
  await result();
  console.log('PASS initial descendant selection, hovered branch and pointer stability');

  await setup();
  await page.keyboard.press('ArrowRight');
  assert.ok(await selectedRect(), 'keyboard-only navigation finds a candidate');
  const first = await selectedRect();
  await page.keyboard.press('ArrowRight');
  assert.notDeepEqual(await selectedRect(), first, 'right moves to another candidate');
  await page.keyboard.press('ArrowLeft');
  assert.deepEqual(await selectedRect(), first, 'left returns to previous candidate');
  await page.keyboard.press('Escape');
  assert.equal((await result()).value, null);
  console.log('PASS keyboard-only candidate navigation and Escape');
  await setup();
  await page.mouse.move(130, 130);
  await page.keyboard.down('Shift');
  await page.keyboard.press('Tab');
  await page.keyboard.up('Shift');
  assert.equal(
    (await control(labels.cancel)).focused,
    true,
    'Shift+Tab from the dialog reaches the last control',
  );
  await page.keyboard.press('Enter');
  assert.equal((await result()).value, null, 'keyboard activates the focused cancel control');

  await setup();
  await page.mouse.move(850, 380);
  assert.equal(
    (await control(labels.capture)).disabled,
    true,
    'partially offscreen elements cannot be captured',
  );
  assert.equal(
    (await control(labels.fullPage)).hidden,
    false,
    'clipped selection offers explicit full-page fallback',
  );
  await page.keyboard.press('Enter');
  assert.equal(
    await page.evaluate(() => globalThis.result),
    undefined,
    'Enter never silently clips',
  );
  await clickControl(labels.fullPage);
  assert.deepEqual((await result()).value, { kind: 'full-page' });
  await setup();
  await page.mouse.move(650, 470);
  assert.equal(
    (await control(labels.capture)).disabled,
    true,
    'overflow-clipped elements are rejected too',
  );
  await page.keyboard.press('Escape');
  await result();
  console.log('PASS clipped viewport and overflow rejection, explicit fallback');

  await setup();
  await page.evaluate(() => {
    document.documentElement.style.cssText = 'direction:rtl;scrollbar-gutter:stable;';
    document.querySelector('#image').style.cssText =
      'position:fixed;left:auto;right:0;top:100px;width:140px;height:100px';
  });
  // Linux Chrome keeps the RTL gutter on the right, so a fixed x can land on the scrollbar.
  const rtlImage = await page.$eval('#image', (el) => {
    const r = el.getBoundingClientRect();
    return { x: (r.left + r.right) / 2, y: (r.top + r.bottom) / 2 };
  });
  await page.mouse.move(rtlImage.x, rtlImage.y);
  await new Promise((r) => setTimeout(r, 200));
  // DEBUG (not for merge): dump what the picker sees on this platform.
  console.log(
    'DEBUG',
    JSON.stringify(
      await page.evaluate(() => {
        const host = document.querySelector('[data-openscreenshot-element-picker]');
        const root = host.shadowRoot;
        const sel = root.querySelector('[data-selection]');
        const probe = root.querySelector('div[style*="inset"]') ?? root.lastElementChild;
        host.style.setProperty('visibility', 'hidden', 'important');
        const hit = document.elementFromPoint(990, 130);
        host.style.setProperty('visibility', 'visible', 'important');
        const img = document.querySelector('#image');
        const r = (el) => {
          const b = el?.getBoundingClientRect();
          return b && [b.left, b.top, b.right, b.bottom].map((n) => Math.round(n * 100) / 100);
        };
        const chain = [];
        for (let n = img; n; n = n.parentElement) {
          const c = getComputedStyle(n);
          chain.push({
            tag: n.tagName,
            ov: c.overflowX + '/' + c.overflowY,
            vis: c.visibility,
            op: c.opacity,
            clip: c.clipPath,
            rect: r(n),
            client: [n.clientLeft, n.clientTop, n.clientWidth, n.clientHeight],
            offset: [n.offsetWidth, n.offsetHeight],
          });
        }
        return {
          ua: navigator.userAgent,
          inner: [innerWidth, innerHeight],
          vv: [
            visualViewport.offsetLeft,
            visualViewport.offsetTop,
            visualViewport.width,
            visualViewport.height,
          ],
          scroll: [scrollX, scrollY],
          probe: r(probe),
          host: r(host),
          hit: hit && (hit.id || hit.tagName),
          selHidden: sel.hidden,
          sel: r(sel),
          status: root.querySelector('[role=status]')?.textContent,
          img: r(img),
          chain,
        };
      }),
    ),
  );
  assert.equal(
    (await control(labels.capture)).disabled,
    false,
    'RTL left scrollbar gutter does not reject the visible right edge',
  );
  await page.keyboard.press('Escape');
  await result();
  await page.evaluate(() => {
    document.documentElement.style.cssText = '';
  });

  await setup();
  await page.mouse.move(130, 130);
  await page.evaluate(() => {
    document.querySelector('#card').style.left = '70px';
    window.scrollTo(0, 30);
  });
  await page.keyboard.press('Enter');
  assert.deepEqual(
    (await result()).value,
    { kind: 'element', rect: { x: 150, y: 70, width: 300, height: 180 } },
    'confirmation recalculates after reflow and scroll',
  );
  await setup();
  await page.mouse.move(130, 130);
  await page.evaluate(() => document.querySelector('#card').remove());
  await page.keyboard.press('Enter');
  assert.equal(
    await page.evaluate(() => globalThis.result),
    undefined,
    'detached target cannot capture stale coordinates',
  );
  await page.keyboard.press('Escape');
  await result();
  console.log('PASS scroll/reflow revalidation and detached target');

  await setup();
  await page.mouse.move(120, 460);
  assert.deepEqual(
    await selectedRect(),
    { x: 80, y: 440, width: 220, height: 90 },
    'open shadow trees select their real card',
  );
  await page.mouse.move(400, 470);
  assert.deepEqual(
    await selectedRect(),
    { x: 360, y: 440, width: 180, height: 100 },
    'iframe selects its outer rectangle',
  );
  await page.keyboard.press('Escape');
  await result();
  await setup();
  await page.evaluate((labels) => {
    globalThis.second = globalThis.picker(labels);
  }, labels);
  await page.waitForFunction(() => globalThis.result !== undefined);
  assert.equal((await result()).value, null, 'second run cancels prior run');
  assert.equal(
    await page.evaluate(
      () => document.querySelectorAll('[data-openscreenshot-element-picker]').length,
    ),
    1,
    'only one overlay survives duplicate runs',
  );
  await page.keyboard.press('Escape');
  await page.evaluate(() => globalThis.second);
  assert.equal(
    await page.evaluate(() => document.activeElement.id),
    'prior',
    'duplicate cancellation preserves original focus',
  );
  assert.deepEqual(crashes, []);

  await page.evaluate(() => {
    const root = document.querySelector('#shadow').shadowRoot;
    const input = document.createElement('input');
    root.append(input);
    input.focus();
  });
  await start();
  await page.keyboard.press('Escape');
  await result();
  assert.equal(
    await page.evaluate(() => document.querySelector('#shadow').shadowRoot.activeElement?.tagName),
    'INPUT',
    'restores focus inside open shadow roots',
  );
  console.log('PASS shadow DOM, iframe boundaries and duplicate cleanup');
  console.log('Element picker smoke passed.');
} finally {
  if (browser) await browser.close();
  if (work) await rm(work, { recursive: true, force: true });
}
