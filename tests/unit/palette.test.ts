import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  MAX_RECENT_COLORS,
  SWATCHES,
  colorName,
  normalizeHex,
  pushRecent,
} from '../../src/editor/palette';

/**
 * COLOR_PALETTE and COLOR_NAMES both derive from SWATCHES, so comparing them
 * proves nothing. The seam that can still break is the one between tokens.css
 * and SWATCHES: adding a --swatch-* token and forgetting the word a screen
 * reader reads for it.
 */
describe('SWATCHES', () => {
  const css = readFileSync('src/shared/tokens.css', 'utf8');
  const declared = [...css.matchAll(/--swatch-([a-z0-9-]+):\s*(#[0-9a-f]{6});/g)].map((m) => ({
    token: `--swatch-${m[1]}`,
    hex: m[2],
  }));

  it('finds the swatch tokens in tokens.css', () => {
    expect(declared.length).toBeGreaterThan(0);
  });

  it('gives every --swatch-* token an accessible name', () => {
    for (const { token, hex } of declared) {
      const swatch = SWATCHES.find((s) => s.hex === hex);
      expect(swatch, `${token} (${hex}) has no SWATCHES entry`).toBeDefined();
      expect(swatch?.name, `${token} has an empty name`).toMatch(/\S/);
    }
  });

  it('has no swatch that tokens.css does not declare', () => {
    const hexes = declared.map((d) => d.hex);
    for (const s of SWATCHES) {
      expect(hexes, `${s.name} (${s.hex}) is not a --swatch-* token`).toContain(s.hex);
    }
  });
});

describe('normalizeHex', () => {
  it('lowercases and prefixes a bare hex', () => {
    expect(normalizeHex('FF3B30')).toBe('#ff3b30');
    expect(normalizeHex('  #FF3B30 ')).toBe('#ff3b30');
  });
  it('rejects a value that is not a six-digit hex', () => {
    expect(normalizeHex('red')).toBeNull();
    expect(normalizeHex('#fff')).toBeNull();
  });
});

describe('colorName', () => {
  it('returns the preset name', () => {
    expect(colorName('#ff3b30')).toBe('Red');
  });
  it('describes a custom colour', () => {
    expect(colorName('#123456')).toBe('Custom color #123456');
  });
  it('returns the raw value when it is not a hex colour', () => {
    expect(colorName('rebeccapurple')).toBe('rebeccapurple');
  });
});

describe('pushRecent', () => {
  it('puts a custom colour at the front', () => {
    expect(pushRecent([], '#123456')).toEqual(['#123456']);
    expect(pushRecent(['#111111'], '#123456')).toEqual(['#123456', '#111111']);
  });

  it('drops a duplicate rather than repeating it', () => {
    expect(pushRecent(['#111111', '#123456'], '#123456')).toEqual(['#123456', '#111111']);
  });

  it('caps the list', () => {
    const full = ['#111111', '#222222', '#333333', '#444444', '#555555'];
    expect(pushRecent(full, '#666666')).toHaveLength(MAX_RECENT_COLORS);
    expect(pushRecent(full, '#666666')[0]).toBe('#666666');
  });

  it('returns the same list for a preset colour', () => {
    const list = ['#123456'];
    expect(pushRecent(list, '#ff3b30')).toBe(list);
  });

  it('returns the same list for a value that is not a hex colour', () => {
    const list = ['#123456'];
    expect(pushRecent(list, 'nope')).toBe(list);
  });
});
