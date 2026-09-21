import { useEffect, useState } from 'preact/hooks';
import type { LastCapture } from '../shared/types';
import { getSettings } from '../shared/storage';
import { t } from './i18n';

// Kept outside preferences so resetting preferences does not repeat onboarding.
const SEEN_KEY = 'openscreenshot:express-settings-hint-seen';

export function ExpressHint({
  capture,
  onSettings,
  ready,
}: {
  capture: LastCapture | null;
  ready: boolean;
  onSettings: () => void;
}) {
  const [visible, setVisible] = useState(false);
  const eligible = ready && !!capture && capture.mode !== 'import';
  useEffect(() => {
    if (!eligible) return;
    let active = true;
    void Promise.all([getSettings(), chrome.storage.local.get(SEEN_KEY)])
      .then(async ([settings, stored]) => {
        if (!active || !settings.expressMode || stored[SEEN_KEY]) return;
        setVisible(true);
        await chrome.storage.local.set({ [SEEN_KEY]: true });
      })
      .catch(() => {
        /* A failed onboarding read must never block editing. */
      });
    return () => {
      active = false;
    };
  }, [eligible]);
  if (!visible || !eligible) return null;
  return (
    <aside class="express-settings-hint" aria-label={t('settingsTitle')}>
      <span role="status">{t('expressSettingsHint')}</span>
      <button class="btn-secondary" onClick={onSettings}>
        {t('settingsTitle')}
      </button>
      <button class="icon-btn" aria-label={t('dismiss')} onClick={() => setVisible(false)}>
        ×
      </button>
    </aside>
  );
}
