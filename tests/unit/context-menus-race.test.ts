import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * `createContextMenus()` runs from `chrome.runtime.onInstalled`, which can
 * fire twice in quick succession (e.g. an extension reload while a prior
 * install/update event is still being handled). Two overlapping runs both
 * clear the menus and both try to (re)create `oss-express`, so the second
 * `create` throws "Cannot create item with duplicate id oss-express". This
 * test fires two overlapping calls and asserts `oss-express` is only ever
 * created once, whichever run creates it.
 *
 * The module under test (`src/background/index.ts`) has heavy import-time
 * side effects (it registers several `chrome.*` listeners, and its sibling
 * `./recording` registers more) — every `chrome` API it or its imports touch
 * at module scope has to exist before the dynamic import below runs.
 */

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
        // the duration of the call, then clears it. An uncalled callback
        // leaves it set — the "Unchecked runtime.lastError" Chrome logs.
        callback?.();
        fake.runtime.lastError = undefined;
        return props.id;
      }),
      update: vi.fn((_id: string, _props: unknown, callback?: () => void) => callback?.()),
      onClicked: { addListener: vi.fn() },
    },
    commands: { onCommand: { addListener: vi.fn() } },
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
    },
    i18n: { getMessage: vi.fn((key: string) => key) },
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

  it('does not double-create oss-express when two onInstalled events overlap', async () => {
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
    while (getResolvers.length > 0) getResolvers.shift()?.({});
    await flushMicrotasks();
    while (getResolvers.length > 0) getResolvers.shift()?.({});
    await Promise.all([runA, runB]);

    const expressCreates = createdIds.filter((id) => id === 'oss-express');
    expect(expressCreates.length).toBe(1);
    expect(fakeChrome.runtime.lastError).toBeUndefined();
  });
});
