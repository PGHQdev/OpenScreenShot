/**
 * The canvas keyboard model — the pure half.
 *
 * useEditor owns the listener, the state writes and the announcements; this
 * module holds the decisions a key chord makes and the geometry those
 * decisions apply, so the state machine is testable without a DOM.
 *
 * The precedent is the region picker's arrow nudge
 * (src/content/region-select.ts): Shift multiplies one step, the handler
 * claims only the keys it acts on, and everything it claims is clamped.
 *
 * Layer cycling takes `[` and `]`, not Tab. Tab is the page's focus order —
 * the editor already has a topbar, a style bar, a toolbar and focus-trapped
 * modals in it, and the topbar's Delete button is exactly what a keyboard user
 * reaches for after selecting a layer. A canvas that swallowed Tab would trap
 * them on it.
 */
import {
  bbox,
  normalizeRect,
  resizeRect,
  scaleAnnotation,
  scaleInBox,
  unionBBox,
  type Annotation,
  type AnnotationType,
  type Point,
  type Rect,
} from './annotations';
import type { Band } from './bands';
import { TOOL_LIST } from './tools';

/** Nudge and resize step, in image pixels. Shift takes the coarse one. */
export const STEP_FINE = 1;
export const STEP_COARSE = 10;

/** Smallest box a keyboard resize may leave behind, so a shrink cannot invert it. */
export const MIN_SIZE = 2;

/** On-screen size (CSS px) of a keyboard placement, so it reads the same at any zoom. */
export const PLACE_SIZE_PX = 140;

/** A keydown reduced to what the model reads. */
export interface KeyChord {
  key: string;
  shiftKey?: boolean;
  altKey?: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean;
}

/** What the canvas is doing when the key arrives. */
export type CanvasMode = 'crop' | 'cut' | 'selection' | 'idle';

export type CanvasIntent =
  | { kind: 'cycle'; dir: 1 | -1; extend: boolean }
  | { kind: 'place' }
  | { kind: 'apply-crop' }
  | { kind: 'apply-cut' }
  | { kind: 'move'; dx: number; dy: number }
  | { kind: 'resize'; dx: number; dy: number }
  | { kind: 'crop-move'; dx: number; dy: number }
  | { kind: 'crop-resize'; dx: number; dy: number }
  | { kind: 'cut-move'; dy: number }
  | { kind: 'cut-resize'; dy: number };

const ARROWS: Record<string, Point> = {
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
};

/**
 * What a key chord means on the focused canvas, or null to let it through.
 *
 * Ctrl and Meta chords always pass: undo, redo, zoom, copy and export are
 * window-level and must keep working while the canvas holds focus.
 *
 * Shift with a bracket extends the selection instead of replacing it. A US
 * layout reports that chord as `}` / `{` rather than as a shifted bracket, so
 * both spellings are claimed — on a layout that keeps the bracket, shiftKey is
 * what carries the meaning.
 */
export function canvasIntent(e: KeyChord, mode: CanvasMode): CanvasIntent | null {
  if (e.ctrlKey || e.metaKey) return null;
  if (e.key === ']' || e.key === '}') {
    return { kind: 'cycle', dir: 1, extend: e.key === '}' || !!e.shiftKey };
  }
  if (e.key === '[' || e.key === '{') {
    return { kind: 'cycle', dir: -1, extend: e.key === '{' || !!e.shiftKey };
  }
  if (e.key === 'Enter') {
    if (mode === 'crop') return { kind: 'apply-crop' };
    if (mode === 'cut') return { kind: 'apply-cut' };
    return { kind: 'place' };
  }
  const dir = ARROWS[e.key];
  if (!dir) return null;
  const step = e.shiftKey ? STEP_COARSE : STEP_FINE;
  const dx = dir.x * step;
  const dy = dir.y * step;
  if (mode === 'crop') {
    return e.altKey ? { kind: 'crop-resize', dx, dy } : { kind: 'crop-move', dx, dy };
  }
  // A cut band spans the picture, so only the vertical arrows have anything
  // to say to it. The horizontal pair is left unclaimed rather than made a
  // no-op, so nothing swallows a key it does not act on.
  if (mode === 'cut') {
    if (dy === 0) return null;
    return e.altKey ? { kind: 'cut-resize', dy } : { kind: 'cut-move', dy };
  }
  if (mode === 'selection') {
    return e.altKey ? { kind: 'resize', dx, dy } : { kind: 'move', dx, dy };
  }
  return null;
}

