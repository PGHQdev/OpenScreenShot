import { describe, expect, it } from 'vitest';
import { checkDistFreshness } from '../../scripts/shots/render.mjs';

/**
 * `checkDistFreshness` is the pure decision `scripts/shots/render.mjs`'s
 * `assertDistFresh` calls after walking the file system — see that module's
 * doc comment. Missing beats stale: with no manifest there is nothing to
 * compare mtimes against yet.
 */
describe('checkDistFreshness', () => {
  it('is fresh when the manifest exists and nothing under src/public/manifest.json is newer', () => {
    const result = checkDistFreshness({
      manifestExists: true,
      distNewestMtimeMs: 1000,
      sourceFiles: [
        { path: 'src/editor/App.tsx', mtimeMs: 500 },
        { path: 'manifest.json', mtimeMs: 900 },
      ],
    });
    expect(result).toEqual({ fresh: true });
  });

  it('reports missing when dist/manifest.json does not exist, regardless of source mtimes', () => {
    const result = checkDistFreshness({
      manifestExists: false,
      distNewestMtimeMs: -Infinity,
      sourceFiles: [{ path: 'src/editor/App.tsx', mtimeMs: 500 }],
    });
    expect(result).toEqual({ fresh: false, reason: 'missing' });
  });

  it('reports missing even when a source file happens to be older than nothing', () => {
    const result = checkDistFreshness({
      manifestExists: false,
      distNewestMtimeMs: -Infinity,
      sourceFiles: [],
    });
    expect(result).toEqual({ fresh: false, reason: 'missing' });
  });

  it('reports stale with the single newest offending file when one source file is newer than dist', () => {
    const result = checkDistFreshness({
      manifestExists: true,
      distNewestMtimeMs: 1000,
      sourceFiles: [
        { path: 'src/editor/App.tsx', mtimeMs: 1500 },
        { path: 'src/editor/useEditor.ts', mtimeMs: 2000 },
        { path: 'manifest.json', mtimeMs: 900 },
      ],
    });
    expect(result).toEqual({
      fresh: false,
      reason: 'stale',
      file: 'src/editor/useEditor.ts',
      mtimeMs: 2000,
    });
  });

  it('treats a source file exactly as new as dist as fresh, not stale', () => {
    const result = checkDistFreshness({
      manifestExists: true,
      distNewestMtimeMs: 1000,
      sourceFiles: [{ path: 'manifest.json', mtimeMs: 1000 }],
    });
    expect(result).toEqual({ fresh: true });
  });
});
