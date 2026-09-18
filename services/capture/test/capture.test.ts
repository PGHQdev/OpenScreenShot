import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { Miniflare, convertV4MiniflareOptions } from 'miniflare';
import { readFile, readdir } from 'node:fs/promises';
import worker, { app, processJob, recover } from '../src/index';

const KEY = 'test-secret-with-at-least-32-characters';
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aZ1cAAAAASUVORK5CYII=',
  'base64',
);
let mf: Miniflare;
let env: any;
let sent: string[];
let calls: number;
const base = 'https://capture.test';
const headers = {
  authorization: `Bearer ${KEY}`,
  'content-type': 'application/json',
  'idempotency-key': 'test-request-0001',
};
async function request(path: string, init: RequestInit = {}) {
  return app.fetch(new Request(base + path, init), env);
}
async function create(key = 'test-request-0001', body: unknown = { url: 'https://example.com/' }) {
  return request('/v1/captures', {
    method: 'POST',
    headers: { ...headers, 'idempotency-key': key },
    body: JSON.stringify(body),
  });
}
async function job(id: string) {
  return (await request(`/v1/captures/${id}`, { headers })).json() as Promise<any>;
}
async function row(id: string) {
  return env.DB.prepare('SELECT * FROM jobs WHERE id=?').bind(id).first();
}

beforeAll(async () => {
  mf = new Miniflare(
    convertV4MiniflareOptions({
      modules: true,
      script: 'export default { fetch() { return new Response("ok") } }',
      compatibilityDate: '2026-09-13',
      d1Databases: ['DB'],
      r2Buckets: ['ARTIFACTS'],
    }),
  );
  const db = await mf.getD1Database('DB');
  const migrations = new URL('../migrations/', import.meta.url);
  for (const file of (await readdir(migrations)).filter((file) => file.endsWith('.sql')).sort()) {
    const sql = await readFile(new URL(file, migrations), 'utf8');
    let remaining = sql.trim();
    while (remaining) {
      const end = remaining.startsWith('CREATE TRIGGER')
        ? remaining.indexOf('END;') + 4
        : remaining.indexOf(';') + 1;
      if (!end) throw Error('Invalid migration');
      await db.prepare(remaining.slice(0, end)).run();
      remaining = remaining.slice(end).trim();
    }
  }
});
beforeEach(async () => {
  sent = [];
  calls = 0;
  env = {
    DB: await mf.getD1Database('DB'),
    ARTIFACTS: await mf.getR2Bucket('ARTIFACTS'),
    CAPTURE_API_KEY: KEY,
    ALLOWED_HOSTS: 'example.com,openscreenshot.app',
    DAILY_JOB_LIMIT: '20',
    ACTIVE_JOB_LIMIT: '5',
    CAPTURE_QUEUE: {
      async send(body: { id: string }) {
        sent.push(body.id);
      },
    },
    BROWSER: {
      async quickAction(_action: string, options: any) {
        calls++;
        expect(options.scrollPage).toBe(true);
        expect(options.screenshotOptions.fullPage).toBe(true);
        return new Response(PNG, {
          headers: { 'content-type': 'image/png', 'x-browser-ms-used': '1234.5' },
        });
      },
    },
  };
  await env.DB.prepare('DELETE FROM jobs').run();
  await env.DB.prepare('DELETE FROM beta_daily').run();
  await env.DB.prepare('DELETE FROM beta_activity').run();
  const objects = await env.ARTIFACTS.list();
  if (objects.objects.length) await env.ARTIFACTS.delete(objects.objects.map((o: any) => o.key));
});
afterEach(() => vi.restoreAllMocks());
afterAll(async () => mf?.dispose());

