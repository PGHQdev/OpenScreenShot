# Quick Capture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a capture go straight to the clipboard or straight to disk, skipping the editor, chosen once in the popup and honoured by every capture entry point.

**Architecture:** One stored setting, `captureAction`, read by the background service worker when a capture finishes. `handoffToEditor` becomes `deliverCapture`, which stashes the capture (so "Reopen last" keeps working) and then opens the editor, copies to the clipboard, or downloads. The clipboard write runs in the page, through the same `chrome.scripting.executeScript` route the capture engine already uses, because a service worker has no `navigator.clipboard`. The download runs in the worker, because `chrome.downloads.download` accepts the PNG data URL directly.

**Tech Stack:** TypeScript, Preact, MV3 service worker, `chrome.scripting`, `chrome.downloads`, Vitest. No new dependencies.

**Spec:** The Design section below. It is the approved design; the tasks implement it.

## Global Constraints

- **No new dependencies.**
- **One new manifest permission:** `clipboardWrite`. It carries no install warning. No new host permission, and `host_permissions` stays empty.
- **Vitest runs in `environment: 'node'`** (`vite.config.ts:27`). Unit tests must stay DOM-free. Pure logic goes in `src/shared/utils.ts` and is unit-tested; the injected clipboard function and the popup are verified in the browser (Task 4).
- **Editor stays the default.** `DEFAULT_SETTINGS.captureAction` is `'editor'`, so an existing user sees no behaviour change until they pick otherwise.
- **Injected functions must be fully self-contained** — see the header of `src/content/scroll-capture.ts`. No module-scope references; helpers nest inside the function.
- **Preact idiom:** `class`, not `className`. Match the surrounding file's comment density and naming.
- **Colour rule:** the extension's own chrome stays coral accent + amber danger, no blue. The success badge uses the existing `--success` green (`#34c759`).
- **Background user-facing strings stay plain English**, matching the existing `broadcast` messages. Popup strings go through `chrome.i18n` and `public/_locales/en/messages.json`.
- **Leave `ROADMAP.md` and every version field alone.** The release owns both.
- **Commit atomically** at the end of each task. No Claude co-author, no Claude trailers, no Claude references in commit messages.
- **Done means checks run:** `npm run typecheck && npm run lint && npm test && npm run build`.

---

## Design

### The setting

```ts
export type CaptureAction = 'editor' | 'clipboard' | 'download';
```

Stored as `Settings.captureAction`, defaulting to `'editor'`. It applies to every entry point — popup buttons, the three keyboard commands, and the context menu — because it is read at delivery time, downstream of all of them.

### Delivery

`handoffToEditor` (`src/background/index.ts:342`) becomes `deliverCapture`. Every action stashes the capture first, so a quick capture is still recoverable through the popup's "Reopen last" link.

- `editor` — today's behaviour: `chrome.tabs.create({ url: EDITOR_URL })`.
- `clipboard` — inject `copyImageToClipboard(dataUrl)` into the captured tab. It fetches the data URL into a blob and calls `navigator.clipboard.write`. The service worker cannot do this itself: it has no DOM and no `navigator.clipboard`.
- `download` — `chrome.downloads.download({ url: dataUrl, filename })`, with the filename resolved from the user's template through the existing `formatFilename`.

### Why the clipboard write waits for focus

`navigator.clipboard.write` throws `Document is not focused` when the page does not hold focus. Right after a popup click the popup still holds it, so the injected function polls `document.hasFocus()` for up to one second before writing. The popup also closes early for the clipboard action, the same way it already does for region and delayed captures, which hands focus back to the tab.

Two failure modes survive this and both surface as the error badge: a page whose `Permissions-Policy` blocks `clipboard-write`, and a tab that navigated away between capture and injection.

### Quick captures write PNG

The capture is already a PNG data URL. Re-encoding to the user's `defaultFormat` would mean an `OffscreenCanvas` round-trip in the worker for a format choice that belongs to the export dialog. Quick save writes PNG, and the popup says so under the row when Download is selected.

### Feedback

A quick capture opens no tab, so the action badge is the only surface. `flashDoneBadge` shows a green `✓` for 1.2 s; the existing `flashErrorBadge` shows the coral `!` for 4 s. Neither is awaited by the capture path.

