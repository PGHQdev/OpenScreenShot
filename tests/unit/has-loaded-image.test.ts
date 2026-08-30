import { describe, expect, it } from 'vitest';
import { hasLoadedImage } from '../../src/editor/useEditor';
import type { LastCapture } from '../../src/shared/types';

const capture: LastCapture = {
  dataUrl: 'data:image/png;base64,AAAA',
  width: 800,
  height: 600,
  mode: 'visible',
  title: 'x',
  capturedAt: 0,
};

/**
 * `capture` is set as soon as the stashed capture's metadata is read, before
 * the image behind it has actually decoded onto the canvas (loadCapture,
 * useEditor.ts) — a decode failure sets `error` without ever clearing
 * `capture`. Copy/Export/Zoom/Beautify used to gate on `capture` alone, so a
 * failed load left them enabled over a canvas with nothing on it. This is the
 * predicate that replaced that gate.
 */
describe('hasLoadedImage', () => {
  it('is false before any capture has loaded', () => {
    expect(hasLoadedImage(null, null)).toBe(false);
  });

  it('is true once a capture has decoded with no error', () => {
    expect(hasLoadedImage(capture, null)).toBe(true);
  });

  it('is false while a capture is set but the load failed — the defect this guards', () => {
    expect(hasLoadedImage(capture, 'Could not load the screenshot.')).toBe(false);
  });

  it('is false for an error with no capture at all (a settings-read failure)', () => {
    expect(hasLoadedImage(null, 'Could not load your settings or the saved screenshot.')).toBe(
      false,
    );
  });
});
