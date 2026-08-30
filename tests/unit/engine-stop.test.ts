import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_RECORDING_SETTINGS } from '../../src/shared/recording-types';

/**
 * Stop teardown in `src/offscreen/engine.ts`, driven through the
 * `chrome.runtime.onMessage` listener the module registers — the same way the
 * worker drives it, and the only way in: `stop()` is module-private.
 *
 * The engine owns three bookkeeping writes at stop (`deleteSession` on a
 * cancel, `finalizeSegment` + `updateSession` on a save) and they go to the
 * store the chunks went to. When that store is broken — a full disk during a
 * long recording is the ordinary way — those writes reject. Teardown must
 * still finish: `ENGINE_STOPPED` is what tells the worker to clear the badge,
 * unmount the bar and close the offscreen document, and a `state` left set
 * with `stopping` true makes every later stop a no-op for the rest of the
 * browser session.
 *
 * The DB module is mocked rather than driven through fake-indexeddb: these
 * tests are about what the engine does with a rejection, and a mock rejects on
 * demand where a real store has to be broken first.
 */

const db = vi.hoisted(() => ({
  appendChunk: vi.fn(() => Promise.resolve()),
  appendEvents: vi.fn(() => Promise.resolve()),
  deleteSession: vi.fn(() => Promise.resolve()),
  finalizeSegment: vi.fn(() => Promise.resolve()),
  updateSession: vi.fn(() => Promise.resolve()),
}));

vi.mock('../../src/shared/recording-db', () => db);

type Listener = (message: unknown, sender: unknown, respond: (r: unknown) => void) => unknown;

let listeners: Listener[];
let sent: { type?: string; [k: string]: unknown }[];
/** Every MediaRecorder the engine constructed this test, in order. */
let recorders: FakeMediaRecorder[];

/** A track that records the `stop()` the engine calls on teardown. */
function makeTrack(kind: 'video' | 'audio') {
  return { kind, stop: vi.fn(), onended: null as (() => void) | null };
}

function makeStream() {
  const video = makeTrack('video');
  const audio = makeTrack('audio');
  return {
    tracks: [video, audio],
    getTracks: () => [video, audio],
    getVideoTracks: () => [video],
    getAudioTracks: () => [audio],
    addTrack: vi.fn(),
  };
}

/**
 * Enough of MediaRecorder for start and stop. `stop()` fires the 'stop' event
 * on a macrotask, the way the real one does — `stop()` in the engine awaits
 * that event before it touches the DB, so resolving it synchronously would
 * skip the ordering the tests are about.
 */
class FakeMediaRecorder {
  static isTypeSupported = (): boolean => true;
  state: 'inactive' | 'recording' | 'paused' = 'inactive';
  ondataavailable: ((e: { data: { size: number } }) => void) | null = null;
  private handlers: (() => void)[] = [];
  constructor() {
    recorders.push(this);
  }
  start(): void {
    this.state = 'recording';
  }
  stop(): void {
    this.state = 'inactive';
    setTimeout(() => {
      for (const fn of this.handlers.splice(0)) fn();
    }, 0);
  }
  addEventListener(type: string, fn: () => void): void {
    if (type === 'stop') this.handlers.push(fn);
  }
}

function makeFakeChrome() {
  listeners = [];
  sent = [];
  return {
    runtime: {
      sendMessage: vi.fn((msg: { type?: string }) => {
        sent.push(msg);
        return Promise.resolve();
      }),
      onMessage: { addListener: (fn: Listener) => listeners.push(fn) },
    },
  };
}

let fakeChrome: ReturnType<typeof makeFakeChrome>;
let stream: ReturnType<typeof makeStream>;

function deliver(message: unknown): void {
  for (const fn of listeners) fn(message, {}, () => {});
}

