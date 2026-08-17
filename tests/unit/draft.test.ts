import { describe, it, expect } from 'vitest';
import { draftFrame, makeDraft, parseDraft } from '../../src/editor/draft';
import { DEFAULT_FRAME } from '../../src/editor/frame';
import type { Annotation } from '../../src/editor/annotations';

const rect: Annotation = {
  id: 'a1',
  type: 'rect',
  x: 10,
  y: 20,
  w: 30,
  h: 40,
  stroke: '#ff3b30',
  strokeWidth: 6,
  fill: null,
};

describe('makeDraft', () => {
  it('keeps the annotations and the capture it belongs to', () => {
    const d = makeDraft(1700, [rect], DEFAULT_FRAME, 1800);
    expect(d.sourceCapturedAt).toBe(1700);
    expect(d.annotations).toEqual([rect]);
    expect(d.savedAt).toBe(1800);
  });

  it('stores the frame in Settings shape, so frameFromSettings can validate it', () => {
    const d = makeDraft(1, [rect], { ...DEFAULT_FRAME, enabled: true, padding: 55 });
    expect(d.frame.beautifyEnabled).toBe(true);
    expect(d.frame.beautifyPadding).toBe(55);
  });
});

describe('parseDraft', () => {
  it('round-trips what makeDraft produced', () => {
    const d = makeDraft(1700, [rect], { ...DEFAULT_FRAME, enabled: true }, 1800);
    expect(parseDraft(JSON.parse(JSON.stringify(d)))).toEqual(d);
  });

  it('rejects anything that is not a draft, so bad storage cannot break the editor', () => {
    expect(parseDraft(null)).toBeNull();
    expect(parseDraft('draft')).toBeNull();
    expect(parseDraft({})).toBeNull();
    expect(parseDraft({ sourceCapturedAt: 'soon', annotations: [] })).toBeNull();
    expect(parseDraft({ sourceCapturedAt: 1, annotations: 'none' })).toBeNull();
  });

  it('voids the whole draft on one unusable annotation, rather than dropping it quietly', () => {
    expect(parseDraft({ sourceCapturedAt: 1, annotations: [rect, { type: 'rect' }] })).toBeNull();
    expect(parseDraft({ sourceCapturedAt: 1, annotations: [{ id: 'x', type: 'ufo' }] })).toBeNull();
  });

  it('accepts an empty annotation list', () => {
    const parsed = parseDraft({ sourceCapturedAt: 5, annotations: [], frame: {}, savedAt: 9 });
    expect(parsed?.annotations).toEqual([]);
  });

  it('clamps a stored frame value that fell outside its range', () => {
    const parsed = parseDraft({
      sourceCapturedAt: 5,
      annotations: [],
      frame: { beautifyPadding: 999, beautifyShadow: -3 },
    });
    expect(parsed?.frame.beautifyPadding).toBe(100);
    expect(parsed?.frame.beautifyShadow).toBe(0);
  });

  it('survives a missing frame and a missing savedAt', () => {
    const parsed = parseDraft({ sourceCapturedAt: 5, annotations: [] });
    expect(parsed).not.toBeNull();
    expect(draftFrame(parsed!)).toEqual(DEFAULT_FRAME);
  });

  it('rejects a pen or highlight annotation with no points, but accepts one that has them', () => {
    expect(parseDraft({ sourceCapturedAt: 1, annotations: [{ id: 'x', type: 'pen' }] })).toBeNull();
    expect(
      parseDraft({ sourceCapturedAt: 1, annotations: [{ id: 'x', type: 'highlight' }] }),
    ).toBeNull();
    const pen: Annotation = {
      id: 'p1',
      type: 'pen',
      points: [{ x: 1, y: 2 }],
      stroke: '#ff3b30',
      strokeWidth: 6,
    };
    const parsed = parseDraft({ sourceCapturedAt: 1, annotations: [pen] });
    expect(parsed?.annotations).toEqual([pen]);
  });
});

describe('draftFrame', () => {
  it('rebuilds the frame the editor stored', () => {
    const frame = { ...DEFAULT_FRAME, enabled: true, radius: 12 };
    const d = makeDraft(1, [], frame, 2);
    expect(draftFrame(d)).toEqual(frame);
  });
});
