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
import { tokens } from '../shared/design-tokens';

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

/**
 * How a blur region redacts: soft pixelation, coarse mosaic blocks, or an
 * opaque fill. Mosaic and solid survive recompression of the exported image.
 */
export type BlurMode = 'blur' | 'mosaic' | 'solid';

export interface BlurAnnotation extends BaseAnnotation {
  type: 'blur';
  x: number;
  y: number;
  w: number;
  h: number;
  strength: number;
  /** Absent on annotations from before v0.6.0, meaning 'blur'. */
  mode?: BlurMode;
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

export type SpotlightShape = 'rect' | 'rounded' | 'ellipse';

/**
 * Dims the whole image and cuts this region out. All spotlights render as one
 * shared dim layer (see {@link drawSpotlightLayer}), so drawAnnotation skips
 * the type and overlapping cut-outs merge.
 */
export interface SpotlightAnnotation extends BaseAnnotation {
  type: 'spotlight';
  x: number;
  y: number;
  w: number;
  h: number;
  shape: SpotlightShape;
}

export type Annotation =
  | RectAnnotation
  | ArrowAnnotation
  | LineAnnotation
  | PenAnnotation
  | TextAnnotation
  | BlurAnnotation
  | HighlightAnnotation
  | StepAnnotation
  | SpotlightAnnotation;

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
export const DEFAULT_STROKE = tokens.swatchRed;
export const DEFAULT_STROKE_WIDTH = 6;
export const DEFAULT_FONT_SIZE = 28;
export const DEFAULT_BLUR_STRENGTH = 8;
/**
 * The blur strength slider's range. Below 2 the tile downsamples to the same
 * size as the region (see `getBlurTile`), which draws it back unblurred and
 * defeats the redaction; above 32 the tile has already hit its 1px floor for
 * every region this tool is drawn over, so a higher ceiling buys no more
 * control. Whole steps only — the tile math rounds to the pixel anyway.
 */
export const BLUR_STRENGTH_MIN = 2;
export const BLUR_STRENGTH_MAX = 32;
export const BLUR_STRENGTH_STEP = 1;

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
    case 'spotlight':
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

/**
 * Ids of every annotation whose bounding box meets `r` — what a marquee drag
 * catches. Touching counts: a marquee dragged along an edge selects what it
 * grazes, the same as the 6px slack the click hit-test already allows.
 */
export function annotationsInRect(anns: Annotation[], r: Rect): string[] {
  const n = normalizeRect(r);
  return anns
    .filter((a) => {
      const b = bbox(a);
      return b.x <= n.x + n.w && b.x + b.w >= n.x && b.y <= n.y + n.h && b.y + b.h >= n.y;
    })
    .map((a) => a.id);
}

/**
 * The box around several annotations — what a multi-selection is resized by,
 * and where its handles sit. An empty list has no box, so it reads as a point
 * at the origin, which no caller draws (canvas.ts only asks once it has two).
 */
export function unionBBox(anns: Annotation[]): Rect {
  if (anns.length === 0) return { x: 0, y: 0, w: 0, h: 0 };
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const a of anns) {
    const b = bbox(a);
    x0 = Math.min(x0, b.x);
    y0 = Math.min(y0, b.y);
    x1 = Math.max(x1, b.x + b.w);
    y1 = Math.max(y1, b.y + b.h);
  }
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
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
  /** The downsample factor the tile was built with (strength × mode multiplier). */
  factor: number;
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
    case 'spotlight':
      // Rendered as one shared dim layer by drawSpotlightLayer, under the
      // other annotations — nothing to draw per annotation.
      break;
  }
}

