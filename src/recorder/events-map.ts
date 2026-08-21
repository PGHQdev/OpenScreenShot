/**
 * Maps raw cursor-log events (CSS px, live viewport) to normalized 0..1
 * coordinates in a segment's own source clock. Pure — no DOM, no chrome
 * APIs — so it stays portable to the export renderer.
 */
import type { CursorEvent, SegmentViewport } from '../shared/recording-types';

/** `t` is SOURCE ms within the segment (the segment's own recording clock). */
export interface NormClick {
  t: number;
  nx: number;
  ny: number;
}

function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v));
}

/** Normalizes every click against the viewport that was live at its time. */
export function normalizeClicks(events: CursorEvent[], initial: SegmentViewport): NormClick[] {
  let w = initial.w;
  let h = initial.h;
  const clicks: NormClick[] = [];
  for (const e of events) {
    if (e.kind === 'resize') {
      w = e.w;
      h = e.h;
    } else if (e.kind === 'click') {
      clicks.push({ t: e.t, nx: clamp01(e.x / w), ny: clamp01(e.y / h) });
    }
  }
  return clicks;
}

/** The latest cursor move at or before `tMs`, or null when none precedes it. */
export function cursorPathAt(
  events: CursorEvent[],
  initial: SegmentViewport,
  tMs: number,
): { nx: number; ny: number } | null {
  let w = initial.w;
  let h = initial.h;
  let found: { x: number; y: number; w: number; h: number } | null = null;

  for (const e of events) {
    if (e.t > tMs) continue;
    if (e.kind === 'resize') {
      w = e.w;
      h = e.h;
    } else if (e.kind === 'move') {
      found = { x: e.x, y: e.y, w, h };
    }
  }

  if (!found) return null;
  return { nx: clamp01(found.x / found.w), ny: clamp01(found.y / found.h) };
}
