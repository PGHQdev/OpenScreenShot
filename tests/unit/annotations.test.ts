import { describe, expect, it } from 'vitest';
import {
  annotationsInRect,
  bbox,
  createBlurCache,
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
  translateAnnotation,
  unionBBox,
  type Annotation,
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

  // These used to pass through untouched, because a lone rect or arrow resizes
  // through its own path in useEditor and never reached here. A multi-selection
  // scales every member inside one shared box, so they are covered now — the
  // lone-annotation paths still short-circuit before this function.
  it('scales a rect against the box it was handed', () => {
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
    expect(scaleAnnotation(rect, { x: 0, y: 0, w: 10, h: 10 }, 'se', 5, 5)).toMatchObject({
      x: 0,
      y: 0,
      w: 15,
      h: 15,
    });
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

describe('scaleAnnotation inside a group box', () => {
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
    const out = scaleAnnotation(rect, group, 'se', 100, 100);
    expect(bbox(out)).toEqual({ x: 100, y: 100, w: 40, h: 40 });
  });

  it('keeps the corner the drag anchors on fixed', () => {
    const atOrigin: Annotation = { ...rect, x: 0, y: 0 };
    const out = scaleAnnotation(atOrigin, group, 'se', 100, 100);
    expect(bbox(out)).toMatchObject({ x: 0, y: 0 });
  });

  it('scales one axis only from an edge handle', () => {
    const out = scaleAnnotation(rect, group, 'e', 100, 0);
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
    expect(scaleAnnotation(arrow, group, 'se', 100, 100)).toMatchObject({
      x1: 0,
      y1: 0,
      x2: 100,
      y2: 100,
    });
  });

  it('normalizes a member drawn inside out before scaling it', () => {
    const inverted: Annotation = { ...rect, x: 70, y: 70, w: -20, h: -20 };
    expect(bbox(scaleAnnotation(inverted, group, 'se', 100, 100))).toEqual({
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
