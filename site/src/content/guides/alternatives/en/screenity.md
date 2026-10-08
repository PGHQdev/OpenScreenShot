---
title: 'Screenity alternative: screenshots and tab recording in one extension'
description: Screenity vs OpenScreenShot. Both are open source. OpenScreenShot adds full-page screenshots and PDF export, and asks for no all-sites access at install.
order: 7
---

Switch to OpenScreenShot if you record browser tabs and also take full-page screenshots, and you want one open-source extension that does both with no access to all websites at install. Stay with Screenity if you record more than a tab: it records an area, the desktop, any app window, or the camera, and exports GIF or saves to Google Drive. OpenScreenShot records one browser tab and does not capture desktop windows or the whole screen. Screenity's paid Pro plan also adds link sharing and cloud hosting, which OpenScreenShot does not offer.

OpenScreenShot is our product. The facts about Screenity on this page are as of 9 October 2026 and come from its [GitHub repository](https://github.com/alyssaxuu/screenity) and [manifest](https://github.com/alyssaxuu/screenity/blob/master/src/manifest.json), its [Chrome Web Store listing](https://chromewebstore.google.com/detail/screenity-screen-recorder/kbbdabhdfibnancpjfhlkhafgdilcnji), its [Pro page](https://screenity.io/pro), and Chrome's [permission warning list](https://developer.chrome.com/docs/extensions/reference/permissions-list).

## Screenity and OpenScreenShot side by side

|                          | Screenity                                                                  | OpenScreenShot                                                           |
| ------------------------ | -------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Price                    | Free extension; Pro is $10 a month or $120 a year, with a 7-day trial      | Free, no paid tier                                                       |
| Open source              | Yes, GPL-3.0                                                               | Yes, MIT                                                                 |
| Install-time site access | All websites (required `<all_urls>`, plus `tabs` and `tabCapture`)         | None. Tab capture is optional and asked on first recording               |
| Full-page capture        | Not covered by the sources we checked                                      | Yes                                                                      |
| Annotation and blur      | Draw, text, arrows, shapes; blur of page content                           | Shapes, arrows, text, step numbers, blur, spotlight, crop on screenshots |
| PDF export               | Not covered by the sources we checked                                      | Yes                                                                      |
| Tab recording            | Yes, plus area, desktop, app window, and camera                            | Yes, tab only, in Chrome (the Firefox build captures screenshots only)   |
| Video export             | MP4, GIF, WebM, or Google Drive                                            | MP4 or WebM                                                              |
| Account or cloud         | No sign-in for the free extension; Pro uses an account and EU-hosted cloud | No account, no uploads                                                   |

## What you keep

Both extensions are open source, and both keep free recordings on your device without a sign-in. In OpenScreenShot, click **Record** in the popup and choose **Mic**, **Tab audio**, or **Webcam**. Keep **Whole tab** or drag across the preview to record part of the page. The recording tab holds the timer and the **Pause**, **Stop**, and **Cancel** buttons, so no controls appear in the video. Press `Alt+Shift+X` to stop from any tab.

## What changes

The recording editor adds a 2x zoom at each click your cursor made. You can move or delete those zooms, add manual zooms at 1.5x, 2x, or 3x, and trim each segment. The webcam joins the export as a round bubble that you place, and the **Frame** panel adds padding and a background. Export renders an MP4 (H.264 and AAC) by default, or WebM. The [recording reference](/docs/#record) covers each control.

Screenshots are part of the same extension. A click on the toolbar icon starts a **Full Page** capture with the default **One-click Express mode**. The screenshot editor has **Blur** with a **Solid** fill for redaction, and **Save image** opens the **Export** dialog for PNG, JPEG, WebP, or PDF. OpenScreenShot adds nothing to the page during a recording, so you cannot draw on the page while you record. Annotation works on screenshots.

Install-time access is smaller. Screenity's manifest requires `<all_urls>`, and Chrome's list shows "Read and change all your data on all websites" for `tabCapture` and "Read your browsing history" for `tabs`. OpenScreenShot installs with `activeTab` and asks for tab capture only the first time you click **Record**. It asks for access to all sites only if you turn on **Record across sites**, which lets click tracking follow a tab to another site.

## How to switch

1. Install OpenScreenShot from the [Chrome Web Store](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp). The [Firefox build](https://addons.mozilla.org/firefox/addon/openscreenshot/) captures screenshots only.
2. Pin the icon to the toolbar.
3. Take a first screenshot: click the icon on a page and check the result in the **Editor**.
4. Click **Record** in the popup and accept Chrome's tab capture prompt. Record a short take and export it.
5. Set **After capture** in **Settings** for screenshots: **Editor**, **Clipboard**, or **Download**.
6. Export any Screenity recordings you want to keep before you remove it.

For feature walkthroughs, see [product demo videos](/use-cases/product-demos/). To show a bug in an issue, see [screenshots for bug reports](/use-cases/bug-reports/). If you share videos by link with a team, compare the [Loom alternative](/alternatives/loom/). For a recorder with cloud upload, see the [Nimbus alternative](/alternatives/nimbus/).
