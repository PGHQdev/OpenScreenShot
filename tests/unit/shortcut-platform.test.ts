import { describe, it, expect } from 'vitest';
import { isMacPlatform, modKey } from '../../src/editor/ShortcutSheet';

describe('isMacPlatform', () => {
  it('is true for a macOS platform string', () => {
    expect(isMacPlatform('MacIntel')).toBe(true);
  });

  it('is false for a Windows platform string', () => {
    expect(isMacPlatform('Win32')).toBe(false);
  });

  it('is false for a Linux platform string', () => {
    expect(isMacPlatform('Linux x86_64')).toBe(false);
  });
});

describe('modKey', () => {
  it('renders the Mac glyph on macOS', () => {
    expect(modKey(true)).toBe('⌘');
  });

  it('renders the Ctrl word off macOS', () => {
    expect(modKey(false)).toBe('Ctrl+');
  });
});
