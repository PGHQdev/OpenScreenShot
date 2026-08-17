/**
 * Export scaling.
 *
 * The composed 1x canvas is resampled, rather than re-rendered at the target
 * size: annotations then shrink with the screenshot they were drawn on, at the
 * stroke weights the user picked. Steep downscales walk through halves, which
 * a single drawImage step would render mushy.
 */
import { MAX_CANVAS_HEIGHT_PX } from '../shared/geometry';

export const SCALE_PRESETS = [0.25, 0.5, 1, 2] as const;
export const MIN_EXPORT_WIDTH = 16;
export const MAX_EXPORT_SCALE = 4;

/**
 * Total canvas area cap, in px². Chrome accepts a canvas within
 * MAX_CANVAS_HEIGHT_PX on each side yet still no-ops the draw once width ×
 * height gets large enough — toDataURL then returns "data:," with no error.
 * The number is conservative, well under sizes seen to fail in practice.
 */
export const MAX_EXPORT_AREA_PX = 268_000_000;

/**
 * The largest export width that keeps the width, the derived height, and the
 * area all inside the canvas caps, for a composed size of `compW × compH`.
 *
 * MIN_EXPORT_WIDTH is deliberately not applied here. The caps are a hard limit
 * of the canvas; the minimum is only a preference. Flooring at the minimum
 * would return a width the caps forbid, which is what it used to do for an
 * image over 2000x taller than it is wide. Returns 0 when no width qualifies.
 */
export function maxSafeExportWidth(compW: number, compH: number): number {
  if (!(compW > 0) || !(compH > 0)) return MAX_CANVAS_HEIGHT_PX;
  const byWidth = MAX_CANVAS_HEIGHT_PX;
  const byHeight = (MAX_CANVAS_HEIGHT_PX * compW) / compH;
  const byArea = Math.sqrt((MAX_EXPORT_AREA_PX * compW) / compH);
  return Math.max(0, Math.floor(Math.min(byWidth, byHeight, byArea)));
}

/** The ceiling a target width must respect: the user's scale multiplier and the canvas caps. */
export function exportWidthCeiling(compW: number, compH: number): number {
  return Math.min(compW * MAX_EXPORT_SCALE, maxSafeExportWidth(compW, compH));
}

/**
 * The smallest width the export may use. Normally MIN_EXPORT_WIDTH, but a
 * shape whose ceiling sits below it takes the ceiling: the cap always wins.
 */
export function minExportWidth(ceiling: number): number {
  return Math.min(MIN_EXPORT_WIDTH, ceiling);
}

/** Widths to draw through, ending on the exact target. */
export function halvingSteps(srcW: number, targetW: number): number[] {
  const src = Math.max(1, Math.round(srcW));
  const target = Math.max(1, Math.round(targetW));
  if (target >= src) return [target];
  const steps: number[] = [];
  let w = src;
  while (w / 2 > target) {
    w = Math.round(w / 2);
    steps.push(w);
  }
  steps.push(target);
  return steps;
}

/** Height that keeps the source aspect ratio at `targetW`. */
export function scaledHeight(srcW: number, srcH: number, targetW: number): number {
  if (srcW <= 0) return Math.max(1, Math.round(srcH));
  return Math.max(1, Math.round((srcH * targetW) / srcW));
}

/**
 * Hold a typed width inside the supported range. `composedH` — the composed
 * height at `srcW` — is optional so the existing two-argument call sites keep
 * compiling; pass it to also cap the result inside the canvas size limits.
 */
export function clampTargetWidth(value: number, srcW: number, composedH?: number): number {
  if (!Number.isFinite(value)) return srcW;
  const ceiling =
    composedH === undefined ? srcW * MAX_EXPORT_SCALE : exportWidthCeiling(srcW, composedH);
  return Math.round(Math.max(minExportWidth(ceiling), Math.min(value, ceiling)));
}

/** Resample to `targetW`, returning the source untouched at 100%. */
export function resampleToWidth(src: HTMLCanvasElement, targetW: number): HTMLCanvasElement {
  if (targetW === src.width) return src;
  let cur = src;
  for (const w of halvingSteps(src.width, targetW)) {
    const next = document.createElement('canvas');
    next.width = w;
    // Aspect comes from the original at every step, so rounding cannot drift.
    next.height = scaledHeight(src.width, src.height, w);
    const ctx = next.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context unavailable');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(cur, 0, 0, next.width, next.height);
    cur = next;
  }
  return cur;
}