describe('capture API and durable jobs', () => {
  it('requires authentication before creating or exposing jobs', async () => {
    expect((await request('/v1/captures', { method: 'POST', body: '{}' })).status).toBe(401);
    expect((await request('/v1/captures/unknown')).status).toBe(401);
    expect((await request('/v1/captures/unknown/artifact')).status).toBe(401);
    expect((await env.DB.prepare('SELECT COUNT(*) n FROM jobs').first()).n).toBe(0);
  });
  it.each([
    'http://example.com',
    'https://127.0.0.1',
    'https://[::1]',
    'https://example.com.evil.test',
    'https://user:pass@example.com',
    'https://example.com:444/',
    'file:///etc/passwd',
  ])('rejects unapproved URL %s', async (url) => {
    expect((await create('invalid-url-001', { url })).status).toBe(400);
  });
  it('requires idempotency, bounds the body, and rejects unsupported options', async () => {
    expect(
      (
        await request('/v1/captures', {
          method: 'POST',
          headers: { authorization: `Bearer ${KEY}`, 'content-type': 'application/json' },
          body: '{}',
        })
      ).status,
    ).toBe(400);
    expect(
      (await create('unknown-option', { url: 'https://example.com', cookies: [] })).status,
    ).toBe(400);
    expect(
      (await create('invalid-size-1', { url: 'https://example.com', width: 9000 })).status,
    ).toBe(400);
    expect(
      (await create('huge-request-1', { url: 'https://example.com/?q=' + 'x'.repeat(9000) }))
        .status,
    ).toBe(413);
  });
  it('atomically deduplicates concurrent submissions and rejects conflicting reuse', async () => {
    const responses = await Promise.all([create(), create()]);
    expect(responses.map((r) => r.status)).toEqual([202, 202]);
    const [a, b] = (await Promise.all(responses.map((r) => r.json()))) as any[];
    expect(a.id).toBe(b.id);
    expect((await env.DB.prepare('SELECT COUNT(*) n FROM jobs').first()).n).toBe(1);
    expect((await create('test-request-0001', { url: 'https://openscreenshot.app/' })).status).toBe(
      409,
    );
  });
  it('enforces daily and active admission limits without blocking idempotent replays', async () => {
    env.ACTIVE_JOB_LIMIT = '1';
    const first = await create();
    expect(first.status).toBe(202);
    expect((await create('second-request-1')).status).toBe(429);
    expect((await create()).status).toBe(202);
    await processJob(((await first.json()) as any).id, env);
    env.DAILY_JOB_LIMIT = '1';
    expect((await create('third-request-01')).status).toBe(429);
  });
  it('stores a private PNG before publishing success and avoids duplicate renders', async () => {
    const res = await create();
    expect(res.status).toBe(202);
    const { id } = (await res.json()) as any;
    expect((await job(id)).status).toBe('queued');
    expect((await request(`/v1/captures/${id}/artifact`, { headers })).status).toBe(409);
    await processJob(id, env);
    await processJob(id, env);
    const status = await job(id);
    expect(status).toMatchObject({
      status: 'succeeded',
      attempts: 1,
      width: 1,
      height: 1,
      browserMs: 1234.5,
    });
    const artifact = await request(`/v1/captures/${id}/artifact`, { headers });
    expect(artifact.status).toBe(200);
    expect(artifact.headers.get('cache-control')).toBe('private, no-store');
    expect(Buffer.from(await artifact.arrayBuffer())).toEqual(PNG);
    expect(calls).toBe(1);
  });
  it('leases prevent simultaneous queue deliveries from rendering twice', async () => {
    const { id } = (await (await create()).json()) as any;
    await Promise.all([processJob(id, env), processJob(id, env)]);
    expect(calls).toBe(1);
    expect((await job(id)).status).toBe('succeeded');
  });
  it('retries transient errors with a delay and terminates after three render attempts', async () => {
    env.BROWSER.quickAction = async () => {
      calls++;
      return new Response('unavailable', { status: 503 });
    };
    const { id } = (await (await create()).json()) as any;
    for (let attempt = 1; attempt <= 3; attempt++) {
      await processJob(id, env);
      const stored = await row(id);
      expect(stored.attempts).toBe(attempt);
      if (attempt < 3) {
        expect(stored.status).toBe('queued');
        expect(stored.next_attempt_at).toBeGreaterThan(Date.now());
        await processJob(id, env);
        expect(calls).toBe(attempt);
        await env.DB.prepare('UPDATE jobs SET next_attempt_at=0 WHERE id=?').bind(id).run();
      }
    }
    expect((await job(id)).status).toBe('failed');
    await processJob(id, env);
    expect(calls).toBe(3);
  });
  it('does not retry permanent provider errors and does not expose upstream bodies', async () => {
    env.BROWSER.quickAction = async () =>
      new Response('sensitive upstream detail', { status: 422 });
    const { id } = (await (await create()).json()) as any;
    await processJob(id, env);
    const status = await job(id);
    expect(status).toMatchObject({
      status: 'failed',
      attempts: 1,
      error: { code: 'render_rejected' },
    });
    expect(JSON.stringify(status)).not.toContain('sensitive');
  });
  it('rejects invalid PNG responses instead of publishing a successful artifact', async () => {
    env.BROWSER.quickAction = async () =>
      new Response('<html>blocked</html>', { headers: { 'content-type': 'image/png' } });
    const { id } = (await (await create()).json()) as any;
    await processJob(id, env);
    expect((await job(id)).error.code).toBe('invalid_image');
    expect((await env.ARTIFACTS.list()).objects).toHaveLength(0);
  });
  it('retains accepted jobs when enqueue fails and recovers them on schedule', async () => {
    env.CAPTURE_QUEUE.send = async () => {
      throw Error('queue unavailable');
    };
    const res = await create();
    expect(res.status).toBe(202);
    const { id } = (await res.json()) as any;
    env.CAPTURE_QUEUE.send = async (body: any) => sent.push(body.id);
    await recover(env);
    expect(sent).toContain(id);
    await processJob(id, env);
    expect((await job(id)).status).toBe('succeeded');
  });
  it('recovers expired leases and reuses an uploaded artifact after interrupted completion', async () => {
    const { id } = (await (await create()).json()) as any;
    await env.DB.prepare(
      "UPDATE jobs SET status='running', attempts=1, lease_token='dead-worker', lease_until=0 WHERE id=?",
    )
      .bind(id)
      .run();
    await env.ARTIFACTS.put(`${id}/1.png`, PNG, {
      httpMetadata: { contentType: 'image/png' },
      customMetadata: { browserMs: '12.5', width: '1', height: '1' },
    });
    await recover(env);
    await processJob(id, env);
    expect(calls).toBe(0);
    expect((await job(id)).status).toBe('succeeded');
  });
  it('fails an exhausted crashed job without starting a fourth render', async () => {
    const { id } = (await (await create()).json()) as any;
    await env.DB.prepare(
      "UPDATE jobs SET status='running', attempts=3, lease_token='dead-worker', lease_until=0 WHERE id=?",
    )
      .bind(id)
      .run();
    await processJob(id, env);
    expect(calls).toBe(0);
    expect((await job(id)).error.code).toBe('attempts_exhausted');
  });
  it('denies expired artifacts and removes data in scheduled cleanup', async () => {
    const { id } = (await (await create()).json()) as any;
    await processJob(id, env);
    await env.DB.prepare('UPDATE jobs SET expires_at=0 WHERE id=?').bind(id).run();
    expect((await request(`/v1/captures/${id}/artifact`, { headers })).status).toBe(410);
    await recover(env);
    expect(await row(id)).toBeNull();
    expect((await env.ARTIFACTS.list()).objects).toHaveLength(0);
  });
});

