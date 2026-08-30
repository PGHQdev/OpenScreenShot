import { describe, expect, it } from 'vitest';
import { checkDistFreshness } from '../../scripts/shots/render.mjs';

/**
 * `checkDistFreshness` is the pure decision `scripts/shots/render.mjs`'s
 * `assertDistFresh` calls after walking the file system — see that module's
 * doc comment. Missing beats stale: with no manifest there is nothing to
 * compare mtimes against yet. Source mtimes are compared against the oldest
 * file in dist/, so a build that failed part-way cannot pass on the strength
 * of the files it did write.
 */
describe('checkDistFreshness', () => {
  it('is fresh when the manifest exists and nothing under src/public/manifest.json is newer', () => {
    const result = checkDistFreshness({
      manifestExists: true,
      distOldestMtimeMs: 1000,
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
      distOldestMtimeMs: -Infinity,
      sourceFiles: [{ path: 'src/editor/App.tsx', mtimeMs: 500 }],
    });
    expect(result).toEqual({ fresh: false, reason: 'missing' });
  });

  it('reports missing even when a source file happens to be older than nothing', () => {
    const result = checkDistFreshness({
      manifestExists: false,
      distOldestMtimeMs: -Infinity,
      sourceFiles: [],
    });
    expect(result).toEqual({ fresh: false, reason: 'missing' });
  });

  it('reports stale with the single newest offending file when one source file is newer than dist', () => {
    const result = checkDistFreshness({
      manifestExists: true,
      distOldestMtimeMs: 1000,
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

  it('reports stale after a build that wrote some of dist/ and then failed', () => {
    // dist/ holds a file the failed build just wrote (5000) beside one the
    // last good build left (100); the source edited in between (2000) is
    // newer than that older output, and that is the comparison that matters.
    const result = checkDistFreshness({
      manifestExists: true,
      distOldestMtimeMs: Math.min(100, 5000),
      sourceFiles: [{ path: 'src/editor/App.tsx', mtimeMs: 2000 }],
    });
    expect(result).toEqual({
      fresh: false,
      reason: 'stale',
      file: 'src/editor/App.tsx',
      mtimeMs: 2000,
    });
  });

  it('treats a source file exactly as new as dist as fresh, not stale', () => {
    const result = checkDistFreshness({
      manifestExists: true,
      distOldestMtimeMs: 1000,
      sourceFiles: [{ path: 'manifest.json', mtimeMs: 1000 }],
    });
    expect(result).toEqual({ fresh: true });
  });
});
