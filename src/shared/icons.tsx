/**
 * Every inline icon used across editor, popup, recorder and setup, in one
 * module. One stroke weight (2, in a 24x24 viewBox) and one filled-mark
 * convention (also 24x24) for every icon here — display size is a `size`
 * prop, never a redrawn path at a different scale. `BrandMark.tsx` stays
 * separate: it is brand artwork with fixed hex colors and its own 128x128
 * viewBox, not a themed UI icon.
 *
 * Naming follows what each icon depicts, not where it is used — several of
 * these (IconPage, IconGift) were byte-identical copies under two names
 * before this file existed.
 */
export interface IconProps {
  size?: number;
}

const VIEW_BOX = '0 0 24 24';
const STROKE_WIDTH = 2;

function StrokeIcon({ size = 20, children }: IconProps & { children: preact.ComponentChildren }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={VIEW_BOX}
      fill="none"
      stroke="currentColor"
      stroke-width={STROKE_WIDTH}
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

function FillIcon({ size = 20, children }: IconProps & { children: preact.ComponentChildren }) {
  return (
    <svg width={size} height={size} viewBox={VIEW_BOX} fill="currentColor" aria-hidden="true">
      {children}
    </svg>
  );
}

/* ---- Editor toolbar ---- */

export function IconSelect(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <path d="M4 4l6 16 2-7 7-2z" />
    </StrokeIcon>
  );
}

export function IconRectangle(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <rect x="4" y="6" width="16" height="12" rx="2" />
    </StrokeIcon>
  );
}

export function IconArrow(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <path d="M4 20L20 4M20 4h-6M20 4v6" />
    </StrokeIcon>
  );
}

export function IconLine(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <path d="M4 20L20 4" />
    </StrokeIcon>
  );
}

export function IconPen(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <path d="M16.5 3.5l4 4L7 21H3v-4z" />
    </StrokeIcon>
  );
}

export function IconHighlight(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <path d="m9 11-6 6v3h9l3-3" />
      <path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4l8 8Z" />
    </StrokeIcon>
  );
}

export function IconStep(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M10.5 9.6L12.2 8.2v7.6" />
    </StrokeIcon>
  );
}

export function IconText(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <path d="M5 5h14M12 5v14M9 19h6" />
    </StrokeIcon>
  );
}

export function IconBlur(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <circle cx="12" cy="12" r="7" stroke-dasharray="2 3" />
    </StrokeIcon>
  );
}

export function IconSpotlight(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <rect x="3" y="3" width="18" height="18" rx="2" stroke-dasharray="3 3" />
      <circle cx="12" cy="12" r="5" />
    </StrokeIcon>
  );
}

/** The eyedropper tool and the "pick from screen" swatch button — one icon, two sizes. */
export function IconEyedropper(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <path d="M18 3.5a2.1 2.1 0 0 1 3 3L15 12.5l-3-3z" />
      <path d="M12 9.5 4.5 17v2.5H7L14.5 12" />
    </StrokeIcon>
  );
}

export function IconCrop(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <path d="M6 2v14h14M2 6h14v14" />
    </StrokeIcon>
  );
}

/**
 * Cut: two seam rules with the picture closing up between them. Deliberately
 * not scissors — the tool removes a horizontal band and pulls the rest
 * together, which is what the converging chevrons say and what scissors do
 * not.
 */
export function IconCut(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <path d="M3 5h18M3 19h18M9 9l3 3 3-3M9 15l3-3 3 3" />
    </StrokeIcon>
  );
}

/* ---- Editor chrome ---- */

export function IconImage(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="M21 15l-5-5L5 21" />
    </StrokeIcon>
  );
}

export function IconAlert(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <path d="M12 9v4M12 17h.01" />
    </StrokeIcon>
  );
}

export function IconUndo(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <path d="M9 14L4 9l5-5M4 9h11a5 5 0 0 1 0 10h-3" />
    </StrokeIcon>
  );
}

export function IconRedo(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <path d="M15 14l5-5-5-5M20 9H9a5 5 0 0 0 0 10h3" />
    </StrokeIcon>
  );
}

export function IconTrash(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />
    </StrokeIcon>
  );
}

export function IconLayers(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <path d="M12 2l9 5-9 5-9-5 9-5z" />
      <path d="M3 12l9 5 9-5" />
      <path d="M3 17l9 5 9-5" />
    </StrokeIcon>
  );
}

