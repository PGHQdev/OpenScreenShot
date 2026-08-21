/**
 * Frame geometry for the recorder preview and the export renderer.
 *
 * Everything above `drawExportFrame` is pure — no DOM, no chrome APIs — so
 * the numbers are unit-testable and the stage and the export loop cannot
 * drift apart. `drawExportFrame` itself is the one canvas entry point both
 * surfaces call, so a frame rendered in the preview is the frame the export
 * writes.
 */
import { clipToFrame, paintFrame, type FrameMetrics, type FrameOptions } from '../editor/frame';
import type { RecorderDraft } from './recorder-draft';
import type { Camera } from './zoom';

export interface FitRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Largest centered rect of the source aspect that fits the destination.
 * Segments recorded at another pixel size letterbox (or pillarbox) inside
 * the stage canvas, which is sized to the first segment.
 */
export function fitRect(srcW: number, srcH: number, dstW: number, dstH: number): FitRect {
  if (srcW <= 0 || srcH <= 0 || dstW <= 0 || dstH <= 0) return { x: 0, y: 0, w: 0, h: 0 };
  const scale = Math.min(dstW / srcW, dstH / srcH);
  const w = srcW * scale;
  const h = srcH * scale;
  return { x: (dstW - w) / 2, y: (dstH - h) / 2, w, h };
}

export interface SourceRect {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
}

/**
 * The slice of a video frame the camera is looking at, in source pixels.
 * `cameraAt` already clamps the center, so the rect stays inside the frame.
 */
export function cameraSourceRect(cam: Camera, vw: number, vh: number): SourceRect {
  const sw = vw / cam.scale;
  const sh = vh / cam.scale;
  return { sx: cam.cx * vw - sw / 2, sy: cam.cy * vh - sh / 2, sw, sh };
}

/** How long a click ripple lives, in ms. */
export const RIPPLE_MS = 450;

/** Ripple radius at the end of its life, as a fraction of the shorter video side. */
const RIPPLE_MAX_R = 0.06;

/**
 * A click ripple's radius and opacity at `ageMs` after the click, or null
 * once it is spent. One linear expansion against one linear fade reads as a
 * single pulse; the radius is normalized so it looks the same at any
 * recorded pixel size.
 */
export function rippleAt(ageMs: number): { r: number; alpha: number } | null {
  if (!(ageMs >= 0) || ageMs >= RIPPLE_MS) return null;
  const u = ageMs / RIPPLE_MS;
  return { r: RIPPLE_MAX_R * u, alpha: 1 - u };
}

/** Webcam bubble inset from its two edges, as a fraction of the shorter side. */
const BUBBLE_MARGIN = 0.02;

/**
 * The webcam bubble as a circle: center and diameter, in the pixel space of
 * the `W`x`H` picture it sits on. Corner presets resolve here, so the panel
 * only ever stores a corner name.
 */
export function bubbleRect(
  b: RecorderDraft['bubble'],
  W: number,
  H: number,
): { x: number; y: number; d: number } {
  const short = Math.min(W, H);
  const d = b.size * short;
  const inset = BUBBLE_MARGIN * short + d / 2;
  switch (b.corner) {
    case 'tl':
      return { x: inset, y: inset, d };
    case 'tr':
      return { x: W - inset, y: inset, d };
    case 'bl':
      return { x: inset, y: H - inset, d };
    case 'br':
      return { x: W - inset, y: H - inset, d };
    default:
      return { x: b.x * W, y: b.y * H, d };
  }
}

/**
 * Pulls a normalized bubble center back so the circle at `size` stays fully
 * inside a `W`x`H` frame — the drag handler's clamp, kept pure so a dragged
 * bubble can never end up partly off-canvas. Falls back to dead center when
 * the bubble cannot fit at all, rather than producing an inverted range.
 */
export function clampBubbleCenter(
  nx: number,
  ny: number,
  size: number,
  W: number,
  H: number,
): { x: number; y: number } {
  if (W <= 0 || H <= 0) return { x: 0.5, y: 0.5 };
  const r = (size * Math.min(W, H)) / 2;
  const rx = r / W;
  const ry = r / H;
  const x = rx * 2 >= 1 ? 0.5 : Math.min(1 - rx, Math.max(rx, nx));
  const y = ry * 2 >= 1 ? 0.5 : Math.min(1 - ry, Math.max(ry, ny));
  return { x, y };
}

