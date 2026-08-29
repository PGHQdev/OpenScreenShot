import { describe, expect, it } from 'vitest';
import {
  announce,
  annotationLabel,
  canvasIntent,
  carryGroupBox,
  cycleSelection,
  groupBoxFor,
  keepBoxThroughEdit,
  MIN_SIZE,
  moveCropBy,
  placementRect,
  resizeAnnotationBy,
  resizeCropBy,
  resizeSelectionBy,
  STEP_COARSE,
  STEP_FINE,
  type CarriedBox,
} from '../../src/editor/keyboard';
import {
  bbox,
  translateAnnotation,
  unionBBox,
  type Annotation,
  type Rect,
} from '../../src/editor/annotations';

const rect: Annotation = {
  id: 'r',
  type: 'rect',
  x: 10,
  y: 20,
  w: 100,
  h: 50,
  stroke: '#ff3b30',
  strokeWidth: 6,
  fill: null,
};

const arrow: Annotation = {
  id: 'a',
  type: 'arrow',
  x1: 0,
  y1: 0,
  x2: 60,
  y2: 40,
  stroke: '#ff3b30',
  strokeWidth: 6,
};

const text: Annotation = {
  id: 't',
  type: 'text',
  x: 10,
  y: 20,
  text: 'hello',
  fontSize: 20,
  color: '#1d1d1f',
  width: 100,
  height: 30,
};

/** A stroke with no vertical extent — the case a naive shrink floor stretches. */
const flatPen: Annotation = {
  id: 'p',
  type: 'pen',
  points: [
    { x: 0, y: 0 },
    { x: 100, y: 0 },
  ],
  stroke: '#ff3b30',
  strokeWidth: 6,
};

describe('canvasIntent', () => {
  it('cycles layers on the bracket keys, in every mode', () => {
    for (const mode of ['idle', 'selection', 'crop'] as const) {
      expect(canvasIntent({ key: ']' }, mode)).toEqual({ kind: 'cycle', dir: 1, extend: false });
      expect(canvasIntent({ key: '[' }, mode)).toEqual({ kind: 'cycle', dir: -1, extend: false });
    }
  });

  it('extends the selection when Shift is held with a bracket', () => {
    expect(canvasIntent({ key: ']', shiftKey: true }, 'selection')).toEqual({
      kind: 'cycle',
      dir: 1,
      extend: true,
    });
    expect(canvasIntent({ key: '[', shiftKey: true }, 'selection')).toEqual({
      kind: 'cycle',
      dir: -1,
      extend: true,
    });
  });

  it('reads the shifted bracket a US layout actually reports', () => {
    // Shift+] arrives as "}" with shiftKey set; the brace alone is enough.
    expect(canvasIntent({ key: '}', shiftKey: true }, 'selection')).toEqual({
      kind: 'cycle',
      dir: 1,
      extend: true,
    });
    expect(canvasIntent({ key: '{' }, 'selection')).toEqual({
      kind: 'cycle',
      dir: -1,
      extend: true,
    });
  });

  it('leaves Ctrl and Meta chords to the window handler', () => {
    expect(canvasIntent({ key: 'z', metaKey: true }, 'selection')).toBeNull();
    expect(canvasIntent({ key: ']', ctrlKey: true }, 'selection')).toBeNull();
    expect(canvasIntent({ key: 'ArrowLeft', metaKey: true }, 'selection')).toBeNull();
  });

  it('claims no key it does not act on', () => {
    expect(canvasIntent({ key: 'v' }, 'selection')).toBeNull();
    expect(canvasIntent({ key: 'Escape' }, 'crop')).toBeNull();
    expect(canvasIntent({ key: ' ' }, 'idle')).toBeNull();
  });

  it('places on Enter, and applies the crop or the cut instead when one is open', () => {
    expect(canvasIntent({ key: 'Enter' }, 'idle')).toEqual({ kind: 'place' });
    expect(canvasIntent({ key: 'Enter' }, 'selection')).toEqual({ kind: 'place' });
    expect(canvasIntent({ key: 'Enter' }, 'crop')).toEqual({ kind: 'apply-crop' });
    expect(canvasIntent({ key: 'Enter' }, 'cut')).toEqual({ kind: 'apply-cut' });
  });

  it('nudges a selection one pixel, and ten with Shift', () => {
    expect(canvasIntent({ key: 'ArrowRight' }, 'selection')).toEqual({
      kind: 'move',
      dx: STEP_FINE,
      dy: 0,
    });
    expect(canvasIntent({ key: 'ArrowUp', shiftKey: true }, 'selection')).toEqual({
      kind: 'move',
      dx: 0,
      dy: -STEP_COARSE,
    });
  });

  it('resizes a selection when Alt is held, at the same two steps', () => {
    expect(canvasIntent({ key: 'ArrowDown', altKey: true }, 'selection')).toEqual({
      kind: 'resize',
      dx: 0,
      dy: STEP_FINE,
    });
    expect(canvasIntent({ key: 'ArrowLeft', altKey: true, shiftKey: true }, 'selection')).toEqual({
      kind: 'resize',
      dx: -STEP_COARSE,
      dy: 0,
    });
  });

  it('sends the arrows to the crop rect while a crop is open', () => {
    expect(canvasIntent({ key: 'ArrowRight' }, 'crop')).toEqual({
      kind: 'crop-move',
      dx: 1,
      dy: 0,
    });
    expect(canvasIntent({ key: 'ArrowRight', altKey: true }, 'crop')).toEqual({
      kind: 'crop-resize',
      dx: 1,
      dy: 0,
    });
  });

  it('ignores the arrows with nothing selected and no crop', () => {
    expect(canvasIntent({ key: 'ArrowRight' }, 'idle')).toBeNull();
    expect(canvasIntent({ key: 'ArrowDown', altKey: true }, 'idle')).toBeNull();
  });

  it('sends the vertical arrows to the cut band while one is drafted', () => {
    expect(canvasIntent({ key: 'ArrowDown' }, 'cut')).toEqual({ kind: 'cut-move', dy: STEP_FINE });
    expect(canvasIntent({ key: 'ArrowUp', shiftKey: true }, 'cut')).toEqual({
      kind: 'cut-move',
      dy: -STEP_COARSE,
    });
    expect(canvasIntent({ key: 'ArrowDown', altKey: true }, 'cut')).toEqual({
      kind: 'cut-resize',
      dy: STEP_FINE,
    });
  });

  it('leaves the horizontal arrows unclaimed in cut mode — a band has no width', () => {
    expect(canvasIntent({ key: 'ArrowLeft' }, 'cut')).toBeNull();
    expect(canvasIntent({ key: 'ArrowRight', altKey: true }, 'cut')).toBeNull();
  });

  it('still cycles layers and passes Ctrl chords through in cut mode', () => {
    expect(canvasIntent({ key: ']' }, 'cut')).toEqual({ kind: 'cycle', dir: 1, extend: false });
    expect(canvasIntent({ key: 'z', metaKey: true }, 'cut')).toBeNull();
  });
});

