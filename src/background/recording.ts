/**
 * Screen-recorder worker orchestration. Owns the recording control surface
 * (`REC_*` messages from the popup, the control tab and the commands), opens
 * the control tab, drives the offscreen engine
 * (`src/offscreen/engine.ts`) via `OFFSCREEN_*` messages, and keeps
 * authoritative recording state in `chrome.storage.session` so the worker can
 * idle and restart mid-recording without losing track of what's live.
 *
 * Does not touch the capture worker in `src/background/index.ts` — this
 * module owns its own `chrome.runtime.onMessage` listener and returns
 * `false` (no async `sendResponse`) for everything except `REC_QUERY`.
 */
import { mountRecordingOverlay } from '../content/recording-overlay';
import {
  createSegment,
  createSession,
  deleteSegment,
  deleteSession,
  findRecoverableSessions,
  getSession,
  listSessions,
  updateSession,
} from '../shared/recording-db';
import {
  applyCapturedTracks,
  CONTROL_TARGET_KEY,
  isEngineMessage,
  isRecMessage,
  normalizeArea,
  type CapturedTracks,
  type ControlTarget,
  type RecordingArea,
  type RecordingSession,
  type RecordingSettings,
  type RecState,
  type SegmentViewport,
} from '../shared/recording-types';
import { PENDING_RECORD_KEY, pendingRecordIsLive, type PendingRecord } from '../shared/permissions';
import {
  REC_FAILURE_KEY,
  REC_FAILURE_MESSAGE,
  isRecFailure,
  sameRun,
  supersedes,
  type RecFailure,
  type RecFailureCode,
} from '../shared/rec-failure';
import { theme as designTheme } from '../shared/design-tokens';
import { isProtectedUrl } from '../shared/utils';

const REC_STATE_KEY = 'openscreenshot:rec-state';
/**
 * A finished session whose recorder tab failed to open. `handleQuery` offers
 * it through the same Recover link a crashed session uses, which is what
 * makes 'recorder-open-failed' a message the user can act on.
 */
const UNOPENED_SESSION_KEY = 'openscreenshot:unopened-session';
/** Written by the recorder's Continue button; read by the popup and here. */
const CONTINUE_SESSION_KEY = 'openscreenshot:continue-session';
const RECORDER_URL = chrome.runtime.getURL('src/recorder/index.html');
const CONTROL_URL = chrome.runtime.getURL('src/control/index.html');
const START_TIMEOUT_MS = 10_000;
/** JPEG quality of the control tab's still of its target: a preview, not an export. */
const CONTROL_SHOT_QUALITY = 70;
/**
 * How long a Stop on a run that has not anchored waits for `ENGINE_STOPPED`
 * before the run is torn down as stalled. It only has to outlast a healthy
 * engine's own stop — which has no recorders to flush, because it never
 * started any — so it is short: the user is already waiting on a gesture they
 * made, and every second past this one is a second of "Starting…" over dead
 * buttons.
 */
const STALLED_STOP_TIMEOUT_MS = 3000;

interface StoredRecState {
  sessionId: string;
  segmentId: string;
  tabId: number;
  /** The control tab that started this run; the editor opens in it on Stop. */
  controlTabId?: number;
  startedAt: number;
  pausedAt: number; // 0 while running
  pausedAccumMs: number;
  settings: RecordingSettings;
  overlayLost: boolean;
  /**
   * Whether the cursor logger has ever reached the page during this run.
   * `overlayLost` cannot answer that: it is false both before the first mount
   * and after a heal, and the engine's watchdog is edge-triggered — it stays
   * quiet while it believes the logger is already lost — so a logger that
   * recovers inside its 2500ms window never produces an `OVERLAY_HEALED` to
   * clear anything. This is the flag the mount itself sets.
   */
  overlayMounted: boolean;
  /** Media chunks are failing to reach IndexedDB; the control tab says so. */
  writeFailed: boolean;
  /**
   * A requested camera was declined (or unavailable). One-way, like
   * `writeFailed`: set when `ENGINE_STARTED` reports no camera track for a
   * run that asked for one, and never cleared within a run.
   */
  camDenied: boolean;
  /**
   * Whether `ENGINE_STARTED` has arrived, i.e. whether `startedAt` is the
   * moment the recorders began rather than the moment the logger was mounted.
   * The clock has no zero until then, so no surface may show elapsed.
   */
  anchored: boolean;
  /** True when this run appends to an existing session (Continue). */
  continued: boolean;
}

// --- Persistent state (chrome.storage.session) ------------------------------

async function getRecState(): Promise<StoredRecState | null> {
  const stored = await chrome.storage.session.get(REC_STATE_KEY);
  return (stored[REC_STATE_KEY] as StoredRecState | undefined) ?? null;
}

/** Write the whole state. Only the start does this; everything else patches. */
async function writeRecState(state: StoredRecState): Promise<void> {
  lastKnownLive = true;
  await chrome.storage.session.set({ [REC_STATE_KEY]: state });
}

/**
 * Patch the live run's state. Does nothing when there is no live run, or when
 * the run has moved on: every caller reaches here after an await, and a
 * teardown inside that window used to be undone — `{...null, ...patch}` is a
 * partial state object, which put REC back on the badge after the recording
 * had ended and answered the next Record click with 'start-busy'.
 */
async function setRecState(
  patch: Partial<StoredRecState> & Pick<StoredRecState, 'sessionId'>,
): Promise<void> {
  const existing = await getRecState();
  if (!existing || existing.sessionId !== patch.sessionId) return;
  await chrome.storage.session.set({ [REC_STATE_KEY]: { ...existing, ...patch } });
}

async function clearRecState(): Promise<void> {
  lastKnownLive = false;
  await chrome.storage.session.remove(REC_STATE_KEY);
}

/**
 * Whether a recording was live the last time the store answered, or null if
 * this worker has never had an answer. `restoreRecBadge` falls back to it when
 * the store cannot be read, so a capture's own badge flash — the caller sets
 * a digit, '!' or a tick immediately before calling — is still cleared when we
 * know there is nothing to keep. It is deliberately not consulted when null:
 * an MV3 worker that has just restarted mid-recording would clear a REC it has
 * simply not seen yet.
 */
let lastKnownLive: boolean | null = null;

// --- Start-round-trip serialization -----------------------------------------

