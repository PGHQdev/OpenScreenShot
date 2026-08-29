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
export type CanvasMode = 'crop' | 'selection' | 'idle';

export type CanvasIntent =
  | { kind: 'cycle'; dir: 1 | -1; extend: boolean }
  | { kind: 'place' }
  | { kind: 'apply-crop' }
  | { kind: 'move'; dx: number; dy: number }
  | { kind: 'resize'; dx: number; dy: number }
  | { kind: 'crop-move'; dx: number; dy: number }
  | { kind: 'crop-resize'; dx: number; dy: number };

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
  if (e.key === 'Enter') return mode === 'crop' ? { kind: 'apply-crop' } : { kind: 'place' };
  const dir = ARROWS[e.key];
  if (!dir) return null;
  const step = e.shiftKey ? STEP_COARSE : STEP_FINE;
  const dx = dir.x * step;
  const dy = dir.y * step;
  if (mode === 'crop') {
    return e.altKey ? { kind: 'crop-resize', dx, dy } : { kind: 'crop-move', dx, dy };
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
  | { kind: 'undo'; total: number }
  | { kind: 'redo'; total: number }
  | { kind: 'crop'; rect: Rect }
  | { kind: 'crop-applied'; w: number; h: number }
  | { kind: 'crop-cancelled' };

function count(n: number): string {
  return `${n} annotation${n === 1 ? '' : 's'}`;
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
      return `Undo. ${count(m.total)}.`;
    case 'redo':
      return `Redo. ${count(m.total)}.`;
    case 'crop': {
      const n = normalizeRect(m.rect);
      const size = `${Math.round(n.w)} by ${Math.round(n.h)} pixels`;
      return `Crop ${size} at ${Math.round(n.x)}, ${Math.round(n.y)}.`;
    }
    case 'crop-applied':
      return `Cropped to ${m.w} by ${m.h} pixels.`;
    case 'crop-cancelled':
      return 'Crop cancelled.';
  }
}
