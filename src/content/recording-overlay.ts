/**
 * The in-page cursor logger, injected via `chrome.scripting.executeScript`.
 * Like {@link ../content/region-select}, `mountRecordingOverlay` must be fully
 * self-contained (no module-scope references): Chrome serializes it via
 * `toString()` and drops its closure, so every helper and constant it needs is
 * defined inside the function body, not imported.
 *
 * It draws nothing. tabCapture records every pixel of the tab, so anything
 * this put on the page would be in the video; the recording controls live in
 * their own extension tab (`src/control/index.html`) instead. What is left
 * here samples `mousemove`/`mousedown`/`resize` and flushes batches to the
 * offscreen engine every second. That flush also doubles as a heartbeat — see
 * the flush-interval comment below for why it must never stop, even paused.
 */

/** One sample per this many ms — matches the brief's cursor-log throttle. */
export const MOVE_THROTTLE_MS = 33;
/** How often cursor batches (and the heartbeat) flush to the engine. */
export const FLUSH_INTERVAL_MS = 1000;

/**
 * What a re-sync should do to the logger's clock. The logger mounts while the
 * start is still opening streams, so there is a window in which no zero
 * exists yet: the worker's `startedAt` is the mount, the engine's is whenever
 * its recorders actually began, and `ENGINE_STARTED` moves the second under
 * the first.
 *
 * Two rules, and both are properties rather than values:
 *
 * - **The clock anchors once.** The first sync saying the engine has started
 *   is the anchor — whatever elapsed it carries is taken as-is. An unanchored
 *   sync can never take an anchor back: a heal that raced the anchoring one
 *   would otherwise put the clock back to "starting" mid-recording.
 * - **After the anchor the clock is monotonic.** Heals are re-injections that
 *   can land out of order (a navigation and a popup open in the same second,
 *   each carrying the elapsed read at its own moment), so the later-arriving
 *   one is not always the later-computed one. The larger elapsed is the true
 *   one, and taking it is what makes "never jumps backwards" hold under every
 *   ordering rather than under the orderings anyone thought to test.
 */
export function anchoredElapsed(
  current: { elapsedMs: number; anchored: boolean },
  next: { elapsedMs: number; anchored: boolean },
): { elapsedMs: number; anchored: boolean } {
  if (!next.anchored) return current;
  if (!current.anchored) return { elapsedMs: next.elapsedMs, anchored: true };
  return { elapsedMs: Math.max(current.elapsedMs, next.elapsedMs), anchored: true };
}