function drawRect(ctx: CanvasRenderingContext2D, a: RectAnnotation): void {
  const r = normalizeRect(a);
  if (r.w <= 0 || r.h <= 0) return;
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
  if (!m) return tokens.canvasMark;
  const v = parseInt(m[1], 16);
  const lum = 0.299 * ((v >> 16) & 255) + 0.587 * ((v >> 8) & 255) + 0.114 * (v & 255);
  return lum > 200 ? tokens.canvasMarkInk : tokens.canvasMark;
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

/** Fill for solid redaction — opaque, so no pixel data survives. */
const SOLID_REDACTION_FILL = tokens.canvasRedact;

/** Mosaic blocks are this much coarser than the soft blur's pixelation. */
const MOSAIC_FACTOR = 4;

function drawBlur(
  ctx: CanvasRenderingContext2D,
  a: BlurAnnotation,
  image: HTMLImageElement | HTMLCanvasElement,
  blurCache: BlurCache,
): void {
  const r = normalizeRect(a);
  if (r.w <= 0 || r.h <= 0) return;
  const mode = a.mode ?? 'blur';
  if (mode === 'solid') {
    ctx.fillStyle = SOLID_REDACTION_FILL;
    ctx.fillRect(r.x, r.y, r.w, r.h);
    return;
  }
  const factor = mode === 'mosaic' ? a.strength * MOSAIC_FACTOR : a.strength;
  const tile = getBlurTile(a.id, r, factor, image, blurCache);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(tile, r.x, r.y, r.w, r.h);
  // Smoothing is restored by the controller's save/restore wrapper.
}

function getBlurTile(
  id: string,
  r: Rect,
  factor: number,
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
    entry.factor === factor
  ) {
    return entry.tile;
  }
  const tw = Math.max(1, Math.round(r.w / factor));
  const th = Math.max(1, Math.round(r.h / factor));
  const tile = document.createElement('canvas');
  tile.width = tw;
  tile.height = th;
  const tctx = tile.getContext('2d');
  if (tctx) tctx.drawImage(image, r.x, r.y, r.w, r.h, 0, 0, tw, th);
  blurCache.set(id, { tile, x: r.x, y: r.y, w: r.w, h: r.h, factor });
  return tile;
}

/** How much the spotlight layer darkens everything outside the cut-outs. */
export const SPOTLIGHT_DIM = 0.55;

/**
 * The dim layer is an image-sized canvas, so it is rebuilt only when the
 * spotlight list or the image size changes (pan/zoom redraws reuse it).
 */
export interface SpotlightLayerCache {
  canvas: HTMLCanvasElement | null;
  sig: string;
}

export function createSpotlightLayerCache(): SpotlightLayerCache {
  return { canvas: null, sig: '' };
}

/** Trace one spotlight's cut-out path (caller begins the path and fills). */
function traceSpotlight(ctx: CanvasRenderingContext2D, a: SpotlightAnnotation): void {
  const r = normalizeRect(a);
  if (r.w <= 0 || r.h <= 0) return;
  switch (a.shape) {
    case 'rect':
      ctx.rect(r.x, r.y, r.w, r.h);
      break;
    case 'rounded':
      ctx.roundRect(r.x, r.y, r.w, r.h, Math.min(24, r.w / 4, r.h / 4));
      break;
    case 'ellipse':
      ctx.ellipse(r.x + r.w / 2, r.y + r.h / 2, r.w / 2, r.h / 2, 0, 0, Math.PI * 2);
      break;
  }
}

/**
 * Draw the shared spotlight dim layer in image space. The layer starts as a
 * full-image dim fill; each cut-out is erased with destination-out, so
 * overlapping spotlights merge into one hole.
 */
export function drawSpotlightLayer(
  ctx: CanvasRenderingContext2D,
  spotlights: SpotlightAnnotation[],
  imageWidth: number,
  imageHeight: number,
  cache: SpotlightLayerCache,
): void {
  if (spotlights.length === 0) return;
  const sig =
    `${imageWidth}x${imageHeight}|` +
    spotlights.map((a) => `${a.shape},${a.x},${a.y},${a.w},${a.h}`).join(';');
  if (!cache.canvas || cache.sig !== sig) {
    const layer = cache.canvas ?? document.createElement('canvas');
    // Assigning the size also resets the layer context's state.
    layer.width = imageWidth;
    layer.height = imageHeight;
    const lctx = layer.getContext('2d');
    if (!lctx) return;
    lctx.fillStyle = `rgba(0,0,0,${SPOTLIGHT_DIM})`;
    lctx.fillRect(0, 0, imageWidth, imageHeight);
    lctx.globalCompositeOperation = 'destination-out';
    // destination-out reads only alpha, so any opaque fill punches the hole.
    lctx.fillStyle = '#000';
    for (const a of spotlights) {
      lctx.beginPath();
      traceSpotlight(lctx, a);
      lctx.fill();
    }
    cache.canvas = layer;
    cache.sig = sig;
  }
  ctx.drawImage(cache.canvas, 0, 0);
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
    case 'spotlight':
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
  ctx.strokeStyle = tokens.canvasMark;
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 6]);
  ctx.strokeRect(n.x, n.y, n.w, n.h);
  ctx.setLineDash([]);
}

