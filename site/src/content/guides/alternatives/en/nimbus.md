---
title: 'Nimbus Screenshot alternative: local capture after the move to FuseBase'
description: Nimbus Screenshot is now FuseBase Pro. OpenScreenShot is a free, open-source option for full-page capture, annotation, and tab recording on your device.
order: 5
---

Nimbus Screenshot now ships in Chrome as FuseBase Pro, from Nimbus Web. Switch to OpenScreenShot if you used Nimbus to capture, annotate, and record web pages and want a free tool that keeps files on your device, with no account and no cloud workspace. Stay with FuseBase Pro if you need what OpenScreenShot does not have: screen recording beyond one tab, and uploads to FuseBase, Google Drive, Dropbox, or Slack. OpenScreenShot records one browser tab, in Chrome only. It does not capture desktop windows or the whole screen.

OpenScreenShot is our product. The facts about FuseBase Pro on this page are as of 9 October 2026 and come from its [Chrome Web Store listing](https://chromewebstore.google.com/detail/fddbloohgcjopkmnjdeodjcfbgiimpcn), the FuseBase [screenshot page](https://thefusebase.com/screenshot/) and [pricing page](https://thefusebase.com/pricing/), the old [Nimbus Firefox add-on page](https://addons.mozilla.org/en-US/firefox/addon/nimbus-screenshot/), and the manifest of version 3.6.19 from Google's update server.

## What happened to Nimbus Screenshot

The original Nimbus Screenshot & Screen Video Recorder listing is no longer in the Chrome Web Store. The old Nimbus screenshot page, nimbusweb.me/screenshot.php, now redirects to the FuseBase screenshot page. The current Chrome extension is "FuseBase Pro - Capture screenshots and Video record," offered by Nimbus Web, Inc. The old Nimbus add-on is still listed for Firefox. It was last updated on 31 July 2020.

## FuseBase Pro and OpenScreenShot side by side

|                          | FuseBase Pro (formerly Nimbus)                                                     | OpenScreenShot                                           |
| ------------------------ | ---------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Price                    | Free plan with recordings up to 5 minutes; Pro plan with recordings up to 10 hours | Free, no paid tier                                       |
| Open source              | No                                                                                 | Yes, MIT                                                 |
| Install-time site access | All websites (required `<all_urls>`, content scripts on every page)                | None. Access to the current tab when you start a capture |
| Full-page capture        | Yes                                                                                | Yes                                                      |
| Annotation and blur      | Yes                                                                                | Yes, all tools free                                      |
| PDF export               | Yes, per its listing                                                               | Yes                                                      |
| Tab recording            | Yes, screen and webcam; GIF and MP4 conversion is premium                          | Yes, tab only, in Chrome; MP4 and WebM free              |
| Account or cloud         | Uploads to FuseBase, Google Drive, Dropbox, and Slack                              | No account, no uploads                                   |

The FuseBase screenshot page does not show a price for the capture Pro plan. The FuseBase pricing page lists workspace plans, starting with Solo at $32 or $39 a month depending on billing, and does not name the capture extension.

## What you keep

You keep full-page capture, an editor with annotation tools and blur, and PDF export. In Chrome, you keep recording with a webcam, and OpenScreenShot also records the microphone and tab audio. Exports have no watermark.

## What changes

Files stay on your device. OpenScreenShot stores captures in local browser storage and recordings in IndexedDB until you delete them, and it has no analytics or telemetry. The FuseBase Pro privacy section on the Chrome Web Store discloses collection of personally identifiable information, authentication information, and website content. To share an OpenScreenShot capture, click **Copy** and paste it, or click **Save image** and attach the file.

Install-time access is smaller. OpenScreenShot uses `activeTab`, which covers one tab when you start a capture. Chrome asks for the optional tab capture permission the first time you click **Record**, and for access to all sites only if you turn on **Record across sites**.

Recording covers one tab. Click **Record** in the popup, choose **Mic**, **Tab audio**, or **Webcam**, and record the whole tab or an area you drag. The recording editor adds a 2x zoom at each click, and you can trim segments and place the webcam bubble. MP4 and WebM export are free. OpenScreenShot has no GIF export. See the [recording reference](/docs/#record).

## How to switch

1. Install OpenScreenShot from the [Chrome Web Store](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp) or from [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/openscreenshot/). The Firefox build captures screenshots only.
2. Pin the icon to the toolbar.
3. Click the icon on a page. With the default **One-click Express mode**, this starts a **Full Page** capture and opens the **Editor**. Right-click the page for **Visible Area**, **Selected Region**, and **Capture element**.
4. Set **After capture** in **Settings**: **Editor**, **Clipboard**, or **Download**.
5. Download the files you want to keep from FuseBase or your cloud storage. To annotate an old capture, drop the image onto the OpenScreenShot editor.
6. Check `chrome://extensions` and remove the Nimbus or FuseBase extension if you no longer use it.

For short feature videos, see [product demo videos](/use-cases/product-demos/). For marked-up captures for a team, see [capturing a page for design review](/use-cases/design-review/). For other recorders, see the [Awesome Screenshot alternative](/alternatives/awesome-screenshot/) and the [Screenity alternative](/alternatives/screenity/).
