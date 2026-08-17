import { describe, it, expect } from 'vitest';
import {
  clampTargetWidth,
  exportWidthCeiling,
  halvingSteps,
  MAX_EXPORT_AREA_PX,
  MAX_EXPORT_SCALE,
  maxSafeExportWidth,
  MIN_EXPORT_WIDTH,
  scaledHeight,
} from '../../src/editor/scale';
import { MAX_CANVAS_HEIGHT_PX } from '../../src/shared/geometry';

describe('halvingSteps', () => {
  it('goes straight there when the target is at or above the source', () => {
    expect(halvingSteps(2400, 2400)).toEqual([2400]);
    expect(halvingSteps(2400, 4800)).toEqual([4800]);
  });

  it('goes straight there for a gentle downscale', () => {
    expect(halvingSteps(2400, 1800)).toEqual([1800]);
    expect(halvingSteps(2400, 1200)).toEqual([1200]);
  });

  it('halves repeatedly for a steep downscale, so detail survives', () => {
    expect(halvingSteps(2400, 600)).toEqual([1200, 600]);
    expect(halvingSteps(2400, 300)).toEqual([1200, 600, 300]);
  });

  it('always ends on the exact target width', () => {
    for (const target of [17, 123, 999, 1201]) {
      const steps = halvingSteps(2400, target);
      expect(steps[steps.length - 1]).toBe(target);
    }
  });

  it('survives degenerate sizes', () => {
    expect(halvingSteps(1, 1)).toEqual([1]);
    expect(halvingSteps(0, 0)).toEqual([1]);
  });
});

describe('scaledHeight', () => {
  it('keeps the aspect ratio', () => {
    expect(scaledHeight(2400, 1360, 1200)).toBe(680);
    expect(scaledHeight(2400, 1360, 1280)).toBe(725);
  });

  it('never returns zero', () => {
    expect(scaledHeight(2400, 3, 16)).toBe(1);
  });
});

describe('clampTargetWidth', () => {
  it('keeps a sane width', () => {
    expect(clampTargetWidth(1280, 2400)).toBe(1280);
  });

  it('holds the floor and the ceiling', () => {
    expect(clampTargetWidth(1, 2400)).toBe(MIN_EXPORT_WIDTH);
    expect(clampTargetWidth(999999, 2400)).toBe(2400 * MAX_EXPORT_SCALE);
  });

  it('falls back to the source width for junk input', () => {
    expect(clampTargetWidth(Number.NaN, 2400)).toBe(2400);
  });

  it('rounds to whole pixels', () => {
    expect(clampTargetWidth(1280.6, 2400)).toBe(1281);
  });

  it('applies the canvas-cap ceiling when the composed height is given', () => {
    // 4x of a 100px-wide source is 400, but a 100 × 20000 composed image hits
    // the height side cap at width 160 first — well under the 4x ceiling.
    expect(clampTargetWidth(999999, 100, 20000)).toBe(maxSafeExportWidth(100, 20000));
    expect(clampTargetWidth(999999, 100, 20000)).toBeLessThan(100 * MAX_EXPORT_SCALE);
  });

  it('leaves the 4x ceiling untouched when the caps do not bind tighter', () => {
    // A normal photo-ish aspect ratio never gets near either cap at 4x.
    expect(clampTargetWidth(999999, 800, 600)).toBe(800 * MAX_EXPORT_SCALE);
  });
});

describe('maxSafeExportWidth', () => {
  it('is bound by the width side cap for a wide, short image', () => {
    expect(maxSafeExportWidth(20000, 100)).toBe(MAX_CANVAS_HEIGHT_PX);
  });

  it('is bound by the derived-height side cap for a narrow, tall image', () => {
    const w = maxSafeExportWidth(100, 20000);
    expect(w).toBe(160);
    // The derived height at that width must not exceed the side cap.
    expect(Math.round((20000 * w) / 100)).toBeLessThanOrEqual(MAX_CANVAS_HEIGHT_PX);
  });

  it('is bound by the area cap for a balanced aspect ratio', () => {
    const w = maxSafeExportWidth(2000, 2000);
    expect(w).toBe(16370);
    expect(w * w).toBeLessThanOrEqual(MAX_EXPORT_AREA_PX);
    // One pixel wider would cross the area cap.
    expect((w + 1) * (w + 1)).toBeGreaterThan(MAX_EXPORT_AREA_PX);
  });

  it('never returns less than the minimum export width', () => {
    expect(maxSafeExportWidth(1, 1_000_000)).toBeGreaterThanOrEqual(MIN_EXPORT_WIDTH);
  });

  it('falls back to the side cap for degenerate input', () => {
    expect(maxSafeExportWidth(0, 0)).toBe(MAX_CANVAS_HEIGHT_PX);
    expect(maxSafeExportWidth(-5, 100)).toBe(MAX_CANVAS_HEIGHT_PX);
  });
});

describe('caps on a real full-page export', () => {
  it('keeps a 200% export of a 20000px-tall capture inside the canvas cap', () => {
    // A 1200 × 20000 capture at 200% naively asks for a 40000px-tall canvas.
    const ceiling = exportWidthCeiling(1200, 20000);
    expect(ceiling).toBe(1920);
    expect(Math.round((20000 * ceiling) / 1200)).toBe(MAX_CANVAS_HEIGHT_PX);
    // So the 200% preset (width 2400) must be rejected as exceeding the cap.
    expect(Math.round(1200 * 2)).toBeGreaterThan(ceiling);
  });
});

describe('exportWidthCeiling', () => {
  it('picks the 4x scale ceiling when the caps do not bind tighter', () => {
    expect(exportWidthCeiling(800, 600)).toBe(800 * MAX_EXPORT_SCALE);
  });

  it('picks the cap-derived ceiling when it is tighter than 4x', () => {
    expect(exportWidthCeiling(100, 20000)).toBe(maxSafeExportWidth(100, 20000));
    expect(exportWidthCeiling(100, 20000)).toBeLessThan(100 * MAX_EXPORT_SCALE);
  });
});
