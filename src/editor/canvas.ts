import {
  type Annotation,
  type BlurCache,
  createBlurCache,
  createSpotlightLayerCache,
  drawAnnotation,
  drawCropPreview,
  drawSelection,
  drawSpotlightLayer,
  pruneBlurCache,
  type Rect,
  type SpotlightAnnotation,
  type SpotlightLayerCache,
} from './annotations';
import { centerView, clampZoom, fitZoom } from './viewport';
import { clipToFrame, DEFAULT_FRAME, frameMetrics, paintFrame, type FrameOptions } from './frame';

/**
 * CanvasController — imperative owner of the editor's <canvas>.
 *
 * Holds the base image, the viewport (zoom + pan), and renders the image each
 * frame. Coordinate transforms between screen (CSS px) and image (native px)
 * live here so tools and export share one source of truth. Annotation rendering
 * is added in a later commit; this module is intentionally view-only for now.
 *
 * React owns annotation/tool state; the controller is told about changes via the
 * setters and re-renders. View changes fire `onViewChange` so the status bar can
 * update without duplicating view state in React.
 */

export interface Viewport {
  zoom: number;
  panX: number;
  panY: number;
}

export interface Point {
  x: number;
  y: number;
}

export class CanvasController {
  readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private dpr = 1;
  image: HTMLImageElement | null = null;
  view: Viewport = { zoom: 1, panX: 0, panY: 0 };
  /** Committed annotations, in image pixels. React owns the list; we render it. */
  annotations: Annotation[] = [];
  /** An in-progress annotation (drag-to-draw); not yet in `annotations`. */
  draft: Annotation | null = null;
  /** Currently selected annotation id (handles drawn in screen space later). */
  selectedId: string | null = null;
  /** A transient crop rectangle (tool action), rendered as a dim preview. */
  cropRect: Rect | null = null;
  /** Beautify frame. Document-level, so it lives beside the image, not the annotations. */
  frame: FrameOptions = DEFAULT_FRAME;
  /** Called whenever the viewport changes (zoom/pan) — not on annotation edits. */
  onViewChange: (() => void) | null = null;

  private readonly blurCache: BlurCache = createBlurCache();
  private readonly spotlightLayer: SpotlightLayerCache = createSpotlightLayerCache();

