import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Task 9 left 36 literal `font-size` declarations because the type scale had
 * no rung at several of the sizes in use; Task 11 (popup/setup/recorder) and
 * Task 21 (the editor's toolbar and style bar) retyped every one of them to
 * the nearest `var(--fs-*)` rung. Task 21's brief makes this permanent: after
 * it lands, a literal font size anywhere under src/ is a review defect, not
 * a style preference. This is that rule turned into a build failure instead
 * of a comment someone has to remember, the same way rule-guard.test.ts and
 * breakpoint-guard.test.ts already do for --rule and the breakpoint
 * literals.
 *
 * Covers two shapes a literal size can take:
 *   - the `font-size` property directly.
 *   - the `font` shorthand's size component (`font: <weight> <size>[/<line-height>] <family>;`),
 *     found by Task 21's reviewer sitting live in webcam-frame.css and
 *     retyped in the same pass this guard landed in.
 *
 * The shorthand detector is a heuristic, not a full CSS grammar parser: it
 * scans the shorthand's space-separated tokens for one shaped like a literal
 * length, optionally carrying a `/<line-height>` suffix (the only way the
 * spec allows line-height into this shorthand — always attached to size
 * with no space, never its own token) — style/variant/weight/stretch
 * keywords and the family list never take that shape, so this reliably
 * finds the size token without needing to parse shorthand order. What it
 * deliberately does not attempt: a size expressed as a bare keyword
 * (`font: bold small sans-serif;` — no digits, so nothing here to retype
 * into a token) and `calc()`/`clamp()`-wrapped sizes (no literal codebase
 * instance of either as of this task; add a case here first if one shows up).
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
// (?:^|[^-\w]) keeps this off font-family/font-weight/font-style/font-variant/
// font-stretch/font-size — none of those have a bare ":" straight after "font",
// so in practice the prefix guard is redundant with \s*: below, but it matches
// the defensive style rule-guard.test.ts's BORDER_OR_OUTLINE already uses.
const FONT_SHORTHAND = /(?:^|[^-\w])font\s*:\s*([^;]+);/g;
const SHORTHAND_SIZE_TOKEN =
  /^[\d.]+(?:px|pt|pc|in|cm|mm|q|em|rem|%|ex|ch|vw|vh|vmin|vmax)(?:\/.+)?$/i;

/** Every font-size declaration in `css` whose value is not a var(--fs-*) reference. */
function literalFontSizes(css: string): string[] {
  return [...css.matchAll(FONT_SIZE)]
    .map((m) => m[1].trim())
    .filter((value) => !/^var\(--fs-[a-z0-9]+(-[a-z0-9]+)*\)$/.test(value));
}

/** Every `font` shorthand declaration in `css` whose size token is a literal length. */
function literalFontShorthandSizes(css: string): string[] {
  const out: string[] = [];
  for (const m of css.matchAll(FONT_SHORTHAND)) {
    const value = m[1].trim();
    const literalToken = value.split(/\s+/).find((token) => SHORTHAND_SIZE_TOKEN.test(token));
    if (literalToken) out.push(`${value} (${literalToken})`);
  }
  return out;
}

describe('no literal font size survives in src/**/*.css', () => {
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

    it(`${file.replace(process.cwd() + '/', '')} carries no literal size in a font shorthand`, () => {
      const css = readFileSync(file, 'utf8');
      const offenders = literalFontShorthandSizes(css);
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
describe('the font-size pattern distinguishes a literal from a token reference', () => {
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

describe('the font-shorthand pattern catches a literal size hiding in `font:`', () => {
  const shouldFlag: [string, string][] = [
    [
      'the exact webcam-frame.css shape this guard was written for',
      '.x { font: 500 12px/1.35 var(--font); }',
    ],
    ['a minimal weightless shorthand', '.x { font: 13px/1.4 system-ui; }'],
    ['a size with no line-height', '.x { font: bold 14px sans-serif; }'],
  ];
  for (const [label, css] of shouldFlag) {
    it(`flags ${label}`, () => {
      expect(literalFontShorthandSizes(css)).not.toEqual([]);
    });
  }

  const shouldNotFlag: [string, string][] = [
    ['a token size in the shorthand', '.x { font: 500 var(--fs-sm)/1.35 var(--font); }'],
    ['the global keyword form', '.x { font: inherit; }'],
    ['font-family alone (not the shorthand)', ".x { font-family: 'Inter', sans-serif; }"],
    [
      'font-size alone (not the shorthand — covered by the other describe block)',
      '.x { font-size: 13px; }',
    ],
    ['font absent altogether', '.x { color: red; }'],
  ];
  for (const [label, css] of shouldNotFlag) {
    it(`does not flag ${label}`, () => {
      expect(literalFontShorthandSizes(css)).toEqual([]);
    });
  }
});
