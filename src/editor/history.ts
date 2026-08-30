/**
 * The undo timeline, as arithmetic.
 *
 * useEditor owns the two stacks and writes them through applyHistory; the step
 * itself lives here, apart from the state plumbing, so it can be tested without
 * a DOM. Undo and redo are mirror images: each pops one stack, pushes the
 * current entry onto the other, and shows what it popped.
 *
 * An entry is the annotation list, the picture it was measured against *and*
 * the selection that went with them, captured and restored as one set — which
 * is what lets a crop be an ordinary undo step rather than the end of the
 * timeline. A
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
  /**
   * The picture those coordinates were measured against, or null before one
   * has loaded.
   *
   * Crop is the only edit that replaces it: the crop rasterises a new image
   * and the annotation coordinates move into that image's space, so the
   * decoded element the entry was taken against is the only thing that can put
   * them back. Every other edit leaves the same element here, so an entry
   * carries a reference, not a copy — a hundred annotation edits between two
   * crops cost one element between them.
   *
   * The bitmap and the data URL behind it stay alive as long as the entry
   * does, which is what {@link trimHistoryImages} bounds.
   */
  image: HTMLImageElement | null;
}

/**
 * How many image pixels the past may hold in *reclaimable* superseded pictures
 * — the intermediate crops an undo could still walk back to, not counting the
 * capture the editor pins for its own life. Roughly four bytes each once
 * decoded, so 32 megapixels is about 128 MB.
 *
 * Only a crop adds a picture, and a crop always shrinks the one before it, so
 * a run of them costs a decreasing series rather than a multiple of the
 * capture. The budget is what stops a long run of near-identical crops on a
 * full-page capture from holding every intermediate bitmap for the rest of the
 * session.
 */
export const HISTORY_IMAGE_BUDGET_PX = 32_000_000;

/**
 * The past with its oldest entries dropped until the *reclaimable* pictures it
 * still refers to fit inside `budgetPx`.
 *
 * `pinned` is the picture the editor holds for its own life whatever the
 * timeline does — the capture decoded at load, which `baseImageRef` and the
 * stashed `capture.dataUrl` both keep alive. It is excluded from the sum,
 * because dropping the entries that name it frees nothing at all and would
 * spend the user's undo history for no memory. Only the intermediate crops are
 * reclaimable, and a trim is only worth running for those.
 *
 * That exclusion is also what makes a first crop free: every entry before it
 * shares the base, so the sum is zero and nothing is ever dropped, at any
 * capture size.
 *
 * The newest entry is always kept, whatever it costs: it is the one a crop
 * just pushed, and a crop that could not be undone at all would be a worse
 * answer than a large one that can. Entries sharing a picture cost it once.
 * Only the past is measured — every future entry was counted here when it was
 * pushed, and the trim runs on the push, so nothing is dropped out from under
 * a redo.
 *
 * Returns the array it was handed when nothing needs dropping, so the common
 * case allocates nothing.
 */
export function trimHistoryImages(
  past: HistoryEntry[],
  budgetPx: number,
  pinned: HTMLImageElement | null = null,
): HistoryEntry[] {
  if (past.length === 0) return past;
  const seen = new Set<HTMLImageElement>();
  if (pinned) seen.add(pinned);
  let sum = 0;
  // The newest entry is taken before the budget is consulted at all — that is
  // where "a crop is always undoable once" lives. The walk then goes backwards
  // and every older entry has to fit.
  let keepFrom = past.length - 1;
  const newest = past[keepFrom].image;
  if (newest && !seen.has(newest)) {
    seen.add(newest);
    sum = newest.naturalWidth * newest.naturalHeight;
  }
  for (let i = past.length - 2; i >= 0; i--) {
    const img = past[i].image;
    if (img && !seen.has(img)) {
      const next = sum + img.naturalWidth * img.naturalHeight;
      if (next > budgetPx) break;
      seen.add(img);
      sum = next;
    }
    keepFrom = i;
  }
  return keepFrom === 0 ? past : past.slice(keepFrom);
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
