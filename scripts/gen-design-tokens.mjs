/**
 * Generate src/shared/design-tokens.ts from src/shared/tokens.css.
 *
 * tokens.css is the single source of truth. Canvas code cannot read a CSS
 * custom property off an offscreen 2D context, so it imports the generated
 * constants instead of hardcoding hex.
 *
 * The CSS marks each block the generator may read with a `@tokens <group>`
 * comment. Anything the generator does not understand — an unknown group, a
 * custom property outside a marked block, a token present in one theme but not
 * the other — throws instead of emitting a partial file.
 *
 * Usage:
 *   node scripts/gen-design-tokens.mjs           write the module
 *   node scripts/gen-design-tokens.mjs --check   exit 1 when it would change
 */
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import prettier from 'prettier';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CSS_PATH = path.join(ROOT, 'src/shared/tokens.css');
const TS_PATH = path.join(ROOT, 'src/shared/design-tokens.ts');
const GROUPS = ['base', 'light', 'dark'];

class TokenError extends Error {}

/** Line number (1-based) of `offset` in `text`, for error messages. */
function lineAt(text, offset) {
  let line = 1;
  for (let i = 0; i < offset && i < text.length; i++) if (text[i] === '\n') line++;
  return line;
}

/**
 * Blank out every comment, keeping newlines so offsets still map to the right
 * source line, and note where each `@tokens <group>` marker sat.
 */
function stripComments(css) {
  let out = '';
  const markers = [];
  for (let i = 0; i < css.length;) {
    const ch = css[i];
    if (ch === '/' && css[i + 1] === '*') {
      const end = css.indexOf('*/', i + 2);
      if (end === -1) throw new TokenError(`unterminated comment at line ${lineAt(css, i)}`);
      const body = css.slice(i + 2, end);
      const marker = /^\s*@tokens\s+([a-z]+)\s*$/.exec(body);
      if (marker) markers.push({ at: out.length, group: marker[1], source: i });
      out += ' ';
      out += '\n'.repeat((body.match(/\n/g) ?? []).length);
      i = end + 2;
      continue;
    }
    if (ch === "'" || ch === '"') {
      const end = css.indexOf(ch, i + 1);
      if (end === -1) throw new TokenError(`unterminated string at line ${lineAt(css, i)}`);
      out += css.slice(i, end + 1);
      i = end + 1;
      continue;
    }
    out += ch;
    i++;
  }
  return { clean: out, markers };
}

/** Split a block body into `;`-separated declarations, ignoring `;` inside parens. */
function splitDeclarations(body, offset, css) {
  const parts = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (ch === '(') depth++;
    else if (ch === ')') depth--;
    else if (ch === ';' && depth === 0) {
      parts.push({ text: body.slice(start, i), at: offset + start });
      start = i + 1;
    }
  }
  const tail = body.slice(start);
  if (tail.trim()) parts.push({ text: tail, at: offset + start });
  if (depth !== 0) throw new TokenError(`unbalanced parentheses at line ${lineAt(css, offset)}`);
  return parts;
}

/**
 * Parse tokens.css into { base, light, dark }, each an ordered [name, value] list.
 * Throws on anything it cannot account for.
 */
export function parseTokens(css) {
  const { clean, markers } = stripComments(css);
  const groups = new Map();
  /** Blocks are scanned depth-first so a nested rule inside `@media` is checked too. */
  const scan = (from, to) => {
    let i = from;
    let preludeStart = from;
    while (i < to) {
      const ch = clean[i];
      if (ch === '{') {
        const marks = markers.filter((m) => m.at >= preludeStart && m.at < i);
        if (marks.length > 1) throw new TokenError(`two @tokens markers on one block`);
        const name = marks[0]?.group;
        if (name && !GROUPS.includes(name)) {
          throw new TokenError(
            `unknown @tokens group "${name}" at line ${lineAt(css, marks[0].source)}`,
          );
        }
        const end = matchBrace(clean, i, css);
        const body = clean.slice(i + 1, end);
        if (body.includes('{')) {
          if (name) throw new TokenError(`@tokens block at line ${lineAt(css, i)} is not a rule`);
          scan(i + 1, end);
        } else {
          readBlock(body, i + 1, name, css, groups);
        }
        i = end + 1;
        preludeStart = i;
        continue;
      }
      if (ch === '}') throw new TokenError(`stray "}" at line ${lineAt(css, i)}`);
      i++;
    }
    if (markers.some((m) => m.at >= preludeStart && m.at < to)) {
      throw new TokenError(`@tokens marker with no block after it`);
    }
  };
  scan(0, clean.length);

  for (const g of GROUPS) {
    if (!groups.has(g)) throw new TokenError(`tokens.css has no "@tokens ${g}" block`);
  }
  const light = groups.get('light');
  const dark = groups.get('dark');
  const lightNames = light.map(([n]) => n);
  const darkNames = dark.map(([n]) => n);
  const missing = [
    ...lightNames.filter((n) => !darkNames.includes(n)).map((n) => `${n} (dark)`),
    ...darkNames.filter((n) => !lightNames.includes(n)).map((n) => `${n} (light)`),
  ];
  if (missing.length) throw new TokenError(`theme blocks disagree, missing: ${missing.join(', ')}`);

  return { base: groups.get('base'), light, dark };
}

