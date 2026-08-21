/**
 * Auto-zoom math for the recorder editor: clusters clicks into zoom blocks,
 * eases the camera in and out of them, and resolves overlaps. Pure —
 * no DOM, no chrome APIs — so it stays portable to the export renderer.
 */

export const EASE_MS = 600;
export const HOLD_MS = 1000;
export const CLUSTER_GAP_MS = 2500;
export const CLUSTER_DIST_FRAC = 0.15;

export const ZOOM_SCALES = [1.5, 2, 3] as const;
export type ZoomScale = (typeof ZOOM_SCALES)[number];

export interface ZoomBlock {
  id: string;
  /** Envelope start (ease-in begins here), timeline ms. */
  startMs: number;
  /** Envelope end (ease-out finishes here), timeline ms. */
  endMs: number;
  scale: ZoomScale;
  /** Target center, normalized 0..1 in video space. */
  cx: number;
  cy: number;
}

export interface Camera {
  scale: number;
  cx: number;
  cy: number;
}

export const IDENTITY_CAMERA: Camera = { scale: 1, cx: 0.5, cy: 0.5 };

/** Keeps a normalized center inside the frame at the given zoom scale. */
export function clampCenter(c: number, scale: number): number {
  const margin = 0.5 / scale;
  return Math.min(Math.max(c, margin), 1 - margin);
}

export function newBlockId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `zb-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function mean(values: number[]): number {
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/** Clusters clicks into auto-zoom blocks, then resolves overlaps. */
export function autoZoomBlocks(
  clicks: { t: number; nx: number; ny: number }[],
  durationMs: number,
): ZoomBlock[] {
  if (clicks.length === 0) return [];

  const clusters: { t: number; nx: number; ny: number }[][] = [];
  let current = [clicks[0]];
  for (let i = 1; i < clicks.length; i++) {
    const prev = current[current.length - 1];
    const first = current[0];
    const next = clicks[i];
    if (next.t - prev.t <= CLUSTER_GAP_MS && Math.abs(next.nx - first.nx) <= CLUSTER_DIST_FRAC) {
      current.push(next);
    } else {
      clusters.push(current);
      current = [next];
    }
  }
  clusters.push(current);

  const scale: ZoomScale = 2;
  const blocks: ZoomBlock[] = clusters.map((cluster) => {
    const first = cluster[0];
    const last = cluster[cluster.length - 1];
    return {
      id: newBlockId(),
      startMs: Math.max(0, first.t - EASE_MS),
      endMs: Math.min(durationMs, last.t + HOLD_MS + EASE_MS),
      scale,
      cx: clampCenter(mean(cluster.map((c) => c.nx)), scale),
      cy: clampCenter(mean(cluster.map((c) => c.ny)), scale),
    };
  });

  return normalizeBlocks(blocks);
}

/** Sorts blocks by start, cuts overlaps, and drops blocks with no room to ease. */
export function normalizeBlocks(blocks: ZoomBlock[]): ZoomBlock[] {
  const sorted = [...blocks].sort((a, b) => a.startMs - b.startMs).map((b) => ({ ...b }));
  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i].endMs > sorted[i + 1].startMs) {
      sorted[i].endMs = sorted[i + 1].startMs;
    }
  }
  return sorted.filter((b) => b.endMs - b.startMs >= 2 * EASE_MS);
}

/** Cubic ease-in-out, u in 0..1. */
export function easeInOutCubic(u: number): number {
  return u < 0.5 ? 4 * u ** 3 : 1 - (-2 * u + 2) ** 3 / 2;
}

/** Resolves the camera at a timeline moment against a set of disjoint blocks. */
export function cameraAt(blocks: ZoomBlock[], tMs: number): Camera {
  const block = blocks.find((b) => tMs >= b.startMs && tMs <= b.endMs);
  if (!block) return IDENTITY_CAMERA;

  const holdStart = block.startMs + EASE_MS;
  const holdEnd = block.endMs - EASE_MS;
  let f: number;
  if (tMs < holdStart) {
    f = easeInOutCubic(Math.min(1, (tMs - block.startMs) / EASE_MS));
  } else if (tMs > holdEnd) {
    f = easeInOutCubic(Math.min(1, (block.endMs - tMs) / EASE_MS));
  } else {
    f = 1;
  }

  const scale = IDENTITY_CAMERA.scale + (block.scale - IDENTITY_CAMERA.scale) * f;
  const cx = clampCenter(IDENTITY_CAMERA.cx + (block.cx - IDENTITY_CAMERA.cx) * f, scale);
  const cy = clampCenter(IDENTITY_CAMERA.cy + (block.cy - IDENTITY_CAMERA.cy) * f, scale);
  return { scale, cx, cy };
}
