# Eyedropper Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the user set the annotation colour by sampling a pixel — from the capture itself with a new `I` tool, or from anywhere on the screen with the native EyeDropper API.

**Architecture:** Two pickers, one sink. Both resolve to a `#rrggbb` string and call the existing `setStyleColor`, which already recolours the selection, updates the style bar, and remembers custom colours. The in-canvas pick reads one pixel out of the rendered canvas through a new `CanvasController.sampleAt`, so what the user clicks is what they get — annotations, spotlight dim, and beautify background included. The screen pick wraps `window.EyeDropper` behind a pure function that takes its scope as an argument, so it is testable without a DOM.

**Tech Stack:** TypeScript, Preact, Canvas 2D (`getImageData`), the EyeDropper API (Chrome 95+), Vitest. No new dependencies.

**Spec:** The Design section below. It is the approved design; the tasks implement it.

## Global Constraints

- **No new dependencies. No manifest changes** — no new permission, and `minimum_chrome_version` stays at 99. The EyeDropper API landed in Chrome 95, so every supported version has it; the feature check exists so a browser without it hides the button instead of throwing.
- **Vitest runs in `environment: 'node'`** (`vite.config.ts:27`). Unit tests must stay DOM-free. Pure logic goes in `src/editor/eyedropper.ts`; anything touching a real canvas is verified in the browser (Task 4).
- **Preact idiom:** `class`, not `className`. Match the surrounding file's comment density and naming.
- **Colour rule:** the extension's own chrome stays coral accent + amber danger, no blue. Sampled colours are user content and may be any hue.
- **Every switch over `Tool` is exhaustive.** Adding a tool means touching `stylebarFields` (`src/editor/stylebar.ts:54`), `ToolIcon` (`src/editor/App.tsx:842`), and `hintForTool` (`src/editor/App.tsx:1045`), or the build fails.
- **Leave `ROADMAP.md` and every version field alone.** The release owns both.
- **Commit atomically** at the end of each task. No Claude co-author, no Claude trailers, no Claude references in commit messages.
- **Done means checks run:** `npm run typecheck && npm run lint && npm test && npm run build`.

---

## Design

### Two pickers

| Picker | Range | Entry point |
| --- | --- | --- |
| In-canvas | The editor canvas, at the current zoom | The `I` tool in the tool rail |
| Screen | Anything Chrome can see, including other windows | A swatch-sized button at the end of the style bar's colour row |

Both end at `setStyleColor(hex)` (`src/editor/useEditor.ts:255`), so a sampled colour recolours the current selection and lands in the recent-colours list exactly like a custom colour picked from the swatch.

### Sampling the rendered canvas, not the source image

`sampleAt(sx, sy)` reads one pixel out of the visible canvas with `getImageData`. That returns what the user is pointing at, which is the point of an eyedropper: a colour inside a spotlight's dim, or from the beautify gradient, samples as it looks.

Two consequences the implementation has to handle:

- Selection handles are painted on the same canvas. Switching to the eyedropper clears the selection, so no handle can sit over the pixel being read.
- The backing store is scaled by `devicePixelRatio`, so screen coordinates are multiplied by `dpr` before the read.

The canvas is never tainted: every image it draws comes from a `data:` URL, which does not taint.

### One-shot tool

A pick hands the tool back to whatever was active before the eyedropper. Sampling a colour is a step inside drawing something, so returning to the previous tool is what the next click wants. `Esc` and a click that lands outside the canvas leave the colour alone.

### The screen picker is optional

`window.EyeDropper` exists in Chrome 95+. It is feature-detected, and the button is only rendered when it is present. Its `open()` rejects when the user presses `Esc`; that is a cancel, so it resolves to `null` rather than an error.

### Out of scope

A magnifying loupe, a hover preview before the click, sampling into the beautify background colour, and any average-of-N-pixels sampling.

---

## Task 1: Colour sampling helpers

**Files:**

- Create: `src/editor/eyedropper.ts`
- Test: `tests/unit/eyedropper.test.ts`

**Interfaces:**

