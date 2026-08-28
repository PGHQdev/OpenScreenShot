import type { ThemePreference } from './types';

/**
 * localStorage mirror of the stored theme preference. chrome.storage is
 * async and cannot be read from a blocking <head> script, so applyTheme()
 * mirrors the raw preference here on every apply, and theme-init.js reads it
 * synchronously on the next page load, before first paint. Every extension
 * page shares one origin (chrome-extension://<id>), so the mirror written by
 * one surface is visible to the others.
 *
 * theme-init.js cannot import this constant — it has to stay a plain,
 * unbundled classic script (see its own module doc) — so the key is
 * duplicated there. Keep the two in sync by hand.
 */
export const THEME_MIRROR_KEY = 'openscreenshot:theme-mirror';

/** Resolve a stored preference against the live OS preference into a concrete theme. */
export function resolveTheme(pref: ThemePreference, prefersDark: boolean): 'light' | 'dark' {
  return pref === 'dark' || (pref === 'system' && prefersDark) ? 'dark' : 'light';
}

function systemPrefersDark(): boolean {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
}

/**
 * Apply a theme preference to the document and mirror it for the next load's
 * head script. Call this on settings load, after a user edits the setting,
 * and from the matchMedia listener watchSystemTheme() wires up.
 */
export function applyTheme(pref: ThemePreference): void {
  document.documentElement.setAttribute('data-theme', resolveTheme(pref, systemPrefersDark()));
  try {
    localStorage.setItem(THEME_MIRROR_KEY, pref);
  } catch {
    // Storage can be unavailable (private mode, quota); the theme still applied.
  }
}

/**
 * Re-run `onChange` whenever the OS color scheme flips, so a "system" setting
 * takes effect live instead of only at the next load. The listener has no way
 * to know the stored preference itself, so callers pass a closure that
 * re-reads it and calls applyTheme. Returns a cleanup function for a mount
 * effect; a no-op if matchMedia is unavailable.
 */
export function watchSystemTheme(onChange: () => void): () => void {
  const mql = window.matchMedia?.('(prefers-color-scheme: dark)');
  if (!mql) return () => {};
  mql.addEventListener('change', onChange);
  return () => mql.removeEventListener('change', onChange);
}
