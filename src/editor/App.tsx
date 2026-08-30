import { useEffect, useRef, useState } from 'preact/hooks';
import { isTypingTarget, useEditor } from './useEditor';
import { TOOL_DIVIDER_AFTER, TOOL_LIST, type Tool } from './tools';
import { IMAGE_FORMATS, type ImageFormat } from './export';
import { clampPdfMargin, MAX_PDF_MARGIN_MM, MIN_PDF_MARGIN_MM, type PdfOptions } from './pdf';
import { STROKE_WIDTHS, type BlurMode, type SpotlightShape } from './annotations';
import { COLOR_PALETTE, colorName, MAX_RECENT_COLORS } from './palette';
import { arrowNav, getFocusable, syncRovingTabIndex, trapFocus } from './focus';
import { pickImageFile } from './import-image';
import type { Draft } from './draft';
import { BrandMark } from '../shared/BrandMark';
import {
  IconAlert,
  IconArrow,
  IconBlur,
  IconCrop,
  IconCut,
  IconEyedropper,
  IconHighlight,
  IconHistory,
  IconImage,
  IconLayers,
  IconLine,
  IconPen,
  IconRectangle,
  IconRedo,
  IconSelect,
  IconSpotlight,
  IconStep,
  IconText,
  IconTrash,
  IconUndo,
} from '../shared/icons';
import { getSettings, setSettings } from '../shared/storage';
import { labelForSource } from './capture-label';
import { ZoomMenu } from './ZoomMenu';
import { BeautifyMenu } from './BeautifyMenu';
import { stylebarFields } from './stylebar';
import { ShortcutSheet } from './ShortcutSheet';
import { HistorySheet } from './HistorySheet';
import { hasScreenPicker, openScreenPicker } from './eyedropper';
import {
  clampTargetWidth,
  exportWidthCeiling,
  minExportWidth,
  scaledHeight,
  SCALE_PRESETS,
} from './scale';
import { DUR_MID, useExitDelay, useFrozenWhileClosing } from './transition';

type DialogFormat = ImageFormat | 'pdf';