### Out of scope

Per-mode actions (copy the region, save the full page), a modifier-key override, quick-mode format choice, and any "save as" prompt.

---

## Task 1: The capture action setting

**Files:**

- Modify: `src/shared/utils.ts` (append `CAPTURE_ACTIONS`, `CaptureAction`, `normalizeCaptureAction`)
- Modify: `src/shared/types.ts` (`Settings`, `DEFAULT_SETTINGS`, `CaptureErrorCode`)
- Test: `tests/unit/utils.test.ts` (append)

**Interfaces:**

- Consumes: nothing.
- Produces: `CaptureAction` (declared in `src/shared/types.ts`), `CAPTURE_ACTIONS: readonly CaptureAction[]`, `normalizeCaptureAction(value: unknown): CaptureAction`, `Settings.captureAction: CaptureAction`, and the `'quick-action'` member of `CaptureErrorCode`.

`CaptureAction` is declared in `src/shared/types.ts` because `Settings` stores one — the same reason `FrameBackground` lives there. Declaring it in `utils.ts` would make the two files import each other.

- [ ] **Step 1: Write the failing test**

Append to `tests/unit/utils.test.ts`:

```ts
describe('normalizeCaptureAction', () => {
  it('keeps every offered action', () => {
    for (const a of CAPTURE_ACTIONS) expect(normalizeCaptureAction(a)).toBe(a);
  });

  it('falls back to the editor for anything else, so bad storage cannot strand a capture', () => {
    expect(normalizeCaptureAction('print')).toBe('editor');
    expect(normalizeCaptureAction(undefined)).toBe('editor');
    expect(normalizeCaptureAction(null)).toBe('editor');
    expect(normalizeCaptureAction(3)).toBe('editor');
  });

  it('lists the editor first, so the default reads as the first chip', () => {
    expect(CAPTURE_ACTIONS[0]).toBe('editor');
  });

  it('ships with the editor as the default', () => {
    expect(DEFAULT_SETTINGS.captureAction).toBe('editor');
  });
});
```

Extend the import at the top of the file:

```ts
import {
  formatFilename,
  sanitizeFilename,
  isProtectedUrl,
  insertToken,
  menuIdToMode,
  MENU_REPEAT_ID,
  normalizeCaptureDelay,
  normalizeCaptureAction,
  CAPTURE_DELAYS,
  CAPTURE_ACTIONS,
  FILENAME_TOKENS,
} from '../../src/shared/utils';
import { DEFAULT_SETTINGS } from '../../src/shared/types';
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/utils.test.ts`
Expected: FAIL — `normalizeCaptureAction is not a function`.

- [ ] **Step 3: Add the helper**

In `src/shared/utils.ts`, extend the type import at the top:

```ts
import type { CaptureAction, CaptureMode } from './types';
```

Append under the `normalizeCaptureDelay` block:

```ts
/** Post-capture actions the popup offers, in the order it lists them. */
export const CAPTURE_ACTIONS: readonly CaptureAction[] = ['editor', 'clipboard', 'download'];

/** Coerce a stored action to a supported one; anything else opens the editor. */
export function normalizeCaptureAction(value: unknown): CaptureAction {
  return CAPTURE_ACTIONS.includes(value as CaptureAction) ? (value as CaptureAction) : 'editor';
}
```

- [ ] **Step 4: Add the setting and the error code**

In `src/shared/types.ts`, add above the `Settings` interface, next to the other stored unions:

```ts
/** What a finished capture does. `Settings` stores one; see src/shared/utils.ts. */
export type CaptureAction = 'editor' | 'clipboard' | 'download';
```

Add the field to `Settings`, right after `captureDelay`:

```ts
  /** What a finished capture does: open the editor, copy, or save. See CAPTURE_ACTIONS. */
  captureAction: CaptureAction;
```

Add the default to `DEFAULT_SETTINGS`, in the same position:

```ts
  captureAction: 'editor',
```

Extend `CaptureErrorCode`:

