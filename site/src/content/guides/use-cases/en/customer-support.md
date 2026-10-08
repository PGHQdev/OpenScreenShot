---
title: How to use screenshots to answer support tickets
description: Copy a screenshot straight into a ticket reply, number the steps, hide customer data, and mark up an image a customer sent you.
order: 7
---

To answer a support ticket with a screenshot, capture the screen the customer needs to see, number the steps they must take, hide any customer data, and paste the image into your reply. In OpenScreenShot, the **Clipboard** action copies a capture without opening the editor, and **Step number** badges show the order of the clicks. To mark up a screenshot a customer sent you, paste or drop it into the **Editor**.

## Reply with an annotated screenshot step by step

1. Open the screen in your product that answers the question, for example a settings page.
2. Right-click the page, open the **OpenScreenShot** submenu, and choose **Selected Region** or **Capture element**. Keep enough of the interface for the customer to find the same place.
3. In the **Editor**, add a **Step number** (`S`) on each control in the order the customer clicks it.
4. Select **Blur** (`B`), choose **Solid** under **Hide area**, and cover names, email addresses, order numbers, and account IDs.
5. Click **Copy**, or press `Ctrl+C` (`⌘C` on macOS).
6. Paste the image into the ticket reply, and write the same steps as a numbered list under it.

The written steps help customers who use a screen reader or who read the reply in an email client that blocks images.

## Copy without the editor

For a quick answer that needs no marks, set **After capture** to **Clipboard** in the popup or in **Settings**. Each capture then goes straight to the clipboard, and the toolbar badge confirms it. Paste it into the reply with `Ctrl+V` or `⌘V`.

The setting applies to the popup buttons, the keyboard shortcuts, and the right-click menu. Switch back to **Editor** when the screenshot shows customer data that you must hide first. **Reopen last** in the popup footer opens the most recent capture in the editor at any time.

## Number the steps

**Step number** badges count up on their own: the first click places 1, the next places 2. When you delete a badge, the remaining badges renumber. Keep the numbers in the image the same as the numbers in your written reply.

Add an **Arrow** (`A`) when a control is small or hard to find, and a short **Text** (`T`) note when a step needs a value, such as the option to select. **Spotlight** (`O`) dims the rest of the screen when the page is busy.

## Hide customer data

Your own admin views often show other customers’ data: names in a list, email addresses, payment details, and internal notes. Check the whole image, including the edges, before you send it.

A soft blur or a mosaic can leave clues about short text. **Solid** covers the area completely in the export. Cover each item with a small margin around the visible characters. The [redaction guide](/blog/redact-screenshot/) explains how to check the result.

## Mark up a screenshot a customer sent

Customers often send a screenshot of the problem. To point at the detail they missed:

1. Copy the customer’s image, or save it to your computer.
2. Open an editor tab. If none is open, capture any page with **Visible Area**; the import replaces that capture.
3. Press `Ctrl+V` or `⌘V` outside a text field to paste the image, or drop the image file onto the editor.
4. Add arrows, step numbers, or text, and hide anything the customer did not mean to share.
5. Click **Copy** and paste the marked-up image into your reply.

The top bar reads **Imported**, and every tool, the frame, and every export format work on the image. An import replaces the canvas, so the editor asks first when the current image has annotations.

## Limits

The extension captures the page content only. The image shows no address bar, so put the URL in your reply when the customer needs to open a specific page. Browser-internal pages and other protected pages block capture; see [support and known limitations](/support/).

Captures and edits stay on your computer. The help desk tool you paste the image into stores it under its own rules. The [annotation reference](/docs/#annotate) lists every tool. For screenshots that go to your development team, see [screenshots for bug reports](/use-cases/bug-reports/).
