import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setLastCapture, setLastRegion } from '../../src/shared/storage';

vi.mock('../../src/background/recording', () => ({ restoreRecBadge: vi.fn() }));
vi.mock('../../src/shared/rating', () => ({ recordExportSuccess: vi.fn() }));
vi.mock('../../src/shared/storage', () => ({
  getSettings: async () => ({
    captureDelay: 0,
    captureAction,
    expressMode: true,
    filenameTemplate: 'shot',
  }),
  getLastRegion: async () => ({ x: 20, y: 20, width: 100, height: 100 }),
  setLastRegion: vi.fn(),
  setLastCapture: vi.fn(),
  setSettings: vi.fn(),
  migrateExpressDefault: vi.fn(),
  onSettingsChanged: vi.fn(),
}));

// Chrome is the external boundary: record injection/capture ordering while the
// real worker runs all lifecycle branches, timers, progress and delivery.
let events: string[];
let messages: Array<{ type: string }>;
let listener: (message: unknown) => void;
let failAt: string | undefined;
let captures: number;
let overlayVisible: boolean;
let elementSelection: unknown;
let pixelRatio: number;
let innerScroller: boolean;
let cropArgs: unknown[];
let captureAction: 'editor' | 'clipboard' | 'download';
let sourceTabActive: boolean;
let switchTabAfterSelection: boolean;
let switchTabBeforeSnapshot: boolean;
let fakeChrome: ReturnType<typeof makeChrome>;
function makeChrome() {
  const noop = vi.fn(async () => undefined);
  return {
    runtime: {
      onInstalled: { addListener: noop },
      onStartup: { addListener: noop },
      onMessage: {
        addListener: (fn: typeof listener) => {
          listener = fn;
        },
      },
      getURL: (path: string) => path,
      getManifest: () => ({ version: '2' }),
      setUninstallURL: noop,
      sendMessage: async (message: { type: string }) => {
        messages.push(message);
      },
    },
    action: {
      onClicked: { addListener: noop },
      setPopup: noop,
      setBadgeBackgroundColor: noop,
      setBadgeTextColor: noop,
      setBadgeText: vi.fn(async (_details: { text: string }) => undefined),
      setTitle: noop,
      getTitle: async () => 'Title',
    },
    commands: { onCommand: { addListener: noop } },
    contextMenus: { onClicked: { addListener: noop }, update: noop, create: noop },
    i18n: { getMessage: (key: string) => key, getUILanguage: () => 'en' },
    windows: {
      WINDOW_ID_CURRENT: -2,
      get: vi.fn(async () => {
        throw new Error('window closed');
      }),
      create: vi.fn(async () => {
        events.push('window:open');
        return { id: 9 };
      }),
      remove: vi.fn(async () => {
        events.push('window:close');
      }),
    },
    tabs: {
      query: async () => [
        { id: sourceTabActive ? 7 : 8, windowId: 1, url: 'https://example.com', title: 'Example' },
      ],
      create: async (details: { windowId: number }) => {
        expect(details.windowId).toBe(1);
        events.push('deliver');
        if (failAt === 'deliver') throw new Error('delivery failed');
      },
      captureVisibleTab: async (windowId: number) => {
        expect(windowId).toBe(1);
        events.push('snapshot');
        expect(overlayVisible, 'overlay must never be visible in captured pixels').toBe(false);
        captures++;
        if (failAt === `snapshot:${captures}`) throw new Error('capture failed');
        return 'data:image/png;base64,tile';
      },
    },
    downloads: { download: vi.fn(async () => 1) },
    scripting: {
      executeScript: async ({
        func,
        args,
      }: {
        func: (...args: never[]) => unknown;
        args: unknown[];
      }) => {
        const name = func.name;
        const event = name === 'updateCaptureOverlay' ? `overlay:${args[0]}` : name;
        events.push(event);
        if (event === failAt) throw new Error('injection failed');
        if (name === 'updateCaptureOverlay') overlayVisible = args[0] === 'show';
        if (name === 'updateCaptureOverlay' && args[0] === 'hide' && switchTabBeforeSnapshot) {
          sourceTabActive = false;
        }
        let result: unknown;
        if (name === 'getMetrics')
          result = {
            viewportWidth: innerScroller ? 600 : 800,
            viewportHeight: innerScroller ? 400 : 600,
            scrollHeight: 1500,
            devicePixelRatio: pixelRatio,
            container: null,
          };
        if (name === 'getWindowViewport') result = func();
        if (name === 'scrollToPosition') result = { scrollY: args[0], atBottom: false };
        if (name === 'selectRegion') result = { x: 20, y: 20, width: 100, height: 100 };
        if (name === 'selectElement') {
          result = elementSelection;
          if (switchTabAfterSelection) sourceTabActive = false;
        }
        if (name === 'copyImageToClipboard') result = true;
        if (name === 'cropTile') cropArgs = args;
        if (name === 'stitchTiles' || name === 'cropTile')
          result = 'data:image/png;base64,finished';
        return [{ result }];
      },
    },
  };
}
async function capture(mode = 'full-page') {
  listener({ type: 'CAPTURE_REQUEST', mode });
  await vi.runAllTimersAsync();
}