- Consumes: `normalizeHex` from `src/editor/palette.ts`.
- Produces: `rgbToHex(r: number, g: number, b: number): string`, `hasScreenPicker(scope: ScreenPickerScope): boolean`, `openScreenPicker(scope: ScreenPickerScope): Promise<string | null>`, `type ScreenPickerScope`, and a `Window.EyeDropper` global declaration.

- [ ] **Step 1: Write the failing test**

Create `tests/unit/eyedropper.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import {
  hasScreenPicker,
  openScreenPicker,
  rgbToHex,
  type ScreenPickerScope,
} from '../../src/editor/eyedropper';

/** A stand-in for window.EyeDropper that resolves with a fixed colour. */
function scopeThatPicks(sRGBHex: string): ScreenPickerScope {
  return {
    EyeDropper: class {
      open() {
        return Promise.resolve({ sRGBHex });
      }
    },
  };
}

/** A stand-in that rejects, the way the real picker does on Esc. */
function scopeThatCancels(): ScreenPickerScope {
  return {
    EyeDropper: class {
      open() {
        return Promise.reject(new Error('AbortError'));
      }
    },
  };
}

describe('rgbToHex', () => {
  it('renders a colour as lowercase six-digit hex', () => {
    expect(rgbToHex(255, 59, 48)).toBe('#ff3b30');
    expect(rgbToHex(0, 0, 0)).toBe('#000000');
    expect(rgbToHex(255, 255, 255)).toBe('#ffffff');
  });

  it('pads every channel to two digits', () => {
    expect(rgbToHex(1, 2, 3)).toBe('#010203');
  });

  it('rounds and clamps, so a float or an out-of-range channel still parses', () => {
    expect(rgbToHex(12.6, -4, 999)).toBe('#0d00ff');
  });
});

describe('hasScreenPicker', () => {
  it('is true when the API is present', () => {
    expect(hasScreenPicker(scopeThatPicks('#123456'))).toBe(true);
  });

  it('is false on a browser without it', () => {
    expect(hasScreenPicker({})).toBe(false);
  });
});

describe('openScreenPicker', () => {
  it('returns the picked colour, normalised', async () => {
    await expect(openScreenPicker(scopeThatPicks('#AABBCC'))).resolves.toBe('#aabbcc');
  });

  it('returns null when the user cancels, since Esc rejects', async () => {
    await expect(openScreenPicker(scopeThatCancels())).resolves.toBeNull();
  });

  it('returns null when the API is missing', async () => {
    await expect(openScreenPicker({})).resolves.toBeNull();
  });

  it('returns null for a colour it cannot parse', async () => {
    await expect(openScreenPicker(scopeThatPicks('rebeccapurple'))).resolves.toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/eyedropper.test.ts`
Expected: FAIL — `Failed to resolve import "../../src/editor/eyedropper"`.

- [ ] **Step 3: Write minimal implementation**

Create `src/editor/eyedropper.ts`:

```ts
/**
 * Colour picking.
 *
 * Two sources end here: a click on the editor canvas (the controller reads the
 * pixel, this module names it) and the browser's screen picker. Both hand back
 * a `#rrggbb` string for `setStyleColor`, so the rest of the editor cannot tell
 * them apart.
 */
import { normalizeHex } from './palette';

interface EyeDropperResult {
  sRGBHex: string;
}

interface EyeDropperInstance {
  open(): Promise<EyeDropperResult>;
}

export type EyeDropperCtor = new () => EyeDropperInstance;

declare global {
  // TypeScript's DOM lib does not declare the EyeDropper API (Chrome 95+) yet.
  interface Window {
    EyeDropper?: EyeDropperCtor;
  }
}

/** The window surface the screen picker needs — a plain object in tests. */
export type ScreenPickerScope = Pick<Window, 'EyeDropper'>;

/** Name an 8-bit RGB triple. Channels are rounded and clamped before padding. */
export function rgbToHex(r: number, g: number, b: number): string {
  const channel = (v: number) => {
    const n = Math.max(0, Math.min(255, Math.round(v)));
    return n.toString(16).padStart(2, '0');
  };
  return `#${channel(r)}${channel(g)}${channel(b)}`;
}