/**
 * Draw a cut preview: dim the band about to be removed and dash both edges it
 * will close up along. The same treatment as the crop preview, for the same
 * reason — the dashed edge is guaranteed to read because the dim it borders is
 * under half of it. Given in composed image space, so a draft that overlaps a
 * band already cut is drawn as short as it will actually be.
 */
export function drawCutPreview(
  ctx: CanvasRenderingContext2D,
  y: number,
  h: number,
  imageWidth: number,
): void {
  if (h <= 0) return;
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fillRect(0, y, imageWidth, h);
  ctx.strokeStyle = tokens.canvasMark;
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 6]);
  ctx.beginPath();
  ctx.moveTo(0, y);
  ctx.lineTo(imageWidth, y);
  ctx.moveTo(0, y + h);
  ctx.lineTo(imageWidth, y + h);
  ctx.stroke();
  ctx.setLineDash([]);
}

/**
 * The mark where a cut band was removed: two abutting hairlines, black over
 * white, drawn in screen space so the seam stays one pixel of each at any
 * zoom.
 *
 * The pairing is the selection outline's argument (see SELECTION_DASH) without
 * the dash — a seam runs the full width of the picture over whatever the
 * screenshot happens to hold there, so one flat colour cannot be guaranteed to
 * read against it, and the two-tone pair always leaves one line visible. It is
 * unbroken rather than dashed so it does not read as a selection.
 */
export function drawSeam(ctx: CanvasRenderingContext2D, y: number, x0: number, x1: number): void {
  ctx.save();
  ctx.lineWidth = 1;
  ctx.setLineDash([]);
  ctx.strokeStyle = '#000000';
  ctx.beginPath();
  ctx.moveTo(x0, y - 0.5);
  ctx.lineTo(x1, y - 0.5);
  ctx.stroke();
  ctx.strokeStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(x0, y + 0.5);
  ctx.lineTo(x1, y + 0.5);
  ctx.stroke();
  ctx.restore();
}

export type Handle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'start' | 'end';

export interface HandlePos {
  handle: Handle;
  x: number;
  y: number;
}

