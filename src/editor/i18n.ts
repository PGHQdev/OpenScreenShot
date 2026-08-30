/**
 * The editor's one i18n helper — every user-visible string in src/editor/
 * reads through this, same shape as the popup/recorder/setup pages'
 * per-file `t()`. One copy here, imported everywhere in the editor, instead
 * of redefining it per file.
 */
export function t(id: string, subs?: string | string[]): string {
  return chrome.i18n.getMessage(id, subs) ?? id;
}