describe('cycleSelection', () => {
  const list = [
    { ...rect, id: 'one' },
    { ...rect, id: 'two' },
    { ...rect, id: 'three' },
  ];

  it('selects nothing in an empty document', () => {
    expect(cycleSelection([], [], 1)).toEqual([]);
    expect(cycleSelection([], ['one'], -1)).toEqual([]);
  });

  it('starts at the bottom layer going up, and the top layer going down', () => {
    expect(cycleSelection(list, [], 1)).toEqual(['one']);
    expect(cycleSelection(list, [], -1)).toEqual(['three']);
  });

  it('walks the layer order one step at a time', () => {
    expect(cycleSelection(list, ['one'], 1)).toEqual(['two']);
    expect(cycleSelection(list, ['two'], 1)).toEqual(['three']);
    expect(cycleSelection(list, ['three'], -1)).toEqual(['two']);
  });

  it('wraps at both ends', () => {
    expect(cycleSelection(list, ['three'], 1)).toEqual(['one']);
    expect(cycleSelection(list, ['one'], -1)).toEqual(['three']);
  });

  it('treats an id that is no longer there as no selection', () => {
    expect(cycleSelection(list, ['deleted'], 1)).toEqual(['one']);
  });

  it('reaches every layer from one key alone', () => {
    const seen: string[] = [];
    let ids: string[] = [];
    for (let i = 0; i < list.length; i++) {
      ids = cycleSelection(list, ids, 1);
      seen.push(...ids);
    }
    expect(seen).toEqual(['one', 'two', 'three']);
  });

  it('replaces the whole selection when it is not extending', () => {
    expect(cycleSelection(list, ['one', 'two'], 1)).toEqual(['three']);
  });

  it('adds the next layer when extending, keeping what was there', () => {
    expect(cycleSelection(list, ['one'], 1, true)).toEqual(['one', 'two']);
    expect(cycleSelection(list, ['one', 'two'], 1, true)).toEqual(['one', 'two', 'three']);
  });

  it('walks on from the newest member, not the first one', () => {
    // ['three','one'] is what shift-clicking the top layer then the bottom one
    // leaves behind: the walk continues from 'one', the layer just added.
    expect(cycleSelection(list, ['three', 'one'], 1, true)).toEqual(['three', 'one', 'two']);
  });

  it('re-anchors on a layer already selected rather than duplicating it', () => {
    const back = cycleSelection(list, ['one', 'two'], -1, true);
    expect(back).toEqual(['two', 'one']);
    // And the walk goes on from 'one' — no id is ever in the list twice.
    expect(cycleSelection(list, back, -1, true)).toEqual(['two', 'one', 'three']);
  });

  it('gathers the whole document when extending all the way round', () => {
    let ids: string[] = [];
    for (let i = 0; i < list.length; i++) ids = cycleSelection(list, ids, 1, true);
    expect(ids).toEqual(['one', 'two', 'three']);
    // One more press wraps onto a layer already selected and changes nothing.
    expect(cycleSelection(list, ids, 1, true)).toEqual(['two', 'three', 'one']);
  });
});

