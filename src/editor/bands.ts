/**
 * Cut bands — horizontal strips of the screenshot removed at compose time.
 *
 * A band is stored in source image pixels and applied when the picture is
 * drawn, so a cut is never destructive: the pixels stay in the capture, the
 * band list is what the document carries, and deleting a band brings the strip
 * back. That is the whole difference from crop, which rasterises a new image
 * and throws the rest away.
 *
 * Two coordinate spaces meet here. *Source* is the capture's own pixel grid,
 * which is where annotations live and where a band is stored. *Composed* is
 * what the canvas shows and what an export contains, with every band closed
 * up. `toComposed` and `toSource` are the map and its inverse; the map is
 * monotone but not injective, because a whole band collapses onto its seam.
 *
 * The stored list is kept sorted and merged (see {@link addBand}), so one band
 * is one seam and every walk below can stop at the first band that starts past
 * the point it was asked about.
 */

/** A removed strip, covering source rows [y, y + h). */
export interface Band {
  y: number;
  h: number;
}

/**
 * Shortest band a drag commits, in source pixels. Matched to the shape tools'
 * own commit floor (`shouldCommit`), so a stray click with the Cut tool is
 * discarded the same way a stray click with Rectangle is. A band placed with
 * the keyboard has no such floor: it is drafted, read out and confirmed, so a
 * one-pixel one is asked for rather than slipped.
 */
export const MIN_BAND = 2;

/**
 * Clamp every band to the image, drop the empty ones, sort them, and merge any
 * that overlap or touch.
 *
 * Merging first is what keeps {@link composedHeight} honest: two bands over
 * the same rows remove those rows once, and a sum taken before merging would
 * count the overlap twice and describe an image shorter than the one that gets
 * drawn. Touching bands merge as well — they leave one seam, so they are one
 * band.
 */
export function normalizeBands(bands: Band[], imgH: number): Band[] {
  const clamped: Band[] = [];
  for (const b of bands) {
    if (!Number.isFinite(b.y) || !Number.isFinite(b.h)) continue;
    const top = Math.max(0, Math.min(b.y, imgH));
    const bottom = Math.min(imgH, Math.max(0, b.y + b.h));
    if (bottom > top) clamped.push({ y: top, h: bottom - top });
  }
  clamped.sort((a, b) => a.y - b.y);
  const out: Band[] = [];
  for (const b of clamped) {
    const last = out[out.length - 1];
    if (last && b.y <= last.y + last.h) {
      last.h = Math.max(last.h, b.y + b.h - last.y);
    } else {
      out.push({ ...b });
    }
  }
  return out;
}

/** A band added to the list, normalized back into one sorted, merged run. */
export function addBand(bands: Band[], band: Band, imgH: number): Band[] {
  return normalizeBands([...bands, band], imgH);
}

/** Total height removed, in source pixels. Call on a normalized list. */
export function cutHeight(bands: Band[]): number {
  return bands.reduce((sum, b) => sum + b.h, 0);
}

/**
 * The height of the picture the canvas draws and an export contains: the
 * source height less every removed row. Zero when the bands cover the image —
 * a state the editor refuses to create (see {@link canCut}), but one a stored
 * draft could still carry, so the drawing paths floor it rather than trust it.
 */
export function composedHeight(bands: Band[], imgH: number): number {
  return imgH - cutHeight(normalizeBands(bands, imgH));
}

/** Whether removing `band` would still leave a picture behind. */
export function canCut(bands: Band[], band: Band, imgH: number): boolean {
  return composedHeight(addBand(bands, band, imgH), imgH) >= 1;
}

/**
 * How many rows are removed above source row `y`. A `y` inside a band counts
 * only the part of that band above it, which is what collapses the whole band
 * onto its seam under {@link toComposed}.
 */
export function cutAbove(bands: Band[], y: number): number {
  let sum = 0;
  for (const b of bands) {
    if (b.y >= y) break;
    sum += Math.min(b.h, y - b.y);
  }
  return sum;
}

/** A source row's place in the composed picture. */
export function toComposed(bands: Band[], y: number): number {
  return y - cutAbove(bands, y);
}

/**
 * A composed row's place in the source picture: the first source row that was
 * NOT cut away, so a seam resolves to the row just below the band rather than
 * to the first of the removed rows. That is the row a pointer on the seam is
 * actually looking at, which is what every caller wants.
 */
export function toSource(bands: Band[], y: number): number {
  let out = y;
  for (const b of bands) {
    if (b.y > out) break;
    out += b.h;
  }
  return out;
}

/** Whether source row `y` sits on a removed strip. */
export function inBand(bands: Band[], y: number): boolean {
  return bands.some((b) => y >= b.y && y < b.y + b.h);
}

/** A kept run of source rows and where it lands in the composed picture. */
export interface Segment {
  sy: number;
  h: number;
  dy: number;
}

/**
 * The runs the image is drawn in, top to bottom. The complement of the bands,
 * which is what both the live canvas and the exporter blit. An image cut away
 * entirely yields no segments, and every caller draws nothing rather than
 * special-casing it.
 */
export function segments(bands: Band[], imgH: number): Segment[] {
  const out: Segment[] = [];
  let sy = 0;
  let dy = 0;
  for (const b of normalizeBands(bands, imgH)) {
    if (b.y > sy) {
      out.push({ sy, h: b.y - sy, dy });
      dy += b.y - sy;
    }
    sy = b.y + b.h;
  }
  if (imgH > sy) out.push({ sy, h: imgH - sy, dy });
  return out;
}

/** Where each band's seam sits in the composed picture, in list order. */
export function seamPositions(bands: Band[]): number[] {
  let cut = 0;
  return bands.map((b) => {
    const at = b.y - cut;
    cut += b.h;
    return at;
  });
}

/**
 * The band whose seam is within `tol` composed pixels of `y`, or -1. Nearest
 * wins, so two seams closer together than the tolerance still resolve to the
 * one the pointer is actually on, and a dead-even tie goes to the upper of the
 * two — the one the list reaches first.
 */
export function bandAtSeam(bands: Band[], y: number, tol: number): number {
  let best = -1;
  let bestDist = Infinity;
  seamPositions(bands).forEach((at, i) => {
    const d = Math.abs(at - y);
    if (d <= tol && d < bestDist) {
      best = i;
      bestDist = d;
    }
  });
  return best;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(Math.max(v, lo), hi);
}

/** Move a band by a keyboard delta, held inside the image. */
export function moveBandBy(b: Band, dy: number, imgH: number): Band {
  return { y: clamp(b.y + dy, 0, Math.max(0, imgH - b.h)), h: b.h };
}

/** Grow or shrink a band from its bottom edge, held inside the image. */
export function resizeBandBy(b: Band, dy: number, imgH: number): Band {
  return { y: b.y, h: clamp(b.h + dy, 1, Math.max(1, imgH - b.y)) };
}

/** A band with a negative height (dragged upwards) turned the right way up. */
export function normalizeBand(b: Band): Band {
  return b.h < 0 ? { y: b.y + b.h, h: -b.h } : { ...b };
}
