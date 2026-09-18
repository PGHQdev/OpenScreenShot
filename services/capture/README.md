# OpenScreenShot capture service and free-beta preview

Private asynchronous full-page PNG capture on Cloudflare Browser Run + Hono Workers + Queues + D1 + R2. This is an operator pilot, not a customer-ready paid API. It is separate from the browser extension and existing website.

Hosted beta: https://openscreenshot.app/capture/

Operator endpoint: https://openscreenshot-capture-pilot.pghq.workers.dev

The main site Worker forwards `/capture/*` through its `CAPTURE` service binding. The capture Worker serves the page, assets, and cookie-authenticated API on the main site's origin. Deploy this service first with `pnpm run deploy`, then deploy the main site from the repository root with `pnpm exec wrangler deploy`.

Bare domains, surrounding whitespace, and protocol-relative URLs are normalized to HTTPS in both the form and API. Explicit non-HTTPS URLs remain rejected.

## API

All `/v1/` requests require `Authorization: Bearer <operator key>`. The local key is in ignored `.dev.vars` (mode 0600); do not commit it or put it in URLs. Public machine-readable documentation: `/openapi.json`, `/.well-known/api-catalog`, and `/auth.md`.

1. `POST /v1/captures` with `Content-Type: application/json`, an `Idempotency-Key` (8–128 letters/digits/underscore/hyphen/colon), and `{"url":"https://openscreenshot.app/","width":1440,"height":900}` returns 202 and a status URL.
2. Poll `GET /v1/captures/:id` until `succeeded` or `failed`; respect `Retry-After`.
3. Download `GET /v1/captures/:id/artifact` using the same authorization. Artifacts are private, non-cacheable PNG attachments.

Identical requests with the same key return the existing job; conflicting inputs return 409. Idempotency lasts for the job lifetime. After expiry cleanup, reuse can create a new job. Admission is capped at 20 new jobs per UTC day and five active jobs; duplicates do not consume extra admission quota. Default viewport 1440×900; width 320–1920 and height 480–1080. Only HTTPS on configured exact hostnames is accepted. The same allowlist restricts redirects and subresources, so explicitly approve required CDN hosts before expanding the pilot. Current targets: `example.com`, `openscreenshot.app`.

## Failure and retention behavior

D1 leases prevent concurrent duplicate queue deliveries from starting a second render while a lease is live. Each job has at most three render attempts. HTTP 408, 429, 5xx, and recognized Browser Run HTTP 422/code 6002 timeouts back off 30 then 60 seconds, with dispatch on the next scheduled recovery pass. Queue/storage failures use delivery retries and expired-lease recovery. Uploads use immutable per-attempt keys; a completed upload can be reused after an interrupted database commit.

New jobs disable the provider response cache (`cacheTTL: 0`); idempotent API replays still reuse their existing job. The renderer forces instant CSS scrolling in its isolated browser page, then scrolls before full-page capture, waits for networkidle2 with a 25-second navigation timeout, and has a 45-second local response deadline. That deadline cannot guarantee cancellation of a remote Browser Run action. Leases last 180 seconds. PNGs are structurally validated and limited to 20 MiB, 30,000 pixels tall, and 40 million pixels total; this is not a full image decoder.

API access expires 24 hours after admission. The minute cron removes expired records and objects. **The bucket's one-day lifecycle expiration rule is mandatory**: it eventually removes orphaned late uploads even after a job record was deleted. Cloudflare lifecycle execution is asynchronous, so physical deletion is not an exact 24-hour guarantee. Local tests exercise the late-upload race; the deployed lifecycle rule is verified separately.

Only trusted domains belong on the allowlist: it is not DNS-level rebinding protection for arbitrary customer URLs. No customer isolation, billing ledger, cookie/JS input, signup, or SLA is implemented. `browserMs` is the provider-reported usage of the successful render, or null when unavailable; it excludes prior failed attempts and is not total billable usage.

## Development and verification

```sh
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test
pnpm build
```

Run these from this directory. Tests use local Miniflare D1/R2 and stub only browser execution and queue transport. `pnpm dev` uses remote Browser Run and may incur usage.

## Provisioning a fresh pilot

Authenticate Wrangler, adjust resource names and config for your account, then run:

```sh
pnpm exec wrangler d1 create openscreenshot-capture-pilot
# Copy the returned database_id into wrangler.jsonc.
pnpm exec wrangler queues create openscreenshot-capture-pilot
pnpm exec wrangler r2 bucket create openscreenshot-capture-pilot
pnpm exec wrangler r2 bucket lifecycle add openscreenshot-capture-pilot expire-pilot-artifacts '' --expire-days 1 --force
pnpm exec wrangler r2 bucket lifecycle list openscreenshot-capture-pilot
pnpm exec wrangler d1 migrations apply openscreenshot-capture-pilot --remote
pnpm run deploy
pnpm exec wrangler secret put CAPTURE_API_KEY
```

