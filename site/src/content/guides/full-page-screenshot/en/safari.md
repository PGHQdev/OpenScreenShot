---
title: How to take a full-page screenshot in Safari
description: Safari on the Mac has no full-page image capture. Save the whole page as a PDF, capture one element in Web Inspector, or use another browser.
order: 4
---

Safari on the Mac has no full-page screenshot command. The closest built-in option is a PDF: choose **File** > **Print**, click **PDF** at the bottom of the dialog, and save the file. For an image file, Safari’s Web Inspector can capture one element of the page. OpenScreenShot has no Safari version. Safari installs Safari Web Extensions from the Mac App Store and cannot install Chrome Web Store or Firefox add-on packages. On a Mac, Chrome, Firefox, Edge, and other browsers can run OpenScreenShot.

## Built-in method

### Save the page as a PDF

Apple describes this route in [Print or create a PDF of a webpage in Safari](https://support.apple.com/guide/safari/print-or-create-a-pdf-of-a-webpage-ibrw1060/18.0/mac/15.0).

1. Open the page you want to keep.
2. Scroll through the page once so images that load late have loaded.
3. Choose **File** > **Print**.
4. To keep the page’s colors, turn on printing of background images and colors in the print options. You can also add the web address and the date in the headers and footers.
5. Click **PDF** at the bottom of the dialog and save the file.

### Capture an element in Web Inspector

1. Choose **Safari** > **Settings** > **Advanced** and select **Show features for web developers**. WebKit explains this in [Enabling Web Inspector](https://webkit.org/web-inspector/enabling-web-inspector/).
2. Open the page and press `Option+Cmd+I` to open Web Inspector.
3. In the **Elements** tab, right-click a node, for example `<html>` or `<body>`, and select **Capture Screenshot**.
4. Safari saves the snapshot of that node to a file.

Apple does not document whether a capture of `<html>` includes the content below the visible part of the page, or which image format it writes. Check the file before you rely on it.

## Limits

- **No full-page image.** Neither route gives the screenshot you would get from a full-page capture tool. The PDF is a print version of the page, and the Web Inspector item captures one node.
- **Print layout.** The PDF uses print layout, so the page in the file can look different from the page on screen. Turn on background images and colors if the design depends on them.
- **Lazy loading.** Images marked `loading="lazy"` load only when you scroll near them. Scroll through the page before you print or capture it, or parts can stay blank.
- **Inner scroll containers.** Developers report that automated full-page captures in WebKit, the engine under Safari, show only one screen height when a page scrolls a panel inside a fixed-height shell. Check pages built that way with care.
- **Sticky headers.** Check the result for a header that is missing, repeated, or in the wrong place.

## With OpenScreenShot

OpenScreenShot is not available for Safari. If you have Chrome, Firefox, Edge, Brave, Opera, Vivaldi, or Arc on the same Mac, open the page there and use the extension. Chrome and the other Chromium browsers install it from the [Chrome Web Store](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp). Firefox installs it from [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/openscreenshot/).

1. Install OpenScreenShot in the other browser and pin its icon to the toolbar.
2. Open the page and click the icon. In Chrome, `⌘⇧S` also starts a full-page capture.
3. Check the result in the editor.
4. Click **Save image** and choose PNG, JPEG, WebP, or PDF.

The extension scrolls the page, stitches the parts into one image, and places fixed headers once at the top. A page taller than 32,000 device pixels is saved as up to six images. The [Chrome guide](/full-page-screenshot/chrome/) and the [Firefox guide](/full-page-screenshot/firefox/) give the steps for each browser, including their own built-in tools.

## Which to use

- Use **File** > **Print** > **PDF** in Safari to keep a readable copy of an article or a receipt page.
- Use Web Inspector’s **Capture Screenshot** for an image of one part of a page, such as a card or a chart.
- Use OpenScreenShot in another browser on your Mac for a full-page image you can mark up, or for a PDF of the page as it looks on screen. The [screenshot-to-PDF guide](/blog/save-screenshot-as-pdf/) compares PDF layouts, and [saving a visual copy of a page](/use-cases/archive-web-pages/) covers naming and storage.

For other questions, see [support and known limitations](/support/).
