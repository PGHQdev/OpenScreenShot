import { useEffect, useRef, useState } from 'preact/hooks';
import { isTypingTarget, useEditor } from './useEditor';
import { TOOL_LIST, type Tool } from './tools';
import { IMAGE_FORMATS, type ImageFormat } from './export';
import type { PdfOptions } from './pdf';
import { COLOR_PALETTE, STROKE_WIDTHS, type BlurMode, type SpotlightShape } from './annotations';
import { colorName } from './palette';
import { arrowNav, getFocusable, trapFocus } from './focus';
import { BrandMark } from '../shared/BrandMark';
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
              <IconLayers />
              <span>{ed.annotations.length}</span>
            </div>
          ) : null}
        </aside>

        <div class="stage">
          <canvas
            ref={ed.canvasRef}
            class="stage-canvas"
            data-cursor={cursor}
            onMouseDown={ed.onCanvasMouseDown}
            onDblClick={ed.onCanvasDoubleClick}
          />

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
                  <IconAlert />
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
    </div>
  );
}

function StyleBar({ ed }: { ed: ReturnType<typeof useEditor> }) {
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
            {CAN_PICK_SCREEN ? (
              <button
                class="swatch swatch-screen"
                title="Pick a color from anywhere on screen"
                aria-label="Pick a color from anywhere on screen"
                onClick={pickFromScreen}
              >
                <IconDropper />
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

// Chrome 95+. Feature-detected once: the answer cannot change while the page lives.
const CAN_PICK_SCREEN = hasScreenPicker(window);

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
          <IconImage />
        </div>
        <h2>Nothing to edit yet</h2>
        <p>Capture a page with OpenScreenShot, and it opens here.</p>
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
  const common = {
    width: 20,
    height: 20,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': 2,
    'stroke-linecap': 'round' as const,
    'stroke-linejoin': 'round' as const,
  };
  switch (id) {
    case 'select':
      return (
        <svg {...common}>
          <path d="M4 4l6 16 2-7 7-2z" />
        </svg>
      );
    case 'rect':
      return (
        <svg {...common}>
          <rect x="4" y="6" width="16" height="12" rx="2" />
        </svg>
      );
    case 'arrow':
      return (
        <svg {...common}>
          <path d="M4 20L20 4M20 4h-6M20 4v6" />
        </svg>
      );
    case 'line':
      return (
        <svg {...common}>
          <path d="M4 20L20 4" />
        </svg>
      );
    case 'pen':
      return (
        <svg {...common}>
          <path d="M16.5 3.5l4 4L7 21H3v-4z" />
        </svg>
      );
    case 'highlight':
      return (
        <svg {...common}>
          <path d="m9 11-6 6v3h9l3-3" />
          <path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4l8 8Z" />
        </svg>
      );
    case 'step':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M10.5 9.6L12.2 8.2v7.6" />
        </svg>
      );
    case 'text':
      return (
        <svg {...common}>
          <path d="M5 5h14M12 5v14M9 19h6" />
        </svg>
      );
    case 'blur':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="7" stroke-dasharray="2 3" />
        </svg>
      );
    case 'spotlight':
      return (
        <svg {...common}>
          <rect x="3" y="3" width="18" height="18" rx="2" stroke-dasharray="3 3" />
          <circle cx="12" cy="12" r="5" />
        </svg>
      );
    case 'eyedropper':
      return (
        <svg {...common}>
          <path d="M18 3.5a2.1 2.1 0 0 1 3 3L15 12.5l-3-3z" />
          <path d="M12 9.5 4.5 17v2.5H7L14.5 12" />
        </svg>
      );
    case 'crop':
      return (
        <svg {...common}>
          <path d="M6 2v14h14M2 6h14v14" />
        </svg>
      );
  }
}

function IconImage() {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="M21 15l-5-5L5 21" />
    </svg>
  );
}

function IconAlert() {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <path d="M12 9v4M12 17h.01" />
    </svg>
  );
}

function IconUndo() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M9 14L4 9l5-5M4 9h11a5 5 0 0 1 0 10h-3" />
    </svg>
  );
}

function IconRedo() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M15 14l5-5-5-5M20 9H9a5 5 0 0 0 0 10h3" />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />
    </svg>
  );
}

function IconLayers() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M12 2l9 5-9 5-9-5 9-5z" />
      <path d="M3 12l9 5 9-5" />
      <path d="M3 17l9 5 9-5" />
    </svg>
  );
}

function IconDropper() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2.5"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M18 3.5a2.1 2.1 0 0 1 3 3L15 12.5l-3-3z" />
      <path d="M12 9.5 4.5 17v2.5H7L14.5 12" />
    </svg>
  );
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
