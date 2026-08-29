import { describe, expect, it } from 'vitest';
import {
  historyStep,
  HISTORY_IMAGE_BUDGET_PX,
  trimHistoryImages,
  type HistoryEntry,
} from '../../src/editor/history';
import { cropAnnotations, cropSize } from '../../src/editor/crop';
import type { Annotation, Rect } from '../../src/editor/annotations';
import type { Band } from '../../src/editor/bands';

/**
 * A decoded picture, as far as the timeline is concerned: an identity and a
 * size. Nothing here touches the DOM, so a plain object with the two fields
 * history.ts actually reads is the whole of it.
 */
function image(w: number, h: number): HTMLImageElement {
  return { naturalWidth: w, naturalHeight: h } as HTMLImageElement;
}

/** Distinct one-annotation lists, so a step's result names itself. */
function list(tag: string): Annotation[] {
  return [
    {
      id: tag,
      type: 'rect',
      x: 0,
      y: 0,
      w: 10,
      h: 10,
      stroke: '#ff3b30',
      strokeWidth: 6,
      fill: null,
    },
  ];
}

/** One timeline entry: a named list, the cuts, and the selection with them. */
function entry(
  tag: string,
  selectedIds: string[] = [],
  bands: Band[] = [],
  img: HTMLImageElement | null = null,
): HistoryEntry {
  return { annotations: list(tag), bands, selectedIds, image: img };
}

const ids = (e: HistoryEntry) => e.annotations.map((a) => a.id).join(',');
const stack = (s: HistoryEntry[]) => s.map(ids);

describe('historyStep', () => {
  it('has nothing to undo on an empty past', () => {
    expect(historyStep([], [entry('b')], entry('c'), -1)).toBeNull();
  });

  it('has nothing to redo on an empty future', () => {
    expect(historyStep([entry('a')], [], entry('c'), 1)).toBeNull();
  });

  it('undo shows the newest past entry and drops it from the stack', () => {
    const step = historyStep([entry('a'), entry('b')], [], entry('c'), -1)!;
    expect(ids(step.entry)).toBe('b');
    expect(stack(step.past)).toEqual(['a']);
  });

  it('undo pushes what was on screen onto the front of the future', () => {
    const step = historyStep([entry('a')], [entry('z')], entry('c'), -1)!;
    expect(stack(step.future)).toEqual(['c', 'z']);
  });

  it('redo shows the oldest future entry and drops it from the stack', () => {
    const step = historyStep([], [entry('y'), entry('z')], entry('c'), 1)!;
    expect(ids(step.entry)).toBe('y');
    expect(stack(step.future)).toEqual(['z']);
  });

  it('redo pushes what was on screen onto the end of the past', () => {
    const step = historyStep([entry('a')], [entry('y')], entry('c'), 1)!;
    expect(stack(step.past)).toEqual(['a', 'c']);
  });

  it('undo then redo returns every part of the state it started from', () => {
    const past = [entry('a'), entry('b')];
    const future = [entry('z')];
    const current = entry('c');
    const back = historyStep(past, future, current, -1)!;
    const forward = historyStep(back.past, back.future, back.entry, 1)!;
    expect(ids(forward.entry)).toBe(ids(current));
    expect(stack(forward.past)).toEqual(stack(past));
    expect(stack(forward.future)).toEqual(stack(future));
  });

  it('a run of undos walks back one entry at a time, newest first', () => {
    let past = [entry('a'), entry('b'), entry('c')];
    let future: HistoryEntry[] = [];
    let current = entry('d');
    const seen: string[] = [];
    for (let i = 0; i < 4; i++) {
      const step = historyStep(past, future, current, -1);
      if (!step) break;
      seen.push(ids(step.entry));
      past = step.past;
      future = step.future;
      current = step.entry;
    }
    expect(seen).toEqual(['c', 'b', 'a']);
    expect(historyStep(past, future, current, -1)).toBeNull();
  });

  // Every edit acts on the whole selection, so an entry carries the selection
  // it was made against — undo restores the layers, and what was selected on
  // them, together.
  it('carries the selection with the entry, both ways', () => {
    const past = [entry('a', ['a'])];
    const current = entry('b', ['b1', 'b2']);
    const back = historyStep(past, [], current, -1)!;
    expect(back.entry.selectedIds).toEqual(['a']);
    expect(back.future[0].selectedIds).toEqual(['b1', 'b2']);
    const forward = historyStep(back.past, back.future, back.entry, 1)!;
    expect(forward.entry.selectedIds).toEqual(['b1', 'b2']);
    expect(forward.past[0].selectedIds).toEqual(['a']);
  });

  // useEditor writes these straight into refs that other handlers read back
  // inside the same event, so a step that mutated its inputs would corrupt the
  // state it was asked to describe.
  it('leaves the stacks it was given untouched', () => {
    const past = [entry('a'), entry('b')];
    const future = [entry('z')];
    const pastBefore = stack(past);
    const futureBefore = stack(future);
    historyStep(past, future, entry('c'), -1);
    historyStep(past, future, entry('c'), 1);
    expect(stack(past)).toEqual(pastBefore);
    expect(stack(future)).toEqual(futureBefore);
  });

  it('returns fresh arrays rather than the ones it was handed', () => {
    const past = [entry('a')];
    const future = [entry('z')];
    const undone = historyStep(past, future, entry('c'), -1)!;
    expect(undone.past).not.toBe(past);
    expect(undone.future).not.toBe(future);
    const redone = historyStep(past, future, entry('c'), 1)!;
    expect(redone.past).not.toBe(past);
    expect(redone.future).not.toBe(future);
  });
});

