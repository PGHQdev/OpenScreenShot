// Thin wrapper around the static asset handler: adds a Link header on the
// homepage (RFC 8288 agent discovery) and serves docs/index.md when a client
// negotiates Accept: text/markdown for the homepage.
const HOMEPAGE_LINK =
  '</.well-known/api-catalog>; rel="api-catalog", </skills/capture-screenshot.md>; rel="service-doc"';

// Same-origin proxy for the Ko-fi support widget. Some ad blockers filter
// requests to ko-fi.com / storage.ko-fi.com, which would silently remove the
// widget; serving it from our own origin avoids that. Only the two CDN image
// assets the widget actually uses are proxied (no open proxy).
const KOFI_CDN = 'https://storage.ko-fi.com/cdn';
const KOFI_ASSETS = new Set(['cup-border.png', 'whitelogo.svg']);
const KOFI_CACHE = { cf: { cacheEverything: true, cacheTtl: 86400 } };

async function proxyKofiWidget() {
  const upstream = await fetch(`${KOFI_CDN}/widget/Widget_2.js`, KOFI_CACHE);
  if (!upstream.ok) return new Response('Ko-fi widget unavailable', { status: 502 });
  const script = (await upstream.text()).replaceAll(`${KOFI_CDN}/`, '/kofi-cdn/');
  return new Response(script, {
    headers: {
      'content-type': 'application/javascript; charset=utf-8',
      'cache-control': 'public, max-age=86400',
    },
  });
}

async function proxyKofiAsset(pathname) {
  const name = pathname.slice('/kofi-cdn/'.length);
  if (!KOFI_ASSETS.has(name)) return new Response('Not found', { status: 404 });
  const upstream = await fetch(`${KOFI_CDN}/${name}`, KOFI_CACHE);
  if (!upstream.ok) return new Response('Ko-fi asset unavailable', { status: 502 });
  return new Response(upstream.body, {
    headers: {
      'content-type': upstream.headers.get('content-type') ?? 'application/octet-stream',
      'cache-control': 'public, max-age=604800',
    },
  });
}

// Live user, star and version counts. Read from shields.io — the same
// source as the README badges — and cached at the edge, so nothing but this
// Worker ever talks to a third party. Two consumers share this: the
// homepage's proof strip (users/stars, injected server-side with
// HTMLRewriter — the markup's own 1k / 66 numbers are what ships if
// shields.io doesn't answer in time) and the public /api/stats.json
// endpoint, live since 95a14dd.
const STAT_SOURCES = {
  users: 'https://img.shields.io/chrome-web-store/users/hdabbojjccojlapnfjpdppcpfcnhgmdp.json',
  stars: 'https://img.shields.io/github/stars/pghqdev/OpenScreenShot.json',
  version: 'https://img.shields.io/chrome-web-store/v/hdabbojjccojlapnfjpdppcpfcnhgmdp.json',
};
const STAT_SHAPE = /^\d[\d,.kKmM+]*$/;
const VERSION_SHAPE = /^v?\d+(\.\d+)*$/;
const STATS_TTL = 21600;
/*
 * The homepage's first byte waits on this: the two shield lookups run
 * alongside the asset fetch, but the HTML cannot start streaming until the
 * rewriter is attached. The markup's own 1k / 66 are current and correct, so
 * giving up early costs freshness and nothing else.
 */
const STATS_TIMEOUT_MS = 500;

async function shieldValue(url, shape) {
  const timeout = AbortSignal.timeout(STATS_TIMEOUT_MS);
  try {
    const upstream = await fetch(url, {
      cf: { cacheEverything: true, cacheTtl: STATS_TTL },
      signal: timeout,
    });
    if (!upstream.ok) return null;
    const badge = await upstream.json();
    return shape.test(badge.value ?? '') ? badge.value : null;
  } catch {
    return null;
  }
}

async function siteStats() {
  const [users, stars, version] = await Promise.all([
    shieldValue(STAT_SOURCES.users, STAT_SHAPE),
    shieldValue(STAT_SOURCES.stars, STAT_SHAPE),
    shieldValue(STAT_SOURCES.version, VERSION_SHAPE),
  ]);
  return new Response(JSON.stringify({ users, stars, version }), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': `public, max-age=${STATS_TTL}`,
    },
  });
}

class StatRewriter {
  constructor(value) {
    this.value = value;
  }
  element(el) {
    if (this.value !== null) el.setInnerContent(this.value);
  }
}

/*
 * Takes the asset fetch as a promise, not an awaited Response, so the two
 * shield lookups run alongside it rather than after it — awaiting the asset
 * first put the whole shield round trip between the request and the first
 * byte of HTML on an edge cache miss.
 *
 * The degrade contract is unchanged: a lookup that times out or answers
 * badly yields null, null keeps the number the markup already carries, and
 * both being null skips the rewriter entirely.
 */
async function withInjectedStats(assetPromise) {
  const [response, users, stars] = await Promise.all([
    assetPromise,
    shieldValue(STAT_SOURCES.users, STAT_SHAPE),
    shieldValue(STAT_SOURCES.stars, STAT_SHAPE),
  ]);
  if (users === null && stars === null) return response;
  // Safe by construction, not by a guard here: .transform() returns
  // synchronously and runs StatRewriter.element() later, lazily, as the body
  // streams to the client, so a try/catch around this call can never see
  // that later work. The actual invariant is upstream — STAT_SHAPE rejects
  // anything that isn't a bare digit-led badge value, so setInnerContent()
  // here never receives a string that could break the surrounding markup.
  // Don't loosen that regex without re-deriving this guarantee.
  return new HTMLRewriter()
    .on('[data-stat="users"]', new StatRewriter(users))
    .on('[data-stat="stars"]', new StatRewriter(stars))
    .transform(response);
}

