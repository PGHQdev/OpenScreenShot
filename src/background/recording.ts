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
import { isProtectedUrl } from '../shared/utils';

const REC_STATE_KEY = 'openscreenshot:rec-state';
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
  /** True when this run appends to an existing session (Continue). */
  continued: boolean;
}

// --- Persistent state (chrome.storage.session) ------------------------------

async function getRecState(): Promise<StoredRecState | null> {
  const stored = await chrome.storage.session.get(REC_STATE_KEY);
  return (stored[REC_STATE_KEY] as StoredRecState | undefined) ?? null;
}

async function setRecState(
  patch: Partial<StoredRecState> & Pick<StoredRecState, 'sessionId'>,
): Promise<void> {
  const existing = await getRecState();
  const next: StoredRecState = { ...(existing as StoredRecState), ...patch };
  await chrome.storage.session.set({ [REC_STATE_KEY]: next });
}

async function clearRecState(): Promise<void> {
  await chrome.storage.session.remove(REC_STATE_KEY);
}

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

function beginStartPending(): void {
  startPending = new Promise<void>((resolve) => {
    resolveStartPendingFn = resolve;
  });
  armStartTimeout();
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
 * Put the badge back the way a live recording needs it. The action badge is
 * one shared surface: a capture taken mid-recording runs its own countdown,
 * done or error flash and then clears the text, which used to wipe the REC
 * indicator for the rest of the recording. Capture calls this instead of
 * clearing, so the badge lands on REC while a recording runs and on empty
 * otherwise.
 */
export async function restoreRecBadge(): Promise<void> {
  let state: StoredRecState | null = null;
  try {
    state = await getRecState();
  } catch {
    // Session storage unavailable — fall through and clear, as before.
  }
  if (state) await showRecBadge(state.overlayLost);
  else await clearRecBadge();
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
      ],
    });
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

