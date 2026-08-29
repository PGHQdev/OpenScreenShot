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
  popupWarnings,
  type DevicePermission,
  type PendingRecord,
} from '../shared/permissions';
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
 */
function openSetupPage(from?: 'record') {
  const base = chrome.runtime.getURL('src/setup/index.html');
  const url = base + (from ? `?from=${from}` : '');
  void (async () => {
    try {
      const [tab] = await chrome.tabs.query({ url: base + '*' });
      if (tab?.id != null) {
        await chrome.tabs.update(tab.id, { active: true, url });
        if (tab.windowId != null) await chrome.windows.update(tab.windowId, { focused: true });
      } else {
        await chrome.tabs.create({ url });
      }
    } catch {
      await chrome.tabs.create({ url }).catch(() => {});
    } finally {
      window.close();
    }
  })();
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
function openEditor() {
  void chrome.tabs.create({ url: chrome.runtime.getURL('src/editor/index.html') });
  window.close();
}

type ToastTone = 'info' | 'success' | 'error';
interface Toast {
  id: number;
  message: string;
  tone: ToastTone;
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
      .then(setHasTabCapture)
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
    if (recState.paused) return;
    const start = Date.now();
    const id = setInterval(() => setDisplayMs(baseMs + (Date.now() - start)), 250);
    return () => clearInterval(id);
  }, [recState?.active, recState?.paused, recState?.elapsedMs]);

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

  function pushToast(message: string, tone: ToastTone) {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, tone }]);
    // An error is a state the user has to read. Info and success are transient.
    if (tone !== 'error') {
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
    }
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
      void sendToBackground({ type: 'CAPTURE_REQUEST', mode, repeat })
        .catch(() => {})
        .finally(() => window.close());
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
        openSetupPage('record');
        return;
      }
    }
    await chrome.storage.session.remove(CONTINUE_SESSION_KEY);
    void sendToBackground({
      type: 'REC_START',
      settings: recSettings,
      continueSessionId: continueSessionId ?? undefined,
    })
      .catch(() => {})
      .finally(() => window.close());
  }

  /**
   * Ask Chrome for tabCapture from the Record click itself. Two constraints
   * shape this:
   *
   * - `chrome.permissions.request` is only granted a dialog on a user gesture,
   *   so it is the first thing the click does — nothing is awaited before it,
   *   and no part of the ask goes through the worker, which has no gesture.
   * - The dialog can tear this popup down, which kills everything after the
   *   await. So the click is parked in session storage first (fire-and-forget,
   *   dispatched before the request) and `permissions.onAdded` in the worker
   *   starts the recording. That path runs whether this popup lived or died,
   *   which is also why nothing is started from here on success.
   */
  function requestTabCapture(tabId: number) {
    const pending: PendingRecord = {
      settings: recSettings,
      continueSessionId: continueSessionId ?? undefined,
      tabId,
      at: Date.now(),
    };
    void chrome.storage.session.set({ [PENDING_RECORD_KEY]: pending });
    chrome.permissions
      .request({ permissions: ['tabCapture'] })
      .then((granted) => {
        if (granted) {
          window.close();
          return;
        }
        void chrome.storage.session.remove(PENDING_RECORD_KEY);
        setTabCaptureRefused(true);
      })
      .catch(() => {
        void chrome.storage.session.remove(PENDING_RECORD_KEY);
        setTabCaptureRefused(true);
      });
  }

  function onRecordClick() {
    if (activeTabProtected) {
      pushToast(t('recProtected'), 'error');
      return;
    }
    if (hasTabCapture === false) {
      // With no tab id there is nothing to aim a parked click at, and the
      // worker would refuse it; the setup page can still take the grant.
      if (activeTabId == null) openSetupPage('record');
      else requestTabCapture(activeTabId);
      return;
    }
    void startRecording();
  }

  function stopRecording() {
    void sendToBackground({ type: 'REC_STOP' })
      .catch(() => {})
      .finally(() => window.close());
  }

  function cancelRecording() {
    void sendToBackground({ type: 'REC_CANCEL' })
      .catch(() => {})
      .finally(() => window.close());
  }

  function recoverRecording(sessionId: string) {
    void chrome.tabs.create({
      url: chrome.runtime.getURL('src/recorder/index.html') + '?session=' + sessionId,
    });
    window.close();
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
          <div key={toast.id} class={`toast toast-${toast.tone}`} role="status">
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
        <SettingsView settings={settings} onChange={updateSettings} />
      ) : (
        <>
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
                <span class="mode-sub">{formatElapsed(displayMs)}</span>
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

          {/*
            The Record click asks Chrome for tabCapture, and every surface
            that asks for a permission carries the assurance with it. It sits
            under Record while the grant is missing — the moment of the ask —
            and leaves once there is nothing left to ask for.
          */}
          {!recState?.active && hasTabCapture === false && (
            <div class="rec-trust" data-testid="rec-trust">
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
          )}

          {/* The prompt was refused: the setup page is where it is fixed. */}
          {tabCaptureRefused && (
            <button
              class="perm-chip"
              data-testid="rec-refused"
              onClick={() => openSetupPage('record')}
            >
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
                <button key={device} class="perm-chip" onClick={() => openSetupPage()}>
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
              onClick={openEditor}
              disabled={!hasStash}
              title={hasStash ? t('reopenLast') : t('reopenLastDisabledTitle')}
            >
              {t('reopenLast')}
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
}: {
  settings: Settings;
  onChange: (patch: Partial<Settings>) => void;
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
        <button class="link-btn" onClick={() => openSetupPage()}>
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
