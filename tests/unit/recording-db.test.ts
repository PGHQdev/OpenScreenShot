import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import {
  __closeForTests,
  appendChunk,
  appendEvents,
  countChunks,
  createSegment,
  createSession,
  deleteSegment,
  deleteSession,
  finalizeSegment,
  findRecoverableSessions,
  getSegments,
  getSession,
  listSessions,
  readChunks,
  readEvents,
  updateSession,
} from '../../src/shared/recording-db';
import type { CursorEvent } from '../../src/shared/recording-types';
import { DEFAULT_RECORDING_SETTINGS } from '../../src/shared/recording-types';

beforeEach(() => {
  // Fresh DB per test; reassigning the global alone does not isolate tests
  // because the module caches its connection promise, so drop that cache too.
  __closeForTests();
  // eslint-disable-next-line no-global-assign -- fresh fake-indexeddb instance per test
  indexedDB = new IDBFactory();
});

describe('createSession / getSession', () => {
  it('creates a session with an id, recording status, and no segments', async () => {
    const session = await createSession(DEFAULT_RECORDING_SETTINGS);
    expect(session.id).toBeTruthy();
    expect(session.status).toBe('recording');
    expect(session.segmentIds).toEqual([]);
    expect(session.settings).toEqual(DEFAULT_RECORDING_SETTINGS);
  });

  it('round-trips the created session through getSession', async () => {
    const session = await createSession(DEFAULT_RECORDING_SETTINGS);
    const fetched = await getSession(session.id);
    expect(fetched).toEqual(session);
  });

  it('returns null for an unknown id', async () => {
    expect(await getSession('nope')).toBeNull();
  });
});

describe('listSessions', () => {
  it('orders sessions newest first', async () => {
    const older = await createSession(DEFAULT_RECORDING_SETTINGS);
    const newer = await createSession(DEFAULT_RECORDING_SETTINGS);
    await updateSession(older.id, { createdAt: 1000 });
    await updateSession(newer.id, { createdAt: 2000 });

    const sessions = await listSessions();
    expect(sessions.map((s) => s.id)).toEqual([newer.id, older.id]);
  });
});

describe('createSegment / getSegments', () => {
  it('appends the segment id to the session segmentIds', async () => {
    const session = await createSession(DEFAULT_RECORDING_SETTINGS);
    const segment = await createSegment(session.id, 0, { w: 1280, h: 720, dpr: 1 }, false);

    const fetched = await getSession(session.id);
    expect(fetched?.segmentIds).toEqual([segment.id]);
  });

  it('orders segments by index even when created out of order', async () => {
    const session = await createSession(DEFAULT_RECORDING_SETTINGS);
    const second = await createSegment(session.id, 1, { w: 1280, h: 720, dpr: 1 }, false);
    const first = await createSegment(session.id, 0, { w: 1280, h: 720, dpr: 1 }, false);

    const segments = await getSegments(session.id);
    expect(segments.map((s) => s.id)).toEqual([first.id, second.id]);
  });
});

describe('finalizeSegment', () => {
  it('sets the segment duration', async () => {
    const session = await createSession(DEFAULT_RECORDING_SETTINGS);
    const segment = await createSegment(session.id, 0, { w: 1280, h: 720, dpr: 1 }, false);

    await finalizeSegment(segment.id, 5000);

    const [fetched] = await getSegments(session.id);
    expect(fetched.duration).toBe(5000);
  });
});

describe('appendChunk / readChunks / countChunks', () => {
  it('reads chunks back ordered by seq regardless of append order', async () => {
    const session = await createSession(DEFAULT_RECORDING_SETTINGS);
    const segment = await createSegment(session.id, 0, { w: 1280, h: 720, dpr: 1 }, false);

    const blob0 = new Blob(['a']);
    const blob1 = new Blob(['bb']);
    const blob2 = new Blob(['ccc']);
    await appendChunk(segment.id, 'tab', 2, blob2);
    await appendChunk(segment.id, 'tab', 0, blob0);
    await appendChunk(segment.id, 'tab', 1, blob1);

    const chunks = await readChunks(segment.id, 'tab');
    expect(chunks.map((b) => b.size)).toEqual([blob0.size, blob1.size, blob2.size]);
  });

  it('counts chunks for a kind and returns empty for an unused kind', async () => {
    const session = await createSession(DEFAULT_RECORDING_SETTINGS);
    const segment = await createSegment(session.id, 0, { w: 1280, h: 720, dpr: 1 }, false);

    await appendChunk(segment.id, 'tab', 0, new Blob(['a']));
    await appendChunk(segment.id, 'tab', 1, new Blob(['b']));
    await appendChunk(segment.id, 'tab', 2, new Blob(['c']));

    expect(await countChunks(segment.id, 'tab')).toBe(3);
    expect(await readChunks(segment.id, 'webcam')).toEqual([]);
    expect(await countChunks(segment.id, 'webcam')).toBe(0);
  });
});

