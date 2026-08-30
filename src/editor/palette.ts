/**
 * The annotation palette, and the colour helpers around it.
 *
 * This is the one place a swatch is defined. The colours come from
 * src/shared/tokens.css (via the generated design-tokens module) so the style
 * bar's CSS and the canvas paint the same values; the name beside each one is
 * what a screen reader reads, and what a custom colour is measured against.
 */
import { tokens } from '../shared/design-tokens';
import { t } from './i18n';

export interface Swatch {
  hex: string;
  /** Read out by assistive tech, so it has to be a word, not a hex string. */
  name: string;
}

/** The style bar's swatches, in the order they are drawn and keyed 1..8. */
export const SWATCHES: readonly Swatch[] = [
  { hex: tokens.swatchRed, name: t('editorColorRed') },
  { hex: tokens.swatchOrange, name: t('editorColorOrange') },
  { hex: tokens.swatchYellow, name: t('editorColorYellow') },
  { hex: tokens.swatchGreen, name: t('editorColorGreen') },
  { hex: tokens.swatchBlue, name: t('editorColorBlue') },
  { hex: tokens.swatchPurple, name: t('editorColorPurple') },
  { hex: tokens.swatchWhite, name: t('editorColorWhite') },
  { hex: tokens.swatchBlack, name: t('editorColorBlack') },
];

export const COLOR_PALETTE: string[] = SWATCHES.map((s) => s.hex);

export const COLOR_NAMES: Record<string, string> = Object.fromEntries(
  SWATCHES.map((s) => [s.hex, s.name]),
);

export const MAX_RECENT_COLORS = 5;

/** Normalise to lowercase #rrggbb, or null when the value is not a six-digit hex. */
export function normalizeHex(value: string): string | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(value.trim());
  return m ? `#${m[1].toLowerCase()}` : null;
}

/** A readable label for a swatch. */
export function colorName(hex: string): string {
  const norm = normalizeHex(hex);
  if (!norm) return hex;
  return COLOR_NAMES[norm] ?? t('editorCustomColorHex', [norm]);
}

/**
 * Put `hex` at the front of `list`, drop any duplicate, and cap the length.
 * A preset colour already owns a swatch, so it returns the list untouched —
 * callers use identity to decide whether to persist.
 */
export function pushRecent(list: string[], hex: string, max = MAX_RECENT_COLORS): string[] {
  const norm = normalizeHex(hex);
  if (!norm || COLOR_NAMES[norm]) return list;
  return [norm, ...list.filter((c) => normalizeHex(c) !== norm)].slice(0, max);
}
