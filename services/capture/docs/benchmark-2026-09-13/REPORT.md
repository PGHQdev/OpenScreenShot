# Hosted capture pilot — September 13, 2026

The deployed path works: authenticated submission → D1 job → Cloudflare Queue → Browser Run scrolling capture → private R2 object → authenticated download. Three jobs eventually succeeded; mobile needed one retry. This is a functional pilot, not production reliability evidence. **Mobile visual quality did not pass**: the output has excessive blank space above the hero and overlapping header/hero content.

Endpoint: https://openscreenshot-capture-pilot.pghq.workers.dev

| Target / viewport            | Attempts |  Submission |           Observed ready | Complete download | PNG                      |
| ---------------------------- | -------: | ----------: | -----------------------: | ----------------: | ------------------------ |
| example.com, 1440×900        |        1 |      1.57 s |                   9.86 s |           10.93 s | 1440×900, 19,628 bytes   |
| openscreenshot.app, 1440×900 |        1 |      0.49 s |                  12.44 s |           13.89 s | 1440×5812, 831,453 bytes |
| openscreenshot.app, 390×844  |        2 | unavailable | 130.95 s server duration |       unavailable | 390×7395, 511,327 bytes  |

Desktop ready times include client transit, a duplicate-submission check, and polling every 1.5 seconds. Complete download includes an unauthenticated artifact-denial check. Mobile's original polling connection failed with ECONNRESET; its existing job was retrieved later without resubmitting. Its 130.95 seconds is D1 `updated_at - created_at` (1789262527033 − 1789262396079), not client-observed latency. Do not combine these values into percentiles.

Successful-render browser usage was 4.15 s, 9.26 s, and 10.33 s respectively. Mobile's first attempt hit the local 45-second deadline; its usage is unknown and excluded. These numbers cannot establish total unit cost. The scheduled recovery pass retried mobile automatically and the second attempt completed.

## Verification

- Desktop idempotent replay returned the same job; authenticated downloads matched reported sizes and PNG signatures.
- Unauthenticated access to job data and all downloaded artifacts returned 401. Public OpenAPI returned 200.
- D1 showed exactly three admitted jobs: two first-attempt successes, one second-attempt success.
- The pilot Queue had one producer and one consumer, both the pilot Worker.
- R2's enabled `expire-pilot-artifacts` lifecycle rule expires all prefixes after one day. This is the eventual cleanup backstop for uploads that finish after their job record is removed; lifecycle timing itself was not waited out.
- 25 local API/state tests passed, including concurrent submissions/delivery, quotas, transient/permanent failures, enqueue and interrupted-completion recovery, expiration, malformed/oversized PNGs, and the late-upload cleanup race. Typecheck, Worker bundle and source ESLint passed.
- Initial admission immediately after secret creation returned 503; the later attempt worked. Secret propagation is suspected but not proven. No job was created by the failed request.

## Visual inspection and decision

[Desktop capture](1.png) includes the hero, product preview, lower-page content and footer; no obvious missing major section was observed. [Mobile capture](2.png) includes lower-page content but shows excess top whitespace and header overlap. Transport success must not be counted as acceptable screenshot quality.

Keep Cloudflare for the pilot. Before expanding targets or charging, investigate the mobile scroll/full-page interaction, add explicit visual acceptance criteria across a broader controlled corpus, and rerun with repeated desktop/mobile captures. The benchmark client now retries transient transport failures using the same idempotency key and writes an in-progress job checkpoint; that revised client was syntax-checked but has not been rerun against paid browser execution.

Raw desktop timings/checks: [results.json](results.json). Recovered mobile metadata: [mobile-recovered.json](mobile-recovered.json). Captures contain public pages only; no credentials are included.
