import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  createShapeDraft,
  DUPLICATE_OFFSET,
  duplicateAnnotations,
  extendDraft,
  renumberSteps,
  shouldCommit,
  snapTo45,
  squareDelta,
  TOOL_LIST,
} from '../../src/editor/tools';
import { bbox, type Annotation } from '../../src/editor/annotations';

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

describe('blur strength', () => {
  it('defaults to the fixed 8 when no strength is given', () => {
    const draft = createShapeDraft('blur', { x: 0, y: 0 }, '#ff3b30', 6);
    expect(draft).toMatchObject({ type: 'blur', strength: 8 });
  });

  it('drafts a blur carrying the chosen strength, the style bar current default', () => {
    const draft = createShapeDraft('blur', { x: 0, y: 0 }, '#ff3b30', 6, { blurStrength: 20 });
    expect(draft).toMatchObject({ type: 'blur', strength: 20 });
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

describe('eyedropper tool', () => {
  it('is in the toolbar with a free shortcut letter', () => {
    const dropper = TOOL_LIST.find((t) => t.id === 'eyedropper');
    expect(dropper).toBeDefined();
    expect(dropper?.shortcut).toBe('I');
    const letters = TOOL_LIST.map((t) => t.shortcut);
    expect(new Set(letters).size).toBe(letters.length);
  });
});

describe('duplicateAnnotations', () => {
  const box = (id: string, x: number): Annotation => ({
    id,
    type: 'rect',
    x,
    y: 0,
    w: 20,
    h: 20,
    stroke: '#f00',
    strokeWidth: 4,
    fill: null,
  });
  const list = [box('a', 0), box('b', 100), box('c', 200)];

  it('copies only the ids it was given, in layer order', () => {
    const copies = duplicateAnnotations(list, ['c', 'a']);
    expect(copies).toHaveLength(2);
    expect(copies.map((a) => (a.type === 'rect' ? a.x : -1))).toEqual([
      DUPLICATE_OFFSET,
      200 + DUPLICATE_OFFSET,
    ]);
  });

  it('offsets each copy so it does not hide under its original', () => {
    const [copy] = duplicateAnnotations(list, ['b']);
    expect(bbox(copy)).toEqual({
      x: 100 + DUPLICATE_OFFSET,
      y: DUPLICATE_OFFSET,
      w: 20,
      h: 20,
    });
    expect(DUPLICATE_OFFSET).toBeGreaterThan(0);
  });

  it('gives every copy a new id, and leaves the originals alone', () => {
    const copies = duplicateAnnotations(list, ['a', 'b']);
    const fresh = new Set(copies.map((a) => a.id));
    expect(fresh.size).toBe(2);
    expect([...fresh].some((id) => id === 'a' || id === 'b')).toBe(false);
    expect(list.map((a) => (a.type === 'rect' ? a.x : -1))).toEqual([0, 100, 200]);
  });

  it('copies nothing when nothing is selected', () => {
    expect(duplicateAnnotations(list, [])).toEqual([]);
    expect(duplicateAnnotations(list, ['gone'])).toEqual([]);
  });

  it('carries a step badge across, for the caller to renumber', () => {
    const step: Annotation = { id: 's', type: 'step', x: 10, y: 10, r: 12, n: 3, color: '#f00' };
    const [copy] = duplicateAnnotations([step], ['s']);
    expect(copy).toMatchObject({ type: 'step', x: 10 + DUPLICATE_OFFSET, n: 3 });
    expect(renumberSteps([step, copy]).map((a) => (a.type === 'step' ? a.n : 0))).toEqual([1, 2]);
  });
});

describe('cut tool', () => {
  it('is in the toolbar with a free shortcut letter', () => {
    const cut = TOOL_LIST.find((t) => t.id === 'cut');
    expect(cut).toBeDefined();
    expect(cut?.shortcut).toBe('X');
    const letters = TOOL_LIST.map((t) => t.shortcut);
    expect(new Set(letters).size).toBe(letters.length);
  });

  /**
   * The tool rail is not the only thing in the editor that claims a bare
   * letter: useEditor's window keydown tests a few of its own before it ever
   * looks at TOOL_LIST, and the first match wins, so a tool that took one of
   * those letters would simply never fire. The letters are read out of the
   * source rather than copied here, so a binding added later is checked too.
   *
   * All three spellings the file uses are collected — `toUpperCase() === 'F'`,
   * the plain `e.key === 'z'`, and `e.code === 'KeyD'` — and one whose condition requires a
   * modifier is passed over, because a chord cannot collide with a bare
   * letter. Negations are stripped first: the fit binding reads
   * `!isMod(e) && !e.altKey && ...`, which names the same modifiers it is
   * refusing.
   */
  it('takes no letter the window keydown already claims before the tool rail', () => {
    const source = readFileSync(join(process.cwd(), 'src/editor/useEditor.ts'), 'utf8');
    const claimed: string[] = [];
    for (const line of source.split('\n')) {
      const letters = [
        ...line.matchAll(
          /(?:toUpperCase\(\) === '([A-Za-z])'|e\.key === '([A-Za-z])'|e\.code === 'Key([A-Za-z])')/g,
        ),
      ].map((m) => (m[1] ?? m[2] ?? m[3]).toUpperCase());
      if (letters.length === 0) continue;
      const required = line.replace(/![A-Za-z.()]+/g, '');
      if (/isMod\(e\)|metaKey|ctrlKey|altKey/.test(required)) continue;
      claimed.push(...letters);
    }
    // F fits the view today. If this ever comes back empty the guard has
    // stopped guarding, so the count is asserted as well as the overlap.
    expect(claimed).toContain('F');
    // ...and the modifier filter really is filtering: ⌘Z and ⌥D are both in
    // that file, in two of the three spellings.
    expect(claimed).not.toContain('Z');
    expect(claimed).not.toContain('D');
    const letters = new Set(TOOL_LIST.map((t) => t.shortcut));
    expect(claimed.filter((letter) => letters.has(letter))).toEqual([]);
  });
});
