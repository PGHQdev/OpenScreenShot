# Beautify Mode + Export Scale Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the editor a beautify frame (padding, rounded corners, shadow, gradient or solid background) that previews live on the canvas and travels into every export, plus a scale control in the export dialog that writes PNG/JPEG/WebP at a chosen width.

**Architecture:** Beautify is a document-level `FrameOptions` value, never an annotation. One pure module (`src/editor/frame.ts`) converts it to pixel metrics and paints it; both draw paths use that module, so preview and export cannot drift. The screenshot's top-left stays image coordinate `(0,0)` and the frame occupies negative coordinates, so `toImage`, `toScreen`, all eleven tools, hit-testing, and `applyCrop` need no change. Export scale resamples the composed 1x canvas through `src/editor/scale.ts`.

**Tech Stack:** TypeScript, Preact, Canvas 2D (`roundRect`, `createLinearGradient`), Vitest. No new dependencies.

**Spec:** The Design section below. It is the approved design; the tasks implement it.

## Global Constraints

- **No new dependencies.** Everything here is Canvas 2D plus code already in the repo.
- **Vitest runs in `environment: 'node'`** (`vite.config.ts:27`). Unit tests must stay DOM-free. Pure maths goes in `frame.ts` / `scale.ts` / `viewport.ts` and is unit-tested; anything touching a real canvas is verified in the browser (see Task 9).
- **Beautify defaults to off.** With `enabled: false`, `composeFinal()` must produce the same pixels it produces today. Task 2 carries the regression guard.
- **No manifest changes.** No new permission, no new host permission.
- **Preact idiom:** `class`, not `className`. Match the surrounding file's comment density and naming.
- **Colour rule:** the extension's own chrome stays coral accent + amber danger, no blue. Background presets are user content and may use any hue.
- **Slider values are unitless 0–100** and are stored that way. Pixels are derived from the image's shorter side, so one stored value looks right on a 480 px region and a 3000 px full-page capture.
- **Commit atomically** at the end of each task. No Claude co-author, no Claude trailers, no Claude references in commit messages.
- **Done means checks run:** `npm run typecheck && npm run lint && npm test && npm run build`.

---

## Design

### Frame model

```ts
export type PresetId = 'ink' | 'coral' | 'dusk' | 'mint' | 'sand' | 'sky';

export type FrameBackground =
  | { kind: 'preset'; id: PresetId }
  | { kind: 'solid'; color: string }
  | { kind: 'transparent' };

export interface FrameOptions {
  enabled: boolean;
  padding: number; // 0..100
  radius: number;  // 0..100
  shadow: number;  // 0..100
  background: FrameBackground;
}
```

`frameMetrics(opts, imgW, imgH)` resolves those to pixels against `min(imgW, imgH)`. The panel shows the derived px under each slider.

### Origin rule

The screenshot's top-left stays `(0,0)` in image space. The frame runs from `(-pad, -pad)` to `(imgW + pad, imgH + pad)`. Nothing that reads or writes annotation coordinates changes.

### One draw path

`paintFrame(ctx, m, background, scale)` assumes the ctx origin sits at the screenshot's top-left. It fills the background across the outer box, then fills a rounded rect of the screenshot with a shadow set on it. The caller clips to the same rounded rect with `clipToFrame(ctx, m)` and draws the screenshot and annotations.

`scale` is an explicit argument because `ctx.shadowBlur` and `ctx.shadowOffsetY` ignore the transform matrix. The preview passes the zoom; the export passes 1. This is the one place where preview and export could disagree, so it lives in the signature.

- `render()` (`canvas.ts:175`): with beautify on, the frame replaces the white plate, the checkerboard, the decorative shadow, and the hairline stroke. With a transparent background, the checkerboard is drawn across the outer box first, so the alpha reads as alpha. With beautify off, today's code runs unchanged.
- `composeFinal()` (`canvas.ts:233`): canvas sized `outerW x outerH`, `translate(pad, pad)`, `paintFrame`, `clipToFrame`, then the existing image, spotlight, annotation sequence. The clip keeps annotations off the padding and out of the rounded corners. With beautify off, `pad` and `radius` are 0 and `paintFrame` returns without drawing, so the output matches today's.

### Viewport

`centerView(viewportW, viewportH, outerW, outerH, pad, zoom)` in `viewport.ts` returns the pan that centres the outer box, expressed as the screen position of the screenshot origin. `fit()` calls it with `fitZoom(...)` over the framed size; `resetZoom()` calls it with `1`.

### Export scale

`halvingSteps(srcW, targetW)` returns the widths to draw through: repeated halving while the factor is under 0.5, then the exact target. `resampleToWidth(canvas, targetW)` walks those steps at `imageSmoothingQuality = 'high'`.

It resamples the composed 1x canvas, so annotations shrink with the screenshot they were drawn on, at the stroke weights the user chose. `exportImage()` gains an optional `targetWidth` applied between `composeFinal()` and `canvasToDataUrl()`. `exportPdf` and `copyImage` do not take it: PDF page size and margins already decide the physical output.

### UI

A Beautify button sits in the topbar between `ZoomMenu` and Copy, opening a popover built on the `ZoomMenu.tsx` pattern (capture-phase key handling, outside-mousedown close). The panel holds an on/off switch, three sliders, six gradient swatches, white, transparent, and a custom solid reusing `normalizeHex` from `palette.ts`.

The export dialog gains a Scale row above Quality: 25 / 50 / 100 / 200 %, a Width field in px, and a live `2400 x 1360 -> 1280 x 725` readout. The row is hidden when the format is PDF.

### Persistence

Five flat `Settings` fields matching the existing `pdf*` idiom: `beautifyEnabled`, `beautifyPadding`, `beautifyRadius`, `beautifyShadow`, `beautifyBackground`. Written on change behind the same skip-first-run guard as the annotation style effect (`useEditor.ts:146`).

Export scale is per-export intent: it resets to 100% each time the dialog opens and stays out of "Remember these settings".

### Out of scope

Custom gradients, per-side padding, browser-window chrome mockups, 3D tilt, watermarks, image backgrounds.

---

## Task 1: Frame model and metrics

**Files:**

- Create: `src/editor/frame.ts`
- Modify: `src/shared/types.ts` (declare the background union next to `Settings`)
- Test: `tests/unit/frame.test.ts`

**Interfaces:**

- Consumes: nothing.
- Produces: `PresetId` and `FrameBackground` (declared in `src/shared/types.ts`, re-exported from `frame.ts`), `FrameOptions`, `FrameMetrics`, `DEFAULT_FRAME`, `BACKGROUND_PRESETS`, `frameMetrics(opts: FrameOptions, imgW: number, imgH: number): FrameMetrics`.

The two background types live in `src/shared/types.ts` because `Settings` stores one. Declaring them in `frame.ts` instead would make `types.ts` and `frame.ts` import each other.

- [ ] **Step 1: Write the failing test**