/**
 * Resolved once `ENGINE_STARTED`/`ENGINE_ERROR` arrives for the in-flight
 * `OFFSCREEN_START`. The engine ignores stop/pause/cancel while its own
 * `getUserMedia` is pending (its state is null until then), so this module
 * must not forward those until the start round-trip finishes. MV3 workers
 * can restart mid-flight, wiping this module state — that's fine, because a
 * restart means the start round-trip long since finished one way or another
 * and authoritative state lives in `chrome.storage.session`.
 */
let startPending: Promise<void> | null = null;
let resolveStartPendingFn: (() => void) | null = null;
let startTimeout: ReturnType<typeof setTimeout> | null = null;

/**
 * True while `handleStart` is preparing a run the engine has not been asked
 * to begin yet. Distinct from `startPending`, which the deadline above can
 * release while the start is still running: this one is owned by
 * `handleStart` itself, so it answers "has `OFFSCREEN_START` gone out?"
 * without ever being wrong about it.
 *
 * Two things read it. The concurrent-start guard, which a released deadline
 * used to let a second Record click walk straight through; and Stop/Cancel,
 * which have to know whether the gesture belongs to this worker (tear the
 * preparation down) or to the engine (forward it).
 */
let preparingStart = false;

/**
 * A Stop or Cancel that landed while the start was still preparing. It is
 * recorded rather than acted on directly, because the start owns the session
 * row, the segment row, the badge and the overlay it has to give back, and
 * they are locals inside `handleStart`.
 */
let startAbort: 'stop' | 'cancel' | null = null;

function beginStartPending(): void {
  startPending = new Promise<void>((resolve) => {
    resolveStartPendingFn = resolve;
  });
  armStartTimeout();
}

/**
 * Take a Stop or Cancel that arrived before `OFFSCREEN_START` went out, and
 * say whether it was taken.
 *
 * Forwarding it instead would be worse than dropping it, which is what used
 * to happen: `OFFSCREEN_STOP` reaching an engine with no state parks a
 * `pendingStop` that the start then consumes on its way in, so the user's
 * Stop would produce a recording that starts, runs for a frame and stops —
 * a session with nothing in it. The preparation is abandoned instead, and
 * nothing is ever handed to the engine.
 *
 */
function abortPreparingStart(gesture: 'stop' | 'cancel'): boolean {
  if (!preparingStart) return false;
  startAbort = gesture;
  return true;
}

/** (Re)start the deadline on the in-flight start. */
function armStartTimeout(): void {
  if (startTimeout) clearTimeout(startTimeout);
  startTimeout = setTimeout(resolveStartPending, START_TIMEOUT_MS);
}

function resolveStartPending(): void {
  if (startTimeout) clearTimeout(startTimeout);
  startTimeout = null;
  resolveStartPendingFn?.();
  resolveStartPendingFn = null;
  startPending = null;
}

async function waitForStartPending(): Promise<void> {
  if (startPending) await startPending;
}

// --- Badge -------------------------------------------------------------------

/*
 * Badge colours come from the generated token module rather than a copied
 * hex, so --accent and --warning cannot drift here. The light values are the
 * deliberate choice for both themes: the badge is browser chrome, drawn on
 * the toolbar, and it never sees the extension's own theme. The white text is
 * a literal for the same reason — it is what reads on both of these grounds,
 * and no single token spells that.
 */
const BADGE_TEXT_COLOR = '#ffffff';

async function showRecBadge(lost: boolean): Promise<void> {
  await chrome.action.setBadgeBackgroundColor({
    color: lost ? designTheme.light.warning : designTheme.light.accent,
  });
  await chrome.action.setBadgeTextColor({ color: BADGE_TEXT_COLOR });
  await chrome.action.setBadgeText({ text: 'REC' });
}

async function clearRecBadge(): Promise<void> {
  await chrome.action.setBadgeText({ text: '' });
}

/**
 * The badge for a recording failure nobody has read yet. Coral and '!' is
 * how `flashErrorBadge` in the capture worker already spells an error; this
 * one persists instead of counting down, because it is the only surface left
 * when a failure lands with no popup, recorder page or control tab open.
 */
async function showFailBadge(): Promise<void> {
  await chrome.action.setBadgeBackgroundColor({ color: designTheme.light.accent });
  await chrome.action.setBadgeTextColor({ color: BADGE_TEXT_COLOR });
  await chrome.action.setBadgeText({ text: '!' });
}

async function pendingFailure(): Promise<RecFailure | null> {
  const stored = await chrome.storage.session.get(REC_FAILURE_KEY);
  const value: unknown = stored[REC_FAILURE_KEY];
  return isRecFailure(value) ? value : null;
}

/**
 * Put the badge back the way current state needs it. The action badge is
 * one shared surface: a capture taken mid-recording runs its own countdown,
 * done or error flash and then clears the text, which used to wipe the REC
 * indicator for the rest of the recording. Capture calls this instead of
 * clearing, so the badge lands on REC while a recording runs, on '!' while an
 * unread recording failure is parked, and on empty otherwise.
 */
export async function restoreRecBadge(): Promise<void> {
  let state: StoredRecState | null;
  let failure: RecFailure | null;
  try {
    state = await getRecState();
    failure = await pendingFailure();
  } catch {
    // The store that says whether a recording is live is the store that just
    // failed, so there is nothing to restore the badge *to*. Clearing here
    // used to wipe REC on the strength of a read that never answered — the
    // badge lying in the one state where it is the user's only indicator. The
    // last answer this worker did get is better than either guess: it clears a
    // capture's leftover flash without touching a live REC.
    if (lastKnownLive === false) {
      await clearRecBadge();
      return;
    }
    // Never had an answer — an MV3 worker that restarted. `getContexts` is a
    // second authority on the same question and does not go through session
    // storage; `handleQuery` already treats it as the arbiter of whether a
    // recording is live. No offscreen document means nothing is recording, so
    // a capture's leftover flash can go. A `getContexts` that also fails
    // leaves the badge exactly as it is.
    if (lastKnownLive === null && !(await hasOffscreenDocument().catch(() => true))) {
      await clearRecBadge();
    }
    return;
  }
  lastKnownLive = !!state;
  if (state) await showRecBadge(state.overlayLost);
  else if (failure) await showFailBadge();
  else await clearRecBadge();
}

// --- Failure reporting -------------------------------------------------------

