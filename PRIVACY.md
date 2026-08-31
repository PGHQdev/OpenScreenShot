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
| `offscreen`                      | Run the screen-recording engine in a hidden document. `MediaRecorder` capture and the crash-safe IndexedDB chunk writes need a page context a service worker does not have. Always present; it adds no install-time warning.             |

`host_permissions` is empty, so the extension has no standing access to any site you visit.

## Screen recording

Recordings, cursor logs, and microphone or webcam streams are handled the same way as
screenshots: **entirely on your device**. Video chunks, the cursor log, and any audio are
written to IndexedDB as you record and stay there until you delete the session; nothing is
ever uploaded. Recording uses two further permissions, both optional and requested only
when you use the recorder:

| Permission                              | Why it's needed                                                                                                | When it's requested                                                        |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `tabCapture`                            | Captures the current tab's video, and its audio if you enable the tab-audio track, for recording.              | Once, the first time you click Record — a single Chrome permission prompt. |
| `<all_urls>` (optional host permission) | Keeps the in-page cursor overlay and control bar alive when a recording's tab navigates to a different origin. | Only if you turn on "Record across sites" in settings.                     |

The microphone and camera, when you enable them, are opened directly by your browser's own
permission prompt — the extension never sees a stream until you grant it, and the stream
never leaves your device.

## Uninstall

If you uninstall the extension, your browser opens a feedback page at
<https://openscreenshot.app/uninstall>. The page's address carries only the extension
version and your UI language. We do not receive your browsing history, any page you
visited, or any capture — the extension has none of that to send. The page itself sets no
cookies and runs no analytics; nothing is sent unless you type feedback and press Send.

## Third-party services

OpenScreenShot does not use any third-party analytics, advertising, or data-processing services. PDF export is handled by a small writer built into the extension (`src/editor/pdf-writer.ts`), so exporting a PDF makes no network request either.

## Changes to this policy

If this policy ever changes, the updated version will be published at <https://openscreenshot.app/privacy/> with a new "Last updated" date.

## Contact

For questions about this privacy policy, open an issue on the [GitHub repository](https://github.com/pghqdev/OpenScreenShot/issues).
