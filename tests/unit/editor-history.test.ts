import { describe, expect, it } from 'vitest';
import { historyStep, type HistoryEntry } from '../../src/editor/history';
import type { Annotation } from '../../src/editor/annotations';
import type { Band } from '../../src/editor/bands';

/** Distinct one-annotation lists, so a step's result names itself. */
function list(tag: string): Annotation[] {
  return [
    {
      id: tag,
      type: 'rect',
      x: 0,
      y: 0,
      w: 10,
      h: 10,
      stroke: '#ff3b30',
      strokeWidth: 6,
      fill: null,
    },
  ];
}

/** One timeline entry: a named list, the cuts, and the selection with them. */
function entry(tag: string, selectedIds: string[] = [], bands: Band[] = []): HistoryEntry {
  return { annotations: list(tag), bands, selectedIds };
}

const ids = (e: HistoryEntry) => e.annotations.map((a) => a.id).join(',');
const stack = (s: HistoryEntry[]) => s.map(ids);

describe('historyStep', () => {
  it('has nothing to undo on an empty past', () => {
    expect(historyStep([], [entry('b')], entry('c'), -1)).toBeNull();
  });

  it('has nothing to redo on an empty future', () => {
    expect(historyStep([entry('a')], [], entry('c'), 1)).toBeNull();
  });

  it('undo shows the newest past entry and drops it from the stack', () => {
    const step = historyStep([entry('a'), entry('b')], [], entry('c'), -1)!;
    expect(ids(step.entry)).toBe('b');
    expect(stack(step.past)).toEqual(['a']);
  });

  it('undo pushes what was on screen onto the front of the future', () => {
    const step = historyStep([entry('a')], [entry('z')], entry('c'), -1)!;
    expect(stack(step.future)).toEqual(['c', 'z']);
  });

  it('redo shows the oldest future entry and drops it from the stack', () => {
    const step = historyStep([], [entry('y'), entry('z')], entry('c'), 1)!;
    expect(ids(step.entry)).toBe('y');
    expect(stack(step.future)).toEqual(['z']);
  });

  it('redo pushes what was on screen onto the end of the past', () => {
    const step = historyStep([entry('a')], [entry('y')], entry('c'), 1)!;
    expect(stack(step.past)).toEqual(['a', 'c']);
  });

  it('undo then redo returns every part of the state it started from', () => {
    const past = [entry('a'), entry('b')];
    const future = [entry('z')];
    const current = entry('c');
    const back = historyStep(past, future, current, -1)!;
    const forward = historyStep(back.past, back.future, back.entry, 1)!;
    expect(ids(forward.entry)).toBe(ids(current));
    expect(stack(forward.past)).toEqual(stack(past));
    expect(stack(forward.future)).toEqual(stack(future));
  });

  it('a run of undos walks back one entry at a time, newest first', () => {
    let past = [entry('a'), entry('b'), entry('c')];
    let future: HistoryEntry[] = [];
    let current = entry('d');
    const seen: string[] = [];
    for (let i = 0; i < 4; i++) {
      const step = historyStep(past, future, current, -1);
      if (!step) break;
      seen.push(ids(step.entry));
      past = step.past;
      future = step.future;
      current = step.entry;
    }
    expect(seen).toEqual(['c', 'b', 'a']);
    expect(historyStep(past, future, current, -1)).toBeNull();
  });

  // Every edit acts on the whole selection, so an entry carries the selection
  // it was made against — undo restores the layers, and what was selected on
  // them, together.
  it('carries the selection with the entry, both ways', () => {
    const past = [entry('a', ['a'])];
    const current = entry('b', ['b1', 'b2']);
    const back = historyStep(past, [], current, -1)!;
    expect(back.entry.selectedIds).toEqual(['a']);
    expect(back.future[0].selectedIds).toEqual(['b1', 'b2']);
    const forward = historyStep(back.past, back.future, back.entry, 1)!;
    expect(forward.entry.selectedIds).toEqual(['b1', 'b2']);
    expect(forward.past[0].selectedIds).toEqual(['a']);
  });

  // useEditor writes these straight into refs that other handlers read back
  // inside the same event, so a step that mutated its inputs would corrupt the
  // state it was asked to describe.
  it('leaves the stacks it was given untouched', () => {
    const past = [entry('a'), entry('b')];
    const future = [entry('z')];
    const pastBefore = stack(past);
    const futureBefore = stack(future);
    historyStep(past, future, entry('c'), -1);
    historyStep(past, future, entry('c'), 1);
    expect(stack(past)).toEqual(pastBefore);
    expect(stack(future)).toEqual(futureBefore);
  });

  it('returns fresh arrays rather than the ones it was handed', () => {
    const past = [entry('a')];
    const future = [entry('z')];
    const undone = historyStep(past, future, entry('c'), -1)!;
    expect(undone.past).not.toBe(past);
    expect(undone.future).not.toBe(future);
    const redone = historyStep(past, future, entry('c'), 1)!;
    expect(redone.past).not.toBe(past);
    expect(redone.future).not.toBe(future);
  });
});

describe('cut bands on the timeline', () => {
  it('undo shows the bands that went with the list it shows', () => {
    // The cut is the newest edit: the current document has the band, the entry
    // behind it does not, and undoing has to put the strip back.
    const before = entry('a', [], []);
    const current = entry('a', [], [{ y: 100, h: 40 }]);
    const step = historyStep([before], [], current, -1)!;
    expect(step.entry.bands).toEqual([]);
    expect(step.future[0].bands).toEqual([{ y: 100, h: 40 }]);
  });

  it('redo hands the cut back', () => {
    const cut = entry('a', [], [{ y: 100, h: 40 }]);
    const step = historyStep([], [cut], entry('a'), 1)!;
    expect(step.entry.bands).toEqual([{ y: 100, h: 40 }]);
  });
});
