---
title: 'Loom alternative: tab recordings that stay on your device'
description: Loom vs OpenScreenShot. Record a browser tab with webcam, mic, and auto zoom, and export an MP4 locally, with no account and no paid plan.
order: 8
---

Switch to OpenScreenShot if you record walkthroughs of a web app or a page in Chrome and want to export an MP4 file on your own device, with no account. Stay with Loom if you share videos by link: Loom hosts each video, gives you a library and a team workspace, and lists desktop and mobile apps. OpenScreenShot has no hosting and no share links, so you upload or attach the exported file yourself. It records one browser tab, in Chrome only, and it does not capture desktop windows or the whole screen.

OpenScreenShot is our product. The facts about Loom on this page are as of 9 October 2026 and come from its [pricing page](https://www.loom.com/pricing), its [Chrome Web Store listing](https://chromewebstore.google.com/detail/loom-%E2%80%93-screen-recorder-sc/liecbddmkiiihnedobmlmillhodjkdmb), Atlassian's [account help page](https://support.atlassian.com/loom/docs/use-loom-with-an-atlassian-account), and Chrome's [permission warning list](https://developer.chrome.com/docs/extensions/reference/permissions-list).

## Loom and OpenScreenShot side by side

|                          | Loom                                                                                                                                                          | OpenScreenShot                                                         |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Price                    | Starter $0 (25 videos, screen recordings up to 5 minutes); Business $18 per user a month; Business + AI listed at $24 per user a month; Enterprise on request | Free, no paid tier                                                     |
| Open source              | No                                                                                                                                                            | Yes, MIT                                                               |
| Install-time site access | All websites (required `<all_urls>`, content scripts on every page)                                                                                           | None. Tab capture is optional and asked on first recording             |
| Full-page capture        | Not covered by the sources we checked                                                                                                                         | Yes                                                                    |
| Annotation and blur      | Not covered by the sources we checked                                                                                                                         | Yes, on screenshots                                                    |
| PDF export               | Not covered by the sources we checked                                                                                                                         | Yes, for screenshots                                                   |
| Tab recording            | Screen recording, with limits per plan                                                                                                                        | Yes, tab only, in Chrome (the Firefox build captures screenshots only) |
| Account or cloud         | Account required; videos hosted by Loom                                                                                                                       | No account, no uploads                                                 |

Loom has been part of Atlassian since November 2023, and a Loom account can use an Atlassian account.

## What you keep

You keep a recorder that starts from the browser toolbar. Click **Record** in the OpenScreenShot popup, turn on **Mic** and **Webcam**, and click **Start recording**. Your webcam appears in the export as a round bubble that you place. **Tab audio** adds the sound from the page.

## What changes

The video is a file. When you stop, the recording editor opens in the same tab. It adds a 2x zoom at each click, so viewers see where you clicked. You can adjust or delete each zoom, add your own at 1.5x, 2x, or 3x, and trim segments. Export renders an MP4 (H.264 and AAC) or a WebM file to your downloads folder. Upload it to your own video host, a chat, or a ticket. The [recording reference](/docs/#record) covers each control.

Recordings stay on your device. OpenScreenShot saves them in IndexedDB as you record and keeps them until you delete the session. It has no analytics or telemetry. The [privacy section](/docs/#privacy) has the details.

The scope is one tab. Keep **Whole tab** or drag across the preview to record part of the page. If the tab goes to another site during a recording, click tracking needs **Record across sites**, which asks for access to all sites. Without it, zoom and click effects stop for the rest of the video, and the video keeps recording.

Install-time access is smaller. Loom's manifest requires `<all_urls>`, `tabCapture`, and `desktopCapture`. Chrome's list shows "Read and change all your data on all websites" for `tabCapture` and "Capture content of your screen" for `desktopCapture`. OpenScreenShot installs with `activeTab` and asks for tab capture only the first time you click **Record**.

OpenScreenShot also takes screenshots. A click on the toolbar icon starts a **Full Page** capture with the default **One-click Express mode**, and the editor has arrows, step numbers, and **Blur** with a **Solid** fill.

## How to switch

1. Install OpenScreenShot from the [Chrome Web Store](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp). The [Firefox build](https://addons.mozilla.org/firefox/addon/openscreenshot/) captures screenshots only.
2. Pin the icon to the toolbar.
3. Click **Record** in the popup and accept Chrome's tab capture prompt. Record a short take, then click **Export**.
4. Press `Alt+Shift+X` to stop a recording from any tab.
5. For screenshots, set **After capture** in **Settings**: **Editor**, **Clipboard**, or **Download**.
6. Download the Loom videos you want to keep before you close your account or change plans.

For feature walkthroughs, see [product demo videos](/use-cases/product-demos/). For support replies, see [screenshots for customer support](/use-cases/customer-support/). For an open-source recorder that also records the desktop, see the [Screenity alternative](/alternatives/screenity/). For a recorder with cloud links, see the [Awesome Screenshot alternative](/alternatives/awesome-screenshot/).
