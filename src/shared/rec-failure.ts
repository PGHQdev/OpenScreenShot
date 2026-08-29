/**
 * Every way a recording can fail, and the one message each failure shows.
 *
 * The recorder used to report failures to `console.error` and nothing else,
 * which made most of them indistinguishable from "nothing happened". This is
 * the single map from a failure to the string the user reads; the surfaces
 * (popup, recorder page, in-page control bar) look the key up here and
 * translate it themselves, so the mapping stays testable without a DOM or a
 * `chrome` stub.
 *
 * Every chrome.* call stays at the call sites, the same arrangement as
 * `src/shared/permissions.ts`.
 */

/**
 * Session key holding the most recent failure the worker could not show
 * anywhere. A worker failure often happens with no extension surface open at
 * all — the popup closed the moment the click was handed over — so the worker
 * parks it here and the next popup open reads it out. Cleared on consumption,
 * so it says its piece once.
 */
export const REC_FAILURE_KEY = 'openscreenshot:rec-failure';

/**
 * Broadcast to any surface that happens to be open when a failure lands, so a
 * popup that stayed open does not have to be reopened to hear about it.
 * Deliberately not prefixed `REC_`: `isRecMessage` claims that whole prefix
 * for gestures aimed at the worker, and this travels the other way.
 */
export const REC_FAILURE_MESSAGE = 'RECORDER_FAILURE';

export type RecFailureCode =
  /** The popup could not hand `REC_START` to the worker. */
  | 'start-unreachable'
  /** The start found no tab it may record (gone, or a protected URL). */
  | 'start-blocked'
  /** A recording is already running, so the start was dropped. */
  | 'start-busy'
  /** The start threw on its way to the engine (dead tab, offscreen refused). */
  | 'start-failed'
  /** The failed session could not be tidied up, so it is still stored. */
  | 'cleanup-failed'
  /** The engine could not open the tab stream or build a recorder. */
  | 'engine-failed'
  /**
   * `OFFSCREEN_START` never reached the engine. The worst shape a recording
   * failure takes: the state, the badge and the control bar all say a
   * recording is running, no `ENGINE_ERROR` can arrive because the engine was
   * never told to begin, and the user records for as long as they like and
   * gets nothing.
   */
  | 'engine-unreachable'
  /** `REC_QUERY` threw, so the reported recording state is not trustworthy. */
  | 'query-failed'
  /** The in-page control bar could not be injected on this origin. */
  | 'overlay-blocked'
  /** The control bar stopped reporting mid-recording. */
  | 'overlay-lost'
  /** Stop/pause/cancel never reached the worker. */
  | 'control-unreachable'
  /** The recorder page could not read the session out of IndexedDB. */
  | 'session-load-failed'
  /** One or more segments would not play and were left out of the export. */
  | 'segment-skipped'
  /** The export itself threw; no file was written. */
  | 'export-failed';

/** A failure, and when it happened. Parked in session storage as-is. */
export interface RecFailure {
  code: RecFailureCode;
  /** `Date.now()` at the failure. */
  at: number;
}

/**
 * Code to `messages.json` key. Every message names what failed and what the
 * user can do about it; `tests/unit/rec-failure.test.ts` holds both halves of
 * that to account — a code with no key, and a key with no string.
 */
const MESSAGE_KEYS: Record<RecFailureCode, string> = {
  'start-unreachable': 'recFailStartUnreachable',
  'start-blocked': 'recFailStartBlocked',
  'start-busy': 'recFailStartBusy',
  'start-failed': 'recFailStartFailed',
  'cleanup-failed': 'recFailCleanup',
  'engine-failed': 'recFailEngine',
  'engine-unreachable': 'recFailEngineUnreachable',
  'query-failed': 'recFailQuery',
  'overlay-blocked': 'recFailOverlayBlocked',
  'overlay-lost': 'recFailOverlayLost',
  'control-unreachable': 'recFailControlUnreachable',
  'session-load-failed': 'recFailSessionLoad',
  'segment-skipped': 'recFailSegmentSkipped',
  'export-failed': 'recFailExport',
};

export const REC_FAILURE_CODES = Object.keys(MESSAGE_KEYS) as RecFailureCode[];

/** The `messages.json` key whose string this failure shows. */
export function recFailureMessageKey(code: RecFailureCode): string {
  return MESSAGE_KEYS[code];
}

export function isRecFailureCode(value: unknown): value is RecFailureCode {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(MESSAGE_KEYS, value);
}

/**
 * Whether a value read back out of session storage is a failure this build
 * knows how to show. An unknown code — a record parked by an older or newer
 * build — would otherwise render as its own raw key.
 */
export function isRecFailure(value: unknown): value is RecFailure {
  if (!value || typeof value !== 'object') return false;
  const rec = value as Partial<RecFailure>;
  return isRecFailureCode(rec.code) && typeof rec.at === 'number';
}
