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

/**
 * Centre a framed image in the viewport. Pan is the screen position of the
 * screenshot's origin, so the padding is added back after centring the outer box.
 */
export function centerView(
  viewportW: number,
  viewportH: number,
  outerW: number,
  outerH: number,
  pad: number,
  zoom: number,
): { zoom: number; panX: number; panY: number } {
  return {
    zoom,
    panX: (viewportW - outerW * zoom) / 2 + pad * zoom,
    panY: (viewportH - outerH * zoom) / 2 + pad * zoom,
  };
}

/** Fit horizontally; long captures start at the top and scroll vertically. */
export function fitWidthView(
  viewportW: number,
  viewportH: number,
  outerW: number,
  outerH: number,
  pad: number,
): { zoom: number; panX: number; panY: number } {
  const zoom = clampZoom(Math.min(Math.max(1, viewportW - FIT_PADDING * 2) / outerW, 1));
  const view = centerView(viewportW, viewportH, outerW, outerH, pad, zoom);
  view.panY = Math.max(FIT_PADDING, (viewportH - outerH * zoom) / 2) + pad * zoom;
  return view;
}

/** Wheel scrolling stays inside the framed image, keeping shorter axes centered. */
export function scrollView(
  view: { zoom: number; panX: number; panY: number },
  viewportW: number,
  viewportH: number,
  outerW: number,
  outerH: number,
  pad: number,
  dx: number,
  dy: number,
): { zoom: number; panX: number; panY: number } {
  const clampPan = (pan: number, viewport: number, outer: number) => {
    const size = outer * view.zoom;
    const offset = pad * view.zoom;
    if (size <= viewport - FIT_PADDING * 2) return (viewport - size) / 2 + offset;
    return Math.max(viewport - size - FIT_PADDING + offset, Math.min(FIT_PADDING + offset, pan));
  };
  return {
    zoom: view.zoom,
    panX: clampPan(view.panX - dx, viewportW, outerW),
    panY: clampPan(view.panY - dy, viewportH, outerH),
  };
}
