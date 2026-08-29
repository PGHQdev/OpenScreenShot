/**
 * The crop model — the rectangle, its eight handles, and what applying it does
 * to the annotation list.
 *
 * Crop is the one edit that replaces the picture: it rasterises the composed
 * image (every cut band closed up) into a new one and throws the rest away.
 * The arithmetic of that is here, apart from useEditor's state plumbing, so a
 * crop can be checked without a DOM — the same split bands.ts makes for the
 * cut model.
 *
 * ## One coordinate space
 *
 * A crop rect is in *composed* image pixels: the picture as it is drawn, cuts
 * closed up. Annotations are in *source* pixels. {@link cropAnnotations} is
 * where the two meet, and it is also why the crop's chrome projects through
 * CanvasController.toScreenComposed rather than through projectAt — the rect
 * is not anchored on an annotation's row, it is the composed picture's own
 * rectangle.
 *
 * ## Eight handles, and the small-rect rule
 *
 * Every handle carries the 24x24 pointer target the rest of the editor uses
 * (CROP_HANDLE_TOL is its half-width). On a rect narrower than
 * {@link CROP_EDGE_MIN_PX} on screen, an edge handle's target would overlap
 * the two corner targets it sits between, so the edge handle is not offered at
 * all: {@link cropHandles} answers with the four corners alone, and drawing,
 * hit-testing and the keyboard's cycle all read that one answer, so a handle
 * that is drawn is a handle that can be grabbed. Corner targets can still
 * overlap each other on a rect under 24 screen pixels, which is why
 * {@link cropHandleAt} takes the nearest handle rather than the first one in
 * the list.
 */
import {
  bbox,
  drawHandles,
  HANDLE_SIZE,
  normalizeRect,
  rectHandles,
  resizeRect,
  translateAnnotation,
  type Annotation,
  type Handle,
  type HandlePos,
  type Rect,
} from './annotations';
import { cutAbove, inBand, type Band } from './bands';
import type { HistoryEntry } from './history';
import { renumberSteps } from './tools';

/** Half-width of a crop handle's pointer target, in screen px — a 24x24 square. */
export const CROP_HANDLE_TOL = 12;

/**
 * The shortest edge, in screen pixels, that still separates its midpoint
 * handle from the two corners beside it. Each target is 24 wide, so the
 * midpoint has to sit a full target away from each corner: 2 x 24.
 */
export const CROP_EDGE_MIN_PX = 2 * (2 * CROP_HANDLE_TOL);

/** The drawn side of the handle the keyboard is aimed at, in screen px. */
export const CROP_ACTIVE_HANDLE_SIZE = 12;

/** Smallest crop, per axis, in composed image pixels. */
export const MIN_CROP = 1;

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(Math.max(v, lo), hi);
}

/**
 * The handles a crop rect offers at this zoom: four corners always, plus each
 * edge midpoint whose edge is long enough on screen to keep its target clear
 * of the corners. `zoom` is what turns image pixels into screen ones, and the
 * crop's projector is a plain scale by it (toScreenComposed), so no other part
 * of the view is needed here.
 */
export function cropHandles(r: Rect, zoom: number): HandlePos[] {
  const n = normalizeRect(r);
  const wide = n.w * zoom >= CROP_EDGE_MIN_PX;
  const tall = n.h * zoom >= CROP_EDGE_MIN_PX;
  return rectHandles(n).filter((h) => {
    if (h.handle === 'n' || h.handle === 's') return wide;
    if (h.handle === 'e' || h.handle === 'w') return tall;
    return true;
  });
}

/**
 * The crop handle under a screen point, or null.
 *
 * Nearest wins, measured the way the square target is shaped (the larger of
 * the two axis distances). On a rect smaller than one target the four corners
 * overlap, and taking the first match in list order would hand every press to
 * the top-left corner however plainly the user aimed at another one.
 */
