import { useEffect, useRef, useState } from 'preact/hooks';
import type {
  CaptureAction,
  CaptureMode,
  ExportFormat,
  PopupMessage,
  Settings,
} from '../shared/types';
import { DEFAULT_SETTINGS } from '../shared/types';
import { getLastRegion, getSettings, hasLastCapture, setSettings } from '../shared/storage';
import { onPopupMessage, sendToBackground } from '../shared/messaging';
import { BrandMark } from '../shared/BrandMark';
import {
  IconBack,
  IconCode,
  IconCoffee,
  IconEyeOff,
  IconGear,
  IconGift,
  IconPage,
  IconRecordDot,
  IconRegion,
  IconShield,
  IconVisible,
} from '../shared/icons';
import { resolveModeKeys } from '../shared/shortcuts';
import {
  CAPTURE_ACTIONS,
  CAPTURE_DELAYS,
  FILENAME_TOKENS,
  formatFilename,
  insertToken,
  isProtectedUrl,
  normalizeCaptureAction,
  normalizeCaptureDelay,
} from '../shared/utils';
import {
  DEFAULT_RECORDING_SETTINGS,
  type RecordingSettings,
  type RecState,
} from '../shared/recording-types';
import {
  PENDING_RECORD_KEY,
  devicesGranted,
  popupWarnings,
  type DevicePermission,
  type PendingRecord,
} from '../shared/permissions';
import {
  REC_FAILURE_KEY,
  REC_FAILURE_MESSAGE,
  isRecFailure,
  recFailureMessageKey,
  sameRun,
  supersedes,
  type RecFailure,
  type RecFailureCode,
} from '../shared/rec-failure';
import { applyTheme, watchSystemTheme } from '../shared/theme';

// i18n helper
function t(id: string): string {
  return chrome.i18n.getMessage(id) ?? id;
}

// chrome:// URLs can't be opened via <a href>; tabs.create works from the popup.
function openShortcutSettings() {
  void chrome.tabs.create({ url: 'chrome://extensions/shortcuts' });
}

// External link — open in a tab (a bare <a> would navigate the popup away).
function openKofi() {
  void chrome.tabs.create({ url: 'https://ko-fi.com/T7A624DAY7' });
}

function openCoolStuff() {
  void chrome.tabs.create({ url: 'https://openscreenshot.app/cool-stuff' });
}

/**
 * Open the recording setup page; the popup hands off and closes. Reached only
 * from a failure now — a refused tabCapture prompt, or a device Chrome has
 * hard-blocked — because the grant a recording needs is asked for inline.
 * An already-open setup tab is focused, never duplicated — a stack of
 * identical setup tabs reads as "the close button does nothing".
 *
 * Closes on a handoff that worked, and reports one that did not. It used to
 * close in a `finally`, so a setup page that never opened looked exactly like
 * one that did: the popup vanished either way and there was no surface left
 * to say so on.
 */
async function openSetupPage(from?: 'record'): Promise<boolean> {
  const base = chrome.runtime.getURL('src/setup/index.html');
  const url = base + (from ? `?from=${from}` : '');
  try {
    const [tab] = await chrome.tabs.query({ url: base + '*' });
    if (tab?.id != null) {
      await chrome.tabs.update(tab.id, { active: true, url });
      if (tab.windowId != null) await chrome.windows.update(tab.windowId, { focused: true });
    } else {
      await chrome.tabs.create({ url });
    }
  } catch {
    // The focus path can lose its tab between the query and the update; a
    // fresh tab is the fallback, and only its failure is a real dead end.
    try {
      await chrome.tabs.create({ url });
    } catch {
      return false;
    }
  }
  window.close();
  return true;
}

/** Camera/mic grant state for the warning chips; 'prompt' when unqueryable. */
async function queryDeviceStates(): Promise<{ camera: DevicePermission; mic: DevicePermission }> {
  const query = async (name: string): Promise<DevicePermission> => {
    try {
      return (await navigator.permissions.query({ name: name as PermissionName })).state;
    } catch {
      return 'prompt';
    }
  };
  const [camera, mic] = await Promise.all([query('camera'), query('microphone')]);
  return { camera, mic };
}

const REC_SETTINGS_KEY = 'openscreenshot:rec-settings';
const CONTINUE_SESSION_KEY = 'openscreenshot:continue-session';
/** Mirrors `src/background/recording.ts`: a finished session whose tab failed to open. */
const UNOPENED_SESSION_KEY = 'openscreenshot:unopened-session';

/** Load recorder toggles, merged over the defaults so new fields are always present. */
async function getRecSettings(): Promise<RecordingSettings> {
  const stored = await chrome.storage.local.get(REC_SETTINGS_KEY);
  const partial = (stored[REC_SETTINGS_KEY] ?? {}) as Partial<RecordingSettings>;
  return { ...DEFAULT_RECORDING_SETTINGS, ...partial };
}

