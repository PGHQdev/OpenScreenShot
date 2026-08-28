import { describe, it, expect } from 'vitest';
import { resolveTheme } from '../../src/shared/theme';

/**
 * The full resolution table: stored setting x OS preference -> applied
 * theme. "system" is the only preference the OS can sway; "light" and "dark"
 * are absolute and must ignore prefersDark either way.
 */
describe('resolveTheme', () => {
  const cases: Array<{
    pref: 'light' | 'dark' | 'system';
    prefersDark: boolean;
    want: 'light' | 'dark';
  }> = [
    { pref: 'light', prefersDark: false, want: 'light' },
    { pref: 'light', prefersDark: true, want: 'light' },
    { pref: 'dark', prefersDark: false, want: 'dark' },
    { pref: 'dark', prefersDark: true, want: 'dark' },
    { pref: 'system', prefersDark: false, want: 'light' },
    { pref: 'system', prefersDark: true, want: 'dark' },
  ];

  for (const { pref, prefersDark, want } of cases) {
    it(`${pref} pref, OS prefersDark=${prefersDark} -> ${want}`, () => {
      expect(resolveTheme(pref, prefersDark)).toBe(want);
    });
  }
});
