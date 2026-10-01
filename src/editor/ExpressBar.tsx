import { useEffect, useState } from 'preact/hooks';
import { getSettings, onSettingsChanged, setSettings } from '../shared/storage';
import { IconBolt } from '../shared/icons';
import { t } from './i18n';

/**
 * Always-on Express status: the toolbar icon's behavior is invisible from the
 * editor, so the state and its switch stay in view instead of hiding in Settings.
 */
export function ExpressBar() {
  const [on, setOn] = useState<boolean | null>(null);
  useEffect(() => {
    let active = true;
    const read = () =>
      void getSettings()
        .then((settings) => {
          if (active) setOn(settings.expressMode);
        })
        .catch(() => {
          /* A failed settings read must never block editing. */
        });
    read();
    // The icon's right-click checkbox and the settings page write the same flag.
    onSettingsChanged(read);
    return () => {
      active = false;
    };
  }, []);
  if (on === null) return null;
  return (
    <section class={`express-bar${on ? ' is-on' : ''}`} aria-label={t('expressLabel')}>
      <span class="express-bar-icon" aria-hidden="true">
        <IconBolt size={18} />
      </span>
      <p class="express-bar-copy" id="express-bar-copy">
        <strong>{on ? t('editorExpressOn') : t('editorExpressOff')}</strong>{' '}
        <span>{on ? t('settingsExpressHint') : t('editorExpressOffHint')}</span>
      </p>
      <input
        type="checkbox"
        class="switch"
        aria-label={t('expressLabel')}
        aria-describedby="express-bar-copy"
        checked={on}
        onChange={(e) => {
          const next = (e.currentTarget as HTMLInputElement).checked;
          setOn(next);
          void setSettings({ expressMode: next });
        }}
      />
    </section>
  );
}
