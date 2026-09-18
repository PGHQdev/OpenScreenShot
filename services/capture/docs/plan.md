# Capture pilot implementation plan

Goal: implement the approved asynchronous URL-to-PNG job, with explicit scrolling, bounded retries, private R2 storage, then measure the complete path.

Architecture: a separate Hono Worker handles bearer-authenticated pilot requests and consumes its own Cloudflare Queue. D1 persists idempotency, state, leases, attempts, expiry and dispatch recovery. Browser Run Quick Actions renders PNGs; R2 stores per-attempt artifacts. A scheduled recovery pass re-enqueues stranded jobs and deletes expired artifacts.

Scope: single operator credential, approved target/resource hostname allowlist, public HTTPS pages, fixed full-page PNG capture with desktop/mobile viewport choices. No customer accounts, billing, public signup, arbitrary JS/cookies, or changes to the local extension/site. This is a private pilot, not a publicly launchable screenshot API.

Constraints: pnpm; use current existing Cloudflare account without upgrading plans; maximum three render attempts/job; 45-second browser-call deadline, 180-second lease; 24-hour API access; scheduled metadata/artifact deletion with asynchronous R2 lifecycle backstop; default 20 new jobs/day and five active jobs; finite PNG byte/pixel limits. Unknown browser usage stays null. Credentials never appear in logs or benchmark output. All redirects and subresources are constrained by the operator-maintained hostname allowlist. DNS-level rebinding protection is not claimed; only trusted domains belong on the list.

- [x] Task 1: Add package/config/schema and failing API/state tests using real Miniflare D1/R2, stubbing only remote Browser Run and queue delivery. Cover authentication, rejected URLs, duplicate/conflicting idempotency keys, quota, successful capture, duplicate delivery, transient/permanent failures, lease recovery, failed enqueue recovery, expiry, invalid image data.
- [x] Task 2: Implement validation/auth, D1 state store, Browser Run adapter, Hono routes, Queue handler and scheduled recovery. Per-attempt immutable R2 keys plus lease-token compare-and-set fence stale workers. Commit job completion only after storing its artifact; reuse a previously stored artifact after an interrupted DB commit.
- [x] Task 3: Run critical tests and typecheck/build. Add API documentation, OpenAPI schema, exact provisioning commands and a private smoke benchmark script. Review failure paths, data exposure, request bounds and credentials.
- [x] Task 4: Provision separately named pilot D1/Queue/R2 resources only if account capabilities permit, deploy authenticated Worker and run a small end-to-end benchmark through job creation, queue processing, status and artifact download. If provider blocks provisioning, finish all local work and report the exact unmet prerequisite; do not upgrade a billing plan.

Acceptance: duplicate submissions create one job; concurrent delivery cannot render one job twice while its lease is live; retryable errors stop after three renders; recovery tolerates enqueue and post-upload interruptions; expired jobs cannot serve artifacts; all endpoints that expose jobs/data require authentication; no runtime mutation of the existing site/extension.
