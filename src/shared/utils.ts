/** Shared utility helpers used across the extension. */

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
