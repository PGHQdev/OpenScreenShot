import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  REC_FAILURE_CODES,
  REC_FAILURE_KEY,
  isRecFailure,
  isRecFailureCode,
  recFailureMessageKey,
  type RecFailure,
  type RecFailureCode,
} from '../../src/shared/rec-failure';

const ROOT = join(__dirname, '../..');

interface LocaleEntry {
  message: string;
  description?: string;
}

const locale = JSON.parse(
  readFileSync(join(ROOT, 'public/_locales/en/messages.json'), 'utf8'),
) as Record<string, LocaleEntry>;

function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...sourceFiles(path));
    else if (/\.(ts|tsx)$/.test(entry.name) && entry.name !== 'rec-failure.ts') out.push(path);
  }
  return out;
}

const sources = sourceFiles(join(ROOT, 'src')).map((path) => readFileSync(path, 'utf8'));

describe('recFailureMessageKey', () => {
  it('maps every failure code to a key', () => {
    expect(REC_FAILURE_CODES.length).toBeGreaterThan(0);
    for (const code of REC_FAILURE_CODES) {
      expect(recFailureMessageKey(code), `no key for ${code}`).toMatch(/^rec[A-Z]/);
    }
  });

  it('gives every code its own key', () => {
    const keys = REC_FAILURE_CODES.map(recFailureMessageKey);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('resolves every key to a real string in messages.json', () => {
    for (const code of REC_FAILURE_CODES) {
      const key = recFailureMessageKey(code);
      const entry = locale[key];
      expect(entry, `${key} is missing from messages.json`).toBeDefined();
      expect(entry.message.trim(), `${key} has an empty message`).not.toBe('');
      expect(entry.description?.trim(), `${key} has no description`).toBeTruthy();
    }
  });

  /**
   * Two failures that read the same are two failures the user cannot tell
   * apart, which is the state this whole mapping exists to end.
   */
  it('shows a different sentence for every failure', () => {
    const shown = REC_FAILURE_CODES.map((code) => locale[recFailureMessageKey(code)].message);
    expect(new Set(shown).size).toBe(shown.length);
  });
});

/**
 * A code nothing reports is a mode that was enumerated and then never wired
 * up — the exact way this task could look finished while a failure stayed
 * silent. The reverse direction needs no test: a call site naming a code that
 * is not in the union does not compile.
 */
describe('failure coverage', () => {
  it('has a call site somewhere in src/ for every code', () => {
    for (const code of REC_FAILURE_CODES) {
      const reported = sources.some((src) => src.includes(`'${code}'`));
      expect(reported, `nothing in src/ ever reports '${code}'`).toBe(true);
    }
  });
});

describe('isRecFailureCode', () => {
  it('accepts every known code', () => {
    for (const code of REC_FAILURE_CODES) expect(isRecFailureCode(code)).toBe(true);
  });

  it('rejects anything else', () => {
    expect(isRecFailureCode('start-exploded')).toBe(false);
    expect(isRecFailureCode('')).toBe(false);
    expect(isRecFailureCode(3)).toBe(false);
    expect(isRecFailureCode(undefined)).toBe(false);
    // Object.prototype members must not read as codes.
    expect(isRecFailureCode('toString')).toBe(false);
    expect(isRecFailureCode('constructor')).toBe(false);
  });
});

describe('isRecFailure', () => {
  const good: RecFailure = { code: 'engine-failed', at: 1_700_000_000_000 };

  it('accepts a well-formed parked failure', () => {
    expect(isRecFailure(good)).toBe(true);
  });

  it('rejects a code this build does not know', () => {
    expect(isRecFailure({ code: 'from-a-newer-build', at: 1 })).toBe(false);
  });

  it('rejects a record with no timestamp', () => {
    expect(isRecFailure({ code: 'engine-failed' })).toBe(false);
    expect(isRecFailure({ code: 'engine-failed', at: 'now' })).toBe(false);
  });

  it('rejects non-objects', () => {
    expect(isRecFailure(null)).toBe(false);
    expect(isRecFailure(undefined)).toBe(false);
    expect(isRecFailure('engine-failed')).toBe(false);
    expect(isRecFailure(7)).toBe(false);
  });
});

describe('REC_FAILURE_KEY', () => {
  it('is namespaced like the other session keys', () => {
    expect(REC_FAILURE_KEY.startsWith('openscreenshot:')).toBe(true);
  });

  it('is the key the popup reads and the worker writes', () => {
    const readers = sources.filter((src) => src.includes('REC_FAILURE_KEY'));
    expect(readers.length).toBeGreaterThanOrEqual(2);
  });
});

describe('the enumerated modes', () => {
  /**
   * The plan's audit counted the ways a recording can fail. Pinning the count
   * here means adding a mode without a message — or dropping one — is a test
   * failure rather than a silent regression.
   */
  it('covers thirteen', () => {
    const codes: RecFailureCode[] = [
      'start-unreachable',
      'start-blocked',
      'start-busy',
      'start-failed',
      'cleanup-failed',
      'engine-failed',
      'query-failed',
      'overlay-blocked',
      'overlay-lost',
      'control-unreachable',
      'session-load-failed',
      'segment-skipped',
      'export-failed',
    ];
    expect([...REC_FAILURE_CODES].sort()).toEqual([...codes].sort());
  });
});
