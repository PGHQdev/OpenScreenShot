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
 *
 * The last block is start timing rather than failure reporting: the same
 * listener, the same stubbed `chrome`, and the paths it drives are the ones
 * `handleStart` takes on its way to (or away from) the engine.
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

async function loadWorker(): Promise<typeof import('../../src/background/recording.ts')> {
  return import('../../src/background/recording.ts');
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
    writeFailed: false,
    anchored: true,
    continued: false,
  };
}

/**
 * What the worker injected into the page, in order. The three injections are
 * told apart by their arguments, which is how they differ in production too:
 * the viewport read passes an empty array, the control-bar mount passes six,
 * and the unmount passes none at all.
 */
function injections(): string[] {
  const calls = fakeChrome.scripting.executeScript.mock.calls as [{ args?: unknown[] }][];
  return calls.map(([call]) =>
    call.args === undefined ? 'unmount' : call.args.length === 0 ? 'viewport' : 'mount',
  );
}

/**
 * `workingTab` reports every mount as 'synced', which is the state a heal
 * finds. Only a *fresh* mount raises the permission prompt, so only a fresh
 * mount makes the start wait for the frame — these tests are about that
 * wait, so the injection has to answer the way a first mount does.
 */
function freshMount(): void {
  workingTab();
  fakeChrome.scripting.executeScript = vi.fn((arg: { args?: unknown[] }) =>
    Promise.resolve([
      { result: (arg.args?.length ?? 0) > 0 ? 'fresh' : { w: 800, h: 600, dpr: 1 } },
    ]),
  ) as unknown as typeof fakeChrome.scripting.executeScript;
}

/** An offscreen document exists, so REC_QUERY treats the run as live. */
function liveOffscreen(): void {
  fakeChrome.runtime.getContexts = vi.fn(() =>
    Promise.resolve([{ contextType: 'OFFSCREEN_DOCUMENT' }]),
  ) as unknown as typeof fakeChrome.runtime.getContexts;
}

