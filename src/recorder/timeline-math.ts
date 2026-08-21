/**
 * Timeline math for the recorder editor: maps between timeline ms (the
 * trimmed, concatenated multi-segment view) and source ms (a single
 * segment's own recording clock). Pure — no DOM, no chrome APIs.
 */

export interface SegmentTiming {
  segmentId: string;
  sourceDuration: number;
  trimStart: number;
  trimEnd: number;
}

/** Segment duration after trims, in ms. */
export function visibleDuration(s: SegmentTiming): number {
  return s.sourceDuration - s.trimStart - s.trimEnd;
}

/** Total timeline duration across all segments, in ms. */
export function totalDuration(timings: SegmentTiming[]): number {
  return timings.reduce((sum, s) => sum + visibleDuration(s), 0);
}

/** Maps a timeline ms to a segment index and source ms within that segment. */
export function locate(
  timings: SegmentTiming[],
  timelineMs: number,
): { index: number; sourceMs: number } {
  if (timings.length === 0) return { index: 0, sourceMs: 0 };

  const total = totalDuration(timings);
  const clamped = Math.max(0, Math.min(timelineMs, total));

  let acc = 0;
  for (let i = 0; i < timings.length; i++) {
    const vd = visibleDuration(timings[i]);
    const localEnd = acc + vd;
    if (clamped <= localEnd || i === timings.length - 1) {
      return { index: i, sourceMs: timings[i].trimStart + (clamped - acc) };
    }
    acc = localEnd;
  }

  return { index: 0, sourceMs: 0 };
}

/** Inverse of `locate`: a segment index and source ms back to timeline ms. */
export function timelineAt(timings: SegmentTiming[], index: number, sourceMs: number): number {
  let acc = 0;
  for (let i = 0; i < index; i++) {
    acc += visibleDuration(timings[i]);
  }
  return acc + (sourceMs - timings[index].trimStart);
}

/** Clamps trim start/end to non-negative values that leave >=100ms visible. */
export function clampTrim(
  sourceDuration: number,
  start: number,
  end: number,
): { start: number; end: number } {
  const maxTotal = Math.max(0, sourceDuration - 100);
  const clampedStart = Math.max(0, Math.min(start, maxTotal));
  const clampedEnd = Math.max(0, Math.min(end, maxTotal - clampedStart));
  return { start: clampedStart, end: clampedEnd };
}