```ts
export type CaptureErrorCode =
  | 'protected-page'
  | 'blank-page'
  | 'too-large'
  | 'no-region'
  | 'quick-action'
  | 'not-implemented'
  | 'unknown';
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run tests/unit/utils.test.ts && npm run typecheck`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/shared/utils.ts src/shared/types.ts tests/unit/utils.test.ts
git commit -m "feat(capture): add the post-capture action setting"
```

---

## Task 2: Deliver to the clipboard or to disk

**Files:**

- Create: `src/content/clipboard.ts`
- Modify: `src/background/index.ts:338-352` (`handoffToEditor` → `deliverCapture`) and its three call sites at `index.ts:217`, `index.ts:250`, `index.ts:322`
- Modify: `src/background/index.ts:382-388` (badge helpers)
- Modify: `manifest.json` (add `clipboardWrite`)

**Interfaces:**

- Consumes: `normalizeCaptureAction`, `formatFilename` from `src/shared/utils.ts`; `getSettings`, `setLastCapture` from `src/shared/storage.ts`.
- Produces: `copyImageToClipboard(dataUrl: string): Promise<boolean>` (page-injected), `deliverCapture(tabId: number, dataUrl: string, width: number, height: number, mode: CaptureMode, title: string, url: string): Promise<void>`, `flashDoneBadge(): Promise<void>`.

- [ ] **Step 1: Write the injected clipboard function**

Create `src/content/clipboard.ts`:

```ts
/**
 * Page-context clipboard write, injected via `chrome.scripting.executeScript`.
 *
 * Same contract as `src/content/scroll-capture.ts`: the function is serialized
 * with `toString()` and loses its closure, so every helper it needs is nested
 * inside it. A service worker has no `navigator.clipboard`, which is why the
 * write happens in the page at all.
 */

/**
 * Copy a PNG data URL to the clipboard. Returns false rather than throwing, so
 * the caller can report a single "could not copy" message for every cause.
 *
 * The focus wait exists because `navigator.clipboard.write` rejects while the
 * page is unfocused, and right after a popup click the popup still holds focus.
 */
export async function copyImageToClipboard(dataUrl: string): Promise<boolean> {
  const waitForFocus = async (): Promise<void> => {
    for (let i = 0; i < 20 && !document.hasFocus(); i++) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  };
  try {
    await waitForFocus();
    const blob = await (await fetch(dataUrl)).blob();
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
    return true;
  } catch {
    return false;
  }
}
```

- [ ] **Step 2: Replace the handoff with a delivery switch**

In `src/background/index.ts`, extend the imports:

```ts
import {
  formatFilename,
  isProtectedUrl,
  menuIdToMode,
  MENU_IDS,
  MENU_REPEAT_ID,
  normalizeCaptureAction,
  normalizeCaptureDelay,
} from '../shared/utils';
import { copyImageToClipboard } from '../content/clipboard';
```

Replace `handoffToEditor` (`index.ts:338-352`) with:

```ts
/**
 * Deliver a finished capture the way the user asked for. Every path stashes the
 * capture first, so the popup's "Reopen last" link still works after a quick
 * capture. Settings are read here rather than passed down: a full-page capture
 * can take seconds, and the newest value is the one the user meant.
 */
async function deliverCapture(
  tabId: number,
  dataUrl: string,
  width: number,
  height: number,
  mode: CaptureMode,
  title: string,
  url: string,
): Promise<void> {
  await setLastCapture({ dataUrl, width, height, mode, title, url, capturedAt: Date.now() });
  const settings = await getSettings();
  const action = normalizeCaptureAction(settings.captureAction);

  if (action === 'editor') {
    await chrome.tabs.create({ url: EDITOR_URL });
    return;
  }

  if (action === 'clipboard') {
    const copied = await execInTab(tabId, copyImageToClipboard, [dataUrl]);
    if (!copied) {
      broadcast({
        type: 'CAPTURE_ERROR',
        code: 'quick-action',
        message: 'Could not copy the screenshot to the clipboard.',
      });
      return;
    }
    void flashDoneBadge();
    return;
  }

  // Quick save writes PNG: the capture already is one, and the export dialog
  // owns the format choice.
  const base = formatFilename(settings.filenameTemplate, { title, url, width, height });
  await chrome.downloads.download({ url: dataUrl, filename: `${base}.png`, saveAs: false });
  void flashDoneBadge();
}
```

- [ ] **Step 3: Update the three call sites**

In `captureVisible` (`index.ts:217`):

```ts
  await deliverCapture(tabId, dataUrl, width, height, 'visible', tab.title ?? '', tab.url ?? '');
