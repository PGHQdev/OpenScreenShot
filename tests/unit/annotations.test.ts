import { afterEach, describe, expect, it } from 'vitest';
import {
  annotationsInRect,
  bbox,
  createBlurCache,
  drawAnnotation,
  drawGroupSelection,
  drawMarquee,
  drawSelection,
  genId,
  getHandles,
  handleAt,
  handleAtRect,
  hasStroke,
  normalizeRect,
  pruneBlurCache,
  resizeRect,
  scaleAnnotation,
  scaleInBox,
  STROKE_WIDTHS,
  strokeBarHeight,
  translateAnnotation,
  unionBBox,
  type Annotation,
  type Rect,
  type BlurCache,
} from '../../src/editor/annotations';

describe('normalizeRect', () => {
  it('leaves an already-normalized rect untouched', () => {
    expect(normalizeRect({ x: 0, y: 0, w: 10, h: 10 })).toEqual({ x: 0, y: 0, w: 10, h: 10 });
  });

  it('flips a negative rect to the same on-screen area', () => {
    expect(normalizeRect({ x: 10, y: 10, w: -10, h: -10 })).toEqual({ x: 0, y: 0, w: 10, h: 10 });
  });

  it('handles mixed signs', () => {
    expect(normalizeRect({ x: 5, y: 5, w: -3, h: -4 })).toEqual({ x: 2, y: 1, w: 3, h: 4 });
  });
});

describe('bbox', () => {
  const base = { stroke: '#f00', strokeWidth: 4, fill: null };

  it('normalizes a rect annotation', () => {
    const a: Annotation = { id: 'r', type: 'rect', x: 10, y: 10, w: -5, h: -3, ...base };
    expect(bbox(a)).toEqual({ x: 5, y: 7, w: 5, h: 3 });
  });

  it('bounds an arrow by its endpoints', () => {
    const a: Annotation = {
      id: 'a',
      type: 'arrow',
      x1: 10,
      y1: 10,
      x2: 30,
      y2: 40,
      stroke: '#f00',
      strokeWidth: 4,
    };
    expect(bbox(a)).toEqual({ x: 10, y: 10, w: 20, h: 30 });
  });

  it('bounds a line by its endpoints', () => {
    const a: Annotation = {
      id: 'l',
      type: 'line',
      x1: 30,
      y1: 40,
      x2: 10,
      y2: 10,
      stroke: '#f00',
      strokeWidth: 4,
    };
    expect(bbox(a)).toEqual({ x: 10, y: 10, w: 20, h: 30 });
  });

  it('bounds a pen stroke by its points', () => {
    const a: Annotation = {
      id: 'p',
      type: 'pen',
      points: [
        { x: 0, y: 0 },
        { x: 10, y: 20 },
        { x: 5, y: 30 },
      ],
      stroke: '#f00',
      strokeWidth: 4,
    };
    expect(bbox(a)).toEqual({ x: 0, y: 0, w: 10, h: 30 });
  });

  it('returns a zero rect for an empty pen stroke', () => {
    const a: Annotation = { id: 'p0', type: 'pen', points: [], stroke: '#f00', strokeWidth: 4 };
    expect(bbox(a)).toEqual({ x: 0, y: 0, w: 0, h: 0 });
  });

  it('uses the measured size for text', () => {
    const a: Annotation = {
      id: 't',
      type: 'text',
      x: 5,
      y: 7,
      text: 'hi',
      fontSize: 28,
      color: '#f00',
      width: 100,
      height: 40,
    };
    expect(bbox(a)).toEqual({ x: 5, y: 7, w: 100, h: 40 });
  });

  it('normalizes a blur annotation', () => {
    const a: Annotation = { id: 'b', type: 'blur', x: 10, y: 10, w: -5, h: -3, strength: 8 };
    expect(bbox(a)).toEqual({ x: 5, y: 7, w: 5, h: 3 });
  });

  it('normalizes a spotlight annotation', () => {
    const a: Annotation = { id: 's', type: 'spotlight', x: 10, y: 10, w: -5, h: -3, shape: 'rect' };
    expect(bbox(a)).toEqual({ x: 5, y: 7, w: 5, h: 3 });
  });
});

