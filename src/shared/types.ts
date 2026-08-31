/**
 * Shared types for OpenScreenShot — message protocol, capture modes, and settings.
 * Imported by the popup, background service worker, and (later) the editor.
 */

import type { RecMessage } from './recording-types';
import { tokens } from './design-tokens';

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

/**
 * A capture, decoded and ready for the editor's canvas. Returned by
 * `getLastCapture`/`openCapture` (src/shared/storage.ts), which read it back
 * out of the capture history shelf. `id` names the shelf entry it came from —
 * absent when the capture predates the shelf and has not round-tripped
 * through storage yet (a fresh import, before `applyImport` stashes it).
 */
export interface LastCapture {
  dataUrl: string;
  width: number;
  height: number;
  mode: CaptureSource;
  title: string;
  /** Page URL, used by the `{domain}` filename token. Absent on pre-0.4.0 stashes. */
  url?: string;
  capturedAt: number;
  id?: string;
}

/**
 * One row in the capture history shelf — everything the shelf's list needs
 * to draw itself without loading a single full-size image. `thumbnail` is a
 * small JPEG data URL (see src/shared/thumbnail.ts); the full-size image
 * lives under its own storage key, read only when this entry is opened. See
 * src/shared/storage.ts's CAPTURE_HISTORY_LIMIT doc comment for why the
 * split exists.
 */
export interface CaptureHistoryEntry {
  id: string;
  thumbnail: string;
  width: number;
  height: number;
  mode: CaptureSource;
  title: string;
  url?: string;
  capturedAt: number;
  /**
   * The full image's stored size, in bytes — `dataUrl.length` at write time
   * (the base64 string's UTF-16 length, close enough to its byte count to
   * budget against; decoding it just to measure would defeat the point of
   * keeping the shelf's list read light). Eviction enforces a byte budget
   * against this alongside the count cap — see CAPTURE_IMAGE_BYTES_BUDGET
   * in src/shared/storage.ts.
   */
  imageBytes: number;
}

// --- Settings --------------------------------------------------------------

/** Beautify frame background. `Settings` stores one; see src/editor/frame.ts. */
export type PresetId = 'ink' | 'coral' | 'dusk' | 'mint' | 'sand' | 'sky';

/** Beautify look — a named set of frame values. See src/editor/frame.ts. */
export type LookId = 'clean' | 'airy' | 'snug' | 'flat' | 'poster' | 'cutout';

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
  quality: number; // 0..1, JPEG/WebP quality — PDF export is lossless (pdf-writer.ts)
  filenameTemplate: string;
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
  /** The named look those four came from, or null when they came from none. */
  beautifyLook: LookId | null;
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
  annotationColor: tokens.swatchRed,
  annotationStrokeWidth: 6,
  annotationFontSize: 28,
  recentColors: [],
  captureDelay: 0,
  captureAction: 'editor',
  // True since 1.6.0: the toolbar icon is the one-click full-page capture.
  // Existing installs are flipped once by migrateExpressDefault (storage.ts).
  expressMode: true,
  beautifyEnabled: false,
  beautifyPadding: 40,
  beautifyRadius: 30,
  beautifyShadow: 45,
  beautifyBackground: { kind: 'preset', id: 'ink' },
  // Null, not 'clean', although the four values above are Clean's: this is
  // also what an upgrading install reads for a key its stored settings do not
  // have, and defaulting it to a look would claim the user chose one.
  // frameFromSettings falls back to matching the values, which answers 'clean'
  // here and answers honestly for a frame that was adjusted by hand.
  beautifyLook: null,
};
