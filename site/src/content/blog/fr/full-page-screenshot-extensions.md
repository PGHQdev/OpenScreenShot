---
title: Comparatif des extensions de capture de page entière (2026)
description: OpenScreenShot, GoFullPage, FullPage Capture, Awesome Screenshot, FireShot et Nimbus/FuseBase comparés par prix, code source, autorisations à l’installation, annotation, PDF et enregistrement, plus les outils sans installation intégrés aux navigateurs.
audience: everyday
order: 7
---

Si vous n’avez besoin d’une capture de page entière que de temps en temps, les outils intégrés à Chrome DevTools, Microsoft Edge et Firefox capturent une page entière sans installation. Si vous capturez souvent des pages, les extensions ci-dessous diffèrent sur ce qui est gratuit, l’accès aux sites qu’elles demandent à l’installation, l’enregistrement vidéo et la publication de leur code source. Chaque section indique à qui l’outil convient.

OpenScreenShot est notre produit, et nous indiquons les cas où un autre outil convient mieux. Tous les faits datent du 9 octobre 2026 et proviennent des fiches des stores, des manifestes des extensions et des pages des éditeurs, liés dans chaque section. Cette page compare des fonctionnalités et ne classe pas les outils.

## Les outils en un coup d’œil

| Outil                 | Prix                                             | Open source                         | Accès à tous les sites à l’installation | Annotation gratuite ?                                     | PDF                                                  | Enregistrement                   |
| --------------------- | ------------------------------------------------ | ----------------------------------- | --------------------------------------- | --------------------------------------------------------- | ---------------------------------------------------- | -------------------------------- |
| OpenScreenShot        | Gratuit                                          | Oui, MIT                            | Non                                     | Oui                                                       | Oui                                                  | Onglet seulement, version Chrome |
| GoFullPage            | Gratuit ; Premium 12 $ par an                    | Non                                 | Non                                     | Non, Premium                                              | Oui ; le découpage intelligent des pages est Premium | Non                              |
| FullPage Capture      | Gratuit ; Pro 19 $ par an                        | Non                                 | Oui                                     | Oui                                                       | Oui ; le PDF interrogeable est Pro                   | Non                              |
| Awesome Screenshot    | Offre gratuite ; payant à partir de 5 $ par mois | Pas de code source public           | Oui                                     | Outils de base ; tous les outils dans les offres payantes | Oui                                                  | Bureau, onglet, caméra           |
| FireShot              | Gratuit ; Pro 39,95 $ par an ou 99,95 $ une fois | Non                                 | Non                                     | Texte, flèches, flou selon la fiche                       | Oui, avec liens ; le PDF avancé est Pro              | Non                              |
| FuseBase Pro (Nimbus) | Offre gratuite ; prix Pro non publié             | Non                                 | Oui                                     | Annotation et flou ; répartition non publiée              | Oui                                                  | Écran et webcam                  |
| Chrome DevTools       | Gratuit, intégré                                 | Interface de DevTools, BSD-3-Clause | Aucune installation                     | Aucun éditeur documenté                                   | Non documenté                                        | Non documenté                    |
| Edge Screenshot       | Gratuit, intégré                                 | Non                                 | Aucune installation                     | Annotation au stylet et tactile                           | Non documenté                                        | Non documenté                    |
| Firefox Screenshots   | Gratuit, intégré                                 | Fait partie de Firefox              | Aucune installation                     | Non documenté                                             | Non documenté                                        | Non documenté                    |

« Accès à tous les sites à l’installation » signifie que l’extension demande un accès d’hôte à tous les sites web quand vous l’ajoutez. Chrome affiche cette demande sous la forme « Read and change all your data on all websites » (lire et modifier toutes vos données sur tous les sites web).

## OpenScreenShot

