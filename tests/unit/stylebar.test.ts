import { describe, it, expect } from 'vitest';
import { stylebarEmpty, stylebarFields } from '../../src/editor/stylebar';

describe('stylebarFields by tool', () => {
  it('offers colour and stroke for the shape tools', () => {
    for (const tool of ['rect', 'arrow', 'pen', 'highlight'] as const) {
      expect(stylebarFields(tool, null)).toEqual({ color: true, stroke: true, fontSize: false });
    }
  });

  it('offers colour and font size for text and step', () => {
    for (const tool of ['text', 'step'] as const) {
      expect(stylebarFields(tool, null)).toEqual({ color: true, stroke: false, fontSize: true });
    }
  });

  it('offers nothing for select, crop, and blur', () => {
    for (const tool of ['select', 'crop', 'blur'] as const) {
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
    });
    expect(stylebarFields('rect', 'step')).toEqual({
      color: true,
      stroke: false,
      fontSize: true,
    });
  });

  it('offers colour and stroke for a selected shape', () => {
    for (const type of ['rect', 'arrow', 'pen', 'highlight'] as const) {
      expect(stylebarFields('select', type)).toEqual({
        color: true,
        stroke: true,
        fontSize: false,
      });
    }
  });

  it('offers nothing for a selected blur', () => {
    expect(stylebarEmpty(stylebarFields('rect', 'blur'))).toBe(true);
  });
});

describe('stylebarEmpty', () => {
  it('is false when any field applies', () => {
    expect(stylebarEmpty({ color: true, stroke: false, fontSize: false })).toBe(false);
  });
});