describe('resizeAnnotationBy', () => {
  it('grows a rect from its top-left corner', () => {
    const next = resizeAnnotationBy(rect, 10, 0);
    expect(bbox(next)).toEqual({ x: 10, y: 20, w: 110, h: 50 });
  });

  it('shrinks a rect without moving the anchored corner', () => {
    const next = resizeAnnotationBy(rect, 0, -10);
    expect(bbox(next)).toEqual({ x: 10, y: 20, w: 100, h: 40 });
  });

  it('floors the shrink so a rect cannot fold inside out', () => {
    const small: Annotation = { ...rect, w: 3, h: 3 } as Annotation;
    const next = resizeAnnotationBy(small, -10, 0);
    expect(bbox(next).w).toBe(MIN_SIZE);
    expect(bbox(next).x).toBe(10);
  });

  it('moves only the end point of an arrow', () => {
    const next = resizeAnnotationBy(arrow, 5, -5);
    expect(next).toMatchObject({ x1: 0, y1: 0, x2: 65, y2: 35 });
  });

  it('scales a text layer uniformly and keeps its top-left', () => {
    const next = resizeAnnotationBy(text, 10, 0);
    expect(next).toMatchObject({ x: 10, y: 20 });
    // The scale factor is a ratio, so these carry float noise. The live region
    // rounds it away; the assertion has to allow for it.
    expect(next.type === 'text' && next.fontSize).toBeCloseTo(22);
    expect(next.type === 'text' && next.width).toBeCloseTo(110);
    expect(next.type === 'text' && next.height).toBeCloseTo(33);
  });

  it('does not stretch a flat stroke on the axis the key did not name', () => {
    const next = resizeAnnotationBy(flatPen, 10, 0);
    const points = next.type === 'pen' ? next.points : [];
    expect(points.map((p) => p.y)).toEqual([0, 0]);
    expect(points[1].x).toBeCloseTo(110);
  });

  it('ten fine steps land where one coarse step does', () => {
    let fine = rect;
    for (let i = 0; i < 10; i++) fine = resizeAnnotationBy(fine, STEP_FINE, 0);
    const coarse = resizeAnnotationBy(rect, STEP_COARSE, 0);
    expect(bbox(fine)).toEqual(bbox(coarse));
  });
});

describe('resizeSelectionBy', () => {
  const box = (id: string, x: number): Annotation => ({ ...rect, id, x, y: 0, w: 100, h: 100 });
  const pair = [box('a', 0), box('b', 200)];
  /** The members only; the box comes back beside them and is checked on its own. */
  const anns = (r: { annotations: Annotation[] }) => r.annotations;

  it('drives the bottom-right corner of the box around the whole selection', () => {
    const out = resizeSelectionBy(pair, STEP_COARSE, 0);
    // The selection spans 300px; ten more makes it 310.
    expect(unionBBox(anns(out)).w).toBe(300 + STEP_COARSE);
    expect(unionBBox(anns(out)).h).toBe(100);
    expect(out.box).toMatchObject({ x: 0, y: 0, w: 310, h: 100 });
  });

  it('holds the corner opposite the one it drives', () => {
    const out = resizeSelectionBy(pair, STEP_COARSE, STEP_COARSE);
    expect(unionBBox(anns(out))).toMatchObject({ x: 0, y: 0 });
  });

  it('scales every member, not only the one on the moving edge', () => {
    const out = anns(resizeSelectionBy(pair, 300, 0));
    // The box doubles, so each member doubles in width and in its distance
    // from the anchored corner — the arrangement is kept, not stretched apart.
    expect(bbox(out[0])).toMatchObject({ x: 0, w: 200 });
    expect(bbox(out[1])).toMatchObject({ x: 400, w: 200 });
  });

  it('leaves the axis the key did not name alone', () => {
    const out = anns(resizeSelectionBy(pair, 0, STEP_COARSE));
    // A scale is a ratio, so these carry float noise the live region rounds
    // away — the same allowance the text-resize case above makes.
    expect(unionBBox(out).w).toBe(300);
    expect(unionBBox(out).h).toBeCloseTo(100 + STEP_COARSE);
  });

  it('floors the shrink so the selection cannot fold inside out', () => {
    const out = anns(resizeSelectionBy(pair, -1000, -1000));
    // Both members are 100 tall, so the vertical floor binds on the box: it
    // stops at MIN_SIZE. Across, the box spans 300 for two 100-wide members,
    // so it stops at 6 — the width at which those members are MIN_SIZE
    // themselves (see the member floor cases below).
    expect(unionBBox(out).h).toBeCloseTo(MIN_SIZE);
    expect(unionBBox(out).w).toBeCloseTo(6);
    for (const a of out) {
      expect(bbox(a).w).toBeGreaterThanOrEqual(MIN_SIZE - 0.001);
      expect(bbox(a).h).toBeGreaterThanOrEqual(MIN_SIZE - 0.001);
    }
  });

  it('ten fine steps land where one coarse step does', () => {
    let fine = { annotations: pair, box: unionBBox(pair) };
    for (let i = 0; i < 10; i++) {
      fine = resizeSelectionBy(fine.annotations, STEP_FINE, 0, fine.box);
    }
    const coarse = resizeSelectionBy(pair, STEP_COARSE, 0);
    // Both halves: the frame the next gesture drags, and the members in it.
    expect(fine.box.w).toBeCloseTo(coarse.box.w);
    expect(unionBBox(anns(fine)).w).toBeCloseTo(unionBBox(anns(coarse)).w);
  });
});

