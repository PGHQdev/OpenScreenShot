import type { LastCapture, PageRect, Settings } from './types';
import { DEFAULT_SETTINGS } from './types';

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

/** Stash the most recent capture so the editor page can load it. */
export async function setLastCapture(capture: LastCapture): Promise<void> {
  await chrome.storage.local.set({ [LAST_CAPTURE_KEY]: capture });
}

/** Read the stashed capture, or null if none. */
export async function getLastCapture(): Promise<LastCapture | null> {
  const stored = await chrome.storage.local.get(LAST_CAPTURE_KEY);
  return (stored[LAST_CAPTURE_KEY] as LastCapture | undefined) ?? null;
}

/** True if a capture is stashed — checks size only, never loads the image. */
export async function hasLastCapture(): Promise<boolean> {
  return (await chrome.storage.local.getBytesInUse(LAST_CAPTURE_KEY)) > 0;
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

/** Clear the stashed capture (frees storage once the editor has loaded it). */
export async function clearLastCapture(): Promise<void> {
  await chrome.storage.local.remove(LAST_CAPTURE_KEY);
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
