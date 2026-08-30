import { describe, it, expect } from 'vitest';
import { parseTokens } from '../../scripts/gen-design-tokens.mjs';

/**
 * tokens.css repeats the @tokens dark block once more, guarded under
 * @media (prefers-color-scheme: dark), so the OS preference applies the dark
 * palette without JS (see src/shared/tokens.css). A repeat group is only
 * safe because parseTokens requires every repeat to match the first
 * occurrence name-for-name and value-for-value — this is what enforces that.
 */
describe('parseTokens — repeated @tokens groups', () => {
  const base = `
    /* @tokens base */
    :root { --s-1: 4px; }
    /* @tokens light */
    :root { --a: 1px; }
  `;

  it('accepts a repeat of "dark" that matches the first occurrence exactly', () => {
    const css = `${base}
      /* @tokens dark */
      :root[data-theme='dark'] { --a: 2px; }
      @media (prefers-color-scheme: dark) {
        /* @tokens dark */
        :root:not([data-theme='light']) { --a: 2px; }
      }
    `;
    const { dark } = parseTokens(css);
    expect(dark).toEqual([['--a', '2px']]);
  });

  it('throws when a repeat of "dark" disagrees with the first occurrence', () => {
    const css = `${base}
      /* @tokens dark */
      :root[data-theme='dark'] { --a: 2px; }
      @media (prefers-color-scheme: dark) {
        /* @tokens dark */
        :root:not([data-theme='light']) { --a: 3px; }
      }
    `;
    expect(() => parseTokens(css)).toThrow(/"@tokens dark" blocks disagree.*--a/);
  });

  it('throws when a repeat of "dark" drops a token the first occurrence declared', () => {
    const css = `${base}
      /* @tokens dark */
      :root[data-theme='dark'] { --a: 2px; --b: 5px; }
      @media (prefers-color-scheme: dark) {
        /* @tokens dark */
        :root:not([data-theme='light']) { --a: 2px; }
      }
    `;
    expect(() => parseTokens(css)).toThrow(/"@tokens dark" blocks disagree.*--b/);
  });
});
