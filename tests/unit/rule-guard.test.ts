import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

/**
 * `--rule` is a decorative hairline that sits below 3:1 (tokens.css); `--border`
 * is the >= 3:1 control edge. Nothing separates them but prose, and Part A
 * (Task 9) shipped exactly this mistake — a `--rule` used as a control's border.
 * This walks every stylesheet and fails if `--rule` ever reaches a
 * border/outline property, the one place its contrast is not enough.
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

// Covers both the shorthand (`border: 1px solid var(--rule)`) and the
// longhand colour properties (`border-color`, `border-top-color`, ...,
// `outline-color`) that can carry the same mistake without ever writing the
// word "border" or "outline" as a bare property. Width/style longhands
// (`border-width`, `outline-style`, ...) are left out on purpose: `--rule` is
// a colour token, so it could never legitimately (or dangerously) land there.
const BORDER_OR_OUTLINE =
  /(?:^|[^-\w])(border(?:-(?:top|right|bottom|left))?(?:-color)?|outline(?:-color)?)\s*:[^;]*;/g;

describe('--rule never draws a border or outline', () => {
  const files = cssFiles(join(process.cwd(), 'src'));

  it('finds stylesheets to check', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  for (const file of files) {
    it(`${file.replace(process.cwd() + '/', '')} keeps --rule out of border/outline`, () => {
      const css = readFileSync(file, 'utf8');
      const offenders = [...css.matchAll(BORDER_OR_OUTLINE)]
        .map((m) => m[0].trim())
        .filter((decl) => decl.includes('var(--rule)'));
      expect(offenders, offenders.join('\n')).toEqual([]);
    });
  }
});

/**
 * The property list above used to be just `border(-top/right/bottom/left)?`
 * and `outline` — it missed every longhand colour property, so
 * `border-color: var(--rule);` shipped undetected. None of the real
 * stylesheets happen to use that form today, so the file-by-file tests above
 * can't exercise this path; these synthetic cases pin it down directly.
 */
describe('the pattern also catches the longhand colour properties', () => {
  const offendersIn = (css: string) =>
    [...css.matchAll(BORDER_OR_OUTLINE)]
      .map((m) => m[0].trim())
      .filter((decl) => decl.includes('var(--rule)'));

  const shouldFlag: [string, string][] = [
    ['shorthand', '.x { border: 1px solid var(--rule); }'],
    ['a side shorthand', '.x { border-top: 1px solid var(--rule); }'],
    ['the longhand colour property', '.x { border-color: var(--rule); }'],
    ['a side longhand colour property', '.x { border-top-color: var(--rule); }'],
    ['outline', '.x { outline: 1px solid var(--rule); }'],
    ['outline-color', '.x { outline-color: var(--rule); }'],
  ];
  for (const [label, css] of shouldFlag) {
    it(`flags --rule in ${label}`, () => {
      expect(offendersIn(css)).not.toEqual([]);
    });
  }

  const shouldNotFlag: [string, string][] = [
    ['border-radius — a length property, not a colour one', '.x { border-radius: var(--rule); }'],
    ['border-collapse — not a colour property', '.x { border-collapse: collapse; }'],
    ['outline-offset — not a colour property', '.x { outline-offset: 2px; }'],
    ['--rule used as an ordinary text colour', '.x { color: var(--rule); }'],
  ];
  for (const [label, css] of shouldNotFlag) {
    it(`does not flag ${label}`, () => {
      expect(offendersIn(css)).toEqual([]);
    });
  }
});
