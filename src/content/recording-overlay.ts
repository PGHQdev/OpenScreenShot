/**
 * The in-page recording control bar, injected via `chrome.scripting.executeScript`.
 * Like {@link ../content/region-select}, `mountRecordingOverlay` must be fully
 * self-contained (no module-scope references): Chrome serializes it via
 * `toString()` and drops its closure, so every helper and constant it needs is
 * defined inside the function body, not imported.
 *
 * Besides the control bar, the mounted overlay is the recorder's cursor logger:
 * it samples `mousemove`/`mousedown`/`resize` and flushes batches to the
 * offscreen engine every second. That flush also doubles as a heartbeat — see
 * the flush-interval comment below for why it must never stop, even paused.
 */

/** One sample per this many ms — matches the brief's cursor-log throttle. */
export const MOVE_THROTTLE_MS = 33;
/** How often cursor batches (and the heartbeat) flush to the engine. */
export const FLUSH_INTERVAL_MS = 1000;

/** The bar hides after this long with the pointer away, except paused/hovered. */
export const OVERLAY_GRACE_MS = 3000;
/** Reveal zone: a pointer this close to bottom-center brings the bar back. */
export const REVEAL_HALF_WIDTH_PX = 200;
export const REVEAL_HEIGHT_PX = 120;

/** Whether a viewport point is inside the bar's bottom-center reveal zone. */
export function isNearBar(x: number, y: number, winW: number, winH: number): boolean {
  return Math.abs(x - winW / 2) <= REVEAL_HALF_WIDTH_PX && y >= winH - REVEAL_HEIGHT_PX;
}

/**
 * Visibility policy for the control bar. Paused and hovered always show —
 * a paused MediaRecorder writes no frames, so a visible bar costs nothing,
 * and a bar must never vanish under the pointer.
 *
 * `warning` joins them: it is set when chunks are failing to reach IndexedDB,
 * which is the one failure that loses the user's recording while it is still
 * being made. A message they can only find after stopping is a message that
 * arrives after the data is gone, and the bar hides after three idle seconds,
 * so the warning has to hold it open.
 */