/**
 * The selection one layer from the one it is handed. `]` walks up the paint
 * order, `[` walks down, and both wrap. From nothing selected, `]` starts at
 * the bottom layer and `[` at the top, so either key reaches every layer on
 * its own.
 *
 * The walk starts from the last id in `selectedIds` — the layer the previous
 * press landed on — so a run of presses keeps travelling in one direction
 * whether or not it is extending. `extend` keeps what is already selected and
 * appends the layer it arrives at; re-arriving at a layer already in the
 * selection moves it to the end rather than duplicating it, which keeps the
 * walk anchored on where the user actually is.
 */
export function cycleSelection(
  anns: Annotation[],
  selectedIds: string[],
  dir: 1 | -1,
  extend = false,
): string[] {
  if (anns.length === 0) return [];
  const from = selectedIds[selectedIds.length - 1] ?? null;
  const i = anns.findIndex((a) => a.id === from);
  const next =
    i === -1
      ? (dir === 1 ? anns[0] : anns[anns.length - 1]).id
      : anns[(i + dir + anns.length) % anns.length].id;
  return extend ? [...selectedIds.filter((id) => id !== next), next] : [next];
}

/**
 * Grow or shrink an annotation by a keyboard delta. The arrows drive the
 * bottom-right corner (an arrow or line's end point) while the opposite corner
 * stays put, which is what "grow right, grow down" asks for. Only the axis the
 * key names moves, so a shrink floor on one axis never stretches the other.
 */
export function resizeAnnotationBy(a: Annotation, dx: number, dy: number): Annotation {
  if (a.type === 'arrow' || a.type === 'line') {
    return { ...a, x2: a.x2 + dx, y2: a.y2 + dy };
  }
  const start = bbox(a);
  const cdx = dx === 0 ? 0 : Math.max(dx, MIN_SIZE - start.w);
  const cdy = dy === 0 ? 0 : Math.max(dy, MIN_SIZE - start.h);
  if (a.type === 'rect' || a.type === 'blur' || a.type === 'spotlight') {
    const r = resizeRect(start, 'se', cdx, cdy);
    return { ...a, x: r.x, y: r.y, w: r.w, h: r.h };
  }
  return scaleAnnotation(a, start, 'se', cdx, cdy);
}

/**
 * The most a box may shrink on one axis: enough to keep the box itself above
 * MIN_SIZE, and enough to keep its smallest member above it too. Every member
 * takes the same factor, so a box floor alone would let a small member inside a
 * large box be scaled to a sub-pixel sliver long before the box got near its
 * own floor.
 *
 * Only members already above the floor are counted, and that filter is what
 * keeps the result negative — a shrink floor that came back positive would be
 * applied to a grow as well (both go through one Math.max), and the shrink key
 * would jump the selection outwards instead. A member at or under MIN_SIZE
 * cannot be held above it by refusing to shrink, and letting one freeze the
 * axis for everything else costs more than it saves: a near-vertical line's
 * bbox is a fraction of a pixel wide, and a selection holding one would never
 * narrow again.
 *
 * So the floor clamps the first crossing, and only that one: a member landing
 * exactly on MIN_SIZE stops being counted, and the next press scales it under.
 * The box itself is down at its own floor by then, and the alternative
 * (counting members at the floor) is a shrink key that has gone inert.
 */
