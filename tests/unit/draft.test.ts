import { describe, it, expect } from 'vitest';
import { draftFrame, draftHasWork, makeDraft, parseDraft } from '../../src/editor/draft';
import type { Band } from '../../src/editor/bands';
import {
  applyLook,
  DEFAULT_FRAME,
  lookIsModified,
  type FrameOptions,
} from '../../src/editor/frame';
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

const band: Band = { y: 100, h: 40 };

describe('makeDraft', () => {
  it('keeps the annotations and the capture it belongs to', () => {
    const d = makeDraft(1700, [rect], [], DEFAULT_FRAME, 1800);
    expect(d.sourceCapturedAt).toBe(1700);
    expect(d.annotations).toEqual([rect]);
    expect(d.savedAt).toBe(1800);
  });

  it('keeps the cut bands, so a cut survives a crash the way a drawing does', () => {
    const d = makeDraft(1700, [], [band], DEFAULT_FRAME, 1800);
    expect(d.bands).toEqual([band]);
  });

  it('stores the frame in Settings shape, so frameFromSettings can validate it', () => {
    const d = makeDraft(1, [rect], [], { ...DEFAULT_FRAME, enabled: true, padding: 55 });
    expect(d.frame.beautifyEnabled).toBe(true);
    expect(d.frame.beautifyPadding).toBe(55);
  });
});

describe('draftHasWork', () => {
  it('is true for annotations alone, cuts alone, or both', () => {
    expect(draftHasWork(makeDraft(1, [rect], [], DEFAULT_FRAME))).toBe(true);
    expect(draftHasWork(makeDraft(1, [], [band], DEFAULT_FRAME))).toBe(true);
    expect(draftHasWork(makeDraft(1, [rect], [band], DEFAULT_FRAME))).toBe(true);
  });

  it('is false for a draft holding neither', () => {
    expect(draftHasWork(makeDraft(1, [], [], DEFAULT_FRAME))).toBe(false);
  });
});

