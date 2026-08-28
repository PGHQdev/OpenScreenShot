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
// HTMLRewriter — the markup's own 985 / 65 numbers are what ships if
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
const STATS_TIMEOUT_MS = 1500;

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

async function withInjectedStats(response) {
  const [users, stars] = await Promise.all([
    shieldValue(STAT_SOURCES.users, STAT_SHAPE),
    shieldValue(STAT_SOURCES.stars, STAT_SHAPE),
  ]);
  if (users === null && stars === null) return response;
  try {
    return new HTMLRewriter()
      .on('[data-stat="users"]', new StatRewriter(users))
      .on('[data-stat="stars"]', new StatRewriter(stars))
      .transform(response);
  } catch {
    return response;
  }
}

async function route(url, request, env) {
  const accept = request.headers.get('Accept') ?? '';

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
    return withInjectedStats(await env.ASSETS.fetch(request));
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