export interface FrameInputs {
  tab: CanvasImageSource;
  tabW: number;
  tabH: number;
  webcam: CanvasImageSource | null;
  /** Source pixel size of `webcam`; only read when `webcam` is set. */
  webcamW: number;
  webcamH: number;
  camera: Camera;
  /** Click positions normalized in video space, with the age of each click. */
  ripples: { nx: number; ny: number; ageMs: number }[];
  bubble: RecorderDraft['bubble'] | null;
  frame: FrameOptions;
  frameMetrics: FrameMetrics;
}

const RIPPLE_COLOR = '232, 80, 58';

/**
 * Draws one composited frame: beautify background, the video under the
 * camera, click ripples, then the webcam bubble.
 *
 * `W`x`H` is the whole canvas, padding included. The ctx origin is moved to
 * the video's top-left for the duration of the draw, which is the coordinate
 * system `paintFrame` and `clipToFrame` expect (the image editor does the
 * same) — so the frame paints out into negative coordinates and everything
 * else is placed in plain video pixels.
 */
export function drawExportFrame(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  inputs: FrameInputs,
): void {
  const m = inputs.frameMetrics;
  ctx.clearRect(0, 0, W, H);
  ctx.save();
  ctx.translate(m.pad, m.pad);

  // `paintFrame` paints nothing when the metrics say the frame is off, so a
  // disabled frame needs no guard here.
  paintFrame(ctx, m, inputs.frame.background, 1);

  ctx.save();
  clipToFrame(ctx, m);

  const dst = fitRect(inputs.tabW, inputs.tabH, m.imgW, m.imgH);
  if (dst.w > 0 && dst.h > 0) {
    const src = cameraSourceRect(inputs.camera, inputs.tabW, inputs.tabH);
    ctx.drawImage(inputs.tab, src.sx, src.sy, src.sw, src.sh, dst.x, dst.y, dst.w, dst.h);
    drawRipples(ctx, inputs, dst, src);
  }

  drawBubble(ctx, inputs, m);

  ctx.restore();
  ctx.restore();
}

/**
 * Ripples ride with the picture, so a click maps through the same camera the
 * video frame did: source px minus the camera's origin, at the camera's
 * magnification. They are clipped to the drawn video rect, which is smaller
 * than the frame whenever a segment letterboxes.
 */
function drawRipples(
  ctx: CanvasRenderingContext2D,
  inputs: FrameInputs,
  dst: FitRect,
  src: SourceRect,
): void {
  if (inputs.ripples.length === 0) return;
  const mag = dst.w / src.sw;
  const unit = Math.min(inputs.tabW, inputs.tabH) * mag;

  ctx.save();
  ctx.beginPath();
  ctx.rect(dst.x, dst.y, dst.w, dst.h);
  ctx.clip();
  for (const click of inputs.ripples) {
    const ripple = rippleAt(click.ageMs);
    if (!ripple) continue;
    const px = (click.nx * inputs.tabW - src.sx) * mag + dst.x;
    const py = (click.ny * inputs.tabH - src.sy) * mag + dst.y;
    const radius = ripple.r * unit;
    if (radius <= 0) continue;
    ctx.beginPath();
    ctx.arc(px, py, radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${RIPPLE_COLOR}, ${ripple.alpha * 0.25})`;
    ctx.fill();
    ctx.lineWidth = Math.max(1, unit * 0.004);
    ctx.strokeStyle = `rgba(${RIPPLE_COLOR}, ${ripple.alpha})`;
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Webcam, center-cropped to a square and clipped to the bubble circle.
 * No bubble, no webcam, or a webcam that has not decoded a frame yet all
 * mean "nothing to draw" — a session recorded without one is the common case.
 */
function drawBubble(ctx: CanvasRenderingContext2D, inputs: FrameInputs, m: FrameMetrics): void {
  const { bubble, webcam, webcamW, webcamH } = inputs;
  if (!bubble || !webcam || webcamW <= 0 || webcamH <= 0) return;

  const b = bubbleRect(bubble, m.imgW, m.imgH);
  if (b.d <= 0) return;
  const side = Math.min(webcamW, webcamH);
  const sx = (webcamW - side) / 2;
  const sy = (webcamH - side) / 2;

  ctx.save();
  ctx.beginPath();
  ctx.arc(b.x, b.y, b.d / 2, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(webcam, sx, sy, side, side, b.x - b.d / 2, b.y - b.d / 2, b.d, b.d);
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.arc(b.x, b.y, b.d / 2, 0, Math.PI * 2);
  ctx.lineWidth = Math.max(1, b.d * 0.02);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.stroke();
  ctx.restore();
}
