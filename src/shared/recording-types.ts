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

/**
 * 'failed' is a start that never reached the engine: the row is kept, with no
 * segments, so the Recorder page can show that the attempt happened rather
 * than deleting every trace of it. `findRecoverableSessions` deliberately
 * does not offer one — there is nothing in it to recover.
 */
export type SessionStatus = 'recording' | 'complete' | 'failed';

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
  | { type: 'REC_QUERY' }
  /** The preview iframe could not open the camera; the worker drops the track
   *  from stored settings. The engine degrades on its own catch. */
  | { type: 'REC_WEBCAM_DENIED' }
  /** The preview iframe settled its `getUserMedia` (granted, declined, or
   *  gated off). The worker holds `OFFSCREEN_START` until this arrives, so the
   *  engine's own camera/mic capture runs after the origin's permission
   *  prompt, not before it. */
  | { type: 'REC_FRAME_READY' };

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

/** What the engine's own `getUserMedia` actually returned, track by track. */
export interface CapturedTracks {
  mic: boolean;
  webcam: boolean;
}

export type EngineMessage =
  /** `tracks` is absent only from an engine older than this message shape. */
  | { type: 'ENGINE_STARTED'; sessionId: string; tracks?: CapturedTracks }
  /**
   * A write to IndexedDB rejected. The recording keeps going — what is already
   * written is real and stopping would throw it away — but the result is now
   * poorer than the clock says, so the user has to be told.
   *
   * `kind` separates the two costs, because they are not the same message:
   * 'media' loses video or audio the user believes they are recording, and
   * 'events' loses only the cursor track, so zoom and click effects go missing
   * from an otherwise intact file. Sent once per kind per run.
   *
   * Optional for the same reason `tracks` above is: `isEngineMessage` is a
   * prefix check, not a validator, so an engine older than this shape sends
   * no kind at all. Absent reads as 'media' at the handler — the graver of
   * the two, because reporting a lost recording as a lost cursor track is the
   * one direction of that mistake that costs the user data.
   */
  | { type: 'ENGINE_WRITE_FAILED'; sessionId: string; kind?: 'media' | 'events' }
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

/**
 * Fold what the engine really captured back into the stored settings. A
 * declined device never fails the start, so the settings the user asked for
 * can outrun the tracks that exist — the control bar chips and the popup read
 * these settings, so they would keep claiming a track nothing is recording.
 * Correction is one-way: this can only drop a track, never add one.
 */
export function applyCapturedTracks(
  settings: RecordingSettings,
  tracks: CapturedTracks | undefined,
): RecordingSettings {
  if (!tracks) return settings;
  return {
    ...settings,
    mic: settings.mic && tracks.mic,
    webcam: settings.webcam && tracks.webcam,
  };
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
