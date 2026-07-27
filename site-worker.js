// Thin wrapper around the static asset handler: adds a Link header on the
// homepage (RFC 8288 agent discovery) and serves docs/index.md when a client
// negotiates Accept: text/markdown for the homepage.
const HOMEPAGE_LINK =
  '</.well-known/api-catalog>; rel="api-catalog", </skills/capture-screenshot.md>; rel="service-doc"';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const accept = request.headers.get('Accept') ?? '';

    if (url.pathname === '/' && accept.includes('text/markdown')) {
      const md = await env.ASSETS.fetch(new URL('/index.md', url));
      return new Response(md.body, {
        status: md.status,
        headers: { 'content-type': 'text/markdown; charset=utf-8' },
      });
    }

    const response = await env.ASSETS.fetch(request);
    if (url.pathname !== '/') return response;

    const headers = new Headers(response.headers);
    headers.set('Link', HOMEPAGE_LINK);
    return new Response(response.body, { status: response.status, headers });
  },
};
