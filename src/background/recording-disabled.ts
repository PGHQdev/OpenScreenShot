/** Screenshot-only Firefox build: never load recording listeners or APIs. */
export async function restoreRecBadge(): Promise<void> {
  await chrome.action.setBadgeText({ text: '' });
}