Create `tests/unit/frame.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { DEFAULT_FRAME, frameMetrics, type FrameOptions } from '../../src/editor/frame';

const on = (patch: Partial<FrameOptions> = {}): FrameOptions => ({
  ...DEFAULT_FRAME,
  enabled: true,
  ...patch,
});

describe('frameMetrics', () => {
  it('is a no-op when beautify is off', () => {
    const m = frameMetrics({ ...DEFAULT_FRAME, enabled: false }, 800, 600);
    expect(m.pad).toBe(0);
    expect(m.radius).toBe(0);
    expect(m.shadowAlpha).toBe(0);
    expect(m.outerW).toBe(800);
    expect(m.outerH).toBe(600);
  });

  it('takes padding from the shorter side, so shape does not change the look', () => {
    expect(frameMetrics(on({ padding: 100 }), 1000, 1000).pad).toBe(120);
    expect(frameMetrics(on({ padding: 100 }), 500, 4000).pad).toBe(60);
    expect(frameMetrics(on({ padding: 50 }), 1000, 1000).pad).toBe(60);
  });

  it('grows the outer box by the padding on every side', () => {
    const m = frameMetrics(on({ padding: 40 }), 1000, 700);
    expect(m.pad).toBe(34);
    expect(m.outerW).toBe(1000 + 34 * 2);
    expect(m.outerH).toBe(700 + 34 * 2);
    expect(m.imgW).toBe(1000);
    expect(m.imgH).toBe(700);
  });

  it('takes the corner radius from the shorter side too', () => {
    expect(frameMetrics(on({ radius: 100 }), 1000, 4000).radius).toBe(60);
    expect(frameMetrics(on({ radius: 50 }), 1000, 1000).radius).toBe(30);
  });

  it('derives the shadow offset and alpha from the strength', () => {
    const m = frameMetrics(on({ shadow: 45 }), 1000, 1000);
    expect(m.shadowBlur).toBe(23);
    expect(m.shadowOffsetY).toBe(8);
    expect(m.shadowAlpha).toBeGreaterThan(0);
    expect(m.shadowAlpha).toBeLessThan(1);
  });

  it('draws no shadow at strength zero', () => {
    const m = frameMetrics(on({ shadow: 0 }), 1000, 1000);
    expect(m.shadowBlur).toBe(0);
    expect(m.shadowAlpha).toBe(0);
  });

  it('clamps slider values that fall outside 0..100', () => {
    expect(frameMetrics(on({ padding: 999 }), 1000, 1000).pad).toBe(120);
    expect(frameMetrics(on({ padding: -50 }), 1000, 1000).pad).toBe(0);
  });

  it('survives a one-pixel image', () => {
    const m = frameMetrics(on({ padding: 100, radius: 100 }), 1, 1);
    expect(Number.isFinite(m.pad)).toBe(true);
    expect(m.outerW).toBeGreaterThanOrEqual(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/frame.test.ts`
Expected: FAIL — `Failed to resolve import "../../src/editor/frame"`.

- [ ] **Step 3: Declare the background union in shared types**

In `src/shared/types.ts`, add above the `Settings` interface:

```ts
/** Beautify frame background. `Settings` stores one; see src/editor/frame.ts. */
export type PresetId = 'ink' | 'coral' | 'dusk' | 'mint' | 'sand' | 'sky';

export type FrameBackground =
  | { kind: 'preset'; id: PresetId }
  | { kind: 'solid'; color: string }
  | { kind: 'transparent' };
```

- [ ] **Step 4: Write minimal implementation**

Create `src/editor/frame.ts`:

```ts
/**
 * The beautify frame — padding, rounded corners, shadow, and a background —
 * around the screenshot.
 *
 * The frame is a document property, not an annotation: the screenshot's
 * top-left stays image coordinate (0,0) and the frame occupies negative
 * coordinates, so every tool, hit test, and crop keeps working untouched.
 *
 * Slider values are unitless 0..100 and resolve against the image's shorter
 * side, so one stored value looks the same on a 480px region and a 3000px
 * full-page capture.
 */
import type { FrameBackground, PresetId } from '../shared/types';

export type { FrameBackground, PresetId };

export interface FrameOptions {
  enabled: boolean;
  /** 0..100, resolved against the shorter image side. */
  padding: number;
  radius: number;
  shadow: number;
  background: FrameBackground;
}

export interface FrameMetrics {
  pad: number;
  radius: number;
  shadowBlur: number;
  shadowOffsetY: number;
  shadowAlpha: number;
  imgW: number;
  imgH: number;
  outerW: number;
  outerH: number;
}

export interface BackgroundPreset {
  id: PresetId;
  label: string;
  from: string;
  to: string;
  direction: 'diagonal' | 'vertical';
}

/** Swatch order in the panel. */
export const BACKGROUND_PRESETS: BackgroundPreset[] = [
  { id: 'ink', label: 'Ink', from: '#2b303b', to: '#12141a', direction: 'diagonal' },
  { id: 'coral', label: 'Coral', from: '#ff7a59', to: '#e0326b', direction: 'diagonal' },
  { id: 'dusk', label: 'Dusk', from: '#4c3a8f', to: '#1e1b3a', direction: 'diagonal' },
  { id: 'mint', label: 'Mint', from: '#37d2a8', to: '#0f8f8f', direction: 'diagonal' },
  { id: 'sand', label: 'Sand', from: '#f7d08a', to: '#dd8a5b', direction: 'vertical' },
  { id: 'sky', label: 'Sky', from: '#8fc4ff', to: '#3f7ae0', direction: 'vertical' },
];

/** Fractions of the shorter image side at slider value 100. */
const PAD_FRACTION = 0.12;
const RADIUS_FRACTION = 0.06;
const SHADOW_BLUR_FRACTION = 0.05;
const SHADOW_OFFSET_RATIO = 0.35;
const SHADOW_ALPHA_MIN = 0.06;
const SHADOW_ALPHA_MAX = 0.38;

export const DEFAULT_FRAME: FrameOptions = {
  enabled: false,
  padding: 40,
  radius: 30,
  shadow: 45,
  background: { kind: 'preset', id: 'ink' },
};

/** Slider value (0..100) to a 0..1 fraction, clamped. */
function unit(v: number): number {
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(100, v)) / 100;
}

export function frameMetrics(opts: FrameOptions, imgW: number, imgH: number): FrameMetrics {
  const base = { imgW, imgH, outerW: imgW, outerH: imgH };
  if (!opts.enabled) {
    return { pad: 0, radius: 0, shadowBlur: 0, shadowOffsetY: 0, shadowAlpha: 0, ...base };
  }
  const short = Math.max(1, Math.min(imgW, imgH));
  const pad = Math.round(unit(opts.padding) * PAD_FRACTION * short);
  // roundRect scales oversized radii itself, so no cap is needed here.
  const radius = Math.round(unit(opts.radius) * RADIUS_FRACTION * short);
  const shadowBlur = Math.round(unit(opts.shadow) * SHADOW_BLUR_FRACTION * short);
  const shadowAlpha =
    unit(opts.shadow) === 0
      ? 0
      : SHADOW_ALPHA_MIN + unit(opts.shadow) * (SHADOW_ALPHA_MAX - SHADOW_ALPHA_MIN);
  return {
    pad,
    radius,
    shadowBlur,
    shadowOffsetY: Math.round(shadowBlur * SHADOW_OFFSET_RATIO),
    shadowAlpha,
    imgW,
    imgH,
    outerW: imgW + pad * 2,
    outerH: imgH + pad * 2,
  };
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run tests/unit/frame.test.ts && npm run typecheck`
Expected: PASS, 8 tests.

- [ ] **Step 6: Commit**

```bash
git add src/editor/frame.ts src/shared/types.ts tests/unit/frame.test.ts
git commit -m "feat(editor): frame metrics for beautify mode"
```

---

## Task 2: Frame painting and the export composite

**Files:**

