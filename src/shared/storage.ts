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
 * enough not to be felt on a cold popup.
 */
export const CAPTURE_HISTORY_LIMIT = 12;

/**
 * Total bytes the shelf's *full images* may occupy at once — see
 * `CaptureHistoryEntry.imageBytes`. `CAPTURE_HISTORY_LIMIT` bounds how many
 * slots exist; this bounds how large they are allowed to add up to. A full
 * image is not size-bounded on its own (an ordinary full-page capture runs
 * a few MB; a tall, high-DPI page can pass 10MB), so 12 slots alone could
 * otherwise grow past several hundred MB. 100MiB assumes an average nearer
 * the high end of ordinary use (~8MB) across all 12 slots (~96MB) fits
 * without any size-driven eviction for a typical session, while a run of
 * unusually large captures still gets bounded instead of growing without
 * limit. `unlimitedStorage` removes the *quota*; this is a product ceiling
 * on profile bloat, argued the same way `CAPTURE_HISTORY_LIMIT` is.
 * Enforced by `withCapture`, which drops the oldest surviving entries by
 * count first, then by bytes, until both fit — but never below one entry:
 * a single capture bigger than the whole budget still gets a shelf slot,
 * since the alternative is discarding the picture the user just took.
 */
export const CAPTURE_IMAGE_BYTES_BUDGET = 100 * 1024 * 1024;

/**
 * Pure eviction policy: prepend `entry` (the newest capture), keep the
 * newest `limit`, then drop from the tail (oldest survivor first) until
 * total `imageBytes` fits `byteBudget` too — never below one entry.
 * Everything dropped is `evicted` — callers free those entries' full-image
 * keys, since nothing else will ever address them again. Order comes
 * entirely from prepending, newest first; a caller with entries out of
 * `capturedAt` order gets them evicted in that same order, not resorted.
 */
export function withCapture(
  existing: CaptureHistoryEntry[],
  entry: CaptureHistoryEntry,
  limit: number,
  byteBudget: number,
): { kept: CaptureHistoryEntry[]; evicted: CaptureHistoryEntry[] } {
  const next = [entry, ...existing];
  const kept = next.slice(0, limit);
  const evicted = next.slice(limit);
  let total = kept.reduce((sum, e) => sum + e.imageBytes, 0);
  while (kept.length > 1 && total > byteBudget) {
    const oldest = kept.pop();
    if (!oldest) break;
    total -= oldest.imageBytes;
    evicted.push(oldest);
  }
  return { kept, evicted };
}

/** A 1x1 transparent PNG, standing in for a thumbnail that failed to encode. */
const FALLBACK_THUMBNAIL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

/**
 * Bumped every time `safeThumbnail` falls back — a total encode failure
 * would otherwise present as a shelf of identical blank squares with
 * nothing anywhere pointing at why. Exported so a test (or, one day, a
 * diagnostics surface) can read it; the `console.warn` below is the signal
 * for a real console.
 */
export let thumbnailFallbackCount = 0;

/**
 * `makeThumbnail` on purpose: a shelf row must exist even for an image the
 * encoder chokes on (corrupt bytes, a format `createImageBitmap` refuses).
 * Swallowing that here keeps thumbnail encoding from turning "list the
 * shelf" or "stash this capture" into a storage-read failure — the image
 * still gets its own, later chance to fail to decode, in the editor's own
 * load path, same as before the shelf existed. See `thumbnailFallbackCount`
 * for why the failure still has to be visible somewhere.
 */
async function safeThumbnail(dataUrl: string): Promise<string> {
  try {
    return await makeThumbnail(dataUrl);
  } catch (err) {
    thumbnailFallbackCount++;
    console.warn('[capture-history] thumbnail encode failed, using the fallback square', err);
    return FALLBACK_THUMBNAIL;
  }
}

/**
 * Serializes every mutation of the capture store (CAPTURES_KEY, its
 * per-entry image keys, and the legacy key migration folds into) behind
 * one module-level promise chain. Before this, two overlapping writers —
 * two captures a few hundred ms apart, a capture racing a shelf delete —
 * each read the same list, computed eviction independently, and the
 * second `set` clobbered the first: a whole row (and its multi-MB
 * `capture-image` key, now referenced by nothing and never swept) silently
 * vanished. The race window is not narrow: it spans a full decode +
 * downscale + JPEG encode of a possibly multi-MB image (`safeThumbnail`),
 * so every caller below runs that part *before* calling this — the queued
 * critical section holds no `await` but the storage calls themselves,
 * migration's one-time encode aside (see `migrateLegacyCaptureLocked`).
 * `fn` runs after every previously queued turn has *settled*, success or
 * failure — chaining through `.then(fn, fn)` and always resetting the tail
 * to a resolved promise keeps one rejected turn from wedging every turn
 * queued after it.
 */
