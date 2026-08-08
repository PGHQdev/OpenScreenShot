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
  const script = (await upstream.text())
    .replaceAll(`${KOFI_CDN}/`, '/kofi-cdn/');
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

async function route(url, request, env) {
  const accept = request.headers.get('Accept') ?? '';

  if (url.pathname === '/kofi-widget.js') return proxyKofiWidget();
  if (url.pathname.startsWith('/kofi-cdn/')) return proxyKofiAsset(url.pathname);

  if (url.pathname === '/' && accept.includes('text/markdown')) {
    const md = await env.ASSETS.fetch(new URL('/index.md', url));
    return new Response(md.body, {
      status: md.status,
      headers: { 'content-type': 'text/markdown; charset=utf-8' },
    });
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