function shrinkFloor(boxSize: number, sizes: number[]): number {
  const byBox = MIN_SIZE - boxSize;
  const smallest = Math.min(...sizes.filter((s) => s > MIN_SIZE));
  if (!Number.isFinite(smallest) || boxSize <= 0) return byBox;
  // smallest > MIN_SIZE, so this ratio is below 1 and the delta is negative.
  return Math.max(byBox, (boxSize * MIN_SIZE) / smallest - boxSize);
}

/** A selection resized, and the box it was resized into. */
export interface SelectionResize {
  annotations: Annotation[];
  box: Rect;
}

/**
 * Grow or shrink a whole selection by a keyboard delta. The arrows drive the
 * bottom-right corner of the box around the selection while the opposite
 * corner stays put — the same gesture resizeAnnotationBy applies to one
 * annotation, applied to the box the pointer's group handles drag. Every
 * member is scaled inside that box, so the selection keeps its arrangement
 * instead of each layer growing on its own and drifting apart.
 *
 * `from` is the box to resize, and the caller is expected to hand back the box
 * this returns rather than let the next call take a fresh union. A glyph
 * scales by one factor for both axes, so after a one-axis resize it no longer
 * fills the box the way a rectangle does, and a union recomputed from the
 * members would come back a little larger or smaller than the box the user
 * actually dragged. Feeding that union into the next resize is a ratchet: a
 * widen and a narrow would not cancel, and repeating the pair would walk the
 * selection down (measured at ~1.7% a cycle on the glyph, ~3.3% on its
 * neighbours). Carrying the box makes the two exact inverses, whatever the
 * selection holds. With no box to carry, it starts from the union.
 */
export function resizeSelectionBy(
  sel: Annotation[],
  dx: number,
  dy: number,
  from?: Rect,
): SelectionResize {
  const box = from ?? unionBBox(sel);
  const boxes = sel.map((a) => bbox(a));
  const widths = boxes.map((b) => b.w);
  const heights = boxes.map((b) => b.h);
  const cdx = dx === 0 ? 0 : Math.max(dx, shrinkFloor(box.w, widths));
  const cdy = dy === 0 ? 0 : Math.max(dy, shrinkFloor(box.h, heights));
  return {
    annotations: sel.map((a) => scaleInBox(a, box, 'se', cdx, cdy)),
    box: resizeRect(box, 'se', cdx, cdy),
  };
}

/** A carried resize box, and the selection it was measured for. */
export interface CarriedBox {
  box: Rect;
  ids: string[];
}

/**
 * The carried box after a change of selection: kept while everything selected
 * is one of the layers it was measured for, dropped as soon as anything else
 * is. A change of selection moves nothing, so the box still describes those
 * layers exactly, and "widen, click away, click back, narrow" cancels the way
 * two consecutive presses do.
 *
 * Kept means kept whole, ids and all, so a selection on the way somewhere does
 * not re-key it: clicking away empties the selection, and taking the same
 * layers back one bracket press at a time goes through a subset of them.
 * What an edit to the list does to the box is decided in applyAnnotations, by
 * keepBoxThroughEdit below and, for a move of the whole selection, by
 * translating it; neither is decided here.
 */
export function carryGroupBox(prev: CarriedBox | null, ids: string[]): CarriedBox | null {
  if (!prev) return null;
  const held = new Set(prev.ids);
  return ids.every((id) => held.has(id)) ? prev : null;
}

/**
 * The carried box for a selection, and null while it is a box for more layers
 * than are selected — the state carryGroupBox leaves behind on the way back to
 * the full set. A box measured around three layers is not the box to resize
 * two in, nor the box to hang two layers' handles on.
 *
 * Everything selected is one of the ids the box was measured for (carryGroupBox
 * drops it otherwise), so counting them is enough to compare the two sets.
 */
export function groupBoxFor(carried: CarriedBox | null, ids: string[]): Rect | null {
  return carried && carried.ids.length === ids.length ? carried.box : null;
}

