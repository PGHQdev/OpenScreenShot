/**
 * Tool metadata + shape-drafting helpers for the editor.
 *
 * The hook (useEditor) drives interactions; this module holds the pure pieces:
 * the tool list for the toolbar and the create/extend/commit logic for
 * drag-to-draw shape tools. Pen, rect, arrow and blur are "shape" tools that
 * draft then commit; text and crop are special-cased in the hook.
 */
import {
  DEFAULT_BLUR_STRENGTH,
  genId,
  type Annotation,
  type BlurMode,
  type Point,
  type SpotlightShape,
  type StepAnnotation,
  type TextAnnotation,
} from './annotations';

export type Tool =
  | 'select'
  | 'rect'
  | 'arrow'
  | 'line'
  | 'pen'
  | 'highlight'
  | 'text'
  | 'step'
  | 'blur'
  | 'spotlight'
  | 'eyedropper'
  | 'crop';

export type ShapeTool = 'rect' | 'arrow' | 'line' | 'pen' | 'highlight' | 'blur' | 'spotlight';

export interface ToolDef {
  id: Tool;
  label: string;
  shortcut: string;
}

export const TOOL_LIST: ToolDef[] = [
  { id: 'select', label: 'Select', shortcut: 'V' },
  { id: 'rect', label: 'Rectangle', shortcut: 'R' },
  { id: 'arrow', label: 'Arrow', shortcut: 'A' },
  { id: 'line', label: 'Line', shortcut: 'L' },
  { id: 'pen', label: 'Pen', shortcut: 'P' },
  { id: 'highlight', label: 'Highlighter', shortcut: 'H' },
  { id: 'text', label: 'Text', shortcut: 'T' },
  { id: 'step', label: 'Step number', shortcut: 'S' },
  { id: 'blur', label: 'Blur', shortcut: 'B' },
  { id: 'spotlight', label: 'Spotlight', shortcut: 'O' },
  { id: 'eyedropper', label: 'Eyedropper', shortcut: 'I' },
  { id: 'crop', label: 'Crop', shortcut: 'C' },
];

/** Per-tool options for {@link createShapeDraft} beyond the shared stroke style. */
export interface ShapeDraftOptions {
  spotlightShape?: SpotlightShape;
  blurMode?: BlurMode;
}

/** Create a fresh draft annotation for a shape tool at point `p`. */
export function createShapeDraft(
  tool: ShapeTool,
  p: Point,
  stroke: string,
  strokeWidth: number,
  opts: ShapeDraftOptions = {},
): Annotation {
  const id = genId();
  switch (tool) {
    case 'rect':
      return {
        id,
        type: 'rect',
        x: p.x,
        y: p.y,
        w: 0,
        h: 0,
        stroke,
        strokeWidth,
        fill: null,
      };
    case 'arrow':
    case 'line':
      return {
        id,
        type: tool,
        x1: p.x,
        y1: p.y,
        x2: p.x,
        y2: p.y,
        stroke,
        strokeWidth,
      };
    case 'pen':
      return {
        id,
        type: 'pen',
        points: [p],
        stroke,
        strokeWidth,
      };
    case 'highlight':
      return {
        id,
        type: 'highlight',
        points: [p],
        stroke,
        strokeWidth,
      };
    case 'blur':
      return {
        id,
        type: 'blur',
        x: p.x,
        y: p.y,
        w: 0,
        h: 0,
        strength: DEFAULT_BLUR_STRENGTH,
        mode: opts.blurMode ?? 'blur',
      };
    case 'spotlight':
      return {
        id,
        type: 'spotlight',
        x: p.x,
        y: p.y,
        w: 0,
        h: 0,
        shape: opts.spotlightShape ?? 'rect',
      };
  }
}

/**
 * Grow a drag delta into a square, keeping the direction of each axis. A drag
 * along one axis alone still makes a square, so the shape never collapses.
 */
export function squareDelta(dx: number, dy: number): { dx: number; dy: number } {
  const side = Math.max(Math.abs(dx), Math.abs(dy));
  return { dx: dx < 0 ? -side : side, dy: dy < 0 ? -side : side };
}

/** Move the end point onto the nearest 45° ray from the start, at the same distance. */
export function snapTo45(x1: number, y1: number, x2: number, y2: number): Point {
  const len = Math.hypot(x2 - x1, y2 - y1);
  if (len === 0) return { x: x2, y: y2 };
  const step = Math.PI / 4;
  const angle = Math.round(Math.atan2(y2 - y1, x2 - x1) / step) * step;
  return { x: x1 + Math.cos(angle) * len, y: y1 + Math.sin(angle) * len };
}

/**
 * Mutate `draft` in place to follow point `p` (the controller re-renders after).
 * With `shift` held, rectangles stay square and arrows and lines snap to 45°.
 * The freehand tools follow the pointer either way.
 */
export function extendDraft(draft: Annotation, p: Point, shift = false): void {
  switch (draft.type) {
    case 'rect':
    case 'blur':
    case 'spotlight': {
      const dx = p.x - draft.x;
      const dy = p.y - draft.y;
      const d = shift ? squareDelta(dx, dy) : { dx, dy };
      draft.w = d.dx;
      draft.h = d.dy;
      break;
    }
    case 'arrow':
    case 'line': {
      const end = shift ? snapTo45(draft.x1, draft.y1, p.x, p.y) : p;
      draft.x2 = end.x;
      draft.y2 = end.y;
      break;
    }
    case 'pen':
    case 'highlight':
      draft.points.push(p);
      break;
    case 'text':
    case 'step':
      break;
  }
}

/** Whether a drafted annotation is large enough to keep on mouse-up. */
export function shouldCommit(draft: Annotation): boolean {
  switch (draft.type) {
    case 'rect':
    case 'blur':
    case 'spotlight':
      return Math.abs(draft.w) > 2 && Math.abs(draft.h) > 2;
    case 'arrow':
    case 'line':
      return Math.hypot(draft.x2 - draft.x1, draft.y2 - draft.y1) > 3;
    case 'pen':
    case 'highlight':
      return draft.points.length >= 2;
    case 'text':
      return false;
    case 'step':
      return true;
  }
}

/** Create an empty text annotation placed at `p` (edited via the overlay). */
export function createTextAnnotation(p: Point, color: string, fontSize: number): TextAnnotation {
  return {
    id: genId(),
    type: 'text',
    x: p.x,
    y: p.y,
    text: '',
    fontSize,
    color,
    width: 0,
    height: 0,
  };
}

/** Create a numbered step badge at `p`. Radius scales with the font-size preset. */
export function createStepAnnotation(
  p: Point,
  color: string,
  n: number,
  fontSize: number,
): StepAnnotation {
  return {
    id: genId(),
    type: 'step',
    x: p.x,
    y: p.y,
    r: Math.max(12, fontSize * 0.8),
    n,
    color,
  };
}

/** Renumber step badges in list order (call after deletes so numbering stays dense). */
export function renumberSteps(anns: Annotation[]): Annotation[] {
  let n = 0;
  return anns.map((a) => (a.type === 'step' ? { ...a, n: ++n } : a));
}

/** Distance between two points. */
export function dist(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
