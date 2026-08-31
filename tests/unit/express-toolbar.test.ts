import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * The toolbar click's branch is the popup *binding*: express mode unbinds
 * the popup so `action.onClicked` fires a full-page capture; express off
 * rebinds the popup and the listener never fires. These tests read the
 * bindings and listeners the background module actually registers, driving
 * it with an immediate in-memory `chrome.storage.local` (unlike the race
 * suite, nothing here needs reads held open).
 */

const SETTINGS_KEY = 'openscreenshot:settings';

let store: Map<string, unknown>;

function makeFakeChrome() {
  const fake = {
    runtime: {
      onInstalled: { addListener: vi.fn() },
      onStartup: { addListener: vi.fn() },
      onMessage: { addListener: vi.fn() },
      getURL: vi.fn((path: string) => `chrome-extension://fake/${path}`),
      sendMessage: vi.fn(() => Promise.resolve()),
      setUninstallURL: vi.fn(() => Promise.resolve()),
      getManifest: vi.fn(() => ({ version: '1.6.0' })),
      lastError: undefined as { message: string } | undefined,
    },
    action: {
      onClicked: { addListener: vi.fn() },
      setPopup: vi.fn(() => Promise.resolve()),
      setBadgeBackgroundColor: vi.fn(() => Promise.resolve()),
      setBadgeTextColor: vi.fn(() => Promise.resolve()),
      setBadgeText: vi.fn(() => Promise.resolve()),
    },
    contextMenus: {
      removeAll: vi.fn(() => Promise.resolve()),
      create: vi.fn((props: { id: string }, callback?: () => void) => {
        callback?.();
        return props.id;
      }),
      update: vi.fn((_id: string, _props: unknown, callback?: () => void) => callback?.()),
      onClicked: { addListener: vi.fn() },
    },
    commands: { onCommand: { addListener: vi.fn() } },
    permissions: { onAdded: { addListener: vi.fn() } },
    tabs: {
      onUpdated: { addListener: vi.fn() },
      query: vi.fn(() => Promise.resolve([])),
      create: vi.fn(() => Promise.resolve({})),
      captureVisibleTab: vi.fn(() => Promise.resolve('data:image/png;base64,')),
    },
    storage: {
      local: {
        get: vi.fn(async (keys: string | string[]) => {
          const list = Array.isArray(keys) ? keys : [keys];
          const out: Record<string, unknown> = {};
          for (const k of list) if (store.has(k)) out[k] = store.get(k);
          return out;
        }),
        set: vi.fn(async (items: Record<string, unknown>) => {
          for (const [k, v] of Object.entries(items)) store.set(k, v);
        }),
        remove: vi.fn(async (key: string) => void store.delete(key)),
        getBytesInUse: vi.fn(() => Promise.resolve(0)),
      },
      onChanged: { addListener: vi.fn() },
      session: { onChanged: { addListener: vi.fn() } },
    },
    i18n: { getMessage: vi.fn((key: string) => key), getUILanguage: vi.fn(() => 'en') },
    windows: { WINDOW_ID_CURRENT: -2 },
    downloads: { download: vi.fn(() => Promise.resolve(1)) },
    scripting: { executeScript: vi.fn(() => Promise.resolve([{ result: undefined }])) },
  };
  return fake;
}

async function flushMicrotasks(times = 20): Promise<void> {
  for (let i = 0; i < times; i++) await Promise.resolve();
}

let fakeChrome: ReturnType<typeof makeFakeChrome>;

async function importBackground() {
  const mod = await import('../../src/background/index.ts');
  await flushMicrotasks();
  return mod;
}

function lastPopupBinding(): string | undefined {
  const calls = fakeChrome.action.setPopup.mock.calls;
  return (calls[calls.length - 1]?.[0] as { popup: string } | undefined)?.popup;
}

beforeEach(() => {
  vi.resetModules();
  store = new Map();
  fakeChrome = makeFakeChrome();
  vi.stubGlobal('chrome', fakeChrome);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('toolbar-click branching', () => {
  it('express on (the default): unbinds the popup so the click captures', async () => {
    await importBackground();
    expect(lastPopupBinding()).toBe('');
  });

  it('express off: binds the popup, restoring the picker', async () => {
    store.set(SETTINGS_KEY, { expressMode: false });
    await importBackground();
    expect(lastPopupBinding()).toBe('src/popup/index.html');
  });

  it('an icon click starts a capture attempt against the active tab', async () => {
    await importBackground();
    const listener = fakeChrome.action.onClicked.addListener.mock.calls[0]?.[0] as () => void;
    expect(listener).toBeTypeOf('function');
    listener();
    await flushMicrotasks();
    expect(fakeChrome.tabs.query).toHaveBeenCalledWith({ active: true, currentWindow: true });
    // No tab in the fake: the attempt must surface as a capture error, which
    // proves the click went down the capture path rather than doing nothing.
    expect(fakeChrome.runtime.sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'CAPTURE_ERROR' }),
    );
  });
});

describe('context-menu surfaces', () => {
  function menuClick(menuItemId: string, checked?: boolean): void {
    const listener = fakeChrome.contextMenus.onClicked.addListener.mock.calls[0]?.[0] as (info: {
      menuItemId: string;
      checked?: boolean;
    }) => void;
    listener({ menuItemId, checked });
  }

  it('the icon-menu mode items start a capture', async () => {
    await importBackground();
    menuClick('oss-icon-visible');
    await flushMicrotasks();
    expect(fakeChrome.tabs.query).toHaveBeenCalledWith({ active: true, currentWindow: true });
  });

  it('the settings items open the popup page on its settings pane', async () => {
    await importBackground();
    for (const id of ['oss-settings', 'oss-icon-settings']) {
      fakeChrome.tabs.create.mockClear();
      menuClick(id);
      await flushMicrotasks();
      expect(fakeChrome.tabs.create).toHaveBeenCalledWith({
        url: 'chrome-extension://fake/src/popup/index.html?settings=1',
      });
    }
  });

  it('the express checkbox persists its new state', async () => {
    await importBackground();
    menuClick('oss-express', false);
    await flushMicrotasks();
    expect((store.get(SETTINGS_KEY) as { expressMode?: boolean }).expressMode).toBe(false);
  });
});
