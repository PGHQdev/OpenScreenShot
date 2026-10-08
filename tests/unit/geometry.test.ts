import { describe, expect, it } from 'vitest';
import {
  clampRegionRect,
  computeScrollPositions,
  MAX_CANVAS_HEIGHT_PX,
  splitHeight,
} from '../../src/shared/geometry';

describe('computeScrollPositions', () => {
  it('returns a single [0] when the page fits in one viewport', () => {
    expect(computeScrollPositions(100, 200)).toEqual([0]);
    expect(computeScrollPositions(200, 200)).toEqual([0]);
  });

  it('covers exactly two viewports with two positions', () => {
    expect(computeScrollPositions(200, 100)).toEqual([0, 100]);
  });

  it('aligns the last tile to the page bottom (2.5 viewports)', () => {
    // scrollHeight 250, viewport 100 -> last scroll must be 150 so the
    // bottom (150..250) is fully captured.
    expect(computeScrollPositions(250, 100)).toEqual([0, 100, 150]);
  });

  it('covers a whole number of viewports without a trailing duplicate', () => {
    expect(computeScrollPositions(300, 100)).toEqual([0, 100, 200]);
  });

  it('handles a tall page with many tiles', () => {
    // 1000px page, 250px viewport -> positions 0,250,500,750
    expect(computeScrollPositions(1000, 250)).toEqual([0, 250, 500, 750]);
  });

  it('the final position is always scrollHeight - viewportHeight', () => {
    const positions = computeScrollPositions(1234, 400);
    expect(positions[positions.length - 1]).toBe(1234 - 400);
  });

  it('positions are strictly increasing', () => {
    const positions = computeScrollPositions(9999, 333);
    for (let i = 1; i < positions.length; i++) {
      expect(positions[i]).toBeGreaterThan(positions[i - 1]);
    }
  });
});

describe('MAX_CANVAS_HEIGHT_PX', () => {
  it("is below Chrome's ~32767px per-side canvas cap", () => {
    expect(MAX_CANVAS_HEIGHT_PX).toBeLessThan(32767);
    expect(MAX_CANVAS_HEIGHT_PX).toBeGreaterThan(0);
  });
});

describe('clampRegionRect', () => {
  it('keeps a rect fully inside the viewport unchanged', () => {
    const r = { x: 10, y: 20, width: 100, height: 50 };
    expect(clampRegionRect(r, 1280, 800)).toEqual(r);
  });

  it('clips a rect hanging off the right and bottom edges', () => {
    expect(clampRegionRect({ x: 1200, y: 750, width: 200, height: 100 }, 1280, 800)).toEqual({
      x: 1200,
      y: 750,
      width: 80,
      height: 50,
    });
  });

  it('clips a rect with negative origin to the viewport', () => {
    expect(clampRegionRect({ x: -30, y: -10, width: 100, height: 50 }, 1280, 800)).toEqual({
      x: 0,
      y: 0,
      width: 70,
      height: 40,
    });
  });

  it('returns null when the rect lies outside a smaller viewport', () => {
    expect(clampRegionRect({ x: 900, y: 100, width: 50, height: 50 }, 800, 600)).toBe(null);
  });

  it('returns null when clipping leaves a sliver under 2px', () => {
    expect(clampRegionRect({ x: 1279, y: 0, width: 100, height: 50 }, 1280, 800)).toBe(null);
    expect(clampRegionRect({ x: 0, y: 799, width: 50, height: 100 }, 1280, 800)).toBe(null);
  });
});

describe('splitHeight', () => {
  it('keeps a page that fits as one band', () => {
    expect(splitHeight(500, 1000)).toEqual([{ top: 0, height: 500 }]);
    expect(splitHeight(1000, 1000)).toEqual([{ top: 0, height: 1000 }]);
  });

  it('splits into the fewest equal bands under the limit', () => {
    expect(splitHeight(1001, 1000)).toEqual([
      { top: 0, height: 501 },
      { top: 501, height: 500 },
    ]);
    expect(splitHeight(3000, 1000)).toHaveLength(3);
  });

  it('covers every pixel once with bands no taller than the limit', () => {
    const height = 100_003;
    const parts = splitHeight(height, MAX_CANVAS_HEIGHT_PX);
    expect(parts).toHaveLength(4);
    expect(parts.every((p) => p.height <= MAX_CANVAS_HEIGHT_PX)).toBe(true);
    parts.forEach((p, i) =>
      expect(p.top).toBe(i === 0 ? 0 : parts[i - 1].top + parts[i - 1].height),
    );
    expect(parts.reduce((sum, p) => sum + p.height, 0)).toBe(height);
  });
});