/** True when the browser offers a screen-wide colour picker. */
export function hasScreenPicker(scope: ScreenPickerScope): boolean {
  return typeof scope.EyeDropper === 'function';
}

/**
 * Open the browser's screen picker. Resolves to null on cancel, on an
 * unparsable colour, and on a browser without the API — every one of those is
 * "no colour was picked", and none of them is worth an error surface.
 */
export async function openScreenPicker(scope: ScreenPickerScope): Promise<string | null> {
  const Picker = scope.EyeDropper;
  if (!Picker) return null;
  try {
    const result = await new Picker().open();
    return normalizeHex(result.sRGBHex);
  } catch {
    // Esc closes the picker by rejecting. A cancel is not a failure.
    return null;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/eyedropper.test.ts && npm run typecheck`
Expected: PASS, 10 tests.

- [ ] **Step 5: Commit**

```bash
git add src/editor/eyedropper.ts tests/unit/eyedropper.test.ts
git commit -m "feat(editor): colour sampling helpers"
```

---

## Task 2: The eyedropper tool

**Files:**

- Modify: `src/editor/canvas.ts` (add `sampleAt`)
- Modify: `src/editor/tools.ts:20-53` (`Tool`, `TOOL_LIST`)
- Modify: `src/editor/stylebar.ts:21-72` (`stylebarFields`)
- Modify: `src/editor/useEditor.ts:134-137` (tool effect) and `useEditor.ts:610-701` (`onCanvasMouseDown`)
- Modify: `src/editor/App.tsx:842-924` (`ToolIcon`) and `App.tsx:1045-1070` (`hintForTool`)
- Test: `tests/unit/tools.test.ts` (append), `tests/unit/stylebar.test.ts` (append)

**Interfaces:**

- Consumes: `rgbToHex` from Task 1; `setStyleColor` from `src/editor/useEditor.ts:255`.
- Produces: `CanvasController.sampleAt(sx: number, sy: number): string | null`, the `'eyedropper'` member of `Tool`, and its `TOOL_LIST` entry with shortcut `I`.

- [ ] **Step 1: Write the failing test**

Append to `tests/unit/tools.test.ts`:

```ts
describe('eyedropper tool', () => {
  it('is in the toolbar with a free shortcut letter', () => {
    const dropper = TOOL_LIST.find((t) => t.id === 'eyedropper');
    expect(dropper).toBeDefined();
    expect(dropper?.shortcut).toBe('I');
    const letters = TOOL_LIST.map((t) => t.shortcut);
    expect(new Set(letters).size).toBe(letters.length);
  });
});
```

Append to `tests/unit/stylebar.test.ts`:

```ts
describe('stylebarFields for the eyedropper', () => {
  it('shows the colour row, so the picked colour is visible where it landed', () => {
    expect(stylebarFields('eyedropper', null)).toEqual({
      color: true,
      stroke: false,
      fontSize: false,
      shape: false,
      redaction: false,
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/unit/tools.test.ts tests/unit/stylebar.test.ts`
Expected: FAIL — the tool is undefined, and `'eyedropper'` is not assignable to `Tool`.

- [ ] **Step 3: Add the tool**

In `src/editor/tools.ts`, extend the union and the list:

```ts
export type Tool =
  | 'select'
  | 'rect'
  | 'arrow'
  | 'line'
  | 'pen'
  | 'highlight'
  | 'text'
  | 'step'
  | 'blur'
  | 'spotlight'
  | 'eyedropper'
  | 'crop';
```

```ts
  { id: 'spotlight', label: 'Spotlight', shortcut: 'O' },
  { id: 'eyedropper', label: 'Eyedropper', shortcut: 'I' },
  { id: 'crop', label: 'Crop', shortcut: 'C' },
```

`ShapeTool` is unchanged: the eyedropper drafts nothing.

In `src/editor/stylebar.ts`, add the case to the tool switch, next to `text`/`step`:

```ts
    case 'eyedropper':
      return { ...NONE, color: true };
```

- [ ] **Step 4: Read a pixel from the canvas**

In `src/editor/canvas.ts`, add the import:

```ts
import { rgbToHex } from './eyedropper';
```

Add the method after `toScreen` (`canvas.ts:171-173`):

```ts
  /**
   * Colour of the rendered pixel under a screen point, as #rrggbb, or null when
   * the point is off-canvas or fully transparent.
   *
   * It reads the rendered canvas rather than the source image, so a pick lands
   * on what the user sees: annotations, spotlight dim, and beautify background
   * included. The backing store carries the device pixel ratio, so the screen
   * point is scaled before the read.
   */
  sampleAt(sx: number, sy: number): string | null {
    if (!this.image) return null;
    const x = Math.round(sx * this.dpr);
    const y = Math.round(sy * this.dpr);
    if (x < 0 || y < 0 || x >= this.canvas.width || y >= this.canvas.height) return null;
    const [r, g, b, a] = this.ctx.getImageData(x, y, 1, 1).data;
    return a === 0 ? null : rgbToHex(r, g, b);
  }
```

- [ ] **Step 5: Wire the click**

In `src/editor/useEditor.ts`, add the one-shot bookkeeping right after the `toolRef` effect (`useEditor.ts:134-137`):

```ts
  // The eyedropper is a one-shot: it sets the colour for whatever you were
  // drawing with, then hands that tool back. Clearing the selection matters too
  // — a handle painted over the pixel would be sampled instead of the pixel.
  const prevToolRef = useRef<Tool>('select');
  useEffect(() => {
    if (tool === 'eyedropper') setSelectedId(null);
    else prevToolRef.current = tool;
  }, [tool]);
```

In `onCanvasMouseDown`, add the branch above the `t === 'crop'` branch (`useEditor.ts:677`):

```ts
      if (t === 'eyedropper') {
        const hex = c.sampleAt(sx, sy);
        if (hex) setStyleColor(hex);
        setTool(prevToolRef.current);
        return;
      }
```

Add `setStyleColor` to that callback's dependency array:

```ts
    [onDragMove, onDragUp, setStyleColor],
```

- [ ] **Step 6: Give it an icon and a hint**

In `src/editor/App.tsx`, add to `ToolIcon`, before the `crop` case:

```tsx
    case 'eyedropper':
      return (
        <svg {...common}>
          <path d="M18 3.5a2.1 2.1 0 0 1 3 3L15 12.5l-3-3z" />
          <path d="M12 9.5 4.5 17v2.5H7L14.5 12" />
        </svg>
      );
```

And to `hintForTool`, before the `select` case:

```ts
    case 'eyedropper':
      return 'Click any pixel to take its color · the previous tool comes back';
```

The stage cursor needs no change: `App.tsx:68-74` falls through to `crosshair` for every tool that is not select or text.

- [ ] **Step 7: Verify and commit**

Run: `npm run typecheck && npm run lint && npm test && npm run build`
Expected: PASS.

```bash
git add src/editor/tools.ts src/editor/stylebar.ts src/editor/canvas.ts src/editor/useEditor.ts src/editor/App.tsx tests/unit/tools.test.ts tests/unit/stylebar.test.ts
git commit -m "feat(editor): eyedropper tool samples the canvas"
```

---

## Task 3: Screen picker button

**Files:**

- Modify: `src/editor/App.tsx:248-296` (`StyleBar` colour group)
- Modify: `src/editor/editor.css` (append `.swatch-screen`)
- Modify: `src/editor/ShortcutSheet.tsx:16-36` (`buildCommands`)

**Interfaces:**

- Consumes: `hasScreenPicker`, `openScreenPicker` from Task 1; `setStyleColor` from the hook.
- Produces: no new exports.

- [ ] **Step 1: Add the button**

In `src/editor/App.tsx`, add the import:

```ts
import { hasScreenPicker, openScreenPicker } from './eyedropper';
```

Add the feature check next to `BLUR_MODES` (`App.tsx:368`):

```ts
// Chrome 95+. Feature-detected once: the answer cannot change while the page lives.
const CAN_PICK_SCREEN = hasScreenPicker(window);
```

Inside `StyleBar`, above the returned markup:

```tsx
  function pickFromScreen() {
    void openScreenPicker(window).then((hex) => {
      if (hex) ed.setStyleColor(hex);
    });
  }
```

Add the button inside `.swatches`, after the custom-colour label (`App.tsx:286-293`):

```tsx
            {CAN_PICK_SCREEN ? (
              <button
                class="swatch swatch-screen"
                title="Pick a color from anywhere on screen"
                aria-label="Pick a color from anywhere on screen"
                onClick={pickFromScreen}
              >
                <IconDropper />
              </button>
            ) : null}
```

Add the icon next to the other icon components (near `App.tsx:1014`):

```tsx
function IconDropper() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2.5"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M18 3.5a2.1 2.1 0 0 1 3 3L15 12.5l-3-3z" />
      <path d="M12 9.5 4.5 17v2.5H7L14.5 12" />
    </svg>
  );
}
```

- [ ] **Step 2: Style it**

Append to `src/editor/editor.css`, under the `.swatch-custom` rules (`editor.css:85`):

```css
.swatch-screen {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--surface-2);
  color: var(--text-1);
}
```

`.swatch` already supplies the 18px box, the border, the radius, and the hover scale.

- [ ] **Step 3: List it in the shortcut sheet**

In `src/editor/ShortcutSheet.tsx`, add to the command list, under `Set color`:

```ts
    { label: 'Pick a color from the screen', keys: 'Style bar' },
```

The `I` tool row comes from `TOOL_LIST` already.

- [ ] **Step 4: Verify and commit**

Run: `npm run typecheck && npm run lint && npm test && npm run build`
Expected: PASS.

```bash
git add src/editor/App.tsx src/editor/editor.css src/editor/ShortcutSheet.tsx
git commit -m "feat(editor): pick a color from anywhere on screen"
```

---

## Task 4: Browser verification and docs

**Files:**

- Modify: `README.md` (editor feature list)
- Modify: `agent_docs/store-listing.md` (ANNOTATE block)

- [ ] **Step 1: Build and load the extension**

Run: `npm run build`

Load `dist/` as an unpacked extension, capture a colourful page, and open the editor.

- [ ] **Step 2: Walk the in-canvas picks**

- Press `I`. The eyedropper is active and the style bar shows the colour row alone.
- Click a red area of the screenshot. The active swatch becomes that colour, the tool returns to whatever was active before, and the colour appears in the recent-colours list.
- Select a rectangle annotation, then press `I`. The handles disappear at once, and the pick sets the style-bar colour without recolouring that annotation — the selection is gone by then, which is the design.
- Zoom to 400% and pick. The colour matches the pixel under the cursor, not a neighbour.
- Turn Beautify on and pick inside the padding. The gradient colour is sampled.
- Draw a spotlight, then pick inside the dimmed area. The dimmed colour is sampled, not the underlying pixel.
- Click outside the image (the empty stage). Nothing changes and no error appears.
- Confirm on a Retina display and on an external 1x monitor: both sample the pixel under the cursor.

- [ ] **Step 3: Walk the screen pick**

- Click the screen-picker button at the end of the colour row. Chrome's picker opens.
- Sample a colour from another window. The style bar adopts it.
- Reopen it and press `Esc`. The colour is unchanged.

- [ ] **Step 4: Confirm nothing else moved**

- Every other tool letter still selects its tool, and `1`–`8` still set palette colours.
- Export a PNG. The sampled colours are in the file.

- [ ] **Step 5: Update the docs**

In `README.md`, add to the editor feature list:

```markdown
- Eyedropper (`I`): take a color from the capture, or from anywhere on screen
```

In `agent_docs/store-listing.md`, add to the ANNOTATE block:

```
• Eyedropper: match a color from the screenshot or anywhere on your screen
```

- [ ] **Step 6: Full check and commit**

Run: `npm run typecheck && npm run lint && npm test && npm run build`
Expected: PASS.

```bash
git add README.md agent_docs/store-listing.md
git commit -m "docs: eyedropper color picker"
```
