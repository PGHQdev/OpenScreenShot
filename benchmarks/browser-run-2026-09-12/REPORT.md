# Browser Run benchmark - September 12, 2026

## Decision

Continue with Cloudflare Browser Run. The small live sample supports technical feasibility and low browser-compute cost, but does not establish production reliability or visual fidelity across arbitrary sites. Quick Actions with explicit scrolling is a viable first implementation candidate; a programmable browser session is not yet justified solely by the lazy-image issue.

Thirty baseline requests were attempted: 24 desktop screenshots, four mobile screenshots, and two malformed PDF requests. Four scrolling follow-ups and two corrected PDF requests brought the measured dataset to 36 requests and 33 valid artifacts. A separate successful example.com authentication probe brings the actual call count to 37. Nothing was deployed.

## Baseline desktop results

| Page           | Valid PNGs / attempts | Successful latency range | Median browser time |
| -------------- | --------------------: | -----------------------: | ------------------: |
| example        |                 3 / 3 |               2.51-3.23s |               2.28s |
| openscreenshot |                 3 / 3 |               4.31-5.85s |               3.26s |
| screenshotone  |                 3 / 3 |              8.44-12.07s |               4.81s |
| astro          |                 3 / 3 |               6.72-9.73s |               3.91s |
| mdn            |                 3 / 3 |               4.70-5.96s |               3.10s |
| wikipedia      |                 2 / 3 |               3.90-5.52s |               1.92s |
| hn             |                 3 / 3 |               4.08-4.56s |               3.42s |
| daytona        |                 3 / 3 |              8.57-19.36s |              15.69s |

Aggregate desktop: **23/24 valid PNGs (95.8%)**, **5.52s p50**, **17.47s p95** over successful requests using nearest rank. One Wikipedia request exceeded the client's 65-second deadline without a response; the next two identical requests succeeded in 3.90s and 5.52s. Root cause remains unknown. The 25-second navigation timeout did not bound this end-to-end request. No automatic retry was used, so repeat-round recovery is not a measured retry policy.

Four mobile probes all returned valid PNGs, with 4.61s p50 and 10.51s maximum. These are single observations per site, not a mobile SLA. Together, baseline screenshots returned 27/28 valid PNGs. File validity is not visual correctness.

## Visual findings

- **OpenScreenShot desktop:** first full-page image contains the hero, feature sections, FAQ, and footer. Dimensions stayed 1440 x 5820 across all three runs. The mobile top-of-page review shows crowding/overlap in the hero's demo tabs; origin-page versus renderer causation was not isolated.
- **ScreenshotOne:** all three baseline desktop images have blank illustration panels and article thumbnails below the fold. Its fetched HTML contains 10 images marked `loading="lazy"` out of 16 image tags.
- **Astro:** all three baseline desktop images omit theme previews, some integration icons, and partner images. Its fetched HTML contains 41 images marked `loading="lazy"` out of 43 image tags.
- **Daytona:** first desktop capture contains page structure and graphics but an empty computer-use panel; video completeness was not established. Mobile top-of-page capture includes a cookie-consent overlay. Desktop execution time varies considerably across runs; no cache or cold/warm attribution is possible from this endpoint alone.
- **MDN and Wikipedia:** reviewed successful captures contain the intended article/documentation rather than a block page. Heights change across repeats (MDN 4450/4540; Wikipedia 4098/4220). MDN's reviewed repetitions have different ad/banner state. These are not deterministic visual-regression baselines.
- **Hacker News:** first capture contains the listing and footer. Dimensions remain consistent across all runs.

Visual QA covered representative full desktop captures, all three ScreenshotOne/Astro baseline repetitions, all four mobile top sections, all four scrolling captures, and every PDF page at overview scale. It is not exhaustive pixel-level verification of all screenshots and there are no customer-approved reference images.

## Controlled scrolling follow-up

The only payload change was `scrollPage: true`; viewport, navigation policy, URL, and PNG options remained the same. Two runs per affected site:

| Page          | Baseline mean browser time (3 runs) | Scrolling mean browser time (2 runs) | Scrolling end-to-end latency | Visual result                                                                                         |
| ------------- | ----------------------------------: | -----------------------------------: | ---------------------------: | ----------------------------------------------------------------------------------------------------- |
| ScreenshotOne |                               5.36s |                               13.84s |                 20.68-20.90s | Both missing illustration panels, testimonial portrait, and article thumbnails populated in both runs |
| Astro         |                               4.06s |                                5.86s |                 12.01-13.63s | Theme previews, integration icons, and partner graphics populated in both runs                        |

