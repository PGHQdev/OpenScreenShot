---
title: 'FullPage Capture alternative: open source with no all-sites access at install'
description: FullPage Capture vs OpenScreenShot. Both capture and annotate full pages for free. OpenScreenShot is open source and needs no all-sites access at install.
order: 2
---

Switch to OpenScreenShot if you want a full-page screenshot extension whose code you can read and that asks for no access to all websites at install. Stay with FullPage Capture if you need what its PDF export offers: its listing describes PDFs with clickable links and smart page breaks, and its Pro plan adds searchable PDFs. OpenScreenShot saves a PDF as an image, so its text cannot be searched or selected and its links do not work. OpenScreenShot captures web pages in the browser only; it does not capture desktop windows or the whole screen.

OpenScreenShot is our product. The facts about FullPage Capture on this page are as of 9 October 2026 and come from its [Chrome Web Store listing](https://chromewebstore.google.com/detail/ggacghlcchiiejclfdajbpkbjfgjhfol), its [website](https://fullpagecapture.net/), and the manifest of version 1.19.67 from Google's update server.

## FullPage Capture and OpenScreenShot side by side

|                          | FullPage Capture                                                                  | OpenScreenShot                                                                        |
| ------------------------ | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Price                    | Free; Pro is $19 a year after a 7-day trial                                       | Free, no paid tier                                                                    |
| Open source              | No                                                                                | Yes, MIT                                                                              |
| Install-time site access | All websites (required `<all_urls>`)                                              | None. Access to the current tab when you start a capture                              |
| Full-page capture        | Yes, free with no watermark                                                       | Yes, free with no watermark                                                           |
| Annotation and blur      | Free (arrows, shapes, text, highlighter, pen, numbered badges, blur and pixelate) | Free (shapes, arrows, text, highlighter, pen, step numbers, blur, mosaic, Solid fill) |
| PDF export               | Yes, with clickable links and smart page breaks; searchable PDF is Pro            | Yes, as an image: one page, or A4 or Letter pages with an overlap                     |
| Tab recording            | No                                                                                | Yes, in Chrome (the Firefox build captures screenshots only)                          |
| Account or cloud         | Listing says no account; Pro uses an account and "Send to your cloud"             | No account, no uploads                                                                |

The [full comparison](/compare/) puts GoFullPage in the same table.

## Install-time access

FullPage Capture's manifest requires the `<all_urls>` host permission. Chrome shows the warning "Read and change all your data on all websites" when you install an extension with that permission. The listing says "No account, no analytics, no network requests. Files stay on your device," and the website says "The extension makes zero network requests." We did not test its network behavior, and this page makes no claim about it.

OpenScreenShot requires no host permission. It uses `activeTab`, which gives access to one tab at the moment you click the icon, press a shortcut, or choose a capture from the right-click menu. Chrome asks for the optional tab capture permission only the first time you click **Record**. Access to all sites is requested only if you turn on **Record across sites**. The [privacy section](/docs/#privacy) explains how captures stay on your device.

## What you keep

The workflow is close. One click on the toolbar icon starts a **Full Page** capture with the default **One-click Express mode**, and the result opens in the **Editor**. Arrows, shapes, text, numbered badges, and blur are all free. Saving, copying, and PDF export are free too, and no export has a watermark.

## What changes

For redaction, choose **Blur** (`B`) and then the **Solid** fill under **Hide area**. Solid covers the area completely in the export. The [redaction guide](/blog/redact-screenshot/) shows how to check the saved file.

PDF works differently. Click **Save image** to open the **Export** dialog, choose **PDF**, and pick **Full** for one page sized to the image, or **A4** or **Letter** with **Split across multiple pages**. The pages overlap by 5 mm so that text is not cut mid-line. The [screenshot-to-PDF guide](/blog/save-screenshot-as-pdf/) compares the layouts.

OpenScreenShot has no batch capture and no cloud upload. It adds **Capture element** for one card or table, the **Frame** panel for padding, corners, shadow, and background, and tab recording to MP4 or WebM in Chrome. It also works in Firefox for screenshots.

## How to switch

1. Install OpenScreenShot from the [Chrome Web Store](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp) or from [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/openscreenshot/).
2. Pin the icon to the toolbar, and unpin FullPage Capture if it sits in the same place.
3. Open a long page and click the icon. Check the result in the **Editor**.
4. Set **After capture** in **Settings**: **Editor** to annotate, **Clipboard** to paste the image at once, or **Download** to save a PNG with no tab.
5. Set a **Filename template** in **Settings**, for example `{date}_{domain}`, so saved files sort by date and site.
6. Remove FullPage Capture from `chrome://extensions` when you no longer use it.

For annotated captures in issue trackers, see [screenshots for bug reports](/use-cases/bug-reports/). The [capture mode reference](/docs/#modes) covers every mode. For other full-page tools, see the [GoFullPage alternative](/alternatives/gofullpage/) and the [FireShot alternative](/alternatives/fireshot/).
