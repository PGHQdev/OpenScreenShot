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
import { REC_FAILURE_KEY, REC_FAILURE_MESSAGE, isRecFailure } from '../../src/shared/rec-failure';

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
/**
 * Session storage is unavailable. Both halves fail, not just `get` — an API
 * that can read but not write is a state Chrome does not produce, and the
 * whole point of mode 7 is that the store the failure would be parked in is
 * the store that just broke.
 */
let sessionThrows: boolean;
/** Message types `chrome.runtime.sendMessage` should reject, by type. */
let sendRejects: Set<string>;

function makeFakeChrome() {
  session = new Map<string, unknown>();
  badgeText = [];
  sessionThrows = false;
  sendRejects = new Set<string>();
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
      sendMessage: vi.fn((msg: { type?: string }) =>
        sendRejects.has(msg?.type ?? '')
          ? Promise.reject(new Error('Receiving end does not exist.'))
          : Promise.resolve(),
      ),
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
          if (sessionThrows) return Promise.reject(new Error('session storage unavailable'));
          return Promise.resolve(session.has(key) ? { [key]: session.get(key) } : {});
        }),
        set: vi.fn((items: Record<string, unknown>) => {
          if (sessionThrows) return Promise.reject(new Error('session storage unavailable'));
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

/** Failure codes the worker broadcast to whatever surface is open. */
function broadcasts(): string[] {
  const calls = fakeChrome.runtime.sendMessage.mock.calls as [
    { type?: string; failure?: unknown },
  ][];
  return calls
    .filter(([msg]) => msg?.type === REC_FAILURE_MESSAGE)
    .map(([msg]) => (isRecFailure(msg.failure) ? msg.failure.code : 'malformed'));
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
  /**
   * Mode 7 is the one failure with no parked route: it fires because session
   * storage threw, and the park would be a write to that same storage. The
   * broadcast is what carries it, and that is enough here — REC_QUERY only
   * ever comes from a surface that is open and listening.
   */
  it('broadcasts query-failed rather than answering "not recording" in silence', async () => {
    await loadWorker();
    sessionThrows = true;
    const reply = await send({ type: 'REC_QUERY' });
    await settle();
    expect(reply).toEqual({ active: false, paused: false });
    // The reply is a guess. Without this the guess is all the user ever sees.
    expect(broadcasts()).toContain('query-failed');
    // And it could not have been parked: the store is what failed.
    sessionThrows = false;
    expect(parked()).toBe(null);
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

describe('an engine that was never told to begin', () => {
  /**
   * The worst shape a recording failure takes, and the one nothing downstream
   * can notice: `OFFSCREEN_START` is dispatched and dropped, so no
   * `ENGINE_ERROR` is coming, the rec state stays written, the badge stays REC
   * and the control bar counts up over a recording that is not happening.
   */
  it('reports engine-unreachable when OFFSCREEN_START never lands', async () => {
    fakeChrome.tabs.query = vi.fn(() =>
      Promise.resolve([{ id: 3, url: 'https://example.com' }]),
    ) as typeof fakeChrome.tabs.query;
    // A start that gets all the way through: the viewport read answers and
    // the bar mounts, so the dropped OFFSCREEN_START is the only thing wrong.
    fakeChrome.scripting.executeScript = vi.fn((arg: { args?: unknown[] }) =>
      Promise.resolve([
        { result: (arg.args?.length ?? 0) > 0 ? 'synced' : { w: 800, h: 600, dpr: 1 } },
      ]),
    ) as unknown as typeof fakeChrome.scripting.executeScript;
    sendRejects.add('OFFSCREEN_START');
    await loadWorker();
    void send({ type: 'REC_START', settings: DEFAULT_RECORDING_SETTINGS });
    await settle();

    expect(parked()).toBe('engine-unreachable');
    // The start itself did not throw, so this is the only report there is.
    expect(broadcasts()).toEqual(['engine-unreachable']);
  });
});

describe('one absent control bar, one message', () => {
  /**
   * The start reports a mount it could not make; the engine's watchdog
   * reports a bar that stopped sending 2.5-3.5s later. For a bar that was
   * never there those are the same situation, and two persistent toasts for
   * one problem is what §9.3 of the report rules out.
   */
  it('does not let the watchdog report a bar the start already reported', async () => {
    session.set(REC_STATE_KEY, liveState());
    session.set(REC_FAILURE_KEY, { code: 'overlay-blocked', at: Date.now() });
    await loadWorker();
    void send({ type: 'OVERLAY_LOST', sessionId: 'sess-1' });
    await settle();

    expect(parked()).toBe('overlay-blocked');
    expect(broadcasts()).toEqual([]);
    // The state and the badge are not the message, and still flip.
    expect(badgeText.at(-1)).toBe('REC');
  });

  it('still reports a bar that was up and then went away', async () => {
    session.set(REC_STATE_KEY, liveState());
    await loadWorker();
    void send({ type: 'OVERLAY_LOST', sessionId: 'sess-1' });
    await settle();
    expect(parked()).toBe('overlay-lost');
  });

  it('drops a parked overlay-blocked once the bar reaches the page', async () => {
    session.set(REC_STATE_KEY, liveState());
    session.set(REC_FAILURE_KEY, { code: 'overlay-blocked', at: Date.now() });
    await loadWorker();
    void send({ type: 'OVERLAY_HEALED', sessionId: 'sess-1' });
    await settle();
    expect(parked()).toBe(null);
  });
});

describe('a failed session that cannot be cleaned up', () => {
  /**
   * The distinct end state mode 5 names: the row is stuck at 'recording' with
   * no engine behind it, so the popup would offer it as a crash to recover.
   * Driven by breaking IndexedDB itself, which is what actually fails here.
   */
  it('reports cleanup-failed, not engine-failed, when the DB is unreachable', async () => {
    __closeForTests();
    // eslint-disable-next-line no-global-assign -- an IndexedDB that will not open
    indexedDB = {
      open: () => {
        const req: Record<string, unknown> = { error: new Error('db unavailable') };
        setTimeout(() => (req.onerror as (() => void) | undefined)?.(), 0);
        return req;
      },
    } as unknown as IDBFactory;
    session.set(REC_STATE_KEY, liveState('sess-broken', 'seg-broken'));
    await loadWorker();
    void send({ type: 'ENGINE_ERROR', sessionId: 'sess-broken', message: 'boom' });
    await settle();

    expect(parked()).toBe('cleanup-failed');
  });
});

describe('the worker-to-offscreen leg', () => {
  it('reports a stop the engine never received', async () => {
    session.set(REC_STATE_KEY, liveState());
    sendRejects.add('OFFSCREEN_STOP');
    await loadWorker();
    void send({ type: 'REC_STOP' });
    await settle();
    expect(parked()).toBe('control-unreachable');
  });

  it('reports a cancel the engine never received', async () => {
    session.set(REC_STATE_KEY, liveState());
    sendRejects.add('OFFSCREEN_CANCEL');
    await loadWorker();
    void send({ type: 'REC_CANCEL' });
    await settle();
    expect(parked()).toBe('control-unreachable');
  });

  it('reports a pause and a resume the engine never received', async () => {
    session.set(REC_STATE_KEY, liveState());
    sendRejects.add('OFFSCREEN_PAUSE');
    await loadWorker();
    void send({ type: 'REC_PAUSE' });
    await settle();
    expect(parked()).toBe('control-unreachable');

    await chrome.storage.session.remove(REC_FAILURE_KEY);
    sendRejects.delete('OFFSCREEN_PAUSE');
    sendRejects.add('OFFSCREEN_RESUME');
    void send({ type: 'REC_RESUME' });
    await settle();
    expect(parked()).toBe('control-unreachable');
  });
});

describe('a clean stop with a failure still owed', () => {
  it("keeps the '!' badge a recording's own failure earned", async () => {
    session.set(REC_STATE_KEY, liveState());
    session.set(REC_FAILURE_KEY, { code: 'overlay-lost', at: Date.now() });
    await loadWorker();
    badgeText.length = 0;
    void send({ type: 'ENGINE_STOPPED', sessionId: 'sess-1', canceled: false });
    await settle();
    // clearRecBadge() here used to wipe a message the user had not read.
    expect(badgeText.at(-1)).toBe('!');
  });
});