export function App() {
  const ed = useEditor();
  const [exportOpen, setExportOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  // The popup's History footer link opens the editor with ?history=1 (see
  // openHistory() in popup/App.tsx) — read once, at mount, same as the
  // recorder page reads its own ?session= param.
  const [historyOpen, setHistoryOpen] = useState(() =>
    new URLSearchParams(window.location.search).has('history'),
  );
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const [dragOver, setDragOver] = useState(false);
  const toolbarRef = useRef<HTMLElement>(null);
  // Echoes stageNoticeT.mounted for draftPromptT to gate on, one render
  // behind — see the coordination comment below for why the delay is
  // harmless. A plain ref write here would not be: nothing forces the
  // extra render that picks the new value up, so draftPromptT could stay
  // gated indefinitely once stage-notice actually unmounts, waiting on
  // some unrelated future render to happen to notice. Routing the echo
  // through state + an effect below guarantees that render happens on its
  // own, from this change alone.
  const [stageNoticeMountedEcho, setStageNoticeMountedEcho] = useState(false);

  // Each modal/notice stays mounted for its own exit transition — see
  // transition.ts. `active` mirrors the render condition each one used
  // before this task (exportOpen also needed ed.capture; pendingImport and
  // stageNotice are ed's own state, not local booleans).
  const exportT = useExitDelay(exportOpen && !!ed.capture, DUR_MID);
  const sheetT = useExitDelay(sheetOpen, DUR_MID);
  const historyT = useExitDelay(historyOpen, DUR_MID);
  const importT = useExitDelay(!!ed.pendingImport, DUR_MID);
  // draft-restore, stage-notice and crop-confirm all share the same pill
  // position (top: s-3, centred), so each waits for the others to be fully
  // gone (mounted, not just the ed state that names them) before it starts
  // — without that, they stack at identical coordinates for 150ms whenever
  // one becomes true within a window of another's exit. Gating both hooks
  // on each other's live `.mounted` is circular within one render, so
  // draftPromptT reads the echo above (one render behind, made safe by the
  // effect that drives it) while stageNoticeT reads draftPromptT.mounted
  // directly, computed earlier this same render.
  //
  // The two directions are NOT symmetric, on purpose. A stage notice can
  // mean "your drag-and-drop image failed to import" — a real error, not
  // just informational — so it must win immediately over a draft prompt
  // that is still actively pending (ed.draftPrompt truthy): forcing it to
  // wait behind an unrelated pill the user has not even acted on yet would
  // silently swallow the error with no visual and no role="status"
  // announcement until the user happened to deal with the other pill. The
  // one case still worth a short wait is restoreDraft's own failure path:
  // it clears draftPrompt immediately and sets a stage notice moments
  // later (once getDraftImage's promise settles), so by the time the
  // notice arrives the draft pill is not "pending" any more, only still
  // visually finishing its own exit — waiting the ~150ms for that specific
  // pill to clear avoids a jarring overlap for a message that is itself
  // about to disappear anyway. `draftPromptT.mounted && !ed.draftPrompt`
  // is exactly that case: mounted only for its exit tail, not because a
  // prompt is still live.
  const draftPromptT = useExitDelay(
    !!ed.draftPrompt && !stageNoticeMountedEcho && !ed.cropActive,
    DUR_MID,
  );
  const stageNoticeT = useExitDelay(
    !!ed.stageNotice && !(draftPromptT.mounted && !ed.draftPrompt) && !ed.cropActive,
    DUR_MID,
  );
  useEffect(() => {
    setStageNoticeMountedEcho(stageNoticeT.mounted);
  }, [stageNoticeT.mounted]);
  const cropConfirmT = useExitDelay(ed.cropActive && !stageNoticeT.mounted, DUR_MID);
  // ed.pendingImport/ed.stageNotice/ed.draftPrompt null out the moment
  // confirm/cancel/dismiss/restore fires — the same tick the exit transition
  // above starts — so the closing frame needs its own frozen copy of the
  // text rather than reading ed live.
  const stageNoticeText = useFrozenWhileClosing(ed.stageNotice, !!ed.stageNotice);
  const pendingImportSnapshot = useFrozenWhileClosing(
    ed.pendingImport ? { name: ed.pendingImport.name, count: ed.annotations.length } : null,
    !!ed.pendingImport,
  );
  // What the draft holds, in words, so a draft of nothing but cuts does not
  // offer itself back as "0 annotations".
  const draftPromptSummary = useFrozenWhileClosing(
    ed.draftPrompt ? draftSummary(ed.draftPrompt) : '',
    !!ed.draftPrompt,
  );

  // TOOL_LIST is fixed, so the tool rail's members never change: one sync at
  // mount is enough to seed the roving tabindex (member 0 starts as the tab
  // stop). The focusin handler on the toolbar keeps it in sync after that.
  useEffect(() => {
    if (toolbarRef.current) syncRovingTabIndex(toolbarRef.current);
  }, []);

  function copyToClipboard() {
    ed.copyImage()
      .then(() => setCopyState('copied'))
      .catch(() => setCopyState('failed'))
      .finally(() => setTimeout(() => setCopyState('idle'), 1500));
  }

  // Cmd/Ctrl+C copies the composed image, unless the user is typing or has
  // text selected (native copy wins there).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.key !== 'c') return;
      if (isTypingTarget(e.target) || window.getSelection()?.toString()) return;
      e.preventDefault();
      copyToClipboard();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [ed.copyImage]);

  // ⌘S opens Export; ? toggles the shortcut sheet.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;
      if ((e.metaKey || e.ctrlKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        if (ed.capture) setExportOpen(true);
        return;
      }
      if (e.key === '?') {
        e.preventDefault();
        setSheetOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [ed.capture]);

  // Without this, a file dropped anywhere but the stage navigates this tab to it.
  useEffect(() => {
    const stop = (e: DragEvent) => e.preventDefault();
    window.addEventListener('dragover', stop);
    window.addEventListener('drop', stop);
    return () => {
      window.removeEventListener('dragover', stop);
      window.removeEventListener('drop', stop);
    };
  }, []);

  // Paste an image to open it. Text fields keep their own paste.
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      if (isTypingTarget(e.target)) return;
      const file = pickImageFile(Array.from(e.clipboardData?.files ?? []));
      if (!file) return;
      e.preventDefault();
      void ed.importFromFile(file);
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [ed.importFromFile]);

  const cursor = ed.spaceHeld
    ? 'grab'
    : ed.tool === 'text'
      ? 'text'
      : ed.tool === 'select'
        ? 'default'
        : 'crosshair';

  return (
    <div class="editor">
      <header class="topbar">
        <div class="topbar-brand">
          <span class="brand-mark" aria-hidden="true">
            <BrandMark size={22} />
          </span>
          <span class="brand-name">OpenScreenShot</span>
          {ed.capture ? <span class="brand-mode">{labelForSource(ed.capture.mode)}</span> : null}
        </div>
        <div class="topbar-actions" role="group" aria-label="Document actions">
          <button
            class="icon-btn"
            title="Undo (⌘Z)"
            disabled={!ed.canUndo}
            onClick={ed.undo}
            aria-label="Undo"
          >
            <IconUndo />
          </button>
          <button
            class="icon-btn"
            title="Redo (⌘⇧Z)"
            disabled={!ed.canRedo}
            onClick={ed.redo}
            aria-label="Redo"
          >
            <IconRedo />
          </button>
          <button
            class="icon-btn icon-btn-danger"
            title="Delete selected (⌫)"
            disabled={!ed.hasSelection}
            onClick={ed.deleteSelection}
            aria-label="Delete selected"
          >
            <IconTrash />
          </button>
        </div>
        <div class="topbar-controls">
          <button
            class="icon-btn"
            title="Capture history"
            aria-label="Capture history"
            onClick={() => setHistoryOpen(true)}
          >
            <IconHistory size={16} />
          </button>
          <button
            class="icon-btn"
            title="Keyboard shortcuts (?)"
            aria-label="Keyboard shortcuts"
            onClick={() => setSheetOpen(true)}
          >
            ?
          </button>
          <ZoomMenu
            zoomPct={ed.zoomPct}
            disabled={!ed.capture}
            onZoomIn={ed.zoomIn}
            onZoomOut={ed.zoomOut}
            onFit={ed.fit}
            onActualSize={ed.resetZoom}
          />
          <BeautifyMenu
            frame={ed.frame}
            disabled={!ed.capture}
            imageSize={ed.imageSize}
            onChange={ed.setFrame}
          />
          <button
            class="btn-primary btn-fixed"
            title="Copy to clipboard as PNG (⌘C)"
            disabled={!ed.capture}
            onClick={copyToClipboard}
          >
            {copyState === 'copied' ? 'Copied' : copyState === 'failed' ? 'Failed' : 'Copy'}
          </button>
          <button
            class="btn-secondary"
            title="Export (⌘S)"
            disabled={!ed.capture}
            onClick={() => setExportOpen(true)}
          >
            Export
          </button>
        </div>
      </header>

      <StyleBar ed={ed} />

      <div class="workspace">
        <aside
          class="toolbar"
          role="toolbar"
          aria-orientation="vertical"
          aria-label="Annotation tools"
          ref={toolbarRef}
          onKeyDown={(e) => arrowNav(e.currentTarget as HTMLElement, e)}
          onFocusIn={(e) =>
            syncRovingTabIndex(e.currentTarget as HTMLElement, e.target as HTMLElement)
          }
        >
          {TOOL_LIST.map((t) => (
            <>
              <button
                key={t.id}
                class={`tool-btn${ed.tool === t.id ? ' is-active' : ''}`}
                title={`${t.label} (${t.shortcut})`}
                aria-pressed={ed.tool === t.id}
                onClick={() => ed.setTool(t.id)}
              >
                <ToolIcon id={t.id} />
              </button>
              {TOOL_DIVIDER_AFTER.has(t.id) ? (
                <div class="toolbar-divider" role="separator" aria-orientation="horizontal" />
              ) : null}
            </>
          ))}

          {ed.annotations.length > 0 ? (
            <div
              class="toolbar-count"
              title={`${ed.annotations.length} annotation${ed.annotations.length === 1 ? '' : 's'}`}
            >
              <IconLayers size={14} />
              <span>{ed.annotations.length}</span>
            </div>
          ) : null}
        </aside>

        <div
          class="stage"
          data-dropping={dragOver ? 'true' : undefined}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const file = pickImageFile(Array.from(e.dataTransfer?.files ?? []));
            if (file) void ed.importFromFile(file);
          }}
        >
          {/*
            role="application" so a screen reader hands the arrow keys straight
            to the canvas instead of using them to read the page. tabindex puts
            it in the normal tab order and nothing here claims Tab, so focus
            leaves again the way it arrived.
          */}
          <canvas
            ref={ed.canvasRef}
            class="stage-canvas"
            data-cursor={cursor}
            role="application"
            tabIndex={0}
            aria-label={
              ed.imageSize
                ? `Screenshot canvas, ${ed.imageSize.w} by ${ed.imageSize.h} pixels`
                : 'Screenshot canvas, empty'
            }
            onMouseDown={ed.onCanvasMouseDown}
            onDblClick={ed.onCanvasDoubleClick}
            onKeyDown={ed.onCanvasKeyDown}
          >
            <p>
              {ed.imageSize
                ? `The captured screenshot, ${ed.imageSize.w} by ${ed.imageSize.h} pixels, with ${ed.annotations.length} annotation${ed.annotations.length === 1 ? '' : 's'} drawn on it.`
                : 'No screenshot is open.'}{' '}
              Press the right bracket to select the next annotation and the left bracket for the
              previous one. Hold Shift with either bracket to add that annotation to the selection
              instead of replacing it. Press Enter to place the tool you picked in the toolbar. Use
              the arrow keys to move the selection by one pixel, Shift and an arrow to move it by
              ten, and Alt and an arrow to resize it. Press Alt and D to duplicate the selection.
              With a crop open, the arrow keys move it, the brackets pick one of its eight handles,
              Alt and an arrow resize it from that handle, Enter applies it and Escape cancels it.
              With the Cut tool, Enter starts a band across the picture, the up and down arrows move
              it, Alt and an arrow resize it, Enter takes it out and Escape cancels it. Press Delete
              with the Cut tool to put back the nearest cut.
            </p>
          </canvas>

          {stageNoticeT.mounted ? (
            <div
              class={`stage-notice${stageNoticeT.closing ? ' is-closing' : ''}`}
              role="status"
              inert={stageNoticeT.closing}
            >
              <span>{stageNoticeText}</span>
              <button class="text-btn" onClick={ed.dismissStageNotice}>
                Dismiss
              </button>
            </div>
          ) : null}

          {draftPromptT.mounted ? (
            <div
              class={`draft-restore${draftPromptT.closing ? ' is-closing' : ''}`}
              role="status"
              inert={draftPromptT.closing}
            >
              <span>Unsaved edits from your last session ({draftPromptSummary}).</span>
              <button class="btn-primary btn-sm" onClick={ed.restoreDraft}>
                Restore
              </button>
              <button class="text-btn" onClick={ed.discardDraft}>
                Discard
              </button>
            </div>
          ) : null}

          {cropConfirmT.mounted ? (
            <div
              class={`crop-confirm${cropConfirmT.closing ? ' is-closing' : ''}`}
              inert={cropConfirmT.closing}
            >
              <span>Crop to selection</span>
              <button class="btn-primary btn-sm" onClick={ed.applyCrop}>
                Apply
              </button>
              <button class="text-btn" onClick={ed.cancelCrop}>
                Cancel
              </button>
            </div>
          ) : null}

          {ed.textEdit ? <TextOverlay ed={ed} /> : null}

          {ed.loading ? (
            <div class="overlay-msg">
              <span class="spinner" aria-label="Loading" />
              <span>Loading screenshot…</span>
            </div>
          ) : null}
          {!ed.loading && !ed.capture && !ed.error ? <EmptyState /> : null}
          {ed.error ? (
            <div class="overlay-msg" role="alert">
              <div class="empty">
                <div class="empty-icon empty-icon-error" aria-hidden="true">
                  <IconAlert size={40} />
                </div>
                <h2>Something went wrong</h2>
                <p>{ed.error}</p>
                <div class="empty-actions">
                  <button class="btn-primary" onClick={ed.retryLoad}>
                    Retry
                  </button>
                  <button class="text-btn" onClick={ed.dismissError}>
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <footer class="statusbar">
        <span>{ed.imageSize ? `${ed.imageSize.w} × ${ed.imageSize.h}px` : '—'}</span>
        <span class="status-spacer" />
        <span class="status-hint">{hintForTool(ed.tool)}</span>
      </footer>

      {/*
        Mounted for the life of the page and never rewrapped, so every change to
        ed.announcement is a text edit inside a region that is already being
        watched. A region created in the same frame as its message is not.
      */}
      <div class="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {ed.announcement}
      </div>

      {exportT.mounted ? (
        <ExportDialog ed={ed} onClose={() => setExportOpen(false)} closing={exportT.closing} />
      ) : null}
      {sheetT.mounted ? (
        <ShortcutSheet onClose={() => setSheetOpen(false)} closing={sheetT.closing} />
      ) : null}
      {historyT.mounted ? (
        <HistorySheet
          onOpen={(entry) => {
            setHistoryOpen(false);
            void ed.openHistoryEntry(entry);
          }}
          onClose={() => setHistoryOpen(false)}
          closing={historyT.closing}
        />
      ) : null}
      {importT.mounted && pendingImportSnapshot ? (
        <ImportConfirm
          name={pendingImportSnapshot.name}
          count={pendingImportSnapshot.count}
          onConfirm={ed.confirmImport}
          onCancel={ed.cancelImport}
          closing={importT.closing}
        />
      ) : null}
    </div>
  );
}

