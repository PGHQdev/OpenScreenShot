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

const MEDIA_PRELUDE = /@media([^{]*)\{/g;
const WIDTH_IN_PRELUDE = /\b(?:min|max)-width\s*:\s*([0-9.]+)px/g;

/**
 * Every min/max-width px value in any @media prelude in `css`. A single
 * regex spanning "@media ... width: Npx" (this file's original shape)
 * only captures the LAST width in a prelude that combines min-width and
 * max-width — an "@media (min-width: 600px) and (max-width: 900px)" range
 * query — because the greedy `[^{]*` backtracks to the rightmost position
 * that still matches, silently swallowing the first width into it. No
 * stylesheet here currently writes a combined range query, so this was
 * unexploited, but it would have let a non-canonical width through
 * undetected, or an actually-used breakpoint read as unused. Scoping the
 * width regex to each prelude's own substring instead finds every
 * occurrence, not just the last.
 */
function mediaWidths(css: string): number[] {
  const out: number[] = [];
  for (const prelude of css.matchAll(MEDIA_PRELUDE)) {
    for (const m of prelude[1].matchAll(WIDTH_IN_PRELUDE)) out.push(Number(m[1]));
  }
  return out;
}

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
      const offenders = mediaWidths(css).filter((px) => !BREAKPOINTS.has(px));
      expect(offenders, offenders.join(', ')).toEqual([]);
    });
  }

  it('every breakpoint is actually used by at least one stylesheet', () => {
    const css = files.map((f) => readFileSync(f, 'utf8')).join('\n');
    const used = new Set(mediaWidths(css));
    for (const bp of BREAKPOINTS) {
      expect(used.has(bp), `--bp token ${bp}px is declared but never used in a stylesheet`).toBe(
        true,
      );
    }
  });

  it('catches every width in a combined min/max-width range query, not just the last', () => {
    const [sm, md] = [...BREAKPOINTS].sort((a, b) => a - b);
    const combined = `@media (min-width: ${sm}px) and (max-width: ${md}px) { .x { color: red; } }`;
    expect(mediaWidths(combined)).toEqual([sm, md]);
  });
});
