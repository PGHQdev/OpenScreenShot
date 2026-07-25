# Runbook: Cloudflare edge headers for agent discovery

Optional edge configuration for `openscreenshot.app` that adds response headers
and content-types the static host does not set. Covers directives 1, 3, 4, 7.
None of this is required for the core tool (Tasks 1–5); it only makes the extra
scanner checks pass. **All steps below are manual, in the Cloudflare dashboard —
there is no application backend.**

## Prereqs

- `openscreenshot.app` proxied through Cloudflare (orange cloud).
- Static files already deployed:
  - `/.well-known/api-catalog` (linkset JSON, extensionless)
  - `/auth.md`
  - `/skills/capture-screenshot.md`
  - `/.well-known/mcp/server-card.json`

## 1. Link header on the homepage (directive 1)

Rules → Transform Rules → **Modify Response Header** → Create rule.

- When incoming requests match: `URI Path equals /`
- Then: **Set static** header
  - Name: `Link`
  - Value:
    ```
    </.well-known/api-catalog>; rel="api-catalog", </skills/capture-screenshot.md>; rel="service-doc"
    ```

## 2. Content-Type overrides (directives 4, 7)

Rules → Transform Rules → **Modify Response Header** → Create rule.

- `/.well-known/api-catalog` → set `Content-Type: application/linkset+json`
  - When: `URI Path equals /.well-known/api-catalog`
  - Then: Set static `Content-Type` = `application/linkset+json`
- `/auth.md` → set `Content-Type: text/markdown; charset=utf-8`
  - When: `URI Path equals /auth.md`
  - Then: Set static `Content-Type` = `text/markdown; charset=utf-8`

(One rule per path, or combine with an `or` expression and a single header op if
the same value applied — here the values differ, so use two rules.)

## 3. Markdown for Agents (directive 3)

Zone → Settings → enable the native **Markdown for Agents** toggle if the plan
offers it. It serves Markdown variants when a client negotiates
`Accept: text/markdown`. If the toggle is unavailable on the plan, leave
directive 3 unmet — do **not** hand-roll a renderer for a static marketing page.

## 4. Record what was created

- Note each rule's name and expression.
- Export/screenshot each Transform Rule for the change log.

## Verify (manual, after the rules are live)

```bash
curl -sI https://openscreenshot.app/ | grep -i '^link:'
curl -sI https://openscreenshot.app/.well-known/api-catalog | grep -i content-type
curl -sI -H 'Accept: text/markdown' https://openscreenshot.app/ | grep -i content-type
```

Expected: `Link` header present; `application/linkset+json`; `text/markdown`
when negotiated (only if the Markdown-for-Agents toggle exists on the plan).
