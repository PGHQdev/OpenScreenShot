import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import ts from 'typescript';

/**
 * Task 42 (i18n the editor): every user-visible string in src/editor/ is
 * supposed to read through t() (src/editor/i18n.ts) into
 * public/_locales/en/messages.json, never as a literal baked into the
 * source. This walks the real TypeScript/JSX AST (regex cannot tell a JSX
 * text node from a class-name template) and fails on:
 *
 *  - a JSX text node that contains a letter, once whitespace-only children
 *    and the BRAND allowlist below are set aside;
 *  - a string literal, template literal, or no-substitution template
 *    reachable (through ternaries, but not through a nested `t(...)` call —
 *    that's the sanctioned escape hatch) from the value of an aria-label /
 *    title / placeholder / alt / aria-valuetext / aria-description JSX
 *    attribute, once its literal (non-substitution) text is checked against
 *    the UNIT allowlist below;
 *  - the same, as the value of a `label` / `hint` / `name` / `title` /
 *    `description` property in an object literal anywhere in the file (the
 *    shape tools.ts's TOOL_LIST, export.ts's IMAGE_FORMATS, frame.ts's
 *    BACKGROUND_PRESETS/FRAME_LOOKS, palette.ts's SWATCHES,
 *    ShortcutSheet.tsx's buildCommands(), and App.tsx's local BLUR_MODES/
 *    SPOTLIGHT_SHAPES all use) — checked at the declaration, not by trying
 *    to trace every `p.label`-style consumption site back to it;
 *  - the same, as the first argument to a call named setStageNotice,
 *    setError, setExportError, setWidthNotice, or setMarginNotice (the
 *    "notice" setters user-visible errors and stage/field notices flow
 *    through) — including one level of indirection through a named
 *    constant, whether declared in the same file or imported from another
 *    file in src/editor/ by a relative specifier (e.g.
 *    `setStageNotice(PIN_UNAVAILABLE_REASON)`, where PIN_UNAVAILABLE_REASON
 *    is declared in pin.ts).
 *
 * What it does NOT see, by design or by limitation:
 *  - a string reached through a property *access* rather than the property's
 *    own declaration — `{p.label}`, `title={l.hint}`, `` title={`${t.label}
 *    (${t.shortcut})`} `` and similar are never dereferenced back to
 *    TOOL_LIST/FRAME_LOOKS/etc.; the object/array-literal check above
 *    protects these by checking the *declaration* line instead (tools.ts,
 *    frame.ts, export.ts, ...), which is where a hard-coded revert would
 *    actually happen, but a string that reached a checked JSX attribute
 *    *only* via a property access with no matching declaration in this file
 *    is not covered by either check.
 *  - a plain function's return value that isn't a `label`/`hint`/`name`/
 *    `title`/`description` object property and isn't a notice-call argument
 *    or its one-hop constant — capture-label.ts's labelForSource(),
 *    import-image.ts's importSizeError() return a value through a switch/if,
 *    not a property or a tracked call, so they are not scanned directly
 *    (their call sites, if they ever feed a checked attribute or notice
 *    call as anything other than a bare identifier, are not resolved back
 *    either — only a *named constant* one hop away is followed, not an
 *    arbitrary function call's return).
 *  - a string built at runtime by concatenation, string methods, or a
 *    helper function's own return value (e.g. keyboard.ts's stepSize(),
 *    BeautifyMenu.tsx's local px()) — this is an AST check on literals, not
 *    a data-flow analysis, so a literal hidden a function call away from
 *    the JSX that renders it is invisible to it.
 *  - an English word smuggled into a t() call's *substitution* array
 *    (e.g. `t('editorFoo', ['Some Hardcoded Words'])`) — arguments to a
 *    `t(...)` call are deliberately never inspected, since the id argument
 *    itself is always a literal.
 *  - a string inside a `.css` file's `content:` property, or any file
 *    outside src/editor/ (annotations.ts's canvas font-family stack, e.g.,
 *    is a CSS value, not prose, and out of scope either way).
 */

const EDITOR_DIR = join(process.cwd(), 'src/editor');

// The product name — left untranslated everywhere else in the codebase too
// (see src/popup/App.tsx's own hard-coded "OpenScreenShot" brand-name span).
const BRAND_TEXT = new Set(['OpenScreenShot']);

// Letters that survive a unit suffix, once digits/punctuation/substitutions
// are stripped from a template's literal text — "40px", "8mm", "the $1–$2mm
// range" and so on carry no prose, only a measurement unit.
const UNIT_WORDS = new Set(['px', 'mm']);

