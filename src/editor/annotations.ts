/**
 * Annotation model + rendering for the editor.
 *
 * All annotation coordinates are in IMAGE pixels (the native resolution of the
 * captured screenshot), never screen pixels. The CanvasController applies the
 * zoom/pan transform before calling {@link drawAnnotation}, so the draw helpers
 * work in image space — which also makes export trivial (render at 1:1, no
 * transform). Coordinates may be signed during drafting (dragging up-left makes
 * w/h negative); {@link normalizeRect} fixes that for drawing and hit-testing.
 */

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Point {
  x: number;
  y: number;
}

interface BaseAnnotation {
  id: string;
}

export interface RectAnnotation extends BaseAnnotation {
  type: 'rect';
  x: number;
  y: number;
  w: number;
  h: number;
  stroke: string;
  strokeWidth: number;
  fill: string | null;
}

export interface ArrowAnnotation extends BaseAnnotation {
  type: 'arrow';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  stroke: string;
  strokeWidth: number;
}

export interface LineAnnotation extends BaseAnnotation {
  type: 'line';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  stroke: string;
  strokeWidth: number;
}

export interface PenAnnotation extends BaseAnnotation {
  type: 'pen';
  points: Point[];
  stroke: string;
  strokeWidth: number;
}

export interface TextAnnotation extends BaseAnnotation {
  type: 'text';
  x: number;
  y: number;
  text: string;
  fontSize: number;
  color: string;
  /** Measured pixel size, set when the text is committed (for hit-testing/bbox). */
  width: number;
  height: number;
}

export interface BlurAnnotation extends BaseAnnotation {
  type: 'blur';
  x: number;
  y: number;
  w: number;
  h: number;
  strength: number;
}

export interface HighlightAnnotation extends BaseAnnotation {
  type: 'highlight';
  points: Point[];
  stroke: string;
  strokeWidth: number;
}

export interface StepAnnotation extends BaseAnnotation {
  type: 'step';
  x: number;
  y: number;
  r: number;
  n: number;
  color: string;
}

export type Annotation =
  | RectAnnotation
  | ArrowAnnotation
  | LineAnnotation
  | PenAnnotation
  | TextAnnotation
  | BlurAnnotation
  | HighlightAnnotation
  | StepAnnotation;

export type AnnotationType = Annotation['type'];

/** The annotations that carry `stroke` + `strokeWidth` (the style bar's shape group). */
export type StrokedAnnotation =
  RectAnnotation | ArrowAnnotation | LineAnnotation | PenAnnotation | HighlightAnnotation;

/** Text and step badges carry a `color` instead, and blur carries no style at all. */
export function hasStroke(a: Annotation): a is StrokedAnnotation {
  return (
    a.type === 'rect' ||
    a.type === 'arrow' ||
    a.type === 'line' ||
    a.type === 'pen' ||
    a.type === 'highlight'
  );
}

/** Default annotation styling (a vivid red reads well on most pages). */
export const DEFAULT_STROKE = '#ff3b30';
export const DEFAULT_STROKE_WIDTH = 6;
export const DEFAULT_FONT_SIZE = 28;
export const DEFAULT_BLUR_STRENGTH = 8;

/** Editable annotation style (the style bar's current value). */
export interface AnnotationStyle {
  color: string;
  strokeWidth: number;
  fontSize: number;
}

export const DEFAULT_STYLE: AnnotationStyle = {
  color: DEFAULT_STROKE,
  strokeWidth: DEFAULT_STROKE_WIDTH,
  fontSize: DEFAULT_FONT_SIZE,
};

/** Swatches for the style bar. */
export const COLOR_PALETTE: string[] = [
  '#ff3b30',
  '#ff9500',
  '#ffcc00',
  '#34c759',
  '#0071e3',
  '#af52de',
  '#ffffff',
  '#1d1d1f',
];

/** Stroke-width presets for the style bar. */
export const STROKE_WIDTHS: number[] = [3, 6, 12];

const FONT_STACK = "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif";

