# Screen Recorder with Auto Zoom — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Record the current tab with cursor tracking, auto-generate zoom effects at clicks, let the user edit zooms in a new recorder editor page, and export a WebM — all local.

**Architecture:** The popup requests the optional `tabCapture` permission on a click gesture and messages the service worker. The worker orchestrates: it resolves a stream ID, spins up an offscreen document that owns every stream and both MediaRecorders (1-second timeslice, chunks straight to IndexedDB), and injects a content-script overlay (control bar + cursor logger). Stop opens a new `src/recorder/` editor page (Vite entry, Preact) with timeline, zoom editing, and a canvas re-render export.

**Tech Stack:** Existing stack only — Preact, Vite + @crxjs/vite-plugin, Vitest, vanilla IndexedDB. One new devDependency: `fake-indexeddb` (unit tests for the DB module; vitest runs in a node environment with no IndexedDB, and hand-writing an IDB fake is more code than the module under test).

**Spec:** `agent_docs/plans/2026-08-18-screen-recorder-design.md`

## Global Constraints

- 100% local: no servers, no accounts, no new data collection. No new runtime dependencies.
- `minimum_chrome_version` becomes `"116"` (MV3 `tabCapture` in offscreen documents).
- `tabCapture` is an **optional permission**, requested only from a user gesture. `<all_urls>` is an **optional host permission**, off by default.
- Every user-visible string goes through `chrome.i18n.getMessage` with an entry in `public/_locales/en/messages.json` (message + description, matching existing key style: camelCase).
- Colors: coral accent (`--accent` #e8503a), amber for warnings (`--warning`). No blue anywhere (icon-rebrand rule).
- Preact idiom: `class=` not `className`, hooks from `preact/hooks`, `t(id)` i18n helper per page.
- Reuse, don't fork: `formatFilename` from `src/shared/utils.ts`, frame model from `src/editor/frame.ts` (`frameMetrics`, `paintFrame`, `clipToFrame`, `frameFromSettings`, `frameToSettings`), tokens from `src/shared/tokens.css` + `src/shared/controls.css`.
- Shared code (`src/shared/`) must not import from `src/editor/` or `src/recorder/`.
- Version fields stay at 1.1.0 until the final task, which bumps ALL EIGHT version fields to 1.2.0 together (see task 18).
- Done per task = `npm test` + `npm run build` (runs tsc) + `npm run lint` pass.
- Commits: conventional style matching git log (`feat(record): …`, `feat(recorder): …`, `docs: …`, `test: …`). No co-author trailers.
- Deferred (do NOT build): follow-cursor zoom, platform size presets, MP4 export, split-and-delete inside a segment. Out of scope: cloud share, motion blur, synthetic cursor smoothing, desktop/window capture.

## File map

| File | Responsibility |
| --- | --- |
| `src/shared/recording-types.ts` | Session/segment/chunk/event shapes, recording message protocol, defaults |
| `src/shared/recording-db.ts` | IndexedDB access (`openscreenshot-recordings` v1), no library |
| `src/offscreen/index.html` + `src/offscreen/engine.ts` | Offscreen document: streams, recorders, chunk writes, cursor-batch writes, overlay watchdog |
| `src/offscreen/mime.ts` | Pure codec pick (VP9→VP8 fallback) |
| `src/background/recording.ts` | Worker-side orchestration: REC_* messages, offscreen lifecycle, badge, heal/re-inject, recovery |
| `src/content/recording-overlay.ts` | Self-contained injected functions: control bar + cursor logger (region-select idiom) |
| `src/popup/App.tsx` (modify) | Record row, toggles, stop state, recover/continue rows, "Record across sites" setting |
| `src/recorder/index.html`, `main.tsx`, `App.tsx`, `recorder.css` | Recorder editor page shell |
| `src/recorder/session-load.ts` | Assemble chunks into playable Blobs, duration fix, recovery normalization |
| `src/recorder/zoom.ts` | Zoom blocks, auto-zoom clustering, camera interpolation (pure) |
| `src/recorder/timeline-math.ts` | Trim + timeline↔source time mapping (pure) |
| `src/recorder/events-map.ts` | Cursor events → normalized video coords across resizes (pure) |
| `src/recorder/recorder-draft.ts` | Per-session editor state: shape, defaults, validation (draft.ts pattern) |
| `src/recorder/render.ts` | Frame drawing: camera rect, letterbox, ripple, bubble, beautify compose (pure helpers + one draw fn) |
| `src/recorder/export-video.ts` | Export driver: hidden video playback, captureStream, audio mix, progress/cancel |
| `src/recorder/Timeline.tsx`, `src/recorder/Rail.tsx` | Timeline strip + settings rail components |
| `src/recorder/webcam-frame.html` + `webcam-frame.ts` | Web-accessible iframe: camera/mic prompts + webcam preview |
| `tests/unit/*.test.ts` | Vitest units per pure module |
| `tests/browser/recorder-smoke.mjs` | Headless-Chrome smoke script over `dist/` |

---

### Task 1: Manifest, shared recording types, and build entries

**Files:**
- Modify: `manifest.json`
- Modify: `vite.config.ts`
- Create: `src/shared/recording-types.ts`
- Modify: `src/shared/types.ts` (widen `BackgroundMessage`)
- Create: `src/offscreen/index.html`, `src/offscreen/engine.ts` (stub), `src/recorder/index.html`, `src/recorder/main.tsx`, `src/recorder/App.tsx` (stub), `src/recorder/recorder.css` (empty shell)
- Modify: `public/_locales/en/messages.json` (command description key)

**Interfaces:**
- Produces: every type below, imported verbatim by tasks 2–17. `BackgroundMessage = CaptureRequest | RecMessage`.

- [ ] **Step 1: Manifest diff**

Apply exactly:

```json
"minimum_chrome_version": "116",
"permissions": [ ...existing seven..., "offscreen" ],
"optional_permissions": ["tabCapture"],
"optional_host_permissions": ["<all_urls>"],
"commands": {
  ...existing three...,
  "stop-recording": {
    "suggested_key": { "default": "Alt+Shift+X", "mac": "Alt+Shift+X" },
    "description": "__MSG_cmdStopRecording__"
  }
}
```

Add to messages.json: `cmdStopRecording` → "Stop the current recording". Existing command descriptions are plain strings — keep theirs as-is; the new one may be plain too if `__MSG_` placeholders are not already used in commands (they are not: match the existing plain-string style, drop the `__MSG_` form, and skip the messages.json key in that case). Check the file and match it.

- [ ] **Step 2: Vite entries**

crxjs only builds pages reachable from the manifest; the offscreen and recorder pages are opened via `chrome.runtime.getURL`, so add rollup inputs:

```ts
build: {
  outDir: 'dist',
  emptyOutDir: true,
  target: 'es2022',
  modulePreload: false,
  rollupOptions: {
    input: {
      offscreen: 'src/offscreen/index.html',
      recorder: 'src/recorder/index.html',
    },
  },
},
```

- [ ] **Step 3: `src/shared/recording-types.ts`**

```ts
/** Shared shapes for the screen recorder: DB rows, cursor log, message protocol. */

export interface RecordingSettings {
  mic: boolean;
  tabAudio: boolean;
  webcam: boolean;
  ripple: boolean;
}

export const DEFAULT_RECORDING_SETTINGS: RecordingSettings = {
  mic: false,
  tabAudio: true,
  webcam: false,
  ripple: true,
};

export type SessionStatus = 'recording' | 'complete';

export interface RecordingSession {
  id: string;
  createdAt: number;
  status: SessionStatus;
  settings: RecordingSettings;
  segmentIds: string[];
  /** Recorder editor state; `src/recorder/recorder-draft.ts` owns the shape. */
  editorState?: unknown;
}

export interface SegmentViewport {
  w: number;
  h: number;
  dpr: number;
}

export interface RecordingSegment {
  id: string;
  sessionId: string;
  index: number;
  startedAt: number;
  /** Recorded ms, pauses excluded. 0 until finalized (crash → recovery estimates). */
  duration: number;
  viewport: SegmentViewport;
  hasWebcam: boolean;
}

export type ChunkKind = 'tab' | 'webcam';

/** `t` is ms since segment start, pauses excluded. x/y/w/h are CSS px. */
export type CursorEvent =
  | { kind: 'move'; t: number; x: number; y: number }
  | { kind: 'click'; t: number; x: number; y: number }
  | { kind: 'resize'; t: number; w: number; h: number; dpr: number }
  | { kind: 'overlay-lost'; t: number }
  | { kind: 'overlay-healed'; t: number };

// --- Gesture surfaces (popup / overlay / command) → worker -----------------

export type RecMessage =
  | { type: 'REC_START'; settings: RecordingSettings; continueSessionId?: string }
  | { type: 'REC_STOP' }
  | { type: 'REC_PAUSE' }
  | { type: 'REC_RESUME' }
  | { type: 'REC_CANCEL' }
  | { type: 'REC_QUERY' };

/** REC_QUERY reply. */
export interface RecState {
  active: boolean;
  paused: boolean;
  sessionId?: string;
  /** Elapsed recorded ms at reply time, pauses excluded. */
  elapsedMs?: number;
  settings?: RecordingSettings;
  overlayLost?: boolean;
  recoverableSessionId?: string;
}

// --- Worker → offscreen document (target discriminates broadcast) ----------

export type OffscreenMessage =
  | {
      type: 'OFFSCREEN_START';
      target: 'offscreen';
      streamId: string;
      sessionId: string;
      segmentId: string;
      settings: RecordingSettings;
    }
  | { type: 'OFFSCREEN_STOP'; target: 'offscreen' }
  | { type: 'OFFSCREEN_PAUSE'; target: 'offscreen' }
  | { type: 'OFFSCREEN_RESUME'; target: 'offscreen' }
  | { type: 'OFFSCREEN_CANCEL'; target: 'offscreen' };

// --- Offscreen document → worker -------------------------------------------

export type EngineMessage =
  | { type: 'ENGINE_STARTED'; sessionId: string }
  | { type: 'ENGINE_STOPPED'; sessionId: string; canceled: boolean }
  | { type: 'ENGINE_ERROR'; sessionId: string; message: string }
  | { type: 'OVERLAY_LOST'; sessionId: string }
  | { type: 'OVERLAY_HEALED'; sessionId: string };

// --- Content overlay → offscreen document ----------------------------------

export interface CursorBatch {
  type: 'CURSOR_BATCH';
  target: 'offscreen';
  segmentId: string;
  seq: number;
  events: CursorEvent[];
}

export function isRecMessage(m: unknown): m is RecMessage {
  return (
    !!m &&
    typeof m === 'object' &&
    typeof (m as { type?: unknown }).type === 'string' &&
    (m as { type: string }).type.startsWith('REC_')
  );
}

export function isEngineMessage(m: unknown): m is EngineMessage {
  const t = (m as { type?: unknown } | null)?.type;
  return (
    typeof t === 'string' &&
    (t.startsWith('ENGINE_') || t === 'OVERLAY_LOST' || t === 'OVERLAY_HEALED')
  );
}
```

- [ ] **Step 4: Widen `BackgroundMessage`**

In `src/shared/types.ts`:

```ts
import type { RecMessage } from './recording-types';
export type BackgroundMessage = CaptureRequest | RecMessage;
```

The existing worker listener guards with `isCaptureRequest`, so this is safe.

- [ ] **Step 5: Page stubs**

`src/offscreen/index.html` (same skeleton as popup, title "OpenScreenShot Recorder Engine", script `./engine.ts`, no `#app` div needed). `src/offscreen/engine.ts` for now: `console.log('[OpenScreenShot] engine loaded');`. `src/recorder/index.html` mirrors `src/editor/index.html` (title "OpenScreenShot Recorder"), `main.tsx` mirrors the editor's, `App.tsx` renders `<div class="rec-app">OpenScreenShot Recorder</div>`, `recorder.css` imports tokens + controls:

```css
@import '../shared/tokens.css';
@import '../shared/controls.css';
```

(Check how `editor.css` pulls tokens in and copy that mechanism exactly.)

- [ ] **Step 6: Verify + commit**

Run `npm test`, `npm run build`, `npm run lint`. Confirm `dist/` contains the offscreen and recorder HTML plus the manifest keys from Step 1 (`grep tabCapture dist/manifest.json`). Commit: `feat(record): manifest groundwork, shared recording types, page entries`.

---

### Task 2: Recording database

**Files:**
- Create: `src/shared/recording-db.ts`
- Test: `tests/unit/recording-db.test.ts`
- Modify: `package.json` (devDependency `fake-indexeddb@^6`)

**Interfaces:**
- Consumes: types from `src/shared/recording-types.ts`.
- Produces (all exported, all Promise-returning; every later task uses these exact names):

```ts
createSession(settings: RecordingSettings): Promise<RecordingSession>
getSession(id: string): Promise<RecordingSession | null>
listSessions(): Promise<RecordingSession[]>            // newest first
updateSession(id: string, patch: Partial<RecordingSession>): Promise<void>
deleteSession(id: string): Promise<void>               // cascades segments/chunks/events
findRecoverableSessions(): Promise<RecordingSession[]> // status === 'recording'
createSegment(sessionId: string, index: number, viewport: SegmentViewport, hasWebcam: boolean): Promise<RecordingSegment>
getSegments(sessionId: string): Promise<RecordingSegment[]>  // ordered by index
finalizeSegment(id: string, duration: number): Promise<void>
appendChunk(segmentId: string, kind: ChunkKind, seq: number, blob: Blob): Promise<void>
readChunks(segmentId: string, kind: ChunkKind): Promise<Blob[]>  // ordered by seq
countChunks(segmentId: string, kind: ChunkKind): Promise<number>
appendEvents(segmentId: string, seq: number, events: CursorEvent[]): Promise<void>
readEvents(segmentId: string): Promise<CursorEvent[]>  // flattened, batch order
```

- [ ] **Step 1: Add fake-indexeddb**

`npm i -D fake-indexeddb`. This is dev-only; the runtime module uses the platform API ("No library" per spec).

- [ ] **Step 2: Write failing tests**

`tests/unit/recording-db.test.ts` — head:

```ts
import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import {
  appendChunk, appendEvents, countChunks, createSegment, createSession,
  deleteSession, finalizeSegment, findRecoverableSessions, getSegments,
  getSession, listSessions, readChunks, readEvents, updateSession,
} from '../../src/shared/recording-db';
import { DEFAULT_RECORDING_SETTINGS } from '../../src/shared/recording-types';

beforeEach(() => {
  // Fresh DB per test; the module reopens lazily.
  indexedDB = new IDBFactory();
});
```

(If reassigning the global fails under the test env, export a test-only `__closeForTests()` from the module that closes and nulls the cached connection, and call `indexedDB.deleteDatabase` — pick whichever works, but tests must be isolated.)

Cases (write them all):
- `createSession` returns id, `status: 'recording'`, empty `segmentIds`; `getSession` round-trips; `getSession('nope')` → null.
- `listSessions` orders newest first (create two with distinct `createdAt` by patching via `updateSession`).
- `createSegment` appends its id to the session's `segmentIds`; `getSegments` orders by index even when created out of order.
- `finalizeSegment` sets duration.
- `appendChunk`/`readChunks`: three chunks appended as seq 2,0,1 read back size-ordered by seq; `countChunks` → 3; other `kind` → empty.
- `appendEvents`/`readEvents`: two batches (seq 0 with 2 events, seq 1 with 1) flatten to 3 in order.
- `deleteSession` removes session, its segments, chunks, and events (`readChunks` → [], `getSegments` → []).
- `findRecoverableSessions` returns only `status: 'recording'` sessions.

- [ ] **Step 3: Run tests, verify they fail** (`npx vitest run tests/unit/recording-db.test.ts` — module missing).

- [ ] **Step 4: Implement `src/shared/recording-db.ts`**

```ts
/**
 * IndexedDB persistence for tab recordings. Chunks are written every second
 * while recording, so a crash loses at most one second. No library —
 * `unlimitedStorage` is already granted, and the shapes live in
 * ./recording-types.
 */
import type {
  ChunkKind, CursorEvent, RecordingSegment, RecordingSession,
  RecordingSettings, SegmentViewport,
} from './recording-types';

const DB_NAME = 'openscreenshot-recordings';
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

function open(): Promise<IDBDatabase> {
  dbPromise ??= new Promise((resolve, reject) => {
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
```

Then each API function over that helper. Notes that matter:
- `createSession`: `{ id: crypto.randomUUID(), createdAt: Date.now(), status: 'recording', settings, segmentIds: [] }`.
- `createSegment` runs one readwrite transaction over `['segments','sessions']`: put the segment AND read-modify-write the session's `segmentIds` in the same transaction.
- `readChunks(segmentId, kind)`: `IDBKeyRange.bound([segmentId, kind, 0], [segmentId, kind, Infinity])`, `getAll`, map to `.blob`. Chunk record: `{ segmentId, kind, seq, blob }`.
- `readEvents`: range `[segmentId, 0]`..`[segmentId, Infinity]`, flatten `.events`.
- `deleteSession`: one readwrite transaction across all four stores; iterate the session's segments via the `bySession` index and delete each segment's chunk and event ranges with `IDBObjectStore.delete(IDBKeyRange)`.
- `listSessions`: `getAll` then sort `createdAt` desc.
- Export nothing else; keep the file free of editor imports.

- [ ] **Step 5: Run the test file → PASS, then `npm test`, `npm run build`, `npm run lint`.**

- [ ] **Step 6: Commit** — `feat(record): IndexedDB recording store` (include package.json + lockfile).

---

### Task 3: Offscreen engine

**Files:**
- Create: `src/offscreen/mime.ts`
- Modify: `src/offscreen/engine.ts` (replace stub)
- Test: `tests/unit/recorder-mime.test.ts`

**Interfaces:**
- Consumes: `recording-db` write APIs, `OffscreenMessage`/`EngineMessage`/`CursorBatch` from recording-types.
- Produces: a running engine the worker drives purely via messages. Also `pickRecorderMime(supported: (t: string) => boolean, audioOnly: boolean): string`.

- [ ] **Step 1: Failing tests for mime pick**

```ts
import { describe, expect, it } from 'vitest';
import { pickRecorderMime } from '../../src/offscreen/mime';

describe('pickRecorderMime', () => {
  it('prefers vp9+opus', () => {
    expect(pickRecorderMime(() => true, false)).toBe('video/webm;codecs=vp9,opus');
  });
  it('falls back to vp8+opus', () => {
    expect(pickRecorderMime((t) => !t.includes('vp9'), false)).toBe('video/webm;codecs=vp8,opus');
  });
  it('falls back to bare webm', () => {
    expect(pickRecorderMime((t) => t === 'video/webm', false)).toBe('video/webm');
  });
  it('audio-only prefers opus', () => {
    expect(pickRecorderMime(() => true, true)).toBe('audio/webm;codecs=opus');
  });
  it('returns empty string when nothing matches (let MediaRecorder default)', () => {
    expect(pickRecorderMime(() => false, false)).toBe('');
  });
});
```

- [ ] **Step 2: Run → FAIL. Implement `mime.ts`** (ordered candidate lists, first `supported` wins, `''` fallback). Run → PASS.

- [ ] **Step 3: Implement the engine**

`src/offscreen/engine.ts` structure:

```ts
import {
  appendChunk, appendEvents, createSegment, finalizeSegment, updateSession,
  deleteSession,
} from '../shared/recording-db';
import type { CursorBatch, OffscreenMessage, RecordingSettings } from '../shared/recording-types';
import { pickRecorderMime } from './mime';

const VIDEO_BITS_PER_SECOND = 2_500_000;
const TIMESLICE_MS = 1000;
const OVERLAY_TIMEOUT_MS = 2500;

interface EngineState {
  sessionId: string;
  segmentId: string;
  settings: RecordingSettings;
  streams: MediaStream[];
  recorders: MediaRecorder[];
  audioCtx: AudioContext | null;
  startedAt: number;
  pausedAt: number;      // 0 while running
  pausedAccumMs: number;
  seq: { tab: number; webcam: number };
  lastBatchAt: number;
  overlayLost: boolean;
  watchdog: ReturnType<typeof setInterval> | null;
  stopping: boolean;
}
let state: EngineState | null = null;
```

Start flow (`OFFSCREEN_START`):
1. `getUserMedia` for the tab (the mandatory-constraint form is not in the TS lib — cast):

```ts
const tabStream = await navigator.mediaDevices.getUserMedia({
  audio: settings.tabAudio
    ? { mandatory: { chromeMediaSource: 'tab', chromeMediaSourceId: streamId } }
    : false,
  video: { mandatory: { chromeMediaSource: 'tab', chromeMediaSourceId: streamId } },
} as MediaStreamConstraints);
```

2. When `tabAudio`: route audio back to the speakers (capture mutes the tab):

```ts
const audioCtx = new AudioContext();
audioCtx.createMediaStreamSource(tabStream).connect(audioCtx.destination);
```

3. Mic (only when `settings.mic`): `getUserMedia({ audio: { noiseSuppression: true, echoCancellation: true, autoGainControl: true } })`. Wrap in try/catch — a decline means "record without that track", never a failed start. Webcam capture is task 13; this task records mic into recorder #2 as audio-only when mic is on (`pickRecorderMime(…, true)`).
4. Recorder #1: tab video + tab audio tracks, `pickRecorderMime(MediaRecorder.isTypeSupported, false)`, `{ videoBitsPerSecond: VIDEO_BITS_PER_SECOND }`, `start(TIMESLICE_MS)`. `ondataavailable` → `if (e.data.size) void appendChunk(segmentId, 'tab', state.seq.tab++, e.data)`. Recorder #2 (mic-only for now) writes kind `'webcam'`.
5. Tab-closed handling: `tabStream.getVideoTracks()[0].onended = () => void stop(false)`.
6. Watchdog interval (1s): if `!overlayLost && Date.now() - lastBatchAt > OVERLAY_TIMEOUT_MS` → set lost, `appendEvents(segmentId, nextEventSeq(), [{ kind: 'overlay-lost', t: elapsed() }])`, send `{ type: 'OVERLAY_LOST', sessionId }`. Event seq counter shared with batch writes: keep `eventSeq` in state, initialized from the batch seq handed in `CURSOR_BATCH` — simplest correct scheme: engine owns the seq; on `CURSOR_BATCH` it writes with its own `eventSeq++` and ignores the batch's `seq` field except for ordering sanity. Document this on the field.
7. `elapsed()` = `(pausedAt || Date.now()) - startedAt - pausedAccumMs`.

Message listener (one `chrome.runtime.onMessage.addListener`):
- Filter `target === 'offscreen'`.
- `CURSOR_BATCH`: `lastBatchAt = Date.now()`; if `overlayLost` → clear it, append `overlay-healed` event, send `OVERLAY_HEALED`; then `appendEvents(segmentId, eventSeq++, batch.events)`.
- `OFFSCREEN_PAUSE` / `OFFSCREEN_RESUME`: `recorder.pause()/resume()` on all recorders; maintain `pausedAt`/`pausedAccumMs`.
- `OFFSCREEN_STOP` → `stop(false)`; `OFFSCREEN_CANCEL` → `stop(true)`.

`stop(canceled)`:
- Guard `stopping`. Stop watchdog. For each recorder: wrap `onstop` in a promise, call `.stop()`, await all. Stop every track, close `audioCtx`.
- Not canceled: `finalizeSegment(segmentId, elapsed())`, `updateSession(sessionId, { status: 'complete' })`.
- Canceled: `deleteSession(sessionId)`.
- Send `{ type: 'ENGINE_STOPPED', sessionId, canceled }`; clear state.
- Any thrown error during start → `ENGINE_ERROR` with the message, then best-effort cleanup.

Note: the engine does NOT create the session/segment rows — the worker does (task 4) and passes ids in. `createSegment` import is unused here; drop it.

- [ ] **Step 4: `npm test` + `npm run build` + `npm run lint`.** The engine itself is exercised in tasks 4–6 and the smoke test; no headless run in this task.

- [ ] **Step 5: Commit** — `feat(record): offscreen recording engine`.

---

### Task 4: Worker orchestration

**Files:**
- Create: `src/background/recording.ts`
- Modify: `src/background/index.ts` (add `import './recording';` — one line, keep capture code untouched)
- Modify: `src/content/recording-overlay.ts` — NOT yet; task 5. This task calls a placeholder `mountOverlay` that this task defines as a no-op TODO-free stub in `recording.ts` and task 5 replaces with the real injection. Keep the stub's signature identical: `healOverlay(tabId: number): Promise<boolean>` returning `false`.

**Interfaces:**
- Consumes: `recording-db`, recording-types, `isProtectedUrl` from `src/shared/utils.ts`.
- Produces: message-driven recording control; `REC_QUERY` → `RecState` reply. Badge contract: text `REC`, coral `#e8503a` while recording, amber `#ff9500` while `overlayLost`, cleared when idle. Editor open URL on stop: `chrome.runtime.getURL('src/recorder/index.html') + '?session=' + sessionId`.

- [ ] **Step 1: Persistent state**

The worker can idle mid-recording; keep authoritative state in `chrome.storage.session`:

```ts
const REC_STATE_KEY = 'openscreenshot:rec-state';
interface StoredRecState {
  sessionId: string;
  segmentId: string;
  tabId: number;
  startedAt: number;
  pausedAt: number;       // 0 while running
  pausedAccumMs: number;
  settings: RecordingSettings;
  overlayLost: boolean;
}
```

Helpers `getRecState() / setRecState(patch) / clearRecState()` over `chrome.storage.session`.

- [ ] **Step 2: Message listener**

Own `chrome.runtime.onMessage.addListener` in `recording.ts` (do not touch the capture listener). Return `true` ONLY for `REC_QUERY` (async `sendResponse`); everything else returns false after firing an async handler.

- `REC_START { settings, continueSessionId }`:
  - Active recording already? → ignore.
  - `getActiveTab()` (duplicate the two-line query here; do not export from index.ts). Protected URL (`isProtectedUrl`) → reply not needed; popup pre-checks (task 6). Guard anyway: no-op.
  - Ensure offscreen document:

  ```ts
  async function ensureOffscreen(): Promise<void> {
    const contexts = await chrome.runtime.getContexts({
      contextTypes: ['OFFSCREEN_DOCUMENT' as chrome.runtime.ContextType],
    });
    if (contexts.length > 0) return;
    await chrome.offscreen.createDocument({
      url: 'src/offscreen/index.html',
      reasons: ['USER_MEDIA' as chrome.offscreen.Reason],
      justification: 'Record the current tab with MediaRecorder.',
    });
  }
  ```

  - `const streamId = await chrome.tabCapture.getMediaStreamId({ targetTabId: tab.id });`
  - Session row: continue → `getSession(continueSessionId)`, set `status: 'recording'` via `updateSession`; else `createSession(settings)`. Segment: `createSegment(session.id, session.segmentIds.length, viewport, settings.webcam)` where viewport comes from `execInTab`-style injection of a tiny self-contained function returning `{ w: innerWidth, h: innerHeight, dpr: devicePixelRatio }` (write the function inline in recording.ts).
  - `setRecState({...})`, send `OFFSCREEN_START`, set badge REC, `void healOverlay(tab.id)`.
- `REC_STOP`: `await healOverlay(state.tabId)` first (spec: the stop command heals before it stops — the heal writes the final cursor batch), then send `OFFSCREEN_STOP`.
- `REC_PAUSE` / `REC_RESUME`: forward to offscreen; update `pausedAt`/`pausedAccumMs` in stored state.
- `REC_CANCEL`: send `OFFSCREEN_CANCEL`.
- `REC_QUERY`: build `RecState` from stored state; `elapsedMs = (pausedAt || Date.now()) - startedAt - pausedAccumMs`. When no active state: scan `findRecoverableSessions()`; report first id as `recoverableSessionId` (a session is recoverable when status is `recording` and no engine is live — if stored state exists but `getContexts` finds no offscreen document, treat it as crashed: `clearRecState()` first). While active, also attempt `healOverlay(tabId)` (popup open = extension gesture = fresh activeTab grant).
- Engine messages (`isEngineMessage`):
  - `ENGINE_STARTED`: nothing (badge already set).
  - `OVERLAY_LOST` / `OVERLAY_HEALED`: patch state, swap badge color (amber `#ff9500` / coral `#e8503a`).
  - `ENGINE_ERROR`: clearRecState, badge cleared, close offscreen, `console.error`.
  - `ENGINE_STOPPED { canceled }`: clearRecState; badge cleared; `chrome.offscreen.closeDocument()` (catch and ignore); when not canceled → `chrome.tabs.create({ url: chrome.runtime.getURL('src/recorder/index.html') + '?session=' + sessionId })`.

- [ ] **Step 3: Command + re-injection hooks**

- `chrome.commands.onCommand`: in `recording.ts`, listen and handle only `'stop-recording'` → same as REC_STOP. (The capture listener ignores unknown commands already.)
- `chrome.tabs.onUpdated`: if `tabId` matches state and `changeInfo.status === 'complete'` → `void healOverlay(tabId)` (covers same-origin navigation always, cross-origin when `<all_urls>` is granted; `executeScript` failing without permission is the expected signal — catch → `false`).

- [ ] **Step 4: Badge helpers**

```ts
async function showRecBadge(lost: boolean): Promise<void> {
  await chrome.action.setBadgeBackgroundColor({ color: lost ? '#ff9500' : '#e8503a' });
  await chrome.action.setBadgeTextColor({ color: '#ffffff' });
  await chrome.action.setBadgeText({ text: 'REC' });
}
async function clearRecBadge(): Promise<void> {
  await chrome.action.setBadgeText({ text: '' });
}
```

- [ ] **Step 5: `npm test` + `npm run build` + `npm run lint`, commit** — `feat(record): worker recording orchestration`.

---

### Task 5: Content overlay and cursor logger

**Files:**
- Create: `src/content/recording-overlay.ts`
- Modify: `src/background/recording.ts` (replace the `healOverlay` stub with real injection)
- Test: `tests/unit/recording-overlay.test.ts`

**Interfaces:**
- Consumes: `CursorBatch`, `RecMessage` shapes.
- Produces: `mountRecordingOverlay(segmentId: string, elapsedMs: number, paused: boolean, tracks: { mic: boolean; tabAudio: boolean; webcam: boolean })` — a SELF-CONTAINED function injected via `chrome.scripting.executeScript({ func })` in the region-select idiom (no closure over module scope; every helper defined inside the function body). Also pure exports `formatTimer(ms: number): string` ("0:07", "1:23:45") and `MOVE_THROTTLE_MS = 33`, `FLUSH_INTERVAL_MS = 1000` — defined at module top level AND re-inlined inside the injected function (injected functions cannot reference module scope; add a comment saying the constants are duplicated on purpose).

- [ ] **Step 1: Failing tests for `formatTimer`**

```ts
import { describe, expect, it } from 'vitest';
import { formatTimer } from '../../src/content/recording-overlay';

describe('formatTimer', () => {
  it('formats seconds', () => expect(formatTimer(7_000)).toBe('0:07'));
  it('formats minutes', () => expect(formatTimer(83_000)).toBe('1:23'));
  it('formats hours', () => expect(formatTimer(5_025_000)).toBe('1:23:45'));
  it('floors ragged ms', () => expect(formatTimer(999)).toBe('0:00'));
  it('clamps negatives to zero', () => expect(formatTimer(-5)).toBe('0:00'));
});
```

- [ ] **Step 2: Run → FAIL, implement, run → PASS.**

- [ ] **Step 3: The injected function**

Inside `mountRecordingOverlay`:
- Idempotence guard: `if ((window as any).__ossRecOverlay) return; (window as any).__ossRecOverlay = true;` and store a cleanup fn on the same slot for unmount.
- Host `<div>` with `attachShadow({ mode: 'closed' })`, fixed position bottom-center, `z-index: 2147483647`, all styles inline in a `<style>` tag inside the shadow root (coral accent `#e8503a`, dark chip background `rgba(20,20,22,.92)`, white text, system font).
- Control bar contents: red pulsing dot, `<span class="timer">`, live track chips (`MIC`, `TAB`, `CAM` — render only enabled ones), Pause/Resume button, Stop button, Cancel button.
- Buttons send `chrome.runtime.sendMessage({ type: 'REC_PAUSE' | 'REC_RESUME' | 'REC_STOP' | 'REC_CANCEL' })`.
- Timer: `setInterval` 500 ms; local `startedAt = Date.now() - elapsedMs`, honors local paused state (toggled by the button and by remount args).
- Cursor logger: `mousemove` throttled to one sample per 33 ms, `mousedown` (clicks), `resize` + `matchMedia('(resolution: …)')`-free DPR read on resize. Events accumulate in an array as `{ kind, t, x, y }` with `t = Date.now() - startedAt - pausedAccum`. While paused, drop samples.
- Flush: `setInterval` 1000 ms → if buffer or heartbeat due, `chrome.runtime.sendMessage({ type: 'CURSOR_BATCH', target: 'offscreen', segmentId, seq: seq++, events: buffer.splice(0) })`. ALWAYS send (even empty) — the empty batch is the heartbeat the engine watchdog listens for. `.catch(() => {})` — the engine may be gone at teardown.
- An initial `resize`-shaped event is pushed at mount (`{ kind: 'resize', t, w, h, dpr }`) so the editor always knows the viewport at overlay birth.
- `pagehide` listener → best-effort final flush + cleanup.

- [ ] **Step 4: Real `healOverlay` in `recording.ts`**

```ts
import { mountRecordingOverlay } from '../content/recording-overlay';

async function healOverlay(tabId: number): Promise<boolean> {
  const s = await getRecState();
  if (!s) return false;
  const elapsed = (s.pausedAt || Date.now()) - s.startedAt - s.pausedAccumMs;
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      func: mountRecordingOverlay,
      args: [s.segmentId, elapsed, s.pausedAt !== 0, {
        mic: s.settings.mic, tabAudio: s.settings.tabAudio, webcam: s.settings.webcam,
      }],
    });
    return true;
  } catch {
    return false; // no permission on this origin — overlay stays lost
  }
}
```

- [ ] **Step 5: `npm test` + `npm run build` + `npm run lint`, commit** — `feat(record): recording control bar and cursor logger`.

---

### Task 6: Popup Record row

**Files:**
- Modify: `src/popup/App.tsx`, `src/popup/popup.css`
- Modify: `public/_locales/en/messages.json`

**Interfaces:**
- Consumes: `RecMessage`/`RecState`/`DEFAULT_RECORDING_SETTINGS`, `sendToBackground`.
- Produces: the only start surface. Continue key contract with task 7: `chrome.storage.session` key `'openscreenshot:continue-session'` holds a session id string.

- [ ] **Step 1: i18n keys**

Add to messages.json (message + description each): `recTitle` "Record", `recSub` "Record this tab with auto zoom", `recStart` "Record", `recStop` "Stop", `recCancel` "Cancel", `recRecording` "Recording…", `recPaused` "Paused", `recMic` "Mic", `recTabAudio` "Tab audio", `recWebcam` "Webcam", `recPermissionDenied` "Recording needs the tab capture permission.", `recProtected` "Can’t record this protected page.", `recRecover` "Recover last recording", `recContinue` "Continue recording", `recAcrossSites` "Record across sites", `recAcrossSitesHint` "Keeps the cursor overlay alive when the tab changes site. Grants access to all sites.", `recOn` "On", `recOff` "Off".

- [ ] **Step 2: State + wiring in `App.tsx`**

- New state: `recState: RecState | null`, `recSettings: RecordingSettings` (persist in `Settings`? No — recorder toggles live in a new `Settings` field would bloat the schema; keep them in `chrome.storage.local` under key `'openscreenshot:rec-settings'` read/written directly in the popup with `DEFAULT_RECORDING_SETTINGS` merge — two small helpers inside App.tsx), `activeTabProtected: boolean` (query active tab URL on mount → `isProtectedUrl`), `continueSessionId: string | null` (read the storage.session key on mount).
- On mount: `sendToBackground({ type: 'REC_QUERY' })` → response is `RecState`; note `sendToBackground` returns `Promise<unknown>` — cast.
- Record click:

```ts
async function startRecording() {
  const granted = await chrome.permissions.request({ permissions: ['tabCapture'] });
  if (!granted) { pushToast(t('recPermissionDenied'), 'error'); return; }
  await chrome.storage.session.remove('openscreenshot:continue-session');
  void sendToBackground({
    type: 'REC_START',
    settings: recSettings,
    continueSessionId: continueSessionId ?? undefined,
  }).catch(() => {}).finally(() => window.close());
}
```

(The popup closes like region mode does — recording needs the page.)
- UI, placed directly under the modes nav: a `mode-card`-styled row (reuse existing classes) with a record icon (filled circle, coral), title/sub, disabled when `activeTabProtected || recState?.active`; when `activeTabProtected`, clicking shows `recProtected` as an error toast (same message pattern the capture buttons use). Under it a chips row: three `seg-btn` toggles (Mic / Tab audio / Webcam) bound to `recSettings`, persisted on toggle.
- While `recState?.active`: replace the row body with the timer (use elapsed from RecState; tick locally), `recRecording`/`recPaused` label, and Stop + Cancel buttons (`REC_STOP` / `REC_CANCEL`, then `window.close()`).
- When `recState?.recoverableSessionId`: a footer-style link `recRecover` → `chrome.tabs.create({ url: chrome.runtime.getURL('src/recorder/index.html') + '?session=' + id })`, `window.close()`.
- When `continueSessionId` (and not active): the record row title reads `recContinue` instead of `recTitle`.

- [ ] **Step 3: "Record across sites" in `SettingsView`**

Segmented On/Off row (existing `settings-row` + `seg` classes). State from `chrome.permissions.contains({ origins: ['<all_urls>'] })` on mount. Enable → `chrome.permissions.request({ origins: ['<all_urls>'] })` (may return false — reflect actual state). Disable → `chrome.permissions.remove({ origins: ['<all_urls>'] })`. Hint line `recAcrossSitesHint` below.

- [ ] **Step 4: CSS**

Reuse `mode-card`, `seg`, `settings-row`. Add only: `.rec-dot` (8px coral circle with a 1.2s opacity pulse animation) and `.rec-live` (timer row). Popup is 340px wide — check the record row doesn't wrap.

- [ ] **Step 5: `npm test` + `npm run build` + `npm run lint`, commit** — `feat(record): popup record row, permission flow, across-sites setting`.

**Manual checkpoint (record in the ledger, not a blocker):** load `dist/` unpacked, record a page for ~10s, stop from the overlay; a recorder tab must open (blank shell), and `openscreenshot-recordings` in DevTools → IndexedDB must hold a session, a segment, ~10 tab chunks, and event batches.

---

### Task 7: Recorder page shell — sessions, playback, recovery

**Files:**
- Create: `src/recorder/session-load.ts`, `src/recorder/useRecorderSession.ts`
- Modify: `src/recorder/App.tsx`, `src/recorder/recorder.css`
- Modify: `public/_locales/en/messages.json`
- Test: `tests/unit/session-load.test.ts`

**Interfaces:**
- Consumes: recording-db reads, `deleteSession`, `updateSession`.
- Produces:

```ts
// session-load.ts
export interface LoadedSegment {
  segment: RecordingSegment;
  tabUrl: string;        // object URL of the assembled tab WebM
  webcamUrl: string | null;
  durationMs: number;    // real duration from the media element
  events: CursorEvent[];
}
export interface LoadedSession { session: RecordingSession; segments: LoadedSegment[]; }
export async function loadSession(id: string): Promise<LoadedSession | null>;
export async function fixDuration(video: HTMLVideoElement): Promise<number>; // seek-to-end trick, returns ms
export function assembleBlob(chunks: Blob[]): Blob; // new Blob(chunks, { type: 'video/webm' })
```

- [ ] **Step 1: Failing test for the pure part**

`assembleBlob` and a recovery-normalization helper `estimateDuration(chunkCount: number): number` (= `chunkCount * 1000`):

```ts
import { describe, expect, it } from 'vitest';
import { assembleBlob, estimateDuration } from '../../src/recorder/session-load';

it('concatenates chunks in order with the webm type', async () => {
  const b = assembleBlob([new Blob(['a']), new Blob(['bc'])]);
  expect(b.type).toBe('video/webm');
  expect(await b.text()).toBe('abc');
});
it('estimates one second per chunk', () => expect(estimateDuration(7)).toBe(7000));
```

- [ ] **Step 2: Run → FAIL, implement, run → PASS.**

- [ ] **Step 3: `loadSession` + `fixDuration`**

- `loadSession`: `getSession` → null passthrough; `getSegments`; per segment `readChunks(id,'tab')` → `assembleBlob` → `URL.createObjectURL`; same for `'webcam'` when `countChunks(...,'webcam') > 0`; `readEvents`. MediaRecorder omits the duration header, so `durationMs` starts as `segment.duration || estimateDuration(chunkCount)` and the UI corrects it: `fixDuration(video)` sets `currentTime = Number.MAX_SAFE_INTEGER`, awaits `seeked`, reads `video.duration` (now finite), resets `currentTime = 0`, returns ms.
- Recovery normalization inside `loadSession`: if `session.status === 'recording'`, this is a crashed session being opened — `updateSession(id, { status: 'complete' })` and `finalizeSegment` any 0-duration segment with the estimate.

- [ ] **Step 4: `useRecorderSession` hook + App shell**

Hook owns: `loading / session / segments / error`, current playhead (timeline ms), playing flag, current segment index; methods `play() / pause() / seek(timelineMs)`. Playback model: ONE visible `<video>` element rendered per segment but only the active one shown; on `ended` advance to the next segment and play. (Zoom-camera preview arrives in task 9 — plain `<video>` playback here.)

App views:
- No `?session=` param → session list: `listSessions()`, one row per session (date via `toLocaleString`, segment count, total duration), Open + Delete buttons (Delete → `deleteSession` + refresh; two-step confirm like the popup's reset button). Recoverable sessions (status `recording`) get an amber "Recovered" pill.
- With `?session=`: stage (video area, dark `--stage-bg`), transport row (play/pause button, `formatTimer`-style time readout — import `formatTimer` from `src/content/recording-overlay`), timeline placeholder strip showing one block per segment proportional to duration, settings rail placeholder (`<aside class="rail">`).
- Header: BrandMark + "Recorder" + a "Continue recording" button → sets `chrome.storage.session` key `'openscreenshot:continue-session'` to the session id and shows an info toast `recContinueHint`.
- Theme: copy `applyTheme` from popup App (three-line function) and call with stored settings on mount.

- [ ] **Step 5: i18n keys**

`recorderTitle` "Recorder", `recorderSessions` "Recordings", `recorderOpen` "Open", `recorderDelete` "Delete", `recorderDeleteConfirm` "Really delete?", `recorderEmpty` "No recordings yet. Record a tab from the popup.", `recorderRecovered` "Recovered", `recContinueHint` "Open the popup on the tab you want to keep recording.", `recorderPlay` "Play", `recorderPause` "Pause".

- [ ] **Step 6: `npm test` + `npm run build` + `npm run lint`, commit** — `feat(recorder): editor shell, session list, playback, recovery`.

---

### Task 8: Zoom, timeline, and event-mapping math (pure)

**Files:**
- Create: `src/recorder/zoom.ts`, `src/recorder/timeline-math.ts`, `src/recorder/events-map.ts`
- Test: `tests/unit/zoom.test.ts`, `tests/unit/timeline-math.test.ts`, `tests/unit/events-map.test.ts`

**Interfaces (produces — later tasks import these names verbatim):**

```ts
// zoom.ts
export const EASE_MS = 600;
export const HOLD_MS = 1000;
export const CLUSTER_GAP_MS = 2500;
export const CLUSTER_DIST_FRAC = 0.15;
export const ZOOM_SCALES = [1.5, 2, 3] as const;
export type ZoomScale = (typeof ZOOM_SCALES)[number];
export interface ZoomBlock {
  id: string;
  startMs: number;  // envelope start (ease-in begins here), timeline time
  endMs: number;    // envelope end (ease-out finishes here)
  scale: ZoomScale;
  cx: number;       // target center, normalized 0..1 in video space
  cy: number;
}
export interface Camera { scale: number; cx: number; cy: number }
export const IDENTITY_CAMERA: Camera = { scale: 1, cx: 0.5, cy: 0.5 };
export function clampCenter(c: number, scale: number): number;
export function autoZoomBlocks(
  clicks: { t: number; nx: number; ny: number }[],  // t = timeline ms, n* normalized
  durationMs: number,
): ZoomBlock[];
export function normalizeBlocks(blocks: ZoomBlock[]): ZoomBlock[]; // sort, clamp overlaps
export function cameraAt(blocks: ZoomBlock[], tMs: number): Camera;
export function easeInOutCubic(u: number): number;

// timeline-math.ts
export interface SegmentTiming { segmentId: string; sourceDuration: number; trimStart: number; trimEnd: number }
export function visibleDuration(s: SegmentTiming): number;
export function totalDuration(timings: SegmentTiming[]): number;
export function locate(timings: SegmentTiming[], timelineMs: number): { index: number; sourceMs: number };
export function timelineAt(timings: SegmentTiming[], index: number, sourceMs: number): number;
export function clampTrim(sourceDuration: number, start: number, end: number): { start: number; end: number };

// events-map.ts
export interface NormClick { t: number; nx: number; ny: number }  // t = SOURCE ms within segment
export function normalizeClicks(events: CursorEvent[], initial: SegmentViewport): NormClick[];
export function cursorPathAt(events: CursorEvent[], initial: SegmentViewport, tMs: number): { nx: number; ny: number } | null;
```

Semantics to implement and test:
- `clampCenter(c, s)` → `min(max(c, 0.5 / s), 1 - 0.5 / s)`; at scale 1 always 0.5.
- `autoZoomBlocks`: cluster consecutive clicks where `next.t - prev.t <= CLUSTER_GAP_MS` AND `|next.nx - first.nx| <= CLUSTER_DIST_FRAC` (normalized x distance vs the cluster's first click — "within 15% of the viewport width"). Block: `startMs = max(0, first.t - EASE_MS)`, `endMs = min(durationMs, last.t + HOLD_MS + EASE_MS)`, `scale = 2`, target = mean click position per axis, each `clampCenter`ed. Then `normalizeBlocks`.
- `normalizeBlocks`: sort by startMs; for each overlap, cut the earlier block's `endMs` to the later `startMs`; drop blocks whose envelope shrinks below `2 * EASE_MS` (no room to ease in and out).
- `cameraAt`: find the covering block (blocks disjoint). Outside all → IDENTITY. Inside: `f = easeInOutCubic(min(1, (t - start) / EASE_MS))` on the way in, `f = easeInOutCubic(min(1, (end - t) / EASE_MS))` on the way out, `f = 1` in the hold; interpolate scale and center linearly from identity by `f`, and `clampCenter` the interpolated center at the interpolated scale (keeps the camera inside the frame during the ease).
- `locate`: walk timings accumulating `visibleDuration`; return segment index and `sourceMs = trimStart + offsetInSegment`. `timelineMs` past the end clamps to the last frame. `timelineAt` is its inverse.
- `clampTrim`: non-negative, `start + end <= sourceDuration - 100` (always leave ≥100 ms visible).
- `normalizeClicks`: fold `resize` events to track the live viewport; each click maps `nx = x / liveW`, `ny = y / liveH` clamped 0..1. `t` passes through.
- `cursorPathAt`: latest `move` at or before `tMs` mapped the same way; null when none (e.g. during an overlay-lost gap).

- [ ] **Step 1: Write ALL the failing tests first.** Minimum cases: single click → one block with the exact envelope numbers (click at 5000 → 4400..6600); two clicks 2000 ms apart, near x → one block; two clicks 2600 ms apart → two blocks; two near-time clicks with nx 0.1 and 0.4 → two blocks; clamp at t=0 and t=duration; target clamping at scale 2 → cx=0.9 clamps to 0.75; `cameraAt` midpoints (t = start → identity, start+300 → f=0.5 easing value `easeInOutCubic(0.5)=0.5`, hold → full, end → identity); `normalizeBlocks` overlap cut and short-block drop; `locate`/`timelineAt` round-trip across three segments with trims; `clampTrim` floor; `normalizeClicks` across a mid-segment resize; `cursorPathAt` before any move → null.
- [ ] **Step 2: Run → FAIL. Implement all three modules. Run → PASS.**
- [ ] **Step 3: `npm test` + `npm run build` + `npm run lint`, commit** — `feat(recorder): zoom, timeline, and cursor-mapping math`.

---

### Task 9: Timeline and zoom editing UI

**Files:**
- Create: `src/recorder/Timeline.tsx`
- Modify: `src/recorder/App.tsx`, `src/recorder/useRecorderSession.ts`, `src/recorder/recorder.css`
- Modify: `public/_locales/en/messages.json`

**Interfaces:**
- Consumes: everything from task 8; `LoadedSession` from task 7.
- Produces: editor state lives in the hook as `{ zoomBlocks: ZoomBlock[]; trims: Record<string, { start: number; end: number }>; autoZoomDone: boolean }` plus mutators `setBlocks`, `setTrim(segmentId, patch)`, `addBlockAtPlayhead()`, `regenerateAutoZoom()` — task 10 persists this state; keep the shape exactly as `RecorderDraft` fields (task 10) so persistence is a pass-through.

- [ ] **Step 1: Auto zoom on first open**

In the hook, once segments load: if `!autoZoomDone` → clicks = concat over segments of `normalizeClicks(seg.events, seg.segment.viewport)` with `t` shifted by `timelineAt(timings, i, t)`; `zoomBlocks = autoZoomBlocks(clicks, totalDuration(timings))`; set `autoZoomDone = true`. Generated blocks are ordinary blocks from then on. `regenerateAutoZoom()` re-runs the same and replaces all blocks (button in the rail).

- [ ] **Step 2: Canvas preview with camera**

Replace the plain `<video>` stage with a `<canvas>` sized to the first segment's pixel size (`viewport.w * dpr` × `viewport.h * dpr`, CSS-scaled to fit the stage). rAF loop while playing (and one draw on every seek/state change): compute `timelineMs`, `locate` → active segment video element (keep the per-segment `<video>`s hidden), `cameraAt(zoomBlocks, timelineMs)` → source rect:

```ts
const sw = vw / cam.scale, sh = vh / cam.scale;
const sx = cam.cx * vw - sw / 2, sy = cam.cy * vh - sh / 2;
ctx.drawImage(video, sx, sy, sw, sh, 0, 0, W, H);
```

Segments with other pixel sizes letterbox (compute fit rect; export task 11 shares this via `fitRect` — put `fitRect(srcW, srcH, dstW, dstH)` in `render.ts` now if task 11 hasn't landed, else import it). Trims apply: `play()` seeks each segment video to `trimStart` on entry and advances at `sourceMs >= sourceDuration - trimEnd`.

- [ ] **Step 3: Timeline component**

Layout (order matches the spec): segment strips row, zoom track row, playhead over both, time ruler. All widths proportional to `visibleDuration` / `totalDuration`.
- Segment strip: rounded block per segment, trim handles at both ends (6px grab zones); dragging a handle updates `trims` via `clampTrim`; show trimmed-off zones as dimmed.
- Zoom track: one coral block per `ZoomBlock` spanning `startMs..endMs`. Drag body → move (shift both by dt, then `normalizeBlocks`); drag edges → resize (min `2 * EASE_MS`); click selects.
- Selected block: floating mini-toolbar with scale segmented control (1.5x / 2x / 3x from `ZOOM_SCALES`), Delete button, and a target reticle overlaid on the stage — a draggable crosshair at `(cx, cy)`; dragging updates the block's target through `clampCenter`.
- Playhead: full-height line; click/drag anywhere on the ruler seeks.
- "Add zoom" button (rail or transport row): inserts a 2x block centered at the playhead (`start = playhead - EASE_MS`, `end = playhead + HOLD_MS + EASE_MS`, target 0.5/0.5) then `normalizeBlocks`.

- [ ] **Step 4: i18n keys**

`recorderAddZoom` "Add zoom", `recorderRegenerate` "Regenerate auto zoom", `recorderDeleteZoom` "Delete zoom", `recorderZoomScale` "Zoom", `recorderTimelineAria` "Timeline".

- [ ] **Step 5: `npm test` + `npm run build` + `npm run lint`, commit** — `feat(recorder): timeline, trim handles, auto and manual zoom editing`.

---

### Task 10: Per-session editor state persistence

**Files:**
- Create: `src/recorder/recorder-draft.ts`
- Modify: `src/recorder/useRecorderSession.ts`
- Test: `tests/unit/recorder-draft.test.ts`

**Interfaces:**
- Consumes: `ZoomBlock`, `ZOOM_SCALES`; `frameToSettings`/`frameFromSettings` types from `src/editor/frame.ts` (recorder MAY import editor modules; shared must not).
- Produces:

```ts
export const RECORDER_DRAFT_DEBOUNCE_MS = 800;
export type BubbleCorner = 'tl' | 'tr' | 'bl' | 'br' | 'custom';
export interface RecorderDraft {
  zoomBlocks: ZoomBlock[];
  autoZoomDone: boolean;
  trims: Record<string, { start: number; end: number }>;
  ripple: boolean;
  volumes: { tab: number; mic: number };   // 0..1
  bubble: { corner: BubbleCorner; x: number; y: number; size: number; hidden: boolean }; // x/y normalized, size = fraction of min(W,H)
  frame: ReturnType<typeof frameToSettings>;
  savedAt: number;
}
export function defaultRecorderDraft(): RecorderDraft;
export function parseRecorderDraft(value: unknown): RecorderDraft | null;
```

Defaults: `ripple` from session settings at first save (pass in), `volumes {tab: 1, mic: 1}`, `bubble { corner: 'br', x: 0.85, y: 0.85, size: 0.22, hidden: false }`, `frame: frameToSettings({ ...DEFAULT_FRAME, enabled: false })`.

Validation follows `src/editor/draft.ts` philosophy: one unusable zoom block voids the whole draft (a bad block would render a camera the user never set); numbers must be finite; scales must be members of `ZOOM_SCALES`; frame passes through `frameFromSettings({ ...DEFAULT_SETTINGS, ...stored })` round-trip; unknown corners → `'br'`; volumes clamp 0..1.

- [ ] **Step 1: Failing tests** — mirror `tests/unit/draft.test.ts` structure: round-trip, null on non-object, null on one bad block (scale 2.5, NaN startMs), clamps (volume 3 → 1), unknown corner falls back, frame round-trips through the settings validator.
- [ ] **Step 2: Run → FAIL, implement, run → PASS.**
- [ ] **Step 3: Wire into the hook** — on any editor-state change, debounce `RECORDER_DRAFT_DEBOUNCE_MS` then `updateSession(id, { editorState: draft })`; flush on `visibilitychange` hidden (copy the editor's pattern). On load: `parseRecorderDraft(session.editorState)` → hydrate; null → fresh defaults (and auto zoom runs, task 9 step 1 gate `autoZoomDone`).
- [ ] **Step 4: `npm test` + `npm run build` + `npm run lint`, commit** — `feat(recorder): per-session draft persistence`.

---

### Task 11: Export render

**Files:**
- Create: `src/recorder/render.ts`, `src/recorder/export-video.ts`
- Modify: `src/recorder/App.tsx`, `src/recorder/Rail.tsx` (create — the settings rail starts here), `src/recorder/recorder.css`, `public/_locales/en/messages.json`
- Test: `tests/unit/render.test.ts`

**Interfaces:**
- Consumes: task 8 math, `RecorderDraft`, `formatFilename` + `getSettings` (filename template), `pickRecorderMime` from `src/offscreen/mime.ts`.
- Produces:

```ts
// render.ts (pure helpers — unit tested)
export function fitRect(srcW: number, srcH: number, dstW: number, dstH: number):
  { x: number; y: number; w: number; h: number };            // letterbox, centered
export function cameraSourceRect(cam: Camera, vw: number, vh: number):
  { sx: number; sy: number; sw: number; sh: number };
export const RIPPLE_MS = 450;
export function rippleAt(ageMs: number): { r: number; alpha: number } | null; // r normalized 0..0.06, fade out
export function bubbleRect(b: RecorderDraft['bubble'], W: number, H: number):
  { x: number; y: number; d: number };                       // circle center + diameter, corner presets resolve here
// render.ts (canvas — smoke-tested)
export interface FrameInputs {
  tab: CanvasImageSource; tabW: number; tabH: number;
  webcam: CanvasImageSource | null;
  camera: Camera;
  ripples: { nx: number; ny: number; ageMs: number }[];
  bubble: RecorderDraft['bubble'] | null;
  frame: FrameOptions; frameMetrics: FrameMetrics;
}
export function drawExportFrame(ctx: CanvasRenderingContext2D, W: number, H: number, inputs: FrameInputs): void;

// export-video.ts
export interface ExportProgress { fraction: number }  // 0..1 by timeline position
export async function exportVideo(
  loaded: LoadedSession, draft: RecorderDraft,
  onProgress: (p: ExportProgress) => void, signal: AbortSignal,
): Promise<Blob | null>;  // null = canceled
```

- [ ] **Step 1: Failing tests for the pure helpers** — `fitRect` (wider src letterboxes top/bottom, same aspect fills, centered offsets exact), `cameraSourceRect` at identity → full frame, at 2x/center → quarter-area centered rect, at clamped edge target → rect flush with the edge, `rippleAt(0)` small/opaque → `rippleAt(RIPPLE_MS)` → null, `bubbleRect` for all four corner presets (8px-equivalent margin = 2% of min side) and custom x/y, size fraction math exact.
- [ ] **Step 2: Run → FAIL, implement helpers, run → PASS.**
- [ ] **Step 3: `drawExportFrame`**

Draw order (spec): beautify background (`paintFrame` with the ctx origin translated so the video's top-left is (0,0), like the image editor does), then `clipToFrame` + video under the camera (`cameraSourceRect` → `drawImage` into the letterboxed `fitRect` area), ripples (stroke circles at the click's screen position — map `(nx,ny)` through the camera: `px = ((nx * vw) - sx) / sw * drawW + drawX`), then bubble (circle-clipped webcam draw; null-safe when no webcam). Canvas size = first segment pixel size + `2 * frameMetrics.pad`.

- [ ] **Step 4: `exportVideo`**

- Build hidden `<video>` elements per segment (muted for now — audio lands in task 12). Canvas + `canvas.captureStream(30)`; MediaRecorder with `pickRecorderMime(MediaRecorder.isTypeSupported, false)` and 2.5 Mbps; collect chunks into an array.
- Drive by real time: for each segment in order, seek to `trimStart`, `await play()`, rAF loop drawing `drawExportFrame` with `timelineMs = timelineAt(...)` from `video.currentTime`, `cameraAt`, active ripples from click events (when `draft.ripple`), until `currentTime >= sourceDuration - trimEnd`; pause, next segment. Render time ≈ video length (spec).
- `signal.aborted` checked each frame → stop recorder, resolve null (cancel discards the file).
- Finish: stop recorder, await `onstop`, `return new Blob(chunks, { type: mime || 'video/webm' })`.

- [ ] **Step 5: Export UI (Rail.tsx starts here)**

Rail sections this task: Ripple toggle (bound to `draft.ripple`), Export button. Export flow: progress bar + Cancel button (AbortController); on success download via anchor:

```ts
const settings = await getSettings();
const base = formatFilename(settings.filenameTemplate, { title: 'recording', width: W, height: H });
const a = document.createElement('a');
a.href = URL.createObjectURL(blob);
a.download = `${base}.webm`;
a.click();
URL.revokeObjectURL(a.href);
```

Then a success toast `recorderExported` INCLUDING the file size (`(blob.size / 1e6).toFixed(1)` MB — the smoke test asserts this toast). A "Delete recording after export" checkbox, off by default; when checked and export succeeded → `deleteSession` + navigate to the list.
i18n: `recorderExport` "Export WebM", `recorderExporting` "Rendering…", `recorderCancel` "Cancel", `recorderExported` "Saved $SIZE$ MB" (with placeholder — follow messages.json placeholder syntax: `"placeholders": { "size": { "content": "$1" } }` and `chrome.i18n.getMessage('recorderExported', [size])`), `recorderDeleteAfter` "Delete recording after export", `recorderRipple` "Click ripple".

- [ ] **Step 6: `npm test` + `npm run build` + `npm run lint`, commit** — `feat(recorder): export render with zoom camera and ripples`.

---

### Task 12: Audio — tab routing done, mic + volume + export mix

**Files:**
- Modify: `src/offscreen/engine.ts` (verify mic path from task 3 — it already records mic-only into `'webcam'` chunks; nothing to add unless task 3 skipped it)
- Modify: `src/recorder/export-video.ts`, `src/recorder/Rail.tsx`, `src/recorder/session-load.ts`
- Modify: `public/_locales/en/messages.json`

**Interfaces:**
- Consumes: `draft.volumes`.
- Produces: exported WebM carries mixed audio; rail has two sliders.

- [ ] **Step 1: session-load exposes audio** — `LoadedSegment.webcamUrl` already holds the recorder-#2 blob URL (audio-only WebM when webcam was off). Rename nothing; add `hasAudio: { tab: boolean; mic: boolean }` derived from session settings.
- [ ] **Step 2: Export mix** — in `exportVideo`, un-mute: one `AudioContext`; per active segment, `createMediaElementSource(tabVideo)` → `tabGain` and `createMediaElementSource(micMedia)` → `micGain` (element sources are per-element, create on first use and reuse); gains from `draft.volumes`; both connect to a single `MediaStreamAudioDestinationNode`; add `dest.stream.getAudioTracks()` to the canvas stream BEFORE constructing MediaRecorder. Recorder-#2 element plays in lockstep: seek/play/pause wherever the tab element does (shared clock = the tab element's currentTime; resync when drift > 100 ms).
- [ ] **Step 3: Rail sliders** — two `input[type=range]` 0..1 step .05 (reuse the popup's `.range` styling — check the class exists in shared/controls.css; if popup-local, copy the three rules into recorder.css): labels `recorderVolTab` "Tab volume", `recorderVolMic` "Mic volume". Hidden when the session recorded no such track.
- [ ] **Step 4: Preview volume** — the preview stage applies the same gains to its elements (`video.volume = draft.volumes.tab` is enough for preview; no AudioContext).
- [ ] **Step 5: `npm test` + `npm run build` + `npm run lint`, commit** — `feat(recorder): audio mix, volume sliders`.

---

### Task 13: Webcam recording + preview bubble

**Files:**
- Create: `src/recorder/webcam-frame.html`, `src/recorder/webcam-frame.ts`
- Modify: `manifest.json` (web_accessible_resources), `vite.config.ts` (input `webcamFrame: 'src/recorder/webcam-frame.html'`)
- Modify: `src/offscreen/engine.ts`, `src/content/recording-overlay.ts`
- Modify: `public/_locales/en/messages.json`

**Interfaces:**
- Consumes: `RecordingSettings.webcam`.
- Produces: recorder #2 = webcam video + mic audio (or audio-only when webcam off); a draggable preview bubble on the page.

- [ ] **Step 1: Manifest WAR**

```json
"web_accessible_resources": [
  { "resources": ["src/recorder/webcam-frame.html"], "matches": ["<all_urls>"] }
]
```

(crxjs may rewrite resource paths in dist — after build, verify the built manifest lists the emitted HTML and that `chrome.runtime.getURL('src/recorder/webcam-frame.html')` resolves in dist; adjust to the emitted path convention crxjs uses if needed.)

- [ ] **Step 2: The iframe page**

Only an extension page can hold camera permission, and the offscreen document cannot show prompts — this iframe hosts the one-time mic/camera prompts AND the live preview. `webcam-frame.ts`: read `?webcam=1&mic=1` from `location.search`; `getUserMedia({ video: webcam, audio: mic && { noiseSuppression: true, echoCancellation: true, autoGainControl: true } })`; on success attach to a full-bleed circular `<video muted autoplay playsinline>`; then STOP the local tracks if this was only the prompt trip? No — keep the preview stream live (it is the preview); the engine opens its own `getUserMedia` (permission is per-extension-origin, granted now, so the offscreen call succeeds without a prompt). On error render a compact message (`recWebcamDenied` "Camera declined — recording without it") and message the worker `{ type: 'REC_WEBCAM_DENIED' }` (add to `RecMessage` union; worker patches settings in recState and forwards nothing — the engine independently catches its own failure).

- [ ] **Step 3: Overlay hosts the bubble**

In `mountRecordingOverlay` (still self-contained): when `tracks.webcam` or `tracks.mic`, append a second shadow-DOM host: 180px draggable circle iframe wrapper, `src = chrome.runtime.getURL('src/recorder/webcam-frame.html') + '?webcam=' + (tracks.webcam ? 1 : 0) + '&mic=' + (tracks.mic ? 1 : 0)`, default bottom-right, pointer-drag on the wrapper (the iframe body sets `pointer-events: none` on its video so the wrapper receives drags — actually the wrapper needs a drag handle ring around the iframe; give the wrapper 12px padding acting as the handle). Mic-only (no webcam): skip the bubble UI, but STILL create the iframe 1×1 invisible — it is the permission prompt surface for the mic.
- [ ] **Step 4: Engine records webcam**

In `engine.ts` start flow: when `settings.webcam`, `getUserMedia({ video: { width: { ideal: 1280 } }, audio: false })` in try/catch; recorder #2 stream = webcam video track + mic audio track (both optional, degrade gracefully); mime `pickRecorderMime(supported, !hasWebcamVideo)`. `hasWebcam` on the segment row is already set by the worker from settings; keep it.
- [ ] **Step 5: `npm test` + `npm run build` + `npm run lint`, commit** — `feat(record): webcam bubble and second recorder`.

**Manual checkpoint (ledger note):** record with webcam on; expect one browser camera prompt (from the iframe), a live bubble, and `webcam` chunks in IndexedDB.

---

### Task 14: Webcam in the editor and export

**Files:**
- Modify: `src/recorder/App.tsx` (stage preview), `src/recorder/Rail.tsx`, `src/recorder/render.ts` (bubble drawing exists from task 11 — wire real video), `src/recorder/export-video.ts`
- Modify: `public/_locales/en/messages.json`

- [ ] **Step 1: Preview** — per-segment hidden webcam `<video>` (from `webcamUrl` when the blob has video; an audio-only recorder-#2 blob has no video track — detect via `video.videoTracks`? Not portable; instead detect by `video.videoWidth > 0` after `loadedmetadata` and fall back to audio-only handling). Stage draw and export both pass it as `FrameInputs.webcam`; sync by the shared clock (seek with the tab element, task 12 pattern covers it).
- [ ] **Step 2: Rail bubble section** — position: four corner preset buttons (2×2 grid) + drag the bubble directly on the stage (pointer events on the canvas hit-test `bubbleRect`); size slider 0.12..0.35; Hide toggle. All bound to `draft.bubble` (corner buttons set `corner`, dragging sets `corner: 'custom'` + x/y).
- [ ] **Step 3: i18n** — `recorderBubble` "Webcam bubble", `recorderBubbleHide` "Hide", `recorderBubbleSize` "Size".
- [ ] **Step 4: `npm test` + `npm run build` + `npm run lint`, commit** — `feat(recorder): webcam bubble compositing`.

---

### Task 15: Beautify frame in the recorder

**Files:**
- Modify: `src/recorder/Rail.tsx`, `src/recorder/App.tsx` (preview compose), `public/_locales/en/messages.json`

**Interfaces:**
- Consumes: `BeautifyMenu.tsx` for reference ONLY (its state lives in the image editor's hook — do not import the component unless it is prop-pure; read it first: if it takes `frame` + `onChange` props only, reuse it; otherwise build a minimal panel with the same controls). Frame math comes from `src/editor/frame.ts` — already used by `render.ts` in task 11.
- Produces: Beautify panel in the rail (padding/radius/shadow sliders + six gradient presets, shared `BACKGROUND_PRESETS`), bound to `draft.frame` through `frameFromSettings`/`frameToSettings`; preview canvas grows by the padding like the export does (spec: beautify frame on export; the preview must match).

- [ ] **Step 1: Read `BeautifyMenu.tsx`; reuse or rebuild per the rule above.**
- [ ] **Step 2: Wire preview + export canvas size** — both already flow through `frameMetrics` (task 11); confirm the preview recomputes on frame change and the stage CSS-fits the larger canvas.
- [ ] **Step 3: i18n** — reuse existing beautify keys if they exist in messages.json (grep `beautify`); add `recorderBeautify` "Beautify" only if no title key fits.
- [ ] **Step 4: `npm test` + `npm run build` + `npm run lint`, commit** — `feat(recorder): beautify frame on export`.

---

### Task 16: Failure-path hardening pass

**Files:**
- Modify: `src/background/recording.ts`, `src/offscreen/engine.ts`, `src/popup/App.tsx` (only where a listed behavior is missing)

Walk the spec's failure table and verify each; fix what's missing (most landed in earlier tasks — this is the audit that makes it true):

- [ ] Permission prompt declined → one popup line, nothing starts (task 6 toast).
- [ ] Mic or camera declined → recording continues without the track; control bar chips reflect live tracks (engine must message actual track states → add optional `tracks` payload to `ENGINE_STARTED` and have the worker re-heal the overlay with corrected chips).
- [ ] Protected pages → Record disabled + `recProtected` message.
- [ ] Recording tab closed → track `onended` finalizes and the editor opens (task 3/4; verify the `ENGINE_STOPPED` path fires).
- [ ] Cross-origin nav without host permission → overlay dies silently, engine watchdog marks `overlay-lost` within 2.5 s, badge goes amber; any extension gesture heals (REC_QUERY heal + tabs.onUpdated); stop heals before stopping.
- [ ] Engine or browser crash → recovery rule surfaces in popup (REC_QUERY scan) and editor list (status pill).
- [ ] Resize / DPR change → logged (task 5) and mapped (task 8) — confirm the initial mount resize event exists after every heal, not only the first mount.
- [ ] `npm test` + `npm run build` + `npm run lint`, commit — `fix(record): failure-path audit` (or split commits per real fix).

---

### Task 17: Recorder browser smoke test

**Files:**
- Create: `tests/browser/recorder-smoke.mjs`
- Modify: `package.json` (script `"smoke:recorder": "node tests/browser/recorder-smoke.mjs"`)

The live record path cannot run headless (real tabCapture needs a picker-free real tab — covered by the manual checklist in task 18's docs). This script covers the editor + export over a seeded fixture, following the established pattern (see the `editor-browser-smoke-test` runbook knowledge): serve `dist/` over local HTTP, launch headless Chrome via `puppeteer-core` from `mcp/node_modules`, Chrome binary at `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome` (honor `CHROME_BIN`).

- [ ] **Step 1: The script**

1. `npm run build` is a precondition — assert `dist/manifest.json` exists, else exit with a message.
2. Static server on an ephemeral port over `dist/`.
3. `page.evaluateOnNewDocument`: stub `globalThis.chrome` — `storage.local` (in-memory get/set/remove/getBytesInUse), `storage.session` (same), `i18n.getMessage: (k) => k`, `runtime.getURL: (p) => '/' + p`, `runtime.sendMessage: async () => ({})`, `permissions` no-ops, `tabs.create` no-op.
4. Open `/src/recorder/index.html` — blank list renders (`recorderEmpty` key text visible).
5. Seed a fixture IN PAGE: open the same IndexedDB (`openscreenshot-recordings` v1 — create stores if the page hasn't yet; simplest: navigate first so the app created them, then seed, then reload). Generate a real 2-second WebM in-page: 640×360 canvas, rAF-animated moving rectangle, `canvas.captureStream(30)` + MediaRecorder with 1 s timeslice → two-plus chunks appended via raw IDB writes as `{ segmentId, kind: 'tab', seq, blob }`; session row (status `complete`), segment row (viewport 640×360 dpr 1, duration 2000), one events batch with two clicks at t=500 (x 160,y 90) and t=1400 (x 480,y 270).
6. Reload with `?session=<id>`; assert: timeline renders (a `.timeline` selector with ≥1 segment strip and ≥1 zoom block — auto zoom must fire from the seeded clicks), stage canvas is non-blank (scan for non-background pixels).
7. Click Export; wait for the success toast; assert its text contains a size > 0 MB (this is why task 11 put the size in the toast).
8. Exit non-zero on any assertion failure; log each step.

- [ ] **Step 2: Run it** (`npm run build && npm run smoke:recorder`) — must pass locally. Record the output in the report.
- [ ] **Step 3: `npm run lint`, commit** — `test(recorder): headless editor + export smoke script`.

---

### Task 18: Docs, i18n audit, roadmap, version sync

**Files:**
- Modify: `README.md`, `ROADMAP.md`, `PRIVACY.md`, `agent_docs/store-listing.md`
- Modify: `docs/roadmap/index.html`, `docs/docs/index.html`, `docs/support/index.html`, `docs/index.html`, `docs/index.md`, `docs/llms.txt`
- Modify: the eight version fields (below)
- Create: `agent_docs/runbooks/recorder-manual-checklist.md`

- [ ] **Step 1: i18n audit** — grep `src/offscreen src/recorder src/content/recording-overlay.ts` and the popup diff for hardcoded user-visible strings; every one goes through `chrome.i18n` (recorder page: same `t()` helper pattern) with messages.json entries. The injected overlay CANNOT call `chrome.i18n` synchronously-safely? It can — content scripts have `chrome.i18n`; verify and use it there too.
- [ ] **Step 2: ROADMAP.md** — new "Recording" section, one row: "Screen recorder with auto zoom (record tab, zoom at clicks, webcam bubble, WebM export)" → ✅ shipped, "Landed in v1.2.0: …" note in the existing voice (2–4 sentences: optional tabCapture permission, offscreen engine with crash-safe 1 s chunks, editor with timeline + auto/manual zoom + trim, WebM export; MP4 and follow-cursor listed as 📋 planned rows). Move nothing else.
- [ ] **Step 3: README.md** — feature bullet list + a short "Screen recording" section (what it does, what stays local), permissions table gains `offscreen` + the two optional grants with one-line whys. Attribution string stays `OpenScreenShot @PGHQdev`.
- [ ] **Step 4: PRIVACY.md** — recordings, cursor logs, mic and camera streams never leave the device; stored in IndexedDB until the user deletes them; the optional permissions and when each is requested.
- [ ] **Step 5: Docs site (five surfaces, per the drift runbook)** — `docs/roadmap/index.html` mirrors the new ROADMAP rows; `docs/docs/index.html` gains a "Record a tab" guide section (start, control bar, editor, export); `docs/support/index.html` FAQ additions (Why does Chrome ask for tab capture? Where are recordings stored? Why WebM and not MP4?) and delete any now-stale "no video" limitation; `docs/index.html` permissions card must list the manifest permissions EXACTLY including the optional ones; `docs/index.md` + `docs/llms.txt` feature lines. Verify links/anchors with a local static server pass as the drift runbook describes.
- [ ] **Step 6: Manual record-path checklist** — `agent_docs/runbooks/recorder-manual-checklist.md`: the ~10-line per-release checklist (record 10 s with all toggles, pause/resume, stop via command, cross-origin nav amber badge + heal, recover after killing the offscreen doc from `chrome://extensions`, export with webcam + beautify).
- [ ] **Step 7: Version sync to 1.2.0 — all eight fields in one commit**: `package.json` + `package-lock.json` (via `npm version 1.2.0 --no-git-tag-version`), `manifest.json`, `mcp/package.json`, `mcp/package-lock.json` (both root entries), `mcp/src/serve.ts`, `docs/.well-known/mcp/server-card.json`, `docs/index.html` (JSON-LD `softwareVersion` + `#stat-version`). Then `grep -rn "1\.1\.0" --exclude-dir=node_modules --exclude-dir=dist .` and clear any straggler that denotes the version (not a coincidental string).
- [ ] **Step 8: `npm test` + `npm run build` + `npm run lint` + `npx prettier --check` on touched docs**, commit in two: `docs: recorder documentation across all surfaces`, then `chore: v1.2.0 version sync`.

---

## Milestone → task map (all six spec milestones covered)

1. Capture path proof → tasks 1–4, 6 (record → raw WebM chunks on stop)
2. Storage, segments, crash recovery, continue → tasks 2, 4, 6, 7
3. Editor: playback, timeline, zooms, trim, export → tasks 7–11
4. Audio → tasks 3 (routing), 12
5. Webcam → tasks 13–14
6. Ripple (11), Beautify (15), i18n/docs/roadmap/version (18), hardening (16), smoke (17)
