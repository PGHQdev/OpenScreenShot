import { describe, it, expect } from 'vitest';
import { agreed, stylebarEmpty, stylebarFields } from '../../src/editor/stylebar';
import type { Annotation } from '../../src/editor/annotations';

describe('stylebarFields by tool', () => {
  it('offers colour and stroke for the shape tools', () => {
    for (const tool of ['rect', 'arrow', 'line', 'pen', 'highlight'] as const) {
      expect(stylebarFields(tool, null)).toEqual({
        color: true,
        stroke: true,
        fontSize: false,
        shape: false,
        redaction: false,
        strength: false,
      });
    }
  });

  it('offers colour and font size for text and step', () => {
    for (const tool of ['text', 'step'] as const) {
      expect(stylebarFields(tool, null)).toEqual({
        color: true,
        stroke: false,
        fontSize: true,
        shape: false,
        redaction: false,
        strength: false,
      });
    }
  });

  it('offers the shape picker for the spotlight tool', () => {
    expect(stylebarFields('spotlight', null)).toEqual({
      color: false,
      stroke: false,
      fontSize: false,
      shape: true,
      redaction: false,
      strength: false,
    });
  });

  it('offers the redaction picker and the strength slider for the blur tool', () => {
    expect(stylebarFields('blur', null)).toEqual({
      color: false,
      stroke: false,
      fontSize: false,
      shape: false,
      redaction: true,
      strength: true,
    });
  });

  it('offers nothing for select and crop', () => {
    for (const tool of ['select', 'crop'] as const) {
      expect(stylebarEmpty(stylebarFields(tool, null))).toBe(true);
    }
  });
});

describe('stylebarFields by selection', () => {
  it('lets the selection override the active tool', () => {
    expect(stylebarFields('select', 'text')).toEqual({
      color: true,
      stroke: false,
      fontSize: true,
      shape: false,
      redaction: false,
      strength: false,
    });
    expect(stylebarFields('rect', 'step')).toEqual({
      color: true,
      stroke: false,
      fontSize: true,
      shape: false,
      redaction: false,
      strength: false,
    });
  });

  it('offers colour and stroke for a selected shape', () => {
    for (const type of ['rect', 'arrow', 'pen', 'highlight'] as const) {
      expect(stylebarFields('select', type)).toEqual({
        color: true,
        stroke: true,
        fontSize: false,
        shape: false,
        redaction: false,
        strength: false,
      });
    }
  });

  it('offers the shape picker for a selected spotlight', () => {
    expect(stylebarFields('select', 'spotlight')).toEqual({
      color: false,
      stroke: false,
      fontSize: false,
      shape: true,
      redaction: false,
      strength: false,
    });
  });

  it('offers the redaction picker and the strength slider for a selected blur', () => {
    expect(stylebarFields('rect', 'blur')).toEqual({
      color: false,
      stroke: false,
      fontSize: false,
      shape: false,
      redaction: true,
      strength: true,
    });
  });
});

describe('stylebarFields for the eyedropper', () => {
  it('shows the colour row, so the picked colour is visible where it landed', () => {
    expect(stylebarFields('eyedropper', null)).toEqual({
      color: true,
      stroke: false,
      fontSize: false,
      shape: false,
      redaction: false,
      strength: false,
    });
  });
});

describe('stylebarEmpty', () => {
  it('is false when any field applies', () => {
    const base = {
      color: false,
      stroke: false,
      fontSize: false,
      shape: false,
      redaction: false,
      strength: false,
    };
    expect(stylebarEmpty({ ...base, color: true })).toBe(false);
    expect(stylebarEmpty({ ...base, shape: true })).toBe(false);
    expect(stylebarEmpty({ ...base, redaction: true })).toBe(false);
    expect(stylebarEmpty({ ...base, strength: true })).toBe(false);
    expect(stylebarEmpty(base)).toBe(true);
  });
});

describe('agreed', () => {
  const box = (id: string, stroke: string, strokeWidth = 6): Annotation => ({
    id,
    type: 'rect',
    x: 0,
    y: 0,
    w: 10,
    h: 10,
    stroke,
    strokeWidth,
    fill: null,
  });
  const blur = (id: string, strength = 8): Annotation => ({
    id,
    type: 'blur',
    x: 0,
    y: 0,
    w: 10,
    h: 10,
    strength,
  });
  const color = (a: Annotation) => (a.type === 'rect' ? a.stroke : undefined);
  const width = (a: Annotation) => (a.type === 'rect' ? a.strokeWidth : undefined);
  const strength = (a: Annotation) => (a.type === 'blur' ? a.strength : undefined);

  it('reads the value straight back from a lone selection', () => {
    expect(agreed([box('a', '#ff3b30')], color)).toBe('#ff3b30');
  });

  it('reads a value every selected layer shares', () => {
    expect(agreed([box('a', '#ff3b30'), box('b', '#ff3b30')], color)).toBe('#ff3b30');
  });

  it('has no answer when the layers disagree', () => {
    expect(agreed([box('a', '#ff3b30'), box('b', '#0a84ff')], color)).toBeNull();
  });

  it('passes over the layers the field does not apply to', () => {
    // A blur carries no stroke colour, so it neither answers nor blocks.
    expect(agreed([box('a', '#ff3b30'), blur('b')], color)).toBe('#ff3b30');
    expect(agreed([blur('b')], color)).toBeNull();
  });

  it('reads nothing from an empty selection', () => {
    expect(agreed([], color)).toBeNull();
  });

  // The style bar's whole sequence: one layer, a second one that disagrees,
  // then back to one. Adding makes the answer go away; removing brings the
  // remaining layer's own value back.
  it('loses its answer when a selection becomes mixed, and regains it when it does not', () => {
    const red = box('a', '#ff3b30');
    const blue = box('b', '#0a84ff');
    expect(agreed([blue], color)).toBe('#0a84ff');
    expect(agreed([blue, red], color)).toBeNull();
    expect(agreed([red], color)).toBe('#ff3b30');
  });

  // A falsy value is still a value: a 0 that read as "no answer" would let the
  // bar keep showing the previous width against a selection that agrees on 0.
  it('treats a falsy value as an answer, not as an absence', () => {
    expect(agreed([box('a', '#ff3b30', 0), box('b', '#0a84ff', 0)], width)).toBe(0);
    expect(agreed([box('a', '#ff3b30', 0), box('b', '#0a84ff', 6)], width)).toBeNull();
  });

  // Task 30: the strength slider's multi-select agreement, same rule as
  // colour and stroke width above — a shared strength answers, a mixed one
  // does not, and editing still writes to the whole selection either way
  // (useEditor's applyStyleToSelected, not agreed's job to prove).
  it('agrees on the blur strength when the selection shares one', () => {
    expect(agreed([blur('a', 8), blur('b', 8)], strength)).toBe(8);
    expect(agreed([blur('a', 8), blur('b', 20)], strength)).toBeNull();
    expect(agreed([box('a', '#ff3b30'), blur('b', 12)], strength)).toBe(12);
  });
});
