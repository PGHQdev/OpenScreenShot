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
import { popupWarnings, type DevicePermission } from '../shared/permissions';

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
 * Open the recording setup walkthrough; the popup hands off and closes.
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
  const [showWelcome, setShowWelcome] = useState(false);
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
  const [continueSessionId, setContinueSessionId] = useState<string | null>(null);
  const [displayMs, setDisplayMs] = useState(0);
  const [deviceStates, setDeviceStates] = useState<{
    camera: DevicePermission;
    mic: DevicePermission;
  }>({ camera: 'prompt', mic: 'prompt' });

  // Load settings + apply theme on mount.
  useEffect(() => {
    void getSettings().then((s) => {
      setSettingsState(s);
      setShowWelcome(s.showOnboarding);
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

  // Recorder: settings, active tab, a pending continue-session, and current state.
  useEffect(() => {
    void getRecSettings().then(setRecSettingsState);
    void queryDeviceStates().then(setDeviceStates);
    void chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
      setActiveTabProtected(isProtectedUrl(tab?.url));
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
    if (showSettings || showWelcome) return;
    const onKey = (e: KeyboardEvent) => {
      const i = ['1', '2', '3'].indexOf(e.key);
      if (i !== -1) capture(MODES[i].id);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showSettings, showWelcome, busy]);

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

  async function dismissWelcome() {
    setShowWelcome(false);
    const next = await setSettings({ showOnboarding: false });
    setSettingsState(next);
  }

  async function updateRecSettings(patch: Partial<RecordingSettings>) {
    const next = { ...recSettings, ...patch };
    setRecSettingsState(next);
    await setRecSettings(next);
  }

  // Recording needs the page, so the popup closes right after handing off —
  // same reasoning as region mode in capture().
  async function startRecording() {
    // The setup walkthrough owns the grant. Anything missing routes there —
    // an inline prompt here has no room for recovery when it goes wrong.
    const granted = await chrome.permissions.contains({ permissions: ['tabCapture'] });
    if (!granted) {
      openSetupPage('record');
      return;
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

  function onRecordClick() {
    if (activeTabProtected) {
      pushToast(t('recProtected'), 'error');
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
              <BackMark />
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
              <GearMark />
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
      ) : showWelcome ? (
        <Welcome onDone={dismissWelcome} />
      ) : (
        <>
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
                      {keys.osShortcut ? <kbd class="kbd-os">{keys.osShortcut}</kbd> : null}
                      <kbd>{keys.digit}</kbd>
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
                <RecordIcon />
              </span>
              <span class="mode-text">
                <span class="mode-title">{t(continueSessionId ? 'recContinue' : 'recTitle')}</span>
                <span class="mode-sub">{t('recSub')}</span>
              </span>
            </button>
          )}

          {recState?.active ? null : (
            <div class="seg seg-fill delay-row">
              <button
                class="seg-btn"
                aria-pressed={recSettings.mic}
                onClick={() => updateRecSettings({ mic: !recSettings.mic })}
              >
                {t('recMic')}
              </button>
              <button
                class="seg-btn"
                aria-pressed={recSettings.tabAudio}
                onClick={() => updateRecSettings({ tabAudio: !recSettings.tabAudio })}
              >
                {t('recTabAudio')}
              </button>
              <button
                class="seg-btn"
                aria-pressed={recSettings.webcam}
                onClick={() => updateRecSettings({ webcam: !recSettings.webcam })}
              >
                {t('recWebcam')}
              </button>
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

          <div class="settings-row delay-row">
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

          <div class="settings-row delay-row">
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

          <div class="settings-row delay-row">
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

          <div class="divider" />

          <div class="footer-row">
            <button
              class="link-btn"
              onClick={openEditor}
              disabled={!hasStash}
              title={t('reopenLast')}
            >
              {t('reopenLast')}
            </button>
            <button
              class="link-btn"
              onClick={() => capture('region', true)}
              disabled={!hasRegion || !!busy}
              title={t('repeatLastRegion')}
            >
              {t('repeatLastRegion')}
            </button>
            <button class="link-btn" onClick={openShortcutSettings} title={t('customizeShortcuts')}>
              {t('footerShortcuts')}
            </button>
            <button class="link-btn kofi-link" onClick={openKofi} title={t('supportKofiTitle')}>
              <CoffeeMark />
              {t('footerKofi')}
            </button>
            <button
              class="link-btn kofi-link"
              onClick={openCoolStuff}
              title={t('coolStuffTitle')}
              aria-label={t('footerCoolStuff')}
            >
              <GiftMark />
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
    // Keep showOnboarding as it is, so the welcome card does not come back.
    onChange({ ...DEFAULT_SETTINGS, showOnboarding: settings.showOnboarding });
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

function Welcome({ onDone }: { onDone: () => void }) {
  return (
    <div class="welcome">
      <div class="welcome-mark" aria-hidden="true">
        <BrandMark size={44} />
      </div>
      <h2 class="welcome-title">{t('welcomeTitle')}</h2>
      <p class="welcome-lede">{t('welcomeLede')}</p>
      <ul class="welcome-list">
        <li>{t('welcomeList1')}</li>
        <li>{t('welcomeList2')}</li>
        <li>{t('welcomeList3')}</li>
      </ul>
      <p class="welcome-perm">{t('welcomePerm')}</p>
      <button
        class="btn-primary"
        onClick={() => {
          onDone();
          openSetupPage();
        }}
      >
        {t('welcomeCta')}
      </button>
      <button class="link-btn" onClick={onDone}>
        {t('welcomeSkip')}
      </button>
    </div>
  );
}

function ModeIcon({ id }: { id: CaptureMode }) {
  const common = {
    width: 20,
    height: 20,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': 2,
    'stroke-linecap': 'round' as const,
    'stroke-linejoin': 'round' as const,
  };
  switch (id) {
    case 'full-page':
      return (
        <svg {...common}>
          <rect x="6" y="3" width="12" height="18" rx="2" />
          <path d="M9 8h6M9 12h6M9 16h4" />
        </svg>
      );
    case 'visible':
      return (
        <svg {...common}>
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
    case 'region':
      return (
        <svg {...common}>
          <rect x="4" y="5" width="16" height="14" rx="2" stroke-dasharray="4 3" />
        </svg>
      );
  }
}

function RecordIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="8" fill="currentColor" />
    </svg>
  );
}

function GearMark() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function CoffeeMark() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
      <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
      <line x1="6" x2="6" y1="2" y2="4" />
      <line x1="10" x2="10" y1="2" y2="4" />
      <line x1="14" x2="14" y1="2" y2="4" />
    </svg>
  );
}

function GiftMark() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="8" width="18" height="4" rx="1" />
      <path d="M12 8v13M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
      <path d="M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8s1-5 4.5-5a2.5 2.5 0 0 1 0 5" />
    </svg>
  );
}

function BackMark() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}

function applyTheme(theme: Settings['theme']) {
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  const dark = theme === 'dark' || (theme === 'system' && prefersDark);
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
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
