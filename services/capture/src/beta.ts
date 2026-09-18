import { Hono } from 'hono';
import { getCookie, setCookie } from 'hono/cookie';
import type { Env } from './types';
import { allowedHosts, parseInput, Problem, readBounded } from './policy';
import { Store } from './store';

const COOKIE = '__Host-osc-beta';
async function keyed(value: string, secret: string): Promise<string> {
  if (!secret || secret.length < 32) throw new Problem(503, 'not_configured');
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const bytes = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value));
  return Array.from(new Uint8Array(bytes), (b) => b.toString(16).padStart(2, '0')).join('');
}
function session(value: string | undefined) {
  return value && /^[a-f0-9]{64}$/.test(value) ? value : null;
}
export const beta = new Hono<{ Bindings: Env }>();
beta.use('*', async (c, next) => {
  if (c.env.BETA_ENABLED !== 'true') return c.json({ error: { code: 'beta_unavailable' } }, 503);
  if (
    c.req.method !== 'GET' &&
    c.req.method !== 'HEAD' &&
    c.req.header('Origin') !== new URL(c.req.url).origin
  )
    return c.json({ error: { code: 'origin_required' } }, 403);
  if (c.req.header('Sec-Fetch-Site') === 'cross-site')
    return c.json({ error: { code: 'origin_required' } }, 403);
  await next();
});
beta.get('/session', (c) => {
  if (!session(getCookie(c, COOKIE))) {
    const value = Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) =>
      b.toString(16).padStart(2, '0'),
    ).join('');
    setCookie(c, COOKIE, value, {
      httpOnly: true,
      secure: true,
      sameSite: 'Strict',
      path: '/',
      maxAge: 30 * 86400,
    });
  }
  return c.json({
    perDay: 5,
    supportedHosts: allowedHosts(c.env.ALLOWED_HOSTS),
    retentionHours: 24,
  });
});
beta.post('/captures', async (c) => {
  const token = session(getCookie(c, COOKIE));
  if (!token) return c.json({ error: { code: 'session_required' } }, 401);
  const ip = c.req.header('CF-Connecting-IP');
  if (!ip || ip.length > 64) throw new Problem(503, 'network_identity_unavailable');
  const idempotency = c.req.header('Idempotency-Key');
  if (!idempotency || !/^[-a-zA-Z0-9_:]{8,128}$/.test(idempotency))
    throw new Problem(400, 'invalid_idempotency_key');
  if (c.req.header('Content-Type')?.split(';')[0].trim().toLowerCase() !== 'application/json')
    throw new Problem(400, 'json_required');
  let body: unknown;
  const bytes = await readBounded(c.req.raw.body, 4096);
  try {
    body = JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    throw new Problem(400, 'invalid_json');
  }
  const input = parseInput(body, allowedHosts(c.env.ALLOWED_HOSTS));
  const ownerHash = await keyed(`beta-owner:${token}`, c.env.CAPTURE_API_KEY);
  const networkHash = await keyed(
    `beta-ip:${Math.floor(Date.now() / 86400000)}:${ip}`,
    c.env.CAPTURE_API_KEY,
  );
  const store = new Store(c.env);
  const job = await store.submit(`beta:${ownerHash}:${idempotency}`, input, {
    ownerHash,
    networkHash,
  });
  if (job.status === 'queued' && job.enqueued_at === 0) {
    try {
      await store.enqueue(job);
    } catch {
      console.log(JSON.stringify({ event: 'capture_enqueue_pending', id: job.id }));
    }
  }
  c.header('Retry-After', '3');
  return c.json({ id: job.id, status: job.status, statusUrl: `/beta/captures/${job.id}` }, 202);
});
beta.get('/captures/:id', async (c) => {
  const token = session(getCookie(c, COOKIE));
  if (!token) return c.json({ error: { code: 'session_required' } }, 401);
  const job = await new Store(c.env).get(c.req.param('id'));
  if (!job || job.owner_hash !== (await keyed(`beta-owner:${token}`, c.env.CAPTURE_API_KEY)))
    return c.json({ error: { code: 'not_found' } }, 404);
  if (job.expires_at <= Date.now()) return c.json({ error: { code: 'expired' } }, 410);
  c.header('Retry-After', '3');
  return c.json({
    id: job.id,
    status: job.status,
    error: job.error_code ? { code: job.error_code } : null,
    width: job.width,
    height: job.height,
    bytes: job.bytes,
    expiresAt: new Date(job.expires_at).toISOString(),
    artifactUrl: job.status === 'succeeded' ? `/beta/captures/${job.id}/artifact` : null,
    downloadUrl: job.status === 'succeeded' ? `/beta/captures/${job.id}/download` : null,
  });
});
for (const action of ['artifact', 'download'])
  beta.get(`/captures/:id/${action}`, async (c) => {
    const token = session(getCookie(c, COOKIE));
    if (!token) return c.json({ error: { code: 'session_required' } }, 401);
    const job = await new Store(c.env).get(c.req.param('id'));
    if (!job || job.owner_hash !== (await keyed(`beta-owner:${token}`, c.env.CAPTURE_API_KEY)))
      return c.json({ error: { code: 'not_found' } }, 404);
    if (job.expires_at <= Date.now()) return c.json({ error: { code: 'expired' } }, 410);
    if (job.status !== 'succeeded' || !job.artifact_key)
      return c.json({ error: { code: 'not_ready' } }, 409);
    const object = await c.env.ARTIFACTS.get(job.artifact_key);
    if (!object) return c.json({ error: { code: 'artifact_unavailable' } }, 503);
    if (action === 'download' && c.req.method === 'GET' && job.downloaded_at === null)
      await c.env.DB.prepare('UPDATE jobs SET downloaded_at=? WHERE id=? AND downloaded_at IS NULL')
        .bind(Date.now(), job.id)
        .run();
    return new Response(object.body, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Length': String(object.size),
        'Content-Disposition': `${action === 'download' ? 'attachment' : 'inline'}; filename="openscreenshot-${job.id}.png"`,
      },
    });
  });
