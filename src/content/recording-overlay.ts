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
  warning: boolean;
}): boolean {
  if (args.paused || args.hovering || args.warning) return true;
  return args.sinceMountMs < OVERLAY_GRACE_MS || args.sinceNearMs < OVERLAY_GRACE_MS;
}

/**
 * What a re-sync should do to the bar's clock. The bar mounts while the start
 * is still opening streams, so there is a window in which no zero exists yet:
 * the worker's `startedAt` is the mount, the engine's is whenever its
 * recorders actually began, and `ENGINE_STARTED` moves the second under the
 * first. Counting through that window and then re-anchoring is what made the
 * timer visibly jump back to 0:00.
 *
 * Two rules, and both are properties rather than values:
 *
 * - **The clock anchors once.** Until a sync arrives saying the engine has
 *   started, the bar shows no number at all, and the first such sync is the
 *   anchor — whatever elapsed it carries is taken as-is. An unanchored sync
 *   can never take an anchor back: a heal that raced the anchoring one would
 *   otherwise put the bar back to "starting" mid-recording.
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

/**
 * Clamp a webcam-bubble position to the current viewport. Shared by three
 * call sites inside `mountRecordingOverlay` — the initial placement (a
 * persisted position can predate a resize, or land in a smaller window after
 * a navigation), the resize handler, and the drag handler — so a position
 * that was valid where it was set can never leave the bubble partly or
 * wholly off-screen where it is applied.
 */
