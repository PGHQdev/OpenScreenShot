import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import ts from 'typescript';

/**
 * Every `t('id')` in src/editor/ must name a real key in
 * public/_locales/en/messages.json.
 *
 * `src/editor/i18n.ts` is `chrome.i18n.getMessage(id, subs) ?? id`. Real
 * Chrome answers an unknown key with `''`, not `null`, so the `?? id`
 * fallback never fires and a typo'd key renders as an empty label in the
 * shipped extension. Every stub in the suite is more permissive in exactly
 * that direction — `i18n-stub-setup.ts`, and each browser smoke's own
 * `getMessage`, all return the key when the entry is missing — so a missing
 * key renders as a visible non-empty string under test and as nothing at all
 * in production. Any assertion of the form "this control has a name" passes
 * either way; only a comparison against `messages.someKey.message` catches
 * it, and those exist for a subset. This closes the rest.
 *
 * This is the complementary half of editor-no-hardcoded-literals.test.ts,
 * which proves the strings go *through* `t()`; the same TypeScript AST walk,
 * for the same reason (a regex cannot tell `t('editorFoo')` from `t.foo` or
 * from the word inside a comment).
 *
 * What it cannot see:
 *  - an id built at runtime rather than written as a literal. There are two
 *    in the codebase, both outside src/editor/: `src/popup/App.tsx:1021` and
 *    `:1037` concatenate (`t('theme' + v.charAt(0).toUpperCase() + ...)`).
 *    No static check of this shape can follow those; they need a test that
 *    enumerates the values, or ids spelled out at the call site.
 *  - a `t()` re-exported or aliased under another name — the scan keys off
 *    the callee being the identifier `t`, which is how every editor module
 *    imports it.
 *  - a key that exists but whose placeholders do not match the substitutions
 *    passed. Arity is a different check and is not attempted here.
 */

const EDITOR_DIR = join(process.cwd(), 'src/editor');
const MESSAGES_FILE = join(process.cwd(), 'public/_locales/en/messages.json');

interface Reference {
  file: string;
  line: number;
  id: string;
}

function tsFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...tsFiles(path));
    else if (/\.(ts|tsx)$/.test(entry.name)) out.push(path);
  }
  return out;
}

/** Every string-literal first argument to a `t(...)` call in `file`. */
function collectIds(file: string): Reference[] {
  const text = readFileSync(file, 'utf8');
  const source = ts.createSourceFile(
    file,
    text,
    ts.ScriptTarget.Latest,
    true,
    file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const rel = relative(process.cwd(), file);
  const out: Reference[] = [];

  function visit(node: ts.Node): void {
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === 't' &&
      node.arguments.length > 0
    ) {
      const arg = node.arguments[0];
      // A no-substitution template is the same literal spelled with
      // backticks; anything else is computed and out of this check's reach.
      if (ts.isStringLiteral(arg) || ts.isNoSubstitutionTemplateLiteral(arg)) {
        const { line } = source.getLineAndCharacterOfPosition(node.getStart());
        out.push({ file: rel, line: line + 1, id: arg.text });
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  return out;
}

describe('every t() id in src/editor/ resolves to a key Chrome can answer', () => {
  const messages = JSON.parse(readFileSync(MESSAGES_FILE, 'utf8')) as Record<string, unknown>;
  const files = tsFiles(EDITOR_DIR);
  const references = files.flatMap(collectIds);

  it('finds editor source files to check', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  // A scan that silently stopped matching would report zero missing keys and
  // read as a pass, so the reference count is asserted too.
  it('finds t() calls to check', () => {
    expect(references.length).toBeGreaterThan(100);
  });

  it('names only keys that exist in public/_locales/en/messages.json', () => {
    const missing = references.filter((ref) => !(ref.id in messages));
    const report = missing
      .map((m) => `  ${m.file}:${m.line} t('${m.id}') has no message`)
      .join('\n');
    expect(missing, report).toEqual([]);
  });
});
