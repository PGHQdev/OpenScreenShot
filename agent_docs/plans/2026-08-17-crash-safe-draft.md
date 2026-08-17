# Crash-Safe Draft Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Survive a crashed or closed editor tab: annotations are written to local storage as the user works, and reopening the same capture offers them back.

**Architecture:** A draft is the annotation list plus the beautify frame, keyed to the `capturedAt` of the capture it was drawn on. A debounced effect writes it; a `visibilitychange` flush covers the close that does not wait for the debounce. The working image is written separately and only when a crop replaces it, because the untouched image already lives in the capture stash and rewriting megabytes on every stroke would be absurd. Restoring is opt-in: the editor loads empty and a bar offers the draft, so a stale draft can never silently overwrite what the user meant to start fresh.

**Tech Stack:** TypeScript, Preact, `chrome.storage.local` (the extension already holds `unlimitedStorage`), Vitest. No new dependencies.

**Spec:** The Design section below. It is the approved design; the tasks implement it.

## Global Constraints

- **No new dependencies. No manifest changes** — `storage` and `unlimitedStorage` are already granted.
- **Vitest runs in `environment: 'node'`** (`vite.config.ts:27`). Unit tests must stay DOM-free. Draft shape, validation, and the frame round-trip go in `src/editor/draft.ts` and are unit-tested; the hook and the bar are verified in the browser (Task 4).
- **`src/shared/` never imports from `src/editor/`.** The storage helpers therefore take and return `unknown`, and `src/editor/draft.ts` owns the shape and the validation.
- **A draft must never silently replace the canvas.** Restoring is a click.
- **Bad storage must not break the editor.** `parseDraft` returns null for anything it cannot vouch for, and the editor then behaves as if there were no draft.
- **Preact idiom:** `class`, not `className`. Match the surrounding file's comment density and naming.
- **Colour rule:** the extension's own chrome stays coral accent + amber danger, no blue.
- **Leave `ROADMAP.md` and every version field alone.** The release owns both.
- **Commit atomically** at the end of each task. No Claude co-author, no Claude trailers, no Claude references in commit messages.
- **Done means checks run:** `npm run typecheck && npm run lint && npm test && npm run build`.

---

## Design

### What a draft holds

```ts
interface Draft {
  sourceCapturedAt: number;   // the capture these coordinates belong to
  annotations: Annotation[];
  frame: FrameSettings;       // the five beautify fields, in Settings shape
  savedAt: number;
}
```

The frame is stored in `Settings` shape so `frameFromSettings` — already written, already tested, already clamping — is the validator. No second sanitizer exists for it.

### Why the image is a separate key

Annotation coordinates are image coordinates. A crop replaces the image, so a draft restored onto the stashed pre-crop capture would scatter its annotations. The cropped image is therefore written to `openscreenshot:draft-image` at the moment the crop is applied — once per crop, not once per stroke. With no draft image stored, the draft belongs to the stashed capture as it is.

### When it writes

- **Debounced, 800 ms**, on any change to the annotation list or the frame.
- **On `visibilitychange` to hidden**, without the debounce. `beforeunload` is not used: an async storage write started there is not guaranteed to land.
- **Never while the restore bar is showing.** The canvas is empty at that moment; a save then would erase the draft being offered.
- **An empty annotation list clears both keys** rather than writing an empty draft. There is nothing to restore from zero annotations, and the frame is already persisted in settings.

### When it offers

On load, the editor reads the draft. It offers it only when the draft parses, carries at least one annotation, and its `sourceCapturedAt` matches the loaded capture. Any other stored draft is stale and is deleted on the spot.

The offer is a bar over the stage with Restore and Discard. Restore loads the draft image if there is one, then the annotations, then the frame, and clears the undo history — the pre-restore empty state is not a step worth undoing to.

### Out of scope

Multi-slot version history, restoring across different captures, syncing drafts between machines, and any automatic restore without a click.

---

## Task 1: Draft shape, validation, and storage

**Files:**