describe('carryGroupBox', () => {
  const held: CarriedBox = { box: { x: 0, y: 0, w: 40, h: 40 }, ids: ['a', 'b'] };

  it('keeps the box while the same layers are selected', () => {
    expect(carryGroupBox(held, ['a', 'b'])).toBe(held);
  });

  it('keeps it however the selection got back to that set', () => {
    // The list is ordered by when each layer joined, so taking the same two
    // back the other way round is the same set and the same box.
    expect(carryGroupBox(held, ['b', 'a'])).toBe(held);
  });

  it('keeps it whole across an empty selection and a subset', () => {
    // Click away, then take them back one bracket press at a time. The parked
    // box keeps its own ids, which is what lets the last step recognise them.
    const away = carryGroupBox(held, []);
    expect(away).toBe(held);
    const partway = carryGroupBox(away, ['b']);
    expect(partway).toBe(held);
    expect(carryGroupBox(partway, ['b', 'a'])).toBe(held);
  });

  it('drops it as soon as a layer from outside the set is selected', () => {
    expect(carryGroupBox(held, ['a', 'c'])).toBeNull();
    expect(carryGroupBox(held, ['c'])).toBeNull();
    expect(carryGroupBox(held, ['a', 'b', 'c'])).toBeNull();
  });

  it('has nothing to carry when nothing was carried', () => {
    expect(carryGroupBox(null, ['a', 'b'])).toBeNull();
  });
});

describe('keepBoxThroughEdit', () => {
  const a: Annotation = { ...rect, id: 'a', x: 0, y: 0, w: 40, h: 40 };
  const b: Annotation = { ...rect, id: 'b', x: 0, y: 50, w: 40, h: 40 };
  const held: CarriedBox = { box: { x: 0, y: 0, w: 40, h: 90 }, ids: ['a', 'b'] };

  it('keeps the box through an edit that moves no member', () => {
    // A colour change: a field no bbox reads.
    const next = [{ ...a, stroke: '#0a84ff' }, b];
    expect(keepBoxThroughEdit(held, [a, b], next)).toBe(held);
  });

  it('keeps it when the edit is to a layer outside the box', () => {
    const other: Annotation = { ...rect, id: 'c', x: 300, y: 0 };
    expect(keepBoxThroughEdit(held, [a, b], [a, b, other])).toBe(held);
  });

  it('drops it when a member changes size', () => {
    // A font size does this to a text member, through measureTextSize.
    expect(keepBoxThroughEdit(held, [a, b], [{ ...a, w: 60 }, b])).toBeNull();
  });

  it('drops it when a member moves', () => {
    expect(keepBoxThroughEdit(held, [a, b], [{ ...a, x: 5 }, b])).toBeNull();
  });

  it('drops it when a member is deleted', () => {
    expect(keepBoxThroughEdit(held, [a, b], [a])).toBeNull();
  });

  it('reads every member, not the union of them', () => {
    // The two swap places: the union is untouched and the box is not the box
    // for this arrangement any more.
    const swapped = [
      { ...a, y: 50 },
      { ...b, y: 0 },
    ];
    expect(keepBoxThroughEdit(held, [a, b], swapped)).toBeNull();
  });

  it('has nothing to keep when nothing was carried', () => {
    expect(keepBoxThroughEdit(null, [a, b], [a, b])).toBeNull();
  });
});

describe('groupBoxFor', () => {
  const held: CarriedBox = { box: { x: 0, y: 0, w: 40, h: 40 }, ids: ['a', 'b'] };

  it('gives the box back for the layers it was measured for', () => {
    expect(groupBoxFor(held, ['b', 'a'])).toBe(held.box);
  });

  it('gives nothing back while only some of them are selected', () => {
    // The box is still carried — this is the way back to it — but a box around
    // two layers is not the box to resize one in, or to hang its handles on.
    expect(groupBoxFor(carryGroupBox(held, ['a']), ['a'])).toBeNull();
    expect(groupBoxFor(carryGroupBox(held, []), [])).toBeNull();
  });

  it('gives nothing back when nothing is carried', () => {
    expect(groupBoxFor(null, ['a', 'b'])).toBeNull();
  });
});

describe('resizeSelectionBy: the shrink floor never grows the selection', () => {
  const wide: Annotation = { ...rect, id: 'r', x: 0, y: 0, w: 200, h: 100 };
  /** A near-vertical line: its bbox is half a pixel across, under MIN_SIZE. */
  const hair: Annotation = {
    id: 'l',
    type: 'line',
    x1: 0,
    y1: 0,
    x2: 0.5,
    y2: 100,
    stroke: '#ff3b30',
    strokeWidth: 6,
  };

  it('shrinks a selection holding a member already under the floor', () => {
    // The floor is a lower bound on a negative delta. Derived from a member
    // that is already under MIN_SIZE it comes back positive, and one Math.max
    // applies it in both directions: the shrink key used to take this
    // selection from 200 wide to 800, and then go inert.
    const out = resizeSelectionBy([wide, hair], -STEP_COARSE, 0);
    expect(out.box.w).toBeCloseTo(190);
  });

  it('does the same with a member one pixel wide', () => {
    const thin: Annotation = { ...rect, id: 't', x: 0, y: 0, w: 1, h: 100 };
    const out = resizeSelectionBy([wide, thin], -STEP_COARSE, 0);
    expect(out.box.w).toBeCloseTo(190);
  });

  it('still grows by exactly the delta it was given', () => {
    const out = resizeSelectionBy([wide, hair], STEP_COARSE, 0);
    expect(out.box.w).toBeCloseTo(210);
  });

  it('still holds a member that is above the floor to it', () => {
    const small: Annotation = { ...rect, id: 's', x: 0, y: 0, w: 4, h: 100 };
    const out = resizeSelectionBy([wide, small], -1000, 0);
    expect(bbox(out.annotations.find((a) => a.id === 's')!).w).toBeCloseTo(MIN_SIZE);
    expect(out.box.w).toBeCloseTo(100);
  });
});

