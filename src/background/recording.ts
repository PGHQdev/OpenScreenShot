/**
 * Screen-recorder worker orchestration. Owns the recording control surface
 * (`REC_*` messages from popup/overlay/command), drives the offscreen engine
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
  isEngineMessage,
  isRecMessage,
  type CapturedTracks,
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
const START_TIMEOUT_MS = 10_000;
/**
 * How long the start waits for the overlay's permission frame to settle. It
 * covers a human answering Chrome's camera/mic prompt, so it is generous; the
 * frame reports back on every path it can take, so the timeout is the fallback
 * for a frame that never loaded at all (blocked iframe, dead tab).
 */
const FRAME_READY_TIMEOUT_MS = 15_000;

interface StoredRecState {
  sessionId: string;
  segmentId: string;
  tabId: number;
  startedAt: number;
  pausedAt: number; // 0 while running
  pausedAccumMs: number;
  settings: RecordingSettings;
  overlayLost: boolean;
  /**
   * Whether the control bar has ever reached the page during this run.
   * `overlayLost` cannot answer that: it is false both before the first mount
   * and after a heal, and the engine's watchdog is edge-triggered — it stays
   * quiet while it believes the bar is already lost — so a bar that recovers
   * inside its 2500ms window never produces an `OVERLAY_HEALED` to clear
   * anything. This is the flag the mount itself sets.
   */
  overlayMounted: boolean;
  /** Media chunks are failing to reach IndexedDB; the control bar says so. */
  writeFailed: boolean;
  /**
   * Whether `ENGINE_STARTED` has arrived, i.e. whether `startedAt` is the
   * moment the recorders began rather than the moment the bar was mounted.
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
 * The frame wait is released here on purpose. Without it the gesture would
 * sit unread until the permission frame answered or its 15s timeout ran out,
 * which is the whole complaint: Stop looked broken because it was queued
 * behind the longest wait in the start.
 */
function abortPreparingStart(gesture: 'stop' | 'cancel'): boolean {
  if (!preparingStart) return false;
  startAbort = gesture;
  resolveFrameReadyFn?.();
  return true;
}

/**
 * (Re)start the deadline on the in-flight start. The permission-frame wait
 * sits inside the same claim and can outlast the engine's own budget, so the
 * start re-arms this once the wait is over — otherwise the round trip is
 * declared dead while the engine has not even been asked to begin.
 */
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

// --- Permission-frame wait ---------------------------------------------------

/**
 * Camera and mic permission belongs to the extension origin, and the offscreen
 * document has no UI to ask for it — only the overlay's iframe can show the
 * prompt. So the engine's `getUserMedia` must run *after* that prompt is
 * answered, or the first webcam/mic recording of an install silently records
 * without those tracks. The start mounts the overlay, parks here until the
 * frame reports back, and only then hands the engine its `OFFSCREEN_START`.
 */
let resolveFrameReadyFn: (() => void) | null = null;

function waitForFrameReady(): Promise<void> {
  return new Promise<void>((resolve) => {
    const timeout = setTimeout(finish, FRAME_READY_TIMEOUT_MS);
    function finish(): void {
      clearTimeout(timeout);
      resolveFrameReadyFn = null;
      resolve();
    }
    resolveFrameReadyFn = finish;
  });
}

function handleFrameReady(): void {
  resolveFrameReadyFn?.();
}

// --- Badge -------------------------------------------------------------------

async function showRecBadge(lost: boolean): Promise<void> {
  await chrome.action.setBadgeBackgroundColor({ color: lost ? '#ff9500' : '#e8503a' });
  await chrome.action.setBadgeTextColor({ color: '#ffffff' });
  await chrome.action.setBadgeText({ text: 'REC' });
}

async function clearRecBadge(): Promise<void> {
  await chrome.action.setBadgeText({ text: '' });
}

/**
 * The badge for a recording failure nobody has read yet. Coral and '!' is
 * how `flashErrorBadge` in the capture worker already spells an error; this
 * one persists instead of counting down, because it is the only surface left
 * when a failure lands with no popup, recorder page or control bar open.
 */
async function showFailBadge(): Promise<void> {
  await chrome.action.setBadgeBackgroundColor({ color: '#e8503a' });
  await chrome.action.setBadgeTextColor({ color: '#ffffff' });
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
  let state: StoredRecState | null = null;
  let failure: RecFailure | null = null;
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
 * and the control bar is either not up yet or is itself what failed — so this
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
 * Re-assert the overlay on `tabId`. A fresh document gets the full mount; an
 * overlay that is already there is re-synced instead (clock re-anchored,
 * dropped tracks removed from the chips). Returns what the injection did, so
 * the start knows whether it just mounted the permission frame.
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
        { mic: s.settings.mic, tabAudio: s.settings.tabAudio, webcam: s.settings.webcam },
        s.writeFailed,
        s.anchored,
      ],
    });
    // The bar is on the page. If this run had reported that it could not get
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
    return 'failed'; // no permission on this origin — overlay stays lost
  }
}