/** Persist recorder toggles as-is (caller merges the patch). */
async function setRecSettings(next: RecordingSettings): Promise<void> {
  await chrome.storage.local.set({ [REC_SETTINGS_KEY]: next });
}

/** mm:ss from recorded ms, pauses already excluded by the caller. */
function formatElapsed(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

// Reopen the stashed capture in the editor (the stash survives editor loads).
// Closes only once the tab exists, so a create that failed leaves the popup
// up rather than making a dead click look like a completed one.
async function openEditor(): Promise<boolean> {
  try {
    await chrome.tabs.create({ url: chrome.runtime.getURL('src/editor/index.html') });
  } catch {
    return false;
  }
  window.close();
  return true;
}

type ToastTone = 'info' | 'success' | 'error';
interface Toast {
  id: number;
  message: string;
  tone: ToastTone;
  /** Set when this toast is a reported failure, so a graver one can retire it. */
  failure?: RecFailure;
}

interface ModeDef {
  id: CaptureMode;
  command: string;
  titleKey: string;
  subtitleKey: string;
}

const ACTION_LABEL_KEYS: Record<CaptureAction, string> = {
  editor: 'actionEditor',
  clipboard: 'actionClipboard',
  download: 'actionDownload',
};

const MODES: ModeDef[] = [
  {
    id: 'full-page',
    command: 'capture-full-page',
    titleKey: 'modeFullPage',
    subtitleKey: 'modeFullPageSub',
  },
  {
    id: 'visible',
    command: 'capture-visible',
    titleKey: 'modeVisible',
    subtitleKey: 'modeVisibleSub',
  },
  {
    id: 'region',
    command: 'capture-region',
    titleKey: 'modeRegion',
    subtitleKey: 'modeRegionSub',
  },
];

export function App() {
  const [settings, setSettingsState] = useState<Settings>(DEFAULT_SETTINGS);
  const [showSettings, setShowSettings] = useState(false);
  const [busy, setBusy] = useState<CaptureMode | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [shortcuts, setShortcuts] = useState<Record<string, string>>({});
  const [hasStash, setHasStash] = useState(false);
  const [hasRegion, setHasRegion] = useState(false);
  const [recState, setRecState] = useState<RecState | null>(null);
  const [recSettings, setRecSettingsState] = useState<RecordingSettings>(
    DEFAULT_RECORDING_SETTINGS,
  );
  const [activeTabProtected, setActiveTabProtected] = useState(false);
  const [activeTabId, setActiveTabId] = useState<number | null>(null);
  const [continueSessionId, setContinueSessionId] = useState<string | null>(null);
  const [displayMs, setDisplayMs] = useState(0);
  const [deviceStates, setDeviceStates] = useState<{
    camera: DevicePermission;
    mic: DevicePermission;
  }>({ camera: 'prompt', mic: 'prompt' });
  // null until the first query answers — see onRecordClick.
  const [hasTabCapture, setHasTabCapture] = useState<boolean | null>(null);
  const [tabCaptureRefused, setTabCaptureRefused] = useState(false);

  // Load settings + apply theme on mount.
  useEffect(() => {
    void getSettings().then((s) => {
      setSettingsState(s);
      applyTheme(s.theme);
    });
    // Actual (possibly user-remapped) bindings, formatted per platform by Chrome.
    void chrome.commands.getAll().then((cmds) => {
      const map: Record<string, string> = {};
      for (const c of cmds) if (c.name && c.shortcut) map[c.name] = c.shortcut;
      setShortcuts(map);
    });
    void hasLastCapture().then(setHasStash);
    void getLastRegion().then((r) => setHasRegion(r != null));
  }, []);

  // Live-update a "system" theme setting when the OS preference flips.
  useEffect(() => watchSystemTheme(() => void getSettings().then((s) => applyTheme(s.theme))), []);

  // Recorder: settings, active tab, a pending continue-session, and current state.
  useEffect(() => {
    void getRecSettings().then(setRecSettingsState);
    void queryDeviceStates().then(setDeviceStates);
    void chrome.permissions
      .contains({ permissions: ['tabCapture'] })
      .then(async (granted) => {
        setHasTabCapture(granted);
        // A parked click still sitting here with the grant still missing means
        // the last Record click asked and never got it: Chrome's dialog tore
        // that popup down, so the refusal had nowhere to show. Show it now.
        // It is consumed on sight, so it says its piece once rather than
        // nagging every open after. A grant that did land is not this popup's
        // to consume — permissions.onAdded in the worker owns that click.
        if (granted) return;
        const stored = await chrome.storage.session.get(PENDING_RECORD_KEY);
        const parked = stored[PENDING_RECORD_KEY] as PendingRecord | undefined;
        if (parked === undefined) return;
        await chrome.storage.session.remove(PENDING_RECORD_KEY);
        // A park whose request never went out says nothing about permission:
        // clear it, stay quiet. Only an asked-and-unanswered click is a refusal.
        if (parked.asked) setTabCaptureRefused(true);
      })
      .catch(() => setHasTabCapture(null));
    void chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
      setActiveTabProtected(isProtectedUrl(tab?.url));
      setActiveTabId(tab?.id ?? null);
    });
    void chrome.storage.session.get(CONTINUE_SESSION_KEY).then((stored) => {
      setContinueSessionId((stored[CONTINUE_SESSION_KEY] as string | undefined) ?? null);
    });
    void sendToBackground({ type: 'REC_QUERY' })
      .then((res) => setRecState(res as RecState))
      .catch(() => {});
  }, []);

  // Tick the on-screen timer locally from the elapsed baseline the worker reported.
  useEffect(() => {
    if (!recState?.active) return;
    const baseMs = recState.elapsedMs ?? 0;
    setDisplayMs(baseMs);
    // No zero to tick from until the engine reports in; the row says
    // "Starting" instead, and the next popup open reads the real elapsed.
    if (recState.paused || recState.anchored === false) return;
    const start = Date.now();
    const id = setInterval(() => setDisplayMs(baseMs + (Date.now() - start)), 250);
    return () => clearInterval(id);
  }, [recState?.active, recState?.paused, recState?.anchored, recState?.elapsedMs]);

  // 1/2/3 fire a capture while the mode list is showing.
  useEffect(() => {
    if (showSettings) return;
    const onKey = (e: KeyboardEvent) => {
      const i = ['1', '2', '3'].indexOf(e.key);
      if (i !== -1) capture(MODES[i].id);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showSettings, busy]);

  /**
   * Read out a recording failure the worker had nowhere to show. Every worker
   * failure lands with this popup already closed — it hands the click over
   * and goes — so the worker parks the failure in session storage and this is
   * where it surfaces. Consumed on sight, so it says its piece once; removing
   * the key is also what tells the worker to drop the '!' badge.
   */
  useEffect(() => {
    void (async () => {
      const stored = await chrome.storage.session.get(REC_FAILURE_KEY).catch(() => ({}));
      const failure: unknown = (stored as Record<string, unknown>)[REC_FAILURE_KEY];
      if (!isRecFailure(failure)) return;
      await chrome.storage.session.remove(REC_FAILURE_KEY).catch(() => {});
      showFailure(failure);
    })();
  }, []);

  // A failure that lands while this popup is open reaches it directly; the
  // parked copy is then redundant and is dropped so the next open is quiet.
  useEffect(() => {
    const listener = (message: unknown) => {
      if (!message || typeof message !== 'object') return;
      if ((message as { type?: unknown }).type !== REC_FAILURE_MESSAGE) return;
      const failure: unknown = (message as { failure?: unknown }).failure;
      if (!isRecFailure(failure)) return;
      void chrome.storage.session.remove(REC_FAILURE_KEY).catch(() => {});
      showFailure(failure);
    };
    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, []);

  // Listen for background progress / completion / errors.
  useEffect(() => {
    const off = onPopupMessage((msg: PopupMessage) => {
      switch (msg.type) {
        case 'CAPTURE_COMPLETE':
          setBusy(null);
          setProgress(null);
          window.close();
          break;
        case 'CAPTURE_ERROR':
          setBusy(null);
          setProgress(null);
          pushToast(msg.message, 'error');
          break;
        case 'CAPTURE_PROGRESS':
          setProgress(msg.percent);
          break;
      }
    });
    return off;
  }, []);

  function pushToast(message: string, tone: ToastTone, failure?: RecFailure) {
    const id = Date.now() + Math.random();
    setToasts((t) => [
      // Error toasts never expire, so a superseded one does not fade out of
      // the way — it sits on screen next to the message correcting it until
      // the user dismisses it by hand. "The cursor track isn't being saved.
      // The video is fine." is a standing false statement once the video is
      // going too, whichever order the two arrive in. Same precedence rule
      // the worker uses to decide what to park, applied to the surface.
      ...(failure
        ? t.filter(
            (x) =>
              !(
                x.failure &&
                sameRun(x.failure, failure) &&
                supersedes(failure.code, x.failure.code)
              ),
          )
        : t),
      { id, message, tone, failure },
    ]);
    // An error is a state the user has to read. Info and success are transient.
    if (tone !== 'error') {
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
    }
  }

  /** Show one of the mapped recording failures on this popup. */
  function pushFailure(code: RecFailureCode) {
    showFailure({ code, at: Date.now() });
  }

  /** Show a failure the worker reported, retiring anything it makes untrue. */
  function showFailure(failure: RecFailure) {
    pushToast(t(recFailureMessageKey(failure.code)), 'error', failure);
  }

  // The setup page is the only fix for a refused grant or a blocked device,
  // so a handoff that does not happen has to be said out loud. No worker is
  // involved in opening a tab, so this is not `couldNotReach`.
  function goSetup(from?: 'record') {
    void openSetupPage(from).then((ok) => {
      if (!ok) pushToast(t('popupOpenFailed'), 'error');
    });
  }

  function dismissToast(id: number) {
    setToasts((t) => t.filter((x) => x.id !== id));
  }

  async function updateSettings(patch: Partial<Settings>) {
    const next = await setSettings(patch);
    setSettingsState(next);
    if (patch.theme) applyTheme(next.theme);
  }

  function capture(mode: CaptureMode, repeat = false) {
    if (busy) return;
    setBusy(mode);
    // Region needs the page free for the overlay, a delayed capture needs it
    // free so the user can set up the hover state, and a clipboard capture
    // needs the page focused before it can write — all three close the popup.
    const quickCopy = normalizeCaptureAction(settings.captureAction) === 'clipboard';
    if (mode === 'region' || normalizeCaptureDelay(settings.captureDelay) > 0 || quickCopy) {
      // Close only AFTER the request is delivered — closing first can drop the
      // message to a cold service worker, so region would silently no-op on the
      // first click and only work once the worker is warm.
      void sendToBackground({ type: 'CAPTURE_REQUEST', mode, repeat }).then(
        () => window.close(),
        () => {
          // The request never reached the worker, so nothing is about to take
          // over the page — the popup stays up and says why, exactly as the
          // non-closing branch below already does.
          setBusy(null);
          pushToast(t('couldNotReach'), 'error');
        },
      );
      return;
    }
    setProgress(0);
    sendToBackground({ type: 'CAPTURE_REQUEST', mode, repeat }).catch(() => {
      setBusy(null);
      setProgress(null);
      pushToast(t('couldNotReach'), 'error');
    });
  }

  async function updateRecSettings(patch: Partial<RecordingSettings>) {
    const next = { ...recSettings, ...patch };
    setRecSettingsState(next);
    await setRecSettings(next);
  }

  // Recording needs the page, so the popup closes right after handing off —
  // same reasoning as region mode in capture().
  async function startRecording() {
    // Only reachable before the mount query has answered (see onRecordClick);
    // a grant that is genuinely missing goes to the setup page to be fixed.
    if (hasTabCapture == null) {
      const granted = await chrome.permissions.contains({ permissions: ['tabCapture'] });
      if (!granted) {
        goSetup('record');
        return;
      }
    }
    void sendToBackground({
      type: 'REC_START',
      settings: recSettings,
      continueSessionId: continueSessionId ?? undefined,
      // Only this side can answer it: `navigator.permissions` needs a
      // document, and the worker has none. Without it the start waits up to
      // 15s for a permission frame that had nothing to ask.
      devicesGranted: devicesGranted(recSettings, deviceStates),
    }).then(
      async () => {
        // Spent only once the worker has the click. Cleared ahead of the send
        // as it used to be, a start that never landed would also silently
        // lose the pending "Continue recording".
        await chrome.storage.session.remove(CONTINUE_SESSION_KEY).catch(() => {});
        window.close();
      },
      () => pushFailure('start-unreachable'),
    );
  }

  /**
   * Ask Chrome for tabCapture from the Record click itself. Two constraints
   * shape this:
   *
   * - `chrome.permissions.request` needs a user gesture, and no part of the
   *   ask may go through the worker, which has none. The await ahead of it is
   *   safe: transient activation is time-bounded (~5s), not task-bounded, and
   *   a live probe against the packed extension measured this write keeping
   *   the gesture while a 6.5s wait loses it (task-31-report.md).
   * - Chrome's dialog can tear this popup down, which kills everything after
   *   the request's await. So the click is parked first — awaited, so it is
   *   durable before the dialog can appear — and `permissions.onAdded` in the
   *   worker starts the recording. That path runs whether this popup lived or
   *   died, which is why nothing is started from here on success.
   */
  async function requestTabCapture(tabId: number) {
    const pending: PendingRecord = {
      settings: recSettings,
      continueSessionId: continueSessionId ?? undefined,
      tabId,
      at: Date.now(),
      // Parked with the click: Chrome's dialog can tear this popup down, and
      // the worker that picks the click up cannot read this for itself.
      devicesGranted: devicesGranted(recSettings, deviceStates),
    };
    let parked = true;
    await chrome.storage.session.set({ [PENDING_RECORD_KEY]: pending }).catch(() => {
      parked = false;
    });
    // Dispatched, not awaited: the request IPC is on its way the moment this
    // returns, so a teardown from here on is a click that did ask. Marking it
    // is best-effort on purpose — a mark that never lands leaves the record
    // looking un-asked, and staying quiet is the safe way to be wrong.
    const asking = chrome.permissions.request({ permissions: ['tabCapture'] });
    void chrome.storage.session
      .set({ [PENDING_RECORD_KEY]: { ...pending, asked: true } })
      .catch(() => {});
    try {
      if (await asking) {
        // A park that failed leaves the worker nothing to act on, so this
        // popup — which evidently survived the dialog — has to start it.
        if (parked) window.close();
        else void startRecording();
        return;
      }
    } catch {
      // A request Chrome refused outright reads the same as a declined one.
    }
    await chrome.storage.session.remove(PENDING_RECORD_KEY).catch(() => {});
    setTabCaptureRefused(true);
  }

  function onRecordClick() {
    if (activeTabProtected) {
      pushToast(t('recProtected'), 'error');
      return;
    }
    if (hasTabCapture === false) {
      // With no tab id there is nothing to aim a parked click at, and the
      // worker would refuse it; the setup page can still take the grant.
      if (activeTabId == null) goSetup('record');
      else void requestTabCapture(activeTabId);
      return;
    }
    void startRecording();
  }

  /**
   * Hand a stop or a cancel to the worker. Both used to close in a `finally`,
   * so a gesture that never arrived left the recording running with the
   * popup gone — the user's only evidence was the REC badge staying put.
   */
  function sendRecControl(type: 'REC_STOP' | 'REC_CANCEL') {
    void sendToBackground({ type }).then(
      () => window.close(),
      () => pushFailure('control-unreachable'),
    );
  }

  function stopRecording() {
    sendRecControl('REC_STOP');
  }

  function cancelRecording() {
    sendRecControl('REC_CANCEL');
  }

  function recoverRecording(sessionId: string) {
    // Retires a "the recorder page would not open" offer: the user is opening
    // it now, so it must not still be offered on every popup after this.
    void chrome.storage.session.remove(UNOPENED_SESSION_KEY).catch(() => {});
    void chrome.tabs
      .create({
        url: chrome.runtime.getURL('src/recorder/index.html') + '?session=' + sessionId,
      })
      .then(
        () => window.close(),
        () => pushToast(t('popupOpenFailed'), 'error'),
      );
  }

  return (
    <div class="app">
      <header class="header">
        {showSettings ? (
          <>
            <button
              class="icon-btn"
              title={t('backAria')}
              aria-label={t('backAria')}
              onClick={() => setShowSettings(false)}
            >
              <IconBack size={16} />
            </button>
            <span class="brand-name">{t('settingsTitle')}</span>
          </>
        ) : (
          <>
            <div class="brand">
              <span class="brand-mark" aria-hidden="true">
                <BrandMark size={28} />
              </span>
              <span class="brand-name">OpenScreenShot</span>
            </div>
            <button
              class="icon-btn"
              title={t('settingsTitle')}
              aria-label={t('settingsTitle')}
              onClick={() => setShowSettings(true)}
            >
              <IconGear size={16} />
            </button>
          </>
        )}
      </header>

      <div class="toasts" aria-live="polite">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            class={`toast toast-${toast.tone}`}
            /* role="alert" brings its own assertive live region; role="status"
               would leave the container's polite one as the only signal for a
               message the user has to act on. Matches the recorder page. */
            role={toast.tone === 'error' ? 'alert' : 'status'}
          >
            <span class="toast-text">{toast.message}</span>
            {toast.tone === 'error' ? (
              <button
                class="toast-dismiss"
                aria-label={t('dismiss')}
                title={t('dismiss')}
                onClick={() => dismissToast(toast.id)}
              >
                ×
              </button>
            ) : null}
          </div>
        ))}
      </div>

      {showSettings ? (
        <SettingsView settings={settings} onChange={updateSettings} onSetup={() => goSetup()} />
      ) : (
        <>
          <PinHint />
          <span class="settings-section">{t('popupSectionScreenshot')}</span>
          <nav class="modes" aria-label={t('captureModesAria')}>
            {MODES.map((m, i) => {
              const isBusy = busy === m.id;
              const keys = resolveModeKeys(m.command, i, shortcuts);
              return (
                <button
                  key={m.id}
                  class="mode-card"
                  data-busy={isBusy ? 'true' : undefined}
                  disabled={!!busy}
                  title={
                    keys.osShortcut
                      ? chrome.i18n.getMessage('popupDigitHint', keys.digit)
                      : undefined
                  }
                  onClick={() => capture(m.id)}
                >
                  <span class="mode-icon" aria-hidden="true">
                    <ModeIcon id={m.id} />
                  </span>
                  <span class="mode-text">
                    <span class="mode-title">{t(m.titleKey)}</span>
                    <span class="mode-sub">
                      {isBusy
                        ? m.id === 'full-page' && progress != null
                          ? t('capturing') + ' ' + progress + '%'
                          : t('capturing')
                        : t(m.subtitleKey)}
                    </span>
                  </span>
                  {isBusy ? (
                    <span class="spinner" aria-label={t('capturing')} />
                  ) : (
                    <span class="mode-keys">
                      {keys.osShortcut ? (
                        <kbd class="kbd-os">{keys.osShortcut}</kbd>
                      ) : (
                        <kbd>{keys.digit}</kbd>
                      )}
                    </span>
                  )}
                  {isBusy && m.id === 'full-page' && progress != null ? (
                    <div class="progress" aria-hidden="true">
                      <div class="progress-fill" style={{ width: `${progress}%` }} />
                    </div>
                  ) : null}
                </button>
              );
            })}
          </nav>

          <span class="settings-section">{t('popupSectionRecord')}</span>
          {recState?.active ? (
            <div class="mode-card rec-live">
              <span class="rec-dot" aria-hidden="true" />
              <span class="mode-text">
                <span class="mode-title">
                  {recState.paused ? t('recPaused') : t('recRecording')}
                </span>
                <span class="mode-sub">
                  {recState.anchored === false ? t('recStarting') : formatElapsed(displayMs)}
                </span>
              </span>
              <span class="mode-keys">
                <button class="seg-btn" onClick={stopRecording}>
                  {t('recStop')}
                </button>
                <button class="seg-btn" onClick={cancelRecording}>
                  {t('recCancel')}
                </button>
              </span>
            </div>
          ) : (
            <button
              class="mode-card"
              data-testid="rec-start"
              aria-disabled={activeTabProtected}
              title={activeTabProtected ? t('recProtected') : undefined}
              onClick={onRecordClick}
            >
              <span class="mode-icon" aria-hidden="true">
                <IconRecordDot size={20} />
              </span>
              <span class="mode-text">
                <span class="mode-title">{t(continueSessionId ? 'recContinue' : 'recTitle')}</span>
                <span class="mode-sub">{t('recSub')}</span>
              </span>
            </button>
          )}

          {/* The Record click asks Chrome for tabCapture — the assurance sits
              with it until that grant lands. */}
          {!recState?.active && hasTabCapture === false && <TrustStrip testid="rec-trust" />}

          {/* The prompt was refused: the setup page is where it is fixed. */}
          {tabCaptureRefused && (
            <button class="perm-chip" data-testid="rec-refused" onClick={() => goSetup('record')}>
              {t('popupRecordRefused')}
            </button>
          )}

          {recState?.active ? null : (
            <div class="rec-sources">
              <span class="rec-sources-label">{t('recSourceLabel')}</span>
              <div class="chip-row" role="group" aria-label={t('recSourceLabel')}>
                <button
                  class="chip-toggle"
                  aria-pressed={recSettings.mic}
                  onClick={() => updateRecSettings({ mic: !recSettings.mic })}
                >
                  {t('recMic')}
                </button>
                <button
                  class="chip-toggle"
                  aria-pressed={recSettings.tabAudio}
                  onClick={() => updateRecSettings({ tabAudio: !recSettings.tabAudio })}
                >
                  {t('recTabAudio')}
                </button>
                <button
                  class="chip-toggle"
                  aria-pressed={recSettings.webcam}
                  onClick={() => updateRecSettings({ webcam: !recSettings.webcam })}
                >
                  {t('recWebcam')}
                </button>
              </div>
            </div>
          )}

          {recState?.active
            ? null
            : popupWarnings(recSettings, deviceStates).map((device) => (
                <button key={device} class="perm-chip" onClick={() => goSetup()}>
                  {chrome.i18n.getMessage(
                    'popupPermissionChip',
                    t(device === 'mic' ? 'recMic' : 'recWebcam'),
                  )}
                </button>
              ))}

          {recState?.recoverableSessionId && !recState.active ? (
            <div class="footer-row">
              <button
                class="link-btn"
                onClick={() => recoverRecording(recState.recoverableSessionId as string)}
              >
                {t('recRecover')}
              </button>
            </div>
          ) : null}

          <span class="settings-section">{t('popupSectionOptions')}</span>
          <div class="options-group">
            <div class="settings-row">
              <span class="settings-label">{t('delayLabel')}</span>
              <div class="seg">
                {CAPTURE_DELAYS.map((d) => (
                  <button
                    key={d}
                    class="seg-btn"
                    aria-pressed={normalizeCaptureDelay(settings.captureDelay) === d}
                    onClick={() => updateSettings({ captureDelay: d })}
                  >
                    {d === 0 ? t('delayOff') : `${d}s`}
                  </button>
                ))}
              </div>
            </div>

            <div class="settings-row">
              <span class="settings-label">{t('afterCaptureLabel')}</span>
              <div class="seg">
                {CAPTURE_ACTIONS.map((a) => (
                  <button
                    key={a}
                    class="seg-btn"
                    aria-pressed={normalizeCaptureAction(settings.captureAction) === a}
                    onClick={() => updateSettings({ captureAction: a })}
                  >
                    {t(ACTION_LABEL_KEYS[a])}
                  </button>
                ))}
              </div>
            </div>
            {normalizeCaptureAction(settings.captureAction) === 'download' ? (
              <span class="settings-hint">{t('actionHintPng')}</span>
            ) : null}

            <div class="settings-row">
              <span class="settings-label">{t('expressLabel')}</span>
              <div class="seg">
                <button
                  class="seg-btn"
                  aria-pressed={!settings.expressMode}
                  onClick={() => updateSettings({ expressMode: false })}
                >
                  {t('expressOff')}
                </button>
                <button
                  class="seg-btn"
                  aria-pressed={settings.expressMode}
                  onClick={() => updateSettings({ expressMode: true })}
                >
                  {t('expressOn')}
                </button>
              </div>
            </div>
            {settings.expressMode ? <span class="settings-hint">{t('expressHint')}</span> : null}
          </div>

          <div class="divider" />

          <div class="footer-row">
            <button
              class="link-btn"
              onClick={() => {
                void openEditor().then((ok) => {
                  if (!ok) pushToast(t('popupOpenFailed'), 'error');
                });
              }}
              disabled={!hasStash}
              title={hasStash ? t('reopenLast') : t('reopenLastDisabledTitle')}
            >
              {t('reopenLast')}
            </button>
            <button
              class="link-btn"
              onClick={() => {
                void chrome.tabs
                  .create({ url: chrome.runtime.getURL('src/recorder/index.html') })
                  .then(
                    () => window.close(),
                    () => pushToast(t('popupOpenFailed'), 'error'),
                  );
              }}
              title={t('recRecordings')}
            >
              {t('recRecordings')}
            </button>
            <button
              class="link-btn"
              onClick={() => capture('region', true)}
              disabled={!hasRegion || !!busy}
              title={hasRegion ? t('repeatLastRegion') : t('repeatRegionDisabledTitle')}
            >
              {t('repeatLastRegion')}
            </button>
            <button class="link-btn" onClick={openShortcutSettings} title={t('customizeShortcuts')}>
              {t('footerShortcuts')}
            </button>
            <button class="link-btn kofi-link" onClick={openKofi} title={t('supportKofiTitle')}>
              <IconCoffee size={13} />
              {t('footerKofi')}
            </button>
            <button
              class="link-btn kofi-link"
              onClick={openCoolStuff}
              title={t('coolStuffTitle')}
              aria-label={t('footerCoolStuff')}
            >
              <IconGift size={13} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function SettingsView({
  settings,
  onChange,
  onSetup,
}: {
  settings: Settings;
  onChange: (patch: Partial<Settings>) => void;
  /** Owned by App, which has the toast surface a failed handoff needs. */
  onSetup: () => void;
}) {
  const filenameRef = useRef<HTMLInputElement>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [acrossSites, setAcrossSites] = useState(false);
  const showQuality = settings.defaultFormat === 'jpeg' || settings.defaultFormat === 'webp';

  useEffect(() => {
    void chrome.permissions.contains({ origins: ['<all_urls>'] }).then(setAcrossSites);
  }, []);

  async function toggleAcrossSites(next: boolean) {
    if (next) {
      const granted = await chrome.permissions.request({ origins: ['<all_urls>'] });
      setAcrossSites(granted);
    } else {
      await chrome.permissions.remove({ origins: ['<all_urls>'] });
      setAcrossSites(await chrome.permissions.contains({ origins: ['<all_urls>'] }));
    }
  }

  function insertAtCaret(token: string) {
    const el = filenameRef.current;
    if (!el) return;
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;
    const next = insertToken(el.value, start, end, token);
    onChange({ filenameTemplate: next.value });
    // The value arrives on the next render, so restore the caret after it.
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(next.caret, next.caret);
    });
  }

  function resetAll() {
    if (!confirmReset) {
      setConfirmReset(true);
      setTimeout(() => setConfirmReset(false), 3000);
      return;
    }
    setConfirmReset(false);
    onChange({ ...DEFAULT_SETTINGS });
  }

  return (
    <div class="settings">
      <div class="settings-row">
        <span class="settings-label">{t('settingsTheme')}</span>
        <div class="seg">
          {(['light', 'dark', 'system'] as const).map((v) => (
            <button
              key={v}
              class="seg-btn"
              aria-pressed={settings.theme === v}
              onClick={() => onChange({ theme: v })}
            >
              {t('theme' + v.charAt(0).toUpperCase() + v.slice(1))}
            </button>
          ))}
        </div>
      </div>

      <div class="settings-row settings-row-col">
        <span class="settings-label">{t('settingsDefaultFormat')}</span>
        <div class="seg-grid">
          {(['png', 'jpeg', 'webp', 'pdf'] as const).map((f) => (
            <button
              key={f}
              class="seg-btn"
              aria-pressed={settings.defaultFormat === f}
              onClick={() => onChange({ defaultFormat: f as ExportFormat })}
            >
              {t('format' + f.charAt(0).toUpperCase() + f.slice(1))}
            </button>
          ))}
        </div>
      </div>

      {showQuality ? (
        <div class="settings-row">
          <span class="settings-label">
            {t('settingsQuality')} · {Math.round(settings.quality * 100)}%
          </span>
          <input
            class="range"
            type="range"
            min="0.1"
            max="1"
            step="0.05"
            aria-label={t('settingsQuality')}
            aria-valuetext={`${Math.round(settings.quality * 100)}%`}
            value={settings.quality}
            onInput={(e) => onChange({ quality: Number((e.target as HTMLInputElement).value) })}
          />
        </div>
      ) : null}

      <div class="settings-row settings-row-col">
        <span class="settings-label">{t('settingsFilename')}</span>
        <input
          ref={filenameRef}
          class="text-input"
          type="text"
          spellcheck={false}
          aria-label={t('settingsFilename')}
          value={settings.filenameTemplate}
          onInput={(e) => onChange({ filenameTemplate: (e.target as HTMLInputElement).value })}
        />
        <div class="token-row">
          <span class="token-label">{t('filenameInsert')}</span>
          {FILENAME_TOKENS.map((tok) => (
            <button key={tok} class="token-chip" onClick={() => insertAtCaret(tok)}>
              {tok}
            </button>
          ))}
        </div>
        <span class="settings-hint">{previewFilename(settings)}</span>
      </div>

      <div class="settings-row">
        <span class="settings-label">{t('popupSetupLink')}</span>
        <button class="link-btn" onClick={onSetup}>
          {t('setupTitle')}
        </button>
      </div>

      <div class="settings-row">
        <span class="settings-label">{t('recAcrossSites')}</span>
        <div class="seg">
          <button
            class="seg-btn"
            aria-pressed={!acrossSites}
            onClick={() => toggleAcrossSites(false)}
          >
            {t('recOff')}
          </button>
          <button
            class="seg-btn"
            aria-pressed={acrossSites}
            onClick={() => toggleAcrossSites(true)}
          >
            {t('recOn')}
          </button>
        </div>
      </div>
      <span class="settings-hint">{t('recAcrossSitesHint')}</span>
      {/* Turning this on asks Chrome for <all_urls>, so the assurance sits
          with it too, until that grant lands. */}
      {!acrossSites && <TrustStrip testid="sites-trust" />}

      <div class="divider" />
      <button
        class="link-btn reset-btn"
        data-armed={confirmReset ? 'true' : undefined}
        onClick={resetAll}
      >
        {confirmReset ? t('resetConfirm') : t('resetDefaults')}
      </button>
    </div>
  );
}

