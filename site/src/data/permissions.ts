/**
 * Every permission the extension declares, and why. One list, rendered by the
 * homepage privacy section and by the Privacy Policy page, so the two can never
 * describe the same permission differently.
 *
 * It mirrors `manifest.json`. A permission added there is added here.
 */
export type Permission = {
  name: string;
  why: string;
  /** Set only on the optional permissions, which name when Chrome asks. */
  when?: string;
};

/** Declared at install. `host_permissions` is empty, so none of these is a host. */
export const installPermissions: Permission[] = [
  {
    name: 'activeTab',
    why: 'Capture the tab you are looking at, when you click the toolbar button, press a keyboard shortcut, or pick a capture from the right-click menu. Access is granted for that one tab, for that one capture.',
  },
  {
    name: 'scripting',
    why: 'Inject small, self-contained functions into the captured tab: measure the page height and scroll it during a full-page capture, draw the drag-to-select overlay for a region capture, and write an image to the clipboard in quick mode. Every script ships inside the package. No remote code is loaded.',
  },
  {
    name: 'storage and unlimitedStorage',
    why: 'Keep your settings on the device, hold the capture the editor page loads, remember the last region rectangle so it can be repeated, and save an in-progress editing draft so a closed or crashed tab does not lose your annotations. A full-page screenshot can exceed the default storage quota, which is what unlimitedStorage raises.',
  },
  {
    name: 'downloads',
    why: 'Save an export from the editor, or a quick-mode capture, to your downloads folder. The extension never reads, searches, or opens your download history.',
  },
  {
    name: 'contextMenus',
    why: 'Add one OpenScreenShot submenu to the page right-click menu, as a second way to start a capture. The extension reads only which menu item you clicked.',
  },
  {
    name: 'clipboardWrite',
    why: 'Copy a screenshot to your clipboard, from the editor’s Copy button or from quick mode. The extension only ever writes the screenshot you just captured or exported. It never reads what is already on your clipboard.',
  },
  {
    name: 'offscreen',
    why: 'Run the screen-recording engine in a hidden document. MediaRecorder capture and the crash-safe IndexedDB chunk writes need a page context a service worker does not have. Always present; it adds no install-time warning.',
  },
];

/** Optional, and asked for only when you use the recorder. */
export const recordingPermissions: Permission[] = [
  {
    name: 'tabCapture',
    why: 'Captures the current tab’s video, and its audio if you enable the tab-audio track, for recording.',
    when: 'Once, the first time you click Record — a single Chrome permission prompt.',
  },
  {
    name: '<all_urls>',
    why: 'The optional host permission. It keeps the in-page cursor overlay and control bar alive when a recording’s tab navigates to a different origin.',
    when: 'Only if you turn on “Record across sites” in settings.',
  },
];
