import { describe, it, expect } from 'vitest';
import {
  emptyHistory,
  historyStep,
  HISTORY_DEPTH,
  pushHistory,
  stepDifference,
  type RecorderHistory,
} from '../../src/recorder/recorder-history';
import {
  defaultRecorderDraft,
  parseRecorderDraft,
  type RecorderEdit,
} from '../../src/recorder/recorder-draft';
import type { ZoomBlock } from '../../src/recorder/zoom';

function block(id: string, startMs: number): ZoomBlock {
  return { id, startMs, endMs: startMs + 3000, scale: 2, cx: 0.5, cy: 0.5 };
}

/** An edit distinguishable from its neighbours by its one zoom block. */
function edit(n: number): RecorderEdit {
  const { history: _history, savedAt: _savedAt, ...fields } = defaultRecorderDraft();
  return { ...fields, zoomBlocks: [block(`b${n}`, n * 1000)] };
}

describe('pushHistory', () => {
  it('puts the state an edit replaces on the past', () => {
    const next = pushHistory(emptyHistory(), edit(1), false);
    expect(next.past).toEqual([edit(1)]);
    expect(next.future).toEqual([]);
  });

  it('drops the redo stack, because a new edit diverges from it', () => {
    const history: RecorderHistory = { past: [edit(1)], future: [edit(2), edit(3)] };
    expect(pushHistory(history, edit(4), false).future).toEqual([]);
  });

  it('leaves the history alone for a coalesced edit', () => {
    const history: RecorderHistory = { past: [edit(1)], future: [] };
    expect(pushHistory(history, edit(2), true)).toBe(history);
  });

  it('keeps the newest HISTORY_DEPTH entries and drops the oldest', () => {
    let history = emptyHistory();
    for (let i = 0; i < HISTORY_DEPTH + 5; i++) history = pushHistory(history, edit(i), false);
    expect(history.past).toHaveLength(HISTORY_DEPTH);
    expect(history.past[0]).toEqual(edit(5));
    expect(history.past[HISTORY_DEPTH - 1]).toEqual(edit(HISTORY_DEPTH + 4));
  });

  it('does not mutate the history it was given', () => {
    const history: RecorderHistory = { past: [edit(1)], future: [edit(2)] };
    pushHistory(history, edit(3), false);
    expect(history).toEqual({ past: [edit(1)], future: [edit(2)] });
  });
});

describe('historyStep', () => {
  it('undoes to the newest past entry and banks the current one', () => {
    const history: RecorderHistory = { past: [edit(1), edit(2)], future: [] };
    const step = historyStep(history, edit(3), -1);
    expect(step).not.toBeNull();
    expect(step?.entry).toEqual(edit(2));
    expect(step?.history).toEqual({ past: [edit(1)], future: [edit(3)] });
  });

  it('redoes to the nearest future entry and banks the current one', () => {
    const history: RecorderHistory = { past: [edit(1)], future: [edit(2), edit(3)] };
    const step = historyStep(history, edit(0), 1);
    expect(step?.entry).toEqual(edit(2));
    expect(step?.history).toEqual({ past: [edit(1), edit(0)], future: [edit(3)] });
  });

  it('is null when the stack it would pop is empty', () => {
    expect(historyStep(emptyHistory(), edit(1), -1)).toBeNull();
    expect(historyStep(emptyHistory(), edit(1), 1)).toBeNull();
  });

  it('undo then redo returns the state it started from', () => {
    const start: RecorderHistory = { past: [edit(1)], future: [] };
    const undone = historyStep(start, edit(2), -1);
    const redone = historyStep(undone!.history, undone!.entry, 1);
    expect(redone?.entry).toEqual(edit(2));
    expect(redone?.history).toEqual(start);
  });

  it('does not mutate the history it was given', () => {
    const history: RecorderHistory = { past: [edit(1)], future: [edit(2)] };
    historyStep(history, edit(3), -1);
    historyStep(history, edit(3), 1);
    expect(history).toEqual({ past: [edit(1)], future: [edit(2)] });
  });
});

