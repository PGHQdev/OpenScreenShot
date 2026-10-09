---
title: 'Alternative à Lightshot : capture pleine page sans mise en ligne publique'
description: Lightshot vs OpenScreenShot. Capture pleine page, flou et export PDF dans le navigateur, avec des fichiers qui restent sur votre appareil et sans liens prnt.sc.
order: 6
---

Passez à OpenScreenShot si vous faites des captures de pages web dans Chrome ou Firefox et voulez la capture pleine page, le flou et l’export PDF, avec des fichiers qui restent sur votre appareil. Restez sur Lightshot si vous capturez d’autres applications ou tout votre bureau : Lightshot a des applications de bureau pour Windows et Mac, et OpenScreenShot capture uniquement les pages web dans le navigateur. Restez aussi si vous dépendez de ses liens courts instantanés. OpenScreenShot n’a pas de service de mise en ligne : vous partagez une capture en la collant ou en joignant le fichier.

OpenScreenShot est notre produit. Les informations sur Lightshot de cette page datent du 9 octobre 2026 et proviennent de sa [fiche sur le Chrome Web Store](https://chromewebstore.google.com/detail/mbniclmhobmnbdlbpiphghaielnnpgdp), de son [site web](https://app.prntscr.com/en/index.html), de sa [page de module Firefox](https://addons.mozilla.org/firefox/addon/lightshot/) et du manifeste de la version 7.0.1 obtenu depuis le serveur de mise à jour de Google.

## Lightshot et OpenScreenShot côte à côte

|                                  | Lightshot                                                                                       | OpenScreenShot                                                             |
| -------------------------------- | ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Prix                             | Gratuit                                                                                         | Gratuit                                                                    |
| Open source                      | Non (licence propriétaire)                                                                      | Oui, MIT                                                                   |
| Accès aux sites à l’installation | Tous les sites web (`*://*/*` requis)                                                           | Aucun. Accès à l’onglet actif quand vous lancez une capture                |
| Capture pleine page              | Non ; la fiche décrit la sélection d’une zone                                                   | Oui                                                                        |
| Annotation et flou               | Modification sur place                                                                          | Formes, flèches, texte, numéros d’étape, flou, recadrage                   |
| Export PDF                       | Non                                                                                             | Oui                                                                        |
| Enregistrement d’onglet          | Non                                                                                             | Oui, dans Chrome (la version Firefox prend seulement des captures d’écran) |
| Compte ou cloud                  | Mise en ligne facultative sur prnt.sc pour un lien court ; enregistrement sur le disque proposé | Aucun compte, aucun envoi en ligne                                         |
| Capture du bureau                | Oui, avec les applications Windows et Mac                                                       | Non                                                                        |

L’extension Chrome de Lightshot a été mise à jour pour la dernière fois le 23 juillet 2024.

## Mises en ligne et liens de partage

Lightshot peut mettre une capture en ligne sur prnt.sc et vous donner un lien court. Aucun compte n’est nécessaire pour voir une image mise en ligne. En 2021, [Kaspersky a signalé](https://www.kaspersky.com/blog/cryptoscam-in-lightshot/39224/) que les URL étaient séquentielles, si bien qu’un caractère modifié pouvait ouvrir une autre image, et que « Anyone can see published screenshots without authentication. » (n’importe qui peut voir les captures publiées sans authentification). [AIN.UA a signalé](https://en.ain.ua/2021/09/08/lightshot-allows-people-to-view-screenshots-of-other-users) le même problème la même année. Nous n’avons pas vérifié si c’est encore le cas en 2026.

OpenScreenShot n’a pas d’étape de mise en ligne. Il traite et stocke les captures dans votre navigateur, et un fichier exporté va dans votre dossier de téléchargements. Personne ne voit une capture tant que vous ne la collez pas ou ne la joignez pas quelque part. La [section confidentialité](/fr/docs/#privacy) donne les détails.

## Ce que vous gardez

La capture rapide d’une zone reste. Appuyez sur `Ctrl+Shift+E` (`⌘⇧E` sur macOS) ou faites un clic droit sur la page et choisissez **Zone sélectionnée**, puis tracez un rectangle et appuyez sur `Enter`. L’éditeur s’ouvre avec des flèches, du texte, des formes et un surligneur. **Copier** place l’image dans le presse-papiers, prête à coller dans une conversation.

Pour passer l’éditeur, réglez **Après capture** sur **Presse-papiers**. Chaque capture va alors directement dans le presse-papiers, ce qui se rapproche d’une habitude « capturer et coller ».

## Ce qui change

Vous pouvez capturer une plus grande partie d’une page. **Page entière** fait défiler toute la page et l’assemble en une seule image. **Capturer un élément** capture une carte, un tableau ou un graphique à ses limites exactes. **Zone visible** capture ce qui est à l’écran dans l’onglet.

L’éditeur ajoute **Flou** (`B`) avec un flou léger, une mosaïque ou le remplissage **Uni**, qui couvre entièrement les données privées. Les badges **Numéro d’étape** s’incrémentent seuls. Cliquez sur **Enregistrer l’image** pour ouvrir la boîte **Exporter** et enregistrer en PNG, JPEG, WebP ou PDF.

L’accès demandé à l’installation est plus restreint. OpenScreenShot utilise `activeTab` pour un seul onglet à la fois, et il ne peut capturer ni les pages de paramètres du navigateur, ni les pages d’extension, ni quoi que ce soit hors du navigateur. Pour une application de bureau ou la fenêtre d’un autre programme, il vous faut toujours un outil de bureau.

## Comment passer à OpenScreenShot

1. Installez OpenScreenShot depuis le [Chrome Web Store](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp) ou depuis [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/openscreenshot/).
2. Épinglez l’icône dans la barre d’outils.
3. Faites une première capture. Un clic sur l’icône lance une capture **Page entière** avec le **Mode Express en un clic** par défaut. Pour une zone, utilisez `Ctrl+Shift+E` ou le menu du clic droit.
4. Réglez **Après capture** dans les **Paramètres** : **Presse-papiers** pour coller tout de suite, **Éditeur** pour annoter, ou **Télécharger** pour enregistrer un PNG.
5. Si vous gardez une application de capture de bureau pour les autres programmes, vérifiez qu’elle n’utilise pas les mêmes touches qu’OpenScreenShot. Dans Chrome, vous pouvez changer les touches de l’extension sur `chrome://extensions/shortcuts`.

Pour des images rapides dans les réponses du support, consultez [captures d’écran pour le support client](/fr/use-cases/customer-support/). Pour les publications, consultez [captures d’écran pour les réseaux sociaux](/fr/use-cases/social-media/). Si vous avez besoin de capturer le bureau, consultez la page [alternative à Snagit](/fr/alternatives/snagit/) pour voir ce que couvre un outil de bureau.