/** "0:07", "1:23", "1:23:45". Floors ragged ms, clamps negatives to zero. */
export function formatTimer(ms: number): string {
  const totalSec = Math.floor(Math.max(0, ms) / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

/**
 * Mount the logger, or re-sync one that is already mounted. The worker
 * re-injects this on every heal, so the second form is the common one: it
 * re-anchors the clock to the worker's authoritative elapsed.
 *
 * Returns `'fresh'` when this call built the logger, `'synced'` when it only
 * updated one already there.
 */
export function mountRecordingOverlay(
  segmentId: string,
  elapsedMs: number,
  paused: boolean,
  /**
   * Whether the engine has reported that the recorders began. Required, not
   * defaulted: a forgotten argument would put the clock back to counting from
   * its own mount. See `anchoredElapsed`.
   */
  anchored: boolean,
): 'fresh' | 'synced' {
  type SyncFn = (elapsedMs: number, paused: boolean, anchored: boolean) => void;
  const win = window as unknown as {
    __ossRecOverlay?: () => void;
    __ossRecSync?: SyncFn;
  };
  if (win.__ossRecOverlay) {
    win.__ossRecSync?.(elapsedMs, paused, anchored);
    return 'synced';
  }

  // Duplicated on purpose: injected functions run with no closure over module
  // scope (Chrome serializes this function via toString()), so the module-level
  // MOVE_THROTTLE_MS/FLUSH_INTERVAL_MS above can't be referenced here.
  const MOVE_THROTTLE_MS = 33;
  const FLUSH_INTERVAL_MS = 1000;

  // Duplicated for the same reason as the constants above; the exported copy
  // in this file's module scope is the one under test, and the two are
  // spelled identically on purpose.
  function anchoredElapsed(
    current: { elapsedMs: number; anchored: boolean },
    next: { elapsedMs: number; anchored: boolean },
  ): { elapsedMs: number; anchored: boolean } {
    if (!next.anchored) return current;
    if (!current.anchored) return { elapsedMs: next.elapsedMs, anchored: true };
    return { elapsedMs: Math.max(current.elapsedMs, next.elapsedMs), anchored: true };
  }

  type CursorEvent =
    | { kind: 'move'; t: number; x: number; y: number }
    | { kind: 'click'; t: number; x: number; y: number }
    | { kind: 'resize'; t: number; w: number; h: number; dpr: number };

  let isPaused = paused;
  let isAnchored = anchored;
  let startedAt = Date.now() - elapsedMs;
  let pausedAccum = 0;
  let pauseStartedAt: number | null = isPaused ? Date.now() : null;
  let seq = 0;
  let lastMoveAt = 0;
  const buffer: CursorEvent[] = [];

  // While paused, freeze the clock: fold in the open pause's elapsed time so
  // it cancels out the Date.now() growth instead of counting through it.
  const nowT = () => {
    const openPause = pauseStartedAt !== null ? Date.now() - pauseStartedAt : 0;
    return Date.now() - startedAt - pausedAccum - openPause;
  };

  // `chrome.runtime.sendMessage` both throws synchronously on an invalidated
  // extension context and rejects asynchronously when no listener answers
  // (and an extension reload — which invalidates the context — tends to
  // coincide with pagehide). Guard both so a dead extension context never
  // skips cleanup.
  function safeSend(message: unknown): void {
    try {
      chrome.runtime.sendMessage(message).catch(() => {});
    } catch {
      // Extension context gone — nothing to send to.
    }
  }

  // --- Cursor logger ------------------------------------------------------

  function pushEvent(e: CursorEvent): void {
    if (isPaused) return;
    buffer.push(e);
  }

  function onMove(e: MouseEvent): void {
    const now = Date.now();
    if (now - lastMoveAt < MOVE_THROTTLE_MS) return;
    lastMoveAt = now;
    pushEvent({ kind: 'move', t: nowT(), x: e.clientX, y: e.clientY });
  }

  function onDown(e: MouseEvent): void {
    pushEvent({ kind: 'click', t: nowT(), x: e.clientX, y: e.clientY });
  }

  function onResize(): void {
    pushEvent({
      kind: 'resize',
      t: nowT(),
      w: window.innerWidth,
      h: window.innerHeight,
      dpr: window.devicePixelRatio,
    });
  }

  window.addEventListener('mousemove', onMove, true);
  window.addEventListener('mousedown', onDown, true);
  window.addEventListener('resize', onResize, true);

  // Initial resize-shaped event so the editor knows the viewport at logger
  // birth, even if the window is never actually resized during the segment.
  buffer.push({
    kind: 'resize',
    t: nowT(),
    w: window.innerWidth,
    h: window.innerHeight,
    dpr: window.devicePixelRatio,
  });

  function flush(): void {
    safeSend({
      type: 'CURSOR_BATCH',
      target: 'offscreen',
      segmentId,
      seq: seq++,
      events: buffer.splice(0),
    });
  }

  // Flush every second, always — even with an empty buffer, and including
  // while paused. This empty batch is the heartbeat the engine's overlay
  // watchdog listens for; skipping it during pause would fire a spurious
  // OVERLAY_LOST on any ordinary pause longer than the watchdog timeout.
  const flushInterval = setInterval(flush, FLUSH_INTERVAL_MS);

  // --- Re-sync ---------------------------------------------------------------

  win.__ossRecSync = (nextElapsedMs, nextPaused, nextAnchored) => {
    // Shift what is still buffered by the same amount the clock moves, so a
    // re-anchor cannot leave the last second of cursor events pointing at a
    // timestamp the video never had.
    const before = nowT();
    const adopted = anchoredElapsed(
      { elapsedMs: before, anchored: isAnchored },
      { elapsedMs: nextElapsedMs, anchored: nextAnchored },
    );
    isAnchored = adopted.anchored;
    startedAt = Date.now() - adopted.elapsedMs;
    pausedAccum = 0;
    pauseStartedAt = nextPaused ? Date.now() : null;
    isPaused = nextPaused;
    const shift = before - nowT();
    for (const e of buffer) e.t -= shift;
  };

  // --- Teardown -------------------------------------------------------------

  function cleanup(): void {
    clearInterval(flushInterval);
    window.removeEventListener('mousemove', onMove, true);
    window.removeEventListener('mousedown', onDown, true);
    window.removeEventListener('resize', onResize, true);
    window.removeEventListener('pagehide', onPageHide);
    delete win.__ossRecOverlay;
    delete win.__ossRecSync;
  }

  function onPageHide(): void {
    try {
      flush();
    } finally {
      cleanup();
    }
  }
  window.addEventListener('pagehide', onPageHide);

  win.__ossRecOverlay = cleanup;
  return 'fresh';
}
