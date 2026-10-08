---
title: How to take a full-page screenshot in Opera
description: Opera’s Snapshot tool saves a full page as a PDF only. Learn the steps and limits, and how to capture a full-page image with OpenScreenShot.
order: 6
---

Opera’s built-in Snapshot tool captures a selection or the visible area as an image, and the full page only as a PDF. Press `Shift+Ctrl+5` (`Shift+Cmd+2` on macOS) and select **Save page as PDF**. For a full-page image file, install OpenScreenShot. Opera is a Chromium browser and installs it from the Chrome Web Store after you add Opera’s **Install Chrome Extensions** add-on.

## Built-in method

Opera describes Snapshot on its [features help page](https://help.opera.com/en/latest/features/) and its [Snapshot page](https://www.opera.com/features/snapshot).

1. Open the page you want to capture.
2. Press `Shift+Ctrl+5` on Windows and Linux, or `Shift+Cmd+2` on macOS. You can also click the camera icon on the right side of the toolbar.
3. Select **Save page as PDF**. Opera saves the full page, from top to bottom, as a PDF.

Snapshot has two image options. **Capture Full Screen** captures only the visible area of the page, and **Capture** captures a frame that you adjust. Both give an image you can mark up with Zoom, Arrow, Blur, Highlight, Pencil, Selfie camera, Emojis, and Text, then save as a PNG with **Save Image** or copy to the clipboard.

## Limits

- **PDF only for the full page.** Image captures cover the visible area or a selection. To get the whole page, you get a PDF.
- **Undocumented layout.** Opera does not document whether the PDF is one long page or several pages, how it treats sticky headers, or how it handles a page that scrolls a panel inside a fixed-height shell. Open the PDF and check it before you share it.
- **Lazy loading.** Images marked `loading="lazy"` load only when you scroll near them. Scroll through the page before you save it, or parts can stay blank.
- **Infinite scroll.** A feed that keeps loading has no true bottom. Any capture holds only what loaded before you started.

## With OpenScreenShot

OpenScreenShot scrolls the page, captures it in parts, and stitches the parts into one image. Fixed headers are captured once at the top, and pages that scroll an inner element work too. A page taller than 32,000 device pixels is saved as up to six images.

1. Add the **Install Chrome Extensions** add-on from Opera add-ons. Opera explains this in [Using add-ons from Chrome in Opera](https://blogs.opera.com/tips-and-tricks/2021/10/using-addons-from-chrome-in-opera/).
2. Open the [OpenScreenShot listing](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp) and add the extension.
3. Pin the OpenScreenShot icon to the toolbar.
4. Open the page and click the icon, or press `Ctrl+Shift+S` (`⌘⇧S` on macOS). With the default settings, a full-page capture starts and the result opens in the editor.
5. Check the top, the bottom, and any sticky navigation.
6. Click **Save image** and choose PNG, JPEG, WebP, or PDF, or click **Copy**.

If the icon opens a menu, select **Full Page**; the **One-click Express mode** setting controls this. A PDF from OpenScreenShot holds the screenshot as an image, so it looks like the page on screen, but its text is not searchable or selectable. Under **Page size**, **Full** makes one page sized to the image, and **A4** or **Letter** can split a long capture across pages. The [screenshot-to-PDF guide](/blog/save-screenshot-as-pdf/) compares these layouts.

## Which to use

- Use Snapshot’s **Save page as PDF** for a quick full-page PDF with no install.
- Use Snapshot’s image options for the visible area or a selection with a few marks.
- Use OpenScreenShot for a full-page PNG, JPEG, or WebP, for pages that scroll an inner panel, or for a PDF that matches the screen, as in [design review](/use-cases/design-review/) or a [saved copy of a page](/use-cases/archive-web-pages/).

The [capture mode reference](/docs/#modes) and the [export reference](/docs/#export) list every option. The [Vivaldi guide](/full-page-screenshot/vivaldi/) covers another Chromium browser with its own capture tool. For pages that block extensions, such as browser settings, see [support and known limitations](/support/).
