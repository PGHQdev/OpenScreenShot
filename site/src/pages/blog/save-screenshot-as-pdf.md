---
layout: ../../layouts/Article.astro
title: How to save a full-page screenshot as a PDF
description: Export a screenshot as a single PDF page, fit it to A4 or Letter, or split a long capture into multiple pages.
audience: Everyday screenshots
order: 2
---

To save a screenshot as a PDF in OpenScreenShot, open the capture in the editor, choose **Export**, and select **PDF**. Choose a single image page, an A4 or Letter layout, or a multipage export according to how the document will be read.

## Capture and prepare the screenshot

Start with a [full-page capture](/blog/full-page-screenshot-chrome/) if you need the whole webpage. Use a selected region when only one part belongs in the document. You can also drop an existing image onto the editor stage to annotate and export it.

Before exporting, crop unnecessary margins and add any arrows, text, or step numbers your reader needs. Cover private information with an opaque redaction. Your annotations and Beautify frame appear in the export, so inspect those before saving.

Open **Export** from the editor’s top bar, or use **Ctrl+S** on Windows/Linux or **⌘S** on macOS, then choose PDF.

## Which PDF layout should you use?

### Single image page

This keeps the screenshot together on one PDF page. It is useful when someone will zoom and pan through the document on screen. A very tall capture can be awkward to read at the viewer’s default zoom, so check it in a PDF viewer before sending it.

### Fit to A4 or Letter

Use a standard paper size when the screenshot needs to fit a document or be printed. Fitting a long webpage onto one sheet makes its text smaller. Crop to the part that matters or use multiple pages if the fit makes labels unreadable.

### Multiple pages

A multipage export splits the capture into page-sized sections. OpenScreenShot includes a 5 mm overlap between sections to help readers follow content across a break. Inspect those breaks: the exporter works with an image, so it cannot reorganize paragraphs like a word processor.

## Is the PDF text searchable?

OpenScreenShot exports the screenshot as image content in a PDF. It does not turn the screenshot into selectable text or add an OCR text layer. If you need searchable text or accessible document structure, use the website’s own document export when available, or a separate OCR workflow.

A screenshot PDF is useful when the visible appearance matters: an interface review, a bug report, or a visual record. The browser’s print-to-PDF workflow can produce a different layout because websites may apply print styles. Choose based on whether you need the rendered screen or the site’s printable document.

## Check the saved file

Open the actual exported PDF and review the text size, annotations, redactions, and page breaks. Do not judge only from the editor preview. The image-scale control used for PNG, JPEG, and WebP is hidden for PDF because PDF output sizes to its page layout.

For format and quality settings, see the [export documentation](/docs/#export). If the document includes private information, use the [redaction workflow](/blog/redact-screenshot/) before sharing.
