import { describe, expect, it } from 'vitest';
import { exportGeometry } from '../../src/recorder/export-video';
import { defaultRecorderDraft } from '../../src/recorder/recorder-draft';
import { drawExportFrame } from '../../src/recorder/render';
import type { LoadedSession } from '../../src/recorder/session-load';
import { IDENTITY_CAMERA } from '../../src/recorder/zoom';
import type { RecordingArea } from '../../src/shared/recording-types';

function loaded(area?: RecordingArea): LoadedSession {
  return {
    session: {} as LoadedSession['session'],
    segments: [
      {
        segment: {
          id: 's',
          sessionId: 'x',
          index: 0,
          startedAt: 0,
          duration: 1000,
          viewport: { w: 1000, h: 500, dpr: 2 },
          hasWebcam: false,
          ...(area ? { area } : {}),
        },
        tabUrl: '',
        webcamUrl: null,
        durationMs: 1000,
        events: [],
      },
    ],
    hasAudio: { tab: false, mic: false },
  };
}

/** A 2D context that records drawImage calls and ignores everything else. */
function recordingContext(): { ctx: CanvasRenderingContext2D; draws: number[][] } {
  const draws: number[][] = [];
  const ctx = new Proxy(
    {},
    {
      get(_target, prop) {
        if (prop === 'drawImage') return (_img: unknown, ...args: number[]) => draws.push(args);
        return () => {};
      },
      set: () => true,
    },
  ) as CanvasRenderingContext2D;
  return { ctx, draws };
}

describe('recording area', () => {
  it('sizes the export to the area of the first segment', () => {
    const draft = defaultRecorderDraft();
    expect(exportGeometry(loaded(), draft)).toMatchObject({ width: 2000, height: 1000 });
    expect(exportGeometry(loaded({ x: 0.5, y: 0, w: 0.5, h: 0.5 }), draft)).toMatchObject({
      width: 1000,
      height: 500,
    });
  });

  it('reads only the area out of the tab frame', () => {
    const area = { x: 0.5, y: 0.25, w: 0.5, h: 0.5 };
    const draft = defaultRecorderDraft();
    const { width, height, frame, metrics } = exportGeometry(loaded(area), draft);
    const { ctx, draws } = recordingContext();
    drawExportFrame(ctx, width, height, {
      tab: {} as CanvasImageSource,
      tabW: 2000,
      tabH: 1000,
      area,
      webcam: null,
      webcamW: 0,
      webcamH: 0,
      camera: IDENTITY_CAMERA,
      ripples: [],
      cursor: null,
      bubble: null,
      frame,
      frameMetrics: metrics,
    });
    expect(draws).toEqual([[1000, 250, 1000, 500, 0, 0, 1000, 500]]);
  });
});
