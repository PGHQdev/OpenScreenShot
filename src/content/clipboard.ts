/**
 * Page-context clipboard write, injected via `chrome.scripting.executeScript`.
 *
 * Same contract as `src/content/scroll-capture.ts`: the function is serialized
 * with `toString()` and loses its closure, so every helper it needs is nested
 * inside it. A service worker has no `navigator.clipboard`, which is why the
 * write happens in the page at all.
 */

/**
 * Copy a PNG data URL to the clipboard. Returns false rather than throwing, so
 * the caller can report a single "could not copy" message for every cause.
 *
 * The focus wait exists because `navigator.clipboard.write` rejects while the
 * page is unfocused, and right after a popup click the popup still holds focus.
 */
export async function copyImageToClipboard(dataUrl: string): Promise<boolean> {
  const waitForFocus = async (): Promise<void> => {
    for (let i = 0; i < 20 && !document.hasFocus(); i++) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  };
  try {
    await waitForFocus();
    const blob = await (await fetch(dataUrl)).blob();
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
    return true;
  } catch {
    return false;
  }
}
