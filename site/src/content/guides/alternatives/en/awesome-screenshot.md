---
title: 'Awesome Screenshot alternative: free tools that stay on your device'
description: Awesome Screenshot vs OpenScreenShot. Free annotation, blur, PDF, and tab recording that stay on your device, one free tier, and no all-sites access at install.
order: 3
---

Switch to OpenScreenShot if you capture and record inside the browser and want everything to stay on your device, with all editor tools free and no plan limits. Stay with Awesome Screenshot if you need its cloud features: share links, cloud storage, and recording of the desktop and camera, up to 4K on its Professional plan. OpenScreenShot has no share links and no cloud. It records one browser tab, in Chrome only, and it does not capture desktop windows or the whole screen.

OpenScreenShot is our product. The facts about Awesome Screenshot on this page are as of 9 October 2026 and come from its [Chrome Web Store listing](https://chromewebstore.google.com/detail/nlipoenfbbikpbjkfpfillcgkoblgpmj), its [pricing page](https://www.awesomescreenshot.com/pricing), its [Firefox add-on page](https://addons.mozilla.org/en-US/firefox/addon/screenshot-capture-annotate/), and the manifest of version 4.4.44 from Google's update server.

## Awesome Screenshot and OpenScreenShot side by side

|                          | Awesome Screenshot                                                                 | OpenScreenShot                                                         |
| ------------------------ | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Price                    | Free plan; Basic from $5 a month and Professional from $6 a month, billed annually | Free, no paid tier                                                     |
| Open source              | The Firefox listing declares MPL 2.0; we found no public source repository         | Yes, MIT, with public source                                           |
| Install-time site access | All websites (required `<all_urls>`, content scripts on every page)                | None. Access to the current tab when you start a capture               |
| Full-page capture        | Yes                                                                                | Yes                                                                    |
| Annotation and blur      | Yes; basic tools on Free, all tools on paid plans                                  | All tools free                                                         |
| PDF export               | Yes                                                                                | Yes                                                                    |
| Tab recording            | Yes, plus desktop and camera                                                       | Yes, tab only, in Chrome (the Firefox build captures screenshots only) |
| Account or cloud         | Cloud storage and share links; local saving offered                                | No account, no uploads                                                 |

## Plan limits

The Awesome Screenshot Free plan lists up to 100 screenshots, basic annotation, and up to 20 recordings at 720p. Its local saves allow unlimited screenshots and recordings up to 5 minutes. Basic is $5 a month billed annually or $6 billed monthly. Professional is $6 a month billed annually or $8 billed monthly, with unlimited recordings and up to 4K.

OpenScreenShot has one tier. Every capture mode, editor tool, and export format is free, and there is no account to create.

## What you keep

You keep full-page, visible-area, and region capture, plus an editor with shapes, arrows, text, highlights, and blur. You keep PNG, JPEG, and PDF export. In Chrome, you keep tab recording with the microphone and webcam.

## What changes

Your captures stay on your device. OpenScreenShot stores captures in local browser storage and recordings in IndexedDB, and it does not upload them. The Awesome Screenshot privacy section on the Chrome Web Store discloses collection of "Website content." To share an OpenScreenShot capture, click **Copy** and paste the image, or click **Save image** and attach the file. The [privacy section](/docs/#privacy) has the details.

Install-time access is smaller. OpenScreenShot uses `activeTab` for one tab at a time. Chrome asks for the optional tab capture permission the first time you click **Record**, and for access to all sites only if you turn on **Record across sites**.

The recorder works on one tab. Click **Record** in the popup, choose **Mic**, **Tab audio**, or **Webcam**, and keep **Whole tab** or drag to record part of the page. When you stop, the recording editor adds a 2x zoom at each click. You can trim, place the webcam bubble, and export MP4 or WebM. See the [recording reference](/docs/#record).

For redaction, use **Blur** (`B`) with the **Solid** fill, which covers the area completely in the export.

## How to switch

1. Install OpenScreenShot from the [Chrome Web Store](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp) or from [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/openscreenshot/).
2. Pin the icon to the toolbar.
3. Click the icon on a long page. With the default **One-click Express mode**, this starts a **Full Page** capture and opens the **Editor**. Right-click the page and open the **OpenScreenShot** submenu for **Visible Area**, **Selected Region**, or **Capture element**.
4. Set **After capture** in **Settings**: **Editor**, **Clipboard**, or **Download**.
5. Download any captures and videos you want to keep from Awesome Screenshot's cloud storage before you stop using it. To annotate an old image, drop it onto the OpenScreenShot editor.

For short videos of a feature, see [product demo videos](/use-cases/product-demos/). For screenshots in support replies, see [screenshots for customer support](/use-cases/customer-support/). If you are comparing recorders with cloud links, see the [Loom alternative](/alternatives/loom/) and the [Nimbus alternative](/alternatives/nimbus/).
