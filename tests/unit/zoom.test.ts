import { describe, expect, it } from 'vitest';
import {
  autoZoomBlocks,
  cameraAt,
  clampCenter,
  easeInOutCubic,
  EASE_MS,
  HOLD_MS,
  IDENTITY_CAMERA,
  normalizeBlocks,
  type ZoomBlock,
} from '../../src/recorder/zoom';

describe('clampCenter', () => {
  it('is always 0.5 at scale 1, regardless of input', () => {
    expect(clampCenter(0, 1)).toBe(0.5);
    expect(clampCenter(0.5, 1)).toBe(0.5);
    expect(clampCenter(1, 1)).toBe(0.5);
  });

  it('clamps to the half-frame margin at scale 2', () => {
    expect(clampCenter(0.9, 2)).toBe(0.75);
    expect(clampCenter(0.1, 2)).toBe(0.25);
    expect(clampCenter(0.5, 2)).toBe(0.5);
  });

  it('clamps to the half-frame margin at scale 3', () => {
    expect(clampCenter(0.95, 3)).toBeCloseTo(1 - 0.5 / 3, 10);
    expect(clampCenter(0.05, 3)).toBeCloseTo(0.5 / 3, 10);
  });
});

describe('cameraAt with an unclamped edge target', () => {
  // The stage marker may sit anywhere in 0..1 — the camera, not the input,
  // owns the frame-boundary clamp. A corner target must resolve to the
  // nearest legal camera at every phase of the envelope.
  const corner: ZoomBlock = {
    id: 'z',
    startMs: 0,
    endMs: EASE_MS + HOLD_MS + EASE_MS,
    scale: 1.5,
    cx: 0.02,
    cy: 0.98,
  };

  it('holds at the clamped center, never outside the frame', () => {
    const cam = cameraAt([corner], EASE_MS + HOLD_MS / 2);
    expect(cam.cx).toBeCloseTo(clampCenter(0.02, 1.5), 5);
    expect(cam.cy).toBeCloseTo(clampCenter(0.98, 1.5), 5);
  });

  it('stays inside the frame mid-ease too', () => {
    for (const t of [1, EASE_MS / 2, EASE_MS - 1]) {
      const cam = cameraAt([corner], t);
      const margin = 0.5 / cam.scale;
      expect(cam.cx).toBeGreaterThanOrEqual(margin - 1e-9);
      expect(cam.cy).toBeLessThanOrEqual(1 - margin + 1e-9);
    }
  });
});

describe('autoZoomBlocks', () => {
  it('a single click produces one block with the exact envelope', () => {
    const blocks = autoZoomBlocks([{ t: 5000, nx: 0.5, ny: 0.5 }], 100_000);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].startMs).toBe(4400);
    expect(blocks[0].endMs).toBe(6600);
    expect(blocks[0].scale).toBe(2);
    expect(typeof blocks[0].id).toBe('string');
    expect(blocks[0].id.length).toBeGreaterThan(0);
  });

  it('two clicks 2000ms apart with nearby x join into one block', () => {
    const blocks = autoZoomBlocks(
      [
        { t: 1000, nx: 0.5, ny: 0.5 },
        { t: 3000, nx: 0.55, ny: 0.5 },
      ],
      100_000,
    );
    expect(blocks).toHaveLength(1);
    expect(blocks[0].startMs).toBe(1000 - EASE_MS);
    expect(blocks[0].endMs).toBe(3000 + HOLD_MS + EASE_MS);
    expect(blocks[0].cx).toBeCloseTo(0.525, 10);
  });

  it('two clicks 2600ms apart split into two blocks', () => {
    const blocks = autoZoomBlocks(
      [
        { t: 0, nx: 0.5, ny: 0.5 },
        { t: 2600, nx: 0.5, ny: 0.5 },
      ],
      100_000,
    );
    expect(blocks).toHaveLength(2);
    expect(blocks[0].startMs).toBe(0);
    expect(blocks[0].endMs).toBe(0 + HOLD_MS + EASE_MS);
    expect(blocks[1].startMs).toBe(2600 - EASE_MS);
    expect(blocks[1].endMs).toBe(2600 + HOLD_MS + EASE_MS);
  });

  it('two near-time clicks 0.3 apart in x split into two blocks', () => {
    // 2300ms apart (well under CLUSTER_GAP_MS) so the split is driven by the
    // x distance, not the gap; wide enough that the two single-click
    // envelopes (2200ms each) don't overlap and collapse under normalizeBlocks.
    const blocks = autoZoomBlocks(
      [
        { t: 1000, nx: 0.1, ny: 0.5 },
        { t: 3300, nx: 0.4, ny: 0.5 },
      ],
      100_000,
    );
    expect(blocks).toHaveLength(2);
  });

  it('clamps the block start at t=0', () => {
    const blocks = autoZoomBlocks([{ t: 200, nx: 0.5, ny: 0.5 }], 100_000);
    expect(blocks[0].startMs).toBe(0);
  });

  it('clamps the block end at the segment duration', () => {
    const blocks = autoZoomBlocks([{ t: 5000, nx: 0.5, ny: 0.5 }], 6000);
    expect(blocks[0].startMs).toBe(4400);
    expect(blocks[0].endMs).toBe(6000);
  });

  it('clamps the target center at scale 2', () => {
    const blocks = autoZoomBlocks([{ t: 5000, nx: 0.9, ny: 0.5 }], 100_000);
    expect(blocks[0].cx).toBe(0.75);
  });

  it('returns an empty array for no clicks', () => {
    expect(autoZoomBlocks([], 10_000)).toEqual([]);
  });
});