/**
 * Surface a failure the worker has no caller to answer. Most of these land
 * with nothing of ours on screen — the popup hands the click over and closes,
 * and the control tab may be closed or behind the recorded page — so this
 * takes all three routes it can: it parks the failure for the next popup open,
 * broadcasts it to any surface that happens to be listening right now, and
 * puts '!' on the action badge, which needs nothing open at all.
 *
 * Best-effort throughout. A failure report that throws would replace the
 * failure being reported with a less useful one.
 */
async function reportFailure(code: RecFailureCode, sessionId?: string): Promise<void> {
  const failure: RecFailure = { code, at: Date.now(), ...(sessionId ? { sessionId } : {}) };
  await chrome.storage.session.set({ [REC_FAILURE_KEY]: failure }).catch(() => {});
  chrome.runtime.sendMessage({ type: REC_FAILURE_MESSAGE, failure }).catch(() => {});
  await restoreRecBadge().catch(() => {});
}

// --- Overlay heal ------------------------------------------------------------

/**
 * Re-assert the cursor logger on `tabId`. A fresh document gets the full
 * mount; a logger that is already there has its clock re-synced instead.
 */
async function healOverlay(tabId: number): Promise<'fresh' | 'synced' | 'failed'> {
  const s = await getRecState();
  if (!s) return 'failed';
  const elapsed = (s.pausedAt || Date.now()) - s.startedAt - s.pausedAccumMs;
  try {
    const [injection] = await chrome.scripting.executeScript({
      target: { tabId },
      func: mountRecordingOverlay,
      args: [
        s.segmentId,
        elapsed,
        s.pausedAt !== 0,
        // A state written by a build that predates the field would otherwise
        // read as unanchored. Only an explicit false is unanchored.
        s.anchored !== false,
      ],
    });
    // The logger is on the page. If this run had reported that it could not get
    // there, that message is now wrong, and the flag has to flip so a genuine
    // loss later is reported rather than suppressed as a repeat.
    if (!s.overlayMounted) {
      await setRecState({ sessionId: s.sessionId, overlayMounted: true });
      const parked = await pendingFailure().catch(() => null);
      if (parked?.code === 'overlay-blocked' && sameRun(parked, { sessionId: s.sessionId })) {
        await chrome.storage.session.remove(REC_FAILURE_KEY).catch(() => {});
      }
    }
    return injection?.result === 'fresh' ? 'fresh' : 'synced';
  } catch {
    return 'failed'; // no permission on this origin — the logger stays lost
  }
}

/**
 * Tear down the in-page cursor logger. It parks its own cleanup on
 * `window.__ossRecOverlay`; without this call its listeners and heartbeat
 * survive the recording until the tab navigates.
 */
async function unmountOverlay(tabId: number): Promise<void> {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        const w = window as unknown as { __ossRecOverlay?: () => void };
        if (typeof w.__ossRecOverlay === 'function') w.__ossRecOverlay();
      },
    });
  } catch {
    // No permission on this origin, or the tab is gone — nothing to unmount.
  }
}

// --- Helpers -------------------------------------------------------------

async function getActiveTab(): Promise<chrome.tabs.Tab | null> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab ?? null;
}

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

async function hasOffscreenDocument(): Promise<boolean> {
  const contexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT' as chrome.runtime.ContextType],
  });
  return contexts.length > 0;
}

function readViewport(): { w: number; h: number; dpr: number } {
  return { w: innerWidth, h: innerHeight, dpr: devicePixelRatio };
}

async function closeOffscreenSafe(): Promise<void> {
  try {
    await chrome.offscreen.closeDocument();
  } catch {
    // No offscreen document open — nothing to close.
  }
}

// --- REC_* handlers ------------------------------------------------------

/**
 * Open the control tab for `tabId`, beside it. Runs from the popup's Record
 * click (or the tabCapture grant that click was waiting on), while the
 * toolbar invocation still lets the worker take a still of the tab — the
 * control page draws the area selection on it. The tab must be the active
 * one in its window for that still, which it is at the click.
 *
 * A run already live gets its control tab back instead of a second one.
 */
async function handleOpenControl(tabId: number, continueSessionId?: string): Promise<void> {
  const live = await getRecState();
  if (live) {
    await showControls(live);
    return;
  }
  let tab: chrome.tabs.Tab;
  try {
    tab = await chrome.tabs.get(tabId);
  } catch {
    await reportFailure('start-blocked');
    return;
  }
  if (tab.id == null || isProtectedUrl(tab.url)) {
    await reportFailure('start-blocked');
    return;
  }
  // Best-effort: without the still the page offers the whole tab only.
  const shot = await chrome.tabs
    .captureVisibleTab(tab.windowId, { format: 'jpeg', quality: CONTROL_SHOT_QUALITY })
    .catch(() => null);
  const target: ControlTarget = {
    tabId: tab.id,
    windowId: tab.windowId,
    title: tab.title ?? '',
    url: tab.url ?? '',
    ...(tab.favIconUrl ? { favIconUrl: tab.favIconUrl } : {}),
    shot,
    ...(continueSessionId ? { continueSessionId } : {}),
  };
  await chrome.storage.session.set({ [CONTROL_TARGET_KEY]: target });
  await chrome.tabs.create({
    url: `${CONTROL_URL}?tab=${tab.id}`,
    windowId: tab.windowId,
    index: tab.index + 1,
    openerTabId: tab.id,
  });
}

/**
 * Bring the run's control tab to the front, or open a new one when the user
 * closed it. The command and a second Record click both land here.
 */
async function showControls(state: StoredRecState): Promise<void> {
  if (state.controlTabId != null) {
    try {
      const tab = await chrome.tabs.update(state.controlTabId, { active: true });
      if (tab?.windowId != null) await chrome.windows.update(tab.windowId, { focused: true });
      return;
    } catch {
      // Closed during the run — open a fresh one below.
    }
  }
  const target = await chrome.tabs.get(state.tabId).catch(() => null);
  const created = await chrome.tabs.create({
    url: `${CONTROL_URL}?tab=${state.tabId}`,
    ...(target ? { windowId: target.windowId, index: target.index + 1 } : {}),
  });
  if (created.id != null)
    await setRecState({ sessionId: state.sessionId, controlTabId: created.id });
}

/**
 * The control tab's Start. `tabId` is the tab its Record click came from:
 * Chrome keeps that click's capture grant on the tab until it navigates to
 * another site or closes, so the start may run while the control tab is in
 * front. Camera and mic were already granted (or declined) in the control
 * tab, which is a page of this extension's origin, so nothing here waits on
 * a permission prompt.
 */
