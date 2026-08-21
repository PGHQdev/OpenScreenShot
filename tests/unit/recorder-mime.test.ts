import { describe, expect, it } from 'vitest';
import { pickRecorderMime } from '../../src/offscreen/mime';

describe('pickRecorderMime', () => {
  it('prefers vp9+opus', () => {
    expect(pickRecorderMime(() => true, false)).toBe('video/webm;codecs=vp9,opus');
  });
  it('falls back to vp8+opus', () => {
    expect(pickRecorderMime((t) => !t.includes('vp9'), false)).toBe('video/webm;codecs=vp8,opus');
  });
  it('falls back to bare webm', () => {
    expect(pickRecorderMime((t) => t === 'video/webm', false)).toBe('video/webm');
  });
  it('audio-only prefers opus', () => {
    expect(pickRecorderMime(() => true, true)).toBe('audio/webm;codecs=opus');
  });
  it('returns empty string when nothing matches (let MediaRecorder default)', () => {
    expect(pickRecorderMime(() => false, false)).toBe('');
  });
});