describe('appendEvents / readEvents', () => {
  it('flattens batches in append order', async () => {
    const session = await createSession(DEFAULT_RECORDING_SETTINGS);
    const segment = await createSegment(session.id, 0, { w: 1280, h: 720, dpr: 1 }, false);

    const batch0: CursorEvent[] = [
      { kind: 'move', t: 0, x: 1, y: 1 },
      { kind: 'move', t: 10, x: 2, y: 2 },
    ];
    const batch1: CursorEvent[] = [{ kind: 'click', t: 20, x: 3, y: 3 }];
    await appendEvents(segment.id, 0, batch0);
    await appendEvents(segment.id, 1, batch1);

    const events = await readEvents(segment.id);
    expect(events).toEqual([...batch0, ...batch1]);
  });
});

describe('deleteSession', () => {
  it('cascades to remove segments, chunks, and events', async () => {
    const session = await createSession(DEFAULT_RECORDING_SETTINGS);
    const segment = await createSegment(session.id, 0, { w: 1280, h: 720, dpr: 1 }, false);
    await appendChunk(segment.id, 'tab', 0, new Blob(['a']));
    await appendEvents(segment.id, 0, [{ kind: 'move', t: 0, x: 1, y: 1 }]);

    await deleteSession(session.id);

    expect(await getSession(session.id)).toBeNull();
    expect(await getSegments(session.id)).toEqual([]);
    expect(await readChunks(segment.id, 'tab')).toEqual([]);
    expect(await readEvents(segment.id)).toEqual([]);
  });
});

describe('deleteSegment', () => {
  it('removes the segment, its chunks and its events, and unlinks it from the session', async () => {
    const session = await createSession(DEFAULT_RECORDING_SETTINGS);
    const first = await createSegment(session.id, 0, { w: 1280, h: 720, dpr: 1 }, false);
    const second = await createSegment(session.id, 1, { w: 1280, h: 720, dpr: 1 }, true);
    await appendChunk(second.id, 'tab', 0, new Blob(['a']));
    await appendChunk(second.id, 'webcam', 0, new Blob(['b']));
    await appendEvents(second.id, 0, [{ kind: 'move', t: 0, x: 1, y: 1 }]);

    await deleteSegment(second.id);

    expect(await getSegments(session.id)).toEqual([first]);
    expect(await readChunks(second.id, 'tab')).toEqual([]);
    expect(await readChunks(second.id, 'webcam')).toEqual([]);
    expect(await readEvents(second.id)).toEqual([]);
    expect((await getSession(session.id))?.segmentIds).toEqual([first.id]);
  });

  it('leaves the other segments of the session untouched', async () => {
    const session = await createSession(DEFAULT_RECORDING_SETTINGS);
    const kept = await createSegment(session.id, 0, { w: 640, h: 480, dpr: 2 }, false);
    const dropped = await createSegment(session.id, 1, { w: 640, h: 480, dpr: 2 }, false);
    await appendChunk(kept.id, 'tab', 0, new Blob(['keep']));
    await appendEvents(kept.id, 0, [{ kind: 'click', t: 5, x: 2, y: 3 }]);

    await deleteSegment(dropped.id);

    expect(await countChunks(kept.id, 'tab')).toBe(1);
    expect(await readEvents(kept.id)).toEqual([{ kind: 'click', t: 5, x: 2, y: 3 }]);
  });

  it('is a no-op for an unknown id', async () => {
    const session = await createSession(DEFAULT_RECORDING_SETTINGS);
    const segment = await createSegment(session.id, 0, { w: 1280, h: 720, dpr: 1 }, false);

    await deleteSegment('nope');

    expect(await getSegments(session.id)).toEqual([segment]);
    expect((await getSession(session.id))?.segmentIds).toEqual([segment.id]);
  });
});

describe('findRecoverableSessions', () => {
  it('returns only sessions with status recording', async () => {
    const recording = await createSession(DEFAULT_RECORDING_SETTINGS);
    const complete = await createSession(DEFAULT_RECORDING_SETTINGS);
    await updateSession(complete.id, { status: 'complete' });

    const recoverable = await findRecoverableSessions();
    expect(recoverable.map((s) => s.id)).toEqual([recording.id]);
  });
});

describe('open() connection caching', () => {
  it('clears the cached connection on failure so a later call can retry', async () => {
    const DB_NAME = 'openscreenshot-recordings'; // must match src/shared/recording-db.ts

    // Force a real IndexedDB failure: open the database at a higher version
    // directly, so the module's own indexedDB.open(DB_NAME, 1) call fails
    // with a VersionError.
    await new Promise<void>((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 2);
      req.onsuccess = () => {
        req.result.close();
        resolve();
      };
      req.onerror = () => reject(req.error);
    });

    await expect(createSession(DEFAULT_RECORDING_SETTINGS)).rejects.toBeDefined();

    // Recovery: clear the stale higher-version database, then confirm the
    // module retries instead of staying poisoned by the earlier rejection.
    await new Promise<void>((resolve, reject) => {
      const req = indexedDB.deleteDatabase(DB_NAME);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });

    const session = await createSession(DEFAULT_RECORDING_SETTINGS);
    expect(session.id).toBeTruthy();
  });
});
