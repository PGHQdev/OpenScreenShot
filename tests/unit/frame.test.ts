import { describe, it, expect } from 'vitest';
import {
  DEFAULT_FRAME,
  frameMetrics,
  shadowPlateRect,
  type FrameOptions,
} from '../../src/editor/frame';
import { MAX_CANVAS_HEIGHT_PX } from '../../src/shared/geometry';

const on = (patch: Partial<FrameOptions> = {}): FrameOptions => ({
  ...DEFAULT_FRAME,
  enabled: true,
  ...patch,
});

describe('frameMetrics', () => {
  it('is a no-op when beautify is off', () => {
    const m = frameMetrics({ ...DEFAULT_FRAME, enabled: false }, 800, 600);
    expect(m.pad).toBe(0);
    expect(m.radius).toBe(0);
    expect(m.shadowAlpha).toBe(0);
    expect(m.outerW).toBe(800);
    expect(m.outerH).toBe(600);
  });

  it('takes padding from the shorter side, so shape does not change the look', () => {
    expect(frameMetrics(on({ padding: 100 }), 1000, 1000).pad).toBe(120);
    expect(frameMetrics(on({ padding: 100 }), 500, 4000).pad).toBe(60);
    expect(frameMetrics(on({ padding: 50 }), 1000, 1000).pad).toBe(60);
  });

  it('grows the outer box by the padding on every side', () => {
    const m = frameMetrics(on({ padding: 40 }), 1000, 700);
    expect(m.pad).toBe(34);
    expect(m.outerW).toBe(1000 + 34 * 2);
    expect(m.outerH).toBe(700 + 34 * 2);
    expect(m.imgW).toBe(1000);
    expect(m.imgH).toBe(700);
  });

  it('takes the corner radius from the shorter side too', () => {
    expect(frameMetrics(on({ radius: 100 }), 1000, 4000).radius).toBe(60);
    expect(frameMetrics(on({ radius: 50 }), 1000, 1000).radius).toBe(30);
  });

  it('derives the shadow offset and alpha from the strength', () => {
    const m = frameMetrics(on({ shadow: 45 }), 1000, 1000);
    expect(m.shadowBlur).toBe(23);
    expect(m.shadowOffsetY).toBe(8);
    expect(m.shadowAlpha).toBeGreaterThan(0);
    expect(m.shadowAlpha).toBeLessThan(1);
  });

  it('draws no shadow at strength zero', () => {
    const m = frameMetrics(on({ shadow: 0 }), 1000, 1000);
    expect(m.shadowBlur).toBe(0);
    expect(m.shadowAlpha).toBe(0);
  });

  it('clamps slider values that fall outside 0..100', () => {
    expect(frameMetrics(on({ padding: 999 }), 1000, 1000).pad).toBe(120);
    expect(frameMetrics(on({ padding: -50 }), 1000, 1000).pad).toBe(0);
  });

  it('survives a one-pixel image', () => {
    const m = frameMetrics(on({ padding: 100, radius: 100 }), 1, 1);
    expect(Number.isFinite(m.pad)).toBe(true);
    expect(m.outerW).toBeGreaterThanOrEqual(1);
  });

  it('clamps padding so beautify alone cannot push the canvas past the side cap', () => {
    // A capture already at the height cap has no room left to pad vertically.
    const m = frameMetrics(on({ padding: 100 }), 3840, MAX_CANVAS_HEIGHT_PX);
    expect(m.pad).toBe(0);
    expect(m.outerW).toBe(3840);
    expect(m.outerH).toBe(MAX_CANVAS_HEIGHT_PX);
  });

  it('clamps padding to whichever side has the least headroom', () => {
    // Unclamped padding at these settings is 480px; only 5px of headroom
    // remains on the width side before it crosses the cap.
    const m = frameMetrics(on({ padding: 100 }), MAX_CANVAS_HEIGHT_PX - 10, 4000);
    expect(m.pad).toBe(5);
    expect(m.outerW).toBe(MAX_CANVAS_HEIGHT_PX);
    expect(m.outerH).toBeLessThanOrEqual(MAX_CANVAS_HEIGHT_PX);
  });

  it('does not clamp padding for a normal-sized capture', () => {
    // Same case the existing "grows the outer box" test covers — the cap must
    // not interfere with ordinary sizes.
    expect(frameMetrics(on({ padding: 40 }), 1000, 700).pad).toBe(34);
  });
});

describe('shadowPlateRect', () => {
  it('insets by 1px on every side', () => {
    expect(shadowPlateRect(1000, 700)).toEqual({ x: 1, y: 1, w: 998, h: 698 });
  });

  it('skips the inset once a side is under 2px', () => {
    expect(shadowPlateRect(1, 700)).toEqual({ x: 0, y: 0, w: 1, h: 700 });
    expect(shadowPlateRect(700, 1)).toEqual({ x: 0, y: 0, w: 700, h: 1 });
    expect(shadowPlateRect(0, 0)).toEqual({ x: 0, y: 0, w: 0, h: 0 });
  });
});
