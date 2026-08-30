/**
 * Thumbnail encoding for the capture history shelf (src/shared/storage.ts).
 * Decodes a full-size screenshot data URL and re-encodes it as a small JPEG
 * data URL, so the shelf's list read never touches the full image.
 *
 * OffscreenCanvas and createImageBitmap run in both a window and a service
 * worker, so this works from the background (where most captures are
 * stashed) and the editor (imports, and reopening a shelf entry) alike — no
 * <img>/<canvas> element is created, which the background has none of.
 * `fetch` on a `data:` URL is a local decode, not a network request, so this
 * needs no host permission.
 */

/** Longest side of an encoded thumbnail, in CSS pixels. */
export const THUMB_MAX_DIM = 240;

/** JPEG quality for the thumbnail encode — small file, not a fidelity copy. */
export const THUMB_QUALITY = 0.5;

/** Downscale `dataUrl` to fit THUMB_MAX_DIM and re-encode it as a JPEG data URL. */
export async function makeThumbnail(dataUrl: string): Promise<string> {
  const blob = await (await fetch(dataUrl)).blob();
  const bitmap = await createImageBitmap(blob);
  try {
    const scale = Math.min(1, THUMB_MAX_DIM / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = new OffscreenCanvas(w, h);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('2d context unavailable');
    ctx.drawImage(bitmap, 0, 0, w, h);
    const outBlob = await canvas.convertToBlob({ type: 'image/jpeg', quality: THUMB_QUALITY });
    const buf = await outBlob.arrayBuffer();
    return `data:image/jpeg;base64,${arrayBufferToBase64(buf)}`;
  } finally {
    bitmap.close();
  }
}

/**
 * Blob -> data URL without FileReader (its Service Worker support is too
 * recent to rely on): read the bytes and hand-encode base64 via btoa, which
 * both Window and ServiceWorkerGlobalScope carry. Chunked so a large
 * thumbnail (still capped at a few hundred KB by THUMB_MAX_DIM) never blows
 * the argument-count limit `String.fromCharCode(...bytes)` hits whole.
 */
function arrayBufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}
