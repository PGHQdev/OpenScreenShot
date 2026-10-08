/**
 * Pure geometry helpers for the capture engine. Unit-tested.
 */

/** Max canvas height in device pixels (Chrome's per-side canvas cap is ~32767; leave a margin). */
export const MAX_CANVAS_HEIGHT_PX = 32000;

/**
 * Most images one full-page capture may split into. Each part takes a shelf
 * slot (CAPTURE_HISTORY_LIMIT is 12) and an editor tab, so a larger page asks
 * for visible or region mode instead.
 */
export const MAX_CAPTURE_PARTS = 6;

/**
 * Split a canvas `height` (device px) into the fewest equal bands no taller
 * than `maxHeight`. Earlier bands take the remainder pixel, so heights differ
 * by at most one.
 */
export function splitHeight(height: number, maxHeight: number): { top: number; height: number }[] {
  const count = Math.max(1, Math.ceil(height / maxHeight));
  const base = Math.floor(height / count);
  const extra = height - base * count;
  const parts: { top: number; height: number }[] = [];
  let top = 0;
  for (let i = 0; i < count; i++) {
    const partHeight = base + (i < extra ? 1 : 0);
    parts.push({ top, height: partHeight });
    top += partHeight;
  }
  return parts;
}

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
