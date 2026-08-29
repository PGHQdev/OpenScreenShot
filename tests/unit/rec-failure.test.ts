import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  REC_FAILURE_CODES,
  REC_FAILURE_KEY,
  isRecFailure,
  isRecFailureCode,
  recFailureMessageKey,
  sameRun,
  supersedes,
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

describe('supersedes', () => {
  it('lets a lost recording retire a lost cursor track', () => {
    expect(supersedes('chunk-write-failed', 'events-write-failed')).toBe(true);
  });

  it('does not let it go the other way', () => {
    expect(supersedes('events-write-failed', 'chunk-write-failed')).toBe(false);
  });

  it('leaves unrelated failures standing side by side', () => {
    expect(supersedes('chunk-write-failed', 'export-failed')).toBe(false);
    expect(supersedes('start-failed', 'engine-failed')).toBe(false);
  });

  it('does not supersede itself', () => {
    for (const code of REC_FAILURE_CODES) expect(supersedes(code, code)).toBe(false);
  });

  it('has no cycle: a superseded code supersedes nothing that supersedes it', () => {
    for (const a of REC_FAILURE_CODES) {
      for (const b of REC_FAILURE_CODES) {
        if (supersedes(a, b)) expect(supersedes(b, a)).toBe(false);
      }
    }
  });
});

describe('sameRun', () => {
  it('matches two failures from the same recording', () => {
    expect(sameRun({ sessionId: 'a' }, { sessionId: 'a' })).toBe(true);
  });

  it('separates two recordings', () => {
    expect(sameRun({ sessionId: 'a' }, { sessionId: 'b' })).toBe(false);
  });

  it('treats a failure with no run as its own case, never any run', () => {
    expect(sameRun({}, {})).toBe(true);
    expect(sameRun({ sessionId: 'a' }, {})).toBe(false);
    expect(sameRun({}, { sessionId: 'a' })).toBe(false);
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

  it('accepts and rejects a run id by its type', () => {
    expect(isRecFailure({ code: 'engine-failed', at: 1, sessionId: 'sess-1' })).toBe(true);
    expect(isRecFailure({ code: 'engine-failed', at: 1, sessionId: 7 })).toBe(false);
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
   * Pinning the count means adding a mode without a message — or dropping one
   * — is a test failure rather than a silent regression. Eighteen, not the
   * plan's estimated eleven: the enumeration reads the code (see
   * task-32-report.md §1), review rounds 1-3 found four more, and task 33
   * added the stalled engine a Stop cannot get an answer out of.
   */
  it('covers eighteen', () => {
    const codes: RecFailureCode[] = [
      'start-unreachable',
      'start-blocked',
      'start-busy',
      'start-failed',
      'cleanup-failed',
      'engine-failed',
      'engine-unreachable',
      'engine-stalled',
      'query-failed',
      'overlay-blocked',
      'overlay-lost',
      'control-unreachable',
      'session-load-failed',
      'segment-skipped',
      'export-failed',
      'chunk-write-failed',
      'events-write-failed',
      'recorder-open-failed',
    ];
    expect([...REC_FAILURE_CODES].sort()).toEqual([...codes].sort());
  });
});