describe('normalizeBlocks', () => {
  const mk = (startMs: number, endMs: number): ZoomBlock => ({
    id: `${startMs}-${endMs}`,
    startMs,
    endMs,
    scale: 2,
    cx: 0.5,
    cy: 0.5,
  });

  it('cuts the earlier block end to the later block start on overlap', () => {
    const result = normalizeBlocks([mk(2000, 5000), mk(0, 3000)]);
    expect(result).toEqual([{ ...mk(0, 3000), endMs: 2000 }, mk(2000, 5000)]);
  });

  it('drops a block whose envelope is under 2*EASE_MS on its own', () => {
    const result = normalizeBlocks([mk(0, 1000)]);
    expect(result).toEqual([]);
  });

  it('drops a block that shrinks below 2*EASE_MS after an overlap cut', () => {
    const result = normalizeBlocks([mk(0, 1300), mk(1100, 4000)]);
    expect(result).toEqual([mk(1100, 4000)]);
  });

  it('leaves disjoint blocks unchanged, sorted by startMs', () => {
    const result = normalizeBlocks([mk(5000, 7000), mk(0, 2000)]);
    expect(result).toEqual([mk(0, 2000), mk(5000, 7000)]);
  });
});

describe('cameraAt', () => {
  const block: ZoomBlock = {
    id: 'b1',
    startMs: 1000,
    endMs: 3200,
    scale: 2,
    cx: 0.7,
    cy: 0.3,
  };
  const blocks = [block];

  it('returns identity at the block start', () => {
    expect(cameraAt(blocks, 1000)).toEqual(IDENTITY_CAMERA);
  });

  it('is half-eased at start + EASE_MS/2', () => {
    const cam = cameraAt(blocks, 1300);
    expect(cam.scale).toBeCloseTo(1.5, 10);
    expect(cam.cx).toBeCloseTo(0.6, 10);
    expect(cam.cy).toBeCloseTo(0.4, 10);
  });

  it('is fully at the target during the hold', () => {
    const cam = cameraAt(blocks, 2100);
    expect(cam.scale).toBe(2);
    expect(cam.cx).toBe(0.7);
    expect(cam.cy).toBe(0.3);
  });

  it('returns identity at the block end', () => {
    expect(cameraAt(blocks, 3200)).toEqual(IDENTITY_CAMERA);
  });

  it('returns identity outside every block', () => {
    expect(cameraAt(blocks, 500)).toEqual(IDENTITY_CAMERA);
    expect(cameraAt(blocks, 4000)).toEqual(IDENTITY_CAMERA);
  });

  it('re-clamps the interpolated center even at full hold', () => {
    const wide: ZoomBlock = { id: 'w', startMs: 0, endMs: 2200, scale: 2, cx: 1.0, cy: 0.5 };
    const cam = cameraAt([wide], 1100);
    expect(cam.cx).toBe(0.75);
  });
});

describe('easeInOutCubic', () => {
  it('anchors at 0, 0.5, and 1', () => {
    expect(easeInOutCubic(0)).toBe(0);
    expect(easeInOutCubic(0.5)).toBe(0.5);
    expect(easeInOutCubic(1)).toBe(1);
  });

  it('matches the cubic formula off-center', () => {
    expect(easeInOutCubic(0.25)).toBeCloseTo(0.0625, 10);
    expect(easeInOutCubic(0.75)).toBeCloseTo(0.9375, 10);
  });
});