export function IconChevronDown(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <path d="M6 9l6 6 6-6" />
    </StrokeIcon>
  );
}

/* ---- Popup / setup: shared between the two surfaces ---- */

/** A page with three text lines — popup's "full page" mode and setup's capture feature. */
export function IconPage(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <rect x="6" y="3" width="12" height="18" rx="2" />
      <path d="M9 8h6M9 12h6M9 16h4" />
    </StrokeIcon>
  );
}

/** A wrapped gift — popup's cool-stuff link and setup's matching trust pill. */
export function IconGift(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <rect x="3" y="8" width="18" height="4" rx="1" />
      <path d="M12 8v13M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
      <path d="M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8s1-5 4.5-5a2.5 2.5 0 0 1 0 5" />
    </StrokeIcon>
  );
}

/* ---- Popup ---- */

export function IconVisible(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </StrokeIcon>
  );
}

export function IconRegion(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <rect x="4" y="5" width="16" height="14" rx="2" stroke-dasharray="4 3" />
    </StrokeIcon>
  );
}

export function IconRecordDot(props: IconProps) {
  return (
    <FillIcon {...props}>
      <circle cx="12" cy="12" r="8" />
    </FillIcon>
  );
}

export function IconGear(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </StrokeIcon>
  );
}

export function IconCoffee(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
      <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
      <line x1="6" x2="6" y1="2" y2="4" />
      <line x1="10" x2="10" y1="2" y2="4" />
      <line x1="14" x2="14" y1="2" y2="4" />
    </StrokeIcon>
  );
}

export function IconBack(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </StrokeIcon>
  );
}

/* ---- Recorder ---- */

export function IconPlay(props: IconProps) {
  return (
    <FillIcon {...props}>
      <path d="M6 4l14 8-14 8V4z" />
    </FillIcon>
  );
}

export function IconPause(props: IconProps) {
  return (
    <FillIcon {...props}>
      <rect x="5" y="4" width="5" height="16" />
      <rect x="14" y="4" width="5" height="16" />
    </FillIcon>
  );
}

/* ---- Setup ---- */

export function IconDisplay(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <rect x="2" y="4" width="20" height="14" rx="2" />
      <circle cx="12" cy="11" r="3" fill="currentColor" stroke="none" />
      <path d="M8 22h8" />
    </StrokeIcon>
  );
}

export function IconCamera(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <rect x="2" y="6" width="13" height="12" rx="2" />
      <path d="M15 10l7-3v10l-7-3" />
    </StrokeIcon>
  );
}

export function IconMic(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 10a7 7 0 0 0 14 0M12 17v5" />
    </StrokeIcon>
  );
}

export function IconGlobe(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15 15 0 0 1 0 20a15 15 0 0 1 0-20" />
    </StrokeIcon>
  );
}

export function IconCode(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <path d="M8 6l-6 6 6 6M16 6l6 6-6 6" />
    </StrokeIcon>
  );
}

export function IconShield(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6z" />
      <path d="M9 12l2 2 4-4" />
    </StrokeIcon>
  );
}

export function IconEyeOff(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <path d="M3 3l18 18M10.5 5.2A10 10 0 0 1 23 12a15 15 0 0 1-3.6 4.3M6.6 6.6A15 15 0 0 0 1 12a10 10 0 0 0 12.3 5.4" />
    </StrokeIcon>
  );
}

export function IconZoom(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.5-4.5M11 8v6M8 11h6" />
    </StrokeIcon>
  );
}

export function IconPencil(props: IconProps) {
  return (
    <StrokeIcon {...props}>
      <path d="M17 3l4 4L8 20l-5 1 1-5z" />
    </StrokeIcon>
  );
}

/**
 * The pin-hint arrow pointing at Chrome's puzzle menu. Bespoke illustration
 * with its own coordinate space (60x60) rather than a 24x24 UI icon, so it
 * keeps its own viewBox and stroke-width the way BrandMark keeps its own —
 * sized and positioned by the caller's `class`, not the `size` prop.
 */
export function IconPinArrow({ class: className }: { class?: string }) {
  return (
    <svg
      class={className}
      viewBox="0 0 60 60"
      fill="none"
      stroke="currentColor"
      stroke-width="3"
      stroke-linecap="round"
      aria-hidden="true"
    >
      <path d="M8 52 C 20 40, 30 24, 44 12" stroke-dasharray="1 7" />
      <path d="M36 10l9-2 1 9" />
    </svg>
  );
}
