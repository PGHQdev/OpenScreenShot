import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import {
  __closeForTests,
  createSession,
  getSession,
  listSessions,
} from '../../src/shared/recording-db';
import { DEFAULT_RECORDING_SETTINGS } from '../../src/shared/recording-types';
import { REC_FAILURE_KEY, isRecFailure } from '../../src/shared/rec-failure';

/**
 * The worker half of "surface every failure", driven through the listener
 * `src/background/recording.ts` registers rather than by calling its
 * internals: every one of these paths used to end at `console.error` or at a
 * bare `return`, and nothing else in the suite notices when one goes quiet
 * again. Each test enters the failure for real — a stubbed `chrome` that
 * fails the way the real API does — and reads what the worker parked for the
 * next popup open.
 */

const REC_STATE_KEY = 'openscreenshot:rec-state';

type Listener = (message: unknown, sender: unknown, respond: (r: unknown) => void) => unknown;

let session: Map<string, unknown>;
let badgeText: string[];
let sessionGetThrows: boolean;

function makeFakeChrome() {
  session = new Map<string, unknown>();
  badgeText = [];
  sessionGetThrows = false;
  const listeners: { message: Listener[]; storage: ((c: unknown) => void)[] } = {
    message: [],
    storage: [],
  };
  const notify = (key: string, newValue: unknown) => {
    for (const fn of listeners.storage) fn({ [key]: { newValue } });
  };
  const fake = {
    __listeners: listeners,
    runtime: {
      getURL: (path: string) => `chrome-extension://fake/${path}`,
      sendMessage: vi.fn(() => Promise.resolve()),
      onMessage: { addListener: (fn: Listener) => listeners.message.push(fn) },
      getContexts: vi.fn(() => Promise.resolve([])),
    },
    action: {
      setBadgeBackgroundColor: vi.fn(() => Promise.resolve()),
      setBadgeTextColor: vi.fn(() => Promise.resolve()),
      setBadgeText: vi.fn((arg: { text: string }) => {
        badgeText.push(arg.text);
        return Promise.resolve();
      }),
    },
    commands: { onCommand: { addListener: vi.fn() } },
    permissions: { onAdded: { addListener: vi.fn() } },
    tabs: {
      onUpdated: { addListener: vi.fn() },
      query: vi.fn(() => Promise.resolve([] as { id?: number; url?: string }[])),
      create: vi.fn(() => Promise.resolve({})),
    },
    scripting: { executeScript: vi.fn(() => Promise.resolve([{ result: undefined }])) },
    offscreen: {
      createDocument: vi.fn(() => Promise.resolve()),
      closeDocument: vi.fn(() => Promise.resolve()),
    },
    tabCapture: { getMediaStreamId: vi.fn(() => Promise.resolve('stream-1')) },
    storage: {
      session: {
        get: vi.fn((key: string) => {
          if (sessionGetThrows) return Promise.reject(new Error('session storage unavailable'));
          return Promise.resolve(session.has(key) ? { [key]: session.get(key) } : {});
        }),
        set: vi.fn((items: Record<string, unknown>) => {
          for (const [key, value] of Object.entries(items)) {
            session.set(key, value);
            notify(key, value);
          }
          return Promise.resolve();
        }),
        remove: vi.fn((key: string) => {
          session.delete(key);
          notify(key, undefined);
          return Promise.resolve();
        }),
        onChanged: { addListener: (fn: (c: unknown) => void) => listeners.storage.push(fn) },
      },
    },
  };
  return fake;
}

let fakeChrome: ReturnType<typeof makeFakeChrome>;

async function loadWorker(): Promise<void> {
  await import('../../src/background/recording.ts');
}

/** Deliver a message to every listener the module registered. */
function send(message: unknown): Promise<unknown> {
  return new Promise((resolve) => {
    let answered = false;
    for (const fn of fakeChrome.__listeners.message) {
      fn(message, {}, (r) => {
        answered = true;
        resolve(r);
      });
    }
    if (!answered) setTimeout(() => resolve(undefined), 0);
  });
}

/**
 * Let the handler run to completion. Microtask flushes are not enough: these
 * paths touch IndexedDB, whose callbacks land on real macrotasks.
 */
