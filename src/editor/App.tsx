import { useEffect, useRef, useState } from 'preact/hooks';
import { isTypingTarget, useEditor } from './useEditor';
import { TOOL_LIST, type Tool } from './tools';
import { IMAGE_FORMATS, type ImageFormat } from './export';
import type { PdfOptions } from './pdf';
import { STROKE_WIDTHS, type BlurMode, type SpotlightShape } from './annotations';
import { COLOR_PALETTE, colorName } from './palette';
import { arrowNav, getFocusable, trapFocus } from './focus';
import { pickImageFile } from './import-image';
import { BrandMark } from '../shared/BrandMark';
import {
  IconAlert,
  IconArrow,
  IconBlur,
  IconCrop,
  IconEyedropper,
  IconHighlight,
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
import type { LastCapture } from '../shared/types';
import { ZoomMenu } from './ZoomMenu';
import { BeautifyMenu } from './BeautifyMenu';
import { stylebarEmpty, stylebarFields } from './stylebar';
import { ShortcutSheet } from './ShortcutSheet';
import { hasScreenPicker, openScreenPicker } from './eyedropper';
import {
  clampTargetWidth,
  exportWidthCeiling,
  minExportWidth,
  scaledHeight,
  SCALE_PRESETS,
} from './scale';

type DialogFormat = ImageFormat | 'pdf';

export function App() {
  const ed = useEditor();
  const [exportOpen, setExportOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const [dragOver, setDragOver] = useState(false);

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
          onKeyDown={(e) => arrowNav(e.currentTarget as HTMLElement, e)}
        >
          {TOOL_LIST.map((t) => (
            <button
              key={t.id}
              class={`tool-btn${ed.tool === t.id ? ' is-active' : ''}`}
              title={`${t.label} (${t.shortcut})`}
              aria-pressed={ed.tool === t.id}
              onClick={() => ed.setTool(t.id)}
            >
              <ToolIcon id={t.id} />
            </button>
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
          <canvas
            ref={ed.canvasRef}
            class="stage-canvas"
            data-cursor={cursor}
            onMouseDown={ed.onCanvasMouseDown}
            onDblClick={ed.onCanvasDoubleClick}
          />

          {ed.stageNotice && !ed.cropActive ? (
            <div class="stage-notice" role="status">
              <span>{ed.stageNotice}</span>
              <button class="text-btn" onClick={ed.dismissStageNotice}>
                Dismiss
              </button>
            </div>
          ) : null}

          {ed.draftPrompt && !ed.stageNotice && !ed.cropActive ? (
            <div class="draft-restore" role="status">
              <span>
                Unsaved edits from your last session ({ed.draftPrompt.annotations.length}{' '}
                {ed.draftPrompt.annotations.length === 1 ? 'annotation' : 'annotations'}).
              </span>
              <button class="btn-primary btn-sm" onClick={ed.restoreDraft}>
                Restore
              </button>
              <button class="text-btn" onClick={ed.discardDraft}>
                Discard
              </button>
            </div>
          ) : null}

          {ed.cropActive ? (
            <div class="crop-confirm">
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
            <div class="overlay-msg">
              <div class="empty">
                <div class="empty-icon empty-icon-error" aria-hidden="true">
                  <IconAlert size={40} />
                </div>
                <h2>Something went wrong</h2>
                <p>{ed.error}</p>
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

      {exportOpen && ed.capture ? (
        <ExportDialog ed={ed} onClose={() => setExportOpen(false)} />
      ) : null}
      {sheetOpen ? <ShortcutSheet onClose={() => setSheetOpen(false)} /> : null}
      {ed.pendingImport ? <ImportConfirm ed={ed} /> : null}
    </div>
  );
}

function StyleBar({ ed }: { ed: ReturnType<typeof useEditor> }) {
  // Chrome 95+. Feature-detected once: the answer cannot change while the page lives.
  const [canPickScreen] = useState(() => hasScreenPicker(window));
  const sel = ed.selectedAnnotation;
  const fields = stylebarFields(ed.tool, sel?.type ?? null);
  if (stylebarEmpty(fields)) return null;

  function pickFromScreen() {
    void openScreenPicker(window).then((hex) => {
      if (hex) ed.setStyleColor(hex);
    });
  }

  return (
    <div
      class="stylebar"
      role="toolbar"
      aria-orientation="horizontal"
      aria-label="Annotation style"
      onKeyDown={(e) => arrowNav(e.currentTarget as HTMLElement, e)}
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

function ExportDialog({ ed, onClose }: { ed: ReturnType<typeof useEditor>; onClose: () => void }) {
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
  const [filenameBase, setFilenameBase] = useState(ed.defaultFilename());

  const [pdfPageSize, setPdfPageSize] = useState<'a4' | 'letter' | 'full'>(
    ed.settings?.pdfPageSize ?? 'a4',
  );
  const [pdfOrientation, setPdfOrientation] = useState<'portrait' | 'landscape'>(
    ed.settings?.pdfOrientation ?? 'portrait',
  );
  const [pdfMultiPage, setPdfMultiPage] = useState(ed.settings?.pdfMultiPage ?? true);
  const [pdfMargin, setPdfMargin] = useState(ed.settings?.pdfMarginMm ?? 8);
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
  useEffect(() => {
    // Focus the first control; restore focus to the opener (Export button) on close.
    const prev = (document.activeElement as HTMLElement | null) ?? null;
    const focusable = modalRef.current ? getFocusable(modalRef.current) : [];
    focusable[0]?.focus();
    return () => {
      prev?.focus?.();
    };
  }, []);

  return (
    <div class="modal-backdrop" onMouseDown={onClose}>
      <div
        ref={modalRef}
        class="modal"
        role="dialog"
        aria-modal="true"
        aria-label="Export screenshot"
        tabIndex={-1}
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
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
                    const n = Number(raw);
                    const ceiling = exportWidthCeiling(composed.w, composed.h);
                    if (Number.isFinite(n) && n >= minExportWidth(ceiling) && n <= ceiling) {
                      setTargetWidth(Math.round(n));
                    }
                  }}
                  onChange={(e) => {
                    const clamped = clampTargetWidth(
                      Number((e.target as HTMLInputElement).value),
                      composed.w,
                      composed.h,
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
                  onClick={() => setPdfPageSize('a4')}
                >
                  A4
                </button>
                <button
                  class={`segmented-btn${pdfPageSize === 'letter' ? ' is-selected' : ''}`}
                  onClick={() => setPdfPageSize('letter')}
                >
                  Letter
                </button>
                <button
                  class={`segmented-btn${pdfPageSize === 'full' ? ' is-selected' : ''}`}
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
                  disabled={isFull}
                  onClick={() => setPdfOrientation('portrait')}
                >
                  Portrait
                </button>
                <button
                  class={`segmented-btn${pdfOrientation === 'landscape' ? ' is-selected' : ''}`}
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
                  min="0"
                  max="40"
                  step="1"
                  value={pdfMargin}
                  disabled={isFull}
                  onInput={(e) => setPdfMargin(Number((e.target as HTMLInputElement).value))}
                />
                mm
              </label>
            </div>
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

        {exportError ? <p class="export-error">{exportError}</p> : null}

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
          <button class="btn-primary" onClick={doExport} disabled={ed.exporting || busy}>
            {ed.exporting ? 'Exporting…' : 'Export'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ImportConfirm({ ed }: { ed: ReturnType<typeof useEditor> }) {
  const modalRef = useRef<HTMLDivElement>(null);
  const name = ed.pendingImport?.name ?? '';
  const count = ed.annotations.length;

  useEffect(() => {
    const prev = (document.activeElement as HTMLElement | null) ?? null;
    const focusable = modalRef.current ? getFocusable(modalRef.current) : [];
    focusable[0]?.focus();
    return () => {
      prev?.focus?.();
    };
  }, []);

  return (
    <div class="modal-backdrop" onMouseDown={ed.cancelImport}>
      <div
        ref={modalRef}
        class="modal"
        role="dialog"
        aria-modal="true"
        aria-label="Replace the current image"
        tabIndex={-1}
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          // A modal owns the keyboard while it is open — see ShortcutSheet's onKeyDown.
          e.stopPropagation();
          trapFocus(modalRef.current!, e);
          if (e.key === 'Escape') ed.cancelImport();
        }}
      >
        <h2 class="modal-title">Replace the current image?</h2>
        <p class="modal-text">
          “{name}” opens in place of what is on the canvas. {count}{' '}
          {count === 1 ? 'annotation' : 'annotations'} and the undo history go with it.
        </p>
        <div class="modal-actions">
          <span class="modal-actions-spacer" />
          <button class="text-btn" onClick={ed.cancelImport}>
            Cancel
          </button>
          <button class="btn-primary" onClick={ed.confirmImport}>
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
        if (e.key === 'Escape') {
          e.preventDefault();
          (e.target as HTMLTextAreaElement).blur();
        } else if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          (e.target as HTMLTextAreaElement).blur();
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
  }
}

function labelForSource(mode: LastCapture['mode']): string {
  switch (mode) {
    case 'full-page':
      return 'Full Page';
    case 'visible':
      return 'Visible';
    case 'region':
      return 'Region';
    case 'import':
      return 'Imported';
  }
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
    case 'eyedropper':
      return 'Click any pixel to take its color · the previous tool comes back';
    case 'select':
      return 'Select · drag to move · handles to resize · double-click text · ⌫ delete';
  }
}
