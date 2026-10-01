import { describe, expect, it } from 'vitest';
import {
  applyCapturedTracks,
  DEFAULT_RECORDING_SETTINGS,
  FULL_AREA,
  normalizeArea,
  type RecordingSettings,
} from '../../src/shared/recording-types';

const asked: RecordingSettings = {
  ...DEFAULT_RECORDING_SETTINGS,
  mic: true,
  tabAudio: true,
  webcam: true,
};

describe('applyCapturedTracks', () => {
  it('keeps the settings when the engine reports nothing', () => {
    expect(applyCapturedTracks(asked, undefined)).toBe(asked);
  });

  it('drops a device the engine could not open', () => {
    const next = applyCapturedTracks(asked, { mic: false, webcam: true });
    expect(next.mic).toBe(false);
    expect(next.webcam).toBe(true);
  });

  it('drops both when the engine opened neither', () => {
    const next = applyCapturedTracks(asked, { mic: false, webcam: false });
    expect(next.mic).toBe(false);
    expect(next.webcam).toBe(false);
  });

  it('never adds a track the user left off', () => {
    const off = { ...asked, mic: false, webcam: false };
    const next = applyCapturedTracks(off, { mic: true, webcam: true });
    expect(next.mic).toBe(false);
    expect(next.webcam).toBe(false);
  });

  it('leaves tab audio and ripple alone', () => {
    const next = applyCapturedTracks(asked, { mic: false, webcam: false });
    expect(next.tabAudio).toBe(asked.tabAudio);
    expect(next.ripple).toBe(asked.ripple);
  });
});

describe('normalizeArea', () => {
  it('keeps a valid area', () => {
    expect(normalizeArea({ x: 0.1, y: 0.2, w: 0.5, h: 0.4 })).toEqual({
      x: 0.1,
      y: 0.2,
      w: 0.5,
      h: 0.4,
    });
  });

  it('clamps an area that runs past the viewport', () => {
    const area = normalizeArea({ x: -0.2, y: 0.5, w: 0.7, h: 0.9 });
    expect(area.x).toBe(0);
    expect(area.y).toBe(0.5);
    expect(area.w).toBeCloseTo(0.5);
    expect(area.h).toBeCloseTo(0.5);
  });

  it('falls back to the whole tab for malformed or tiny areas', () => {
    expect(normalizeArea(undefined)).toBe(FULL_AREA);
    expect(normalizeArea({ x: 0, y: 0, w: Number.NaN, h: 1 })).toBe(FULL_AREA);
    expect(normalizeArea({ x: 0.5, y: 0.5, w: 0.01, h: 0.5 })).toBe(FULL_AREA);
    expect(normalizeArea({ x: 1, y: 1, w: 0.5, h: 0.5 })).toBe(FULL_AREA);
  });
});
