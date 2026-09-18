# Mobile capture fix — September 13, 2026

The previous mobile screenshot defect was reproducible with Cloudflare's scrolling screenshot action. The target page sets `html { scroll-behavior: smooth; }`. Returning to the top starts an animation; capturing during it produces blank space and a displaced sticky header.

## Isolated diagnosis

In a local Chromium session at 390×844, immediately reading `scrollY` after returning from 2,000 pixels to the top reported 2,000 with smooth scrolling, and 0 with instant scrolling. The normal header rectangle at the top was y=0, height=72.

Cloudflare comparison used the same URL, viewport, allowlist, network wait and full-page options. Only `addStyleTag` changed. REST caching was disabled with `cacheTTL=0`.

| Variant                   | Request duration | Provider browser time | Output                                     |
| ------------------------- | ---------------: | --------------------: | ------------------------------------------ |
| Original smooth scrolling |          11.85 s |               10.37 s | 390×7395; blank top and overlapping header |
| Instant scrolling         |           4.39 s |                3.78 s | 390×7403; correct top/header               |
| Instant scrolling repeat  |           4.38 s |                3.71 s | Byte-identical to first corrected image    |

See [before](baseline.png), [after](instant-scroll.png), and [raw diagnostic inputs/results](diagnostic.json). All three PNGs decoded successfully. The two corrected images had identical SHA-256 hashes.

## Fix

The renderer injects `html, body, * { scroll-behavior: auto !important; }` into the isolated capture page before scrolling. It continues scrolling to trigger lazy loading. It does not hide or reposition headers, disable other animations, alter the source website, or accept caller-supplied CSS/JavaScript.

Cloudflare documents inline CSS injection through [`addStyleTag`](https://developers.cloudflare.com/api/resources/browser_rendering/subresources/screenshot/methods/create/). This fixes the observed CSS smooth-scroll race; it does not guarantee correct captures for custom JavaScript scrolling or all sticky layouts.

The renderer regression test failed before the change and passed afterward. All 26 tests, TypeScript, Worker build and source ESLint passed. Deployed Worker version: `5c57d46e-190e-4279-8ec7-83fdf9d82923`.

## Expanded deployed benchmark

The six-case corpus includes a static control, desktop landing page, two mobile landing captures, mobile privacy page and desktop documentation. Every case uses the authenticated asynchronous API and private artifact download. This is a small controlled corpus on two trusted domains, not a production reliability or arbitrary-site compatibility claim.

| Case                              | Result    | Attempts | End-to-end |
| --------------------------------- | --------- | -------: | ---------: |
| example.com/ 1440px               | succeeded |        1 |    16.03 s |
| openscreenshot.app/ 1440px        | succeeded |        1 |     7.94 s |
| openscreenshot.app/ 390px         | succeeded |        1 |     7.73 s |
| openscreenshot.app/ 390px         | succeeded |        1 |     3.17 s |
| openscreenshot.app/privacy/ 390px | succeeded |        1 |     7.60 s |
| openscreenshot.app/docs/ 1440px   | failed    |        1 |    36.43 s |

Five of the initial six jobs succeeded on attempt one. The failed documentation job terminated with `render_rejected` after 36.43 seconds. This failure remains part of the result; subsequent rechecks do not erase it. An uncached direct provider recheck using the same rendering options succeeded in 6.07 seconds and produced a visually complete 1440×9046 image. The original provider response body/status was not retained, so the cause of its rejection is unresolved.

All five successful deployed artifacts decoded, passed authentication/idempotency checks, and had plausible page content on inspection. Both deployed mobile images exactly match the corrected diagnostic image. Desktop, mobile landing and mobile privacy headers appear at the top without the original overlap. The docs diagnostic includes the top heading, lower sections and footer.

**Cache caveat:** the deployed pilot uses the provider's default five-second cache. The second mobile job returned in 3.17 seconds with the same browser-usage header as the first; this is consistent with a cache hit, not evidence of a faster independent render. The isolated diagnostic used `cacheTTL=0` for both corrected captures, so that repeat establishes the fix independently of the cache. Do not derive cold-render latency, cost or reliability percentiles from this run.

Raw deployed results: [deployed-results.json](deployed-results.json). Direct documentation recheck: [docs-diagnostic.json](docs-diagnostic.json). Corpus: [cases.json](cases.json).

Next reliability work: preserve sanitized provider status/error codes, investigate intermittent rejections before choosing retry classifications, and explicitly control cache behavior in fresh-render benchmarks. The mobile rendering defect is fixed for the tested page; broader production readiness remains unproven.

A separate authenticated documentation recheck also succeeded on attempt one, downloading in **11.69 seconds**. Its image matches the visually inspected direct diagnostic byte-for-byte. See [docs-deployed-recheck.json](docs-deployed-recheck.json). Across the initial six jobs plus this recheck: six successes and one failure.
