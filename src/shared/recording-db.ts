/**
 * IndexedDB persistence for tab recordings. Chunks are written every second
 * while recording, so a crash loses at most one second. No library —
 * `unlimitedStorage` is already granted, and the shapes live in
 * ./recording-types.
 */
import type {
  ChunkKind,
  CursorEvent,
  RecordingSegment,
  RecordingSession,
  RecordingSettings,
  SegmentViewport,
} from './recording-types';

const DB_NAME = 'openscreenshot-recordings';
const DB_VERSION = 1;

interface ChunkRecord {
  segmentId: string;
  kind: ChunkKind;
  seq: number;
  blob: Blob;
}

interface EventBatchRecord {
  segmentId: string;
  seq: number;
  events: CursorEvent[];
}

let dbPromise: Promise<IDBDatabase> | null = null;

/**
 * Test-only: closes and forgets the cached connection so the next call opens
 * against whatever `indexedDB` global is current. Needed because `dbPromise`
 * is cached at module scope, so reassigning the global mid-suite is not
 * enough on its own to isolate tests.
 */
export function __closeForTests(): void {
  const pending = dbPromise;
  dbPromise = null;
  pending?.then((db) => db.close()).catch(() => {});
}

function open(): Promise<IDBDatabase> {
  dbPromise ??= new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      db.createObjectStore('sessions', { keyPath: 'id' });
      const segments = db.createObjectStore('segments', { keyPath: 'id' });
      segments.createIndex('bySession', 'sessionId');
      db.createObjectStore('chunks', { keyPath: ['segmentId', 'kind', 'seq'] });
      db.createObjectStore('events', { keyPath: ['segmentId', 'seq'] });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  }).catch((err) => {
    // Don't leave a rejected open cached forever — a later call (e.g. crash
    // recovery via findRecoverableSessions) must be able to retry once
    // whatever blocked this open (pending version-change, quota, etc.) clears.
    dbPromise = null;
    throw err;
  });
  return dbPromise;
}

function tx<T>(
  stores: string[],
  mode: IDBTransactionMode,
  run: (t: IDBTransaction) => IDBRequest<T> | void,
): Promise<T> {
  return open().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(stores, mode);
        let result: T;
        const req = run(t);
        if (req) req.onsuccess = () => (result = req.result);
        t.oncomplete = () => resolve(result);
        t.onerror = () => reject(t.error);
        t.onabort = () => reject(t.error);
      }),
  );
}

export function createSession(settings: RecordingSettings): Promise<RecordingSession> {
  const session: RecordingSession = {
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    status: 'recording',
    settings,
    segmentIds: [],
  };
  return tx<RecordingSession>(['sessions'], 'readwrite', (t) => {
    t.objectStore('sessions').put(session);
  }).then(() => session);
}

export function getSession(id: string): Promise<RecordingSession | null> {
  return tx<RecordingSession | undefined>(['sessions'], 'readonly', (t) =>
    t.objectStore('sessions').get(id),
  ).then((session) => session ?? null);
}

export function listSessions(): Promise<RecordingSession[]> {
  return tx<RecordingSession[]>(['sessions'], 'readonly', (t) =>
    t.objectStore('sessions').getAll(),
  ).then((sessions) => sessions.sort((a, b) => b.createdAt - a.createdAt));
}

export function updateSession(id: string, patch: Partial<RecordingSession>): Promise<void> {
  return tx<void>(['sessions'], 'readwrite', (t) => {
    const store = t.objectStore('sessions');
    const req = store.get(id);
    req.onsuccess = () => {
      const existing = req.result as RecordingSession | undefined;
      if (!existing) return;
      store.put({ ...existing, ...patch });
    };
  });
}

export function deleteSession(id: string): Promise<void> {
  return tx<void>(['sessions', 'segments', 'chunks', 'events'], 'readwrite', (t) => {
    t.objectStore('sessions').delete(id);
    const segments = t.objectStore('segments');
    const chunks = t.objectStore('chunks');
    const events = t.objectStore('events');
    const index = segments.index('bySession');
    const cursorReq = index.openCursor(IDBKeyRange.only(id));
    cursorReq.onsuccess = () => {
      const cursor = cursorReq.result;
      if (!cursor) return;
      const segmentId = (cursor.value as RecordingSegment).id;
      const kinds: ChunkKind[] = ['tab', 'webcam'];
      for (const kind of kinds) {
        chunks.delete(IDBKeyRange.bound([segmentId, kind, 0], [segmentId, kind, Infinity]));
      }
      events.delete(IDBKeyRange.bound([segmentId, 0], [segmentId, Infinity]));
      segments.delete(segmentId);
      cursor.continue();
    };
  });
}

