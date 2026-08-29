/**
 * The editor's crash-safety net.
 *
 * A draft is the annotation list, the cut bands and the beautify frame, tied
 * to the capture the coordinates belong to. This module owns the shape and the
 * validation; `src/shared/storage.ts` only moves the bytes, because shared
 * code must not import editor types.
 *
 * The frame rides along in `Settings` shape so `frameFromSettings` — which
 * already clamps sliders and vets backgrounds — is the only validator it needs.
 */
import type { Annotation, AnnotationType } from './annotations';
import type { Band } from './bands';
import { frameFromSettings, frameToSettings, type FrameOptions } from './frame';
import { DEFAULT_SETTINGS, type Settings } from '../shared/types';

/** How long the editor waits after the last edit before writing. */
export const DRAFT_DEBOUNCE_MS = 800;

type FrameSettings = ReturnType<typeof frameToSettings>;

export interface Draft {
  /** `capturedAt` of the capture these annotation coordinates belong to. */
  sourceCapturedAt: number;
  annotations: Annotation[];
  /** Cut bands, in the same source pixels the annotations are stored in. */
  bands: Band[];
  frame: FrameSettings;
  savedAt: number;
}

const ANNOTATION_TYPES: ReadonlySet<string> = new Set<AnnotationType>([
  'rect',
  'arrow',
  'line',
  'pen',
  'text',
  'blur',
  'highlight',
  'step',
  'spotlight',
]);

export function makeDraft(
  sourceCapturedAt: number,
  annotations: Annotation[],
  bands: Band[],
  frame: FrameOptions,
  savedAt: number = Date.now(),
): Draft {
  return { sourceCapturedAt, annotations, bands, frame: frameToSettings(frame), savedAt };
}

/** Whether a draft holds anything worth offering back. */
export function draftHasWork(draft: Draft): boolean {
  return draft.annotations.length > 0 || draft.bands.length > 0;
}

/** The frame a draft was saved with, clamped and vetted on the way out. */
export function draftFrame(draft: Draft): FrameOptions {
  return frameFromSettings({ ...DEFAULT_SETTINGS, ...draft.frame });
}

/**
 * Read a stored value back into a draft, or null when it cannot be vouched for.
 *
 * One unusable annotation voids the whole draft. Dropping it instead would
 * restore a picture the user never drew, which is worse than restoring nothing.
 * A malformed band voids it for the same reason: a cut is part of the picture,
 * not a decoration on it.
 *
 * A missing `bands` field is not malformed — it is every draft written before
 * the Cut tool existed, and every one of those reads back as a draft with
 * nothing cut.
 */
export function parseDraft(value: unknown): Draft | null {
  if (!value || typeof value !== 'object') return null;
  const v = value as {
    sourceCapturedAt?: unknown;
    annotations?: unknown;
    bands?: unknown;
    frame?: unknown;
    savedAt?: unknown;
  };
  if (typeof v.sourceCapturedAt !== 'number' || !Number.isFinite(v.sourceCapturedAt)) return null;
  if (!Array.isArray(v.annotations)) return null;
  for (const a of v.annotations) {
    if (!isAnnotation(a)) return null;
  }
  const rawBands = v.bands ?? [];
  if (!Array.isArray(rawBands)) return null;
  for (const b of rawBands) {
    if (!isBand(b)) return null;
  }
  const stored = (v.frame ?? {}) as Partial<Settings>;
  return {
    sourceCapturedAt: v.sourceCapturedAt,
    annotations: v.annotations as Annotation[],
    bands: rawBands as Band[],
    frame: frameToSettings(frameFromSettings({ ...DEFAULT_SETTINGS, ...stored })),
    savedAt: typeof v.savedAt === 'number' && Number.isFinite(v.savedAt) ? v.savedAt : 0,
  };
}

/**
 * A band is two finite numbers and nothing else. Unlike an annotation, there
 * is no type to key off and no draw path that tolerates NaN: a non-finite edge
 * would propagate straight into the composed height and into the canvas size
 * taken from it.
 */
function isBand(value: unknown): value is Band {
  if (!value || typeof value !== 'object') return false;
  const b = value as { y?: unknown; h?: unknown };
  return (
    typeof b.y === 'number' &&
    Number.isFinite(b.y) &&
    typeof b.h === 'number' &&
    Number.isFinite(b.h)
  );
}

/**
 * Pen and highlight are special-cased: their draw and hit-test paths index
 * straight into `points` with no length guard (see `drawPen`, `drawHighlight`,
 * and `bbox` in `./annotations`), so a stored annotation missing `points`
 * would throw on every redraw instead of just rendering wrong. The other
 * seven types only produce `NaN` from a missing numeric field, which every
 * canvas 2D call involved already no-ops on silently.
 */
function isAnnotation(value: unknown): value is Annotation {
  if (!value || typeof value !== 'object') return false;
  const a = value as { id?: unknown; type?: unknown; points?: unknown };
  if (typeof a.id !== 'string' || typeof a.type !== 'string' || !ANNOTATION_TYPES.has(a.type)) {
    return false;
  }
  if ((a.type === 'pen' || a.type === 'highlight') && !Array.isArray(a.points)) return false;
  return true;
}
