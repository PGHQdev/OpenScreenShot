/**
 * Design tokens for canvas code, GENERATED from src/shared/tokens.css.
 *
 * Do not edit by hand: run `npm run tokens` (`npm run build` runs it too).
 * tests/unit/design-tokens.test.ts fails when this file drifts from the CSS.
 *
 * Stylesheets read the custom properties directly; only code that paints to a
 * canvas — where no custom property resolves — imports from here.
 */

/** Tokens that do not change with the theme (the `@tokens base` block). */
export const tokens = {
  s1: '4px',
  s2: '8px',
  s3: '12px',
  s4: '16px',
  s5: '24px',
  s6: '32px',
  rSm: '6px',
  rMd: '10px',
  rLg: '16px',
  rFull: '9999px',
  shSm: '0 1px 3px rgba(0, 0, 0, 0.08)',
  shMd: '0 4px 12px rgba(0, 0, 0, 0.12)',
  shLg: '0 8px 30px rgba(0, 0, 0, 0.16)',
  font: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
  fontMono: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
} as const;

/** Tokens that change with the theme (the `@tokens light`/`dark` blocks). */
export const theme = {
  light: {
    surface1: '#ffffff',
    surface2: '#f5f5f7',
    surface3: '#ebebed',
    stageBg: '#e4e4e9',
    text1: '#1d1d1f',
    text2: '#6e6e73',
    text3: '#aeaeb2',
    accent: '#e8503a',
    accentHover: '#ee6450',
    accentPressed: '#d43f29',
    accentSubtle: '#fdece9',
    border: '#d2d2d7',
    borderFocus: '#e8503a',
    danger: '#b45309',
    success: '#34c759',
    warning: '#ff9500',
    hoverOverlay: 'rgba(0, 0, 0, 0.05)',
  },
  dark: {
    surface1: '#1c1c1e',
    surface2: '#2c2c2e',
    surface3: '#3a3a3c',
    stageBg: '#161618',
    text1: '#f5f5f7',
    text2: '#98989d',
    text3: '#636366',
    accent: '#f26b57',
    accentHover: '#f58170',
    accentPressed: '#e8503a',
    accentSubtle: '#46201a',
    border: '#48484a',
    borderFocus: '#f26b57',
    danger: '#f5a623',
    success: '#30d158',
    warning: '#ff9f0a',
    hoverOverlay: 'rgba(255, 255, 255, 0.09)',
  },
} as const;
