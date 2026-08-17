import { describe, it, expect } from 'vitest';
import {
  clampTargetWidth,
  halvingSteps,
  MAX_EXPORT_SCALE,
  MIN_EXPORT_WIDTH,
  scaledHeight,
} from '../../src/editor/scale';

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
});
