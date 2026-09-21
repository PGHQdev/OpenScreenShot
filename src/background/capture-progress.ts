/** Optional capture UI. Its lifetime never owns or cancels the capture. */
export type CaptureProgress = {
  percent: number | null;
  result?: 'editor' | 'clipboard' | 'download';
  sourceWindowId?: number;
  captureId?: string;
};
let state: CaptureProgress | null = null;
let windowId: number | undefined;

export function getCaptureProgress(): CaptureProgress | null {
  return state;
}

export async function openCaptureProgress(sourceWindowId: number): Promise<void> {
  state = { percent: 0 };
  let position = {};
  try {
    const source = await chrome.windows.get(sourceWindowId);
    position = {
      left: Math.round((source.left ?? 0) + ((source.width ?? 360) - 360) / 2),
      top: Math.round((source.top ?? 0) + ((source.height ?? 320) - 320) / 2),
    };
  } catch {
    // Let the browser position the window if source bounds are unavailable.
  }
  try {
    const window = await chrome.windows.create({
      url: chrome.runtime.getURL('src/progress/index.html'),
      type: 'popup',
      width: 360,
      height: 320,
      focused: true,
      ...position,
    });
    windowId = window?.id;
  } catch {
    // Managed browsers or unavailable window APIs must not prevent capture.
  }
}

export function setCaptureProgress(percent: number | null): void {
  state = { percent };
  void chrome.runtime.sendMessage({ type: 'CAPTURE_WINDOW_PROGRESS', ...state }).catch(() => {});
}

/** Keep the ready window only if it still exists; otherwise use normal delivery. */
export async function finishCaptureProgress(
  result: NonNullable<CaptureProgress['result']>,
  sourceWindowId: number,
  captureId?: string,
): Promise<boolean> {
  if (windowId === undefined) return false;
  try {
    await chrome.windows.get(windowId);
    state = { percent: 100, result, sourceWindowId, ...(captureId ? { captureId } : {}) };
    // A newly opened page may still be loading; its initial query reads this state.
    await chrome.runtime.sendMessage({ type: 'CAPTURE_WINDOW_PROGRESS', ...state }).catch(() => {});
    if (result === 'clipboard') {
      await chrome.windows.update(windowId, { focused: true }).catch(() => {});
    }
    return true;
  } catch {
    return false;
  }
}

export async function closeCaptureProgress(): Promise<void> {
  const id = windowId;
  windowId = undefined;
  state = null;
  if (id !== undefined) {
    try {
      await chrome.windows.remove(id);
    } catch {
      // The user may have already closed it.
    }
  }
}
