---
title: How to take a full-page screenshot in Firefox
description: Capture a whole page with Firefox’s built-in Screenshots tool or the :screenshot command, check the size limits, and use the OpenScreenShot add-on.
order: 3
---

Firefox has a built-in Screenshots tool. Press `Ctrl+Shift+S` (`Cmd+Shift+S` on macOS), select **Save full page**, then select **Download** to save a PNG or **Copy** to put the image on the clipboard. The OpenScreenShot add-on for Firefox adds an editor for arrows, text, and redaction, and exports to PNG, JPEG, WebP, or PDF.

## Built-in method

Mozilla describes the tool in [Take screenshots in Firefox](https://support.mozilla.org/en-US/kb/take-screenshots-firefox).

1. Open the page you want to capture.
2. Press `Ctrl+Shift+S` on Windows and Linux, or `Cmd+Shift+S` on macOS. You can also right-click an empty part of the page and select **Take Screenshot**.
3. Select **Save full page** in the upper right.
4. In the preview, select **Download** to save a PNG to your Firefox download folder, or select **Copy**.

The preview offers **Copy** and **Download**. To add arrows or text, open the PNG in another app.

Firefox DevTools has a second route. Open the Web Console and type `:screenshot --fullpage`, and Firefox saves a PNG of the whole page. You can also turn on the **Take a screenshot of the entire page** button under **Available Toolbox Buttons** in the DevTools settings. Mozilla documents both in its [DevTools screenshot guide](https://firefox-source-docs.mozilla.org/devtools-user/taking_screenshots/index.html).

## Limits

- **Size.** Firefox crops a capture that is larger than 32,766 pixels on a side or 472,907,776 pixels in area, and shows “Your screenshot was cropped because it was too large.” Firefox’s error message for an oversized capture gives different numbers: smaller than 32,700 pixels on the longest side or 124,900,000 pixels in total area.
- **Display scale.** Firefox counts these limits in device pixels: page width and height multiplied by the display’s pixel ratio. On a 2x display, the page-height limit in CSS pixels is half, about 16,383.
- **Inner scroll containers.** Firefox takes the full-page bounds from the window’s scroll width and height. When a page scrolls a panel inside a fixed-height shell, the content inside that panel does not expand, so the capture shows only one screen height of it.
- **Lazy loading.** Images marked `loading="lazy"` load only when you scroll near them. Scroll through the page before you capture it, or parts of the image can stay blank.
- **Infinite scroll.** A feed that loads more as you scroll has no true bottom. The capture holds only what loaded before you started.
- **Sticky headers.** Check the top and the middle of the image for a header that is missing, repeated, or in the wrong place before you share it.

## With OpenScreenShot

The Firefox build of OpenScreenShot takes screenshots only. Tab recording is in the Chrome build. Its full-page mode scrolls the page, captures it in parts, and stitches the parts into one image, with fixed headers placed once at the top. Pages that scroll an inner element instead of the window work too.

1. Install [OpenScreenShot from Firefox Add-ons](https://addons.mozilla.org/firefox/addon/openscreenshot/) and pin its icon to the toolbar.
2. Open the page and scroll through it once so lazy-loaded images load, then return to the top.
3. Click the OpenScreenShot icon and choose **Full Page** if the mode menu opens.
4. Check the result in the editor, especially the top, the bottom, and any sticky navigation.
5. Click **Save image** and choose PNG, JPEG, WebP, or PDF, or click **Copy**.

Firefox uses `Ctrl+Shift+S` for its own Screenshots tool, so click the toolbar icon when you want OpenScreenShot. The [capture mode reference](/docs/#modes) describes each mode, and the [export reference](/docs/#export) covers formats and scale.

## Which to use

- Use Firefox Screenshots for a quick PNG of a page that scrolls the whole window and fits inside the size limit.
- Use the `:screenshot --fullpage` command when you already work in the Web Console.
- Use OpenScreenShot for pages that scroll an inner panel, and for captures you want to mark up or save as PDF, as in [bug reports](/use-cases/bug-reports/) or a [saved copy of a page](/use-cases/archive-web-pages/).

The [Chrome guide](/full-page-screenshot/chrome/) and the [Edge guide](/full-page-screenshot/edge/) cover the same task in Chromium browsers, where OpenScreenShot can also record tabs. For pages that block extensions, such as Firefox settings, see [support and known limitations](/support/).