describe('genId', () => {
  it('produces unique, non-empty ids', () => {
    const ids = new Set(Array.from({ length: 50 }, () => genId()));
    expect(ids.size).toBe(50);
    for (const id of ids) expect(id.length).toBeGreaterThan(0);
  });

  it('returns a UUID-shaped string when crypto.randomUUID is available', () => {
    // Node 20+ exposes crypto.randomUUID globally; if present, expect canonical form.
    if (typeof globalThis.crypto?.randomUUID === 'function') {
      expect(genId()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    }
  });
});

describe('pruneBlurCache', () => {
  function fakeCache(ids: string[]): BlurCache {
    const cache = createBlurCache();
    for (const id of ids) {
      cache.set(id, {
        tile: { width: 1 } as unknown as HTMLCanvasElement,
        x: 0,
        y: 0,
        w: 1,
        h: 1,
        factor: 1,
      });
    }
    return cache;
  }

  it('drops entries whose id is not in the keep set', () => {
    const cache = fakeCache(['a', 'b', 'c']);
    pruneBlurCache(cache, new Set(['a', 'c']));
    expect([...cache.keys()].sort()).toEqual(['a', 'c']);
  });

  it('keeps everything when all ids are present', () => {
    const cache = fakeCache(['a', 'b']);
    pruneBlurCache(cache, new Set(['a', 'b']));
    expect(cache.size).toBe(2);
  });

  it('clears everything for an empty keep set', () => {
    const cache = fakeCache(['a', 'b']);
    pruneBlurCache(cache, new Set());
    expect(cache.size).toBe(0);
  });
});

describe('drawAnnotation on a blur: strength drives what actually gets painted', () => {
  // getBlurTile (drawBlur's private helper) downsamples into a real <canvas>
  // — the vitest environment here is node, with no DOM at all, so this stubs
  // just enough of `document` for that call to run. Everything else is the
  // same FakeCtx-recorder idiom drawSelection/drawMarquee above use.
  function stubCanvasDocument() {
    const created: { width: number; height: number }[] = [];
    (globalThis as { document?: unknown }).document = {
      createElement: (tag: string) => {
        if (tag !== 'canvas') throw new Error(`unexpected element: ${tag}`);
        const el = { width: 0, height: 0, getContext: () => ({ drawImage() {} }) };
        created.push(el);
        return el;
      },
    };
    return created;
  }

  afterEach(() => {
    delete (globalThis as { document?: unknown }).document;
  });

  function ctxRecorder() {
    const draws: { tile: unknown; args: number[] }[] = [];
    const ctx = {
      imageSmoothingEnabled: true,
      fillStyle: '',
      fillRect() {},
      drawImage(tile: unknown, ...args: number[]) {
        draws.push({ tile, args });
      },
    };
    return { ctx: ctx as unknown as CanvasRenderingContext2D, draws };
  }

  const region = { id: 'b', type: 'blur', x: 0, y: 0, w: 160, h: 160 } as const;
  const image = {} as HTMLImageElement;

  it('downsamples to a smaller tile for a higher strength — every painted pixel comes from it', () => {
    const created = stubCanvasDocument();
    const { ctx, draws } = ctxRecorder();

    drawAnnotation(ctx, { ...region, strength: 8 }, image, createBlurCache());
    drawAnnotation(ctx, { ...region, strength: 32 }, image, createBlurCache());

    expect(created[0]).toMatchObject({ width: 20, height: 20 }); // 160 / 8
    expect(created[1]).toMatchObject({ width: 5, height: 5 }); // 160 / 32
    expect(draws.map((d) => d.tile)).toEqual(created);
  });

  it('mosaic takes the same strength, at four times the cell size', () => {
    const created = stubCanvasDocument();
    const { ctx } = ctxRecorder();

    drawAnnotation(ctx, { ...region, strength: 8, mode: 'mosaic' }, image, createBlurCache());

    // MOSAIC_FACTOR is 4 (annotations.ts): factor 32, tile 160/32 = 5.
    expect(created[0]).toMatchObject({ width: 5, height: 5 });
  });

  it('solid ignores strength — no tile is built at all', () => {
    const created = stubCanvasDocument();
    const { ctx, draws } = ctxRecorder();

    drawAnnotation(ctx, { ...region, strength: 999, mode: 'solid' }, image, createBlurCache());

    expect(created).toHaveLength(0);
    expect(draws).toHaveLength(0);
  });
});

describe('drawAnnotation — rect', () => {
  /**
   * A rect never fills, only strokes: `RectAnnotation.fill` documented a
   * capability the style bar never exposed, so it is gone, not just always
   * null. This uses a rect literal that still carries a `fill` value — the
   * shape a pre-existing persisted draft could hand back — to prove drawRect
   * has stopped reading it rather than merely defaulting it away.
   */
  function recorder() {
    const calls: { op: string; args: number[] }[] = [];
    const ctx = {
      strokeStyle: '',
      fillStyle: '',
      lineWidth: 0,
      strokeRect(...args: number[]) {
        calls.push({ op: 'strokeRect', args });
      },
      fillRect(...args: number[]) {
        calls.push({ op: 'fillRect', args });
      },
    };
    return { ctx: ctx as unknown as CanvasRenderingContext2D, calls };
  }

  it('strokes but never fills, even for a legacy rect carrying a stray fill value', () => {
    const { ctx, calls } = recorder();
    const legacy = {
      id: 'r',
      type: 'rect',
      x: 10,
      y: 20,
      w: 100,
      h: 50,
      stroke: '#f00',
      strokeWidth: 4,
      fill: '#00ff00',
    } as unknown as Annotation;

    drawAnnotation(ctx, legacy, {} as HTMLImageElement, createBlurCache());

    expect(calls.filter((c) => c.op === 'fillRect')).toEqual([]);
    expect(calls.filter((c) => c.op === 'strokeRect')).toEqual([
      { op: 'strokeRect', args: [10, 20, 100, 50] },
    ]);
  });
});

describe('strokeBarHeight', () => {
  it('spaces adjacent presets at least 4px apart — the old Math.min(w, 8) clamp put 6px and 12px only 2px apart (6 vs 8)', () => {
    const heights = [...STROKE_WIDTHS].sort((a, b) => a - b).map(strokeBarHeight);
    for (let i = 1; i < heights.length; i++) {
      expect(heights[i] - heights[i - 1]).toBeGreaterThanOrEqual(4);
    }
  });

  it('scales the widest preset to the bar’s own maximum, not past it', () => {
    expect(strokeBarHeight(Math.max(...STROKE_WIDTHS))).toBe(20);
  });

  it('keeps every preset in the same order as the raw widths', () => {
    const heights = STROKE_WIDTHS.map(strokeBarHeight);
    const sortedByWidth = [...STROKE_WIDTHS].sort((a, b) => a - b);
    const sortedByHeight = [...STROKE_WIDTHS].sort(
      (a, b) => strokeBarHeight(a) - strokeBarHeight(b),
    );
    expect(sortedByHeight).toEqual(sortedByWidth);
    expect(heights.every((h) => h > 0)).toBe(true);
  });
});

describe('getHandles', () => {
  it('returns 8 handles for a rect', () => {
    const a: Annotation = {
      id: 'r',
      type: 'rect',
      x: 0,
      y: 0,
      w: 10,
      h: 10,
      stroke: '#f00',
      strokeWidth: 4,
      fill: null,
    };
    expect(getHandles(a)).toHaveLength(8);
  });

  it('returns 2 handles for an arrow (start + end)', () => {
    const a: Annotation = {
      id: 'a',
      type: 'arrow',
      x1: 0,
      y1: 0,
      x2: 10,
      y2: 10,
      stroke: '#f00',
      strokeWidth: 4,
    };
    const hs = getHandles(a);
    expect(hs.map((h) => h.handle)).toEqual(['start', 'end']);
  });

  it('returns 2 handles for a line (start + end)', () => {
    const a: Annotation = {
      id: 'l',
      type: 'line',
      x1: 0,
      y1: 0,
      x2: 10,
      y2: 10,
      stroke: '#f00',
      strokeWidth: 4,
    };
    expect(getHandles(a).map((h) => h.handle)).toEqual(['start', 'end']);
  });

  it('returns 8 handles for a pen stroke (free scale on its bbox)', () => {
    const p: Annotation = {
      id: 'p',
      type: 'pen',
      points: [
        { x: 0, y: 0 },
        { x: 10, y: 20 },
      ],
      stroke: '#f00',
      strokeWidth: 4,
    };
    expect(getHandles(p)).toHaveLength(8);
  });

  it('returns 8 handles for a highlight stroke', () => {
    const h: Annotation = {
      id: 'h',
      type: 'highlight',
      points: [
        { x: 0, y: 0 },
        { x: 10, y: 20 },
      ],
      stroke: '#f00',
      strokeWidth: 4,
    };
    expect(getHandles(h)).toHaveLength(8);
  });

  it('returns the 4 corner handles for text (uniform scale)', () => {
    const t: Annotation = {
      id: 't',
      type: 'text',
      x: 0,
      y: 0,
      text: 'hi',
      fontSize: 28,
      color: '#f00',
      width: 10,
      height: 10,
    };
    expect(getHandles(t).map((h) => h.handle)).toEqual(['nw', 'ne', 'se', 'sw']);
  });

  it('returns the 4 corner handles for a step badge', () => {
    const s: Annotation = { id: 's', type: 'step', x: 10, y: 10, r: 10, n: 1, color: '#f00' };
    expect(getHandles(s).map((h) => h.handle)).toEqual(['nw', 'ne', 'se', 'sw']);
  });

  it('returns 8 handles for a spotlight (resizes like a rect)', () => {
    const s: Annotation = { id: 's', type: 'spotlight', x: 0, y: 0, w: 10, h: 10, shape: 'rect' };
    expect(getHandles(s)).toHaveLength(8);
  });

  it('places pen handles on the stroke bbox', () => {
    const p: Annotation = {
      id: 'p',
      type: 'pen',
      points: [
        { x: 10, y: 20 },
        { x: 30, y: 60 },
      ],
      stroke: '#f00',
      strokeWidth: 4,
    };
    const nw = getHandles(p).find((h) => h.handle === 'nw');
    expect(nw).toEqual({ handle: 'nw', x: 10, y: 20 });
  });
});

describe('scaleAnnotation', () => {
  const penStart: Annotation = {
    id: 'p',
    type: 'pen',
    points: [
      { x: 0, y: 0 },
      { x: 10, y: 10 },
    ],
    stroke: '#f00',
    strokeWidth: 4,
  };

  it('scales pen points into the bbox resized from the south-east handle', () => {
    const out = scaleAnnotation(penStart, { x: 0, y: 0, w: 10, h: 10 }, 'se', 10, 10);
    expect(out).toEqual({
      ...penStart,
      points: [
        { x: 0, y: 0 },
        { x: 20, y: 20 },
      ],
    });
  });

  it('scales pen points on one axis from an edge handle', () => {
    const out = scaleAnnotation(penStart, { x: 0, y: 0, w: 10, h: 10 }, 'e', 10, 0);
    expect(out).toEqual({
      ...penStart,
      points: [
        { x: 0, y: 0 },
        { x: 20, y: 10 },
      ],
    });
  });

  it('does not mutate the original pen annotation', () => {
    scaleAnnotation(penStart, { x: 0, y: 0, w: 10, h: 10 }, 'se', 10, 10);
    expect(penStart.type === 'pen' && penStart.points[1]).toEqual({ x: 10, y: 10 });
  });

  const textStart: Annotation = {
    id: 't',
    type: 'text',
    x: 10,
    y: 10,
    text: 'hi',
    fontSize: 20,
    color: '#f00',
    width: 40,
    height: 25,
  };

  it('grows text uniformly from the south-east handle, north-west corner fixed', () => {
    const out = scaleAnnotation(textStart, { x: 10, y: 10, w: 40, h: 25 }, 'se', 40, 0);
    expect(out).toEqual({ ...textStart, fontSize: 40, width: 80, height: 50, x: 10, y: 10 });
  });

  it('shrinks text from the north-west handle, south-east corner fixed', () => {
    const out = scaleAnnotation(textStart, { x: 10, y: 10, w: 40, h: 25 }, 'nw', 20, 12.5);
    expect(out).toEqual({
      ...textStart,
      fontSize: 10,
      width: 20,
      height: 12.5,
      x: 30,
      y: 22.5,
    });
  });

  it('never scales text below the minimum font size', () => {
    const small: Annotation = { ...textStart, fontSize: 10 };
    const out = scaleAnnotation(small, { x: 10, y: 10, w: 40, h: 25 }, 'se', -38, -23.75);
    expect(out.type === 'text' && out.fontSize).toBe(8);
    expect(out.type === 'text' && out.width).toBe(32);
  });

  it('scales a step badge radius and center around the fixed corner', () => {
    const step: Annotation = { id: 's', type: 'step', x: 50, y: 50, r: 10, n: 1, color: '#f00' };
    const out = scaleAnnotation(step, { x: 40, y: 40, w: 20, h: 20 }, 'se', 20, 20);
    expect(out).toEqual({ ...step, x: 60, y: 60, r: 20 });
  });

  it('never scales a step badge below the minimum radius', () => {
    const step: Annotation = { id: 's', type: 'step', x: 50, y: 50, r: 10, n: 1, color: '#f00' };
    const out = scaleAnnotation(step, { x: 40, y: 40, w: 20, h: 20 }, 'se', -19, -19);
    expect(out.type === 'step' && out.r).toBe(6);
  });

  // A lone rect or arrow resizes through its own path in useEditor (a rect by
  // its dragged edge, an arrow by the endpoint under the pointer) and never
  // reaches this function, so it passes through. Scaling those types inside a
  // shared box is scaleInBox's job, covered below.
  it('returns endpoint-handle and rect types unchanged', () => {
    const rect: Annotation = {
      id: 'r',
      type: 'rect',
      x: 0,
      y: 0,
      w: 10,
      h: 10,
      stroke: '#f00',
      strokeWidth: 4,
      fill: null,
    };
    expect(scaleAnnotation(rect, { x: 0, y: 0, w: 10, h: 10 }, 'se', 5, 5)).toBe(rect);
  });
});

describe('handleAt', () => {
  const id = (x: number, y: number) => ({ x, y });
  const a: Annotation = {
    id: 'r',
    type: 'rect',
    x: 0,
    y: 0,
    w: 100,
    h: 100,
    stroke: '#f00',
    strokeWidth: 4,
    fill: null,
  };
  it('finds the corner handle under a screen point', () => {
    expect(handleAt(a, id, 100, 100)).toBe('se');
    expect(handleAt(a, id, 0, 0)).toBe('nw');
  });

  it('returns null when no handle is near', () => {
    expect(handleAt(a, id, 50, 50)).toBeNull();
  });
});

describe('resizeRect', () => {
  const start = { x: 0, y: 0, w: 10, h: 10 };
  it('grows from the south-east handle', () => {
    expect(resizeRect(start, 'se', 5, 3)).toEqual({ x: 0, y: 0, w: 15, h: 13 });
  });
  it('shrinks from the north-west handle (opposite corner fixed)', () => {
    expect(resizeRect(start, 'nw', 2, 1)).toEqual({ x: 2, y: 1, w: 8, h: 9 });
  });
  it('moves only the right edge for the east handle', () => {
    expect(resizeRect(start, 'e', 4, 9)).toEqual({ x: 0, y: 0, w: 14, h: 10 });
  });
  it('normalizes when dragged past the opposite edge', () => {
    // Drag the east handle left past the west edge (dx < -w).
    expect(resizeRect(start, 'e', -20, 0)).toEqual({ x: -10, y: 0, w: 10, h: 10 });
  });
});

describe('translateAnnotation', () => {
  it('shifts a rect', () => {
    const a: Annotation = {
      id: 'r',
      type: 'rect',
      x: 1,
      y: 2,
      w: 3,
      h: 4,
      stroke: '#f00',
      strokeWidth: 4,
      fill: null,
    };
    expect(translateAnnotation(a, 10, 20)).toEqual({ ...a, x: 11, y: 22 });
  });
  it('shifts every pen point', () => {
    const a: Annotation = {
      id: 'p',
      type: 'pen',
      points: [
        { x: 0, y: 0 },
        { x: 5, y: 5 },
      ],
      stroke: '#f00',
      strokeWidth: 4,
    };
    expect(translateAnnotation(a, 1, 1)).toEqual({
      ...a,
      points: [
        { x: 1, y: 1 },
        { x: 6, y: 6 },
      ],
    });
  });
  it('shifts a spotlight', () => {
    const a: Annotation = { id: 's', type: 'spotlight', x: 1, y: 2, w: 3, h: 4, shape: 'ellipse' };
    expect(translateAnnotation(a, 10, 20)).toEqual({ ...a, x: 11, y: 22 });
  });
  it('shifts both ends of a line', () => {
    const a: Annotation = {
      id: 'l',
      type: 'line',
      x1: 0,
      y1: 0,
      x2: 10,
      y2: 10,
      stroke: '#f00',
      strokeWidth: 4,
    };
    expect(translateAnnotation(a, 5, -5)).toEqual({ ...a, x1: 5, y1: -5, x2: 15, y2: 5 });
  });

  it('does not mutate the original', () => {
    const a: Annotation = {
      id: 'r',
      type: 'rect',
      x: 1,
      y: 2,
      w: 3,
      h: 4,
      stroke: '#f00',
      strokeWidth: 4,
      fill: null,
    };
    translateAnnotation(a, 10, 10);
    expect(a.x).toBe(1);
  });
});

describe('hasStroke', () => {
  it('accepts every annotation the style bar can recolour', () => {
    const shapes: Annotation[] = [
      { id: 'r', type: 'rect', x: 0, y: 0, w: 1, h: 1, stroke: '#f00', strokeWidth: 4, fill: null },
      { id: 'a', type: 'arrow', x1: 0, y1: 0, x2: 1, y2: 1, stroke: '#f00', strokeWidth: 4 },
      { id: 'l', type: 'line', x1: 0, y1: 0, x2: 1, y2: 1, stroke: '#f00', strokeWidth: 4 },
      { id: 'p', type: 'pen', points: [], stroke: '#f00', strokeWidth: 4 },
      { id: 'h', type: 'highlight', points: [], stroke: '#f00', strokeWidth: 4 },
    ];
    for (const a of shapes) expect(hasStroke(a)).toBe(true);
  });

  it('rejects the annotations that carry a colour under another name', () => {
    const text: Annotation = {
      id: 't',
      type: 'text',
      x: 0,
      y: 0,
      text: 'hi',
      fontSize: 28,
      color: '#f00',
      width: 1,
      height: 1,
    };
    const step: Annotation = { id: 's', type: 'step', x: 0, y: 0, r: 12, n: 1, color: '#f00' };
    const blur: Annotation = { id: 'b', type: 'blur', x: 0, y: 0, w: 1, h: 1, strength: 8 };
    const spot: Annotation = { id: 'o', type: 'spotlight', x: 0, y: 0, w: 1, h: 1, shape: 'rect' };
    for (const a of [text, step, blur, spot]) expect(hasStroke(a)).toBe(false);
  });
});

describe('annotationsInRect', () => {
  const box = (id: string, x: number, y: number): Annotation => ({
    id,
    type: 'rect',
    x,
    y,
    w: 20,
    h: 20,
    stroke: '#f00',
    strokeWidth: 4,
    fill: null,
  });
  const list = [box('a', 0, 0), box('b', 100, 100), box('c', 200, 200)];

  it('catches every annotation the rect covers, in layer order', () => {
    expect(annotationsInRect(list, { x: -10, y: -10, w: 220, h: 220 })).toEqual(['a', 'b', 'c']);
  });

  it('leaves out what the rect misses', () => {
    expect(annotationsInRect(list, { x: 90, y: 90, w: 40, h: 40 })).toEqual(['b']);
    expect(annotationsInRect(list, { x: 50, y: 50, w: 10, h: 10 })).toEqual([]);
  });

  it('counts a graze: a rect touching one edge still catches it', () => {
    expect(annotationsInRect(list, { x: 20, y: 0, w: 10, h: 10 })).toEqual(['a']);
    expect(annotationsInRect(list, { x: 21, y: 0, w: 10, h: 10 })).toEqual([]);
  });

  it('normalizes a marquee dragged up and to the left', () => {
    expect(annotationsInRect(list, { x: 130, y: 130, w: -40, h: -40 })).toEqual(['b']);
  });

  it('catches nothing from an empty document', () => {
    expect(annotationsInRect([], { x: 0, y: 0, w: 100, h: 100 })).toEqual([]);
  });
});

describe('drawSelection and drawMarquee', () => {
  /** Records the calls the two draw helpers make, so the shapes are checkable. */
  function recorder() {
    const calls: { op: string; args: number[]; style?: unknown; dash?: number[] }[] = [];
    let dash: number[] = [];
    const ctx = {
      strokeStyle: '',
      fillStyle: '',
      lineWidth: 0,
      lineDashOffset: 0,
      save() {},
      restore() {},
      setLineDash(d: number[]) {
        dash = d;
      },
      strokeRect(...args: number[]) {
        calls.push({ op: 'strokeRect', args, style: ctx.strokeStyle, dash: [...dash] });
      },
      fillRect(...args: number[]) {
        calls.push({ op: 'fillRect', args, style: ctx.fillStyle });
      },
    };
    return { ctx: ctx as unknown as CanvasRenderingContext2D, calls };
  }

  const identity = (x: number, y: number) => ({ x, y });
  const box: Annotation = {
    id: 'r',
    type: 'rect',
    x: 10,
    y: 20,
    w: 100,
    h: 50,
    stroke: '#f00',
    strokeWidth: 4,
    fill: null,
  };

  it('outlines a lone selection in two dashed passes, then draws its handles', () => {
    const { ctx, calls } = recorder();
    drawSelection(ctx, box, identity);
    const outline = calls.filter((c) => c.op === 'strokeRect' && c.dash!.length > 0);
    expect(outline.map((c) => c.style)).toEqual(['#000000', '#ffffff']);
    expect(outline[0].args).toEqual([10, 20, 100, 50]);
    expect(calls.filter((c) => c.op === 'fillRect')).toHaveLength(getHandles(box).length);
  });

  it('draws no handle at all when the caller asks for none', () => {
    const { ctx, calls } = recorder();
    drawSelection(ctx, box, identity, false);
    expect(calls.filter((c) => c.op === 'fillRect')).toHaveLength(0);
    // The outline is still both passes — a member of a multi-selection is
    // outlined exactly like a lone one, it just carries no resize target.
    expect(calls.filter((c) => c.op === 'strokeRect').map((c) => c.style)).toEqual([
      '#000000',
      '#ffffff',
    ]);
  });

  it('draws the marquee in the same two-tone dash, normalized, with no handles', () => {
    const { ctx, calls } = recorder();
    drawMarquee(ctx, { x: 100, y: 100, w: -40, h: -20 }, identity);
    expect(calls.filter((c) => c.op === 'fillRect')).toHaveLength(0);
    const outline = calls.filter((c) => c.op === 'strokeRect');
    expect(outline.map((c) => c.style)).toEqual(['#000000', '#ffffff']);
    expect(outline[0].args).toEqual([60, 80, 40, 20]);
    expect(outline[0].dash).toEqual(outline[1].dash);
    expect(outline[0].dash!.length).toBeGreaterThan(0);
  });
});

describe('unionBBox', () => {
  const box = (id: string, x: number, y: number, w = 20, h = 20): Annotation => ({
    id,
    type: 'rect',
    x,
    y,
    w,
    h,
    stroke: '#f00',
    strokeWidth: 4,
    fill: null,
  });

  it('is the annotation itself for one', () => {
    expect(unionBBox([box('a', 10, 20)])).toEqual({ x: 10, y: 20, w: 20, h: 20 });
  });

  it('spans every member', () => {
    expect(unionBBox([box('a', 0, 0), box('b', 100, 50)])).toEqual({
      x: 0,
      y: 0,
      w: 120,
      h: 70,
    });
  });

  it('is unchanged by a member already inside it', () => {
    const outer = box('a', 0, 0, 200, 200);
    expect(unionBBox([outer, box('b', 50, 50)])).toEqual({ x: 0, y: 0, w: 200, h: 200 });
  });

  it('has no box for an empty selection', () => {
    expect(unionBBox([])).toEqual({ x: 0, y: 0, w: 0, h: 0 });
  });
});

describe('scaleInBox: a member scaled inside a shared box', () => {
  // The multi-selection case: the box being dragged is not the annotation's
  // own, so position and size both scale inside it.
  const group = { x: 0, y: 0, w: 100, h: 100 };
  const rect: Annotation = {
    id: 'r',
    type: 'rect',
    x: 50,
    y: 50,
    w: 20,
    h: 20,
    stroke: '#f00',
    strokeWidth: 4,
    fill: null,
  };

  it('moves and grows a rect member by the box it sits in', () => {
    // The box doubles from the se handle: everything inside doubles with it.
    const out = scaleInBox(rect, group, 'se', 100, 100);
    expect(bbox(out)).toEqual({ x: 100, y: 100, w: 40, h: 40 });
  });

  it('keeps the corner the drag anchors on fixed', () => {
    const atOrigin: Annotation = { ...rect, x: 0, y: 0 };
    const out = scaleInBox(atOrigin, group, 'se', 100, 100);
    expect(bbox(out)).toMatchObject({ x: 0, y: 0 });
  });

  it('scales one axis only from an edge handle', () => {
    const out = scaleInBox(rect, group, 'e', 100, 0);
    expect(bbox(out)).toEqual({ x: 100, y: 50, w: 40, h: 20 });
  });

  it('carries both endpoints of an arrow', () => {
    const arrow: Annotation = {
      id: 'a',
      type: 'arrow',
      x1: 0,
      y1: 0,
      x2: 50,
      y2: 50,
      stroke: '#f00',
      strokeWidth: 4,
    };
    expect(scaleInBox(arrow, group, 'se', 100, 100)).toMatchObject({
      x1: 0,
      y1: 0,
      x2: 100,
      y2: 100,
    });
  });

  it('normalizes a member drawn inside out before scaling it', () => {
    const inverted: Annotation = { ...rect, x: 70, y: 70, w: -20, h: -20 };
    expect(bbox(scaleInBox(inverted, group, 'se', 100, 100))).toEqual({
      x: 100,
      y: 100,
      w: 40,
      h: 40,
    });
  });
});

describe('drawGroupSelection', () => {
  it('outlines the group box and draws its eight handles', () => {
    const calls: { op: string; args: number[] }[] = [];
    const ctx = {
      strokeStyle: '',
      fillStyle: '',
      lineWidth: 0,
      lineDashOffset: 0,
      save() {},
      restore() {},
      setLineDash() {},
      strokeRect(...args: number[]) {
        calls.push({ op: 'strokeRect', args });
      },
      fillRect(...args: number[]) {
        calls.push({ op: 'fillRect', args });
      },
    } as unknown as CanvasRenderingContext2D;
    drawGroupSelection(ctx, { x: 0, y: 0, w: 100, h: 50 }, (x, y) => ({ x, y }));
    // Eight handle fills, and eight rings plus the outline's two dashed passes.
    expect(calls.filter((c) => c.op === 'fillRect')).toHaveLength(8);
    expect(calls.filter((c) => c.op === 'strokeRect')).toHaveLength(10);
    const fills = calls
      .filter((c) => c.op === 'fillRect')
      .map((c) => [c.args[0] + 4, c.args[1] + 4]);
    expect(fills).toContainEqual([0, 0]);
    expect(fills).toContainEqual([100, 50]);
    expect(fills).toContainEqual([50, 0]);
  });
});

describe('handleAtRect', () => {
  const box = { x: 10, y: 10, w: 100, h: 100 };
  const identity = (x: number, y: number) => ({ x, y });

  it('finds the handle under the pointer', () => {
    expect(handleAtRect(box, identity, 10, 10)).toBe('nw');
    expect(handleAtRect(box, identity, 110, 110)).toBe('se');
    expect(handleAtRect(box, identity, 60, 10)).toBe('n');
  });

  it('allows the same slack a lone annotation handle allows', () => {
    expect(handleAtRect(box, identity, 20, 20)).toBe('nw');
    expect(handleAtRect(box, identity, 25, 25)).toBeNull();
  });

  it('finds nothing in the middle of the box', () => {
    expect(handleAtRect(box, identity, 60, 60)).toBeNull();
  });
});

describe('scaleInBox: a member that cannot be stretched on one axis', () => {
  const group = { x: 0, y: 0, w: 100, h: 100 };
  const text: Annotation = {
    id: 't',
    type: 'text',
    x: 10,
    y: 10,
    text: 'hi',
    fontSize: 20,
    color: '#f00',
    width: 40,
    height: 20,
  };
  const badge: Annotation = { id: 's', type: 'step', x: 50, y: 50, r: 20, n: 1, color: '#f00' };
  const inside = (a: Annotation, box: Rect) => {
    const b = bbox(a);
    return b.x >= box.x - 0.001 && b.y >= box.y - 0.001;
  };

  it('keeps a text member inside the box being dragged', () => {
    // The box widens only: kx=2, ky=1. Taking the larger factor for the
    // member's *position* used to throw it 80px above the box's top edge,
    // because the error scales with its distance from the anchored corner.
    const out = scaleInBox(text, group, 'e', 100, 0);
    const target = { x: 0, y: 0, w: 200, h: 100 };
    expect(inside(out, target)).toBe(true);
    expect(bbox(out).y).toBeGreaterThanOrEqual(0);
    expect(bbox(out).x).toBeGreaterThanOrEqual(0);
  });

  it('places a text member where it sat in the box, per axis', () => {
    const out = scaleInBox(text, group, 'e', 100, 0);
    // x was a tenth of the way across a 100-wide box; it still is, of a 200.
    expect(out.type === 'text' && out.x).toBeCloseTo(20);
    // The axis that did not scale does not move the member on it.
    expect(out.type === 'text' && out.y).toBeCloseTo(10);
  });

  it('scales the glyph by the geometric mean of the two factors', () => {
    const out = scaleInBox(text, group, 'e', 100, 0);
    expect(out.type === 'text' && out.fontSize).toBeCloseTo(20 * Math.SQRT2);
    expect(out.type === 'text' && out.width).toBeCloseTo(40 * Math.SQRT2);
  });

  it('returns a text member to its exact size and origin on the drag back', () => {
    // Widen the box, then narrow the widened box by the same amount. Taking
    // the larger factor made this a ratchet: 2 out, 1 back, so the glyph kept
    // its doubled size for good. The geometric mean cancels: sqrt(2)/sqrt(2).
    const widened = scaleInBox(text, group, 'e', 100, 0);
    const back = scaleInBox(widened, { x: 0, y: 0, w: 200, h: 100 }, 'e', -100, 0);
    expect(back.type === 'text' && back.fontSize).toBeCloseTo(20);
    expect(back.type === 'text' && back.width).toBeCloseTo(40);
    expect(back.type === 'text' && back.height).toBeCloseTo(20);
    expect(back.type === 'text' && back.x).toBeCloseTo(10);
    expect(back.type === 'text' && back.y).toBeCloseTo(10);
  });

  it('moves a step badge by its centre and returns it on the drag back', () => {
    const out = scaleInBox(badge, group, 's', 0, 100);
    expect(out.type === 'step' && out.x).toBeCloseTo(50);
    expect(out.type === 'step' && out.y).toBeCloseTo(100);
    expect(out.type === 'step' && out.r).toBeCloseTo(20 * Math.SQRT2);
    const back = scaleInBox(out, { x: 0, y: 0, w: 100, h: 200 }, 's', 0, -100);
    expect(back.type === 'step' && back.r).toBeCloseTo(20);
    expect(back.type === 'step' && back.y).toBeCloseTo(50);
  });

  it('never scales a glyph below its own floor, whatever the box does', () => {
    const small: Annotation = { ...text, fontSize: 9, width: 18, height: 9 };
    const out = scaleInBox(small, group, 'se', -99, -99);
    expect(out.type === 'text' && out.fontSize).toBeCloseTo(8);
    const tiny = scaleInBox(badge, group, 'se', -99, -99);
    expect(tiny.type === 'step' && tiny.r).toBeCloseTo(6);
  });
});

describe('scaleInBox: degenerate and inverted boxes', () => {
  const rect = (id: string, x: number, y: number, w: number, h: number): Annotation => ({
    id,
    type: 'rect',
    x,
    y,
    w,
    h,
    stroke: '#f00',
    strokeWidth: 4,
    fill: null,
  });

  it('leaves a flat axis alone when the drag anchors on it', () => {
    // Two annotations on one horizontal line: the union has no height, so
    // there is no factor to scale by and the guard holds the axis at 1. The
    // se handle anchors the top edge, so nothing on that axis moves either.
    const flat = { x: 0, y: 50, w: 100, h: 0 };
    const out = scaleInBox(rect('a', 0, 50, 20, 0), flat, 'se', 0, 40);
    expect(bbox(out)).toMatchObject({ y: 50, h: 0 });
  });

  it('translates a flat axis when the drag moves the edge it sits on', () => {
    const flat = { x: 0, y: 50, w: 100, h: 0 };
    const out = scaleInBox(rect('a', 0, 50, 20, 0), flat, 'n', 0, -40);
    expect(bbox(out)).toMatchObject({ y: 10, h: 0 });
  });

  it('scales the other axis normally while one axis is flat', () => {
    const flat = { x: 0, y: 50, w: 100, h: 0 };
    const out = scaleInBox(rect('a', 0, 50, 20, 0), flat, 'se', 100, 0);
    expect(bbox(out)).toMatchObject({ x: 0, w: 40 });
  });

  it('cannot invert a member, however far the drag folds through zero', () => {
    // resizeRect normalizes, so a drag past the opposite edge flips the box
    // rather than giving it a negative size — and every factor stays positive.
    const box = { x: 0, y: 0, w: 100, h: 100 };
    const out = scaleInBox(rect('a', 80, 0, 20, 100), box, 'e', -200, 0);
    const b = bbox(out);
    expect(b.w).toBeGreaterThan(0);
    expect(b.h).toBeGreaterThan(0);
    // The box folded through its anchored left edge to sit 100 wide on the
    // other side of it, and the member came along at the same width.
    expect(b).toMatchObject({ x: -20, w: 20 });
  });
});

describe('handleAtRect on a degenerate box', () => {
  it('answers with one of the handles stacked at the same point', () => {
    // A flat union puts nw, w and sw (and n, s) on the same pixel. The hit-test
    // walks them in order, so the first one wins; every one of them drives the
    // same axis, so which it is does not change the drag.
    const flat = { x: 0, y: 50, w: 100, h: 0 };
    expect(handleAtRect(flat, (x, y) => ({ x, y }), 0, 50)).toBe('nw');
    expect(handleAtRect(flat, (x, y) => ({ x, y }), 100, 50)).toBe('ne');
  });
});