describe('resizeSelectionBy: a widen and a narrow cancel', () => {
  // The shape matters: the glyph has to be the member that sets the union
  // edge. A glyph tucked inside a wider rectangle never sets one, so the box
  // the next call takes is unaffected by how the glyph scaled and the defect
  // this covers cannot show at all.
  const glyph: Annotation = {
    id: 't',
    type: 'text',
    x: 0,
    y: 0,
    text: 'hi',
    fontSize: 20,
    color: '#1d1d1f',
    width: 40,
    height: 40,
  };
  const neighbour: Annotation = { ...rect, id: 'r', x: 0, y: 50, w: 40, h: 40 };
  const sel = [glyph, neighbour];
  const widthOf = (list: Annotation[], id: string) => bbox(list.find((a) => a.id === id)!).w;

  it('returns the selection to its exact geometry, narrow first', () => {
    let cur = { annotations: sel, box: unionBBox(sel) };
    for (let i = 0; i < 30; i++) {
      cur = resizeSelectionBy(cur.annotations, -STEP_COARSE, 0, cur.box);
      cur = resizeSelectionBy(cur.annotations, STEP_COARSE, 0, cur.box);
    }
    expect(widthOf(cur.annotations, 't')).toBeCloseTo(40);
    expect(widthOf(cur.annotations, 'r')).toBeCloseTo(40);
    expect(cur.box).toMatchObject({ x: 0, y: 0 });
    expect(cur.box.w).toBeCloseTo(40);
  });

  it('returns it widen first too', () => {
    let cur = { annotations: sel, box: unionBBox(sel) };
    for (let i = 0; i < 30; i++) {
      cur = resizeSelectionBy(cur.annotations, STEP_COARSE, 0, cur.box);
      cur = resizeSelectionBy(cur.annotations, -STEP_COARSE, 0, cur.box);
    }
    expect(widthOf(cur.annotations, 't')).toBeCloseTo(40);
    expect(widthOf(cur.annotations, 'r')).toBeCloseTo(40);
  });

  // Three pairs of "narrow the group, click away, click back, widen it back".
  // carryGroupBox is what hands the same box back across the deselect; the
  // control below is the same loop with the box dropped, which is what every
  // selection change used to do.
  const away = (carried: CarriedBox | null) =>
    // Escape, then the two bracket presses that take the same two layers back:
    // nothing selected, the top one, then both — the path useEditor walks.
    carryGroupBox(carryGroupBox(carryGroupBox(carried, []), ['r']), ['r', 't']);

  it('cancels across a deselect and a reselect of the same layers', () => {
    let cur = { annotations: sel, box: unionBBox(sel) };
    let carried: CarriedBox | null = { box: cur.box, ids: ['t', 'r'] };
    for (let i = 0; i < 3; i++) {
      for (const step of [-STEP_COARSE, STEP_COARSE]) {
        carried = away(carried);
        cur = resizeSelectionBy(cur.annotations, step, 0, carried?.box);
        carried = { box: cur.box, ids: ['t', 'r'] };
      }
    }
    expect(widthOf(cur.annotations, 't')).toBeCloseTo(40);
    expect(widthOf(cur.annotations, 'r')).toBeCloseTo(40);
    expect(cur.box.w).toBeCloseTo(40);
  });

  it('cancels across a colour change between the two halves', () => {
    // The edit that moves nothing. Before keepBoxThroughEdit this dropped the
    // box like any other list edit, and the control below is where it landed.
    const recolour = (list: Annotation[]) => list.map((x) => ({ ...x, stroke: '#0a84ff' }));
    let cur = { annotations: sel, box: unionBBox(sel) };
    let carried: CarriedBox | null = { box: cur.box, ids: ['t', 'r'] };
    for (let i = 0; i < 3; i++) {
      for (const step of [-STEP_COARSE, STEP_COARSE]) {
        const next = recolour(cur.annotations);
        carried = keepBoxThroughEdit(carried, cur.annotations, next);
        cur = resizeSelectionBy(next, step, 0, carried?.box);
        carried = { box: cur.box, ids: ['t', 'r'] };
      }
    }
    expect(widthOf(cur.annotations, 't')).toBeCloseTo(40);
    expect(widthOf(cur.annotations, 'r')).toBeCloseTo(40);
    expect(cur.box.w).toBeCloseTo(40);
  });

  it('control: a deselect that drops the box does not cancel', () => {
    let cur = { annotations: sel, box: unionBBox(sel) };
    for (let i = 0; i < 3; i++) {
      for (const step of [-STEP_COARSE, STEP_COARSE]) {
        cur = resizeSelectionBy(cur.annotations, step, 0, undefined);
      }
    }
    // Measured: 37.9343 and 35.9753, against 40 each. Thirty pairs of the same
    // reach 20.3961 and 3.2500 — the floor, and the whole defect back again.
    expect(widthOf(cur.annotations, 't')).toBeLessThan(38.5);
    expect(widthOf(cur.annotations, 'r')).toBeLessThan(36.5);
  });

  // A nudge is the other ordinary interruption, and the one edit that maps
  // onto the box exactly: the members translate, the box translates with them,
  // and the pair still cancels. useEditor does this in movedGroupBox.
  it('cancels across a nudge of the whole selection', () => {
    const nudge = (c: { annotations: Annotation[]; box: Rect }, dx: number) => ({
      annotations: c.annotations.map((a) => translateAnnotation(a, dx, 0)),
      box: { ...c.box, x: c.box.x + dx },
    });
    let cur = { annotations: sel, box: unionBBox(sel) };
    for (let i = 0; i < 3; i++) {
      for (const step of [-STEP_COARSE, STEP_COARSE]) {
        cur = nudge(cur, 5);
        cur = resizeSelectionBy(cur.annotations, step, 0, cur.box);
      }
    }
    expect(widthOf(cur.annotations, 't')).toBeCloseTo(40);
    expect(widthOf(cur.annotations, 'r')).toBeCloseTo(40);
    expect(cur.box).toMatchObject({ x: 30, y: 0 });
    expect(cur.box.w).toBeCloseTo(40);
  });

  // The control for the parameter: hand each call a union recomputed from the
  // members instead of the box the last one produced, and the same pair walks
  // the selection down. A glyph takes one factor for both axes, so after a
  // one-axis resize its box is not the box the drag drew, and the union it
  // sets is not the box the next call should resize.
  it('control: recomputing the union each time does not cancel', () => {
    let cur = sel;
    for (let i = 0; i < 30; i++) {
      cur = resizeSelectionBy(cur, -STEP_COARSE, 0).annotations;
      cur = resizeSelectionBy(cur, STEP_COARSE, 0).annotations;
    }
    expect(widthOf(cur, 't')).toBeLessThan(35);
    expect(widthOf(cur, 'r')).toBeLessThan(20);
  });
});

