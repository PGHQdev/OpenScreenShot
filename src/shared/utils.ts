/** Shared utility helpers used across the extension. */
import type { CaptureAction, CaptureMode } from './types';

/**
 * Resolve a filename template using the current date/time and capture context.
 *
 * Supported tokens:
 *   {date}   -> YYYY-MM-DD
 *   {time}   -> HHMMSS
 *   {title}  -> sanitized page title (fallback: "screenshot")
 *   {domain} -> page hostname without "www." (fallback: "page")
 *   {w}      -> image width in px
 *   {h}      -> image height in px
 */
export function formatFilename(
  template: string,
  ctx: { title?: string; url?: string; width: number; height: number },
): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const time = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const title = sanitizeFilename(ctx.title ?? 'screenshot').slice(0, 60) || 'screenshot';
  const domain = sanitizeFilename(domainFromUrl(ctx.url)).slice(0, 60) || 'page';

  return template
    .replaceAll('{date}', date)
    .replaceAll('{time}', time)
    .replaceAll('{title}', title)
    .replaceAll('{domain}', domain)
    .replaceAll('{w}', String(ctx.width))
    .replaceAll('{h}', String(ctx.height));
}

/**
 * Hostname of `url` with any leading `www.` removed.
 *
 * Returns an empty string for a missing, unparsable, or hostless URL (`file://`),
 * which lets the caller apply its own fallback.
 */
export function domainFromUrl(url: string | undefined): string {
  if (!url) return '';
  let host: string;
  try {
    host = new URL(url).hostname;
  } catch {
    return '';
  }
  return host.startsWith('www.') ? host.slice(4) : host;
}

/** Strip characters that are invalid in download filenames across platforms. */
export function sanitizeFilename(name: string): string {
  return name.replace(/[\\/:*?"<>|]/g, '_').trim();
}

/** True for URLs the extension is not allowed to capture. */
export function isProtectedUrl(url: string | undefined): boolean {
  if (!url) return true;
  // Our own pages are protected too, and no permission changes that: a probe
  // against the packed build (2026-09-01) showed chrome.scripting.executeScript
  // refusing a chrome-extension:// target even with <all_urls> granted, which
  // is every step of a full-page capture bar the tile grab. An earlier carve-out
  // here let the bundled welcome page through and the first capture a new user
  // ever took died on "Cannot access contents of the page". The welcome page is
  // hosted on the site now — an ordinary https page a capture can actually read.
  return (
    url.startsWith('chrome://') ||
    url.startsWith('chrome-extension://') ||
    url.startsWith('edge://') ||
    url.startsWith('devtools://') ||
    url.startsWith('about:') ||
    // Chrome blocks script injection on both Web Store hosts (old + current).
    url.startsWith('https://chrome.google.com/webstore') ||
    url.startsWith('https://chromewebstore.google.com')
  );
}

/** Capture delays the popup offers, in seconds. 0 means capture immediately. */
export const CAPTURE_DELAYS = [0, 3, 5, 10] as const;

export type CaptureDelay = (typeof CAPTURE_DELAYS)[number];

/** Coerce a stored delay to a supported value; anything else means no delay. */
export function normalizeCaptureDelay(value: unknown): CaptureDelay {
  return CAPTURE_DELAYS.includes(value as CaptureDelay) ? (value as CaptureDelay) : 0;
}

/** Post-capture actions the popup offers, in the order it lists them. */
export const CAPTURE_ACTIONS: readonly CaptureAction[] = ['editor', 'clipboard', 'download'];

/** Coerce a stored action to a supported one; anything else opens the editor. */
export function normalizeCaptureAction(value: unknown): CaptureAction {
  return CAPTURE_ACTIONS.includes(value as CaptureAction) ? (value as CaptureAction) : 'editor';
}

/** Context menu item id for each capture mode. */
export const MENU_IDS: Record<CaptureMode, string> = {
  'full-page': 'oss-full-page',
  visible: 'oss-visible',
  region: 'oss-region',
};

/** Menu item id for "repeat last region" — region mode with the stored rect. */
export const MENU_REPEAT_ID = 'oss-region-repeat';

/** Capture mode for a context menu item id, or null for any other id. */
export function menuIdToMode(id: string): CaptureMode | null {
  for (const [mode, menuId] of Object.entries(MENU_IDS)) {
    if (menuId === id) return mode as CaptureMode;
  }
  return null;
}

/** Tokens the filename template accepts, in the order the settings UI lists them. */
export const FILENAME_TOKENS = ['{date}', '{time}', '{title}', '{domain}', '{w}', '{h}'] as const;

/**
 * Splice `token` into `value` over the range [selStart, selEnd).
 *
 * Indices come straight from a DOM input, so they are clamped here rather than
 * at the call site. Returns the new value and where the caret belongs after it.
 */
export function insertToken(
  value: string,
  selStart: number,
  selEnd: number,
  token: string,
): { value: string; caret: number } {
  const start = Math.max(0, Math.min(selStart, value.length));
  const end = Math.max(start, Math.min(selEnd, value.length));
  return {
    value: value.slice(0, start) + token + value.slice(end),
    caret: start + token.length,
  };
}
