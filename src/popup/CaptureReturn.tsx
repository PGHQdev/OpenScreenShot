import { useEffect, useState } from 'preact/hooks';

const t = (key: string) => chrome.i18n.getMessage(key);

/** Only a Settings tab opened from a live capture dialog offers this handoff. */
export function CaptureReturn() {
  const raw = new URLSearchParams(location.search).get('captureWindow');
  const windowId = raw !== null && /^\d+$/.test(raw) ? Number(raw) : null;
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  useEffect(() => {
    if (windowId === null) return;
    let active = true;
    async function refresh() {
      try {
        const response = await chrome.runtime.sendMessage({
          type: 'CAPTURE_DIALOG_CONTEXT',
          windowId,
        });
        if (active) setReady(response?.ready === true);
      } catch {
        if (active) setReady(false);
      }
    }
    const removed = (id: number) => {
      if (id === windowId) setReady(false);
    };
    void refresh();
    window.addEventListener('focus', refresh);
    chrome.windows.onRemoved.addListener(removed);
    return () => {
      active = false;
      window.removeEventListener('focus', refresh);
      chrome.windows.onRemoved.removeListener(removed);
    };
  }, [windowId]);
  if (!ready) return null;
  async function go(editor: boolean) {
    setBusy(true);
    setError(false);
    try {
      if (editor) {
        const response = await chrome.runtime.sendMessage({
          type: 'CAPTURE_DIALOG_OPEN',
          windowId,
        });
        if (!response?.ok) throw new Error('Could not open editor');
        setReady(false);
      } else {
        await chrome.windows.update(windowId!, { focused: true });
      }
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section class="capture-return" aria-label={t('captureReady')}>
      <strong>{t('captureReady')}</strong>
      <div class="capture-return-actions">
        <button
          class="btn-secondary capture-return-primary"
          disabled={busy}
          onClick={() => void go(true)}
        >
          {t('captureOpenEditor')}
        </button>
        <button class="btn-secondary" disabled={busy} onClick={() => void go(false)}>
          {t('captureBack')}
        </button>
      </div>
      {error && <p role="alert">{t('popupOpenFailed')}</p>}
    </section>
  );
}
