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