it('blocks non-allowlisted resource and redirect URLs in the browser request policy', async () => {
  env.BROWSER.quickAction = async (_action: string, options: any) => {
    const blocked = new RegExp(options.rejectRequestPattern[0]);
    for (const url of [
      'https://127.0.0.1/',
      'https://example.com.evil.test/',
      'https://example.com@evil.test/',
      'https://evil.test/redirect',
      'http://example.com/',
      'https://example.com:444/',
    ])
      expect(blocked.test(url)).toBe(true);
    for (const url of [
      'https://example.com/',
      'https://example.com:443/image.png',
      'https://openscreenshot.app/font.woff2',
    ])
      expect(blocked.test(url)).toBe(false);
    return new Response(PNG, { headers: { 'content-type': 'image/png' } });
  };
  const { id } = (await (await create()).json()) as any;
  await processJob(id, env);
  expect((await job(id)).browserMs).toBeNull();
});
it('fences stale completion when a worker loses its lease mid-render', async () => {
  const { id } = (await (await create()).json()) as any;
  env.BROWSER.quickAction = async () => {
    await env.DB.prepare("UPDATE jobs SET lease_token='new-owner' WHERE id=?").bind(id).run();
    return new Response(PNG, { headers: { 'content-type': 'image/png' } });
  };
  await processJob(id, env);
  expect((await job(id)).status).toBe('running');
  expect((await row(id)).lease_token).toBe('new-owner');
  expect((await request(`/v1/captures/${id}/artifact`, { headers })).status).toBe(409);
});
it('rejects a truncated PNG with a valid header', async () => {
  env.BROWSER.quickAction = async () =>
    new Response(PNG.subarray(0, 33), { headers: { 'content-type': 'image/png' } });
  const { id } = (await (await create()).json()) as any;
  await processJob(id, env);
  expect((await job(id)).error?.code).toBe('invalid_image');
});
it('rejects an artifact beyond the byte budget', async () => {
  env.BROWSER.quickAction = async () =>
    new Response(new Uint8Array(21 * 1024 * 1024), { headers: { 'content-type': 'image/png' } });
  const { id } = (await (await create()).json()) as any;
  await processJob(id, env);
  expect((await job(id)).error?.code).toBe('image_too_large');
});
it('never exposes an upload that completes after expiry cleanup', async () => {
  const { id } = (await (await create()).json()) as any;
  const bucket = env.ARTIFACTS;
  env.ARTIFACTS = {
    head: bucket.head.bind(bucket),
    get: bucket.get.bind(bucket),
    delete: bucket.delete.bind(bucket),
    async put(key: string, value: any, options: any) {
      await env.DB.prepare('UPDATE jobs SET expires_at=0, lease_until=0 WHERE id=?').bind(id).run();
      await recover(env);
      return bucket.put(key, value, options);
    },
  };
  await processJob(id, env);
  expect(await row(id)).toBeNull();
  expect((await request(`/v1/captures/${id}/artifact`, { headers })).status).toBe(404);
  // This orphan is intentionally retained; the mandatory bucket lifecycle expires it.
  expect(await bucket.head(`${id}/1.png`)).not.toBeNull();
});
it('normalizes scrolling before capture without disabling lazy-load scrolling', async () => {
  let options: any;
  env.BROWSER.quickAction = async (_action: string, input: any) => {
    options = input;
    return new Response(PNG, { headers: { 'content-type': 'image/png' } });
  };
  const { id } = (await (
    await create('smooth-scroll-regression', {
      url: 'https://openscreenshot.app/',
      width: 390,
      height: 844,
    })
  ).json()) as any;
  await processJob(id, env);
  expect((await job(id)).status).toBe('succeeded');
  expect(options.scrollPage).toBe(true);
  expect(options.cacheTTL).toBe(0);
  expect(options.addStyleTag).toEqual([
    { content: 'html, body, * { scroll-behavior: auto !important; }' },
  ]);
  expect(options.addScriptTag).toBeUndefined();
});