describe('parseDraft', () => {
  it('round-trips what makeDraft produced', () => {
    const d = makeDraft(1700, [rect], [band], { ...DEFAULT_FRAME, enabled: true }, 1800);
    expect(parseDraft(JSON.parse(JSON.stringify(d)))).toEqual(d);
  });

  it('reads a draft written before the Cut tool existed, with nothing cut', () => {
    // Exactly what makeDraft produced up to v1.3.0: no `bands` key at all.
    // Requiring one here would discard every in-progress draft on upgrade.
    const old = { sourceCapturedAt: 1700, annotations: [rect], frame: {}, savedAt: 1800 };
    const parsed = parseDraft(old);
    expect(parsed).not.toBeNull();
    expect(parsed?.bands).toEqual([]);
    expect(parsed?.annotations).toEqual([rect]);
  });

  it('keeps the bands it was given, in order', () => {
    const parsed = parseDraft({
      sourceCapturedAt: 1,
      annotations: [],
      bands: [
        { y: 10, h: 20 },
        { y: 90, h: 5 },
      ],
    });
    expect(parsed?.bands).toEqual([
      { y: 10, h: 20 },
      { y: 90, h: 5 },
    ]);
  });

  it('voids the draft on a band that is not two finite numbers', () => {
    expect(parseDraft({ sourceCapturedAt: 1, annotations: [], bands: 'none' })).toBeNull();
    expect(parseDraft({ sourceCapturedAt: 1, annotations: [], bands: [{ y: 0 }] })).toBeNull();
    expect(
      parseDraft({ sourceCapturedAt: 1, annotations: [], bands: [{ y: 0, h: 'tall' }] }),
    ).toBeNull();
    expect(
      parseDraft({ sourceCapturedAt: 1, annotations: [], bands: [{ y: Number.NaN, h: 10 }] }),
    ).toBeNull();
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

  it('round-trips a blur strength the style bar set away from the default', () => {
    const blur: Annotation = { id: 'b1', type: 'blur', x: 0, y: 0, w: 40, h: 30, strength: 20 };
    const parsed = parseDraft(JSON.parse(JSON.stringify(makeDraft(1, [blur], [], DEFAULT_FRAME))));
    expect(parsed?.annotations).toEqual([blur]);
  });

  it('reads a blur drawn before the strength slider existed at the fixed default', () => {
    // Exactly what makeDraft produced up to v1.4.0: a blur with no `strength`
    // key at all, from the fixed-8 redaction the paint path always used.
    const old = {
      sourceCapturedAt: 1,
      annotations: [{ id: 'b1', type: 'blur', x: 0, y: 0, w: 40, h: 30, mode: 'blur' }],
    };
    const parsed = parseDraft(old);
    expect(parsed).not.toBeNull();
    expect(parsed?.annotations).toEqual([
      { id: 'b1', type: 'blur', x: 0, y: 0, w: 40, h: 30, mode: 'blur', strength: 8 },
    ]);
  });

  it('reads a blur with a non-finite strength at the fixed default, rather than voiding the draft', () => {
    const old = {
      sourceCapturedAt: 1,
      annotations: [{ id: 'b1', type: 'blur', x: 0, y: 0, w: 40, h: 30, strength: 'lots' }],
    };
    const parsed = parseDraft(old);
    expect(parsed?.annotations[0]).toMatchObject({ strength: 8 });
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
    const d = makeDraft(1, [], [], frame, 2);
    expect(draftFrame(d)).toEqual(frame);
  });
});

describe('looks through the draft', () => {
  const poster: FrameOptions = { ...DEFAULT_FRAME, ...applyLook('poster') };

  it('brings an adjusted look back as that look, still modified', () => {
    // The case settings alone cannot carry: the values match no look, so only
    // the stored id can say which one the user was adjusting.
    const adjusted: FrameOptions = { ...poster, padding: 33 };
    expect(lookIsModified(adjusted)).toBe(true);
    const d = parseDraft(JSON.parse(JSON.stringify(makeDraft(1, [rect], [], adjusted))));
    expect(d?.frame.beautifyLook).toBe('poster');
    const back = draftFrame(d!);
    expect(back.look).toBe('poster');
    expect(back.padding).toBe(33);
    expect(lookIsModified(back)).toBe(true);
  });

  it('brings an untouched look back unmodified', () => {
    const d = parseDraft(JSON.parse(JSON.stringify(makeDraft(1, [rect], [], poster))));
    expect(draftFrame(d!)).toEqual(poster);
    expect(lookIsModified(draftFrame(d!))).toBe(false);
  });

  it('keeps a frame that matches no look as no look', () => {
    const freehand: FrameOptions = { ...DEFAULT_FRAME, look: null, padding: 7, radius: 3 };
    const d = parseDraft(JSON.parse(JSON.stringify(makeDraft(1, [rect], [], freehand))));
    expect(draftFrame(d!).look).toBeNull();
  });

  it('reads a draft written before looks existed, without discarding it', () => {
    // Exactly what makeDraft produced up to v1.3.0: no `look` key at all, and
    // a frame blob holding only the four beautify settings keys. Requiring one
    // here would throw away every in-progress draft on upgrade.
    const old = {
      sourceCapturedAt: 1700,
      annotations: [rect],
      bands: [],
      frame: {
        beautifyEnabled: true,
        beautifyPadding: 70,
        beautifyRadius: 55,
        beautifyShadow: 80,
        beautifyBackground: { kind: 'preset', id: 'coral' },
      },
      savedAt: 1800,
    };
    const parsed = parseDraft(old);
    expect(parsed).not.toBeNull();
    expect(parsed?.annotations).toEqual([rect]);
    // No id was stored, so the look comes from the values — which are Poster's.
    expect(draftFrame(parsed!).look).toBe('poster');
  });

  it('reads a junk look id as no look rather than voiding the draft', () => {
    const parsed = parseDraft({
      sourceCapturedAt: 1,
      annotations: [rect],
      frame: { beautifyLook: 'gorgeous' },
    });
    expect(parsed).not.toBeNull();
    // The junk is dropped on the way through frameFromSettings, and the look
    // falls back to the one the stored values match — here the defaults', Clean.
    expect(parsed?.frame.beautifyLook).toBe('clean');
    expect(draftFrame(parsed!).look).toBe('clean');
  });
});
