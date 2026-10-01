import { describe, expect, it } from 'vitest';
import { canRecordMp4, pickExportMime, pickRecorderMime } from '../../src/offscreen/mime';

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

describe('pickExportMime', () => {
  it('asks for H.264 + AAC first for MP4', () => {
    expect(pickExportMime(() => true, 'mp4')).toBe('video/mp4;codecs=avc1,mp4a.40.2');
  });
  it('returns empty for MP4 where MediaRecorder cannot write it, never a WebM type', () => {
    expect(pickExportMime((t) => t.startsWith('video/webm'), 'mp4')).toBe('');
  });
  it('keeps the WebM preference order for WebM', () => {
    expect(pickExportMime(() => true, 'webm')).toBe('video/webm;codecs=vp9,opus');
  });
});

describe('canRecordMp4', () => {
  it('is true when any MP4 type is supported', () => {
    expect(canRecordMp4((t) => t === 'video/mp4')).toBe(true);
  });
  it('is false for a WebM-only recorder (Firefox)', () => {
    expect(canRecordMp4((t) => t.startsWith('video/webm'))).toBe(false);
  });
});
