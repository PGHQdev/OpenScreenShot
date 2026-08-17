import { describe, it, expect } from 'vitest';
import { DEFAULT_FRAME, frameMetrics, type FrameOptions } from '../../src/editor/frame';

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
});
