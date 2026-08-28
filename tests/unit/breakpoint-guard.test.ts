import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { tokens } from '../../src/shared/design-tokens';

/**
 * A CSS custom property cannot appear in an @media condition —
 * "@media (max-width: var(--bp-sm))" is invalid and never matches — so
 * tokens.css's --bp-sm/--bp-md have no CSS caller. Every stylesheet spells
 * the pixel value out literally instead. This is what keeps those literals
 * from drifting: it reads the canonical numbers off the generated
 * design-tokens.ts (itself checked against tokens.css by
 * design-tokens.test.ts) and fails if any "@media (…width: …px)" in src/
 * uses a number that is not one of them.
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

const BREAKPOINTS = new Set(
  Object.entries(tokens)
    .filter(([name]) => name.startsWith('bp'))
    .map(([, value]) => Number(String(value).replace('px', ''))),
);

const MEDIA_WIDTH = /@media[^{]*\b(?:min|max)-width\s*:\s*([0-9.]+)px/g;

describe('stylesheet @media widths match the tokens.css breakpoints', () => {
  const files = cssFiles(join(process.cwd(), 'src'));

  it('finds stylesheets to check', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it('tokens.css declares at least one breakpoint', () => {
    expect(BREAKPOINTS.size).toBeGreaterThan(0);
  });

  for (const file of files) {
    it(`${file.replace(process.cwd() + '/', '')} only uses canonical breakpoint widths`, () => {
      const css = readFileSync(file, 'utf8');
      const offenders = [...css.matchAll(MEDIA_WIDTH)]
        .map((m) => Number(m[1]))
        .filter((px) => !BREAKPOINTS.has(px));
      expect(offenders, offenders.join(', ')).toEqual([]);
    });
  }

  it('every breakpoint is actually used by at least one stylesheet', () => {
    const css = files.map((f) => readFileSync(f, 'utf8')).join('\n');
    const used = new Set([...css.matchAll(MEDIA_WIDTH)].map((m) => Number(m[1])));
    for (const bp of BREAKPOINTS) {
      expect(used.has(bp), `--bp token ${bp}px is declared but never used in a stylesheet`).toBe(
        true,
      );
    }
  });
});