- Create: `src/editor/draft.ts`
- Modify: `src/shared/storage.ts` (append the draft keys and helpers)
- Test: `tests/unit/draft.test.ts`

**Interfaces:**

- Consumes: `Annotation` from `src/editor/annotations.ts`; `FrameOptions`, `frameFromSettings`, `frameToSettings` from `src/editor/frame.ts`; `DEFAULT_SETTINGS` from `src/shared/types.ts`.
- Produces: `DRAFT_DEBOUNCE_MS`, `type Draft`, `makeDraft(sourceCapturedAt: number, annotations: Annotation[], frame: FrameOptions, savedAt?: number): Draft`, `parseDraft(value: unknown): Draft | null`, `draftFrame(draft: Draft): FrameOptions`, and in `src/shared/storage.ts`: `getDraft(): Promise<unknown>`, `setDraft(draft: unknown): Promise<void>`, `clearDraft(): Promise<void>`, `getDraftImage(): Promise<string | null>`, `setDraftImage(dataUrl: string): Promise<void>`, `clearDraftImage(): Promise<void>`.

- [ ] **Step 1: Write the failing test**

Create `tests/unit/draft.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { draftFrame, makeDraft, parseDraft } from '../../src/editor/draft';
import { DEFAULT_FRAME } from '../../src/editor/frame';
import type { Annotation } from '../../src/editor/annotations';

const rect: Annotation = {
  id: 'a1',
  type: 'rect',
  x: 10,
  y: 20,
  w: 30,
  h: 40,
  stroke: '#ff3b30',
  strokeWidth: 6,
  fill: null,
};

describe('makeDraft', () => {
  it('keeps the annotations and the capture it belongs to', () => {
    const d = makeDraft(1700, [rect], DEFAULT_FRAME, 1800);
    expect(d.sourceCapturedAt).toBe(1700);
    expect(d.annotations).toEqual([rect]);
    expect(d.savedAt).toBe(1800);
  });

  it('stores the frame in Settings shape, so frameFromSettings can validate it', () => {
    const d = makeDraft(1, [rect], { ...DEFAULT_FRAME, enabled: true, padding: 55 });
    expect(d.frame.beautifyEnabled).toBe(true);
    expect(d.frame.beautifyPadding).toBe(55);
  });
});

describe('parseDraft', () => {
  it('round-trips what makeDraft produced', () => {
    const d = makeDraft(1700, [rect], { ...DEFAULT_FRAME, enabled: true }, 1800);
    expect(parseDraft(JSON.parse(JSON.stringify(d)))).toEqual(d);
  });

  it('rejects anything that is not a draft, so bad storage cannot break the editor', () => {
    expect(parseDraft(null)).toBeNull();
    expect(parseDraft('draft')).toBeNull();
    expect(parseDraft({})).toBeNull();
    expect(parseDraft({ sourceCapturedAt: 'soon', annotations: [] })).toBeNull();
    expect(parseDraft({ sourceCapturedAt: 1, annotations: 'none' })).toBeNull();
  });

  it('voids the whole draft on one unusable annotation, rather than dropping it quietly', () => {
    expect(parseDraft({ sourceCapturedAt: 1, annotations: [rect, { type: 'rect' }] })).toBeNull();
    expect(parseDraft({ sourceCapturedAt: 1, annotations: [{ id: 'x', type: 'ufo' }] })).toBeNull();
  });

  it('accepts an empty annotation list', () => {
    const parsed = parseDraft({ sourceCapturedAt: 5, annotations: [], frame: {}, savedAt: 9 });
    expect(parsed?.annotations).toEqual([]);
  });

  it('clamps a stored frame value that fell outside its range', () => {
    const parsed = parseDraft({
      sourceCapturedAt: 5,
      annotations: [],
      frame: { beautifyPadding: 999, beautifyShadow: -3 },
    });
    expect(parsed?.frame.beautifyPadding).toBe(100);
    expect(parsed?.frame.beautifyShadow).toBe(0);
  });

  it('survives a missing frame and a missing savedAt', () => {
    const parsed = parseDraft({ sourceCapturedAt: 5, annotations: [] });
    expect(parsed).not.toBeNull();
    expect(draftFrame(parsed!)).toEqual(DEFAULT_FRAME);
  });
});

describe('draftFrame', () => {
  it('rebuilds the frame the editor stored', () => {
    const frame = { ...DEFAULT_FRAME, enabled: true, radius: 12 };
    const d = makeDraft(1, [], frame, 2);
    expect(draftFrame(d)).toEqual(frame);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/draft.test.ts`