export function cropHandleAt(
  r: Rect,
  project: (x: number, y: number) => { x: number; y: number },
  zoom: number,
  sx: number,
  sy: number,
  tol = CROP_HANDLE_TOL,
): Handle | null {
  let best: Handle | null = null;
  let bestDist = Infinity;
  for (const h of cropHandles(r, zoom)) {
    const p = project(h.x, h.y);
    const dx = Math.abs(p.x - sx);
    const dy = Math.abs(p.y - sy);
    if (dx > tol || dy > tol) continue;
    const d = Math.max(dx, dy);
    if (d < bestDist) {
      bestDist = d;
      best = h.handle;
    }
  }
  return best;
}

/**
 * The handle a keyboard resize acts on: the one the user picked, while the
 * rect still offers it, and the bottom-right corner otherwise. A corner is
 * always offered, so this always answers.
 */
export function activeCropHandle(active: Handle | null, r: Rect, zoom: number): Handle {
  if (active && cropHandles(r, zoom).some((h) => h.handle === active)) return active;
  return 'se';
}

/** The next handle round the rect, `dir` 1 clockwise and -1 anticlockwise. */
export function cycleCropHandle(active: Handle | null, dir: 1 | -1, r: Rect, zoom: number): Handle {
  const set = cropHandles(r, zoom).map((h) => h.handle);
  const i = set.indexOf(activeCropHandle(active, r, zoom));
  return set[(i + dir + set.length) % set.length];
}

/**
 * A crop rect dragged or nudged by one of its handles, held inside the picture.
 *
 * The delta is clamped before the resize, the way resizeAnnotationBy clamps a
 * keyboard resize, so a handle pushed past the opposite edge stops on it
 * rather than turning the rect inside out. That is one rule for both drivers:
 * a pointer drag hands a total delta from the grab point, the arrow keys hand
 * a step, and neither can produce a flipped rect the user then has to undo.
 */
export function resizeCropAt(
  start: Rect,
  handle: Handle,
  dx: number,
  dy: number,
  imgW: number,
  imgH: number,
): Rect {
  const n = normalizeRect(start);
  // Which way a positive delta takes each axis: 1 grows the box, -1 shrinks
  // it by moving the near edge in, 0 leaves the axis alone.
  const gx = handle === 'e' || handle === 'ne' || handle === 'se' ? 1 : 0;
  const sxDir = handle === 'w' || handle === 'nw' || handle === 'sw' ? -1 : 0;
  const gy = handle === 's' || handle === 'se' || handle === 'sw' ? 1 : 0;
  const syDir = handle === 'n' || handle === 'ne' || handle === 'nw' ? -1 : 0;
  const cdx = axisDelta(dx, n.w, gx || sxDir);
  const cdy = axisDelta(dy, n.h, gy || syDir);
  const r = resizeRect(n, handle, cdx, cdy);
  const x0 = clamp(r.x, 0, Math.max(0, imgW - MIN_CROP));
  const y0 = clamp(r.y, 0, Math.max(0, imgH - MIN_CROP));
  return {
    x: x0,
    y: y0,
    w: clamp(r.x + r.w, x0 + MIN_CROP, Math.max(x0 + MIN_CROP, imgW)) - x0,
    h: clamp(r.y + r.h, y0 + MIN_CROP, Math.max(y0 + MIN_CROP, imgH)) - y0,
  };
}

/** One axis's delta, cut back to whatever still leaves MIN_CROP behind. */
function axisDelta(d: number, size: number, dir: number): number {
  if (dir === 0) return 0;
  return dir === 1 ? Math.max(d, MIN_CROP - size) : Math.min(d, size - MIN_CROP);
}

/** The pixel size of the image a crop rect rasterises. */
export function cropSize(r: Rect): { w: number; h: number } {
  const n = normalizeRect(r);
  return { w: Math.round(n.w), h: Math.round(n.h) };
}

