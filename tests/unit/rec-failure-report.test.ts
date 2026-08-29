import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import {
  __closeForTests,
  createSession,
  getSession,
  listSessions,
  updateSession,
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

/**
 * Deliver a message to every listener the module registered. A handler that
 * answers does so asynchronously — REC_QUERY reaches IndexedDB — so the
 * fallback has to outlast that rather than beat it; it exists only so a
 * message nobody answers does not hang the test.
 */
function send(message: unknown): Promise<unknown> {
  return new Promise((resolve) => {
    for (const fn of fakeChrome.__listeners.message) {
      fn(message, {}, resolve);
    }
    setTimeout(() => resolve(undefined), 500);
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

function liveState(sessionId = 'sess-1', segmentId = 'seg-1', overlayMounted = true) {
  return {
    sessionId,
    segmentId,
    tabId: 7,
    startedAt: Date.now(),
    pausedAt: 0,
    pausedAccumMs: 0,
    settings: DEFAULT_RECORDING_SETTINGS,
    overlayLost: false,
    overlayMounted,
    continued: false,
  };
}

/** An executeScript that answers the viewport read and mounts the bar. */
function workingTab(): void {
  fakeChrome.tabs.query = vi.fn(() =>
    Promise.resolve([{ id: 3, url: 'https://example.com' }]),
  ) as typeof fakeChrome.tabs.query;
  fakeChrome.scripting.executeScript = vi.fn((arg: { args?: unknown[] }) =>
    Promise.resolve([
      { result: (arg.args?.length ?? 0) > 0 ? 'synced' : { w: 800, h: 600, dpr: 1 } },
    ]),
  ) as unknown as typeof fakeChrome.scripting.executeScript;
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
    // A start that gets all the way through: the viewport read answers and
    // the bar mounts, so the dropped OFFSCREEN_START is the only thing wrong.
    workingTab();
    sendRejects.add('OFFSCREEN_START');
    await loadWorker();
    void send({ type: 'REC_START', settings: DEFAULT_RECORDING_SETTINGS });
    await settle();

    expect(parked()).toBe('engine-unreachable');
    // The start itself did not throw, so this is the only report there is.
    expect(broadcasts()).toEqual(['engine-unreachable']);
  });

  /**
   * Reporting alone left the phantom standing: the message says "Stop and try
   * again" and Stop could not work. `OFFSCREEN_STOP` reaches an engine whose
   * own state is null, which parks it and returns without ENGINE_STOPPED, so
   * the state was never cleared and `handleQuery`'s escape hatch could not
   * fire either — `hasOffscreenDocument()` is true. The run is torn down at
   * the point of failure instead.
   */
  it('tears the phantom run down, so nothing is left claiming a recording', async () => {
    workingTab();
    sendRejects.add('OFFSCREEN_START');
    await loadWorker();
    void send({ type: 'REC_START', settings: DEFAULT_RECORDING_SETTINGS });
    await settle();

    expect(session.get(REC_STATE_KEY), 'the stored recording state').toBeUndefined();
    expect(fakeChrome.offscreen.closeDocument).toHaveBeenCalled();
    expect(badgeText.at(-1), 'the badge shows the failure, not REC').toBe('!');
  });

  it('leaves a Stop that follows it with nothing to do and nothing to say', async () => {
    workingTab();
    sendRejects.add('OFFSCREEN_START');
    await loadWorker();
    void send({ type: 'REC_START', settings: DEFAULT_RECORDING_SETTINGS });
    await settle();
    await chrome.storage.session.remove(REC_FAILURE_KEY);

    // The document is gone, so a forwarded stop would reject and park a
    // second message for one failure — the class Important 2 closed.
    sendRejects.add('OFFSCREEN_STOP');
    void send({ type: 'REC_STOP' });
    await settle();
    expect(parked(), 'a stop after the teardown reports nothing').toBe(null);
  });
});

describe('a chunk that never reached IndexedDB', () => {
  it('reports chunk-write-failed without stopping the recording', async () => {
    session.set(REC_STATE_KEY, liveState());
    await loadWorker();
    void send({ type: 'ENGINE_WRITE_FAILED', sessionId: 'sess-1' });
    await settle();

    expect(parked()).toBe('chunk-write-failed');
    // The chunks already written are a real recording; tearing down here
    // would throw away exactly what the message is telling the user to save.
    expect(session.get(REC_STATE_KEY), 'the recording keeps running').toBeDefined();
  });

  it('ignores a write failure from a session that already ended', async () => {
    session.set(REC_STATE_KEY, liveState('sess-2'));
    await loadWorker();
    void send({ type: 'ENGINE_WRITE_FAILED', sessionId: 'sess-1' });
    await settle();
    expect(parked()).toBe(null);
  });
});

describe('a finished recording whose page will not open', () => {
  it('reports recorder-open-failed and offers the session through Recover', async () => {
    const done = await createSession(DEFAULT_RECORDING_SETTINGS);
    await updateSession(done.id, { status: 'complete' });
    fakeChrome.tabs.create = vi.fn(() =>
      Promise.reject(new Error('no window to open in')),
    ) as unknown as typeof fakeChrome.tabs.create;
    session.set(REC_STATE_KEY, liveState(done.id));
    await loadWorker();
    void send({ type: 'ENGINE_STOPPED', sessionId: done.id, canceled: false });
    await settle();

    expect(parked()).toBe('recorder-open-failed');
    // The message says "Use Recover last recording below", and the session is
    // 'complete', so findRecoverableSessions will never offer it. This is
    // what makes that sentence true.
    await chrome.storage.session.remove(REC_FAILURE_KEY);
    const state = (await send({ type: 'REC_QUERY' })) as { recoverableSessionId?: string };
    expect(state.recoverableSessionId).toBe(done.id);
  });

  it('stops offering a session the user has since deleted', async () => {
    session.set('openscreenshot:unopened-session', 'gone-1');
    await loadWorker();
    const state = (await send({ type: 'REC_QUERY' })) as { recoverableSessionId?: string };
    await settle();
    expect(state.recoverableSessionId).toBeUndefined();
    expect(session.get('openscreenshot:unopened-session')).toBeUndefined();
  });
});

describe('a badge with nothing to restore it to', () => {
  it('leaves REC alone when the store that would answer has failed', async () => {
    session.set(REC_STATE_KEY, liveState());
    await loadWorker();
    badgeText.length = 0;
    sessionThrows = true;
    await send({ type: 'REC_QUERY' });
    await settle();
    // clearRecBadge() on an unanswered read used to wipe the REC indicator in
    // the one state where the badge is the user's only sign of a recording.
    expect(badgeText).not.toContain('');
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
    session.set(REC_STATE_KEY, liveState('sess-1', 'seg-1', false));
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

  /**
   * The narrowing. The engine's watchdog is edge-triggered: it returns early
   * while it believes the bar is already lost, and only a cursor batch clears
   * that. So a bar that recovers inside its 2500ms window produces no
   * OVERLAY_HEALED at all, and a guard keyed on the parked message alone
   * would swallow a genuine loss minutes later. The mount is what flips the
   * flag, so the heal never has to be noticed.
   */
  it('reports a loss after a blocked bar reached the page without any heal event', async () => {
    fakeChrome.scripting.executeScript = vi.fn(() =>
      Promise.resolve([{ result: 'synced' }]),
    ) as unknown as typeof fakeChrome.scripting.executeScript;
    session.set(REC_STATE_KEY, liveState('sess-1', 'seg-1', false));
    session.set(REC_FAILURE_KEY, { code: 'overlay-blocked', at: Date.now() });
    await loadWorker();

    // A navigation completing is the ordinary way the bar gets back on the
    // page; no OVERLAY_HEALED is involved.
    const onUpdated = fakeChrome.tabs.onUpdated.addListener.mock.calls[0]?.[0] as (
      tabId: number,
      info: { status: string },
    ) => void;
    onUpdated(7, { status: 'complete' });
    await settle();
    expect(parked(), 'the mount retires its own stale message').toBe(null);

    void send({ type: 'OVERLAY_LOST', sessionId: 'sess-1' });
    await settle();
    expect(parked(), 'and a real loss after it is no longer suppressed').toBe('overlay-lost');
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