Expected: FAIL — `Failed to resolve import "../../src/editor/draft"`.

- [ ] **Step 3: Write minimal implementation**

Create `src/editor/draft.ts`:

```ts
/**
 * The editor's crash-safety net.
 *
 * A draft is the annotation list plus the beautify frame, tied to the capture
 * the coordinates belong to. This module owns the shape and the validation;
 * `src/shared/storage.ts` only moves the bytes, because shared code must not
 * import editor types.
 *
 * The frame rides along in `Settings` shape so `frameFromSettings` — which
 * already clamps sliders and vets backgrounds — is the only validator it needs.
 */
import type { Annotation, AnnotationType } from './annotations';
import { frameFromSettings, frameToSettings, type FrameOptions } from './frame';
import { DEFAULT_SETTINGS, type Settings } from '../shared/types';

/** How long the editor waits after the last edit before writing. */
export const DRAFT_DEBOUNCE_MS = 800;

type FrameSettings = ReturnType<typeof frameToSettings>;

export interface Draft {
  /** `capturedAt` of the capture these annotation coordinates belong to. */
  sourceCapturedAt: number;
  annotations: Annotation[];
  frame: FrameSettings;
  savedAt: number;
}

const ANNOTATION_TYPES: ReadonlySet<string> = new Set<AnnotationType>([
  'rect',
  'arrow',
  'line',
  'pen',
  'text',
  'blur',
  'highlight',
  'step',
  'spotlight',
]);

export function makeDraft(
  sourceCapturedAt: number,
  annotations: Annotation[],
  frame: FrameOptions,
  savedAt: number = Date.now(),
): Draft {
  return { sourceCapturedAt, annotations, frame: frameToSettings(frame), savedAt };
}

/** The frame a draft was saved with, clamped and vetted on the way out. */
export function draftFrame(draft: Draft): FrameOptions {
  return frameFromSettings({ ...DEFAULT_SETTINGS, ...draft.frame });
}

/**
 * Read a stored value back into a draft, or null when it cannot be vouched for.
 *
 * One unusable annotation voids the whole draft. Dropping it instead would
 * restore a picture the user never drew, which is worse than restoring nothing.
 */
export function parseDraft(value: unknown): Draft | null {
  if (!value || typeof value !== 'object') return null;
  const v = value as { sourceCapturedAt?: unknown; annotations?: unknown; frame?: unknown; savedAt?: unknown };
  if (typeof v.sourceCapturedAt !== 'number' || !Number.isFinite(v.sourceCapturedAt)) return null;
  if (!Array.isArray(v.annotations)) return null;
  for (const a of v.annotations) {
    if (!isAnnotation(a)) return null;
  }
  const stored = (v.frame ?? {}) as Partial<Settings>;
  return {
    sourceCapturedAt: v.sourceCapturedAt,
    annotations: v.annotations as Annotation[],
    frame: frameToSettings(frameFromSettings({ ...DEFAULT_SETTINGS, ...stored })),
    savedAt: typeof v.savedAt === 'number' ? v.savedAt : 0,
  };
}

function isAnnotation(value: unknown): value is Annotation {
  if (!value || typeof value !== 'object') return false;
  const a = value as { id?: unknown; type?: unknown };
  return typeof a.id === 'string' && typeof a.type === 'string' && ANNOTATION_TYPES.has(a.type);
}
```

- [ ] **Step 4: Add the storage helpers**

Append to `src/shared/storage.ts`:

```ts
const DRAFT_KEY = 'openscreenshot:draft';
const DRAFT_IMAGE_KEY = 'openscreenshot:draft-image';

/**
 * The editor's in-progress edits. The value is `unknown` here on purpose:
 * `src/editor/draft.ts` owns the shape and validates it on the way back, and
 * shared code must not import editor types.
 */
export async function setDraft(draft: unknown): Promise<void> {
  await chrome.storage.local.set({ [DRAFT_KEY]: draft });
}

export async function getDraft(): Promise<unknown> {
  const stored = await chrome.storage.local.get(DRAFT_KEY);
  return stored[DRAFT_KEY] ?? null;
}

export async function clearDraft(): Promise<void> {
  await chrome.storage.local.remove(DRAFT_KEY);
}

/**
 * The working image, written only when a crop replaces it. Without this the
 * draft's coordinates would be restored against the uncropped stash.
 */
export async function setDraftImage(dataUrl: string): Promise<void> {
  await chrome.storage.local.set({ [DRAFT_IMAGE_KEY]: dataUrl });
}

export async function getDraftImage(): Promise<string | null> {
  const stored = await chrome.storage.local.get(DRAFT_IMAGE_KEY);
  return (stored[DRAFT_IMAGE_KEY] as string | undefined) ?? null;
}

export async function clearDraftImage(): Promise<void> {
  await chrome.storage.local.remove(DRAFT_IMAGE_KEY);
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run tests/unit/draft.test.ts && npm run typecheck`
Expected: PASS, 10 tests.

- [ ] **Step 6: Commit**

```bash
git add src/editor/draft.ts src/shared/storage.ts tests/unit/draft.test.ts
git commit -m "feat(editor): draft model and storage"
```

---

## Task 2: Autosave and restore in the hook

**Files:**

- Modify: `src/editor/useEditor.ts` (frame ref, load, autosave, flush, restore, discard, crop image write, return value)

**Interfaces:**

- Consumes: `DRAFT_DEBOUNCE_MS`, `Draft`, `makeDraft`, `parseDraft`, `draftFrame` from Task 1; `getDraft`, `setDraft`, `clearDraft`, `getDraftImage`, `setDraftImage`, `clearDraftImage` from Task 1's storage additions.
- Produces on the hook's return value: `draftPrompt: Draft | null`, `restoreDraft(): void`, `discardDraft(): void`.

There is no component-test harness in this repo (vitest runs in `node`), so this task is verified by typecheck, build, and the browser pass in Task 4.

- [ ] **Step 1: Add the imports and state**

In `src/editor/useEditor.ts`:

```ts
import { draftFrame, DRAFT_DEBOUNCE_MS, makeDraft, parseDraft, type Draft } from './draft';
```

Extend the storage import:

```ts
import {
  clearDraft,
  clearDraftImage,
  getDraft,
  getDraftImage,
  getLastCapture,
  getSettings,
  setDraft,
  setDraftImage,
  setSettings,
} from '../shared/storage';
```

Add the state next to `frame` (`useEditor.ts:109`):

```ts
  const [draftPrompt, setDraftPrompt] = useState<Draft | null>(null);
```

- [ ] **Step 2: Keep a frame ref for the flush**

The visibility flush runs outside React's render, so it needs the current frame without a stale closure. Extend the existing frame effect (`useEditor.ts:145-147`):

```ts
  const frameRef = useRef(frame);
  // Sync the beautify frame to the controller, and to a ref for the draft flush.
  useEffect(() => {
    frameRef.current = frame;
    controllerRef.current?.setFrame(frame);
  }, [frame]);
```

- [ ] **Step 3: Offer a matching draft on load**

In the mount effect, straight after `setImageSize({ w: cap.width, h: cap.height });` (`useEditor.ts:348`):

```ts
      // A draft only fits the capture it was drawn on. Anything else is stale.
      const stored = parseDraft(await getDraft());
      if (stored && stored.sourceCapturedAt === cap.capturedAt && stored.annotations.length > 0) {
        setDraftPrompt(stored);
      } else if (stored) {
        void clearDraft();
        void clearDraftImage();
      }
```

