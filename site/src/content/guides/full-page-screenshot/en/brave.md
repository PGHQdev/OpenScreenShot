---
title: How to take a full-page screenshot in Brave
description: Turn on Brave’s screenshot toolbar button and capture a full page as PNG, check the limits, and use OpenScreenShot from the Chrome Web Store.
order: 5
---

Brave 1.94 and later have a built-in screenshot tool. Turn on the screenshot button in `brave://settings/appearance`, click it, and select **Full page**. In Brave 1.96 and later, a preview opens where you download a PNG or copy the image. OpenScreenShot also works in Brave: Brave is a Chromium browser and installs extensions from the Chrome Web Store.

## Built-in method

Brave has no help-center article for the tool. The steps below follow Brave’s [release notes](https://brave.com/latest/) and its [issue tracker](https://github.com/brave/brave-browser/issues/57937).

1. Go to `brave://settings/appearance` and turn on the screenshot button in the toolbar section.
2. Open the page you want to capture.
3. Click the **Take a screenshot** button in the toolbar.
4. In the **Capture screenshot** bubble, select **Full page**. The bubble also offers **Selected area** and **Visible area**.
5. In the **Screenshot preview** dialog, select **Download** to save a PNG, or select **Copy to clipboard**.

`Ctrl+Shift+S` (`Shift+Cmd+S` on macOS) opens Brave’s screenshot tool in Brave 1.75 and later. Brave’s issue tracker describes that shortcut as a selection-style capture, so use the toolbar button for **Full page**. In Brave 1.96 the screenshot item in the app menu moved to the Save section of **Save and share**.

The preview offers **Download** and **Copy to clipboard**. To add arrows or text, open the PNG in another app.

## Limits

- **Page size.** The **Full page** option uses Chromium’s DevTools screenshot command. That command refuses a page 131,072 CSS pixels or more in width or height, with the error “Page is too large.”
- **Sticky and fixed elements.** For that command, Chromium resizes the view to the full page size. Sections sized to the window height (`100vh`) and fixed headers or footers can then lay out against that tall view, so a fixed footer can appear once at the bottom of the image.
- **Lazy loading.** Images marked `loading="lazy"` load only when you scroll near them. Scroll through the page before you capture it, or parts of the image can stay blank.
- **Inner scroll containers.** Chromium sizes the capture from the page’s own scroll size. When a page scrolls a panel inside a fixed-height shell, the capture shows only one screen height of that panel.
- **Infinite scroll.** A feed that keeps loading has no true bottom. The capture holds only what loaded before you started.

## With OpenScreenShot

OpenScreenShot scrolls the page one viewport at a time and stitches the parts into one image. Fixed headers are captured once at the top, and pages that scroll an inner element work too. A page taller than 32,000 device pixels is saved as up to six images.

1. Open the [OpenScreenShot listing](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp) in Brave and add the extension. Brave explains Chrome Web Store installs in [Using Chrome extensions in Brave](https://brave.com/learn/using-chrome-extensions-in-brave/).
2. Pin the OpenScreenShot icon to the toolbar.
3. Open the page and click the icon. With the default settings, a full-page capture starts and the result opens in the editor.
4. Check the top, the bottom, and any sticky navigation.
5. Click **Save image** and choose PNG, JPEG, WebP, or PDF, or click **Copy**.

OpenScreenShot’s full-page shortcut is `Ctrl+Shift+S` (`⌘⇧S` on macOS), the same keys as Brave’s screenshot tool. If the keys open Brave’s tool, click the icon instead, or set a different key with the **Shortcuts** link in the capture menu. If the icon opens a menu, select **Full Page**; the **One-click Express mode** setting controls this.

## Which to use

- Use Brave’s **Full page** button for a quick PNG of a page that scrolls the whole window.
- Use OpenScreenShot for pages that scroll an inner panel, for PDF, JPEG, or WebP export, or for markup and redaction before you share, as in [bug reports](/use-cases/bug-reports/).
- Use OpenScreenShot’s **Frame** panel when the capture goes to a post: it adds padding, rounded corners, a shadow, and a background. See [screenshots for social media](/use-cases/social-media/).

The [capture mode reference](/docs/#modes) and the [export reference](/docs/#export) list every option. The [Chrome guide](/full-page-screenshot/chrome/) covers the DevTools capture, which Brave also has. For pages that block extensions, such as browser settings, see [support and known limitations](/support/).
