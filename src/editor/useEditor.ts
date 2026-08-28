/**
 * useEditor — the editor's state + interaction layer.
 *
 * Owns the CanvasController, the loaded capture, the annotation list, the active
 * tool, selection, and undo/redo history, plus all mouse/keyboard interactions
 * (drawing, selecting, moving, resizing, text, crop, pan/zoom). App.tsx is a
 * thin presentational consumer.
 *
 * History records annotation-list snapshots. Each mutating action snapshots the
 * pre-change list (one entry per action — a move/resize drag snapshots on first
 * motion, not per mousemove). Crop is destructive and clears history (the
 * pre-crop annotation coordinates are invalid for the cropped image).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { CanvasController } from './canvas';
import type { Annotation, Rect } from './annotations';
import {
  bbox,
  DEFAULT_STYLE,
  handleAt,
  hasStroke,
  measureTextSize,
  normalizeRect,
  resizeRect,
  scaleAnnotation,
  translateAnnotation,
  type AnnotationStyle,
  type BlurMode,
  type Handle,
  type SpotlightShape,
} from './annotations';
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
  cycleSelection,
  moveCropBy,
  placementRect,
  PLACE_SIZE_PX,
  resizeAnnotationBy,
  resizeCropBy,
  type CanvasMode,
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
import { draftFrame, DRAFT_DEBOUNCE_MS, makeDraft, parseDraft, type Draft } from './draft';
import { canvasToDataUrl, downloadDataUrl, withExtension, type ImageFormat } from './export';
import { importSizeError, readImageFile, titleFromFilename } from './import-image';
import { exportPdf as exportPdfFile, type PdfOptions } from './pdf';
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
  | { kind: 'shape' }
  | { kind: 'pen' }
  | { kind: 'move'; id: string; lastX: number; lastY: number }
  | {
      kind: 'resize';
      id: string;
      handle: Handle;
      startBBox: Rect;
      startPt: { x: number; y: number };
      /** The annotation at drag start, so scaling never compounds across moves. */
      startAnn: Annotation;
    }
  | null;