function matchBrace(clean, open, css) {
  let depth = 0;
  for (let i = open; i < clean.length; i++) {
    if (clean[i] === '{') depth++;
    else if (clean[i] === '}') {
      depth--;
      if (depth === 0) return i;
    }
  }
  throw new TokenError(`unclosed "{" at line ${lineAt(css, open)}`);
}

function readBlock(body, offset, group, css, groups) {
  const decls = [];
  for (const { text, at } of splitDeclarations(body, offset, css)) {
    const trimmed = text.trim();
    if (!trimmed) continue;
    const custom = /^(--[a-z0-9-]*)\s*:\s*([\s\S]+)$/.exec(trimmed);
    if (!custom) {
      if (trimmed.startsWith('--')) {
        throw new TokenError(`malformed custom property at line ${lineAt(css, at)}: ${trimmed}`);
      }
      if (!/^[a-z-]+\s*:\s*[\s\S]+$/.test(trimmed)) {
        throw new TokenError(`unparsable declaration at line ${lineAt(css, at)}: ${trimmed}`);
      }
      continue;
    }
    if (!group) {
      throw new TokenError(
        `custom property ${custom[1]} at line ${lineAt(css, at)} is outside an @tokens block`,
      );
    }
    if (!/^--[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(custom[1])) {
      throw new TokenError(`token name ${custom[1]} at line ${lineAt(css, at)} is not kebab-case`);
    }
    decls.push([custom[1], custom[2].replace(/\s+/g, ' ').trim()]);
  }
  if (!group) return;
  const existing = groups.get(group);
  if (!existing) {
    groups.set(group, decls);
    return;
  }
  // A group may repeat — tokens.css uses this for the prefers-color-scheme
  // fallback, which needs the dark values a second time under an @media
  // guard. Repeats must reproduce the first occurrence exactly, name for
  // name and value for value, so two physical copies can never drift: a
  // changed, added, or dropped token in one place fails the build.
  const first = new Map(existing);
  const repeat = new Map(decls);
  for (const name of new Set([...first.keys(), ...repeat.keys()])) {
    if (first.get(name) !== repeat.get(name)) {
      throw new TokenError(
        `"@tokens ${group}" blocks disagree at line ${lineAt(css, offset)}: ${name} is ` +
          `${JSON.stringify(first.get(name) ?? null)} vs ${JSON.stringify(repeat.get(name) ?? null)}`,
      );
    }
  }
}

/** `--accent-ink` -> `accentInk`, `--s-05` -> `s05`. */
export function jsKey(cssName) {
  const [head, ...rest] = cssName.slice(2).split('-');
  return head + rest.map((p) => p[0].toUpperCase() + p.slice(1)).join('');
}

function entries(list, where) {
  const seen = new Map();
  return list
    .map(([name, value]) => {
      const key = jsKey(name);
      const clash = seen.get(key);
      if (clash) throw new TokenError(`${where}: ${name} and ${clash} both map to "${key}"`);
      seen.set(key, name);
      return `  ${key}: ${JSON.stringify(value)},`;
    })
    .join('\n');
}

export function renderModule({ base, light, dark }) {
  return `/**
 * Design tokens for canvas code, GENERATED from src/shared/tokens.css.
 *
 * Do not edit by hand: run \`npm run tokens\` (\`npm run build\` runs it too).
 * tests/unit/design-tokens.test.ts fails when this file drifts from the CSS.
 *
 * Stylesheets read the custom properties directly; only code that paints to a
 * canvas — where no custom property resolves — imports from here.
 */

/** Tokens that do not change with the theme (the \`@tokens base\` block). */
export const tokens = {
${entries(base, 'base')}
} as const;

/** Tokens that change with the theme (the \`@tokens light\`/\`dark\` blocks). */
export const theme = {
  light: {
${entries(light, 'light').replace(/^/gm, '  ')}
  },
  dark: {
${entries(dark, 'dark').replace(/^/gm, '  ')}
  },
} as const;
`;
}

/** The formatted module text for the current tokens.css. */
export async function buildModule() {
  const css = await readFile(CSS_PATH, 'utf8');
  const source = renderModule(parseTokens(css));
  const config = (await prettier.resolveConfig(TS_PATH)) ?? {};
  return prettier.format(source, { ...config, filepath: TS_PATH });
}

async function main() {
  const check = process.argv.includes('--check');
  let next;
  try {
    next = await buildModule();
  } catch (err) {
    if (err instanceof TokenError) {
      console.error(`tokens.css: ${err.message}`);
      process.exitCode = 1;
      return;
    }
    throw err;
  }
  const current = await readFile(TS_PATH, 'utf8').catch(() => null);
  if (current === next) return;
  if (check) {
    console.error(
      'src/shared/design-tokens.ts is stale. Run `npm run tokens` and commit the result.',
    );
    process.exitCode = 1;
    return;
  }
  await writeFile(TS_PATH, next);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