function StyleBar({ ed }: { ed: ReturnType<typeof useEditor> }) {
  // Chrome 95+. Feature-detected once: the answer cannot change while the page lives.
  const [canPickScreen] = useState(() => hasScreenPicker(window));
  const sel = ed.selectedAnnotation;
  const fields = stylebarFields(ed.tool, sel?.type ?? null);
  const barRef = useRef<HTMLDivElement>(null);

  // Unlike the tool rail, this toolbar's membership changes: switching tools
  // swaps which field group renders, and recentColors grows. Re-sync after
  // every render that can change it, so the tab stop never lands on a member
  // that just unmounted.
  useEffect(() => {
    if (barRef.current) syncRovingTabIndex(barRef.current);
  }, [
    fields.color,
    fields.stroke,
    fields.shape,
    fields.redaction,
    fields.fontSize,
    ed.recentColors.length,
  ]);

  function pickFromScreen() {
    void openScreenPicker(window).then((hex) => {
      if (hex) ed.setStyleColor(hex);
    });
  }

  // Select and Crop carry no fields (stylebar.ts), so this renders an empty
  // toolbar for them rather than unmounting: .stylebar's min-height (see
  // editor.css) is what actually stops the canvas moving on a tool swap —
  // this is what keeps that promise true regardless of which fields apply.
  return (
    <div
      class="stylebar"
      role="toolbar"
      aria-orientation="horizontal"
      aria-label="Annotation style"
      ref={barRef}
      onKeyDown={(e) => arrowNav(e.currentTarget as HTMLElement, e)}
      onFocusIn={(e) => syncRovingTabIndex(e.currentTarget as HTMLElement, e.target as HTMLElement)}
    >
      {fields.color ? (
        <div class="stylebar-group">
          <span class="stylebar-label">Color</span>
          <div class="swatches">
            {COLOR_PALETTE.map((c) => (
              <button
                key={c}
                class="swatch"
                style={{ backgroundColor: c }}
                data-light={isLight(c) ? '1' : undefined}
                aria-label={colorName(c)}
                aria-pressed={ed.style.color === c}
                onClick={() => ed.setStyleColor(c)}
              />
            ))}
            {ed.recentColors.map((c) => (
              <button
                key={c}
                class="swatch"
                style={{ backgroundColor: c }}
                data-light={isLight(c) ? '1' : undefined}
                aria-label={colorName(c)}
                aria-pressed={ed.style.color === c}
                onClick={() => ed.setStyleColor(c)}
              />
            ))}
            {/*
              Reserves room for the recent colours this session hasn't picked
              yet, so the group's width is set by MAX_RECENT_COLORS, not by
              ed.recentColors.length — the one thing in the style bar that
              grows over a session. Without this, each new recent colour
              nudges every group after Color to the right, the same reflow
              class of bug .btn-fixed exists to stop (editor.css).
            */}
            {Array.from({ length: MAX_RECENT_COLORS - ed.recentColors.length }, (_, i) => (
              <span key={`recent-empty-${i}`} class="swatch swatch-empty" aria-hidden="true" />
            ))}
            <label class="swatch swatch-custom" title="Custom color">
              <input
                type="color"
                aria-label="Custom color"
                value={ed.style.color}
                onChange={(e) => ed.setStyleColor((e.target as HTMLInputElement).value)}
              />
            </label>
            {canPickScreen ? (
              <button
                class="swatch swatch-screen"
                title="Pick a color from anywhere on screen"
                aria-label="Pick a color from anywhere on screen"
                onClick={pickFromScreen}
              >
                <IconEyedropper size={11} />
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
      {fields.stroke ? (
        <div class="stylebar-group">
          <span class="stylebar-label">Stroke</span>
          <div class="widths">
            {STROKE_WIDTHS.map((w) => (
              <button
                key={w}
                class="width-btn"
                aria-label={`${w}px`}
                aria-pressed={ed.style.strokeWidth === w}
                onClick={() => ed.setStyleStrokeWidth(w)}
              >
                <span class="width-bar" style={{ height: `${Math.min(w, 8)}px` }} />
              </button>
            ))}
          </div>
        </div>
      ) : null}
      {fields.shape ? (
        <div class="stylebar-group">
          <span class="stylebar-label">Shape</span>
          <div class="segmented">
            {SPOTLIGHT_SHAPES.map((s) => (
              <button
                key={s.id}
                class={`segmented-btn${ed.spotlightShape === s.id ? ' is-selected' : ''}`}
                aria-pressed={ed.spotlightShape === s.id}
                onClick={() => ed.setSpotlightShape(s.id)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      {fields.redaction ? (
        <div class="stylebar-group">
          <span class="stylebar-label">Redaction</span>
          <div class="segmented">
            {BLUR_MODES.map((m) => (
              <button
                key={m.id}
                class={`segmented-btn${ed.blurMode === m.id ? ' is-selected' : ''}`}
                title={m.hint}
                aria-pressed={ed.blurMode === m.id}
                onClick={() => ed.setBlurMode(m.id)}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      {fields.fontSize ? (
        <div class="stylebar-group">
          <span class="stylebar-label">Size · {ed.style.fontSize}px</span>
          <input
            class="range stylebar-range"
            type="range"
            min="12"
            max="96"
            step="2"
            aria-label="Size"
            value={ed.style.fontSize}
            onInput={(e) => ed.setStyleFontSize(Number((e.target as HTMLInputElement).value))}
          />
        </div>
      ) : null}
    </div>
  );
}

const BLUR_MODES: { id: BlurMode; label: string; hint: string }[] = [
  { id: 'blur', label: 'Blur', hint: 'Soft pixelation' },
  { id: 'mosaic', label: 'Mosaic', hint: 'Coarse blocks — survives recompression' },
  { id: 'solid', label: 'Solid', hint: 'Opaque fill — nothing survives' },
];

const SPOTLIGHT_SHAPES: { id: SpotlightShape; label: string }[] = [
  { id: 'rect', label: 'Rectangle' },
  { id: 'rounded', label: 'Rounded' },
  { id: 'ellipse', label: 'Ellipse' },
];

function isLight(hex: string): boolean {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) return false;
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return 0.299 * r + 0.587 * g + 0.114 * b > 200;
}

function ExportDialog({
  ed,
  onClose,
  closing,
}: {
  ed: ReturnType<typeof useEditor>;
  onClose: () => void;
  closing: boolean;
}) {
  const df = ed.settings?.defaultFormat ?? 'png';
  const initialFormat: DialogFormat =
    df === 'pdf' || df === 'png' || df === 'jpeg' || df === 'webp' ? df : 'png';
  const [format, setFormat] = useState<DialogFormat>(initialFormat);
  const [quality, setQuality] = useState(ed.settings?.quality ?? 0.92);
  // Scale is per-export intent: it starts at 100% every time the dialog opens
  // and stays out of "Remember these settings".
  const [targetWidth, setTargetWidth] = useState<number | null>(null);
  // What the Width field displays while the user is typing. null means "follow
  // the derived outW" — set on preset clicks and on commit (blur), so the field
  // never shows stale typed text once a value lands.
  const [widthText, setWidthText] = useState<string | null>(null);
  // Set only when a commit (blur) actually rewrote the typed value — cleared
  // on the next keystroke, so it never outlives the field it explains.
  const [widthNotice, setWidthNotice] = useState<string | null>(null);
  const [filenameBase, setFilenameBase] = useState(ed.defaultFilename());

  const [pdfPageSize, setPdfPageSize] = useState<'a4' | 'letter' | 'full'>(
    ed.settings?.pdfPageSize ?? 'a4',
  );
  const [pdfOrientation, setPdfOrientation] = useState<'portrait' | 'landscape'>(
    ed.settings?.pdfOrientation ?? 'portrait',
  );
  const [pdfMultiPage, setPdfMultiPage] = useState(ed.settings?.pdfMultiPage ?? true);
  const [pdfMargin, setPdfMargin] = useState(ed.settings?.pdfMarginMm ?? 8);
  // Same raw-text-then-commit split as widthText/widthNotice above.
  const [marginText, setMarginText] = useState<string | null>(null);
  const [marginNotice, setMarginNotice] = useState<string | null>(null);
  const [remember, setRemember] = useState(false);
  const [busy, setBusy] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  // ed.settings is loaded once at editor mount and never refreshes, so a
  // previous export's "Remember these settings" write is invisible to the
  // initial state above. Re-read from storage so a dialog reopened later in
  // the same tab reflects what was actually persisted.
  useEffect(() => {
    let cancelled = false;
    getSettings()
      .then((s) => {
        if (cancelled) return;
        const fmt = s.defaultFormat;
        if (fmt === 'pdf' || fmt === 'png' || fmt === 'jpeg' || fmt === 'webp') setFormat(fmt);
        setQuality(s.quality);
        setPdfPageSize(s.pdfPageSize);
        setPdfOrientation(s.pdfOrientation);
        setPdfMultiPage(s.pdfMultiPage);
        setPdfMargin(s.pdfMarginMm);
      })
      // Same rationale as the swallowed catch in doExport below: the dialog
      // already holds usable values from ed.settings, so there is nothing to
      // recover if the read itself fails.
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const isFull = pdfPageSize === 'full';
  const showQuality = format === 'jpeg' || format === 'webp';
  const showPdfOptions = format === 'pdf';
  const ext = format === 'pdf' ? 'pdf' : format === 'jpeg' ? 'jpg' : format;

  const composed = ed.composedSize;
  const outW = targetWidth ?? composed?.w ?? 0;
  const outH = composed ? scaledHeight(composed.w, composed.h, outW) : 0;
  // A shape so extreme that no width fits the canvas caps has nothing to offer:
  // the row would present a range the export cannot honour.
  const showScale =
    format !== 'pdf' && composed !== null && exportWidthCeiling(composed.w, composed.h) >= 1;

  async function doExport() {
    // The Export button disables on the next render once busy is true, and
    // Chrome moves focus to <body> when the focused element is disabled.
    // Focusing the modal first keeps focus inside it, so the modal's
    // stopPropagation still shields window shortcuts (⌘Z, ?) while the
    // export runs.
    modalRef.current?.focus();
    setBusy(true);
    setExportError(null);
    try {
      if (format === 'pdf') {
        const opts: PdfOptions = {
          pageSize: pdfPageSize,
          orientation: pdfOrientation,
          multiPage: pdfMultiPage,
          marginMm: pdfMargin,
        };
        await ed.exportPdf(opts, filenameBase);
      } else {
        await ed.exportImage(format, quality, filenameBase, targetWidth ?? undefined);
      }
      // The export is the action the user asked for. Persisting the choice is a
      // convenience, so it runs after and can never prevent the export.
      if (remember) {
        // The file is already on disk at this point, so there is nothing left
        // for the user to retry — a storage failure here must not look like
        // the export itself failed.
        try {
          await setSettings({
            defaultFormat: format,
            quality,
            pdfPageSize,
            pdfOrientation,
            pdfMultiPage,
            pdfMarginMm: pdfMargin,
          });
        } catch {
          // Swallowed: see comment above.
        }
      }
      onClose();
    } catch {
      // Keep the dialog open on failure — there is no other surface for this
      // error, and the fields (scale, format) are right here to adjust and retry.
      setExportError('Could not export the image. Try a smaller scale or a different format.');
    } finally {
      // ed.exporting only covers the export call itself, so it clears before the
      // settings write. This flag spans the whole operation, so the button
      // cannot fire a second export in the gap.
      setBusy(false);
    }
  }

  const modalRef = useRef<HTMLDivElement>(null);
  const prevFocusRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    // Runs on the true mount AND on every later render where `closing` goes
    // back to false without one — a fast reopen (click Export again before
    // the exit timer unmounts it) cancels the close via useExitDelay's own
    // render-phase update, so this SAME component instance survives and a
    // []-only mount effect would never fire again to refocus into it. That
    // used to leave a real keyboard trap: onKeyDown resumes trapping the
    // instant `closing` clears, but nothing had moved focus back inside, so
    // Shift+Tab from outside would suddenly jump into a dialog the user
    // never re-focused into on purpose.
    if (closing) {
      // The dialog stays mounted through its exit animation (useExitDelay),
      // so unmount-time focus restoration would leave focus trapped inside a
      // modal that is only still there to fade out — a shortcut typed right
      // after Escape (⌘S closes, then ? for the shortcut sheet) would be
      // swallowed by this modal's own onKeyDown below instead of reaching
      // the window listener. Restoring the moment closing starts, not at
      // unmount, is what keeps that keystroke free; onKeyDown stops trapping
      // the same moment, for the same reason.
      prevFocusRef.current?.focus?.();
      return;
    }
    prevFocusRef.current = (document.activeElement as HTMLElement | null) ?? null;
    const focusable = modalRef.current ? getFocusable(modalRef.current) : [];
    focusable[0]?.focus();
  }, [closing]);

  return (
    <div class={`modal-backdrop${closing ? ' is-closing' : ''}`} onMouseDown={onClose}>
      <div
        ref={modalRef}
        class={`modal${closing ? ' is-closing' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Export screenshot"
        tabIndex={-1}
        inert={closing}
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (closing) return; // let keys bubble normally during the exit fade
          // A modal owns the keyboard while it is open — see ShortcutSheet's onKeyDown.
          e.stopPropagation();
          trapFocus(modalRef.current!, e);
          if (e.key === 'Escape') onClose();
        }}
      >
        <h2 class="modal-title">Export</h2>

        <div class="field-label">Format</div>
        <div class="format-grid">
          {IMAGE_FORMATS.map((f) => (
            <button
              key={f.id}
              class={`format-card${format === f.id ? ' is-selected' : ''}`}
              aria-pressed={format === f.id}
              onClick={() => setFormat(f.id)}
            >
              <span class="format-name">{f.label}</span>
              <span class="format-hint">{f.hint}</span>
            </button>
          ))}
          <button
            class={`format-card${format === 'pdf' ? ' is-selected' : ''}`}
            aria-pressed={format === 'pdf'}
            onClick={() => setFormat('pdf')}
          >
            <span class="format-name">PDF</span>
            <span class="format-hint">Document · multi-page</span>
          </button>
        </div>

        {showScale && composed ? (
          <div class="modal-row">
            <div class="field-label">Scale</div>
            <div class="scale-row">
              <div class="segmented">
                {SCALE_PRESETS.map((p) => {
                  const raw = Math.max(1, Math.round(composed.w * p));
                  const ceiling = exportWidthCeiling(composed.w, composed.h);
                  const exceeds = raw > ceiling;
                  const w = clampTargetWidth(raw, composed.w, composed.h);
                  return (
                    <button
                      key={p}
                      class={`segmented-btn${!exceeds && outW === w ? ' is-selected' : ''}`}
                      aria-pressed={!exceeds && outW === w}
                      disabled={exceeds}
                      title={exceeds ? `${p * 100}% would exceed the export size limit` : undefined}
                      onClick={() => {
                        setTargetWidth(p === 1 ? null : w);
                        setWidthText(null);
                      }}
                    >
                      {p * 100}%
                    </button>
                  );
                })}
              </div>
              <label class="check-label">
                Width
                <input
                  class="num-input num-input-wide"
                  type="number"
                  min={minExportWidth(exportWidthCeiling(composed.w, composed.h))}
                  max={exportWidthCeiling(composed.w, composed.h)}
                  value={widthText ?? String(outW)}
                  onInput={(e) => {
                    const raw = (e.target as HTMLInputElement).value;
                    setWidthText(raw);
                    setWidthNotice(null);
                    const n = Number(raw);
                    const ceiling = exportWidthCeiling(composed.w, composed.h);
                    if (Number.isFinite(n) && n >= minExportWidth(ceiling) && n <= ceiling) {
                      setTargetWidth(Math.round(n));
                    }
                  }}
                  onChange={(e) => {
                    const raw = (e.target as HTMLInputElement).value;
                    const n = Number(raw);
                    const ceiling = exportWidthCeiling(composed.w, composed.h);
                    const floor = minExportWidth(ceiling);
                    const clamped = clampTargetWidth(n, composed.w, composed.h);
                    setWidthNotice(
                      !Number.isFinite(n) || n !== clamped
                        ? `Width clamped to ${clamped}px (allowed range ${floor}–${ceiling}px).`
                        : null,
                    );
                    setTargetWidth(clamped);
                    setWidthText(null);
                  }}
                />
                px
              </label>
              <span class="scale-readout">
                {composed.w} × {composed.h} → {outW} × {outH}
              </span>
            </div>
            <p class="field-notice" role="status">
              {widthNotice ?? ''}
            </p>
          </div>
        ) : null}

        {showQuality ? (
          <div class="modal-row">
            <label class="field-label" for="oss-quality">
              Quality · {Math.round(quality * 100)}%
            </label>
            <input
              id="oss-quality"
              class="range"
              type="range"
              min="0.1"
              max="1"
              step="0.05"
              aria-valuetext={`${Math.round(quality * 100)}%`}
              value={quality}
              onInput={(e) => setQuality(Number((e.target as HTMLInputElement).value))}
            />
          </div>
        ) : null}

        {showPdfOptions ? (
          <>
            <div class="modal-row">
              <div class="field-label">Page size</div>
              <div class="segmented">
                <button
                  class={`segmented-btn${pdfPageSize === 'a4' ? ' is-selected' : ''}`}
                  aria-pressed={pdfPageSize === 'a4'}
                  onClick={() => setPdfPageSize('a4')}
                >
                  A4
                </button>
                <button
                  class={`segmented-btn${pdfPageSize === 'letter' ? ' is-selected' : ''}`}
                  aria-pressed={pdfPageSize === 'letter'}
                  onClick={() => setPdfPageSize('letter')}
                >
                  Letter
                </button>
                <button
                  class={`segmented-btn${pdfPageSize === 'full' ? ' is-selected' : ''}`}
                  aria-pressed={pdfPageSize === 'full'}
                  onClick={() => setPdfPageSize('full')}
                >
                  Full
                </button>
              </div>
            </div>
            <div class="modal-row">
              <div class="field-label">Orientation</div>
              <div class="segmented">
                <button
                  class={`segmented-btn${pdfOrientation === 'portrait' ? ' is-selected' : ''}`}
                  aria-pressed={pdfOrientation === 'portrait'}
                  disabled={isFull}
                  onClick={() => setPdfOrientation('portrait')}
                >
                  Portrait
                </button>
                <button
                  class={`segmented-btn${pdfOrientation === 'landscape' ? ' is-selected' : ''}`}
                  aria-pressed={pdfOrientation === 'landscape'}
                  disabled={isFull}
                  onClick={() => setPdfOrientation('landscape')}
                >
                  Landscape
                </button>
              </div>
            </div>
            <div class="modal-row check-row">
              <label class="check-label">
                <input
                  type="checkbox"
                  class="switch"
                  checked={pdfMultiPage && !isFull}
                  disabled={isFull}
                  onChange={(e) => setPdfMultiPage((e.target as HTMLInputElement).checked)}
                />
                Split across multiple pages
              </label>
              <label class="check-label">
                Margin
                <input
                  class="num-input"
                  type="number"
                  min={MIN_PDF_MARGIN_MM}
                  max={MAX_PDF_MARGIN_MM}
                  step="1"
                  value={marginText ?? String(pdfMargin)}
                  disabled={isFull}
                  onInput={(e) => {
                    const raw = (e.target as HTMLInputElement).value;
                    setMarginText(raw);
                    setMarginNotice(null);
                    const n = Number(raw);
                    if (Number.isFinite(n) && n >= MIN_PDF_MARGIN_MM && n <= MAX_PDF_MARGIN_MM) {
                      setPdfMargin(n);
                    }
                  }}
                  onChange={(e) => {
                    const raw = (e.target as HTMLInputElement).value;
                    const n = Number(raw);
                    const clamped = clampPdfMargin(n);
                    setMarginNotice(
                      !Number.isFinite(n) || n !== clamped
                        ? `Margin clamped to ${clamped}mm (allowed range ${MIN_PDF_MARGIN_MM}–${MAX_PDF_MARGIN_MM}mm).`
                        : null,
                    );
                    setPdfMargin(clamped);
                    setMarginText(null);
                  }}
                />
                mm
              </label>
            </div>
            <p class="field-notice" role="status">
              {marginNotice ?? ''}
            </p>
            {isFull ? (
              <p class="pdf-hint">
                “Full” makes one page sized to the image, so orientation, multi-page and margin
                don’t apply.
              </p>
            ) : null}
          </>
        ) : null}

        <div class="modal-row">
          <label class="field-label" for="oss-filename">
            Filename
          </label>
          <div class="filename-row">
            <input
              id="oss-filename"
              class="filename-input"
              type="text"
              value={filenameBase}
              onInput={(e) => setFilenameBase((e.target as HTMLInputElement).value)}
            />
            <span class="filename-ext">.{ext}</span>
          </div>
        </div>

        {exportError ? (
          <p class="export-error" role="alert">
            {exportError}
          </p>
        ) : null}

        {busy ? (
          // Real per-page progress for the multi-page PDF path (pdf.ts's own
          // page loop reports it — see useEditor's exportProgress); an
          // honest indeterminate spinner everywhere else, since PNG/JPEG/WebP
          // and the single-page/full PDF paths are one synchronous call with
          // no stage to report — a bar animating through invented numbers
          // there would be a lie told in CSS.
          <div class="export-progress" role="status">
            {ed.exportProgress ? (
              <>
                <span class="export-progress-bar-track">
                  <progress
                    class="export-progress-bar"
                    value={ed.exportProgress.page}
                    max={ed.exportProgress.total}
                  />
                </span>
                <span>
                  Exporting page {ed.exportProgress.page} of {ed.exportProgress.total}…
                </span>
              </>
            ) : (
              <>
                <span class="spinner" aria-hidden="true" />
                <span>Exporting…</span>
              </>
            )}
          </div>
        ) : null}

        <div class="modal-actions">
          <label class="check-label">
            <input
              type="checkbox"
              class="switch"
              checked={remember}
              onChange={(e) => setRemember((e.target as HTMLInputElement).checked)}
            />
            Remember these settings
          </label>
          <span class="modal-actions-spacer" />
          <button class="text-btn" onClick={onClose}>
            Cancel
          </button>
          <button
            class="btn-primary btn-fixed-export"
            onClick={doExport}
            disabled={ed.exporting || busy}
          >
            {ed.exporting ? 'Exporting…' : 'Export'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ImportConfirm({
  name,
  count,
  onConfirm,
  onCancel,
  closing,
}: {
  name: string;
  count: number;
  onConfirm: () => void;
  onCancel: () => void;
  closing: boolean;
}) {
  const modalRef = useRef<HTMLDivElement>(null);
  const prevFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // See ExportDialog's own consolidated focus effect for why this must
    // re-run on any closing -> not-closing edge, not just the true mount —
    // a fast reopen survives as the same instance under useExitDelay.
    if (closing) {
      prevFocusRef.current?.focus?.();
      return;
    }
    prevFocusRef.current = (document.activeElement as HTMLElement | null) ?? null;
    const focusable = modalRef.current ? getFocusable(modalRef.current) : [];
    focusable[0]?.focus();
  }, [closing]);

  return (
    <div class={`modal-backdrop${closing ? ' is-closing' : ''}`} onMouseDown={onCancel}>
      <div
        ref={modalRef}
        class={`modal${closing ? ' is-closing' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Replace the current image"
        tabIndex={-1}
        inert={closing}
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (closing) return; // let keys bubble normally during the exit fade
          // A modal owns the keyboard while it is open — see ShortcutSheet's onKeyDown.
          e.stopPropagation();
          trapFocus(modalRef.current!, e);
          if (e.key === 'Escape') onCancel();
        }}
      >
        <h2 class="modal-title">Replace the current image?</h2>
        <p class="modal-text">
          “{name}” opens in place of what is on the canvas. {count}{' '}
          {count === 1 ? 'annotation' : 'annotations'} and the undo history go with it.
        </p>
        <div class="modal-actions">
          <span class="modal-actions-spacer" />
          <button class="text-btn" onClick={onCancel}>
            Cancel
          </button>
          <button class="btn-primary" onClick={onConfirm}>
            Replace
          </button>
        </div>
      </div>
    </div>
  );
}

function TextOverlay({ ed }: { ed: ReturnType<typeof useEditor> }) {
  const id = ed.textEdit!.id;
  const pos = ed.textOverlayPos(id);
  const ann = ed.annotations.find((a) => a.id === id && a.type === 'text');
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
  }, []);

  if (!pos || !ann || ann.type !== 'text') return null;

  return (
    <textarea
      ref={ref}
      class="text-overlay"
      style={{
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        fontSize: `${pos.fontSize}px`,
        lineHeight: 1.25,
        width: `${Math.max(60, pos.width + 12)}px`,
        height: `${Math.max(pos.fontSize * 1.4, pos.height + 4)}px`,
      }}
      value={ann.text}
      placeholder="Type…"
      onInput={(e) => ed.updateText(id, (e.target as HTMLTextAreaElement).value)}
      onBlur={() => ed.finishText(id)}
      onKeyDown={(e) => {
        if (e.key === 'Escape' || (e.key === 'Enter' && !e.shiftKey)) {
          e.preventDefault();
          // The blur is what commits the text. Focus then goes back to the
          // canvas rather than to <body>, which is where it lands otherwise —
          // and <body> is 18 Tab presses away from the canvas.
          (e.target as HTMLTextAreaElement).blur();
          ed.canvasRef.current?.focus();
        }
      }}
    />
  );
}

function EmptyState() {
  const [failed, setFailed] = useState(false);

  // openPopup lands in Chrome 127+ and still refuses in some window states, so
  // the fallback line is the guaranteed path rather than a nicety.
  function openPopup() {
    try {
      const result = chrome.action?.openPopup?.();
      if (result && typeof result.then === 'function') {
        result.catch(() => setFailed(true));
      } else if (!chrome.action?.openPopup) {
        setFailed(true);
      }
    } catch {
      setFailed(true);
    }
  }

  return (
    <div class="overlay-msg">
      <div class="empty">
        <div class="empty-icon" aria-hidden="true">
          <IconImage size={40} />
        </div>
        <h2>Nothing to edit yet</h2>
        <p>Capture a page with OpenScreenShot, and it opens here.</p>
        <p class="empty-alt">Or drop an image here — paste works too.</p>
        <button class="btn-primary empty-cta" onClick={openPopup}>
          Capture a page
        </button>
        {failed ? (
          <p class="empty-fallback">Click the OpenScreenShot icon in the toolbar.</p>
        ) : null}
      </div>
    </div>
  );
}

function ToolIcon({ id }: { id: Tool }) {
  switch (id) {
    case 'select':
      return <IconSelect />;
    case 'rect':
      return <IconRectangle />;
    case 'arrow':
      return <IconArrow />;
    case 'line':
      return <IconLine />;
    case 'pen':
      return <IconPen />;
    case 'highlight':
      return <IconHighlight />;
    case 'step':
      return <IconStep />;
    case 'text':
      return <IconText />;
    case 'blur':
      return <IconBlur />;
    case 'spotlight':
      return <IconSpotlight />;
    case 'eyedropper':
      return <IconEyedropper />;
    case 'crop':
      return <IconCrop />;
    case 'cut':
      return <IconCut />;
  }
}

/** What a stored draft holds, for the restore pill: annotations, cuts, or both. */
function draftSummary(draft: Draft): string {
  const parts: string[] = [];
  if (draft.annotations.length > 0) {
    parts.push(
      `${draft.annotations.length} annotation${draft.annotations.length === 1 ? '' : 's'}`,
    );
  }
  if (draft.bands.length > 0) {
    parts.push(`${draft.bands.length} cut${draft.bands.length === 1 ? '' : 's'}`);
  }
  return parts.join(', ');
}

function hintForTool(tool: Tool): string {
  switch (tool) {
    case 'rect':
      return 'Drag to draw a rectangle · Shift keeps it square';
    case 'arrow':
      return 'Drag to draw an arrow · Shift snaps to 45°';
    case 'line':
      return 'Drag to draw a line · Shift snaps to 45°';
    case 'pen':
      return 'Drag to draw freehand';
    case 'highlight':
      return 'Drag to highlight — marker stays translucent';
    case 'step':
      return 'Click to place a numbered badge · numbers stay in order';
    case 'text':
      return 'Click to place text, then type';
    case 'blur':
      return 'Drag over an area to redact it · pick Blur, Mosaic, or Solid above';
    case 'spotlight':
      return 'Drag to keep an area lit — everything else dims · Shift keeps it square';
    case 'crop':
      return 'Drag to select, then Apply to crop';
    case 'cut':
      return 'Drag over a band to take it out · click a seam to put it back · nothing is erased';
    case 'eyedropper':
      return 'Click any pixel to take its color · the previous tool comes back';
    case 'select':
      return 'Select · drag to move · handles to resize · double-click text · ⌫ delete';
  }
}
