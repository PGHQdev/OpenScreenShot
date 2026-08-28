import { describe, expect, it } from 'vitest';
import { historyStep } from '../../src/editor/history';
import type { Annotation } from '../../src/editor/annotations';

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

const ids = (l: Annotation[]) => l.map((a) => a.id).join(',');
const stack = (s: Annotation[][]) => s.map(ids);

describe('historyStep', () => {
  it('has nothing to undo on an empty past', () => {
    expect(historyStep([], [list('b')], list('c'), -1)).toBeNull();
  });

  it('has nothing to redo on an empty future', () => {
    expect(historyStep([list('a')], [], list('c'), 1)).toBeNull();
  });

  it('undo shows the newest past entry and drops it from the stack', () => {
    const step = historyStep([list('a'), list('b')], [], list('c'), -1)!;
    expect(ids(step.annotations)).toBe('b');
    expect(stack(step.past)).toEqual(['a']);
  });

  it('undo pushes what was on screen onto the front of the future', () => {
    const step = historyStep([list('a')], [list('z')], list('c'), -1)!;
    expect(stack(step.future)).toEqual(['c', 'z']);
  });

  it('redo shows the oldest future entry and drops it from the stack', () => {
    const step = historyStep([], [list('y'), list('z')], list('c'), 1)!;
    expect(ids(step.annotations)).toBe('y');
    expect(stack(step.future)).toEqual(['z']);
  });

  it('redo pushes what was on screen onto the end of the past', () => {
    const step = historyStep([list('a')], [list('y')], list('c'), 1)!;
    expect(stack(step.past)).toEqual(['a', 'c']);
  });

  it('undo then redo returns every part of the state it started from', () => {
    const past = [list('a'), list('b')];
    const future = [list('z')];
    const current = list('c');
    const back = historyStep(past, future, current, -1)!;
    const forward = historyStep(back.past, back.future, back.annotations, 1)!;
    expect(ids(forward.annotations)).toBe(ids(current));
    expect(stack(forward.past)).toEqual(stack(past));
    expect(stack(forward.future)).toEqual(stack(future));
  });

  it('a run of undos walks back one entry at a time, newest first', () => {
    let past = [list('a'), list('b'), list('c')];
    let future: Annotation[][] = [];
    let current = list('d');
    const seen: string[] = [];
    for (let i = 0; i < 4; i++) {
      const step = historyStep(past, future, current, -1);
      if (!step) break;
      seen.push(ids(step.annotations));
      past = step.past;
      future = step.future;
      current = step.annotations;
    }
    expect(seen).toEqual(['c', 'b', 'a']);
    expect(historyStep(past, future, current, -1)).toBeNull();
  });

  // useEditor writes these straight into refs that other handlers read back
  // inside the same event, so a step that mutated its inputs would corrupt the
  // state it was asked to describe.
  it('leaves the stacks it was given untouched', () => {
    const past = [list('a'), list('b')];
    const future = [list('z')];
    const pastBefore = stack(past);
    const futureBefore = stack(future);
    historyStep(past, future, list('c'), -1);
    historyStep(past, future, list('c'), 1);
    expect(stack(past)).toEqual(pastBefore);
    expect(stack(future)).toEqual(futureBefore);
  });

  it('returns fresh arrays rather than the ones it was handed', () => {
    const past = [list('a')];
    const future = [list('z')];
    const undone = historyStep(past, future, list('c'), -1)!;
    expect(undone.past).not.toBe(past);
    expect(undone.future).not.toBe(future);
    const redone = historyStep(past, future, list('c'), 1)!;
    expect(redone.past).not.toBe(past);
    expect(redone.future).not.toBe(future);
  });
});
