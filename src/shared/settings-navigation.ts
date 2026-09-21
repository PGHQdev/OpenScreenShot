import { IS_FIREFOX } from './browser';

/** Firefox's native manager was added after our minimum supported version. */
export async function openShortcutSettings(): Promise<void> {
  const commands = chrome.commands as typeof chrome.commands & {
    openShortcutSettings?: () => Promise<void>;
  };
  if (IS_FIREFOX && commands.openShortcutSettings) {
    try {
      await commands.openShortcutSettings();
      return;
    } catch {
      // Older/restricted Firefox installations still get actionable instructions.
    }
  }
  await chrome.tabs.create({
    url: IS_FIREFOX
      ? 'https://support.mozilla.org/kb/manage-extension-shortcuts-firefox'
      : 'chrome://extensions/shortcuts',
  });
}
