---
title: 'Alternative à FireShot : un éditeur gratuit dans le navigateur, en open source'
description: FireShot vs OpenScreenShot. Les deux capturent des pages entières en local. OpenScreenShot est open source, avec éditeur gratuit et enregistrement d’onglet.
order: 4
---

Passez à OpenScreenShot si vous voulez annoter et flouter gratuitement des captures pleine page dans le navigateur, sur tout système d’exploitation qui exécute Chrome ou Firefox, avec un code que vous pouvez lire. Restez sur FireShot si vous avez besoin de PDF avec des liens fonctionnels, de captures par lot ou automatisées, ou des extras de FireShot Pro, comme l’export PDF avancé et un historique des captures. OpenScreenShot enregistre un PDF sous forme d’image : son texte n’est pas cherchable et ses liens ne fonctionnent pas. Il capture uniquement les pages web et ne capture ni les fenêtres du bureau ni l’écran entier.

OpenScreenShot est notre produit. Les informations sur FireShot de cette page datent du 9 octobre 2026 et proviennent de sa [fiche sur le Chrome Web Store](https://chromewebstore.google.com/detail/mcbpblocgmgfnpjjppndjkmgjaogfceg), de son [site web](https://getfireshot.com/), de sa [page d’achat](https://getfireshot.com/buy.php), de sa [page de module Firefox](https://addons.mozilla.org/en-US/firefox/addon/fireshot/) et du manifeste de la version 2.1.4.18 obtenu depuis le serveur de mise à jour de Google.

## FireShot et OpenScreenShot côte à côte

|                                  | FireShot                                                                                                      | OpenScreenShot                                                                   |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Prix                             | Gratuit (Lite) ; Pro coûte 39,95 $ par an ou 99,95 $ une seule fois pour une licence à vie sur deux appareils | Gratuit, sans offre payante                                                      |
| Open source                      | Non (licence propriétaire)                                                                                    | Oui, MIT                                                                         |
| Accès aux sites à l’installation | Aucun dans Chrome ; l’accès à tous les sites est facultatif. `nativeMessaging` est requis                     | Aucun. Accès à l’onglet actif quand vous lancez une capture                      |
| Capture pleine page              | Oui                                                                                                           | Oui                                                                              |
| Annotation et flou               | La fiche mentionne texte, flèches et flou ; Pro indique « Editor & smart annotations (on Windows) »           | Gratuit, dans le navigateur                                                      |
| Export PDF                       | Oui, avec liens ; le PDF avancé est réservé à Pro                                                             | Oui, sous forme d’image : une page, ou des pages A4 ou Letter qui se chevauchent |
| Enregistrement d’onglet          | Non                                                                                                           | Oui, dans Chrome (la version Firefox prend seulement des captures d’écran)       |
| Compte ou cloud                  | Capture locale ; envois en ligne et partage facultatifs                                                       | Aucun compte, aucun envoi en ligne                                               |

## Ce que vous gardez

Les captures restent locales dans les deux outils. Le site de FireShot indique « 100% local captures keep your work private and offline-safe. » (des captures 100 % locales gardent votre travail privé et utilisable hors ligne). OpenScreenShot traite les captures dans votre navigateur et ne les envoie pas en ligne. Aucun des deux ne demande l’accès à tous les sites à l’installation dans Chrome.

Vous gardez la capture pleine page des longues pages et l’export en PNG, JPEG et PDF. OpenScreenShot enregistre aussi en WebP.

## Ce qui change

L’éditeur s’exécute dans un onglet du navigateur : il fonctionne donc de la même façon sur chaque système d’exploitation, et chaque outil est gratuit. Utilisez **Flèche**, **Texte**, **Numéro d’étape** et **Spotlight** pour désigner des détails, et **Flou** (`B`) avec le remplissage **Uni** pour masquer les données privées. **Recadrer** et **Cut** raccourcissent une longue capture. La [référence des annotations](/fr/docs/#annotate) liste les outils.

Le PDF fonctionne différemment. Cliquez sur **Enregistrer l’image** pour ouvrir la boîte **Exporter** et choisissez **PDF**. **Entière** crée une seule page à la taille de l’image. **A4** ou **Letter** avec **Répartir sur plusieurs pages** divise une longue capture en pages qui se chevauchent de 5 mm. Le PDF contient la capture sous forme d’image : il n’a ni liens cliquables ni texte sélectionnable. Si vous envoyez des PDF dont les lecteurs suivent les liens, FireShot convient mieux à cet usage.

OpenScreenShot n’a ni capture par lot, ni historique des captures, ni envoi par e-mail ou vers OneNote. Il a **Capturer un élément**, le panneau **Beautify** pour une image encadrée, et l’enregistrement d’onglet dans Chrome, avec zoom sur les clics et export en MP4.

Le manifeste Chrome de FireShot exige `nativeMessaging`, qui permet à l’extension de communiquer avec un programme installé sur votre ordinateur. OpenScreenShot n’utilise aucun programme natif. Chrome demande son autorisation facultative de capture d’onglet seulement la première fois que vous cliquez sur **Enregistrer**.

Le module FireShot pour Firefox a été mis à jour pour la dernière fois le 5 juin 2023 et demande l’accès à vos données sur tous les sites web. La version Firefox d’OpenScreenShot ne demande aucun accès aux sites à l’installation et prend seulement des captures d’écran.

## Comment passer à OpenScreenShot

1. Installez OpenScreenShot depuis le [Chrome Web Store](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp) ou depuis [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/openscreenshot/).
2. Épinglez l’icône dans la barre d’outils.
3. Cliquez sur l’icône sur une longue page. Avec le **Mode Express en un clic** par défaut, cela lance une capture **Page entière** et ouvre l’**Éditeur**.
4. Réglez **Après capture** dans les **Paramètres**. Choisissez **Télécharger** pour enregistrer chaque capture directement dans votre dossier de téléchargements en PNG, ou **Presse-papiers** pour la coller tout de suite.
5. Définissez un **Nom de fichier** avec des jetons comme `{date}`, `{domain}` et `{title}`. Un `/` enregistre dans un dossier à l’intérieur de Téléchargements.

Si un raccourci clavier ne lance pas de capture, ouvrez `chrome://extensions/shortcuts` et vérifiez si une autre extension utilise les mêmes touches.

Pour des copies datées de pages, consultez [enregistrer une copie visuelle d’une page web](/fr/use-cases/archive-web-pages/). Pour des pages d’aide avec des captures annotées, consultez [captures d’écran pour la documentation](/fr/use-cases/documentation/). La [référence d’export](/fr/docs/#export) décrit les formats et l’échelle. Pour d’autres outils pleine page, consultez l’[alternative à GoFullPage](/fr/alternatives/gofullpage/) et l’[alternative à FullPage Capture](/fr/alternatives/fullpage-capture/).