```

In `captureRegion` (`index.ts:250`):

```ts
  await deliverCapture(tabId, dataUrl, w, h, 'region', tab.title ?? '', tab.url ?? '');
```

In `captureFullPage` (`index.ts:322-329`):

```ts
  await deliverCapture(
    tabId,
    dataUrl,
    canvasWidth,
    canvasHeight,
    'full-page',
    tab.title ?? '',
    tab.url ?? '',
  );
```

- [ ] **Step 4: Add the success badge**

In `src/background/index.ts`, next to `flashErrorBadge` (`index.ts:382`):

```ts
/** A quick capture opens no tab, so the badge is the only place to report success. */
async function flashDoneBadge(): Promise<void> {
  await chrome.action.setBadgeBackgroundColor({ color: '#34c759' });
  await chrome.action.setBadgeTextColor({ color: '#ffffff' });
  await chrome.action.setBadgeText({ text: '✓' });
  await delay(1200);
  await chrome.action.setBadgeText({ text: '' });
}
```

- [ ] **Step 5: Add the permission**

In `manifest.json`, extend `permissions`:

```json
  "permissions": [
    "activeTab",
    "scripting",
    "storage",
    "unlimitedStorage",
    "downloads",
    "contextMenus",
    "clipboardWrite"
  ],
```

`clipboardWrite` shows no install warning, so an existing install updates without re-approval.

- [ ] **Step 6: Verify and commit**

Run: `npm run typecheck && npm run lint && npm test && npm run build`
Expected: PASS.

```bash
git add src/content/clipboard.ts src/background/index.ts manifest.json
git commit -m "feat(capture): deliver captures to the clipboard or to disk"
```

---

## Task 3: The popup control

**Files:**

- Modify: `src/popup/App.tsx:152-172` (`capture`) and the mode-list markup at `App.tsx:282-296`
- Modify: `public/_locales/en/messages.json`

**Interfaces:**

- Consumes: `CAPTURE_ACTIONS`, `normalizeCaptureAction`, `CaptureAction` from Task 1.
- Produces: the "After capture" row. No new exports.

- [ ] **Step 1: Add the strings**

In `public/_locales/en/messages.json`, add before the closing brace (after `repeatLastRegion`):

```json
  "afterCaptureLabel": {
    "message": "After capture",
    "description": "Label for the row that picks what a finished capture does."
  },
  "actionEditor": {
    "message": "Editor",
    "description": "Post-capture action that opens the annotation editor."
  },
  "actionClipboard": {
    "message": "Clipboard",
    "description": "Post-capture action that copies the screenshot and skips the editor."
  },
  "actionDownload": {
    "message": "Download",
    "description": "Post-capture action that saves the screenshot and skips the editor."
  },
  "actionHintPng": {
    "message": "Quick save writes a PNG.",
    "description": "Hint shown under the after-capture row when Download is selected."
  }
```

Add a comma after the `repeatLastRegion` block so the JSON stays valid.

- [ ] **Step 2: Add the row**

In `src/popup/App.tsx`, extend the utils import:

```ts
import {
  CAPTURE_ACTIONS,
  CAPTURE_DELAYS,
  FILENAME_TOKENS,
  formatFilename,
  insertToken,
  normalizeCaptureAction,
  normalizeCaptureDelay,
} from '../shared/utils';
```

Extend the types import in the same file:

```ts
import type { CaptureAction, CaptureMode, ExportFormat, PopupMessage, Settings } from '../shared/types';
```

Add the label map next to `MODES` (`App.tsx:51`):

```tsx
const ACTION_LABEL_KEYS: Record<CaptureAction, string> = {
  editor: 'actionEditor',
  clipboard: 'actionClipboard',
  download: 'actionDownload',
};
```

Insert below the delay row (`App.tsx:296`), above the `<div class="divider" />`:

```tsx
          <div class="settings-row delay-row">
            <span class="settings-label">{t('afterCaptureLabel')}</span>
            <div class="seg">
              {CAPTURE_ACTIONS.map((a) => (
                <button
                  key={a}
                  class="seg-btn"
                  aria-pressed={normalizeCaptureAction(settings.captureAction) === a}
                  onClick={() => updateSettings({ captureAction: a })}
                >
                  {t(ACTION_LABEL_KEYS[a])}
                </button>
              ))}
            </div>
          </div>
          {normalizeCaptureAction(settings.captureAction) === 'download' ? (
            <span class="settings-hint">{t('actionHintPng')}</span>
          ) : null}