/**
 * The carried box after an edit to the annotation list: kept when every layer
 * it was measured for still has the bbox it had, dropped otherwise.
 *
 * The rule is "keep unless the members moved", which is the inverse of what
 * applyAnnotations used to assume, and it is deliberate. A colour, a stroke
 * width, a blur mode, a spotlight shape and a layer added elsewhere all leave
 * the frame describing its members exactly, and dropping the box for them cost
 * a widen and a narrow their cancellation for no reason. A delete, a font size
 * (which rewrites a glyph's width and height), the crop, a text re-edit and an
 * undo across any of those change a bbox, and the next resize should start
 * from a fresh union.
 *
 * Per member, not the union: two members can trade places under a union that
 * did not move, and one pass costs the same either way.
 *
 * An edit that changes a member INSIDE its own bbox — one pen point moved,
 * say — keeps the frame, and that is the intended reading. The frame is not a
 * bounding box of the members: it is the box they are scaled in, and
 * scaleInBox maps a member relative to it whatever shape the member has.
 */
export function keepBoxThroughEdit(
  prev: CarriedBox | null,
  prevAnns: Annotation[],
  nextAnns: Annotation[],
): CarriedBox | null {
  if (!prev) return null;
  for (const id of prev.ids) {
    const before = prevAnns.find((a) => a.id === id);
    const after = nextAnns.find((a) => a.id === id);
    // A member the edit removed cannot be checked, and cannot be resized either.
    if (!before || !after) return null;
    const b = bbox(before);
    const a = bbox(after);
    if (b.x !== a.x || b.y !== a.y || b.w !== a.w || b.h !== a.h) return null;
  }
  return prev;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(Math.max(v, lo), hi);
}

/** Move a crop rect by a keyboard delta, held inside the image. */
export function moveCropBy(r: Rect, dx: number, dy: number, imgW: number, imgH: number): Rect {
  const n = normalizeRect(r);
  return {
    x: clamp(n.x + dx, 0, Math.max(0, imgW - n.w)),
    y: clamp(n.y + dy, 0, Math.max(0, imgH - n.h)),
    w: n.w,
    h: n.h,
  };
}

/** Resize a crop rect from its bottom-right corner, held inside the image. */
export function resizeCropBy(r: Rect, dx: number, dy: number, imgW: number, imgH: number): Rect {
  const n = normalizeRect(r);
  return {
    x: n.x,
    y: n.y,
    w: clamp(n.w + dx, 1, Math.max(1, imgW - n.x)),
    h: clamp(n.h + dy, 1, Math.max(1, imgH - n.y)),
  };
}

/**
 * Where a keyboard placement lands: a square of `size` image pixels centred on
 * `c`, pushed back inside the image so a placement near an edge stays whole.
 */
export function placementRect(c: Point, size: number, imgW: number, imgH: number): Rect {
  const w = Math.min(size, imgW);
  const h = Math.min(size, imgH);
  return {
    x: Math.round(clamp(c.x - w / 2, 0, imgW - w)),
    y: Math.round(clamp(c.y - h / 2, 0, imgH - h)),
    w: Math.round(w),
    h: Math.round(h),
  };
}

/** The human name for an annotation type — the same word the toolbar uses. */
export function annotationLabel(type: AnnotationType): string {
  return TOOL_LIST.find((t) => t.id === type)?.label ?? 'Annotation';
}

