/**
 * useEditor — the editor's state + interaction layer.
 *
 * Owns the CanvasController, the loaded capture, the annotation list, the active
 * tool, selection, and undo/redo history, plus all mouse/keyboard interactions
 * (drawing, selecting, moving, resizing, text, crop, pan/zoom). App.tsx is a
 * thin presentational consumer.
 *
 * History records snapshots of the annotation list, the cut bands, the picture
 * they were measured against and the selection that went with them
 * (history.ts). Each mutating action snapshots the pre-change state (one entry
 * per action — a move/resize drag snapshots on first motion, not per
 * mousemove). Crop rasterises a new picture and moves every surviving
 * annotation into its coordinates, so its entry carries the picture as well as
 * the list: the four are captured together and restored together, which makes
 * a crop one ordinary undo step. A cut is one too, by a cheaper route — it is
 * a band on a list the compose paths read, so it never replaces the picture at
 * all.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { CanvasController } from './canvas';
import type { Annotation, Rect } from './annotations';
import {
  annotationsInRect,
  bbox,
  DEFAULT_STYLE,
  handleAt,
  handleAtRect,
  hasStroke,
  measureTextSize,
  normalizeRect,
  resizeRect,
  scaleAnnotation,
  scaleInBox,
  translateAnnotation,
  type AnnotationStyle,
  type BlurMode,
  type Handle,
  type SpotlightShape,
} from './annotations';
import {
  activeCropHandle,
  cropAnnotations,
  cropHandleAt,
  cropSize,
  cycleCropHandle,
  resizeCropAt,
} from './crop';
import {
  addBand,
  bandAtSeam,
  canCut,
  composedHeight,
  inBand,
  MIN_BAND,
  moveBandBy,
  normalizeBand,
  normalizeBands,
  resizeBandBy,
  seamPositions,
  type Band,
} from './bands';
import {
  DEFAULT_FRAME,
  frameFromSettings,
  frameMetrics,
  frameToSettings,
  type FrameOptions,
} from './frame';
import {
  createShapeDraft,
  createStepAnnotation,
  createTextAnnotation,
  dist,
  duplicateAnnotations,
  extendDraft,
  renumberSteps,
  shouldCommit,
  TOOL_LIST,
  type ShapeTool,
  type Tool,
} from './tools';
import {
  announce,
  canvasIntent,
  carryGroupBox,
  cycleSelection,
  groupBoxFor,
  keepBoxThroughEdit,
  moveCropBy,
  placementRect,
  PLACE_SIZE_PX,
  resizeAnnotationBy,
  resizeSelectionBy,
  type CanvasMode,
  type CarriedBox,
  type Mutation,
} from './keyboard';
import type { LastCapture, Settings } from '../shared/types';
import {
  clearDraft,
  clearDraftImage,
  getDraft,
  getDraftImage,
  getLastCapture,
  getSettings,
  setDraft,
  setDraftImage,
  setLastCapture,
  setSettings,
} from '../shared/storage';
import { formatFilename } from '../shared/utils';
import { applyTheme, watchSystemTheme } from '../shared/theme';
import { COLOR_PALETTE, pushRecent } from './palette';
import {
  draftFrame,
  draftHasWork,
  DRAFT_DEBOUNCE_MS,
  makeDraft,
  parseDraft,
  type Draft,
} from './draft';
import { canvasToDataUrl, downloadDataUrl, withExtension, type ImageFormat } from './export';
import {
  historyStep,
  HISTORY_IMAGE_BUDGET_PX,
  trimHistoryImages,
  type HistoryEntry,
} from './history';
import { agreed } from './stylebar';
import { importSizeError, readImageFile, titleFromFilename } from './import-image';
import { exportPdf as exportPdfFile, type PdfExportProgress, type PdfOptions } from './pdf';
import { resampleToWidth } from './scale';

export interface TextOverlayPos {
  x: number;
  y: number;
  fontSize: number;
  width: number;
  height: number;
}

/** A decoded import waiting on the user's answer to "replace what is here?". */
interface PendingImport {
  name: string;
  dataUrl: string;
  img: HTMLImageElement;
}

type Interaction =
  | { kind: 'pan'; lastX: number; lastY: number }
  | { kind: 'crop'; start: { x: number; y: number } }
  /**
   * A crop handle being dragged. `start` is the rect as it stood when the
   * handle was grabbed and `startPt` the composed point it was grabbed at, so
   * every move re-derives the rect from one fixed pair rather than
   * accumulating rounding along the drag.
   */
  | {
      kind: 'crop-handle';
      handle: Handle;
      start: Rect;
      startPt: { x: number; y: number };
    }
  /** A cut band being dragged out; `start` is its fixed edge, in source pixels. */
  | { kind: 'cut'; start: number }
  | { kind: 'shape' }
  | { kind: 'pen' }
  | { kind: 'move'; ids: string[]; hit: string; lastX: number; lastY: number }
  | { kind: 'marquee'; start: { x: number; y: number }; base: string[] }
  | {
      kind: 'resize';
      id: string;
      handle: Handle;
      startBBox: Rect;
      startPt: { x: number; y: number };
      /** The annotation at drag start, so scaling never compounds across moves. */
      startAnn: Annotation;
    }
  | {
      kind: 'resize-group';
      handle: Handle;
      /** The box around the whole selection at drag start. */
      startBBox: Rect;
      startPt: { x: number; y: number };
      /** Every selected annotation at drag start, for the same reason. */
      startAnns: Annotation[];
    }
  | null;

