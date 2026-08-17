import { describe, it, expect } from 'vitest';
import {
  hasScreenPicker,
  openScreenPicker,
  rgbToHex,
  type ScreenPickerScope,
} from '../../src/editor/eyedropper';

/** A stand-in for window.EyeDropper that resolves with a fixed colour. */
function scopeThatPicks(sRGBHex: string): ScreenPickerScope {
  return {
    EyeDropper: class {
      open() {
        return Promise.resolve({ sRGBHex });
      }
    },
  };
}

/** A stand-in that rejects, the way the real picker does on Esc. */
function scopeThatCancels(): ScreenPickerScope {
  return {
    EyeDropper: class {
      open() {
        return Promise.reject(new Error('AbortError'));
      }
    },
  };
}

describe('rgbToHex', () => {
  it('renders a colour as lowercase six-digit hex', () => {
    expect(rgbToHex(255, 59, 48)).toBe('#ff3b30');
    expect(rgbToHex(0, 0, 0)).toBe('#000000');
    expect(rgbToHex(255, 255, 255)).toBe('#ffffff');
  });

  it('pads every channel to two digits', () => {
    expect(rgbToHex(1, 2, 3)).toBe('#010203');
  });

  it('rounds and clamps, so a float or an out-of-range channel still parses', () => {
    expect(rgbToHex(12.6, -4, 999)).toBe('#0d00ff');
  });
});

describe('hasScreenPicker', () => {
  it('is true when the API is present', () => {
    expect(hasScreenPicker(scopeThatPicks('#123456'))).toBe(true);
  });

  it('is false on a browser without it', () => {
    expect(hasScreenPicker({})).toBe(false);
  });
});

describe('openScreenPicker', () => {
  it('returns the picked colour, normalised', async () => {
    await expect(openScreenPicker(scopeThatPicks('#AABBCC'))).resolves.toBe('#aabbcc');
  });

  it('returns null when the user cancels, since Esc rejects', async () => {
    await expect(openScreenPicker(scopeThatCancels())).resolves.toBeNull();
  });

  it('returns null when the API is missing', async () => {
    await expect(openScreenPicker({})).resolves.toBeNull();
  });

  it('returns null for a colour it cannot parse', async () => {
    await expect(openScreenPicker(scopeThatPicks('rebeccapurple'))).resolves.toBeNull();
  });
});
