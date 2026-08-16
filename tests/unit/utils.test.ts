import { describe, it, expect } from 'vitest';
import {
  formatFilename,
  sanitizeFilename,
  isProtectedUrl,
  insertToken,
  menuIdToMode,
  normalizeCaptureDelay,
  CAPTURE_DELAYS,
  FILENAME_TOKENS,
} from '../../src/shared/utils';

describe('formatFilename', () => {
  it('replaces date/time/w/h tokens', () => {
    const out = formatFilename('screenshot_{date}_{time}_{w}x{h}', { width: 1920, height: 1080 });
    expect(out).toMatch(/^screenshot_\d{4}-\d{2}-\d{2}_\d{6}_1920x1080$/);
  });

  it('sanitizes and truncates the title token', () => {
    const out = formatFilename('{title}', { title: 'a/b:c?d', width: 10, height: 10 });
    expect(out).toBe('a_b_c_d');
  });

  it('falls back to a default title when none is provided', () => {
    const out = formatFilename('{title}', { width: 1, height: 1 });
    expect(out).toBe('screenshot');
  });

  it('falls back to the default title when the title is empty', () => {
    const out = formatFilename('{title}', { title: '', width: 1, height: 1 });
    expect(out).toBe('screenshot');
  });

  it('resolves the domain token to the hostname', () => {
    const out = formatFilename('{domain}', {
      url: 'https://docs.example.com/a/b?q=1',
      width: 1,
      height: 1,
    });
    expect(out).toBe('docs.example.com');
  });

  it('strips a leading www. from the domain token', () => {
    const out = formatFilename('{domain}', {
      url: 'https://www.example.com/',
      width: 1,
      height: 1,
    });
    expect(out).toBe('example.com');
  });

  it('falls back to a default domain when no url is provided', () => {
    const out = formatFilename('{domain}', { width: 1, height: 1 });
    expect(out).toBe('page');
  });

  it('falls back to a default domain when the url has no host', () => {
    const out = formatFilename('{domain}', { url: 'file:///tmp/x.html', width: 1, height: 1 });
    expect(out).toBe('page');
  });

  it('falls back to a default domain when the url is unparsable', () => {
    const out = formatFilename('{domain}', { url: 'not a url', width: 1, height: 1 });
    expect(out).toBe('page');
  });
});

describe('sanitizeFilename', () => {
  it('replaces reserved characters with underscores', () => {
    expect(sanitizeFilename('my:file*name?')).toBe('my_file_name_');
  });
  it('trims surrounding whitespace', () => {
    expect(sanitizeFilename('  hi  ')).toBe('hi');
  });
});

describe('isProtectedUrl', () => {
  it('blocks chrome:// pages', () => {
    expect(isProtectedUrl('chrome://settings')).toBe(true);
  });
  it('blocks the web store', () => {
    expect(isProtectedUrl('https://chrome.google.com/webstore/detail/x')).toBe(true);
    expect(isProtectedUrl('https://chromewebstore.google.com/detail/x')).toBe(true);
  });
  it('allows normal https pages', () => {
    expect(isProtectedUrl('https://example.com')).toBe(false);
  });
  it('treats missing urls as protected', () => {
    expect(isProtectedUrl(undefined)).toBe(true);
  });
});

describe('insertToken', () => {
  it('splices the token at a collapsed caret', () => {
    const out = insertToken('shot_', 5, 5, '{date}');
    expect(out.value).toBe('shot_{date}');
    expect(out.caret).toBe(11);
  });

  it('replaces the selected range', () => {
    const out = insertToken('shot_{time}', 5, 11, '{date}');
    expect(out.value).toBe('shot_{date}');
    expect(out.caret).toBe(11);
  });

  it('clamps indices past the end of the value', () => {
    const out = insertToken('abc', 99, 99, '{w}');
    expect(out.value).toBe('abc{w}');
    expect(out.caret).toBe(6);
  });

  it('clamps a negative start and an inverted range', () => {
    const out = insertToken('abc', -5, -1, '{h}');
    expect(out.value).toBe('{h}abc');
    expect(out.caret).toBe(3);
  });
});

describe('FILENAME_TOKENS', () => {
  it('lists every token formatFilename replaces', () => {
    expect([...FILENAME_TOKENS]).toEqual(['{date}', '{time}', '{title}', '{domain}', '{w}', '{h}']);
  });
});

describe('menuIdToMode', () => {
  it('maps each capture menu item to its mode', () => {
    expect(menuIdToMode('oss-full-page')).toBe('full-page');
    expect(menuIdToMode('oss-visible')).toBe('visible');
    expect(menuIdToMode('oss-region')).toBe('region');
  });

  it('returns null for unknown ids (parent item, other extensions)', () => {
    expect(menuIdToMode('oss-parent')).toBe(null);
    expect(menuIdToMode('')).toBe(null);
  });
});

describe('normalizeCaptureDelay', () => {
  it('keeps every supported delay value', () => {
    for (const d of CAPTURE_DELAYS) expect(normalizeCaptureDelay(d)).toBe(d);
  });

  it('falls back to 0 for unsupported numbers', () => {
    expect(normalizeCaptureDelay(1)).toBe(0);
    expect(normalizeCaptureDelay(7)).toBe(0);
    expect(normalizeCaptureDelay(-3)).toBe(0);
  });

  it('falls back to 0 for non-numbers from old stored settings', () => {
    expect(normalizeCaptureDelay(undefined)).toBe(0);
    expect(normalizeCaptureDelay('5')).toBe(0);
    expect(normalizeCaptureDelay(null)).toBe(0);
  });
});