- Modify: `src/editor/frame.ts` (append `paintFrame`, `clipToFrame`)
- Modify: `src/editor/canvas.ts:233-257` (`composeFinal`), plus a `frame` field and `setFrame` on the controller
- Test: `tests/unit/frame-paint.test.ts`

**Interfaces:**

- Consumes: `FrameMetrics`, `FrameBackground`, `frameMetrics`, `DEFAULT_FRAME` from Task 1.
- Produces: `paintFrame(ctx, m: FrameMetrics, bg: FrameBackground, scale: number): void`, `clipToFrame(ctx, m: FrameMetrics): void`, `CanvasController.frame: FrameOptions`, `CanvasController.setFrame(f: FrameOptions): void`.

The test drives `paintFrame` with a hand-written recorder, because vitest runs without a DOM. The recorder implements only the ctx surface `paintFrame` uses.

- [ ] **Step 1: Write the failing test**

Create `tests/unit/frame-paint.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import {
  DEFAULT_FRAME,
  frameMetrics,
  paintFrame,
  type FrameBackground,
  type FrameOptions,
} from '../../src/editor/frame';

interface FillRectCall {
  x: number;
  y: number;
  w: number;
  h: number;
  style: unknown;
}

/** The slice of CanvasRenderingContext2D that paintFrame touches. */
class FakeCtx {
  fillStyle: unknown = '';
  shadowColor = '';
  shadowBlur = 0;
  shadowOffsetY = 0;
  fillRects: FillRectCall[] = [];
  roundRects: { x: number; y: number; w: number; h: number; r: number }[] = [];
  shadowBlurAtFill: number[] = [];
  gradients: { coords: number[]; stops: string[] }[] = [];
  fills = 0;

  save(): void {}
  restore(): void {}
  beginPath(): void {}
  fillRect(x: number, y: number, w: number, h: number): void {
    this.fillRects.push({ x, y, w, h, style: this.fillStyle });
  }
  roundRect(x: number, y: number, w: number, h: number, r: number): void {
    this.roundRects.push({ x, y, w, h, r });
  }
  fill(): void {
    this.fills += 1;
    this.shadowBlurAtFill.push(this.shadowBlur);
  }
  createLinearGradient(x0: number, y0: number, x1: number, y1: number) {
    const g = { coords: [x0, y0, x1, y1], stops: [] as string[] };
    this.gradients.push(g);
    return { addColorStop: (_o: number, c: string) => g.stops.push(c) };
  }
}

const paint = (opts: Partial<FrameOptions>, scale = 1, w = 1000, h = 800) => {
  const frame: FrameOptions = { ...DEFAULT_FRAME, enabled: true, ...opts };
  const ctx = new FakeCtx();
  const m = frameMetrics(frame, w, h);
  paintFrame(ctx as unknown as CanvasRenderingContext2D, m, frame.background, scale);
  return { ctx, m };
};

describe('paintFrame', () => {
  it('draws nothing when the frame is off', () => {
    const ctx = new FakeCtx();
    const m = frameMetrics({ ...DEFAULT_FRAME, enabled: false }, 1000, 800);
    paintFrame(ctx as unknown as CanvasRenderingContext2D, m, DEFAULT_FRAME.background, 1);
    expect(ctx.fillRects).toHaveLength(0);
    expect(ctx.fills).toBe(0);
  });

  it('covers the whole outer box, starting at the negative padding', () => {
    const { ctx, m } = paint({ padding: 40 });
    const bg = ctx.fillRects[0];
    expect(bg.x).toBe(-m.pad);
    expect(bg.y).toBe(-m.pad);
    expect(bg.w).toBe(m.outerW);
    expect(bg.h).toBe(m.outerH);
  });

  it('paints a preset as a two-stop gradient', () => {
    const bg: FrameBackground = { kind: 'preset', id: 'coral' };
    const { ctx } = paint({ background: bg });
    expect(ctx.gradients).toHaveLength(1);
    expect(ctx.gradients[0].stops).toEqual(['#ff7a59', '#e0326b']);
  });

  it('paints a solid background with the given colour', () => {
    const { ctx } = paint({ background: { kind: 'solid', color: '#123456' } });
    expect(ctx.fillRects[0].style).toBe('#123456');
  });

  it('fills no background when the background is transparent', () => {
    const { ctx } = paint({ background: { kind: 'transparent' } });
    expect(ctx.fillRects).toHaveLength(0);
    expect(ctx.fills).toBe(1); // the shadow plate still draws
  });

  it('rounds the screenshot rect at the metric radius', () => {
    const { ctx, m } = paint({ radius: 30 });
    expect(ctx.roundRects[0]).toEqual({ x: 0, y: 0, w: m.imgW, h: m.imgH, r: m.radius });
  });

  it('scales the shadow with the caller scale, since ctx ignores the transform', () => {
    const one = paint({ shadow: 60 }, 1);
    const two = paint({ shadow: 60 }, 2);
    expect(two.ctx.shadowBlurAtFill[0]).toBeCloseTo(one.ctx.shadowBlurAtFill[0] * 2, 10);
    expect(two.ctx.shadowOffsetY).toBeCloseTo(one.ctx.shadowOffsetY * 2, 10);
  });

  it('skips the shadow plate at shadow strength zero', () => {
    const { ctx } = paint({ shadow: 0, padding: 40 });
    expect(ctx.fills).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/frame-paint.test.ts`
Expected: FAIL — `paintFrame is not a function`.

- [ ] **Step 3: Write minimal implementation**

Append to `src/editor/frame.ts`:

```ts
const PRESET_BY_ID: Record<PresetId, BackgroundPreset> = Object.fromEntries(
  BACKGROUND_PRESETS.map((p) => [p.id, p]),
) as Record<PresetId, BackgroundPreset>;

/**
 * Paint the background and the drop shadow. The ctx origin must sit at the
 * screenshot's top-left; the frame is drawn out into negative coordinates.
 *
 * `scale` carries the caller's zoom because shadowBlur and shadowOffsetY are
 * applied in output space and ignore the transform matrix — without it the
 * preview and the export would disagree about shadow size.
 */
export function paintFrame(
  ctx: CanvasRenderingContext2D,
  m: FrameMetrics,
  bg: FrameBackground,
  scale: number,
): void {
  if (m.pad === 0 && m.radius === 0 && m.shadowAlpha === 0) return;

  if (bg.kind !== 'transparent') {
    ctx.save();
    ctx.fillStyle =
      bg.kind === 'solid' ? bg.color : presetGradient(ctx, bg.id, -m.pad, -m.pad, m.outerW, m.outerH);
    ctx.fillRect(-m.pad, -m.pad, m.outerW, m.outerH);
    ctx.restore();
  }

  if (m.shadowAlpha > 0) {
    ctx.save();
    ctx.shadowColor = `rgba(0, 0, 0, ${m.shadowAlpha})`;
    ctx.shadowBlur = m.shadowBlur * scale;
    ctx.shadowOffsetY = m.shadowOffsetY * scale;
    // The plate is hidden by the screenshot drawn over it; it exists to cast.
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(0, 0, m.imgW, m.imgH, m.radius);
    ctx.fill();
    ctx.restore();
  }
}

/** Clip to the screenshot's rounded rect. Callers draw the image inside it. */
export function clipToFrame(ctx: CanvasRenderingContext2D, m: FrameMetrics): void {
  ctx.beginPath();
  ctx.roundRect(0, 0, m.imgW, m.imgH, m.radius);
  ctx.clip();
}

function presetGradient(
  ctx: CanvasRenderingContext2D,
  id: PresetId,
  x: number,
  y: number,
  w: number,
  h: number,
): CanvasGradient {
  const p = PRESET_BY_ID[id] ?? BACKGROUND_PRESETS[0];
  const g =
    p.direction === 'vertical'
      ? ctx.createLinearGradient(x, y, x, y + h)
      : ctx.createLinearGradient(x, y, x + w, y + h);
  g.addColorStop(0, p.from);
  g.addColorStop(1, p.to);
  return g;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/frame-paint.test.ts`
