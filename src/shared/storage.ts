import type { CaptureHistoryEntry, LastCapture, PageRect, Settings } from './types';
import { DEFAULT_SETTINGS } from './types';
import { makeThumbnail } from './thumbnail';

const SETTINGS_KEY = 'openscreenshot:settings';
const LAST_CAPTURE_KEY = 'openscreenshot:last-capture';
const LAST_REGION_KEY = 'openscreenshot:last-region';

/** Load settings, merged over the defaults so new fields are always present. */
export async function getSettings(): Promise<Settings> {
  const stored = await chrome.storage.local.get(SETTINGS_KEY);
  const partial = (stored[SETTINGS_KEY] ?? {}) as Partial<Settings>;
  return { ...DEFAULT_SETTINGS, ...partial };
}

/** Persist a partial settings update, merged with the current values. */
export async function setSettings(patch: Partial<Settings>): Promise<Settings> {
  const next = { ...(await getSettings()), ...patch };
  await chrome.storage.local.set({ [SETTINGS_KEY]: next });
  return next;
}

/** Run `callback` whenever the stored settings change (any writer, any context). */
export function onSettingsChanged(callback: () => void): void {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && SETTINGS_KEY in changes) callback();
  });
}

const CAPTURES_KEY = 'openscreenshot:captures';
const captureImageKey = (id: string) => `openscreenshot:capture-image:${id}`;

/**
 * How many recent captures the shelf keeps. `unlimitedStorage` (already
 * granted) removes `chrome.storage.local`'s byte quota, so this is not a
 * quota decision — it bounds two things that stay a cost no matter the
 * quota: how much a shelf open reads, and how many full-size images sit in
 * storage at once.
 *
 * Only CAPTURES_KEY's thumbnails are read to draw the shelf — the full
 * image behind each entry lives under its own key (captureImageKey) and is
 * read only when that entry is opened. A thumbnail is capped at
 * THUMB_MAX_DIM=240px JPEG q=0.5 (src/shared/thumbnail.ts), typically a few
 * KB and rarely past ~20KB even for a noisy screenshot, so 12 of them keep
 * one shelf-open read (and its JSON parse) under ~250KB worst case — fast
 * enough not to be felt on a cold popup. Full images are not size-bounded
 * (a full-page capture can run several MB), but the same 12 slots cap how
 * many of them accumulate before the oldest is evicted.
 */
export const CAPTURE_HISTORY_LIMIT = 12;

/**
 * Pure eviction policy: prepend `entry` (the newest capture) and keep the
 * newest `limit`. Everything else is `evicted` — callers free those entries'
 * full-image keys, since nothing else will ever address them again. Order
 * comes entirely from prepending, newest first; a caller with entries out of
 * `capturedAt` order gets them evicted in that same order, not resorted.
 */
export function withCapture(
  existing: CaptureHistoryEntry[],
  entry: CaptureHistoryEntry,
  limit: number,
): { kept: CaptureHistoryEntry[]; evicted: CaptureHistoryEntry[] } {
  const next = [entry, ...existing];
  return { kept: next.slice(0, limit), evicted: next.slice(limit) };
}

/** A 1x1 transparent PNG, standing in for a thumbnail that failed to encode. */
const FALLBACK_THUMBNAIL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

/**
 * `makeThumbnail` on purpose: a shelf row must exist even for an image the
 * encoder chokes on (corrupt bytes, a format `createImageBitmap` refuses).
 * Swallowing that here keeps thumbnail encoding from turning "list the
 * shelf" or "stash this capture" into a storage-read failure — the image
 * still gets its own, later chance to fail to decode, in the editor's own
 * load path, same as before the shelf existed.
 */
async function safeThumbnail(dataUrl: string): Promise<string> {
  try {
    return await makeThumbnail(dataUrl);
  } catch {
    return FALLBACK_THUMBNAIL;
  }
}

/**
 * One-time upgrade from the pre-shelf single `openscreenshot:last-capture`
 * key to the bounded list. Runs from every `listCaptureHistory` call, so it
 * self-heals the first time any read happens after an upgrade; every call
 * after the first is a single cheap `get` that finds nothing to do (the
 * legacy key is gone). The new list and the migrated entry's full image are
 * written *before* the legacy key is removed — an interruption in between
 * (the service worker is killed mid-write, say) just leaves the legacy key
 * standing, and the next call migrates it again from scratch instead of
 * losing the capture.
 */
async function migrateLegacyCapture(): Promise<void> {
  const legacyStored = await chrome.storage.local.get(LAST_CAPTURE_KEY);
  const legacy = legacyStored[LAST_CAPTURE_KEY] as LastCapture | undefined;
  if (!legacy) return;

  const id = crypto.randomUUID();
  const entry: CaptureHistoryEntry = {
    id,
    thumbnail: await safeThumbnail(legacy.dataUrl),
    width: legacy.width,
    height: legacy.height,
    mode: legacy.mode,
    title: legacy.title,
    url: legacy.url,
    capturedAt: legacy.capturedAt,
  };
  const existingStored = await chrome.storage.local.get(CAPTURES_KEY);
  const existing = (existingStored[CAPTURES_KEY] as CaptureHistoryEntry[] | undefined) ?? [];
  const { kept, evicted } = withCapture(existing, entry, CAPTURE_HISTORY_LIMIT);

  await chrome.storage.local.set({ [CAPTURES_KEY]: kept, [captureImageKey(id)]: legacy.dataUrl });
  await Promise.all(evicted.map((e) => chrome.storage.local.remove(captureImageKey(e.id))));
  await chrome.storage.local.remove(LAST_CAPTURE_KEY);
}

