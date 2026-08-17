# Image Import Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let any image enter the editor by drag and drop or paste, so the annotation tools work on pictures that never came from a capture.

**Architecture:** An imported image takes the same seat a capture takes: it becomes the `LastCapture` in storage and the controller's image, and every tool, export path, and the beautify frame keep working untouched. `LastCapture.mode` widens by one member, `'import'`, so the topbar can name what it is holding without a capture mode having to lie. Replacing the canvas destroys annotations and history the same way a crop does, so it asks first whenever there is something to lose.

**Tech Stack:** TypeScript, Preact, `FileReader`, the DataTransfer and Clipboard event APIs, Vitest. No new dependencies.

**Spec:** The Design section below. It is the approved design; the tasks implement it.

## Global Constraints

- **No new dependencies. No manifest changes** — a drop and a paste are page-local, and the editor already holds `unlimitedStorage`.
- **Vitest runs in `environment: 'node'`** (`vite.config.ts:27`). Unit tests must stay DOM-free. Pure logic goes in `src/editor/import-image.ts` and is unit-tested; `FileReader` and `Image` are only touched inside function bodies in that file, so importing it in a node test is safe.
- **Preact idiom:** `class`, not `className`. Match the surrounding file's comment density and naming.
- **Colour rule:** the extension's own chrome stays coral accent + amber danger, no blue.
- **An import must never silently destroy work.** With annotations on the canvas, the drop or paste opens a confirm dialog first.
- **Leave `ROADMAP.md` and every version field alone.** The release owns both.
- **Commit atomically** at the end of each task. No Claude co-author, no Claude trailers, no Claude references in commit messages.
- **Done means checks run:** `npm run typecheck && npm run lint && npm test && npm run build`.

---

## Design

### An import is a capture

```ts
export type CaptureSource = CaptureMode | 'import';
```

`LastCapture.mode` becomes a `CaptureSource`. The background still writes the three capture modes, so its exhaustive switches are untouched; only the editor's topbar label reads the new member, showing `Imported`.

The imported image is written to the stash with `setLastCapture`, which means "Reopen last" in the popup reopens it, and the editor survives a reload holding it.

### Replacing the canvas

An import replaces the image, so the annotation coordinates that referred to the old one are meaningless. It clears the annotation list, the undo history, the selection, and any open crop — the same destruction `applyCrop` performs (`useEditor.ts:773-816`), for the same reason.

Because it destroys, it asks: when the canvas already carries annotations, the file is held in `pendingImport` and a confirm dialog names the file and what goes with it. With an empty canvas there is nothing to lose, so the import applies straight away.

The beautify frame survives an import. It is a preference about presentation, not part of the document.

### Two entry points, one path

- **Drop** — the stage handles `dragover`/`drop`. A window-level handler cancels the browser's default for both events everywhere else on the page, because a stray drop would otherwise navigate the editor tab to the dropped file.
- **Paste** — a window `paste` listener reads `clipboardData.files`. It ignores the event while the target is a text field, so pasting into the text overlay or the filename box still pastes text.

Both hand a `File` to one `importFromFile` in the hook.

### Size limits

An image that exceeds Chrome's canvas caps cannot be edited or exported, so it is refused up front with the size in the message, using the caps already defined for export (`MAX_CANVAS_HEIGHT_PX`, `MAX_EXPORT_AREA_PX`). A file the browser cannot decode is refused the same way. Both surface as a dismissible notice over the stage, not as the full-stage error card, which is reserved for a capture that failed to load.

### Out of scope

Multi-image import, opening a file picker from a button, importing SVG as vector, and any second document or tab strip.

---

## Task 1: Import helpers

**Files:**

- Create: `src/editor/import-image.ts`
- Modify: `src/shared/types.ts:75-85` (`CaptureSource`, `LastCapture.mode`)
- Test: `tests/unit/import-image.test.ts`

**Interfaces:**

- Consumes: `sanitizeFilename` from `src/shared/utils.ts`, `MAX_CANVAS_HEIGHT_PX` from `src/shared/geometry.ts`, `MAX_EXPORT_AREA_PX` from `src/editor/scale.ts`.
- Produces: `pickImageFile<T extends { type: string }>(files: readonly T[]): T | null`, `titleFromFilename(name: string): string`, `importSizeError(w: number, h: number): string | null`, `readImageFile(file: File): Promise<{ dataUrl: string; img: HTMLImageElement }>`, and `CaptureSource` in `src/shared/types.ts`.

- [ ] **Step 1: Write the failing test**

