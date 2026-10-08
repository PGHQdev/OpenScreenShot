---
title: How to capture a web page for design review
description: Capture a full page or one component, point reviewers to details with spotlight and text callouts, and share a multipage PDF.
order: 2
---

For a design review, capture the whole page with **Full Page**, mark the points you want feedback on, and share a PDF that reviewers can read page by page. In OpenScreenShot, **Spotlight** dims everything outside the area under discussion, and **Text** and **Arrow** add callouts. Use **Capture element** when the review is about one component, such as a card, chart, or table.

## Prepare a page for review step by step

1. Open the page at the window width you want to review. The capture shows the layout at the current width, so resize the window first to review another breakpoint.
2. Scroll through the page once so lazy-loaded images load, then return to the top. Close cookie banners and chat widgets that are not part of the review.
3. Click the OpenScreenShot icon. With the default settings, this starts a **Full Page** capture. Leave the tab in place until the editor opens.
4. Check the first and last sections, the header, and any area with motion, such as a carousel.
5. Select **Spotlight** (`O`) and drag over each area you want reviewers to look at. Several cut-outs merge into one dim layer.
6. Add a **Text** (`T`) note next to each area, and an **Arrow** (`A`) where a note needs to point at a small detail.
7. Click **Save image** to open the **Export** dialog. Choose **PDF**, then follow the export steps below.

## Capture one component

Right-click the page, open the **OpenScreenShot** submenu, and choose **Capture element**. Hover over the component until it is outlined, then click or press `Enter` to capture its bounds. Press `↑` to select the parent element, for example the section that holds a card, and `←` or `→` to move to a neighbor.

An element capture gives a tight image with no manual cropping, which is useful for comparing two versions of the same component. If the element is not fully visible on screen, the picker offers a full-page capture instead.

## Mark feedback so reviewers can follow it

Spotlight cut-outs can be a rectangle, a rounded rectangle, or an ellipse. Use one spotlight image per topic: an image with many lit areas makes reviewers guess which note goes with which area. For numbered feedback, add a **Step number** (`S`) at each point and refer to the numbers in the review thread. The numbers count up on their own and renumber when you delete one.

The **Shape** tool (`R`) draws an outline around an area without dimming the rest of the page. The **Arrow** tool offers filled, open, double, and dot tips, and you can drag its middle handle to bend it around other content.

## Share the review as a PDF

In the **Export** dialog, choose **PDF**, select **A4** or **Letter** under **Page size**, and turn on **Split across multiple pages**. Consecutive pages overlap by 5 mm, so a line of text at a page break shows on both pages. Choose **Full** under **Page size** to keep the page on one tall PDF page for on-screen reading.

The PDF holds the screenshot as an image, with your annotations. It has no selectable text. The [screenshot-to-PDF guide](/blog/save-screenshot-as-pdf/) compares the layouts, and the [export reference](/docs/#export) lists the other formats.

## Limits of a full-page capture

A full-page capture records the page as it renders while the extension scrolls. Some content changes during that scroll:

- A fixed header is captured on the first tile and added once at the top. Check that other sticky elements, such as sidebars or bottom bars, appear where you expect.
- Images that load only when they come into view can show as empty boxes if the capture reaches them first. Scroll the page before you capture.
- Carousels, animations, live counters, and infinite feeds can change between tiles. Pause them, or capture the important region instead.

A page taller than 32,000 device pixels is saved as up to six images, each in its own editor tab. The [full-page screenshot guide](/blog/full-page-screenshot-chrome/) covers more troubleshooting. For screenshots that go into help articles, see [screenshots for documentation](/use-cases/documentation/).
