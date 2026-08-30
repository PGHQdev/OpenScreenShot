/**
 * Pin the current capture in an always-on-top window via Document
 * Picture-in-Picture (ROADMAP.md's "Pin a capture in a floating window"
 * note) — the only always-on-top surface Chrome offers, and (per that same
 * note) the window closes with the tab that opened it, which is spec
 * behaviour, not anything this module enforces.
 *
 * Same shape as eyedropper.ts: a scope narrow enough to stub in a unit test,
 * a plain availability check, and a thin async wrapper around the browser
 * API. TypeScript's DOM lib does not declare documentPictureInPicture yet,
 * so it is declared here.
 */

import { theme as designTheme } from '../shared/design-tokens';
import { t } from './i18n';

export interface DocumentPictureInPictureOptions {
  width?: number;
  height?: number;
}

interface DocumentPictureInPictureAPI {
  requestWindow(options?: DocumentPictureInPictureOptions): Promise<Window>;
}

declare global {
  interface Window {
    documentPictureInPicture?: DocumentPictureInPictureAPI;
  }
}

/** The window surface the pin action needs — a plain object in tests. */
export type PinWindowScope = Pick<Window, 'documentPictureInPicture'>;

/** True when the browser offers Document Picture-in-Picture. */
export function hasPinWindow(scope: PinWindowScope): boolean {
  return typeof scope.documentPictureInPicture?.requestWindow === 'function';
}

/** Shown (via the editor's stage-notice pill) when the browser lacks the API. */
export const PIN_UNAVAILABLE_REASON = t('editorPinUnavailable');

/** Names why requestWindow() rejected, for the same pill. */
export function pinFailureReason(err: unknown): string {
  if (err instanceof DOMException && err.name === 'NotAllowedError') {
    return t('editorPinFailedRetry');
  }
  const detail = err instanceof Error ? err.message : String(err);
  return t('editorPinFailedDetail', [detail]);
}

/**
 * A window size that keeps the composed picture's aspect ratio, capped at
 * maxDim on its longer side — big enough to read, small enough to stay a
 * corner window rather than covering the tab it floats over. Never upscales
 * a picture smaller than maxDim.
 */
export function pinWindowSize(
  w: number,
  h: number,
  maxDim = 480,
): { width: number; height: number } {
  if (w <= 0 || h <= 0) return { width: maxDim, height: maxDim };
  const scale = Math.min(1, maxDim / Math.max(w, h));
  return { width: Math.round(w * scale), height: Math.round(h * scale) };
}

/**
 * Request the floating window. A thin wrapper — hasPinWindow is the
 * caller's gate — so a stubbed scope in a unit test can assert the resolve
 * and reject paths without a real browser.
 */
export async function requestPinWindow(
  scope: PinWindowScope,
  size: { width: number; height: number },
): Promise<Window> {
  return scope.documentPictureInPicture!.requestWindow(size);
}

export type PinTheme = 'light' | 'dark';

/**
 * Inline stylesheet for the pinned window: fits the image with no
 * scrollbars, and matches the editor's current theme. A literal colour, not
 * var(--stage-bg): the pinned window is a separate document with its own
 * CSSOM, so it cannot see tokens.css's custom properties. It comes from the
 * generated token module rather than a hand-copied hex, so a --stage-bg
 * change in tokens.css reaches the pinned window too.
 */
export function pinWindowStyle(theme: PinTheme): string {
  const bg = designTheme[theme].stageBg;
  return `html,body{margin:0;height:100%;background:${bg};overflow:hidden}
body{display:flex;align-items:center;justify-content:center}
img{max-width:100%;max-height:100%;object-fit:contain}`;
}

/**
 * The pinned window's title: what it shows, and that it keeps showing the
 * capture as edits happen (this task's answer to "snapshot or live" — the
 * whole point of a floating pin is to keep matching what the editor holds,
 * the same picture Copy/Export would produce).
 */
export const PIN_WINDOW_TITLE = t('editorPinWindowTitle');

/** Build the pinned window's content: title, style, and the composed picture. */
export function renderPinWindow(pipWindow: Window, dataUrl: string, theme: PinTheme): void {
  const doc = pipWindow.document;
  doc.title = PIN_WINDOW_TITLE;
  const style = doc.createElement('style');
  style.textContent = pinWindowStyle(theme);
  doc.head.appendChild(style);
  const img = doc.createElement('img');
  img.alt = t('editorPinnedCaptureAlt');
  img.src = dataUrl;
  doc.body.appendChild(img);
}

/** Swap the pinned window's picture for a fresh compose — the live-refresh path. */
export function updatePinWindowImage(pipWindow: Window, dataUrl: string): void {
  const img = pipWindow.document.querySelector('img');
  if (img) img.src = dataUrl;
}

/**
 * Coalesces many synchronous triggers (an annotation drag fires
 * applyAnnotations on every native mousemove, unthrottled) into at most one
 * repaint per animation frame — R-29a Important 2: an uncoalesced
 * composeFinal() + toDataURL() on every mousemove visibly stutters the very
 * drag it is reacting to. `run` always reads whatever state is current when
 * the frame actually fires (the caller closes over live refs, not a
 * snapshot), so coalescing many triggers into one run never drops the
 * latest edit — it only skips the ones in between. A trigger that arrives
 * after a run has already fired schedules a fresh frame, so a change is
 * never silently missed just because it landed after the previous frame.
 * schedule/cancel default to requestAnimationFrame/cancelAnimationFrame and
 * are parameters only so a unit test can drive them without a browser.
 */
export function coalesceUpdates(
  run: () => void,
  schedule: (cb: () => void) => number = (cb) => requestAnimationFrame(cb),
  cancel: (id: number) => void = (id) => cancelAnimationFrame(id),
): { trigger: () => void; cancel: () => void } {
  let handle: number | null = null;
  return {
    trigger() {
      if (handle !== null) return;
      handle = schedule(() => {
        handle = null;
        run();
      });
    },
    cancel() {
      if (handle !== null) {
        cancel(handle);
        handle = null;
      }
    },
  };
}
