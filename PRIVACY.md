# Privacy Policy for OpenScreenShot

The canonical, always-reachable copy is published at
**<https://openscreenshot.app/privacy/>**. That URL is the one given to the Chrome
Web Store, because it does not depend on GitHub being up.

**Last updated:** August 2026

## Data collection

OpenScreenShot does **not** collect, store, transmit, or share any personal data, usage data, or any other information from its users.

## How it works

All processing — including page capture, image compositing, annotation editing, and export — happens **entirely locally** in your browser. No data ever leaves your device.

The extension requires the following permissions, each with a narrow purpose:

| Permission                       | Why it's needed                                                                                                                                                                                                                          |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `activeTab`                      | Capture the tab you are looking at, when you click the toolbar button, press a keyboard shortcut, or pick a capture from the right-click menu. Access is granted for that one tab, for that one capture.                                 |
| `scripting`                      | Inject small, self-contained functions into the captured tab: measure the page height and scroll it during a full-page capture, draw the drag-to-select overlay for a region capture, and write an image to the clipboard in quick mode. |
| `storage` (+ `unlimitedStorage`) | Keep your settings on the device, hold the capture the editor page loads, remember the last region rectangle, and save an in-progress editing draft so a closed or crashed tab does not lose your annotations.                           |
| `downloads`                      | Save an export from the editor, or a quick-mode capture, to your downloads folder. The extension never reads, searches, or opens your download history.                                                                                  |
| `contextMenus`                   | Add one OpenScreenShot submenu to the page right-click menu, as a second way to start a capture. The extension reads only which menu item you clicked.                                                                                   |
| `clipboardWrite`                 | Copy a screenshot to your clipboard, from the editor's Copy button or from quick mode. The extension only ever writes the screenshot you just captured or exported. It never reads what is already on your clipboard.                    |

`host_permissions` is empty, so the extension has no standing access to any site you visit.

## Third-party services

OpenScreenShot does not use any third-party analytics, advertising, or data-processing services. PDF export is handled by a small writer built into the extension (`src/editor/pdf-writer.ts`), so exporting a PDF makes no network request either.

## Changes to this policy

If this policy ever changes, the updated version will be published at <https://openscreenshot.app/privacy/> with a new "Last updated" date.

## Contact

For questions about this privacy policy, open an issue on the [GitHub repository](https://github.com/pghqdev/OpenScreenShot/issues).