Create `tests/unit/import-image.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import {
  importSizeError,
  pickImageFile,
  titleFromFilename,
} from '../../src/editor/import-image';
import { MAX_CANVAS_HEIGHT_PX } from '../../src/shared/geometry';

describe('pickImageFile', () => {
  it('takes the first image in the list', () => {
    const files = [
      { type: 'text/plain', name: 'notes.txt' },
      { type: 'image/png', name: 'shot.png' },
      { type: 'image/jpeg', name: 'photo.jpg' },
    ];
    expect(pickImageFile(files)?.name).toBe('shot.png');
  });

  it('accepts any image subtype, so webp and avif drop like png', () => {
    expect(pickImageFile([{ type: 'image/avif', name: 'a.avif' }])?.name).toBe('a.avif');
  });

  it('returns null when nothing in the drop is an image', () => {
    expect(pickImageFile([{ type: 'application/pdf', name: 'doc.pdf' }])).toBeNull();
    expect(pickImageFile([])).toBeNull();
  });
});

describe('titleFromFilename', () => {
  it('drops the extension', () => {
    expect(titleFromFilename('holiday.png')).toBe('holiday');
  });

  it('keeps dots inside the name', () => {
    expect(titleFromFilename('v1.2.final.jpg')).toBe('v1.2.final');
  });

  it('strips characters a download filename cannot carry', () => {
    expect(titleFromFilename('a/b:c.png')).toBe('a_b_c');
  });

  it('falls back for a name that sanitises away', () => {
    expect(titleFromFilename('.png')).toBe('image');
    expect(titleFromFilename('')).toBe('image');
  });
});

describe('importSizeError', () => {
  it('accepts an ordinary image', () => {
    expect(importSizeError(2400, 1360)).toBeNull();
  });

  it('refuses a side past the canvas cap, naming the size', () => {
    const msg = importSizeError(MAX_CANVAS_HEIGHT_PX + 1, 100);
    expect(msg).toContain(String(MAX_CANVAS_HEIGHT_PX + 1));
  });

  it('refuses an area past the canvas cap even when both sides fit', () => {
    expect(importSizeError(20000, 20000)).not.toBeNull();
  });

  it('refuses a file that decoded to nothing', () => {
    expect(importSizeError(0, 0)).not.toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/import-image.test.ts`
Expected: FAIL — `Failed to resolve import "../../src/editor/import-image"`.

- [ ] **Step 3: Widen the capture source**

In `src/shared/types.ts`, above the `LastCapture` interface:

```ts
/** Where the editor's image came from. An import is not a capture mode. */
export type CaptureSource = CaptureMode | 'import';
```

And in `LastCapture`:

```ts
  mode: CaptureSource;
```

The background writes only the three capture modes, so its switches stay exhaustive.

- [ ] **Step 4: Write minimal implementation**

Create `src/editor/import-image.ts`:

```ts
/**
 * Bringing an outside image into the editor.
 *
 * The pure half — which file to take, what to call it, whether it fits — is
 * here so it can be unit-tested without a DOM. `readImageFile` is the one
 * function that needs the browser, and it only touches it when called.
 */
import { sanitizeFilename } from '../shared/utils';
import { MAX_CANVAS_HEIGHT_PX } from '../shared/geometry';
import { MAX_EXPORT_AREA_PX } from './scale';

/** The first image in a drop or a paste. Non-images are ignored, not refused. */
export function pickImageFile<T extends { type: string }>(files: readonly T[]): T | null {
  for (const f of files) {
    if (f.type.startsWith('image/')) return f;
  }
  return null;
}

/** A filename without its extension, safe to feed the {title} filename token. */
export function titleFromFilename(name: string): string {
  const base = name.replace(/\.[^.]+$/, '');
  return sanitizeFilename(base).slice(0, 60) || 'image';
}

/**
 * Why this image cannot be edited, or null when it can. The limits are the
 * canvas caps the export already respects: an image past them could be loaded
 * but never composed or written out.
 */
export function importSizeError(w: number, h: number): string | null {
  if (!(w > 0) || !(h > 0)) return 'That file is not an image the editor can open.';
  if (w > MAX_CANVAS_HEIGHT_PX || h > MAX_CANVAS_HEIGHT_PX || w * h > MAX_EXPORT_AREA_PX) {
    return `That image is too large to edit (${w} × ${h}px).`;
  }
  return null;
}

/** Read a dropped or pasted file into a data URL and a decoded image. */
export function readImageFile(file: File): Promise<{ dataUrl: string; img: HTMLImageElement }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('read failed'));
    reader.onload = () => {
      const dataUrl = String(reader.result);
      const img = new Image();
      img.onload = () => resolve({ dataUrl, img });
      img.onerror = () => reject(new Error('decode failed'));
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run tests/unit/import-image.test.ts && npm run typecheck`
Expected: PASS, 11 tests.

