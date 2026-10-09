---
title: Outils de capture d’écran open source pour chaque plateforme
description: Des outils de capture open source classés selon leur plateforme, d’OpenScreenShot et Screenity dans le navigateur à ShareX sur Windows, Flameshot sur Linux, macOS et Windows, Firefox Screenshots, et shot-scraper, Playwright et Puppeteer pour les scripts.
audience: everyday
order: 8
---

Choisissez un outil de capture open source selon l’endroit où se trouve ce que vous capturez. Pour tout ce qui s’affiche sur un écran Windows, utilisez ShareX. Pour les bureaux Linux, macOS ou Windows, utilisez Flameshot. Pour les pages web, utilisez un outil de navigateur comme OpenScreenShot ou l’outil Screenshots intégré à Firefox, et pour les captures depuis un script, utilisez shot-scraper, Playwright ou Puppeteer.

OpenScreenShot est notre produit. Cette page indique où il ne convient pas, et elle ne classe pas les outils. Tous les faits datent du 9 octobre 2026 et proviennent du dépôt, de la fiche de store ou du site officiel de chaque projet, liés ci-dessous.

## Quel outil couvre quelle plateforme

| Outil               | Fonctionne sur                                                   | Capture                                                                                         | Licence                | Page entière      | Vidéo                                             |
| ------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ---------------------- | ----------------- | ------------------------------------------------- |
| OpenScreenShot      | Chrome, Firefox                                                  | Pages web dans un onglet                                                                        | MIT                    | Oui               | Enregistrement d’onglet, version Chrome seulement |
| Screenity           | Chrome et navigateurs Chromium qui utilisent le Chrome Web Store | Enregistrements d’un onglet, d’une zone, du bureau, d’une fenêtre d’application ou de la caméra | GPL-3.0                | Non documenté     | Oui                                               |
| ShareX              | Windows                                                          | Tout ce qui est à l’écran                                                                       | GPL-3.0                | Capture défilante | Vidéo et GIF                                      |
| Flameshot           | Linux, macOS, Windows                                            | Une zone de l’écran                                                                             | GPL-3.0                | Non               | Non documenté                                     |
| Firefox Screenshots | Firefox pour ordinateur                                          | Pages web                                                                                       | Fait partie de Firefox | Oui               | Non documenté                                     |
| shot-scraper        | Python 3.10 ou plus récent                                       | Pages web, depuis une commande                                                                  | Apache-2.0             | Oui, par défaut   | Oui, depuis un fichier de script                  |
| Playwright          | Node.js, Python, Java, .NET                                      | Pages web, depuis du code                                                                       | Apache-2.0             | Oui               | Oui                                               |
| Puppeteer           | Node.js                                                          | Pages web, depuis du code                                                                       | Apache-2.0             | Oui               | Oui, Chrome                                       |

Aucun de ces outils ne fonctionne sur Android ou iOS. Une extension de navigateur ne voit que la page web de son onglet. Une application de bureau voit tout l’écran mais ne sait pas où se termine une page web.

## Dans le navigateur : OpenScreenShot

