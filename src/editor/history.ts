/**
 * The undo timeline, as arithmetic.
 *
 * useEditor owns the two stacks and writes them through applyHistory; the step
 * itself lives here, apart from the state plumbing, so it can be tested without
 * a DOM. Undo and redo are mirror images: each pops one stack, pushes the
 * current list onto the other, and shows what it popped.
 *
 * Every field of the result is a fresh array. useEditor stores them straight
 * into refs that other handlers read back inside the same event, so a step that
 * mutated its inputs would corrupt the state it was asked to describe.
 */
import type { Annotation } from './annotations';

/** Where one step leaves the document and its two stacks. */
export interface HistoryStep {
  annotations: Annotation[];
  past: Annotation[][];
  future: Annotation[][];
}

/**
 * One step along the timeline: `dir` -1 undoes, 1 redoes. Null when the stack
 * that step would pop is empty — the caller's cue to do nothing at all, rather
 * than to write empty stacks back.
 */
export function historyStep(
  past: Annotation[][],
  future: Annotation[][],
  current: Annotation[],
  dir: -1 | 1,
): HistoryStep | null {
  if (dir === -1) {
    if (past.length === 0) return null;
    return {
      annotations: past[past.length - 1],
      past: past.slice(0, -1),
      future: [current, ...future],
    };
  }
  if (future.length === 0) return null;
  return {
    annotations: future[0],
    past: [...past, current],
    future: future.slice(1),
  };
}
