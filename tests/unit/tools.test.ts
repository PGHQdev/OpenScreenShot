import { describe, expect, it } from 'vitest';
import {
  createShapeDraft,
  extendDraft,
  shouldCommit,
  snapTo45,
  squareDelta,
  TOOL_LIST,
} from '../../src/editor/tools';
import type { Annotation } from '../../src/editor/annotations';

describe('squareDelta', () => {
  it('grows the short axis to match the long one', () => {
    expect(squareDelta(10, 4)).toEqual({ dx: 10, dy: 10 });
    expect(squareDelta(3, 12)).toEqual({ dx: 12, dy: 12 });
  });

  it('keeps the direction of each axis', () => {
    expect(squareDelta(-10, 4)).toEqual({ dx: -10, dy: 10 });
    expect(squareDelta(10, -4)).toEqual({ dx: 10, dy: -10 });
    expect(squareDelta(-3, -12)).toEqual({ dx: -12, dy: -12 });
  });

  it('squares a drag along one axis instead of collapsing it', () => {
    expect(squareDelta(10, 0)).toEqual({ dx: 10, dy: 10 });
    expect(squareDelta(0, -7)).toEqual({ dx: 7, dy: -7 });
  });
});

describe('snapTo45', () => {
  it('snaps a near-horizontal drag flat', () => {
    const p = snapTo45(0, 0, 100, 8);
    expect(p.x).toBeCloseTo(Math.hypot(100, 8));
    expect(p.y).toBeCloseTo(0);
  });

  it('snaps a near-diagonal drag to 45°', () => {
    const p = snapTo45(0, 0, 100, 90);
    expect(p.x).toBeCloseTo(p.y);
  });

  it('keeps the pointer distance from the start point', () => {
    const p = snapTo45(10, 20, 60, 55);
    expect(Math.hypot(p.x - 10, p.y - 20)).toBeCloseTo(Math.hypot(50, 35));
  });

  it('leaves a zero-length drag alone', () => {
    expect(snapTo45(5, 5, 5, 5)).toEqual({ x: 5, y: 5 });
  });
});

describe('line tool', () => {
  it('is in the toolbar with a free shortcut letter', () => {
    const line = TOOL_LIST.find((t) => t.id === 'line');
    expect(line).toBeDefined();
    const letters = TOOL_LIST.map((t) => t.shortcut);
    expect(new Set(letters).size).toBe(letters.length);
  });

  it('drafts a zero-length line carrying the current style', () => {
    const draft = createShapeDraft('line', { x: 4, y: 9 }, '#ff9500', 12);
    expect(draft).toMatchObject({
      type: 'line',
      x1: 4,
      y1: 9,
      x2: 4,
      y2: 9,
      stroke: '#ff9500',
      strokeWidth: 12,
    });
  });

  it('commits only once it is longer than a click', () => {
    const draft = createShapeDraft('line', { x: 0, y: 0 }, '#ff3b30', 6);
    expect(shouldCommit(draft)).toBe(false);
    extendDraft(draft, { x: 40, y: 0 });
    expect(shouldCommit(draft)).toBe(true);
  });
});

describe('spotlight tool', () => {
  it('is in the toolbar with a free shortcut letter', () => {
    const spot = TOOL_LIST.find((t) => t.id === 'spotlight');
    expect(spot).toBeDefined();
    const letters = TOOL_LIST.map((t) => t.shortcut);
    expect(new Set(letters).size).toBe(letters.length);
  });

  it('drafts a zero-size spotlight carrying the chosen shape', () => {
    const draft = createShapeDraft('spotlight', { x: 4, y: 9 }, '#ff3b30', 6, {
      spotlightShape: 'ellipse',
    });
    expect(draft).toMatchObject({ type: 'spotlight', x: 4, y: 9, w: 0, h: 0, shape: 'ellipse' });
  });

  it('defaults the shape to a rectangle', () => {
    const draft = createShapeDraft('spotlight', { x: 0, y: 0 }, '#ff3b30', 6);
    expect(draft).toMatchObject({ type: 'spotlight', shape: 'rect' });
  });

  it('squares with shift held, like a rectangle', () => {
    const d = createShapeDraft('spotlight', { x: 0, y: 0 }, '#ff3b30', 6);
    extendDraft(d, { x: 60, y: 20 }, true);
    expect(d).toMatchObject({ w: 60, h: 60 });
  });

  it('commits only once it is larger than a click', () => {
    const d = createShapeDraft('spotlight', { x: 0, y: 0 }, '#ff3b30', 6);
    expect(shouldCommit(d)).toBe(false);
    extendDraft(d, { x: 40, y: 30 });
    expect(shouldCommit(d)).toBe(true);
  });
});

describe('blur redaction modes', () => {
  it('drafts a blur carrying the chosen redaction mode', () => {
    const draft = createShapeDraft('blur', { x: 0, y: 0 }, '#ff3b30', 6, { blurMode: 'solid' });
    expect(draft).toMatchObject({ type: 'blur', mode: 'solid' });
  });

  it('defaults to the soft pixelated blur', () => {
    const draft = createShapeDraft('blur', { x: 0, y: 0 }, '#ff3b30', 6);
    expect(draft).toMatchObject({ type: 'blur', mode: 'blur' });
  });
});

describe('extendDraft with shift held', () => {
  function draft(type: 'rect' | 'line' | 'arrow' | 'blur'): Annotation {
    return createShapeDraft(type, { x: 0, y: 0 }, '#ff3b30', 6);
  }

  it('squares a rectangle', () => {
    const d = draft('rect');
    extendDraft(d, { x: 60, y: 20 }, true);
    expect(d).toMatchObject({ w: 60, h: 60 });
  });

  it('squares a blur region', () => {
    const d = draft('blur');
    extendDraft(d, { x: 20, y: -60 }, true);
    expect(d).toMatchObject({ w: 60, h: -60 });
  });

  it('snaps an arrow to 45°', () => {
    const d = draft('arrow');
    extendDraft(d, { x: 100, y: 8 }, true);
    if (d.type !== 'arrow') throw new Error('wrong type');
    expect(d.y2).toBeCloseTo(0);
  });

  it('snaps a line to 45°', () => {
    const d = draft('line');
    extendDraft(d, { x: 100, y: 90 }, true);
    if (d.type !== 'line') throw new Error('wrong type');
    expect(d.x2).toBeCloseTo(d.y2);
  });

  it('leaves the freehand tools unconstrained', () => {
    const d = createShapeDraft('pen', { x: 0, y: 0 }, '#ff3b30', 6);
    extendDraft(d, { x: 60, y: 20 }, true);
    if (d.type !== 'pen') throw new Error('wrong type');
    expect(d.points[1]).toEqual({ x: 60, y: 20 });
  });

  it('draws freely when shift is not held', () => {
    const d = draft('rect');
    extendDraft(d, { x: 60, y: 20 }, false);
    expect(d).toMatchObject({ w: 60, h: 20 });
  });
});