```

`.settings-row`, `.delay-row`, `.seg`, `.seg-btn`, and `.settings-hint` already exist in `src/popup/popup.css`.

- [ ] **Step 3: Close the popup for a clipboard capture**

The clipboard write needs the tab focused, and the popup holds focus while it is open. Replace the early-close branch in `capture` (`App.tsx:155-165`):

```tsx
    // Region needs the page free for the overlay, a delayed capture needs it
    // free so the user can set up the hover state, and a clipboard capture
    // needs the page focused before it can write — all three close the popup.
    const quickCopy = normalizeCaptureAction(settings.captureAction) === 'clipboard';
    if (mode === 'region' || normalizeCaptureDelay(settings.captureDelay) > 0 || quickCopy) {
      // Close only AFTER the request is delivered — closing first can drop the
      // message to a cold service worker, so region would silently no-op on the
      // first click and only work once the worker is warm.
      void sendToBackground({ type: 'CAPTURE_REQUEST', mode, repeat })
        .catch(() => {})
        .finally(() => window.close());
      return;
    }
```

- [ ] **Step 4: Verify and commit**

Run: `npm run typecheck && npm run lint && npm test && npm run build`
Expected: PASS.

```bash
git add src/popup/App.tsx public/_locales/en/messages.json
git commit -m "feat(popup): pick what happens after a capture"
```

---

## Task 4: Browser verification and docs

**Files:**

- Modify: `README.md` (capture feature list)
- Modify: `agent_docs/store-listing.md` (CAPTURE block)

- [ ] **Step 1: Build and load the extension**

Run: `npm run build`

Load `dist/` as an unpacked extension at `chrome://extensions`. Open a normal http(s) page.

- [ ] **Step 2: Walk the editor path (the default)**

- Leave After capture on Editor. Capture visible. The editor opens, as before.
- Confirm the badge stays empty through the whole flow.

- [ ] **Step 3: Walk the clipboard path**

- Set After capture to Clipboard. Capture visible from the popup. The popup closes, the badge shows a green `✓`, and no tab opens.
- Paste into a document. The screenshot arrives at full size.
- Repeat with region mode, with the keyboard command, and from the right-click menu. All three copy.
- Set Delay to 3s and capture. The countdown runs, then the copy lands.
- Capture on a page that blocks clipboard writes (any page serving `Permissions-Policy: clipboard-write=()`), or switch focus to another window mid-capture. The badge shows the coral `!`.

- [ ] **Step 4: Walk the download path**

- Set After capture to Download. Capture full page. The file lands in the downloads folder, named from the filename template, with a `.png` extension.
- Confirm the hint line reads "Quick save writes a PNG." while Download is selected, and disappears for the other two.
- Change the filename template to include `{domain}` and capture again. The name follows the template.

- [ ] **Step 5: Confirm the stash still works**

After a quick capture of either kind, open the popup and click "Reopen last". The editor opens with that capture.

- [ ] **Step 6: Update the docs**

In `README.md`, add to the capture feature list:

```markdown
- Quick mode: send a capture straight to the clipboard or straight to disk, skipping the editor
```

In `agent_docs/store-listing.md`, add to the CAPTURE block:

```
• Quick mode: copy to clipboard or save to disk without opening the editor
```

- [ ] **Step 7: Full check and commit**

Run: `npm run typecheck && npm run lint && npm test && npm run build`
Expected: PASS.

```bash
git add README.md agent_docs/store-listing.md
git commit -m "docs: quick capture to clipboard or disk"
```