export function shouldShowBar(args: {
  sinceMountMs: number;
  sinceNearMs: number;
  hovering: boolean;
  paused: boolean;
  warning?: boolean;
}): boolean {
  if (args.paused || args.hovering || args.warning) return true;
  return args.sinceMountMs < OVERLAY_GRACE_MS || args.sinceNearMs < OVERLAY_GRACE_MS;
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
 * Mount the bar, or re-sync one that is already mounted. The worker re-injects
 * this on every heal, so the second form is the common one: it re-anchors the
 * clock to the worker's authoritative elapsed and drops any track the engine
 * turned out not to capture. Correction is one-way — a heal can only remove a
 * chip, never add one — so the mounted DOM never has to grow a webcam frame it
 * was not built with.
 *
 * Returns `'fresh'` when this call built the overlay (and therefore mounted the
 * permission frame, if any), `'synced'` when it only updated one already there.
 */
export function mountRecordingOverlay(
  segmentId: string,
  elapsedMs: number,
  paused: boolean,
  tracks: { mic: boolean; tabAudio: boolean; webcam: boolean },
  /** Chunks are failing to reach IndexedDB; show it here and hold the bar open. */
  writeFailed = false,
): 'fresh' | 'synced' {
  type SyncFn = (
    elapsedMs: number,
    paused: boolean,
    tracks: { mic: boolean; tabAudio: boolean; webcam: boolean },
    writeFailed: boolean,
  ) => void;
  const win = window as unknown as { __ossRecOverlay?: () => void; __ossRecSync?: SyncFn };
  if (win.__ossRecOverlay) {
    win.__ossRecSync?.(elapsedMs, paused, tracks, writeFailed);
    return 'synced';
  }

  // Duplicated on purpose: injected functions run with no closure over module
  // scope (Chrome serializes this function via toString()), so the module-level
  // MOVE_THROTTLE_MS/FLUSH_INTERVAL_MS above can't be referenced here.
  const MOVE_THROTTLE_MS = 33;
  const FLUSH_INTERVAL_MS = 1000;

  const OVERLAY_GRACE_MS = 3000;
  const REVEAL_HALF_WIDTH_PX = 200;
  const REVEAL_HEIGHT_PX = 120;

  function isNearBar(x: number, y: number, winW: number, winH: number): boolean {
    return Math.abs(x - winW / 2) <= REVEAL_HALF_WIDTH_PX && y >= winH - REVEAL_HEIGHT_PX;
  }

  function shouldShowBar(args: {
    sinceMountMs: number;
    sinceNearMs: number;
    hovering: boolean;
    paused: boolean;
    warning: boolean;
  }): boolean {
    if (args.paused || args.hovering || args.warning) return true;
    return args.sinceMountMs < OVERLAY_GRACE_MS || args.sinceNearMs < OVERLAY_GRACE_MS;
  }

  function formatTimer(ms: number): string {
    const totalSec = Math.floor(Math.max(0, ms) / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    const pad = (n: number) => String(n).padStart(2, '0');
    return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
  }

  function t(id: string, fallback: string): string {
    try {
      const msg = chrome.i18n.getMessage(id);
      return msg ? msg : fallback;
    } catch {
      return fallback;
    }
  }

  type CursorEvent =
    | { kind: 'move'; t: number; x: number; y: number }
    | { kind: 'click'; t: number; x: number; y: number }
    | { kind: 'resize'; t: number; w: number; h: number; dpr: number };

  let isPaused = paused;
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

  // --- Host + shadow root ---------------------------------------------------

  const host = document.createElement('div');
  host.style.cssText =
    'all:initial;position:fixed;left:50%;bottom:20px;transform:translateX(-50%);' +
    'z-index:2147483647;transition:opacity .25s;';
  const shadow = host.attachShadow({ mode: 'closed' });

  const style = document.createElement('style');
  style.textContent = `
    .bar {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 12px;
      border-radius: 999px;
      background: rgba(20, 20, 22, .92);
      color: #fff;
      font: 500 13px/1.2 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      box-shadow: 0 4px 20px rgba(0, 0, 0, .35);
      user-select: none;
    }
    .dot {
      width: 9px;
      height: 9px;
      border-radius: 50%;
      background: #e8503a;
      flex: none;
      animation: pulse 1.4s ease-in-out infinite;
    }
    .dot.paused { animation: none; opacity: .5; }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: .35; }
    }
    .timer {
      font-variant-numeric: tabular-nums;
      min-width: 3.5em;
    }
    .chips {
      display: flex;
      gap: 4px;
    }
    .chip {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: .03em;
      padding: 2px 6px;
      border-radius: 4px;
      background: rgba(255, 255, 255, .12);
    }
    /* The bar is always dark, whatever the page behind it, so this is the one
       place in the product a fixed pair is right. Amber ground with near-black
       text reads as the danger accent and clears 4.5:1 without a token. */
    .chip.warn {
      background: #ffb340;
      color: #1c1c1e;
    }
    button {
      all: unset;
      cursor: pointer;
      padding: 5px 10px;
      border-radius: 999px;
      font: inherit;
      font-weight: 600;
      color: #fff;
      background: rgba(255, 255, 255, .12);
    }
    button:hover { background: rgba(255, 255, 255, .22); }
    button.stop { background: #e8503a; }
    button.stop:hover { background: #d9432c; }
  `;
  shadow.appendChild(style);

  const bar = document.createElement('div');
  bar.className = 'bar';

  const dot = document.createElement('div');
  dot.className = 'dot';
  bar.appendChild(dot);

  const timer = document.createElement('span');
  timer.className = 'timer';
  bar.appendChild(timer);

  const chips = document.createElement('div');
  chips.className = 'chips';
  bar.appendChild(chips);

  function makeChip(label: string): HTMLSpanElement {
    const chip = document.createElement('span');
    chip.className = 'chip';
    chip.textContent = label;
    return chip;
  }

  /**
   * Rebuild the chip row. The warning goes first: it is the only chip that
   * reports a problem rather than a track, and a row it can be scrolled off
   * the end of is a row it can be missed in.
   */
  function renderChips(
    next: { mic: boolean; tabAudio: boolean; webcam: boolean },
    warn: boolean,
  ): void {
    chips.replaceChildren();
    if (warn) {
      const chip = makeChip(t('recOverlayNotSaving', 'NOT SAVING'));
      chip.className = 'chip warn';
      chip.setAttribute('role', 'alert');
      chip.setAttribute('data-testid', 'rec-overlay-warning');
      chips.appendChild(chip);
    }
    if (next.mic) chips.appendChild(makeChip(t('recOverlayMic', 'MIC')));
    if (next.tabAudio) chips.appendChild(makeChip(t('recOverlayTabAudio', 'TAB')));
    if (next.webcam) chips.appendChild(makeChip(t('recOverlayWebcam', 'CAM')));
  }

  let warning = writeFailed;
  renderChips(tracks, warning);

  const pauseBtn = document.createElement('button');
  bar.appendChild(pauseBtn);

  const stopBtn = document.createElement('button');
  stopBtn.className = 'stop';
  stopBtn.textContent = t('recOverlayStop', 'Stop');
  bar.appendChild(stopBtn);

  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = t('recOverlayCancel', 'Cancel');
  bar.appendChild(cancelBtn);

  shadow.appendChild(bar);
  document.documentElement.appendChild(host);

  // --- Webcam bubble / permission frame ------------------------------------

  // Camera and mic permission is held per extension origin and the offscreen
  // document cannot show a prompt, so the prompt (and the live preview) lives
  // in an iframe of `src/recorder/webcam-frame.html`. With the mic on and the
  // webcam off that frame is still mounted, 1x1 and invisible: it is the only
  // prompt surface the mic has.
  let camHost: HTMLDivElement | null = null;
  let clampBubble: (() => void) | null = null;

  if (tracks.webcam || tracks.mic) {
    const BUBBLE_PX = 180;
    const HANDLE_PX = 12;
    const MARGIN_PX = 24;
    const frameUrl =
      chrome.runtime.getURL('src/recorder/webcam-frame.html') +
      '?webcam=' +
      (tracks.webcam ? '1' : '0') +
      '&mic=' +
      (tracks.mic ? '1' : '0');

    camHost = document.createElement('div');
    camHost.style.cssText = 'all:initial;position:fixed;left:0;top:0;z-index:2147483646;';
    const camShadow = camHost.attachShadow({ mode: 'closed' });

    const camStyle = document.createElement('style');
    camStyle.textContent = `
      .wrap {
        box-sizing: content-box;
        width: ${BUBBLE_PX}px;
        height: ${BUBBLE_PX}px;
        padding: ${HANDLE_PX}px;
        border-radius: 50%;
        background: rgba(20, 20, 22, .92);
        box-shadow: 0 4px 20px rgba(0, 0, 0, .35);
        cursor: grab;
        touch-action: none;
      }
      .wrap:active { cursor: grabbing; }
      .frame {
        display: block;
        width: ${BUBBLE_PX}px;
        height: ${BUBBLE_PX}px;
        border: 0;
        border-radius: 50%;
        background: transparent;
        /* A drag anywhere over the circle must reach .wrap; the frame is a
           separate document and would otherwise swallow the pointer. */
        pointer-events: none;
      }
    `;
    camShadow.appendChild(camStyle);

    const wrap = document.createElement('div');
    wrap.className = 'wrap';

    const frame = document.createElement('iframe');
    frame.className = 'frame';
    // Camera/mic is delegated to a cross-origin child frame only when the
    // embedder says so; without this the frame's getUserMedia always fails.
    frame.allow = 'camera; microphone';
    frame.src = frameUrl;
    wrap.appendChild(frame);
    camShadow.appendChild(wrap);

    if (tracks.webcam) {
      const size = BUBBLE_PX + HANDLE_PX * 2;
      let x = Math.max(0, window.innerWidth - size - MARGIN_PX);
      let y = Math.max(0, window.innerHeight - size - MARGIN_PX);
      let dragId: number | null = null;
      let grabX = 0;
      let grabY = 0;

      const place = (): void => {
        if (!camHost) return;
        camHost.style.left = `${x}px`;
        camHost.style.top = `${y}px`;
      };
      place();

      clampBubble = () => {
        x = Math.min(x, Math.max(0, window.innerWidth - size));
        y = Math.min(y, Math.max(0, window.innerHeight - size));
        place();
      };

      wrap.addEventListener('pointerdown', (e) => {
        dragId = e.pointerId;
        grabX = e.clientX - x;
        grabY = e.clientY - y;
        wrap.setPointerCapture(e.pointerId);
        e.preventDefault();
      });
      wrap.addEventListener('pointermove', (e) => {
        if (dragId !== e.pointerId) return;
        x = Math.min(Math.max(0, e.clientX - grabX), Math.max(0, window.innerWidth - size));
        y = Math.min(Math.max(0, e.clientY - grabY), Math.max(0, window.innerHeight - size));
        place();
      });
      const endDrag = (e: PointerEvent): void => {
        if (dragId !== e.pointerId) return;
        dragId = null;
        wrap.releasePointerCapture(e.pointerId);
      };
      wrap.addEventListener('pointerup', endDrag);
      wrap.addEventListener('pointercancel', endDrag);
    } else {
      // Mic only: no bubble, just the prompt surface. Inline styles win over
      // the sheet above, so the 180px circle collapses to an invisible dot.
      camHost.style.cssText +=
        'width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none;';
      wrap.style.cssText = 'all:unset;display:block;width:1px;height:1px;';
      frame.style.cssText = 'width:1px;height:1px;border:0;';
    }

    document.documentElement.appendChild(camHost);
  }

  // chrome.runtime.sendMessage can both reject (normal "no listener" case) and
  // throw synchronously (extension context invalidated — reload/update, which
  // tends to coincide with pagehide). Guard both so a dead extension context
  // never skips cleanup.
  function safeSend(message: unknown): void {
    try {
      chrome.runtime.sendMessage(message).catch(() => {});
    } catch {
      // Extension context gone — nothing to send to.
    }
  }

  function renderPauseState(): void {
    dot.classList.toggle('paused', isPaused);
    pauseBtn.textContent = isPaused
      ? t('recOverlayResume', 'Resume')
      : t('recOverlayPause', 'Pause');
  }
  renderPauseState();

  const mountedAt = Date.now();
  let lastNearAt = mountedAt;
  let hoveringBar = false;

  function applyBarVisibility(): void {
    const now = Date.now();
    const show = shouldShowBar({
      sinceMountMs: now - mountedAt,
      sinceNearMs: now - lastNearAt,
      hovering: hoveringBar,
      paused: isPaused,
      warning,
    });
    host.style.opacity = show ? '1' : '0';
    // Hidden means hidden to the page too, or it would still swallow clicks.
    host.style.pointerEvents = show ? '' : 'none';
  }

  host.addEventListener('mouseenter', () => {
    hoveringBar = true;
    applyBarVisibility();
  });
  host.addEventListener('mouseleave', () => {
    hoveringBar = false;
    applyBarVisibility();
  });

  pauseBtn.addEventListener('click', () => {
    isPaused = !isPaused;
    if (isPaused) {
      pauseStartedAt = Date.now();
    } else if (pauseStartedAt !== null) {
      pausedAccum += Date.now() - pauseStartedAt;
      pauseStartedAt = null;
    }
    renderPauseState();
    safeSend({ type: isPaused ? 'REC_PAUSE' : 'REC_RESUME' });
    applyBarVisibility();
  });

  stopBtn.addEventListener('click', () => safeSend({ type: 'REC_STOP' }));
  cancelBtn.addEventListener('click', () => safeSend({ type: 'REC_CANCEL' }));

  // --- Timer ------------------------------------------------------------

  const timerInterval = setInterval(() => {
    timer.textContent = formatTimer(nowT());
    applyBarVisibility();
  }, 500);
  timer.textContent = formatTimer(nowT());

  // --- Cursor logger ------------------------------------------------------

  function pushEvent(e: CursorEvent): void {
    if (isPaused) return;
    buffer.push(e);
  }

  function onMove(e: MouseEvent): void {
    if (isNearBar(e.clientX, e.clientY, window.innerWidth, window.innerHeight)) {
      lastNearAt = Date.now();
      applyBarVisibility();
    }
    const now = Date.now();
    if (now - lastMoveAt < MOVE_THROTTLE_MS) return;
    lastMoveAt = now;
    pushEvent({ kind: 'move', t: nowT(), x: e.clientX, y: e.clientY });
  }

  function onDown(e: MouseEvent): void {
    pushEvent({ kind: 'click', t: nowT(), x: e.clientX, y: e.clientY });
  }

  function onResize(): void {
    clampBubble?.();
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

  // Initial resize-shaped event so the editor knows the viewport at overlay
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

  win.__ossRecSync = (nextElapsedMs, nextPaused, nextTracks, nextWriteFailed) => {
    // Shift what is still buffered by the same amount the clock moves, so a
    // re-anchor cannot leave the last second of cursor events pointing at a
    // timestamp the video never had.
    const before = nowT();
    startedAt = Date.now() - nextElapsedMs;
    pausedAccum = 0;
    pauseStartedAt = nextPaused ? Date.now() : null;
    isPaused = nextPaused;
    const shift = before - nowT();
    for (const e of buffer) e.t -= shift;
    renderPauseState();
    timer.textContent = formatTimer(nowT());

    // One-way, like the tracks above: a run that has started losing chunks
    // does not stop having lost them.
    warning = warning || nextWriteFailed;
    renderChips(nextTracks, warning);

    // Drop the frame only when neither device is left. A camera that is gone
    // makes the bubble a preview of something nobody records, but the same
    // element is the mic's only prompt surface — tearing it down for a
    // mic-only run kills the prompt it exists to show.
    if (!nextTracks.webcam && !nextTracks.mic && camHost) {
      camHost.remove();
      camHost = null;
      clampBubble = null;
    }
    applyBarVisibility();
  };

  // --- Teardown -------------------------------------------------------------

  function cleanup(): void {
    clearInterval(timerInterval);
    clearInterval(flushInterval);
    window.removeEventListener('mousemove', onMove, true);
    window.removeEventListener('mousedown', onDown, true);
    window.removeEventListener('resize', onResize, true);
    window.removeEventListener('pagehide', onPageHide);
    host.remove();
    // Removing the frame tears down its document, which stops the preview
    // stream and drops the camera indicator.
    camHost?.remove();
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
