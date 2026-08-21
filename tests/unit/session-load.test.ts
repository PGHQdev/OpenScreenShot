import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import {
  appendChunk,
  createSegment,
  createSession,
  finalizeSegment,
  getSegments,
  getSession,
  updateSession,
  __closeForTests,
} from '../../src/shared/recording-db';
import { DEFAULT_RECORDING_SETTINGS } from '../../src/shared/recording-types';
import { assembleBlob, estimateDuration, loadSession } from '../../src/recorder/session-load';

beforeEach(() => {
  __closeForTests();
  // eslint-disable-next-line no-global-assign -- fresh fake-indexeddb instance per test
  indexedDB = new IDBFactory();
});

describe('assembleBlob', () => {
  it('concatenates chunks in order with the webm type', async () => {
    const b = assembleBlob([new Blob(['a']), new Blob(['bc'])]);
    expect(b.type).toBe('video/webm');
    expect(await b.text()).toBe('abc');
  });
});

describe('estimateDuration', () => {
  it('estimates one second per chunk', () => expect(estimateDuration(7)).toBe(7000));
});

describe('loadSession', () => {
  it('returns null for an unknown session', async () => {
    expect(await loadSession('nope')).toBeNull();
  });

  it('assembles tab chunks per segment into an object URL and reads events', async () => {
    const session = await createSession(DEFAULT_RECORDING_SETTINGS);
    const segment = await createSegment(session.id, 0, { w: 800, h: 600, dpr: 1 }, false);
    await appendChunk(segment.id, 'tab', 0, new Blob(['a']));
    await appendChunk(segment.id, 'tab', 1, new Blob(['b']));
    await finalizeSegment(segment.id, 2500);
    await updateSession(session.id, { status: 'complete' });

    const loaded = await loadSession(session.id);
    expect(loaded).not.toBeNull();
    expect(loaded!.segments).toHaveLength(1);
    expect(loaded!.segments[0].tabUrl).toMatch(/^blob:/);
    expect(loaded!.segments[0].webcamUrl).toBeNull();
    expect(loaded!.segments[0].durationMs).toBe(2500);
    expect(loaded!.segments[0].events).toEqual([]);
  });

  it('reports hasAudio.tab straight from session.settings.tabAudio', async () => {
    const session = await createSession({ ...DEFAULT_RECORDING_SETTINGS, tabAudio: false });
    await createSegment(session.id, 0, { w: 800, h: 600, dpr: 1 }, false);

    const loaded = await loadSession(session.id);
    expect(loaded!.hasAudio).toEqual({ tab: false, mic: false });
  });

  it('reports hasAudio.mic false when settings.mic is on but no segment recorded one', async () => {
    // The mic can be declined/unavailable without failing the recording
    // (engine.ts swallows the error), so settings.mic=true alone does not
    // mean a mic track actually exists.
    const session = await createSession({ ...DEFAULT_RECORDING_SETTINGS, mic: true });
    const segment = await createSegment(session.id, 0, { w: 800, h: 600, dpr: 1 }, false);
    await appendChunk(segment.id, 'tab', 0, new Blob(['a']));

    const loaded = await loadSession(session.id);
    expect(loaded!.segments[0].webcamUrl).toBeNull();
    expect(loaded!.hasAudio).toEqual({ tab: true, mic: false });
  });

  it('reports hasAudio.mic true when settings.mic is on and a segment has a recorder-#2 blob', async () => {
    const session = await createSession({ ...DEFAULT_RECORDING_SETTINGS, mic: true });
    const segment = await createSegment(session.id, 0, { w: 800, h: 600, dpr: 1 }, false);
    await appendChunk(segment.id, 'tab', 0, new Blob(['a']));
    await appendChunk(segment.id, 'webcam', 0, new Blob(['m']));

    const loaded = await loadSession(session.id);
    expect(loaded!.segments[0].webcamUrl).toMatch(/^blob:/);
    expect(loaded!.hasAudio).toEqual({ tab: true, mic: true });
  });

  it('normalizes a crashed (still "recording") session on load', async () => {
    const session = await createSession(DEFAULT_RECORDING_SETTINGS);
    const segment = await createSegment(session.id, 0, { w: 800, h: 600, dpr: 1 }, false);
    await appendChunk(segment.id, 'tab', 0, new Blob(['a']));
    await appendChunk(segment.id, 'tab', 1, new Blob(['b']));
    await appendChunk(segment.id, 'tab', 2, new Blob(['c']));
    // segment.duration is still 0 — never finalized because the recorder crashed.

    const loaded = await loadSession(session.id);
    expect(loaded!.session.status).toBe('complete');
    expect(loaded!.segments[0].durationMs).toBe(estimateDuration(3));

    // The normalization is persisted, not just reflected in the return value.
    const persistedSession = await getSession(session.id);
    expect(persistedSession!.status).toBe('complete');
    const persistedSegments = await getSegments(session.id);
    expect(persistedSegments[0].duration).toBe(estimateDuration(3));
  });
});