/*
 * Uninstall feedback (rating funnel Surface D).
 *
 * This is the site's only write endpoint and the only place the project stores
 * anything a person typed. It takes what they wrote plus the two values the
 * uninstall URL already carried, and deliberately records nothing else — no
 * IP, no user agent, no referrer, no cookie, no id that outlives the request.
 * That is a promise made in PRIVACY.md and on the privacy page, so keep it:
 * anything added to this INSERT has to be disclosed there first.
 *
 * It replaced a mailto: link, which asked the sender to have a mail client,
 * find the send button in it, and hand over their own address to say "the
 * footer was missing". Most did not. The link stays on the page under the
 * form, for anyone who would rather write than type into a box.
 */
const FEEDBACK_MAX_MESSAGE = 4000;
const FEEDBACK_MAX_CONTACT = 200;
/** Submissions one IP may make per window. The IP is used here and never stored. */
const FEEDBACK_RATE_LIMIT = 5;
const FEEDBACK_WINDOW_MS = 10 * 60 * 1000;
const feedbackHits = new Map();

/** Shape-check a value the client controls, and bound it. '' when it fails. */
function boundedField(value, max, shape) {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim().slice(0, max);
  return shape && !shape.test(trimmed) ? '' : trimmed;
}

/**
 * Per-isolate, per-window submission cap. A Worker isolate is neither shared
 * nor durable, so this is a speed bump against a stuck retry loop or one
 * bored visitor — not a defence against a distributed flood. D1 write limits
 * are the real backstop, and the endpoint stores too little to be worth
 * flooding. A Durable Object would make it exact, at the cost of a stateful
 * dependency for a form that sees a handful of writes a day.
 */
function rateLimited(ip) {
  if (!ip) return false;
  const now = Date.now();
  for (const [key, hits] of feedbackHits) {
    const live = hits.filter((t) => now - t < FEEDBACK_WINDOW_MS);
    if (live.length === 0) feedbackHits.delete(key);
    else feedbackHits.set(key, live);
  }
  const mine = feedbackHits.get(ip) ?? [];
  if (mine.length >= FEEDBACK_RATE_LIMIT) return true;
  feedbackHits.set(ip, [...mine, now]);
  return false;
}

function feedbackJson(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}

async function submitFeedback(request, env) {
  if (request.method !== 'POST') return feedbackJson(405, { error: 'method' });
  // The form is same-origin; a cross-origin POST has no business here and the
  // endpoint sends no CORS headers, so a browser would not surface the answer
  // anyway. This makes the refusal explicit rather than incidental.
  const origin = request.headers.get('Origin');
  if (origin && new URL(origin).host !== new URL(request.url).host) {
    return feedbackJson(403, { error: 'origin' });
  }
  if (!env.FEEDBACK_DB) return feedbackJson(503, { error: 'unavailable' });
  if (rateLimited(request.headers.get('CF-Connecting-IP'))) {
    return feedbackJson(429, { error: 'rate' });
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return feedbackJson(400, { error: 'json' });
  }

  const message = boundedField(payload?.message, FEEDBACK_MAX_MESSAGE);
  if (!message) return feedbackJson(400, { error: 'empty' });
  const version = boundedField(payload?.version, 32, /^[\w.+-]*$/) || 'unknown';
  const locale = boundedField(payload?.locale, 8, /^[a-z-]*$/) || 'en';
  const contact = boundedField(payload?.contact, FEEDBACK_MAX_CONTACT);

  try {
    await env.FEEDBACK_DB.prepare(
      'INSERT INTO feedback (version, locale, message, contact) VALUES (?, ?, ?, ?)',
    )
      .bind(version, locale, message, contact)
      .run();
  } catch {
    // The page keeps the mail link visible, so a failure here costs the sender
    // a second route rather than their words.
    return feedbackJson(500, { error: 'write' });
  }
  return feedbackJson(201, { ok: true });
}

async function route(url, request, env) {
  const accept = request.headers.get('Accept') ?? '';

  if (url.pathname === '/api/feedback') return submitFeedback(request, env);
  if (url.pathname === '/api/stats.json') return siteStats();
  if (url.pathname === '/kofi-widget.js') return proxyKofiWidget();
  if (url.pathname.startsWith('/kofi-cdn/')) return proxyKofiAsset(url.pathname);

  if (url.pathname === '/') {
    if (accept.includes('text/markdown')) {
      const md = await env.ASSETS.fetch(new URL('/index.md', url));
      return new Response(md.body, {
        status: md.status,
        headers: { 'content-type': 'text/markdown; charset=utf-8' },
      });
    }
    return withInjectedStats(env.ASSETS.fetch(request));
  }

  return env.ASSETS.fetch(request);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const response = await route(url, request, env);

    const headers = new Headers(response.headers);
    headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    if (url.pathname === '/') headers.set('Link', HOMEPAGE_LINK);
    return new Response(response.body, { status: response.status, headers });
  },
};
