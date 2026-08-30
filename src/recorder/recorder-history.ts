/**
 * The recorder's undo timeline, as arithmetic.
 *
 * `useRecorderSession` owns the two stacks and writes them through its own
 * applyHistory; the step itself lives here, apart from the state plumbing, so
 * it can be tested without a DOM. Undo and redo are mirror images: each pops
 * one stack, pushes the current entry onto the other, and hands back what it
 * popped — the same shape `src/editor/history.ts` uses for the image editor.
 *
 * An entry is the WHOLE editor state rather than one field's before-value.
 * The recorder's editable state is the eight small fields `recorder-draft.ts`
 * already serialises as one object, so a snapshot costs about what a patch
 * would and no two fields can end up describing different moments. (The image
 * editor stops at the annotation list plus the selection because its lists run
 * to hundreds of shapes; the recorder has no such list.)
 *
 * Whole-state entries carry one obligation: every field the user can edit has
 * to push a step. A field that never pushed would still be *restored* by an
 * undo of some other field, silently reverting an edit the user never asked to
 * take back.
 *
 * The stacks ride the draft, so they are capped: HISTORY_DEPTH entries of
 * past, and a future that can never outgrow what the past held.
 */
import type { RecorderEdit } from './recorder-draft';

/**
 * How many steps back the recorder remembers.
 *
 * The stack is written into the session record on every debounced draft save,
 * so depth is a storage cost, not just a memory one: one entry is a handful of
 * zoom blocks, the trims, and the frame settings — a few kB at the top end,
 * against video chunks measured in megabytes. Thirty covers a full editing
 * pass over a recording without ever letting a long session grow the draft
 * without bound.
 */
export const HISTORY_DEPTH = 30;

/** Where undo has been, and where redo can go back to. */
export interface RecorderHistory {
  past: RecorderEdit[];
  future: RecorderEdit[];
}

/** Where one step leaves the editor and its two stacks. */
export interface RecorderHistoryStep {
  entry: RecorderEdit;
  history: RecorderHistory;
}

export function emptyHistory(): RecorderHistory {
  return { past: [], future: [] };
}

/**
 * A new edit: the state it replaces joins the past, and the future it diverged
 * from is gone. Entries past the depth cap fall off the old end.
 *
 * `coalesce` is what makes a drag one step instead of sixty — it is true for
 * every edit after the first of one pointer press or one held key, and the
 * history comes back untouched.
 */
export function pushHistory(
  history: RecorderHistory,
  current: RecorderEdit,
  coalesce: boolean,
): RecorderHistory {
  if (coalesce) return history;
  const past = [...history.past, current];
  return { past: past.slice(Math.max(0, past.length - HISTORY_DEPTH)), future: [] };
}

/**
 * One step along the timeline: `dir` -1 undoes, 1 redoes. Null when the stack
 * that step would pop is empty — the caller's cue to do nothing at all, rather
 * than to write empty stacks back.
 */
export function historyStep(
  history: RecorderHistory,
  current: RecorderEdit,
  dir: -1 | 1,
): RecorderHistoryStep | null {
  const { past, future } = history;
  if (dir === -1) {
    if (past.length === 0) return null;
    return {
      entry: past[past.length - 1],
      history: { past: past.slice(0, -1), future: [current, ...future] },
    };
  }
  if (future.length === 0) return null;
  return {
    entry: future[0],
    history: { past: [...past, current], future: future.slice(1) },
  };
}
