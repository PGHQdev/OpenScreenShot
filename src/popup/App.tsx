import { useEffect, useRef, useState } from 'preact/hooks';
import type { CaptureMode, ExportFormat, PopupMessage, Settings } from '../shared/types';
import { DEFAULT_SETTINGS } from '../shared/types';
import { getLastRegion, getSettings, hasLastCapture, setSettings } from '../shared/storage';
import { onPopupMessage, sendToBackground } from '../shared/messaging';
import { BrandMark } from '../shared/BrandMark';
import { resolveModeKeys } from '../shared/shortcuts';
import {
  CAPTURE_DELAYS,
  FILENAME_TOKENS,
  formatFilename,
  insertToken,
  normalizeCaptureDelay,
} from '../shared/utils';

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
    // Region needs the page free for the overlay; a delayed capture needs it
    // free so the user can set up the hover state — both close the popup.
    if (mode === 'region' || normalizeCaptureDelay(settings.captureDelay) > 0) {
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
  const showQuality = settings.defaultFormat === 'jpeg' || settings.defaultFormat === 'webp';

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
      <button class="btn-primary" onClick={onDone}>
        {t('welcomeCta')}
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
