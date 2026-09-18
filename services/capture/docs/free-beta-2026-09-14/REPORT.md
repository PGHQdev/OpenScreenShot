# Free-beta supported-site preview — September 14, 2026

A working anonymous URL → desktop/mobile capture → preview → PNG download flow is deployed at https://openscreenshot-capture-pilot.pghq.workers.dev/ . It is a no-index preview, **not the unrestricted public launch**. Supported target/resource hosts remain `example.com` and `openscreenshot.app`; the UI lists them explicitly.

## Delivered

- An input-first standalone page using the existing OpenScreenShot visual style, with visible loading/failure/success states, responsive sizes, real image preview and download. Hosted processing and limits are disclosed; no extension/local-only privacy claim is reused.
- Random 256-bit HttpOnly/Secure/SameSite=Strict cookie identifies an anonymous browser. Ownership checks protect every beta status/image/download route; operator bearer API stays separate. Cookie values are stored only as keyed hashes. Cross-origin writes are rejected.
- Atomic admission checks enforce 5 new jobs/day/browser and network address, plus the existing 20 global/day and 5 active jobs. Three-render cap and timeout behavior are unchanged. Clearing cookies does not bypass the network cap. These are render/admission controls, not a guaranteed total account dollar cap.
- Anonymous aggregate measurements count admissions, terminal success/failure and first GET download requests. Preview/HEAD/duplicate downloads do not increment download metrics. Repeated same-day activity and next-day return activity are separate. Metrics contain no target URLs/images/raw IPs; operational jobs still contain URLs until 24h cleanup. Activity retention 30 days after use, daily totals 90 days. Cloudflare logs have separate provider retention.
- Operator-only `/v1/beta-stats`, updated machine-readable API documentation and auth guidance. Kill switch: set `BETA_ENABLED=false` and redeploy. It pauses beta operations, including retrieval, without disabling the operator API.

## Evidence

40 critical tests pass, including cross-owner protection, CSRF, kill switch, idempotency, concurrent admission caps, quota across cookie resets, transition metrics, and next-day return measurement. TypeScript, Worker bundle and source ESLint pass.

Local real Browser Run capture succeeded through the UI. Live mobile capture of openscreenshot.app returned a 390×7403 PNG and was previewed/downloaded in the browser. Operator metrics then showed 1 admission, 1 success, 0 failures and 1 download. These are **our smoke-test events, not customer adoption**. [Smoke metrics](smoke-metrics.json).

No horizontal overflow at 320, 375, 414 and 768 pixels. Browser axe scan: 0 violations, with two decorative-symbol contrast checks flagged for manual review; those use the same high-contrast foreground/background as their surrounding controls. Preview rendering was checked visually at desktop/mobile. [Live desktop](live-desktop.png), [mobile check](mobile.png). The earlier mobile capture predates the final privacy-block/header-label polish.

Initial Lighthouse: performance 100, accessibility 100, best practices 96, SEO 63. The best-practices issue was missing favicon 404 and was fixed. SEO intentionally reflects noindex/robots blocking while release remains gated. See lighthouse.json for the initial evidence and lighthouse-final.json for the rerun if present.

Review found stale idempotency/result-state issues in the browser controller: successful same-input submissions reused old jobs, old results remained visible on a new request, and a delayed image callback could reopen a stale result. Fixed by clearing terminal success keys, hiding/resetting the old image/link on submission, and removing the redundant load callback. Transport-uncertain retries retain their idempotency key.

## General-launch blocker

The trusted-domain request pattern is appropriate for this preview. It is not a general public-URL egress policy. Before accepting arbitrary sites, enforce public destination checks at connection time across document/resource/redirect requests and prevent DNS-rebinding bypass. A one-time DNS check or regex-only IP block is insufficient. Current Quick Actions documentation did not establish that guarantee; no such guarantee is claimed here.

The existing site homepage was not replaced or linked to this preview. No billing, signup requirement, external analytics or plan upgrade was introduced.

Design references: [Firecrawl input-first section via Mobbin](https://mobbin.com/sites/sections/7374e232-3232-4f76-bf3e-a95a4ee73b8a), inspected to inform hierarchy; no copied images. [Lenny's activation guidance](https://www.lennysnewsletter.com/p/what-is-a-good-activation-rate) informed first-download-request as an initial activation hypothesis, not a proven retention predictor.

Final deployment: `3c6e3c2d-e272-4c16-a974-a342e124a6a6`. Final review confirmed no outstanding scoped findings. [Final mobile preview](live-mobile-final.png) includes the hosted-processing disclosure.

Final Lighthouse: performance 98, accessibility 100, best-practices 100, seo 63. SEO remains intentionally limited by noindex.