beforeEach(async () => {
  vi.resetModules();
  vi.useFakeTimers();
  events = [];
  messages = [];
  captures = 0;
  overlayVisible = false;
  elementSelection = { kind: 'element', rect: { x: 20, y: 30, width: 100, height: 80 } };
  pixelRatio = 1;
  innerScroller = false;
  vi.stubGlobal('window', {
    innerWidth: 800,
    innerHeight: 600,
    get devicePixelRatio() {
      return pixelRatio;
    },
  });
  cropArgs = [];
  captureAction = 'editor';
  sourceTabActive = true;
  switchTabAfterSelection = false;
  switchTabBeforeSnapshot = false;
  vi.mocked(setLastCapture).mockClear();
  vi.mocked(setLastRegion).mockClear();
  failAt = undefined;
  fakeChrome = makeChrome();
  vi.stubGlobal('chrome', fakeChrome);
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  await import('../../src/background/index');
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('screenshot capture overlay lifecycle', () => {
  it('shows external progress throughout capture without a page overlay', async () => {
    await capture();
    expect(captures).toBe(3);
    const snapshots = events.flatMap((event, index) => (event === 'snapshot' ? [index] : []));
    for (const index of snapshots) {
      expect(events[index - 1]).toBe('overlay:hide');
    }
    expect(events).not.toContain('overlay:show');
    expect(events.indexOf('window:open')).toBeLessThan(snapshots[0]);
    expect(fakeChrome.windows.create).toHaveBeenCalledWith(
      expect.objectContaining({ focused: true }),
    );
    expect(fakeChrome.windows.remove).toHaveBeenCalledWith(9);
    expect(messages.filter((m) => m.type === 'CAPTURE_PROGRESS')).toEqual([
      { type: 'CAPTURE_PROGRESS', percent: 0 },
      { type: 'CAPTURE_PROGRESS', percent: 33 },
      { type: 'CAPTURE_PROGRESS', percent: 67 },
      { type: 'CAPTURE_PROGRESS', percent: 100 },
    ]);
    expect(fakeChrome.action.setBadgeText.mock.calls.map(([value]) => value)).toEqual(
      expect.arrayContaining([{ text: '0%' }, { text: '33%' }, { text: '67%' }, { text: '100%' }]),
    );
    expect(events.indexOf('stitchTiles')).toBeLessThan(events.lastIndexOf('overlay:remove'));
    expect(events).toContain('overlay:remove');
    expect(messages.some((m) => m.type === 'CAPTURE_COMPLETE')).toBe(true);
  });

  it.each(['snapshot:1', 'snapshot:2', 'prepareCapture', 'stitchTiles', 'deliver'])(
    'restores the page and removes the overlay when %s fails',
    async (stage) => {
      failAt = stage;
      await capture();
      expect(events).toContain('restoreCapture');
      expect(fakeChrome.windows.remove).toHaveBeenCalledWith(9);
      expect(events).toContain('overlay:remove');
      expect(overlayVisible).toBe(false);
      expect(messages.some((m) => m.type === 'CAPTURE_ERROR')).toBe(true);
      expect(messages.some((m) => m.type === 'CAPTURE_COMPLETE')).toBe(false);
    },
  );

  it('removes the overlay even when restoring the page fails', async () => {
    failAt = 'restoreCapture';
    await capture();
    expect(events).toContain('overlay:remove');
    expect(overlayVisible).toBe(false);
  });

  it('aborts a snapshot when the overlay cannot be hidden', async () => {
    failAt = 'overlay:hide';
    await capture();
    expect(captures).toBe(0);
    expect(events).toContain('overlay:remove');
  });

  it.each(['visible', 'region', 'element'])(
    'shows finishing for %s only after the clean snapshot',
    async (mode) => {
      await capture(mode);
      expect(captures).toBe(1);
      expect(fakeChrome.windows.create).not.toHaveBeenCalled();
      expect(events.indexOf('overlay:show')).toBeGreaterThan(events.indexOf('snapshot'));
      expect(events).toContain('overlay:remove');
      expect(messages.some((m) => m.type === 'CAPTURE_COMPLETE')).toBe(true);
    },
  );

  it.each([
    ['visible', 'snapshot:1'],
    ['visible', 'deliver'],
    ['region', 'snapshot:1'],
    ['region', 'cropTile'],
    ['region', 'deliver'],
    ['element', 'snapshot:1'],
    ['element', 'cropTile'],
    ['element', 'deliver'],
  ])('cleans up %s when %s fails', async (mode, stage) => {
    failAt = stage;
    await capture(mode);
    expect(events).toContain('overlay:remove');
    expect(overlayVisible).toBe(false);
    expect(messages.some((m) => m.type === 'CAPTURE_COMPLETE')).toBe(false);
    expect(messages.some((m) => m.type === 'CAPTURE_ERROR')).toBe(true);
  });

  it('retains a live ready window and does not open the editor automatically', async () => {
    fakeChrome.windows.get.mockImplementation(async () => ({}) as never);
    await capture();
    expect(events).not.toContain('deliver');
    expect(fakeChrome.windows.remove).not.toHaveBeenCalled();
    expect(messages).toContainEqual({
      type: 'CAPTURE_WINDOW_PROGRESS',
      percent: 100,
      result: 'editor',
      sourceWindowId: 1,
    });
  });

  it('continues when opening the progress window fails', async () => {
    fakeChrome.windows.create.mockRejectedValueOnce(new Error('blocked'));
    await capture();
    expect(captures).toBe(3);
    expect(messages.some((m) => m.type === 'CAPTURE_COMPLETE')).toBe(true);
  });

  it('continues when the user already closed the progress window', async () => {
    fakeChrome.windows.remove.mockRejectedValueOnce(new Error('already closed'));
    await capture();
    expect(captures).toBe(3);
    expect(messages.some((m) => m.type === 'CAPTURE_COMPLETE')).toBe(true);
  });

  it('ignores overlapping capture requests to protect tile and overlay ownership', async () => {
    listener({ type: 'CAPTURE_REQUEST', mode: 'full-page' });
    listener({ type: 'CAPTURE_REQUEST', mode: 'visible' });
    await vi.runAllTimersAsync();
    expect(captures).toBe(3);
    expect(messages.filter((m) => m.type === 'CAPTURE_COMPLETE')).toHaveLength(1);
  });

  it('crops the chosen element at device resolution and keeps repeat-region unchanged', async () => {
    pixelRatio = 2;
    await capture('element');
    expect(cropArgs).toEqual(['data:image/png;base64,tile', 40, 60, 200, 160]);
    expect(setLastCapture).toHaveBeenCalledWith(
      expect.objectContaining({ mode: 'element', width: 200, height: 160 }),
    );
    expect(setLastRegion).not.toHaveBeenCalled();
    expect(events.indexOf('selectElement')).toBeLessThan(events.indexOf('snapshot'));
    expect(events.indexOf('getWindowViewport')).toBeGreaterThan(events.indexOf('selectElement'));
  });

  it('uses window coordinates for elements inside an offset inner scroll panel', async () => {
    innerScroller = true;
    elementSelection = { kind: 'element', rect: { x: 650, y: 450, width: 100, height: 80 } };
    await capture('element');
    expect(cropArgs).toEqual(['data:image/png;base64,tile', 650, 450, 100, 80]);
    expect(captures).toBe(1);
  });

  it('sizes visible captures from the window when an inner panel scrolls', async () => {
    innerScroller = true;
    await capture('visible');
    expect(setLastCapture).toHaveBeenCalledWith(
      expect.objectContaining({ mode: 'visible', width: 800, height: 600 }),
    );
  });

  it('does not capture or deliver when the element picker is cancelled', async () => {
    elementSelection = null;
    await capture('element');
    expect(events).toContain('selectElement');
    expect(captures).toBe(0);
    expect(setLastCapture).not.toHaveBeenCalled();
    expect(events).not.toContain('deliver');
    expect(messages.some((m) => m.type === 'CAPTURE_ERROR')).toBe(false);
  });

  it('does not capture a different tab after the picker returns', async () => {
    switchTabAfterSelection = true;
    await capture('element');
    expect(captures).toBe(0);
    expect(setLastCapture).not.toHaveBeenCalled();
  });

  it('rechecks the active tab immediately before capturing element pixels', async () => {
    switchTabBeforeSnapshot = true;
    await capture('element');
    expect(captures).toBe(0);
    expect(setLastCapture).not.toHaveBeenCalled();
    expect(messages.some((m) => m.type === 'CAPTURE_ERROR')).toBe(true);
  });

  it('sends element captures directly to the clipboard when configured', async () => {
    captureAction = 'clipboard';
    await capture('element');
    expect(events).toContain('copyImageToClipboard');
    expect(events).not.toContain('deliver');
    expect(setLastCapture).toHaveBeenCalledWith(expect.objectContaining({ mode: 'element' }));
    expect(messages.some((m) => m.type === 'CAPTURE_COMPLETE')).toBe(true);
  });

  it('downloads element captures as PNG without opening the editor when configured', async () => {
    captureAction = 'download';
    await capture('element');
    expect(fakeChrome.downloads.download).toHaveBeenCalledWith({
      url: 'data:image/png;base64,finished',
      filename: 'shot.png',
      saveAs: false,
    });
    expect(events).not.toContain('deliver');
    expect(messages.some((m) => m.type === 'CAPTURE_COMPLETE')).toBe(true);
  });

  it('uses full-page capture only when the user selects that fallback', async () => {
    elementSelection = { kind: 'full-page' };
    await capture('element');
    expect(captures).toBe(3);
    expect(events).toContain('stitchTiles');
    expect(setLastCapture).toHaveBeenCalledWith(expect.objectContaining({ mode: 'full-page' }));
  });

  it.each([
    { x: -1, y: 20, width: 100, height: 100 },
    { x: 700, y: 20, width: 101, height: 100 },
    { x: 20, y: 500, width: 100, height: 101 },
    { x: NaN, y: 20, width: 100, height: 100 },
  ])(
    'refuses invalid or clipped element bounds instead of silently cropping them: %o',
    async (rect) => {
      elementSelection = { kind: 'element', rect };
      await capture('element');
      expect(events).toContain('selectElement');
      expect(captures).toBe(0);
      expect(setLastCapture).not.toHaveBeenCalled();
      expect(messages.some((m) => m.type === 'CAPTURE_ERROR')).toBe(true);
    },
  );
});
