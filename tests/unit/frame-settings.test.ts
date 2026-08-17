import { describe, it, expect } from 'vitest';
import { DEFAULT_SETTINGS } from '../../src/shared/types';
import {
  DEFAULT_FRAME,
  frameFromSettings,
  frameToSettings,
  normalizeBackground,
} from '../../src/editor/frame';

describe('normalizeBackground', () => {
  it('keeps a known preset', () => {
    expect(normalizeBackground({ kind: 'preset', id: 'coral' })).toEqual({
      kind: 'preset',
      id: 'coral',
    });
  });

  it('keeps a solid colour, normalised to lowercase hex', () => {
    expect(normalizeBackground({ kind: 'solid', color: '#ABCDEF' })).toEqual({
      kind: 'solid',
      color: '#abcdef',
    });
  });

  it('keeps transparent', () => {
    expect(normalizeBackground({ kind: 'transparent' })).toEqual({ kind: 'transparent' });
  });

  it('falls back to the default for junk, so bad storage cannot break the editor', () => {
    expect(normalizeBackground(null)).toEqual(DEFAULT_FRAME.background);
    expect(normalizeBackground({ kind: 'preset', id: 'nope' })).toEqual(DEFAULT_FRAME.background);
    expect(normalizeBackground({ kind: 'solid', color: 'red' })).toEqual(DEFAULT_FRAME.background);
    expect(normalizeBackground('gradient')).toEqual(DEFAULT_FRAME.background);
  });
});

describe('frame settings round-trip', () => {
  it('reads the defaults out of DEFAULT_SETTINGS', () => {
    expect(frameFromSettings(DEFAULT_SETTINGS)).toEqual(DEFAULT_FRAME);
  });

  it('survives a round-trip through settings', () => {
    const frame = {
      enabled: true,
      padding: 55,
      radius: 10,
      shadow: 0,
      background: { kind: 'solid', color: '#101010' } as const,
    };
    const stored = { ...DEFAULT_SETTINGS, ...frameToSettings(frame) };
    expect(frameFromSettings(stored)).toEqual(frame);
  });

  it('clamps stored slider values that fall outside 0..100', () => {
    const stored = { ...DEFAULT_SETTINGS, beautifyPadding: 999, beautifyShadow: -3 };
    const frame = frameFromSettings(stored);
    expect(frame.padding).toBe(100);
    expect(frame.shadow).toBe(0);
  });

  it('beautify ships off', () => {
    expect(DEFAULT_SETTINGS.beautifyEnabled).toBe(false);
  });
});
