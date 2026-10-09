---
title: Comment enregistrer une copie visuelle d’une page web
description: Capturez une page web entière en PNG ou en PDF, nommez les fichiers par date et domaine, et gérez les très longues pages enregistrées en plusieurs images.
order: 5
---

Pour garder une copie visuelle d’une page web, capturez-la avec **Page entière** et enregistrez-la en PNG ou en PDF, avec la date et le site dans le nom de fichier. OpenScreenShot fait défiler la page, assemble les parties en une seule image et enregistre le fichier sur votre ordinateur. Une capture d’écran montre l’apparence de la page sur votre écran ; elle ne prouve pas que la page était authentique ou non modifiée.

## Enregistrer une copie d’une page, étape par étape

1. Ouvrez les **Paramètres** depuis le popup ou le menu du clic droit sur l’icône de la barre d’outils. Réglez **Nom de fichier** sur un modèle qui contient `{date}` et `{domain}`, par exemple `Archive/{domain}/{date}_{title}`.
2. Ouvrez la page. Faites-la défiler une fois pour charger les images en chargement différé et les commentaires, puis revenez en haut.
3. Cliquez sur l’icône OpenScreenShot. Avec les paramètres par défaut, cela lance une capture **Page entière** et ouvre le résultat dans l’**Éditeur**.
4. Vérifiez le haut, le bas et chaque section qui se charge pendant le défilement.
5. Cliquez sur **Enregistrer l’image**. Dans la boîte **Exporter**, choisissez **PNG** ou **PDF**, vérifiez le nom de fichier et cliquez sur **Exporter**.

Pour enregistrer sans passer par l’éditeur, réglez **Après capture** sur **Télécharger** dans les **Paramètres**. Chaque capture va alors directement dans votre dossier de téléchargements, en PNG, nommée selon votre modèle.

## PNG ou PDF ?

Choisissez **PNG** pour garder chaque pixel de la capture. Le format est sans perte : le texte de l’interface reste net, et n’importe quelle visionneuse d’images peut l’ouvrir.

Choisissez **PDF** quand la copie va dans un dossier de documents ou doit être imprimée. Sous **Taille de page**, **Entière** crée une seule page à la taille de l’image. **A4** ou **Letter** avec **Répartir sur plusieurs pages** divise une longue capture en pages qui se chevauchent de 5 mm. Le PDF contient la capture sous forme d’image : son texte n’est ni cherchable ni sélectionnable. Le [guide capture vers PDF](/fr/blog/save-screenshot-as-pdf/) compare les mises en page.

## Nommer les fichiers pour les retrouver plus tard

Le modèle de nom de fichier accepte ces jetons :

- `{date}` : la date au format AAAA-MM-JJ, selon l’horloge de votre ordinateur
- `{time}` : l’heure au format HHMMSS
- `{domain}` : le nom d’hôte du site, sans `www.`
- `{title}` : le titre de la page, où les caractères interdits dans les noms de fichier sont remplacés
- `{w}` et `{h}` : la largeur et la hauteur de l’image en pixels

Un `/` dans le modèle enregistre dans un dossier à l’intérieur de Téléchargements : `Archive/{domain}/{date}_{title}` trie donc les copies par site, puis par date. L’aperçu en direct dans les **Paramètres** montre le résultat avant la capture.

## Très longues pages

Une image peut contenir une page jusqu’à 32 000 pixels physiques de haut. Une page plus haute est enregistrée en six images au maximum. Avec **Télécharger**, chaque partie reçoit un nom selon votre modèle, avec un suffixe tel que `_part1of3`. Avec **Éditeur** ou **Presse-papiers**, chaque partie s’ouvre dans son propre onglet d’éditeur, où vous l’exportez séparément.

Une page trop haute pour six images est refusée avec un message d’erreur. Capturez alors les sections utiles avec **Zone visible** ou **Zone sélectionnée**. Le [guide de capture pleine page](/fr/blog/full-page-screenshot-chrome/) traite d’autres cas, comme les zones de défilement imbriquées et les en-têtes fixes.

## Ce qu’une capture d’écran peut montrer, et ce qu’elle ne peut pas montrer

Une capture d’écran est une trace visuelle de ce que votre navigateur affichait à un moment donné. Elle n’a ni signature ni contrôle d’intégrité, et tout le monde peut modifier un fichier image. Le jeton `{date}` provient de l’horloge de votre ordinateur au moment où le fichier est nommé. Si vous avez besoin d’une preuve qu’une page existait sous une certaine forme, utilisez un service conçu pour cela, et gardez la capture comme référence personnelle.

Une capture pleine page manque aussi le contenu que la page n’a jamais affiché : les sections repliées, les autres onglets d’une page, les flux infinis au-delà du point où vous avez défilé, et le contenu derrière une connexion que vous n’avez pas ouverte.

## Où les copies sont stockées

OpenScreenShot traite les captures dans votre navigateur et les stocke dans le stockage local de votre appareil. Il ne les envoie à aucun serveur. Les fichiers exportés vont dans votre dossier de téléchargements. Ils restent sur votre ordinateur jusqu’à ce que vous les partagiez ou les mettiez en ligne, et le service qui les reçoit applique ses propres règles de stockage. Consultez la [politique de confidentialité](/fr/privacy/) pour les détails.

La [référence des paramètres](/fr/docs/#settings) décrit le modèle de nom de fichier. Pour annoter une capture à l’intention de vos collègues, consultez [capturer une page pour une revue de design](/fr/use-cases/design-review/).