/** Let the stop chain run: recorder 'stop' event, then the DB promises. */
async function settle(rounds = 12): Promise<void> {
  for (let i = 0; i < rounds; i++) {
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
}

const SETTINGS = { ...DEFAULT_RECORDING_SETTINGS, tabAudio: false, mic: false, webcam: false };

/** Load the engine and run one recording up to (not including) its stop. */
async function startRecording(): Promise<void> {
  await import('../../src/offscreen/engine.ts');
  deliver({
    target: 'offscreen',
    type: 'OFFSCREEN_START',
    streamId: 'stream-1',
    sessionId: 'sess-1',
    segmentId: 'seg-1',
    settings: SETTINGS,
  });
  await settle();
}

function types(): string[] {
  return sent.map((m) => m.type ?? '');
}

function messagesOfType(type: string): { [k: string]: unknown }[] {
  return sent.filter((m) => m.type === type);
}

beforeEach(() => {
  vi.resetModules();
  for (const fn of Object.values(db)) fn.mockReset().mockImplementation(() => Promise.resolve());
  fakeChrome = makeFakeChrome();
  stream = makeStream();
  recorders = [];
  vi.stubGlobal('chrome', fakeChrome);
  vi.stubGlobal('MediaRecorder', FakeMediaRecorder);
  vi.stubGlobal('navigator', {
    mediaDevices: { getUserMedia: vi.fn(() => Promise.resolve(stream)) },
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('a stop whose bookkeeping writes succeed', () => {
  it('finalizes the segment, completes the session and reports the stop', async () => {
    await startRecording();
    expect(types()).toContain('ENGINE_STARTED');

    deliver({ target: 'offscreen', type: 'OFFSCREEN_STOP' });
    await settle();

    expect(db.finalizeSegment).toHaveBeenCalledWith('seg-1', expect.any(Number));
    expect(db.updateSession).toHaveBeenCalledWith('sess-1', { status: 'complete' });
    expect(db.deleteSession).not.toHaveBeenCalled();
    expect(messagesOfType('ENGINE_STOPPED')).toEqual([
      { type: 'ENGINE_STOPPED', sessionId: 'sess-1', canceled: false },
    ]);
    expect(types()).not.toContain('ENGINE_WRITE_FAILED');
  });

  it('deletes the session and reports the stop on a cancel', async () => {
    await startRecording();

    deliver({ target: 'offscreen', type: 'OFFSCREEN_CANCEL' });
    await settle();

    expect(db.deleteSession).toHaveBeenCalledWith('sess-1');
    expect(db.finalizeSegment).not.toHaveBeenCalled();
    expect(messagesOfType('ENGINE_STOPPED')).toEqual([
      { type: 'ENGINE_STOPPED', sessionId: 'sess-1', canceled: true },
    ]);
  });
});

describe('a stop whose bookkeeping writes reject', () => {
  it('still reports ENGINE_STOPPED when finalizeSegment rejects', async () => {
    await startRecording();
    db.finalizeSegment.mockImplementation(() => Promise.reject(new Error('QuotaExceededError')));

    deliver({ target: 'offscreen', type: 'OFFSCREEN_STOP' });
    await settle();

    // Without this the worker never clears REC_STATE_KEY: badge on, bar up,
    // Stop and Cancel dead until the extension is reloaded.
    expect(messagesOfType('ENGINE_STOPPED')).toEqual([
      { type: 'ENGINE_STOPPED', sessionId: 'sess-1', canceled: false },
    ]);
    expect(messagesOfType('ENGINE_WRITE_FAILED')).toEqual([
      { type: 'ENGINE_WRITE_FAILED', sessionId: 'sess-1', kind: 'media' },
    ]);
    // finalize is awaited before it, so the session row keeps `recording` and
    // is offered as a crash to recover.
    expect(db.updateSession).not.toHaveBeenCalled();
  });

  it('still reports ENGINE_STOPPED when updateSession rejects', async () => {
    await startRecording();
    db.updateSession.mockImplementation(() => Promise.reject(new Error('QuotaExceededError')));

    deliver({ target: 'offscreen', type: 'OFFSCREEN_STOP' });
    await settle();

    expect(db.finalizeSegment).toHaveBeenCalledTimes(1);
    expect(messagesOfType('ENGINE_STOPPED')).toEqual([
      { type: 'ENGINE_STOPPED', sessionId: 'sess-1', canceled: false },
    ]);
    expect(types()).toContain('ENGINE_WRITE_FAILED');
  });

  it('still reports ENGINE_STOPPED when a cancel cannot delete the session', async () => {
    await startRecording();
    db.deleteSession.mockImplementation(() => Promise.reject(new Error('QuotaExceededError')));

    deliver({ target: 'offscreen', type: 'OFFSCREEN_CANCEL' });
    await settle();

    expect(messagesOfType('ENGINE_STOPPED')).toEqual([
      { type: 'ENGINE_STOPPED', sessionId: 'sess-1', canceled: true },
    ]);
  });

  it('releases the capture tracks before the writes that reject', async () => {
    await startRecording();
    db.finalizeSegment.mockImplementation(() => Promise.reject(new Error('QuotaExceededError')));

    deliver({ target: 'offscreen', type: 'OFFSCREEN_STOP' });
    await settle();

    for (const track of stream.tracks) expect(track.stop).toHaveBeenCalled();
  });

  it('reports a broken store once across the chunk and the finalize', async () => {
    await startRecording();

    // How a full disk actually presents: a chunk write fails first, the media
    // path reports it once and the recording deliberately continues, and then
    // the finalize at stop trips over the same store.
    db.appendChunk.mockImplementation(() => Promise.reject(new Error('QuotaExceededError')));
    db.finalizeSegment.mockImplementation(() => Promise.reject(new Error('QuotaExceededError')));
    expect(recorders).toHaveLength(1);
    recorders[0].ondataavailable?.({ data: { size: 4096 } });
    await settle();

    deliver({ target: 'offscreen', type: 'OFFSCREEN_STOP' });
    await settle();

    expect(db.appendChunk).toHaveBeenCalledTimes(1);
    expect(messagesOfType('ENGINE_WRITE_FAILED')).toHaveLength(1);
    expect(messagesOfType('ENGINE_STOPPED')).toHaveLength(1);
  });
});
