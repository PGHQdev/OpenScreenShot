import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * `createContextMenus()` runs from `chrome.runtime.onInstalled`, which can
 * fire twice in quick succession (e.g. an extension reload while a prior
 * install/update event is still being handled). The user-reported symptom
 * was "duplicate id oss-express" specifically, but a fully-simultaneous
 * double-fire collides on every menu id this function creates, not just
 * that one — so this test pins the defect that exists (every id created
 * exactly once) rather than only the narrower symptom that was reported.
 *
 * The module under test (`src/background/index.ts`) has heavy import-time
 * side effects (it registers several `chrome.*` listeners, and its sibling
 * `./recording` registers more) — every `chrome` API it or its imports touch
 * at module scope has to exist before the dynamic import below runs.
 */

/** Every id `createContextMenus()` creates, in no particular order. */
const ALL_MENU_IDS = [
  'oss-parent',
  'oss-full-page',
  'oss-visible',
  'oss-region',
  'oss-icon-full-page',
  'oss-icon-visible',
  'oss-icon-region',
  'oss-settings',
  'oss-icon-settings',
  'oss-express',
];

/** Ids actually handed to `chrome.contextMenus.create` across both runs. */
let createdIds: string[];
/** Ids the fake currently considers live, mirroring real `contextMenus` state. */
let liveIds: Set<string>;
/** `chrome.storage.local.get` resolvers, in call order, so the test can
 *  release them in a controlled sequence instead of racing on real timers. */
let getResolvers: Array<(value: Record<string, unknown>) => void>;

function makeFakeChrome() {
  createdIds = [];
  liveIds = new Set();
  getResolvers = [];
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
      removeAll: vi.fn(() => {
        liveIds.clear();
        return Promise.resolve();
      }),
      create: vi.fn((props: { id: string }, callback?: () => void) => {
        createdIds.push(props.id);
        if (liveIds.has(props.id)) {
          fake.runtime.lastError = {
            message: `Cannot create item with duplicate id ${props.id}`,
          };
        } else {
          liveIds.add(props.id);
        }
        // Real Chrome invokes the callback (if any) with `lastError` set for
        // the duration of the call, then clears it before the next API call
        // — so `lastError` can't be asserted on after the fact; a collision
        // has to be observed through `createdIds` instead (below).
        callback?.();
        fake.runtime.lastError = undefined;
        return props.id;
      }),
      update: vi.fn((_id: string, _props: unknown, callback?: () => void) => callback?.()),
      onClicked: { addListener: vi.fn() },
    },
    commands: { onCommand: { addListener: vi.fn() } },
    // recording.ts registers this at module scope to finish a Record click
    // that was parked waiting on the tabCapture grant.
    permissions: { onAdded: { addListener: vi.fn() } },
    tabs: {
      onUpdated: { addListener: vi.fn() },
      query: vi.fn(() => Promise.resolve([])),
      create: vi.fn(() => Promise.resolve({})),
      captureVisibleTab: vi.fn(() => Promise.resolve('data:image/png;base64,')),
    },
    storage: {
      local: {
        get: vi.fn(
          () =>
            new Promise<Record<string, unknown>>((resolve) => {
              getResolvers.push(resolve);
            }),
        ),
        set: vi.fn(() => Promise.resolve()),
        remove: vi.fn(() => Promise.resolve()),
        getBytesInUse: vi.fn(() => Promise.resolve(0)),
      },
      onChanged: { addListener: vi.fn() },
      // recording.ts watches this at module scope: the surface that reads a
      // parked failure removes the key, and the badge has to follow.
      session: { onChanged: { addListener: vi.fn() } },
    },
    i18n: { getMessage: vi.fn((key: string) => key), getUILanguage: vi.fn(() => 'en') },
    windows: { WINDOW_ID_CURRENT: -2 },
    downloads: { download: vi.fn(() => Promise.resolve(1)) },
    scripting: { executeScript: vi.fn(() => Promise.resolve([{ result: undefined }])) },
  };
  return fake;
}

/** Flush pending microtasks without relying on real timers. */
async function flushMicrotasks(times = 10): Promise<void> {
  for (let i = 0; i < times; i++) await Promise.resolve();
}

/**
 * Release storage reads until no new one appears: a released read can queue
 * another (the express migration reads, writes, then the menu build reads
 * settings), so a single drain pass is not enough.
 */
async function releaseAllReads(rounds = 10): Promise<void> {
  for (let i = 0; i < rounds; i++) {
    await flushMicrotasks();
    while (getResolvers.length > 0) getResolvers.shift()?.({});
  }
  await flushMicrotasks();
}

let fakeChrome: ReturnType<typeof makeFakeChrome>;

describe('createContextMenus concurrency', () => {
  beforeEach(() => {
    vi.resetModules();
    fakeChrome = makeFakeChrome();
    vi.stubGlobal('chrome', fakeChrome);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('creates every menu id exactly once when two onInstalled events overlap', async () => {
    const mod = await import('../../src/background/index.ts');

    // Two `onInstalled` events firing close together: both calls start
    // before either has resolved anything, so both reach whatever their
    // first `chrome.storage.local.get` read is before either settles.
    const runA = mod.createContextMenus();
    const runB = mod.createContextMenus();
    await flushMicrotasks();

    // Release every pending settings read (however many runs actually made
    // one — a fixed, single-flight implementation makes only one) and let
    // both calls run to completion.
    await releaseAllReads();
    await Promise.all([runA, runB]);

    const counts = Object.fromEntries(
      ALL_MENU_IDS.map((id) => [id, createdIds.filter((created) => created === id).length]),
    );
    expect(counts).toEqual(Object.fromEntries(ALL_MENU_IDS.map((id) => [id, 1])));
  });
});

/**
 * A fresh install opens exactly one tab: the welcome page (rating funnel
 * Surface A). An update opens nothing — the update-time welcome is the
 * pattern users report extensions for. The setup page stays reachable only
 * from a failure, as before. These read the listener the module actually
 * registered and fire it rather than trusting the source.
 */
describe('onInstalled', () => {
  beforeEach(() => {
    vi.resetModules();
    fakeChrome = makeFakeChrome();
    vi.stubGlobal('chrome', fakeChrome);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  async function fireOnInstalled(reason: string): Promise<void> {
    await import('../../src/background/index.ts');
    const listener = fakeChrome.runtime.onInstalled.addListener.mock.calls[0]?.[0] as (details: {
      reason: string;
    }) => void;
    expect(listener, 'background/index.ts registers an onInstalled listener').toBeTypeOf(
      'function',
    );
    listener({ reason });
    // Let the migration and the menu build run every read they queue, so a
    // tab created after any of those awaits would still be caught below.
    await releaseAllReads();
  }

  const openedUrls = () =>
    fakeChrome.tabs.create.mock.calls.map(([opts]) => (opts as { url: string }).url);

  it('opens exactly the welcome page on a fresh install', async () => {
    await fireOnInstalled('install');
    expect(openedUrls()).toEqual(['chrome-extension://fake/src/welcome/index.html']);
    // The install still has to build the menus — the assertion above must not
    // pass by the listener having stopped doing its real work.
    expect(new Set(createdIds)).toEqual(new Set(ALL_MENU_IDS));
  });

  it('opens no tab on an update', async () => {
    await fireOnInstalled('update');
    expect(openedUrls()).toEqual([]);
  });
});