[OpenScreenShot](https://github.com/pghqdev/OpenScreenShot) est une extension sous licence MIT pour [Chrome](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp) et [Firefox](https://addons.mozilla.org/firefox/addon/openscreenshot/). Elle capture une page entière, la zone visible, une zone sélectionnée ou un élément. Elle ouvre ensuite un éditeur avec flèches, formes, texte, numéros d’étape, flou et recadrage, et exporte en PNG, JPEG, WebP ou PDF. La capture et la modification s’exécutent dans votre navigateur, et l’extension ne téléverse ni vos captures ni vos enregistrements. La [documentation](/fr/docs/) décrit chaque mode.

La version Chrome [enregistre aussi un onglet](/fr/docs/#record) avec, en option, le micro, l’audio de l’onglet et la webcam, et exporte en MP4 ou WebM. La version Firefox ne fait que des captures d’écran.

OpenScreenShot n’est pas le bon outil quand ce dont vous avez besoin se trouve hors d’un onglet du navigateur. Il ne peut capturer ni le bureau, ni une autre application, ni une page de paramètres du navigateur, et il n’enregistre pas l’écran entier.

## Enregistrement dans le navigateur : Screenity

[Screenity](https://github.com/alyssaxuu/screenity) est une extension d’enregistrement d’écran et d’annotation pour Chrome. Elle enregistre un onglet, une zone, le bureau, n’importe quelle fenêtre d’application ou la caméra, avec le micro et l’audio interne. Elle exporte en MP4, GIF ou WebM, ou enregistre sur Google Drive. Vous pouvez dessiner, ajouter du texte, des flèches et des formes, et flouter le contenu sensible d’une page.

La licence est [GPL-3.0](https://github.com/alyssaxuu/screenity/blob/master/LICENSE). Le README indique que la licence est passée à GPLv3 pour la version Manifest V3, à partir de la version 3.0.0. L’extension est gratuite et ne demande aucune connexion pour les enregistrements locaux. [Screenity Pro](https://screenity.io/pro) coûte 10 $ par mois ou 120 $ par an après un essai de 7 jours et ajoute un éditeur, le partage par lien et l’hébergement cloud sur des serveurs dans l’UE, avec un compte. Le README indique que certaines parties du code se connectent à Screenity Pro, et qu’elles ne sont actives que dans la version du Chrome Web Store.

Screenity demande l’accès à tous les sites web à l’installation. Sa documentation ne décrit pas de capture de page entière. Choisissez-la plutôt qu’OpenScreenShot quand vous devez enregistrer le bureau ou une autre application ; consultez les [alternatives à Screenity](/fr/alternatives/screenity/).

## Windows : ShareX

[ShareX](https://getsharex.com/) est une application Windows gratuite et sans publicité, sous licence [GPL-3.0](https://github.com/ShareX/ShareX). Elle capture l’écran, une fenêtre ou une zone, et sa [capture défilante](https://getsharex.com/docs/scrolling-screenshot) compare les captures successives et ajoute les sections modifiées, pour qu’une seule image contienne du contenu qui défile au-delà de l’écran. Elle enregistre aussi des vidéos et des GIF, et son README mentionne l’OCR et la lecture de codes QR.

L’éditeur d’images propose des formes, des flèches, du texte, des bulles, le flou, la pixellisation, le surlignage et le spotlight. ShareX peut téléverser vers de nombreux services, et les tâches après capture peuvent téléverser automatiquement si vous les configurez. Vérifiez ces réglages avant de capturer du contenu privé. Vous pouvez l’obtenir sous forme d’installateur, de version portable, ou depuis le Microsoft Store ou Steam. La dernière version, v21.0.0, est sortie le 3 juillet 2026.

ShareX ne fonctionne pas sur macOS ni sur Linux.

## Linux, macOS et Windows : Flameshot

[Flameshot](https://flameshot.org/) est un outil de capture gratuit pour Linux, macOS et Windows, sous licence [GPL-3.0](https://github.com/flameshot-org/flameshot). Vous sélectionnez une zone et l’annotez sur place avec des flèches, du surlignage, du flou ou de la pixellisation, du texte, des traits à main levée, des cadres et des numéros de compteur. Il dispose aussi d’une interface en ligne de commande. Son README mentionne un téléversement facultatif vers Imgur, que la touche Entrée déclenche : apprenez donc cette touche avant de capturer du contenu privé.

La [version 14.0.0](https://github.com/flameshot-org/flameshot/releases/tag/v14.0.0) (juin 2026) demande quel écran capturer et utilise xdg-desktop-portal comme principal moyen de capture sous Linux. Le README qualifie d’expérimentale la prise en charge de Wayland sous GNOME et Plasma.

Flameshot n’a pas de capture défilante. La [demande de fonctionnalité](https://github.com/flameshot-org/flameshot/issues/1130) est toujours ouverte. Nous n’avons trouvé aucune fonction d’enregistrement dans sa documentation. Pour une page web entière sous Linux, associez Flameshot à un outil de navigateur.

## Intégré : Firefox Screenshots

Firefox est open source, et son outil Screenshots ne demande aucune installation. Faites un clic droit sur une page, choisissez **Take Screenshot** (effectuer une capture d’écran), puis choisissez une zone, la zone visible ou **Save full page** (enregistrer la page complète), selon le [guide de Mozilla](https://blog.mozilla.org/en/firefox/how-to-capture-screenshots-with-firefox/). Vous copiez ou téléchargez le résultat. Mozilla a [mis fin au téléversement](https://blog.mozilla.org/futurereleases/2019/01/24/clarifying-the-future-of-firefox-screenshots/) vers son serveur Screenshots avec Firefox 67 (mai 2019), donc les captures restent en local.

En ligne de commande, la console des DevTools de Firefox accepte `:screenshot --fullpage`, qui enregistre un PNG dans Téléchargements, selon la [documentation des DevTools](https://firefox-source-docs.mozilla.org/devtools-user/taking_screenshots/index.html). L’interface des DevTools de Chrome est aussi open source, sous licence [BSD-3-Clause](https://github.com/ChromeDevTools/devtools-frontend), et sa commande **Capture full size screenshot** (capturer une capture d’écran en taille réelle) enregistre un PNG. Les [guides de capture de page entière](/fr/full-page-screenshot/) couvrent chaque navigateur.

## Depuis un script : shot-scraper, Playwright, Puppeteer

Ces outils capturent des pages web depuis une commande ou du code, pour les tâches répétées et la CI. Ils chargent la page dans leur propre navigateur, donc ils ne voient pas vos onglets connectés.

- [shot-scraper](https://github.com/simonw/shot-scraper) est un outil Python en ligne de commande basé sur Playwright. Il prend des captures de page entière par défaut et enregistre aussi des PDF et des vidéos depuis un script YAML.
- [Playwright](https://github.com/microsoft/playwright) est le framework d’automatisation de navigateur et de test de Microsoft pour Chromium, Firefox et WebKit, avec des API de capture, de PDF et de vidéo.
- [Puppeteer](https://github.com/puppeteer/puppeteer) est la bibliothèque Node.js de Google pour Chrome et Firefox, avec des API de capture, de PDF et d’enregistrement MP4.

Notre propre paquet `openscreenshot`, sous licence MIT, ajoute un outil en ligne de commande et un serveur MCP pour les agents IA. Le [comparatif pour les développeurs](/fr/blog/website-screenshot-tools-for-developers/) présente tous ces outils avec leurs commandes.

## Lequel choisir

- **Tout ce qui s’affiche sur un écran Windows, avec capture défilante :** ShareX.
- **Une zone de l’écran sous Linux ou macOS :** Flameshot.
- **Une page web entière avec annotation et export PDF :** OpenScreenShot, ou Firefox Screenshots pour une capture rapide sans installation.
- **Un enregistrement du bureau ou d’une autre application :** Screenity, ou ShareX sous Windows.
- **Des captures depuis un script ou en CI :** shot-scraper, Playwright ou Puppeteer.

Si l’outil n’a pas besoin d’être open source, le [comparatif des extensions de capture de page entière](/fr/blog/full-page-screenshot-extensions/) ajoute GoFullPage, FireShot et d’autres. La [page de comparaison](/fr/compare/) met OpenScreenShot, GoFullPage et FullPage Capture côte à côte.
