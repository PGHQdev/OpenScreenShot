---
title: Comment faire des captures d’écran pour la documentation et les tutoriels
description: Gardez la même taille pour les captures d’un tutoriel, numérotez les étapes, mettez en évidence le bon contrôle et rangez chaque fichier dans un dossier docs.
order: 3
---

Pour la documentation d’aide et les tutoriels, capturez chaque écran de la même façon, numérotez les actions et exportez chaque image à la même largeur. Dans OpenScreenShot, indiquez une largeur exacte en pixels sous **Échelle** dans la boîte **Exporter**, ajoutez des badges **Numéro d’étape** pour chaque action, et utilisez **Spotlight** pour guider le lecteur vers le bon contrôle. Un modèle de nom de fichier comme `Docs/{title}` enregistre chaque image dans un dossier à l’intérieur de Téléchargements.

## Faire une capture de tutoriel, étape par étape

1. Donnez à la fenêtre du navigateur la même taille pour chaque capture de l’article. Utilisez à chaque fois le même thème et le même niveau de zoom.
2. Capturez l’écran. **Zone sélectionnée** ou **Capturer un élément**, dans le menu du clic droit, limite l’image à la partie de l’interface concernée par l’étape.
3. Dans l’**Éditeur**, ajoutez un **Numéro d’étape** (`S`) sur chaque contrôle, dans l’ordre où le lecteur les utilise.
4. Ajoutez un **Spotlight** (`O`) sur la zone importante quand l’écran contient beaucoup d’autres éléments.
5. Couvrez les données client d’exemple, les vraies adresses e-mail et les clés d’API avec **Flou** (`B`) et le remplissage **Uni**.
6. Si vous le souhaitez, ouvrez **Beautify** dans la barre du haut pour ajouter des marges, des coins arrondis et une ombre.
7. Cliquez sur **Enregistrer l’image**. Dans la boîte **Exporter**, choisissez **PNG**, saisissez la largeur de votre page sous **Échelle**, vérifiez le nom de fichier et cliquez sur **Exporter**.

## Garder la même taille pour chaque image

Les lecteurs remarquent quand les captures d’un même article changent de taille d’une étape à l’autre. Sous **Échelle**, choisissez 25, 50, 100 ou 200 %, ou saisissez une largeur exacte en pixels. Une largeur fixe aligne chaque image d’un article sur la colonne de contenu de votre site de documentation.

Activez **Mémoriser ces paramètres** dans la boîte **Exporter** pour garder le format et la qualité comme nouvelles valeurs par défaut. La largeur ne fait pas partie de ces valeurs par défaut : saisissez-la à nouveau à chaque export. Une largeur au-delà de la limite de canevas de Chrome est refusée, si bien que l’extension n’écrit jamais de fichier vide.

Le PNG garde le texte de l’interface net, car il est sans perte. Utilisez JPEG ou WebP seulement quand votre plateforme de documentation limite la taille des fichiers.

## Numéroter des étapes qui restent dans l’ordre

Les badges **Numéro d’étape** s’incrémentent seuls : le premier clic place 1, le suivant place 2. Quand vous supprimez un badge, les autres sont renumérotés : vous pouvez donc retirer une étape sans modifier tous les numéros suivants. Faites correspondre les numéros de l’image à la liste numérotée de votre article.

Utilisez la palette de huit couleurs sur les touches `1`–`8`. L’éditeur mémorise votre couleur, l’épaisseur du trait et la taille de police d’une session à l’autre : les captures d’un même article gardent ainsi le même style.

## Mettre en évidence et encadrer

**Spotlight** garde une ou plusieurs zones éclairées et assombrit le reste. Les découpes peuvent être un rectangle, un rectangle arrondi ou une ellipse. Pour une longue page de paramètres, l’outil **Cut** (`X`) retire les bandes horizontales inutiles au lecteur, avec un aperçu en direct avant de l’appliquer.

Le panneau **Beautify**, appelé cadre Beautify dans la [documentation](/fr/docs/#annotate), ajoute des marges, un rayon d’angle, une ombre portée et un fond autour de la capture. Le cadre est inclus dans chaque export et dans le presse-papiers. Choisissez une apparence et utilisez-la pour chaque image de la documentation.

## Nommer et ranger les images

Ouvrez les **Paramètres** depuis le popup ou le menu du clic droit sur l’icône de la barre d’outils, puis modifiez **Nom de fichier**. Cliquez sur un jeton pour insérer `{date}`, `{time}`, `{title}`, `{domain}`, `{w}` ou `{h}`, et vérifiez l’aperçu en direct.

Ajoutez `/` pour enregistrer dans un dossier à l’intérieur de Téléchargements. Par exemple, `Docs/{title}` enregistre chaque image dans un dossier `Docs`, sous le titre de la page. Le jeton `{title}` remplace les caractères interdits dans les noms de fichier : un `/` dans le titre d’une page ne crée donc pas un autre dossier. La boîte **Exporter** montre le nom de fichier avant l’enregistrement, et vous pouvez le modifier à cet endroit.

## Limites

Les captures d’interface deviennent obsolètes quand le produit change. Gardez le titre de la page ou l’URL dans le nom de fichier pour retrouver et remplacer les anciennes images. Une capture du navigateur montre uniquement le contenu de la page ; elle n’inclut ni la barre d’adresse ni la barre d’outils du navigateur.

La [référence d’export](/fr/docs/#export) et la [référence des paramètres](/fr/docs/#settings) listent chaque option. Pour préparer une image destinée à une publication, consultez [partager des captures d’écran sur les réseaux sociaux](/fr/use-cases/social-media/).