/** The shelf's rows — thumbnails only, newest first. Never loads a full image. */
export async function listCaptureHistory(): Promise<CaptureHistoryEntry[]> {
  await migrateLegacyCapture();
  const stored = await chrome.storage.local.get(CAPTURES_KEY);
  return (stored[CAPTURES_KEY] as CaptureHistoryEntry[] | undefined) ?? [];
}

/** Stash a capture: thumbnail it, prepend it to the shelf, evict past the limit. */
export async function setLastCapture(capture: LastCapture): Promise<void> {
  const id = crypto.randomUUID();
  const entry: CaptureHistoryEntry = {
    id,
    thumbnail: await safeThumbnail(capture.dataUrl),
    width: capture.width,
    height: capture.height,
    mode: capture.mode,
    title: capture.title,
    url: capture.url,
    capturedAt: capture.capturedAt,
  };
  const existing = await listCaptureHistory();
  const { kept, evicted } = withCapture(existing, entry, CAPTURE_HISTORY_LIMIT);
  await chrome.storage.local.set({
    [CAPTURES_KEY]: kept,
    [captureImageKey(id)]: capture.dataUrl,
  });
  await Promise.all(evicted.map((e) => chrome.storage.local.remove(captureImageKey(e.id))));
}

/** Read one shelf entry's full image back, decorated with its metadata. */
export async function openCapture(id: string): Promise<LastCapture | null> {
  const list = await listCaptureHistory();
  const entry = list.find((e) => e.id === id);
  if (!entry) return null;
  const stored = await chrome.storage.local.get(captureImageKey(id));
  const dataUrl = stored[captureImageKey(id)] as string | undefined;
  if (!dataUrl) return null;
  return {
    dataUrl,
    width: entry.width,
    height: entry.height,
    mode: entry.mode,
    title: entry.title,
    url: entry.url,
    capturedAt: entry.capturedAt,
    id: entry.id,
  };
}

/** The most recent capture, full image included — what the editor autoloads. */
export async function getLastCapture(): Promise<LastCapture | null> {
  const [newest] = await listCaptureHistory();
  return newest ? openCapture(newest.id) : null;
}

/** True if the shelf has at least one capture — reads thumbnails only. */
export async function hasLastCapture(): Promise<boolean> {
  return (await listCaptureHistory()).length > 0;
}

/** Remove one shelf entry and its full image. A no-op if `id` is not there. */
export async function deleteCapture(id: string): Promise<void> {
  const list = await listCaptureHistory();
  const next = list.filter((e) => e.id !== id);
  if (next.length === list.length) return;
  await chrome.storage.local.set({ [CAPTURES_KEY]: next });
  await chrome.storage.local.remove(captureImageKey(id));
}

/** Remember the last region selection so it can be repeated. */
export async function setLastRegion(rect: PageRect): Promise<void> {
  await chrome.storage.local.set({ [LAST_REGION_KEY]: rect });
}

/** Read the last region selection, or null if none was made yet. */
export async function getLastRegion(): Promise<PageRect | null> {
  const stored = await chrome.storage.local.get(LAST_REGION_KEY);
  return (stored[LAST_REGION_KEY] as PageRect | undefined) ?? null;
}

const DRAFT_KEY = 'openscreenshot:draft';
const DRAFT_IMAGE_KEY = 'openscreenshot:draft-image';

/**
 * The editor's in-progress edits. The value is `unknown` here on purpose:
 * `src/editor/draft.ts` owns the shape and validates it on the way back, and
 * shared code must not import editor types.
 */
export async function setDraft(draft: unknown): Promise<void> {
  await chrome.storage.local.set({ [DRAFT_KEY]: draft });
}

export async function getDraft(): Promise<unknown> {
  const stored = await chrome.storage.local.get(DRAFT_KEY);
  return stored[DRAFT_KEY] ?? null;
}

export async function clearDraft(): Promise<void> {
  await chrome.storage.local.remove(DRAFT_KEY);
}

/**
 * The working image, written only when a crop replaces it. Without this the
 * draft's coordinates would be restored against the uncropped stash.
 */
export async function setDraftImage(dataUrl: string): Promise<void> {
  await chrome.storage.local.set({ [DRAFT_IMAGE_KEY]: dataUrl });
}

export async function getDraftImage(): Promise<string | null> {
  const stored = await chrome.storage.local.get(DRAFT_IMAGE_KEY);
  return (stored[DRAFT_IMAGE_KEY] as string | undefined) ?? null;
}

export async function clearDraftImage(): Promise<void> {
  await chrome.storage.local.remove(DRAFT_IMAGE_KEY);
}
