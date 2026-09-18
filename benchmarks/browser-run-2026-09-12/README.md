# Cloudflare Browser Run exploratory benchmark

This directory contains an exploratory measurement harness and real capture artifacts, not production service code. No Worker was deployed and the extension/site runtime was not changed.

## Reproduce

Requires Node.js with built-in fetch and the repository's existing `sharp` dependency for the analysis script. The runner takes `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` from the environment. If no API token is set, it reads the locally stored macOS Wrangler OAuth credential in memory. It never writes credentials to artifacts.

```sh
node benchmarks/browser-run-2026-09-12/run.mjs
node benchmarks/browser-run-2026-09-12/analyze.mjs
node benchmarks/browser-run-2026-09-12/scroll-experiment.mjs
node benchmarks/browser-run-2026-09-12/analyze.mjs benchmarks/browser-run-2026-09-12/scroll-experiment
node benchmarks/browser-run-2026-09-12/pdf-corrected.mjs
node benchmarks/browser-run-2026-09-12/analyze.mjs benchmarks/browser-run-2026-09-12/pdf-corrected
```

Set the account/token environment variables before running. Preserve this results directory before rerunning: the scripts overwrite result files and artifacts. Each run consumes Cloudflare Browser Run quota. The account used for this run was selected from `pnpm exec wrangler whoami`.

## Baseline design

- Eight URLs, three sequential rounds: example.com, openscreenshot.app, screenshotone.com, astro.build, MDN JavaScript documentation, Wikipedia Screenshot article, Hacker News, daytona.io.
- Desktop: 1440 x 900 viewport, device scale factor 1, full-page PNG.
- Four single mobile probes: 390 x 844 viewport, device scale factor 1, mobile/touch emulation. Default service user agent is retained; this is not full device fidelity testing.
- Two single PDF probes: A4, background graphics enabled, default print media behavior. This differs from a screenshot embedded in a PDF.
- Navigation: `networkidle2`, 25-second navigation timeout; 65-second client deadline covering the whole request/download.
- Requests start at least 11 seconds apart. No automatic retries, concurrency test, cookie removal, ad blocking, scrolling, or custom rendering scripts in the baseline.
- Stop on authentication or rate-limit responses. Stop starting new jobs after a conservative 480-second browser budget (missing usage charged as 65 seconds for this safety calculation only).
- One preliminary example.com auth probe is excluded from the baseline statistics.

## Measurement interpretation

`elapsedMs` measures the REST request through complete artifact download on the operator's local machine. It includes network transfer and service overhead; it is not browser execution time or a measurement of a deployed Worker/Queue/R2 pipeline.

`browserMs` is Cloudflare's `X-Browser-Ms-Used` header. A missing header is unknown usage, not zero. Rates in `summary.json` use reported usage only and therefore are incomplete when any header is missing.

`artifactValid` means HTTP success plus the correct PNG/PDF signature. It does **not** mean that the intended page is complete, unblocked, or visually correct. Image dimensions come from PNG headers. Visual notes are recorded separately in REPORT.md.

Percentiles use nearest rank over valid artifacts only. With this small sample, p95 is descriptive and unstable, not a service-level guarantee. Failed-request latency is reported separately. The pages were selected for variety, not sampled from paying customers, and there are no approved reference images for pixel-perfect comparisons.

## Follow-up experiment

`scroll-experiment.mjs` changes only `scrollPage: true` relative to the baseline capture settings. It captures ScreenshotOne and Astro twice each, saving results separately in `scroll-experiment/`. These pages visibly lacked lower-page images in the baseline and their HTML contains native lazy-loaded images.

The baseline PDF requests used uppercase `A4`, which the API rejected before rendering. `pdf-corrected.mjs` uses lowercase `a4`, the only changed parameter, and saves the corrected measurements separately. Retain the invalid requests as harness errors, not service rendering failures.

## Sources

- [Screenshot endpoint](https://developers.cloudflare.com/browser-run/quick-actions/screenshot-endpoint/)
- [Screenshot API options, including scrollPage](https://developers.cloudflare.com/api/resources/browser_rendering/subresources/screenshot/methods/create/)
- [PDF endpoint](https://developers.cloudflare.com/browser-run/quick-actions/pdf-endpoint/)
- [Limits](https://developers.cloudflare.com/browser-run/limits/)
- [Pricing](https://developers.cloudflare.com/browser-run/pricing/)

Pricing reference: Workers Paid includes 10 browser hours/month, then $0.09/additional browser-hour. Quick Actions has no browser-session concurrency surcharge. Estimates here exclude the plan subscription, other services, storage, payment fees, support, and unknown usage; they are not an invoice. Free-plan limits include 10 minutes/day and one Quick Actions request per 10 seconds.
