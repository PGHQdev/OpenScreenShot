/**
 * The recording control tab. The popup's Record click opens it beside the
 * page to record; here the user checks the camera, picks the part of the tab
 * to keep, and presses Start. The worker then switches to the recorded tab,
 * and this tab holds the timer and Stop until the editor replaces it.
 *
 * Every control lives here, outside the recorded tab, because tabCapture
 * records every pixel of that tab: nothing drawn on the page could stay out
 * of the video. This page is also of the extension's origin, so its camera
 * and mic prompts are the grants the offscreen engine records with.
 */
import { useEffect, useRef, useState } from 'preact/hooks';
import { BrandMark } from '../shared/BrandMark';
import { formatTimer } from '../content/recording-overlay';
import { IconCamera, IconMic, IconPause, IconPlay, IconRecordDot } from '../shared/icons';
import { classifyMediaError, type MediaBlock } from '../shared/permissions';
import {
  CONTROL_TARGET_KEY,
  DEFAULT_RECORDING_SETTINGS,
  FULL_AREA,
  type ControlTarget,
  type RecMessage,
  type RecordingArea,
  type RecordingSettings,
  type RecState,
} from '../shared/recording-types';
import {
  isRecFailure,
  recFailureMessageKey,
  REC_FAILURE_KEY,
  REC_FAILURE_MESSAGE,
} from '../shared/rec-failure';
import { getRecSettings, getSettings, setRecSettings } from '../shared/storage';
import { applyTheme, watchSystemTheme } from '../shared/theme';
import { areaFromDrag, areaPixelSize, isFullArea, moveArea, resizeArea, type Point } from './area';

function t(id: string, subs?: string[]): string {
  return chrome.i18n.getMessage(id, subs) || id;
}

/** How often the page re-reads the recording state from the worker. */
const POLL_MS = 1000;
/** Arrow-key step for moving or resizing the area, as a fraction of the tab. */
const KEY_STEP = 0.01;

const SETUP_URL = chrome.runtime.getURL('src/setup/index.html');

function send(message: RecMessage): Promise<unknown> {
  return chrome.runtime.sendMessage(message);
}

async function query(): Promise<RecState | null> {
  try {
    return ((await send({ type: 'REC_QUERY' })) as RecState | undefined) ?? null;
  } catch {
    return null;
  }
}

/** The target this page was opened for, if the stored one still matches the URL. */
async function readTarget(): Promise<ControlTarget | null> {
  const tabId = Number(new URLSearchParams(location.search).get('tab'));
  const stored = await chrome.storage.session.get(CONTROL_TARGET_KEY).catch(() => ({}));
  const target = (stored as Record<string, unknown>)[CONTROL_TARGET_KEY] as
    ControlTarget | undefined;
  return target && target.tabId === tabId ? target : null;
}

async function stopShortcut(): Promise<string | null> {
  try {
    const commands = await chrome.commands.getAll();
    return commands.find((c) => c.name === 'stop-recording')?.shortcut || null;
  } catch {
    return null;
  }
}

