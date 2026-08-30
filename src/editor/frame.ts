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
import type { FrameBackground, LookId, PresetId } from '../shared/types';
import { normalizeHex } from './palette';
import type { Settings } from '../shared/types';
import { MAX_CANVAS_HEIGHT_PX } from '../shared/geometry';
import { tokens } from '../shared/design-tokens';
import { t } from './i18n';

export type { FrameBackground, LookId, PresetId };

export interface FrameOptions {
  enabled: boolean;
  /** 0..100, resolved against the shorter image side. */
  padding: number;
  radius: number;
  shadow: number;
  background: FrameBackground;
  /** The named look these values came from, or null when none matches. */
  look: LookId | null;
}

/** The four values a look sets — everything about the frame except whether it is on. */
type FrameValues = Pick<FrameOptions, 'padding' | 'radius' | 'shadow' | 'background'>;

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
  {
    id: 'ink',
    label: t('editorBgInk'),
    from: tokens.frameInkFrom,
    to: tokens.frameInkTo,
    direction: 'diagonal',
  },
  {
    id: 'coral',
    label: t('editorBgCoral'),
    from: tokens.frameCoralFrom,
    to: tokens.frameCoralTo,
    direction: 'diagonal',
  },
  {
    id: 'dusk',
    label: t('editorBgDusk'),
    from: tokens.frameDuskFrom,
    to: tokens.frameDuskTo,
    direction: 'diagonal',
  },
  {
    id: 'mint',
    label: t('editorBgMint'),
    from: tokens.frameMintFrom,
    to: tokens.frameMintTo,
    direction: 'diagonal',
  },
  {
    id: 'sand',
    label: t('editorBgSand'),
    from: tokens.frameSandFrom,
    to: tokens.frameSandTo,
    direction: 'vertical',
  },
  {
    id: 'sky',
    label: t('editorBgSky'),
    from: tokens.frameSkyFrom,
    to: tokens.frameSkyTo,
    direction: 'vertical',
  },
];

/**
 * A named look — every frame value in one click.
 *
 * Deliberately not called a preset: `BackgroundPreset` above already owns that
 * word for a gradient, and a look *contains* a background rather than being
 * one. Two things called "preset" in one file would have to be told apart by
 * context on every read. `LookId` itself lives in shared/types.ts beside
 * `PresetId`, for the same reason that one does: `Settings` stores it.
 */
export interface FrameLook extends FrameValues {
  id: LookId;
  label: string;
  /** What the look is for; shown as the button's tooltip. */
  hint: string;
}

/** Button order in the panel. */
export const FRAME_LOOKS: FrameLook[] = [
  {
    id: 'clean',
    label: t('editorLookCleanLabel'),
    hint: t('editorLookCleanHint'),
    // Kept equal to DEFAULT_FRAME on purpose, so a user who has never opened
    // the panel already sees a look selected rather than an empty row. A unit
    // test holds the two in step.
    padding: 40,
    radius: 30,
    shadow: 45,
    background: { kind: 'preset', id: 'ink' },
  },
  {
    id: 'airy',
    label: t('editorLookAiryLabel'),
    hint: t('editorLookAiryHint'),
    // A frame this large reads as a block of colour in its own right, so it
    // takes the warm light ground rather than ink.
    padding: 85,
    radius: 30,
    shadow: 45,
    background: { kind: 'preset', id: 'sand' },
  },
  {
    id: 'snug',
    label: t('editorLookSnugLabel'),
    hint: t('editorLookSnugHint'),
    padding: 12,
    radius: 18,
    shadow: 25,
    background: { kind: 'preset', id: 'ink' },
  },
  {
    id: 'flat',
    label: t('editorLookFlatLabel'),
    hint: t('editorLookFlatHint'),
    // The only one-click route to no rounding and no shadow at once.
    padding: 30,
    radius: 0,
    shadow: 0,
    background: { kind: 'preset', id: 'ink' },
  },
  {
    id: 'poster',
    label: t('editorLookPosterLabel'),
    hint: t('editorLookPosterHint'),
    padding: 70,
    radius: 55,
    shadow: 80,
    background: { kind: 'preset', id: 'coral' },
  },
  {
    id: 'cutout',
    label: t('editorLookCutoutLabel'),
    hint: t('editorLookCutoutHint'),
    // Transparent skips the background fill but still casts the shadow plate,
    // so a PNG export carries a real drop shadow with no ground behind it.
    padding: 24,
    radius: 45,
    shadow: 55,
    background: { kind: 'transparent' },
  },
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
  look: 'clean',
};

const LOOK_BY_ID: Record<LookId, FrameLook> = Object.fromEntries(
  FRAME_LOOKS.map((l) => [l.id, l]),
) as Record<LookId, FrameLook>;

function sameBackground(a: FrameBackground, b: FrameBackground): boolean {
  if (a.kind === 'preset' && b.kind === 'preset') return a.id === b.id;
  if (a.kind === 'solid' && b.kind === 'solid') return a.color === b.color;
  return a.kind === 'transparent' && b.kind === 'transparent';
}

/**
 * Whether the frame still holds every value the look set.
 *
 * A value comparison, not a dirty flag: a slider dragged away and dragged back
 * reads as unmodified again, which is what the panel should say. `enabled` is
 * left out because a look describes the frame's shape, not whether it is on —
 * switching beautify off and on must not mark the look as changed.
 */