Use a random secret of at least 32 characters. Without it, protected routes fail closed with 503. Never enable public R2 access. The current deployment already has these resources and the secret; do not rerun resource creation. Secrets are retained by normal deployments. To rotate, use `wrangler secret put` and update the ignored local file. Use `pnpm run deploy` explicitly because `pnpm deploy` is a different built-in command.

## Live smoke benchmark

```sh
CAPTURE_BASE_URL=https://openscreenshot-capture-pilot.pghq.workers.dev node scripts/benchmark.mjs
```

Reads the operator key from `.dev.vars`, creates three jobs sequentially, checks idempotency and unauthenticated denial, polls completion, and downloads PNGs. Results and images go to ignored `benchmark-output/`; each rerun consumes three admission slots and real browser usage. Timing includes network transit and up to 1.5 seconds polling delay. This small smoke run cannot establish production p95 or reliability. Inspect images visually in addition to checking transport success.

Before paid launch: broader target quality/reliability runs, customer authentication and isolation, hardened arbitrary-URL network policy, usage accounting including failures, billing/quotas, operational alerts, and product onboarding.

Latest measured results and visual quality findings: [September 13 benchmark](docs/benchmark-2026-09-13/REPORT.md). The initial mobile smooth-scroll defect is addressed in the [mobile fix follow-up](docs/mobile-fix-2026-09-13/REPORT.md).

For a bounded custom corpus, set `CAPTURE_CASES_FILE` to a JSON array of `[url, width, height]` tuples (1–10 cases). Every case still goes through the API's hostname policy and daily admission limit. For example, from this directory:

```sh
CAPTURE_BASE_URL=https://openscreenshot-capture-pilot.pghq.workers.dev CAPTURE_CASES_FILE=docs/mobile-fix-2026-09-13/cases.json node scripts/benchmark.mjs
```

## Failure diagnostics

`jobs.last_failure_json` retains the most recent failed attempt's sanitized diagnostics until job cleanup, even if a later attempt succeeds. It stores attempt number, internal error code, HTTP status, up to eight numeric provider codes, a validated Cloudflare Ray ID, elapsed time, provider-reported browser time when present, and error-body parse state. The same object goes to structured Worker logs under `capture_attempt_failed`. It is not included in API responses. Provider messages, detail strings, page content and target URLs are never copied into this diagnostic object. Logs use Cloudflare's configured retention, independently of job cleanup.

Error-body reads are bounded to 8 KiB and remain inside the existing 45-second deadline. Unknown/malformed 422 errors remain terminal; arbitrary message text cannot activate retries. Code 6002 was verified with a controlled provider navigation timeout. The three-render cap still applies. This stores the latest failure, not a complete attempt history or billing ledger.

On an existing pilot, apply pending migrations **before** deploying updated code:

```sh
pnpm exec wrangler d1 migrations apply openscreenshot-capture-pilot --remote
pnpm run deploy
```

The nullable diagnostic column is additive and compatible with the previous Worker. Reliability investigation and new measurements: [September 13 follow-up](docs/reliability-2026-09-13/REPORT.md).

## Free-beta preview

The Worker root now serves a standalone URL → desktop/mobile preview → PNG download page. `/beta/*` uses an opaque Secure/HttpOnly/SameSite=Strict cookie and per-job ownership, not the operator bearer credential. Same-origin JSON submission is required. `BETA_ENABLED=false` pauses all beta API operations, including access to existing beta captures; the operator API remains available.

**This is a supported-site preview, not an unrestricted public launch.** The UI explicitly lists the same trusted hosts enforced on top-level URLs, redirects and resource requests. Do not broaden the list to arbitrary caller-supplied hosts. General launch requires a verified browser egress policy enforcing public destinations at connection time; DNS preflight alone does not close rebinding races. No homepage navigation or extension privacy copy was changed.

Five new jobs per UTC day per browser and per network address, and the existing global20/active5 caps, are checked in the same SQL admission statement. Each job remains capped at three render attempts. These are job/render bounds, not a dollar-denominated ceiling on the Cloudflare account. Incoming request charges and remote timeout cancellation remain provider-level constraints.

Metrics are operator-only: `GET /v1/beta-stats` with the operator token. Daily started/succeeded/failed/first-download-request counters come from database transition triggers. Preview requests and HEAD requests do not count as downloads. A download request is not proof of a saved file. Browser activity tracks capture count and distinct active UTC days; cookie resets and shared devices limit identity accuracy. Pseudonymous activity expires30days after use; aggregate daily rows90days. Operational jobs/URLs expire through the existing24h cleanup. No URLs or raw IPs in metrics; IP-derived quotas use keyed daily hashes within expiring job rows.

For local preview: apply D1 migrations with `--local`, then `pnpm exec wrangler dev --var BETA_ENABLED:true`. Browser Run remains remote and incurs real usage. UI files are served as Worker text modules; the Vitest loader mirrors Wrangler's Text rules. `ui/beta.js.txt` is plain browser JavaScript served at `/beta.js` with the correct MIME type. The page is noindex while general launch is gated.
