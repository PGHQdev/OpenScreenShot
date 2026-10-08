---
title: How to take a full-page screenshot in Arc
description: Run Arc’s Capture Full Page command on macOS to save a PNG, know what Arc leaves undocumented, and use OpenScreenShot from the Chrome Web Store.
order: 8
---

Arc for macOS has a **Capture Full Page** command. Press `Cmd+T` to open the Command Bar, type `Capture Full Page`, and select it. Arc downloads a PNG of the whole page to your default download location. Arc’s help documents this command for macOS only. OpenScreenShot also works in Arc: Arc is a Chromium browser and installs extensions from the Chrome Web Store.

## Built-in method

Arc describes the command in [How to take full page screen captures in Arc](https://resources.arc.net/hc/en-us/articles/25481392111895-How-To-Take-Full-Page-Screen-Captures-in-Arc).

1. Open the page you want to capture.
2. Press `Cmd+T` to open the Command Bar, type `Capture Full Page`, and select it. You can also choose **File** > **Capture Full Page**.
3. Arc downloads a PNG to your default download location.

The command has no default shortcut. To add one, open **Arc** > **Settings** > **Shortcuts**, search for `capture`, and set a key for **Capture Full Page**.

For a styled screenshot, turn on [Developer Mode](https://resources.arc.net/hc/en-us/articles/20468488031511-Developer-Mode-Instant-Dev-Tools) and use the screenshot button in the toolbar, or run **Capture in Portrait Mode** from the Command Bar. Arc’s separate Capture tool takes a selection with editing and Easels, and it is also macOS only.

## Limits

- **macOS only.** Arc documents no full-page command for Arc on Windows.
- **Undocumented behavior.** Arc does not document how it builds the image, its size limit, or how it treats sticky headers. Check the top and the middle of the PNG for a header that is missing or repeated.
- **Markup.** Arc does not document editing for full-page captures. To add arrows or text, open the PNG in another app.
- **Lazy loading.** Images marked `loading="lazy"` load only when you scroll near them. Scroll through the page before you capture it, or parts of the image can stay blank.
- **Inner scroll containers.** Developers report that full-page captures in Chromium, Firefox, and WebKit show only one screen height of a panel that scrolls inside a fixed-height shell. Check web apps and docs sites with a scrolling content pane.
- **Infinite scroll.** A feed that keeps loading has no true bottom. The capture holds only what loaded before you started.

## With OpenScreenShot

OpenScreenShot scrolls the page one viewport at a time and stitches the parts into one image. Fixed headers are captured once at the top, and pages that scroll an inner element work too. A page taller than 32,000 device pixels is saved as up to six images.

1. Open the [OpenScreenShot listing](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp) in Arc and add the extension. Arc covers Chrome Web Store installs in [Extensions in Arc](https://resources.arc.net/hc/en-us/articles/19434259167767-Extensions-in-Arc-How-to-Import-Add-Open).
2. Pin the OpenScreenShot icon.
3. Open the page and click the icon, or press `⌘⇧S`. With the default settings, a full-page capture starts and the result opens in the editor.
4. Check the top, the bottom, and any sticky navigation.
5. Click **Save image** and choose PNG, JPEG, WebP, or PDF, or click **Copy**.

If the icon opens a menu, select **Full Page**; the **One-click Express mode** setting controls this. To style the capture in OpenScreenShot, open the **Frame** panel in the editor: it adds padding, rounded corners, a shadow, and a gradient, solid, or transparent background, and the frame travels into every export. The [capture mode reference](/docs/#modes) and the [export reference](/docs/#export) list every option.

## Which to use

- Use **Capture Full Page** in Arc on macOS for a quick PNG of a page that scrolls the whole window.
- Use OpenScreenShot on pages that scroll an inner panel, or when you want to mark up, redact, or save the capture as PDF, as in [design review](/use-cases/design-review/).
- Use OpenScreenShot’s **Frame** panel for a styled image with your own padding and background, as in [screenshots for social media](/use-cases/social-media/).

The [Chrome guide](/full-page-screenshot/chrome/) compares Chrome’s DevTools capture with the extension, and the [Brave guide](/full-page-screenshot/brave/) covers another Chromium browser with a built-in tool. For pages that block extensions, such as browser settings, see [support and known limitations](/support/).
