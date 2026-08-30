/**
 * Offscreen recording engine. Runs inside the offscreen document; the worker
 * (src/worker, task 4) drives it purely via `chrome.runtime` messages and
 * owns session/segment creation — this module never touches those rows
 * beyond finalizing/deleting them on stop.
 */
import {
  appendChunk,
  appendEvents,
  deleteSession,
  finalizeSegment,
  updateSession,
} from '../shared/recording-db';
import type {
  CursorBatch,
  EngineMessage,
  OffscreenMessage,
  RecordingSettings,
} from '../shared/recording-types';
import { pickRecorderMime } from './mime';

const VIDEO_BITS_PER_SECOND = 2_500_000;
/** The bubble is drawn small; the tab video's bitrate would be wasted on it. */
const WEBCAM_BITS_PER_SECOND = 1_200_000;
const TIMESLICE_MS = 1000;
const OVERLAY_TIMEOUT_MS = 2500;
const WATCHDOG_INTERVAL_MS = 1000;

interface EngineState {
  sessionId: string;
  segmentId: string;
  settings: RecordingSettings;
  streams: MediaStream[];
  recorders: MediaRecorder[];
  audioCtx: AudioContext | null;
  startedAt: number;
  pausedAt: number; // 0 while running
  pausedAccumMs: number;
  seq: { tab: number; webcam: number };
  /**
   * Single monotonically increasing counter this engine owns for every
   * `appendEvents` write (cursor batches and its own overlay-lost/healed
   * markers). A `CursorBatch.seq` from the content overlay is never used as
   * the DB key — it is informational only, for ordering sanity.
   */
  eventSeq: number;
  lastBatchAt: number;
  overlayLost: boolean;
  watchdog: ReturnType<typeof setInterval> | null;
  stopping: boolean;
  /** Kinds already reported; the worker is told once per kind, not per write. */
  writeFailed: { media: boolean; events: boolean };
  /**
   * In-flight `appendChunk`/`appendEvents` writes. `stop()` awaits these
   * after the recorders' `stop` events resolve and before finalizing —
   * otherwise the final timeslice's chunk (or a late cursor/overlay event)
   * can still be mid-write to IndexedDB when `ENGINE_STOPPED` tells the
   * worker it is safe to tear down the offscreen document.
   */
  pendingWrites: Set<Promise<void>>;
}

let state: EngineState | null = null;

/**
 * A stop/cancel that arrived while `start()` was still opening streams. The
 * engine has no state to stop yet at that point, and dropping the gesture
 * would leave a recording nobody asked for running until the tab closes.
 *
 * This is the ordinary path now, not the rare one: the worker used to hold
 * every gesture until the start round trip finished, so this only ever saw
 * one that outlasted the worker's own 10s deadline. It forwards them as they
 * land, so any stop pressed between OFFSCREEN_START and ENGINE_STARTED
 * arrives here.
 */
let pendingStop: 'stop' | 'cancel' | null = null;

function send(message: EngineMessage): void {
  chrome.runtime.sendMessage(message).catch(() => {});
}

function elapsed(): number {
  if (!state) return 0;
  return (state.pausedAt || Date.now()) - state.startedAt - state.pausedAccumMs;
}

/**
 * Tracks a write so `stop()` can wait for it; a failed write never wedges stop.
 *
 * The rejection is caught here and must be, but it used to be caught and
 * dropped: a chunk that never reached IndexedDB left the recording running,
 * the clock counting and the file silently short. It is reported once per run
 * now — every following second would report the same broken store — and the
 * recording is deliberately not stopped, because the chunks already written
 * are real and tearing down would throw them away.
 */
function trackWrite(s: EngineState, write: Promise<void>, kind: 'media' | 'events'): void {
  // Store the already-caught promise, not the raw one — `stop()` awaits
  // everything in `pendingWrites` via `Promise.all`, and an unswallowed
  // rejection there would throw out of `stop()` after `stopping = true` was
  // set, permanently wedging the engine (state never nulled, ENGINE_STOPPED
  // never sent).
  const settled = write.catch(() => {
    if (s.writeFailed[kind]) return;
    s.writeFailed[kind] = true;
    send({ type: 'ENGINE_WRITE_FAILED', sessionId: s.sessionId, kind });
  });
  s.pendingWrites.add(settled);
  void settled.finally(() => s.pendingWrites.delete(settled));
}