it('retries provider timeout 6002, retaining sanitized failure diagnostics after recovery', async () => {
  const logs = vi.spyOn(console, 'log').mockImplementation(() => {});
  env.BROWSER.quickAction = async () =>
    new Response(
      JSON.stringify({
        success: false,
        errors: [{ code: 6002, message: 'private target URL', detail: 'secret page content' }],
      }),
      {
        status: 422,
        headers: {
          'content-type': 'application/json',
          'x-browser-ms-used': '664',
          'cf-ray': 'abc123-KIX',
        },
      },
    );
  const { id } = (await (await create()).json()) as any;
  await processJob(id, env);
  expect((await job(id)).status).toBe('queued');
  expect((await job(id)).error.code).toBe('render_timeout');
  const diagnostic = JSON.parse((await row(id)).last_failure_json);
  expect(diagnostic).toMatchObject({
    attempt: 1,
    httpStatus: 422,
    providerCodes: [6002],
    browserMs: 664,
    rayId: 'abc123-KIX',
    bodyState: 'json',
  });
  expect(diagnostic.elapsedMs).toBeGreaterThanOrEqual(0);
  expect(JSON.stringify(diagnostic)).not.toContain('private');
  expect(JSON.stringify(logs.mock.calls)).not.toContain('secret');
  expect(await job(id)).not.toHaveProperty('last_failure_json');
  await env.DB.prepare('UPDATE jobs SET next_attempt_at=0 WHERE id=?').bind(id).run();
  env.BROWSER.quickAction = async () =>
    new Response(PNG, { headers: { 'content-type': 'image/png' } });
  await processJob(id, env);
  expect((await job(id)).status).toBe('succeeded');
  expect(JSON.parse((await row(id)).last_failure_json)).toEqual(diagnostic);
});
it.each([
  [
    422,
    JSON.stringify({ errors: [{ code: 9999, message: 'timeout at customer URL' }] }),
    'failed',
    'json',
  ],
  [422, 'not JSON', 'failed', 'invalid_json'],
  [422, 'x'.repeat(9000), 'failed', 'too_large'],
  [503, 'unavailable', 'queued', 'invalid_json'],
  [400, JSON.stringify({ errors: [{ code: 6002 }] }), 'failed', 'json'],
])(
  'classifies status %s without trusting arbitrary error messages',
  async (status, body, expected, bodyState) => {
    env.BROWSER.quickAction = async () =>
      new Response(body as string, {
        status: status as number,
        headers: {
          'content-type': 'application/json',
          'cf-ray': 'untrusted URL https://private.test',
          'x-browser-ms-used': 'NaN',
        },
      });
    const { id } = (await (await create()).json()) as any;
    await processJob(id, env);
    expect((await job(id)).status).toBe(expected);
    expect(JSON.parse((await row(id)).last_failure_json)).toMatchObject({
      bodyState,
      rayId: null,
      browserMs: null,
    });
  },
);
it('bounds repeated recognized provider timeouts to three renders', async () => {
  env.BROWSER.quickAction = async () => {
    calls++;
    return new Response(JSON.stringify({ errors: [{ code: 6002 }] }), {
      status: 422,
      headers: { 'content-type': 'application/json' },
    });
  };
  const { id } = (await (await create()).json()) as any;
  for (let i = 0; i < 3; i++) {
    await processJob(id, env);
    await env.DB.prepare('UPDATE jobs SET next_attempt_at=0 WHERE id=?').bind(id).run();
  }
  await processJob(id, env);
  expect(calls).toBe(3);
  expect((await job(id)).status).toBe('failed');
});

