---
title: How to make screenshots for help docs and tutorials
description: Keep tutorial screenshots the same size, number the steps, highlight the right control, and save each file into a docs folder.
order: 3
---

For help docs and tutorials, capture each screen the same way, number the actions, and export every image at the same width. In OpenScreenShot, set an exact pixel width under **Scale** in the **Export** dialog, add **Step number** badges for each action, and use **Spotlight** to point readers at the right control. A filename template such as `Docs/{title}` saves each image into a folder inside Downloads.

## Make a tutorial screenshot step by step

1. Set the browser window to the same size for every capture in the article. Use the same theme and zoom level each time.
2. Capture the screen. **Selected Region** or **Capture element** in the right-click menu keeps the image to the part of the interface the step is about.
3. In the **Editor**, add a **Step number** (`S`) on each control in the order the reader uses them.
4. Add **Spotlight** (`O`) over the area that matters when the screen has a lot of other content.
5. Cover sample customer data, real email addresses, and API keys with **Blur** (`B`) and the **Solid** fill.
6. Optionally, open **Frame** in the top bar to add padding, rounded corners, and a shadow.
7. Click **Save image**. In the **Export** dialog, choose **PNG**, enter your page width under **Scale**, check the filename, and click **Export**.

## Keep every image the same size

Readers notice when screenshots in one article change size from step to step. Under **Scale**, choose 25, 50, 100, or 200 %, or type an exact pixel width. A fixed width makes every image in an article match the content column of your docs site.

Turn on **Remember these settings** in the **Export** dialog to keep the format and quality as your new defaults. The width is not part of those defaults, so enter it again for each export. A width past Chrome’s canvas limit is refused, so the extension never writes an empty file.

PNG keeps interface text sharp because it is lossless. Use JPEG or WebP only when your docs platform limits file size.

## Number steps that stay in order

**Step number** badges count up on their own: the first click places 1, the next places 2. When you delete a badge, the remaining badges renumber, so you can remove a step without editing every number after it. Match the numbers in the image to the numbered list in your article.

Use the eight-color palette on keys `1`–`8`. The editor remembers your color, stroke width, and font size across sessions, so screenshots for one article keep the same style.

## Highlight and frame

**Spotlight** keeps one or more areas lit and dims the rest. The cut-outs can be a rectangle, a rounded rectangle, or an ellipse. For a long settings page, the **Cut** tool (`X`) removes horizontal bands that the reader does not need, with a live preview before you apply it.

The **Frame** panel, called Beautify in the [documentation](/docs/#annotate), adds padding, corner radius, a drop shadow, and a background around the screenshot. The frame goes into every export and into the clipboard. Pick one preset and use it for every image in the docs.

## Name and file the images

Open **Settings** from the popup or the toolbar icon’s right-click menu, then edit **Filename template**. Click a token to insert `{date}`, `{time}`, `{title}`, `{domain}`, `{w}`, or `{h}`, and check the live preview.

Add `/` to save into a folder inside Downloads. For example, `Docs/{title}` saves each image into a `Docs` folder, named after the page title. The `{title}` token replaces characters that filenames cannot hold, so a `/` in a page title does not create another folder. The **Export** dialog shows the filename before you save, and you can edit it there.

## Limits

Interface screenshots go out of date when the product changes. Keep the page title or URL in the filename, so you can find and replace old images. A browser screenshot shows the page content only; it does not include the address bar or browser toolbar.

The [export reference](/docs/#export) and [settings reference](/docs/#settings) list every option. To prepare an image for a post, see [sharing screenshots on social media](/use-cases/social-media/).
