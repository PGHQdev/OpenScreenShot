/**
 * Colour picking.
 *
 * Two sources end here: a click on the editor canvas (the controller reads the
 * pixel, this module names it) and the browser's screen picker. Both hand back
 * a `#rrggbb` string for `setStyleColor`, so the rest of the editor cannot tell
 * them apart.
 */
import { normalizeHex } from './palette';

interface EyeDropperResult {
  sRGBHex: string;
}

interface EyeDropperInstance {
  open(): Promise<EyeDropperResult>;
}

export type EyeDropperCtor = new () => EyeDropperInstance;

declare global {
  // TypeScript's DOM lib does not declare the EyeDropper API (Chrome 95+) yet.
  interface Window {
    EyeDropper?: EyeDropperCtor;
  }
}

/** The window surface the screen picker needs — a plain object in tests. */
export type ScreenPickerScope = Pick<Window, 'EyeDropper'>;

/** Name an 8-bit RGB triple. Channels are rounded and clamped before padding. */
export function rgbToHex(r: number, g: number, b: number): string {
  const channel = (v: number) => {
    const n = Math.max(0, Math.min(255, Math.round(v)));
    return n.toString(16).padStart(2, '0');
  };
  return `#${channel(r)}${channel(g)}${channel(b)}`;
}

/** True when the browser offers a screen-wide colour picker. */
export function hasScreenPicker(scope: ScreenPickerScope): boolean {
  return typeof scope.EyeDropper === 'function';
}

/**
 * Open the browser's screen picker. Resolves to null on cancel, on an
 * unparsable colour, and on a browser without the API — every one of those is
 * "no colour was picked", and none of them is worth an error surface.
 */
export async function openScreenPicker(scope: ScreenPickerScope): Promise<string | null> {
  const Picker = scope.EyeDropper;
  if (!Picker) return null;
  try {
    const result = await new Picker().open();
    return normalizeHex(result.sRGBHex);
  } catch {
    // Esc closes the picker by rejecting. A cancel is not a failure.
    return null;
  }
}
