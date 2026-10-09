---
title: 'Alternative à Screenity : captures d’écran et enregistrement d’onglet dans une seule extension'
description: Screenity vs OpenScreenShot. Les deux sont open source. OpenScreenShot ajoute capture pleine page et export PDF, sans accès à tous les sites à l’installation.
order: 7
---

Passez à OpenScreenShot si vous enregistrez des onglets du navigateur et faites aussi des captures pleine page, et que vous voulez une seule extension open source qui fait les deux, sans accès à tous les sites web à l’installation. Restez sur Screenity si vous enregistrez plus qu’un onglet : il enregistre une zone, le bureau, n’importe quelle fenêtre d’application ou la caméra, et exporte en GIF ou enregistre sur Google Drive. OpenScreenShot enregistre un seul onglet du navigateur et ne capture ni les fenêtres du bureau ni l’écran entier. L’offre payante Pro de Screenity ajoute aussi le partage par lien et l’hébergement cloud, qu’OpenScreenShot ne propose pas.

OpenScreenShot est notre produit. Les informations sur Screenity de cette page datent du 9 octobre 2026 et proviennent de son [dépôt GitHub](https://github.com/alyssaxuu/screenity) et de son [manifeste](https://github.com/alyssaxuu/screenity/blob/master/src/manifest.json), de sa [fiche sur le Chrome Web Store](https://chromewebstore.google.com/detail/screenity-screen-recorder/kbbdabhdfibnancpjfhlkhafgdilcnji), de sa [page Pro](https://screenity.io/pro) et de la [liste des avertissements d’autorisation](https://developer.chrome.com/docs/extensions/reference/permissions-list) de Chrome.

## Screenity et OpenScreenShot côte à côte

|                                  | Screenity                                                                                        | OpenScreenShot                                                                                |
| -------------------------------- | ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| Prix                             | Extension gratuite ; Pro coûte 10 $ par mois ou 120 $ par an, avec un essai de 7 jours           | Gratuit, sans offre payante                                                                   |
| Open source                      | Oui, GPL-3.0                                                                                     | Oui, MIT                                                                                      |
| Accès aux sites à l’installation | Tous les sites web (`<all_urls>` requis, ainsi que `tabs` et `tabCapture`)                       | Aucun. La capture d’onglet est facultative et demandée au premier enregistrement              |
| Capture pleine page              | Non traité par les sources que nous avons consultées                                             | Oui                                                                                           |
| Annotation et flou               | Dessin, texte, flèches, formes ; flou du contenu de la page                                      | Formes, flèches, texte, numéros d’étape, flou, spotlight, recadrage sur les captures d’écran  |
| Export PDF                       | Non traité par les sources que nous avons consultées                                             | Oui                                                                                           |
| Enregistrement d’onglet          | Oui, ainsi qu’une zone, le bureau, une fenêtre d’application et la caméra                        | Oui, onglet uniquement, dans Chrome (la version Firefox prend seulement des captures d’écran) |
| Export vidéo                     | MP4, GIF, WebM ou Google Drive                                                                   | MP4 ou WebM                                                                                   |
| Compte ou cloud                  | Aucune connexion pour l’extension gratuite ; Pro utilise un compte et un cloud hébergé dans l’UE | Aucun compte, aucun envoi en ligne                                                            |

## Ce que vous gardez

Les deux extensions sont open source, et les deux gardent les enregistrements gratuits sur votre appareil, sans connexion. Dans OpenScreenShot, cliquez sur **Enregistrer** dans le popup et choisissez **Micro**, **Audio onglet** ou **Webcam**. Gardez **Onglet entier** ou faites glisser sur l’aperçu pour enregistrer une partie de la page. L’onglet d’enregistrement contient le minuteur et les boutons **Pause**, **Arrêter** et **Annuler** : aucun contrôle n’apparaît donc dans la vidéo. Appuyez sur `Alt+Shift+X` pour arrêter depuis n’importe quel onglet.

## Ce qui change

L’éditeur d’enregistrement ajoute un zoom 2x à chaque clic de votre curseur. Vous pouvez déplacer ou supprimer ces zooms, ajouter des zooms manuels à 1,5x, 2x ou 3x, et couper chaque segment. La webcam rejoint l’export sous forme de bulle ronde que vous placez, et le panneau **Beautify** ajoute des marges et un fond. L’export produit par défaut un MP4 (H.264 et AAC), ou un WebM. La [référence de l’enregistrement](/fr/docs/#record) décrit chaque contrôle.

Les captures d’écran font partie de la même extension. Un clic sur l’icône de la barre d’outils lance une capture **Page entière** avec le **Mode Express en un clic** par défaut. L’éditeur de captures propose **Flou** avec un remplissage **Uni** pour le masquage, et **Enregistrer l’image** ouvre la boîte **Exporter** pour le PNG, le JPEG, le WebP ou le PDF. OpenScreenShot n’ajoute rien à la page pendant un enregistrement : vous ne pouvez donc pas dessiner sur la page pendant l’enregistrement. L’annotation fonctionne sur les captures d’écran.

L’accès demandé à l’installation est plus restreint. Le manifeste de Screenity exige `<all_urls>`, et la liste de Chrome affiche « Read and change all your data on all websites » (lire et modifier toutes vos données sur tous les sites web) pour `tabCapture` et « Read your browsing history » (lire votre historique de navigation) pour `tabs`. OpenScreenShot s’installe avec `activeTab` et demande la capture d’onglet seulement la première fois que vous cliquez sur **Enregistrer**. Il demande l’accès à tous les sites seulement si vous activez **Enregistrer partout**, qui permet au suivi des clics de suivre un onglet sur un autre site.

## Comment passer à OpenScreenShot

1. Installez OpenScreenShot depuis le [Chrome Web Store](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp). La [version Firefox](https://addons.mozilla.org/firefox/addon/openscreenshot/) prend seulement des captures d’écran.
2. Épinglez l’icône dans la barre d’outils.
3. Faites une première capture d’écran : cliquez sur l’icône sur une page et vérifiez le résultat dans l’**Éditeur**.
4. Cliquez sur **Enregistrer** dans le popup et acceptez la demande de capture d’onglet de Chrome. Enregistrez une courte prise et exportez-la.
5. Réglez **Après capture** dans les **Paramètres** pour les captures d’écran : **Éditeur**, **Presse-papiers** ou **Télécharger**.
6. Exportez les enregistrements Screenity à conserver avant de supprimer l’extension.

Pour des démonstrations de fonctionnalités, consultez [vidéos de démonstration produit](/fr/use-cases/product-demos/). Pour montrer un bug dans un ticket, consultez [captures d’écran pour les rapports de bug](/fr/use-cases/bug-reports/). Si vous partagez des vidéos par lien avec une équipe, comparez l’[alternative à Loom](/fr/alternatives/loom/). Pour un enregistreur avec mise en ligne dans le cloud, consultez l’[alternative à Nimbus](/fr/alternatives/nimbus/).
