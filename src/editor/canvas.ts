import {
  type Annotation,
  bbox,
  type BlurCache,
  createBlurCache,
  createSpotlightLayerCache,
  drawAnnotation,
  drawCropPreview,
  drawCutPreview,
  drawGroupSelection,
  drawMarquee,
  drawSeam,
  drawSelection,
  drawSpotlightLayer,
  pruneBlurCache,
  type Rect,
  type SpotlightAnnotation,
  type SpotlightLayerCache,
  unionBBox,
} from './annotations';
import {
  composedHeight,
  cutAbove,
  inBand,
  normalizeBand,
  seamPositions,
  segments,
  toComposed,
  toSource,
  type Band,
} from './bands';
import { centerView, clampZoom, fitZoom } from './viewport';
import { clipToFrame, DEFAULT_FRAME, frameMetrics, paintFrame, type FrameOptions } from './frame';
import { rgbToHex } from './eyedropper';

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

/** A live group resize frame: the box, what it holds, and how it projects. */
export interface GroupFrame {
  box: Rect;
  /** The drawn members it holds, which is what a resize scales. */
  members: Annotation[];
  project: (x: number, y: number) => Point;
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
  /** Currently selected annotation ids (handles drawn in screen space later). */
  selectedIds: string[] = [];
  /** A transient crop rectangle (tool action), rendered as a dim preview. */
  cropRect: Rect | null = null;
  /**
   * Cut bands, in source image pixels. Applied wherever the picture is drawn —
   * the live canvas, the export and the crop snapshot — so the band list is
   * the whole of a cut and the capture itself is never touched.
   */
  bands: Band[] = [];
  /**
   * A band being drafted (a drag, or a keyboard placement), also in source
   * pixels and not yet in `bands`. It is previewed as a dim strip rather than
   * closed up: a drag reads the pointer through toImage, and collapsing the
   * band under the pointer mid-drag would feed the band's own height back into
   * the point that sets it.
   */
  cutDraft: Band | null = null;
  /**
   * The Select tool's in-progress marquee, in composed image pixels — the
   * space it is dragged across and drawn in. Source coordinates would be the
   * odd one out here: the rectangle exists only on screen, and what it has to
   * agree with is where the marks are painted, not where they are stored.
   */
  marquee: Rect | null = null;
  /**
   * The resize frame a multi-selection is being resized by, when useEditor is
   * carrying one — the box the handles drag, not a bounding box of the
   * members. Null means "use the union of what is selected", the box a fresh
   * gesture starts from. The two differ once a glyph is in the selection: a
   * glyph scales by one factor on both axes, so it can sit outside the frame
   * it was scaled in, and the handles belong on the frame, which is what the
   * next drag moves. A narrowed glyph overhanging its own handles is that
   * trade being paid, not a stale box.
   */
  groupBox: Rect | null = null;
  /** Beautify frame. Document-level, so it lives beside the image, not the annotations. */
  frame: FrameOptions = DEFAULT_FRAME;
  /** Called whenever the viewport changes (zoom/pan) — not on annotation edits. */
  onViewChange: (() => void) | null = null;

  private readonly blurCache: BlurCache = createBlurCache();
  private readonly spotlightLayer: SpotlightLayerCache = createSpotlightLayerCache();

