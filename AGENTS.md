# Agent notes

Rules for coding agents that work in this repository. `CONTRIBUTING.md` has the general workflow.

## Site deploy is automatic

Cloudflare Workers Builds is connected to this GitHub repository. Each push to `main` deploys
the site and the Worker (`npx wrangler deploy`). The `build` hook in `wrangler.jsonc` runs
`pnpm run site:build` first. Pushes to other branches upload a preview version only.

- Do not tell the user to run `site:build` or `site:deploy` after a commit. A push to `main` is
  the deploy.
- To confirm a deploy, read the `Workers Builds: openscreenshot` check on the pushed commit:
  `gh api repos/PGHQdev/OpenScreenShot/commits/<sha>/check-runs`.
- Run `pnpm run site:build` locally only to preview the site. It writes to `site-dist/`, which
  git ignores. `docs/` holds tracked documents only; the build never touches it.

## Search and discovery signals stay accurate

Search engines and agents read the sitemap, `robots.txt`, hreflang, JSON-LD, `llms.txt`, the
Markdown copies, and IndexNow submissions. Each signal must match the live site. An engine that
finds one false value can stop using that field for the whole site, so a signal we cannot keep
true is worse than no signal.

- `/sitemap-index.xml` is the one canonical sitemap. `robots.txt` names it, and `/sitemap.xml`
  redirects to it (`site/public/_redirects`). Every `<loc>` must return 200 with no redirect.
  Noindex pages stay out of the sitemap (the `filter` in `site/astro.config.mjs`).
- `scripts/site-lastmod.mjs` sets `lastmod` from a fingerprint of each page's significant
  content. Do not set `lastmod` from the build time, the commit time, or one site-wide date. If
  a page puts significant content outside `<main>` and the head tags that the script reads, add
  that content to the fingerprint.
- Do not add `priority` or `changefreq`. Google ignores both.
- A push submits to IndexNow only the URLs that the deploy changed or removed. Run the IndexNow
  workflow by hand only after a change to every page.
- hreflang links go only to locale pages that exist.
- JSON-LD and page facts (version, prices, dates, competitor claims) must match the product and
  their sources. Check dated competitor facts again before you edit those pages.
- `site/public/llms.txt` and `site/public/index.md` are written by hand. Update them in the same
  commit that adds, removes, or renames a page or a feature.
- After a deploy that changes these signals, check the live files. `sitemap-lastmod.json` must
  list as `changed` only the pages that the commit changed.