export function App() {
  const [target, setTarget] = useState<ControlTarget | null | undefined>(undefined);
  const [rec, setRec] = useState<RecState | null>(null);
  /** `Date.now()` when `rec` arrived, so the timer runs between polls. */
  const [recAt, setRecAt] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [settings, setSettingsState] = useState<RecordingSettings>(DEFAULT_RECORDING_SETTINGS);
  const [area, setArea] = useState<RecordingArea>(FULL_AREA);
  const [starting, setStarting] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const [shortcut, setShortcut] = useState<string | null>(null);

  useEffect(() => {
    void getSettings().then((s) => applyTheme(s.theme));
    void readTarget().then(setTarget);
    void getRecSettings().then(setSettingsState);
    void stopShortcut().then(setShortcut);
  }, []);
  useEffect(() => watchSystemTheme(() => void getSettings().then((s) => applyTheme(s.theme))), []);

  // The worker owns the run; this page only mirrors it.
  useEffect(() => {
    let alive = true;
    async function poll(): Promise<void> {
      const next = await query();
      if (!alive) return;
      setRec(next);
      setRecAt(Date.now());
      if (next?.active) setStarting(false);
    }
    void poll();
    const id = setInterval(() => void poll(), POLL_MS);
    const tick = setInterval(() => setNow(Date.now()), 250);
    return () => {
      alive = false;
      clearInterval(id);
      clearInterval(tick);
    };
  }, []);

  // A failure the worker reports while this page is open is this page's to
  // show; it is read out once, the same way the popup reads it.
  useEffect(() => {
    const listener = (message: unknown) => {
      if (!message || typeof message !== 'object') return;
      if ((message as { type?: unknown }).type !== REC_FAILURE_MESSAGE) return;
      const value: unknown = (message as { failure?: unknown }).failure;
      if (!isRecFailure(value)) return;
      void chrome.storage.session.remove(REC_FAILURE_KEY).catch(() => {});
      setFailure(t(recFailureMessageKey(value.code)));
      setStarting(false);
    };
    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, []);

  const active = !!rec?.active;
  const elapsed =
    rec?.active && rec.anchored !== false
      ? (rec.elapsedMs ?? 0) + (rec.paused ? 0 : Math.max(0, now - recAt))
      : 0;

  useEffect(() => {
    const base = t('ctlPageTitle');
    if (!active) document.title = `${base} — OpenScreenShot`;
    else if (rec?.anchored === false) document.title = `${t('recStarting')} — ${base}`;
    else document.title = `${rec?.paused ? '❚❚' : '●'} ${formatTimer(elapsed)} — ${base}`;
  }, [active, rec?.anchored, rec?.paused, Math.floor(elapsed / 1000)]);

  async function updateSettings(patch: Partial<RecordingSettings>): Promise<void> {
    const next = { ...settings, ...patch };
    setSettingsState(next);
    await setRecSettings(next);
  }

  function start(): void {
    if (!target || starting) return;
    setFailure(null);
    setStarting(true);
    send({
      type: 'REC_START',
      settings,
      tabId: target.tabId,
      area,
      ...(target.continueSessionId ? { continueSessionId: target.continueSessionId } : {}),
    }).catch(() => {
      setStarting(false);
      setFailure(t(recFailureMessageKey('start-unreachable')));
    });
  }

  function control(type: 'REC_STOP' | 'REC_PAUSE' | 'REC_RESUME' | 'REC_CANCEL'): void {
    send({ type }).catch(() => setFailure(t(recFailureMessageKey('control-unreachable'))));
  }

  async function goToTab(): Promise<void> {
    const tabId = rec?.tabId ?? target?.tabId;
    if (tabId == null) return;
    const tab = await chrome.tabs.update(tabId, { active: true }).catch(() => null);
    if (tab?.windowId != null) await chrome.windows.update(tab.windowId, { focused: true });
  }

  const title = target?.title || target?.url || '';

  return (
    <main class="control">
      <header class="control-header">
        <BrandMark size={28} />
        <h1>{t('ctlPageTitle')}</h1>
      </header>

      {failure && (
        <p class="control-alert" role="alert">
          {failure}
        </p>
      )}

      {active ? (
        <RecordingPanel
          rec={rec!}
          elapsed={elapsed}
          title={title}
          onControl={control}
          onGoToTab={() => void goToTab()}
        />
      ) : target === null ? (
        <p class="control-empty">{t('ctlNoTarget')}</p>
      ) : target === undefined ? null : (
        <div class="control-grid">
          <section class="control-card" aria-labelledby="area-heading">
            <div class="control-target">
              {target.favIconUrl && <img src={target.favIconUrl} alt="" width={16} height={16} />}
              <span class="control-target-label">{t('ctlTabLabel')}</span>
              <span class="control-target-title">{title}</span>
            </div>
            <h2 id="area-heading">{t('ctlArea')}</h2>
            <AreaPicker shot={target.shot} area={area} onChange={setArea} />
          </section>

          <aside class="control-side">
            <section class="control-card" aria-labelledby="camera-heading">
              <h2 id="camera-heading">{t('ctlCamera')}</h2>
              <CameraPreview on={settings.webcam} />
              <MicCheck on={settings.mic} />
              <div class="chip-row" role="group" aria-label={t('recSourceLabel')}>
                <button
                  type="button"
                  class="chip-toggle"
                  aria-pressed={settings.mic}
                  onClick={() => void updateSettings({ mic: !settings.mic })}
                >
                  {t('recMic')}
                </button>
                <button
                  type="button"
                  class="chip-toggle"
                  aria-pressed={settings.tabAudio}
                  onClick={() => void updateSettings({ tabAudio: !settings.tabAudio })}
                >
                  {t('recTabAudio')}
                </button>
                <button
                  type="button"
                  class="chip-toggle"
                  aria-pressed={settings.webcam}
                  onClick={() => void updateSettings({ webcam: !settings.webcam })}
                >
                  {t('recWebcam')}
                </button>
              </div>
            </section>

            <button
              type="button"
              class="btn-primary control-start"
              disabled={starting}
              onClick={start}
            >
              <IconRecordDot size={18} />
              {starting ? t('recStarting') : t('ctlStart')}
            </button>
            <p class="settings-hint">
              {shortcut ? t('ctlStartHint', [title, shortcut]) : t('ctlStartHintNoKey', [title])}
            </p>
          </aside>
        </div>
      )}
    </main>
  );
}

function RecordingPanel(props: {
  rec: RecState;
  elapsed: number;
  title: string;
  onControl: (type: 'REC_STOP' | 'REC_PAUSE' | 'REC_RESUME' | 'REC_CANCEL') => void;
  onGoToTab: () => void;
}) {
  const { rec } = props;
  const starting = rec.anchored === false;
  const warnings = [
    rec.writeFailed ? `${t('recOverlayNotSaving')} — ${t('recFailChunkWrite')}` : null,
    rec.camDenied ? t('recWebcamDenied') : null,
    rec.overlayLost ? t('recFailOverlayLost') : null,
  ].filter((w): w is string => !!w);

  return (
    <section class="control-card control-live" aria-labelledby="live-heading">
      <p class="control-live-status" id="live-heading">
        <span class={`control-dot${rec.paused ? ' paused' : ''}`} aria-hidden="true" />
        {starting ? t('recStarting') : rec.paused ? t('recPaused') : t('recRecording')}
      </p>
      <p class="control-timer" aria-live="off">
        {starting ? '—' : formatTimer(props.elapsed)}
      </p>
      {props.title && <p class="control-live-title">{t('ctlRecordingOf', [props.title])}</p>}
      {warnings.map((w) => (
        <p key={w} class="control-alert" role="alert">
          {w}
        </p>
      ))}
      <div class="control-actions">
        <button
          type="button"
          class="btn-primary control-stop"
          disabled={starting}
          onClick={() => props.onControl('REC_STOP')}
        >
          {t('recOverlayStop')}
        </button>
        <button
          type="button"
          class="btn-secondary"
          disabled={starting}
          onClick={() => props.onControl(rec.paused ? 'REC_RESUME' : 'REC_PAUSE')}
        >
          {rec.paused ? <IconPlay size={16} /> : <IconPause size={16} />}
          {rec.paused ? t('recOverlayResume') : t('recOverlayPause')}
        </button>
        <button type="button" class="btn-secondary" onClick={() => props.onControl('REC_CANCEL')}>
          {t('recOverlayCancel')}
        </button>
      </div>
      <button type="button" class="btn-ghost control-go" onClick={props.onGoToTab}>
        {t('ctlGoToTab')}
      </button>
    </section>
  );
}

/**
 * The still of the tab with the recorded area drawn on it. Drag across the
 * picture to draw an area, drag inside it to move it; arrow keys move the
 * focused area and Shift + arrow keys resize it.
 */
function AreaPicker(props: {
  shot: string | null;
  area: RecordingArea;
  onChange: (area: RecordingArea) => void;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const drag = useRef<
    { kind: 'draw'; start: Point } | { kind: 'move'; start: Point; from: RecordingArea } | null
  >(null);

  if (!props.shot) return <p class="settings-hint">{t('ctlAreaNoShot')}</p>;

  function pointAt(e: PointerEvent): Point {
    const r = frameRef.current!.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
  }

  function onPointerDown(e: PointerEvent): void {
    if (e.button !== 0) return;
    const p = pointAt(e);
    const a = props.area;
    const inside =
      !isFullArea(a) && p.x >= a.x && p.x <= a.x + a.w && p.y >= a.y && p.y <= a.y + a.h;
    drag.current = inside ? { kind: 'move', start: p, from: a } : { kind: 'draw', start: p };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: PointerEvent): void {
    const d = drag.current;
    if (!d) return;
    const p = pointAt(e);
    if (d.kind === 'draw') props.onChange(areaFromDrag(d.start, p));
    else props.onChange(moveArea(d.from, p.x - d.start.x, p.y - d.start.y));
  }

  function onPointerUp(): void {
    drag.current = null;
  }

  function onKeyDown(e: KeyboardEvent): void {
    const dx = e.key === 'ArrowLeft' ? -KEY_STEP : e.key === 'ArrowRight' ? KEY_STEP : 0;
    const dy = e.key === 'ArrowUp' ? -KEY_STEP : e.key === 'ArrowDown' ? KEY_STEP : 0;
    if (!dx && !dy) return;
    e.preventDefault();
    props.onChange(e.shiftKey ? resizeArea(props.area, dx, dy) : moveArea(props.area, dx, dy));
  }

  const a = props.area;
  const full = isFullArea(a);
  const size = natural ? areaPixelSize(a, natural.w, natural.h) : null;

  return (
    <div class="area">
      <div
        ref={frameRef}
        class="area-frame"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <img
          src={props.shot}
          alt=""
          draggable={false}
          onLoad={(e) => {
            const img = e.currentTarget as HTMLImageElement;
            setNatural({ w: img.naturalWidth, h: img.naturalHeight });
          }}
        />
        <div
          class={`area-box${full ? ' full' : ''}`}
          role="group"
          tabIndex={0}
          aria-label={t('ctlArea')}
          aria-describedby="area-hint"
          onKeyDown={onKeyDown}
          style={{
            left: `${a.x * 100}%`,
            top: `${a.y * 100}%`,
            width: `${a.w * 100}%`,
            height: `${a.h * 100}%`,
          }}
        />
      </div>
      <div class="area-bar">
        <span class="area-size">
          {full
            ? t('ctlAreaWhole')
            : size
              ? t('ctlAreaSize', [String(size.w), String(size.h)])
              : ''}
        </span>
        <button
          type="button"
          class="btn-secondary"
          disabled={full}
          onClick={() => props.onChange(FULL_AREA)}
        >
          {t('ctlAreaWhole')}
        </button>
      </div>
      <p class="settings-hint" id="area-hint">
        {t('ctlAreaHint')}
      </p>
    </div>
  );
}

/**
 * A live view of the camera while Webcam is on. The prompt it raises is the
 * extension origin's camera grant, the one the engine records with; a camera
 * that is blocked says so here, before the recording, instead of in the file.
 */
function CameraPreview(props: { on: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [state, setState] = useState<'off' | 'loading' | 'live' | MediaBlock>('off');

  useEffect(() => {
    if (!props.on) {
      setState('off');
      return;
    }
    let stream: MediaStream | null = null;
    let alive = true;
    setState('loading');
    navigator.mediaDevices
      .getUserMedia({ video: { width: { ideal: 1280 } }, audio: false })
      .then((s) => {
        if (!alive) {
          s.getTracks().forEach((track) => track.stop());
          return;
        }
        stream = s;
        if (videoRef.current) videoRef.current.srcObject = s;
        setState('live');
      })
      .catch((err: unknown) => {
        if (alive) setState(classifyMediaError(err));
      });
    return () => {
      alive = false;
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [props.on]);

  return (
    <div class="camera">
      <div class={`camera-view${state === 'live' ? ' live' : ''}`}>
        <video ref={videoRef} autoPlay muted playsInline />
        {state !== 'live' && (
          <span class="camera-placeholder">
            <IconCamera size={24} />
            {state === 'off'
              ? t('ctlCameraOff')
              : state === 'loading'
                ? t('ctlCameraLoading')
                : t('ctlCameraBlocked')}
          </span>
        )}
      </div>
      {state !== 'off' && state !== 'loading' && state !== 'live' && (
        <a class="control-link" href={SETUP_URL} target="_blank" rel="noreferrer">
          {t('ctlFixPermissions')}
        </a>
      )}
    </div>
  );
}

/**
 * Asks for the microphone once when Mic is turned on, so the prompt appears
 * here rather than not at all: the offscreen engine cannot show one. The
 * stream is closed at once; only the grant is kept.
 */
function MicCheck(props: { on: boolean }) {
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    setBlocked(false);
    if (!props.on) return;
    let alive = true;
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((s) => s.getTracks().forEach((track) => track.stop()))
      .catch(() => {
        if (alive) setBlocked(true);
      });
    return () => {
      alive = false;
    };
  }, [props.on]);

  if (!blocked) return null;
  return (
    <p class="control-note">
      <IconMic size={16} />
      {t('ctlMicBlocked')}{' '}
      <a class="control-link" href={SETUP_URL} target="_blank" rel="noreferrer">
        {t('ctlFixPermissions')}
      </a>
    </p>
  );
}