- [ ] **Step 6: Commit**

```bash
git add src/editor/import-image.ts src/shared/types.ts tests/unit/import-image.test.ts
git commit -m "feat(editor): image import helpers"
```

---

## Task 2: Import in the editor hook

**Files:**

- Modify: `src/editor/useEditor.ts` (state, actions, return value)

**Interfaces:**

- Consumes: `pickImageFile`, `readImageFile`, `titleFromFilename`, `importSizeError` from Task 1; `setLastCapture` from `src/shared/storage.ts`.
- Produces on the hook's return value: `importFromFile(file: File): Promise<void>`, `pendingImport: PendingImport | null` (where `PendingImport` is `{ name: string; dataUrl: string; img: HTMLImageElement }`), `confirmImport(): void`, `cancelImport(): void`, `importError: string | null`, `dismissImportError(): void`.

There is no component-test harness in this repo (vitest runs in `node`), so this task is verified by typecheck, build, and the browser pass in Task 4.

- [ ] **Step 1: Add the imports and state**

In `src/editor/useEditor.ts`, add:

```ts
import { importSizeError, readImageFile, titleFromFilename } from './import-image';
```

`setLastCapture` joins the existing storage import:

```ts
import { getLastCapture, getSettings, setLastCapture, setSettings } from '../shared/storage';
```

Add the state next to `frame` (`useEditor.ts:109`):

```ts
  const [pendingImport, setPendingImport] = useState<PendingImport | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
```

Declare the payload type above `useEditor`, next to `TextOverlayPos`:

```ts
/** A decoded import waiting on the user's answer to "replace what is here?". */
interface PendingImport {
  name: string;
  dataUrl: string;
  img: HTMLImageElement;
}
```

- [ ] **Step 2: Apply an import**

Add after `applyCrop` (`useEditor.ts:816`), because it performs the same destruction for the same reason:

```ts
  /**
   * Put an imported image on the canvas. Annotation coordinates belong to the
   * image they were drawn on, so the list, the history, and any open crop go
   * with the old one. The beautify frame stays: it is a preference, not part of
   * the document.
   */
  const applyImport = useCallback(
    (p: PendingImport) => {
      const c = controllerRef.current;
      if (!c) return;
      const width = p.img.naturalWidth;
      const height = p.img.naturalHeight;
      const cap: LastCapture = {
        dataUrl: p.dataUrl,
        width,
        height,
        mode: 'import',
        title: titleFromFilename(p.name),
        capturedAt: Date.now(),
      };
      // Stashed like a capture, so the popup's "Reopen last" and a page reload
      // both find it.
      void setLastCapture(cap);
      setCapture(cap);
      setImageSize({ w: width, h: height });
      setAnnotations([]);
      setPast([]);
      setFuture([]);
      setSelectedId(null);
      setTextEdit(null);
      cancelCrop();
      setError(null);
      setImportError(null);
      setPendingImport(null);
      c.setImage(p.img);
    },
    [cancelCrop],
  );

  /** Read a dropped or pasted file, then import it — asking first if it would destroy work. */
  const importFromFile = useCallback(
    async (file: File) => {
      setImportError(null);
      let next: PendingImport;
      try {
        const { dataUrl, img } = await readImageFile(file);
        next = { name: file.name, dataUrl, img };
        const sizeError = importSizeError(img.naturalWidth, img.naturalHeight);
        if (sizeError) {
          setImportError(sizeError);
          return;
        }
      } catch {
        setImportError('Could not read that image.');
        return;
      }
      if (annotationsRef.current.length > 0) setPendingImport(next);
      else applyImport(next);
    },
    [applyImport],
  );

  // applyImport clears pendingImport itself, so this reads the value rather
  // than calling into it from inside a state updater.
  const confirmImport = useCallback(() => {
    if (pendingImport) applyImport(pendingImport);
  }, [pendingImport, applyImport]);

  const cancelImport = useCallback(() => setPendingImport(null), []);
  const dismissImportError = useCallback(() => setImportError(null), []);
```

- [ ] **Step 3: Drop a stored crop image, if drafts already exist**

Only if `src/editor/draft.ts` exists — that is, if the crash-safe draft plan has already landed. The stored crop image belongs to the document being replaced, so a draft written after an import would restore the wrong picture. Import `clearDraftImage` from `../shared/storage` and add it to `applyImport`, next to the other resets:

```ts
      // The stored crop image belongs to the document being replaced.
      void clearDraftImage();
```

