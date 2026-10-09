---
title: 'Alternative à Loom : des enregistrements d’onglet qui restent sur votre appareil'
description: Loom vs OpenScreenShot. Enregistrez un onglet avec webcam, micro et zoom automatique, et exportez un MP4 en local, sans compte et sans offre payante.
order: 8
---

Passez à OpenScreenShot si vous enregistrez des démonstrations d’une application web ou d’une page dans Chrome et voulez exporter un fichier MP4 sur votre propre appareil, sans compte. Restez sur Loom si vous partagez des vidéos par lien : Loom héberge chaque vidéo, vous donne une bibliothèque et un espace de travail d’équipe, et propose des applications de bureau et mobiles. OpenScreenShot n’a ni hébergement ni liens de partage : vous mettez en ligne ou joignez vous-même le fichier exporté. Il enregistre un seul onglet du navigateur, dans Chrome uniquement, et il ne capture ni les fenêtres du bureau ni l’écran entier.

OpenScreenShot est notre produit. Les informations sur Loom de cette page datent du 9 octobre 2026 et proviennent de sa [page de tarifs](https://www.loom.com/pricing), de sa [fiche sur le Chrome Web Store](https://chromewebstore.google.com/detail/loom-%E2%80%93-screen-recorder-sc/liecbddmkiiihnedobmlmillhodjkdmb), de la [page d’aide sur les comptes](https://support.atlassian.com/loom/docs/use-loom-with-an-atlassian-account) d’Atlassian et de la [liste des avertissements d’autorisation](https://developer.chrome.com/docs/extensions/reference/permissions-list) de Chrome.

## Loom et OpenScreenShot côte à côte

|                                  | Loom                                                                                                                                                                                                     | OpenScreenShot                                                                                |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Prix                             | Starter 0 $ (25 vidéos, enregistrements d’écran de 5 minutes au maximum) ; Business 18 $ par utilisateur et par mois ; Business + AI indiqué à 24 $ par utilisateur et par mois ; Enterprise sur demande | Gratuit, sans offre payante                                                                   |
| Open source                      | Non                                                                                                                                                                                                      | Oui, MIT                                                                                      |
| Accès aux sites à l’installation | Tous les sites web (`<all_urls>` requis, scripts de contenu sur chaque page)                                                                                                                             | Aucun. La capture d’onglet est facultative et demandée au premier enregistrement              |
| Capture pleine page              | Non traité par les sources que nous avons consultées                                                                                                                                                     | Oui                                                                                           |
| Annotation et flou               | Non traité par les sources que nous avons consultées                                                                                                                                                     | Oui, sur les captures d’écran                                                                 |
| Export PDF                       | Non traité par les sources que nous avons consultées                                                                                                                                                     | Oui, pour les captures d’écran                                                                |
| Enregistrement d’onglet          | Enregistrement d’écran, avec des limites selon l’offre                                                                                                                                                   | Oui, onglet uniquement, dans Chrome (la version Firefox prend seulement des captures d’écran) |
| Compte ou cloud                  | Compte requis ; vidéos hébergées par Loom                                                                                                                                                                | Aucun compte, aucun envoi en ligne                                                            |

Loom fait partie d’Atlassian depuis novembre 2023, et un compte Loom peut utiliser un compte Atlassian.

## Ce que vous gardez

Vous gardez un enregistreur qui démarre depuis la barre d’outils du navigateur. Cliquez sur **Enregistrer** dans le popup OpenScreenShot, activez **Micro** et **Webcam**, et cliquez sur **Démarrer l’enregistrement**. Votre webcam apparaît dans l’export sous forme de bulle ronde que vous placez. **Audio onglet** ajoute le son de la page.

## Ce qui change

La vidéo est un fichier. Quand vous arrêtez, l’éditeur d’enregistrement s’ouvre dans le même onglet. Il ajoute un zoom 2x à chaque clic, pour que les spectateurs voient où vous avez cliqué. Vous pouvez ajuster ou supprimer chaque zoom, ajouter les vôtres à 1,5x, 2x ou 3x, et couper des segments. L’export produit un fichier MP4 (H.264 et AAC) ou WebM dans votre dossier de téléchargements. Mettez-le en ligne sur votre propre hébergeur vidéo, dans une conversation ou dans un ticket. La [référence de l’enregistrement](/fr/docs/#record) décrit chaque contrôle.

Les enregistrements restent sur votre appareil. OpenScreenShot les enregistre dans IndexedDB pendant l’enregistrement et les garde jusqu’à ce que vous supprimiez la session. Il n’a ni analyse d’audience ni télémétrie. La [section confidentialité](/fr/docs/#privacy) donne les détails.

Le périmètre est un seul onglet. Gardez **Onglet entier** ou faites glisser sur l’aperçu pour enregistrer une partie de la page. Si l’onglet passe sur un autre site pendant un enregistrement, le suivi des clics a besoin de **Enregistrer partout**, qui demande l’accès à tous les sites. Sans cette autorisation, les effets de zoom et de clic s’arrêtent pour le reste de la vidéo, et la vidéo continue de s’enregistrer.

L’accès demandé à l’installation est plus restreint. Le manifeste de Loom exige `<all_urls>`, `tabCapture` et `desktopCapture`. La liste de Chrome affiche « Read and change all your data on all websites » (lire et modifier toutes vos données sur tous les sites web) pour `tabCapture` et « Capture content of your screen » (capturer le contenu de votre écran) pour `desktopCapture`. OpenScreenShot s’installe avec `activeTab` et demande la capture d’onglet seulement la première fois que vous cliquez sur **Enregistrer**.

OpenScreenShot prend aussi des captures d’écran. Un clic sur l’icône de la barre d’outils lance une capture **Page entière** avec le **Mode Express en un clic** par défaut, et l’éditeur propose des flèches, des numéros d’étape et **Flou** avec un remplissage **Uni**.

## Comment passer à OpenScreenShot

1. Installez OpenScreenShot depuis le [Chrome Web Store](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp). La [version Firefox](https://addons.mozilla.org/firefox/addon/openscreenshot/) prend seulement des captures d’écran.
2. Épinglez l’icône dans la barre d’outils.
3. Cliquez sur **Enregistrer** dans le popup et acceptez la demande de capture d’onglet de Chrome. Enregistrez une courte prise, puis cliquez sur **Exporter**.
4. Appuyez sur `Alt+Shift+X` pour arrêter un enregistrement depuis n’importe quel onglet.
5. Pour les captures d’écran, réglez **Après capture** dans les **Paramètres** : **Éditeur**, **Presse-papiers** ou **Télécharger**.
6. Téléchargez les vidéos Loom à conserver avant de fermer votre compte ou de changer d’offre.

Pour des démonstrations de fonctionnalités, consultez [vidéos de démonstration produit](/fr/use-cases/product-demos/). Pour les réponses du support, consultez [captures d’écran pour le support client](/fr/use-cases/customer-support/). Pour un enregistreur open source qui enregistre aussi le bureau, consultez l’[alternative à Screenity](/fr/alternatives/screenity/). Pour un enregistreur avec liens cloud, consultez l’[alternative à Awesome Screenshot](/fr/alternatives/awesome-screenshot/).