This supports lazy loading as the cause of the observed omissions. Scrolling does not remove overlays, freeze animation, guarantee fonts/images have settled, or prove infinite-scroll behavior is bounded. The ScreenshotOne follow-ups also contain a chat bubble that was absent in the baseline; dynamic page state still changes.

Inspect [baseline gallery](gallery.html) and [scrolling gallery](scroll-experiment/gallery.html); every preview links to its original PNG.

## PDF findings

Both initial PDF requests were rejected with HTTP 400 because the harness sent uppercase `A4`. These are request-validation/harness failures, not rendering failures; the error responses report zero browser usage. Original requests/errors remain in results.json.

Changing only the format to lowercase `a4` produced:

| Page           | Result       | Complete request | Reported browser time | PDF pages |
| -------------- | ------------ | ---------------: | --------------------: | --------: |
| OpenScreenShot | Valid A4 PDF |            9.85s |                 5.94s |         6 |
| MDN            | Valid A4 PDF |            3.07s |                 2.14s |         3 |

Poppler parsed both PDFs and rendered all nine pages for review. OpenScreenShot's hero splits awkwardly between pages 1 and 2; other sections also split at page boundaries. MDN uses a more readable print layout. Treat URL-to-PDF as browser print output, not a polished agency report. For the proposed product, generate a report template containing the captured images and metadata.

PDF metadata reports `HeadlessChrome/128.0.0.0` and `Skia/PDF m128`. This is metadata evidence only; browser-version support and rendering compatibility should be checked before committing to fidelity guarantees.

## Cost

At the published marginal rate of $0.09 per browser-hour:

- Baseline screenshots: 123.78 reported browser seconds for 27 valid PNGs, equivalent to **$0.115 per 1,000 returned screenshots** for this sample's mix. The missing Wikipedia request usage is excluded, so this is not total cost per successful job.
- Scrolling: 39.39 reported browser seconds for four captures, equivalent to **$0.246 per 1,000 captures** for this two-site mix. Site-specific estimates are $0.346/1,000 for ScreenshotOne and $0.146/1,000 for Astro.
- All 36 recorded requests: 171.25 reported browser seconds, or **$0.00428** at marginal rates, plus unknown usage for one timed-out request. The preliminary auth probe adds 2.39 reported seconds ($0.00006).
- Valid artifact payloads total 36,912,847 bytes across 33 artifacts. Storage and delivery must be accounted for separately.

These estimates exclude included allowances, billing rounding, the Workers subscription, queue/API/R2 operations, retention, payment fees, support, retries, and unknown usage. They are not the actual account bill and do not establish margins for a $49 plan. No account plan was upgraded.

## Next implementation decisions

1. Start with asynchronous jobs and explicit status/error codes. Separate navigation timeout from an end-to-end service deadline; add bounded retry/backoff for transient failures, and idempotent usage accounting.
2. Offer full-page capture with scrolling enabled, but benchmark its page-height/runtime bounds before opening arbitrary public traffic. Explicitly distinguish requested viewport from actual output dimensions.
3. Add an intentional overlay policy, image/font readiness checks where needed, and deterministic animation handling for customers who require repeatability. Re-benchmark these settings; do not assume the current cost/latency holds after additional work.
4. Build the agency PDF as a report layout. Do not promise polished reports from the raw URL-to-PDF endpoint.
5. Before paid launch, run the same harness against a customer-derived set of at least 100 URLs, plus a bounded concurrency test and cases for redirects, blocked sites, failure recovery, very long pages, lazy loading, and tenant/network isolation. Validate the actual Worker/Queue/R2 path; this run measured only the REST API from the local client.

## Evidence and reproduction

See [methodology and commands](README.md), [baseline raw measurements](results.json), [baseline summary](summary.json), [scrolling measurements](scroll-experiment/results.json), and [corrected PDF measurements](pdf-corrected/results.json). The original harness deliberately retains the invalid PDF parameter so its results remain reproducible; use pdf-corrected.mjs for valid PDF probes.

Sources: [Cloudflare screenshot API](https://developers.cloudflare.com/api/resources/browser_rendering/subresources/screenshot/methods/create/), [pricing](https://developers.cloudflare.com/browser-run/pricing/), and [limits](https://developers.cloudflare.com/browser-run/limits/), consulted September 12, 2026.
