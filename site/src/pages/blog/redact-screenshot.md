---
layout: ../../layouts/Article.astro
title: How to redact sensitive information in a screenshot
description: Use an opaque fill to cover private information, export a flattened screenshot, and check the saved file before sharing.
audience: Everyday screenshots
order: 3
---

For information that must not be visible in a shared screenshot, use OpenScreenShot’s **Blur** tool with its opaque fill mode. Cover the entire sensitive area, export the finished image, and open that exported file to verify the result. A soft blur is a visual effect; an opaque fill is the clearer choice for hiding text.

## Redact a screenshot step by step

1. Capture the relevant page or import an existing image into the editor.
2. Crop out sections that the recipient does not need.
3. Select **Blur**, or press **B**, and choose the opaque fill mode.
4. Draw over each sensitive item, leaving a small margin around the visible characters.
5. Zoom in and inspect the covered areas and the rest of the screenshot.
6. Export as PNG for a lossless image, then open the saved file and check it again.

Typical places to inspect include account menus, email addresses, browser content showing access tokens, billing details, internal hostnames, and identifiers embedded in URLs or page headings. An arrow or annotation you added can also accidentally repeat the information you meant to remove.

## Why choose opaque fill instead of blur or mosaic?

Blur softens pixels and mosaic groups them into blocks. Both can leave clues about the original content, especially when the text is large or the effect is weak. An opaque fill completely covers the selected area in the rendered export.

The area you select still matters. A partly covered email address or token is partly visible regardless of the tool. Avoid translucent highlighter strokes for redaction, and check the edges of every box at a readable zoom level.

## Does redaction erase the original capture?

Editing the screenshot does not mean the original source image or local draft has been erased. Annotations remain editable while you work. Share the exported image you checked, and manage any original captures or drafts separately if they contain information you no longer need to keep.

OpenScreenShot processes extension captures and edits locally. That describes the capture and editing workflow; the service you later upload the exported image to has its own storage and sharing behavior. See the [privacy policy](/privacy/) for the extension’s data handling.

## What if I need a PDF?

You can redact before [exporting the screenshot to PDF](/blog/save-screenshot-as-pdf/). Inspect the saved PDF as well, including every page of a long capture. Screenshot PDF export contains image content; it does not apply a document redaction tool to an existing text-based PDF.

For a bug report, pair the redacted image with a short explanation of what happened and the steps to reproduce it. Keep enough context to make the problem understandable while removing unrelated details. The [annotation reference](/docs/#annotate) covers arrows, labels, step numbers, and crop controls.
