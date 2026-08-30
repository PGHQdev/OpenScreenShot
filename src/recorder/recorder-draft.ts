/**
 * The recorder editor's crash-safety net.
 *
 * A draft is every piece of editor state a session accumulates: zoom blocks,
 * trims, the ripple/volume/bubble overlay choices, and the beautify frame.
 * This module owns the shape and the validation; `src/shared/recording-db.ts`
 * only moves the bytes (`RecordingSession.editorState` is `unknown` by
 * design), because shared code must not import recorder or editor types.
 *
 * The frame rides along in `Settings` shape, mirroring `src/editor/draft.ts`,
 * so `frameFromSettings` — which already clamps sliders and vets backgrounds
 * — is the only validator it needs.
 *
 * The undo stack rides along too, as `history`: its entries are `RecorderEdit`
 * — the same eight fields, without the bookkeeping — so one validator reads
 * both the live state and every step behind it, and an undo survives a reload.
 */
import { DEFAULT_FRAME, frameFromSettings, frameToSettings } from '../editor/frame';
import { DEFAULT_SETTINGS } from '../shared/types';
import { emptyHistory, HISTORY_DEPTH, type RecorderHistory } from './recorder-history';
import { ZOOM_SCALES, type ZoomBlock, type ZoomScale } from './zoom';

/** How long the recorder waits after the last edit before writing. */
export const RECORDER_DRAFT_DEBOUNCE_MS = 800;

export type BubbleCorner = 'tl' | 'tr' | 'bl' | 'br' | 'custom';

type FrameSettings = ReturnType<typeof frameToSettings>;

/** Every field the recorder's editor owns — one undo step's worth of state. */
export interface RecorderEdit {
  zoomBlocks: ZoomBlock[];
  autoZoomDone: boolean;
  trims: Record<string, { start: number; end: number }>;
  ripple: boolean;
  pointer: boolean;
  /** 0..1. */
  volumes: { tab: number; mic: number };
  /** x/y normalized 0..1; size = fraction of min(W,H). */
  bubble: { corner: BubbleCorner; x: number; y: number; size: number; hidden: boolean };
  frame: FrameSettings;
}

export interface RecorderDraft extends RecorderEdit {
  history: RecorderHistory;
  savedAt: number;
}

const BUBBLE_CORNERS: ReadonlySet<string> = new Set<BubbleCorner>([
  'tl',
  'tr',
  'bl',
  'br',
  'custom',
]);

const DEFAULT_BUBBLE: RecorderDraft['bubble'] = {
  corner: 'br',
  x: 0.85,
  y: 0.85,
  size: 0.22,
  hidden: false,
};

/** A fresh draft with no zoom, no trims, and the recorder's standard overlay. */
export function defaultRecorderDraft(ripple = true): RecorderDraft {
  return {
    zoomBlocks: [],
    autoZoomDone: false,
    trims: {},
    ripple,
    pointer: true,
    volumes: { tab: 1, mic: 1 },
    bubble: { ...DEFAULT_BUBBLE },
    frame: frameToSettings({ ...DEFAULT_FRAME, enabled: false }),
    history: emptyHistory(),
    savedAt: Date.now(),
  };
}

function clamp01(value: unknown, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.max(0, Math.min(1, value));
}

function isZoomScale(value: unknown): value is ZoomScale {
  return typeof value === 'number' && (ZOOM_SCALES as readonly number[]).includes(value);
}

/**
 * One unusable zoom block voids the whole draft. Dropping it instead would
 * restore a camera move the user never set, which is worse than restoring
 * none at all.
 */
