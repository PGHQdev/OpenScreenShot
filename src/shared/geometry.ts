/**
 * Pure geometry helpers for the capture engine. Unit-tested.
 */

/** Max canvas height in device pixels (Chrome's per-side canvas cap is ~32767; leave a margin). */
export const MAX_CANVAS_HEIGHT_PX = 32000;

/**
 * Intersect a stored region rect (CSS px) with the current viewport, so a
 * repeated region never reads pixels outside the captured tile. Returns null
 * when less than 2×2 px remains — the same minimum the selection overlay
 * enforces.
 */
export function clampRegionRect(
  rect: { x: number; y: number; width: number; height: number },
  viewportWidth: number,
  viewportHeight: number,
): { x: number; y: number; width: number; height: number } | null {
  const x = Math.max(0, rect.x);
  const y = Math.max(0, rect.y);
  const width = Math.min(rect.x + rect.width, viewportWidth) - x;
  const height = Math.min(rect.y + rect.height, viewportHeight) - y;
  if (width < 2 || height < 2) return null;
  return { x, y, width, height };
}

/**
 * Compute the scroll positions (in CSS px, from the top of the page) at which to
 * capture a viewport-sized tile, so that every part of a `scrollHeight`-tall page
 * is covered exactly once (the final tile may overlap the previous one by design,
 * which is harmless because the content matches).
 *
 * - If the page fits in one viewport, returns `[0]`.
 * - Otherwise returns `[0, vh, 2vh, ..., scrollHeight - vh]`.
 */
export function computeScrollPositions(scrollHeight: number, viewportHeight: number): number[] {
  if (scrollHeight <= viewportHeight) return [0];
  const last = scrollHeight - viewportHeight;
  const positions: number[] = [];
  let y = 0;
  while (y < last) {
    positions.push(y);
    y += viewportHeight;
  }
  positions.push(last);
  return positions;
}