- [ ] **Step 4: Save the cropped image**

In `applyCrop` (`useEditor.ts:793-799`), reuse one encode and stash it, because the crop is the only thing that makes the working image differ from the stash:

```ts
    cx.drawImage(c.image, n.x, n.y, n.w, n.h, 0, 0, canvas.width, canvas.height);
    const cropped = canvas.toDataURL('image/png');
    // The draft's coordinates now belong to this image, not to the stash.
    void setDraftImage(cropped);
    const img = new Image();
    img.onload = () => {
      c.setImage(img);
      setImageSize({ w: canvas.width, h: canvas.height });
    };
    img.src = cropped;
```

- [ ] **Step 5: Drop the stored image when an import replaces the canvas**

Only if `applyImport` exists in this file — that is, if the image-import plan has already landed. An imported image makes a stored crop image stale, and a draft written after the import would restore the wrong picture. Add to `applyImport`, next to the other resets:

```ts
      // The stored crop image belongs to the document being replaced.
      void clearDraftImage();
```

If `applyImport` does not exist yet, skip this step: the image-import plan's Task 2 carries the same conditional line, so whichever of the two lands second adds it.

- [ ] **Step 6: Write the draft**

Add after `applyCrop`:

```ts
  /**
   * Debounced crash-safety net. It holds off while the restore bar is up: the
   * canvas is empty then, and saving would erase the draft being offered.
   * An empty list clears both keys — there is nothing to restore from zero
   * annotations, and the frame is already persisted in settings.
   */
  useEffect(() => {
    if (loading || !capture || draftPrompt) return;
    const timer = window.setTimeout(() => {
      if (annotations.length === 0) {
        void clearDraft();
        void clearDraftImage();
        return;
      }
      void setDraft(makeDraft(capture.capturedAt, annotations, frame));
    }, DRAFT_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [annotations, frame, loading, capture, draftPrompt]);

  // A closing tab does not wait out the debounce. `beforeunload` is not used:
  // a storage write started there is not guaranteed to land.
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState !== 'hidden') return;
      if (loading || !capture || draftPrompt) return;
      if (annotationsRef.current.length === 0) return;
      void setDraft(makeDraft(capture.capturedAt, annotationsRef.current, frameRef.current));
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [loading, capture, draftPrompt]);
```

- [ ] **Step 7: Restore and discard**

```ts
  /**
   * Put a draft back. The image comes first when a crop stored one, so the
   * annotations land on the picture their coordinates were measured against.
   */
  const restoreDraft = useCallback(() => {
    const d = draftPrompt;
    if (!d) return;
    setDraftPrompt(null);
    setFrameState(draftFrame(d));
    setPast([]);
    setFuture([]);
    setSelectedId(null);
    void getDraftImage().then((dataUrl) => {
      if (!dataUrl) {
        setAnnotations(d.annotations);
        return;
      }
      const img = new Image();
      img.onload = () => {
        controllerRef.current?.setImage(img);
        setImageSize({ w: img.naturalWidth, h: img.naturalHeight });
        setAnnotations(d.annotations);
      };
      img.onerror = () => setAnnotations(d.annotations);
      img.src = dataUrl;
    });
  }, [draftPrompt]);

  const discardDraft = useCallback(() => {
    setDraftPrompt(null);
    void clearDraft();
    void clearDraftImage();
  }, []);
```

- [ ] **Step 8: Return the new surface**

Add to the object the hook returns (`useEditor.ts:896-947`):

```ts
    draftPrompt,
    restoreDraft,
    discardDraft,
```

- [ ] **Step 9: Verify and commit**

Run: `npm run typecheck && npm run lint && npm test && npm run build`
Expected: PASS.

```bash
git add src/editor/useEditor.ts
git commit -m "feat(editor): save and restore an editing draft"
```

---

## Task 3: The restore bar

**Files:**

- Modify: `src/editor/App.tsx:190-231` (stage overlays)
- Modify: `src/editor/editor.css` (append the bar styles)

**Interfaces:**