// A JSX text node that needs no allowlist entry of its own: an HTML named
// entity used as decorative punctuation (a middle-dot/times separator, e.g.
// HistorySheet.tsx's row meta line), or a single capital letter — the same
// bare keyboard-shortcut glyph TOOL_LIST.shortcut and the shortcut sheet's
// `keys` column already carry untranslated (ZoomMenu.tsx's `<kbd>F</kbd>`).
function isAllowlistedJsxText(trimmed: string): boolean {
  return (
    BRAND_TEXT.has(trimmed) ||
    UNIT_WORDS.has(trimmed) ||
    /^&[a-zA-Z]+;$/.test(trimmed) ||
    /^[A-Z]$/.test(trimmed)
  );
}

const CHECKED_ATTRS = new Set([
  'aria-label',
  'title',
  'placeholder',
  'alt',
  'aria-valuetext',
  'aria-description',
]);

// The five notice setters user-visible text flows through. setStageNotice/
// setError cover the stage pill and the load-error overlay; the other three
// are the export dialog's own per-field notices (format/scale error, width
// clamp, PDF margin clamp) — same shape, same need for protection.
const NOTICE_CALLS = new Set([
  'setStageNotice',
  'setError',
  'setExportError',
  'setWidthNotice',
  'setMarginNotice',
]);

// Object/array-literal property names that carry user-visible text in this
// codebase's data-record shapes (TOOL_LIST, IMAGE_FORMATS, BACKGROUND_PRESETS,
// FRAME_LOOKS, SWATCHES, buildCommands(), BLUR_MODES, SPOTLIGHT_SHAPES). `id`,
// `keys`, `shortcut` and similar sibling fields are deliberately excluded —
// they hold format/tool ids and keyboard-shortcut glyphs, not prose (the same
// distinction CHECKED_ATTRS draws for JSX attributes).
const PROP_KEYS = new Set(['label', 'hint', 'name', 'title', 'description']);

