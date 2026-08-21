import { describe, expect, it } from 'vitest';
import {
  applyCapturedTracks,
  DEFAULT_RECORDING_SETTINGS,
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
