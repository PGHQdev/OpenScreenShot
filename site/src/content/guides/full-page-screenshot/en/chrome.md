---
title: 'How to take a full-page screenshot in Chrome: DevTools or an extension'
description: Use the Capture full size screenshot command in Chrome DevTools, learn where it falls short, and compare it with a full-page capture in OpenScreenShot.
order: 1
---

Chrome can take a full-page screenshot without an extension, but only from DevTools. Open DevTools, open the Command Menu, type `screenshot`, and run **Capture full size screenshot**. Chrome saves the whole page as a PNG file. The normal Chrome menus have no screenshot item: Google’s help lists Share, Send to your devices, and Create QR code under **Cast, save, and share**. For a capture you can mark up, export as PDF, or take on a page that scrolls inside a panel, install OpenScreenShot and click its icon.

## Built-in method

1. Open the page you want to capture.
2. [Open DevTools](https://developer.chrome.com/docs/devtools/open): press `F12` or `Ctrl+Shift+I` on Windows and Linux, or `Cmd+Option+I` on macOS.
3. Open the [Command Menu](https://developer.chrome.com/docs/devtools/command-menu): press `Ctrl+Shift+P`, or `Cmd+Shift+P` on macOS.
4. Type `screenshot` and select **Capture full size screenshot**.
5. Chrome saves a PNG file of the whole page.

The same capture is in Device Mode. Turn on the device toolbar, open its **More options** menu, and select the full size screenshot item. Google’s [Device Mode documentation](https://developer.chrome.com/docs/devtools/device-mode) calls it **Capture a full size screenshot**.

There is no single shortcut for the whole sequence. Google documents no markup tools for the capture, so arrows, text, and redaction happen in another app.

## Limits

- **DevTools must be open.** The command is in the Command Menu and the Device Mode menu only.
- **Page size.** Chromium refuses a page that is 131,072 CSS pixels or more in width or height, with the error “Page is too large.”
- **Sticky and fixed elements.** For the capture, Chromium resizes the view to the full page size and hides the scrollbars. Sections sized to the window height (`100vh`) and fixed headers or footers can then lay out against that tall view. A fixed footer can appear once at the bottom of the image, and a full-height hero section can stretch.
- **Lazy loading.** Images and frames marked `loading="lazy"` load only when you scroll near them. Scroll through the page before you run the command, or parts of the image can stay blank.
- **Inner scroll containers.** Chromium sizes the capture from the page’s own scroll size. When a page scrolls a panel inside a fixed-height shell, for example a web app or a docs site with a scrolling content pane, the capture shows only one screen height of that panel.

## With OpenScreenShot

OpenScreenShot scrolls the page one viewport at a time, captures each part, and stitches the parts into one image. It captures fixed headers on the first part and places them once at the top. Pages that scroll an inner element instead of the window work too. A page taller than 32,000 device pixels is saved as up to six images.

1. Install [OpenScreenShot from the Chrome Web Store](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp) and pin its icon to the toolbar.
2. Open the page and click the icon, or press `Ctrl+Shift+S` (`⌘⇧S` on macOS).
3. Check the result in the editor, especially the top, the bottom, and any sticky navigation.
4. Click **Save image** and choose PNG, JPEG, WebP, or PDF. **Copy** and **PDF** beside it finish in one click.

If a menu opens instead of a capture, select **Full Page**. The **One-click Express mode** setting controls this. The [Chrome full-page screenshot guide](/blog/full-page-screenshot-chrome/) walks through the extension step by step, including missing or repeated sections. The [capture mode reference](/docs/#modes) and the [export reference](/docs/#export) list every option.

## DevTools and OpenScreenShot side by side

- **Start:** DevTools needs two shortcuts and a typed command. OpenScreenShot needs one click or one shortcut.
- **Output:** DevTools saves a PNG. OpenScreenShot exports PNG, JPEG, WebP, or PDF, or copies the image.
- **Editing:** DevTools has none. OpenScreenShot opens an editor with arrows, text, step numbers, blur, and crop.
- **Install:** DevTools is already in Chrome. OpenScreenShot is an MIT-licensed extension that processes captures locally.

## Which to use

- Use DevTools for a one-off PNG of an ordinary page on a computer where you cannot add extensions.
- Use OpenScreenShot for pages that scroll an inner panel, pages with sticky headers, and captures you want to mark up before you share them, as in [bug reports](/use-cases/bug-reports/) or [design review](/use-cases/design-review/).
- Use either one in Microsoft Edge too; the [Edge guide](/full-page-screenshot/edge/) covers Edge’s own Screenshot tool.

If a capture fails on a browser page such as `chrome://settings`, see [support and known limitations](/support/).
