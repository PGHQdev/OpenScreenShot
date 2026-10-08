---
title: How to take a full-page screenshot in Vivaldi
description: Capture a whole page with Vivaldi’s Capture tool as PNG or JPEG, know its 30,000-pixel limit, and use OpenScreenShot from the Chrome Web Store.
order: 7
---

Vivaldi has a built-in Capture tool. Click the camera icon in the Status Bar, select **Full Page**, choose PNG, JPEG, or the clipboard, and click **Capture**. Full Page captures stop at 30,000 pixels. OpenScreenShot also works in Vivaldi: Vivaldi is a Chromium browser and installs extensions from the Chrome Web Store.

## Built-in method

Vivaldi describes the tool in [Capture a screenshot](https://help.vivaldi.com/desktop/tools/capture-a-screenshot/).

1. Open the page you want to capture.
2. Click the camera icon in the Status Bar. You can also open Quick Commands with `F2` on Windows and Linux, or `Cmd+E` on macOS, and type `Capture`.
3. Select **Full Page**.
4. Select the output: **Save as PNG**, **Save as JPEG**, or **Copy to Clipboard**.
5. Click **Capture**. Saved files go to the folder set under **Settings** > **Webpages** > **Image Capture** > **Capture Storage Folder**.

Vivaldi can also turn a capture into a new note in the Notes panel, with the capture date and the page URL.

[Vivaldi’s keyboard shortcut list](https://help.vivaldi.com/desktop/shortcuts/keyboard-shortcuts/) shows no default key for page capture. To get one, open **Settings** > **Keyboard** and map a key to **Capture Page to disk** or **Capture Page to Clipboard**.

## Limits

- **Size.** Full Page captures go up to 30,000 pixels at most. On a longer page, capture the sections you need.
- **Undocumented behavior.** Vivaldi does not document how it builds the full-page image, or how it treats sticky headers. Check the top and the middle of the image for a header that is missing or repeated.
- **Lazy loading.** Images marked `loading="lazy"` load only when you scroll near them. Scroll through the page before you capture it, or parts of the image can stay blank.
- **Inner scroll containers.** Developers report that full-page captures in Chromium, Firefox, and WebKit show only one screen height of a panel that scrolls inside a fixed-height shell. Vivaldi does not document its behavior here, so check web apps and docs sites with a scrolling content pane.
- **Markup.** Vivaldi documents no drawing or markup tools for captures. To add arrows or text, open the file in another app.

## With OpenScreenShot

OpenScreenShot scrolls the page one viewport at a time and stitches the parts into one image. Fixed headers are captured once at the top, and pages that scroll an inner element work too. A page taller than 32,000 device pixels is saved as up to six images.

1. Open the [OpenScreenShot listing](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp) in Vivaldi and add the extension. Vivaldi covers Chrome Web Store installs in its [extensions help](https://help.vivaldi.com/desktop/appearance-customization/extensions/).
2. Pin the OpenScreenShot icon to the toolbar.
3. Open the page and click the icon, or press `Ctrl+Shift+S` (`⌘⇧S` on macOS). With the default settings, a full-page capture starts and the result opens in the editor.
4. Check the top, the bottom, and any sticky navigation.
5. Click **Save image** and choose PNG, JPEG, WebP, or PDF, or click **Copy**.

If the icon opens a menu, select **Full Page**; the **One-click Express mode** setting controls this. The editor adds arrows, text, step numbers, blur, and crop before you export. The [capture mode reference](/docs/#modes) and the [export reference](/docs/#export) list every option.

## Which to use

- Use Vivaldi’s Capture tool for a PNG or JPEG of a page under 30,000 pixels, especially when you want the capture in a note with its URL.
- Use OpenScreenShot for longer pages, pages that scroll an inner panel, or captures you want to mark up or save as PDF, as in [help docs and tutorials](/use-cases/documentation/) or [design review](/use-cases/design-review/).
- Map a Vivaldi shortcut if you capture often and need no markup.

The [Opera guide](/full-page-screenshot/opera/) and the [Brave guide](/full-page-screenshot/brave/) cover other Chromium browsers with their own capture tools. For pages that block extensions, such as browser settings, see [support and known limitations](/support/).
