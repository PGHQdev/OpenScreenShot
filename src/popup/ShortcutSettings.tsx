import { useEffect, useState } from 'preact/hooks';
import { IS_FIREFOX, RECORDING_SUPPORTED } from '../shared/browser';
import { openShortcutSettings } from '../shared/settings-navigation';

const t = (key: string) => chrome.i18n.getMessage(key) || key;
const captureCommands = [
  ['capture-full-page', 'modeFullPage'],
  ['capture-visible', 'modeVisible'],
  ['capture-region', 'modeRegion'],
];
const recordingCommands = [
  ['stop-recording', 'settingsStopRecording'],
  ['reveal-recording-bar', 'settingsRevealRecordingBar'],
];

export function ShortcutSettings() {
  const [commands, setCommands] = useState<chrome.commands.Command[] | null>(null);
  const [readError, setReadError] = useState(false);
  const [openError, setOpenError] = useState(false);
  useEffect(() => {
    let active = true;
    let generation = 0;
    async function refresh() {
      const current = ++generation;
      try {
        const next = await chrome.commands.getAll();
        if (active && current === generation) {
          setCommands(next);
          setReadError(false);
        }
      } catch {
        if (active && current === generation) {
          setCommands(null);
          setReadError(true);
        }
      }
    }
    const visible = () => {
      if (document.visibilityState === 'visible') void refresh();
    };
    void refresh();
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', visible);
    return () => {
      active = false;
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', visible);
    };
  }, []);

  async function open(action: () => Promise<unknown>) {
    try {
      await action();
      setOpenError(false);
    } catch {
      setOpenError(true);
    }
  }
  return (
    <section class="settings-group settings-shortcuts" aria-labelledby="settings-shortcuts">
      <h2 id="settings-shortcuts">{t('settingsKeyboardShortcuts')}</h2>
      <h3>{t('settingsBrowserShortcuts')}</h3>
      <p class="settings-hint">
        {t(IS_FIREFOX ? 'settingsBrowserScreenshotShortcutsHint' : 'settingsBrowserShortcutsHint')}
      </p>
      {readError && <p role="alert">{t('settingsShortcutsReadError')}</p>}
      <dl class="shortcut-bindings">
        {[...captureCommands, ...(RECORDING_SUPPORTED ? recordingCommands : [])].map(
          ([name, label]) => (
            <div key={name}>
              <dt>{t(label)}</dt>
              <dd>
                {commands ? (
                  <kbd>
                    {commands.find((c) => c.name === name)?.shortcut?.trim() ||
                      t('settingsShortcutUnassigned')}
                  </kbd>
                ) : (
                  '—'
                )}
              </dd>
            </div>
          ),
        )}
      </dl>
      <button class="btn-secondary shortcut-manage" onClick={() => void open(openShortcutSettings)}>
        {t('settingsChangeShortcuts')}
      </button>
      <p class="settings-hint">{t('settingsShortcutConflictHint')}</p>
      {IS_FIREFOX && <p class="settings-hint">{t('settingsFirefoxShortcutsHint')}</p>}
      <h3>{t('settingsEditorShortcuts')}</h3>
      <p class="settings-hint">{t('settingsEditorShortcutsHint')}</p>
      <button
        class="link-btn"
        onClick={() =>
          void open(() =>
            chrome.tabs.create({ url: chrome.runtime.getURL('src/editor/index.html?shortcuts=1') }),
          )
        }
      >
        {t('settingsViewEditorShortcuts')}
      </button>
      {openError && <p role="alert">{t('popupOpenFailed')}</p>}
    </section>
  );
}