/** Generate a unique annotation id. */
export function genId(): string {
  const c = globalThis.crypto as Crypto | undefined;
  if (c && typeof c.randomUUID === 'function') return c.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/** Flip a rect so w/h are non-negative (keeps the same on-screen area). */
export function normalizeRect(r: Rect): Rect {
  return {
    x: Math.min(r.x, r.x + r.w),
    y: Math.min(r.y, r.y + r.h),
    w: Math.abs(r.w),
    h: Math.abs(r.h),
  };
}

/** Axis-aligned bounding box of an annotation, in image pixels. */
export function bbox(a: Annotation): Rect {
  switch (a.type) {
    case 'rect':
    case 'blur':
      return normalizeRect(a);
    case 'arrow':
    case 'line':
      return {
        x: Math.min(a.x1, a.x2),
        y: Math.min(a.y1, a.y2),
        w: Math.abs(a.x2 - a.x1),
        h: Math.abs(a.y2 - a.y1),
      };
    case 'step':
      return { x: a.x - a.r, y: a.y - a.r, w: a.r * 2, h: a.r * 2 };
    case 'pen':
    case 'highlight': {
      if (a.points.length === 0) return { x: 0, y: 0, w: 0, h: 0 };
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      for (const p of a.points) {
        minX = Math.min(minX, p.x);
        minY = Math.min(minY, p.y);
        maxX = Math.max(maxX, p.x);
        maxY = Math.max(maxY, p.y);
      }
      return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
    }
    case 'text':
      return { x: a.x, y: a.y, w: a.width, h: a.height };
  }
}

/** Measure rendered text (single or multi-line) for hit-testing & selection bbox. */
export function measureText(
  ctx: CanvasRenderingContext2D,
  text: string,
  fontSize: number,
): { width: number; height: number } {
  ctx.font = `600 ${fontSize}px ${FONT_STACK}`;
  const lines = text.split('\n');
  const leading = fontSize * 1.25;
  let maxW = 0;
  for (const line of lines) maxW = Math.max(maxW, ctx.measureText(line).width);
  return { width: maxW, height: lines.length * leading };
}

let _measureCanvas: HTMLCanvasElement | null = null;
/** Measure text without a live canvas context (uses a throwaway offscreen canvas). */
export function measureTextSize(text: string, fontSize: number): { width: number; height: number } {
  if (!_measureCanvas) _measureCanvas = document.createElement('canvas');
  const ctx = _measureCanvas.getContext('2d');
  if (!ctx) {
    return {
      width: text.length * fontSize * 0.6,
      height: text.split('\n').length * fontSize * 1.25,
    };
  }
  return measureText(ctx, text, fontSize);
}

/** A cached pixelated tile for a blur annotation, rebuilt when its region changes. */
interface BlurCacheEntry {
  tile: HTMLCanvasElement;
  x: number;
  y: number;
  w: number;
  h: number;
  strength: number;
}
export type BlurCache = Map<string, BlurCacheEntry>;

/** Create an empty blur cache (one per controller). */
export function createBlurCache(): BlurCache {
  return new Map();
}

/**
 * Draw a single annotation in image space. `ctx` is expected to already carry the
 * zoom/pan transform; each call is wrapped in save/restore by the controller so
 * helpers may freely mutate fill/stroke/dash/smoothing state.
 */
export function drawAnnotation(
  ctx: CanvasRenderingContext2D,
  a: Annotation,
  image: HTMLImageElement | HTMLCanvasElement,
  blurCache: BlurCache,
): void {
  switch (a.type) {
    case 'rect':
      drawRect(ctx, a);
      break;
    case 'arrow':
      drawArrow(ctx, a);
      break;
    case 'line':
      drawShaft(ctx, a);
      break;
    case 'pen':
      drawPen(ctx, a);
      break;
    case 'text':
      drawText(ctx, a);
      break;
    case 'blur':
      drawBlur(ctx, a, image, blurCache);
      break;
    case 'highlight':
      drawHighlight(ctx, a);
      break;
    case 'step':
      drawStep(ctx, a);
      break;
  }
}

function drawRect(ctx: CanvasRenderingContext2D, a: RectAnnotation): void {
  const r = normalizeRect(a);
  if (r.w <= 0 || r.h <= 0) return;
  if (a.fill) {
    ctx.fillStyle = a.fill;
    ctx.fillRect(r.x, r.y, r.w, r.h);
  }
  ctx.lineWidth = a.strokeWidth;
  ctx.strokeStyle = a.stroke;
  ctx.strokeRect(r.x, r.y, r.w, r.h);
}

/** The shared body of an arrow and a line: one round-capped segment. */
function drawShaft(ctx: CanvasRenderingContext2D, a: ArrowAnnotation | LineAnnotation): void {
  ctx.lineWidth = a.strokeWidth;
  ctx.strokeStyle = a.stroke;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(a.x1, a.y1);
  ctx.lineTo(a.x2, a.y2);
  ctx.stroke();
}

function drawArrow(ctx: CanvasRenderingContext2D, a: ArrowAnnotation): void {
  const dx = a.x2 - a.x1;
  const dy = a.y2 - a.y1;
  drawShaft(ctx, a);
  ctx.fillStyle = a.stroke;
  const len = Math.hypot(dx, dy);
  if (len < 1) return; // too short to draw a head
  const head = Math.max(10, a.strokeWidth * 3);
  const angle = Math.atan2(dy, dx);
  ctx.beginPath();
  ctx.moveTo(a.x2, a.y2);
  ctx.lineTo(
    a.x2 - head * Math.cos(angle - Math.PI / 6),
    a.y2 - head * Math.sin(angle - Math.PI / 6),
  );
  ctx.lineTo(
    a.x2 - head * Math.cos(angle + Math.PI / 6),
    a.y2 - head * Math.sin(angle + Math.PI / 6),
  );
  ctx.closePath();
  ctx.fill();
}

function drawPen(ctx: CanvasRenderingContext2D, a: PenAnnotation): void {
  if (a.points.length === 0) return;
  ctx.lineWidth = a.strokeWidth;
  ctx.strokeStyle = a.stroke;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(a.points[0].x, a.points[0].y);
  for (let i = 1; i < a.points.length; i++) {
    ctx.lineTo(a.points[i].x, a.points[i].y);
  }
  if (a.points.length === 1) {
    // dot
    ctx.stroke();
  } else {
    ctx.stroke();
  }
}

function drawHighlight(ctx: CanvasRenderingContext2D, a: HighlightAnnotation): void {
  if (a.points.length === 0) return;
  ctx.lineWidth = Math.max(14, a.strokeWidth * 3);
  ctx.strokeStyle = a.stroke;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  // Multiply keeps the underlying text readable, like a real marker.
  ctx.globalAlpha = 0.4;
  ctx.globalCompositeOperation = 'multiply';
  ctx.beginPath();
  ctx.moveTo(a.points[0].x, a.points[0].y);
  for (let i = 1; i < a.points.length; i++) {
    ctx.lineTo(a.points[i].x, a.points[i].y);
  }
  ctx.stroke();
  // Alpha/composite are restored by the controller's save/restore wrapper.
}

/** Dark text/ring on light badge colors (white, yellow), white otherwise. */
function badgeContrast(hex: string): string {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) return '#ffffff';
  const v = parseInt(m[1], 16);
  const lum = 0.299 * ((v >> 16) & 255) + 0.587 * ((v >> 8) & 255) + 0.114 * (v & 255);
  return lum > 200 ? '#1d1d1f' : '#ffffff';
}