/** The eight handle positions around a box, in image space. */
export function rectHandles(r: Rect): HandlePos[] {
  const { x, y, w, h } = r;
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

/** Handle positions (image space) for resizing a selected annotation. */
export function getHandles(a: Annotation): HandlePos[] {
  switch (a.type) {
    case 'rect':
    case 'blur':
    case 'spotlight':
    case 'pen':
    case 'highlight':
      return rectHandles(bbox(a));
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

/**
 * Hit-test handles in screen space; returns the handle under (sx,sy) or null.
 * tol is a half-width: the default 12 gives a 24x24 effective pointer target
 * around each handle's 8x8 drawn square (drawSelection below), the CSS
 * target-size minimum applied to a canvas-drawn control.
 */
export function handleAt(
  a: Annotation,
  project: (x: number, y: number) => { x: number; y: number },
  sx: number,
  sy: number,
  tol = 12,
): Handle | null {
  return handleAtPoints(getHandles(a), project, sx, sy, tol);
}

/** The same hit-test against a bare box — the handles a multi-selection carries. */
export function handleAtRect(
  r: Rect,
  project: (x: number, y: number) => { x: number; y: number },
  sx: number,
  sy: number,
  tol = 12,
): Handle | null {
  return handleAtPoints(rectHandles(r), project, sx, sy, tol);
}

function handleAtPoints(
  handles: HandlePos[],
  project: (x: number, y: number) => { x: number; y: number },
  sx: number,
  sy: number,
  tol: number,
): Handle | null {
  for (const h of handles) {
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
 * The two factors a handle drag applies, and the point map that goes with them.
 * `startBBox` is the box the drag started from; `target` is where the drag has
 * taken it. A point keeps its place in the box: the corner the drag anchors on
 * is a fixed point of the map, because resizeRect leaves that corner alone.
 */
function boxMap(startBBox: Rect, handle: Handle, dx: number, dy: number) {
  const target = resizeRect(startBBox, handle, dx, dy);
  const kx = startBBox.w > 0 ? target.w / startBBox.w : 1;
  const ky = startBBox.h > 0 ? target.h / startBBox.h : 1;
  return {
    kx,
    ky,
    x: (x: number) => target.x + (x - startBBox.x) * kx,
    y: (y: number) => target.y + (y - startBBox.y) * ky,
  };
}

/**
 * Scale one annotation from a handle drag on its own box, always derived from
 * its state at drag start (`a` + `startBBox`) so repeated calls during one drag
 * never compound. Pen and highlight strokes scale freely per axis; text and
 * step badges scale uniformly (fontSize / radius) around the fixed corner, with
 * a size floor.
 *
 * Rect, blur, spotlight, arrow and line resize through their own paths in
 * useEditor (a rect by its dragged edge, an arrow by the endpoint under the
 * pointer) and pass through here untouched. A selection of several is a
 * different problem — one box around annotations that are not it — and has its
 * own function below.
 */
export function scaleAnnotation(
  a: Annotation,
  startBBox: Rect,
  handle: Handle,
  dx: number,
  dy: number,
): Annotation {
  const m = boxMap(startBBox, handle, dx, dy);
  switch (a.type) {
    case 'pen':
    case 'highlight':
      return { ...a, points: a.points.map((p) => ({ x: m.x(p.x), y: m.y(p.y) })) };
    case 'text': {
      // A lone text layer exposes corner handles only, so its own box and the
      // uniform factor grow together and it cannot leave the box being drawn.
      const k = Math.max(m.kx, m.ky, MIN_FONT_SIZE / a.fontSize);
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
      const k = Math.max(m.kx, m.ky, MIN_STEP_RADIUS / a.r);
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

/**
 * The uniform factor for something that cannot be stretched on one axis — a
 * glyph, a badge — inside a box that can. The geometric mean of the two, so
 * that a drag and the drag back cancel exactly: widening by kx=2 with ky=1
 * gives sqrt(2), narrowing back gives 1/sqrt(2), and the product is 1. The
 * larger of the two does not have that property (2 then 1), which is a ratchet:
 * every widen-and-narrow cycle would leave the glyph permanently bigger.
 *
 * `floor` is that annotation's smallest legal factor, and it wins — a size
 * floor is the one place the round trip is allowed to be lossy, because the
 * alternative is a badge scaled to nothing.
 */
function uniformFactor(kx: number, ky: number, floor: number): number {
  return Math.max(Math.sqrt(kx * ky), floor);
}

/**
 * Scale one member of a multi-selection inside the box around all of them.
 *
 * Every member's position comes from the same per-axis map, so a member sits
 * where it sat in the box and cannot be carried outside it. Rect, blur,
 * spotlight, arrow, line, pen and highlight take their size from the same two
 * factors. Text and step badges cannot be stretched on one axis, so their size
 * takes the uniform factor above, and on the axis that scaled less they overhang
 * the slot the map gave them.
 *
 * That overhang is `own_size * (k - k_axis)` on the axis whose factor is
 * `k_axis`, which is `own_size * k_axis * (sqrt(r) - 1)` for `r` the ratio
 * between the two factors. It is proportional to the member's own size but the
 * coefficient grows with `r` without bound: 0.41 of its own size for a 2:1
 * stretch, 0.83 at kx=4/ky=2, and 2.16 for 10:1. It stays proportional to the
 * member — unlike a position error, which grows with distance from the
 * anchored corner and so has no bound at all in the size of the selection.
 */
export function scaleInBox(
  a: Annotation,
  startBox: Rect,
  handle: Handle,
  dx: number,
  dy: number,
): Annotation {
  const m = boxMap(startBox, handle, dx, dy);
  switch (a.type) {
    case 'rect':
    case 'blur':
    case 'spotlight': {
      const n = normalizeRect(a);
      return { ...a, x: m.x(n.x), y: m.y(n.y), w: n.w * m.kx, h: n.h * m.ky };
    }
    case 'arrow':
    case 'line':
      return { ...a, x1: m.x(a.x1), y1: m.y(a.y1), x2: m.x(a.x2), y2: m.y(a.y2) };
    case 'pen':
    case 'highlight':
      return { ...a, points: a.points.map((p) => ({ x: m.x(p.x), y: m.y(p.y) })) };
    case 'text': {
      const k = uniformFactor(m.kx, m.ky, MIN_FONT_SIZE / a.fontSize);
      return {
        ...a,
        x: m.x(a.x),
        y: m.y(a.y),
        fontSize: a.fontSize * k,
        width: a.width * k,
        height: a.height * k,
      };
    }
    case 'step': {
      const k = uniformFactor(m.kx, m.ky, MIN_STEP_RADIUS / a.r);
      // A badge is drawn around its centre, so that is the point the map moves.
      return { ...a, x: m.x(a.x), y: m.y(a.y), r: a.r * k };
    }
  }
}

/**
 * Marching-ants dash: the selection outline sits over an arbitrary
 * screenshot, so no single flat colour (the old #2f80ed blue included) is
 * guaranteed visible against it. Two passes of the same dash pattern, offset
 * by one dash length, alternate opaque black and white along the line. Their
 * contrast against a flat background is a mirror pair — black wins on light
 * backgrounds, white wins on dark ones — that crosses at relative luminance
 * ~0.18, where both still clear ~4.6:1, above the 3:1 UI-boundary floor,
 * against any solid colour underneath. Deliberately not a design token: it
 * has to survive arbitrary image content rather than follow either theme.
 */
const SELECTION_DASH = [4, 3];

/** The two-tone dashed outline of `r`, given in screen space. */
function strokeAnts(ctx: CanvasRenderingContext2D, r: Rect): void {
  ctx.setLineDash(SELECTION_DASH);
  ctx.lineWidth = 1;
  ctx.strokeStyle = '#000000';
  ctx.lineDashOffset = 0;
  ctx.strokeRect(r.x, r.y, r.w, r.h);
  ctx.strokeStyle = '#ffffff';
  ctx.lineDashOffset = SELECTION_DASH[0];
  ctx.strokeRect(r.x, r.y, r.w, r.h);
  ctx.setLineDash([]);
}

/**
 * Draw the selection bbox + resize handles in screen space via `project` —
 * the caller's projector for whatever the points belong to (see
 * CanvasController.projectAt). `handles` is false for every member of a
 * multi-selection: the
 * handles are a resize target, and a drag can only resize one annotation, so
 * painting eight of them per layer would offer a control that does not exist.
 */
export function drawSelection(
  ctx: CanvasRenderingContext2D,
  a: Annotation,
  project: (x: number, y: number) => { x: number; y: number },
  handles = true,
): void {
  const b = bbox(a);
  const tl = project(b.x, b.y);
  const br = project(b.x + b.w, b.y + b.h);
  ctx.save();
  strokeAnts(ctx, { x: tl.x, y: tl.y, w: br.x - tl.x, h: br.y - tl.y });
  if (!handles) {
    ctx.restore();
    return;
  }
  drawHandles(ctx, getHandles(a), project);
  ctx.restore();
}

/**
 * The box a multi-selection is dragged by: one outline around every selected
 * layer, with the eight handles that scale all of them at once. Each member
 * keeps its own plain outline (drawSelection with no handles), so what is
 * selected and what the handles act on are both visible.
 */
export function drawGroupSelection(
  ctx: CanvasRenderingContext2D,
  box: Rect,
  project: (x: number, y: number) => { x: number; y: number },
): void {
  const tl = project(box.x, box.y);
  const br = project(box.x + box.w, box.y + box.h);
  ctx.save();
  strokeAnts(ctx, { x: tl.x, y: tl.y, w: br.x - tl.x, h: br.y - tl.y });
  drawHandles(ctx, rectHandles(box), project);
  ctx.restore();
}

/** The drawn side of a handle square, in screen pixels. */
export const HANDLE_SIZE = 8;

// Handles: a white fill with a black ring is the same worst-case pairing as the
// outline — whichever of the two the local background defeats, the other reads.
// `size` is the drawn side only: the pointer target stays the 24x24 that
// handleAt's tolerance describes, whatever square is painted inside it.
export function drawHandles(
  ctx: CanvasRenderingContext2D,
  handles: HandlePos[],
  project: (x: number, y: number) => { x: number; y: number },
  size = HANDLE_SIZE,
): void {
  const half = size / 2;
  ctx.fillStyle = tokens.canvasMark;
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1.5;
  for (const h of handles) {
    const p = project(h.x, h.y);
    ctx.fillRect(p.x - half, p.y - half, size, size);
    ctx.strokeRect(p.x - half, p.y - half, size, size);
  }
}

/**
 * The marquee a Select-tool drag pulls out, in the same two-tone dash as the
 * selection outline: it sits over the same arbitrary screenshot, so it needs
 * the same guarantee of being visible against whatever is under it.
 */
export function drawMarquee(
  ctx: CanvasRenderingContext2D,
  r: Rect,
  project: (x: number, y: number) => { x: number; y: number },
): void {
  const n = normalizeRect(r);
  const tl = project(n.x, n.y);
  const br = project(n.x + n.w, n.y + n.h);
  ctx.save();
  strokeAnts(ctx, { x: tl.x, y: tl.y, w: br.x - tl.x, h: br.y - tl.y });
  ctx.restore();
}
