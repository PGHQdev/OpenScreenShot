import { describe, expect, it } from 'vitest';
import {
  bubbleRect,
  cameraSourceRect,
  clampBubbleCenter,
  fitRect,
  rippleAt,
  RIPPLE_MS,
} from '../../src/recorder/render';
import { clampCenter, IDENTITY_CAMERA } from '../../src/recorder/zoom';

describe('fitRect', () => {
  it('letterboxes a source wider than the destination', () => {
    expect(fitRect(1600, 900, 800, 800)).toEqual({ x: 0, y: 175, w: 800, h: 450 });
  });

  it('pillarboxes a source taller than the destination', () => {
    expect(fitRect(400, 800, 800, 800)).toEqual({ x: 200, y: 0, w: 400, h: 800 });
  });

  it('fills the destination when the aspect ratios match', () => {
    expect(fitRect(1280, 720, 640, 360)).toEqual({ x: 0, y: 0, w: 640, h: 360 });
  });

  it('scales a small source up to fill the destination', () => {
    expect(fitRect(320, 180, 1280, 720)).toEqual({ x: 0, y: 0, w: 1280, h: 720 });
  });

  it('returns an empty rect for a degenerate source or destination', () => {
    expect(fitRect(0, 900, 800, 800)).toEqual({ x: 0, y: 0, w: 0, h: 0 });
    expect(fitRect(1600, 900, 800, 0)).toEqual({ x: 0, y: 0, w: 0, h: 0 });
  });
});

describe('cameraSourceRect', () => {
  it('takes the whole frame at the identity camera', () => {
    expect(cameraSourceRect(IDENTITY_CAMERA, 1280, 720)).toEqual({
      sx: 0,
      sy: 0,
      sw: 1280,
      sh: 720,
    });
  });

  it('takes a centered quarter-area rect at 2x on the center', () => {
    expect(cameraSourceRect({ scale: 2, cx: 0.5, cy: 0.5 }, 1280, 720)).toEqual({
      sx: 320,
      sy: 180,
      sw: 640,
      sh: 360,
    });
  });

  it('sits flush with the frame edge at a clamped corner target', () => {
    const cam = { scale: 2, cx: clampCenter(1, 2), cy: clampCenter(1, 2) };
    expect(cameraSourceRect(cam, 1280, 720)).toEqual({ sx: 640, sy: 360, sw: 640, sh: 360 });

    const topLeft = { scale: 2, cx: clampCenter(0, 2), cy: clampCenter(0, 2) };
    expect(cameraSourceRect(topLeft, 1280, 720)).toEqual({ sx: 0, sy: 0, sw: 640, sh: 360 });
  });

  it('takes a ninth of the area at 3x', () => {
    expect(cameraSourceRect({ scale: 3, cx: 0.5, cy: 0.5 }, 900, 600)).toEqual({
      sx: 300,
      sy: 200,
      sw: 300,
      sh: 200,
    });
  });
});

describe('rippleAt', () => {
  it('starts at the click point, fully opaque', () => {
    expect(rippleAt(0)).toEqual({ r: 0, alpha: 1 });
  });

  it('is half grown and half faded at half its life', () => {
    expect(rippleAt(RIPPLE_MS / 2)).toEqual({ r: 0.03, alpha: 0.5 });
  });

  it('ends at the maximum radius', () => {
    const late = rippleAt(RIPPLE_MS - 1);
    expect(late).not.toBeNull();
    expect(late!.r).toBeCloseTo(0.06, 3);
    expect(late!.alpha).toBeCloseTo(0, 2);
  });

  it('is gone at and after its life', () => {
    expect(rippleAt(RIPPLE_MS)).toBeNull();
    expect(rippleAt(RIPPLE_MS + 1)).toBeNull();
  });

  it('is gone before the click', () => {
    expect(rippleAt(-1)).toBeNull();
  });
});

describe('bubbleRect', () => {
  // 1280x720: min side 720, size 0.22 -> d 158.4, margin 2% -> 14.4.
  const base = { x: 0.85, y: 0.85, size: 0.22, hidden: false } as const;

  // Binary floats make the corner insets land a few ulps off, so the corner
  // cases compare to 9 decimals instead of by identity.
  function expectCircle(
    actual: { x: number; y: number; d: number },
    x: number,
    y: number,
    d: number,
  ) {
    expect(actual.x).toBeCloseTo(x, 9);
    expect(actual.y).toBeCloseTo(y, 9);
    expect(actual.d).toBeCloseTo(d, 9);
  }

  it('places each corner preset a 2% margin off its two edges', () => {
    expectCircle(bubbleRect({ ...base, corner: 'tl' }, 1280, 720), 93.6, 93.6, 158.4);
    expectCircle(bubbleRect({ ...base, corner: 'tr' }, 1280, 720), 1186.4, 93.6, 158.4);
    expectCircle(bubbleRect({ ...base, corner: 'bl' }, 1280, 720), 93.6, 626.4, 158.4);
    expectCircle(bubbleRect({ ...base, corner: 'br' }, 1280, 720), 1186.4, 626.4, 158.4);
  });

  it('places a custom bubble at its normalized center', () => {
    expect(bubbleRect({ ...base, corner: 'custom', x: 0.5, y: 0.25 }, 1280, 720)).toEqual({
      x: 640,
      y: 180,
      d: 158.4,
    });
  });

  it('sizes the diameter off the shorter side', () => {
    expect(bubbleRect({ ...base, corner: 'custom', size: 0.5 }, 400, 1000).d).toBe(200);
    expect(bubbleRect({ ...base, corner: 'custom', size: 0.5 }, 1000, 400).d).toBe(200);
  });
});

describe('clampBubbleCenter', () => {
  it('passes a center already inside the safe range through unchanged', () => {
    expect(clampBubbleCenter(0.5, 0.5, 0.2, 1000, 1000)).toEqual({ x: 0.5, y: 0.5 });
  });

  it('pulls a center back so the circle stays inside a square frame', () => {
    // size 0.2 on a 1000x1000 frame -> radius 100 -> 0.1 normalized on each axis.
    expect(clampBubbleCenter(0, 0, 0.2, 1000, 1000)).toEqual({ x: 0.1, y: 0.1 });
    expect(clampBubbleCenter(1, 1, 0.2, 1000, 1000)).toEqual({ x: 0.9, y: 0.9 });
  });

  it('clamps each axis by its own share of the shared radius on a non-square frame', () => {
    // short side 720, size 0.2 -> radius 72; rx = 72/1280, ry = 72/720 = 0.1.
    const clamped = clampBubbleCenter(0, 0, 0.2, 1280, 720);
    expect(clamped.x).toBeCloseTo(72 / 1280, 9);
    expect(clamped.y).toBeCloseTo(0.1, 9);
  });

  it('falls back to the center on a size that cannot fit', () => {
    expect(clampBubbleCenter(0.1, 0.9, 1, 1000, 1000)).toEqual({ x: 0.5, y: 0.5 });
  });

  it('falls back to the center on a degenerate frame', () => {
    expect(clampBubbleCenter(0.3, 0.3, 0.2, 0, 1000)).toEqual({ x: 0.5, y: 0.5 });
  });
});