function drawStep(ctx: CanvasRenderingContext2D, a: StepAnnotation): void {
  const contrast = badgeContrast(a.color);
  ctx.fillStyle = a.color;
  ctx.beginPath();
  ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = Math.max(2, a.r * 0.1);
  ctx.strokeStyle = contrast;
  ctx.stroke();
  ctx.fillStyle = contrast;
  const fontSize = a.n >= 10 ? a.r : a.r * 1.2;
  ctx.font = `700 ${fontSize}px ${FONT_STACK}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(String(a.n), a.x, a.y + a.r * 0.05);
}

function drawText(ctx: CanvasRenderingContext2D, a: TextAnnotation): void {
  if (!a.text) return;
  ctx.fillStyle = a.color;
  ctx.textBaseline = 'top';
  ctx.font = `600 ${a.fontSize}px ${FONT_STACK}`;
  const lines = a.text.split('\n');
  const leading = a.fontSize * 1.25;
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], a.x, a.y + i * leading);
  }
}

function drawBlur(
  ctx: CanvasRenderingContext2D,
  a: BlurAnnotation,
  image: HTMLImageElement | HTMLCanvasElement,
  blurCache: BlurCache,
): void {
  const r = normalizeRect(a);
  if (r.w <= 0 || r.h <= 0) return;
  const tile = getBlurTile(a.id, r, a.strength, image, blurCache);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(tile, r.x, r.y, r.w, r.h);
  // Smoothing is restored by the controller's save/restore wrapper.
}

function getBlurTile(
  id: string,
  r: Rect,
  strength: number,
  image: HTMLImageElement | HTMLCanvasElement,
  blurCache: BlurCache,
): HTMLCanvasElement {
  const entry = blurCache.get(id);
  if (
    entry &&
    entry.x === r.x &&
    entry.y === r.y &&
    entry.w === r.w &&
    entry.h === r.h &&
    entry.strength === strength
  ) {
    return entry.tile;
  }
  const tw = Math.max(1, Math.round(r.w / strength));
  const th = Math.max(1, Math.round(r.h / strength));
  const tile = document.createElement('canvas');
  tile.width = tw;
  tile.height = th;
  const tctx = tile.getContext('2d');
  if (tctx) tctx.drawImage(image, r.x, r.y, r.w, r.h, 0, 0, tw, th);
  blurCache.set(id, { tile, x: r.x, y: r.y, w: r.w, h: r.h, strength });
  return tile;
}

/** Remove cache entries for ids no longer present (call after annotation changes). */
export function pruneBlurCache(blurCache: BlurCache, ids: Set<string>): void {
  for (const key of blurCache.keys()) {
    if (!ids.has(key)) blurCache.delete(key);
  }
}

/** Return a copy of an annotation shifted by (dx, dy) in image pixels (immutable). */
export function translateAnnotation(a: Annotation, dx: number, dy: number): Annotation {
  switch (a.type) {
    case 'rect':
    case 'blur':
      return { ...a, x: a.x + dx, y: a.y + dy };
    case 'arrow':
    case 'line':
      return { ...a, x1: a.x1 + dx, y1: a.y1 + dy, x2: a.x2 + dx, y2: a.y2 + dy };
    case 'pen':
    case 'highlight':
      return { ...a, points: a.points.map((p) => ({ x: p.x + dx, y: p.y + dy })) };
    case 'text':
    case 'step':
      return { ...a, x: a.x + dx, y: a.y + dy };
  }
}

/**
 * Draw a crop preview: dim everything outside `r` and outline the kept region.
 * (Crop is a transient tool action, not a persistent annotation.)
 */
export function drawCropPreview(
  ctx: CanvasRenderingContext2D,
  r: Rect,
  imageWidth: number,
  imageHeight: number,
): void {
  const n = normalizeRect(r);
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fillRect(0, 0, imageWidth, n.y);
  ctx.fillRect(0, n.y + n.h, imageWidth, imageHeight - (n.y + n.h));
  ctx.fillRect(0, n.y, n.x, n.h);
  ctx.fillRect(n.x + n.w, n.y, imageWidth - (n.x + n.w), n.h);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 6]);
  ctx.strokeRect(n.x, n.y, n.w, n.h);
  ctx.setLineDash([]);
}

export type Handle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'start' | 'end';

export interface HandlePos {
  handle: Handle;
  x: number;
  y: number;
}

/** Handle positions (image space) for resizing a selected annotation. */
export function getHandles(a: Annotation): HandlePos[] {
  switch (a.type) {
    case 'rect':
    case 'blur':
    case 'pen':
    case 'highlight': {
      const { x, y, w, h } = bbox(a);
      return [
        { handle: 'nw', x, y },
        { handle: 'n', x: x + w / 2, y },
        { handle: 'ne', x: x + w, y },
        { handle: 'e', x: x + w, y: y + h / 2 },
        { handle: 'se', x: x + w, y: y + h },
        { handle: 's', x: x + w / 2, y: y + h },
        { handle: 'sw', x, y: y + h },
        { handle: 'w', x, y: y + h / 2 },
      ];
    }
    case 'arrow':
    case 'line':
      return [
        { handle: 'start', x: a.x1, y: a.y1 },
        { handle: 'end', x: a.x2, y: a.y2 },
      ];
    // Text and step badges scale uniformly, so only corners apply.
    case 'text':
    case 'step': {
      const { x, y, w, h } = bbox(a);
      return [
        { handle: 'nw', x, y },
        { handle: 'ne', x: x + w, y },
        { handle: 'se', x: x + w, y: y + h },
        { handle: 'sw', x, y: y + h },
      ];
    }
  }
}

/** Hit-test handles in screen space; returns the handle under (sx,sy) or null. */
export function handleAt(
  a: Annotation,
  project: (x: number, y: number) => { x: number; y: number },
  sx: number,
  sy: number,
  tol = 7,
): Handle | null {
  for (const h of getHandles(a)) {
    const p = project(h.x, h.y);
    if (Math.abs(p.x - sx) <= tol && Math.abs(p.y - sy) <= tol) return h.handle;
  }
  return null;
}

/** Resize a rect (for rect/blur) given a handle and image-space delta from drag start. */
export function resizeRect(start: Rect, handle: Handle, dx: number, dy: number): Rect {
  let { x, y, w, h } = start;
  if (handle === 'e' || handle === 'ne' || handle === 'se') w += dx;
  if (handle === 'w' || handle === 'nw' || handle === 'sw') {
    x += dx;
    w -= dx;
  }
  if (handle === 's' || handle === 'se' || handle === 'sw') h += dy;
  if (handle === 'n' || handle === 'ne' || handle === 'nw') {
    y += dy;
    h -= dy;
  }
  return normalizeRect({ x, y, w, h });
}

const MIN_FONT_SIZE = 8;
const MIN_STEP_RADIUS = 6;

/** The corner of `r` that stays fixed while `handle` is dragged. */
function scaleAnchor(r: Rect, handle: Handle): Point {
  const left = handle === 'ne' || handle === 'e' || handle === 'se';
  const top = handle === 'sw' || handle === 's' || handle === 'se';
  return { x: left ? r.x : r.x + r.w, y: top ? r.y : r.y + r.h };
}

/**
 * Scale an annotation from a handle drag, always derived from its state at drag
 * start (`a` + `startBBox`) so repeated calls during one drag never compound.
 * Pen and highlight strokes scale freely per axis; text and step badges scale
 * uniformly (fontSize / radius) around the fixed corner, with a size floor.
 * Rect, blur, arrow and line resize through their own paths and pass through.
 */
export function scaleAnnotation(
  a: Annotation,
  startBBox: Rect,
  handle: Handle,
  dx: number,
  dy: number,
): Annotation {
  const target = resizeRect(startBBox, handle, dx, dy);
  const kx = startBBox.w > 0 ? target.w / startBBox.w : 1;
  const ky = startBBox.h > 0 ? target.h / startBBox.h : 1;
  switch (a.type) {
    case 'pen':
    case 'highlight':
      return {
        ...a,
        points: a.points.map((p) => ({
          x: target.x + (p.x - startBBox.x) * kx,
          y: target.y + (p.y - startBBox.y) * ky,
        })),
      };
    case 'text': {
      const k = Math.max(kx, ky, MIN_FONT_SIZE / a.fontSize);
      const anchor = scaleAnchor(startBBox, handle);
      return {
        ...a,
        x: anchor.x + (a.x - anchor.x) * k,
        y: anchor.y + (a.y - anchor.y) * k,
        fontSize: a.fontSize * k,
        // Text metrics are linear in fontSize, so the measured box scales with it.
        width: a.width * k,
        height: a.height * k,
      };
    }
    case 'step': {
      const k = Math.max(kx, ky, MIN_STEP_RADIUS / a.r);
      const anchor = scaleAnchor(startBBox, handle);
      return {
        ...a,
        x: anchor.x + (a.x - anchor.x) * k,
        y: anchor.y + (a.y - anchor.y) * k,
        r: a.r * k,
      };
    }
    default:
      return a;
  }
}

/** Draw the selection bbox + resize handles in screen space via project (toScreen). */
export function drawSelection(
  ctx: CanvasRenderingContext2D,
  a: Annotation,
  project: (x: number, y: number) => { x: number; y: number },
): void {
  const b = bbox(a);
  const tl = project(b.x, b.y);
  const br = project(b.x + b.w, b.y + b.h);
  ctx.save();
  ctx.setLineDash([4, 3]);
  ctx.strokeStyle = '#2f80ed';
  ctx.lineWidth = 1;
  ctx.strokeRect(tl.x, tl.y, br.x - tl.x, br.y - tl.y);
  ctx.setLineDash([]);
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#2f80ed';
  ctx.lineWidth = 1.5;
  for (const h of getHandles(a)) {
    const p = project(h.x, h.y);
    ctx.fillRect(p.x - 4, p.y - 4, 8, 8);
    ctx.strokeRect(p.x - 4, p.y - 4, 8, 8);
  }
  ctx.restore();
}
