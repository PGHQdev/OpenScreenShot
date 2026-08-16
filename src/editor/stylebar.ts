/**
 * Which style controls apply right now.
 *
 * A selection wins over the tool: the bar edits what the user picked. With no
 * selection the bar previews what the active tool will draw. Tools that carry
 * no style collapse the bar rather than leave an inert band across the window.
 */
import type { Annotation } from './annotations';
import type { Tool } from './tools';

export interface StylebarFields {
  color: boolean;
  stroke: boolean;
  fontSize: boolean;
}

const NONE: StylebarFields = { color: false, stroke: false, fontSize: false };
const SHAPE: StylebarFields = { color: true, stroke: true, fontSize: false };
const GLYPH: StylebarFields = { color: true, stroke: false, fontSize: true };

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
      case 'blur':
        return NONE;
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
    case 'select':
    case 'crop':
    case 'blur':
      return NONE;
  }
}

/** True when no control applies, so the bar should not render at all. */
export function stylebarEmpty(f: StylebarFields): boolean {
  return !f.color && !f.stroke && !f.fontSize;
}
