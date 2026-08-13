# OpenScreenShot UI/UX Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove UI defects, duplicated controls, and dead surface area from the OpenScreenShot popup, settings view, and editor without changing capture, export, or annotation behaviour.

**Architecture:** Each surface keeps its current shape — a Preact component tree per surface, shared design tokens, and a shared storage layer. Logic that needs a test moves into a small pure module (`src/shared/shortcuts.ts`, `src/editor/viewport.ts`, `src/editor/stylebar.ts`, `src/editor/palette.ts`, plus two helpers in `src/shared/utils.ts`) so the existing node-environment Vitest setup can cover it. Markup and CSS changes carry a written manual check instead of a test.

**Tech Stack:** Preact 10, TypeScript 5.9, Vite 7 + `@crxjs/vite-plugin`, Vitest 4 (`environment: 'node'`), plain CSS with custom-property tokens, Chrome MV3 APIs.

**Spec:** `docs/superpowers/specs/2026-08-14-ui-ux-cleanup-design.md`

## Global Constraints

- Preact, not React. Import hooks from `preact/hooks`. Use the `class` attribute, never `className`.
- Popup strings go through `chrome.i18n.getMessage` via the local `t()` helper in `src/popup/App.tsx`. Every new popup string needs a key in `public/_locales/en/messages.json`.
- Editor strings stay plain English. The editor has no i18n layer.
- Colours, spacing, radius, and shadows come from `src/shared/tokens.css`. Add a token before writing a raw value in a surface stylesheet.
- Brand accent is coral (`--accent`). Danger is amber (`--danger`). The blue in `COLOR_PALETTE` is annotation content and stays.
- No new runtime or dev dependencies.
- Vitest config lives in `vite.config.ts`: `environment: 'node'`, `globals: true`, `include: ['tests/**/*.test.ts']`. There is no DOM test harness. Do not add one.
- Every task ends with `npm run typecheck && npm run lint && npm test` passing.
- Conventional commit messages. Never add Claude as a co-author. No Claude references in commits.

## Manual verification setup

Several tasks verify in a loaded extension. The loop is the same each time:

```bash
npm run build
```

Then in Chrome: open `chrome://extensions`, enable Developer mode, click "Load unpacked", and select the `dist/` directory. After each rebuild, click the reload arrow on the OpenScreenShot card. Open the popup from the toolbar. To reach the editor, capture any page, or open `chrome-extension://<id>/src/editor/index.html` directly.

---

### Task 1: Honest shortcut chips in the popup

**Files:**
- Create: `src/shared/shortcuts.ts`
- Test: `tests/unit/shortcuts.test.ts`
- Modify: `manifest.json:40-43`, `src/popup/App.tsx:203-238`, `src/popup/popup.css:347-358`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `resolveModeKeys(command: string, index: number, shortcuts: Record<string, string>): ModeKeys` where `interface ModeKeys { digit: string; osShortcut: string | null }`.

- [ ] **Step 1: Write the failing test**

Create `tests/unit/shortcuts.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { resolveModeKeys } from '../../src/shared/shortcuts';

describe('resolveModeKeys', () => {
  it('always returns the list-position digit', () => {
    expect(resolveModeKeys('capture-full-page', 0, {}).digit).toBe('1');
    expect(resolveModeKeys('capture-visible', 1, {}).digit).toBe('2');
    expect(resolveModeKeys('capture-region', 2, {}).digit).toBe('3');
  });

  it('returns the OS shortcut when Chrome reports one', () => {
    const keys = resolveModeKeys('capture-visible', 1, { 'capture-visible': '⇧⌘V' });
    expect(keys.osShortcut).toBe('⇧⌘V');
  });

  it('returns null when the command is absent', () => {
    expect(resolveModeKeys('capture-region', 2, {}).osShortcut).toBeNull();
  });

  it('returns null when Chrome reports an unassigned command', () => {
    expect(resolveModeKeys('capture-region', 2, { 'capture-region': '' }).osShortcut).toBeNull();
    expect(resolveModeKeys('capture-region', 2, { 'capture-region': '  ' }).osShortcut).toBeNull();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/unit/shortcuts.test.ts`
Expected: FAIL — "Failed to resolve import ... src/shared/shortcuts".

- [ ] **Step 3: Write the module**

Create `src/shared/shortcuts.ts`:

```ts
/**
 * Popup shortcut-chip rules.
 *
 * Every capture mode answers to a digit key while the popup is open (1, 2, 3 in
 * list order). Chrome may also hold an OS-level binding, but only when the user
 * or a manifest suggestion registered one. The popup shows the digit on every
 * row so the column never mixes two meanings, and adds the OS binding as a
 * second chip when Chrome reports one.
 */

export interface ModeKeys {
  /** In-popup digit key. Always available while the mode list shows. */
  digit: string;
  /** OS-level binding from chrome.commands.getAll(), or null when unassigned. */
  osShortcut: string | null;
}

export function resolveModeKeys(
  command: string,
  index: number,
  shortcuts: Record<string, string>,
): ModeKeys {
  const raw = shortcuts[command];
  const trimmed = raw?.trim() ?? '';
  return { digit: String(index + 1), osShortcut: trimmed === '' ? null : trimmed };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/unit/shortcuts.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 5: Give the region command a mac binding**

In `manifest.json`, replace the `capture-region` block:

```json
    "capture-region": {
      "suggested_key": { "default": "Ctrl+Shift+E", "mac": "Command+Shift+E" },
      "description": "Capture a selected region"
    }