async function handleStart(
  settings: RecordingSettings,
  tabId: number,
  area: RecordingArea,
  continueSessionId?: string,
  controlTabId?: number,
): Promise<void> {
  if (startPending || preparingStart) return; // a start is already mid-flight
  // Claim the slot synchronously, before any `await` — otherwise two
  // near-simultaneous REC_STARTs can both pass the check above while the
  // first is suspended on an await (check-then-act split across awaits).
  startAbort = null;
  beginStartPending();

  let session: RecordingSession | undefined;
  // These live outside the try because the catch has to undo what they name:
  // the logger goes up before the last step that can throw, and a continued
  // session's failed segment row has to be removed by id.
  let segmentId: string | undefined;
  let mounted = false;
  try {
    if (await getRecState()) {
      resolveStartPending(); // already recording — release the claim
      await reportFailure('start-busy');
      return;
    }

    const tab = await chrome.tabs.get(tabId).catch(() => null);
    if (!tab || tab.id == null || isProtectedUrl(tab.url)) {
      resolveStartPending();
      await reportFailure('start-blocked');
      return;
    }

    // Only from here is there a run to give back, so only from here is a Stop
    // or Cancel this start's to answer. Claimed later than the slot above on
    // purpose: a gesture that lands while the two checks above are running
    // belongs to whatever was already recording, and swallowing it would
    // leave that recording running with the user's Stop spent.
    preparingStart = true;

    await ensureOffscreen();

    session = continueSessionId
      ? await (async () => {
          const existing = await getSession(continueSessionId);
          if (!existing) throw new Error(`No session found for id ${continueSessionId}`);
          // The session's settings describe every segment in it, and the
          // editor reads them to decide which audio tracks to route. A
          // continue with the mic off would otherwise hide the mic recorded
          // in the earlier segments, so each track is merged, never replaced:
          // a track that any run recorded stays true for the session.
          const merged: RecordingSettings = {
            ...existing.settings,
            mic: existing.settings.mic || settings.mic,
            tabAudio: existing.settings.tabAudio || settings.tabAudio,
            webcam: existing.settings.webcam || settings.webcam,
          };
          await updateSession(existing.id, { status: 'recording', settings: merged });
          return { ...existing, status: 'recording' as const, settings: merged };
        })()
      : await createSession(settings);

    const viewport: SegmentViewport = await execInTab(tabId, readViewport, []);
    const segment = await createSegment(
      session.id,
      session.segmentIds.length,
      viewport,
      settings.webcam,
      area,
    );
    segmentId = segment.id;

    const now = Date.now();
    await writeRecState({
      sessionId: session.id,
      segmentId: segment.id,
      tabId,
      ...(controlTabId != null ? { controlTabId } : {}),
      startedAt: now,
      pausedAt: 0,
      pausedAccumMs: 0,
      settings,
      overlayLost: false,
      overlayMounted: false,
      writeFailed: false,
      camDenied: false,
      anchored: false,
      continued: !!continueSessionId,
    });

    await showRecBadge(false);

    /**
     * A Stop or Cancel that landed while this start was preparing. Checked
     * after each step that awaits, so the last steps are not run for a run
     * nobody wants.
     */
    const abandoned = async (): Promise<boolean> => {
      if (!startAbort || !session) return false;
      await discardPreparedRun(session.id, tabId, segmentId, !!continueSessionId);
      return true;
    };

    // The cursor logger goes up before the engine is asked to capture, so the
    // first second of the recording has its clicks. `ENGINE_STARTED` anchors
    // its clock afterwards. A logger that never went up costs the recording
    // its zoom and click effects, not its video, so the start goes on.
    mounted = true;
    const mount = await healOverlay(tabId);
    if (mount === 'failed') void reportFailure('overlay-blocked', session.id);
    if (await abandoned()) return;

    // Taken last on purpose: a tab-capture stream id expires if it is not
    // consumed promptly.
    const streamId = await chrome.tabCapture.getMediaStreamId({ targetTabId: tabId });

    // The last moment a Stop or Cancel can be answered by giving the run back
    // instead of by asking the engine to undo it. Only microtasks separate
    // this check from the dispatch below, and a message listener runs as a
    // task, so a gesture is either taken here or reaches an engine that has
    // been asked to begin — never neither.
    if (await abandoned()) return;

    const startedSessionId = session.id;
    chrome.runtime
      .sendMessage({
        type: 'OFFSCREEN_START',
        target: 'offscreen',
        streamId,
        sessionId: startedSessionId,
        segmentId: segment.id,
        settings,
      })
      .catch(() => void abandonUnstartedRun(startedSessionId));
    // startPending stays claimed here — resolved by ENGINE_STARTED,
    // ENGINE_ERROR, or the timeout guard in armStartTimeout().

    // The user goes to the page they are recording; the control tab waits
    // behind it for Stop. The capture does not depend on this, so a window
    // that cannot be focused changes nothing about the recording.
    await chrome.tabs.update(tabId, { active: true }).catch(() => {});
    await chrome.windows.update(tab.windowId, { focused: true }).catch(() => {});
  } catch (err) {
    console.error('[OpenScreenShot] recording start failed', err);
    if (mounted) await unmountOverlay(tabId);
    // The session row was already written when this threw (a navigating tab
    // fails `execInTab`, for one), and a row left at status 'recording' with
    // no engine behind it reads as a crash the user is offered to recover.
    const retained = await retainFailedSession(session?.id, !!continueSessionId, segmentId);
    await clearRecState();
    await clearRecBadge();
    await closeOffscreenSafe();
    resolveStartPending();
    // Reported after the badge clear above, which would otherwise win. A
    // cleanup that also failed is the message worth showing: it is the one
    // that leaves a row behind for the user to deal with.
    await reportFailure(retained ? 'start-failed' : 'cleanup-failed');
  } finally {
    // Cleared the moment `handleStart` returns, which is right after the
    // dispatch above — from there on the gesture belongs to the engine.
    preparingStart = false;
  }
}

/**
 * The user stopped or cancelled while the start was still preparing. Give the
 * run back and go quiet.
 *
 * Nothing was recorded: no recorder ever ran, so there is no file to keep and
 * no shortfall to explain. It is not a failure either — the user asked for
 * it — so no message is parked and no '!' is raised. The control tab going
 * back to Start and the badge clearing is the whole answer, which is the same answer a Stop one
 * second later would give.
 *
 * The DB half is a discard rather than `retainFailedSession`'s retention: a
 * 'failed' row on the Recorder page would report a deliberate cancel as
 * something that went wrong.
 */