function isTargetedMessage(m: unknown): m is OffscreenMessage | CursorBatch {
  return !!m && typeof m === 'object' && (m as { target?: unknown }).target === 'offscreen';
}

async function start(msg: Extract<OffscreenMessage, { type: 'OFFSCREEN_START' }>): Promise<void> {
  const { streamId, sessionId, segmentId, settings } = msg;
  pendingStop = null;
  let tabStream: MediaStream | undefined;
  let micStream: MediaStream | null = null;
  let webcamStream: MediaStream | null = null;
  let audioCtx: AudioContext | null = null;

  try {
    tabStream = await navigator.mediaDevices.getUserMedia({
      audio: settings.tabAudio
        ? { mandatory: { chromeMediaSource: 'tab', chromeMediaSourceId: streamId } }
        : false,
      video: { mandatory: { chromeMediaSource: 'tab', chromeMediaSourceId: streamId } },
    } as MediaStreamConstraints);

    if (settings.tabAudio) {
      // Tab capture mutes the tab's own audio output, so loop it back to the
      // speakers or the user hears silence while recording.
      audioCtx = new AudioContext();
      audioCtx.createMediaStreamSource(tabStream).connect(audioCtx.destination);
    }

    if (settings.mic) {
      try {
        micStream = await navigator.mediaDevices.getUserMedia({
          audio: { noiseSuppression: true, echoCancellation: true, autoGainControl: true },
        });
      } catch {
        // A declined/unavailable mic must not fail the start — record without it.
        micStream = null;
      }
    }

    if (settings.webcam) {
      try {
        // The preview iframe (src/recorder/webcam-frame.ts) already took the
        // camera prompt for this extension origin, so this call is silent.
        webcamStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 } },
          audio: false,
        });
      } catch {
        // Same rule as the mic: a declined/unavailable camera records without
        // that track, it never fails the start.
        webcamStream = null;
      }
    }

    const streams: MediaStream[] = [tabStream];
    if (micStream) streams.push(micStream);
    if (webcamStream) streams.push(webcamStream);

    const tabMime = pickRecorderMime(MediaRecorder.isTypeSupported, false);
    const tabRecorder = new MediaRecorder(tabStream, {
      ...(tabMime ? { mimeType: tabMime } : {}),
      videoBitsPerSecond: VIDEO_BITS_PER_SECOND,
    });

    const recorders: MediaRecorder[] = [tabRecorder];

    // Recorder #2 carries the webcam video and the mic audio together, in one
    // 'webcam' chunk stream. Either track can be missing (declined device, or
    // that track switched off), so the mime follows what actually landed: an
    // audio-only WebM when there is no camera video.
    const webcamTrack = webcamStream?.getVideoTracks()[0] ?? null;
    const micTrack = micStream?.getAudioTracks()[0] ?? null;
    let camRecorder: MediaRecorder | null = null;
    if (webcamTrack || micTrack) {
      const camStream = new MediaStream();
      if (webcamTrack) camStream.addTrack(webcamTrack);
      if (micTrack) camStream.addTrack(micTrack);
      const camMime = pickRecorderMime(MediaRecorder.isTypeSupported, !webcamTrack);
      camRecorder = new MediaRecorder(camStream, {
        ...(camMime ? { mimeType: camMime } : {}),
        ...(webcamTrack ? { videoBitsPerSecond: WEBCAM_BITS_PER_SECOND } : {}),
      });
      recorders.push(camRecorder);
    }

    const now = Date.now();
    state = {
      sessionId,
      segmentId,
      settings,
      streams,
      recorders,
      audioCtx,
      startedAt: now,
      pausedAt: 0,
      pausedAccumMs: 0,
      seq: { tab: 0, webcam: 0 },
      eventSeq: 0,
      lastBatchAt: now,
      overlayLost: false,
      watchdog: null,
      stopping: false,
      writeFailed: { media: false, events: false },
      pendingWrites: new Set(),
    };

    tabRecorder.ondataavailable = (e) => {
      if (e.data.size && state) {
        trackWrite(state, appendChunk(segmentId, 'tab', state.seq.tab++, e.data), 'media');
      }
    };
    if (camRecorder) {
      camRecorder.ondataavailable = (e) => {
        if (e.data.size && state) {
          trackWrite(state, appendChunk(segmentId, 'webcam', state.seq.webcam++, e.data), 'media');
        }
      };
    }

    tabRecorder.start(TIMESLICE_MS);
    camRecorder?.start(TIMESLICE_MS);

    tabStream.getVideoTracks()[0].onended = () => void stop(false);

    state.watchdog = setInterval(() => {
      if (!state || state.overlayLost) return;
      if (Date.now() - state.lastBatchAt > OVERLAY_TIMEOUT_MS) {
        state.overlayLost = true;
        trackWrite(
          state,
          appendEvents(state.segmentId, state.eventSeq++, [{ kind: 'overlay-lost', t: elapsed() }]),
          'events',
        );
        send({ type: 'OVERLAY_LOST', sessionId: state.sessionId });
      }
    }, WATCHDOG_INTERVAL_MS);

    send({
      type: 'ENGINE_STARTED',
      sessionId,
      tracks: { mic: !!micTrack, webcam: !!webcamTrack },
    });

    if (pendingStop) {
      const requested = pendingStop;
      pendingStop = null;
      void stop(requested === 'cancel');
    }
  } catch (err) {
    tabStream?.getTracks().forEach((t) => t.stop());
    micStream?.getTracks().forEach((t) => t.stop());
    webcamStream?.getTracks().forEach((t) => t.stop());
    if (audioCtx) void audioCtx.close().catch(() => {});
    state = null;
    send({
      type: 'ENGINE_ERROR',
      sessionId,
      message: err instanceof Error ? err.message : String(err),
    });
  }
}