describe('resizeSelectionBy: members that scale differently', () => {
  const box = (id: string, x: number, w: number): Annotation => ({
    ...rect,
    id,
    x,
    y: 0,
    w,
    h: 100,
  });
  const glyph: Annotation = {
    id: 't',
    type: 'text',
    x: 10,
    y: 10,
    text: 'hi',
    fontSize: 20,
    color: '#1d1d1f',
    width: 40,
    height: 20,
  };

  it('returns a text member to its exact size after a widen and a narrow', () => {
    // The gesture a user makes without thinking: Alt+Right, then Alt+Left.
    // Every rect returns exactly; before the geometric mean the text did not,
    // and each repeat of the pair multiplied it again with no limit.
    const sel = [box('a', 0, 100), glyph];
    const wide = resizeSelectionBy(sel, 100, 0);
    const back = resizeSelectionBy(wide.annotations, -100, 0, wide.box).annotations;
    const t = back.find((a) => a.id === 't')!;
    expect(t.type === 'text' && t.fontSize).toBeCloseTo(20);
    expect(t.type === 'text' && t.width).toBeCloseTo(40);
    expect(t.type === 'text' && t.x).toBeCloseTo(10);
    expect(bbox(back.find((a) => a.id === 'a')!)).toEqual(bbox(sel[0]));
  });

  it('keeps every member inside the box it just resized', () => {
    const sel = [box('a', 0, 100), glyph];
    const out = resizeSelectionBy(sel, 100, 0).annotations;
    const group = unionBBox(out);
    for (const a of out) {
      const b = bbox(a);
      expect(b.x).toBeGreaterThanOrEqual(group.x - 0.001);
      expect(b.y).toBeGreaterThanOrEqual(group.y - 0.001);
    }
  });

  it('stops shrinking when the smallest member reaches the floor, not the box', () => {
    // Every member takes the same factor, so a box floor on its own would
    // scale a small member to a sliver long before the box got near its own.
    const sel = [box('big', 0, 300), box('small', 0, 4)];
    const out = resizeSelectionBy(sel, -1000, 0).annotations;
    expect(bbox(out.find((a) => a.id === 'small')!).w).toBeCloseTo(MIN_SIZE);
    expect(unionBBox(out).w).toBeCloseTo(150);
  });

  it('is not frozen by a member with no extent on the axis', () => {
    // A horizontal line has no height; nothing can hold it above a floor, and
    // counting it would stop the whole selection from shrinking vertically.
    const line: Annotation = {
      id: 'l',
      type: 'line',
      x1: 0,
      y1: 0,
      x2: 100,
      y2: 0,
      stroke: '#ff3b30',
      strokeWidth: 6,
    };
    const out = resizeSelectionBy([box('a', 0, 100), line], 0, -1000).annotations;
    expect(unionBBox(out).h).toBeCloseTo(MIN_SIZE);
  });
});