export function useEditor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const controllerRef = useRef<CanvasController | null>(null);

  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [tool, setTool] = useState<Tool>('select');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [past, setPast] = useState<HistoryEntry[]>([]);
  const [future, setFuture] = useState<HistoryEntry[]>([]);
  const [, setViewTick] = useState(0);
  const [capture, setCapture] = useState<LastCapture | null>(null);
  const [imageSize, setImageSize] = useState<{ w: number; h: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [textEdit, setTextEdit] = useState<{ id: string } | null>(null);
  const [cropActive, setCropActive] = useState(false);
  const [cropDraft, setCropDraft] = useState<Rect | null>(null);
  const [bands, setBandsState] = useState<Band[]>([]);
  const [spaceHeld, setSpaceHeld] = useState(false);
  const [settings, setSettingsState] = useState<Settings | null>(null);
  const [exporting, setExporting] = useState(false);
  // Only ever set during the multi-page PDF path (pdf.ts's own page loop is
  // the sole real progress source in the export path — see task-23-report.md).
  const [exportProgress, setExportProgress] = useState<PdfExportProgress | null>(null);
  const [style, setStyle] = useState<AnnotationStyle>(DEFAULT_STYLE);
  const [recentColors, setRecentColors] = useState<string[]>([]);
  const [spotlightShape, setSpotlightShapeState] = useState<SpotlightShape>('rect');
  const [blurMode, setBlurModeState] = useState<BlurMode>('blur');
  const [frame, setFrameState] = useState<FrameOptions>(DEFAULT_FRAME);
  const [pendingImport, setPendingImport] = useState<PendingImport | null>(null);
  // The dismissible pill over the stage. Import failures and a draft that
  // could not be restored both surface here — the two never overlap, since a
  // failed restore happens on the Restore click, not during a drop.
  const [stageNotice, setStageNotice] = useState<string | null>(null);
  const [draftPrompt, setDraftPrompt] = useState<Draft | null>(null);
  // What the editor's live region reads out. App.tsx renders it into a
  // permanently mounted node, so every write here is a text change inside a
  // region assistive tech is already watching.
  const [announcement, setAnnouncement] = useState('');

  // Refs for use inside stable event handlers (avoid stale closures).
  const toolRef = useRef(tool);
  const spaceRef = useRef(false);
  const draftRef = useRef<Annotation | null>(null);
  const interactionRef = useRef<Interaction>(null);
  const cropDraftRef = useRef<Rect | null>(null);
  /**
   * The crop handle the arrow keys resize from, or null while none has been
   * picked and the bottom-right corner stands in. Ref-only, like the cut
   * draft: the canvas draws it and the live region says it, and nothing in the
   * DOM renders from it.
   */
  const cropHandleRef = useRef<Handle | null>(null);
  const bandsRef = useRef<Band[]>([]);
  /**
   * The decoded picture on the canvas right now, written before the controller
   * sees it so a timeline entry taken inside the same event names the picture
   * that event is putting up.
   */
  const imageRef = useRef<HTMLImageElement | null>(null);
  /**
   * The picture decoded straight from the stashed capture. An undo that lands
   * back on it has no crop to remember, so the stored draft image goes rather
   * than being rewritten.
   */
  const baseImageRef = useRef<HTMLImageElement | null>(null);
  /**
   * A cut band being drafted. Ref-only: nothing in the DOM renders from it —
   * the preview is on the canvas and the wording is in the live region — and a
   * held arrow key writes it faster than an effect would sync a mirror.
   */
  const cutDraftRef = useRef<Band | null>(null);
  const annotationsRef = useRef(annotations);
  const selectedIdsRef = useRef(selectedIds);
  const pastRef = useRef(past);
  const futureRef = useRef(future);
  const dragSnapshottedRef = useRef(false);
  // A held arrow key is one undo step, the same way a drag is: set on the
  // first nudge, cleared on the key's release (see the keyup handler below).
  const keyNudgeRef = useRef(false);
  const styleRef = useRef(style);
  const spotlightShapeRef = useRef(spotlightShape);
  const blurModeRef = useRef(blurMode);
  // True from the moment restoreDraft clears draftPrompt until the restored
  // annotations land. The canvas is transiently empty in that window; without
  // this, the debounce or the visibility flush could wipe the draft being
  // restored before it is applied.
  const restoringRef = useRef(false);

  /*
   * The four writers below own the state their ref mirrors, and write both in
   * one statement. Preact flushes effects a frame after the commit, so a ref
   * synced from an effect can be read stale — or be restored to a frame-old
   * value after a newer write — by anything that repeats faster than a frame.
   * A held arrow key, a held Cmd+Z and a tool letter followed by Enter all do.
   *
   * There are two ref conventions in this file, and which one a ref follows is
   * not guessable from its name, so here they are.
   *
   *   Eager, written beside their state: annotationsRef, selectedIdsRef,
   *   pastRef, futureRef, toolRef (the four writers below), and cropDraftRef
   *   (written at each of its own call sites). Anything a keydown reads to
   *   decide what to do belongs in this group.
   *
   *   Lazy, synced from an effect: styleRef, spotlightShapeRef, blurModeRef,
   *   frameRef. All four are read only when something is being drawn or saved,
   *   where being one frame behind costs at most the previous colour on one
   *   shape. Move a ref into the eager group before letting a key chord read it.
   */

  /**
   * The box a multi-selection is resized by, and the box its handles are drawn
   * on: carried from one resize to the next rather than recomputed from the
   * members each time, so a widen and a narrow are exact inverses (see
   * resizeSelectionBy). Null means "no box carried" — every reader falls back
   * to the union of what is selected, which is where a fresh gesture starts.
   *
   * It lives as long as the box still describes the members, and three rules
   * say when that stops. The ids it was measured for travel with it, so
   * clicking away and back keeps it and selecting a layer from outside the set
   * drops it (carryGroupBox). A move of the whole selection translates it,
   * because a translate maps onto the box exactly. Any other edit to the list
   * keeps it only while every member still has the bbox it had
   * (keepBoxThroughEdit), so a colour change carries and a delete does not.
   */
  const groupBoxRef = useRef<CarriedBox | null>(null);

  /**
   * The one way that box changes: the ref and the controller, together.
   * `repaint` is false when the caller already has a render coming (see
   * Controller.setGroupBox).
   */
  const setGroupBox = useCallback((next: CarriedBox | null, repaint = true) => {
    groupBoxRef.current = next;
    controllerRef.current?.setGroupBox(groupBoxFor(next, selectedIdsRef.current), repaint);
  }, []);

  /**
   * The carried box after a translate of everything selected, which maps onto
   * it exactly. It is the box for exactly what is selected (groupBoxFor), and
   * it is carried through the move whether or not a cut currently hides the
   * row it is anchored on: a move is a move, and dropping the box because the
   * frame is momentarily undrawable would cost a widen and a narrow either
   * side of it their cancellation for good.
   *
   * Whether that box is the frame anything is drawn on or grabbed by is a
   * different question, and it has one answer, in the controller
   * (liveGroupFrame).
   */
  const movedGroupBox = useCallback((dx: number, dy: number): Rect | null => {
    const box = groupBoxFor(groupBoxRef.current, selectedIdsRef.current);
    return box ? { ...box, x: box.x + dx, y: box.y + dy } : null;
  }, []);

  /**
   * The one way the selection changes. The pointer path has a hit-test to name
   * the annotations; the keyboard has only the layer order, so selection has to
   * be settable from ids alone. That is also what un-disables the topbar's
   * Delete button for a keyboard user.
   *
   * The list is ordered by when each layer joined the selection, newest last.
   * The bracket keys walk on from that newest one, so extending the selection
   * and then carrying on in the same direction goes where the user is looking.
   */
  const selectAnnotations = useCallback(
    (ids: string[]) => {
      const carried = carryGroupBox(groupBoxRef.current, ids);
      selectedIdsRef.current = ids;
      setSelectedIds(ids);
      setGroupBox(carried);
    },
    [setGroupBox],
  );

  /**
   * Drop from the selection every mark a cut has taken out of the picture, and
   * return how many went.
   *
   * The drop is at selection time, not at move time, and the difference
   * matters. Refusing to move a mark that is still selected leaves the arrows
   * silently inert and the live region reporting a move nobody can see;
   * dropping it says what happened once, and what is left is what the next
   * press acts on. It is called where a mark can newly become hidden — when a
   * band is taken out, and at the end of a gesture that moved or resized one
   * onto rows a band already took.
   *
   * Nothing is lost either way: the mark stays in the document, and clicking
   * the seam or undoing the cut brings it back, visible and selectable again.
   */
  const pruneHiddenFromSelection = useCallback((): number => {
    const c = controllerRef.current;
    const ids = selectedIdsRef.current;
    if (!c || c.bands.length === 0 || ids.length === 0) return 0;
    const kept = ids.filter((id) => {
      const a = annotationsRef.current.find((x) => x.id === id);
      // An id with no layer behind it is not hidden, just gone; the selection
      // paths that produce one already tolerate it.
      return !a || c.annotationOffset(a) !== null;
    });
    if (kept.length === ids.length) return 0;
    selectAnnotations(kept);
    return ids.length - kept.length;
  }, [selectAnnotations]);

  /**
   * The one way the annotation list changes. `groupBox` is the resize box that
   * goes with the new list: the two resize paths pass the box they produced
   * and the two move paths pass the carried one translated, and every other
   * caller leaves it out and lets keepBoxThroughEdit rule on what its edit did
   * to the members.
   */
  const applyAnnotations = useCallback(
    (next: Annotation[] | ((prev: Annotation[]) => Annotation[]), groupBox: Rect | null = null) => {
      const prev = annotationsRef.current;
      const list = typeof next === 'function' ? next(prev) : next;
      annotationsRef.current = list;
      setAnnotations(list);
      // A new list repaints a frame later through the [annotations] effect, so
      // the box rides that render instead of forcing one of its own. render()
      // is a full repaint, and a group resize changes both every frame.
      setGroupBox(
        groupBox === null
          ? keepBoxThroughEdit(groupBoxRef.current, prev, list)
          : { box: groupBox, ids: selectedIdsRef.current },
        list === prev,
      );
    },
    [setGroupBox],
  );

  /**
   * The one way the cut band list changes. The controller is written here
   * rather than from an effect: a held arrow key drafts and applies faster
   * than Preact flushes one, and the canvas has to show the cut it just made.
   *
   * The list is kept normalized — sorted, merged and clamped to the image — by
   * every caller, which is what lets the band geometry walk it once and lets a
   * seam index name one band (see bands.ts).
   */
  const applyBands = useCallback((next: Band[]) => {
    bandsRef.current = next;
    setBandsState(next);
    controllerRef.current?.setBands(next);
  }, []);

  useEffect(() => {
    spotlightShapeRef.current = spotlightShape;
  }, [spotlightShape]);

  useEffect(() => {
    blurModeRef.current = blurMode;
  }, [blurMode]);

  /** The one way the active tool changes. */
  const selectTool = useCallback((t: Tool) => {
    // A drafted cut goes with its tool. Without this the canvas stays in cut
    // mode after `X Enter R`, and the next Enter takes the band out instead of
    // placing a rectangle. Crop keeps its draft across a tool change because
    // its confirm pill is on screen the whole time saying that it is open;
    // a cut draft has only the dim strip, which the new tool's own preview
    // would sit over.
    if (t !== 'cut' && cutDraftRef.current) {
      cutDraftRef.current = null;
      controllerRef.current?.setCutDraft(null);
    }
    toolRef.current = t;
    setTool(t);
  }, []);

  // The eyedropper is a one-shot: it sets the colour for whatever you were
  // drawing with, then hands that tool back. Clearing the selection matters too
  // — a handle painted over the pixel would be sampled instead of the pixel.
  const prevToolRef = useRef<Tool>('select');
  useEffect(() => {
    if (tool === 'eyedropper') selectAnnotations([]);
    else prevToolRef.current = tool;
  }, [tool, selectAnnotations]);

  // Sync annotations to the controller. The ref beside them is written by
  // applyAnnotations, not here.
  useEffect(() => {
    controllerRef.current?.setAnnotations(annotations);
  }, [annotations]);

  const frameRef = useRef(frame);
  // Sync the beautify frame to the controller, and to a ref for the draft flush.
  useEffect(() => {
    frameRef.current = frame;
    controllerRef.current?.setFrame(frame);
  }, [frame]);

  // The ref beside the selection is written by selectAnnotations, not here.
  useEffect(() => {
    controllerRef.current?.setSelected(selectedIds);
  }, [selectedIds]);

  useEffect(() => {
    styleRef.current = style;
  }, [style]);

  // Persist the annotation style so it's remembered across sessions.
  // Skip the very first run (the initial load from settings) to avoid a write.
  const styleLoadedRef = useRef(false);
  useEffect(() => {
    if (!styleLoadedRef.current) {
      styleLoadedRef.current = true;
      return;
    }
    void setSettings({
      annotationColor: style.color,
      annotationStrokeWidth: style.strokeWidth,
      annotationFontSize: style.fontSize,
    });
  }, [style]);

  // Persist the beautify frame so it is remembered across sessions. Skip the
  // first run (the initial load from settings) to avoid a redundant write.
  const frameLoadedRef = useRef(false);
  useEffect(() => {
    if (!frameLoadedRef.current) {
      frameLoadedRef.current = true;
      return;
    }
    void setSettings(frameToSettings(frame));
  }, [frame]);

  /**
   * When the selection changes, adopt its style in the style bar — but only
   * the parts of it the selection agrees on.
   *
   * Two annotations of different colours have no "its colour" to show, and
   * picking one of them (the first, the newest) would be a coin toss the user
   * cannot see. So each field is adopted on agreement and left alone on
   * disagreement: the bar keeps showing what it showed, which is what the next
   * shape would be drawn in anyway. Editing a field still writes it to every
   * selected annotation, so a mixed selection is how you make it agree.
   */
  useEffect(() => {
    const sel = annotationsRef.current.filter((a) => selectedIds.includes(a.id));
    if (sel.length === 0) return;
    const color = agreed(sel, (a) =>
      hasStroke(a) ? a.stroke : a.type === 'text' || a.type === 'step' ? a.color : undefined,
    );
    const strokeWidth = agreed(sel, (a) => (hasStroke(a) ? a.strokeWidth : undefined));
    const fontSize = agreed(sel, (a) => (a.type === 'text' ? a.fontSize : undefined));
    const shape = agreed(sel, (a) => (a.type === 'spotlight' ? a.shape : undefined));
    const mode = agreed(sel, (a) => (a.type === 'blur' ? (a.mode ?? 'blur') : undefined));
    if (color !== null || strokeWidth !== null || fontSize !== null) {
      setStyle((s) => ({
        color: color ?? s.color,
        strokeWidth: strokeWidth ?? s.strokeWidth,
        fontSize: fontSize ?? s.fontSize,
      }));
    }
    if (shape !== null) setSpotlightShapeState(shape);
    if (mode !== null) setBlurModeState(mode);
  }, [selectedIds]);

  /**
   * Put one mutation into the live region. The newest write is what gets read.
   *
   * The alternating trailing space is load-bearing. Two mutations in a row can
   * produce the same sentence — a second Cmd+Z that undoes another move, or `]`
   * in a one-layer document — and an identical string is not a state change, so
   * Preact writes nothing and the region stays silent. Screen readers do not
   * read the space; they do read the change it forces.
   */
  const say = useCallback((m: Mutation) => {
    const text = announce(m);
    setAnnouncement((prev) => (prev === text ? `${text} ` : text));
  }, []);

  /**
   * Read out a selection, whichever gesture made it. One layer names itself and
   * its place in the paint order; several are a count against the document;
   * none is the cleared message. Every selection gesture goes through here —
   * the brackets, a shift-click, a marquee — because a selection a pointer user
   * can see is exactly what a live region has to say out loud.
   */
  const sayAboutSelection = useCallback(
    (ids: string[]) => {
      const list = annotationsRef.current;
      if (ids.length === 0) {
        say({ kind: 'deselect' });
        return;
      }
      const only = ids.length === 1 ? list.find((x) => x.id === ids[0]) : undefined;
      say(
        only
          ? { kind: 'select', annotation: only, index: list.indexOf(only) + 1, total: list.length }
          : { kind: 'select-many', count: ids.length, total: list.length },
      );
    },
    [say],
  );

  // --- History ---
  /** The one way the undo stacks change. */
  const applyHistory = useCallback((p: HistoryEntry[], f: HistoryEntry[]) => {
    pastRef.current = p;
    futureRef.current = f;
    setPast(p);
    setFuture(f);
  }, []);

  /**
   * The document as one timeline entry: the list and the selection that goes
   * with it, read from the eager refs so a snapshot taken inside a keydown
   * carries that keydown's state, not the previous frame's.
   */
  const entry = useCallback(
    (): HistoryEntry => ({
      annotations: annotationsRef.current,
      bands: bandsRef.current,
      selectedIds: selectedIdsRef.current,
      image: imageRef.current,
    }),
    [],
  );

  const commit = useCallback(
    (updater: (prev: Annotation[]) => Annotation[]) => {
      applyHistory([...pastRef.current, entry()], []);
      applyAnnotations(updater);
    },
    [applyAnnotations, applyHistory, entry],
  );

  const snapshot = useCallback(() => {
    applyHistory([...pastRef.current, entry()], []);
  }, [applyHistory, entry]);

  /** A change to the cut bands, on the timeline like any other edit. */
  const commitBands = useCallback(
    (next: Band[]) => {
      applyHistory([...pastRef.current, entry()], []);
      applyBands(next);
    },
    [applyBands, applyHistory, entry],
  );

  /**
   * The picture height a timeline step lands on, and undefined when the step
   * did not cross a cut — which is what keeps "Undo." from reciting a height
   * that did not change.
   *
   * Identity is the test: a band list is replaced whole, never mutated, so an
   * entry taken while the bands stood still holds the very array that is still
   * current.
   */
  const stepHeight = useCallback((bands: Band[]): number | undefined => {
    const img = controllerRef.current?.image;
    if (!img || bands === bandsRef.current) return undefined;
    return composedHeight(bands, img.naturalHeight);
  }, []);

  /**
   * Put a timeline step's picture back on the canvas, and nothing when the
   * step did not change it — which is every step but a crop, since each of
   * those entries holds the very element that is already up.
   *
   * The stored draft image goes back with it. That key is what a reload
   * measures a restored annotation list against, so leaving a cropped picture
   * there after an undo would misplace every mark the next time the editor
   * opened.
   */
  const restoreStepImage = useCallback((img: HTMLImageElement | null): boolean => {
    const c = controllerRef.current;
    if (!c || !img || img === imageRef.current) return false;
    imageRef.current = img;
    c.setImage(img);
    setImageSize({ w: img.naturalWidth, h: img.naturalHeight });
    if (img === baseImageRef.current) void clearDraftImage();
    else void setDraftImage(img.src);
    return true;
  }, []);

  /** What a timeline step says out loud about the picture it landed on. */
  const stepPicture = useCallback(
    (e: HistoryEntry, changed: boolean) =>
      changed && e.image
        ? {
            imageSize: {
              w: e.image.naturalWidth,
              h: composedHeight(e.bands, e.image.naturalHeight),
            },
          }
        : { imageHeight: stepHeight(e.bands) },
    [stepHeight],
  );

  const undo = useCallback(() => {
    const step = historyStep(pastRef.current, futureRef.current, entry(), -1);
    if (!step) return;
    // The picture first: stepHeight and the announcement below both measure
    // the bands against the image that is actually up.
    const changed = restoreStepImage(step.entry.image);
    const size = stepPicture(step.entry, changed);
    applyHistory(step.past, step.future);
    applyAnnotations(step.entry.annotations);
    applyBands(step.entry.bands);
    // The four were captured together, so these ids name layers in the list
    // that just landed, and that list's coordinates belong to the picture that
    // landed with it — the state the undone edit was made against.
    selectAnnotations(step.entry.selectedIds);
    say({ kind: 'undo', total: step.entry.annotations.length, ...size });
  }, [
    applyAnnotations,
    applyBands,
    applyHistory,
    entry,
    restoreStepImage,
    selectAnnotations,
    say,
    stepPicture,
  ]);

  const redo = useCallback(() => {
    const step = historyStep(pastRef.current, futureRef.current, entry(), 1);
    if (!step) return;
    const changed = restoreStepImage(step.entry.image);
    const size = stepPicture(step.entry, changed);
    applyHistory(step.past, step.future);
    applyAnnotations(step.entry.annotations);
    applyBands(step.entry.bands);
    selectAnnotations(step.entry.selectedIds);
    say({ kind: 'redo', total: step.entry.annotations.length, ...size });
  }, [
    applyAnnotations,
    applyBands,
    applyHistory,
    entry,
    restoreStepImage,
    selectAnnotations,
    say,
    stepPicture,
  ]);

  const deleteSelection = useCallback(() => {
    const ids = selectedIdsRef.current;
    if (ids.length === 0) return;
    const gone = annotationsRef.current.filter((x) => ids.includes(x.id));
    if (gone.length === 0) return;
    commit((prev) => renumberSteps(prev.filter((x) => !ids.includes(x.id))));
    selectAnnotations([]);
    // commit lands the new list on annotationsRef before it returns, so this
    // count is what is left rather than what was there.
    const remaining = annotationsRef.current.length;
    say(
      gone.length === 1
        ? { kind: 'delete', type: gone[0].type, remaining }
        : { kind: 'delete-many', count: gone.length, remaining },
    );
  }, [commit, selectAnnotations, say]);

  /**
   * Copy the selection and select the copies, so the next drag or nudge moves
   * what was just made. The copies are offset, then renumbered with the rest of
   * the list — a duplicated step badge takes the next number rather than a
   * second copy of the one it came from.
   */
  const duplicateSelection = useCallback(() => {
    const ids = selectedIdsRef.current;
    if (ids.length === 0) return;
    const copies = duplicateAnnotations(annotationsRef.current, ids);
    if (copies.length === 0) return;
    commit((prev) => renumberSteps([...prev, ...copies]));
    selectAnnotations(copies.map((a) => a.id));
    say({ kind: 'duplicate', count: copies.length });
  }, [commit, selectAnnotations, say]);

  // --- Style (color / stroke width / font size) ---
  const applyStyleToSelected = useCallback(
    (patch: (a: Annotation) => Annotation) => {
      const ids = selectedIdsRef.current;
      if (ids.length === 0) return;
      commit((prev) => prev.map((a) => (ids.includes(a.id) ? patch(a) : a)));
    },
    [commit],
  );

  const setStyleColor = useCallback(
    (color: string) => {
      setStyle((s) => ({ ...s, color }));
      setRecentColors((prev) => {
        const next = pushRecent(prev, color);
        // pushRecent returns the same array for a preset, so identity is the test.
        if (next !== prev) void setSettings({ recentColors: next });
        return next;
      });
      applyStyleToSelected((a) =>
        a.type === 'text' || a.type === 'step'
          ? { ...a, color }
          : hasStroke(a)
            ? { ...a, stroke: color }
            : a,
      );
    },
    [applyStyleToSelected],
  );

  const setStyleStrokeWidth = useCallback(
    (strokeWidth: number) => {
      setStyle((s) => ({ ...s, strokeWidth }));
      applyStyleToSelected((a) => (hasStroke(a) ? { ...a, strokeWidth } : a));
    },
    [applyStyleToSelected],
  );

  const setSpotlightShape = useCallback(
    (shape: SpotlightShape) => {
      setSpotlightShapeState(shape);
      applyStyleToSelected((a) => (a.type === 'spotlight' ? { ...a, shape } : a));
    },
    [applyStyleToSelected],
  );

  const setBlurMode = useCallback(
    (mode: BlurMode) => {
      setBlurModeState(mode);
      applyStyleToSelected((a) => (a.type === 'blur' ? { ...a, mode } : a));
    },
    [applyStyleToSelected],
  );

  const setFrame = useCallback((patch: Partial<FrameOptions>) => {
    setFrameState((f) => ({ ...f, ...patch }));
  }, []);

  /**
   * The picture as it stands: the capture less every cut row. Everything that
   * describes the image to the user reads this rather than the capture's own
   * height — the status bar, the canvas label, the beautify preview, the
   * filename tokens and the export size — because it is what an export holds.
   */
  const visibleSize = useMemo(
    () => (imageSize ? { w: imageSize.w, h: composedHeight(bands, imageSize.h) } : null),
    [bands, imageSize],
  );

  // Outer size of the export, so the export dialog can show what a scale yields.
  const composedSize = useMemo(() => {
    if (!visibleSize) return null;
    const m = frameMetrics(frame, visibleSize.w, visibleSize.h);
    return { w: m.outerW, h: m.outerH };
  }, [frame, visibleSize]);

  const setStyleFontSize = useCallback(
    (fontSize: number) => {
      setStyle((s) => ({ ...s, fontSize }));
      applyStyleToSelected((a) =>
        a.type === 'text'
          ? { ...a, fontSize, ...measureTextSize(a.text, fontSize) }
          : a.type === 'step'
            ? { ...a, r: Math.max(12, fontSize * 0.8) }
            : a,
      );
    },
    [applyStyleToSelected],
  );

  // Settings + the stashed capture, decoded onto the controller's canvas.
  // Called once at mount and again from retryLoad (the stage error overlay's
  // Retry button), so every await here is wrapped in one try/catch: an
  // unhandled rejection from getSettings/getLastCapture used to leave
  // `loading` stuck true forever (no code path ever set it false), which is
  // exactly the hang the stage error overlay exists to replace. The two
  // failure branches that can actually occur produce two different messages
  // (R-23c) — anything more specific than "a storage read failed" vs "the
  // image failed to decode" would be inventing detail neither the rejection
  // nor img.onerror actually carries. A capture that simply isn't there
  // (getLastCapture resolves to null) is not a failure — the empty state
  // handles it, same as before.
  const loadCapture = useCallback(async () => {
    const c = controllerRef.current;
    if (!c) return;
    setLoading(true);
    setError(null);
    try {
      const s = await getSettings();
      setSettingsState(s);
      setRecentColors(s.recentColors);
      applyTheme(s.theme);
      setStyle({
        color: s.annotationColor,
        strokeWidth: s.annotationStrokeWidth,
        fontSize: s.annotationFontSize,
      });
      setFrameState(frameFromSettings(s));
      const cap = await getLastCapture();
      if (!cap) {
        setLoading(false);
        return;
      }
      setCapture(cap);
      setImageSize({ w: cap.width, h: cap.height });
      // A draft only fits the capture it was drawn on. Anything else is stale.
      const stored = parseDraft(await getDraft());
      if (stored && stored.sourceCapturedAt === cap.capturedAt && draftHasWork(stored)) {
        setDraftPrompt(stored);
      } else if (stored) {
        void clearDraft();
        void clearDraftImage();
      }
      await new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          imageRef.current = img;
          baseImageRef.current = img;
          c.setImage(img);
          resolve();
        };
        img.onerror = () => reject(new Error('decode'));
        img.src = cap.dataUrl;
      });
      setLoading(false);
    } catch (err) {
      setError(
        err instanceof Error && err.message === 'decode'
          ? 'Could not load the screenshot.'
          : 'Could not load your settings or the saved screenshot.',
      );
      setLoading(false);
    }
  }, []);

  // dismissError also clears capture/imageSize: img.onerror can fire after
  // setCapture(cap) already ran above, so without this the topbar's
  // !ed.capture checks would keep Copy/Export enabled for an image that
  // never actually decoded onto the canvas.
  const dismissError = useCallback(() => {
    setError(null);
    setCapture(null);
    setImageSize(null);
  }, []);

  // Create the controller + load the stashed capture on mount.
  useEffect(() => {
    const canvas = canvasRef.current!;
    const c = new CanvasController(canvas);
    c.onViewChange = () => setViewTick((t) => t + 1);
    controllerRef.current = c;

    void loadCapture();

    return () => {
      c.destroy();
      controllerRef.current = null;
    };
  }, [loadCapture]);

  // Live-update a "system" theme setting when the OS preference flips.
  useEffect(() => watchSystemTheme(() => void getSettings().then((s) => applyTheme(s.theme))), []);

  // Wheel zoom (non-passive so we can preventDefault trackpad scroll).
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const c = controllerRef.current;
      if (!c) return;
      c.zoomAt(e.deltaY < 0 ? 1.1 : 1 / 1.1, e.offsetX, e.offsetY);
    };
    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', onWheel);
  }, []);

  // --- Zoom controls ---
  const zoomAtCenter = useCallback((factor: number) => {
    const c = controllerRef.current;
    const canvas = canvasRef.current;
    if (!c || !canvas) return;
    const rect = canvas.getBoundingClientRect();
    c.zoomAt(factor, rect.width / 2, rect.height / 2);
  }, []);

  const zoomIn = useCallback(() => zoomAtCenter(1.25), [zoomAtCenter]);
  const zoomOut = useCallback(() => zoomAtCenter(1 / 1.25), [zoomAtCenter]);
  const fit = useCallback(() => controllerRef.current?.fit(), []);
  const resetZoom = useCallback(() => controllerRef.current?.resetZoom(), []);

  // Space = temporary pan; tool shortcuts; undo/redo; delete; Esc.
  useEffect(() => {
    const isMod = (e: KeyboardEvent) => e.ctrlKey || e.metaKey;
    const down = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !isTypingTarget(e.target)) {
        e.preventDefault();
        spaceRef.current = true;
        setSpaceHeld(true);
        return;
      }
      if (isTypingTarget(e.target)) return;

      // Undo / redo.
      if (isMod(e) && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }
      if (isMod(e) && (e.key === 'y' || e.key === 'Y')) {
        e.preventDefault();
        redo();
        return;
      }
      // Zoom.
      if (isMod(e) && (e.key === '=' || e.key === '+')) {
        e.preventDefault();
        zoomIn();
        return;
      }
      if (isMod(e) && (e.key === '-' || e.key === '_')) {
        e.preventDefault();
        zoomOut();
        return;
      }
      if (isMod(e) && e.key === '0') {
        e.preventDefault();
        resetZoom();
        return;
      }
      if (!isMod(e) && !e.altKey && e.key.toUpperCase() === 'F') {
        e.preventDefault();
        fit();
        return;
      }
      // Duplicate the selection. `e.code`, not `e.key`: macOS turns Option+D
      // into "∂", so the letter the chord produces is not the letter it names.
      if (e.code === 'KeyD' && e.altKey && !isMod(e) && !e.shiftKey) {
        e.preventDefault();
        duplicateSelection();
        return;
      }
      // Delete, in the order the things it could mean sit on screen. A drafted
      // band is the newest and the most immediate, so it goes first — ahead of
      // a selection that may have been made long before the band was drawn.
      // Then the selection, and last, with the Cut tool up and neither, the
      // cut nearest the middle of the view: a keyboard user's way to a seam,
      // which a pointer user reaches by clicking it.
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (cutDraftRef.current) {
          e.preventDefault();
          cancelCut();
          return;
        }
        if (selectedIdsRef.current.length > 0) {
          e.preventDefault();
          deleteSelection();
          return;
        }
        if (toolRef.current === 'cut') {
          e.preventDefault();
          removeNearestBand();
          return;
        }
      }
      // Escape: cancel a crop or a cut, else deselect.
      if (e.key === 'Escape') {
        if (cropDraftRef.current) {
          cancelCrop();
          e.preventDefault();
        } else if (cutDraftRef.current) {
          cancelCut();
          e.preventDefault();
        } else if (selectedIdsRef.current.length > 0) {
          selectAnnotations([]);
          sayAboutSelection([]);
          e.preventDefault();
        }
        return;
      }
      if (isMod(e) || e.altKey) return;
      // Number keys pick a palette colour, in swatch order.
      if (/^[1-9]$/.test(e.key)) {
        const color = COLOR_PALETTE[Number(e.key) - 1];
        if (color) {
          setStyleColor(color);
          e.preventDefault();
          return;
        }
      }
      // Tool shortcuts.
      const t = TOOL_LIST.find((x) => x.shortcut === e.key.toUpperCase());
      if (t) {
        selectTool(t.id);
        e.preventDefault();
      }
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        spaceRef.current = false;
        setSpaceHeld(false);
      }
      // Releasing an arrow ends the run of nudges that share one undo step.
      if (e.key.startsWith('Arrow')) keyNudgeRef.current = false;
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, [
    undo,
    redo,
    deleteSelection,
    duplicateSelection,
    zoomIn,
    zoomOut,
    resetZoom,
    fit,
    setStyleColor,
    selectTool,
    selectAnnotations,
    sayAboutSelection,
  ]);

  // --- Cut ---
  /**
   * A cut is a band on a list the compose paths read, so the picture the
   * editor draws and the picture an export holds are the same picture with the
   * same rows missing — and the capture itself is untouched. That is what
   * makes it undoable rather than final: unlike crop, nothing is rasterised
   * away, so a cut is one ordinary step and the stack in front of it stands.
   */
  const applyCutBand = useCallback(
    (band: Band) => {
      const c = controllerRef.current;
      if (!c || !c.image) return;
      const ih = c.image.naturalHeight;
      const b = normalizeBand(band);
      const cur = bandsRef.current;
      if (!canCut(cur, b, ih)) {
        say({ kind: 'cut-refused' });
        return;
      }
      const next = addBand(cur, b, ih);
      const before = composedHeight(cur, ih);
      const after = composedHeight(next, ih);
      // A band inside one already cut takes nothing. Committing it would put a
      // step on the timeline that undoes to the same picture, and announce a
      // cut of zero pixels.
      if (after === before) {
        say({ kind: 'cut-none' });
        return;
      }
      commitBands(next);
      // A mark the cut hides cannot be dragged, nudged or seen, so it does not
      // stay selected through the cut that hid it. The history entry pushed
      // above still carries the selection as it was, so an undo brings it back
      // with the strip.
      pruneHiddenFromSelection();
      // Every mark this cut took out of the picture, not only the selected
      // ones, because the layer count keeps counting all of them — and not the
      // ones an earlier cut had already taken, which this band did not touch.
      const hidden = annotationsRef.current.filter(
        (a) => inBand(next, bbox(a).y) && !inBand(cur, bbox(a).y),
      ).length;
      // The height that actually went, not the height of the band: a band that
      // overlaps one already cut removes only the rows still there.
      say({
        kind: 'cut-applied',
        band: { y: b.y, h: before - after },
        imageHeight: after,
        hidden,
      });
    },
    [commitBands, pruneHiddenFromSelection, say],
  );

  /** Put one cut back, by its place in the band list. */
  const removeBand = useCallback(
    (index: number) => {
      const c = controllerRef.current;
      if (!c || !c.image) return;
      const gone = bandsRef.current[index];
      if (!gone) return;
      const next = bandsRef.current.filter((_, i) => i !== index);
      commitBands(next);
      say({
        kind: 'cut-removed',
        band: gone,
        imageHeight: composedHeight(next, c.image.naturalHeight),
      });
    },
    [commitBands, say],
  );

  /**
   * The seam nearest the middle of the view, put back. A pointer user clicks
   * the seam itself; this is the keyboard's way to the same place, and the
   * viewport centre is the same anchor a keyboard placement uses.
   */
  const removeNearestBand = useCallback(() => {
    const c = controllerRef.current;
    const canvas = canvasRef.current;
    if (!c || !canvas || bandsRef.current.length === 0) return;
    const rect = canvas.getBoundingClientRect();
    const centre = c.toComposedPoint(rect.width / 2, rect.height / 2).y;
    const seams = seamPositions(bandsRef.current);
    let best = 0;
    seams.forEach((at, i) => {
      if (Math.abs(at - centre) < Math.abs(seams[best] - centre)) best = i;
    });
    removeBand(best);
  }, [removeBand]);

  const cancelCut = useCallback(() => {
    const had = cutDraftRef.current !== null;
    cutDraftRef.current = null;
    controllerRef.current?.setCutDraft(null);
    if (had) say({ kind: 'cut-cancelled' });
  }, [say]);

  /** Commit whatever band is drafted, and close the draft either way. */
  const applyCutDraft = useCallback(() => {
    const b = cutDraftRef.current;
    cutDraftRef.current = null;
    controllerRef.current?.setCutDraft(null);
    if (b) applyCutBand(b);
  }, [applyCutBand]);

  // --- Drag handlers (attached to window during a drag) ---
  const onDragMove = useCallback(
    (e: MouseEvent) => {
      const c = controllerRef.current;
      const it = interactionRef.current;
      if (!c || !it) return;
      const rect = c.canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      if (it.kind === 'pan') {
        c.panBy(e.clientX - it.lastX, e.clientY - it.lastY);
        it.lastX = e.clientX;
        it.lastY = e.clientY;
        return;
      }
      const p = c.toImage(sx, sy);
      if (it.kind === 'crop') {
        // Crop works on the picture as it is drawn, cuts closed up, so its
        // point comes from composed space rather than the source. The frame's
        // padding renders like part of the picture, so a drag that strays into
        // it must not smear transparent padding pixels into the crop — hold
        // the point to the image bounds.
        const raw = c.toComposedPoint(sx, sy);
        const cp = c.image ? clampToImage(raw, c.image.naturalWidth, c.composedImageHeight()) : raw;
        const r: Rect = {
          x: it.start.x,
          y: it.start.y,
          w: cp.x - it.start.x,
          h: cp.y - it.start.y,
        };
        cropDraftRef.current = r;
        c.setCropRect(r);
        return;
      }
      if (it.kind === 'crop-handle') {
        if (!c.image) return;
        const cp = c.toComposedPoint(sx, sy);
        const next = resizeCropAt(
          it.start,
          it.handle,
          cp.x - it.startPt.x,
          cp.y - it.startPt.y,
          c.image.naturalWidth,
          c.composedImageHeight(),
        );
        cropDraftRef.current = next;
        c.setCropRect(next);
        return;
      }
      if (it.kind === 'cut') {
        // A band spans the picture, so only the pointer's y says anything.
        const ih = c.image ? c.image.naturalHeight : 0;
        const b: Band = { y: it.start, h: Math.min(Math.max(p.y, 0), ih) - it.start };
        cutDraftRef.current = b;
        c.setCutDraft(b);
        return;
      }
      if (it.kind === 'marquee') {
        // Composed space, like the rectangle the user is watching: a marquee
        // held in source coordinates would cover the rows a cut took and miss
        // marks it visibly crossed.
        const m = c.toComposedPoint(sx, sy);
        c.setMarquee({ x: it.start.x, y: it.start.y, w: m.x - it.start.x, h: m.y - it.start.y });
        return;
      }
      if (it.kind === 'move') {
        if (!dragSnapshottedRef.current) {
          snapshot();
          dragSnapshottedRef.current = true;
        }
        const dx = p.x - it.lastX;
        const dy = p.y - it.lastY;
        it.lastX = p.x;
        it.lastY = p.y;
        const ids = it.ids;
        // The whole selection moves rigidly, so the carried box moves with it
        // rather than being dropped: it is the same box, one translate along.
        applyAnnotations(
          (prev) => prev.map((a) => (ids.includes(a.id) ? translateAnnotation(a, dx, dy) : a)),
          movedGroupBox(dx, dy),
        );
        return;
      }
      if (it.kind === 'resize-group') {
        if (!dragSnapshottedRef.current) {
          snapshot();
          dragSnapshottedRef.current = true;
        }
        const dx = p.x - it.startPt.x;
        const dy = p.y - it.startPt.y;
        const { startBBox, handle, startAnns } = it;
        // Every frame scales from the frozen start box, so the handles follow
        // the box that scaling produces rather than the union of the members,
        // which a glyph can sit outside of.
        applyAnnotations(
          (prev) =>
            prev.map((a) => {
              const start = startAnns.find((s) => s.id === a.id);
              return start ? scaleInBox(start, startBBox, handle, dx, dy) : a;
            }),
          resizeRect(startBBox, handle, dx, dy),
        );
        return;
      }
      if (it.kind === 'resize') {
        if (!dragSnapshottedRef.current) {
          snapshot();
          dragSnapshottedRef.current = true;
        }
        const dx = p.x - it.startPt.x;
        const dy = p.y - it.startPt.y;
        const id = it.id;
        const handle = it.handle;
        const startBBox = it.startBBox;
        const startAnn = it.startAnn;
        applyAnnotations((prev) =>
          prev.map((a) => {
            if (a.id !== id) return a;
            if (a.type === 'rect' || a.type === 'blur' || a.type === 'spotlight') {
              const r = resizeRect(startBBox, handle, dx, dy);
              return { ...a, x: r.x, y: r.y, w: r.w, h: r.h };
            }
            if (a.type === 'arrow' || a.type === 'line') {
              if (handle === 'start') return { ...a, x1: p.x, y1: p.y };
              return { ...a, x2: p.x, y2: p.y };
            }
            return scaleAnnotation(startAnn, startBBox, handle, dx, dy);
          }),
        );
        return;
      }
      const draft = draftRef.current;
      if (!draft) return;
      if (it.kind === 'pen' && (draft.type === 'pen' || draft.type === 'highlight')) {
        const last = draft.points[draft.points.length - 1];
        if (last && dist(last, p) < 1.5) return; // throttle pen samples
      }
      extendDraft(draft, p, e.shiftKey);
      c.setDraft(draft);
    },
    [applyAnnotations, movedGroupBox, snapshot],
  );

  const onDragUp = useCallback(() => {
    const c = controllerRef.current;
    const it = interactionRef.current;
    window.removeEventListener('mousemove', onDragMove);
    window.removeEventListener('mouseup', onDragUp);
    interactionRef.current = null;
    // Only a drag that snapshotted actually moved something — a plain
    // click-to-select goes through the 'move' interaction and changes nothing.
    const dragged = dragSnapshottedRef.current;
    dragSnapshottedRef.current = false;
    if (!c || !it) return;
    if (it.kind === 'crop') {
      const r = cropDraftRef.current;
      if (r && Math.abs(r.w) > 2 && Math.abs(r.h) > 2) {
        cropDraftRef.current = r;
        setCropDraft(r);
        setCropActive(true);
        c.setCropRect(r);
        say({ kind: 'crop', rect: r });
      } else {
        cropDraftRef.current = null;
        c.setCropRect(null);
      }
      return;
    }
    if (it.kind === 'crop-handle') {
      // The rect was already open before the grab, so there is nothing to
      // discard here: an adjustment that went nowhere leaves it as it was.
      const r = cropDraftRef.current;
      if (r) {
        setCropDraft(r);
        say({ kind: 'crop', rect: r });
      }
      return;
    }
    if (it.kind === 'cut') {
      const b = cutDraftRef.current ? normalizeBand(cutDraftRef.current) : null;
      cutDraftRef.current = null;
      c.setCutDraft(null);
      // A stray click pulls no band at all, and is discarded the way a stray
      // click with a shape tool is (shouldCommit).
      if (b && b.h > MIN_BAND) applyCutBand(b);
      return;
    }
    if (it.kind === 'marquee') {
      const r = c.marquee;
      c.setMarquee(null);
      // A press-and-release with no drag pulls no rect at all, so there is
      // nothing to catch — the mousedown already cleared the selection.
      if (!r) return;
      // Both sides in composed space, so what the marquee visibly crosses is
      // what it catches — and marks on rows a cut took are not there to catch.
      const caught = annotationsInRect(composedAnnotations(c, annotationsRef.current), r);
      const next = [...it.base.filter((id) => !caught.includes(id)), ...caught];
      selectAnnotations(next);
      sayAboutSelection(next);
      return;
    }
    if (it.kind === 'shape' || it.kind === 'pen') {
      const draft = draftRef.current;
      draftRef.current = null;
      c.setDraft(null);
      if (draft && shouldCommit(draft)) {
        commit((prev) => [...prev, draft]);
        say({ kind: 'add', annotation: draft });
      }
      return;
    }
    // move / resize: changes already applied during drag (one snapshot on first
    // move). Announcing per mousemove would be a stream of noise, so the live
    // region hears the result once, here.
    //
    // A drag can carry a mark onto rows a band already took, and it vanishes
    // as it crosses. It leaves the selection here rather than at the next
    // gesture, and that is what the region reports — the drag's own result is
    // the mark going out of the picture.
    if (dragged && (it.kind === 'move' || it.kind === 'resize' || it.kind === 'resize-group')) {
      const gone = pruneHiddenFromSelection();
      if (gone > 0) {
        say({ kind: 'hidden', count: gone, remaining: selectedIdsRef.current.length });
        return;
      }
    }
    if (dragged && it.kind === 'resize') {
      const resized = annotationsRef.current.find((a) => a.id === it.id);
      if (resized) say({ kind: 'resize', annotation: resized });
    }
    if (dragged && it.kind === 'resize-group') {
      say({ kind: 'resize-many', count: it.startAnns.length });
    }
    if (it.kind === 'move') {
      if (dragged) {
        const moved = annotationsRef.current.filter((a) => it.ids.includes(a.id));
        if (moved.length === 1) say({ kind: 'move', annotation: moved[0] });
        else if (moved.length > 1) say({ kind: 'move-many', count: moved.length });
      } else if (it.ids.length > 1) {
        // A click on a layer that is already in the selection holds the whole
        // selection down, so the drag that may follow moves all of it. When no
        // drag followed, the click was a plain click: it collapses onto the
        // layer it landed on, which is the only pointer way back to one layer.
        selectAnnotations([it.hit]);
        sayAboutSelection([it.hit]);
      }
    }
  }, [
    onDragMove,
    applyCutBand,
    commit,
    pruneHiddenFromSelection,
    say,
    selectAnnotations,
    sayAboutSelection,
  ]);

  /**
   * Drop a numbered badge at `p`. The pointer path and the keyboard path share
   * it. The number comes from renumberSteps over the committed list rather than
   * from a count taken here, so a held Enter cannot mint two badges with the
   * same number.
   */
  const addStep = useCallback(
    (p: { x: number; y: number }) => {
      const ann = createStepAnnotation(p, styleRef.current.color, 0, styleRef.current.fontSize);
      commit((prev) => renumberSteps([...prev, ann]));
      selectAnnotations([ann.id]);
      say({ kind: 'add', annotation: ann });
    },
    [commit, selectAnnotations, say],
  );

  const onCanvasMouseDown = useCallback(
    (e: MouseEvent) => {
      const c = controllerRef.current;
      if (!c || !c.image) return;
      const rect = c.canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      // Middle button or Space+left = pan.
      if (e.button === 1 || (e.button === 0 && spaceRef.current)) {
        e.preventDefault();
        interactionRef.current = { kind: 'pan', lastX: e.clientX, lastY: e.clientY };
        window.addEventListener('mousemove', onDragMove);
        window.addEventListener('mouseup', onDragUp);
        return;
      }
      if (e.button !== 0) return;
      const p = c.toImage(sx, sy);
      const t = toolRef.current;

      if (t === 'select') {
        const ids = selectedIdsRef.current;
        // Resize: handle hit on the selected annotation. The two branches
        // below are the two render() draws, keyed off the same two answers —
        // one mark in the picture carries its own handles, several share the
        // live group frame — so every handle that is painted is grabbable and
        // nothing is grabbable where none is painted.
        const drawn = c.drawnSelection(annotationsRef.current, ids);
        if (drawn.length === 1) {
          // handleAt yields null for the types that carry no handles, so the
          // annotation type needs no separate check here.
          const sel = drawn[0];
          const project = c.projectFor(sel);
          const h = project ? handleAt(sel, project, sx, sy) : null;
          if (h) {
            interactionRef.current = {
              kind: 'resize',
              id: sel.id,
              handle: h,
              startBBox: bbox(sel),
              startPt: p,
              startAnn: sel,
            };
            window.addEventListener('mousemove', onDragMove);
            window.addEventListener('mouseup', onDragUp);
            return;
          }
        }
        // Several in the picture: one set of handles on the frame around them,
        // and a drag on one scales every member inside that frame.
        const frame = c.liveGroupFrame(annotationsRef.current, ids);
        if (frame) {
          const h = handleAtRect(frame.box, frame.project, sx, sy);
          if (h) {
            interactionRef.current = {
              kind: 'resize-group',
              handle: h,
              startBBox: frame.box,
              startPt: p,
              startAnns: frame.members,
            };
            window.addEventListener('mousemove', onDragMove);
            window.addEventListener('mouseup', onDragUp);
            return;
          }
        }
        // Select + move: hit-test annotations topmost-first.
        const hit = hitTestAnnotation(c, annotationsRef.current, sx, sy);
        // Shift-click is a selection gesture, not a drag: it adds the layer
        // under the pointer, or takes it back out.
        if (e.shiftKey && hit) {
          const next = ids.includes(hit) ? ids.filter((id) => id !== hit) : [...ids, hit];
          selectAnnotations(next);
          sayAboutSelection(next);
          return;
        }
        if (hit) {
          // Clicking a layer that is already part of the selection moves the
          // whole selection; clicking any other layer selects that one alone.
          const next = ids.includes(hit) ? ids : [hit];
          if (next !== ids) {
            selectAnnotations(next);
            sayAboutSelection(next);
          }
          interactionRef.current = { kind: 'move', ids: next, hit, lastX: p.x, lastY: p.y };
          window.addEventListener('mousemove', onDragMove);
          window.addEventListener('mouseup', onDragUp);
          return;
        }
        // Empty space starts a marquee. Shift keeps what is already selected
        // and adds to it; without Shift the selection goes first, so a click
        // that catches nothing reads as "deselect", the way it always has.
        if (!e.shiftKey && ids.length > 0) {
          selectAnnotations([]);
          sayAboutSelection([]);
        }
        interactionRef.current = {
          kind: 'marquee',
          start: c.toComposedPoint(sx, sy),
          base: e.shiftKey ? ids : [],
        };
        window.addEventListener('mousemove', onDragMove);
        window.addEventListener('mouseup', onDragUp);
        return;
      }

      if (t === 'text') {
        startText(p);
        return;
      }
      if (t === 'step') {
        addStep(p);
        return;
      }
      if (t === 'eyedropper') {
        const hex = c.sampleAt(sx, sy);
        if (hex) setStyleColor(hex);
        selectTool(prevToolRef.current);
        return;
      }
      if (t === 'crop') {
        // A handle on the open rect is grabbed before a new rect is started,
        // so an adjustment does not throw away the crop it was adjusting.
        const open = cropDraftRef.current;
        if (open) {
          const grabbed = cropHandleAt(
            open,
            (x, y) => c.toScreenComposed(x, y),
            c.view.zoom,
            sx,
            sy,
          );
          if (grabbed) {
            cropHandleRef.current = grabbed;
            c.setCropHandle(grabbed);
            interactionRef.current = {
              kind: 'crop-handle',
              handle: grabbed,
              start: normalizeRect(open),
              startPt: c.toComposedPoint(sx, sy),
            };
            window.addEventListener('mousemove', onDragMove);
            window.addEventListener('mouseup', onDragUp);
            return;
          }
        }
        const cp = clampToImage(
          c.toComposedPoint(sx, sy),
          c.image.naturalWidth,
          c.composedImageHeight(),
        );
        cropDraftRef.current = { x: cp.x, y: cp.y, w: 0, h: 0 };
        c.setCropRect(cropDraftRef.current);
        interactionRef.current = { kind: 'crop', start: cp };
        window.addEventListener('mousemove', onDragMove);
        window.addEventListener('mouseup', onDragUp);
        return;
      }
      if (t === 'cut') {
        // A seam is where a band was removed, so clicking one is how a cut is
        // put back. It is hit-tested in composed space, at the same tolerance
        // an annotation is, converted from screen pixels so it stays a
        // fingertip's width at any zoom.
        const seam = bandAtSeam(
          bandsRef.current,
          c.toComposedPoint(sx, sy).y,
          SEAM_HIT_PX / c.view.zoom,
        );
        if (seam !== -1) {
          removeBand(seam);
          return;
        }
        const start = Math.min(Math.max(p.y, 0), c.image.naturalHeight);
        cutDraftRef.current = { y: start, h: 0 };
        c.setCutDraft(cutDraftRef.current);
        interactionRef.current = { kind: 'cut', start };
        window.addEventListener('mousemove', onDragMove);
        window.addEventListener('mouseup', onDragUp);
        return;
      }
      // Shape tool (rect / arrow / pen / highlight / blur / spotlight).
      const draft = createShapeDraft(
        t as ShapeTool,
        p,
        styleRef.current.color,
        styleRef.current.strokeWidth,
        { spotlightShape: spotlightShapeRef.current, blurMode: blurModeRef.current },
      );
      draftRef.current = draft;
      c.setDraft(draft);
      interactionRef.current = { kind: t === 'pen' || t === 'highlight' ? 'pen' : 'shape' };
      window.addEventListener('mousemove', onDragMove);
      window.addEventListener('mouseup', onDragUp);
    },
    [
      onDragMove,
      onDragUp,
      removeBand,
      setStyleColor,
      selectTool,
      selectAnnotations,
      sayAboutSelection,
      addStep,
    ],
  );

  // --- Text ---
  /**
   * A new text layer is already on the history stack (startText commits it), so
   * only a re-edit owes a snapshot. It is taken on the first keystroke, which
   * keeps an opened-and-closed overlay out of the undo stack entirely.
   */
  const textSnapshottedRef = useRef(true);

  function startText(p: { x: number; y: number }) {
    const ann = createTextAnnotation(p, styleRef.current.color, styleRef.current.fontSize);
    commit((prev) => [...prev, ann]);
    textSnapshottedRef.current = true;
    setTextEdit({ id: ann.id });
    say({ kind: 'add', annotation: ann });
  }

  // Double-click a committed text layer with the select tool to re-open it.
  const onCanvasDoubleClick = useCallback(
    (e: MouseEvent) => {
      const c = controllerRef.current;
      if (!c || !c.image || toolRef.current !== 'select') return;
      const rect = c.canvas.getBoundingClientRect();
      const hit = hitTestAnnotation(
        c,
        annotationsRef.current,
        e.clientX - rect.left,
        e.clientY - rect.top,
      );
      const a = hit ? annotationsRef.current.find((x) => x.id === hit) : null;
      if (!a || a.type !== 'text') return;
      selectAnnotations([a.id]);
      textSnapshottedRef.current = false;
      setTextEdit({ id: a.id });
    },
    [selectAnnotations],
  );

  const updateText = useCallback(
    (id: string, text: string) => {
      if (!textSnapshottedRef.current) {
        snapshot();
        textSnapshottedRef.current = true;
      }
      applyAnnotations((prev) =>
        prev.map((a) => {
          if (a.id !== id || a.type !== 'text') return a;
          const size = measureTextSize(text, a.fontSize);
          return { ...a, text, width: size.width, height: size.height };
        }),
      );
    },
    [applyAnnotations, snapshot],
  );

  const finishText = useCallback(
    (id: string) => {
      setTextEdit(null);
      applyAnnotations((prev) => {
        const a = prev.find((x) => x.id === id);
        if (a && a.type === 'text' && a.text.trim() === '') {
          return prev.filter((x) => x.id !== id);
        }
        return prev;
      });
    },
    [applyAnnotations],
  );

  // --- Crop ---
  const cancelCrop = useCallback(() => {
    // applyCrop and applyImport also come through here, and both say their own
    // piece afterwards, so this line never survives to be read in those cases.
    const had = cropDraftRef.current !== null;
    cropDraftRef.current = null;
    cropHandleRef.current = null;
    controllerRef.current?.setCropRect(null);
    setCropActive(false);
    setCropDraft(null);
    if (had) say({ kind: 'crop-cancelled' });
  }, [say]);

  const applyCrop = useCallback(() => {
    const c = controllerRef.current;
    const r = cropDraftRef.current;
    if (!c || !c.image || !r) {
      cancelCrop();
      return;
    }
    const n = normalizeRect(r);
    if (n.w < 1 || n.h < 1) {
      cancelCrop();
      return;
    }
    const { w, h } = cropSize(n);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const cx = canvas.getContext('2d');
    if (!cx) {
      cancelCrop();
      return;
    }
    // The timeline entry is taken here: after the last branch that can refuse
    // the crop, and before anything is filtered, translated or replaced. It
    // holds the annotations the crop is about to drop, the bands it is about
    // to bake in, the selection it is about to clear and the picture it is
    // about to replace — an entry taken any later could not put those back.
    applyHistory(trimHistoryImages([...pastRef.current, entry()], HISTORY_IMAGE_BUDGET_PX), []);
    // Crop rasterises from the picture as it is drawn, cuts closed up, so a
    // crop bakes every cut into the new image. The band list goes with the
    // capture it measured, and the crop rect is in that same composed space.
    const cut = bandsRef.current;
    cx.drawImage(c.composeImage(), n.x, n.y, n.w, n.h, 0, 0, canvas.width, canvas.height);
    const cropped = canvas.toDataURL('image/png');
    // The draft's coordinates now belong to this image, not to the stash.
    void setDraftImage(cropped);
    const img = new Image();
    img.onload = () => {
      c.setImage(img);
      setImageSize({ w: canvas.width, h: canvas.height });
    };
    // Written before the decode lands, so a second crop in the same breath
    // takes its entry against this picture rather than the one it replaced.
    imageRef.current = img;
    img.src = cropped;
    applyAnnotations((prev) => cropAnnotations(prev, n, cut));
    applyBands([]);
    selectAnnotations([]);
    cancelCrop();
    say({ kind: 'crop-applied', w, h });
  }, [applyAnnotations, applyBands, applyHistory, cancelCrop, entry, selectAnnotations, say]);

  // --- Keyboard on the canvas ---
  /**
   * Put the active tool's shape down without a pointer. A keyboard has no
   * equivalent of the drag a mouse user makes, so a placement is a starting
   * box: centred on what the viewport shows, sized to read the same on screen
   * at any zoom, and reshaped from there with Alt and an arrow.
   */
  const placeWithKeyboard = useCallback(() => {
    const c = controllerRef.current;
    if (!c || !c.image) return;
    const t = toolRef.current;
    // Select has nothing to place, and the eyedropper needs a pixel to aim at.
    if (t === 'select' || t === 'eyedropper') return;
    const iw = c.image.naturalWidth;
    const ih = c.image.naturalHeight;
    const rect = c.canvas.getBoundingClientRect();
    const centre = c.toImage(rect.width / 2, rect.height / 2);

    if (t === 'crop') {
      // The whole image. It is the one crop a keyboard user can start from
      // without aiming at a corner; the arrows trim it inwards from there.
      const r: Rect = { x: 0, y: 0, w: iw, h: c.composedImageHeight() };
      cropDraftRef.current = r;
      setCropDraft(r);
      setCropActive(true);
      c.setCropRect(r);
      say({ kind: 'crop', rect: r });
      return;
    }
    const box = placementRect(centre, PLACE_SIZE_PX / c.view.zoom, iw, ih);
    if (t === 'cut') {
      // A band as tall as any other placement, across the whole picture,
      // centred on what the viewport shows. The arrows move and trim it from
      // there and Enter takes it out, the way a crop is driven.
      const band: Band = { y: box.y, h: box.h };
      cutDraftRef.current = band;
      c.setCutDraft(band);
      say({ kind: 'cut', band });
      return;
    }
    if (t === 'text') {
      startText({ x: box.x, y: box.y });
      return;
    }
    if (t === 'step') {
      addStep({ x: box.x + box.w / 2, y: box.y + box.h / 2 });
      return;
    }
    const draft = createShapeDraft(
      t,
      { x: box.x, y: box.y },
      styleRef.current.color,
      styleRef.current.strokeWidth,
      { spotlightShape: spotlightShapeRef.current, blurMode: blurModeRef.current },
    );
    // One extension gives every shape tool its second point: the far corner of
    // a box, the end of an arrow, the second sample of a freehand stroke.
    extendDraft(draft, { x: box.x + box.w, y: box.y + box.h });
    commit((prev) => [...prev, draft]);
    selectAnnotations([draft.id]);
    say({ kind: 'add', annotation: draft });
  }, [addStep, commit, selectAnnotations, say]);

  /**
   * The canvas's own keydown. It is bound to the element rather than the
   * window, so the arrow keys stay with whatever holds focus — the toolbar
   * keeps its roving arrows and a slider keeps its own. Ctrl and Meta chords
   * fall through to the window handler untouched.
   */
  const onCanvasKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const c = controllerRef.current;
      if (!c || !c.image) return;
      const mode: CanvasMode = cropDraftRef.current
        ? 'crop'
        : cutDraftRef.current
          ? 'cut'
          : selectedIdsRef.current.length > 0
            ? 'selection'
            : 'idle';
      const intent = canvasIntent(e, mode);
      if (!intent) return;
      e.preventDefault();
      const iw = c.image.naturalWidth;
      const ih = c.image.naturalHeight;

      if (intent.kind === 'place') {
        placeWithKeyboard();
        return;
      }
      if (intent.kind === 'apply-crop') {
        applyCrop();
        return;
      }
      if (intent.kind === 'apply-cut') {
        applyCutDraft();
        return;
      }
      if (intent.kind === 'cut-move' || intent.kind === 'cut-resize') {
        const cur = cutDraftRef.current;
        if (!cur) return;
        // Held at the image edge and still announced: silence would read as
        // "the key did nothing", which is not what a clamp means.
        const next =
          intent.kind === 'cut-move'
            ? moveBandBy(cur, intent.dy, ih)
            : resizeBandBy(cur, intent.dy, ih);
        cutDraftRef.current = next;
        c.setCutDraft(next);
        say({ kind: 'cut', band: next });
        return;
      }
      if (intent.kind === 'cycle') {
        // The drawn layers only. A hidden mark named at coordinates no longer
        // in the picture, with the arrows then moving it, is the keyboard's
        // version of the invisible hit box. Its place in the paint order is
        // still read out against the whole document (sayAboutSelection), which
        // is where the layer actually sits.
        const next = cycleSelection(
          drawnAnnotations(c, annotationsRef.current),
          selectedIdsRef.current,
          intent.dir,
          intent.extend,
        );
        selectAnnotations(next);
        sayAboutSelection(next);
        return;
      }
      if (intent.kind === 'crop-handle') {
        const cur = cropDraftRef.current;
        if (!cur) return;
        const next = cycleCropHandle(cropHandleRef.current, intent.dir, cur, c.view.zoom);
        cropHandleRef.current = next;
        c.setCropHandle(next);
        say({ kind: 'crop-handle', handle: next, rect: cur });
        return;
      }
      if (intent.kind === 'crop-move' || intent.kind === 'crop-resize') {
        const cur = cropDraftRef.current;
        if (!cur) return;
        // A crop is held inside the composed picture, which is what it cuts
        // from — not inside the source rows a cut has already taken out.
        const ch = c.composedImageHeight();
        const next =
          intent.kind === 'crop-move'
            ? moveCropBy(cur, intent.dx, intent.dy, iw, ch)
            : resizeCropAt(
                cur,
                activeCropHandle(cropHandleRef.current, cur, c.view.zoom),
                intent.dx,
                intent.dy,
                iw,
                ch,
              );
        // A rect held at the image edge still gets announced: silence reads as
        // "the key did nothing", which is a different thing from "it clamped".
        cropDraftRef.current = next;
        setCropDraft(next);
        c.setCropRect(next);
        say({ kind: 'crop', rect: next });
        return;
      }
      // A mark a cut hides cannot be seen to move, so it leaves the selection
      // before the arrows act rather than being nudged where nobody can watch.
      // This press reports the selection it found; the next one moves what is
      // left. See pruneHiddenFromSelection for why the drop is at selection
      // time rather than at move time.
      const gone = pruneHiddenFromSelection();
      if (gone > 0) {
        say({ kind: 'hidden', count: gone, remaining: selectedIdsRef.current.length });
        return;
      }
      const list = annotationsRef.current;
      const ids = selectedIdsRef.current;
      // The marks in the picture, from the same answer render paints from.
      // Which of the two resize branches applies is the question of whether
      // one mark carries its own handles or several share a frame, and that
      // has to be decided the way the handles are drawn — not from the raw
      // selection, which agrees only for as long as a prune ran first.
      const touched = c.drawnSelection(list, ids);
      if (touched.length === 0) return;
      const moving = new Set(touched.map((a) => a.id));
      if (!keyNudgeRef.current) {
        snapshot();
        keyNudgeRef.current = true;
      }
      // A nudge gives every selected layer the same delta, so the selection
      // holds its arrangement. A resize drives the bottom-right corner: of the
      // one annotation when one is selected, and of the box around them all
      // when several are — the same corner the pointer's group handle drags.
      let next: Annotation[];
      let box: Rect | null;
      if (intent.kind === 'move') {
        next = list.map((x) =>
          moving.has(x.id) ? translateAnnotation(x, intent.dx, intent.dy) : x,
        );
        box = movedGroupBox(intent.dx, intent.dy);
      } else if (touched.length === 1) {
        next = list.map((x) =>
          x.id === touched[0].id ? resizeAnnotationBy(x, intent.dx, intent.dy) : x,
        );
        box = null;
      } else {
        // The frame on screen, from the one place that answers what it is. Its
        // members are `touched` — both come from drawnSelection — and a null
        // here would mean there is no frame to resize through, so nothing to
        // do.
        const frame = c.liveGroupFrame(list, ids);
        if (!frame) return;
        const resized = resizeSelectionBy(frame.members, intent.dx, intent.dy, frame.box);
        const scaled = new Map(resized.annotations.map((a) => [a.id, a]));
        next = list.map((x) => scaled.get(x.id) ?? x);
        box = resized.box;
      }
      // `box` is the box the next press resizes and the box the handles are
      // drawn on until then: the resized one, the carried one translated by a
      // move, and null for a lone resize, which carries none.
      applyAnnotations(next, box);
      if (touched.length === 1) {
        const one = next.find((x) => x.id === touched[0].id)!;
        say(
          intent.kind === 'move'
            ? { kind: 'move', annotation: one }
            : { kind: 'resize', annotation: one },
        );
      } else {
        say(
          intent.kind === 'move'
            ? { kind: 'move-many', count: touched.length }
            : { kind: 'resize-many', count: touched.length },
        );
      }
    },
    [
      applyAnnotations,
      applyCrop,
      applyCutDraft,
      movedGroupBox,
      placeWithKeyboard,
      pruneHiddenFromSelection,
      sayAboutSelection,
      selectAnnotations,
      say,
      snapshot,
    ],
  );

  /**
   * Debounced crash-safety net. It holds off while the restore bar is up: the
   * canvas is empty then, and saving would erase the draft being offered.
   * An empty list clears both keys — there is nothing to restore from zero
   * annotations, and the frame is already persisted in settings.
   */
  useEffect(() => {
    if (loading || !capture || draftPrompt || restoringRef.current) return;
    const timer = window.setTimeout(() => {
      if (annotations.length === 0 && bands.length === 0) {
        void clearDraft();
        void clearDraftImage();
        return;
      }
      void setDraft(makeDraft(capture.capturedAt, annotations, bands, frame));
    }, DRAFT_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [annotations, bands, frame, loading, capture, draftPrompt]);

  // A closing tab does not wait out the debounce. `beforeunload` is not used:
  // a storage write started there is not guaranteed to land.
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState !== 'hidden') return;
      if (loading || !capture || draftPrompt || restoringRef.current) return;
      if (annotationsRef.current.length === 0 && bandsRef.current.length === 0) return;
      void setDraft(
        makeDraft(capture.capturedAt, annotationsRef.current, bandsRef.current, frameRef.current),
      );
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [loading, capture, draftPrompt]);

  /**
   * Put a draft back. The image comes first when a crop stored one, so the
   * annotations land on the picture their coordinates were measured against.
   *
   * The canvas is still empty between clearing draftPrompt and the eventual
   * setAnnotations below — restoringRef holds the autosave and the visibility
   * flush off so neither one wipes the draft while it is mid-restore. It is
   * cleared in every terminal branch before that branch does anything else,
   * so the re-render it triggers already sees restoring as done.
   *
   * A stored draft image that fails to load, or a lookup that fails outright,
   * leaves the coordinate space of d.annotations unknown — the crop that made
   * that image is exactly what those coordinates were measured against, and
   * the canvas still shows the pre-crop capture. Applying them there would
   * misplace them, so those two branches refuse: no setAnnotations, a notice
   * for the user, and both draft keys cleared so the same broken restore
   * isn't offered again next reload.
   */
  const restoreDraft = useCallback(() => {
    const d = draftPrompt;
    if (!d) return;
    restoringRef.current = true;
    setDraftPrompt(null);
    setFrameState(draftFrame(d));
    applyHistory([], []);
    selectAnnotations([]);
    const refuse = () => {
      restoringRef.current = false;
      setStageNotice('Your saved edits could not be restored.');
      void clearDraft();
      void clearDraftImage();
    };
    // The band list is normalized against the image it was measured on, so a
    // stored draft cannot hand the geometry an unsorted or overlapping list.
    const land = (imgH: number) => {
      applyBands(normalizeBands(d.bands, imgH));
      applyAnnotations(d.annotations);
    };
    void getDraftImage()
      .then((dataUrl) => {
        if (!dataUrl) {
          restoringRef.current = false;
          // The capture's own height, not the controller's image, which is
          // still null if Restore is clicked before the decode lands — and a
          // height of zero would clamp every band away to nothing.
          land(capture?.height ?? 0);
          return;
        }
        const img = new Image();
        img.onload = () => {
          restoringRef.current = false;
          // The stored image is a crop of the capture, so the base stays what
          // it was: an undo that reaches it clears the draft image rather than
          // rewriting one that no longer describes the picture.
          imageRef.current = img;
          controllerRef.current?.setImage(img);
          setImageSize({ w: img.naturalWidth, h: img.naturalHeight });
          land(img.naturalHeight);
        };
        img.onerror = refuse;
        img.src = dataUrl;
      })
      .catch(refuse);
  }, [applyAnnotations, applyBands, applyHistory, selectAnnotations, capture, draftPrompt]);

  const discardDraft = useCallback(() => {
    setDraftPrompt(null);
    void clearDraft();
    void clearDraftImage();
  }, []);

  /**
   * Put an imported image on the canvas. Annotation coordinates belong to the
   * image they were drawn on, so the list, the history, and any open crop go
   * with the old one. The beautify frame stays: it is a preference, not part of
   * the document.
   */
  const applyImport = useCallback(
    (p: PendingImport) => {
      const c = controllerRef.current;
      if (!c) return;
      const width = p.img.naturalWidth;
      const height = p.img.naturalHeight;
      const cap: LastCapture = {
        dataUrl: p.dataUrl,
        width,
        height,
        mode: 'import',
        title: titleFromFilename(p.name),
        capturedAt: Date.now(),
      };
      // Stashed like a capture, so the popup's "Reopen last" and a page reload
      // both find it.
      void setLastCapture(cap);
      setCapture(cap);
      setImageSize({ w: width, h: height });
      // The old draft belongs to a document that no longer exists.
      setDraftPrompt(null);
      void clearDraft();
      void clearDraftImage();
      applyAnnotations([]);
      applyBands([]);
      applyHistory([], []);
      selectAnnotations([]);
      setTextEdit(null);
      cancelCrop();
      cancelCut();
      setError(null);
      setStageNotice(null);
      setPendingImport(null);
      imageRef.current = p.img;
      baseImageRef.current = p.img;
      c.setImage(p.img);
    },
    [applyAnnotations, applyBands, applyHistory, cancelCrop, cancelCut, selectAnnotations],
  );

  /** Read a dropped or pasted file, then import it — asking first if it would destroy work. */
  const importFromFile = useCallback(
    async (file: File) => {
      setStageNotice(null);
      let next: PendingImport;
      try {
        const { dataUrl, img } = await readImageFile(file);
        next = { name: file.name, dataUrl, img };
        const sizeError = importSizeError(img.naturalWidth, img.naturalHeight);
        if (sizeError) {
          setStageNotice(sizeError);
          return;
        }
      } catch {
        setStageNotice('Could not read that image.');
        return;
      }
      if (annotationsRef.current.length > 0) setPendingImport(next);
      else applyImport(next);
    },
    [applyImport],
  );

  // applyImport clears pendingImport itself, so this reads the value rather
  // than calling into it from inside a state updater.
  const confirmImport = useCallback(() => {
    if (pendingImport) applyImport(pendingImport);
  }, [pendingImport, applyImport]);

  const cancelImport = useCallback(() => setPendingImport(null), []);
  const dismissStageNotice = useCallback(() => setStageNotice(null), []);

  const defaultFilename = useCallback(() => {
    const tmpl = settings?.filenameTemplate ?? 'screenshot_{date}_{time}';
    return formatFilename(tmpl, {
      width: visibleSize?.w ?? 0,
      height: visibleSize?.h ?? 0,
      title: capture?.title,
      url: capture?.url,
    });
  }, [settings, visibleSize, capture]);

  const exportImage = useCallback(
    async (format: ImageFormat, quality: number, filenameBase: string, targetWidth?: number) => {
      const c = controllerRef.current;
      if (!c || !c.image) return;
      setExporting(true);
      try {
        const composed = c.composeFinal();
        const canvas =
          targetWidth && targetWidth !== composed.width
            ? resampleToWidth(composed, targetWidth)
            : composed;
        const dataUrl = canvasToDataUrl(canvas, format, quality);
        await downloadDataUrl(dataUrl, withExtension(filenameBase, format));
      } finally {
        setExporting(false);
      }
    },
    [],
  );

  // Copy the composed image (with annotations) to the clipboard as PNG —
  // the only ClipboardItem image type reliably supported across browsers.
  const copyImage = useCallback(async () => {
    const c = controllerRef.current;
    if (!c || !c.image) return;
    const canvas = c.composeFinal();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!blob) throw new Error('Could not encode PNG');
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
  }, []);

  const exportPdf = useCallback(async (opts: PdfOptions, filenameBase: string) => {
    const c = controllerRef.current;
    if (!c || !c.image) return;
    setExporting(true);
    setExportProgress(null);
    try {
      const canvas = c.composeFinal();
      // onProgress only ever fires from pdf.ts's multi-page loop — the one
      // stage in the whole export path with real, per-page work to report
      // (R-23a). Single-page/full-page PDFs and every image format stay
      // null here, which is what tells the dialog to show the indeterminate
      // spinner instead of a bar with nothing real to plot.
      await exportPdfFile(canvas, opts, `${filenameBase}.pdf`, (p) => setExportProgress(p));
    } finally {
      setExporting(false);
      setExportProgress(null);
    }
  }, []);

  // Screen position (relative to canvas) + display size for the text overlay.
  const textOverlayPos = useCallback(
    (id: string): TextOverlayPos | null => {
      const c = controllerRef.current;
      if (!c) return null;
      const a = annotations.find((x) => x.id === id);
      if (!a || a.type !== 'text') return null;
      const project = c.projectFor(a);
      if (!project) return null;
      const s = project(a.x, a.y);
      return {
        x: s.x,
        y: s.y,
        fontSize: a.fontSize * c.view.zoom,
        width: a.width * c.view.zoom,
        height: a.height * c.view.zoom,
      };
    },
    [annotations],
  );

  const c = controllerRef.current;
  const zoomPct = c ? Math.round(c.view.zoom * 100) : 100;
  /**
   * The annotation the style bar takes its field groups from: the sole
   * selection, or the topmost member of a selection that agrees on its type.
   * A selection of mixed types has no answer here — a rectangle and a text
   * layer do not share a set of controls — so it falls back to null and the
   * bar shows what the active tool would draw instead. Which values those
   * fields carry is a separate question, answered by the adoption effect
   * above.
   */
  const selectedAnnotation = (() => {
    const sel = annotations.filter((a) => selectedIds.includes(a.id));
    if (sel.length === 0) return null;
    const type = sel[0].type;
    return sel.every((a) => a.type === type) ? sel[sel.length - 1] : null;
  })();

  return {
    canvasRef,
    annotations,
    tool,
    setTool: selectTool,
    selectedIds,
    capture,
    imageSize: visibleSize,
    loading,
    error,
    retryLoad: loadCapture,
    dismissError,
    textEdit,
    cropActive,
    cropDraft,
    spaceHeld,
    zoomPct,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    hasSelection: selectedIds.length > 0,
    selectedAnnotation,
    style,
    recentColors,
    spotlightShape,
    setSpotlightShape,
    blurMode,
    setBlurMode,
    frame,
    setFrame,
    composedSize,
    setStyleColor,
    setStyleStrokeWidth,
    setStyleFontSize,
    zoomIn,
    zoomOut,
    fit,
    resetZoom,
    onCanvasMouseDown,
    onCanvasDoubleClick,
    onCanvasKeyDown,
    announcement,
    updateText,
    finishText,
    applyCrop,
    cancelCrop,
    textOverlayPos,
    undo,
    redo,
    deleteSelection,
    exportImage,
    exportPdf,
    copyImage,
    defaultFilename,
    exporting,
    exportProgress,
    settings,
    importFromFile,
    pendingImport,
    confirmImport,
    cancelImport,
    stageNotice,
    dismissStageNotice,
    draftPrompt,
    restoreDraft,
    discardDraft,
  };
}

