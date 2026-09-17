---
layout: ../../layouts/Article.astro
title: How to take a full-page screenshot in Chrome
description: Capture an entire scrolling webpage with OpenScreenShot, check the result, and export it as an image or PDF.
audience: Everyday screenshots
order: 1
---

To take a full-page screenshot with OpenScreenShot, open the webpage and click the extension’s toolbar icon. With the default settings, capture starts immediately and the finished image opens in the editor. The extension scrolls the page and stitches the captured sections into one image.

## Capture the page step by step

1. Install [OpenScreenShot from the Chrome Web Store](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp) and pin its icon to the toolbar.
2. Open the page you want to capture. Dismiss any banners or dialogs you do not want in the image.
3. Wait for the content you need to load. For pages with lazy-loaded images, scroll through the relevant content before starting.
4. Click the OpenScreenShot icon. Leave the tab in place while the capture completes.
5. Inspect the image in the editor, especially the first and last sections and any sticky navigation.
6. Open **Export** and choose PNG, JPEG, WebP, or PDF.

If clicking the icon opens the mode picker instead, select **Full Page**. The **Icon click captures the full page** setting controls which behavior you get. If the editor does not open, check **After capture**: Clipboard and Download send the result directly to their destinations.

## Full page, visible area, or selected region?

**Full Page** is useful for reviewing a landing page, keeping a visual copy of an article, or showing a long settings screen. It includes content beyond the current viewport.

**Visible Area** captures what is currently visible without scrolling. Use it when the surrounding interface is useful context but the rest of the page is irrelevant.

**Selected Region** captures a rectangle you choose. It is often the clearest option for a bug report: capture the broken component and enough surrounding content to identify it. See the [capture mode reference](/docs/#modes) for selection controls and shortcuts.

## Why is part of the page missing or repeated?

A full-page screenshot records a page as it is rendered. It is not an export of everything a website could eventually load. Infinite feeds, virtualized lists, moving content, and embedded scroll areas can make that distinction visible.

OpenScreenShot handles sticky headers and nested scrollers, but a page that replaces its content as it scrolls can still produce an incomplete result. Let the page settle, load the relevant section, then retry. For an endlessly growing feed, capture the important region instead. Browser-internal pages and other protected surfaces may block extension capture; see [support and known limitations](/support/).

## Choose an export that fits the destination

Use PNG for interface text and diagrams when lossless output matters. JPEG and WebP offer quality controls when file size is more important. For a document attachment, follow the [screenshot-to-PDF guide](/blog/save-screenshot-as-pdf/).

Before sharing, remove information your reader does not need. The [redaction guide](/blog/redact-screenshot/) explains how to cover sensitive content and inspect the exported file. Capturing and editing in the extension happen locally; uploading the exported screenshot elsewhere is a separate action you control.