export function clampBubblePosition(
  pos: { x: number; y: number },
  winW: number,
  winH: number,
  size: number,
): { x: number; y: number } {
  return {
    x: Math.min(Math.max(0, pos.x), Math.max(0, winW - size)),
    y: Math.min(Math.max(0, pos.y), Math.max(0, winH - size)),
  };
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
  writeFailed: boolean,
  /**
   * Whether the engine has reported that the recorders began. Required, not
   * defaulted: a forgotten argument would put the bar back to counting from
   * its own mount, which is the bug this replaces. See `anchoredElapsed`.
   */
  anchored: boolean,
  /**
   * The webcam bubble's last dragged position, or null for the default
   * bottom-right corner. Unlike `anchored`, forgetting this only resets the
   * bubble to that corner rather than showing a wrong number, so it is the
   * one argument here allowed to default — and only a fresh mount applies
   * it; a heal that only re-syncs an already-mounted bar leaves a bubble the
   * user has since moved exactly where they put it.
   */
  bubblePos: { x: number; y: number } | null = null,
): 'fresh' | 'synced' {
  type SyncFn = (
    elapsedMs: number,
    paused: boolean,
    tracks: { mic: boolean; tabAudio: boolean; webcam: boolean },
    writeFailed: boolean,
    anchored: boolean,
  ) => void;
  const win = window as unknown as {
    __ossRecOverlay?: () => void;
    __ossRecSync?: SyncFn;
    __ossRecReveal?: () => void;
  };
  if (win.__ossRecOverlay) {
    win.__ossRecSync?.(elapsedMs, paused, tracks, writeFailed, anchored);
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

  // Duplicated for the same reason: the exported copy above is the one under
  // test, and the two are spelled identically on purpose.
  function clampBubblePosition(
    pos: { x: number; y: number },
    winW: number,
    winH: number,
    size: number,
  ): { x: number; y: number } {
    return {
      x: Math.min(Math.max(0, pos.x), Math.max(0, winW - size)),
      y: Math.min(Math.max(0, pos.y), Math.max(0, winH - size)),
    };
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

  // --- Host + shadow root ---------------------------------------------------

  const host = document.createElement('div');
  host.setAttribute('data-testid', 'rec-overlay-host');
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
    /* Two static white bars, not a dimmed red circle: a paused run has to
       read as a different state at a glance, not a fainter version of
       recording, and white keeps it out of the warning chip's own amber
       (danger, not a pause). Colour alone would not survive forced-colors
       mode either, which flattens both the pulsing red above and any colour
       here to the same system colour — the shape is what still tells the
       two states apart there, so no forced-colors rule is needed on top of
       this one. */
    .dot.paused {
      animation: none;
      background: transparent;
      position: relative;
    }
    .dot.paused::before,
    .dot.paused::after {
      content: '';
      position: absolute;
      top: 0;
      width: 3px;
      height: 9px;
      background: #ffffff;
    }
    .dot.paused::before { left: 0; }
    .dot.paused::after { right: 0; }
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
    /* The bar is always dark over whatever page it sits on, so this is the one
       place in the product a fixed pair is right — a closed shadow root in a
       serialized function cannot read a CSS variable. The pair is the dark
       theme's --danger-ink on its --surface-1, kept in step by
       tests/unit/overlay-warning-contrast.test.ts, which reads both values
       from here and compares them to the generated tokens. 10.10:1. */
    .chip.warn {
      background: #ffbb4d;
      color: #1c1c1e;
    }
    /* Carries the warning to assistive tech exactly once, on the edge. The
       visible chip cannot do it: renderChips replaces the row on every heal,
       so an alert living there re-announces on each one, and on a fresh mount
       it arrives inside a whole subtree, which most screen readers skip. This
       node is in the document from mount with no text, so the one text change
       is the one announcement. */
    .announcer {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
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
    /* all: unset above strips the button's native focus ring along with
       everything else, and Stop/Cancel are reachable by Tab whenever the
       bar is shown — so they need one back. Outline, not box-shadow: outline
       is what forced-colors mode remaps to a system colour rather than
       dropping, the same reason the ring on .rec-tl-zoom (recorder.css) uses
       it. #f26b57 is a literal copy of the dark theme's --border-focus, like
       .chip.warn's colours above — a closed shadow root in a serialized
       function has no stylesheet to read the token from. */
    button:focus-visible {
      outline: 2px solid #f26b57;
      outline-offset: 2px;
    }
  `;
  shadow.appendChild(style);

  const bar = document.createElement('div');
  bar.className = 'bar';

  const dot = document.createElement('div');
  dot.className = 'dot';
  dot.setAttribute('data-testid', 'rec-overlay-dot');
  bar.appendChild(dot);

  const timer = document.createElement('span');
  timer.className = 'timer';
  timer.setAttribute('data-testid', 'rec-overlay-timer');
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
   * the end of is a row it can be missed in. Purely visual — the announcing
   * is the announcer's job, because this row is replaced on every heal.
   */
  function renderChips(
    next: { mic: boolean; tabAudio: boolean; webcam: boolean },
    warn: boolean,
  ): void {
    chips.replaceChildren();
    if (warn) {
      const chip = makeChip(t('recOverlayNotSaving', 'NOT SAVING'));
      chip.className = 'chip warn';
      chip.setAttribute('data-testid', 'rec-overlay-warning');
      chips.appendChild(chip);
    }
    if (next.mic) chips.appendChild(makeChip(t('recOverlayMic', 'MIC')));
    if (next.tabAudio) chips.appendChild(makeChip(t('recOverlayTabAudio', 'TAB')));
    if (next.webcam) chips.appendChild(makeChip(t('recOverlayWebcam', 'CAM')));
  }

  const announcer = document.createElement('div');
  announcer.className = 'announcer';
  announcer.setAttribute('role', 'alert');
  announcer.setAttribute('data-testid', 'rec-overlay-announcer');
  bar.appendChild(announcer);

  /** Say it once. `warning` is one-way, so this runs at most once per run. */
  function announceWarning(): void {
    announcer.textContent = t('recOverlayNotSaving', 'NOT SAVING');
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
  // After the append, never before: a live region has to be in the document
  // when its text changes, or the change is part of the insertion and is not
  // announced. This is the fresh-mount half of the edge.
  if (warning) announceWarning();

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
    camHost.setAttribute('data-testid', 'rec-overlay-cam');
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
      // A persisted position rides `healOverlay`'s re-mount after a
      // navigation; a fresh recording with nothing persisted keeps the old
      // bottom-right default. Either way it is clamped to *this* window,
      // which may be a different size than the one the position was saved
      // from.
      const defaultPos = {
        x: Math.max(0, window.innerWidth - size - MARGIN_PX),
        y: Math.max(0, window.innerHeight - size - MARGIN_PX),
      };
      let { x, y } = clampBubblePosition(
        bubblePos ?? defaultPos,
        window.innerWidth,
        window.innerHeight,
        size,
      );
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
        ({ x, y } = clampBubblePosition({ x, y }, window.innerWidth, window.innerHeight, size));
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
        ({ x, y } = clampBubblePosition(
          { x: e.clientX - grabX, y: e.clientY - grabY },
          window.innerWidth,
          window.innerHeight,
          size,
        ));
        place();
      });
      const endDrag = (e: PointerEvent): void => {
        if (dragId !== e.pointerId) return;
        dragId = null;
        wrap.releasePointerCapture(e.pointerId);
        // Only a real drag end persists — the worker stores it on
        // `StoredRecState` and `healOverlay` hands it back as this
        // function's `bubblePos` argument on the next mount, which is what
        // makes the position survive a navigation.
        safeSend({ type: 'REC_BUBBLE_MOVED', x, y });
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
    // opacity: 0 alone leaves Stop, Cancel and Pause reachable by Tab and
    // visible to assistive tech even though nothing is painted — a
    // keyboard or screen-reader user could land a live Stop button they
    // cannot see. `inert` removes the whole subtree from both the tab order
    // and the accessibility tree in one property, and reverses the moment
    // the bar is shown again, so nothing per-button has to track it.
    host.inert = !show;
  }

  host.addEventListener('mouseenter', () => {
    hoveringBar = true;
    applyBarVisibility();
  });
  host.addEventListener('mouseleave', () => {
    hoveringBar = false;
    applyBarVisibility();
  });

  // --- Reveal catcher --------------------------------------------------------

  // `mousemove` on `window` (below, in the cursor logger) never reaches this
  // script while the pointer is over a cross-origin iframe — the iframe's own
  // document owns those events, and they do not cross the origin boundary —
  // so the reveal zone above is dead wherever a cross-origin iframe (a chat
  // widget, an embedded player) sits under it, and the bar can become
  // permanently unreachable by pointer. This element is a second, much
  // smaller reveal surface, `position: fixed` at the same top layer as the
  // bar, so pointer hit-testing resolves to it instead of whatever the
  // iframe painted underneath, regardless of what the iframe covers.
  //
  // It costs the page the hover/click on that patch, permanently, for as
  // long as a recording is live — kept to 64x24 (the WCAG 2.5.8 minimum
  // target size, not the full 400x120 zone above) to keep that patch small.
  // It stays mounted whether the bar itself is shown or hidden, because the
  // dead zone can be hovered at either moment.
  const CATCHER_WIDTH_PX = 64;
  const CATCHER_HEIGHT_PX = 24;
  const catcherHost = document.createElement('div');
  catcherHost.setAttribute('data-testid', 'rec-overlay-catcher');
  catcherHost.setAttribute('aria-hidden', 'true');
  catcherHost.style.cssText =
    'all:initial;position:fixed;left:50%;bottom:0;' +
    `width:${CATCHER_WIDTH_PX}px;height:${CATCHER_HEIGHT_PX}px;` +
    // One below the bar's own z-index, so the real bar always wins the few
    // pixels where the two could visually meet; still far above any
    // ordinary page content, iframe included.
    'transform:translateX(-50%);z-index:2147483646;';
  const catcherShadow = catcherHost.attachShadow({ mode: 'closed' });
  const catcherStyle = document.createElement('style');
  catcherStyle.textContent = `
    .grip {
      width: 100%;
      height: 100%;
      border-radius: 6px 6px 0 0;
      background: rgba(20, 20, 22, .35);
      transition: background .15s;
    }
    .grip:hover { background: rgba(20, 20, 22, .6); }
    @media (prefers-reduced-motion: reduce) {
      .grip { transition: none; }
    }
  `;
  catcherShadow.appendChild(catcherStyle);
  const grip = document.createElement('div');
  grip.className = 'grip';
  catcherShadow.appendChild(grip);
  document.documentElement.appendChild(catcherHost);

  /** Refresh the reveal clock. Pointer hover on the catcher, and the
   *  keyboard command below, both just do this — same as a `mousemove`
   *  landing inside the ordinary reveal zone. */
  function revealNow(): void {
    lastNearAt = Date.now();
    applyBarVisibility();
  }
  catcherHost.addEventListener('pointerenter', revealNow);
  catcherHost.addEventListener('pointermove', revealNow);
  catcherHost.addEventListener('pointerdown', revealNow);

  // The keyboard route: `chrome.commands` fires this at the browser level,
  // before any keystroke reaches page or iframe script, so the worker can
  // call this from a tab whose focus is anywhere at all — including inside a
  // cross-origin iframe, which no in-page key listener could say. See
  // `handleRevealBar` in src/background/recording.ts.
  win.__ossRecReveal = revealNow;

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

  // Never a number before the engine has a zero to count from — see
  // `anchoredElapsed`. The bar is up and its Stop and Cancel work throughout
  // this window; what it does not do is claim a duration nothing recorded.
  function renderTimer(): void {
    timer.textContent = isAnchored ? formatTimer(nowT()) : t('recOverlayStarting', 'Starting…');
  }

  const timerInterval = setInterval(() => {
    renderTimer();
    applyBarVisibility();
  }, 500);
  renderTimer();

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

  win.__ossRecSync = (nextElapsedMs, nextPaused, nextTracks, nextWriteFailed, nextAnchored) => {
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
    renderPauseState();
    renderTimer();

    // One-way, like the tracks above: a run that has started losing chunks
    // does not stop having lost them, and a stale heal carrying `false`
    // cannot take the warning back off.
    const wasWarning = warning;
    warning = warning || nextWriteFailed;
    renderChips(nextTracks, warning);
    // The sync half of the edge: only the false -> true transition speaks, so
    // the heal on every popup open and every navigation stays silent.
    if (warning && !wasWarning) announceWarning();

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
    catcherHost.remove();
    // Removing the frame tears down its document, which stops the preview
    // stream and drops the camera indicator.
    camHost?.remove();
    delete win.__ossRecOverlay;
    delete win.__ossRecSync;
    delete win.__ossRecReveal;
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