/**
 * Tear down the in-page overlay: control bar, webcam frame, listeners. The
 * mounted overlay parks its own cleanup on `window.__ossRecOverlay`; without
 * this call the bar and the frame's live camera stream survive the recording
 * and the camera indicator stays lit until the tab navigates.
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
 * `devicesGranted` is the popup's answer to "is there a permission prompt
 * coming?" — see `src/shared/permissions.ts`. A worker has no
 * `navigator.permissions`, so it cannot ask; absent or false keeps the wait.
 */
async function handleStart(
  settings: RecordingSettings,
  continueSessionId?: string,
  devicesGranted = false,
): Promise<void> {
  if (startPending || preparingStart) return; // a start is already mid-flight
  // Claim the slot synchronously, before any `await` — otherwise two
  // near-simultaneous REC_STARTs can both pass the check above while the
  // first is suspended on an await (check-then-act split across awaits).
  preparingStart = true;
  startAbort = null;
  beginStartPending();

  let session: RecordingSession | undefined;
  // These live outside the try because the catch has to undo what they name:
  // the overlay now goes up before the last step that can throw, and a
  // continued session's failed segment row has to be removed by id.
  let tabId: number | undefined;
  let segmentId: string | undefined;
  try {
    if (await getRecState()) {
      resolveStartPending(); // already recording — release the claim
      await reportFailure('start-busy');
      return;
    }

    const tab = await getActiveTab();
    if (!tab || tab.id == null || isProtectedUrl(tab.url)) {
      resolveStartPending();
      await reportFailure('start-blocked');
      return;
    }
    tabId = tab.id;

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
    );
    segmentId = segment.id;

    const now = Date.now();
    await writeRecState({
      sessionId: session.id,
      segmentId: segment.id,
      tabId,
      startedAt: now,
      pausedAt: 0,
      pausedAccumMs: 0,
      settings,
      overlayLost: false,
      overlayMounted: false,
      writeFailed: false,
      anchored: false,
      continued: !!continueSessionId,
    });

    await showRecBadge(false);

    // The overlay goes up before the engine is asked to capture, because its
    // iframe is the only surface that can prompt for camera/mic on this
    // extension origin. A fresh mount means that prompt is now on screen, so
    // hold the engine until the frame reports the answer — its own
    // `getUserMedia` runs in the offscreen document, which cannot prompt and
    // would just fail. `ENGINE_STARTED` re-anchors the clock afterwards.
    const mount = await healOverlay(tabId);
    // A bar that never went up leaves the recording running with no in-page
    // stop button; the popup is the remaining way to end it, so say so.
    if (mount === 'failed') void reportFailure('overlay-blocked', session.id);
    // Gated on the grant, because the wait exists for the prompt and nothing
    // else: with camera and mic already granted the frame raises no prompt,
    // reports ready as fast as an iframe can load, and the engine's own
    // getUserMedia would have succeeded anyway. Waiting there spent up to
    // FRAME_READY_TIMEOUT_MS of a start that had nothing to wait for.
    if (mount === 'fresh' && (settings.webcam || settings.mic) && !devicesGranted) {
      await waitForFrameReady();
      armStartTimeout();
    }

    // Read back so the engine skips a camera the frame already reported as
    // refused. Best-effort: the frame reports ready before it reports the
    // denial, so the write can still be in flight here — the engine's own
    // catch degrades either way, and `ENGINE_STARTED` corrects the settings.
    const effective = (await getRecState())?.settings ?? settings;

    // Taken last on purpose: a tab-capture stream id expires if it is not
    // consumed promptly, and the wait above can run as long as a human takes
    // to answer a permission prompt.
    const streamId = await chrome.tabCapture.getMediaStreamId({ targetTabId: tabId });

    // The last moment a Stop or Cancel can be answered by giving the run back
    // instead of by asking the engine to undo it. Nothing awaits between here
    // and the dispatch below, so a gesture is either taken by this branch or
    // reaches an engine that has been asked to begin — never neither.
    if (startAbort) {
      await discardPreparedRun(session.id, tabId, segmentId, !!continueSessionId);
      return;
    }

    const startedSessionId = session.id;
    chrome.runtime
      .sendMessage({
        type: 'OFFSCREEN_START',
        target: 'offscreen',
        streamId,
        sessionId: startedSessionId,
        segmentId: segment.id,
        settings: effective,
      })
      .catch(() => void abandonUnstartedRun(startedSessionId));
    // startPending stays claimed here — resolved by ENGINE_STARTED,
    // ENGINE_ERROR, or the timeout guard in armStartTimeout().
  } catch (err) {
    console.error('[OpenScreenShot] recording start failed', err);
    // The control bar is already up by the time the last steps run, so a
    // throw there would leave a timer counting up over dead buttons.
    if (tabId != null) await unmountOverlay(tabId);
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
 * it — so no message is parked and no '!' is raised. The bar going away and
 * the badge clearing is the whole answer, which is the same answer a Stop one
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
 * recording: the stored state, the REC badge, the control bar counting up.
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
  let retained = true;
  if (state) {
    await unmountOverlay(state.tabId);
    retained = await retainFailedSession(state.sessionId, state.continued, state.segmentId);
  }
  await clearRecState();
  await clearRecBadge();
  await closeOffscreenSafe();
  resolveStartPending();
  await reportFailure(retained ? 'engine-unreachable' : 'cleanup-failed');
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
  if (await getRecState().catch(() => null)) await reportFailure('control-unreachable');
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
}

