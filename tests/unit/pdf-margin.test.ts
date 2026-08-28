import { describe, it, expect } from 'vitest';
import { clampPdfMargin, MAX_PDF_MARGIN_MM, MIN_PDF_MARGIN_MM } from '../../src/editor/pdf';

describe('clampPdfMargin', () => {
  it('keeps an in-range value', () => {
    expect(clampPdfMargin(8)).toBe(8);
  });

  it('holds the floor', () => {
    expect(clampPdfMargin(-5)).toBe(MIN_PDF_MARGIN_MM);
    expect(clampPdfMargin(0)).toBe(MIN_PDF_MARGIN_MM);
  });

  it('holds the ceiling — the field declares max="40" and must enforce it', () => {
    expect(clampPdfMargin(99)).toBe(MAX_PDF_MARGIN_MM);
    expect(clampPdfMargin(40)).toBe(MAX_PDF_MARGIN_MM);
  });

  it('rounds to a whole millimetre', () => {
    expect(clampPdfMargin(8.6)).toBe(9);
  });

  it('falls back to the floor for non-finite input, so it never reaches the PDF writer', () => {
    expect(clampPdfMargin(Number.NaN)).toBe(MIN_PDF_MARGIN_MM);
    expect(clampPdfMargin(Number.POSITIVE_INFINITY)).toBe(MIN_PDF_MARGIN_MM);
    expect(clampPdfMargin(Number.NEGATIVE_INFINITY)).toBe(MIN_PDF_MARGIN_MM);
  });

  it('treats an emptied field (Number("") === 0) as the valid floor, not an error', () => {
    expect(clampPdfMargin(Number(''))).toBe(0);
  });
});
