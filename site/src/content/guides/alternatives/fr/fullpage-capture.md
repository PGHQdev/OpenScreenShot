---
title: 'Alternative à FullPage Capture : open source, sans accès à tous les sites à l’installation'
description: 'FullPage Capture vs OpenScreenShot : capture et annotation gratuites dans les deux. OpenScreenShot : open source, sans accès à tous les sites à l’installation.'
order: 2
---

Passez à OpenScreenShot si vous voulez une extension de capture pleine page dont vous pouvez lire le code et qui ne demande aucun accès à tous les sites web à l’installation. Restez sur FullPage Capture si vous avez besoin de ce que propose son export PDF : sa fiche décrit des PDF avec liens cliquables et sauts de page intelligents, et son offre Pro ajoute des PDF cherchables. OpenScreenShot enregistre un PDF sous forme d’image : son texte ne peut être ni cherché ni sélectionné, et ses liens ne fonctionnent pas. OpenScreenShot capture uniquement les pages web dans le navigateur ; il ne capture ni les fenêtres du bureau ni l’écran entier.

OpenScreenShot est notre produit. Les informations sur FullPage Capture de cette page datent du 9 octobre 2026 et proviennent de sa [fiche sur le Chrome Web Store](https://chromewebstore.google.com/detail/ggacghlcchiiejclfdajbpkbjfgjhfol), de son [site web](https://fullpagecapture.net/) et du manifeste de la version 1.19.67 obtenu depuis le serveur de mise à jour de Google.

## FullPage Capture et OpenScreenShot côte à côte

|                                  | FullPage Capture                                                                                         | OpenScreenShot                                                                                         |
| -------------------------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Prix                             | Gratuit ; Pro coûte 19 $ par an après un essai de 7 jours                                                | Gratuit, sans offre payante                                                                            |
| Open source                      | Non                                                                                                      | Oui, MIT                                                                                               |
| Accès aux sites à l’installation | Tous les sites web (`<all_urls>` requis)                                                                 | Aucun. Accès à l’onglet actif quand vous lancez une capture                                            |
| Capture pleine page              | Oui, gratuite et sans filigrane                                                                          | Oui, gratuite et sans filigrane                                                                        |
| Annotation et flou               | Gratuits (flèches, formes, texte, surligneur, stylo, badges numérotés, flou et pixellisation)            | Gratuits (formes, flèches, texte, surligneur, stylo, numéros d’étape, flou, mosaïque, remplissage Uni) |
| Export PDF                       | Oui, avec liens cliquables et sauts de page intelligents ; le PDF cherchable est réservé à Pro           | Oui, sous forme d’image : une page, ou des pages A4 ou Letter qui se chevauchent                       |
| Enregistrement d’onglet          | Non                                                                                                      | Oui, dans Chrome (la version Firefox prend seulement des captures d’écran)                             |
| Compte ou cloud                  | La fiche indique aucun compte ; Pro utilise un compte et « Send to your cloud » (envoi vers votre cloud) | Aucun compte, aucun envoi en ligne                                                                     |

La [comparaison complète](/fr/compare/) ajoute GoFullPage au même tableau.

## Accès à l’installation

Le manifeste de FullPage Capture exige l’autorisation d’hôte `<all_urls>`. Chrome affiche l’avertissement « Read and change all your data on all websites » (lire et modifier toutes vos données sur tous les sites web) quand vous installez une extension qui a cette autorisation. La fiche indique « No account, no analytics, no network requests. Files stay on your device » (aucun compte, aucune analyse, aucune requête réseau ; les fichiers restent sur votre appareil), et le site web indique « The extension makes zero network requests » (l’extension ne fait aucune requête réseau). Nous n’avons pas testé son comportement réseau, et cette page n’affirme rien à ce sujet.

OpenScreenShot n’exige aucune autorisation d’hôte. Il utilise `activeTab`, qui donne accès à un seul onglet au moment où vous cliquez sur l’icône, appuyez sur un raccourci ou choisissez une capture dans le menu du clic droit. Chrome demande l’autorisation facultative de capture d’onglet seulement la première fois que vous cliquez sur **Enregistrer**. L’accès à tous les sites est demandé seulement si vous activez **Enregistrer partout**. La [section confidentialité](/fr/docs/#privacy) explique comment les captures restent sur votre appareil.

## Ce que vous gardez

Le fonctionnement est proche. Un clic sur l’icône de la barre d’outils lance une capture **Page entière** avec le **Mode Express en un clic** par défaut, et le résultat s’ouvre dans l’**Éditeur**. Les flèches, les formes, le texte, les badges numérotés et le flou sont tous gratuits. L’enregistrement, la copie et l’export PDF sont gratuits aussi, et aucun export n’a de filigrane.

## Ce qui change

Pour le masquage, choisissez **Flou** (`B`), puis le remplissage **Uni** sous **Masquage**. Uni couvre entièrement la zone dans l’export. Le [guide de masquage](/fr/blog/redact-screenshot/) montre comment vérifier le fichier enregistré.

Le PDF fonctionne différemment. Cliquez sur **Enregistrer l’image** pour ouvrir la boîte **Exporter**, choisissez **PDF**, puis **Entière** pour une seule page à la taille de l’image, ou **A4** ou **Letter** avec **Répartir sur plusieurs pages**. Les pages se chevauchent de 5 mm pour qu’aucune ligne de texte ne soit coupée. Le [guide capture vers PDF](/fr/blog/save-screenshot-as-pdf/) compare les mises en page.

OpenScreenShot n’a ni capture par lot ni envoi vers le cloud. Il ajoute **Capturer un élément** pour une carte ou un tableau, le panneau **Beautify** pour les marges, les coins, l’ombre et le fond, et l’enregistrement d’onglet en MP4 ou WebM dans Chrome. Il fonctionne aussi dans Firefox pour les captures d’écran.

## Comment passer à OpenScreenShot

1. Installez OpenScreenShot depuis le [Chrome Web Store](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp) ou depuis [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/openscreenshot/).
2. Épinglez l’icône dans la barre d’outils, et désépinglez FullPage Capture s’il occupe le même emplacement.
3. Ouvrez une longue page et cliquez sur l’icône. Vérifiez le résultat dans l’**Éditeur**.
4. Réglez **Après capture** dans les **Paramètres** : **Éditeur** pour annoter, **Presse-papiers** pour coller l’image tout de suite, ou **Télécharger** pour enregistrer un PNG sans ouvrir d’onglet.
5. Définissez un **Nom de fichier** dans les **Paramètres**, par exemple `{date}_{domain}`, pour que les fichiers enregistrés se trient par date et par site.
6. Supprimez FullPage Capture depuis `chrome://extensions` quand vous ne l’utilisez plus.

Pour des captures annotées dans les outils de suivi des tickets, consultez [captures d’écran pour les rapports de bug](/fr/use-cases/bug-reports/). La [référence des modes de capture](/fr/docs/#modes) décrit chaque mode. Pour d’autres outils pleine page, consultez l’[alternative à GoFullPage](/fr/alternatives/gofullpage/) et l’[alternative à FireShot](/fr/alternatives/fireshot/).