let captureQueue: Promise<void> = Promise.resolve();

function withCaptureLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = captureQueue.then(fn, fn);
  captureQueue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

/**
 * Raw list read: no migration, no locking. Only ever called from inside an
 * already-queued `withCaptureLock` turn — calling it anywhere else risks
 * reading a list a concurrent write is still deciding.
 */
async function readCaptureList(): Promise<CaptureHistoryEntry[]> {
  const stored = await chrome.storage.local.get(CAPTURES_KEY);
  return (stored[CAPTURES_KEY] as CaptureHistoryEntry[] | undefined) ?? [];
}

/**
 * One-time upgrade from the pre-shelf single `openscreenshot:last-capture`
 * key to the bounded list. Unlocked itself — every caller runs it from
 * inside its own `withCaptureLock` turn, so the legacy-key check, the list
 * read and the writes below all happen atomically with respect to every
 * other capture-store mutation. Unlike `setLastCapture`, the thumbnail
 * encode here cannot run ahead of the lock: migration does not know there
 * is anything to encode until it is already inside the lock and has read
 * the legacy key. That is fine — migration runs at most once per install,
 * not on every capture — but it does mean this one queued turn is longer
 * than the others. The new list and the migrated entry's full image are
 * written *before* the legacy key is removed — an interruption in between
 * (the service worker is killed mid-write, say) just leaves the legacy key
 * standing, and the next call migrates it again from scratch instead of
 * losing the capture.
 */
async function migrateLegacyCaptureLocked(): Promise<void> {
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
    imageBytes: legacy.dataUrl.length,
  };
  const existing = await readCaptureList();
  const { kept, evicted } = withCapture(
    existing,
    entry,
    CAPTURE_HISTORY_LIMIT,
    CAPTURE_IMAGE_BYTES_BUDGET,
  );

  await chrome.storage.local.set({ [CAPTURES_KEY]: kept, [captureImageKey(id)]: legacy.dataUrl });
  await Promise.all(evicted.map((e) => chrome.storage.local.remove(captureImageKey(e.id))));
  await chrome.storage.local.remove(LAST_CAPTURE_KEY);
}

/** The shelf's rows — thumbnails only, newest first. Never loads a full image. */
export async function listCaptureHistory(): Promise<CaptureHistoryEntry[]> {
  return withCaptureLock(async () => {
    await migrateLegacyCaptureLocked();
    return readCaptureList();
  });
}

/**
 * Stash a capture: thumbnail it, prepend it to the shelf, evict past the
 * count and byte budgets. The thumbnail encode runs *before* the lock is
 * taken — see `withCaptureLock`'s own doc comment for why.
 */
export async function setLastCapture(capture: LastCapture): Promise<void> {
  const id = crypto.randomUUID();
  const thumbnail = await safeThumbnail(capture.dataUrl);
  const entry: CaptureHistoryEntry = {
    id,
    thumbnail,
    width: capture.width,
    height: capture.height,
    mode: capture.mode,
    title: capture.title,
    url: capture.url,
    capturedAt: capture.capturedAt,
    imageBytes: capture.dataUrl.length,
  };
  await withCaptureLock(async () => {
    await migrateLegacyCaptureLocked();
    const existing = await readCaptureList();
    const { kept, evicted } = withCapture(
      existing,
      entry,
      CAPTURE_HISTORY_LIMIT,
      CAPTURE_IMAGE_BYTES_BUDGET,
    );
    await chrome.storage.local.set({
      [CAPTURES_KEY]: kept,
      [captureImageKey(id)]: capture.dataUrl,
    });
    await Promise.all(evicted.map((e) => chrome.storage.local.remove(captureImageKey(e.id))));
  });
}

/**
 * Read one shelf entry's full image back, decorated with its metadata. Not
 * queued through `withCaptureLock`: it only reads, and the one race that
 * matters — a concurrent delete of this exact `id` between the list read
 * and the image read — already resolves correctly on its own, since the
 * image `get` below then finds nothing and this returns `null`, the same
 * answer as if the delete had landed a moment earlier. `openHistoryEntry`
 * (useEditor.ts) already treats that `null` as "gone", the same message it
 * shows for a row deleted from another tab entirely.
 */
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
  await withCaptureLock(async () => {
    await migrateLegacyCaptureLocked();
    const list = await readCaptureList();
    const next = list.filter((e) => e.id !== id);
    if (next.length === list.length) return;
    await chrome.storage.local.set({ [CAPTURES_KEY]: next });
    await chrome.storage.local.remove(captureImageKey(id));
  });
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