- Consumes: `draftPrompt`, `restoreDraft`, `discardDraft` from Task 2.
- Produces: no new exports.

- [ ] **Step 1: Add the bar**

In `src/editor/App.tsx`, inside the stage, above the crop confirm (`App.tsx:199`):

```tsx
          {ed.draftPrompt ? (
            <div class="draft-restore" role="status">
              <span>
                Unsaved edits from your last session ({ed.draftPrompt.annotations.length}{' '}
                {ed.draftPrompt.annotations.length === 1 ? 'annotation' : 'annotations'}).
              </span>
              <button class="btn-primary btn-sm" onClick={ed.restoreDraft}>
                Restore
              </button>
              <button class="text-btn" onClick={ed.discardDraft}>
                Discard
              </button>
            </div>
          ) : null}
```

The crop confirm and this bar cannot both show: a crop needs a drag on the canvas, and the bar is answered before any drawing starts.

- [ ] **Step 2: Style it**

Append to `src/editor/editor.css`, matching `.crop-confirm` (`editor.css:509`):

```css
.draft-restore {
  position: absolute;
  top: var(--s-3);
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: var(--s-2);
  max-width: 90%;
  padding: 6px 10px 6px 14px;
  border: 1px solid var(--accent);
  border-radius: var(--r-full);
  background: var(--surface-1);
  box-shadow: var(--sh-md);
  font-size: 13px;
  z-index: 8;
}
```

- [ ] **Step 3: Verify and commit**

Run: `npm run typecheck && npm run lint && npm test && npm run build`
Expected: PASS.

```bash
git add src/editor/App.tsx src/editor/editor.css
git commit -m "feat(editor): offer unsaved edits when the editor reopens"
```

---

## Task 4: Browser verification and docs

**Files:**

- Modify: `README.md` (editor feature list)
- Modify: `agent_docs/store-listing.md` (ANNOTATE block)

- [ ] **Step 1: Build and load the extension**

Run: `npm run build`

Load `dist/` as an unpacked extension and capture a page.

- [ ] **Step 2: Watch it write**

- Draw three annotations. Open DevTools on the editor page and run `chrome.storage.local.get('openscreenshot:draft')`. The draft holds three annotations and the capture's `capturedAt`.
- Delete all three. Within a second the key is gone.

- [ ] **Step 3: Walk the restore**

- Draw two annotations, then close the tab without exporting. Reopen the editor from the popup's "Reopen last".
- The bar reads "Unsaved edits from your last session (2 annotations)."
- Click Restore. Both annotations come back at the right coordinates, with the beautify frame they were drawn with. Undo is disabled.
- Repeat, and click Discard instead. The canvas stays empty, and reopening again shows no bar.

- [ ] **Step 4: Walk the crop case**

- Draw an annotation, crop tightly around it, then close the tab.
- Reopen and Restore. The cropped image comes back, with the annotation on the same spot of it.

- [ ] **Step 5: Walk the stale cases**

- With a draft saved, take a new capture. The editor opens with no bar, and the old draft key is gone.
- Write junk into the key (`chrome.storage.local.set({ 'openscreenshot:draft': 'nonsense' })`) and reload the editor. No bar, no error, and the key is cleared.

- [ ] **Step 6: Confirm the close paths**

- Draw an annotation and immediately close the tab (inside the 800 ms debounce). Reopen: the bar offers it, because the visibility flush caught it.
- Switch to another tab, then back. No bar appears mid-session, and nothing on the canvas changes.

- [ ] **Step 7: Update the docs**

In `README.md`, add to the editor feature list:

```markdown
- Crash-safe: edits are saved locally as you work, and offered back if the tab closes
```

In `agent_docs/store-listing.md`, add to the ANNOTATE block:

```
• Crash-safe drafts: reopen the editor and pick up where you left off
```

- [ ] **Step 8: Full check and commit**

Run: `npm run typecheck && npm run lint && npm test && npm run build`
Expected: PASS.

```bash
git add README.md agent_docs/store-listing.md
git commit -m "docs: crash-safe editor drafts"
```
