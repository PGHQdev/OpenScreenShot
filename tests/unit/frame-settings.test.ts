import { describe, it, expect } from 'vitest';
import { DEFAULT_SETTINGS } from '../../src/shared/types';
import {
  applyLook,
  DEFAULT_FRAME,
  FRAME_LOOKS,
  frameFromSettings,
  frameToSettings,
  normalizeBackground,
  type FrameOptions,
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
      // These four values are no look's, so none is derived on the way back.
      look: null,
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

describe('looks through settings', () => {
  it('reads a stored look back from its values, for every look', () => {
    for (const l of FRAME_LOOKS) {
      const frame: FrameOptions = { ...DEFAULT_FRAME, ...applyLook(l.id) };
      const stored = { ...DEFAULT_SETTINGS, ...frameToSettings(frame) };
      expect(frameFromSettings(stored)).toEqual(frame);
    }
  });

  it('does not write a look id — the four values are the whole record', () => {
    // frameToSettings is typed as a Pick of Settings, so a look id could only
    // reach storage by widening the shared Settings contract.
    const stored = frameToSettings({ ...DEFAULT_FRAME, ...applyLook('poster') });
    expect(Object.keys(stored).sort()).toEqual([
      'beautifyBackground',
      'beautifyEnabled',
      'beautifyPadding',
      'beautifyRadius',
      'beautifyShadow',
    ]);
  });

  it('loses only the mark, never a value, when an adjusted look round-trips', () => {
    // The disclosed limit of deriving the look from the values: after an
    // editor restart with no draft to restore, a look that was adjusted comes
    // back as no look selected. Every slider value is exact.
    const adjusted: FrameOptions = { ...DEFAULT_FRAME, ...applyLook('poster'), padding: 33 };
    const back = frameFromSettings({ ...DEFAULT_SETTINGS, ...frameToSettings(adjusted) });
    expect(back.look).toBeNull();
    expect(back).toEqual({ ...adjusted, look: null });
  });

  it('gives a settings blob written before looks existed the look it matches', () => {
    // v1.3.0 stored these four keys and nothing else; the shipped defaults are
    // the Clean look, so an untouched install opens with Clean selected.
    const old = {
      ...DEFAULT_SETTINGS,
      beautifyEnabled: true,
      beautifyPadding: 40,
      beautifyRadius: 30,
      beautifyShadow: 45,
      beautifyBackground: { kind: 'preset', id: 'ink' } as const,
    };
    expect(frameFromSettings(old).look).toBe('clean');
  });
});
