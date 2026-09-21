import './style.css';
import type { CaptureProgress } from '../background/capture-progress';

const status = document.querySelector<HTMLElement>('#status')!;
const percent = document.querySelector<HTMLElement>('#percent')!;
const settings = document.querySelector<HTMLButtonElement>('#settings')!;
const check = document.querySelector<HTMLElement>('#check')!;
const ownWindow = chrome.windows.getCurrent();
settings.textContent = chrome.i18n.getMessage('settingsTitle');
const open = document.querySelector<HTMLButtonElement>('#open')!;
let currentState: CaptureProgress | null = null;
const progress = document.querySelector<HTMLProgressElement>('#progress')!;
document.documentElement.lang = chrome.i18n.getUILanguage();
let receivedUpdate = false;
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
  check.hidden = !state.result;
  settings.hidden = !state.result;
  open.textContent = chrome.i18n.getMessage(
    state.result === 'editor' ? 'captureOpenEditor' : 'editorClose',
  );
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

async function openEditor(): Promise<boolean> {
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
    const url =
      chrome.runtime.getURL('src/editor/index.html') +
      (currentState.captureId ? `?capture=${encodeURIComponent(currentState.captureId)}` : '');
    if (sourceExists) {
      await chrome.tabs.create({ url, windowId: sourceId });
      await chrome.windows.update(sourceId!, { focused: true }).catch(() => {});
    } else {
      await chrome.windows.create({ url, type: 'normal', focused: true });
    }
    return true;
  } catch {
    status.textContent = chrome.i18n.getMessage('popupOpenFailed');
    open.disabled = false;
    return false;
  }
}
open.addEventListener('click', async () => {
  if (currentState?.result !== 'editor' || (await openEditor())) window.close();
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
    status.textContent = chrome.i18n.getMessage('popupOpenFailed');
  } finally {
    settings.disabled = false;
  }
});