If that file does not exist yet, skip this step: the crash-safe draft plan's Task 2 carries the same conditional line, so whichever of the two lands second adds it.

- [ ] **Step 4: Return the new surface**

Add to the object the hook returns (`useEditor.ts:896-947`):

```ts
    importFromFile,
    pendingImport,
    confirmImport,
    cancelImport,
    importError,
    dismissImportError,
```

- [ ] **Step 5: Verify and commit**

Run: `npm run typecheck && npm run lint && npm test && npm run build`
Expected: PASS.

```bash
git add src/editor/useEditor.ts
git commit -m "feat(editor): load an imported image onto the canvas"
```

---

## Task 3: Drop, paste, and the confirm dialog

**Files:**

- Modify: `src/editor/App.tsx:76-246` (`App`: window guards, paste listener, stage handlers, dialogs), `App.tsx:805-840` (`EmptyState`), `App.tsx:1034-1043` (`labelForMode`)
- Modify: `src/editor/editor.css` (append drop, notice, and modal-text styles)

**Interfaces:**

- Consumes: `importFromFile`, `pendingImport`, `confirmImport`, `cancelImport`, `importError`, `dismissImportError` from Task 2; `pickImageFile` from Task 1; `getFocusable`, `trapFocus` from `src/editor/focus.ts`.
- Produces: `labelForSource(mode: LastCapture['mode']): string`, replacing `labelForMode`.

- [ ] **Step 1: Keep a stray drop from navigating the tab**

In `src/editor/App.tsx`, add the import:

```ts
import { pickImageFile } from './import-image';
```

Add inside `App`, next to the other effects (after the `⌘S` effect at `App.tsx:67`):

```tsx
  // Without this, a file dropped anywhere but the stage navigates this tab to it.
  useEffect(() => {
    const stop = (e: DragEvent) => e.preventDefault();
    window.addEventListener('dragover', stop);
    window.addEventListener('drop', stop);
    return () => {
      window.removeEventListener('dragover', stop);
      window.removeEventListener('drop', stop);
    };
  }, []);

  // Paste an image to open it. Text fields keep their own paste.
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      if (isTypingTarget(e.target)) return;
      const file = pickImageFile(Array.from(e.clipboardData?.files ?? []));
      if (!file) return;
      e.preventDefault();
      void ed.importFromFile(file);
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [ed.importFromFile]);
```

Add the drag state next to `copyState` (`App.tsx:29`):

```tsx
  const [dragOver, setDragOver] = useState(false);
```

- [ ] **Step 2: Make the stage a drop target**

Replace the opening tag of the stage (`App.tsx:190`):

```tsx
        <div
          class="stage"
          data-dropping={dragOver ? 'true' : undefined}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const file = pickImageFile(Array.from(e.dataTransfer?.files ?? []));
            if (file) void ed.importFromFile(file);
          }}
        >
```

Add the notice inside the stage, above the crop confirm (`App.tsx:199`):

```tsx
          {ed.importError ? (
            <div class="stage-notice" role="status">
              <span>{ed.importError}</span>
              <button class="text-btn" onClick={ed.dismissImportError}>
                Dismiss
              </button>
            </div>
          ) : null}
```

- [ ] **Step 3: Add the confirm dialog**

Add next to the other dialogs at the end of `App` (`App.tsx:240-243`):

```tsx
      {ed.pendingImport ? <ImportConfirm ed={ed} /> : null}
```

And the component, next to `ExportDialog`:

```tsx
function ImportConfirm({ ed }: { ed: ReturnType<typeof useEditor> }) {
  const modalRef = useRef<HTMLDivElement>(null);
  const name = ed.pendingImport?.name ?? '';
  const count = ed.annotations.length;

  useEffect(() => {
    const prev = (document.activeElement as HTMLElement | null) ?? null;
    const focusable = modalRef.current ? getFocusable(modalRef.current) : [];
    focusable[0]?.focus();
    return () => {
      prev?.focus?.();
    };
  }, []);

  return (
    <div class="modal-backdrop" onMouseDown={ed.cancelImport}>
      <div
        ref={modalRef}
        class="modal"
        role="dialog"
        aria-modal="true"
        aria-label="Replace the current image"
        tabIndex={-1}
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          // A modal owns the keyboard while it is open — see ShortcutSheet's onKeyDown.
          e.stopPropagation();
          trapFocus(modalRef.current!, e);
          if (e.key === 'Escape') ed.cancelImport();
        }}
      >
        <h2 class="modal-title">Replace the current image?</h2>
        <p class="modal-text">
          “{name}” opens in place of what is on the canvas. {count}{' '}
          {count === 1 ? 'annotation' : 'annotations'} and the undo history go with it.
        </p>
        <div class="modal-actions">
          <span class="modal-actions-spacer" />
          <button class="text-btn" onClick={ed.cancelImport}>
            Cancel
          </button>
          <button class="btn-primary" onClick={ed.confirmImport}>
            Replace
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Name an imported document**

Replace `labelForMode` (`App.tsx:1034-1043`) with:

```tsx
function labelForSource(mode: LastCapture['mode']): string {
  switch (mode) {
    case 'full-page':
      return 'Full Page';
    case 'visible':
      return 'Visible';
    case 'region':
      return 'Region';
    case 'import':
      return 'Imported';
  }
}
```

Update its call site (`App.tsx:84`) to `labelForSource(ed.capture.mode)`, and add the type import:

```ts
import type { LastCapture } from '../shared/types';
```

- [ ] **Step 5: Say so on the empty stage**

In `EmptyState` (`App.tsx:830`), under the existing paragraph:

```tsx
        <p>Capture a page with OpenScreenShot, and it opens here.</p>
        <p class="empty-alt">Or drop an image here — paste works too.</p>
