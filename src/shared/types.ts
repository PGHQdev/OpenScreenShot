/**
 * Shared types for OpenScreenShot — message protocol, capture modes, and settings.
 * Imported by the popup, background service worker, and (later) the editor.
 */

import type { RecMessage } from './recording-types';

/** The three capture modes offered in the popup. */
export type CaptureMode = 'full-page' | 'visible' | 'region';

// --- Popup → Background (capture requests) -------------------------------

export interface CaptureRequest {
  type: 'CAPTURE_REQUEST';
  mode: CaptureMode;
  /** Region mode only: reuse the stored last-region rect, skip the overlay. */
  repeat?: boolean;
}

export type BackgroundMessage = CaptureRequest | RecMessage;

// --- Background → Popup (progress / result / error) ----------------------

export interface CaptureProgress {
  type: 'CAPTURE_PROGRESS';
  percent: number;
  message?: string;
}

export interface CaptureComplete {
  type: 'CAPTURE_COMPLETE';
  imageUrl: string;
  width: number;
  height: number;
}

export type CaptureErrorCode =
  | 'protected-page'
  | 'blank-page'
  | 'too-large'
  | 'no-region'
  | 'quick-action'
  | 'not-implemented'
  | 'unknown';

export interface CaptureError {
  type: 'CAPTURE_ERROR';
  code: CaptureErrorCode;
  message: string;
}

export type PopupMessage = CaptureProgress | CaptureComplete | CaptureError;

// --- Capture geometry (in-page measurement results) -----------------------

export interface Metrics {
  scrollHeight: number;
  viewportHeight: number;
  viewportWidth: number;
  devicePixelRatio: number;
  /**
   * Viewport-relative CSS-px rect of the inner scroll container, when the page
   * scrolls an element rather than the document (common in SPAs). Tiles are
   * cropped to this rect. `null` means the document itself scrolls.
   */
  container: PageRect | null;
}

/** A rectangle in CSS pixels (viewport-relative for region select). */
export interface PageRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** One captured viewport tile placed at vertical device-pixel offset `y`. */
export interface TileSpec {
  dataUrl: string;
  y: number;
}

/** Where the editor's image came from. An import is not a capture mode. */
export type CaptureSource = CaptureMode | 'import';

/** The most recent capture, stashed in storage so the editor page can load it. */
export interface LastCapture {
  dataUrl: string;
  width: number;
  height: number;
  mode: CaptureSource;
  title: string;
  /** Page URL, used by the `{domain}` filename token. Absent on pre-0.4.0 stashes. */
  url?: string;
  capturedAt: number;
}

// --- Settings --------------------------------------------------------------

/** Beautify frame background. `Settings` stores one; see src/editor/frame.ts. */
export type PresetId = 'ink' | 'coral' | 'dusk' | 'mint' | 'sand' | 'sky';

export type FrameBackground =
  { kind: 'preset'; id: PresetId } | { kind: 'solid'; color: string } | { kind: 'transparent' };

/** What a finished capture does. `Settings` stores one; see src/shared/utils.ts. */
export type CaptureAction = 'editor' | 'clipboard' | 'download';

export type ExportFormat = 'png' | 'jpeg' | 'webp' | 'pdf';
export type ThemePreference = 'light' | 'dark' | 'system';

export interface Settings {
  defaultFormat: ExportFormat;
  theme: ThemePreference;
  // PDF defaults (used from M3 onward; stored now so settings are stable)
  pdfPageSize: 'a4' | 'letter' | 'full';
  pdfOrientation: 'portrait' | 'landscape';
  pdfMultiPage: boolean;
  pdfMarginMm: number;
  quality: number; // 0..1, JPEG/WebP/PDF quality
  filenameTemplate: string;
  showOnboarding: boolean;
  // Annotation style (remembered across sessions)
  annotationColor: string;
  annotationStrokeWidth: number;
  annotationFontSize: number;
  /** Custom colours the user picked, most recent first. */
  recentColors: string[];
  /** Seconds to wait before every capture (0 = immediate). See CAPTURE_DELAYS. */
  captureDelay: number;
  /** What a finished capture does: open the editor, copy, or save. See CAPTURE_ACTIONS. */
  captureAction: CaptureAction;
  /** When true, a toolbar-icon click captures the full page instead of opening the popup. */
  expressMode: boolean;
  /** Beautify frame (editor). Sliders are 0..100; see src/editor/frame.ts. */
  beautifyEnabled: boolean;
  beautifyPadding: number;
  beautifyRadius: number;
  beautifyShadow: number;
  beautifyBackground: FrameBackground;
}

export const DEFAULT_SETTINGS: Settings = {
  defaultFormat: 'png',
  theme: 'system',
  pdfPageSize: 'a4',
  pdfOrientation: 'portrait',
  pdfMultiPage: true,
  pdfMarginMm: 8,
  quality: 0.92,
  filenameTemplate: 'screenshot_{date}_{time}',
  showOnboarding: true,
  annotationColor: '#ff3b30',
  annotationStrokeWidth: 6,
  annotationFontSize: 28,
  recentColors: [],
  captureDelay: 0,
  captureAction: 'editor',
  expressMode: false,
  beautifyEnabled: false,
  beautifyPadding: 40,
  beautifyRadius: 30,
  beautifyShadow: 45,
  beautifyBackground: { kind: 'preset', id: 'ink' },
};
