import inter400 from '../../../site/public/fonts/inter-latin-400-normal.woff2';
import inter500 from '../../../site/public/fonts/inter-latin-500-normal.woff2';
import inter600 from '../../../site/public/fonts/inter-latin-600-normal.woff2';
import mono500 from '../../../site/public/fonts/jetbrains-mono-latin-500.woff2';
import siteTokens from '../../../site/src/styles/tokens.css';
import siteFonts from '../../../site/src/styles/fonts.css';
import siteBase from '../../../site/src/styles/base.css';
import brandMark from '../../../media/brand-mark.svg';
import betaHtml from '../ui/index.html';
import betaCss from '../ui/beta.css';
import betaJs from '../ui/beta.js.txt';
import { beta } from './beta';
import { Hono } from 'hono';
import openapi from '../openapi.json';
import type { Env, Job } from './types';
import { allowedHosts, authorized, parseInput, Problem, readBounded } from './policy';
import { Store } from './store';
import { processJob, recover } from './consumer';
export { processJob, recover } from './consumer';

export const app = new Hono<{ Bindings: Env }>();
app.use('*', async (c, next) => {
  await next();
  c.header('Cache-Control', 'private, no-store');
  c.header('X-Content-Type-Options', 'nosniff');
});
app.get('/', (c) => {
  c.header(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
  );
  c.header('Referrer-Policy', 'no-referrer');
  return c.html(betaHtml);
});
app.get('/beta.css', (c) =>
  c.body(
    [siteTokens, siteFonts.replaceAll("url('/fonts/", "url('./fonts/"), siteBase, betaCss].join(
      '\n',
    ),
    200,
    { 'Content-Type': 'text/css; charset=utf-8' },
  ),
);
app.get('/beta.js', (c) =>
  c.body(betaJs, 200, { 'Content-Type': 'application/javascript; charset=utf-8' }),
);
const fonts: Record<string, ArrayBuffer> = {
  'inter-latin-400-normal.woff2': inter400,
  'inter-latin-500-normal.woff2': inter500,
  'inter-latin-600-normal.woff2': inter600,
  'jetbrains-mono-latin-500.woff2': mono500,
};
app.get('/fonts/:name', (c) => {
  const font = fonts[c.req.param('name')];
  return font ? c.body(font, 200, { 'Content-Type': 'font/woff2' }) : c.notFound();
});
app.get('/favicon.svg', (c) => c.body(brandMark, 200, { 'Content-Type': 'image/svg+xml' }));
app.get('/robots.txt', (c) => c.text('User-agent: *\nDisallow: /\n'));
app.route('/beta', beta);
app.get('/openapi.json', (c) => c.json(openapi));
app.get('/.well-known/api-catalog', (c) =>
  c.json({
    linkset: [
      { anchor: '/', 'service-desc': [{ href: '/openapi.json', type: 'application/json' }] },
    ],
  }),
);
app.get('/auth.md', (c) =>
  c.text(
    'OpenScreenShot uses an operator-provisioned Bearer token in the Authorization header for every /v1/ request. The supported-site free preview at / uses a separate anonymous HttpOnly cookie through /beta/session; beta captures are private to that browser. There is no public registration, OAuth flow, or billing. POST /v1/captures also requires an Idempotency-Key. See /openapi.json. Never put a token in a URL.',
  ),
);
app.get('/health', (c) => c.json({ ok: true, service: 'capture-pilot' }));
app.use('/v1/*', async (c, next) => {
  if (!(await authorized(c.req.header('Authorization'), c.env.CAPTURE_API_KEY)))
    return c.json({ error: { code: 'unauthorized' } }, 401);
  await next();
});
function publicJob(job: Job) {
  return {
    id: job.id,
    status: job.status,
    attempts: job.attempts,
    createdAt: new Date(job.created_at).toISOString(),
    expiresAt: new Date(job.expires_at).toISOString(),
    width: job.width,
    height: job.height,
    bytes: job.bytes,
    browserMs: job.browser_ms,
    error: job.error_code ? { code: job.error_code } : null,
    statusUrl: `/v1/captures/${job.id}`,
    artifactUrl: job.status === 'succeeded' ? `/v1/captures/${job.id}/artifact` : null,
  };
}
app.get('/v1/beta-stats', async (c) =>
  c.json({
    daily: (await c.env.DB.prepare('SELECT * FROM beta_daily ORDER BY day DESC LIMIT 90').all())
      .results,
    browsers: await c.env.DB.prepare(
      'SELECT COUNT(*) AS activeBrowsers30d,SUM(captures>1) AS repeatBrowsers30d,SUM(days_active>1) AS returningBrowsers30d FROM beta_activity WHERE last_seen>?',
    )
      .bind(Date.now() - 30 * 86400000)
      .first(),
    note: 'Downloads count first download requests, not confirmed file saves. Browser identities are pseudonymous and reset with cookies.',
  }),
);
app.post('/v1/captures', async (c) => {
  const key = c.req.header('Idempotency-Key');
  if (!key || !/^[-a-zA-Z0-9_:]{8,128}$/.test(key))
    throw new Problem(400, 'invalid_idempotency_key');
  if (!c.req.header('Content-Type')?.toLowerCase().startsWith('application/json'))
    throw new Problem(400, 'json_required');
  const bytes = await readBounded(c.req.raw.body, 4096);
  let body: unknown;
  try {
    body = JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    throw new Problem(400, 'invalid_json');
  }
  const input = parseInput(body, allowedHosts(c.env.ALLOWED_HOSTS));
  const store = new Store(c.env);
  const job = await store.submit(key, input);
  if (job.status === 'queued' && job.enqueued_at === 0) {
    try {
      await store.enqueue(job);
    } catch {
      console.log(JSON.stringify({ event: 'capture_enqueue_pending', id: job.id }));
    }
  }
  c.header('Location', `/v1/captures/${job.id}`);
  c.header('Retry-After', '3');
  return c.json(publicJob(job), 202);
});
app.get('/v1/captures/:id', async (c) => {
  const job = await new Store(c.env).get(c.req.param('id'));
  if (!job) return c.json({ error: { code: 'not_found' } }, 404);
  if (job.expires_at <= Date.now()) return c.json({ error: { code: 'expired' } }, 410);
  if (job.status === 'queued' || job.status === 'running') c.header('Retry-After', '3');
  return c.json(publicJob(job));
});
app.get('/v1/captures/:id/artifact', async (c) => {
  const job = await new Store(c.env).get(c.req.param('id'));
  if (!job) return c.json({ error: { code: 'not_found' } }, 404);
  if (job.expires_at <= Date.now()) return c.json({ error: { code: 'expired' } }, 410);
  if (job.status !== 'succeeded' || !job.artifact_key)
    return c.json({ error: { code: 'not_ready' } }, 409);
  const object = await c.env.ARTIFACTS.get(job.artifact_key);
  if (!object) return c.json({ error: { code: 'artifact_unavailable' } }, 503);
  return new Response(object.body, {
    headers: {
      'Content-Type': 'image/png',
      'Content-Length': String(object.size),
      'Content-Disposition': `attachment; filename="${job.id}.png"`,
    },
  });
});
app.notFound((c) => c.json({ error: { code: 'not_found' } }, 404));
app.onError((error, c) => {
  if (error instanceof Problem) {
    if (error.status === 429) c.header('Retry-After', '60');
    return c.json({ error: { code: error.code } }, error.status);
  }
  console.error(JSON.stringify({ event: 'capture_api_error' }));
  return c.json({ error: { code: 'unavailable' } }, 503);
});
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url);
    if (url.pathname === '/capture') return Response.redirect(new URL('/capture/', url).href, 308);
    if (url.pathname.startsWith('/capture/')) {
      url.pathname = url.pathname.slice('/capture'.length);
      request = new Request(url, request);
    }
    return app.fetch(request, env, ctx);
  },
  async queue(batch: MessageBatch<{ id: string }>, env: Env) {
    for (const message of batch.messages) {
      if (!message.body || typeof message.body.id !== 'string') {
        message.ack();
        continue;
      }
      try {
        await processJob(message.body.id, env);
        message.ack();
      } catch {
        console.error(JSON.stringify({ event: 'capture_consumer_error', id: message.body.id }));
        message.retry({ delaySeconds: 60 });
      }
    }
  },
  async scheduled(_event: ScheduledController, env: Env) {
    await recover(env);
  },
} satisfies ExportedHandler<Env, { id: string }>;
