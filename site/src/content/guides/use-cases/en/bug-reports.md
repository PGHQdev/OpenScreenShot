---
title: How to take screenshots for bug reports
description: Capture the broken part of a page, mark it with arrows and step numbers, hide tokens and emails, and paste the image into an issue.
order: 1
---

For a bug report, capture only the part of the page that shows the problem, mark what is wrong, and hide anything private before you paste the image into the issue. In OpenScreenShot, use **Selected Region** or **Capture element** for the capture, the **Arrow** and **Step number** tools for the marks, and **Blur** with the **Solid** fill for redaction. Put the URL, browser, and reproduction steps in the issue text, because the screenshot shows the page content without the address bar.

## Capture and mark a bug step by step

1. Open the page and bring it to the broken state. Dismiss banners that hide the problem.
2. Right-click the page, open the **OpenScreenShot** submenu, and choose **Selected Region** or **Capture element**. With the default settings, a click on the toolbar icon captures the full page instead.
3. For a region, drag a rectangle around the problem with enough surrounding interface to identify where it is. Press `Enter` to confirm. For an element, hover until the card, table, or form you want is outlined, then click or press `Enter`.
4. In the **Editor**, add an **Arrow** (`A`) at the broken detail. Add a **Step number** (`S`) for each action when the bug needs several clicks to reproduce.
5. Select **Blur** (`B`), choose **Solid** under **Hide area**, and cover access tokens, email addresses, account names, and internal hostnames.
6. Click **Copy**, or press `Ctrl+C` (`⌘C` on macOS), and paste the image into the issue.

In element mode, `↑` selects the parent element and `↓` the child, which helps when the outline lands on a wrapper that is too small or too large. If the element is not fully visible, the picker offers a full-page capture instead.

## Capture hover states, dropdowns, and tooltips

A menu or tooltip often closes when you click elsewhere. Set **Delay** to 3, 5, or 10 seconds in the popup or in **Settings**, start the capture, then open the menu before the toolbar badge finishes its countdown.

The delay runs before a region selection starts, so a drag can still close the menu. For a hover state, use **Visible Area** with a delay and crop afterward with **Crop** (`C`). You can also select the region once, then use **Repeat region** from the right-click menu with a delay: it captures the same rectangle without another drag.

## Skip the editor with the Clipboard action

When a screenshot needs no marks, set **After capture** to **Clipboard** in the popup or in **Settings**. Each capture then goes straight to the clipboard, and the toolbar badge confirms it. Paste the image into the issue with `Ctrl+V` or `⌘V`.

This setting applies to the keyboard shortcuts and the right-click menu too. Set it back to **Editor** when you need to annotate or redact. A clipboard capture skips the redaction step, so check the page for private data before you capture it.

## What to write next to the screenshot

A screenshot shows what went wrong. The issue text gives the context a developer needs to reproduce it:

- the page URL, with private query parameters removed
- the browser name and version, and the operating system
- the steps to reproduce, in the same order as the step numbers in the image
- what you expected and what happened instead
- the time of the problem, if the page shows live data

Keep one problem per screenshot. A second bug in the same image makes it unclear which one the arrow points to.

## Limits

Blur and mosaic soften pixels, but they can leave clues about short text. **Solid** covers the area completely in the export; the [redaction guide](/blog/redact-screenshot/) explains how to check the result. Browser-internal pages and other protected pages block extension capture; see [support and known limitations](/support/).

The [capture mode reference](/docs/#modes) covers selection controls, and the [annotation reference](/docs/#annotate) lists every tool and shortcut. For replies to users who report a problem, see [screenshots for customer support](/use-cases/customer-support/). To show the bug in motion, see [product demo videos](/use-cases/product-demos/).
