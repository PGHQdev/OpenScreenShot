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
