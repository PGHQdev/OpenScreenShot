/**
 * Pointer and keyboard math for the control page's area selection. Pure, so
 * it is unit-testable; every number is a fraction of the tab's viewport.
 */
import {
  FULL_AREA,
  MIN_AREA_SIDE,
  normalizeArea,
  type RecordingArea,
} from '../shared/recording-types';

export interface Point {
  x: number;
  y: number;
}

function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v));
}

/** The rect between two pointer positions; the whole tab while it is still too small. */
export function areaFromDrag(start: Point, end: Point): RecordingArea {
  const x0 = clamp01(Math.min(start.x, end.x));
  const y0 = clamp01(Math.min(start.y, end.y));
  const x1 = clamp01(Math.max(start.x, end.x));
  const y1 = clamp01(Math.max(start.y, end.y));
  return normalizeArea({ x: x0, y: y0, w: x1 - x0, h: y1 - y0 });
}

/** `area` moved by `dx`/`dy`, held inside the viewport at its own size. */
export function moveArea(area: RecordingArea, dx: number, dy: number): RecordingArea {
  return {
    ...area,
    x: Math.min(1 - area.w, Math.max(0, area.x + dx)),
    y: Math.min(1 - area.h, Math.max(0, area.y + dy)),
  };
}

/** `area` grown or shrunk from its bottom-right corner, never past the viewport or below the minimum. */
export function resizeArea(area: RecordingArea, dw: number, dh: number): RecordingArea {
  return {
    ...area,
    w: Math.min(1 - area.x, Math.max(MIN_AREA_SIDE, area.w + dw)),
    h: Math.min(1 - area.y, Math.max(MIN_AREA_SIDE, area.h + dh)),
  };
}

export function isFullArea(area: RecordingArea): boolean {
  return (
    area.x === FULL_AREA.x &&
    area.y === FULL_AREA.y &&
    area.w === FULL_AREA.w &&
    area.h === FULL_AREA.h
  );
}

/** The recorded size in pixels of a `shotW`x`shotH` still, for the label under it. */
export function areaPixelSize(
  area: RecordingArea,
  shotW: number,
  shotH: number,
): { w: number; h: number } {
  return { w: Math.round(area.w * shotW), h: Math.round(area.h * shotH) };
}