function handleCursorBatch(batch: CursorBatch): void {
  if (!state) return;
  state.lastBatchAt = Date.now();
  if (state.overlayLost) {
    state.overlayLost = false;
    trackWrite(
      state,
      appendEvents(state.segmentId, state.eventSeq++, [{ kind: 'overlay-healed', t: elapsed() }]),
      'events',
    );
    send({ type: 'OVERLAY_HEALED', sessionId: state.sessionId });
  }
  trackWrite(state, appendEvents(state.segmentId, state.eventSeq++, batch.events), 'events');
}

function pause(): void {
  if (!state || state.pausedAt) return;
  state.pausedAt = Date.now();
  for (const r of state.recorders) if (r.state === 'recording') r.pause();
}

function resume(): void {
  if (!state || !state.pausedAt) return;
  state.pausedAccumMs += Date.now() - state.pausedAt;
  state.pausedAt = 0;
  for (const r of state.recorders) if (r.state === 'paused') r.resume();
}

async function stop(canceled: boolean): Promise<void> {
  if (!state || state.stopping) return;
  state.stopping = true;
  if (state.watchdog) clearInterval(state.watchdog);

  const { sessionId, segmentId, recorders, streams, audioCtx, pendingWrites } = state;

  await Promise.all(
    recorders.map(
      (r) =>
        new Promise<void>((resolve) => {
          if (r.state === 'inactive') {
            resolve();
            return;
          }
          r.addEventListener('stop', () => resolve(), { once: true });
          r.stop();
        }),
    ),
  );

  for (const stream of streams) {
    for (const track of stream.getTracks()) track.stop();
  }
  if (audioCtx) await audioCtx.close().catch(() => {});

  // The recorders' final `dataavailable` (and any trailing cursor/overlay
  // event) has fired by now but may still be an in-flight IndexedDB write —
  // wait for it, or a clean stop can silently drop the last second.
  await Promise.all(pendingWrites);

  if (canceled) {
    await deleteSession(sessionId);
  } else {
    await finalizeSegment(segmentId, elapsed());
    await updateSession(sessionId, { status: 'complete' });
  }

  send({ type: 'ENGINE_STOPPED', sessionId, canceled });
  state = null;
}

chrome.runtime.onMessage.addListener((message: unknown) => {
  if (!isTargetedMessage(message)) return;
  switch (message.type) {
    case 'OFFSCREEN_START':
      void start(message);
      break;
    case 'CURSOR_BATCH':
      handleCursorBatch(message);
      break;
    case 'OFFSCREEN_PAUSE':
      pause();
      break;
    case 'OFFSCREEN_RESUME':
      resume();
      break;
    case 'OFFSCREEN_STOP':
      if (state) void stop(false);
      else pendingStop = 'stop';
      break;
    case 'OFFSCREEN_CANCEL':
      if (state) void stop(true);
      else pendingStop = 'cancel';
      break;
  }
});