describe('cut bands on the timeline', () => {
  it('undo shows the bands that went with the list it shows', () => {
    // The cut is the newest edit: the current document has the band, the entry
    // behind it does not, and undoing has to put the strip back.
    const before = entry('a', [], []);
    const current = entry('a', [], [{ y: 100, h: 40 }]);
    const step = historyStep([before], [], current, -1)!;
    expect(step.entry.bands).toEqual([]);
    expect(step.future[0].bands).toEqual([{ y: 100, h: 40 }]);
  });

  it('redo hands the cut back', () => {
    const cut = entry('a', [], [{ y: 100, h: 40 }]);
    const step = historyStep([], [cut], entry('a'), 1)!;
    expect(step.entry.bands).toEqual([{ y: 100, h: 40 }]);
  });
});

/**
 * The picture on the timeline.
 *
 * Crop is the one edit that replaces it, so the entry it pushes has to carry
 * the picture as well as the list — the surviving annotations are rewritten
 * into the new image's coordinates, and nothing else on the stack could put
 * them back where they were measured.
 */
describe('the picture on the timeline', () => {
  it('hands the picture back with the list it was measured against', () => {
    const before = image(800, 600);
    const after = image(300, 200);
    const step = historyStep([entry('a', [], [], before)], [], entry('b', [], [], after), -1)!;
    expect(step.entry.image).toBe(before);
    expect(step.future[0].image).toBe(after);
    const forward = historyStep(step.past, step.future, step.entry, 1)!;
    expect(forward.entry.image).toBe(after);
  });
});

describe('trimHistoryImages', () => {
  const big = () => image(4000, 4000); // 16 megapixels

  it('keeps a past whose pictures fit inside the budget', () => {
    const past = [entry('a', [], [], big()), entry('b', [], [], big())];
    expect(trimHistoryImages(past, HISTORY_IMAGE_BUDGET_PX)).toBe(past);
  });

  it('drops the oldest entries once the pictures stop fitting', () => {
    const past = [entry('a', [], [], big()), entry('b', [], [], big()), entry('c', [], [], big())];
    expect(stack(trimHistoryImages(past, HISTORY_IMAGE_BUDGET_PX))).toEqual(['b', 'c']);
  });

  // Every edit between two crops shares one picture, so a long run of ordinary
  // edits costs the budget nothing at all.
  it('counts a picture once however many entries share it', () => {
    const shared = big();
    const past = Array.from({ length: 50 }, (_, i) => entry(`e${i}`, [], [], shared));
    expect(trimHistoryImages(past, HISTORY_IMAGE_BUDGET_PX)).toBe(past);
  });

  it('leaves entries that carry no picture alone', () => {
    const past = [entry('a'), entry('b'), entry('c')];
    expect(trimHistoryImages(past, 0)).toBe(past);
  });

  // A crop that could not be undone at all would be a worse answer than one
  // whose undo is expensive, so the newest entry survives any budget.
  it('always keeps the newest entry, whatever it costs', () => {
    const past = [entry('a', [], [], big()), entry('b', [], [], image(20000, 20000))];
    expect(stack(trimHistoryImages(past, HISTORY_IMAGE_BUDGET_PX))).toEqual(['b']);
    expect(stack(trimHistoryImages([entry('only', [], [], image(20000, 20000))], 1))).toEqual([
      'only',
    ]);
  });

  it('has nothing to do with an empty past', () => {
    expect(trimHistoryImages([], HISTORY_IMAGE_BUDGET_PX)).toEqual([]);
  });
});

