import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * `Settings.quality` used to be documented as affecting PDF export
 * (`quality: number; // 0..1, JPEG/WebP/PDF quality`), but pdf-writer.ts has
 * always written pages losslessly (raw DeviceRGB under /FlateDecode — see its
 * own module doc) and takes no quality parameter at all; the export dialog
 * itself only ever shows the Quality slider for jpeg/webp (App.tsx's
 * `showQuality`). The doc comment was the thing out of step with the code, not
 * the other way round — this pins the comment down, and pins down that
 * `PdfOptions` never grows a `quality` field that would make the comment true
 * by accident instead of by design.
 */
const TYPES_SRC = readFileSync(join(process.cwd(), 'src/shared/types.ts'), 'utf8');
const PDF_SRC = readFileSync(join(process.cwd(), 'src/editor/pdf.ts'), 'utf8');

describe('quality is documented as an image-export concern, not a PDF one', () => {
  it('the quality field comment does not claim PDF reads it', () => {
    const line = TYPES_SRC.split('\n').find((l) => /^\s*quality: number;/.test(l));
    expect(line, 'expected a `quality: number;` field in Settings').toBeTruthy();
    // The old comment listed PDF as one of the formats quality governs
    // ("JPEG/WebP/PDF quality"); a corrected comment may still say the word
    // PDF (to say it does *not* apply), so this checks for that specific
    // claim rather than banning the word outright.
    expect(line).not.toMatch(/\/PDF quality/);
  });

  it('PdfOptions carries no quality field for that comment to describe', () => {
    const m = /export interface PdfOptions \{([^}]*)\}/.exec(PDF_SRC);
    expect(m, 'expected to find the PdfOptions interface').toBeTruthy();
    expect(m![1]).not.toMatch(/quality/i);
  });
});
