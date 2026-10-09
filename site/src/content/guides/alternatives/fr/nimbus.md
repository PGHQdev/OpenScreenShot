---
title: 'Alternative à Nimbus Screenshot : la capture locale après le passage à FuseBase'
description: 'Nimbus Screenshot est devenu FuseBase Pro. OpenScreenShot est une option gratuite et open source : capture pleine page, annotation et vidéo d’onglet en local.'
order: 5
---

Nimbus Screenshot est désormais distribué dans Chrome sous le nom FuseBase Pro, par Nimbus Web. Passez à OpenScreenShot si vous utilisiez Nimbus pour capturer, annoter et enregistrer des pages web et voulez un outil gratuit qui garde les fichiers sur votre appareil, sans compte et sans espace de travail cloud. Restez sur FuseBase Pro si vous avez besoin de ce qu’OpenScreenShot n’a pas : l’enregistrement d’écran au-delà d’un onglet, et les envois vers FuseBase, Google Drive, Dropbox ou Slack. OpenScreenShot enregistre un seul onglet du navigateur, dans Chrome uniquement. Il ne capture ni les fenêtres du bureau ni l’écran entier.

OpenScreenShot est notre produit. Les informations sur FuseBase Pro de cette page datent du 9 octobre 2026 et proviennent de sa [fiche sur le Chrome Web Store](https://chromewebstore.google.com/detail/fddbloohgcjopkmnjdeodjcfbgiimpcn), de la [page de capture](https://thefusebase.com/screenshot/) et de la [page de tarifs](https://thefusebase.com/pricing/) de FuseBase, de l’ancienne [page de module Firefox de Nimbus](https://addons.mozilla.org/en-US/firefox/addon/nimbus-screenshot/) et du manifeste de la version 3.6.19 obtenu depuis le serveur de mise à jour de Google.

## Ce qu’est devenu Nimbus Screenshot

La fiche d’origine Nimbus Screenshot & Screen Video Recorder n’est plus sur le Chrome Web Store. L’ancienne page de capture de Nimbus, nimbusweb.me/screenshot.php, redirige désormais vers la page de capture de FuseBase. L’extension Chrome actuelle est « FuseBase Pro - Capture screenshots and Video record », proposée par Nimbus Web, Inc. L’ancien module Nimbus est toujours listé pour Firefox. Il a été mis à jour pour la dernière fois le 31 juillet 2020.

## FuseBase Pro et OpenScreenShot côte à côte

|                                  | FuseBase Pro (anciennement Nimbus)                                                                                           | OpenScreenShot                                              |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Prix                             | Offre gratuite avec des enregistrements de 5 minutes au maximum ; offre Pro avec des enregistrements de 10 heures au maximum | Gratuit, sans offre payante                                 |
| Open source                      | Non                                                                                                                          | Oui, MIT                                                    |
| Accès aux sites à l’installation | Tous les sites web (`<all_urls>` requis, scripts de contenu sur chaque page)                                                 | Aucun. Accès à l’onglet actif quand vous lancez une capture |
| Capture pleine page              | Oui                                                                                                                          | Oui                                                         |
| Annotation et flou               | Oui                                                                                                                          | Oui, tous les outils gratuits                               |
| Export PDF                       | Oui, selon sa fiche                                                                                                          | Oui                                                         |
| Enregistrement d’onglet          | Oui, écran et webcam ; la conversion en GIF et MP4 est premium                                                               | Oui, onglet uniquement, dans Chrome ; MP4 et WebM gratuits  |
| Compte ou cloud                  | Envois vers FuseBase, Google Drive, Dropbox et Slack                                                                         | Aucun compte, aucun envoi en ligne                          |

La page de capture de FuseBase n’affiche pas de prix pour l’offre Pro de capture. La page de tarifs de FuseBase liste des offres d’espace de travail, à partir de Solo à 32 $ ou 39 $ par mois selon la facturation, et ne nomme pas l’extension de capture.

## Ce que vous gardez

Vous gardez la capture pleine page, un éditeur avec des outils d’annotation et le flou, et l’export PDF. Dans Chrome, vous gardez l’enregistrement avec webcam, et OpenScreenShot enregistre aussi le micro et l’audio de l’onglet. Les exports n’ont pas de filigrane.

## Ce qui change

Les fichiers restent sur votre appareil. OpenScreenShot stocke les captures dans le stockage local du navigateur et les enregistrements dans IndexedDB jusqu’à ce que vous les supprimiez, et il n’a ni analyse d’audience ni télémétrie. La section confidentialité de FuseBase Pro sur le Chrome Web Store déclare la collecte d’informations permettant d’identifier personnellement l’utilisateur, d’informations d’authentification et du contenu des sites web. Pour partager une capture OpenScreenShot, cliquez sur **Copier** et collez-la, ou cliquez sur **Enregistrer l’image** et joignez le fichier.

L’accès demandé à l’installation est plus restreint. OpenScreenShot utilise `activeTab`, qui couvre un seul onglet quand vous lancez une capture. Chrome demande l’autorisation facultative de capture d’onglet la première fois que vous cliquez sur **Enregistrer**, et l’accès à tous les sites seulement si vous activez **Enregistrer partout**.

L’enregistrement couvre un seul onglet. Cliquez sur **Enregistrer** dans le popup, choisissez **Micro**, **Audio onglet** ou **Webcam**, et enregistrez l’onglet entier ou une zone que vous tracez. L’éditeur d’enregistrement ajoute un zoom 2x à chaque clic, et vous pouvez couper des segments et placer la bulle webcam. L’export en MP4 et en WebM est gratuit. OpenScreenShot n’a pas d’export GIF. Consultez la [référence de l’enregistrement](/fr/docs/#record).

## Comment passer à OpenScreenShot

1. Installez OpenScreenShot depuis le [Chrome Web Store](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp) ou depuis [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/openscreenshot/). La version Firefox prend seulement des captures d’écran.
2. Épinglez l’icône dans la barre d’outils.
3. Cliquez sur l’icône sur une page. Avec le **Mode Express en un clic** par défaut, cela lance une capture **Page entière** et ouvre l’**Éditeur**. Faites un clic droit sur la page pour **Zone visible**, **Zone sélectionnée** et **Capturer un élément**.
4. Réglez **Après capture** dans les **Paramètres** : **Éditeur**, **Presse-papiers** ou **Télécharger**.
5. Téléchargez depuis FuseBase ou votre stockage cloud les fichiers à conserver. Pour annoter une ancienne capture, déposez l’image sur l’éditeur OpenScreenShot.
6. Vérifiez `chrome://extensions` et supprimez l’extension Nimbus ou FuseBase si vous ne l’utilisez plus.

Pour de courtes vidéos de fonctionnalités, consultez [vidéos de démonstration produit](/fr/use-cases/product-demos/). Pour des captures annotées destinées à une équipe, consultez [capturer une page pour une revue de design](/fr/use-cases/design-review/). Pour d’autres enregistreurs, consultez l’[alternative à Awesome Screenshot](/fr/alternatives/awesome-screenshot/) et l’[alternative à Screenity](/fr/alternatives/screenity/).
