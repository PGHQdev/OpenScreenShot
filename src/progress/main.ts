import './style.css';
import type { CaptureProgress } from '../background/capture-progress';
import { copyImageToClipboard } from '../content/clipboard';
import { openCapture } from '../shared/storage';

const status = document.querySelector<HTMLElement>('#status')!;
const percent = document.querySelector<HTMLElement>('#percent')!;
const settings = document.querySelector<HTMLButtonElement>('#settings')!;
const check = document.querySelector<HTMLElement>('#check')!;
const detail = document.querySelector<HTMLElement>('#detail')!;
const hint = document.querySelector<HTMLElement>('#hint')!;
const retry = document.querySelector<HTMLButtonElement>('#retry')!;
retry.textContent = chrome.i18n.getMessage('captureDownloadAgain');
const ownWindow = chrome.windows.getCurrent();
settings.textContent = chrome.i18n.getMessage('settingsTitle');
const open = document.querySelector<HTMLButtonElement>('#open')!;
const quick = document.querySelector<HTMLElement>('#quick')!;
const copy = document.querySelector<HTMLButtonElement>('#copy')!;
const png = document.querySelector<HTMLButtonElement>('#png')!;
const pdf = document.querySelector<HTMLButtonElement>('#pdf')!;
for (const [button, label, title] of [
  [copy, 'captureQuickCopy', 'captureQuickCopyTitle'],
  [png, 'captureQuickPng', 'captureQuickPngTitle'],
  [pdf, 'captureQuickPdf', 'captureQuickPdfTitle'],
] as const) {
  button.textContent = chrome.i18n.getMessage(label);
  button.title = chrome.i18n.getMessage(title);
  button.setAttribute('aria-label', chrome.i18n.getMessage(title));
}
let currentState: CaptureProgress | null = null;
const progress = document.querySelector<HTMLProgressElement>('#progress')!;
document.documentElement.lang = chrome.i18n.getUILanguage();
let receivedUpdate = false;
function showResult(result: CaptureProgress['result']): void {
  check.hidden = !result;
  check.textContent = result === 'editor' ? '✓' : '🎉';
  detail.hidden = result !== 'clipboard' && result !== 'download';
  retry.hidden = result !== 'download';
  hint.textContent =
    result === 'clipboard'
      ? chrome.i18n.getMessage('capturePasteHint')
      : result === 'download'
        ? chrome.i18n.getMessage('captureDownloadHint')
        : '';
}

function showError(key: string): void {
  status.textContent = chrome.i18n.getMessage(key);
  check.hidden = true;
  detail.hidden = true;
}

function render(state: CaptureProgress | null): void {
  if (!state) return;
  currentState = state;
  const label = chrome.i18n.getMessage(
    state.result
      ? { editor: 'captureReady', clipboard: 'captureCopied', download: 'captureSaved' }[
          state.result
        ]
      : state.percent === null
        ? 'captureOverlayFinishing'
        : 'captureOverlayTitle',
  );
  status.textContent = label;
  progress.hidden = !!state.result;
  percent.hidden = !!state.result;
  open.hidden = !state.result;
  showResult(state.result);
  settings.hidden = !state.result;
  quick.hidden = !state.result || !state.captureId;
  open.textContent = chrome.i18n.getMessage('captureOpenEditor');
  progress.setAttribute('aria-label', label);
  percent.textContent = state.percent === null ? '' : `${state.percent}%`;
  if (state.percent === null) progress.removeAttribute('value');
  else progress.value = state.percent;
  document.title = state.result
    ? 'OpenScreenShot'
    : `${percent.textContent || label} · OpenScreenShot`;
}
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'CAPTURE_DIALOG_CONTEXT' || message?.type === 'CAPTURE_DIALOG_OPEN') {
    void ownWindow.then(async (dialog) => {
      if (message.windowId !== dialog.id || !currentState?.result) {
        sendResponse(null);
        return;
      }
      if (message.type === 'CAPTURE_DIALOG_CONTEXT') {
        sendResponse({ ready: true });
        return;
      }
      const ok = await openEditor();
      sendResponse({ ok });
      if (ok) window.close();
    });
    return true;
  }

  if (message?.type === 'CAPTURE_STARTED' && currentState?.result) window.close();
  if (message?.type === 'CAPTURE_WINDOW_PROGRESS') {
    receivedUpdate = true;
    render(message);
  }
});
// Subscribe before querying so a late-loading window never misses progress.
void chrome.runtime
  .sendMessage({ type: 'GET_CAPTURE_PROGRESS' })
  .then((state) => {
    if (!receivedUpdate) render(state);
  })
  .catch(() => window.close());