/**
 * A crop, driven along the timeline the way useEditor drives it.
 *
 * The three moves below are the editor's, in the editor's order: `cropStep`
 * pushes the entry *before* it filters and translates anything (applyCrop),
 * `drawStep` is commit(), and `back`/`forward` are undo() and redo(). What
 * they compose is what the brief asks about — an undone crop that puts the
 * picture, the coordinates and the dropped layers back.
 */
interface Doc {
  anns: Annotation[];
  bands: Band[];
  sel: string[];
  img: HTMLImageElement;
}

interface Timeline {
  doc: Doc;
  past: HistoryEntry[];
  future: HistoryEntry[];
}

const asEntry = (d: Doc): HistoryEntry => ({
  annotations: d.anns,
  bands: d.bands,
  selectedIds: d.sel,
  image: d.img,
});

const asDoc = (e: HistoryEntry, fallback: HTMLImageElement): Doc => ({
  anns: e.annotations,
  bands: e.bands,
  sel: e.selectedIds,
  img: e.image ?? fallback,
});

function cropStep(t: Timeline, rect: Rect): Timeline {
  const past = trimHistoryImages([...t.past, asEntry(t.doc)], HISTORY_IMAGE_BUDGET_PX);
  const size = cropSize(rect);
  return {
    past,
    future: [],
    doc: {
      anns: cropAnnotations(t.doc.anns, rect, t.doc.bands),
      bands: [],
      sel: [],
      img: image(size.w, size.h),
    },
  };
}

function drawStep(t: Timeline, a: Annotation): Timeline {
  return {
    past: [...t.past, asEntry(t.doc)],
    future: [],
    doc: { ...t.doc, anns: [...t.doc.anns, a] },
  };
}

function walk(t: Timeline, dir: -1 | 1): Timeline {
  const s = historyStep(t.past, t.future, asEntry(t.doc), dir);
  if (!s) throw new Error(`nothing to ${dir === -1 ? 'undo' : 'redo'}`);
  return { past: s.past, future: s.future, doc: asDoc(s.entry, t.doc.img) };
}

function box(id: string, x: number, y: number): Annotation {
  return { id, type: 'rect', x, y, w: 20, h: 20, stroke: '#ff3b30', strokeWidth: 6, fill: null };
}

const at = (d: Doc, id: string) => {
  const a = d.anns.find((x) => x.id === id);
  return a && a.type === 'rect' ? { x: a.x, y: a.y } : null;
};

