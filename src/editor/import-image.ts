/**
 * Bringing an outside image into the editor.
 *
 * The pure half — which file to take, what to call it, whether it fits — is
 * here so it can be unit-tested without a DOM. `readImageFile` is the one
 * function that needs the browser, and it only touches it when called.
 */
import { sanitizeFilename } from '../shared/utils';
import { MAX_CANVAS_HEIGHT_PX } from '../shared/geometry';
import { MAX_EXPORT_AREA_PX } from './scale';

/** The first image in a drop or a paste. Non-images are ignored, not refused. */
export function pickImageFile<T extends { type: string }>(files: readonly T[]): T | null {
  for (const f of files) {
    if (f.type.startsWith('image/')) return f;
  }
  return null;
}

/** A filename without its extension, safe to feed the {title} filename token. */
export function titleFromFilename(name: string): string {
  const base = name.replace(/\.[^.]+$/, '');
  return sanitizeFilename(base).slice(0, 60) || 'image';
}

/**
 * Why this image cannot be edited, or null when it can. The limits are the
 * canvas caps the export already respects: an image past them could be loaded
 * but never composed or written out.
 */
export function importSizeError(w: number, h: number): string | null {
  if (!(w > 0) || !(h > 0)) return 'That file is not an image the editor can open.';
  if (w > MAX_CANVAS_HEIGHT_PX || h > MAX_CANVAS_HEIGHT_PX || w * h > MAX_EXPORT_AREA_PX) {
    return `That image is too large to edit (${w} × ${h}px).`;
  }
  return null;
}

/** Read a dropped or pasted file into a data URL and a decoded image. */
export function readImageFile(file: File): Promise<{ dataUrl: string; img: HTMLImageElement }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('read failed'));
    reader.onload = () => {
      const dataUrl = String(reader.result);
      const img = new Image();
      img.onload = () => resolve({ dataUrl, img });
      img.onerror = () => reject(new Error('decode failed'));
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}

/** Decode an already-have data URL — reopening a capture history shelf entry. */
export function decodeDataUrl(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('decode failed'));
    img.src = dataUrl;
  });
}