/** Messages the worker aimed at the offscreen document, by type. */
function offscreenSends(): string[] {
  const calls = fakeChrome.runtime.sendMessage.mock.calls as [{ type?: string; target?: string }][];
  return calls.filter(([m]) => m?.target === 'offscreen').map(([m]) => m.type ?? '');
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

describe('a write that never reached IndexedDB', () => {
  it('reports chunk-write-failed without stopping the recording', async () => {
    session.set(REC_STATE_KEY, liveState());
    await loadWorker();
    void send({ type: 'ENGINE_WRITE_FAILED', sessionId: 'sess-1', kind: 'media' });
    await settle();

    expect(parked()).toBe('chunk-write-failed');
    // The chunks already written are a real recording; tearing down here
    // would throw away exactly what the message is telling the user to save.
    expect(session.get(REC_STATE_KEY), 'the recording keeps running').toBeDefined();
  });

  /**
   * The point of this round: the popup is not a surface during a recording.
   * The worker writes the flag and re-heals, and `mountRecordingOverlay`
   * receives it as its fifth argument — the same route `handleWebcamDenied`
   * uses to change the chips mid-run.
   */
  it('pushes a media failure into the live control bar', async () => {
    const injected: unknown[][] = [];
    fakeChrome.scripting.executeScript = vi.fn((arg: { args?: unknown[] }) => {
      if (arg.args) injected.push(arg.args);
      return Promise.resolve([{ result: 'synced' }]);
    }) as unknown as typeof fakeChrome.scripting.executeScript;
    session.set(REC_STATE_KEY, liveState());
    await loadWorker();
    void send({ type: 'ENGINE_WRITE_FAILED', sessionId: 'sess-1', kind: 'media' });
    await settle();

    const state = session.get(REC_STATE_KEY) as { writeFailed?: boolean };
    expect(state.writeFailed, 'the flag the bar is rebuilt from').toBe(true);
    const mount = injected.at(-1);
    expect(mount, 'the bar was re-injected').toBeDefined();
    expect(mount?.[4], 'and told chunks are failing').toBe(true);
  });

  it('tells a lost cursor track apart from lost video', async () => {
    session.set(REC_STATE_KEY, liveState());
    await loadWorker();
    void send({ type: 'ENGINE_WRITE_FAILED', sessionId: 'sess-1', kind: 'events' });
    await settle();

    expect(parked()).toBe('events-write-failed');
    // The video is intact, so the bar says nothing: it is reserved for the
    // failure that loses the recording itself.
    const state = session.get(REC_STATE_KEY) as { writeFailed?: boolean };
    expect(state.writeFailed).toBe(false);
  });

  /**
   * A broken store breaks both writers inside the same second, on independent
   * phases, so the arrival order is arbitrary. Last-writer-wins left "The
   * video is fine" standing about half the time — next to a control bar
   * reading NOT SAVING, and pointing at a page that shows nothing.
   */
  it('does not let a lost cursor track overwrite a lost recording', async () => {
    session.set(REC_STATE_KEY, liveState());
    await loadWorker();
    void send({ type: 'ENGINE_WRITE_FAILED', sessionId: 'sess-1', kind: 'media' });
    await settle();
    void send({ type: 'ENGINE_WRITE_FAILED', sessionId: 'sess-1', kind: 'events' });
    await settle();

    expect(parked(), 'the graver sentence keeps the slot').toBe('chunk-write-failed');
    expect(broadcasts(), 'and an open popup is not told the video is fine').toEqual([
      'chunk-write-failed',
    ]);
  });

  it('holds that precedence with the key already consumed', async () => {
    session.set(REC_STATE_KEY, liveState());
    await loadWorker();
    void send({ type: 'ENGINE_WRITE_FAILED', sessionId: 'sess-1', kind: 'media' });
    await settle();
    // The popup read the message and removed the key; the run's own flag is
    // what still knows the video is going.
    await chrome.storage.session.remove(REC_FAILURE_KEY);
    void send({ type: 'ENGINE_WRITE_FAILED', sessionId: 'sess-1', kind: 'events' });
    await settle();
    expect(parked()).toBe(null);
  });

  it('lets a lost recording overwrite a lost cursor track', async () => {
    session.set(REC_STATE_KEY, liveState());
    await loadWorker();
    void send({ type: 'ENGINE_WRITE_FAILED', sessionId: 'sess-1', kind: 'events' });
    await settle();
    expect(parked()).toBe('events-write-failed');
    void send({ type: 'ENGINE_WRITE_FAILED', sessionId: 'sess-1', kind: 'media' });
    await settle();
    expect(parked(), 'the graver sentence takes the slot').toBe('chunk-write-failed');
  });

  /**
   * The precedence held inside one run and broke across two. A parked failure
   * outlives its recording by design — a clean stop is not the user having
   * read it — so an unread `chunk-write-failed` from an earlier run sat there
   * suppressing the next run's genuine failure entirely: no parked message,
   * no broadcast. `RecFailure` carries the run it belongs to now, and every
   * cross-failure guard is scoped by it.
   */
  it("does not let an earlier run's unread failure silence this one", async () => {
    session.set(REC_FAILURE_KEY, {
      code: 'chunk-write-failed',
      at: Date.now() - 60_000,
      sessionId: 'run-a',
    });
    // Run A stopped cleanly; run B is a different recording with its own,
    // clean, writeFailed flag.
    session.set(REC_STATE_KEY, liveState('run-b', 'seg-b'));
    await loadWorker();
    void send({ type: 'ENGINE_WRITE_FAILED', sessionId: 'run-b', kind: 'events' });
    await settle();

    const value = session.get(REC_FAILURE_KEY) as { code?: string; sessionId?: string };
    expect(value.code, "run B's failure is reported, not swallowed").toBe('events-write-failed');
    expect(value.sessionId, 'and carries the run it belongs to').toBe('run-b');
    expect(broadcasts()).toEqual(['events-write-failed']);
  });

  it('still suppresses it inside the run that already reported the graver one', async () => {
    session.set(REC_FAILURE_KEY, {
      code: 'chunk-write-failed',
      at: Date.now(),
      sessionId: 'run-b',
    });
    session.set(REC_STATE_KEY, liveState('run-b', 'seg-b'));
    await loadWorker();
    void send({ type: 'ENGINE_WRITE_FAILED', sessionId: 'run-b', kind: 'events' });
    await settle();
    expect(parked()).toBe('chunk-write-failed');
    expect(broadcasts()).toEqual([]);
  });

  it('reads a kind-less message as the graver of the two', async () => {
    session.set(REC_STATE_KEY, liveState());
    await loadWorker();
    // An engine older than the kind field. Falling to 'events' would report a
    // lost recording as harmless.
    void send({ type: 'ENGINE_WRITE_FAILED', sessionId: 'sess-1' });
    await settle();
    expect(parked()).toBe('chunk-write-failed');
  });

  it('ignores a write failure from a session that already ended', async () => {
    session.set(REC_STATE_KEY, liveState('sess-2'));
    await loadWorker();
    void send({ type: 'ENGINE_WRITE_FAILED', sessionId: 'sess-1', kind: 'media' });
    await settle();
    expect(parked()).toBe(null);
  });
});

describe('state that has been torn down stays torn down', () => {
  /**
   * `healOverlay` writes `overlayMounted` after an `executeScript` round trip.
   * A teardown inside that window used to be undone: `{ ...null, ...patch }`
   * is a partial state object, which put REC back on the badge after the
   * recording ended and answered the next Record click with 'start-busy'.
   */
  it('does not let a late patch resurrect a cleared recording', async () => {
    let release: (() => void) | null = null;
    fakeChrome.scripting.executeScript = vi.fn(
      () =>
        new Promise((resolve) => {
          release = () => resolve([{ result: 'synced' }]);
        }),
    ) as unknown as typeof fakeChrome.scripting.executeScript;
    session.set(REC_STATE_KEY, liveState('sess-1', 'seg-1', false));
    await loadWorker();

    // A navigation completing is the ordinary heal, and the one path that
    // reaches `healOverlay` without clearing state on the way in.
    const onUpdated = fakeChrome.tabs.onUpdated.addListener.mock.calls[0]?.[0] as (
      tabId: number,
      info: { status: string },
    ) => void;
    onUpdated(7, { status: 'complete' });
    await settle(4);
    expect(release, 'the heal is parked mid-injection').not.toBeNull();

    // The recording ends underneath the in-flight injection.
    await chrome.storage.session.remove(REC_STATE_KEY);
    release?.();
    await settle();

    expect(session.get(REC_STATE_KEY), 'the run stays ended').toBeUndefined();
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

  it('stops offering it once a later recording opens its own page', async () => {
    const done = await createSession(DEFAULT_RECORDING_SETTINGS);
    session.set('openscreenshot:unopened-session', 'earlier-1');
    session.set(REC_STATE_KEY, liveState(done.id));
    await loadWorker();
    void send({ type: 'ENGINE_STOPPED', sessionId: done.id, canceled: false });
    await settle();

    expect(fakeChrome.tabs.create).toHaveBeenCalled();
    // The offer is a shortcut to a recording the user has not seen, and they
    // are looking at one now.
    expect(session.get('openscreenshot:unopened-session')).toBeUndefined();
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
    // A genuinely live recording has an offscreen document — `handleQuery`
    // treats its absence as proof the run died, so the fake has to carry one
    // for this to be the state it claims to be.
    fakeChrome.runtime.getContexts = vi.fn(() =>
      Promise.resolve([{ contextType: 'OFFSCREEN_DOCUMENT' }]),
    ) as unknown as typeof fakeChrome.runtime.getContexts;
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
    session.set(REC_FAILURE_KEY, { code: 'overlay-blocked', at: Date.now(), sessionId: 'sess-1' });
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
    session.set(REC_FAILURE_KEY, { code: 'overlay-blocked', at: Date.now(), sessionId: 'sess-1' });
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
  it("does not let an earlier run's blocked bar silence this run's loss", async () => {
    session.set(REC_FAILURE_KEY, {
      code: 'overlay-blocked',
      at: Date.now() - 60_000,
      sessionId: 'run-a',
    });
    // Run B's bar has not mounted either, so only the run id tells the two
    // situations apart.
    session.set(REC_STATE_KEY, liveState('run-b', 'seg-b', false));
    await loadWorker();
    void send({ type: 'OVERLAY_LOST', sessionId: 'run-b' });
    await settle();
    expect(parked()).toBe('overlay-lost');
  });

  it('reports a loss after a blocked bar reached the page without any heal event', async () => {
    fakeChrome.scripting.executeScript = vi.fn(() =>
      Promise.resolve([{ result: 'synced' }]),
    ) as unknown as typeof fakeChrome.scripting.executeScript;
    session.set(REC_STATE_KEY, liveState('sess-1', 'seg-1', false));
    session.set(REC_FAILURE_KEY, { code: 'overlay-blocked', at: Date.now(), sessionId: 'sess-1' });
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

describe('the badge when the store cannot answer', () => {
  it('clears a capture flash it knows is not covering a recording', async () => {
    const mod = await loadWorker();
    // One answered read establishes that nothing is recording...
    await mod.restoreRecBadge();
    // ...and a capture sets its own flash immediately before calling again.
    await fakeChrome.action.setBadgeText({ text: '\u2713' });
    sessionThrows = true;
    await mod.restoreRecBadge();
    expect(badgeText.at(-1), 'the tick would otherwise stick').toBe('');
  });

  it('clears a flash after a worker restart with no recording behind it', async () => {
    // lastKnownLive is null — this worker has never had an answer. getContexts
    // is a second, independent authority, and it says nothing is recording.
    const mod = await loadWorker();
    await fakeChrome.action.setBadgeText({ text: '\u2713' });
    sessionThrows = true;
    await mod.restoreRecBadge();
    expect(badgeText.at(-1)).toBe('');
  });

  it('leaves it alone after a restart with a recording still live', async () => {
    fakeChrome.runtime.getContexts = vi.fn(() =>
      Promise.resolve([{ contextType: 'OFFSCREEN_DOCUMENT' }]),
    ) as unknown as typeof fakeChrome.runtime.getContexts;
    const mod = await loadWorker();
    badgeText.length = 0;
    sessionThrows = true;
    await mod.restoreRecBadge();
    expect(badgeText).not.toContain('');
  });

  it('still leaves a live REC alone', async () => {
    session.set(REC_STATE_KEY, liveState());
    const mod = await loadWorker();
    await mod.restoreRecBadge();
    badgeText.length = 0;
    sessionThrows = true;
    await mod.restoreRecBadge();
    expect(badgeText).not.toContain('');
  });
});

/**
 * The window between the Record click and the engine reporting in. Everything
 * here is driven with the mic on and no `REC_FRAME_READY` ever delivered,
 * which is exactly the state the 25-second hang lived in: the start parked on
 * the permission frame, and every gesture parked behind the start.
 */
describe('the start window', () => {
  const withMic = { ...DEFAULT_RECORDING_SETTINGS, mic: true };

  it('waits for the permission frame when the grant is missing', async () => {
    freshMount();
    await loadWorker();
    void send({ type: 'REC_START', settings: withMic, devicesGranted: false });
    await settle();
    expect(offscreenSends()).not.toContain('OFFSCREEN_START');
    // Same start, unblocked by the frame it was waiting for.
    void send({ type: 'REC_FRAME_READY' });
    await settle();
    expect(offscreenSends()).toContain('OFFSCREEN_START');
  });

  it('skips the wait when every wanted device is already granted', async () => {
    // Fresh, not synced: a synced mount skips the wait on its own, so a
    // 'synced' fixture here would pass whether the gate existed or not.
    freshMount();
    await loadWorker();
    void send({ type: 'REC_START', settings: withMic, devicesGranted: true });
    await settle();
    expect(offscreenSends()).toContain('OFFSCREEN_START');
  });

  it('waits when the click carries no answer at all', async () => {
    freshMount();
    await loadWorker();
    // An older popup, or a message shape `isRecMessage` never validated.
    void send({ type: 'REC_START', settings: withMic });
    await settle();
    expect(offscreenSends()).not.toContain('OFFSCREEN_START');
  });

  it('does not wait for a frame a mute, cameraless recording never mounts', async () => {
    freshMount();
    await loadWorker();
    void send({ type: 'REC_START', settings: DEFAULT_RECORDING_SETTINGS, devicesGranted: false });
    await settle();
    expect(offscreenSends()).toContain('OFFSCREEN_START');
  });

  it('answers a Stop mid-start by giving the run back, not by asking the engine', async () => {
    freshMount();
    await loadWorker();
    void send({ type: 'REC_START', settings: withMic, devicesGranted: false });
    await settle();
    expect(session.get(REC_STATE_KEY)).toBeDefined();
    const started = (await listSessions()).map((s) => s.id);
    expect(started).toHaveLength(1);

    void send({ type: 'REC_STOP' });
    await settle();

    // Nothing was ever handed over, so there is nothing to unwind at the
    // engine: OFFSCREEN_STOP would have parked a pendingStop that the start
    // then consumed, producing a recording of nothing.
    expect(offscreenSends()).toEqual([]);
    expect(session.get(REC_STATE_KEY)).toBeUndefined();
    expect(badgeText.at(-1)).toBe('');
    // A gesture is not a failure; the bar going and the badge clearing is the
    // whole answer.
    expect(parked()).toBeNull();
    expect(await listSessions()).toEqual([]);
  });

  it('answers a Stop that arrives before the wait it would have released', async () => {
    // Parked on the viewport read, which runs several steps ahead of the
    // permission wait. There is no frame-ready resolver yet for the gesture
    // to release, so the only thing that can answer it is the check the start
    // makes on its way in to the wait.
    let releaseViewport = (): void => {};
    let parked = false;
    workingTab();
    fakeChrome.scripting.executeScript = vi.fn((arg: { args?: unknown[] }) => {
      if ((arg.args?.length ?? 0) > 0) return Promise.resolve([{ result: 'fresh' }]);
      // Only the viewport read parks. The teardown's own unmount injection is
      // argument-less too, and holding that one open would hang the discard
      // this test is measuring.
      if (parked) return Promise.resolve([{ result: undefined }]);
      parked = true;
      return new Promise((resolve) => {
        releaseViewport = () => resolve([{ result: { w: 800, h: 600, dpr: 1 } }]);
      });
    }) as unknown as typeof fakeChrome.scripting.executeScript;
    await loadWorker();
    void send({ type: 'REC_START', settings: withMic, devicesGranted: false });
    await settle();

    void send({ type: 'REC_STOP' });
    await settle();
    releaseViewport();
    await settle();

    expect(offscreenSends()).toEqual([]);
    expect(session.get(REC_STATE_KEY)).toBeUndefined();
    expect(await listSessions()).toEqual([]);
  });

  it('answers a Cancel mid-start the same way', async () => {
    freshMount();
    await loadWorker();
    void send({ type: 'REC_START', settings: withMic, devicesGranted: false });
    await settle();
    void send({ type: 'REC_CANCEL' });
    await settle();
    expect(offscreenSends()).toEqual([]);
    expect(session.get(REC_STATE_KEY)).toBeUndefined();
    expect(await listSessions()).toEqual([]);
  });

  it('gives a continued session back its earlier segments, not a failed row', async () => {
    freshMount();
    const existing = await createSession(DEFAULT_RECORDING_SETTINGS);
    await updateSession(existing.id, { status: 'complete', segmentIds: ['old-seg'] });
    await loadWorker();
    void send({
      type: 'REC_START',
      settings: withMic,
      continueSessionId: existing.id,
      devicesGranted: false,
    });
    await settle();
    void send({ type: 'REC_STOP' });
    await settle();
    const after = await getSession(existing.id);
    expect(after?.status).toBe('complete');
    expect(after?.segmentIds).toEqual(['old-seg']);
  });

  it('forwards a Stop that lands after the engine has been asked to begin', async () => {
    workingTab();
    await loadWorker();
    void send({ type: 'REC_START', settings: withMic, devicesGranted: true });
    await settle();
    expect(offscreenSends()).toContain('OFFSCREEN_START');
    void send({ type: 'REC_STOP' });
    await settle();
    // The engine parks it as a pendingStop and consumes it the moment its own
    // getUserMedia resolves; the worker must not withhold it until then.
    expect(offscreenSends()).toContain('OFFSCREEN_STOP');
  });

  it('does not let a second Record click start a run beside the one preparing', async () => {
    freshMount();
    await loadWorker();
    void send({ type: 'REC_START', settings: withMic, devicesGranted: false });
    await settle();
    void send({ type: 'REC_START', settings: withMic, devicesGranted: true });
    await settle();
    expect(offscreenSends()).toEqual([]);
    expect(await listSessions()).toHaveLength(1);
  });

  it('holds that guard after the start deadline has released its claim', async () => {
    // The deadline releases `startPending` while the start is still parked on
    // the permission frame, so from here on it is the only thing that knows a
    // start is live. Real time still advances, which IndexedDB needs.
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      freshMount();
      await loadWorker();
      void send({ type: 'REC_START', settings: withMic, devicesGranted: false });
      await settle();
      await vi.advanceTimersByTimeAsync(11_000);
      await settle();

      void send({ type: 'REC_START', settings: withMic, devicesGranted: true });
      await settle();
      expect(offscreenSends()).toEqual([]);
      expect(await listSessions()).toHaveLength(1);

      // The damage a second start does is not a second recording — the live
      // state answers that with 'start-busy' either way — it is that the
      // first start stops being recognised as preparing. Stop is what reads
      // that, so Stop is what has to still work.
      void send({ type: 'REC_STOP' });
      await settle();
      expect(offscreenSends()).toEqual([]);
      expect(session.get(REC_STATE_KEY)).toBeUndefined();
    } finally {
      vi.useRealTimers();
    }
  });

  it('stays quiet about a stop whose run a teardown already took down', async () => {
    workingTab();
    liveOffscreen();
    await loadWorker();
    void send({ type: 'REC_START', settings: withMic, devicesGranted: true });
    await settle();
    // The interleaving `abandonUnstartedRun` produces: the stop is in flight
    // when the run is torn down under it, so the send rejects against an
    // offscreen document that is already gone. Both ends reporting is one
    // failure told twice, which is the rule this module keeps everywhere else.
    const inner = fakeChrome.runtime.sendMessage;
    fakeChrome.runtime.sendMessage = vi.fn((msg: { type?: string }) => {
      if (msg?.type === 'OFFSCREEN_STOP') {
        session.delete(REC_STATE_KEY);
        return Promise.reject(new Error('Receiving end does not exist.'));
      }
      return inner(msg);
    }) as typeof fakeChrome.runtime.sendMessage;

    void send({ type: 'REC_STOP' });
    await settle();
    expect(parked()).toBeNull();
  });

  it('still reports a stop that never reached a run that is still live', async () => {
    workingTab();
    liveOffscreen();
    sendRejects.add('OFFSCREEN_STOP');
    await loadWorker();
    void send({ type: 'REC_START', settings: withMic, devicesGranted: true });
    await settle();
    void send({ type: 'REC_STOP' });
    await settle();
    expect(parked()).toBe('control-unreachable');
  });

  it('reports no elapsed until the engine says the recorders began', async () => {
    workingTab();
    liveOffscreen();
    await loadWorker();
    void send({ type: 'REC_START', settings: withMic, devicesGranted: true });
    await settle();
    const before = (await send({ type: 'REC_QUERY' })) as {
      active: boolean;
      anchored?: boolean;
      elapsedMs?: number;
    };
    expect(before.active).toBe(true);
    expect(before.anchored).toBe(false);
    expect(before.elapsedMs).toBe(0);

    const sessionId = (await listSessions())[0].id;
    void send({ type: 'ENGINE_STARTED', sessionId, tracks: { mic: true, webcam: false } });
    await settle();
    const after = (await send({ type: 'REC_QUERY' })) as { anchored?: boolean };
    expect(after.anchored).toBe(true);
  });

  it('anchors at zero even when the start window was paused', async () => {
    // Pause is reachable here: the 10s claim deadline releases its wait while
    // the start is still waiting on the permission frame. The clock used to
    // keep the mount as its zero in that case, so the bar went
    // "Starting…" -> 0:11, paused, for a recording holding nothing.
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      freshMount();
      liveOffscreen();
      await loadWorker();
      void send({ type: 'REC_START', settings: withMic, devicesGranted: false });
      await settle();
      await vi.advanceTimersByTimeAsync(11_000);
      await settle();

      void send({ type: 'REC_PAUSE' });
      await settle();
      void send({ type: 'REC_FRAME_READY' });
      await settle();
      const sessionId = (await listSessions())[0].id;
      void send({ type: 'ENGINE_STARTED', sessionId, tracks: { mic: true, webcam: false } });
      await settle();

      const reply = (await send({ type: 'REC_QUERY' })) as {
        anchored?: boolean;
        paused?: boolean;
        elapsedMs?: number;
      };
      expect(reply.anchored).toBe(true);
      expect(reply.paused).toBe(true);
      expect(reply.elapsedMs).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it('mounts the bar unanchored and re-injects it anchored on ENGINE_STARTED', async () => {
    workingTab();
    liveOffscreen();
    await loadWorker();
    void send({ type: 'REC_START', settings: withMic, devicesGranted: true });
    await settle();
    // args[5] is `anchored`; the mount is the injection that carries args.
    const anchoredArgs = () =>
      (fakeChrome.scripting.executeScript.mock.calls as [{ args?: unknown[] }][])
        .map(([call]) => call.args)
        .filter((args): args is unknown[] => (args?.length ?? 0) > 1)
        .map((args) => args[5]);
    expect(anchoredArgs()).toEqual([false]);

    const sessionId = (await listSessions())[0].id;
    void send({ type: 'ENGINE_STARTED', sessionId, tracks: { mic: true, webcam: false } });
    await settle();
    expect(anchoredArgs().at(-1)).toBe(true);
  });
});

/**
 * Teardowns racing the gestures that can now reach them. Stop no longer waits
 * for the start round trip, so it can land inside a teardown that is still
 * running — a window the old wait had closed by accident rather than by rule.
 */
describe('a teardown a Stop can land inside', () => {
  const withMic = { ...DEFAULT_RECORDING_SETTINGS, mic: true };

  it('does not let a Stop heal the bar back onto a page it is abandoning', async () => {
    workingTab();
    sendRejects.add('OFFSCREEN_START');
    await loadWorker();
    void send({ type: 'REC_START', settings: withMic, devicesGranted: true });
    // Two rounds is inside `abandonUnstartedRun`: the dispatch has rejected
    // and the teardown is on its way through IndexedDB.
    await settle(2);
    void send({ type: 'REC_STOP' });
    await settle();

    // A fourth injection is the bar going back up after the unmount, on a run
    // whose state is then cleared under it — nothing would ever take it down.
    expect(injections()).toEqual(['viewport', 'mount', 'unmount']);
    expect(session.get(REC_STATE_KEY)).toBeUndefined();
    expect(broadcasts()).toEqual(['engine-unreachable']);
  });

  it('tears a stalled run down when its Stop gets no answer', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      workingTab();
      liveOffscreen();
      await loadWorker();
      void send({ type: 'REC_START', settings: withMic, devicesGranted: true });
      await settle();
      // The engine took the start and never reported in — a hung
      // getUserMedia. Its own state is null, so OFFSCREEN_STOP parks a
      // pending stop and no ENGINE_STOPPED ever comes back.
      void send({ type: 'REC_STOP' });
      await settle();
      expect(session.get(REC_STATE_KEY)).toBeDefined();

      await vi.advanceTimersByTimeAsync(3500);
      await settle();
      expect(parked()).toBe('engine-stalled');
      expect(session.get(REC_STATE_KEY)).toBeUndefined();
      expect(badgeText.at(-1)).toBe('!');
    } finally {
      vi.useRealTimers();
    }
  });

  it('leaves an engine that answers its Stop in time alone', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      workingTab();
      liveOffscreen();
      await loadWorker();
      void send({ type: 'REC_START', settings: withMic, devicesGranted: true });
      await settle();
      const sessionId = (await listSessions())[0].id;
      void send({ type: 'REC_STOP' });
      await settle();
      void send({ type: 'ENGINE_STOPPED', sessionId, canceled: false });
      await settle();

      await vi.advanceTimersByTimeAsync(3500);
      await settle();
      expect(parked()).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('does not watch a Stop on a run the engine has reported in for', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      workingTab();
      liveOffscreen();
      await loadWorker();
      void send({ type: 'REC_START', settings: withMic, devicesGranted: true });
      await settle();
      const sessionId = (await listSessions())[0].id;
      void send({ type: 'ENGINE_STARTED', sessionId, tracks: { mic: true, webcam: false } });
      await settle();
      void send({ type: 'REC_STOP' });
      await settle();

      // A real recording whose stop is slow — flushing recorders and writes —
      // must not be torn down and reported from under the user.
      await vi.advanceTimersByTimeAsync(3500);
      await settle();
      expect(parked()).toBeNull();
      expect(session.get(REC_STATE_KEY)).toBeDefined();
    } finally {
      vi.useRealTimers();
    }
  });

  it('reports a stop it could not place, when the store cannot say the run is gone', async () => {
    workingTab();
    liveOffscreen();
    await loadWorker();
    void send({ type: 'REC_START', settings: withMic, devicesGranted: true });
    await settle();
    const inner = fakeChrome.runtime.sendMessage;
    fakeChrome.runtime.sendMessage = vi.fn((msg: { type?: string }) => {
      if (msg?.type === 'OFFSCREEN_STOP') {
        // The store breaks between the gesture and its failure. Silence here
        // would be a guess that the run had ended; the badge still works.
        sessionThrows = true;
        return Promise.reject(new Error('Receiving end does not exist.'));
      }
      return inner(msg);
    }) as typeof fakeChrome.runtime.sendMessage;

    void send({ type: 'REC_STOP' });
    await settle();
    expect(broadcasts()).toContain('control-unreachable');
  });
});

describe('recording state written before this build', () => {
  it('mounts the bar anchored rather than stuck on "Starting…"', async () => {
    workingTab();
    liveOffscreen();
    const legacy: Record<string, unknown> = { ...liveState() };
    delete legacy.anchored;
    session.set(REC_STATE_KEY, legacy);
    await loadWorker();

    const reply = (await send({ type: 'REC_QUERY' })) as { anchored?: boolean };
    await settle();
    expect(reply.anchored).toBe(true);
    const mounts = (fakeChrome.scripting.executeScript.mock.calls as [{ args?: unknown[] }][])
      .map(([call]) => call.args)
      .filter((args): args is unknown[] => (args?.length ?? 0) > 1);
    expect(mounts.at(-1)?.[5]).toBe(true);
  });
});