```

- [ ] **Step 6: Style it**

Append to `src/editor/editor.css`:

```css
.stage[data-dropping='true'] {
  outline: 2px dashed var(--accent);
  outline-offset: -8px;
}

.stage-notice {
  position: absolute;
  top: var(--s-3);
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: var(--s-2);
  max-width: 80%;
  padding: 6px 10px 6px 14px;
  border: 1px solid var(--danger);
  border-radius: var(--r-full);
  background: var(--surface-1);
  box-shadow: var(--sh-md);
  font-size: 13px;
  z-index: 7;
}

.modal-text {
  margin: 0 0 var(--s-4);
  color: var(--text-2);
  font-size: 13px;
  line-height: 1.5;
}

.empty-alt {
  color: var(--text-3);
  font-size: 12px;
}
```

- [ ] **Step 7: Verify and commit**

Run: `npm run typecheck && npm run lint && npm test && npm run build`
Expected: PASS.

```bash
git add src/editor/App.tsx src/editor/editor.css
git commit -m "feat(editor): drop or paste an image into the editor"
```

---

## Task 4: Browser verification and docs

**Files:**

- Modify: `README.md` (editor feature list)
- Modify: `agent_docs/store-listing.md` (ANNOTATE block)

- [ ] **Step 1: Build and load the extension**

Run: `npm run build`

Load `dist/` as an unpacked extension. Open the editor from the extension's options entry with no capture stashed, so the empty state shows.

- [ ] **Step 2: Walk the drop path**

- Drop a PNG onto the empty stage. It opens, fits the view, and the topbar reads `Imported`.
- Drop a JPEG onto a stage that already holds an image with no annotations. It replaces it without asking.
- Draw two annotations, then drop another image. The confirm dialog names the file and says two annotations go with it. Cancel keeps everything. Repeat and confirm — the canvas holds the new image, the annotation count in the tool rail is gone, and undo is disabled.
- Drag a file over the stage. The dashed outline appears, and it clears on drop and on drag-out.
- Drop a `.txt` file. Nothing happens.
- Drop a file onto the topbar rather than the stage. The tab does not navigate.

- [ ] **Step 3: Walk the paste path**

- Copy an image in another app, focus the editor, press `⌘V` / `Ctrl+V`. It opens.
- Open the export dialog, click into the filename field, and paste text. The text lands in the field and no import happens.
- Place a text annotation, and paste while the text overlay is focused. The text pastes into the overlay.

- [ ] **Step 4: Confirm the imported image behaves like a capture**

- Annotate, crop, and export a PNG. The file carries the edits.
- Turn Beautify on. The frame wraps the imported image, and the frame survives the next import.
- Open the export dialog. The filename defaults to the dropped file's name.
- Reload the editor tab. The imported image comes back.
- Open the popup and click "Reopen last". The imported image opens.
- Drop an image larger than the canvas caps (for example 40000 × 100). The notice names the size, and the canvas keeps what it had.

- [ ] **Step 5: Update the docs**

In `README.md`, add to the editor feature list:

```markdown
- Drop or paste any image into the editor to annotate it — no capture needed
```

In `agent_docs/store-listing.md`, add to the ANNOTATE block:

```
• Drag and drop or paste any image into the editor to annotate it
```

- [ ] **Step 6: Full check and commit**

Run: `npm run typecheck && npm run lint && npm test && npm run build`
Expected: PASS.

```bash
git add README.md agent_docs/store-listing.md
git commit -m "docs: image import in the editor"
```