describe('nudge steps', () => {
  it('ten Shift-free presses cover the same ground as one Shift press', () => {
    let fine = rect;
    for (let i = 0; i < 10; i++) {
      const it = canvasIntent({ key: 'ArrowRight' }, 'selection');
      fine = translateAnnotation(fine, (it as { dx: number }).dx, (it as { dy: number }).dy);
    }
    const shift = canvasIntent({ key: 'ArrowRight', shiftKey: true }, 'selection');
    const coarse = translateAnnotation(
      rect,
      (shift as { dx: number }).dx,
      (shift as { dy: number }).dy,
    );
    expect(bbox(fine)).toEqual(bbox(coarse));
  });
});

describe('crop adjustment', () => {
  const crop = { x: 40, y: 30, w: 200, h: 100 };

  it('moves the rect and keeps its size', () => {
    expect(moveCropBy(crop, 10, -5, 800, 600)).toEqual({ x: 50, y: 25, w: 200, h: 100 });
  });

  it('stops at the image edge instead of leaving it', () => {
    expect(moveCropBy(crop, -1000, -1000, 800, 600)).toEqual({ x: 0, y: 0, w: 200, h: 100 });
    expect(moveCropBy(crop, 1000, 1000, 800, 600)).toEqual({ x: 600, y: 500, w: 200, h: 100 });
  });

  it('normalizes a rect a drag left inverted', () => {
    expect(moveCropBy({ x: 100, y: 100, w: -40, h: -20 }, 0, 0, 800, 600)).toEqual({
      x: 60,
      y: 80,
      w: 40,
      h: 20,
    });
  });

  it('resizes from the bottom-right corner', () => {
    expect(resizeCropBy(crop, 10, 10, 800, 600)).toEqual({ x: 40, y: 30, w: 210, h: 110 });
  });

  it('never grows past the image or shrinks below a pixel', () => {
    expect(resizeCropBy(crop, 1000, 1000, 800, 600)).toEqual({ x: 40, y: 30, w: 760, h: 570 });
    expect(resizeCropBy(crop, -1000, -1000, 800, 600)).toEqual({ x: 40, y: 30, w: 1, h: 1 });
  });

  it('trims the left edge with a resize then a move', () => {
    const full = { x: 0, y: 0, w: 800, h: 600 };
    const narrower = resizeCropBy(full, -100, 0, 800, 600);
    const shifted = moveCropBy(narrower, 100, 0, 800, 600);
    expect(shifted).toEqual({ x: 100, y: 0, w: 700, h: 600 });
  });
});

describe('placementRect', () => {
  it('centres the box on the point', () => {
    expect(placementRect({ x: 400, y: 300 }, 140, 800, 600)).toEqual({
      x: 330,
      y: 230,
      w: 140,
      h: 140,
    });
  });

  it('pushes a box near an edge back inside the image', () => {
    expect(placementRect({ x: 0, y: 0 }, 140, 800, 600)).toEqual({
      x: 0,
      y: 0,
      w: 140,
      h: 140,
    });
    expect(placementRect({ x: 800, y: 600 }, 140, 800, 600)).toEqual({
      x: 660,
      y: 460,
      w: 140,
      h: 140,
    });
  });

  it('caps the box at the image it has to fit in', () => {
    expect(placementRect({ x: 20, y: 20 }, 140, 40, 30)).toEqual({ x: 0, y: 0, w: 40, h: 30 });
  });
});

describe('annotationLabel', () => {
  it('uses the word the toolbar already uses', () => {
    expect(annotationLabel('rect')).toBe('Rectangle');
    expect(annotationLabel('highlight')).toBe('Highlighter');
    expect(annotationLabel('step')).toBe('Step number');
    expect(annotationLabel('spotlight')).toBe('Spotlight');
  });
});

