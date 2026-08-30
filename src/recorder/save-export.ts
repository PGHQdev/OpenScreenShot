/**
 * Saves an export's blob through `chrome.downloads`, and waits for the save
 * to reach a state the caller can trust before doing anything session-
 * destructive (`Rail.tsx`'s "delete after export"). The recorder page owns
 * the blob it renders, so it downloads directly rather than routing a blob
 * URL through the service worker — which cannot itself call
 * `URL.createObjectURL`, the reason `editor/export.ts`'s `downloadDataUrl`
 * takes a `data:` URL instead. A 150 MB export makes a `data:` URL the wrong
 * shape here regardless.
 *
 * `saveAs: true` shows the native Save dialog, so completion is not
 * `download()` returning — it is `chrome.downloads.onChanged` reaching a
 * terminal `state`. The object URL stays alive, and is revoked here exactly
 * once, only after that terminal state (or the bounded wait below) is
 * reached — never racing `a.click()` the way the old anchor-based save did.
 */

export type SaveOutcome =
  | { state: 'complete' }
  | { state: 'cancelled' }
  | { state: 'interrupted'; error: string }
  | { state: 'unverified' };

/**
 * How long to wait for `chrome.downloads.onChanged` before giving up. Not a
 * budget for a real save — a user picking a folder in the Save dialog can
 * take as long as they like, and `onChanged` only fires once they act on it
 * — this guards the one failure `onChanged` itself cannot report: a download
 * id `download()` returned that Chrome never follows up on (a listener that
 * silently never fires). Generous on purpose, so an ordinary save never
 * trips it.
 */
export const SAVE_VERIFY_TIMEOUT_MS = 5 * 60 * 1000;

/**
 * Downloads `blob` as `filename` through the Save dialog, resolving once the
 * download reaches a terminal state or the bounded wait above gives up. The
 * blob URL is revoked exactly once, after that resolution — the whole point
 * of this function is to make that the only place it happens.
 */
export async function saveExport(
  blob: Blob,
  filename: string,
  timeoutMs = SAVE_VERIFY_TIMEOUT_MS,
): Promise<SaveOutcome> {
  const url = URL.createObjectURL(blob);
  try {
    let id: number;
    try {
      id = await chrome.downloads.download({ url, filename, saveAs: true });
    } catch (err) {
      return { state: 'interrupted', error: err instanceof Error ? err.message : String(err) };
    }
    return await waitForTerminalState(id, timeoutMs);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function waitForTerminalState(id: number, timeoutMs: number): Promise<SaveOutcome> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (outcome: SaveOutcome) => {
      if (settled) return;
      settled = true;
      chrome.downloads.onChanged.removeListener(onChanged);
      clearTimeout(timer);
      resolve(outcome);
    };
    const onChanged = (delta: chrome.downloads.DownloadDelta) => {
      if (delta.id !== id) return;
      const state = delta.state?.current;
      if (state === 'complete') {
        finish({ state: 'complete' });
      } else if (state === 'interrupted') {
        const error = delta.error?.current;
        finish(
          error === 'USER_CANCELED'
            ? { state: 'cancelled' }
            : { state: 'interrupted', error: error ?? 'unknown' },
        );
      }
    };
    chrome.downloads.onChanged.addListener(onChanged);
    const timer = setTimeout(() => finish({ state: 'unverified' }), timeoutMs);
  });
}
