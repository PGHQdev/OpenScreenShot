import { IS_FIREFOX } from './browser';
import { toDownloadPath } from './utils';

/** Firefox rejects data: downloads; its background page can own a blob URL. */
export async function downloadDataUrl(dataUrl: string, name: string): Promise<void> {
  const filename = toDownloadPath(name);
  if (!IS_FIREFOX) {
    await chrome.downloads.download({ url: dataUrl, filename, saveAs: false });
    return;
  }
  const blob = await (await fetch(dataUrl)).blob();
  const url = URL.createObjectURL(blob);
  try {
    await chrome.downloads.download({ url, filename, saveAs: false });
  } finally {
    // Match PDF export: let the browser begin reading before releasing the URL.
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }
}