describe('announce', () => {
  it('names the layer and its place in the stack on selection', () => {
    expect(announce({ kind: 'select', annotation: rect, index: 2, total: 5 })).toBe(
      'Rectangle selected, layer 2 of 5.',
    );
  });

  it('counts a multi-selection against the document', () => {
    expect(announce({ kind: 'select-many', count: 3, total: 7 })).toBe(
      '3 of 7 annotations selected.',
    );
    expect(announce({ kind: 'select-many', count: 2, total: 2 })).toBe(
      '2 of 2 annotations selected.',
    );
  });

  it('says when the selection went away', () => {
    expect(announce({ kind: 'deselect' })).toBe('Selection cleared.');
  });

  it('gives the position of a new layer', () => {
    expect(announce({ kind: 'add', annotation: rect })).toBe('Rectangle added at 10, 20.');
  });

  it('gives the position a move landed on', () => {
    const moved = translateAnnotation(rect, 5, -5);
    expect(announce({ kind: 'move', annotation: moved })).toBe('Rectangle moved to 15, 15.');
  });

  it('gives the size a resize landed on', () => {
    const bigger = resizeAnnotationBy(rect, 10, 10);
    expect(announce({ kind: 'resize', annotation: bigger })).toBe(
      'Rectangle resized to 110 by 60 pixels.',
    );
  });

  it('counts the layers a multi-selection move or resize touched', () => {
    // No one position or size fits several layers, so the count is what there
    // is to say. The singular is still reachable: it is what a one-layer
    // marquee catch announces.
    expect(announce({ kind: 'move-many', count: 3 })).toBe('3 annotations moved.');
    expect(announce({ kind: 'resize-many', count: 2 })).toBe('2 annotations resized.');
    expect(announce({ kind: 'move-many', count: 1 })).toBe('1 annotation moved.');
  });

  it('counts a duplicate, and pluralizes it', () => {
    expect(announce({ kind: 'duplicate', count: 1 })).toBe('1 annotation duplicated.');
    expect(announce({ kind: 'duplicate', count: 4 })).toBe('4 annotations duplicated.');
  });

  it('counts both sides of a multi-selection delete', () => {
    expect(announce({ kind: 'delete-many', count: 3, remaining: 2 })).toBe(
      '3 annotations deleted, 2 annotations left.',
    );
    expect(announce({ kind: 'delete-many', count: 2, remaining: 0 })).toBe(
      '2 annotations deleted, no annotations left.',
    );
  });

  it('counts what is left after a delete', () => {
    expect(announce({ kind: 'delete', type: 'blur', remaining: 3 })).toBe(
      'Blur deleted, 3 annotations left.',
    );
    expect(announce({ kind: 'delete', type: 'blur', remaining: 1 })).toBe(
      'Blur deleted, 1 annotation left.',
    );
    expect(announce({ kind: 'delete', type: 'blur', remaining: 0 })).toBe(
      'Blur deleted, no annotations left.',
    );
  });

  it('counts what is on the canvas after undo and redo', () => {
    expect(announce({ kind: 'undo', total: 3 })).toBe('Undo. 3 annotations.');
    expect(announce({ kind: 'redo', total: 1 })).toBe('Redo. 1 annotation.');
  });

  it('gives the crop its size and its corner', () => {
    expect(announce({ kind: 'crop', rect: { x: 5, y: 6, w: 800, h: 600 } })).toBe(
      'Crop 800 by 600 pixels at 5, 6.',
    );
  });

  it('normalizes an inverted crop before reading it out', () => {
    expect(announce({ kind: 'crop', rect: { x: 100, y: 100, w: -40, h: -20 } })).toBe(
      'Crop 40 by 20 pixels at 60, 80.',
    );
  });

  it('reports the new image size once a crop is applied', () => {
    expect(announce({ kind: 'crop-applied', w: 800, h: 600 })).toBe(
      'Cropped to 800 by 600 pixels.',
    );
    expect(announce({ kind: 'crop-cancelled' })).toBe('Crop cancelled.');
  });

  it('reads a drafted band out by its height and where it sits', () => {
    expect(announce({ kind: 'cut', band: { y: 300.4, h: 140.6 } })).toBe(
      'Cut band 141 pixels tall at 300.',
    );
  });

  it('reports what a cut took and what the picture is now', () => {
    expect(
      announce({ kind: 'cut-applied', band: { y: 300, h: 200 }, imageHeight: 400, hidden: 0 }),
    ).toBe('Cut 200 pixels. Image 400 pixels tall.');
    expect(announce({ kind: 'cut-removed', band: { y: 300, h: 200 }, imageHeight: 600 })).toBe(
      'Put back 200 pixels. Image 600 pixels tall.',
    );
    expect(announce({ kind: 'cut-cancelled' })).toBe('Cut cancelled.');
    expect(announce({ kind: 'cut-refused' })).toBe('A cut cannot take the whole picture.');
    expect(announce({ kind: 'cut-none' })).toBe('Those rows are cut already.');
  });

  it('names the marks a cut took out of the picture, since the layer count keeps them', () => {
    expect(
      announce({ kind: 'cut-applied', band: { y: 300, h: 200 }, imageHeight: 400, hidden: 1 }),
    ).toBe('Cut 200 pixels. Image 400 pixels tall. 1 annotation out of the picture.');
    expect(
      announce({ kind: 'cut-applied', band: { y: 300, h: 200 }, imageHeight: 400, hidden: 3 }),
    ).toBe('Cut 200 pixels. Image 400 pixels tall. 3 annotations out of the picture.');
  });

  it('says what left the picture when a gesture carried a mark onto cut rows', () => {
    expect(announce({ kind: 'hidden', count: 1, remaining: 0 })).toBe(
      '1 annotation out of the picture. Selection cleared.',
    );
    expect(announce({ kind: 'hidden', count: 2, remaining: 3 })).toBe(
      '2 annotations out of the picture. 3 annotations selected.',
    );
  });

  it('names the new height when a timeline step crossed a cut, and not when it did not', () => {
    expect(announce({ kind: 'undo', total: 1 })).toBe('Undo. 1 annotation.');
    expect(announce({ kind: 'undo', total: 1, imageHeight: 600 })).toBe(
      'Undo. Image 600 pixels tall. 1 annotation.',
    );
    expect(announce({ kind: 'redo', total: 2, imageHeight: 400 })).toBe(
      'Redo. Image 400 pixels tall. 2 annotations.',
    );
  });

  it('rounds the fractional coordinates a scaled resize leaves behind', () => {
    const scaled = resizeAnnotationBy(text, 1, 0);
    expect(announce({ kind: 'resize', annotation: scaled })).toBe(
      'Text resized to 101 by 30 pixels.',
    );
  });
});
