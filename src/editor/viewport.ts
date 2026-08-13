/**
 * Viewport arithmetic for the editor canvas.
 *
 * Kept apart from CanvasController so the zoom maths runs without a DOM. Fit
 * leaves a margin on each side, so the image frame and its shadow stay clear of
 * the stage edges.
 */

export const MIN_ZOOM = 0.05;
export const MAX_ZOOM = 8;
/** Breathing room, in CSS px, left on each side of the image at Fit. */
export const FIT_PADDING = 24;

export function clampZoom(v: number): number {
  return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, v));
}

/** Largest zoom that fits the image inside the padded viewport, never above 100%. */
export function fitZoom(
  viewportW: number,
  viewportH: number,
  imgW: number,
  imgH: number,
  padding = FIT_PADDING,
): number {
  const availW = Math.max(1, viewportW - padding * 2);
  const availH = Math.max(1, viewportH - padding * 2);
  return clampZoom(Math.min(availW / imgW, availH / imgH, 1));
}
