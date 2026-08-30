// Sets data-theme on <html> before the parser reaches <body>, so no frame
// ever paints with the wrong theme (the flash this file exists to kill).
//
// This has to be a classic, non-module script referenced by <script src>,
// placed first in each surface's <head> — MV3's extension-page CSP
// (script-src 'self', no 'unsafe-inline', no hash/nonce allowance) forbids
// inline <script> content outright, and a type="module" script is deferred
// by spec, which would let the browser start painting before it runs.
//
// chrome.storage is async, so it cannot be read synchronously here. Instead
// this reads a localStorage mirror that src/shared/theme.ts's applyTheme()
// writes on every page after it loads the real setting from chrome.storage.
// The mirror key must match THEME_MIRROR_KEY in that file; it is duplicated,
// not imported, because this file must stay a plain script, outside the
// module graph.
//
// On the very first load anywhere in the extension — before any surface has
// ever run applyTheme() — there is no mirror yet, and this falls back to the
// OS preference via matchMedia, which is also the resolved default for the
// stored setting ('system') on a fresh install. So the guess is exact for a
// first-ever open; it is only a guess (not yet corrected by an explicit user
// choice made in a surface that has not loaded before) until the first
// surface loads and writes the mirror.
(function () {
  try {
    var pref = localStorage.getItem('openscreenshot:theme-mirror') || 'system';
    var prefersDark =
      window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    var dark = pref === 'dark' || (pref === 'system' && prefersDark);
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  } catch {
    // localStorage can throw (disabled storage, some private-mode configs).
    // Nothing to do: the CSS's own prefers-color-scheme fallback still
    // applies the right values for an unset data-theme.
  }
})();
