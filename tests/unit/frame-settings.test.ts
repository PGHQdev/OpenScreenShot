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

  it('writes the look id alongside the four values', () => {
    const stored = frameToSettings({ ...DEFAULT_FRAME, ...applyLook('poster') });
    expect(Object.keys(stored).sort()).toEqual([
      'beautifyBackground',
      'beautifyEnabled',
      'beautifyLook',
      'beautifyPadding',
      'beautifyRadius',
      'beautifyShadow',
    ]);
    expect(stored.beautifyLook).toBe('poster');
  });

  it('brings an adjusted look back as that look, values and all', () => {
    // The case the values alone cannot spell out: padding 33 matches no look,
    // so only the stored id says which one the user was adjusting.
    const adjusted: FrameOptions = { ...DEFAULT_FRAME, ...applyLook('poster'), padding: 33 };
    const back = frameFromSettings({ ...DEFAULT_SETTINGS, ...frameToSettings(adjusted) });
    expect(back).toEqual(adjusted);
  });

  it('reads a junk stored look id as none, falling back to the values', () => {
    const stored = { ...DEFAULT_SETTINGS, beautifyLook: 'gorgeous' as unknown as null };
    expect(frameFromSettings(stored).look).toBe('clean');
  });

  it('gives a settings blob written before looks existed the look it matches', () => {
    // What every 1.3.0 install holds: the five beautify keys and no
    // beautifyLook. getSettings spreads the stored object over
    // DEFAULT_SETTINGS, so the missing key arrives as null and the look is
    // read off the values instead.
    const stored = {
      beautifyEnabled: true,
      beautifyPadding: 40,
      beautifyRadius: 30,
      beautifyShadow: 45,
      beautifyBackground: { kind: 'preset', id: 'ink' } as const,
    };
    expect('beautifyLook' in stored).toBe(false);
    const merged = { ...DEFAULT_SETTINGS, ...stored };
    expect(merged.beautifyLook).toBeNull();
    expect(frameFromSettings(merged).look).toBe('clean');
  });

  it('leaves an upgrading install that had adjusted its frame on no look', () => {
    // The other half of the upgrade: values nobody's look sets stay honest
    // rather than being claimed by the default.
    const merged = { ...DEFAULT_SETTINGS, beautifyPadding: 41 };
    expect(frameFromSettings(merged).look).toBeNull();
  });
});
