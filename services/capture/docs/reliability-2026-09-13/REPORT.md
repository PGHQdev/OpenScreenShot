# Provider failure investigation — September 13, 2026

The earlier intermittent documentation rejection cannot be conclusively diagnosed because its HTTP status and provider error code were discarded. This update closes that diagnostic gap and corrects a verified retry-classification defect: Browser Run reports navigation timeouts as HTTP 422/code 6002, which the pilot previously treated as terminal.

## Provider evidence

A controlled request used the existing documentation page and normal capture settings, except for a deliberately reduced 1 ms navigation timeout. The uncached provider response was HTTP 422, with numeric error code 6002, a timeout message and `Navigation timeout of 1 ms exceeded` detail. Two subsequent uncached requests with the normal 25-second navigation timeout returned 200, in 5.63 and 5.78 seconds. [Probe results](probe.json) preserve the public-target experiment.

[Cloudflare's FAQ](https://developers.cloudflare.com/browser-run/faq/) confirms that 422 can indicate timeouts, page crashes or memory problems; status 422 alone does not identify a permanent request error. The controlled code 6002 observation supports a narrow timeout retry, not retrying every 422. No claim is made that the earlier natural rejection had that code.

## Changes

- HTTP 422 with numeric provider code 6002 now uses `render_timeout` and the existing bounded backoff. HTTP 408, 429 and 5xx remain retryable. Other 4xx and unknown/malformed 422 responses remain terminal. Free-form error messages never determine retries.
- Failure responses are read within an 8 KiB limit and the existing 45-second deadline. Only HTTP status, up to eight bounded numeric provider codes, a validated Ray ID, provider browser milliseconds, parse-state enum and elapsed time are retained.
- `jobs.last_failure_json` stores the latest failure plus attempt number/internal code under the same lease-checked database update as job failure. It survives successful recovery and expires with the job. It is also logged, but omitted from the public job API. Raw provider messages, details, URLs and response bodies are not copied to production diagnostics. This is not a complete attempt/billing ledger; logs have separate provider retention.
- `cacheTTL: 0` now explicitly requests a fresh provider render for every new job. API idempotency still returns existing jobs. This avoids mixing response-cache hits with fresh-render measurements.
- Additive migration `0002_failure_diagnostics.sql` was applied before deployment. Worker version: `d8b64b7d-a324-4279-8c5a-cfedeac4db37`.

## Verification

The new tests first failed with premature terminal timeout classification and missing diagnostics. After implementation, 33 tests passed, covering recovery, the three-attempt limit, persistence after success, invalid/oversized bodies, status gating, and rejection of untrusted diagnostic strings. TypeScript, Worker build and source ESLint passed. The cache assertion also failed before adding the explicit setting.

The controlled timeout was a direct provider request; timeout-to-success recovery and its retained diagnostics were verified using local real Miniflare D1/R2 with simulated provider responses. Do not present this as a forced-failure test through the deployed queue.

## Deployed fresh-render benchmark

Four sequential jobs: documentation three times, then mobile landing page. Uses the existing authenticated API, queue and private artifact downloads. All inputs remain on the existing trusted-host allowlist. This is a small functional rerun, not an SLA or population reliability estimate.

| Case           | Attempts |   Ready | Download complete | Browser time |
| -------------- | -------: | ------: | ----------------: | -----------: |
| Docs 1         |        1 | 14.17 s |           15.41 s |       5.57 s |
| Docs 2         |        1 |  8.99 s |           10.20 s |       6.45 s |
| Docs 3         |        1 |  8.71 s |            9.74 s |       5.71 s |
| Mobile landing |        1 |  8.74 s |            9.69 s |       4.20 s |

**4/4 succeeded on attempt one.** All idempotency, unauthenticated-denial and PNG-size/signature checks passed. All four PNGs decoded successfully. Desktop documentation and mobile landing page images passed visual inspection for top/header placement and presence of lower content/footer. Two documentation images matched the previously inspected diagnostic byte-for-byte; the other documentation image and mobile image were inspected separately.

Ready/download timings include client network transit, polling and authentication/idempotency checks. Provider response caching was disabled. This run did not naturally encounter a failure, so it does not validate live retry delivery for code 6002; that behavior has the controlled provider evidence and local state-machine tests described above. Failed-attempt usage must not be inferred from these successful-render numbers.

[Raw measurements](deployed-results.json) · [Documentation capture](1.png) · [Mobile capture](3.png)

Focused independent code review found no important correctness/privacy issues in bounded parsing, classification, lease-checked diagnostic persistence or logging. No billing plans, hostname allowances or daily job limits changed.

Conclusion: the verified timeout classification defect is fixed and diagnostic retention is deployed. The historical rejection remains unidentified. The private pilot has a stronger recovery path, but this small rerun does not establish paid-service reliability.