async function openEditor(autoPdf = false): Promise<boolean> {
  if (!currentState?.result || open.disabled) return false;
  open.disabled = true;
  try {
    const sourceId = currentState.sourceWindowId;
    let sourceExists = false;
    if (sourceId !== undefined) {
      try {
        await chrome.windows.get(sourceId);
        sourceExists = true;
      } catch {
        /* Source closed. */
      }
    }
    const params = new URLSearchParams();
    if (currentState.captureId) params.set('capture', currentState.captureId);
    // The editor reads `pdf` once its image loads and exports straight away.
    if (autoPdf) params.set('pdf', '1');
    const query = params.toString();
    const url = chrome.runtime.getURL('src/editor/index.html') + (query ? `?${query}` : '');
    if (sourceExists) {
      await chrome.tabs.create({ url, windowId: sourceId });
      await chrome.windows.update(sourceId!, { focused: true }).catch(() => {});
    } else {
      await chrome.windows.create({ url, type: 'normal', focused: true });
    }
    return true;
  } catch {
    showError('popupOpenFailed');
    open.disabled = false;
    return false;
  }
}
open.addEventListener('click', async () => {
  if (await openEditor()) window.close();
});

function setQuickBusy(busy: boolean): void {
  copy.disabled = busy;
  png.disabled = busy;
  pdf.disabled = busy;
  retry.disabled = busy;
}

copy.addEventListener('click', async () => {
  const captureId = currentState?.captureId;
  if (!captureId || copy.disabled) return;
  setQuickBusy(true);
  try {
    const capture = await openCapture(captureId);
    // The write runs in this window: it has the click's focus and gesture,
    // unlike the service worker, which has no clipboard at all.
    const copied = capture !== null && (await copyImageToClipboard(capture.dataUrl));
    if (copied) {
      status.textContent = chrome.i18n.getMessage('captureCopied');
      showResult('clipboard');
    } else showError('errClipboard');
  } catch {
    showError('errClipboard');
  } finally {
    setQuickBusy(false);
  }
});

async function downloadPng(): Promise<void> {
  const captureId = currentState?.captureId;
  if (!captureId || png.disabled) return;
  setQuickBusy(true);
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'CAPTURE_QUICK_ACTION',
      action: 'png',
      captureId,
    });
    if (response?.ok) {
      status.textContent = chrome.i18n.getMessage('captureSaved');
      showResult('download');
    } else showError('errSave');
  } catch {
    showError('errSave');
  } finally {
    setQuickBusy(false);
  }
}
png.addEventListener('click', downloadPng);
retry.addEventListener('click', downloadPng);

pdf.addEventListener('click', async () => {
  if (!currentState?.captureId || pdf.disabled) return;
  setQuickBusy(true);
  if (await openEditor(true)) window.close();
  else setQuickBusy(false);
});

settings.addEventListener('click', async () => {
  if (settings.disabled) return;
  settings.disabled = true;
  try {
    const dialog = await ownWindow;
    const url = chrome.runtime.getURL(`src/popup/settings.html?captureWindow=${dialog.id}`);
    const tabs = await chrome.tabs.query({});
    const existing = tabs.find((tab) => tab.url === url);
    let targetWindowId = existing?.windowId;
    if (existing?.id !== undefined) {
      await chrome.tabs.update(existing.id, { active: true });
    } else {
      let sourceId = currentState?.sourceWindowId;
      try {
        if (sourceId !== undefined) await chrome.windows.get(sourceId);
      } catch {
        sourceId = undefined;
      }
      if (sourceId !== undefined) {
        targetWindowId = (await chrome.tabs.create({ url, windowId: sourceId })).windowId;
      } else {
        targetWindowId = (await chrome.windows.create({ url, type: 'normal', focused: true }))?.id;
      }
    }
    if (targetWindowId !== undefined)
      await chrome.windows.update(targetWindowId, { focused: true });
  } catch {
    showError('popupOpenFailed');
  } finally {
    settings.disabled = false;
  }
});
