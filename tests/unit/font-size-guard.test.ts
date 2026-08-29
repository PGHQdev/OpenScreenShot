import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Task 9 left 36 literal `font-size` declarations because the type scale had
 * no rung at several of the sizes in use; Task 11 (popup/setup/recorder) and
 * Task 21 (the editor's toolbar and style bar) retyped every one of them to
 * the nearest `var(--fs-*)` rung. Task 21's brief makes this permanent: after
 * it lands, a literal `font-size` anywhere under src/ is a review defect,
 * not a style preference. This is that rule turned into a build failure
 * instead of a comment someone has to remember, the same way
 * rule-guard.test.ts and breakpoint-guard.test.ts already do for --rule and
 * the breakpoint literals.
 *
 * Scoped to the `font-size` property itself, not the `font` shorthand — see
 * task-21-report.md for the one shorthand use this does not (and, per the
 * task's own fact-finding, was never meant to) catch.
 */
function cssFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...cssFiles(path));
    else if (entry.name.endsWith('.css')) out.push(path);
  }
  return out;
}

const FONT_SIZE = /font-size\s*:\s*([^;]+);/g;

/** Every font-size declaration in `css` whose value is not a var(--fs-*) reference. */
function literalFontSizes(css: string): string[] {
  return [...css.matchAll(FONT_SIZE)]
    .map((m) => m[1].trim())
    .filter((value) => !/^var\(--fs-[a-z0-9]+(-[a-z0-9]+)*\)$/.test(value));
}

describe('no literal font-size survives in src/**/*.css', () => {
  const files = cssFiles(join(process.cwd(), 'src'));

  it('finds stylesheets to check', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  for (const file of files) {
    it(`${file.replace(process.cwd() + '/', '')} only sets font-size from the type scale`, () => {
      const css = readFileSync(file, 'utf8');
      const offenders = literalFontSizes(css);
      expect(offenders, offenders.join(', ')).toEqual([]);
    });
  }
});

/**
 * The file-by-file loop above can only fail once a literal creeps back in —
 * it cannot itself prove the detector still works. These synthetic cases
 * pin the matcher down directly, the same shape as rule-guard.test.ts's
 * shouldFlag/shouldNotFlag pair.
 */
describe('the pattern distinguishes a literal from a token reference', () => {
  const shouldFlag: [string, string][] = [
    ['a bare pixel value', '.x { font-size: 13px; }'],
    ['a unitless value', '.x { font-size: 16; }'],
    ['a value next to an unrelated var()', '.x { font-size: 13px; color: var(--fs-sm); }'],
  ];
  for (const [label, css] of shouldFlag) {
    it(`flags ${label}`, () => {
      expect(literalFontSizes(css)).not.toEqual([]);
    });
  }

  const shouldNotFlag: [string, string][] = [
    ['a plain --fs-* token reference', '.x { font-size: var(--fs-sm); }'],
    ['a hyphenated --fs-* token reference', '.x { font-size: var(--fs-2xl); }'],
    ['font-size absent altogether', '.x { color: red; }'],
  ];
  for (const [label, css] of shouldNotFlag) {
    it(`does not flag ${label}`, () => {
      expect(literalFontSizes(css)).toEqual([]);
    });
  }
});
