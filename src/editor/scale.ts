/**
 * Export scaling.
 *
 * The composed 1x canvas is resampled, rather than re-rendered at the target
 * size: annotations then shrink with the screenshot they were drawn on, at the
 * stroke weights the user picked. Steep downscales walk through halves, which
 * a single drawImage step would render mushy.
 */

export const SCALE_PRESETS = [0.25, 0.5, 1, 2] as const;
export const MIN_EXPORT_WIDTH = 16;
export const MAX_EXPORT_SCALE = 4;

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

/** Hold a typed width inside the supported range. */
export function clampTargetWidth(value: number, srcW: number): number {
  if (!Number.isFinite(value)) return srcW;
  return Math.round(Math.max(MIN_EXPORT_WIDTH, Math.min(value, srcW * MAX_EXPORT_SCALE)));
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
