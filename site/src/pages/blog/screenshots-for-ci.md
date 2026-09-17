---
layout: ../../layouts/Article.astro
title: Capture website screenshots for CI and release reviews
description: Create repeatable PNG artifacts with the OpenScreenShot CLI and understand what a screenshot capture can verify in a build pipeline.
audience: Developers & agents
order: 6
---

Use the OpenScreenShot CLI in CI to save a PNG of a running application for review. Provision a Chrome-compatible browser, start the application, wait for it to become ready, then capture a fixed URL and viewport. Upload the resulting file using your CI provider’s artifact mechanism.

## Make the environment repeatable

For a project that already uses pnpm, add the CLI as a development dependency and commit the resulting manifest and lockfile changes:

```sh
pnpm add -D -E openscreenshot
```

Install dependencies in CI with the project’s frozen lockfile. The package uses `puppeteer-core` and does not download a browser, so the runner also needs Chrome or Chromium. Set `CHROME_PATH` if the executable is not in a supported default location.

Keep the browser version, fonts, viewport, application data, and package version stable when comparing captures. A changed font or browser renderer can alter an image even when the application code has not changed.

## Capture after the application is ready

Start your development or preview server using the project’s own command. Wait for the route and its dependencies to be ready before running this example; port 4321 is only an example and must match your application:

```sh
mkdir -p artifacts
pnpm exec openscreenshot shot http://127.0.0.1:4321 --out artifacts/desktop.png --width 1440 --height 900
pnpm exec openscreenshot shot http://127.0.0.1:4321 --out artifacts/narrow.png --width 390 --height 844
```

These commands produce viewport captures. Add `--full` for a whole-page review. Give your CI artifact upload step the `artifacts/` directory so a reviewer can open the files alongside a pull request or release.

The CLI waits for network idle during navigation, but that is not a guarantee that application-specific work has completed. It has no configurable selector wait or injected setup script. Use a dedicated, stable review route with deterministic data when the ordinary route contains animations, variable content, or authentication.

## A captured image is not a passing visual test

The command can exit successfully after taking a screenshot of a server error or a loading screen. Treat the PNG as a review artifact. A visual regression system also needs a baseline, an image comparison method, thresholds, and a process for accepting intended changes; OpenScreenShot’s CLI does not provide those pieces.

A narrow screenshot is a useful responsive layout check, but it is not mobile device emulation. Likewise, a screenshot does not verify interactions, accessibility, or API behavior. Keep the application’s relevant checks alongside the capture step.

## Troubleshoot the pipeline

**Chrome not found:** confirm that the runner image includes a browser and that `CHROME_PATH` points to its executable.

**Navigation failed or timed out:** confirm that the server is reachable from the capture process, uses the expected port, and is ready before capture starts. Navigation has a 30-second timeout.

**An unexpected login page appears:** the CLI starts a fresh browser session. It does not reuse your local profile or expose cookie injection.

**The output file is missing:** create the output directory, inspect the command’s exit status, and check the artifact path relative to the CI working directory.

The [CLI reference guide](/blog/screenshot-cli/) covers flags and exit codes. If a human or agent should decide which page to inspect next, use the [MCP screenshot workflow](/blog/screenshot-mcp-server/).