async function discardPreparedRun(
  sessionId: string,
  tabId: number,
  segmentId: string | undefined,
  continued: boolean,
): Promise<void> {
  await unmountOverlay(tabId);
  await discardRun(sessionId, continued, segmentId);
  await clearRecState();
  await closeOffscreenSafe();
  resolveStartPending();
  // Not clearRecBadge: this start may already have parked its own
  // 'overlay-blocked', and that '!' is still owed to the user.
  await restoreRecBadge();
}

/**
 * `OFFSCREEN_START` never landed, so the engine holds nothing and no
 * `ENGINE_ERROR` is coming. Everything downstream still claims a live
 * recording: the stored state, the REC badge, the control tab counting up.
 *
 * Reporting alone was not enough — the message says "stop and try again" and
 * Stop could not work. `OFFSCREEN_STOP` reaches an engine whose own state is
 * null, which parks it as a pending stop and returns without sending
 * `ENGINE_STOPPED`, so the state was never cleared; and with the document
 * already gone the send rejects and parks a second message for the same
 * failure. So the run is torn down here first, exactly as `handleEngineError`
 * tears down the same class, and only then reported.
 */
async function abandonUnstartedRun(sessionId: string): Promise<void> {
  const state = await getRecState().catch(() => null);
  if (state && state.sessionId !== sessionId) return;
  await tearDownUnstartedRun(state, 'engine-unreachable');
}

/**
 * A Stop or a Cancel the engine never answered, on a run it never started.
 * `handleStop` and `handleCancel` arm this on every gesture; by the time it
 * runs either `ENGINE_STOPPED` has cleared the state, or the anchor has
 * arrived and the recording is real, or neither — and neither is the hung
 * engine.
 *
 * That last case has no other exit. `OFFSCREEN_STOP` (and `OFFSCREEN_CANCEL`)
 * to an engine whose own `state` is null parks a pending stop and returns, so
 * no `ENGINE_STOPPED` comes back and nothing clears; `handleQuery`'s escape
 * hatch checks for an offscreen document, which exists and is merely hung.
 * Without this the control tab reads "Starting…" over dead buttons, with a
 * REC badge that never goes down, until the tab is closed.
 *
 * `code` carries which gesture is waiting: `engine-stalled` for a Stop, whose
 * intent to record did fail, and null for a Cancel, which asked for nothing
 * to be kept and gets the silent teardown `discardPreparedRun` gives the same
 * gesture one tick earlier.
 */
async function abandonStalledRun(sessionId: string, code: RecFailureCode | null): Promise<void> {
  const state = await getRecState().catch(() => null);
  if (!state || state.sessionId !== sessionId || state.anchored) return;
  await tearDownUnstartedRun(state, code);
}

/**
 * Tear down a run the engine never took charge of, and say so — or say
 * nothing, when `code` is null because the user asked for the teardown.
 *
 * **The state goes first, and the logger goes after it.** The other order —
 * unmount, then several awaits of IndexedDB, then clear — leaves a window in
 * which a Stop reads a live state and `healOverlay`s the logger back onto the
 * page. The state is then cleared under it and nothing will ever unmount that
 * logger again: it keeps listening and sending heartbeats to an engine that
 * is gone.
 * Clearing first narrows that window to the microtask between `healOverlay`'s
 * own re-read and the clear, because a heal that reads no state returns
 * 'failed' instead of mounting.
 *
 * A null `code` takes the cancel's three differences with it, which are one
 * rule stated three times: the run is discarded rather than kept as 'failed',
 * the badge is restored rather than cleared so a '!' this start already
 * parked survives, and nothing is reported.
 */
async function tearDownUnstartedRun(
  state: StoredRecState | null,
  code: RecFailureCode | null,
): Promise<void> {
  await clearRecState();
  let retained = true;
  if (state) {
    if (code) {
      retained = await retainFailedSession(state.sessionId, state.continued, state.segmentId);
    } else {
      await discardRun(state.sessionId, state.continued, state.segmentId);
    }
    await unmountOverlay(state.tabId);
  }
  if (code) await clearRecBadge();
  await closeOffscreenSafe();
  resolveStartPending();
  if (code) await reportFailure(retained ? code : 'cleanup-failed');
  else await restoreRecBadge();
}

/**
 * Settle the DB half of a start that never reached the engine.
 *
 * A brand-new session used to be deleted outright, which is why a failed
 * start was indistinguishable from a click that did nothing: the message,
 * the state and the row all vanished together. The row is kept and marked
 * 'failed' instead, so the Recorder page has something to show — when it was
 * attempted, and which tracks were asked for. A continued session keeps its
 * earlier segments and just loses the 'recording' status it was given, as
 * before, because those segments are real recordings and the session as a
 * whole is not a failure.
 *
 * The segment row created for this run goes either way. No chunk was ever
 * written to it, so it would load as a zero-byte source that the editor
 * cannot play and that used to make every later export of the session fail.
 */
async function retainFailedSession(
  sessionId: string | undefined,
  continued: boolean,
  segmentId?: string,
): Promise<boolean> {
  if (!sessionId) return true;
  try {
    if (segmentId) await deleteSegment(segmentId);
    if (continued) {
      await updateSession(sessionId, { status: 'complete' });
    } else {
      await dropOlderFailedSessions(sessionId);
      await updateSession(sessionId, { status: 'failed' });
    }
    return true;
  } catch (err) {
    console.error('[OpenScreenShot] retaining the failed session failed', err);
    return false;
  }
}

/**
 * Keep exactly one failed session. A retained failure is there to be looked
 * at once and deleted; without this, a start that fails the same way every
 * time (a permanently blocked origin, say) would stack up an empty row per
 * click and the Recorder page would fill with them.
 */
async function dropOlderFailedSessions(keepId: string): Promise<void> {
  const sessions = await listSessions();
  for (const session of sessions) {
    if (session.status === 'failed' && session.id !== keepId) await deleteSession(session.id);
  }
}

/**
 * Settle the DB half of a run the user asked to end before it began — the
 * counterpart of `retainFailedSession`, for a gesture rather than a failure.
 *
 * Nothing recorded and nothing kept: a 'failed' row on the Recorder page
 * would report a deliberate cancel as something that went wrong. A continued
 * session keeps its earlier segments, which are real recordings, and only
 * loses the 'recording' status this run gave it.
 *
 * A discard that throws stays quiet, unlike `retainFailedSession`'s
 * 'cleanup-failed': the row it left behind is the one the user was dropping,
 * and telling them their cancel half-worked is worse than the stray row.
 */