export function useEditor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const controllerRef = useRef<CanvasController | null>(null);

  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [tool, setTool] = useState<Tool>('select');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [past, setPast] = useState<Annotation[][]>([]);
  const [future, setFuture] = useState<Annotation[][]>([]);
  const [, setViewTick] = useState(0);
  const [capture, setCapture] = useState<LastCapture | null>(null);
  const [imageSize, setImageSize] = useState<{ w: number; h: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [textEdit, setTextEdit] = useState<{ id: string } | null>(null);
  const [cropActive, setCropActive] = useState(false);
  const [cropDraft, setCropDraft] = useState<Rect | null>(null);
  const [spaceHeld, setSpaceHeld] = useState(false);
  const [settings, setSettingsState] = useState<Settings | null>(null);
  const [exporting, setExporting] = useState(false);
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
  const annotationsRef = useRef(annotations);
  const selectedIdRef = useRef(selectedId);
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
   */

  /**
   * The one way the selection changes. The pointer path has a hit-test to name
   * the annotation; the keyboard has only the layer order, so selection has to
   * be settable from an id alone. That is also what un-disables the topbar's
   * Delete button for a keyboard user.
   */
  const selectAnnotation = useCallback((id: string | null) => {
    selectedIdRef.current = id;
    setSelectedId(id);
  }, []);

  /** The one way the annotation list changes. */
  const applyAnnotations = useCallback(
    (next: Annotation[] | ((prev: Annotation[]) => Annotation[])) => {
      const list = typeof next === 'function' ? next(annotationsRef.current) : next;
      annotationsRef.current = list;
      setAnnotations(list);
    },
    [],
  );

  useEffect(() => {
    spotlightShapeRef.current = spotlightShape;
  }, [spotlightShape]);

  useEffect(() => {
    blurModeRef.current = blurMode;
  }, [blurMode]);

  /** The one way the active tool changes. */
  const selectTool = useCallback((t: Tool) => {
    toolRef.current = t;
    setTool(t);
  }, []);

  // The eyedropper is a one-shot: it sets the colour for whatever you were
  // drawing with, then hands that tool back. Clearing the selection matters too
  // — a handle painted over the pixel would be sampled instead of the pixel.
  const prevToolRef = useRef<Tool>('select');
  useEffect(() => {
    if (tool === 'eyedropper') selectAnnotation(null);
    else prevToolRef.current = tool;
  }, [tool, selectAnnotation]);

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

  // The ref beside the selection is written by selectAnnotation, not here.
  useEffect(() => {
    controllerRef.current?.setSelected(selectedId);
  }, [selectedId]);

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

  // When a new annotation is selected, adopt its style in the style bar.
  useEffect(() => {
    const a = annotationsRef.current.find((x) => x.id === selectedId);
    if (!a) return;
    if (hasStroke(a)) {
      setStyle((s) => ({ ...s, color: a.stroke, strokeWidth: a.strokeWidth }));
    } else if (a.type === 'text') {
      setStyle((s) => ({ ...s, color: a.color, fontSize: a.fontSize }));
    } else if (a.type === 'step') {
      setStyle((s) => ({ ...s, color: a.color }));
    } else if (a.type === 'spotlight') {
      setSpotlightShapeState(a.shape);
    } else if (a.type === 'blur') {
      setBlurModeState(a.mode ?? 'blur');
    }
  }, [selectedId]);

  /** Put one mutation into the live region. The newest write is what gets read. */
  const say = useCallback((m: Mutation) => setAnnouncement(announce(m)), []);

  // --- History ---
  /** The one way the undo stacks change. */
  const applyHistory = useCallback((p: Annotation[][], f: Annotation[][]) => {
    pastRef.current = p;
    futureRef.current = f;
    setPast(p);
    setFuture(f);
  }, []);

  const commit = useCallback(
    (updater: (prev: Annotation[]) => Annotation[]) => {
      applyHistory([...pastRef.current, annotationsRef.current], []);
      applyAnnotations(updater);
    },
    [applyAnnotations, applyHistory],
  );

  const snapshot = useCallback(() => {
    applyHistory([...pastRef.current, annotationsRef.current], []);
  }, [applyHistory]);

  const undo = useCallback(() => {
    const past = pastRef.current;
    if (past.length === 0) return;
    const last = past[past.length - 1];
    applyHistory(past.slice(0, -1), [annotationsRef.current, ...futureRef.current]);
    applyAnnotations(last);
    selectAnnotation(null);
    say({ kind: 'undo', total: last.length });
  }, [applyAnnotations, applyHistory, selectAnnotation, say]);

  const redo = useCallback(() => {
    const future = futureRef.current;
    if (future.length === 0) return;
    const next = future[0];
    applyHistory([...pastRef.current, annotationsRef.current], future.slice(1));
    applyAnnotations(next);
    selectAnnotation(null);
    say({ kind: 'redo', total: next.length });
  }, [applyAnnotations, applyHistory, selectAnnotation, say]);

  const deleteSelection = useCallback(() => {
    const id = selectedIdRef.current;
    if (!id) return;
    const gone = annotationsRef.current.find((x) => x.id === id);
    commit((prev) => renumberSteps(prev.filter((x) => x.id !== id)));
    selectAnnotation(null);
    // commit lands the new list on annotationsRef before it returns, so this
    // count is what is left rather than what was there.
    if (gone) say({ kind: 'delete', type: gone.type, remaining: annotationsRef.current.length });
  }, [commit, selectAnnotation, say]);

  // --- Style (color / stroke width / font size) ---
  const applyStyleToSelected = useCallback(
    (patch: (a: Annotation) => Annotation) => {
      const id = selectedIdRef.current;
      if (!id) return;
      commit((prev) => prev.map((a) => (a.id === id ? patch(a) : a)));
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

  // Outer size of the export, so the export dialog can show what a scale yields.
  const composedSize = useMemo(() => {
    if (!imageSize) return null;
    const m = frameMetrics(frame, imageSize.w, imageSize.h);
    return { w: m.outerW, h: m.outerH };
  }, [frame, imageSize]);

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

  // Create the controller + load the stashed capture on mount.
  useEffect(() => {
    const canvas = canvasRef.current!;
    const c = new CanvasController(canvas);
    c.onViewChange = () => setViewTick((t) => t + 1);
    controllerRef.current = c;

    void (async () => {
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
      if (stored && stored.sourceCapturedAt === cap.capturedAt && stored.annotations.length > 0) {
        setDraftPrompt(stored);
      } else if (stored) {
        void clearDraft();
        void clearDraftImage();
      }
      const img = new Image();
      img.onload = () => {
        c.setImage(img);
        setLoading(false);
      };
      img.onerror = () => {
        setError('Could not load the screenshot.');
        setLoading(false);
      };
      img.src = cap.dataUrl;
    })();

    return () => {
      c.destroy();
      controllerRef.current = null;
    };
  }, []);

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

  const cropActiveRef = useRef(false);
  useEffect(() => {
    cropActiveRef.current = cropActive;
  }, [cropActive]);

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
      // Delete selected.
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIdRef.current) {
        e.preventDefault();
        deleteSelection();
        return;
      }
      // Escape: cancel crop, else deselect.
      if (e.key === 'Escape') {
        if (cropActiveRef.current) {
          cancelCrop();
          e.preventDefault();
        } else if (selectedIdRef.current) {
          selectAnnotation(null);
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
    zoomIn,
    zoomOut,
    resetZoom,
    fit,
    setStyleColor,
    selectTool,
    selectAnnotation,
  ]);

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
        // The frame's padding renders like part of the picture, so a drag that
        // strays into it must not smear transparent padding pixels into the
        // crop — hold the point to the image bounds.
        const cp = c.image ? clampToImage(p, c.image.naturalWidth, c.image.naturalHeight) : p;
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
      if (it.kind === 'move') {
        if (!dragSnapshottedRef.current) {
          snapshot();
          dragSnapshottedRef.current = true;
        }
        const dx = p.x - it.lastX;
        const dy = p.y - it.lastY;
        it.lastX = p.x;
        it.lastY = p.y;
        const id = it.id;
        applyAnnotations((prev) =>
          prev.map((a) => (a.id === id ? translateAnnotation(a, dx, dy) : a)),
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
    [applyAnnotations, snapshot],
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
    if (dragged && (it.kind === 'move' || it.kind === 'resize')) {
      const moved = annotationsRef.current.find((a) => a.id === it.id);
      if (moved) say({ kind: it.kind, annotation: moved });
    }
  }, [onDragMove, commit, say]);

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
      selectAnnotation(ann.id);
      say({ kind: 'add', annotation: ann });
    },
    [commit, selectAnnotation, say],
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
        // Resize: handle hit on the currently selected annotation.
        const selId = selectedIdRef.current;
        if (selId) {
          // handleAt yields null for the types that carry no handles, so the
          // annotation type needs no separate check here.
          const sel = annotationsRef.current.find((a) => a.id === selId) ?? null;
          const h = sel ? handleAt(sel, (x, y) => c.toScreen(x, y), sx, sy) : null;
          if (sel && h) {
            interactionRef.current = {
              kind: 'resize',
              id: selId,
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
        // Select + move: hit-test annotations topmost-first.
        const hit = hitTestAnnotation(c, annotationsRef.current, sx, sy);
        selectAnnotation(hit);
        if (hit) {
          interactionRef.current = { kind: 'move', id: hit, lastX: p.x, lastY: p.y };
          window.addEventListener('mousemove', onDragMove);
          window.addEventListener('mouseup', onDragUp);
        }
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
        const cp = clampToImage(p, c.image.naturalWidth, c.image.naturalHeight);
        cropDraftRef.current = { x: cp.x, y: cp.y, w: 0, h: 0 };
        c.setCropRect(cropDraftRef.current);
        interactionRef.current = { kind: 'crop', start: cp };
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
    [onDragMove, onDragUp, setStyleColor, selectTool, selectAnnotation, addStep],
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
      selectAnnotation(a.id);
      textSnapshottedRef.current = false;
      setTextEdit({ id: a.id });
    },
    [selectAnnotation],
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
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(n.w);
    canvas.height = Math.round(n.h);
    const cx = canvas.getContext('2d');
    if (!cx) {
      cancelCrop();
      return;
    }
    cx.drawImage(c.image, n.x, n.y, n.w, n.h, 0, 0, canvas.width, canvas.height);
    const cropped = canvas.toDataURL('image/png');
    // The draft's coordinates now belong to this image, not to the stash.
    void setDraftImage(cropped);
    const img = new Image();
    img.onload = () => {
      c.setImage(img);
      setImageSize({ w: canvas.width, h: canvas.height });
    };
    img.src = cropped;
    const w = canvas.width;
    const h = canvas.height;
    applyAnnotations((prev) =>
      renumberSteps(
        prev
          .map((a) => translateAnnotation(a, -n.x, -n.y))
          .filter((a) => {
            const b = bbox(a);
            return b.x < w && b.y < h && b.x + b.w > 0 && b.y + b.h > 0;
          }),
      ),
    );
    selectAnnotation(null);
    applyHistory([], []);
    cancelCrop();
    say({ kind: 'crop-applied', w, h });
  }, [applyAnnotations, applyHistory, cancelCrop, selectAnnotation, say]);

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
      const r: Rect = { x: 0, y: 0, w: iw, h: ih };
      cropDraftRef.current = r;
      setCropDraft(r);
      setCropActive(true);
      c.setCropRect(r);
      say({ kind: 'crop', rect: r });
      return;
    }
    const box = placementRect(centre, PLACE_SIZE_PX / c.view.zoom, iw, ih);
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
    selectAnnotation(draft.id);
    say({ kind: 'add', annotation: draft });
  }, [addStep, commit, selectAnnotation, say]);

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
        : selectedIdRef.current
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
      if (intent.kind === 'cycle') {
        const list = annotationsRef.current;
        const next = cycleSelection(list, selectedIdRef.current, intent.dir);
        const a = next ? (list.find((x) => x.id === next) ?? null) : null;
        selectAnnotation(next);
        say(
          a
            ? { kind: 'select', annotation: a, index: list.indexOf(a) + 1, total: list.length }
            : { kind: 'deselect' },
        );
        return;
      }
      if (intent.kind === 'crop-move' || intent.kind === 'crop-resize') {
        const cur = cropDraftRef.current;
        if (!cur) return;
        const next =
          intent.kind === 'crop-move'
            ? moveCropBy(cur, intent.dx, intent.dy, iw, ih)
            : resizeCropBy(cur, intent.dx, intent.dy, iw, ih);
        // The rect stops at the image edge; repeating the same size is noise.
        if (next.x === cur.x && next.y === cur.y && next.w === cur.w && next.h === cur.h) return;
        cropDraftRef.current = next;
        setCropDraft(next);
        c.setCropRect(next);
        say({ kind: 'crop', rect: next });
        return;
      }
      const list = annotationsRef.current;
      const id = selectedIdRef.current;
      const a = id ? list.find((x) => x.id === id) : null;
      if (!a) return;
      if (!keyNudgeRef.current) {
        snapshot();
        keyNudgeRef.current = true;
      }
      const moved =
        intent.kind === 'move'
          ? translateAnnotation(a, intent.dx, intent.dy)
          : resizeAnnotationBy(a, intent.dx, intent.dy);
      applyAnnotations(list.map((x) => (x.id === a.id ? moved : x)));
      say(
        intent.kind === 'move'
          ? { kind: 'move', annotation: moved }
          : { kind: 'resize', annotation: moved },
      );
    },
    [applyAnnotations, applyCrop, placeWithKeyboard, selectAnnotation, say, snapshot],
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
      if (annotations.length === 0) {
        void clearDraft();
        void clearDraftImage();
        return;
      }
      void setDraft(makeDraft(capture.capturedAt, annotations, frame));
    }, DRAFT_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [annotations, frame, loading, capture, draftPrompt]);

  // A closing tab does not wait out the debounce. `beforeunload` is not used:
  // a storage write started there is not guaranteed to land.
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState !== 'hidden') return;
      if (loading || !capture || draftPrompt || restoringRef.current) return;
      if (annotationsRef.current.length === 0) return;
      void setDraft(makeDraft(capture.capturedAt, annotationsRef.current, frameRef.current));
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
    selectAnnotation(null);
    const refuse = () => {
      restoringRef.current = false;
      setStageNotice('Your saved edits could not be restored.');
      void clearDraft();
      void clearDraftImage();
    };
    void getDraftImage()
      .then((dataUrl) => {
        if (!dataUrl) {
          restoringRef.current = false;
          applyAnnotations(d.annotations);
          return;
        }
        const img = new Image();
        img.onload = () => {
          restoringRef.current = false;
          controllerRef.current?.setImage(img);
          setImageSize({ w: img.naturalWidth, h: img.naturalHeight });
          applyAnnotations(d.annotations);
        };
        img.onerror = refuse;
        img.src = dataUrl;
      })
      .catch(refuse);
  }, [applyAnnotations, applyHistory, selectAnnotation, draftPrompt]);

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
      applyHistory([], []);
      selectAnnotation(null);
      setTextEdit(null);
      cancelCrop();
      setError(null);
      setStageNotice(null);
      setPendingImport(null);
      c.setImage(p.img);
    },
    [applyAnnotations, applyHistory, cancelCrop, selectAnnotation],
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
      width: imageSize?.w ?? 0,
      height: imageSize?.h ?? 0,
      title: capture?.title,
      url: capture?.url,
    });
  }, [settings, imageSize, capture]);

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
    try {
      const canvas = c.composeFinal();
      await exportPdfFile(canvas, opts, `${filenameBase}.pdf`);
    } finally {
      setExporting(false);
    }
  }, []);

  // Screen position (relative to canvas) + display size for the text overlay.
  const textOverlayPos = useCallback(
    (id: string): TextOverlayPos | null => {
      const c = controllerRef.current;
      if (!c) return null;
      const a = annotations.find((x) => x.id === id);
      if (!a || a.type !== 'text') return null;
      const s = c.toScreen(a.x, a.y);
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
  const selectedAnnotation = selectedId
    ? (annotations.find((a) => a.id === selectedId) ?? null)
    : null;

  return {
    canvasRef,
    annotations,
    tool,
    setTool: selectTool,
    selectedId,
    capture,
    imageSize,
    loading,
    error,
    textEdit,
    cropActive,
    cropDraft,
    spaceHeld,
    zoomPct,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    hasSelection: !!selectedId,
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

/** Hit-test annotations topmost-first in screen space; returns an id or null. */
function hitTestAnnotation(
  c: CanvasController,
  anns: Annotation[],
  sx: number,
  sy: number,
): string | null {
  const tol = 6;
  for (let i = anns.length - 1; i >= 0; i--) {
    const b = bbox(anns[i]);
    const tl = c.toScreen(b.x, b.y);
    const br = c.toScreen(b.x + b.w, b.y + b.h);
    if (sx >= tl.x - tol && sx <= br.x + tol && sy >= tl.y - tol && sy <= br.y + tol) {
      return anns[i].id;
    }
  }
  return null;
}

/** Hold a point inside the image bounds — used to keep crop drags out of the beautify padding. */
function clampToImage(p: { x: number; y: number }, w: number, h: number): { x: number; y: number } {
  return { x: Math.min(Math.max(p.x, 0), w), y: Math.min(Math.max(p.y, 0), h) };
}

export function isTypingTarget(t: EventTarget | null): boolean {
  const el = t as HTMLElement | null;
  return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
}