/**
 * The annotation list a crop leaves behind, in the new image's coordinates.
 *
 * Three passes, in this order:
 *
 * 1. A layer whose top edge sits on a cut row marked pixels the crop did not
 *    take — the crop rasterises the composed picture, so those rows are not in
 *    the new image at all, and the layer goes with them.
 * 2. Every survivor moves by the crop's origin *and* by the cuts above its own
 *    top edge, which is the shift the canvas was already drawing it with. That
 *    is what bakes the bands into the new image's coordinates and lets the
 *    band list be emptied.
 * 3. Anything now entirely outside the new image is dropped, and the step
 *    badges are renumbered over what is left so the visible run reads 1, 2, 3.
 *
 * Pure, and it never mutates its input: useEditor takes the timeline entry
 * from the same list *before* calling this, and an entry holding a list this
 * had edited could not put the dropped layers back.
 */
export function cropAnnotations(anns: Annotation[], rect: Rect, bands: Band[]): Annotation[] {
  const n = normalizeRect(rect);
  const { w, h } = cropSize(n);
  return renumberSteps(
    anns
      .filter((a) => !inBand(bands, bbox(a).y))
      .map((a) => translateAnnotation(a, -n.x, -(cutAbove(bands, bbox(a).y) + n.y)))
      .filter((a) => {
        const b = bbox(a);
        return b.x < w && b.y < h && b.x + b.w > 0 && b.y + b.h > 0;
      }),
  );
}

/** The document a crop is applied to — what an entry is taken from. */
export interface CropDocument {
  annotations: Annotation[];
  bands: Band[];
  selectedIds: string[];
  image: HTMLImageElement | null;
}

/** What applying a crop leaves behind: one timeline entry and one new list. */
export interface CropStep {
  /**
   * The document as it stood *before* the crop — what an undo restores. It
   * holds the very arrays it was handed, so `entry.annotations` still carries
   * every layer {@link cropAnnotations} is about to drop.
   */
  entry: HistoryEntry;
  /** The list the crop leaves, in the new picture's coordinates. */
  annotations: Annotation[];
}

/**
 * One crop, as a step along the timeline.
 *
 * The order is the whole point of this function existing, and it is why
 * useEditor calls it rather than doing the two halves itself. The entry is
 * built from the document *as handed in*, and only then are the annotations
 * filtered and translated. Taken the other way round the entry would hold the
 * cropped list, and undoing the crop would restore a document that never
 * existed — the layers outside the new rect, and the ones on a cut row, would
 * be gone for good.
 *
 * Nothing here mutates the document, so the entry and the new list can share
 * one input array safely.
 */
export function cropStep(doc: CropDocument, rect: Rect): CropStep {
  const entry: HistoryEntry = {
    annotations: doc.annotations,
    bands: doc.bands,
    selectedIds: doc.selectedIds,
    image: doc.image,
  };
  return { entry, annotations: cropAnnotations(doc.annotations, rect, doc.bands) };
}

/**
 * The crop rect's handles, in screen space, over the dimmed preview.
 *
 * The handle the keyboard is aimed at is drawn larger, so a user driving the
 * crop with the arrows can see which edge Alt is about to move. Nothing is
 * emphasised until a handle has actually been picked — the implicit
 * bottom-right default would otherwise put a permanent marker on a rect a
 * mouse user never asked to steer.
 */
export function drawCropHandles(
  ctx: CanvasRenderingContext2D,
  r: Rect,
  project: (x: number, y: number) => { x: number; y: number },
  zoom: number,
  active: Handle | null,
): void {
  const set = cropHandles(r, zoom);
  const live = active === null ? null : activeCropHandle(active, r, zoom);
  ctx.save();
  drawHandles(
    ctx,
    set.filter((h) => h.handle !== live),
    project,
    HANDLE_SIZE,
  );
  if (live) {
    drawHandles(
      ctx,
      set.filter((h) => h.handle === live),
      project,
      CROP_ACTIVE_HANDLE_SIZE,
    );
  }
  ctx.restore();
}