[OpenScreenShot](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp) est gratuit, n’a pas d’offre payante et publie son [code source sur GitHub](https://github.com/pghqdev/OpenScreenShot) sous licence MIT. Il est disponible sur le Chrome Web Store et sur [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/openscreenshot/). Un clic sur l’icône de la barre d’outils lance une capture de page entière ; les modes zone visible, zone sélectionnée et élément sont dans le menu du clic droit et les raccourcis clavier. Consultez les [modes de capture](/fr/docs/#modes).

L’éditeur propose des formes, des flèches, du texte, des numéros d’étape, un flou avec aplat opaque, un spotlight, le recadrage et la coupe. L’export se fait en PNG, JPEG, WebP ou PDF sur une seule page, ajusté à A4 ou Letter, ou réparti sur plusieurs pages. Il ne demande aucun accès d’hôte à l’installation. La version Chrome peut [enregistrer un onglet](/fr/docs/#record) en MP4 ou WebM ; Chrome demande l’autorisation de capture d’onglet au premier enregistrement. La version Firefox ne fait que des captures d’écran.

Là où il convient moins bien :

- Il capture des pages web dans un onglet du navigateur. Il ne peut pas capturer votre bureau ni d’autres applications, et il n’enregistre qu’un onglet.
- Il n’a ni stockage cloud ni liens de partage. Vous partagez vous-même le fichier exporté.
- Son PDF contient la capture sous forme d’image, donc le texte n’est pas interrogeable.
- Les pages du navigateur comme les paramètres `chrome://` et les stores du navigateur ne peuvent pas être capturées.

## GoFullPage

[GoFullPage](https://gofullpage.com/) capture une page en un clic et exporte en PNG, JPEG ou PDF. Sa [FAQ](https://gofullpage.com/faq) indique que la version gratuite n’a pas de limite de captures ni d’export en image et en PDF. [Premium](https://gofullpage.com/premium) coûte 12 $ par an après un essai de 7 jours et ajoute le recadrage, les annotations (flou, texte, surlignage), l’URL et l’horodatage, et le découpage intelligent des pages PDF.

Le code est fermé. La FAQ indique que le développeur a créé un fork privé du projet MIT d’origine en 2018. GoFullPage a été retiré du Chrome Web Store en août 2026 pour ce que son [blog](https://blog.gofullpage.com/2026/08/11/gofullpage-chrome-update/) appelle « a copyright-related issue » (un problème lié au droit d’auteur), et la fiche principale est revenue le 10 septembre 2026. Une [version Firefox](https://addons.mozilla.org/en-US/firefox/addon/gofullpage-screenshot/) officielle est arrivée le 7 septembre 2026. Il ne demande aucun accès d’hôte à l’installation.

GoFullPage convient à ceux qui veulent une capture en un clic et l’export PDF sans annotation, ou qui acceptent de payer pour l’annotation. Consultez les [alternatives à GoFullPage](/fr/alternatives/gofullpage/).

## FullPage Capture

[FullPage Capture](https://fullpagecapture.net/) indique que la capture, l’enregistrement, la copie et l’impression sont gratuits, sans filigrane ni limite d’utilisation. Sa [fiche Chrome](https://chromewebstore.google.com/detail/ggacghlcchiiejclfdajbpkbjfgjhfol) décrit un éditeur gratuit avec flèches, formes, texte, surligneur, badges numérotés et flou, plus un PDF avec liens cliquables. Pro coûte 19 $ par an après un essai de 7 jours et ajoute le PDF interrogeable, un mode preuve, la capture par lots et le téléversement vers le cloud.

Le code est fermé, et nous n’avons trouvé qu’une fiche Chrome. Son manifeste exige l’accès à tous les sites web, donc Chrome affiche l’avertissement « tous les sites » à l’installation. Il convient à ceux qui ont besoin de PDF interrogeables ou de capture par lots et qui acceptent cette autorisation. Consultez les [alternatives à FullPage Capture](/fr/alternatives/fullpage-capture/).

## Awesome Screenshot

[Awesome Screenshot](https://chromewebstore.google.com/detail/nlipoenfbbikpbjkfpfillcgkoblgpmj), de Diigo, associe les captures d’écran à un enregistreur pour le bureau, un onglet ou une caméra. Sa [page de tarifs](https://www.awesomescreenshot.com/pricing) mentionne une offre gratuite avec jusqu’à 100 captures, une annotation de base et des enregistrements en 720p. Basic coûte 5 $ par mois facturés annuellement, et Professional 6 $ par mois facturés annuellement, avec un enregistrement jusqu’en 4K. Il propose un stockage cloud avec liens de partage, et l’enregistrement en local.

Il demande l’accès à tous les sites web à l’installation, et sa section de confidentialité sur Chrome déclare la collecte de « Website content » (contenu des sites web). Sa [fiche Firefox](https://addons.mozilla.org/en-US/firefox/addon/screenshot-capture-annotate/) mentionne la Mozilla Public License 2.0, mais nous n’avons trouvé aucun dépôt de code source public. Il convient aux équipes qui veulent des liens de partage et un enregistreur d’écran dans un seul outil. Consultez les [alternatives à Awesome Screenshot](/fr/alternatives/awesome-screenshot/).

## FireShot

[FireShot](https://getfireshot.com/) enregistre une page entière en PDF avec liens, en PNG ou en JPEG. FireShot Pro coûte 39,95 $ par an ou 99,95 $ une fois pour deux appareils, selon sa [page d’achat](https://getfireshot.com/buy.php). Pro ajoute l’export PDF avancé, un éditeur avec annotations intelligentes sous Windows, l’historique des captures et la capture par lots. Nous n’avons pas vérifié quels outils de modification la version gratuite pour Chrome inclut.

Le code est fermé. FireShot ne demande aucun accès d’hôte à l’installation, mais il demande la messagerie native, que Chrome affiche dans un avertissement distinct. Son [module Firefox](https://addons.mozilla.org/en-US/firefox/addon/fireshot/) a été mis à jour pour la dernière fois le 5 juin 2023. FireShot convient aux utilisateurs de Windows qui veulent la capture par lots ou une licence unique. Consultez les [alternatives à FireShot](/fr/alternatives/fireshot/).

## Nimbus et FuseBase Pro

La fiche Chrome d’origine de Nimbus Screenshot affiche désormais « This item is not available » (cet élément n’est pas disponible), et la page de capture de Nimbus redirige vers [FuseBase](https://thefusebase.com/screenshot/). Nimbus Web publie désormais [FuseBase Pro](https://chromewebstore.google.com/detail/fddbloohgcjopkmnjdeodjcfbgiimpcn) pour les captures d’écran, l’enregistrement de l’écran et de la webcam, l’annotation, le flou et l’enregistrement en PDF. Il téléverse vers FuseBase, Google Drive, Dropbox et Slack.

L’offre gratuite enregistre jusqu’à 5 minutes et Pro jusqu’à 10 heures. La [page de tarifs de FuseBase](https://thefusebase.com/pricing/) présente les offres de la plateforme et n’indique aucun prix pour l’extension. FuseBase Pro demande l’accès à tous les sites web à l’installation. Il convient à ceux qui travaillent déjà dans FuseBase. Consultez les [alternatives à Nimbus](/fr/alternatives/nimbus/).

## Sans installation : les outils intégrés au navigateur

### Chrome DevTools

Ouvrez DevTools, appuyez sur Ctrl+Shift+P (Cmd+Shift+P sur macOS), tapez « screenshot » et choisissez **Capture full size screenshot** (capturer une capture d’écran en taille réelle). Chrome enregistre un PNG. La documentation ne décrit aucun éditeur ; la [documentation du Command Menu](https://developer.chrome.com/docs/devtools/command-menu) liste les autres commandes de capture. Consultez [le guide Chrome](/fr/full-page-screenshot/chrome/).

### Microsoft Edge Screenshot

Edge a renommé Web Capture en Screenshot, et Ctrl+Shift+S l’ouvre, selon la [page de stratégie](https://learn.microsoft.com/en-us/deployedge/microsoft-edge-policies/webcaptureenabled) de Microsoft. Il capture une page entière ou une zone, et vous pouvez l’annoter au stylet ou au toucher. Consultez [le guide Edge](/fr/full-page-screenshot/edge/).

### Firefox Screenshots

Faites un clic droit sur une page, choisissez **Take Screenshot** (effectuer une capture d’écran), puis **Save full page** (enregistrer la page complète), selon le [guide de Mozilla](https://blog.mozilla.org/en/firefox/how-to-capture-screenshots-with-firefox/). Vous copiez ou téléchargez le résultat. Le téléversement vers un serveur de Mozilla a pris fin avec Firefox 67 en mai 2019. Consultez [le guide Firefox](/fr/full-page-screenshot/firefox/).

Pour Safari, Brave, Opera, Vivaldi et Arc, consultez les [guides par navigateur](/fr/full-page-screenshot/).

## Lequel choisir

- **Une page, aujourd’hui, sans installation :** l’outil intégré à votre navigateur.
- **Annotation et PDF gratuits, pas d’accès à tous les sites à l’installation, code source lisible :** OpenScreenShot.
- **Capture en un clic sans annotation :** la version gratuite de GoFullPage.
- **PDF interrogeable ou capture par lots :** FullPage Capture Pro ou FireShot Pro.
- **Liens de partage et enregistrement du bureau pour une équipe :** Awesome Screenshot ou FuseBase Pro.
- **Captures d’applications de bureau :** un outil de bureau ; consultez les [outils de capture open source pour chaque plateforme](/fr/blog/open-source-screenshot-tools/).
- **Captures depuis un script ou en CI :** consultez les [outils de capture de sites web pour les développeurs](/fr/blog/website-screenshot-tools-for-developers/).

Tous ces outils peuvent avoir du mal avec les flux infinis et les images à chargement différé ; le [guide de capture de page entière dans Chrome](/fr/blog/full-page-screenshot-chrome/) explique comment vérifier une capture. Pour comparer côte à côte OpenScreenShot, GoFullPage et FullPage Capture, consultez la [page de comparaison](/fr/compare/).
