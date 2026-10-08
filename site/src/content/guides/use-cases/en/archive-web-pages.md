---
title: How to save a visual copy of a web page
description: Capture a whole web page as PNG or PDF, name files by date and domain, and handle very long pages that save as several images.
order: 5
---

To keep a visual copy of a web page, capture it with **Full Page** and save it as a PNG or a PDF with the date and site in the filename. OpenScreenShot scrolls the page, stitches the parts into one image, and saves the file on your computer. A screenshot records how the page looked on your screen; it is not proof that the page was authentic or unchanged.

## Save a copy of a page step by step

1. Open **Settings** from the popup or the toolbar icon’s right-click menu. Set **Filename template** to a pattern with `{date}` and `{domain}`, for example `Archive/{domain}/{date}_{title}`.
2. Open the page. Scroll through it once so lazy-loaded images and comments load, then return to the top.
3. Click the OpenScreenShot icon. With the default settings, this starts a **Full Page** capture and opens the result in the **Editor**.
4. Check the top, the bottom, and any section that loads as you scroll.
5. Click **Save image**. In the **Export** dialog, choose **PNG** or **PDF**, check the filename, and click **Export**.

To save without the editor, set **After capture** to **Download** in **Settings**. Each capture then goes straight to your downloads folder as a PNG, named with your template.

## PNG or PDF?

Choose **PNG** to keep every pixel of the capture. It is lossless, so interface text stays sharp, and any image viewer can open it.

Choose **PDF** when the copy goes into a document folder or needs to print. Under **Page size**, **Full** makes one page sized to the image. **A4** or **Letter** with **Split across multiple pages** divides a long capture into pages with a 5 mm overlap. The PDF holds the screenshot as an image, so its text is not searchable or selectable. The [screenshot-to-PDF guide](/blog/save-screenshot-as-pdf/) compares the layouts.

## Name files so you can find them later

The filename template accepts these tokens:

- `{date}`: the date as YYYY-MM-DD, from your computer’s clock
- `{time}`: the time as HHMMSS
- `{domain}`: the site’s host name, without `www.`
- `{title}`: the page title, with characters that filenames cannot hold replaced
- `{w}` and `{h}`: the image width and height in pixels

A `/` in the template saves into a folder inside Downloads, so `Archive/{domain}/{date}_{title}` sorts copies by site and then by date. The live preview in **Settings** shows the result before you capture.

## Very long pages

One image can hold a page up to 32,000 device pixels tall. A taller page is saved as up to six images. With **Download**, each part is named with your template and a suffix such as `_part1of3`. With **Editor** or **Clipboard**, each part opens in its own editor tab, where you export it on its own.

A page too tall for six images is refused with an error. Capture the sections you need with **Visible Area** or **Selected Region** instead. The [full-page screenshot guide](/blog/full-page-screenshot-chrome/) covers other cases, such as nested scroll areas and sticky headers.

## What a screenshot can and cannot show

A screenshot is a visual record of what your browser showed at one moment. It has no signature or tamper check, and anyone can edit an image file. The `{date}` token comes from your computer’s clock when the file is named. When you need evidence that a page existed in a certain form, use a service built for that purpose, and keep the screenshot as a personal reference.

A full-page capture also misses content that the page never rendered: collapsed sections, other tabs of a page, infinite feeds past the point you scrolled to, and content behind a login you did not open.

## Where the copies are stored

OpenScreenShot processes captures in your browser and stores them in local storage on your device. It does not upload them to a server. Exported files go to your downloads folder. They stay on your computer until you share or upload them, and the service you upload to has its own storage rules. See the [privacy policy](/privacy/) for details.

The [settings reference](/docs/#settings) covers the filename template. To mark up a capture for colleagues, see [capturing a page for design review](/use-cases/design-review/).