async function discardRun(
  sessionId: string,
  continued: boolean,
  segmentId?: string,
): Promise<void> {
  try {
    if (continued) {
      if (segmentId) await deleteSegment(segmentId);
      await updateSession(sessionId, { status: 'complete' });
    } else {
      await deleteSession(sessionId);
    }
  } catch (err) {
    console.error('[OpenScreenShot] discarding the abandoned start failed', err);
  }
}

/**
 * Inject a self-contained function into `tabId` and return its (awaited)
 * result. Deliberately not imported from `src/background/index.ts` — the
 * brief has this module own it independently to avoid coupling the capture
 * worker's internals to recording orchestration.
 */
async function execInTab<A extends unknown[], R>(
  tabId: number,
  func: (...args: A) => R,
  args: A,
): Promise<Awaited<R>> {
  const results = await chrome.scripting.executeScript({ target: { tabId }, func, args });
  const result = results?.[0]?.result;
  if (result === undefined) throw new Error('executeScript returned no result');
  return result as Awaited<R>;
}

/**
 * A stop or a cancel that never reached the engine. Silent when a teardown has
 * already taken the run down — `abandonUnstartedRun` reports the same failure
 * from the other end, and both firing is the one-message-per-failure rule
 * broken. A live run means nothing else is reporting this, so it must.
 */
async function reportControlUnreachable(): Promise<void> {
  // A read that threw is not evidence the run is gone, and reporting still
  // does something useful when it is: the badge half of `reportFailure` works
  // even where the park cannot. Only a store that answered "nothing is
  // running" buys the silence.
  const state = await getRecState().catch(() => 'unreadable' as const);
  if (state !== null) await reportFailure('control-unreachable');
}

async function handleStop(): Promise<void> {
  // Checked before anything is awaited, so it cannot race the dispatch it is
  // deciding against — `handleStart` sets `preparingStart` false in the same
  // synchronous run as the send.
  if (abortPreparingStart('stop')) return;
  const state = await getRecState();
  if (!state) return;
  await healOverlay(state.tabId);
  chrome.runtime
    .sendMessage({ type: 'OFFSCREEN_STOP', target: 'offscreen' })
    .catch(() => reportControlUnreachable());
  // Armed on every stop, and it is `abandonStalledRun` that decides. Testing
  // `state.anchored` here as well would be a second guard on the same
  // question that no test could tell apart from the first — and it would be
  // the wrong one of the two, because the anchor can arrive *after* this
  // gesture: a Stop pressed on "Starting…" whose ENGINE_STARTED lands a beat
  // later is stopping a real recording, and only a check made at the deadline
  // can know that.
  setTimeout(
    () => void abandonStalledRun(state.sessionId, 'engine-stalled'),
    STALLED_STOP_TIMEOUT_MS,
  );
}

async function handlePause(): Promise<void> {
  await waitForStartPending();
  const state = await getRecState();
  if (!state || state.pausedAt) return;
  await setRecState({ sessionId: state.sessionId, pausedAt: Date.now() });
  chrome.runtime
    .sendMessage({ type: 'OFFSCREEN_PAUSE', target: 'offscreen' })
    .catch(() => reportFailure('control-unreachable'));
}

async function handleResume(): Promise<void> {
  await waitForStartPending();
  const state = await getRecState();
  if (!state || !state.pausedAt) return;
  await setRecState({
    sessionId: state.sessionId,
    pausedAccumMs: state.pausedAccumMs + (Date.now() - state.pausedAt),
    pausedAt: 0,
  });
  chrome.runtime
    .sendMessage({ type: 'OFFSCREEN_RESUME', target: 'offscreen' })
    .catch(() => reportFailure('control-unreachable'));
}

async function handleCancel(): Promise<void> {
  if (abortPreparingStart('cancel')) return;
  const state = await getRecState();
  if (!state) return;
  chrome.runtime
    .sendMessage({ type: 'OFFSCREEN_CANCEL', target: 'offscreen' })
    .catch(() => reportControlUnreachable());
  // The same watchdog Stop arms, for the same hung engine: OFFSCREEN_CANCEL
  // parks a pending cancel against a null engine state and nothing comes
  // back. It tears down without a word — the user cancelled, and the control
  // tab going back to Start is the whole answer.
  setTimeout(() => void abandonStalledRun(state.sessionId, null), STALLED_STOP_TIMEOUT_MS);
}

/** The keyboard route back to the control tab while a recording runs. */
async function handleShowControls(): Promise<void> {
  const state = await getRecState();
  if (state) await showControls(state);
}

async function handleQuery(sendResponse: (state: RecState) => void): Promise<void> {
  try {
    let state = await getRecState();
    if (state) {
      // Stored state with no live engine means the worker (or engine) crashed
      // mid-recording — surface it as recoverable instead of active.
      if (!(await hasOffscreenDocument())) {
        await clearRecState();
        state = null;
      }
    }

    if (!state) {
      const recoverable = await findRecoverableSessions();
      // A session whose recorder tab never opened is complete, so it is not
      // in `recoverable` — it is offered through the same link because the
      // link does the same thing, and it is dropped once it is gone.
      const stored = await chrome.storage.session.get(UNOPENED_SESSION_KEY);
      let unopened = stored[UNOPENED_SESSION_KEY] as string | undefined;
      if (unopened && !(await getSession(unopened))) {
        await chrome.storage.session.remove(UNOPENED_SESSION_KEY);
        unopened = undefined;
      }
      sendResponse({
        active: false,
        paused: false,
        recoverableSessionId: recoverable[0]?.id ?? unopened,
      });
      return;
    }

    void healOverlay(state.tabId);

    // Zero until the engine has reported in: before that `startedAt` is the
    // mount, not a recording, and a surface that showed it would have to take
    // the number back when the anchor lands. Read the same defensive way as
    // `healOverlay` does — only an explicit false is unanchored, so a state
    // written before the field existed still reports its elapsed.
    const anchored = state.anchored !== false;
    const elapsedMs = anchored
      ? (state.pausedAt || Date.now()) - state.startedAt - state.pausedAccumMs
      : 0;
    sendResponse({
      active: true,
      anchored,
      paused: state.pausedAt !== 0,
      sessionId: state.sessionId,
      elapsedMs,
      settings: state.settings,
      overlayLost: state.overlayLost,
      tabId: state.tabId,
      writeFailed: state.writeFailed,
      camDenied: !!state.camDenied,
    });
  } catch (err) {
    console.error('[OpenScreenShot] REC_QUERY failed', err);
    // The reply below is a guess, not an answer: a live recording would be
    // reported as idle. Whoever asked has to know the state is untrustworthy.
    void reportFailure('query-failed');
    sendResponse({ active: false, paused: false });
  }
}

