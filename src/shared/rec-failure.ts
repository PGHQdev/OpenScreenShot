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
  /**
   * A Stop pressed before the engine ever reported in, which the engine then
   * did not answer. Its sibling `engine-unreachable` covers a start the
   * engine never received; this covers one it received and never came back
   * from. `OFFSCREEN_STOP` reaching an engine whose own state is null parks a
   * pending stop and returns without `ENGINE_STOPPED`, so nothing downstream
   * clears: the badge stays REC, the bar stays up reading "Starting…", and
   * `handleQuery`'s escape hatch cannot fire because the offscreen document
   * exists and is merely hung.
   */
  | 'engine-stalled'
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
  | 'export-failed'
  /**
   * The Save dialog's download reached `interrupted` for a reason other than
   * the user dismissing it (disk full, a blocked path, …). The rendered file
   * exists in memory but is not confirmed on disk, so the session is kept.
   */
  | 'save-interrupted'
  /**
   * `chrome.downloads.onChanged` never reached a terminal state within the
   * bounded wait `saveExport` gives it. Distinct from `save-interrupted`:
   * nothing is known to have gone wrong, only that it could not be
   * confirmed — so the session is kept here too.
   */
  | 'save-unverified'
  /**
   * A media chunk could not be written to IndexedDB while recording. The
   * recording carries on and the file is silently shorter than the clock says,
   * which is the only mode in the set that loses data the user believes they
   * have while they are still making it. It is also the only one the in-page
   * control bar carries, for that reason.
   */
  | 'chunk-write-failed'
  /** The cursor track could not be written; the video itself is intact. */
  | 'events-write-failed'
  /** The recording finished, and the page that shows it would not open. */
  | 'recorder-open-failed';

/** A failure, and when it happened. Parked in session storage as-is. */
export interface RecFailure {
  code: RecFailureCode;
  /** `Date.now()` at the failure. */
  at: number;
  /**
   * The recording this failure belongs to, when it belongs to one. A parked
   * failure outlives its run on purpose — a clean stop does not mean the user
   * read it — so anything comparing a new failure against a parked one has to
   * know whether they are even about the same recording. Absent for failures
   * with no run behind them (a start that never got one, an export).
   */
  sessionId?: string;
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
  'engine-stalled': 'recFailEngineStalled',
  'query-failed': 'recFailQuery',
  'overlay-blocked': 'recFailOverlayBlocked',
  'overlay-lost': 'recFailOverlayLost',
  'control-unreachable': 'recFailControlUnreachable',
  'session-load-failed': 'recFailSessionLoad',
  'segment-skipped': 'recFailSegmentSkipped',
  'export-failed': 'recFailExport',
  'save-interrupted': 'recFailSaveInterrupted',
  'save-unverified': 'recFailSaveUnverified',
  'chunk-write-failed': 'recFailChunkWrite',
  'events-write-failed': 'recFailEventsWrite',
  'recorder-open-failed': 'recFailRecorderOpen',
};

export const REC_FAILURE_CODES = Object.keys(MESSAGE_KEYS) as RecFailureCode[];

/**
 * Failures whose message makes another failure's message wrong, keyed by the
 * one that wins.
 *
 * The store backing a recording breaks for both writers at once — media chunks
 * land every 1000ms and cursor batches every 1000ms, on independent phases —
 * so both failures arrive inside the same second in arbitrary order. Whichever
 * lands second must not be the one the user is left with: "The video is fine"
 * is false once the video is going too, and it is false whether it arrives
 * first (and is then contradicted) or last (and stands alone).
 */
const SUPERSEDED: Partial<Record<RecFailureCode, readonly RecFailureCode[]>> = {
  'chunk-write-failed': ['events-write-failed'],
};

/**
 * Whether `next` makes `prev`'s message untrue, so `prev` should be dropped
 * rather than sit beside it. Both the worker (deciding what to park) and the
 * popup (deciding what to leave on screen) ask this, so the rule is here
 * rather than spelled twice.
 */
export function supersedes(next: RecFailureCode, prev: RecFailureCode): boolean {
  return SUPERSEDED[next]?.includes(prev) ?? false;
}

/** Whether two failures are about the same recording — or both about none. */
export function sameRun(a: Pick<RecFailure, 'sessionId'>, b: Pick<RecFailure, 'sessionId'>) {
  return a.sessionId === b.sessionId;
}

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
  if (!isRecFailureCode(rec.code) || typeof rec.at !== 'number') return false;
  return rec.sessionId === undefined || typeof rec.sessionId === 'string';
}
