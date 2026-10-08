---
title: 'GoFullPage alternative: free annotation and open source'
description: GoFullPage vs OpenScreenShot for full-page screenshots. OpenScreenShot has free annotation, blur, crop, and PDF page splitting, and its code is public.
order: 1
---

Switch to OpenScreenShot if you capture full pages and then need to crop, blur, mark up, or split a PDF into pages: GoFullPage puts those features in its paid Premium plan, and OpenScreenShot includes them for free. OpenScreenShot is also MIT-licensed, so you can read the code that runs on your pages. Stay with GoFullPage if you only capture and save full pages as images or PDFs without edits. Its free version already does that with no limit on the number of captures, and its FAQ links a Microsoft Edge Add-ons version. OpenScreenShot has no Edge Add-ons listing, but Edge can install it from the Chrome Web Store. OpenScreenShot captures web pages in the browser only; it does not capture desktop windows or the whole screen.

OpenScreenShot is our product. The facts about GoFullPage on this page are as of 9 October 2026 and come from its [Chrome Web Store listing](https://chromewebstore.google.com/detail/fdpohaocaechififmbbbbbknoalclacl), its [FAQ](https://gofullpage.com/faq), its [Premium page](https://gofullpage.com/premium), and its [Firefox add-on page](https://addons.mozilla.org/en-US/firefox/addon/gofullpage-screenshot/).

## GoFullPage and OpenScreenShot side by side

|                          | GoFullPage                                                   | OpenScreenShot                                               |
| ------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------ |
| Price                    | Free; Premium is $12 a year (before tax), with a 7-day trial | Free, no paid tier                                           |
| Open source              | No. A private fork since 2018 of an MIT project              | Yes, MIT                                                     |
| Install-time site access | None. Access to all sites is optional                        | None. Access to the current tab when you start a capture     |
| Full-page capture        | Yes                                                          | Yes                                                          |
| Annotation and blur      | Premium only (blur, text, highlight, crop)                   | Free (shapes, arrows, text, step numbers, blur, crop)        |
| PDF export               | Free; smart PDF page splitting is Premium                    | Free, including A4 or Letter pages split with an overlap     |
| Tab recording            | No                                                           | Yes, in Chrome (the Firefox build captures screenshots only) |
| Account or cloud         | No account for free capture; Premium uses an account         | No account, no uploads                                       |
| Browser stores           | Chrome Web Store, Firefox Add-ons, Edge Add-ons              | Chrome Web Store, Firefox Add-ons                            |

The [full comparison](/compare/) adds FullPage Capture to the same table.

## What you keep

The main habit stays the same. With the default settings, one click on the OpenScreenShot toolbar icon starts a **Full Page** capture. This is **One-click Express mode**. The extension scrolls the page, stitches the parts into one image, and opens the result in the **Editor**. Fixed headers appear once at the top, and pages that scroll an inner element work too.

Both extensions ask for no site access at install. OpenScreenShot uses `activeTab`, so it can read only the tab you capture, at the moment you start the capture. Both save PNG, JPEG, and PDF files. Both work in Chrome and Firefox.

## What changes

The editor tools are free. **Crop** (`C`) trims the image, **Blur** (`B`) with the **Solid** fill covers private data, and **Arrow**, **Text**, and **Step number** mark what matters. **Cut** (`X`) removes horizontal bands from a long capture. The [annotation reference](/docs/#annotate) lists every tool and shortcut.

PDF layout is free as well. Click **Save image** to open the **Export** dialog, choose **PDF**, and pick **A4** or **Letter** with **Split across multiple pages**. Each page overlaps the next by 5 mm, so text is not cut mid-line. The **PDF** button beside **Save image** saves a PDF in one click. The PDF holds the screenshot as an image, so its text is not searchable or selectable.

You also get more capture modes: **Visible Area**, **Selected Region**, and **Capture element**, which captures one card, table, or chart at its exact bounds. In Chrome, **Record** captures a tab as an MP4 or WebM video with zoom on each click. The first recording asks for the optional tab capture permission.

OpenScreenShot has no date or URL stamp. Use the filename template in **Settings** with `{date}` and `{domain}` to keep that information in the filename instead.

## How to switch

1. Install OpenScreenShot from the [Chrome Web Store](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp) or from [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/openscreenshot/).
2. Pin the icon to the toolbar. If GoFullPage is pinned in the same place, unpin it so that you click the right icon.
3. Open a long page and click the OpenScreenShot icon. Check the top, the bottom, and any sticky header in the **Editor**.
4. Set **After capture** in **Settings**. **Editor** opens each capture for annotation. **Download** saves a PNG to your downloads folder with no tab, which is close to a capture-and-save habit. **Clipboard** copies the image.
5. To mark up an image you saved with GoFullPage, drop the file onto the editor or paste it with `Ctrl+V` (`⌘V` on macOS).

If a keyboard shortcut does not start an OpenScreenShot capture, open `chrome://extensions/shortcuts` and check whether another extension uses the same keys.

For keeping copies of pages with dated filenames, see [saving a visual copy of a web page](/use-cases/archive-web-pages/). If you want PDF output with clickable links, compare the [FireShot alternative](/alternatives/fireshot/) and the [FullPage Capture alternative](/alternatives/fullpage-capture/).