/**
 * How near a seam a click counts as landing on it, in screen pixels. The same
 * reach the annotation hit test allows, so a seam and a thin layer are equally
 * easy to hit.
 */
const SEAM_HIT_PX = 6;

/**
 * Hit-test annotations topmost-first in screen space; returns an id or null.
 *
 * The box comes from the annotation's own projector: a mark is drawn rigidly,
 * and projecting its corners one row at a time through the cut map would leave
 * the box short and the drawn rows below it dead. A mark on rows a cut removed
 * has no projector and is skipped — it is not in the picture, so a click
 * cannot land on it.
 */
function hitTestAnnotation(
  c: CanvasController,
  anns: Annotation[],
  sx: number,
  sy: number,
): string | null {
  const tol = 6;
  for (let i = anns.length - 1; i >= 0; i--) {
    const project = c.projectFor(anns[i]);
    if (!project) continue;
    const b = bbox(anns[i]);
    const tl = project(b.x, b.y);
    const br = project(b.x + b.w, b.y + b.h);
    if (sx >= tl.x - tol && sx <= br.x + tol && sy >= tl.y - tol && sy <= br.y + tol) {
      return anns[i].id;
    }
  }
  return null;
}

/** The marks that are actually in the picture — everything a cut did not take. */
function drawnAnnotations(c: CanvasController, anns: Annotation[]): Annotation[] {
  return anns.filter((a) => c.annotationOffset(a) !== null);
}

/**
 * Those same marks, moved into composed space — where they are painted, and
 * where the marquee is dragged. Copies, so nothing in the document moves.
 */
function composedAnnotations(c: CanvasController, anns: Annotation[]): Annotation[] {
  const out: Annotation[] = [];
  for (const a of anns) {
    const dy = c.annotationOffset(a);
    if (dy === null) continue;
    out.push(dy === 0 ? a : translateAnnotation(a, 0, -dy));
  }
  return out;
}

/** Hold a point inside the image bounds — used to keep crop drags out of the beautify padding. */
function clampToImage(p: { x: number; y: number }, w: number, h: number): { x: number; y: number } {
  return { x: Math.min(Math.max(p.x, 0), w), y: Math.min(Math.max(p.y, 0), h) };
}

export function isTypingTarget(t: EventTarget | null): boolean {
  const el = t as HTMLElement | null;
  return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
}