  private readonly ro: ResizeObserver;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context unavailable');
    this.ctx = ctx;
    this.dpr = window.devicePixelRatio || 1;
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(canvas);
    this.resize();
  }

  destroy(): void {
    this.ro.disconnect();
  }

  setImage(img: HTMLImageElement): void {
    this.image = img;
    this.blurCache.clear();
    this.fit();
  }

  setAnnotations(a: Annotation[]): void {
    this.annotations = a;
    pruneBlurCache(this.blurCache, new Set(a.map((x) => x.id)));
    this.render();
  }

  setDraft(d: Annotation | null): void {
    this.draft = d;
    this.render();
  }

  setSelected(id: string | null): void {
    this.selectedId = id;
    this.render();
  }

  setCropRect(r: Rect | null): void {
    this.cropRect = r;
    this.render();
  }

  setFrame(f: FrameOptions): void {
    this.frame = f;
    this.render();
  }

  resize(): void {
    const rect = this.canvas.getBoundingClientRect();
    this.dpr = window.devicePixelRatio || 1;
    this.canvas.width = Math.max(1, Math.round(rect.width * this.dpr));
    this.canvas.height = Math.max(1, Math.round(rect.height * this.dpr));
    this.render();
  }

  /** Fit the whole framed image inside the viewport, centered, never past 100%. */
  fit(): void {
    if (!this.image) return;
    const rect = this.canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const m = frameMetrics(this.frame, this.image.naturalWidth, this.image.naturalHeight);
    const zoom = fitZoom(rect.width, rect.height, m.outerW, m.outerH);
    this.view = centerView(rect.width, rect.height, m.outerW, m.outerH, m.pad, zoom);
    this.render();
    this.onViewChange?.();
  }

  /** Set zoom to an absolute value, keeping the point (cx,cy) in screen space fixed. */
  setZoom(zoom: number, cx: number, cy: number): void {
    const ix = (cx - this.view.panX) / this.view.zoom;
    const iy = (cy - this.view.panY) / this.view.zoom;
    const z = clampZoom(zoom);
    this.view = { zoom: z, panX: cx - ix * z, panY: cy - iy * z };
    this.render();
    this.onViewChange?.();
  }

  /** Multiply zoom by `factor` around a screen point. */
  zoomAt(factor: number, cx: number, cy: number): void {
    this.setZoom(this.view.zoom * factor, cx, cy);
  }

  /** Reset to 100% centered. */
  resetZoom(): void {
    if (!this.image) return;
    const rect = this.canvas.getBoundingClientRect();
    const m = frameMetrics(this.frame, this.image.naturalWidth, this.image.naturalHeight);
    this.view = centerView(rect.width, rect.height, m.outerW, m.outerH, m.pad, 1);
    this.render();
    this.onViewChange?.();
  }

  panBy(dx: number, dy: number): void {
    this.view.panX += dx;
    this.view.panY += dy;
    this.render();
    this.onViewChange?.();
  }

  /** Convert screen (CSS px) to image (native px) coordinates. */
  toImage(sx: number, sy: number): Point {
    return { x: (sx - this.view.panX) / this.view.zoom, y: (sy - this.view.panY) / this.view.zoom };
  }

  /** Convert image (native px) to screen (CSS px) coordinates. */
  toScreen(ix: number, iy: number): Point {
    return { x: ix * this.view.zoom + this.view.panX, y: iy * this.view.zoom + this.view.panY };
  }

  render(): void {
    const { ctx, dpr } = this;
    const rect = this.canvas.getBoundingClientRect();
    const img = this.image;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);
    if (!img) return;
    const m = frameMetrics(this.frame, img.naturalWidth, img.naturalHeight);
    const sw = img.naturalWidth * this.view.zoom;
    const sh = img.naturalHeight * this.view.zoom;

    if (this.frame.enabled) {
      // A transparent background still needs the checkerboard, so alpha reads
      // as alpha across the padding as well as the screenshot.
      if (this.frame.background.kind === 'transparent') {
        drawCheckerboard(
          ctx,
          this.view.panX - m.pad * this.view.zoom,
          this.view.panY - m.pad * this.view.zoom,
          m.outerW * this.view.zoom,
          m.outerH * this.view.zoom,
        );
      }
      ctx.save();
      ctx.translate(this.view.panX, this.view.panY);
      ctx.scale(this.view.zoom, this.view.zoom);
      // shadowBlur/shadowOffsetY ignore the transform matrix, and the context
      // already carries the device pixel ratio from setTransform in render(),
      // so the scale passed here must include dpr too, or the shadow drifts
      // from the export (which composes at 1x with no dpr) on a Retina display.
      paintFrame(ctx, m, this.frame.background, this.view.zoom * this.dpr);
      ctx.restore();
    } else {
      // Shadow behind the image rect, so a light screenshot keeps an edge.
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.24)';
      ctx.shadowBlur = 18;
      ctx.shadowOffsetY = 4;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(this.view.panX, this.view.panY, sw, sh);
      ctx.restore();
      drawCheckerboard(ctx, this.view.panX, this.view.panY, sw, sh);
    }

    ctx.save();
    ctx.translate(this.view.panX, this.view.panY);
    ctx.scale(this.view.zoom, this.view.zoom);
    if (this.frame.enabled) clipToFrame(ctx, m);
    ctx.imageSmoothingEnabled = this.view.zoom <= 1;
    ctx.drawImage(img, 0, 0);
    // The spotlight dim layer (committed + draft) sits under the other annotations.
    const spotlights = collectSpotlights(this.annotations, this.draft);
    ctx.save();
    drawSpotlightLayer(ctx, spotlights, img.naturalWidth, img.naturalHeight, this.spotlightLayer);
    ctx.restore();
    for (const a of this.annotations) {
      ctx.save();
      drawAnnotation(ctx, a, img, this.blurCache);
      ctx.restore();
    }
    if (this.draft) {
      ctx.save();
      drawAnnotation(ctx, this.draft, img, this.blurCache);
      ctx.restore();
    }
    if (this.cropRect) {
      ctx.save();
      drawCropPreview(ctx, this.cropRect, img.naturalWidth, img.naturalHeight);
      ctx.restore();
    }
    ctx.restore();
    // Hairline frame in screen space, drawn under the selection handles.
    if (!this.frame.enabled) {
      ctx.save();
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.28)';
      ctx.lineWidth = 1;
      ctx.strokeRect(this.view.panX + 0.5, this.view.panY + 0.5, sw - 1, sh - 1);
      ctx.restore();
    }
    if (this.selectedId) {
      const sel = this.annotations.find((a) => a.id === this.selectedId);
      if (sel) drawSelection(ctx, sel, (x, y) => this.toScreen(x, y));
    }
  }

  /** Composite the frame + image + annotations at full image resolution for export. */
  composeFinal(): HTMLCanvasElement {
    const img = this.image;
    if (!img) throw new Error('No image to export');
    const m = frameMetrics(this.frame, img.naturalWidth, img.naturalHeight);
    const canvas = document.createElement('canvas');
    canvas.width = m.outerW;
    canvas.height = m.outerH;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context unavailable');
    // Origin at the screenshot's top-left, matching annotation coordinates.
    ctx.translate(m.pad, m.pad);
    paintFrame(ctx, m, this.frame.background, 1);
    ctx.save();
    clipToFrame(ctx, m);
    ctx.drawImage(img, 0, 0);
    ctx.save();
    drawSpotlightLayer(
      ctx,
      collectSpotlights(this.annotations, null),
      img.naturalWidth,
      img.naturalHeight,
      this.spotlightLayer,
    );
    ctx.restore();
    for (const a of this.annotations) {
      ctx.save();
      drawAnnotation(ctx, a, img, this.blurCache);
      ctx.restore();
    }
    ctx.restore();
    return canvas;
  }
}

/** All spotlights to dim with, including an in-progress spotlight draft. */
function collectSpotlights(anns: Annotation[], draft: Annotation | null): SpotlightAnnotation[] {
  const out = anns.filter((a): a is SpotlightAnnotation => a.type === 'spotlight');
  if (draft && draft.type === 'spotlight') out.push(draft);
  return out;
}

function drawCheckerboard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  size = 16,
): void {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#e7e7ec';
  const startX = Math.floor(x / size) * size;
  const startY = Math.floor(y / size) * size;
  for (let yy = startY; yy < y + h; yy += size) {
    for (let xx = startX; xx < x + w; xx += size) {
      if ((Math.floor(xx / size) + Math.floor(yy / size)) % 2 === 0) continue;
      ctx.fillRect(xx, yy, size, size);
    }
  }
  ctx.restore();
}
