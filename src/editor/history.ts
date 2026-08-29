/**
 * The undo timeline, as arithmetic.
 *
 * useEditor owns the two stacks and writes them through applyHistory; the step
 * itself lives here, apart from the state plumbing, so it can be tested without
 * a DOM. Undo and redo are mirror images: each pops one stack, pushes the
 * current entry onto the other, and shows what it popped.
 *
 * An entry is the annotation list *and* the selection that went with it. A
 * nudge, a delete and a duplicate all act on the whole selection, so a stack of
 * bare lists would undo the edit and leave the user with nothing selected —
 * they would have to find the layers again before they could act on them. The
 * pair is captured together and restored together, so the ids in an entry
 * always name annotations in that same entry's list.
 *
 * Every field of the result is a fresh array. useEditor stores them straight
 * into refs that other handlers read back inside the same event, so a step that
 * mutated its inputs would corrupt the state it was asked to describe.
 */
import type { Annotation } from './annotations';
import type { Band } from './bands';

/** One point on the timeline: what was on the canvas, and what was selected. */
export interface HistoryEntry {
  annotations: Annotation[];
  /**
   * The cut bands that went with that list. A cut is an edit to the document
   * like any other, so it is undone like any other — and an undo across one
   * has to put the removed strip back with the annotations that were on it.
   */
  bands: Band[];
  selectedIds: string[];
}

/** Where one step leaves the document and its two stacks. */
export interface HistoryStep {
  entry: HistoryEntry;
  past: HistoryEntry[];
  future: HistoryEntry[];
}

/**
 * One step along the timeline: `dir` -1 undoes, 1 redoes. Null when the stack
 * that step would pop is empty — the caller's cue to do nothing at all, rather
 * than to write empty stacks back.
 */
export function historyStep(
  past: HistoryEntry[],
  future: HistoryEntry[],
  current: HistoryEntry,
  dir: -1 | 1,
): HistoryStep | null {
  if (dir === -1) {
    if (past.length === 0) return null;
    return {
      entry: past[past.length - 1],
      past: past.slice(0, -1),
      future: [current, ...future],
    };
  }
  if (future.length === 0) return null;
  return {
    entry: future[0],
    past: [...past, current],
    future: future.slice(1),
  };
}
