import { describe, expect, it } from 'vitest';
import {
  clampTrim,
  locate,
  timelineAt,
  totalDuration,
  visibleDuration,
  type SegmentTiming,
} from '../../src/recorder/timeline-math';

describe('visibleDuration', () => {
  it('subtracts both trims from the source duration', () => {
    const s: SegmentTiming = {
      segmentId: 'a',
      sourceDuration: 10_000,
      trimStart: 1000,
      trimEnd: 500,
    };
    expect(visibleDuration(s)).toBe(8500);
  });
});

describe('totalDuration', () => {
  it('sums visible duration across segments', () => {
    const timings: SegmentTiming[] = [
      { segmentId: 'a', sourceDuration: 5000, trimStart: 500, trimEnd: 500 },
      { segmentId: 'b', sourceDuration: 8000, trimStart: 1000, trimEnd: 0 },
      { segmentId: 'c', sourceDuration: 3000, trimStart: 0, trimEnd: 200 },
    ];
    expect(totalDuration(timings)).toBe(4000 + 7000 + 2800);
  });
});

describe('locate / timelineAt round trip', () => {
  const timings: SegmentTiming[] = [
    { segmentId: 'a', sourceDuration: 5000, trimStart: 500, trimEnd: 500 }, // visible 4000
    { segmentId: 'b', sourceDuration: 8000, trimStart: 1000, trimEnd: 0 }, // visible 7000
    { segmentId: 'c', sourceDuration: 3000, trimStart: 0, trimEnd: 200 }, // visible 2800
  ];
  const total = totalDuration(timings);

  it('locates the very start of the timeline', () => {
    expect(locate(timings, 0)).toEqual({ index: 0, sourceMs: 500 });
  });

  it('locates the boundary between segment 0 and 1 as the end of segment 0', () => {
    expect(locate(timings, 4000)).toEqual({ index: 0, sourceMs: 4500 });
  });

  it('locates a point inside segment 1', () => {
    expect(locate(timings, 7500)).toEqual({ index: 1, sourceMs: 4500 });
  });

  it('locates the very end of the timeline as the end of the last segment', () => {
    expect(locate(timings, total)).toEqual({ index: 2, sourceMs: 2800 });
  });

  it('clamps timelineMs past the end to the last frame', () => {
    expect(locate(timings, total + 999_999)).toEqual({ index: 2, sourceMs: 2800 });
  });

  it('clamps negative timelineMs to the first frame', () => {
    expect(locate(timings, -500)).toEqual({ index: 0, sourceMs: 500 });
  });

  it('timelineAt is the inverse of locate at the start', () => {
    expect(timelineAt(timings, 0, 500)).toBe(0);
  });

  it('timelineAt is the inverse of locate inside segment 1', () => {
    expect(timelineAt(timings, 1, 4500)).toBe(7500);
  });

  it('timelineAt is the inverse of locate at the end', () => {
    expect(timelineAt(timings, 2, 2800)).toBe(total);
  });
});

describe('clampTrim', () => {
  it('leaves in-range trims unchanged', () => {
    expect(clampTrim(10_000, 1000, 2000)).toEqual({ start: 1000, end: 2000 });
  });

  it('floors to leave at least 100ms visible', () => {
    expect(clampTrim(1000, 950, 200)).toEqual({ start: 900, end: 0 });
  });

  it('clamps both trims non-negative', () => {
    expect(clampTrim(5000, -10, -5)).toEqual({ start: 0, end: 0 });
  });

  it('floors when both requested trims are oversized', () => {
    expect(clampTrim(2000, 5000, 5000)).toEqual({ start: 1900, end: 0 });
  });
});
