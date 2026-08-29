import { describe, it, expect } from 'vitest';
import {
  applyLook,
  DEFAULT_FRAME,
  FRAME_LOOKS,
  frameMetrics,
  lookIsModified,
  matchLook,
  normalizeBackground,
  normalizeLook,
  shadowPlateRect,
  type FrameOptions,
  type LookId,
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

describe('frame looks', () => {
  it('gives every look a distinct id, label and set of values', () => {
    expect(new Set(FRAME_LOOKS.map((l) => l.id)).size).toBe(FRAME_LOOKS.length);
    expect(new Set(FRAME_LOOKS.map((l) => l.label)).size).toBe(FRAME_LOOKS.length);
    // Two looks with the same four values would make matchLook's answer
    // depend on table order, and one of them could never be shown selected.
    const shapes = FRAME_LOOKS.map((l) =>
      JSON.stringify([l.padding, l.radius, l.shadow, l.background]),
    );
    expect(new Set(shapes).size).toBe(FRAME_LOOKS.length);
  });

  it('keeps every look inside the sliders own 0..100 range', () => {
    for (const l of FRAME_LOOKS) {
      for (const v of [l.padding, l.radius, l.shadow]) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(100);
        expect(Number.isInteger(v)).toBe(true);
      }
    }
  });

  it('stores every look background in the form normalizeBackground hands back', () => {
    // A look whose background did not survive storage would come back as a
    // different value and read as permanently modified.
    for (const l of FRAME_LOOKS) {
      expect(normalizeBackground(JSON.parse(JSON.stringify(l.background)))).toEqual(l.background);
    }
  });

  it('turns beautify on, because a look that left it off would show nothing', () => {
    expect(applyLook('poster').enabled).toBe(true);
  });

  it('sets all four values and records which look they came from', () => {
    const poster = FRAME_LOOKS.find((l) => l.id === 'poster')!;
    expect(applyLook('poster')).toEqual({
      enabled: true,
      look: 'poster',
      padding: poster.padding,
      radius: poster.radius,
      shadow: poster.shadow,
      background: poster.background,
    });
  });

  it('names the shipped default, so the panel opens with a look already chosen', () => {
    const clean = FRAME_LOOKS.find((l) => l.id === 'clean')!;
    expect(DEFAULT_FRAME.look).toBe('clean');
    expect({
      padding: DEFAULT_FRAME.padding,
      radius: DEFAULT_FRAME.radius,
      shadow: DEFAULT_FRAME.shadow,
      background: DEFAULT_FRAME.background,
    }).toEqual({
      padding: clean.padding,
      radius: clean.radius,
      shadow: clean.shadow,
      background: clean.background,
    });
  });

  it('changes the frame for every look, so no look is a no-op click', () => {
    for (const l of FRAME_LOOKS) {
      const applied = { ...DEFAULT_FRAME, ...applyLook(l.id) };
      const m = frameMetrics(applied, 1200, 800);
      // paintFrame returns early when all three are zero: that frame would
      // draw nothing at all.
      expect(m.pad > 0 || m.radius > 0 || m.shadowAlpha > 0).toBe(true);
    }
  });
});

describe('matchLook', () => {
  it('recognises a look from its values alone', () => {
    for (const l of FRAME_LOOKS) {
      expect(matchLook(l)).toBe(l.id);
    }
  });

  it('answers null for values no look sets', () => {
    expect(matchLook({ ...DEFAULT_FRAME, padding: 41 })).toBeNull();
  });

  it('tells two looks apart by background alone', () => {
    const clean = FRAME_LOOKS.find((l) => l.id === 'clean')!;
    expect(matchLook({ ...clean, background: { kind: 'preset', id: 'mint' } })).toBeNull();
    expect(matchLook({ ...clean, background: { kind: 'transparent' } })).toBeNull();
    expect(matchLook({ ...clean, background: { kind: 'solid', color: '#2b303b' } })).toBeNull();
  });
});

describe('lookIsModified', () => {
  const picked = (id: LookId): FrameOptions => ({ ...DEFAULT_FRAME, ...applyLook(id) });

  it('is false right after a look is applied', () => {
    for (const l of FRAME_LOOKS) {
      expect(lookIsModified(picked(l.id))).toBe(false);
    }
  });

  it('is true once any of the four values moves', () => {
    const p = picked('clean');
    expect(lookIsModified({ ...p, padding: p.padding + 1 })).toBe(true);
    expect(lookIsModified({ ...p, radius: p.radius + 1 })).toBe(true);
    expect(lookIsModified({ ...p, shadow: p.shadow + 1 })).toBe(true);
    expect(lookIsModified({ ...p, background: { kind: 'transparent' } })).toBe(true);
    expect(lookIsModified({ ...p, background: { kind: 'solid', color: '#123456' } })).toBe(true);
  });

  it('goes back to false when the value is moved back', () => {
    // A value comparison, not a dirty flag: undoing the adjustment undoes the
    // mark. The panel would otherwise call an untouched look modified forever.
    const p = picked('snug');
    const moved = { ...p, shadow: p.shadow + 20 };
    expect(lookIsModified(moved)).toBe(true);
    expect(lookIsModified({ ...moved, shadow: p.shadow })).toBe(false);
  });

  it('ignores the beautify switch, which is not part of a look', () => {
    expect(lookIsModified({ ...picked('airy'), enabled: false })).toBe(false);
  });

  it('is false when no look is selected, however odd the values', () => {
    expect(lookIsModified({ ...DEFAULT_FRAME, look: null, padding: 7 })).toBe(false);
  });

  it('tells a solid background apart by its exact colour', () => {
    const p = picked('cutout');
    const a: FrameOptions = { ...p, background: { kind: 'solid', color: '#abcdef' } };
    expect(lookIsModified(a)).toBe(true);
    expect(lookIsModified({ ...a, background: { kind: 'solid', color: '#abcdee' } })).toBe(true);
  });
});

describe('normalizeLook', () => {
  it('keeps every known id', () => {
    for (const l of FRAME_LOOKS) expect(normalizeLook(l.id)).toBe(l.id);
  });

  it('reads anything else as no look, including inherited object keys', () => {
    expect(normalizeLook('nope')).toBeNull();
    expect(normalizeLook(undefined)).toBeNull();
    expect(normalizeLook(null)).toBeNull();
    expect(normalizeLook(3)).toBeNull();
    // A plain-object lookup with `in` would answer true for these.
    expect(normalizeLook('toString')).toBeNull();
    expect(normalizeLook('constructor')).toBeNull();
  });
});