function matchesLook(f: FrameValues, look: FrameLook): boolean {
  return (
    f.padding === look.padding &&
    f.radius === look.radius &&
    f.shadow === look.shadow &&
    sameBackground(f.background, look.background)
  );
}

/** The look a set of values spells out, or null when none does. */
export function matchLook(f: FrameValues): LookId | null {
  return FRAME_LOOKS.find((l) => matchesLook(f, l))?.id ?? null;
}

/** True when a look is selected but its values have since been changed. */
export function lookIsModified(f: FrameOptions): boolean {
  const look = f.look === null ? undefined : LOOK_BY_ID[f.look];
  return look !== undefined && !matchesLook(f, look);
}

/**
 * The patch a look applies. Beautify turns on with it: a one-click look that
 * left the frame disabled would change nothing on screen. Same bargain the
 * background swatches already strike (see `pickBackground` in BeautifyMenu).
 */
export function applyLook(id: LookId): Partial<FrameOptions> {
  const l = LOOK_BY_ID[id];
  return {
    enabled: true,
    look: id,
    padding: l.padding,
    radius: l.radius,
    shadow: l.shadow,
    background: l.background,
  };
}

const LOOK_IDS = new Set<string>(FRAME_LOOKS.map((l) => l.id));

/** Coerce a stored look id; anything unknown reads as no look selected. */
export function normalizeLook(value: unknown): LookId | null {
  return typeof value === 'string' && LOOK_IDS.has(value) ? (value as LookId) : null;
}

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
  // Padding can't push either outer side past the canvas cap — beautify alone
  // must never turn a legal capture into a canvas Chrome silently refuses to
  // draw into (toDataURL then returns "data:," with no error).
  const maxPad = Math.max(
    0,
    Math.min(
      Math.floor((MAX_CANVAS_HEIGHT_PX - imgW) / 2),
      Math.floor((MAX_CANVAS_HEIGHT_PX - imgH) / 2),
    ),
  );
  const pad = Math.min(Math.round(unit(opts.padding) * PAD_FRACTION * short), maxPad);
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
      bg.kind === 'solid'
        ? bg.color
        : presetGradient(ctx, bg.id, -m.pad, -m.pad, m.outerW, m.outerH);
    ctx.fillRect(-m.pad, -m.pad, m.outerW, m.outerH);
    ctx.restore();
  }

  if (m.shadowAlpha > 0) {
    ctx.save();
    ctx.shadowColor = `rgba(0, 0, 0, ${m.shadowAlpha})`;
    ctx.shadowBlur = m.shadowBlur * scale;
    ctx.shadowOffsetY = m.shadowOffsetY * scale;
    // The plate is hidden by the screenshot drawn over it; it exists to cast.
    ctx.fillStyle = tokens.canvasPaper;
    const plate = shadowPlateRect(m.imgW, m.imgH);
    ctx.beginPath();
    ctx.roundRect(plate.x, plate.y, plate.w, plate.h, m.radius);
    ctx.fill();
    ctx.restore();
  }
}

/**
 * The shadow plate's rect, inset 1px so its own antialiased edge sits under
 * the image's opaque pixels instead of leaking a faint white ring past a
 * rounded corner. Degenerate sizes skip the inset — there is no edge to hide
 * once the plate itself is under 2px on a side.
 */
export function shadowPlateRect(
  imgW: number,
  imgH: number,
): { x: number; y: number; w: number; h: number } {
  if (imgW < 2 || imgH < 2) return { x: 0, y: 0, w: imgW, h: imgH };
  return { x: 1, y: 1, w: imgW - 2, h: imgH - 2 };
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

/**
 * The stored look id wins, so a look that was adjusted comes back as that
 * look, modified — the one state its values alone cannot spell out.
 *
 * Matching the values is the fallback, for the settings blob every install
 * upgrading from 1.3.0 holds: it has no `beautifyLook` key, `getSettings`
 * fills the null default in, and the frame reads back as whichever look its
 * values are. An untouched install lands on Clean that way; one whose sliders
 * were moved by hand lands on no look, which is the truth about it.
 */
export function frameFromSettings(s: Settings): FrameOptions {
  const values: FrameValues = {
    padding: slider(s.beautifyPadding, DEFAULT_FRAME.padding),
    radius: slider(s.beautifyRadius, DEFAULT_FRAME.radius),
    shadow: slider(s.beautifyShadow, DEFAULT_FRAME.shadow),
    background: normalizeBackground(s.beautifyBackground),
  };
  return {
    enabled: s.beautifyEnabled === true,
    ...values,
    look: normalizeLook(s.beautifyLook) ?? matchLook(values),
  };
}

export function frameToSettings(
  f: FrameOptions,
): Pick<
  Settings,
  | 'beautifyEnabled'
  | 'beautifyPadding'
  | 'beautifyRadius'
  | 'beautifyShadow'
  | 'beautifyBackground'
  | 'beautifyLook'
> {
  return {
    beautifyEnabled: f.enabled,
    beautifyPadding: f.padding,
    beautifyRadius: f.radius,
    beautifyShadow: f.shadow,
    beautifyBackground: f.background,
    beautifyLook: f.look,
  };
}