/**
 * Remove one segment and everything keyed to it, and unlink it from its
 * session. Same cascade as `deleteSession`, one segment wide, plus the
 * `segmentIds` edit that a whole-session delete does not need. Used to undo a
 * segment row whose recording never produced a chunk: left in place it loads
 * as a zero-byte, unplayable source.
 */
export function deleteSegment(id: string): Promise<void> {
  return tx<void>(['sessions', 'segments', 'chunks', 'events'], 'readwrite', (t) => {
    const segments = t.objectStore('segments');
    const sessions = t.objectStore('sessions');
    // Issued before the delete below, so it still reads the row: IndexedDB
    // runs a transaction's requests in the order they were made.
    const segmentReq = segments.get(id);
    segmentReq.onsuccess = () => {
      const segment = segmentReq.result as RecordingSegment | undefined;
      if (!segment) return;
      const sessionReq = sessions.get(segment.sessionId);
      sessionReq.onsuccess = () => {
        const session = sessionReq.result as RecordingSession | undefined;
        if (!session) return;
        sessions.put({ ...session, segmentIds: session.segmentIds.filter((s) => s !== id) });
      };
    };
    const chunks = t.objectStore('chunks');
    const kinds: ChunkKind[] = ['tab', 'webcam'];
    for (const kind of kinds) {
      chunks.delete(IDBKeyRange.bound([id, kind, 0], [id, kind, Infinity]));
    }
    t.objectStore('events').delete(IDBKeyRange.bound([id, 0], [id, Infinity]));
    segments.delete(id);
  });
}

export function findRecoverableSessions(): Promise<RecordingSession[]> {
  return listSessions().then((sessions) => sessions.filter((s) => s.status === 'recording'));
}

export function createSegment(
  sessionId: string,
  index: number,
  viewport: SegmentViewport,
  hasWebcam: boolean,
): Promise<RecordingSegment> {
  const segment: RecordingSegment = {
    id: crypto.randomUUID(),
    sessionId,
    index,
    startedAt: Date.now(),
    duration: 0,
    viewport,
    hasWebcam,
  };
  return tx<RecordingSegment>(['segments', 'sessions'], 'readwrite', (t) => {
    t.objectStore('segments').put(segment);
    const sessions = t.objectStore('sessions');
    const req = sessions.get(sessionId);
    req.onsuccess = () => {
      const session = req.result as RecordingSession | undefined;
      if (!session) return;
      sessions.put({ ...session, segmentIds: [...session.segmentIds, segment.id] });
    };
  }).then(() => segment);
}

export function getSegments(sessionId: string): Promise<RecordingSegment[]> {
  return tx<RecordingSegment[]>(['segments'], 'readonly', (t) =>
    t.objectStore('segments').index('bySession').getAll(IDBKeyRange.only(sessionId)),
  ).then((segments) => segments.sort((a, b) => a.index - b.index));
}

export function finalizeSegment(id: string, duration: number): Promise<void> {
  return tx<void>(['segments'], 'readwrite', (t) => {
    const store = t.objectStore('segments');
    const req = store.get(id);
    req.onsuccess = () => {
      const existing = req.result as RecordingSegment | undefined;
      if (!existing) return;
      store.put({ ...existing, duration });
    };
  });
}

export function appendChunk(
  segmentId: string,
  kind: ChunkKind,
  seq: number,
  blob: Blob,
): Promise<void> {
  const record: ChunkRecord = { segmentId, kind, seq, blob };
  return tx<void>(['chunks'], 'readwrite', (t) => {
    t.objectStore('chunks').put(record);
  });
}

export function readChunks(segmentId: string, kind: ChunkKind): Promise<Blob[]> {
  return tx<ChunkRecord[]>(['chunks'], 'readonly', (t) =>
    t
      .objectStore('chunks')
      .getAll(IDBKeyRange.bound([segmentId, kind, 0], [segmentId, kind, Infinity])),
  ).then((records) => records.map((r) => r.blob));
}

export function countChunks(segmentId: string, kind: ChunkKind): Promise<number> {
  return tx<number>(['chunks'], 'readonly', (t) =>
    t
      .objectStore('chunks')
      .count(IDBKeyRange.bound([segmentId, kind, 0], [segmentId, kind, Infinity])),
  );
}

export function appendEvents(segmentId: string, seq: number, events: CursorEvent[]): Promise<void> {
  const record: EventBatchRecord = { segmentId, seq, events };
  return tx<void>(['events'], 'readwrite', (t) => {
    t.objectStore('events').put(record);
  });
}

export function readEvents(segmentId: string): Promise<CursorEvent[]> {
  return tx<EventBatchRecord[]>(['events'], 'readonly', (t) =>
    t.objectStore('events').getAll(IDBKeyRange.bound([segmentId, 0], [segmentId, Infinity])),
  ).then((records) => records.flatMap((r) => r.events));
}
