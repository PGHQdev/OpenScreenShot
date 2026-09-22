# Firefox release

The first Firefox version supports desktop Firefox 140+ and includes full-page,
visible-area and region capture, annotation, local history, image export and PDF.
Recording, camera/microphone setup and recording permissions are excluded. Browser
features such as the eyedropper and always-on-top pin remain capability-dependent.
The optional local MCP server still drives Chromium; this release does not port it.

## Reproduce the submitted build

Use Node.js 22.19+ and pnpm 10.33.0. From the root of the source archive:

```sh
corepack enable
pnpm install --frozen-lockfile
pnpm run icons
pnpm run build:firefox
pnpm run lint:firefox
```

The result is `dist-firefox/`. `pnpm run package:firefox` creates the upload ZIP.
`pnpm run source:firefox` creates the corresponding reviewer source ZIP from a Git
checkout. The source archive includes the lockfile and icon/token generators.
Vite bundles and minifies TypeScript/Preact; no remote scripts are loaded.

The validator currently reports two warnings: Preact's internal `innerHTML`
assignment (the application never uses `innerHTML` or `dangerouslySetInnerHTML`),
and Android's data-consent minimum version. Android is not supported or declared
in the manifest. Warnings remain visible; validation errors fail CI.

## Local verification

Open `about:debugging#/runtime/this-firefox`, choose **Load Temporary Add-on**, and
select `dist-firefox/manifest.json`. Or run:

```sh
pnpm exec web-ext run --source-dir dist-firefox
```

CI runs `tests/browser/firefox-smoke.py` in a disposable Firefox profile to check
full-page, visible and repeat-region capture, history, clipboard, PNG, PDF and quick-save.
To run locally, install `tests/browser/requirements-firefox.txt` in a Python virtual
environment, build the package, then run the script. `FIREFOX_BIN` can select a
browser executable.

Use an ordinary HTTPS page with a long scrollable body. Verify toolbar/keyboard/
context-menu capture, full-page stitching, region selection and repeat region,
annotation, PNG/JPEG/WebP/PDF export, clipboard copy, history, theme and settings.
Check `about:` and `addons.mozilla.org` pages show a protected-page error. Confirm
recording controls and permissions are absent. Firefox shortcuts can be edited in
Add-ons Manager → gear menu → Manage Extension Shortcuts; the popup links to help.

## First Mozilla listing

1. Create a **listed**, desktop-only add-on in the
   [Mozilla Developer Hub](https://addons.mozilla.org/developers/addon/submit/distribution).
2. Upload `openscreenshot-firefox-v<version>.zip` and the matching
   `openscreenshot-firefox-source-v<version>.zip` for source review.
3. Use the copy in `listing.md`, the MIT license and the review notes in
   `metadata.json`. Provide screenshots taken in Firefox (do not use Chrome
   recording promotional images). The fixed add-on ID is `openscreenshot@pghq.dev`;
   retain it for all updates.
4. The manifest declares no data collection. Screenshots/history stay local;
   Firefox does not automatically open the hosted welcome or uninstall pages.
   Support/donation links open only on user clicks. Rating buttons and post-export reminders open the Mozilla listing’s reviews page.
5. The approved listing is [OpenScreenShot on Firefox Add-ons](https://addons.mozilla.org/firefox/addon/openscreenshot/).
   Website install buttons and Firefox rating actions point to this listing.
6. Create [AMO API credentials](https://addons.mozilla.org/developers/addon/api/key/)
   and set GitHub secrets `AMO_JWT_ISSUER` and `AMO_JWT_SECRET`. Set repository
   variable `AMO_PUBLISH_ENABLED=true` to enable future tagged submissions.

`Release Firefox` runs for every `v*` tag independently of Chrome's review gate.
It always uploads the package and source as the `firefox-submission` workflow
artifact. Once enabled, it submits listed updates with source for Mozilla review;
submission is not an immediate public release. A manual workflow run prepares
artifacts only. Signing credentials are never needed for local builds or CI.

## Publishing status

The v2.1.1 and v2.1.2 tagged workflows built and uploaded submission artifacts,
but skipped the Mozilla submission step. A successful packaging job alone does
not mean an update was submitted to AMO. The repository variable
`AMO_PUBLISH_ENABLED=true` and the `AMO_JWT_ISSUER` / `AMO_JWT_SECRET` repository
secrets were configured for the v2.1.3 release. Manual runs remain artifact-only. Check the
**Submit listed update to Mozilla** step to confirm submission; Mozilla review
and public availability are separate from this workflow completing.