async function handleStart(settings: RecordingSettings, continueSessionId?: string): Promise<void> {
  if (startPending) return; // a start is already mid-flight
  // Claim the slot synchronously, before any `await` — otherwise two
  // near-simultaneous REC_STARTs can both pass the check above while the
  // first is suspended on an await (check-then-act split across awaits).
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
      return;
    }

    const tab = await getActiveTab();
    if (!tab || tab.id == null || isProtectedUrl(tab.url)) {
      resolveStartPending();
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
    await setRecState({
      sessionId: session.id,
      segmentId: segment.id,
      tabId,
      startedAt: now,
      pausedAt: 0,
      pausedAccumMs: 0,
      settings,
      overlayLost: false,
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
    if (mount === 'fresh' && (settings.webcam || settings.mic)) {
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

    chrome.runtime
      .sendMessage({
        type: 'OFFSCREEN_START',
        target: 'offscreen',
        streamId,
        sessionId: session.id,
        segmentId: segment.id,
        settings: effective,
      })
      .catch(() => {});
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
    await discardStartedSession(session?.id, !!continueSessionId, segmentId);
    await clearRecState();
    await clearRecBadge();
    await closeOffscreenSafe();
    resolveStartPending();
  }
}

/**
 * Undo the DB half of a start that never reached the engine. A brand-new
 * session is deleted outright; a continued one only loses the 'recording'
 * status it was just given, because its earlier segments are real recordings.
 *
 * The segment row created for this run goes either way. In the continued case
 * it has to go on its own: no chunk was ever written to it, so it would load
 * as a zero-byte source that the editor cannot play and that used to make
 * every later export of the session fail.
 */
async function discardStartedSession(
  sessionId: string | undefined,
  continued: boolean,
  segmentId?: string,
): Promise<void> {
  if (!sessionId) return;
  try {
    if (continued) {
      if (segmentId) await deleteSegment(segmentId);
      await updateSession(sessionId, { status: 'complete' });
    } else await deleteSession(sessionId);
  } catch (err) {
    console.error('[OpenScreenShot] discarding the failed session failed', err);
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

async function handleStop(): Promise<void> {
  await waitForStartPending();
  const state = await getRecState();
  if (!state) return;
  await healOverlay(state.tabId);
  chrome.runtime.sendMessage({ type: 'OFFSCREEN_STOP', target: 'offscreen' }).catch(() => {});
}

async function handlePause(): Promise<void> {
  await waitForStartPending();
  const state = await getRecState();
  if (!state || state.pausedAt) return;
  await setRecState({ sessionId: state.sessionId, pausedAt: Date.now() });
  chrome.runtime.sendMessage({ type: 'OFFSCREEN_PAUSE', target: 'offscreen' }).catch(() => {});
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
  chrome.runtime.sendMessage({ type: 'OFFSCREEN_RESUME', target: 'offscreen' }).catch(() => {});
}

async function handleCancel(): Promise<void> {
  await waitForStartPending();
  const state = await getRecState();
  if (!state) return;
  chrome.runtime.sendMessage({ type: 'OFFSCREEN_CANCEL', target: 'offscreen' }).catch(() => {});
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
      sendResponse({
        active: false,
        paused: false,
        recoverableSessionId: recoverable[0]?.id,
      });
      return;
    }

    void healOverlay(state.tabId);

    const elapsedMs = (state.pausedAt || Date.now()) - state.startedAt - state.pausedAccumMs;
    sendResponse({
      active: true,
      paused: state.pausedAt !== 0,
      sessionId: state.sessionId,
      elapsedMs,
      settings: state.settings,
      overlayLost: state.overlayLost,
    });
  } catch (err) {
    console.error('[OpenScreenShot] REC_QUERY failed', err);
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
    ...(fresh ? { startedAt: Date.now() } : {}),
  });
  void healOverlay(state.tabId);
}

async function handleOverlayLost(sessionId: string): Promise<void> {
  const state = await getRecState();
  if (!state || state.sessionId !== sessionId) return;
  await setRecState({ sessionId, overlayLost: true });
  await showRecBadge(true);
}

async function handleOverlayHealed(sessionId: string): Promise<void> {
  const state = await getRecState();
  if (!state || state.sessionId !== sessionId) return;
  await setRecState({ sessionId, overlayLost: false });
  await showRecBadge(false);
}

async function handleEngineError(sessionId: string, message: string): Promise<void> {
  console.error('[OpenScreenShot] recording engine error', message);
  resolveStartPending();
  const state = await getRecState();
  // Only the live session's own error may tear anything down. A late error
  // from a session that already ended would otherwise delete the recording
  // that replaced it, along with its state, badge and offscreen document.
  if (state && state.sessionId !== sessionId) return;
  if (state) {
    await unmountOverlay(state.tabId);
    // The engine only reports this from its own start, before any recorder
    // ran, so the session holds nothing. Left at 'recording' it would offer
    // the user an empty recording to recover.
    await discardStartedSession(state.sessionId, state.continued, state.segmentId);
  }
  await clearRecState();
  await clearRecBadge();
  await closeOffscreenSafe();
}

async function handleEngineStopped(sessionId: string, canceled: boolean): Promise<void> {
  resolveStartPending();
  // Read the tab before the state is cleared; `handleStop` healed the overlay
  // on the way in, so the bar and frame are live right up to this point.
  const state = await getRecState();
  if (state) await unmountOverlay(state.tabId);
  await clearRecState();
  await clearRecBadge();
  await closeOffscreenSafe();
  if (!canceled) {
    await chrome.tabs.create({ url: `${RECORDER_URL}?session=${sessionId}` });
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
        void handleStart(message.settings, message.continueSessionId);
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
    await handleStart(pending.settings, pending.continueSessionId);
  })();
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status !== 'complete') return;
  void (async () => {
    const state = await getRecState();
    if (!state || state.tabId !== tabId) return;
    void healOverlay(tabId);
  })();
});