describe('the stack riding the draft', () => {
  it('round-trips through parseRecorderDraft', () => {
    const draft = {
      ...defaultRecorderDraft(),
      zoomBlocks: [block('live', 0)],
      history: { past: [edit(1), edit(2)], future: [edit(3)] },
    };
    const parsed = parseRecorderDraft(JSON.parse(JSON.stringify(draft)));
    expect(parsed?.history).toEqual(draft.history);
  });

  it('reads a draft written before undo existed as an empty stack', () => {
    const { history: _history, ...old } = defaultRecorderDraft();
    expect(parseRecorderDraft(old)?.history).toEqual(emptyHistory());
  });

  it('drops the whole stack when one entry cannot be vouched for', () => {
    const draft = {
      ...defaultRecorderDraft(),
      history: { past: [edit(1), { ...edit(2), zoomBlocks: [{ id: 'b', startMs: 'soon' }] }] },
    };
    expect(parseRecorderDraft(draft)?.history).toEqual(emptyHistory());
  });

  it('keeps a stored stack inside the depth cap', () => {
    const long = Array.from({ length: HISTORY_DEPTH + 4 }, (_, i) => edit(i));
    const parsed = parseRecorderDraft({
      ...defaultRecorderDraft(),
      history: { past: long, future: long },
    });
    expect(parsed?.history.past).toHaveLength(HISTORY_DEPTH);
    // The past drops its oldest; the future drops its farthest.
    expect(parsed?.history.past[0]).toEqual(edit(4));
    expect(parsed?.history.future).toHaveLength(HISTORY_DEPTH);
    expect(parsed?.history.future[0]).toEqual(edit(0));
  });
});

describe('stepDifference', () => {
  const base = edit(1);

  it('names nothing when the two states carry the same edit', () => {
    expect(stepDifference(base, { ...base })).toEqual({ kind: 'none' });
  });

  it('names nothing when a fresh array or object holds the same values', () => {
    // Re-selecting an already-active scale, corner or swatch rebuilds the
    // value without changing it: not a step, and nothing to announce.
    const rebuilt = {
      ...base,
      zoomBlocks: base.zoomBlocks.map((b) => ({ ...b })),
      bubble: { ...base.bubble },
      frame: { ...base.frame },
    };
    expect(stepDifference(base, rebuilt)).toEqual({ kind: 'none' });
  });

  it('names the zoom blocks, with the count the step lands on', () => {
    expect(stepDifference(base, { ...base, zoomBlocks: [] })).toEqual({
      kind: 'zoomBlocks',
      total: 0,
    });
    expect(stepDifference({ ...base, zoomBlocks: [] }, base)).toEqual({
      kind: 'zoomBlocks',
      total: 1,
    });
  });

  it('names a trim', () => {
    const trimmed = { ...base, trims: { seg1: { start: 250, end: 0 } } };
    expect(stepDifference(base, trimmed)).toEqual({ kind: 'field', labelKey: 'recorderTrim' });
  });

  it('names the trim, not the blocks, when a trim clamped them too', () => {
    // setTrim always rebuilds zoomBlocks through clampBlocksTo, so a trim step
    // moves two fields. The trim is the one the user dragged.
    const trimmed = { ...base, trims: { seg1: { start: 250, end: 0 } }, zoomBlocks: [] };
    expect(stepDifference(base, trimmed)).toEqual({ kind: 'field', labelKey: 'recorderTrim' });
  });

  it('names each volume slider apart', () => {
    expect(stepDifference(base, { ...base, volumes: { tab: 0.4, mic: 1 } })).toEqual({
      kind: 'field',
      labelKey: 'recorderVolTab',
    });
    expect(stepDifference(base, { ...base, volumes: { tab: 1, mic: 0.4 } })).toEqual({
      kind: 'field',
      labelKey: 'recorderVolMic',
    });
  });

  it('names the bubble', () => {
    const moved = { ...base, bubble: { ...base.bubble, corner: 'tl' as const, x: 0.1 } };
    expect(stepDifference(base, moved)).toEqual({ kind: 'field', labelKey: 'recorderBubble' });
  });

  it('names beautify, down to a nested background', () => {
    const padded = { ...base, frame: { ...base.frame, beautifyPadding: 12 } };
    expect(stepDifference(base, padded)).toEqual({ kind: 'field', labelKey: 'recorderBeautify' });
    const swatched = {
      ...base,
      frame: { ...base.frame, beautifyBackground: { kind: 'transparent' as const } },
    };
    expect(stepDifference(base, swatched)).toEqual({ kind: 'field', labelKey: 'recorderBeautify' });
  });

  it('names the cursor', () => {
    expect(stepDifference(base, { ...base, cursor: 'hidden' })).toEqual({
      kind: 'field',
      labelKey: 'recorderCursorMode',
    });
  });

  it('says nothing about the auto-zoom flag, which no step ever moves', () => {
    expect(stepDifference(base, { ...base, autoZoomDone: !base.autoZoomDone })).toEqual({
      kind: 'none',
    });
  });
});
