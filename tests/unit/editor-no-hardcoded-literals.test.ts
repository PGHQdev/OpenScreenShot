import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
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
 *    reachable (through ternaries, `??`, etc., but not through a nested
 *    `t(...)` call — that's the sanctioned escape hatch) from the value of
 *    an aria-label / title / placeholder / alt / aria-valuetext /
 *    aria-description JSX attribute, once its literal (non-substitution)
 *    text is checked against the UNIT allowlist below;
 *  - the same, as the first argument to a call named setStageNotice or
 *    setError (the two "notice" setters user-visible errors and stage
 *    notices flow through).
 *
 * What it does NOT see, by design or by limitation:
 *  - any string literal that is not itself a JSX text child, the value of a
 *    checked JSX attribute, or the first argument to setStageNotice/
 *    setError — an object/array literal property (tools.ts's TOOL_LIST.label,
 *    export.ts's IMAGE_FORMATS.label/hint, frame.ts's BACKGROUND_PRESETS/
 *    FRAME_LOOKS label/hint, palette.ts's SWATCHES.name, ShortcutSheet.tsx's
 *    buildCommands() label, App.tsx's BLUR_MODES/SPOTLIGHT_SHAPES label/hint)
 *    or a plain function return/const (capture-label.ts's labelForSource(),
 *    import-image.ts's importSizeError(), pin.ts's PIN_WINDOW_TITLE and
 *    friends) is invisible to it at its own source line. Every one of these
 *    is already migrated behind t() and rendered into a checked JSX text
 *    node or attribute downstream, so a regression there is still caught —
 *    just one hop away from where it was introduced.
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

const NOTICE_CALLS = new Set(['setStageNotice', 'setError']);

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

function checkFile(file: string): Offense[] {
  const text = readFileSync(file, 'utf8');
  const source = ts.createSourceFile(
    file,
    text,
    ts.ScriptTarget.Latest,
    true,
    file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
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
    } else if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      NOTICE_CALLS.has(node.expression.text) &&
      node.arguments.length > 0
    ) {
      const offense = findLiteralOffense(node.arguments[0]);
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
    it(`${rel} has no hard-coded JSX text, checked attribute, or notice string`, () => {
      const offenses = checkFile(file);
      const report = offenses
        .map((o) => `  ${o.file}:${o.line} [${o.kind}] ${JSON.stringify(o.text)}`)
        .join('\n');
      expect(offenses, report).toEqual([]);
    });
  }
});
