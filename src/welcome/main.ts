/**
 * Fill the welcome hero from the message catalog. The article below the hero
 * stays English on purpose — it is a capture playground, not UI chrome.
 */
function t(id: string): string {
  return chrome.i18n.getMessage(id) || id;
}

for (const [id, key] of [
  ['headline', 'welcomeHeadline'],
  ['body', 'welcomeBody'],
  ['primary', 'welcomePrimary'],
  ['secondary', 'welcomeSecondary'],
] as const) {
  const node = document.getElementById(id);
  if (node) node.textContent = t(key);
}
document.title = `${t('welcomeTitle')} — OpenScreenShot`;