/**
 * The preview iframe failed to open the camera. The engine catches its own
 * `getUserMedia` failure independently, so nothing is forwarded to it — this
 * only keeps stored settings truthful, so a later overlay mount (or a popup
 * REC_QUERY) stops claiming a webcam track that is not being recorded.
 */
async function handleWebcamDenied(): Promise<void> {
  const state = await getRecState();
  if (!state || !state.settings.webcam) return;
  await setRecState({
    sessionId: state.sessionId,
    settings: { ...state.settings, webcam: false },
  });
  // A mounted control bar keeps its CAM chip (and its preview bubble) until it
  // is told otherwise — the heal re-syncs both from the settings above.
  void healOverlay(state.tabId);
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
    // the number back when the anchor lands.
    const elapsedMs = state.anchored
      ? (state.pausedAt || Date.now()) - state.startedAt - state.pausedAccumMs
      : 0;
    sendResponse({
      active: true,
      anchored: state.anchored,
      paused: state.pausedAt !== 0,
      sessionId: state.sessionId,
      elapsedMs,
      settings: state.settings,
      overlayLost: state.overlayLost,
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
 * start), and the clock re-anchors to the moment the recorders actually began
 * — which trails the overlay's mount by however long the permission prompt
 * stayed on screen. The heal pushes both into the control bar.
 */
async function handleEngineStarted(sessionId: string, tracks?: CapturedTracks): Promise<void> {
  resolveStartPending();
  const state = await getRecState();
  if (!state || state.sessionId !== sessionId) return;

  const settings = applyCapturedTracks(state.settings, tracks);
  // Re-anchor only an untouched start: a pause during the wait already owns
  // the clock, and moving the zero under it would report the wrong elapsed.
  const fresh = state.pausedAt === 0 && state.pausedAccumMs === 0;
  await setRecState({
    sessionId,
    settings,
    anchored: true,
    ...(fresh ? { startedAt: Date.now() } : {}),
  });
  void healOverlay(state.tabId);
}

async function handleOverlayLost(sessionId: string): Promise<void> {
  const state = await getRecState();
  if (!state || state.sessionId !== sessionId) return;
  await setRecState({ sessionId, overlayLost: true });
  await showRecBadge(true);
  // A bar that never reached the page is one absent bar, and the start
  // already named it: the engine's watchdog reports a bar that stopped
  // sending 2.5-3.5s later, which for a refused mount is the same situation
  // told twice. 'overlay-blocked' is the more accurate of the two sentences
  // and arrives first, so it keeps the slot. Scoped to a bar that has never
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
  // The bar is back, so the parked "controls were lost" message is stale —
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
 * A media failure also goes to the control bar, which is the only surface the
 * user can see while it is happening — a parked message they find after
 * stopping arrives after the data is already gone. `handleWebcamDenied` is
 * the same shape: learn something mid-recording, write it to state, re-heal to
 * push it into the bar.
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
    if (state) {
      await setRecState({ sessionId, writeFailed: true });
      void healOverlay(state.tabId);
    }
    await reportFailure('chunk-write-failed', sessionId);
    return;
  }
  // A broken store breaks both writers at once — media chunks land every
  // TIMESLICE_MS and cursor batches every FLUSH_INTERVAL_MS, on independent
  // phases — so both failures arrive inside the same second in arbitrary
  // order. Last-writer-wins would leave "The video is fine" standing half the
  // time, beside a control bar reading NOT SAVING. The graver sentence keeps
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
  let retained = true;
  if (state) {
    await unmountOverlay(state.tabId);
    // The engine only reports this from its own start, before any recorder
    // ran, so the session holds nothing recorded. Left at 'recording' it
    // would offer the user an empty recording to recover; marked 'failed' it
    // stays visible on the Recorder page as the attempt that did not work.
    retained = await retainFailedSession(state.sessionId, state.continued, state.segmentId);
  }
  await clearRecState();
  await clearRecBadge();
  await closeOffscreenSafe();
  await reportFailure(retained ? 'engine-failed' : 'cleanup-failed');
}

async function handleEngineStopped(sessionId: string, canceled: boolean): Promise<void> {
  resolveStartPending();
  // Read the tab before the state is cleared; `handleStop` healed the overlay
  // on the way in, so the bar and frame are live right up to this point.
  const state = await getRecState();
  if (state) await unmountOverlay(state.tabId);
  await clearRecState();
  // Not clearRecBadge: a failure parked during this recording (an overlay
  // lost, say) still has its '!' owed to it, and the recording ending is not
  // the user having read it.
  await restoreRecBadge();
  await closeOffscreenSafe();
  if (!canceled) {
    try {
      await chrome.tabs.create({ url: `${RECORDER_URL}?session=${sessionId}` });
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

// --- Message listener --------------------------------------------------------

chrome.runtime.onMessage.addListener((message: unknown, _sender, sendResponse) => {
  if (isRecMessage(message)) {
    if (message.type === 'REC_QUERY') {
      void handleQuery(sendResponse);
      return true; // async sendResponse
    }
    switch (message.type) {
      case 'REC_START':
        void handleStart(
          message.settings,
          message.continueSessionId,
          message.devicesGranted === true,
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
      case 'REC_WEBCAM_DENIED':
        void handleWebcamDenied();
        break;
      case 'REC_FRAME_READY':
        handleFrameReady();
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
});

/**
 * Finish a Record click that was waiting on the tabCapture grant.
 *
 * The popup asks for the permission from the click itself (a service worker
 * has no user gesture, so the ask can never move here), and Chrome's dialog
 * can tear that popup down before it hears the answer. The click is parked in
 * session storage before the ask, so this listener is the one place a granted
 * prompt turns into a recording — on both the survived and the killed popup,
 * which is why the popup starts nothing itself.
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
    // Same consumption the popup's own start does: a continue that is about
    // to be spent must not keep being offered as "Continue recording".
    if (pending.continueSessionId) await chrome.storage.session.remove(CONTINUE_SESSION_KEY);
    await handleStart(pending.settings, pending.continueSessionId, pending.devicesGranted);
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
