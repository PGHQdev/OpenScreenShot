import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';

/**
 * src/shared/design-tokens.ts is generated from src/shared/tokens.css and
 * committed, so `npm run typecheck` works from a clean checkout. This test is
 * what stops the committed copy from drifting: editing tokens.css without
 * running `npm run tokens` fails here, and so does hand-editing the module.
 */
describe('design-tokens.ts', () => {
  it('matches tokens.css', () => {
    let status = 0;
    let message = '';
    try {
      execFileSync('node', ['scripts/gen-design-tokens.mjs', '--check'], { encoding: 'utf8' });
    } catch (err) {
      const e = err as { status?: number; stderr?: string };
      status = e.status ?? 1;
      message = (e.stderr ?? '').trim();
    }
    expect(status, message).toBe(0);
  });
});
