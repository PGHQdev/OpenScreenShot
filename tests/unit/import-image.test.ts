import { describe, it, expect } from 'vitest';
import { importSizeError, pickImageFile, titleFromFilename } from '../../src/editor/import-image';
import { MAX_CANVAS_HEIGHT_PX } from '../../src/shared/geometry';

describe('pickImageFile', () => {
  it('takes the first image in the list', () => {
    const files = [
      { type: 'text/plain', name: 'notes.txt' },
      { type: 'image/png', name: 'shot.png' },
      { type: 'image/jpeg', name: 'photo.jpg' },
    ];
    expect(pickImageFile(files)?.name).toBe('shot.png');
  });

  it('accepts any image subtype, so webp and avif drop like png', () => {
    expect(pickImageFile([{ type: 'image/avif', name: 'a.avif' }])?.name).toBe('a.avif');
  });

  it('returns null when nothing in the drop is an image', () => {
    expect(pickImageFile([{ type: 'application/pdf', name: 'doc.pdf' }])).toBeNull();
    expect(pickImageFile([])).toBeNull();
  });
});

describe('titleFromFilename', () => {
  it('drops the extension', () => {
    expect(titleFromFilename('holiday.png')).toBe('holiday');
  });

  it('keeps dots inside the name', () => {
    expect(titleFromFilename('v1.2.final.jpg')).toBe('v1.2.final');
  });

  it('strips characters a download filename cannot carry', () => {
    expect(titleFromFilename('a/b:c.png')).toBe('a_b_c');
  });

  it('falls back for a name that sanitises away', () => {
    expect(titleFromFilename('.png')).toBe('image');
    expect(titleFromFilename('')).toBe('image');
  });
});

describe('importSizeError', () => {
  it('accepts an ordinary image', () => {
    expect(importSizeError(2400, 1360)).toBeNull();
  });

  it('refuses a side past the canvas cap, naming the size', () => {
    const msg = importSizeError(MAX_CANVAS_HEIGHT_PX + 1, 100);
    expect(msg).toContain(String(MAX_CANVAS_HEIGHT_PX + 1));
  });

  it('refuses an area past the canvas cap even when both sides fit', () => {
    expect(importSizeError(20000, 20000)).not.toBeNull();
  });

  it('refuses a file that decoded to nothing', () => {
    expect(importSizeError(0, 0)).not.toBeNull();
  });
});
