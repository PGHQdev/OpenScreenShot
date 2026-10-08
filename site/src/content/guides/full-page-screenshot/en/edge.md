---
title: How to take a full-page screenshot in Microsoft Edge
description: Capture a whole page with Edge’s built-in Screenshot tool or its DevTools command, know the limits, and use OpenScreenShot from the Chrome Web Store.
order: 2
---

Microsoft Edge has a built-in Screenshot tool, previously named Web capture. Press `Ctrl+Shift+S`, select **Capture full page**, then copy the capture or save it to your device. OpenScreenShot also works in Edge: Edge is a Chromium browser and installs it from the Chrome Web Store once you allow extensions from other stores.

## Built-in method

Microsoft describes the tool in its [guide to screenshots in Edge](https://www.microsoft.com/en-us/edge/learning-center/screenshot-webpage).

1. Open the page you want to capture.
2. Press `Ctrl+Shift+S`. You can also right-click the page and select **Screenshot**, or open **Settings and more** (**...**) and select **Screenshot**.
3. Select **Capture full page**, the middle option.
4. In the preview, use the draw tools to mark up the capture if you need to.
5. Copy the capture, or save it to your device.

Microsoft says that feature availability can vary by device type, market, and browser version. Administrators can also turn the tool off with the [WebCaptureEnabled policy](https://learn.microsoft.com/en-us/deployedge/microsoft-edge-policies/webcaptureenabled). On a work computer, a missing **Screenshot** item can mean that policy is set.

Edge also has the Chromium DevTools capture. Open DevTools, turn on Device Emulation, open **More options**, and select **Capture a full size screenshot**. Microsoft documents this in its [Device Mode article](https://learn.microsoft.com/en-us/microsoft-edge/devtools/device-mode/). The [Chrome guide](/full-page-screenshot/chrome/) compares that route with an extension.

## Limits

- **Undocumented behavior.** Microsoft does not document how the Screenshot tool builds a full-page image, its maximum page length, or how it treats sticky headers, lazy loading, and inner scroll containers. Check each capture before you share it.
- **Inner scroll containers.** Users on Microsoft Q&A report that full-page capture failed on pages that scroll inside an inner element, for example a web app with a scrolling content pane. Microsoft has not confirmed this.
- **DevTools page size.** The DevTools capture uses Chromium’s screenshot command, which refuses a page 131,072 CSS pixels or more in width or height with the error “Page is too large.”
- **Lazy loading.** Images marked `loading="lazy"` load only when you scroll near them. Scroll through the page before you capture it, or parts of the image can stay blank.
- **Sticky headers.** A capture tool that scrolls and joins several parts repeats any element that stays on screen. Look for a header that appears more than once down the image.

## With OpenScreenShot

OpenScreenShot scrolls the page, captures it in parts, and stitches the parts into one image. Fixed headers are captured once at the top, and pages that scroll an inner element work too. A page taller than 32,000 device pixels is saved as up to six images.

1. Open the [OpenScreenShot listing](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp) in Edge. When Edge asks, select **Allow extensions from other stores**, then add the extension. Microsoft explains this step in its [extensions help](https://support.microsoft.com/en-us/edge/add-turn-off-or-remove-extensions-in-microsoft-edge).
2. Pin the OpenScreenShot icon to the toolbar.
3. Open the page and click the icon. With the default settings, a full-page capture starts and the result opens in the editor.
4. Check the top, the bottom, and any section that loads as you scroll.
5. Click **Save image** and choose PNG, JPEG, WebP, or PDF, or click **Copy**.

OpenScreenShot’s full-page shortcut is `Ctrl+Shift+S`, the same keys as Edge’s Screenshot tool. If the keys open Edge’s tool, click the icon instead, or set a different key with the **Shortcuts** link in the capture menu. The [capture mode reference](/docs/#modes) lists the other modes.

## Which to use

- Use Edge’s Screenshot tool for a quick capture with a few pen marks, on a page that scrolls the whole window.
- Use OpenScreenShot when a page scrolls an inner panel, when you need PDF, JPEG, or WebP export, or when you need step numbers and solid redaction, as in [help docs and tutorials](/use-cases/documentation/) or [support replies](/use-cases/customer-support/).
- Use the DevTools capture when your administrator turned the Screenshot tool off and you cannot install extensions.

The [export reference](/docs/#export) covers file formats and scale. For pages OpenScreenShot cannot capture, such as browser settings, see [support and known limitations](/support/).