/**
 * The local-only assurance that rides with a permission ask. Every surface
 * that asks carries it, so it renders next to the control that triggers the
 * prompt and only while that prompt is still to come. Nothing here claims an
 * audit — none exists to cite.
 */
function TrustStrip({ testid }: { testid: string }) {
  return (
    <div class="rec-trust" data-testid={testid}>
      <div class="rec-trust-pills">
        <a
          class="rec-trust-pill"
          href="https://github.com/pghqdev/OpenScreenShot"
          target="_blank"
          rel="noreferrer"
        >
          <IconCode /> {t('setupTrustOpenSource')}
        </a>
        <span class="rec-trust-pill">
          <IconShield /> {t('setupTrustLocal')}
        </span>
        <span class="rec-trust-pill">
          <IconEyeOff /> {t('setupTrustNoTracking')}
        </span>
      </div>
      <span class="rec-trust-hint">{t('setupTrustHint')}</span>
    </div>
  );
}

/**
 * Chrome does not pin an extension on install, so a new user reaches this
 * popup through the puzzle menu every time until they pin it. One-shot: the
 * only way to pin is the puzzle menu, which closes this popup, so there is
 * nothing to poll for.
 */
function PinHint() {
  const [pinned, setPinned] = useState<boolean | null>(null);

  useEffect(() => {
    if (!chrome.action?.getUserSettings) return;
    chrome.action
      .getUserSettings()
      .then((s) => setPinned(s.isOnToolbar))
      .catch(() => setPinned(null));
  }, []);

  if (pinned !== false) return null;
  return (
    <div class="pin-hint" data-testid="pin-hint">
      <strong>{t('setupPinTitle')}</strong>
      <span>{t('setupPinSub')}</span>
    </div>
  );
}

function ModeIcon({ id }: { id: CaptureMode }) {
  switch (id) {
    case 'full-page':
      return <IconPage />;
    case 'visible':
      return <IconVisible />;
    case 'region':
      return <IconRegion />;
  }
}

/** Sample resolution of the template, shown live under the settings input. */
function previewFilename(settings: Settings): string {
  const ext = settings.defaultFormat === 'jpeg' ? 'jpg' : settings.defaultFormat;
  const base = formatFilename(settings.filenameTemplate, {
    title: 'Example Page',
    url: 'https://www.example.com/page',
    width: 1920,
    height: 1080,
  });
  return `${base}.${ext}`;
}
