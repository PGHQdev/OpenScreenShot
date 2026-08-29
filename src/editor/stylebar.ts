/**
 * Which style controls apply right now, and what they show.
 *
 * A selection wins over the tool: the bar edits what the user picked. With no
 * selection the bar previews what the active tool will draw. Tools that carry
 * no style — Select, and the two that reshape the picture itself — collapse
 * the bar rather than leave an inert band across the window.
 *
 * `agreed` answers the second half of that for a selection of several layers,
 * where a field can have no single value at all.
 */
import type { Annotation } from './annotations';
import type { Tool } from './tools';

export interface StylebarFields {
  color: boolean;
  stroke: boolean;
  fontSize: boolean;
  /** The spotlight cut-out shape picker. */
  shape: boolean;
  /** The blur redaction mode picker (blur / mosaic / solid). */
  redaction: boolean;
}

const NONE: StylebarFields = {
  color: false,
  stroke: false,
  fontSize: false,
  shape: false,
  redaction: false,
};
const SHAPE: StylebarFields = { ...NONE, color: true, stroke: true };
const GLYPH: StylebarFields = { ...NONE, color: true, fontSize: true };
const SPOTLIGHT: StylebarFields = { ...NONE, shape: true };
const BLUR: StylebarFields = { ...NONE, redaction: true };

export function stylebarFields(
  tool: Tool,
  selectedType: Annotation['type'] | null,
): StylebarFields {
  if (selectedType) {
    switch (selectedType) {
      case 'rect':
      case 'arrow':
      case 'line':
      case 'pen':
      case 'highlight':
        return SHAPE;
      case 'text':
      case 'step':
        return GLYPH;
      case 'spotlight':
        return SPOTLIGHT;
      case 'blur':
        return BLUR;
    }
  }
  switch (tool) {
    case 'rect':
    case 'arrow':
    case 'line':
    case 'pen':
    case 'highlight':
      return SHAPE;
    case 'text':
    case 'step':
      return GLYPH;
    case 'spotlight':
      return SPOTLIGHT;
    case 'blur':
      return BLUR;
    case 'eyedropper':
      return { ...NONE, color: true };
    case 'select':
    case 'crop':
    case 'cut':
      return NONE;
  }
}

/** True when no control applies, so the bar should not render at all. */
export function stylebarEmpty(f: StylebarFields): boolean {
  return !f.color && !f.stroke && !f.fontSize && !f.shape && !f.redaction;
}

/**
 * The one value a selection carries for a style field, or null when the layers
 * that carry the field disagree — the bar's answer to "what colour is this?"
 * when more than one layer is selected.
 *
 * Layers the field does not apply to (a blur has no colour) read as undefined
 * and are passed over, so a mixed-type selection still agrees on the fields its
 * members do share. Null means the bar keeps what it was showing rather than
 * adopt one member's value as if it spoke for all of them; useEditor writes an
 * edit to every selected layer either way, which is how a disagreement is
 * resolved.
 */
export function agreed<T>(sel: Annotation[], read: (a: Annotation) => T | undefined): T | null {
  let seen: T | undefined;
  for (const a of sel) {
    const v = read(a);
    if (v === undefined) continue;
    if (seen === undefined) seen = v;
    else if (seen !== v) return null;
  }
  return seen ?? null;
}