async function betaSession() {
  env.BETA_ENABLED = 'true';
  const res = await request('/beta/session');
  return res.headers.get('set-cookie')?.split(';')[0] ?? '';
}
async function betaCreate(cookie: string, key = 'beta-request-0001', ip = '203.0.113.5') {
  return request('/beta/captures', {
    method: 'POST',
    headers: {
      cookie,
      origin: base,
      'content-type': 'application/json',
      'idempotency-key': key,
      'cf-connecting-ip': ip,
    },
    body: JSON.stringify({ url: 'https://example.com/', width: 390, height: 844 }),
  });
}
it('beta remains disabled until explicitly enabled', async () => {
  expect((await request('/beta/session')).status).toBe(503);
});
it('beta isolates jobs and artifacts between anonymous browsers and operator jobs', async () => {
  const a = await betaSession(),
    b = await betaSession();
  expect(a).not.toBe(b);
  const res = await betaCreate(a);
  expect(res.status).toBe(202);
  const j = (await res.json()) as any;
  expect((await request(j.statusUrl, { headers: { cookie: b } })).status).toBe(404);
  expect((await request(j.statusUrl)).status).toBe(401);
  await processJob(j.id, env);
  expect(
    (await request(`/beta/captures/${j.id}/artifact`, { headers: { cookie: b } })).status,
  ).toBe(404);
  expect(
    (await request(`/beta/captures/${j.id}/artifact`, { headers: { cookie: a } })).status,
  ).toBe(200);
  const operator = (await (await create()).json()) as any;
  expect((await request(`/beta/captures/${operator.id}`, { headers: { cookie: a } })).status).toBe(
    404,
  );
});
it('beta rejects cross-origin writes, missing identity, and unsupported targets', async () => {
  const cookie = await betaSession();
  expect(
    (
      await request('/beta/captures', {
        method: 'POST',
        headers: { cookie, origin: 'https://evil.test', 'content-type': 'application/json' },
        body: '{}',
      })
    ).status,
  ).toBe(403);
  expect((await betaCreate('')).status).toBe(401);
  expect(
    (
      await request('/beta/captures', {
        method: 'POST',
        headers: {
          cookie,
          origin: base,
          'content-type': 'application/json',
          'idempotency-key': 'beta-test-unsupported',
          'cf-connecting-ip': '203.0.113.5',
        },
        body: JSON.stringify({ url: 'https://untrusted.test/' }),
      })
    ).status,
  ).toBe(400);
});
it('beta enforces network limits across cookie resets and deduplicates by owner', async () => {
  env.ACTIVE_JOB_LIMIT = '20';
  const a = await betaSession();
  for (let i = 0; i < 5; i++)
    expect((await betaCreate(a, `beta-request-000${i}`)).status).toBe(202);
  expect((await betaCreate(a, 'beta-request-0000')).status).toBe(202);
  expect((await betaCreate(await betaSession(), 'beta-request-reset')).status).toBe(429);
  expect((await betaCreate(a, 'beta-request-newip', '203.0.113.6')).status).toBe(429);
  const b = await betaSession();
  expect((await betaCreate(b, 'beta-request-0000', '203.0.113.6')).status).toBe(202);
});
it('beta aggregates actual transitions and first download requests without raw identity or URL', async () => {
  const cookie = await betaSession();
  const j = (await (await betaCreate(cookie)).json()) as any;
  await betaCreate(cookie);
  await processJob(j.id, env);
  await processJob(j.id, env);
  await request(`/beta/captures/${j.id}/artifact`, { headers: { cookie } });
  await request(`/beta/captures/${j.id}/download`, { method: 'HEAD', headers: { cookie } });
  expect((await env.DB.prepare('SELECT downloads FROM beta_daily').first()).downloads).toBe(0);
  await request(`/beta/captures/${j.id}/download`, { headers: { cookie } });
  await request(`/beta/captures/${j.id}/download`, { headers: { cookie } });
  const metrics = await env.DB.prepare('SELECT * FROM beta_daily').first();
  expect(metrics).toMatchObject({ started: 1, succeeded: 1, failed: 0, downloads: 1 });
  const activity = await env.DB.prepare('SELECT * FROM beta_activity').all();
  expect(JSON.stringify(activity)).not.toContain('example.com');
  expect(JSON.stringify(activity)).not.toContain(cookie.split('=')[1]);
  expect((await request('/v1/beta-stats')).status).toBe(401);
  expect((await request('/v1/beta-stats', { headers })).status).toBe(200);
});
it('beta admission is atomic under concurrent requests', async () => {
  const cookie = await betaSession();
  env.ACTIVE_JOB_LIMIT = '20';
  const responses = await Promise.all(
    Array.from({ length: 8 }, (_, i) => betaCreate(cookie, `beta-concurrent-${i}`)),
  );
  expect(responses.filter((r) => r.status === 202)).toHaveLength(5);
  expect(responses.filter((r) => r.status === 429)).toHaveLength(3);
  expect((await env.DB.prepare('SELECT started FROM beta_daily').first()).started).toBe(5);
});
it('beta distinguishes next-day return activity from repeated same-day captures', async () => {
  const cookie = await betaSession();
  await betaCreate(cookie, 'beta-activity-0001');
  await betaCreate(cookie, 'beta-activity-0002');
  expect((await env.DB.prepare('SELECT days_active FROM beta_activity').first()).days_active).toBe(
    1,
  );
  await env.DB.prepare('UPDATE beta_activity SET last_seen=last_seen-86400000').run();
  await betaCreate(cookie, 'beta-activity-0003');
  expect((await env.DB.prepare('SELECT days_active FROM beta_activity').first()).days_active).toBe(
    2,
  );
});
it.each(['example.com', ' example.com/path?x=1 ', '//example.com/path'])(
  'accepts scheme-less HTTPS address %s',
  async (url) => {
    const res = await create('normalize-url-test', { url });
    expect(res.status).toBe(202);
    const j = (await res.json()) as any;
    expect(JSON.parse((await row(j.id)).input_json).url).toMatch(/^https:\/\/example\.com\//);
  },
);

it('mounts beta under /capture while preserving origin validation and cookie ownership', async () => {
  env.BETA_ENABLED = 'true';
  const ctx = {} as any;
  const session = await worker.fetch(new Request(base + '/capture/beta/session'), env, ctx);
  const cookie = session.headers.get('set-cookie')!.split(';')[0];
  const response = await worker.fetch(
    new Request(base + '/capture/beta/captures', {
      method: 'POST',
      headers: {
        cookie,
        origin: base,
        'cf-connecting-ip': '203.0.113.7',
        'content-type': 'application/json',
        'idempotency-key': 'mounted-request-01',
      },
      body: JSON.stringify({ url: 'example.com' }),
    }),
    env,
    ctx,
  );
  expect(response.status).toBe(202);
  const job = (await response.json()) as any;
  expect(
    (
      await worker.fetch(
        new Request(base + '/capture' + job.statusUrl, { headers: { cookie } }),
        env,
        ctx,
      )
    ).status,
  ).toBe(200);
  const page = await worker.fetch(new Request(base + '/capture/'), env, ctx);
  expect(await page.text()).toContain('href="./beta.css"');
  expect(
    (await worker.fetch(new Request(base + '/capture/beta.js'), env, ctx)).headers.get(
      'content-type',
    ),
  ).toContain('javascript');
  expect((await worker.fetch(new Request(base + '/capture'), env, ctx)).status).toBe(308);
});