function isZoomBlock(value: unknown): value is ZoomBlock {
  if (!value || typeof value !== 'object') return false;
  const b = value as {
    id?: unknown;
    startMs?: unknown;
    endMs?: unknown;
    scale?: unknown;
    cx?: unknown;
    cy?: unknown;
  };
  if (typeof b.id !== 'string') return false;
  if (typeof b.startMs !== 'number' || !Number.isFinite(b.startMs)) return false;
  if (typeof b.endMs !== 'number' || !Number.isFinite(b.endMs)) return false;
  if (typeof b.cx !== 'number' || !Number.isFinite(b.cx)) return false;
  if (typeof b.cy !== 'number' || !Number.isFinite(b.cy)) return false;
  if (!isZoomScale(b.scale)) return false;
  return true;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function parseTrims(value: unknown): RecorderDraft['trims'] | null {
  if (!isPlainObject(value)) return null;
  const trims: RecorderDraft['trims'] = {};
  for (const [segmentId, raw] of Object.entries(value)) {
    if (!isPlainObject(raw)) return null;
    const start = raw.start;
    const end = raw.end;
    if (typeof start !== 'number' || !Number.isFinite(start)) return null;
    if (typeof end !== 'number' || !Number.isFinite(end)) return null;
    trims[segmentId] = { start, end };
  }
  return trims;
}

function parseBubble(value: unknown): RecorderDraft['bubble'] {
  const v = isPlainObject(value) ? value : {};
  const corner =
    typeof v.corner === 'string' && BUBBLE_CORNERS.has(v.corner)
      ? (v.corner as BubbleCorner)
      : DEFAULT_BUBBLE.corner;
  return {
    corner,
    x: clamp01(v.x, DEFAULT_BUBBLE.x),
    y: clamp01(v.y, DEFAULT_BUBBLE.y),
    size: clamp01(v.size, DEFAULT_BUBBLE.size),
    hidden: v.hidden === true,
  };
}

/**
 * The editor fields alone, or null when one of them cannot be vouched for.
 * Read by the draft itself and by every entry in its undo stack.
 */
function parseEdit(value: unknown): RecorderEdit | null {
  if (!isPlainObject(value)) return null;
  const v = value as {
    zoomBlocks?: unknown;
    autoZoomDone?: unknown;
    trims?: unknown;
    ripple?: unknown;
    pointer?: unknown;
    volumes?: unknown;
    bubble?: unknown;
    frame?: unknown;
  };

  if (!Array.isArray(v.zoomBlocks)) return null;
  for (const b of v.zoomBlocks) {
    if (!isZoomBlock(b)) return null;
  }

  const trims = parseTrims(v.trims);
  if (trims === null) return null;

  const volumesRaw = isPlainObject(v.volumes) ? v.volumes : {};
  const storedFrame = (v.frame ?? {}) as Partial<typeof DEFAULT_SETTINGS>;

  return {
    zoomBlocks: v.zoomBlocks as ZoomBlock[],
    autoZoomDone: v.autoZoomDone === true,
    trims,
    ripple: v.ripple !== false,
    pointer: v.pointer !== false,
    volumes: {
      tab: clamp01(volumesRaw.tab, 1),
      mic: clamp01(volumesRaw.mic, 1),
    },
    bubble: parseBubble(v.bubble),
    frame: frameToSettings(frameFromSettings({ ...DEFAULT_SETTINGS, ...storedFrame })),
  };
}

/**
 * One unreadable entry voids the whole stack. A partial timeline would undo
 * into a state the user was never in, and losing the stack costs the undo
 * history alone — never the work the draft itself carries.
 */
function parseEntries(value: unknown): RecorderEdit[] | null {
  if (!Array.isArray(value)) return null;
  const entries: RecorderEdit[] = [];
  for (const raw of value) {
    const edit = parseEdit(raw);
    if (edit === null) return null;
    entries.push(edit);
  }
  return entries;
}

/** A stored stack, capped the same way pushHistory caps a live one: the past
 *  keeps its newest steps, the future keeps its nearest redos. */
function parseHistory(value: unknown): RecorderHistory {
  if (!isPlainObject(value)) return emptyHistory();
  const past = parseEntries(value.past);
  const future = parseEntries(value.future);
  if (past === null || future === null) return emptyHistory();
  return {
    past: past.slice(Math.max(0, past.length - HISTORY_DEPTH)),
    future: future.slice(0, HISTORY_DEPTH),
  };
}

/**
 * Read a stored value back into a draft, or null when it cannot be vouched
 * for.
 */
export function parseRecorderDraft(value: unknown): RecorderDraft | null {
  if (!isPlainObject(value)) return null;
  const edit = parseEdit(value);
  if (edit === null) return null;
  const savedAt = (value as { savedAt?: unknown }).savedAt;
  return {
    ...edit,
    history: parseHistory((value as { history?: unknown }).history),
    savedAt: typeof savedAt === 'number' && Number.isFinite(savedAt) ? savedAt : 0,
  };
}
