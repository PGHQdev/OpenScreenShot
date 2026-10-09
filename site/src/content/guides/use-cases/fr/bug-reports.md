---
title: Comment faire des captures d’écran pour les rapports de bug
description: Capturez la partie défaillante d’une page, marquez-la avec des flèches et des numéros d’étape, masquez jetons et e-mails, puis collez l’image dans un ticket.
order: 1
---

Pour un rapport de bug, capturez seulement la partie de la page qui montre le problème, marquez ce qui ne va pas, et masquez toute donnée privée avant de coller l’image dans le ticket. Dans OpenScreenShot, utilisez **Zone sélectionnée** ou **Capturer un élément** pour la capture, les outils **Flèche** et **Numéro d’étape** pour les marques, et **Flou** avec le remplissage **Uni** pour le masquage. Indiquez l’URL, le navigateur et les étapes de reproduction dans le texte du ticket : la capture montre le contenu de la page sans la barre d’adresse.

## Capturer et marquer un bug, étape par étape

1. Ouvrez la page et amenez-la dans l’état défaillant. Fermez les bandeaux qui cachent le problème.
2. Faites un clic droit sur la page, ouvrez le sous-menu **OpenScreenShot** et choisissez **Zone sélectionnée** ou **Capturer un élément**. Avec les paramètres par défaut, un clic sur l’icône de la barre d’outils capture plutôt la page entière.
3. Pour une zone, tracez un rectangle autour du problème, avec assez d’interface autour pour savoir où il se trouve. Appuyez sur `Enter` pour confirmer. Pour un élément, survolez la page jusqu’à ce que la carte, le tableau ou le formulaire voulu soit entouré, puis cliquez ou appuyez sur `Enter`.
4. Dans l’**Éditeur**, ajoutez une **Flèche** (`A`) sur le détail défaillant. Ajoutez un **Numéro d’étape** (`S`) pour chaque action quand le bug demande plusieurs clics pour être reproduit.
5. Sélectionnez **Flou** (`B`), choisissez **Uni** sous **Masquage**, et couvrez les jetons d’accès, les adresses e-mail, les noms de compte et les noms d’hôte internes.
6. Cliquez sur **Copier**, ou appuyez sur `Ctrl+C` (`⌘C` sur macOS), et collez l’image dans le ticket.

En mode élément, `↑` sélectionne l’élément parent et `↓` l’enfant, ce qui aide quand le contour tombe sur un conteneur trop petit ou trop grand. Si l’élément n’est pas entièrement visible, le sélecteur propose une capture pleine page à la place.

## Capturer les états de survol, les menus déroulants et les infobulles

Un menu ou une infobulle se ferme souvent quand vous cliquez ailleurs. Réglez le **Délai** sur 3, 5 ou 10 secondes dans le popup ou dans les **Paramètres**, lancez la capture, puis ouvrez le menu avant la fin du compte à rebours du badge de la barre d’outils.

Le délai s’écoule avant le début de la sélection de zone : un glisser peut donc encore fermer le menu. Pour un état de survol, utilisez **Zone visible** avec un délai, puis recadrez avec **Recadrer** (`C`). Vous pouvez aussi sélectionner la zone une fois, puis utiliser **Répéter la zone** depuis le menu du clic droit avec un délai : la même zone est capturée sans nouveau glisser.

## Passer l’éditeur avec l’action Presse-papiers

Quand une capture n’a besoin d’aucune marque, réglez **Après capture** sur **Presse-papiers** dans le popup ou dans les **Paramètres**. Chaque capture va alors directement dans le presse-papiers, et le badge de la barre d’outils le confirme. Collez l’image dans le ticket avec `Ctrl+V` ou `⌘V`.

Ce réglage s’applique aussi aux raccourcis clavier et au menu du clic droit. Revenez à **Éditeur** quand vous devez annoter ou masquer. Une capture vers le presse-papiers saute l’étape de masquage : vérifiez donc que la page ne montre aucune donnée privée avant de la capturer.

## Quoi écrire à côté de la capture

Une capture montre ce qui ne va pas. Le texte du ticket donne le contexte dont un développeur a besoin pour reproduire le problème :

- l’URL de la page, sans les paramètres de requête privés
- le nom et la version du navigateur, et le système d’exploitation
- les étapes de reproduction, dans le même ordre que les numéros d’étape de l’image
- ce que vous attendiez et ce qui s’est passé à la place
- l’heure du problème, si la page affiche des données en direct

Gardez un seul problème par capture. Un deuxième bug dans la même image rend flou celui que la flèche désigne.

## Limites

Le flou et la mosaïque adoucissent les pixels, mais ils peuvent laisser deviner un texte court. **Uni** couvre entièrement la zone dans l’export ; le [guide de masquage](/fr/blog/redact-screenshot/) explique comment vérifier le résultat. Les pages internes du navigateur et les autres pages protégées bloquent la capture par les extensions ; consultez [support et limites connues](/fr/support/).

La [référence des modes de capture](/fr/docs/#modes) décrit les contrôles de sélection, et la [référence des annotations](/fr/docs/#annotate) liste chaque outil et chaque raccourci. Pour répondre aux utilisateurs qui signalent un problème, consultez [captures d’écran pour le support client](/fr/use-cases/customer-support/). Pour montrer le bug en mouvement, consultez [vidéos de démonstration produit](/fr/use-cases/product-demos/).
