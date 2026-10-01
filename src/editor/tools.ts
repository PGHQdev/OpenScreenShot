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
  translateAnnotation,
  type Annotation,
  type BlurMode,
  type Point,
  type SpotlightShape,
  type StepAnnotation,
  type TextAnnotation,
} from './annotations';
import type { BoxShape } from '../shared/types';
import { t } from './i18n';

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
  | 'crop'
  | 'cut';

export type ShapeTool = 'rect' | 'arrow' | 'line' | 'pen' | 'highlight' | 'blur' | 'spotlight';

export interface ToolDef {
  id: Tool;
  label: string;
  shortcut: string;
}

export const TOOL_LIST: ToolDef[] = [
  { id: 'select', label: t('editorToolSelect'), shortcut: 'V' },
  { id: 'rect', label: t('editorToolShape'), shortcut: 'R' },
  { id: 'arrow', label: t('editorToolArrow'), shortcut: 'A' },
  { id: 'line', label: t('editorToolLine'), shortcut: 'L' },
  { id: 'pen', label: t('editorToolPen'), shortcut: 'P' },
  { id: 'highlight', label: t('editorToolHighlighter'), shortcut: 'H' },
  { id: 'text', label: t('editorToolText'), shortcut: 'T' },
  { id: 'step', label: t('editorToolStep'), shortcut: 'S' },
  { id: 'blur', label: t('editorToolBlur'), shortcut: 'B' },
  { id: 'spotlight', label: t('editorToolSpotlight'), shortcut: 'O' },
  { id: 'eyedropper', label: t('editorToolEyedropper'), shortcut: 'I' },
  { id: 'crop', label: t('editorToolCrop'), shortcut: 'C' },
  { id: 'cut', label: t('editorToolCut'), shortcut: 'X' },
];

/**
 * The tool rail's default: Select, the four most-used drawing tools, and
 * the two redaction tools. Everything else stays reachable behind the rail's
 * More button ({@link overflowTools}) and through its shortcut letter. The
 * user can reorder the rail; that order lives in settings (`toolRail`).
 */
export const PRIMARY_TOOLS: readonly Tool[] = [
  'select',
  'arrow',
  'rect',
  'text',
  'pen',
  'blur',
  'crop',
];

/** The tools not on `rail`, in TOOL_LIST order — the More button's menu. */
export function overflowTools(rail: readonly Tool[]): Tool[] {
  return TOOL_LIST.map((t) => t.id).filter((id) => !rail.includes(id));
}

/** Whether `rail` is the default order, which is the only one drawn with dividers. */
export function isDefaultRail(rail: readonly Tool[]): boolean {
  return rail.length === PRIMARY_TOOLS.length && rail.every((id, i) => id === PRIMARY_TOOLS[i]);
}

/**
 * A stored rail order made safe to render: known tools only, each once. An
 * empty or unreadable value gives the default, so the rail is never blank.
 */
export function normalizeToolRail(value: unknown): Tool[] {
  if (!Array.isArray(value)) return [...PRIMARY_TOOLS];
  const known = new Set<string>(TOOL_LIST.map((t) => t.id));
  const rail: Tool[] = [];
  for (const id of value) {
    if (typeof id === 'string' && known.has(id) && !rail.includes(id as Tool))
      rail.push(id as Tool);
  }
  return rail.length > 0 ? rail : [...PRIMARY_TOOLS];
}

/**
 * Put `tool` at `index` on the rail: a move when it is already there, an add
 * when it comes from the More menu. `index` counts slots in the rail before
 * the move, so dropping a tool on its own slot leaves the order as it was.
 */
export function placeOnRail(rail: readonly Tool[], tool: Tool, index: number): Tool[] {
  const from = rail.indexOf(tool);
  const next = rail.filter((id) => id !== tool);
  const at = from !== -1 && from < index ? index - 1 : index;
  next.splice(Math.max(0, Math.min(at, next.length)), 0, tool);
  return next;
}

/** Send `tool` to the More menu. The last tool on the rail stays. */
export function removeFromRail(rail: readonly Tool[], tool: Tool): Tool[] {
  if (rail.length <= 1) return [...rail];
  return rail.filter((id) => id !== tool);
}

/**
 * Tool rail dividers: rendered after the tool whose id is a member, splitting
 * the primary column into Select / the drawing tools / the redaction tools.
 * The More button sits after the last divider's group.
 */
export const TOOL_DIVIDER_AFTER: ReadonlySet<Tool> = new Set(['select', 'pen']);

/** Per-tool options for {@link createShapeDraft} beyond the shared stroke style. */
export interface ShapeDraftOptions {
  rectFill?: boolean;
  boxShape?: BoxShape;
  spotlightShape?: SpotlightShape;
  blurMode?: BlurMode;
  blurStrength?: number;
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
        ...(opts.rectFill ? { filled: true } : {}),
        ...(opts.boxShape && opts.boxShape !== 'rect' ? { shape: opts.boxShape } : {}),
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
        strength: opts.blurStrength ?? DEFAULT_BLUR_STRENGTH,
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

/**
 * How far a duplicate lands from its original, in image pixels. Big enough
 * that the copy reads as a second object at a fit-to-window zoom rather than
 * as a thickened edge on the first one.
 */
export const DUPLICATE_OFFSET = 16;

/**
 * Copies of `ids`, each a new annotation offset down and right. Layer order is
 * kept: the copies come back in the order their originals sit in `anns`, so a
 * duplicated pair stacks the way the pair it came from does. Step badges are
 * renumbered by the caller, once the copies are appended to the document.
 */
export function duplicateAnnotations(
  anns: Annotation[],
  ids: string[],
  offset = DUPLICATE_OFFSET,
): Annotation[] {
  return anns
    .filter((a) => ids.includes(a.id))
    .map((a) => ({ ...translateAnnotation(a, offset, offset), id: genId() }));
}

/** Distance between two points. */
export function dist(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
