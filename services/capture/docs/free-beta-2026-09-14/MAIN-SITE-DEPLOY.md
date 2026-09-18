# Main-site deployment verification

Hosted beta: https://openscreenshot.app/capture/

Main site Worker version: `16120b1f-7085-4f60-b382-bfdd4e718c1e`.

- Capture service deployed before the main site service binding.
- `/capture` returns 308 to `/capture/`.
- Live browser submission of bare `openscreenshot.app` normalizes the visible input to `https://openscreenshot.app`, without native URL validation blocking submission.
- Capture completed with a loaded 1440 × 5820 preview.
- Same-origin `/capture/beta/captures/:id/download` returned HTTP 200, `image/png`, 834,911 bytes, and the PNG signature.
- Main homepage and existing `/api/stats.json` both returned HTTP 200.
- Local verification before deployment: 44 capture-service tests, 13 existing feedback tests, TypeScript, Worker dry build, and source lint passed.

The existing two-host allowlist remains enforced. This deployment is a supported-site beta; it does not enable arbitrary URL capture.