Expected: PASS, 8 tests.

- [ ] **Step 5: Route the export composite through the frame**

In `src/editor/canvas.ts`, add the import:

```ts
import { clipToFrame, DEFAULT_FRAME, frameMetrics, paintFrame, type FrameOptions } from './frame';
```

Add the field next to `cropRect` (around `canvas.ts:54`):

```ts
  /** Beautify frame. Document-level, so it lives beside the image, not the annotations. */
  frame: FrameOptions = DEFAULT_FRAME;
```

Add the setter next to `setCropRect`:

```ts
  setFrame(f: FrameOptions): void {
    this.frame = f;
    this.render();
  }
```

Replace the body of `composeFinal()` (`canvas.ts:233-257`) with:

```ts
  /** Composite the frame + image + annotations at full image resolution for export. */
  composeFinal(): HTMLCanvasElement {
    const img = this.image;
    if (!img) throw new Error('No image to export');
    const m = frameMetrics(this.frame, img.naturalWidth, img.naturalHeight);
    const canvas = document.createElement('canvas');
    canvas.width = m.outerW;
    canvas.height = m.outerH;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context unavailable');
    // Origin at the screenshot's top-left, matching annotation coordinates.
    ctx.translate(m.pad, m.pad);
    paintFrame(ctx, m, this.frame.background, 1);
    ctx.save();
    clipToFrame(ctx, m);
    ctx.drawImage(img, 0, 0);
    ctx.save();
    drawSpotlightLayer(
      ctx,
      collectSpotlights(this.annotations, null),
      img.naturalWidth,
      img.naturalHeight,
      this.spotlightLayer,
    );
    ctx.restore();
    for (const a of this.annotations) {
      ctx.save();
      drawAnnotation(ctx, a, img, this.blurCache);
      ctx.restore();
    }
    ctx.restore();
    return canvas;
  }
```

With the default frame (`enabled: false`) this is the old code plus a zero translate, a no-op `paintFrame`, and a clip at radius 0 over the full image.

- [ ] **Step 6: Verify nothing regressed and commit**

Run: `npm run typecheck && npm test`
Expected: PASS, all suites.

```bash
git add src/editor/frame.ts src/editor/canvas.ts tests/unit/frame-paint.test.ts
git commit -m "feat(editor): compose exports through the beautify frame"
```

---

## Task 3: Live preview and framed fit

**Files:**

- Modify: `src/editor/viewport.ts` (add `centerView`)
- Modify: `src/editor/canvas.ts:113-156` (`fit`, `resetZoom`) and `canvas.ts:175-230` (`render`)
- Test: `tests/unit/viewport.test.ts` (append)

**Interfaces:**

- Consumes: `frameMetrics`, `paintFrame`, `clipToFrame` from Tasks 1-2.
- Produces: `centerView(viewportW, viewportH, outerW, outerH, pad, zoom): { zoom: number; panX: number; panY: number }`.

- [ ] **Step 1: Write the failing test**

Append to `tests/unit/viewport.test.ts`:

```ts
import { centerView } from '../../src/editor/viewport';

describe('centerView', () => {
  it('centres an unframed image, so pan is the plain margin', () => {
    const v = centerView(1000, 800, 400, 300, 0, 1);
    expect(v.panX).toBe(300);
    expect(v.panY).toBe(250);
    expect(v.zoom).toBe(1);
  });

  it('offsets the pan by the padding, since pan positions the screenshot origin', () => {
    // 400x300 image, 50px pad -> 500x400 outer box.
    const v = centerView(1000, 800, 500, 400, 50, 1);
    expect(v.panX).toBe((1000 - 500) / 2 + 50);
    expect(v.panY).toBe((800 - 400) / 2 + 50);
  });

  it('scales the padding offset with the zoom', () => {
    const v = centerView(1000, 800, 500, 400, 50, 0.5);
    expect(v.panX).toBe((1000 - 250) / 2 + 25);
    expect(v.panY).toBe((800 - 200) / 2 + 25);
  });

  it('keeps the whole framed box on screen at fit zoom', () => {
    const zoom = fitZoom(1000, 800, 3600, 2400);
    const v = centerView(1000, 800, 3600, 2400, 300, zoom);
    expect(v.panX - 300 * zoom).toBeGreaterThanOrEqual(0);
    expect(v.panY - 300 * zoom).toBeGreaterThanOrEqual(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/viewport.test.ts`
Expected: FAIL — `centerView is not exported`.

- [ ] **Step 3: Write minimal implementation**

Append to `src/editor/viewport.ts`:

```ts
/**
 * Centre a framed image in the viewport. Pan is the screen position of the
 * screenshot's origin, so the padding is added back after centring the outer box.
 */
export function centerView(
  viewportW: number,
  viewportH: number,
  outerW: number,
  outerH: number,
  pad: number,
  zoom: number,
): { zoom: number; panX: number; panY: number } {
  return {
    zoom,
    panX: (viewportW - outerW * zoom) / 2 + pad * zoom,
    panY: (viewportH - outerH * zoom) / 2 + pad * zoom,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/viewport.test.ts`
Expected: PASS.

- [ ] **Step 5: Use it in the controller**

In `src/editor/canvas.ts`, replace `fit()` (`canvas.ts:113-128`):

```ts
  /** Fit the whole framed image inside the viewport, centered, never past 100%. */
  fit(): void {
    if (!this.image) return;
    const rect = this.canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const m = frameMetrics(this.frame, this.image.naturalWidth, this.image.naturalHeight);
    const zoom = fitZoom(rect.width, rect.height, m.outerW, m.outerH);
    this.view = centerView(rect.width, rect.height, m.outerW, m.outerH, m.pad, zoom);
    this.render();
    this.onViewChange?.();
  }
```

Replace `resetZoom()` (`canvas.ts:146-156`):

```ts
  /** Reset to 100% centered. */
  resetZoom(): void {
    if (!this.image) return;
    const rect = this.canvas.getBoundingClientRect();
    const m = frameMetrics(this.frame, this.image.naturalWidth, this.image.naturalHeight);
    this.view = centerView(rect.width, rect.height, m.outerW, m.outerH, m.pad, 1);
    this.render();
    this.onViewChange?.();
  }
```

Update the import at `canvas.ts:15`:

```ts
import { centerView, clampZoom, fitZoom } from './viewport';
```

- [ ] **Step 6: Draw the frame in the preview**

In `render()` (`canvas.ts:175`), replace everything from the `const sw = ...` line down to the `ctx.save(); ctx.translate(...)` block with:

```ts
    const m = frameMetrics(this.frame, img.naturalWidth, img.naturalHeight);
    const sw = img.naturalWidth * this.view.zoom;
    const sh = img.naturalHeight * this.view.zoom;

    if (this.frame.enabled) {
      // A transparent background still needs the checkerboard, so alpha reads
      // as alpha across the padding as well as the screenshot.
      if (this.frame.background.kind === 'transparent') {
        drawCheckerboard(
          ctx,
          this.view.panX - m.pad * this.view.zoom,
          this.view.panY - m.pad * this.view.zoom,
          m.outerW * this.view.zoom,
          m.outerH * this.view.zoom,
        );
      }
      ctx.save();
      ctx.translate(this.view.panX, this.view.panY);
      ctx.scale(this.view.zoom, this.view.zoom);
      paintFrame(ctx, m, this.frame.background, this.view.zoom);
      ctx.restore();
    } else {
      // Shadow behind the image rect, so a light screenshot keeps an edge.
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.24)';
      ctx.shadowBlur = 18;
      ctx.shadowOffsetY = 4;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(this.view.panX, this.view.panY, sw, sh);
      ctx.restore();
      drawCheckerboard(ctx, this.view.panX, this.view.panY, sw, sh);
    }

    ctx.save();
    ctx.translate(this.view.panX, this.view.panY);
    ctx.scale(this.view.zoom, this.view.zoom);
    if (this.frame.enabled) clipToFrame(ctx, m);
    ctx.imageSmoothingEnabled = this.view.zoom <= 1;
    ctx.drawImage(img, 0, 0);
```

The rest of `render()` (spotlight layer, annotations, draft, crop preview, `ctx.restore()`) stays as it is.

Then gate the hairline stroke (`canvas.ts:220-225`), because the frame supplies its own edge:

```ts
    // Hairline frame in screen space, drawn under the selection handles.
    if (!this.frame.enabled) {
      ctx.save();
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.28)';
      ctx.lineWidth = 1;
      ctx.strokeRect(this.view.panX + 0.5, this.view.panY + 0.5, sw - 1, sh - 1);
      ctx.restore();
    }
```

- [ ] **Step 7: Verify and commit**

Run: `npm run typecheck && npm run lint && npm test`
Expected: PASS.

```bash
git add src/editor/viewport.ts src/editor/canvas.ts tests/unit/viewport.test.ts
git commit -m "feat(editor): preview the beautify frame on the canvas"
```

---

## Task 4: Frame settings round-trip

**Files:**

- Modify: `src/shared/types.ts:92-128` (`Settings`, `DEFAULT_SETTINGS`)
- Modify: `src/editor/frame.ts` (append `normalizeBackground`, `frameFromSettings`, `frameToSettings`)
- Test: `tests/unit/frame-settings.test.ts`

**Interfaces:**

- Consumes: `FrameOptions`, `FrameBackground`, `DEFAULT_FRAME` from Task 1; `Settings` from `src/shared/types.ts`.
- Produces: `normalizeBackground(value: unknown): FrameBackground`, `frameFromSettings(s: Settings): FrameOptions`, `frameToSettings(f: FrameOptions): Pick<Settings, 'beautifyEnabled' | 'beautifyPadding' | 'beautifyRadius' | 'beautifyShadow' | 'beautifyBackground'>`.

- [ ] **Step 1: Write the failing test**

Create `tests/unit/frame-settings.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { DEFAULT_SETTINGS } from '../../src/shared/types';
import {
  DEFAULT_FRAME,
  frameFromSettings,
  frameToSettings,
  normalizeBackground,
} from '../../src/editor/frame';

describe('normalizeBackground', () => {
  it('keeps a known preset', () => {
    expect(normalizeBackground({ kind: 'preset', id: 'coral' })).toEqual({
      kind: 'preset',
      id: 'coral',
    });
  });

  it('keeps a solid colour, normalised to lowercase hex', () => {
    expect(normalizeBackground({ kind: 'solid', color: '#ABCDEF' })).toEqual({
      kind: 'solid',
      color: '#abcdef',
    });
  });

  it('keeps transparent', () => {
    expect(normalizeBackground({ kind: 'transparent' })).toEqual({ kind: 'transparent' });
  });

  it('falls back to the default for junk, so bad storage cannot break the editor', () => {
    expect(normalizeBackground(null)).toEqual(DEFAULT_FRAME.background);
    expect(normalizeBackground({ kind: 'preset', id: 'nope' })).toEqual(DEFAULT_FRAME.background);
    expect(normalizeBackground({ kind: 'solid', color: 'red' })).toEqual(DEFAULT_FRAME.background);
    expect(normalizeBackground('gradient')).toEqual(DEFAULT_FRAME.background);
  });
});

describe('frame settings round-trip', () => {
  it('reads the defaults out of DEFAULT_SETTINGS', () => {
    expect(frameFromSettings(DEFAULT_SETTINGS)).toEqual(DEFAULT_FRAME);
  });

  it('survives a round-trip through settings', () => {
    const frame = {
      enabled: true,
      padding: 55,
      radius: 10,
      shadow: 0,
      background: { kind: 'solid', color: '#101010' } as const,
    };
    const stored = { ...DEFAULT_SETTINGS, ...frameToSettings(frame) };
    expect(frameFromSettings(stored)).toEqual(frame);
  });

  it('clamps stored slider values that fall outside 0..100', () => {
    const stored = { ...DEFAULT_SETTINGS, beautifyPadding: 999, beautifyShadow: -3 };
    const frame = frameFromSettings(stored);
    expect(frame.padding).toBe(100);
    expect(frame.shadow).toBe(0);
  });

  it('beautify ships off', () => {
    expect(DEFAULT_SETTINGS.beautifyEnabled).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/frame-settings.test.ts`
Expected: FAIL — `normalizeBackground is not a function`.

- [ ] **Step 3: Add the settings fields**

`FrameBackground` is already declared in this file by Task 1. Add the five fields to `Settings` after `captureDelay`:

```ts
  /** Beautify frame (editor). Sliders are 0..100; see src/editor/frame.ts. */
  beautifyEnabled: boolean;
  beautifyPadding: number;
  beautifyRadius: number;
  beautifyShadow: number;
  beautifyBackground: FrameBackground;
```

And to `DEFAULT_SETTINGS`:

```ts
  beautifyEnabled: false,
  beautifyPadding: 40,
  beautifyRadius: 30,
  beautifyShadow: 45,
  beautifyBackground: { kind: 'preset', id: 'ink' },
```

- [ ] **Step 4: Write the mapping**

Append to `src/editor/frame.ts`:

```ts
import { normalizeHex } from './palette';
import type { Settings } from '../shared/types';

const PRESET_IDS = new Set<string>(BACKGROUND_PRESETS.map((p) => p.id));

/** Coerce a stored background to a usable one; anything unknown falls back. */
export function normalizeBackground(value: unknown): FrameBackground {
  if (!value || typeof value !== 'object') return DEFAULT_FRAME.background;
  const v = value as { kind?: unknown; id?: unknown; color?: unknown };
  if (v.kind === 'transparent') return { kind: 'transparent' };
  if (v.kind === 'preset' && typeof v.id === 'string' && PRESET_IDS.has(v.id)) {
    return { kind: 'preset', id: v.id as PresetId };
  }
  if (v.kind === 'solid' && typeof v.color === 'string') {
    const hex = normalizeHex(v.color);
    if (hex) return { kind: 'solid', color: hex };
  }
  return DEFAULT_FRAME.background;
}

function slider(value: unknown, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.max(0, Math.min(100, value));
}

export function frameFromSettings(s: Settings): FrameOptions {
  return {
    enabled: s.beautifyEnabled === true,
    padding: slider(s.beautifyPadding, DEFAULT_FRAME.padding),
    radius: slider(s.beautifyRadius, DEFAULT_FRAME.radius),
    shadow: slider(s.beautifyShadow, DEFAULT_FRAME.shadow),
    background: normalizeBackground(s.beautifyBackground),
  };
}

export function frameToSettings(
  f: FrameOptions,
): Pick<
  Settings,
  'beautifyEnabled' | 'beautifyPadding' | 'beautifyRadius' | 'beautifyShadow' | 'beautifyBackground'
> {
  return {
    beautifyEnabled: f.enabled,
    beautifyPadding: f.padding,
    beautifyRadius: f.radius,
    beautifyShadow: f.shadow,
    beautifyBackground: f.background,
  };
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run tests/unit/frame-settings.test.ts && npm run typecheck`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/shared/types.ts src/editor/frame.ts tests/unit/frame-settings.test.ts
git commit -m "feat(editor): persist beautify frame settings"
```

---

## Task 5: Frame state in the editor hook

**Files:**

- Modify: `src/editor/useEditor.ts` (state, load, persist, setters, controller sync, return value)

**Interfaces:**

- Consumes: `FrameOptions`, `frameFromSettings`, `frameToSettings`, `frameMetrics`, `DEFAULT_FRAME` from Tasks 1 and 4; `CanvasController.setFrame` from Task 2.
- Produces on the hook's return value: `frame: FrameOptions`, `setFrame(patch: Partial<FrameOptions>): void`, `composedSize: { w: number; h: number } | null`.

There is no component-test harness in this repo (vitest runs in `node`), so this task is verified by typecheck, build, and the browser pass in Task 9.

- [ ] **Step 1: Add the state and the controller sync**

In `src/editor/useEditor.ts`, add the import:

```ts
import {
  DEFAULT_FRAME,
  frameFromSettings,
  frameMetrics,
  frameToSettings,
  type FrameOptions,
} from './frame';
```

Add the state next to `blurMode` (`useEditor.ts:100`):

```ts
  const [frame, setFrameState] = useState<FrameOptions>(DEFAULT_FRAME);
```

Sync it to the controller, next to the annotations effect (`useEditor.ts:130`):

```ts
  useEffect(() => {
    controllerRef.current?.setFrame(frame);
  }, [frame]);
```

- [ ] **Step 2: Load it with the other settings**

In the settings load effect (near `useEditor.ts:301`, where `annotationColor` is read), add:

```ts
      setFrameState(frameFromSettings(s));
```

- [ ] **Step 3: Persist it on change**

Add after the annotation style persistence effect (`useEditor.ts:144-157`), matching its skip-first-run shape:

```ts
  // Persist the beautify frame so it is remembered across sessions. Skip the
  // first run (the initial load from settings) to avoid a redundant write.
  const frameLoadedRef = useRef(false);
  useEffect(() => {
    if (!frameLoadedRef.current) {
      frameLoadedRef.current = true;
      return;
    }
    void setSettings(frameToSettings(frame));
  }, [frame]);
```

- [ ] **Step 4: Add the setter and the composed size**

```ts
  const setFrame = useCallback((patch: Partial<FrameOptions>) => {
    setFrameState((f) => ({ ...f, ...patch }));
  }, []);

  // Outer size of the export, so the export dialog can show what a scale yields.
  const composedSize = useMemo(() => {
    if (!imageSize) return null;
    const m = frameMetrics(frame, imageSize.w, imageSize.h);
    return { w: m.outerW, h: m.outerH };
  }, [frame, imageSize]);
```

Add `useMemo` to the `preact/hooks` import if it is missing. Return `frame`, `setFrame`, and `composedSize` from the hook.

- [ ] **Step 5: Verify and commit**

Run: `npm run typecheck && npm run lint && npm test && npm run build`
Expected: PASS.

```bash
git add src/editor/useEditor.ts
git commit -m "feat(editor): beautify frame state and persistence"
```

---

## Task 6: Beautify panel

**Files:**

- Create: `src/editor/BeautifyMenu.tsx`
- Modify: `src/editor/App.tsx:116-140` (topbar)
- Modify: `src/editor/editor.css` (append panel styles)

**Interfaces:**

- Consumes: `frame`, `setFrame` from Task 5; `BACKGROUND_PRESETS`, `frameMetrics`, `FrameBackground` from Tasks 1-2; `normalizeHex` from `palette.ts`.
- Produces: `<BeautifyMenu frame disabled imageSize onChange />`.

- [ ] **Step 1: Write the component**

Create `src/editor/BeautifyMenu.tsx`:

```tsx
import { useEffect, useRef, useState } from 'preact/hooks';
import { BACKGROUND_PRESETS, frameMetrics, type FrameBackground, type FrameOptions } from './frame';

export interface BeautifyMenuProps {
  frame: FrameOptions;
  disabled: boolean;
  imageSize: { w: number; h: number } | null;
  onChange: (patch: Partial<FrameOptions>) => void;
}

/**
 * Beautify lives in the topbar, not the tool rail: it is a property of the
 * whole document, so it has nothing to draw and nothing to select.
 */
