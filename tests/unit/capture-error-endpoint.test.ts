import { beforeEach, describe, expect, it, vi } from 'vitest';
// @ts-expect-error -- plain JS Worker entry
import worker from '../../site-worker.js';

let bound: unknown[][];
let env: { FEEDBACK_DB: unknown; ASSETS: { fetch: ReturnType<typeof vi.fn> } };
let counter = 0;

beforeEach(() => {
  bound = [];
  env = {
    FEEDBACK_DB: {
      prepare: (sql: string) => ({
        bind: (...args: unknown[]) => {
          bound.push([sql, ...args]);
          return { run: vi.fn(async () => ({ success: true })) };
        },
      }),
    },
    ASSETS: { fetch: vi.fn(() => Promise.resolve(new Response('asset'))) },
  };
});

function post(body: unknown, headers: Record<string, string> = {}) {
  return new Request('https://openscreenshot.app/api/capture-errors', {
    method: 'POST',
    headers: { 'content-type': 'application/json', Origin: 'chrome-extension://abcdefghijklmnopabcdefghijklmnop', ...headers },
    body: JSON.stringify(body),
  });
}

describe('POST /api/capture-errors', () => {
  it('inserts the bounded report fields and returns 201', async () => {
    const response = await worker.fetch(
      post({
        code: 'unknown',
        message: 'Capture failed unexpectedly.',
        detail: 'Cannot access contents of the page',
        version: '2.1.4',
        locale: 'en',
        url: 'https://example.com/page',
        title: 'Example',
        screenshot: 'must be ignored',
      }),
      env,
    );
    expect(response.status).toBe(201);
    expect(bound).toEqual([
      [
        'INSERT INTO capture_error_reports (code, message, detail, version, locale, url, title) VALUES (?, ?, ?, ?, ?, ?, ?)',
        'unknown',
        'Capture failed unexpectedly.',
        'Cannot access contents of the page',
        '2.1.4',
        'en',
        'https://example.com/page',
        'Example',
      ],
    ]);
  });

  it('rejects malformed or empty reports without writing', async () => {
    expect((await worker.fetch(post({ message: '' }), env)).status).toBe(400);
    expect((await worker.fetch(post('not-json'), env)).status).toBe(400);
    expect(bound).toEqual([]);
  });

  it('caps fields and rejects an untrusted origin', async () => {
    await worker.fetch(
      post({ message: 'x'.repeat(5000), detail: 'y'.repeat(5000), url: 'z'.repeat(3000), title: 'q'.repeat(900) }),
      env,
    );
    expect((bound[0]?.[2] as string).length).toBe(4000);
    expect((bound[0]?.[3] as string).length).toBe(4000);
    expect((bound[0]?.[6] as string).length).toBe(2000);
    expect((bound[0]?.[7] as string).length).toBe(500);
    const rejected = await worker.fetch(post({ message: 'nope' }, { Origin: 'https://evil.test' }), env);
    expect(rejected.status).toBe(403);
  });

  it('accepts site and extension origins and rejects non-POST', async () => {
    expect((await worker.fetch(post({ message: 'ok' }, { Origin: 'https://openscreenshot.app' }), env)).status).toBe(201);
    expect((await worker.fetch(post({ message: 'ok' }, { Origin: 'moz-extension://extension-id' }), env)).status).toBe(201);
    expect((await worker.fetch(new Request('https://openscreenshot.app/api/capture-errors'), env)).status).toBe(405);
    counter++;
    expect(counter).toBeGreaterThan(0);
  });
});
