/**
 * The site's one write endpoint. It is the only place the project stores
 * something a person typed, so what it accepts, what it refuses, and — above
 * all — what it writes are pinned here rather than left to the route's shape.
 *
 * The INSERT assertions are the point: PRIVACY.md and the privacy page promise
 * four columns and no fifth. A parameter added to that statement should fail
 * this file before it reaches the database.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
// @ts-expect-error -- plain JS Worker entry, no types of its own
import worker from '../../site-worker.js';

type Bound = unknown[];

let bound: Bound[];
let runFails: boolean;
/**
 * The rate limiter is per-isolate module state, so it outlives a test the way
 * it outlives a request. Each test gets its own address; only the rate-limit
 * test below deliberately reuses one.
 */
let testIp: string;
let ipCounter = 0;

function makeEnv() {
  bound = [];
  runFails = false;
  return {
    FEEDBACK_DB: {
      prepare: (sql: string) => ({
        bind: (...args: Bound) => {
          bound.push([sql, ...args]);
          return {
            run: () =>
              runFails ? Promise.reject(new Error('d1 down')) : Promise.resolve({ success: true }),
          };
        },
      }),
    },
    ASSETS: { fetch: vi.fn(() => Promise.resolve(new Response('asset'))) },
  };
}

let env: ReturnType<typeof makeEnv>;

function post(body: unknown, init: RequestInit = {}, ip = testIp) {
  return new Request('https://openscreenshot.app/api/feedback', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'CF-Connecting-IP': ip, ...init.headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
    ...init,
  });
}

const send = (req: Request) => worker.fetch(req, env) as Promise<Response>;

beforeEach(() => {
  env = makeEnv();
  testIp = `203.0.113.${(ipCounter += 1)}`;
});

describe('POST /api/feedback', () => {
  it('writes exactly the four disclosed columns, and nothing else', async () => {
    const res = await send(
      post({
        message: '  full page missed the footer  ',
        contact: 'someone@example.com',
        version: '2.0.0',
        locale: 'pt-br',
        // Fields nobody disclosed. They must not reach the statement.
        ip: '198.51.100.9',
        userAgent: 'Mozilla/5.0',
        url: 'https://internal.example.com/dashboard',
      }),
    );
    expect(res.status).toBe(201);
    expect(bound).toHaveLength(1);
    const [sql, ...args] = bound[0];
    expect(String(sql)).toBe(
      'INSERT INTO feedback (version, locale, message, contact) VALUES (?, ?, ?, ?)',
    );
    expect(args).toEqual(['2.0.0', 'pt-br', 'full page missed the footer', 'someone@example.com']);
  });

  it('defaults a missing version and locale rather than storing junk', async () => {
    await send(post({ message: 'hi' }));
    expect(bound[0].slice(1, 3)).toEqual(['unknown', 'en']);
  });

  it('drops a version or locale that is not shaped like one', async () => {
    await send(post({ message: 'hi', version: "2.0.0'; DROP TABLE feedback--", locale: 'EN_US!' }));
    expect(bound[0].slice(1, 3)).toEqual(['unknown', 'en']);
  });

  it('caps the message and the contact address', async () => {
    await send(post({ message: 'x'.repeat(9000), contact: `${'y'.repeat(400)}@example.com` }));
    const [, , , message, contact] = bound[0] as [string, string, string, string, string];
    expect(message).toHaveLength(4000);
    expect(contact).toHaveLength(200);
  });

  it('refuses an empty or whitespace-only message', async () => {
    for (const message of ['', '   ', undefined]) {
      const res = await send(post({ message }));
      expect(res.status).toBe(400);
    }
    expect(bound).toEqual([]);
  });

  it('refuses a body that is not JSON', async () => {
    expect((await send(post('not json at all'))).status).toBe(400);
    expect(bound).toEqual([]);
  });

  it('refuses anything but POST', async () => {
    const res = await send(new Request('https://openscreenshot.app/api/feedback'));
    expect(res.status).toBe(405);
  });

  it('refuses a cross-origin post', async () => {
    const res = await send(post({ message: 'hi' }, { headers: { Origin: 'https://evil.test' } }));
    expect(res.status).toBe(403);
    expect(bound).toEqual([]);
  });

  it('accepts the page posting from its own origin', async () => {
    const res = await send(
      post({ message: 'hi' }, { headers: { Origin: 'https://openscreenshot.app' } }),
    );
    expect(res.status).toBe(201);
  });

  it('rate limits one address, and lets a different one through', async () => {
    for (let i = 0; i < 5; i++) expect((await send(post({ message: `n${i}` }))).status).toBe(201);
    expect((await send(post({ message: 'over' }))).status).toBe(429);
    expect((await send(post({ message: 'other' }, {}, '198.51.100.4'))).status).toBe(201);
    expect(bound).toHaveLength(6);
  });

  it('answers 503 when the binding is missing rather than pretending it saved', async () => {
    env = { ...env, FEEDBACK_DB: undefined } as unknown as ReturnType<typeof makeEnv>;
    expect((await send(post({ message: 'hi' }))).status).toBe(503);
  });

  it('answers 500 when the write fails, so the page can offer the mail address', async () => {
    const res = await send(post({ message: 'hi' }));
    expect(res.status).toBe(201);
    runFails = true;
    expect((await send(post({ message: 'hi again' }))).status).toBe(500);
  });

  it('leaves every other path to the asset handler', async () => {
    const res = await send(new Request('https://openscreenshot.app/uninstall/'));
    expect(res.status).toBe(200);
    expect(env.ASSETS.fetch).toHaveBeenCalled();
  });
});
