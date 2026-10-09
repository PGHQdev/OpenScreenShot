---
title: Comment répondre aux tickets de support avec des captures d’écran
description: Copiez une capture directement dans la réponse à un ticket, numérotez les étapes, masquez les données client et annotez une image envoyée par un client.
order: 7
---

Pour répondre à un ticket de support avec une capture d’écran, capturez l’écran que le client doit voir, numérotez les étapes à suivre, masquez les données client et collez l’image dans votre réponse. Dans OpenScreenShot, l’action **Presse-papiers** copie une capture sans ouvrir l’éditeur, et les badges **Numéro d’étape** montrent l’ordre des clics. Pour annoter une capture qu’un client vous a envoyée, collez-la ou déposez-la dans l’**Éditeur**.

## Répondre avec une capture annotée, étape par étape

1. Ouvrez l’écran de votre produit qui répond à la question, par exemple une page de paramètres.
2. Faites un clic droit sur la page, ouvrez le sous-menu **OpenScreenShot** et choisissez **Zone sélectionnée** ou **Capturer un élément**. Gardez assez d’interface pour que le client retrouve le même endroit.
3. Dans l’**Éditeur**, ajoutez un **Numéro d’étape** (`S`) sur chaque contrôle, dans l’ordre où le client clique dessus.
4. Sélectionnez **Flou** (`B`), choisissez **Uni** sous **Masquage**, et couvrez les noms, les adresses e-mail, les numéros de commande et les identifiants de compte.
5. Cliquez sur **Copier**, ou appuyez sur `Ctrl+C` (`⌘C` sur macOS).
6. Collez l’image dans la réponse au ticket, puis écrivez les mêmes étapes sous forme de liste numérotée en dessous.

Les étapes écrites aident les clients qui utilisent un lecteur d’écran ou qui lisent la réponse dans un client de messagerie qui bloque les images.

## Copier sans passer par l’éditeur

Pour une réponse rapide qui n’a besoin d’aucune annotation, réglez **Après capture** sur **Presse-papiers** dans le popup ou dans les **Paramètres**. Chaque capture va alors directement dans le presse-papiers, et le badge de la barre d’outils le confirme. Collez-la dans la réponse avec `Ctrl+V` ou `⌘V`.

Ce réglage s’applique aux boutons du popup, aux raccourcis clavier et au menu du clic droit. Revenez à **Éditeur** quand la capture montre des données client à masquer d’abord. **Rouvrir**, dans le pied du popup, ouvre à tout moment la dernière capture dans l’éditeur.

## Numéroter les étapes

Les badges **Numéro d’étape** s’incrémentent seuls : le premier clic place 1, le suivant place 2. Quand vous supprimez un badge, les autres sont renumérotés. Gardez dans l’image les mêmes numéros que dans votre réponse écrite.

Ajoutez une **Flèche** (`A`) quand un contrôle est petit ou difficile à trouver, et une courte note **Texte** (`T`) quand une étape demande une valeur, comme l’option à sélectionner. **Spotlight** (`O`) assombrit le reste de l’écran quand la page est chargée.

## Masquer les données client

Vos propres vues d’administration montrent souvent les données d’autres clients : des noms dans une liste, des adresses e-mail, des informations de paiement et des notes internes. Vérifiez toute l’image, bords compris, avant de l’envoyer.

Un flou léger ou une mosaïque peut laisser deviner un texte court. **Uni** couvre entièrement la zone dans l’export. Couvrez chaque élément avec une petite marge autour des caractères visibles. Le [guide de masquage](/fr/blog/redact-screenshot/) explique comment vérifier le résultat.

## Annoter une capture envoyée par un client

Les clients envoient souvent une capture du problème. Pour leur montrer le détail qui leur a échappé :

1. Copiez l’image du client, ou enregistrez-la sur votre ordinateur.
2. Ouvrez un onglet d’éditeur. S’il n’y en a aucun d’ouvert, capturez n’importe quelle page avec **Zone visible** ; l’import remplace cette capture.
3. Appuyez sur `Ctrl+V` ou `⌘V` en dehors d’un champ de texte pour coller l’image, ou déposez le fichier image sur l’éditeur.
4. Ajoutez des flèches, des numéros d’étape ou du texte, et masquez ce que le client ne voulait pas partager.
5. Cliquez sur **Copier** et collez l’image annotée dans votre réponse.

La barre du haut affiche **Importée**, et tous les outils, le cadre et tous les formats d’export fonctionnent sur l’image. Un import remplace le canevas : l’éditeur demande donc une confirmation quand l’image actuelle contient des annotations.

## Limites

L’extension capture uniquement le contenu de la page. L’image ne montre pas la barre d’adresse : indiquez l’URL dans votre réponse quand le client doit ouvrir une page précise. Les pages internes du navigateur et les autres pages protégées bloquent la capture ; consultez [support et limites connues](/fr/support/).

Les captures et les modifications restent sur votre ordinateur. L’outil de help desk dans lequel vous collez l’image la stocke selon ses propres règles. La [référence des annotations](/fr/docs/#annotate) liste tous les outils. Pour les captures destinées à votre équipe de développement, consultez [captures d’écran pour les rapports de bug](/fr/use-cases/bug-reports/).