```

The other two commands keep their current keys. Users already depend on those.

- [ ] **Step 6: Render both chips in the popup**

In `src/popup/App.tsx`, add the import next to the other shared imports:

```tsx
import { resolveModeKeys } from '../shared/shortcuts';
```

Inside the `MODES.map` callback, add the lookup as the first line of the body:

```tsx
            {MODES.map((m, i) => {
              const isBusy = busy === m.id;
              const keys = resolveModeKeys(m.command, i, shortcuts);
```

Replace the `<kbd>` line:

```tsx
                  {isBusy ? (
                    <span class="spinner" aria-label={t('capturing')} />
                  ) : (
                    <span class="mode-keys">
                      {keys.osShortcut ? <kbd class="kbd-os">{keys.osShortcut}</kbd> : null}
                      <kbd>{keys.digit}</kbd>
                    </span>
                  )}
```

- [ ] **Step 7: Style the chip pair**

In `src/popup/popup.css`, replace the `/* ---- Shortcuts ---- */` block's opening rule set with:

```css
/* ---- Shortcuts ---- */
.mode-keys {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex: 0 0 auto;
}

.mode-card kbd {
  font-family: var(--font-mono);
  font-size: 11px;
  background: var(--surface-3);
  color: var(--text-2);
  border: 1px solid var(--border);
  border-radius: var(--r-sm);
  padding: 1px 6px;
  flex: 0 0 auto;
  white-space: nowrap;
}

.mode-card .kbd-os {
  background: transparent;
  color: var(--text-3);
}
```

- [ ] **Step 8: Verify the checks pass**

Run: `npm run typecheck && npm run lint && npm test`
Expected: all pass.

- [ ] **Step 9: Verify in Chrome**

Build and reload the extension. Open the popup. Every row shows a digit chip. Rows with an OS binding show a dimmer chip to its left. Press `3` and confirm region select starts.

Note: Chrome keeps a command's binding once assigned. A previously installed copy may still hold no region shortcut. Open `chrome://extensions/shortcuts` and confirm region now lists a key. If it does not, the digit chip still reads true, which is the point of the change.

- [ ] **Step 10: Commit**

```bash
git add src/shared/shortcuts.ts tests/unit/shortcuts.test.ts manifest.json src/popup/App.tsx src/popup/popup.css
git commit -m "fix(popup): show a true digit chip on every capture mode row"
```

---

### Task 2: Fix the wrapping format control

**Files:**
- Modify: `src/popup/App.tsx:306-320`, `src/popup/popup.css:247-286`

**Interfaces:**
- Consumes: nothing.
- Produces: CSS class `.seg-grid` for full-width equal-column option rows.

- [ ] **Step 1: Replace the wrapping class with a grid**

In `src/popup/popup.css`, delete the `.seg-wrap` rule:

```css
.seg-wrap {
  flex-wrap: wrap;
}
```

Add this immediately after the `.seg` rule:

```css
.seg-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  width: 100%;
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  overflow: hidden;
}
```

- [ ] **Step 2: Put the format label on its own line**

In `src/popup/App.tsx`, replace the default-format row:

```tsx
      <div class="settings-row settings-row-col">
        <span class="settings-label">{t('settingsDefaultFormat')}</span>
        <div class="seg-grid">
          {(['png', 'jpeg', 'webp', 'pdf'] as const).map((f) => (
            <button
              key={f}
              class="seg-btn"
              aria-pressed={settings.defaultFormat === f}
              onClick={() => onChange({ defaultFormat: f as ExportFormat })}
            >
              {t('format' + f.charAt(0).toUpperCase() + f.slice(1))}
            </button>
          ))}
        </div>
      </div>
```

The wrapper class is now `seg-grid` alone. `.seg` carried the old border and is no longer needed on this row.

- [ ] **Step 3: Verify the checks pass**

Run: `npm run typecheck && npm run lint && npm test`
Expected: all pass.

- [ ] **Step 4: Verify in Chrome**

Build and reload. Open the popup, then settings. "Default format" sits above a single row of four equal buttons that spans the panel. No trailing border, no empty cell. The theme, page size, and orientation rows are unchanged.

- [ ] **Step 5: Commit**

```bash
git add src/popup/App.tsx src/popup/popup.css
git commit -m "fix(popup): lay the format options out as one full-width grid row"
```

---

### Task 3: Persist error toasts and stop the popup from jumping

**Files:**
- Modify: `src/popup/App.tsx:123-127`, `src/popup/App.tsx:194-266`, `src/popup/popup.css:466-500`

**Interfaces:**
- Consumes: nothing.
- Produces: nothing later tasks depend on.

- [ ] **Step 1: Keep error toasts until dismissed**

In `src/popup/App.tsx`, replace `pushToast` and add a dismiss handler beside it:

```tsx
  function pushToast(message: string, tone: ToastTone) {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, tone }]);
    // An error is a state the user has to read. Info and success are transient.
    if (tone !== 'error') {
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
    }
  }

  function dismissToast(id: number) {
    setToasts((t) => t.filter((x) => x.id !== id));
  }
```

- [ ] **Step 2: Move the toast area above the content**

In `src/popup/App.tsx`, delete the existing toast block from the bottom of the returned tree:

```tsx
      <div class="toasts" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} class={`toast toast-${toast.tone}`} role="status">
            {toast.message}
          </div>
        ))}
      </div>
```

Insert this block directly after the closing `</header>` tag and before the `{showSettings ? (` expression:

```tsx
      <div class="toasts" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} class={`toast toast-${toast.tone}`} role="status">
            <span class="toast-text">{toast.message}</span>
            {toast.tone === 'error' ? (
              <button
                class="toast-dismiss"
                aria-label={t('dismiss')}
                title={t('dismiss')}
                onClick={() => dismissToast(toast.id)}
              >
                ×
              </button>
            ) : null}
          </div>
        ))}
      </div>
```

- [ ] **Step 3: Add the dismiss string**

In `public/_locales/en/messages.json`, add after the `captureModesAria` entry (add a comma to the previous entry's closing brace):

```json
  "dismiss": {
    "message": "Dismiss",
    "description": "Accessible label for the button that closes an error message."
  }
```

- [ ] **Step 4: Style the dismiss button**

In `src/popup/popup.css`, replace the `.toasts` and `.toast` rules:

```css
.toasts {
  display: flex;
  flex-direction: column;
  gap: var(--s-1);
}

.toast {
  display: flex;
  align-items: flex-start;
  gap: var(--s-2);
  padding: var(--s-2) var(--s-3);
  border-radius: var(--r-md);
  font-size: 12px;
  font-weight: 500;
  border: 1px solid transparent;
  animation: oss-toast-in 250ms ease-out;
}

.toast-text {
  flex: 1 1 auto;
}

.toast-dismiss {
  flex: 0 0 auto;
  padding: 0 2px;
  border: none;
  background: transparent;
  color: inherit;
  font-size: 15px;
  line-height: 1.2;
  cursor: pointer;
  opacity: 0.7;
}

.toast-dismiss:hover {
  opacity: 1;
}

.toast-dismiss:focus-visible {
  outline: 2px solid var(--border-focus);
  outline-offset: 1px;
}
```

- [ ] **Step 5: Verify the checks pass**

Run: `npm run typecheck && npm run lint && npm test`
Expected: all pass.

- [ ] **Step 6: Verify in Chrome**

Build and reload. Open `chrome://extensions` in a tab, then open the popup on that tab and click "Visible Area". The error appears directly under the header, above the mode cards. The footer does not move. The message stays until you click ×.

- [ ] **Step 7: Commit**

```bash
git add src/popup/App.tsx src/popup/popup.css public/_locales/en/messages.json
git commit -m "fix(popup): keep capture errors on screen and hold the layout steady"
```

---

### Task 4: One stable popup footer

**Files:**
- Modify: `src/popup/App.tsx:243-256`, `src/popup/App.tsx:299-304`, `src/popup/App.tsx:414-418`, `src/popup/popup.css:327-380`, `public/_locales/en/messages.json`

**Interfaces:**
- Consumes: nothing.
- Produces: nothing later tasks depend on.

- [ ] **Step 1: Add the short footer labels**

In `public/_locales/en/messages.json`, delete the `settingsShortcuts` entry and add these two entries next to `supportKofi`:

```json
  "footerShortcuts": {
    "message": "Shortcuts",
    "description": "Short footer label for the link that opens Chrome's shortcut settings."
  },
  "footerKofi": {
    "message": "Ko-fi",
    "description": "Short footer label for the Ko-fi donation link."
  },
```

- [ ] **Step 2: Rewrite the footer row**

In `src/popup/App.tsx`, replace the footer block:

```tsx
          <div class="footer-row">
            <button
              class="link-btn"
              onClick={openEditor}
              disabled={!hasStash}
              title={t('reopenLast')}
            >
              {t('reopenLast')}
            </button>
            <button class="link-btn" onClick={openShortcutSettings} title={t('customizeShortcuts')}>
              {t('footerShortcuts')}
            </button>
            <button class="link-btn kofi-link" onClick={openKofi} title={t('supportKofiTitle')}>
              <CoffeeMark />
              {t('footerKofi')}
            </button>
          </div>
```

- [ ] **Step 3: Remove the duplicated rows from settings**

In `src/popup/App.tsx` `SettingsView`, delete the shortcuts row:

```tsx
      <div class="settings-row">
        <span class="settings-label">{t('settingsShortcuts')}</span>
        <button class="link-btn" onClick={openShortcutSettings}>
          {t('customizeShortcuts')}
        </button>
      </div>
```

and delete the trailing divider plus Ko-fi link at the end of the same component:

```tsx
      <div class="divider" />
      <button class="link-btn kofi-link" onClick={openKofi} title={t('supportKofiTitle')}>
        <CoffeeMark />
        {t('supportKofi')}
      </button>
```

- [ ] **Step 4: Style the row so it never wraps**

In `src/popup/popup.css`, replace the `.footer-row` rule and add the disabled state after `.link-btn:hover`:

```css
.footer-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--s-2);
  flex-wrap: nowrap;
}
```

```css
.link-btn:disabled {
  opacity: 0.4;
  cursor: default;
}

.link-btn:disabled:hover {
  color: var(--text-2);
  text-decoration: none;
}
```

- [ ] **Step 5: Confirm no dangling references**

Run: `grep -rn "settingsShortcuts\|supportKofi\b" src/ public/`
Expected: `supportKofiTitle` still appears in `src/popup/App.tsx` and `messages.json`. `settingsShortcuts` appears nowhere. `supportKofi` (the long label) appears nowhere in `src/`.

If `supportKofi` is unused in `src/`, delete its entry from `messages.json`.

- [ ] **Step 6: Verify the checks pass**

Run: `npm run typecheck && npm run lint && npm test`
Expected: all pass.

- [ ] **Step 7: Verify in Chrome**

Build and reload. The footer holds three items on one row and never wraps. With no stashed capture, "Reopen last capture" is dimmed and does nothing. Capture a page, reopen the popup, and confirm it becomes active. Settings no longer carries a Shortcuts row or a Ko-fi link.

- [ ] **Step 8: Commit**

```bash
git add src/popup/App.tsx src/popup/popup.css public/_locales/en/messages.json
git commit -m "refactor(popup): collapse the footer to one stable row and drop the duplicate links"
```

---

### Task 5: Drop the duplicated PDF defaults from settings

**Files:**
- Modify: `src/popup/App.tsx:271-421`, `public/_locales/en/messages.json`

**Interfaces:**
- Consumes: nothing.
- Produces: nothing. Task 6 restores the "remember" path in the export dialog, so run these two tasks together before shipping.

- [ ] **Step 1: Delete the PDF section from SettingsView**

In `src/popup/App.tsx`, delete the `pdfDisabled` constant:

```tsx
  const pdfDisabled = settings.pdfPageSize === 'full';
```

and delete every block from the PDF heading through the full-size hint:

```tsx
      <div class="settings-section">{t('settingsPdfDefaults')}</div>
```

through

```tsx
      {pdfDisabled ? <span class="settings-hint">{t('pdfFullHint')}</span> : null}
```

inclusive. That removes the page size row, the orientation row, and the multi-page/margin row.

- [ ] **Step 2: Find the newly unused strings**

Run: `for k in settingsPdfDefaults settingsPdfPageSize pdfPageSizeA4 pdfPageSizeLetter pdfPageSizeFull settingsPdfOrientation pdfOrientationPortrait pdfOrientationLandscape pdfMultiPage pdfMargin pdfFullHint; do printf '%s: ' "$k"; grep -rl "$k" src/ | tr '\n' ' '; echo; done`
Expected: every key prints with no file after the colon. The editor writes these labels in plain English, so nothing in `src/` reads them.

- [ ] **Step 3: Delete those entries from messages.json**

Remove all eleven entries listed in step 2 from `public/_locales/en/messages.json`. Keep the file valid JSON — check the trailing comma on whichever entry now ends the object.

Run: `node -e "JSON.parse(require('fs').readFileSync('public/_locales/en/messages.json','utf8')); console.log('valid')"`
Expected: `valid`.

- [ ] **Step 4: Verify the checks pass**

Run: `npm run typecheck && npm run lint && npm test`
Expected: all pass. Typecheck catches any leftover reference to `pdfDisabled`.

- [ ] **Step 5: Verify in Chrome**

Build and reload. Settings now holds Theme, Default format, Quality (for JPEG/WebP), and Filename template. The panel fits without a long scroll. `Settings` type fields for PDF are untouched, so a stored value survives.

- [ ] **Step 6: Commit**

```bash
git add src/popup/App.tsx public/_locales/en/messages.json
git commit -m "refactor(popup): remove the PDF defaults section duplicated by the export dialog"
```

---

### Task 6: "Remember these settings" in the export dialog

**Files:**
- Modify: `src/editor/App.tsx:290-501`, `src/editor/editor.css:529-534`

**Interfaces:**
- Consumes: `setSettings` from `src/shared/storage.ts` — `setSettings(patch: Partial<Settings>): Promise<Settings>`.
- Produces: nothing later tasks depend on.

- [ ] **Step 1: Import the storage writer**

In `src/editor/App.tsx`, add near the other imports:

```tsx
import { setSettings } from '../shared/storage';
```

- [ ] **Step 2: Add the remember state and persist on export**

In `ExportDialog`, add the state next to the other `useState` calls:

```tsx
  const [remember, setRemember] = useState(false);
```

Replace `doExport`:

```tsx
  async function doExport() {
    if (remember) {
      await setSettings({
        defaultFormat: format,
        quality,
        pdfPageSize,
        pdfOrientation,
        pdfMultiPage,
        pdfMarginMm: pdfMargin,
      });
    }
    if (format === 'pdf') {
      const opts: PdfOptions = {
        pageSize: pdfPageSize,
        orientation: pdfOrientation,
        multiPage: pdfMultiPage,
        marginMm: pdfMargin,
      };
      await ed.exportPdf(opts, filenameBase);
    } else {
      await ed.exportImage(format, quality, filenameBase);
    }
    onClose();
  }
```

- [ ] **Step 3: Add the control to the dialog actions**

Replace the `modal-actions` block:

```tsx
        <div class="modal-actions">
          <label class="check-label">
            <input
              type="checkbox"
              class="switch"
              checked={remember}
              onChange={(e) => setRemember((e.target as HTMLInputElement).checked)}
            />
            Remember these settings
          </label>
          <span class="modal-actions-spacer" />
          <button class="text-btn" onClick={onClose}>
            Cancel
          </button>
          <button class="btn-primary" onClick={doExport} disabled={ed.exporting}>
            {ed.exporting ? 'Exporting…' : 'Export'}
          </button>
        </div>
```

- [ ] **Step 4: Let the actions row spread**

In `src/editor/editor.css`, replace the `.modal-actions` rule and add the spacer:

```css
.modal-actions {
  display: flex;
  align-items: center;
  gap: var(--s-2);
  margin-top: var(--s-4);
}

.modal-actions-spacer {
  flex: 1 1 auto;
}
```

- [ ] **Step 5: Verify the checks pass**

Run: `npm run typecheck && npm run lint && npm test`
Expected: all pass.

- [ ] **Step 6: Verify in Chrome**

Build and reload. Capture a page. Open Export, pick PDF, set page size to Letter, turn on "Remember these settings", and export. Open Export again — Letter is preselected. Open the popup settings and confirm "Default format" now reads PDF.

- [ ] **Step 7: Commit**

```bash
git add src/editor/App.tsx src/editor/editor.css
git commit -m "feat(editor): let the export dialog save its settings as the new defaults"
```

---

### Task 7: Clickable filename tokens and a live preview

**Files:**
- Modify: `src/shared/utils.ts`, `src/popup/App.tsx:339-349`, `src/popup/popup.css`, `public/_locales/en/messages.json`
- Test: `tests/unit/utils.test.ts`

**Interfaces:**
- Consumes: `formatFilename(template, ctx)` from `src/shared/utils.ts`.
- Produces: `FILENAME_TOKENS: readonly string[]` and `insertToken(value: string, selStart: number, selEnd: number, token: string): { value: string; caret: number }`.

- [ ] **Step 1: Write the failing test**

Append to `tests/unit/utils.test.ts`. Extend the import line at the top to:

```ts
import {
  formatFilename,
  sanitizeFilename,
  isProtectedUrl,
  insertToken,
  FILENAME_TOKENS,
} from '../../src/shared/utils';
```

Then append:

```ts
describe('insertToken', () => {
  it('splices the token at a collapsed caret', () => {
    const out = insertToken('shot_', 5, 5, '{date}');
    expect(out.value).toBe('shot_{date}');
    expect(out.caret).toBe(11);
  });

  it('replaces the selected range', () => {
    const out = insertToken('shot_{time}', 5, 11, '{date}');
    expect(out.value).toBe('shot_{date}');
    expect(out.caret).toBe(11);
  });

  it('clamps indices past the end of the value', () => {
    const out = insertToken('abc', 99, 99, '{w}');
    expect(out.value).toBe('abc{w}');
    expect(out.caret).toBe(6);
  });

  it('clamps a negative start and an inverted range', () => {
    const out = insertToken('abc', -5, -1, '{h}');
    expect(out.value).toBe('{h}abc');
    expect(out.caret).toBe(3);
  });
});

describe('FILENAME_TOKENS', () => {
  it('lists every token formatFilename replaces', () => {
    expect([...FILENAME_TOKENS]).toEqual(['{date}', '{time}', '{title}', '{w}', '{h}']);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/unit/utils.test.ts`
Expected: FAIL — `insertToken` is not exported.

- [ ] **Step 3: Add the helpers**

Append to `src/shared/utils.ts`:

```ts
/** Tokens the filename template accepts, in the order the settings UI lists them. */
export const FILENAME_TOKENS = ['{date}', '{time}', '{title}', '{w}', '{h}'] as const;

/**
 * Splice `token` into `value` over the range [selStart, selEnd).
 *
 * Indices come straight from a DOM input, so they are clamped here rather than
 * at the call site. Returns the new value and where the caret belongs after it.
 */
export function insertToken(
  value: string,
  selStart: number,
  selEnd: number,
  token: string,
): { value: string; caret: number } {
  const start = Math.max(0, Math.min(selStart, value.length));
  const end = Math.max(start, Math.min(selEnd, value.length));
  return {
    value: value.slice(0, start) + token + value.slice(end),
    caret: start + token.length,
  };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/unit/utils.test.ts`
Expected: PASS.

- [ ] **Step 5: Add the preview string key**

In `public/_locales/en/messages.json`, delete the `filenameHint` entry and add:

```json
  "filenameInsert": {
    "message": "Insert",
    "description": "Label above the clickable filename token chips."
  },
```

- [ ] **Step 6: Wire the chips and preview into settings**

In `src/popup/App.tsx`, extend the hooks import:

```tsx
import { useEffect, useRef, useState } from 'preact/hooks';
```

Extend the utils import (add it if the file has none):

```tsx
import { FILENAME_TOKENS, formatFilename, insertToken } from '../shared/utils';
```

Inside `SettingsView`, above the returned tree, add:

```tsx
  const filenameRef = useRef<HTMLInputElement>(null);

  function insertAtCaret(token: string) {
    const el = filenameRef.current;
    if (!el) return;
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;
    const next = insertToken(el.value, start, end, token);
    onChange({ filenameTemplate: next.value });
    // The value arrives on the next render, so restore the caret after it.
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(next.caret, next.caret);
    });
  }
```

Replace the filename row:

```tsx
      <div class="settings-row settings-row-col">
        <span class="settings-label">{t('settingsFilename')}</span>
        <input
          ref={filenameRef}
          class="text-input"
          type="text"
          spellcheck={false}
          value={settings.filenameTemplate}
          onInput={(e) => onChange({ filenameTemplate: (e.target as HTMLInputElement).value })}
        />
        <div class="token-row">
          <span class="token-label">{t('filenameInsert')}</span>
          {FILENAME_TOKENS.map((tok) => (
            <button key={tok} class="token-chip" onClick={() => insertAtCaret(tok)}>
              {tok}
            </button>
          ))}
        </div>
        <span class="settings-hint">{previewFilename(settings)}</span>
      </div>
```

Add the preview helper next to the other module-level helpers at the bottom of the file:

```tsx
/** Sample resolution of the template, shown live under the settings input. */
function previewFilename(settings: Settings): string {
  const ext = settings.defaultFormat === 'jpeg' ? 'jpg' : settings.defaultFormat;
  const base = formatFilename(settings.filenameTemplate, {
    title: 'Example Page',
    width: 1920,
    height: 1080,
  });
  return `${base}.${ext}`;
}
```

- [ ] **Step 7: Style the chips**

Append to the settings section of `src/popup/popup.css`, after the `.text-input:focus` rule:

```css
.token-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
}

.token-label {
  font-size: 11px;
  color: var(--text-3);
  margin-right: 2px;
}

.token-chip {
  padding: 2px 6px;
  border: 1px solid var(--border);
  border-radius: var(--r-sm);
  background: var(--surface-2);
  color: var(--text-2);
  font-family: var(--font-mono);
  font-size: 11px;
  cursor: pointer;
  transition:
    border-color 120ms ease-out,
    color 120ms ease-out;
}

.token-chip:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.token-chip:focus-visible {
  outline: 2px solid var(--border-focus);
  outline-offset: 1px;
}
```

- [ ] **Step 8: Verify the checks pass**

Run: `npm run typecheck && npm run lint && npm test`
Expected: all pass.

- [ ] **Step 9: Verify in Chrome**

Build and reload. In settings, click into the filename input, place the caret mid-string, and click `{title}`. The token lands at the caret and the caret sits after it. The grey line below updates live and ends with the current default format's extension.

- [ ] **Step 10: Commit**

```bash
git add src/shared/utils.ts tests/unit/utils.test.ts src/popup/App.tsx src/popup/popup.css public/_locales/en/messages.json
git commit -m "feat(popup): make filename tokens clickable and preview the resolved name"
```

---

### Task 8: Reset to defaults

**Files:**
- Modify: `src/popup/App.tsx` (`SettingsView`), `src/popup/popup.css`, `public/_locales/en/messages.json`

**Interfaces:**
- Consumes: `DEFAULT_SETTINGS` from `src/shared/types.ts`, already imported in `src/popup/App.tsx`.
- Produces: nothing later tasks depend on.

- [ ] **Step 1: Add the strings**

In `public/_locales/en/messages.json`, add:

```json
  "resetDefaults": {
    "message": "Reset to defaults",
    "description": "Settings link that restores every default value."
  },
  "resetConfirm": {
    "message": "Click again to reset",
    "description": "Second-click confirmation label for the reset link."
  },
```

- [ ] **Step 2: Add the two-click reset control**

In `src/popup/App.tsx` `SettingsView`, add the state beside `filenameRef`:

```tsx
  const [confirmReset, setConfirmReset] = useState(false);

  function resetAll() {
    if (!confirmReset) {
      setConfirmReset(true);
      setTimeout(() => setConfirmReset(false), 3000);
      return;
    }
    setConfirmReset(false);
    // Keep showOnboarding as it is, so the welcome card does not come back.
    onChange({ ...DEFAULT_SETTINGS, showOnboarding: settings.showOnboarding });
  }
```

At the end of the returned tree, after the last settings row, add:

```tsx
      <div class="divider" />
      <button class="link-btn reset-btn" data-armed={confirmReset ? 'true' : undefined} onClick={resetAll}>
        {confirmReset ? t('resetConfirm') : t('resetDefaults')}
      </button>
```

A native `confirm()` closes the popup, so the two-click pattern replaces it.

- [ ] **Step 3: Style the armed state**

Append to `src/popup/popup.css`:

```css
.reset-btn[data-armed='true'] {
  color: var(--danger);
  font-weight: 600;
}
```

- [ ] **Step 4: Verify the checks pass**

Run: `npm run typecheck && npm run lint && npm test`
Expected: all pass.

- [ ] **Step 5: Verify in Chrome**

Build and reload. Change the theme to Dark and the format to WebP. Click "Reset to defaults" — the label arms in amber. Click again — theme and format return to System and PNG. Wait 3 seconds after a single click and confirm the label disarms. Close and reopen the popup and confirm the welcome card does not return.

- [ ] **Step 6: Commit**

```bash
git add src/popup/App.tsx src/popup/popup.css public/_locales/en/messages.json
git commit -m "feat(popup): add a two-click reset to defaults in settings"
```

---

### Task 9: Give Fit a margin

**Files:**
- Create: `src/editor/viewport.ts`
- Test: `tests/unit/viewport.test.ts`
- Modify: `src/editor/canvas.ts:36-37`, `src/editor/canvas.ts:110-153`, `src/editor/canvas.ts:255-257`

**Interfaces:**
- Consumes: nothing.
- Produces: `MIN_ZOOM`, `MAX_ZOOM`, `FIT_PADDING`, `clampZoom(v: number): number`, and `fitZoom(viewportW: number, viewportH: number, imgW: number, imgH: number, padding?: number): number`.

- [ ] **Step 1: Write the failing test**

Create `tests/unit/viewport.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { clampZoom, fitZoom, FIT_PADDING, MIN_ZOOM, MAX_ZOOM } from '../../src/editor/viewport';

describe('clampZoom', () => {
  it('holds a value inside the zoom range', () => {
    expect(clampZoom(0.5)).toBe(0.5);
    expect(clampZoom(0.001)).toBe(MIN_ZOOM);
    expect(clampZoom(99)).toBe(MAX_ZOOM);
  });
});

describe('fitZoom', () => {
  it('never upscales an image smaller than the viewport', () => {
    expect(fitZoom(1000, 800, 400, 300)).toBe(1);
  });

  it('binds a tall image by height, minus the padding', () => {
    const zoom = fitZoom(1000, 800, 500, 4000, 24);
    expect(zoom).toBeCloseTo((800 - 48) / 4000, 10);
  });

  it('binds a wide image by width, minus the padding', () => {
    const zoom = fitZoom(600, 2000, 3000, 500, 24);
    expect(zoom).toBeCloseTo((600 - 48) / 3000, 10);
  });

  it('leaves the image clear of both edges', () => {
    const zoom = fitZoom(1000, 800, 500, 4000);
    expect(4000 * zoom).toBeLessThanOrEqual(800 - FIT_PADDING * 2);
  });

  it('survives a viewport smaller than the padding', () => {
    const zoom = fitZoom(10, 10, 500, 500, 24);
    expect(zoom).toBeGreaterThanOrEqual(MIN_ZOOM);
    expect(Number.isFinite(zoom)).toBe(true);
  });

  it('clamps a huge image to the minimum zoom', () => {
    expect(fitZoom(1000, 800, 500000, 500000)).toBe(MIN_ZOOM);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/unit/viewport.test.ts`
Expected: FAIL — "Failed to resolve import ... src/editor/viewport".

- [ ] **Step 3: Write the module**

Create `src/editor/viewport.ts`:

```ts
/**
 * Viewport arithmetic for the editor canvas.
 *
 * Kept apart from CanvasController so the zoom maths runs without a DOM. Fit
 * leaves a margin on each side, so the image frame and its shadow stay clear of
 * the stage edges.
 */

export const MIN_ZOOM = 0.05;
export const MAX_ZOOM = 8;
/** Breathing room, in CSS px, left on each side of the image at Fit. */
export const FIT_PADDING = 24;

export function clampZoom(v: number): number {
  return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, v));
}

/** Largest zoom that fits the image inside the padded viewport, never above 100%. */
export function fitZoom(
  viewportW: number,
  viewportH: number,
  imgW: number,
  imgH: number,
  padding = FIT_PADDING,
): number {
  const availW = Math.max(1, viewportW - padding * 2);
  const availH = Math.max(1, viewportH - padding * 2);
  return clampZoom(Math.min(availW / imgW, availH / imgH, 1));
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/unit/viewport.test.ts`
Expected: PASS, 7 tests.

- [ ] **Step 5: Use the module from the controller**

In `src/editor/canvas.ts`, add the import below the annotations import:

```ts
import { clampZoom, fitZoom } from './viewport';
```

Delete the local constants:

```ts
const MIN_ZOOM = 0.05;
const MAX_ZOOM = 8;
```

Delete the local helper at the bottom of the file:

```ts
function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}
```

Replace `fit()`:

```ts
  /** Fit the whole image inside the viewport, centered, never upscaling past 100%. */
  fit(): void {
    if (!this.image) return;
    const rect = this.canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const w = this.image.naturalWidth;
    const h = this.image.naturalHeight;
    const zoom = fitZoom(rect.width, rect.height, w, h);
    this.view = {
      zoom,
      panX: (rect.width - w * zoom) / 2,
      panY: (rect.height - h * zoom) / 2,
    };
    this.render();
    this.onViewChange?.();
  }
```

Replace the clamp call inside `setZoom`:

```ts
    const z = clampZoom(zoom);
```

- [ ] **Step 6: Verify the checks pass**

Run: `npm run typecheck && npm run lint && npm test`
Expected: all pass. Typecheck catches any remaining reference to the deleted `clamp`.

- [ ] **Step 7: Verify in Chrome**

Build and reload. Capture a full page and open the editor. The image stops short of the stage edges on all four sides. Click Fit after zooming in and confirm the margin returns.

- [ ] **Step 8: Commit**

```bash
git add src/editor/viewport.ts tests/unit/viewport.test.ts src/editor/canvas.ts
git commit -m "fix(editor): leave a margin around the image when fitting to the stage"
```

---

### Task 10: Give the screenshot a visible edge

**Files:**
- Modify: `src/shared/tokens.css:34-74`, `src/editor/editor.css:283-288`, `src/editor/editor.css:610-621`, `src/editor/canvas.ts:172-208`

**Interfaces:**
- Consumes: nothing.
- Produces: CSS token `--stage-bg`.

- [ ] **Step 1: Add the stage token to both themes**

In `src/shared/tokens.css`, add to the light block after `--surface-3`:

```css
  --stage-bg: #e4e4e9;
```

Add to the dark block after `--surface-3`:

```css
  --stage-bg: #161618;
```

- [ ] **Step 2: Use the token on the stage**

In `src/editor/editor.css`, change the `.stage` background:

```css
.stage {
  position: relative;
  flex: 1 1 auto;
  overflow: hidden;
  background: var(--stage-bg);
}
```

and change the `.overlay-msg` background so the loading and empty states match:

```css
  background: var(--stage-bg);
```

- [ ] **Step 3: Draw a shadow and a frame around the image**

In `src/editor/canvas.ts` `render()`, replace the block from the checkerboard call through the closing `ctx.restore()` of the image transform:

```ts
    // Checkerboard over the image's screen rect so transparency reads as such.
    const sw = img.naturalWidth * this.view.zoom;
    const sh = img.naturalHeight * this.view.zoom;
    // Shadow behind the image rect, so a light screenshot keeps an edge.
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.24)';
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 4;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(this.view.panX, this.view.panY, sw, sh);
    ctx.restore();
    drawCheckerboard(ctx, this.view.panX, this.view.panY, sw, sh);
    ctx.save();
    ctx.translate(this.view.panX, this.view.panY);
    ctx.scale(this.view.zoom, this.view.zoom);
    ctx.imageSmoothingEnabled = this.view.zoom <= 1;
    ctx.drawImage(img, 0, 0);
    for (const a of this.annotations) {
      ctx.save();
      drawAnnotation(ctx, a, img, this.blurCache);
      ctx.restore();
    }
    if (this.draft) {
      ctx.save();
      drawAnnotation(ctx, this.draft, img, this.blurCache);
      ctx.restore();
    }
    if (this.cropRect) {
      ctx.save();
      drawCropPreview(ctx, this.cropRect, img.naturalWidth, img.naturalHeight);
      ctx.restore();
    }
    ctx.restore();
    // Hairline frame in screen space, drawn under the selection handles.
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.28)';
    ctx.lineWidth = 1;
    ctx.strokeRect(this.view.panX + 0.5, this.view.panY + 0.5, sw - 1, sh - 1);
    ctx.restore();
```

The selection draw that follows is unchanged, so handles stay above the frame. `composeFinal()` is untouched, so exports carry no frame or shadow.

- [ ] **Step 4: Verify the checks pass**

Run: `npm run typecheck && npm run lint && npm test`
Expected: all pass.

- [ ] **Step 5: Verify in Chrome**

Build and reload. Capture a page with a white background. The image sits on a grey stage with a visible hairline and a soft shadow. Switch the theme to Dark in popup settings, reopen the editor, and confirm the stage darkens and the edge still reads. Export a PNG and confirm the exported file carries no frame and no shadow.

- [ ] **Step 6: Commit**

```bash
git add src/shared/tokens.css src/editor/editor.css src/editor/canvas.ts
git commit -m "fix(editor): frame the screenshot so a light capture keeps an edge"
```

---

### Task 11: Promote Copy and hold the topbar width

**Files:**
- Modify: `src/editor/App.tsx:72-88`, `src/editor/editor.css:255-280`

**Interfaces:**
- Consumes: nothing.
- Produces: CSS class `.btn-fixed`.

- [ ] **Step 1: Swap the button emphasis and shorten the failure label**

In `src/editor/App.tsx`, replace the Copy and Export buttons:

```tsx
          <button
            class="btn-primary btn-fixed"
            title="Copy to clipboard as PNG (⌘C)"
            disabled={!ed.capture}
            onClick={copyToClipboard}
          >
            {copyState === 'copied' ? 'Copied' : copyState === 'failed' ? 'Failed' : 'Copy'}
          </button>
          <button
            class="btn-secondary"
            title="Export (⌘S)"
            disabled={!ed.capture}
            onClick={() => setExportOpen(true)}
          >
            Export
          </button>
```

- [ ] **Step 2: Fix the button width**

Append to `src/editor/editor.css`, after the `.btn-secondary:focus-visible` rule:

```css
/* The label cycles through three words; a floor stops the topbar shifting. */
.btn-fixed {
  min-width: 92px;
  text-align: center;
}
```

- [ ] **Step 3: Verify the checks pass**

Run: `npm run typecheck && npm run lint && npm test`
Expected: all pass.

- [ ] **Step 4: Verify in Chrome**

Build and reload. Capture a page. Copy is the coral button and Export is the outlined one. Click Copy and watch the label move through Copied and back. Nothing to its left or right moves.

- [ ] **Step 5: Commit**

```bash
git add src/editor/App.tsx src/editor/editor.css
git commit -m "fix(editor): promote Copy and pin its width so the topbar holds still"
```

---

### Task 12: One zoom control with a menu

**Files:**
- Create: `src/editor/ZoomMenu.tsx`
- Modify: `src/editor/App.tsx:54-71`, `src/editor/App.tsx:203-209`, `src/editor/useEditor.ts:306-368`, `src/editor/editor.css:163-180`

**Interfaces:**
- Consumes: `ed.zoomPct`, `ed.zoomIn`, `ed.zoomOut`, `ed.fit`, `ed.resetZoom` from `useEditor`.
- Produces: `ZoomMenu(props: ZoomMenuProps)` where `interface ZoomMenuProps { zoomPct: number; disabled: boolean; onZoomIn: () => void; onZoomOut: () => void; onFit: () => void; onActualSize: () => void }`.

- [ ] **Step 1: Write the component**

Create `src/editor/ZoomMenu.tsx`:

```tsx
import { useEffect, useRef, useState } from 'preact/hooks';

export interface ZoomMenuProps {
  zoomPct: number;
  disabled: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit: () => void;
  onActualSize: () => void;
}

/**
 * The zoom readout doubles as the menu trigger. Frequent zoom lives on the
 * keyboard and the wheel, so the topbar carries one control rather than five.
 */
export function ZoomMenu(props: ZoomMenuProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  function run(action: () => void) {
    action();
    setOpen(false);
  }

  return (
    <div class="zoom-menu" ref={wrapRef}>
      <button
        class="zoom-trigger"
        disabled={props.disabled}
        aria-haspopup="menu"
        aria-expanded={open}
        title="Zoom"
        onClick={() => setOpen((v) => !v)}
      >
        <span class="zoom-readout" aria-live="polite">
          {props.zoomPct}%
        </span>
        <Chevron />
      </button>
      {open ? (
        <div class="zoom-popover" role="menu">
          <button class="zoom-item" role="menuitem" onClick={() => run(props.onZoomIn)}>
            <span>Zoom in</span>
            <kbd>⌘+</kbd>
          </button>
          <button class="zoom-item" role="menuitem" onClick={() => run(props.onZoomOut)}>
            <span>Zoom out</span>
            <kbd>⌘−</kbd>
          </button>
          <button class="zoom-item" role="menuitem" onClick={() => run(props.onFit)}>
            <span>Fit to screen</span>
            <kbd>F</kbd>
          </button>
          <button class="zoom-item" role="menuitem" onClick={() => run(props.onActualSize)}>
            <span>Actual size</span>
            <kbd>⌘0</kbd>
          </button>
        </div>
      ) : null}
    </div>
  );
}

function Chevron() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}
```

- [ ] **Step 2: Replace the five widgets in the topbar**

In `src/editor/App.tsx`, add the import:

```tsx
import { ZoomMenu } from './ZoomMenu';
```

Replace the whole `zoom-group` block:

```tsx
          <ZoomMenu
            zoomPct={ed.zoomPct}
            disabled={!ed.capture}
            onZoomIn={ed.zoomIn}
            onZoomOut={ed.zoomOut}
            onFit={ed.fit}
            onActualSize={ed.resetZoom}
          />
```

- [ ] **Step 3: Drop the duplicated readout from the status bar**

Replace the status bar block:

```tsx
      <footer class="statusbar">
        <span>{ed.imageSize ? `${ed.imageSize.w} × ${ed.imageSize.h}px` : '—'}</span>
        <span class="status-spacer" />
        <span class="status-hint">{hintForTool(ed.tool)}</span>
      </footer>
```

- [ ] **Step 4: Bind the zoom keys**

In `src/editor/useEditor.ts`, inside the keyboard effect's `down` handler, insert this block directly after the redo (`e.key === 'y'`) branch and before the delete branch:

```ts
      // Zoom.
      if (isMod(e) && (e.key === '=' || e.key === '+')) {
        e.preventDefault();
        zoomIn();
        return;
      }
      if (isMod(e) && (e.key === '-' || e.key === '_')) {
        e.preventDefault();
        zoomOut();
        return;
      }
      if (isMod(e) && e.key === '0') {
        e.preventDefault();
        resetZoom();
        return;
      }
      if (!isMod(e) && !e.altKey && e.key.toUpperCase() === 'F') {
        e.preventDefault();
        fit();
        return;
      }
```

`F` is not in `TOOL_LIST`, so it never collides with a tool letter. This branch sits above the tool lookup, so the guard holds even if a tool takes `F` later.

Extend the effect's dependency array:

```ts
  }, [undo, redo, deleteSelection, zoomIn, zoomOut, resetZoom, fit]);
```

Move the four zoom callbacks (`zoomAtCenter`, `zoomIn`, `zoomOut`, `fit`, `resetZoom`, currently at lines 650-661) above this keyboard effect so they are defined before the effect references them. They are `useCallback` values with no dependency on anything declared between the two points.

- [ ] **Step 5: Style the menu**

In `src/editor/editor.css`, replace the `.zoom-group` and `.zoom-readout` rules:

```css
.zoom-menu {
  position: relative;
}

.zoom-trigger {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 32px;
  padding: 0 8px;
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  background: var(--surface-2);
  color: var(--text-1);
  cursor: pointer;
  transition: background 120ms ease-out;
}

.zoom-trigger:hover:not(:disabled) {
  background: var(--surface-3);
}

.zoom-trigger:disabled {
  opacity: 0.5;
  cursor: default;
}

.zoom-trigger:focus-visible {
  outline: 2px solid var(--border-focus);
  outline-offset: 1px;
}

.zoom-readout {
  min-width: 44px;
  text-align: center;
  font-variant-numeric: tabular-nums;
  font-size: 12px;
  color: var(--text-2);
  user-select: none;
}

.zoom-popover {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  z-index: 20;
  display: flex;
  flex-direction: column;
  min-width: 190px;
  padding: 4px;
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  background: var(--surface-1);
  box-shadow: var(--sh-md);
}

.zoom-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--s-3);
  height: 30px;
  padding: 0 8px;
  border: none;
  border-radius: var(--r-sm);
  background: transparent;
  color: var(--text-1);
  font-size: 13px;
  cursor: pointer;
}

.zoom-item:hover {
  background: var(--hover-overlay);
}

.zoom-item:focus-visible {
  outline: 2px solid var(--border-focus);
  outline-offset: -2px;
}

.zoom-item kbd {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-3);
}
```

- [ ] **Step 6: Verify the checks pass**

Run: `npm run typecheck && npm run lint && npm test`
Expected: all pass.

- [ ] **Step 7: Verify in Chrome**

Build and reload. Capture a page. The topbar shows one zoom button. Click it and run each of the four items. Press `⌘+`, `⌘-`, `⌘0`, and `F` and confirm each acts. Click outside the menu and press Escape to close it. The status bar now shows dimensions and the tool hint only.

- [ ] **Step 8: Commit**

```bash
git add src/editor/ZoomMenu.tsx src/editor/App.tsx src/editor/useEditor.ts src/editor/editor.css
git commit -m "refactor(editor): fold the zoom widgets into one menu and add zoom keys"
```

---

### Task 13: Move document actions to the topbar and label the count

**Files:**
- Modify: `src/editor/App.tsx:44-53`, `src/editor/App.tsx:93-146`, `src/editor/editor.css:157-198`, `src/editor/editor.css:373-385`

**Interfaces:**
- Consumes: `ed.canUndo`, `ed.canRedo`, `ed.hasSelection`, `ed.undo`, `ed.redo`, `ed.deleteSelection`, `ed.annotations`.
- Produces: `IconLayers()` in `src/editor/App.tsx`, used only by the count pill.

- [ ] **Step 1: Add the document-action group to the topbar**

In `src/editor/App.tsx`, insert this directly after the closing `</div>` of `topbar-brand` and before `<div class="topbar-controls">`:

```tsx
        <div class="topbar-actions" role="group" aria-label="Document actions">
          <button
            class="icon-btn"
            title="Undo (⌘Z)"
            disabled={!ed.canUndo}
            onClick={ed.undo}
            aria-label="Undo"
          >
            <IconUndo />
          </button>
          <button
            class="icon-btn"
            title="Redo (⌘⇧Z)"
            disabled={!ed.canRedo}
            onClick={ed.redo}
            aria-label="Redo"
          >
            <IconRedo />
          </button>
          <button
            class="icon-btn icon-btn-danger"
            title="Delete selected (⌫)"
            disabled={!ed.hasSelection}
            onClick={ed.deleteSelection}
            aria-label="Delete selected"
          >
            <IconTrash />
          </button>
        </div>
```

- [ ] **Step 2: Strip the tool rail back to tools**

In the `<aside class="toolbar">` block, delete everything from the first `toolbar-divider` through the trash button:

```tsx
          <div class="toolbar-divider" />
          <button class="tool-btn" title="Undo (⌘Z)" ... </button>
          <button class="tool-btn" title="Redo (⌘⇧Z)" ... </button>
          <div class="toolbar-divider" />
          <button class="tool-btn tool-btn-danger" ... </button>
```

Replace the count element with a labelled pill that hides at zero:

```tsx
          {ed.annotations.length > 0 ? (
            <div class="toolbar-count" title={`${ed.annotations.length} annotations`}>
              <IconLayers />
              <span>{ed.annotations.length}</span>
            </div>
          ) : null}
```

- [ ] **Step 3: Add the layers icon**

Add this next to the other icon components at the bottom of `src/editor/App.tsx`:

```tsx
function IconLayers() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M12 2l9 5-9 5-9-5 9-5z" />
      <path d="M3 12l9 5 9-5" />
      <path d="M3 17l9 5 9-5" />
    </svg>
  );
}
```

- [ ] **Step 4: Style the new group, the disabled icon button, and the pill**

In `src/editor/editor.css`, add after the `.topbar-brand` rule:

```css
.topbar-actions {
  display: flex;
  align-items: center;
  gap: 2px;
  margin-right: auto;
  padding-left: var(--s-3);
}
```

Add after the `.icon-btn:hover` rule:

```css
.icon-btn:disabled {
  opacity: 0.4;
  cursor: default;
}

.icon-btn:disabled:hover {
  background: transparent;
}

.icon-btn-danger:hover:not(:disabled) {
  color: var(--danger);
}
```

Replace the `.toolbar-count` rule:

```css
.toolbar-count {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  margin-top: auto;
  padding: 4px 0;
  font-size: 11px;
  color: var(--text-3);
  font-variant-numeric: tabular-nums;
}
```

The topbar keeps `justify-content: space-between`; `margin-right: auto` on the new group pushes the controls right as before.

- [ ] **Step 5: Verify the checks pass**

Run: `npm run typecheck && npm run lint && npm test`
Expected: all pass. Lint catches `tool-btn-danger` if it is now unused in TSX — leave the CSS rule, it costs nothing, or delete it if lint flags dead CSS (it does not).

- [ ] **Step 6: Verify in Chrome**

Build and reload. Capture a page. Undo, redo, and delete sit in the topbar next to the brand and grey out when they do not apply. The left rail holds tools only. With no annotations, the rail's bottom is empty. Draw a rectangle and confirm the layers pill appears with `1` and a tooltip that reads "1 annotations".

- [ ] **Step 7: Commit**

```bash
git add src/editor/App.tsx src/editor/editor.css
git commit -m "refactor(editor): move undo, redo, and delete to the topbar and label the count"
```

---

### Task 14: Show the style bar only when it applies

**Files:**
- Create: `src/editor/stylebar.ts`
- Test: `tests/unit/stylebar.test.ts`
- Modify: `src/editor/App.tsx:218-278`

**Interfaces:**
- Consumes: `Tool` from `src/editor/tools.ts`, `Annotation` from `src/editor/annotations.ts`.
- Produces: `stylebarFields(tool: Tool, selectedType: Annotation['type'] | null): StylebarFields` where `interface StylebarFields { color: boolean; stroke: boolean; fontSize: boolean }`, and `stylebarEmpty(f: StylebarFields): boolean`.

- [ ] **Step 1: Write the failing test**

Create `tests/unit/stylebar.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { stylebarEmpty, stylebarFields } from '../../src/editor/stylebar';

describe('stylebarFields by tool', () => {
  it('offers colour and stroke for the shape tools', () => {
    for (const tool of ['rect', 'arrow', 'pen', 'highlight'] as const) {
      expect(stylebarFields(tool, null)).toEqual({ color: true, stroke: true, fontSize: false });
    }
  });

  it('offers colour and font size for text and step', () => {
    for (const tool of ['text', 'step'] as const) {
      expect(stylebarFields(tool, null)).toEqual({ color: true, stroke: false, fontSize: true });
    }
  });

  it('offers nothing for select, crop, and blur', () => {
    for (const tool of ['select', 'crop', 'blur'] as const) {
      expect(stylebarEmpty(stylebarFields(tool, null))).toBe(true);
    }
  });
});

describe('stylebarFields by selection', () => {
  it('lets the selection override the active tool', () => {
    expect(stylebarFields('select', 'text')).toEqual({
      color: true,
      stroke: false,
      fontSize: true,
    });
    expect(stylebarFields('rect', 'step')).toEqual({
      color: true,
      stroke: false,
      fontSize: true,
    });
  });

  it('offers nothing for a selected blur', () => {
    expect(stylebarEmpty(stylebarFields('rect', 'blur'))).toBe(true);
  });
});

describe('stylebarEmpty', () => {
  it('is false when any field applies', () => {
    expect(stylebarEmpty({ color: true, stroke: false, fontSize: false })).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/unit/stylebar.test.ts`
Expected: FAIL — "Failed to resolve import ... src/editor/stylebar".

- [ ] **Step 3: Write the module**

Create `src/editor/stylebar.ts`:

```ts
/**
 * Which style controls apply right now.
 *
 * A selection wins over the tool: the bar edits what the user picked. With no
 * selection the bar previews what the active tool will draw. Tools that carry
 * no style collapse the bar rather than leave an inert band across the window.
 */
import type { Annotation } from './annotations';
import type { Tool } from './tools';

export interface StylebarFields {
  color: boolean;
  stroke: boolean;
  fontSize: boolean;
}

const NONE: StylebarFields = { color: false, stroke: false, fontSize: false };
const SHAPE: StylebarFields = { color: true, stroke: true, fontSize: false };
const GLYPH: StylebarFields = { color: true, stroke: false, fontSize: true };

export function stylebarFields(
  tool: Tool,
  selectedType: Annotation['type'] | null,
): StylebarFields {
  if (selectedType) {
    switch (selectedType) {
      case 'rect':
      case 'arrow':
      case 'pen':
      case 'highlight':
        return SHAPE;
      case 'text':
      case 'step':
        return GLYPH;
      case 'blur':
        return NONE;
    }
  }
  switch (tool) {
    case 'rect':
    case 'arrow':
    case 'pen':
    case 'highlight':
      return SHAPE;
    case 'text':
    case 'step':
      return GLYPH;
    case 'select':
    case 'crop':
    case 'blur':
      return NONE;
  }
}

/** True when no control applies, so the bar should not render at all. */
export function stylebarEmpty(f: StylebarFields): boolean {
  return !f.color && !f.stroke && !f.fontSize;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/unit/stylebar.test.ts`
Expected: PASS, 6 tests.

- [ ] **Step 5: Drive the component from the rule**

In `src/editor/App.tsx`, add the import:

```tsx
import { stylebarEmpty, stylebarFields } from './stylebar';
```

Replace the head of `StyleBar` down to the opening `<div class="stylebar"`:

```tsx
function StyleBar({ ed }: { ed: ReturnType<typeof useEditor> }) {
  const sel = ed.selectedAnnotation;
  const fields = stylebarFields(ed.tool, sel?.type ?? null);
  if (stylebarEmpty(fields)) return null;
  return (
    <div
      class="stylebar"
      role="toolbar"
      aria-orientation="horizontal"
      aria-label="Annotation style"
      onKeyDown={(e) => arrowNav(e.currentTarget as HTMLElement, e)}
    >
```

Wrap the colour group in `{fields.color ? ( ... ) : null}`, the stroke group in `{fields.stroke ? ( ... ) : null}`, and change the font-size guard from `showFontSize` to `fields.fontSize`. Delete the now-unused `showFontSize` constant.

- [ ] **Step 6: Verify the checks pass**

Run: `npm run typecheck && npm run lint && npm test`
Expected: all pass.

- [ ] **Step 7: Verify in Chrome**

Build and reload. Capture a page. With the Select tool and nothing chosen, no style band shows and the canvas gains that height. Press `R` — Colour and Stroke appear. Press `T` — Colour and Size appear. Press `B` for blur — the band disappears again. Draw a rectangle, switch to Select, and click it: the band returns with Colour and Stroke.

- [ ] **Step 8: Commit**

```bash
git add src/editor/stylebar.ts tests/unit/stylebar.test.ts src/editor/App.tsx
git commit -m "refactor(editor): show the style bar only when a control applies"
```

---

### Task 15: Named swatches, a custom colour, and recent colours

**Files:**
- Create: `src/editor/palette.ts`
- Test: `tests/unit/palette.test.ts`
- Modify: `src/shared/types.ts:88-118`, `src/editor/useEditor.ts:206-218`, `src/editor/useEditor.ts:246-285`, `src/editor/useEditor.ts:736-778`, `src/editor/App.tsx` (`StyleBar`), `src/editor/editor.css:58-84`

**Interfaces:**
- Consumes: `COLOR_PALETTE` from `src/editor/annotations.ts`, `setSettings` from `src/shared/storage.ts`.
- Produces: `COLOR_NAMES: Record<string, string>`, `MAX_RECENT_COLORS: number`, `normalizeHex(value: string): string | null`, `colorName(hex: string): string`, `pushRecent(list: string[], hex: string, max?: number): string[]`. Also `Settings.recentColors: string[]` and `useEditor().recentColors: string[]`.

- [ ] **Step 1: Write the failing test**

Create `tests/unit/palette.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { COLOR_PALETTE } from '../../src/editor/annotations';
import {
  COLOR_NAMES,
  MAX_RECENT_COLORS,
  colorName,
  normalizeHex,
  pushRecent,
} from '../../src/editor/palette';

describe('COLOR_NAMES', () => {
  it('names every preset swatch', () => {
    for (const hex of COLOR_PALETTE) {
      expect(COLOR_NAMES[hex]).toBeTypeOf('string');
    }
  });
});

describe('normalizeHex', () => {
  it('lowercases and prefixes a bare hex', () => {
    expect(normalizeHex('FF3B30')).toBe('#ff3b30');
    expect(normalizeHex('  #FF3B30 ')).toBe('#ff3b30');
  });
  it('rejects a value that is not a six-digit hex', () => {
    expect(normalizeHex('red')).toBeNull();
    expect(normalizeHex('#fff')).toBeNull();
  });
});

describe('colorName', () => {
  it('returns the preset name', () => {
    expect(colorName('#ff3b30')).toBe('Red');
  });
  it('describes a custom colour', () => {
    expect(colorName('#123456')).toBe('Custom color #123456');
  });
  it('returns the raw value when it is not a hex colour', () => {
    expect(colorName('rebeccapurple')).toBe('rebeccapurple');
  });
});

describe('pushRecent', () => {
  it('puts a custom colour at the front', () => {
    expect(pushRecent([], '#123456')).toEqual(['#123456']);
    expect(pushRecent(['#111111'], '#123456')).toEqual(['#123456', '#111111']);
  });

  it('drops a duplicate rather than repeating it', () => {
    expect(pushRecent(['#111111', '#123456'], '#123456')).toEqual(['#123456', '#111111']);
  });

  it('caps the list', () => {
    const full = ['#111111', '#222222', '#333333', '#444444', '#555555'];
    expect(pushRecent(full, '#666666')).toHaveLength(MAX_RECENT_COLORS);
    expect(pushRecent(full, '#666666')[0]).toBe('#666666');
  });

  it('returns the same list for a preset colour', () => {
    const list = ['#123456'];
    expect(pushRecent(list, '#ff3b30')).toBe(list);
  });

  it('returns the same list for a value that is not a hex colour', () => {
    const list = ['#123456'];
    expect(pushRecent(list, 'nope')).toBe(list);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/unit/palette.test.ts`
Expected: FAIL — "Failed to resolve import ... src/editor/palette".

- [ ] **Step 3: Write the module**

Create `src/editor/palette.ts`:

```ts
/**
 * Annotation colour helpers.
 *
 * Screen readers need a word for each swatch, and a custom colour needs a short
 * memory so the user can reach it again. Both are pure data, so they sit apart
 * from the style bar component.
 */

export const COLOR_NAMES: Record<string, string> = {
  '#ff3b30': 'Red',
  '#ff9500': 'Orange',
  '#ffcc00': 'Yellow',
  '#34c759': 'Green',
  '#0071e3': 'Blue',
  '#af52de': 'Purple',
  '#ffffff': 'White',
  '#1d1d1f': 'Black',
};

export const MAX_RECENT_COLORS = 5;

/** Normalise to lowercase #rrggbb, or null when the value is not a six-digit hex. */
export function normalizeHex(value: string): string | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(value.trim());
  return m ? `#${m[1].toLowerCase()}` : null;
}

/** A readable label for a swatch. */
export function colorName(hex: string): string {
  const norm = normalizeHex(hex);
  if (!norm) return hex;
  return COLOR_NAMES[norm] ?? `Custom color ${norm}`;
}

/**
 * Put `hex` at the front of `list`, drop any duplicate, and cap the length.
 * A preset colour already owns a swatch, so it returns the list untouched —
 * callers use identity to decide whether to persist.
 */
export function pushRecent(list: string[], hex: string, max = MAX_RECENT_COLORS): string[] {
  const norm = normalizeHex(hex);
  if (!norm || COLOR_NAMES[norm]) return list;
  return [norm, ...list.filter((c) => normalizeHex(c) !== norm)].slice(0, max);
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/unit/palette.test.ts`
Expected: PASS.

- [ ] **Step 5: Store recent colours in settings**

In `src/shared/types.ts`, add to the `Settings` interface after `annotationFontSize`:

```ts
  /** Custom colours the user picked, most recent first. */
  recentColors: string[];
```

and to `DEFAULT_SETTINGS`:

```ts
  recentColors: [],
```

- [ ] **Step 6: Track recent colours in the hook**

In `src/editor/useEditor.ts`, add the import:

```ts
import { pushRecent } from './palette';
```

Add the state beside the other `useState` calls:

```ts
  const [recentColors, setRecentColors] = useState<string[]>([]);
```

In the mount effect, after `setSettingsState(s);`, add:

```ts
      setRecentColors(s.recentColors);
```

Replace `setStyleColor`:

```ts
  const setStyleColor = useCallback(
    (color: string) => {
      setStyle((s) => ({ ...s, color }));
      setRecentColors((prev) => {
        const next = pushRecent(prev, color);
        // pushRecent returns the same array for a preset, so identity is the test.
        if (next !== prev) void setSettings({ recentColors: next });
        return next;
      });
      applyStyleToSelected((a) =>
        a.type === 'text' || a.type === 'step'
          ? { ...a, color }
          : a.type === 'rect' || a.type === 'arrow' || a.type === 'pen' || a.type === 'highlight'
            ? { ...a, stroke: color }
            : a,
      );
    },
    [applyStyleToSelected],
  );
```

Add `recentColors` to the object the hook returns, next to `style`.

- [ ] **Step 7: Render names, recents, and a picker**

In `src/editor/App.tsx`, add the import:

```tsx
import { colorName } from './palette';
```

In `StyleBar`, replace the swatch list body:

```tsx
        <div class="swatches">
          {COLOR_PALETTE.map((c) => (
            <button
              key={c}
              class="swatch"
              style={{ backgroundColor: c }}
              data-light={isLight(c) ? '1' : undefined}
              aria-label={colorName(c)}
              aria-pressed={ed.style.color === c}
              onClick={() => ed.setStyleColor(c)}
            />
          ))}
          {ed.recentColors.map((c) => (
            <button
              key={c}
              class="swatch"
              style={{ backgroundColor: c }}
              data-light={isLight(c) ? '1' : undefined}
              aria-label={colorName(c)}
              aria-pressed={ed.style.color === c}
              onClick={() => ed.setStyleColor(c)}
            />
          ))}
          <label class="swatch swatch-custom" title="Custom color">
            <input
              type="color"
              aria-label="Custom color"
              value={ed.style.color}
              onChange={(e) => ed.setStyleColor((e.target as HTMLInputElement).value)}
            />
          </label>
        </div>
```

The picker listens on `change`, not `input`. Chrome fires `input` for every drag frame, and each one would write to storage.

- [ ] **Step 8: Style the picker swatch**

In `src/editor/editor.css`, add after the `.swatch[aria-pressed='true']` rule:

```css
.swatch-custom {
  position: relative;
  display: inline-flex;
  overflow: hidden;
  background: conic-gradient(
    #ff3b30,
    #ff9500,
    #ffcc00,
    #34c759,
    #0071e3,
    #af52de,
    #ff3b30
  );
}

.swatch-custom input[type='color'] {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  padding: 0;
  border: none;
  opacity: 0;
  cursor: pointer;
}
```

- [ ] **Step 9: Verify the checks pass**

Run: `npm run typecheck && npm run lint && npm test`
Expected: all pass.

- [ ] **Step 10: Verify in Chrome**

Build and reload. Capture a page and press `R`. Tab to a swatch and confirm the browser's accessibility inspector reads "Red" rather than a hex string. Click the rainbow swatch, pick a colour, and close the picker: a new swatch appears after the presets. Reload the editor and confirm it survived. Pick five more custom colours and confirm the list stops at five.

- [ ] **Step 11: Commit**

```bash
git add src/editor/palette.ts tests/unit/palette.test.ts src/shared/types.ts src/editor/useEditor.ts src/editor/App.tsx src/editor/editor.css
git commit -m "feat(editor): name the swatches and add a custom colour with recents"
```

---

### Task 16: Export shortcut and a shortcut sheet

**Files:**
- Create: `src/editor/ShortcutSheet.tsx`
- Modify: `src/editor/App.tsx:12-91`, `src/editor/editor.css`

**Interfaces:**
- Consumes: `TOOL_LIST` from `src/editor/tools.ts`, `isTypingTarget` from `src/editor/useEditor.ts`, `trapFocus`/`getFocusable` from `src/editor/focus.ts`.
- Produces: `ShortcutSheet({ onClose }: { onClose: () => void })`.

- [ ] **Step 1: Write the sheet**

Create `src/editor/ShortcutSheet.tsx`:

```tsx
import { useEffect, useRef } from 'preact/hooks';
import { TOOL_LIST } from './tools';
import { getFocusable, trapFocus } from './focus';

/** Commands that are not tools. Tool rows come from TOOL_LIST. */
const COMMANDS: { label: string; keys: string }[] = [
  { label: 'Copy to clipboard', keys: '⌘C' },
  { label: 'Export', keys: '⌘S' },
  { label: 'Undo', keys: '⌘Z' },
  { label: 'Redo', keys: '⌘⇧Z' },
  { label: 'Delete selected', keys: '⌫' },
  { label: 'Deselect / cancel crop', keys: 'Esc' },
  { label: 'Zoom in', keys: '⌘+' },
  { label: 'Zoom out', keys: '⌘−' },
  { label: 'Actual size', keys: '⌘0' },
  { label: 'Fit to screen', keys: 'F' },
  { label: 'Pan', keys: 'Space + drag' },
  { label: 'This sheet', keys: '?' },
];

export function ShortcutSheet({ onClose }: { onClose: () => void }) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prev = (document.activeElement as HTMLElement | null) ?? null;
    const focusable = modalRef.current ? getFocusable(modalRef.current) : [];
    focusable[0]?.focus();
    return () => {
      prev?.focus?.();
    };
  }, []);

  return (
    <div class="modal-backdrop" onMouseDown={onClose}>
      <div
        ref={modalRef}
        class="modal sheet"
        role="dialog"
        aria-modal="true"
        aria-label="Keyboard shortcuts"
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          trapFocus(modalRef.current!, e);
          if (e.key === 'Escape') onClose();
        }}
      >
        <h2 class="modal-title">Keyboard shortcuts</h2>
        <div class="sheet-grid">
          <div>
            <div class="field-label">Tools</div>
            {TOOL_LIST.map((t) => (
              <div key={t.id} class="sheet-row">
                <span>{t.label}</span>
                <kbd>{t.shortcut}</kbd>
              </div>
            ))}
          </div>
          <div>
            <div class="field-label">Commands</div>
            {COMMANDS.map((c) => (
              <div key={c.label} class="sheet-row">
                <span>{c.label}</span>
                <kbd>{c.keys}</kbd>
              </div>
            ))}
          </div>
        </div>
        <div class="modal-actions">
          <span class="modal-actions-spacer" />
          <button class="btn-primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Wire the keys and the trigger**

In `src/editor/App.tsx`, add the import:

```tsx
import { ShortcutSheet } from './ShortcutSheet';
```

Add the state next to `exportOpen`:

```tsx
  const [sheetOpen, setSheetOpen] = useState(false);
```

Add this effect below the existing `⌘C` effect:

```tsx
  // ⌘S opens Export; ? toggles the shortcut sheet.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;
      if ((e.metaKey || e.ctrlKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        if (ed.capture) setExportOpen(true);
        return;
      }
      if (e.key === '?') {
        e.preventDefault();
        setSheetOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [ed.capture]);
```

Add the trigger button in `topbar-controls`, before the `ZoomMenu`:

```tsx
          <button
            class="icon-btn"
            title="Keyboard shortcuts (?)"
            aria-label="Keyboard shortcuts"
            onClick={() => setSheetOpen(true)}
          >
            ?
          </button>
```

Render the sheet next to the export dialog at the end of the tree:

```tsx
      {sheetOpen ? <ShortcutSheet onClose={() => setSheetOpen(false)} /> : null}
```

- [ ] **Step 3: Style the sheet**

Append to `src/editor/editor.css`:

```css
.sheet {
  width: 560px;
}

.sheet-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--s-5);
}

.sheet-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--s-3);
  padding: 3px 0;
  font-size: 13px;
}

.sheet-row kbd {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-2);
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--r-sm);
  padding: 1px 6px;
  white-space: nowrap;
}
```

- [ ] **Step 4: Verify the checks pass**

Run: `npm run typecheck && npm run lint && npm test`
Expected: all pass.

- [ ] **Step 5: Verify in Chrome**

Build and reload. Capture a page. Press `⌘S` — the export dialog opens. Cancel it. Press `?` — the sheet opens with two columns. Press Escape to close, and confirm focus returns. Click the `?` button in the topbar and confirm it opens too. Click into the export dialog's filename field, type `?`, and confirm the sheet does not open.

- [ ] **Step 6: Commit**

```bash
git add src/editor/ShortcutSheet.tsx src/editor/App.tsx src/editor/editor.css
git commit -m "feat(editor): add a shortcut sheet and bind Export to ⌘S"
```

---

### Task 17: A way out of the empty editor

**Files:**
- Modify: `src/editor/App.tsx:176-188`, `src/editor/editor.css:610-649`

**Interfaces:**
- Consumes: `chrome.action.openPopup()`.
- Produces: `EmptyState()` in `src/editor/App.tsx`.

- [ ] **Step 1: Replace the inline empty block with a component**

In `src/editor/App.tsx`, replace the empty-state block inside `.stage`:

```tsx
          {!ed.loading && !ed.capture && !ed.error ? <EmptyState /> : null}
```

Add the component next to the other local components:

```tsx
function EmptyState() {
  const [failed, setFailed] = useState(false);

  // openPopup lands in Chrome 127+ and still refuses in some window states, so
  // the fallback line is the guaranteed path rather than a nicety.
  function openPopup() {
    try {
      const result = chrome.action?.openPopup?.();
      if (result && typeof result.then === 'function') {
        result.catch(() => setFailed(true));
      } else if (!chrome.action?.openPopup) {
        setFailed(true);
      }
    } catch {
      setFailed(true);
    }
  }

  return (
    <div class="overlay-msg">
      <div class="empty">
        <div class="empty-icon" aria-hidden="true">
          <IconImage />
        </div>
        <h2>Nothing to edit yet</h2>
        <p>Capture a page with OpenScreenShot, and it opens here.</p>
        <button class="btn-primary empty-cta" onClick={openPopup}>
          Capture a page
        </button>
        {failed ? (
          <p class="empty-fallback">Click the OpenScreenShot icon in the toolbar.</p>
        ) : null}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Let the empty state take clicks**

`.overlay-msg` sets `pointer-events: none` so the loading state never blocks the canvas. Append to `src/editor/editor.css`:

```css
.empty {
  pointer-events: auto;
}

.empty-cta {
  margin-top: var(--s-4);
}

.empty-fallback {
  margin-top: var(--s-2) !important;
  font-size: 12px;
  color: var(--text-3);
}
```

The `!important` overrides `.empty p { margin: 0 }`, which the error state still needs.

- [ ] **Step 3: Verify the checks pass**

Run: `npm run typecheck && npm run lint && npm test`
Expected: all pass.

- [ ] **Step 4: Verify in Chrome**

Build and reload. Clear any stashed capture by capturing and exporting, or open the editor in a fresh profile. Open `chrome-extension://<id>/src/editor/index.html`. The empty state shows a coral "Capture a page" button. Click it and confirm the popup opens, or that the fallback line appears. The error state (unplug the stash to force it, or trust the untouched branch) still centres with no button.

- [ ] **Step 5: Commit**

```bash
git add src/editor/App.tsx src/editor/editor.css
git commit -m "feat(editor): give the empty state a button that opens the popup"
```

---

### Task 18: Final sweep

**Files:**
- Modify: none expected.

**Interfaces:**
- Consumes: every task above.
- Produces: nothing.

- [ ] **Step 1: Confirm no orphan strings**

Run: `node -e "const m=require('./public/_locales/en/messages.json');const fs=require('fs');const src=require('child_process').execSync('grep -rho \"t('\''[a-zA-Z]*'\''\" src/ || true').toString();const used=new Set([...src.matchAll(/t\('\''([a-zA-Z]+)'\''\)/g)].map(x=>x[1]));const skip=['extName','extDesc'];const dead=Object.keys(m).filter(k=>!used.has(k)&&!skip.includes(k));console.log(dead.length?'unused: '+dead.join(', '):'no unused keys')"`

Expected: `no unused keys`. If any key prints, confirm it is genuinely unreferenced with `grep -rn "<key>" src/ manifest.json` and delete it.

- [ ] **Step 2: Run the full check set**

Run: `npm run typecheck && npm run lint && npm run format:check && npm test && npm run build`
Expected: all pass. If `format:check` fails, run `npm run format` and commit the result.

- [ ] **Step 3: Walk the popup once**

Build, reload, and check in one pass: three mode rows each show a digit chip; the format grid is one row; an error stays until dismissed and does not move the footer; the footer is one row; settings holds no PDF section, no Shortcuts row, and no Ko-fi link; filename chips insert and the preview updates; reset needs two clicks.

- [ ] **Step 4: Walk the editor once**

Check in one pass: the image has a margin and a visible edge; Copy is coral and holds its width; one zoom button with a working menu and keys; undo, redo, and delete sit in the topbar; the tool rail shows tools and a labelled count; the style bar hides for Select and Crop; swatches read by name and a custom colour persists; `⌘S` and `?` work; the empty state offers a button.

- [ ] **Step 5: Commit any formatting fallout**

```bash
git status --short
git add -A
git commit -m "chore: apply formatter after the UI cleanup"
```

Skip this commit if the tree is clean.

---

## Self-Review

**Spec coverage.** Every numbered finding in the spec maps to a task: 1→T1, 2→T2, 3→T10, 4→T13, 5→T3, 6→T3, 7→T11, 8→T15, 9→T9, 10→T4, 11→T4, 12→T12, 13→T5+T6, 14→T12, 15→T4, 16→T14, 17→T16, 18→T11, 19→T15, 20→T7, 21→T8, 22→T17, 23→T13.

**Ordering dependencies.** T5 removes the popup's PDF settings and T6 restores the path that writes them; run T5 and T6 together before shipping. T15 adds `Settings.recentColors`, which the same task then reads — no other task depends on it. T12 moves the zoom callbacks above the keyboard effect in `useEditor.ts`; T15 edits `setStyleColor` in the same file, so rebase carefully if the tasks run out of order.

**Type consistency.** `resolveModeKeys` returns `ModeKeys`. `fitZoom`/`clampZoom` replace the deleted local `clamp`, `MIN_ZOOM`, and `MAX_ZOOM` in `canvas.ts`. `stylebarFields` takes `Annotation['type'] | null`, which matches `ed.selectedAnnotation?.type ?? null`. `pushRecent` returns the input array by identity for presets, and T15 step 6 relies on exactly that.

**Known limits.** No task adds a component test — the repo has no DOM harness and adding one would mean a new dependency. Markup and CSS changes rely on the written manual checks instead, which is why every such task carries one.