// --- Engine message handlers -----------------------------------------------

/**
 * The engine is live. Two corrections land here: the settings drop whatever
 * device the engine could not open (a declined mic or camera never fails a
 * start, and a declined camera is flagged so the control tab can say so), and
 * the clock re-anchors to the moment the recorders actually began. The heal
 * pushes the new zero into the cursor logger.
 */
async function handleEngineStarted(sessionId: string, tracks?: CapturedTracks): Promise<void> {
  resolveStartPending();
  const state = await getRecState();
  if (!state || state.sessionId !== sessionId) return;

  const settings = applyCapturedTracks(state.settings, tracks);
  // The anchor lands once, on the first ENGINE_STARTED, and it lands on zero.
  //
  // It used to be skipped for a run whose clock had been touched — the old
  // `pausedAt === 0 && pausedAccumMs === 0` test — on the reasoning that a
  // pause owned the clock. A pause is reachable in this window: the 10s claim
  // deadline releases `handlePause`'s wait while the start is still
  // preparing. So the run kept the mount as its zero and the
  // clock went "Starting…" -> 0:11, paused, for zero seconds of content, which
  // is the exact reading the anchor exists to prevent. Both counters are
  // reset with it, and an open pause is re-stamped to now, so a paused run
  // anchors at 0:00 rather than at however long the start took.
  const now = Date.now();
  await setRecState({
    sessionId,
    settings,
    ...(state.settings.webcam && !settings.webcam ? { camDenied: true } : {}),
    anchored: true,
    ...(state.anchored
      ? {}
      : {
          startedAt: now,
          pausedAccumMs: 0,
          ...(state.pausedAt ? { pausedAt: now } : {}),
        }),
  });
  void healOverlay(state.tabId);
}

async function handleOverlayLost(sessionId: string): Promise<void> {
  const state = await getRecState();
  if (!state || state.sessionId !== sessionId) return;
  await setRecState({ sessionId, overlayLost: true });
  await showRecBadge(true);
  // A logger that never reached the page is one absent logger, and the start
  // already named it: the engine's watchdog reports a logger that stopped
  // sending 2.5-3.5s later, which for a refused mount is the same situation
  // told twice. 'overlay-blocked' is the more accurate of the two sentences
  // and arrives first, so it keeps the slot. Scoped to a logger that has never
  // mounted for this run, so a real loss minutes later is still reported —
  // `overlayMounted` is set by the mount, not by the watchdog, precisely
  // because the watchdog cannot report a heal it never noticed. The state and
  // the badge above flip either way: those are state, not a message.
  const parked = await pendingFailure().catch(() => null);
  const blockedThisRun =
    parked?.code === 'overlay-blocked' && sameRun(parked, { sessionId: state.sessionId });
  if (state.overlayMounted || !blockedThisRun) {
    await reportFailure('overlay-lost', state.sessionId);
  }
}

async function handleOverlayHealed(sessionId: string): Promise<void> {
  const state = await getRecState();
  if (!state || state.sessionId !== sessionId) return;
  await setRecState({ sessionId, overlayLost: false });
  await showRecBadge(false);
  // The logger is back, so the parked "click tracking stopped" message is stale —
  // a navigation that heals in a second must not leave the next popup open
  // reporting a problem that has already fixed itself.
  const parked = await pendingFailure().catch(() => null);
  const mine = parked ? sameRun(parked, { sessionId }) : false;
  if (mine && (parked?.code === 'overlay-lost' || parked?.code === 'overlay-blocked')) {
    await chrome.storage.session.remove(REC_FAILURE_KEY).catch(() => {});
  }
}

/**
 * A write rejected mid-recording. Nothing is torn down: what is already
 * written is a real recording and the user may still want the rest of it. The
 * engine sends this once per kind per run, so this cannot nag.
 *
 * A media failure is also written to state, which the control tab polls, so
 * the user hears about it while it is happening — a parked message they find
 * after stopping arrives after the data is already gone.
 */
async function handleEngineWriteFailed(
  sessionId: string,
  kind: 'media' | 'events' | undefined,
): Promise<void> {
  const state = await getRecState();
  if (state && state.sessionId !== sessionId) return;
  // Absent kind means an engine older than this message shape. Read it as
  // media: reporting a lost recording as a lost cursor track is the one
  // direction of that mistake that costs the user data.
  const media = kind !== 'events';
  if (media) {
    if (state) await setRecState({ sessionId, writeFailed: true });
    await reportFailure('chunk-write-failed', sessionId);
    return;
  }
  // A broken store breaks both writers at once — media chunks land every
  // TIMESLICE_MS and cursor batches every FLUSH_INTERVAL_MS, on independent
  // phases — so both failures arrive inside the same second in arbitrary
  // order. Last-writer-wins would leave "The video is fine" standing half the
  // time, beside a control tab reading NOT SAVING. The graver sentence keeps
  // the slot, the same rule `handleOverlayLost` uses below.
  if (state?.writeFailed) return;
  // Scoped to this run, and it has to be: a parked failure outlives its
  // recording on purpose, so an unread `chunk-write-failed` from an earlier
  // run would otherwise suppress this one entirely — no message, no
  // broadcast, for a failure that just happened.
  const parked = await pendingFailure().catch(() => null);
  if (parked && sameRun(parked, { sessionId }) && supersedes(parked.code, 'events-write-failed')) {
    return;
  }
  await reportFailure('events-write-failed', sessionId);
}

async function handleEngineError(sessionId: string, message: string): Promise<void> {
  console.error('[OpenScreenShot] recording engine error', message);
  resolveStartPending();
  const state = await getRecState();
  // Only the live session's own error may tear anything down. A late error
  // from a session that already ended would otherwise delete the recording
  // that replaced it, along with its state, badge and offscreen document.
  if (state && state.sessionId !== sessionId) return;
  // The engine only reports this from its own start, before any recorder ran,
  // so the session holds nothing recorded. Left at 'recording' it would offer
  // the user an empty recording to recover; `tearDownUnstartedRun` marks it
  // 'failed' so it stays visible on the Recorder page as an attempt that did
  // not work, and clears the state before the logger for the reason given there.
  await tearDownUnstartedRun(state, 'engine-failed');
}

