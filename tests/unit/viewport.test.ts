import { describe, it, expect } from 'vitest';
import { clampZoom, fitZoom, FIT_PADDING, MIN_ZOOM, MAX_ZOOM } from '../../src/editor/viewport';

describe('clampZoom', () => {
  it('holds a value inside the zoom range', () => {
    expect(clampZoom(0.5)).toBe(0.5);
    expect(clampZoom(0.001)).toBe(MIN_ZOOM);
    expect(clampZoom(99)).toBe(MAX_ZOOM);
  });
});

describe('fitZoom', () => {
  it('never upscales an image smaller than the viewport', () => {
    expect(fitZoom(1000, 800, 400, 300)).toBe(1);
  });

  it('binds a tall image by height, minus the padding', () => {
    const zoom = fitZoom(1000, 800, 500, 4000, 24);
    expect(zoom).toBeCloseTo((800 - 48) / 4000, 10);
  });

  it('binds a wide image by width, minus the padding', () => {
    const zoom = fitZoom(600, 2000, 3000, 500, 24);
    expect(zoom).toBeCloseTo((600 - 48) / 3000, 10);
  });

  it('leaves the image clear of both edges', () => {
    const zoom = fitZoom(1000, 800, 500, 4000);
    expect(4000 * zoom).toBeLessThanOrEqual(800 - FIT_PADDING * 2);
  });

  it('survives a viewport smaller than the padding', () => {
    const zoom = fitZoom(10, 10, 500, 500, 24);
    expect(zoom).toBeGreaterThanOrEqual(MIN_ZOOM);
    expect(Number.isFinite(zoom)).toBe(true);
  });

  it('clamps a huge image to the minimum zoom', () => {
    expect(fitZoom(1000, 800, 500000, 500000)).toBe(MIN_ZOOM);
  });
});