interface Offense {
  file: string;
  line: number;
  kind: string;
  text: string;
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

/** Letters left in a template's literal (non-substitution) spans, ignoring an allowed unit suffix. */
function templateLiteralLetters(
  node: ts.TemplateExpression | ts.NoSubstitutionTemplateLiteral,
): string {
  const spans: string[] =
    node.kind === ts.SyntaxKind.NoSubstitutionTemplateLiteral
      ? [node.text]
      : [node.head.text, ...node.templateSpans.map((s) => s.literal.text)];
  const letters = spans
    .join('')
    .replace(/[0-9.,:;()°%·×–—_ -]/g, '')
    .trim();
  return UNIT_WORDS.has(letters) ? '' : letters;
}

/** Any letter-bearing string/template literal reachable from `node` without crossing into a `t(...)` call. */
function findLiteralOffense(node: ts.Node): { text: string } | null {
  if (
    ts.isCallExpression(node) &&
    ts.isIdentifier(node.expression) &&
    node.expression.text === 't'
  ) {
    return null; // sanctioned: the id/substitution args are not inspected.
  }
  if (ts.isStringLiteral(node) && /[A-Za-z]/.test(node.text)) {
    return { text: node.text };
  }
  // A ternary's *condition* is a comparison, not message text — only its two
  // branches can produce the value that ends up on screen (e.g. useEditor.ts
  // picking a message by `err.message === 'decode'`, a sentinel, not prose).
  if (ts.isConditionalExpression(node)) {
    return findLiteralOffense(node.whenTrue) ?? findLiteralOffense(node.whenFalse);
  }
  if (
    (ts.isTemplateExpression(node) || node.kind === ts.SyntaxKind.NoSubstitutionTemplateLiteral) &&
    // NoSubstitutionTemplateLiteral is also used for import specifiers etc.,
    // but never as an object/array element or JSX attribute value here — the
    // call sites below only reach it from expression positions.
    templateLiteralLetters(node as ts.TemplateExpression | ts.NoSubstitutionTemplateLiteral)
  ) {
    return { text: node.getText() };
  }
  let found: { text: string } | null = null;
  ts.forEachChild(node, (child) => {
    if (found) return;
    found = findLiteralOffense(child);
  });
  return found;
}

const sourceCache = new Map<string, ts.SourceFile>();
function loadSource(file: string): ts.SourceFile {
  let source = sourceCache.get(file);
  if (!source) {
    const text = readFileSync(file, 'utf8');
    source = ts.createSourceFile(
      file,
      text,
      ts.ScriptTarget.Latest,
      true,
      file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
    );
    sourceCache.set(file, source);
  }
  return source;
}

/** A relative import specifier resolved to the .ts/.tsx file it names, or null. */
function resolveModuleFile(fromFile: string, specifier: string): string | null {
  if (!specifier.startsWith('.')) return null; // only follow editor-local imports
  const base = join(dirname(fromFile), specifier);
  for (const ext of ['.ts', '.tsx']) {
    if (existsSync(base + ext)) return base + ext;
  }
  return null;
}

/**
 * `const NAME = <init>` at the top level of `file`, or — one hop — the same
 * in whatever relatively-imported file `NAME` is a named import from. This
 * is what lets `setStageNotice(PIN_UNAVAILABLE_REASON)` in useEditor.ts be
 * checked against PIN_UNAVAILABLE_REASON's actual declaration in pin.ts.
 */
function resolveIdentifierInitializer(
  file: string,
  name: string,
  seen: Set<string> = new Set(),
): ts.Expression | null {
  const key = `${file}#${name}`;
  if (seen.has(key)) return null; // import-cycle guard
  seen.add(key);
  const source = loadSource(file);

  for (const stmt of source.statements) {
    if (!ts.isVariableStatement(stmt)) continue;
    for (const decl of stmt.declarationList.declarations) {
      if (ts.isIdentifier(decl.name) && decl.name.text === name && decl.initializer) {
        return decl.initializer;
      }
    }
  }
  for (const stmt of source.statements) {
    if (!ts.isImportDeclaration(stmt) || !stmt.importClause?.namedBindings) continue;
    const bindings = stmt.importClause.namedBindings;
    if (!ts.isNamedImports(bindings)) continue;
    const match = bindings.elements.find((el) => (el.propertyName ?? el.name).text === name);
    if (!match || !ts.isStringLiteral(stmt.moduleSpecifier)) continue;
    const targetFile = resolveModuleFile(file, stmt.moduleSpecifier.text);
    if (!targetFile) return null;
    return resolveIdentifierInitializer(targetFile, match.name.text, seen);
  }
  return null;
}

function propKeyText(name: ts.PropertyName): string | null {
  if (ts.isIdentifier(name) || ts.isStringLiteral(name)) return name.text;
  return null;
}

function checkFile(file: string): Offense[] {
  const source = loadSource(file);
  const offenses: Offense[] = [];
  const lineOf = (pos: number) => source.getLineAndCharacterOfPosition(pos).line + 1;

  function visit(node: ts.Node) {
    if (ts.isJsxText(node)) {
      const trimmed = node.text.trim();
      if (trimmed && /[A-Za-z]/.test(trimmed) && !isAllowlistedJsxText(trimmed)) {
        offenses.push({ file, line: lineOf(node.getStart()), kind: 'jsx-text', text: trimmed });
      }
    } else if (ts.isJsxAttribute(node) && CHECKED_ATTRS.has(node.name.getText())) {
      if (node.initializer) {
        const offense = findLiteralOffense(node.initializer);
        if (offense) {
          offenses.push({
            file,
            line: lineOf(node.getStart()),
            kind: `attr:${node.name.getText()}`,
            text: offense.text,
          });
        }
      }
    } else if (ts.isPropertyAssignment(node)) {
      const key = propKeyText(node.name);
      if (key && PROP_KEYS.has(key)) {
        const offense = findLiteralOffense(node.initializer);
        if (offense) {
          offenses.push({
            file,
            line: lineOf(node.getStart()),
            kind: `prop:${key}`,
            text: offense.text,
          });
        }
      }
    } else if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      NOTICE_CALLS.has(node.expression.text) &&
      node.arguments.length > 0
    ) {
      const arg = node.arguments[0];
      let offense = findLiteralOffense(arg);
      if (!offense && ts.isIdentifier(arg)) {
        const init = resolveIdentifierInitializer(file, arg.text);
        if (init) offense = findLiteralOffense(init);
      }
      if (offense) {
        offenses.push({
          file,
          line: lineOf(node.getStart()),
          kind: `call:${node.expression.text}`,
          text: offense.text,
        });
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  return offenses;
}

describe('src/editor/ carries no hard-coded user-visible literal', () => {
  const files = tsFiles(EDITOR_DIR);

  it('finds editor source files to check', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  for (const file of files) {
    const rel = relative(process.cwd(), file);
    it(`${rel} has no hard-coded JSX text, checked attribute/property, or notice string`, () => {
      const offenses = checkFile(file);
      const report = offenses
        .map((o) => `  ${o.file}:${o.line} [${o.kind}] ${JSON.stringify(o.text)}`)
        .join('\n');
      expect(offenses, report).toEqual([]);
    });
  }
});
