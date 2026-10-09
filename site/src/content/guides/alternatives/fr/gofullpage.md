---
title: 'Alternative à GoFullPage : annotation gratuite et open source'
description: GoFullPage vs OpenScreenShot pour les captures pleine page. OpenScreenShot offre annotation, flou, recadrage et découpe PDF gratuits, avec un code public.
order: 1
---

Passez à OpenScreenShot si vous capturez des pages entières puis devez recadrer, flouter, annoter ou répartir un PDF en pages : GoFullPage réserve ces fonctions à son offre payante Premium, et OpenScreenShot les inclut gratuitement. OpenScreenShot est aussi sous licence MIT : vous pouvez donc lire le code qui s’exécute sur vos pages. Restez sur GoFullPage si vous capturez et enregistrez seulement des pages entières en images ou en PDF, sans modification. Sa version gratuite le fait déjà, sans limite sur le nombre de captures, et sa FAQ renvoie vers une version sur Microsoft Edge Add-ons. OpenScreenShot n’a pas de fiche sur Edge Add-ons, mais Edge peut l’installer depuis le Chrome Web Store. OpenScreenShot capture uniquement les pages web dans le navigateur ; il ne capture ni les fenêtres du bureau ni l’écran entier.

OpenScreenShot est notre produit. Les informations sur GoFullPage de cette page datent du 9 octobre 2026 et proviennent de sa [fiche sur le Chrome Web Store](https://chromewebstore.google.com/detail/fdpohaocaechififmbbbbbknoalclacl), de sa [FAQ](https://gofullpage.com/faq), de sa [page Premium](https://gofullpage.com/premium) et de sa [page de module Firefox](https://addons.mozilla.org/en-US/firefox/addon/gofullpage-screenshot/).

## GoFullPage et OpenScreenShot côte à côte

|                                  | GoFullPage                                                                 | OpenScreenShot                                                             |
| -------------------------------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Prix                             | Gratuit ; Premium coûte 12 $ par an (hors taxes), avec un essai de 7 jours | Gratuit, sans offre payante                                                |
| Open source                      | Non. Un fork privé, depuis 2018, d’un projet MIT                           | Oui, MIT                                                                   |
| Accès aux sites à l’installation | Aucun. L’accès à tous les sites est facultatif                             | Aucun. Accès à l’onglet actif quand vous lancez une capture                |
| Capture pleine page              | Oui                                                                        | Oui                                                                        |
| Annotation et flou               | Premium uniquement (flou, texte, surlignage, recadrage)                    | Gratuits (formes, flèches, texte, numéros d’étape, flou, recadrage)        |
| Export PDF                       | Gratuit ; la découpe intelligente du PDF en pages est réservée à Premium   | Gratuit, y compris en pages A4 ou Letter qui se chevauchent                |
| Enregistrement d’onglet          | Non                                                                        | Oui, dans Chrome (la version Firefox prend seulement des captures d’écran) |
| Compte ou cloud                  | Aucun compte pour la capture gratuite ; Premium utilise un compte          | Aucun compte, aucun envoi en ligne                                         |
| Boutiques de navigateur          | Chrome Web Store, Firefox Add-ons, Edge Add-ons                            | Chrome Web Store, Firefox Add-ons                                          |

La [comparaison complète](/fr/compare/) ajoute FullPage Capture au même tableau.

## Ce que vous gardez

L’habitude principale reste la même. Avec les paramètres par défaut, un clic sur l’icône OpenScreenShot de la barre d’outils lance une capture **Page entière**. C’est le **Mode Express en un clic**. L’extension fait défiler la page, assemble les parties en une seule image et ouvre le résultat dans l’**Éditeur**. Les en-têtes fixes apparaissent une seule fois en haut, et les pages qui font défiler un élément interne fonctionnent aussi.

Les deux extensions ne demandent aucun accès aux sites à l’installation. OpenScreenShot utilise `activeTab` : il peut lire seulement l’onglet que vous capturez, au moment où vous lancez la capture. Les deux enregistrent des fichiers PNG, JPEG et PDF. Les deux fonctionnent dans Chrome et Firefox.

## Ce qui change

Les outils de l’éditeur sont gratuits. **Recadrer** (`C`) rogne l’image, **Flou** (`B`) avec le remplissage **Uni** couvre les données privées, et **Flèche**, **Texte** et **Numéro d’étape** marquent ce qui compte. **Cut** (`X`) retire des bandes horizontales d’une longue capture. La [référence des annotations](/fr/docs/#annotate) liste chaque outil et chaque raccourci.

La mise en page PDF est gratuite aussi. Cliquez sur **Enregistrer l’image** pour ouvrir la boîte **Exporter**, choisissez **PDF**, puis **A4** ou **Letter** avec **Répartir sur plusieurs pages**. Chaque page chevauche la suivante de 5 mm, pour qu’aucune ligne de texte ne soit coupée. Le bouton **PDF** à côté d’**Enregistrer l’image** enregistre un PDF en un clic. Le PDF contient la capture sous forme d’image : son texte n’est ni cherchable ni sélectionnable.

Vous obtenez aussi plus de modes de capture : **Zone visible**, **Zone sélectionnée** et **Capturer un élément**, qui capture une carte, un tableau ou un graphique à ses limites exactes. Dans Chrome, **Enregistrer** capture un onglet en vidéo MP4 ou WebM, avec un zoom à chaque clic. Le premier enregistrement demande l’autorisation facultative de capture d’onglet.

OpenScreenShot n’ajoute pas de tampon de date ou d’URL. Utilisez plutôt le modèle de nom de fichier dans les **Paramètres** avec `{date}` et `{domain}` pour garder ces informations dans le nom de fichier.

## Comment passer à OpenScreenShot

1. Installez OpenScreenShot depuis le [Chrome Web Store](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp) ou depuis [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/openscreenshot/).
2. Épinglez l’icône dans la barre d’outils. Si GoFullPage est épinglé au même endroit, désépinglez-le pour cliquer sur la bonne icône.
3. Ouvrez une longue page et cliquez sur l’icône OpenScreenShot. Vérifiez le haut, le bas et tout en-tête collant dans l’**Éditeur**.
4. Réglez **Après capture** dans les **Paramètres**. **Éditeur** ouvre chaque capture pour l’annoter. **Télécharger** enregistre un PNG dans votre dossier de téléchargements sans ouvrir d’onglet, ce qui se rapproche d’une habitude « capturer et enregistrer ». **Presse-papiers** copie l’image.
5. Pour annoter une image enregistrée avec GoFullPage, déposez le fichier sur l’éditeur ou collez-le avec `Ctrl+V` (`⌘V` sur macOS).

Si un raccourci clavier ne lance pas de capture OpenScreenShot, ouvrez `chrome://extensions/shortcuts` et vérifiez si une autre extension utilise les mêmes touches.

Pour garder des copies de pages avec des noms de fichier datés, consultez [enregistrer une copie visuelle d’une page web](/fr/use-cases/archive-web-pages/). Si vous voulez des PDF avec des liens cliquables, comparez l’[alternative à FireShot](/fr/alternatives/fireshot/) et l’[alternative à FullPage Capture](/fr/alternatives/fullpage-capture/).