describe('a crop on the timeline', () => {
  const source = image(800, 600);
  const start = (anns: Annotation[], bands: Band[] = []): Timeline => ({
    past: [],
    future: [],
    doc: { anns, bands, sel: anns.map((a) => a.id), img: source },
  });

  it('crop then undo puts the picture, the coordinates and the dropped layer back', () => {
    // 'kept' is inside the crop, 'gone' is above it — the crop drops it.
    const t0 = start([box('kept', 150, 100), box('gone', 10, 10)]);
    const t1 = cropStep(t0, { x: 100, y: 50, w: 300, h: 200 });
    expect(t1.doc.anns.map((a) => a.id)).toEqual(['kept']);
    expect(at(t1.doc, 'kept')).toEqual({ x: 50, y: 50 });
    expect(t1.doc.img).not.toBe(source);
    expect([t1.doc.img.naturalWidth, t1.doc.img.naturalHeight]).toEqual([300, 200]);

    const back = walk(t1, -1);
    expect(back.doc.img).toBe(source);
    expect(back.doc.anns.map((a) => a.id)).toEqual(['kept', 'gone']);
    expect(at(back.doc, 'kept')).toEqual({ x: 150, y: 100 });
    expect(at(back.doc, 'gone')).toEqual({ x: 10, y: 10 });
    expect(back.doc.sel).toEqual(['kept', 'gone']);
  });

  // The entry is what the undo above reads, and applyCrop takes it before the
  // filter runs. Taken after, it would hold the cropped list, and the undo
  // would restore a document that never existed.
  it('pushes the entry the crop found, not the one it made', () => {
    const t0 = start([box('kept', 150, 100), box('gone', 10, 10)], [{ y: 400, h: 40 }]);
    const t1 = cropStep(t0, { x: 100, y: 50, w: 300, h: 200 });
    const pushed = t1.past.at(-1)!;
    expect(pushed.annotations.map((a) => a.id)).toEqual(['kept', 'gone']);
    expect(pushed.bands).toEqual([{ y: 400, h: 40 }]);
    expect(pushed.image).toBe(source);
    expect(t1.doc.bands).toEqual([]);
  });

  it('a cut the crop baked in comes back with the picture', () => {
    const t0 = start([box('below', 150, 500)], [{ y: 100, h: 100 }]);
    // The crop takes composed rows 300..500, which are source rows 400..600.
    const t1 = cropStep(t0, { x: 0, y: 300, w: 800, h: 200 });
    expect(at(t1.doc, 'below')).toEqual({ x: 150, y: 500 - 100 - 300 });
    const back = walk(t1, -1);
    expect(back.doc.bands).toEqual([{ y: 100, h: 100 }]);
    expect(at(back.doc, 'below')).toEqual({ x: 150, y: 500 });
  });

  it('crop, annotate, undo, redo lands back on the annotated crop', () => {
    const t0 = start([box('kept', 150, 100)]);
    const t1 = cropStep(t0, { x: 100, y: 50, w: 300, h: 200 });
    const t2 = drawStep(t1, box('drawn', 10, 10));
    expect(t2.doc.anns.map((a) => a.id)).toEqual(['kept', 'drawn']);

    const back = walk(t2, -1);
    expect(back.doc.anns.map((a) => a.id)).toEqual(['kept']);
    // The undo took the drawing off, not the crop: the picture is still the
    // cropped one, and 'kept' still has its cropped coordinates.
    expect(back.doc.img).toBe(t1.doc.img);
    expect(at(back.doc, 'kept')).toEqual({ x: 50, y: 50 });

    const forward = walk(back, 1);
    expect(forward.doc.anns.map((a) => a.id)).toEqual(['kept', 'drawn']);
    expect(forward.doc.img).toBe(t1.doc.img);
    expect(at(forward.doc, 'drawn')).toEqual({ x: 10, y: 10 });
  });

  it('a crop applied twice, undone once, lands on the picture between them', () => {
    const t0 = start([box('kept', 150, 100)]);
    const t1 = cropStep(t0, { x: 100, y: 50, w: 300, h: 200 }); // 'kept' at 50,50
    const t2 = cropStep(t1, { x: 20, y: 20, w: 100, h: 100 }); // 'kept' at 30,30
    expect(at(t2.doc, 'kept')).toEqual({ x: 30, y: 30 });
    expect([t2.doc.img.naturalWidth, t2.doc.img.naturalHeight]).toEqual([100, 100]);

    const once = walk(t2, -1);
    // The intermediate picture is the very one the first crop made, not a
    // re-derivation of it, and the coordinates are the ones measured on it.
    expect(once.doc.img).toBe(t1.doc.img);
    expect([once.doc.img.naturalWidth, once.doc.img.naturalHeight]).toEqual([300, 200]);
    expect(at(once.doc, 'kept')).toEqual({ x: 50, y: 50 });

    const twice = walk(once, -1);
    expect(twice.doc.img).toBe(source);
    expect(at(twice.doc, 'kept')).toEqual({ x: 150, y: 100 });

    // And forward again through both, to the same two pictures.
    const redoOne = walk(twice, 1);
    expect(redoOne.doc.img).toBe(t1.doc.img);
    expect(at(redoOne.doc, 'kept')).toEqual({ x: 50, y: 50 });
    const redoTwo = walk(redoOne, 1);
    expect(redoTwo.doc.img).toBe(t2.doc.img);
    expect(at(redoTwo.doc, 'kept')).toEqual({ x: 30, y: 30 });
  });

  it('holds one picture per crop and nothing per ordinary edit', () => {
    let t = start([box('kept', 150, 100)]);
    t = cropStep(t, { x: 0, y: 0, w: 400, h: 400 });
    for (let i = 0; i < 20; i++) t = drawStep(t, box(`d${i}`, 1, 1));
    t = cropStep(t, { x: 0, y: 0, w: 200, h: 200 });
    const distinct = new Set(t.past.map((e) => e.image));
    expect(t.past.length).toBe(22);
    expect(distinct.size).toBe(2);
  });
});