async function settle(rounds = 12): Promise<void> {
  for (let i = 0; i < rounds; i++) {
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
}

/** The failure code the worker parked, or null. */
function parked(): string | null {
  const value = session.get(REC_FAILURE_KEY);
  return isRecFailure(value) ? value.code : null;
}

function liveState(sessionId = 'sess-1', segmentId = 'seg-1') {
  return {
    sessionId,
    segmentId,
    tabId: 7,
    startedAt: Date.now(),
    pausedAt: 0,
    pausedAccumMs: 0,
    settings: DEFAULT_RECORDING_SETTINGS,
    overlayLost: false,
    continued: false,
  };
}

beforeEach(() => {
  vi.resetModules();
  __closeForTests();
  // eslint-disable-next-line no-global-assign -- fresh fake-indexeddb per test
  indexedDB = new IDBFactory();
  fakeChrome = makeFakeChrome();
  vi.stubGlobal('chrome', fakeChrome);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('a start that never begins', () => {
  it('reports start-busy when a recording is already running', async () => {
    session.set(REC_STATE_KEY, liveState());
    await loadWorker();
    void send({ type: 'REC_START', settings: DEFAULT_RECORDING_SETTINGS });
    await settle();
    expect(parked()).toBe('start-busy');
  });

  it('reports start-blocked when there is no tab it may record', async () => {
    await loadWorker();
    // No active tab at all — the same silent `return` a chrome:// tab takes.
    void send({ type: 'REC_START', settings: DEFAULT_RECORDING_SETTINGS });
    await settle();
    expect(parked()).toBe('start-blocked');
  });

  it('reports start-blocked on a protected page', async () => {
    fakeChrome.tabs.query = vi.fn(() =>
      Promise.resolve([{ id: 3, url: 'chrome://extensions' }]),
    ) as typeof fakeChrome.tabs.query;
    await loadWorker();
    void send({ type: 'REC_START', settings: DEFAULT_RECORDING_SETTINGS });
    await settle();
    expect(parked()).toBe('start-blocked');
  });

  it('reports start-failed when the start throws on its way to the engine', async () => {
    fakeChrome.tabs.query = vi.fn(() =>
      Promise.resolve([{ id: 3, url: 'https://example.com' }]),
    ) as typeof fakeChrome.tabs.query;
    fakeChrome.offscreen.createDocument = vi.fn(() =>
      Promise.reject(new Error('offscreen refused')),
    ) as typeof fakeChrome.offscreen.createDocument;
    await loadWorker();
    void send({ type: 'REC_START', settings: DEFAULT_RECORDING_SETTINGS });
    await settle();
    expect(parked()).toBe('start-failed');
  });
});

describe('the badge, which is the only surface with nothing open', () => {
  it("puts '!' up for a parked failure and takes it down when it is read", async () => {
    await loadWorker();
    void send({ type: 'REC_START', settings: DEFAULT_RECORDING_SETTINGS });
    await settle();
    expect(badgeText.at(-1)).toBe('!');

    // The popup consuming the failure removes the key; the worker's own
    // storage listener is what clears the badge behind it.
    badgeText.length = 0;
    await fakeChrome.storage.session.remove(REC_FAILURE_KEY);
    await settle();
    expect(badgeText.at(-1)).toBe('');
  });
});

describe('REC_QUERY', () => {
  it('reports query-failed rather than answering "not recording" in silence', async () => {
    await loadWorker();
    sessionGetThrows = true;
    const reply = await send({ type: 'REC_QUERY' });
    await settle();
    expect(reply).toEqual({ active: false, paused: false });
    // The reply is a guess. Without this the guess is all the user ever sees.
    sessionGetThrows = false;
    expect(parked()).toBe('query-failed');
  });
});

describe('the control bar', () => {
  it('reports overlay-lost when the bar stops reporting', async () => {
    session.set(REC_STATE_KEY, liveState());
    await loadWorker();
    void send({ type: 'OVERLAY_LOST', sessionId: 'sess-1' });
    await settle();
    expect(parked()).toBe('overlay-lost');
  });

  it('drops the parked message once the bar heals', async () => {
    session.set(REC_STATE_KEY, liveState());
    await loadWorker();
    void send({ type: 'OVERLAY_LOST', sessionId: 'sess-1' });
    await settle();
    expect(parked()).toBe('overlay-lost');
    void send({ type: 'OVERLAY_HEALED', sessionId: 'sess-1' });
    await settle();
    expect(parked()).toBe(null);
  });

  it('reports overlay-blocked when the bar cannot be injected at all', async () => {
    fakeChrome.tabs.query = vi.fn(() =>
      Promise.resolve([{ id: 3, url: 'https://example.com' }]),
    ) as typeof fakeChrome.tabs.query;
    fakeChrome.scripting.executeScript = vi.fn((arg: { args?: unknown[] }) => {
      // The viewport read (no args) succeeds; only the overlay mount, which
      // carries the bar's four arguments, is refused — what an origin without
      // host permission actually does.
      if ((arg.args?.length ?? 0) > 0) {
        return Promise.reject(new Error('no permission on this origin'));
      }
      return Promise.resolve([{ result: { w: 800, h: 600, dpr: 1 } }]);
    }) as unknown as typeof fakeChrome.scripting.executeScript;
    await loadWorker();
    void send({ type: 'REC_START', settings: DEFAULT_RECORDING_SETTINGS });
    await settle();
    expect(parked()).toBe('overlay-blocked');
  });
});

describe('an engine that never started', () => {
  it('reports engine-failed and keeps the session to show for it', async () => {
    const recording = await createSession(DEFAULT_RECORDING_SETTINGS);
    session.set(REC_STATE_KEY, { ...liveState(recording.id, 'seg-1') });
    await loadWorker();
    void send({
      type: 'ENGINE_ERROR',
      sessionId: recording.id,
      message: 'Could not start audio source',
    });
    await settle();

    expect(parked()).toBe('engine-failed');
    // The whole point of the retention: the row used to be deleted here, so
    // the failure left nothing at all behind.
    const kept = await getSession(recording.id);
    expect(kept, 'the failed session was deleted').not.toBeNull();
    expect(kept?.status).toBe('failed');
  });

  it('keeps only the newest failed session', async () => {
    const older = await createSession(DEFAULT_RECORDING_SETTINGS);
    const newer = await createSession(DEFAULT_RECORDING_SETTINGS);

    session.set(REC_STATE_KEY, liveState(older.id, 'seg-a'));
    await loadWorker();
    void send({ type: 'ENGINE_ERROR', sessionId: older.id, message: 'boom' });
    await settle();
    expect((await getSession(older.id))?.status).toBe('failed');

    session.set(REC_STATE_KEY, liveState(newer.id, 'seg-b'));
    void send({ type: 'ENGINE_ERROR', sessionId: newer.id, message: 'boom again' });
    await settle();

    expect(await getSession(older.id), 'the older failure accumulated').toBeNull();
    expect((await getSession(newer.id))?.status).toBe('failed');
    expect((await listSessions()).length).toBe(1);
  });
});
