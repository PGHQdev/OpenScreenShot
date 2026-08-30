import { describe, it, expect } from 'vitest';
import {
  defaultRecorderDraft,
  parseRecorderDraft,
  type RecorderDraft,
} from '../../src/recorder/recorder-draft';
import { DEFAULT_FRAME, frameToSettings } from '../../src/editor/frame';
import type { ZoomBlock } from '../../src/recorder/zoom';

const block: ZoomBlock = {
  id: 'b1',
  startMs: 0,
  endMs: 3000,
  scale: 2,
  cx: 0.5,
  cy: 0.5,
};

function makeDraft(overrides: Partial<RecorderDraft> = {}): RecorderDraft {
  return { ...defaultRecorderDraft(), ...overrides };
}

describe('defaultRecorderDraft', () => {
  it('matches the documented defaults', () => {
    const d = defaultRecorderDraft();
    expect(d.zoomBlocks).toEqual([]);
    expect(d.autoZoomDone).toBe(false);
    expect(d.trims).toEqual({});
    expect(d.cursor).toBe('ripple');
    expect(d.volumes).toEqual({ tab: 1, mic: 1 });
    expect(d.bubble).toEqual({ corner: 'br', x: 0.85, y: 0.85, size: 0.22, hidden: false });
    expect(d.frame).toEqual(frameToSettings({ ...DEFAULT_FRAME, enabled: false }));
    expect(typeof d.savedAt).toBe('number');
  });
});

describe('parseRecorderDraft', () => {
  it('round-trips a full draft', () => {
    const d = makeDraft({
      zoomBlocks: [block],
      autoZoomDone: true,
      trims: { seg1: { start: 100, end: 200 } },
      cursor: 'hidden',
      volumes: { tab: 0.5, mic: 0.75 },
      bubble: { corner: 'tl', x: 0.1, y: 0.2, size: 0.3, hidden: true },
      savedAt: 1234,
    });
    expect(parseRecorderDraft(JSON.parse(JSON.stringify(d)))).toEqual(d);
  });

  it('rejects anything that is not a draft object', () => {
    expect(parseRecorderDraft(null)).toBeNull();
    expect(parseRecorderDraft(undefined)).toBeNull();
    expect(parseRecorderDraft('draft')).toBeNull();
    expect(parseRecorderDraft(42)).toBeNull();
    expect(parseRecorderDraft([])).toBeNull();
  });

  it('voids the whole draft on one bad zoom block (non-member scale)', () => {
    const d = makeDraft({ zoomBlocks: [block, { ...block, id: 'b2', scale: 2.5 as never }] });
    expect(parseRecorderDraft(d)).toBeNull();
  });

  it('voids the whole draft on one bad zoom block (non-finite number)', () => {
    const d = makeDraft({ zoomBlocks: [block, { ...block, id: 'b2', startMs: NaN }] });
    expect(parseRecorderDraft(d)).toBeNull();
  });

  it('accepts an empty zoom block list', () => {
    const parsed = parseRecorderDraft(makeDraft({ zoomBlocks: [] }));
    expect(parsed?.zoomBlocks).toEqual([]);
  });

  it('clamps volumes to 0..1', () => {
    const parsed = parseRecorderDraft(makeDraft({ volumes: { tab: 3, mic: -1 } }));
    expect(parsed?.volumes).toEqual({ tab: 1, mic: 0 });
  });

  it('falls back to br on an unknown bubble corner', () => {
    const raw = { ...makeDraft(), bubble: { ...defaultRecorderDraft().bubble, corner: 'nowhere' } };
    const parsed = parseRecorderDraft(raw);
    expect(parsed?.bubble.corner).toBe('br');
  });

  it('round-trips the frame through the settings validator, clamping out-of-range values', () => {
    const raw = { ...makeDraft(), frame: { beautifyPadding: 999, beautifyShadow: -3 } };
    const parsed = parseRecorderDraft(raw);
    expect(parsed?.frame.beautifyPadding).toBe(100);
    expect(parsed?.frame.beautifyShadow).toBe(0);
  });

  it('falls back savedAt to 0 when missing or non-finite', () => {
    const raw = { ...makeDraft(), savedAt: undefined };
    expect(parseRecorderDraft(raw)?.savedAt).toBe(0);
    const raw2 = { ...makeDraft(), savedAt: NaN };
    expect(parseRecorderDraft(raw2)?.savedAt).toBe(0);
  });

  it('rejects a non-array trims/zoomBlocks shape', () => {
    expect(parseRecorderDraft({ ...makeDraft(), zoomBlocks: 'nope' })).toBeNull();
    expect(parseRecorderDraft({ ...makeDraft(), trims: [] })).toBeNull();
  });
});

describe('cursor', () => {
  it('round-trips every mode', () => {
    expect(parseRecorderDraft(makeDraft({ cursor: 'hidden' }))?.cursor).toBe('hidden');
    expect(parseRecorderDraft(makeDraft({ cursor: 'shown' }))?.cursor).toBe('shown');
    expect(parseRecorderDraft(makeDraft({ cursor: 'ripple' }))?.cursor).toBe('ripple');
    expect(parseRecorderDraft(makeDraft({ cursor: 'rippleOnly' }))?.cursor).toBe('rippleOnly');
  });

  it('falls back to the default mode on an unrecognised value', () => {
    const raw = { ...makeDraft(), cursor: 'blink' };
    expect(parseRecorderDraft(raw)?.cursor).toBe('ripple');
  });

  // Pre-merge drafts (task 38 and earlier) stored `pointer`/`ripple` as two
  // independent booleans. `CursorMode` has a fourth state, `rippleOnly`
  // ("Clicks only" in the control), precisely so every one of the four
  // legacy combinations lands on its own distinct mode — nothing dropped,
  // nothing merged into a mode that changes what a restored recording draws.
  describe('migrates a legacy pointer/ripple draft, losslessly', () => {
    function legacy(pointer: boolean, ripple: boolean) {
      const { cursor: _cursor, ...rest } = makeDraft();
      return { ...rest, pointer, ripple };
    }

    it('pointer true, ripple true -> ripple (both shown)', () => {
      expect(parseRecorderDraft(legacy(true, true))?.cursor).toBe('ripple');
    });

    it('pointer true, ripple false -> shown (cursor only)', () => {
      expect(parseRecorderDraft(legacy(true, false))?.cursor).toBe('shown');
    });

    it('pointer false, ripple false -> hidden (neither)', () => {
      expect(parseRecorderDraft(legacy(false, false))?.cursor).toBe('hidden');
    });

    it('pointer false, ripple true -> rippleOnly: the cursor stays hidden, clicks still mark — nothing silently shown', () => {
      expect(parseRecorderDraft(legacy(false, true))?.cursor).toBe('rippleOnly');
    });

    it('a draft missing both legacy fields defaults as if pointer and ripple were both on', () => {
      const { cursor: _cursor, ...rest } = makeDraft();
      expect(parseRecorderDraft(rest)?.cursor).toBe('ripple');
    });

    it('all four legacy combinations land on four distinct modes', () => {
      const modes = [
        parseRecorderDraft(legacy(true, true))?.cursor,
        parseRecorderDraft(legacy(true, false))?.cursor,
        parseRecorderDraft(legacy(false, false))?.cursor,
        parseRecorderDraft(legacy(false, true))?.cursor,
      ];
      expect(new Set(modes).size).toBe(4);
    });
  });
});
