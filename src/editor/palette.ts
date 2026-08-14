/**
 * Annotation colour helpers.
 *
 * Screen readers need a word for each swatch, and a custom colour needs a short
 * memory so the user can reach it again. Both are pure data, so they sit apart
 * from the style bar component.
 */

export const COLOR_NAMES: Record<string, string> = {
  '#ff3b30': 'Red',
  '#ff9500': 'Orange',
  '#ffcc00': 'Yellow',
  '#34c759': 'Green',
  '#0071e3': 'Blue',
  '#af52de': 'Purple',
  '#ffffff': 'White',
  '#1d1d1f': 'Black',
};

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
  return COLOR_NAMES[norm] ?? `Custom color ${norm}`;
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
