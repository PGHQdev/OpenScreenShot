import { describe, expect, it } from 'vitest';
import {
  announce,
  annotationLabel,
  canvasIntent,
  cycleSelection,
  MIN_SIZE,
  moveCropBy,
  placementRect,
  resizeAnnotationBy,
  resizeCropBy,
  STEP_COARSE,
  STEP_FINE,
} from '../../src/editor/keyboard';
import { bbox, translateAnnotation, type Annotation } from '../../src/editor/annotations';

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

  it('places on Enter, and applies the crop instead when one is open', () => {
    expect(canvasIntent({ key: 'Enter' }, 'idle')).toEqual({ kind: 'place' });
    expect(canvasIntent({ key: 'Enter' }, 'selection')).toEqual({ kind: 'place' });
    expect(canvasIntent({ key: 'Enter' }, 'crop')).toEqual({ kind: 'apply-crop' });
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

  it('rounds the fractional coordinates a scaled resize leaves behind', () => {
    const scaled = resizeAnnotationBy(text, 1, 0);
    expect(announce({ kind: 'resize', annotation: scaled })).toBe(
      'Text resized to 101 by 30 pixels.',
    );
  });
});
