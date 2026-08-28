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
import { normalizeHex } from './palette';
import type { Settings } from '../shared/types';
import { MAX_CANVAS_HEIGHT_PX } from '../shared/geometry';
import { tokens } from '../shared/design-tokens';

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
  {
    id: 'ink',
    label: 'Ink',
    from: tokens.frameInkFrom,
    to: tokens.frameInkTo,
    direction: 'diagonal',
  },
  {
    id: 'coral',
    label: 'Coral',
    from: tokens.frameCoralFrom,
    to: tokens.frameCoralTo,
    direction: 'diagonal',
  },
  {
    id: 'dusk',
    label: 'Dusk',
    from: tokens.frameDuskFrom,
    to: tokens.frameDuskTo,
    direction: 'diagonal',
  },
  {
    id: 'mint',
    label: 'Mint',
    from: tokens.frameMintFrom,
    to: tokens.frameMintTo,
    direction: 'diagonal',
  },
  {
    id: 'sand',
    label: 'Sand',
    from: tokens.frameSandFrom,
    to: tokens.frameSandTo,
    direction: 'vertical',
  },
  {
    id: 'sky',
    label: 'Sky',
    from: tokens.frameSkyFrom,
    to: tokens.frameSkyTo,
    direction: 'vertical',
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