export function BeautifyMenu(props: BeautifyMenuProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    // Capture phase, for the same reason as ZoomMenu: the popover is not inside
    // a modal subtree, so the editor's window-level shortcut listeners would
    // otherwise see keys typed into this panel.
    const onKey = (e: KeyboardEvent) => {
      e.stopPropagation();
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey, true);
    return () => {
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey, true);
    };
  }, [open]);

  const f = props.frame;
  const m = props.imageSize ? frameMetrics(f, props.imageSize.w, props.imageSize.h) : null;
  const px = (v: number | undefined) => (v === undefined ? '' : ` · ${v}px`);
  const isSolid = f.background.kind === 'solid';
  const solidColor = isSolid ? (f.background as { color: string }).color : '#1d1d1f';

  function pickBackground(background: FrameBackground) {
    props.onChange({ background, enabled: true });
  }

  return (
    <div class="beautify-menu" ref={wrapRef}>
      <button
        class={`btn-secondary${f.enabled ? ' is-active' : ''}`}
        disabled={props.disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        title="Beautify: padding, corners, shadow, background"
        onClick={() => setOpen((v) => !v)}
      >
        Beautify
      </button>
      {open ? (
        <div class="beautify-popover" role="dialog" aria-label="Beautify">
          <label class="beautify-toggle">
            <input
              type="checkbox"
              checked={f.enabled}
              onChange={(e) => props.onChange({ enabled: (e.target as HTMLInputElement).checked })}
            />
            <span>Beautify</span>
          </label>

          <div class="beautify-group">
            <span class="stylebar-label">Padding{px(m?.pad)}</span>
            <input
              class="range"
              type="range"
              min="0"
              max="100"
              step="1"
              disabled={!f.enabled}
              value={f.padding}
              onInput={(e) =>
                props.onChange({ padding: Number((e.target as HTMLInputElement).value) })
              }
            />
          </div>

          <div class="beautify-group">
            <span class="stylebar-label">Corners{px(m?.radius)}</span>
            <input
              class="range"
              type="range"
              min="0"
              max="100"
              step="1"
              disabled={!f.enabled}
              value={f.radius}
              onInput={(e) =>
                props.onChange({ radius: Number((e.target as HTMLInputElement).value) })
              }
            />
          </div>

          <div class="beautify-group">
            <span class="stylebar-label">Shadow{px(m?.shadowBlur)}</span>
            <input
              class="range"
              type="range"
              min="0"
              max="100"
              step="1"
              disabled={!f.enabled}
              value={f.shadow}
              onInput={(e) =>
                props.onChange({ shadow: Number((e.target as HTMLInputElement).value) })
              }
            />
          </div>

          <div class="beautify-group">
            <span class="stylebar-label">Background</span>
            <div class="swatches">
              {BACKGROUND_PRESETS.map((p) => (
                <button
                  key={p.id}
                  class="swatch"
                  style={{ background: `linear-gradient(135deg, ${p.from}, ${p.to})` }}
                  aria-label={p.label}
                  aria-pressed={f.background.kind === 'preset' && f.background.id === p.id}
                  onClick={() => pickBackground({ kind: 'preset', id: p.id })}
                />
              ))}
              <button
                class="swatch swatch-transparent"
                aria-label="Transparent"
                aria-pressed={f.background.kind === 'transparent'}
                onClick={() => pickBackground({ kind: 'transparent' })}
              />
              <label class="swatch swatch-custom" title="Solid colour">
                <input
                  type="color"
                  aria-label="Solid background colour"
                  value={solidColor}
                  onChange={(e) =>
                    pickBackground({
                      kind: 'solid',
                      color: (e.target as HTMLInputElement).value,
                    })
                  }
                />
              </label>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 2: Mount it in the topbar**

In `src/editor/App.tsx`, import it and place it between `<ZoomMenu ... />` and the Copy button (`App.tsx:116-131`):

```tsx
          <BeautifyMenu
            frame={ed.frame}
            disabled={!ed.capture}
            imageSize={ed.imageSize}
            onChange={ed.setFrame}
          />
```

- [ ] **Step 3: Style it**

Append to `src/editor/editor.css`, using the same tokens as `.zoom-popover` (`editor.css:229`):

```css
.beautify-menu {
  position: relative;
}

.beautify-popover {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  z-index: 20;
  display: flex;
  width: 248px;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  background: var(--surface-1);
  box-shadow: var(--sh-md);
}

.beautify-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.beautify-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.beautify-group .range {
  width: 100%;
}

.swatch-transparent {
  background:
    linear-gradient(45deg, #d9d9de 25%, transparent 25%) 0 0 / 8px 8px,
    linear-gradient(-45deg, #d9d9de 25%, transparent 25%) 0 4px / 8px 8px,
    #fff;
}
```

`.swatch`, `.swatch-custom`, `.range`, and `.stylebar-label` already exist in `editor.css` and are reused as they are.

- [ ] **Step 4: Verify and commit**

Run: `npm run typecheck && npm run lint && npm run build`
Expected: PASS.

```bash
git add src/editor/BeautifyMenu.tsx src/editor/App.tsx src/editor/editor.css
git commit -m "feat(editor): beautify panel in the topbar"
```

---

## Task 7: Export scale maths

**Files:**

- Create: `src/editor/scale.ts`
- Test: `tests/unit/scale.test.ts`

**Interfaces:**

- Consumes: nothing.
- Produces: `SCALE_PRESETS`, `MIN_EXPORT_WIDTH`, `MAX_EXPORT_SCALE`, `halvingSteps(srcW, targetW): number[]`, `scaledHeight(srcW, srcH, targetW): number`, `clampTargetWidth(value, srcW): number`, `resampleToWidth(canvas, targetW): HTMLCanvasElement`.

- [ ] **Step 1: Write the failing test**

Create `tests/unit/scale.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import {
  clampTargetWidth,
  halvingSteps,
  MAX_EXPORT_SCALE,
  MIN_EXPORT_WIDTH,
  scaledHeight,
} from '../../src/editor/scale';

describe('halvingSteps', () => {
  it('goes straight there when the target is at or above the source', () => {
    expect(halvingSteps(2400, 2400)).toEqual([2400]);
    expect(halvingSteps(2400, 4800)).toEqual([4800]);
  });

  it('goes straight there for a gentle downscale', () => {
    expect(halvingSteps(2400, 1800)).toEqual([1800]);
    expect(halvingSteps(2400, 1200)).toEqual([1200]);
  });

  it('halves repeatedly for a steep downscale, so detail survives', () => {
    expect(halvingSteps(2400, 600)).toEqual([1200, 600]);
    expect(halvingSteps(2400, 300)).toEqual([1200, 600, 300]);
  });

  it('always ends on the exact target width', () => {
    for (const target of [17, 123, 999, 1201]) {
      const steps = halvingSteps(2400, target);
      expect(steps[steps.length - 1]).toBe(target);
    }
  });

  it('survives degenerate sizes', () => {
    expect(halvingSteps(1, 1)).toEqual([1]);
    expect(halvingSteps(0, 0)).toEqual([1]);
  });
});

describe('scaledHeight', () => {
  it('keeps the aspect ratio', () => {
    expect(scaledHeight(2400, 1360, 1200)).toBe(680);
    expect(scaledHeight(2400, 1360, 1280)).toBe(725);
  });

  it('never returns zero', () => {
    expect(scaledHeight(2400, 3, 16)).toBe(1);
  });
});

describe('clampTargetWidth', () => {
  it('keeps a sane width', () => {
    expect(clampTargetWidth(1280, 2400)).toBe(1280);
  });

  it('holds the floor and the ceiling', () => {
    expect(clampTargetWidth(1, 2400)).toBe(MIN_EXPORT_WIDTH);
    expect(clampTargetWidth(999999, 2400)).toBe(2400 * MAX_EXPORT_SCALE);
  });

  it('falls back to the source width for junk input', () => {
    expect(clampTargetWidth(Number.NaN, 2400)).toBe(2400);
  });

  it('rounds to whole pixels', () => {
    expect(clampTargetWidth(1280.6, 2400)).toBe(1281);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/scale.test.ts`
Expected: FAIL — `Failed to resolve import "../../src/editor/scale"`.

- [ ] **Step 3: Write minimal implementation**

Create `src/editor/scale.ts`:

```ts
/**
 * Export scaling.
 *
 * The composed 1x canvas is resampled, rather than re-rendered at the target
 * size: annotations then shrink with the screenshot they were drawn on, at the
 * stroke weights the user picked. Steep downscales walk through halves, which
 * a single drawImage step would render mushy.
 */

export const SCALE_PRESETS = [0.25, 0.5, 1, 2] as const;
export const MIN_EXPORT_WIDTH = 16;
export const MAX_EXPORT_SCALE = 4;

/** Widths to draw through, ending on the exact target. */
export function halvingSteps(srcW: number, targetW: number): number[] {
  const src = Math.max(1, Math.round(srcW));
  const target = Math.max(1, Math.round(targetW));
  if (target >= src) return [target];
  const steps: number[] = [];
  let w = src;
  while (w / 2 > target) {
    w = Math.round(w / 2);
    steps.push(w);
  }
  steps.push(target);
  return steps;
}

/** Height that keeps the source aspect ratio at `targetW`. */
export function scaledHeight(srcW: number, srcH: number, targetW: number): number {
  if (srcW <= 0) return Math.max(1, Math.round(srcH));
  return Math.max(1, Math.round((srcH * targetW) / srcW));
}

/** Hold a typed width inside the supported range. */
export function clampTargetWidth(value: number, srcW: number): number {
  if (!Number.isFinite(value)) return srcW;
  return Math.round(Math.max(MIN_EXPORT_WIDTH, Math.min(value, srcW * MAX_EXPORT_SCALE)));
}

/** Resample to `targetW`, returning the source untouched at 100%. */
export function resampleToWidth(src: HTMLCanvasElement, targetW: number): HTMLCanvasElement {
  if (targetW === src.width) return src;
  let cur = src;
  for (const w of halvingSteps(src.width, targetW)) {
    const next = document.createElement('canvas');
    next.width = w;
    // Aspect comes from the original at every step, so rounding cannot drift.
    next.height = scaledHeight(src.width, src.height, w);
    const ctx = next.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context unavailable');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(cur, 0, 0, next.width, next.height);
    cur = next;
  }
  return cur;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/scale.test.ts`
Expected: PASS, 12 tests.

- [ ] **Step 5: Commit**

```bash
git add src/editor/scale.ts tests/unit/scale.test.ts
git commit -m "feat(editor): export scale maths"
```

---

## Task 8: Scale row in the export dialog

**Files:**

- Modify: `src/editor/useEditor.ts:781-795` (`exportImage`)
- Modify: `src/editor/App.tsx:376-472` (`ExportDialog` state and `doExport`) and its markup above the Quality row
- Modify: `src/editor/editor.css` (append scale row styles)

**Interfaces:**

- Consumes: `clampTargetWidth`, `resampleToWidth`, `scaledHeight`, `SCALE_PRESETS` from Task 7; `composedSize` from Task 5.
- Produces: `exportImage(format: ImageFormat, quality: number, filenameBase: string, targetWidth?: number): Promise<void>`.

- [ ] **Step 1: Apply the scale in the hook**

In `src/editor/useEditor.ts`, add the import:

```ts
import { resampleToWidth } from './scale';
```

Replace `exportImage` (`useEditor.ts:781-795`):

```ts
  const exportImage = useCallback(
    async (format: ImageFormat, quality: number, filenameBase: string, targetWidth?: number) => {
      const c = controllerRef.current;
      if (!c || !c.image) return;
      setExporting(true);
      try {
        const composed = c.composeFinal();
        const canvas =
          targetWidth && targetWidth !== composed.width
            ? resampleToWidth(composed, targetWidth)
            : composed;
        const dataUrl = canvasToDataUrl(canvas, format, quality);
        await downloadDataUrl(dataUrl, withExtension(filenameBase, format));
      } finally {
        setExporting(false);
      }
    },
    [],
  );
```

- [ ] **Step 2: Add the dialog state**

In `ExportDialog` (`App.tsx:376`), add after the `quality` state:

```tsx
  // Scale is per-export intent: it starts at 100% every time the dialog opens
  // and stays out of "Remember these settings".
  const [targetWidth, setTargetWidth] = useState<number | null>(null);
```

And below the existing derived values (`App.tsx:421-424`):

```tsx
  const composed = ed.composedSize;
  const outW = targetWidth ?? composed?.w ?? 0;
  const outH = composed ? scaledHeight(composed.w, composed.h, outW) : 0;
  const showScale = format !== 'pdf' && composed !== null;
```

- [ ] **Step 3: Pass it to the export**

In `doExport` (`App.tsx:444`), replace the image branch:

```tsx
        await ed.exportImage(format, quality, filenameBase, targetWidth ?? undefined);
```

- [ ] **Step 4: Add the markup**

Insert above the Quality row (`App.tsx:527`), reusing the `modal-row`, `field-label`, `segmented`, `segmented-btn`, and `num-input` classes the dialog already uses:

```tsx
          {showScale && composed ? (
            <div class="modal-row">
              <div class="field-label">Scale</div>
              <div class="segmented">
                {SCALE_PRESETS.map((p) => {
                  const w = Math.max(1, Math.round(composed.w * p));
                  return (
                    <button
                      key={p}
                      class={`segmented-btn${outW === w ? ' is-selected' : ''}`}
                      aria-pressed={outW === w}
                      onClick={() => setTargetWidth(p === 1 ? null : w)}
                    >
                      {p * 100}%
                    </button>
                  );
                })}
              </div>
              <label class="check-label">
                Width
                <input
                  class="num-input"
                  type="number"
                  min={MIN_EXPORT_WIDTH}
                  max={composed.w * MAX_EXPORT_SCALE}
                  value={outW}
                  onChange={(e) =>
                    setTargetWidth(
                      clampTargetWidth(Number((e.target as HTMLInputElement).value), composed.w),
                    )
                  }
                />
                px
              </label>
              <span class="scale-readout">
                {composed.w} × {composed.h} → {outW} × {outH}
              </span>
            </div>
          ) : null}
```

Import `SCALE_PRESETS`, `MIN_EXPORT_WIDTH`, `MAX_EXPORT_SCALE`, `clampTargetWidth`, and `scaledHeight` from `./scale`.

- [ ] **Step 5: Style the width field**

Append to `src/editor/editor.css`:

```css
.scale-readout {
  color: var(--text-2);
  font-variant-numeric: tabular-nums;
}
```

- [ ] **Step 6: Verify and commit**

Run: `npm run typecheck && npm run lint && npm test && npm run build`
Expected: PASS.

```bash
git add src/editor/useEditor.ts src/editor/App.tsx src/editor/editor.css
git commit -m "feat(editor): scale control in the export dialog"
```

---

## Task 9: Browser verification and docs

**Files:**

- Modify: `README.md` (editor feature list)
- Modify: `agent_docs/store-listing.md` (full description, ANNOTATE/EXPORT bullets)

The `ROADMAP.md` status flip to shipped belongs to the release, together with the version bump across all seven version fields. Leave both alone here.

- [ ] **Step 1: Build and load the extension**

Run: `npm run build`

Load `dist/` as an unpacked extension, capture any page, and open the editor.

- [ ] **Step 2: Walk the beautify checks**

- Toggle Beautify on. The frame appears around the screenshot at the current zoom.
- Drag each slider. Padding, corners, and shadow all respond, and the px readouts match what is drawn.
- Pick each of the six presets, transparent, and a custom solid. Transparent shows the checkerboard across the padding.
- Press Fit and Actual size. The whole framed box is centred and on screen both times.
- Draw an annotation near an edge, then a step badge in a corner. Neither bleeds into the padding or past the rounded corner.
- Crop with beautify on. The frame re-fits around the cropped screenshot and annotations stay in place.
- Export PNG. The file carries the frame, and its size matches `composed.w × composed.h`.
- Reload the editor. The frame settings come back.

- [ ] **Step 3: Walk the scale checks**

- Export at 50%. The file is half the composed width.
- Type a width of 1280. The readout updates and the file lands at 1280 px wide.
- Select PDF. The Scale row disappears.
- Copy to clipboard. The pasted image is full size and carries the frame.

- [ ] **Step 4: Confirm beautify off is unchanged**

Toggle Beautify off, export a PNG, and confirm the dimensions equal the capture's own `width × height`.

- [ ] **Step 5: Update the docs**

In `README.md`, add to the editor feature list:

```markdown
- Beautify: padding, rounded corners, drop shadow, and a gradient, solid, or transparent background
- Export at any scale: 25 / 50 / 100 / 200 % or an exact pixel width
```

In `agent_docs/store-listing.md`, add to the ANNOTATE block:

```
• Beautify: padding, rounded corners, shadow, and gradient backgrounds for polished sharing
```

and to the EXPORT block:

```
• Export at 25/50/100/200% or an exact pixel width
```

- [ ] **Step 6: Full check and commit**

Run: `npm run typecheck && npm run lint && npm test && npm run build`
Expected: PASS.

```bash
git add README.md agent_docs/store-listing.md
git commit -m "docs: beautify mode and export scale"
```
