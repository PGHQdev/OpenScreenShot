---
title: How to make a screenshot ready to share on social media
description: Crop a screenshot, add a frame with padding, corners, shadow, and a background, hide personal details, and export it at a sharp size.
order: 4
---

To share a screenshot on social media, crop it to the part that makes your point, hide personal details, add a frame, and export it at a size that stays sharp. In OpenScreenShot, use **Crop** to trim, **Blur** with the **Solid** fill to hide details, and the **Frame** panel for padding, rounded corners, a shadow, and a background. Then export a PNG at 200 % or at an exact pixel width.

## Prepare a screenshot for a post step by step

1. Capture the page. **Selected Region** or **Capture element** in the right-click menu gives a tight image from the start.
2. In the **Editor**, select **Crop** (`C`), drag over the part you want to keep, and click **Apply**.
3. Select **Blur** (`B`), choose **Solid** under **Hide area**, and cover names, profile pictures, email addresses, and anything else that is not yours to share.
4. Click **Frame** in the top bar. Choose a **Preset**, then adjust **Spacing**, **Corners**, **Shadow**, and **Background**.
5. Click **Save image**. In the **Export** dialog, choose **PNG** and set **Scale** to 200 % or to an exact width.
6. Open the saved file and check the redactions and the frame before you post it.

To post without a saved file, click **Copy** or press `Ctrl+C` (`⌘C` on macOS) and paste the image into the post. The frame is included in the copied image.

## Hide personal information first

Do the redaction before the frame and the export, and check it again in the saved file. Comments, follower names, notification counts, browser tabs inside the page, and account menus often show more than you intend.

A soft blur or a mosaic can leave clues about short text. **Solid** covers the area completely in the export. The [redaction guide](/blog/redact-screenshot/) explains how to cover an area with a margin and how to check the result.

## Choose a frame

The **Frame** panel, called Beautify in the [documentation](/docs/#annotate), has six presets:

- **Clean**: a simple frame with a soft shadow
- **Airy**: extra space around the screenshot
- **Snug**: a close-fitting frame
- **Flat**: square corners with no shadow
- **Poster**: rounded corners with a deep shadow
- **Cutout**: a shadow with no background

After you choose a preset, the sliders let you change the spacing, the corner radius, and the shadow. For **Background**, choose one of six gradients (Ink, Coral, Dusk, Mint, Sand, Sky), a solid color, or **Transparent**. The frame previews live and goes into every export.

A transparent background needs PNG or WebP. JPEG has no transparency, so it fills the background with a solid color.

## Export at a sharp size

Under **Scale**, choose 25, 50, 100, or 200 %, or type an exact pixel width. A capture of a small region can look soft when a site enlarges it in a post; 200 % gives the site more pixels to work with. A size past Chrome’s canvas limit is refused, and the dialog tells you instead of saving an empty file.

PNG keeps interface text sharp. JPEG and WebP have a quality control for smaller files. Each social site has its own size and compression rules, so check the post preview before you publish.

## Arrows and labels

Add one **Arrow** (`A`) or a short **Text** (`T`) label when the point of the image is not obvious at a glance. **Spotlight** (`O`) dims everything outside one area, which works well for a single feature in a busy interface. Keep annotations few, because a post preview is usually small.

## Limits

The extension captures the page content only. It does not include the browser toolbar or your desktop. Captures and edits stay on your computer until you post or upload the image; the site you post to has its own storage and sharing rules.

The [export reference](/docs/#export) lists every format. For screenshots that teach a task, see [screenshots for documentation](/use-cases/documentation/). For a short video of your product, see [product demo videos](/use-cases/product-demos/).