async function handleEngineStopped(sessionId: string, canceled: boolean): Promise<void> {
  resolveStartPending();
  // Read the tab before the state is cleared; `handleStop` healed the logger
  // on the way in, so it is live right up to this point.
  const state = await getRecState();
  // Cleared before the unmount, so a Stop landing in this window cannot heal
  // the logger back onto a page nothing will unmount it from again — the same
  // ordering `tearDownUnstartedRun` explains.
  await clearRecState();
  if (state) await unmountOverlay(state.tabId);
  // Not clearRecBadge: a failure parked during this recording (an overlay
  // lost, say) still has its '!' owed to it, and the recording ending is not
  // the user having read it.
  await restoreRecBadge();
  await closeOffscreenSafe();
  if (!canceled) {
    try {
      await openRecorder(sessionId, state?.controlTabId);
      // A page that opened retires any earlier one that did not: the offer is
      // a shortcut to the recording the user has not seen, and they are
      // looking at one now.
      await chrome.storage.session.remove(UNOPENED_SESSION_KEY).catch(() => {});
    } catch {
      // The recording is safe in IndexedDB; only the page that shows it did
      // not open, and nothing else would ever mention that. Parked with the
      // id so the popup's Recover link can reach it — the session is
      // 'complete', so `findRecoverableSessions` will not offer it.
      await chrome.storage.session.set({ [UNOPENED_SESSION_KEY]: sessionId }).catch(() => {});
      await reportFailure('recorder-open-failed');
    }
  }
}

/**
 * The editor opens in the control tab that started the run, so a recording
 * leaves one tab behind rather than two. A control tab the user closed gets a
 * new tab instead.
 */
async function openRecorder(sessionId: string, controlTabId?: number): Promise<void> {
  const url = `${RECORDER_URL}?session=${sessionId}`;
  if (controlTabId != null) {
    try {
      const tab = await chrome.tabs.update(controlTabId, { url, active: true });
      if (tab?.windowId != null) await chrome.windows.update(tab.windowId, { focused: true });
      return;
    } catch {
      // The control tab is gone; fall through to a new tab.
    }
  }
  await chrome.tabs.create({ url });
}

// --- Message listener --------------------------------------------------------

chrome.runtime.onMessage.addListener((message: unknown, sender, sendResponse) => {
  if (isRecMessage(message)) {
    if (message.type === 'REC_QUERY') {
      void handleQuery(sendResponse);
      return true; // async sendResponse
    }
    switch (message.type) {
      case 'REC_OPEN_CONTROL':
        void handleOpenControl(message.tabId, message.continueSessionId);
        break;
      case 'REC_START':
        void handleStart(
          message.settings,
          message.tabId,
          normalizeArea(message.area),
          message.continueSessionId,
          sender.tab?.id,
        );
        break;
      case 'REC_STOP':
        void handleStop();
        break;
      case 'REC_PAUSE':
        void handlePause();
        break;
      case 'REC_RESUME':
        void handleResume();
        break;
      case 'REC_CANCEL':
        void handleCancel();
        break;
    }
    return false;
  }

  if (isEngineMessage(message)) {
    switch (message.type) {
      case 'ENGINE_STARTED':
        void handleEngineStarted(message.sessionId, message.tracks);
        break;
      case 'OVERLAY_LOST':
        void handleOverlayLost(message.sessionId);
        break;
      case 'OVERLAY_HEALED':
        void handleOverlayHealed(message.sessionId);
        break;
      case 'ENGINE_WRITE_FAILED':
        void handleEngineWriteFailed(message.sessionId, message.kind);
        break;
      case 'ENGINE_ERROR':
        void handleEngineError(message.sessionId, message.message);
        break;
      case 'ENGINE_STOPPED':
        void handleEngineStopped(message.sessionId, message.canceled);
        break;
    }
    return false;
  }

  return false;
});

// --- Command + re-injection hooks -------------------------------------------

chrome.commands.onCommand.addListener((command) => {
  if (command === 'stop-recording') void handleStop();
  if (command === 'reveal-recording-bar') void handleShowControls();
});

/**
 * Finish a Record click that was waiting on the tabCapture grant.
 *
 * The popup asks for the permission from the click itself (a service worker
 * has no user gesture, so the ask can never move here), and Chrome's dialog
 * can tear that popup down before it hears the answer. The click is parked in
 * session storage before the ask, so this listener is the one place a granted
 * prompt turns into a control tab — on both the survived and the killed popup,
 * which is why the popup opens nothing itself.
 *
 * The parked click is consumed first, then vetted: a leftover must not sit
 * there waiting to hijack an unrelated grant later.
 */
chrome.permissions.onAdded.addListener((added) => {
  if (!added.permissions?.includes('tabCapture')) return;
  void (async () => {
    const stored = await chrome.storage.session.get(PENDING_RECORD_KEY);
    const parked: unknown = stored[PENDING_RECORD_KEY];
    if (parked === undefined) return;
    await chrome.storage.session.remove(PENDING_RECORD_KEY);
    const activeTabId = (await getActiveTab())?.id ?? null;
    if (!pendingRecordIsLive(parked, Date.now(), activeTabId)) return;
    const pending: PendingRecord = parked;
    // Same consumption the popup's own click does: a continue that is about
    // to be spent must not keep being offered as "Continue recording".
    if (pending.continueSessionId) await chrome.storage.session.remove(CONTINUE_SESSION_KEY);
    await handleOpenControl(pending.tabId, pending.continueSessionId);
  })();
});

/**
 * The '!' badge belongs to a parked failure nobody has read. The surface that
 * reads one out removes the key, and the badge has to follow — the popup is
 * closing at that moment and cannot own a badge that outlives it, and the
 * recorder page, which reads a parked chunk-write failure, has no badge of
 * its own to put down.
 */
chrome.storage.session.onChanged.addListener((changes) => {
  const change = changes[REC_FAILURE_KEY];
  if (!change || change.newValue !== undefined) return;
  void restoreRecBadge();
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status !== 'complete') return;
  void (async () => {
    const state = await getRecState();
    if (!state || state.tabId !== tabId) return;
    void healOverlay(tabId);
  })();
});
