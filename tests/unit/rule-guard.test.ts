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

const BORDER_OR_OUTLINE = /(?:^|[^-\w])(border(?:-(?:top|right|bottom|left))?|outline)\s*:[^;]*;/g;

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