/** Everything the live region has something to say about. */
export type Mutation =
  | { kind: 'select'; annotation: Annotation; index: number; total: number }
  | { kind: 'select-many'; count: number; total: number }
  | { kind: 'deselect' }
  | { kind: 'add'; annotation: Annotation }
  | { kind: 'move'; annotation: Annotation }
  | { kind: 'move-many'; count: number }
  | { kind: 'resize'; annotation: Annotation }
  | { kind: 'resize-many'; count: number }
  | { kind: 'delete'; type: AnnotationType; remaining: number }
  | { kind: 'delete-many'; count: number; remaining: number }
  | { kind: 'duplicate'; count: number }
  /**
   * `imageHeight` is carried only when the step crossed a cut, so a step that
   * put a strip back says so instead of naming the layer count alone.
   */
  | { kind: 'undo'; total: number; imageHeight?: number }
  | { kind: 'redo'; total: number; imageHeight?: number }
  | { kind: 'crop'; rect: Rect }
  | { kind: 'crop-applied'; w: number; h: number }
  | { kind: 'crop-cancelled' }
  | { kind: 'cut'; band: Band }
  | { kind: 'cut-applied'; band: Band; imageHeight: number }
  | { kind: 'cut-removed'; band: Band; imageHeight: number }
  | { kind: 'cut-cancelled' }
  | { kind: 'cut-refused' }
  | { kind: 'cut-none' };

function count(n: number): string {
  return `${n} annotation${n === 1 ? '' : 's'}`;
}

/** The new picture height, for a timeline step that crossed a cut. */
function cutSize(imageHeight: number | undefined): string {
  return imageHeight === undefined ? '' : ` Image ${Math.round(imageHeight)} pixels tall.`;
}

/** What the live region says for one mutation. */
export function announce(m: Mutation): string {
  switch (m.kind) {
    case 'select': {
      const label = annotationLabel(m.annotation.type);
      return `${label} selected, layer ${m.index} of ${m.total}.`;
    }
    case 'select-many':
      return `${m.count} of ${count(m.total)} selected.`;
    case 'deselect':
      return 'Selection cleared.';
    case 'add': {
      const b = bbox(m.annotation);
      return `${annotationLabel(m.annotation.type)} added at ${Math.round(b.x)}, ${Math.round(b.y)}.`;
    }
    case 'move': {
      const b = bbox(m.annotation);
      return `${annotationLabel(m.annotation.type)} moved to ${Math.round(b.x)}, ${Math.round(b.y)}.`;
    }
    case 'move-many':
      return `${count(m.count)} moved.`;
    case 'resize': {
      const b = bbox(m.annotation);
      const label = annotationLabel(m.annotation.type);
      return `${label} resized to ${Math.round(b.w)} by ${Math.round(b.h)} pixels.`;
    }
    case 'resize-many':
      return `${count(m.count)} resized.`;
    case 'delete': {
      const left = m.remaining === 0 ? 'no annotations' : count(m.remaining);
      return `${annotationLabel(m.type)} deleted, ${left} left.`;
    }
    case 'delete-many': {
      const left = m.remaining === 0 ? 'no annotations' : count(m.remaining);
      return `${count(m.count)} deleted, ${left} left.`;
    }
    case 'duplicate':
      return `${count(m.count)} duplicated.`;
    case 'undo':
      return `Undo.${cutSize(m.imageHeight)} ${count(m.total)}.`;
    case 'redo':
      return `Redo.${cutSize(m.imageHeight)} ${count(m.total)}.`;
    case 'crop': {
      const n = normalizeRect(m.rect);
      const size = `${Math.round(n.w)} by ${Math.round(n.h)} pixels`;
      return `Crop ${size} at ${Math.round(n.x)}, ${Math.round(n.y)}.`;
    }
    case 'crop-applied':
      return `Cropped to ${m.w} by ${m.h} pixels.`;
    case 'crop-cancelled':
      return 'Crop cancelled.';
    case 'cut':
      return `Cut band ${Math.round(m.band.h)} pixels tall at ${Math.round(m.band.y)}.`;
    case 'cut-applied':
      return `Cut ${Math.round(m.band.h)} pixels. Image ${Math.round(m.imageHeight)} pixels tall.`;
    case 'cut-removed':
      return `Put back ${Math.round(m.band.h)} pixels. Image ${Math.round(m.imageHeight)} pixels tall.`;
    case 'cut-cancelled':
      return 'Cut cancelled.';
    case 'cut-refused':
      return 'A cut cannot take the whole picture.';
    case 'cut-none':
      return 'Those rows are cut already.';
  }
}
