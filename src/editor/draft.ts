/**
 * The editor's crash-safety net.
 *
 * A draft is the annotation list plus the beautify frame, tied to the capture
 * the coordinates belong to. This module owns the shape and the validation;
 * `src/shared/storage.ts` only moves the bytes, because shared code must not
 * import editor types.
 *
 * The frame rides along in `Settings` shape so `frameFromSettings` — which
 * already clamps sliders and vets backgrounds — is the only validator it needs.
 */
import type { Annotation, AnnotationType } from './annotations';
import { frameFromSettings, frameToSettings, type FrameOptions } from './frame';
import { DEFAULT_SETTINGS, type Settings } from '../shared/types';

/** How long the editor waits after the last edit before writing. */
export const DRAFT_DEBOUNCE_MS = 800;

type FrameSettings = ReturnType<typeof frameToSettings>;

export interface Draft {
  /** `capturedAt` of the capture these annotation coordinates belong to. */
  sourceCapturedAt: number;
  annotations: Annotation[];
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
  frame: FrameOptions,
  savedAt: number = Date.now(),
): Draft {
  return { sourceCapturedAt, annotations, frame: frameToSettings(frame), savedAt };
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
 */
export function parseDraft(value: unknown): Draft | null {
  if (!value || typeof value !== 'object') return null;
  const v = value as {
    sourceCapturedAt?: unknown;
    annotations?: unknown;
    frame?: unknown;
    savedAt?: unknown;
  };
  if (typeof v.sourceCapturedAt !== 'number' || !Number.isFinite(v.sourceCapturedAt)) return null;
  if (!Array.isArray(v.annotations)) return null;
  for (const a of v.annotations) {
    if (!isAnnotation(a)) return null;
  }
  const stored = (v.frame ?? {}) as Partial<Settings>;
  return {
    sourceCapturedAt: v.sourceCapturedAt,
    annotations: v.annotations as Annotation[],
    frame: frameToSettings(frameFromSettings({ ...DEFAULT_SETTINGS, ...stored })),
    savedAt: typeof v.savedAt === 'number' ? v.savedAt : 0,
  };
}

function isAnnotation(value: unknown): value is Annotation {
  if (!value || typeof value !== 'object') return false;
  const a = value as { id?: unknown; type?: unknown };
  return typeof a.id === 'string' && typeof a.type === 'string' && ANNOTATION_TYPES.has(a.type);
}