  private readonly ro: ResizeObserver;
  /**
   * The stage chrome (plate/checkerboard/hairline) is UI, not ink: it must
   * follow the editor's theme, including a live OS-level flip while the
   * editor stays open (`applyTheme` sets `data-theme` on <html>; no click
   * fires for that). These are cached rather than read every render() call —
   * refreshed once at construction and again only when a theme flip is
   * observed — because render() runs on every pointer move.
   */
  private stagePlate = '#ffffff';
  private stageCheck = '#ebebed';
  private stageRule = 'rgba(0, 0, 0, 0.28)';
  private readonly themeObserver: MutationObserver;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context unavailable');
    this.ctx = ctx;
    this.dpr = window.devicePixelRatio || 1;
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(canvas);
    this.refreshThemeColors();
    this.themeObserver = new MutationObserver(() => {
      this.refreshThemeColors();
      this.render();
    });
    this.themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    this.resize();
  }

  /**
   * Re-read the theme-following stage colours off the live cascade
   * (getComputedStyle), not a module-scope constant — a constant captured
   * once at import time would not see a later theme flip. Reading from the
   * canvas itself picks up whatever [data-theme] currently governs it.
   */
  private refreshThemeColors(): void {
    const cs = getComputedStyle(this.canvas);
    this.stagePlate = cs.getPropertyValue('--surface-1').trim() || '#ffffff';
    this.stageCheck = cs.getPropertyValue('--surface-3').trim() || '#ebebed';
    this.stageRule = cs.getPropertyValue('--rule').trim() || 'rgba(0, 0, 0, 0.28)';
  }

  destroy(): void {
    this.ro.disconnect();
    this.themeObserver.disconnect();
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

  setSelected(ids: string[]): void {
    this.selectedIds = ids;
    this.render();
  }

  setMarquee(r: Rect | null): void {
    this.marquee = r;
    this.render();
  }

  /**
   * `repaint: false` is for a change that already has a render coming: an
   * annotation edit repaints through setAnnotations, and a group resize moves
   * the members and the frame in the same frame, so repainting here as well
   * would be a second full repaint of the same frame.
   */
  setGroupBox(r: Rect | null, repaint = true): void {
    // Written on every annotation change, most of which carry no box at all,
    // so the common null-to-null case must not cost a render.
    if (this.groupBox === r) return;
    this.groupBox = r;
    if (repaint) this.render();
  }

  setCropRect(r: Rect | null): void {
    this.cropRect = r;
    this.render();
  }

  setBands(b: Band[]): void {
    this.bands = b;
    this.render();
  }

  setCutDraft(b: Band | null): void {
    this.cutDraft = b;
    this.render();
  }

  setFrame(f: FrameOptions): void {
    this.frame = f;
    this.render();
  }

  /**
   * The height of the picture that is drawn and exported: the source height
   * less every cut row.
   *
   * Floored at one row. Nothing in the editor can cut the last row away (see
   * canCut), but a hand-edited stored draft could, and a zero-height canvas
   * makes toDataURL return "data:," with no error at all — the same silent
   * failure the frame's padding cap exists to avoid.
   */
  composedImageHeight(): number {
    if (!this.image) return 0;
    return Math.max(1, composedHeight(this.bands, this.image.naturalHeight));
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
    const m = frameMetrics(this.frame, this.image.naturalWidth, this.composedImageHeight());
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
    const m = frameMetrics(this.frame, this.image.naturalWidth, this.composedImageHeight());
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

  /**
   * Convert screen (CSS px) to source image (native px) coordinates — the
   * space annotations are stored in. With bands cut, a point below a seam
   * resolves to the source row it is showing, so every hit test, drag and
   * draft keeps working in one coordinate space whether or not anything has
   * been cut.
   */
  toImage(sx: number, sy: number): Point {
    const p = this.toComposedPoint(sx, sy);
    return { x: p.x, y: toSource(this.bands, p.y) };
  }

  /**
   * Convert screen (CSS px) to composed image coordinates — the picture as it
   * is actually drawn, cuts closed up. Crop works in this space: its preview
   * is drawn over the composed picture and it rasterises from it.
   */
  toComposedPoint(sx: number, sy: number): Point {
    return { x: (sx - this.view.panX) / this.view.zoom, y: (sy - this.view.panY) / this.view.zoom };
  }

  /**
   * Convert composed image coordinates to screen (CSS px) — toComposedPoint
   * the other way round. The marquee is drawn through it, and nothing that
   * belongs to an annotation is: a mark is drawn rigidly, shifted by the cut
   * above its own top edge, so its outline, handles and hit box go through
   * {@link projectAt} instead.
   */
  toScreenComposed(cx: number, cy: number): Point {
    return { x: cx * this.view.zoom + this.view.panX, y: cy * this.view.zoom + this.view.panY };
  }

  /**
   * A projector for everything that hangs off one anchor row and moves with it
   * rigidly: an annotation (anchored on its bbox top) and the box a
   * multi-selection is resized in (anchored on its own top). Null when that
   * row was cut away, which is the caller's cue to draw and hit-test nothing.
   *
   * This is the one rule the drawing, the selection chrome and the hit tests
   * all follow, so a mark is grabbable exactly where it is painted. A group
   * box whose members ended up at different offsets is anchored on the box,
   * which is what the handles drag and what scaleInBox measures against.
   */
  projectAt(anchorY: number): ((x: number, y: number) => Point) | null {
    if (inBand(this.bands, anchorY)) return null;
    const dy = cutAbove(this.bands, anchorY);
    return (x: number, y: number) => ({
      x: x * this.view.zoom + this.view.panX,
      y: (y - dy) * this.view.zoom + this.view.panY,
    });
  }

  /** That projector for one annotation, anchored on its own top edge. */
  projectFor(a: Annotation): ((x: number, y: number) => Point) | null {
    return this.projectAt(bbox(a).y);
  }

  /**
   * The selected marks that are in the picture — what selection chrome is
   * drawn for, and what a pointer or a key press can reach.
   *
   * ## Which list to pass
   *
   * The rule for a caller is: pass the list your answer has to agree with.
   *
   * - Answering for the canvas — anything drawn, and anything hit-tested
   *   against what is drawn — passes `this.annotations` and `this.selectedIds`.
   *   Those are what render() last painted, so a hit test against them cannot
   *   miss a mark the user can see.
   * - Answering for the model an input is acting on passes useEditor's eager
   *   refs (`annotationsRef.current`, `selectedIdsRef.current`), which carry
   *   the edit the current event just made.
   *
   * The two differ only while a held key outruns Preact's effect flush, which
   * is a lag on the same rule over the same ids, reconciled by the next
   * render. A pointer event cannot see the gap at all: a mousedown is a
   * discrete task and the flush is a microtask, so the effects have run before
   * it is dispatched. The carried half of the frame — `this.groupBox` — is
   * written eagerly and so is the same for every caller either way.
   */
  drawnSelection(anns: Annotation[], ids: string[]): Annotation[] {
    const out: Annotation[] = [];
    for (const id of ids) {
      const a = anns.find((x) => x.id === id);
      if (a && this.annotationOffset(a) !== null) out.push(a);
    }
    return out;
  }

  /**
   * The resize frame that is live for a selection right now: the box the
   * handles are drawn on, the box a pointer grabs them from, and the box the
   * arrows scale members inside — one answer, so those three cannot drift
   * apart. Null when there is no group frame, which is any selection with
   * fewer than two marks in the picture.
   *
   * Every caller went through its own copy of this rule before, and they
   * diverged twice: a frame drawn around the members that are there while a
   * grab was hit-tested against a box built from every selected mark, hidden
   * ones included, put eight handles on screen that the pointer could not
   * reach. A fourth caller should not be able to disagree without deleting a
   * call to this.
   *
   * The carried box is used while it is one the user can see; once a cut takes
   * its anchor row it is dropped for the union of the drawn members, which is
   * always drawable because its top edge is one of their top edges.
   *
   * See {@link drawnSelection} for which annotation list a caller passes.
   */
  liveGroupFrame(anns: Annotation[], ids: string[]): GroupFrame | null {
    const members = this.drawnSelection(anns, ids);
    if (members.length < 2) return null;
    const carried = this.groupBox;
    const box = carried && this.projectAt(carried.y) ? carried : unionBBox(members);
    const project = this.projectAt(box.y);
    return project ? { box, members, project } : null;
  }

  /**
   * Colour of the rendered pixel under a screen point, as #rrggbb, or null when
   * the point is off-canvas or fully transparent.
   *
   * It reads the rendered canvas rather than the source image, so a pick lands
   * on what the user sees: annotations, spotlight dim, and beautify background
   * included. The backing store carries the device pixel ratio, so the screen
   * point is scaled before the read.
   */
  sampleAt(sx: number, sy: number): string | null {
    if (!this.image) return null;
    const x = Math.round(sx * this.dpr);
    const y = Math.round(sy * this.dpr);
    if (x < 0 || y < 0 || x >= this.canvas.width || y >= this.canvas.height) return null;
    const [r, g, b, a] = this.ctx.getImageData(x, y, 1, 1).data;
    return a === 0 ? null : rgbToHex(r, g, b);
  }

  render(): void {
    const { ctx, dpr } = this;
    const rect = this.canvas.getBoundingClientRect();
    const img = this.image;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);
    if (!img) return;
    const ih = this.composedImageHeight();
    const m = frameMetrics(this.frame, img.naturalWidth, ih);
    const sw = img.naturalWidth * this.view.zoom;
    const sh = ih * this.view.zoom;

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
          this.stagePlate,
          this.stageCheck,
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
      ctx.fillStyle = this.stagePlate;
      ctx.fillRect(this.view.panX, this.view.panY, sw, sh);
      ctx.restore();
      drawCheckerboard(
        ctx,
        this.view.panX,
        this.view.panY,
        sw,
        sh,
        this.stagePlate,
        this.stageCheck,
      );
    }

    ctx.save();
    ctx.translate(this.view.panX, this.view.panY);
    ctx.scale(this.view.zoom, this.view.zoom);
    if (this.frame.enabled) clipToFrame(ctx, m);
    ctx.imageSmoothingEnabled = this.view.zoom <= 1;
    this.paintPicture(ctx, img, this.draft);
    if (this.cropRect) {
      ctx.save();
      drawCropPreview(ctx, this.cropRect, img.naturalWidth, ih);
      ctx.restore();
    }
    if (this.cutDraft) {
      const d = normalizeBand(this.cutDraft);
      const top = toComposed(this.bands, d.y);
      ctx.save();
      drawCutPreview(ctx, top, toComposed(this.bands, d.y + d.h) - top, img.naturalWidth);
      ctx.restore();
    }
    ctx.restore();
    // The seam each cut left, in screen space so it stays a hairline at any
    // zoom, and under the selection chrome the same way the frame's is.
    for (const at of seamPositions(this.bands)) {
      drawSeam(ctx, this.view.panY + at * this.view.zoom, this.view.panX, this.view.panX + sw);
    }
    // Hairline frame in screen space, drawn under the selection handles.
    if (!this.frame.enabled) {
      ctx.save();
      ctx.strokeStyle = this.stageRule;
      ctx.lineWidth = 1;
      ctx.strokeRect(this.view.panX + 0.5, this.view.panY + 0.5, sw - 1, sh - 1);
      ctx.restore();
    }
    // One selected layer carries its own handles; several share one set, on
    // the box around all of them (drawGroupSelection).
    // Only what is in the picture. A selection holding a mark a cut hides
    // carries chrome for the rest of it, and the lone survivor of such a
    // selection keeps its own handles rather than a group frame around one.
    const drawn = this.drawnSelection(this.annotations, this.selectedIds);
    for (const sel of drawn) {
      const project = this.projectFor(sel);
      if (project) drawSelection(ctx, sel, project, drawn.length === 1);
    }
    const frame = this.liveGroupFrame(this.annotations, this.selectedIds);
    if (frame) drawGroupSelection(ctx, frame.box, frame.project);
    if (this.marquee) drawMarquee(ctx, this.marquee, (x, y) => this.toScreenComposed(x, y));
  }

  /** Composite the frame + image + annotations at full image resolution for export. */
  composeFinal(): HTMLCanvasElement {
    const img = this.image;
    if (!img) throw new Error('No image to export');
    const m = frameMetrics(this.frame, img.naturalWidth, this.composedImageHeight());
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
    this.paintPicture(ctx, img, null);
    ctx.restore();
    return canvas;
  }

  /**
   * The screenshot with every cut closed up and nothing drawn on it, at 1:1.
   * Crop rasterises from this rather than from the capture, so a crop takes
   * the picture the user is looking at and bakes the cuts into it.
   */
  composeImage(): HTMLCanvasElement {
    const img = this.image;
    if (!img) throw new Error('No image to compose');
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = this.composedImageHeight();
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context unavailable');
    this.drawImageCut(ctx, img);
    return canvas;
  }

  /**
   * The picture itself: the image with its cuts closed up, then the spotlight
   * dim layer, then every annotation. render() and composeFinal() both call
   * it, each under its own transform, so what the canvas shows and what the
   * export holds cannot drift apart.
   */
  private paintPicture(
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    draft: Annotation | null,
  ): void {
    this.drawImageCut(ctx, img);
    const spotlights = this.composedSpotlights(draft);
    ctx.save();
    drawSpotlightLayer(
      ctx,
      spotlights,
      img.naturalWidth,
      this.composedImageHeight(),
      this.spotlightLayer,
    );
    ctx.restore();
    for (const a of this.annotations) this.paintAnnotation(ctx, a, img);
    if (draft) this.paintAnnotation(ctx, draft, img);
  }

  /** The image drawn a kept run at a time, each pulled up by the cuts above it. */
  private drawImageCut(ctx: CanvasRenderingContext2D, img: HTMLImageElement): void {
    const w = img.naturalWidth;
    for (const s of segments(this.bands, img.naturalHeight)) {
      ctx.drawImage(img, 0, s.sy, w, s.h, 0, s.dy, w, s.h);
    }
  }

  /**
   * How far a cut pulls an annotation up, or null when it sits on rows that
   * were removed.
   *
   * The anchor is the top edge, and the shift is rigid: a mark keeps its shape
   * and stays glued to the content its top edge is on. An annotation that
   * spans a seam therefore overhangs by the height of the cut it crosses,
   * which is the trade for never distorting a shape. One whose top edge is on
   * a removed row is not drawn at all — it marks pixels that are not in the
   * picture — but it stays in the document, so deleting the band brings it
   * back with everything else.
   *
   * Public because it is not only a drawing detail: the hit test, the marquee
   * and the bracket cycle all ask it whether a mark is in the picture at all.
   */
  annotationOffset(a: Annotation): number | null {
    if (this.bands.length === 0) return 0;
    const top = bbox(a).y;
    return inBand(this.bands, top) ? null : cutAbove(this.bands, top);
  }

  private paintAnnotation(
    ctx: CanvasRenderingContext2D,
    a: Annotation,
    img: HTMLImageElement,
  ): void {
    const dy = this.annotationOffset(a);
    if (dy === null) return;
    ctx.save();
    // The blur tile is still sampled from the source image at the annotation's
    // own coordinates; only where it lands moves.
    ctx.translate(0, -dy);
    drawAnnotation(ctx, a, img, this.blurCache);
    ctx.restore();
  }

  /** Every spotlight to dim with, moved into composed space, draft included. */
  private composedSpotlights(draft: Annotation | null): SpotlightAnnotation[] {
    const out: SpotlightAnnotation[] = [];
    const all = draft ? [...this.annotations, draft] : this.annotations;
    for (const a of all) {
      if (a.type !== 'spotlight') continue;
      const dy = this.annotationOffset(a);
      if (dy === null) continue;
      out.push(dy === 0 ? a : { ...a, y: a.y - dy });
    }
    return out;
  }
}

function drawCheckerboard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  plate: string,
  check: string,
  size = 16,
): void {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.fillStyle = plate;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = check;
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
