import { describe, it, expect } from 'vitest';
import {
  COLOR_NAMES,
  COLOR_PALETTE,
  MAX_RECENT_COLORS,
  colorName,
  normalizeHex,
  pushRecent,
} from '../../src/editor/palette';

describe('COLOR_NAMES', () => {
  it('names every preset swatch', () => {
    for (const hex of COLOR_PALETTE) {
      expect(COLOR_NAMES[hex]).toBeTypeOf('string');
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
