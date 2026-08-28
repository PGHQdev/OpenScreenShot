import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Every native `<input type="range">` under src/** must carry an accessible
 * name — either an `aria-label`/`aria-labelledby` on the input itself, or an
 * `id` the input declares that some `<label for="...">` in the same file
 * points at (the editor's export-dialog Quality slider is the one control
 * that already does this). Task 18 fixed eleven of the twelve range inputs in
 * the extension that had neither; this walks the source tree and fails if a
 * range input regresses back to having no name.
 */
function tsxFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...tsxFiles(path));
    else if (entry.name.endsWith('.tsx')) out.push(path);
  }
  return out;
}

/**
 * Pulls every self-closing `<input ... />` tag out of a JSX source file.
 * A plain regex can't find the tag's end reliably: attribute values commonly
 * hold `{(e) => ...}` handlers, and the `=>` arrow contains a bare `>` that
 * would end the match early. This walks characters instead, tracking brace
 * depth (for `{...}` expression containers) and quote state, and only treats
 * `/>` as the tag's end while depth is 0 and no quote is open.
 */
function extractInputTags(src: string): string[] {
  const tags: string[] = [];
  let i = 0;
  while (i < src.length) {
    const start = src.indexOf('<input', i);
    if (start === -1) break;
    let j = start + '<input'.length;
    let depth = 0;
    let quote: string | null = null;
    while (j < src.length) {
      const c = src[j];
      if (quote) {
        if (c === quote && src[j - 1] !== '\\') quote = null;
      } else if (c === '"' || c === "'" || c === '`') {
        quote = c;
      } else if (c === '{') {
        depth++;
      } else if (c === '}') {
        depth--;
      } else if (depth === 0 && c === '/' && src[j + 1] === '>') {
        j += 2;
        break;
      }
      j++;
    }
    tags.push(src.slice(start, j));
    i = j;
  }
  return tags;
}

/** True when the tag's `id` is targeted by a `for="id"` (or `htmlFor="id"`) elsewhere in the file. */
function namedByLabelFor(tag: string, src: string): boolean {
  const idMatch = /\bid="([^"]+)"/.exec(tag);
  if (!idMatch) return false;
  const id = idMatch[1];
  const forAttr = new RegExp(`\\b(?:for|htmlFor)="${id}"`);
  return forAttr.test(src);
}

describe('every <input type="range"> has an accessible name', () => {
  const files = tsxFiles(join(process.cwd(), 'src'));

  it('finds .tsx files to check', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it('finds at least one range input across the extension', () => {
    const total = files.reduce((n, f) => {
      const src = readFileSync(f, 'utf8');
      return n + extractInputTags(src).filter((t) => /type="range"/.test(t)).length;
    }, 0);
    expect(total).toBeGreaterThan(0);
  });

  for (const file of files) {
    it(`${file.replace(process.cwd() + '/', '')} names every range input`, () => {
      const src = readFileSync(file, 'utf8');
      const rangeInputs = extractInputTags(src).filter((t) => /type="range"/.test(t));
      const unnamed = rangeInputs.filter(
        (tag) => !/\baria-label(?:ledby)?=/.test(tag) && !namedByLabelFor(tag, src),
      );
      expect(unnamed, unnamed.join('\n---\n')).toEqual([]);
    });
  }
});
