/**
 * The editor's one i18n helper — every user-visible string in src/editor/
 * reads through this, same shape as the popup/recorder/setup pages'
 * per-file `t()`. One copy here, imported everywhere in the editor, instead
 * of redefining it per file.
 */
export function t(id: string, subs?: string | string[]): string {
  // `getMessage` answers '' — never null — for an id no catalog has, so `??`
  // would hand back a blank label rather than the id. Chrome already falls
  // back to `en` per key, which leaves the id visible only for a typo.
  return chrome.i18n.getMessage(id, subs) || id;
}
