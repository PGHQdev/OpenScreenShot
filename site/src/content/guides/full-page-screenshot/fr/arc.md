---
title: Comment faire une capture d’écran pleine page dans Arc
description: Lancez Capture Full Page d’Arc sur macOS pour enregistrer un PNG, sachez ce qu’Arc ne documente pas, et utilisez OpenScreenShot du Chrome Web Store.
order: 8
---

Arc pour macOS a une commande **Capture Full Page** (Capturer la page entière). Appuyez sur `Cmd+T` pour ouvrir la Command Bar, tapez `Capture Full Page` et sélectionnez la commande. Arc télécharge un PNG de toute la page dans votre dossier de téléchargement par défaut. L’aide d’Arc documente cette commande pour macOS uniquement. OpenScreenShot fonctionne aussi dans Arc : Arc est un navigateur Chromium et installe les extensions depuis le Chrome Web Store.

## Méthode intégrée

Arc décrit la commande dans [How to take full page screen captures in Arc](https://resources.arc.net/hc/en-us/articles/25481392111895-How-To-Take-Full-Page-Screen-Captures-in-Arc).

1. Ouvrez la page à capturer.
2. Appuyez sur `Cmd+T` pour ouvrir la Command Bar, tapez `Capture Full Page` et sélectionnez la commande. Vous pouvez aussi choisir **File** (Fichier) > **Capture Full Page** (Capturer la page entière).
3. Arc télécharge un PNG dans votre dossier de téléchargement par défaut.

La commande n’a pas de raccourci par défaut. Pour en ajouter un, ouvrez **Arc** > **Settings** (Réglages) > **Shortcuts** (Raccourcis), recherchez `capture` et attribuez une touche à **Capture Full Page** (Capturer la page entière).

Pour une capture mise en forme, activez le [Developer Mode](https://resources.arc.net/hc/en-us/articles/20468488031511-Developer-Mode-Instant-Dev-Tools) et utilisez le bouton de capture dans la barre d’outils, ou lancez **Capture in Portrait Mode** (Capturer en mode portrait) depuis la Command Bar. L’outil Capture séparé d’Arc prend une sélection avec édition et Easels, et il est lui aussi réservé à macOS.

## Limites

- **macOS uniquement.** Arc ne documente aucune commande pleine page pour Arc sous Windows.
- **Comportement non documenté.** Arc ne documente pas comment il construit l’image, sa limite de taille ni son traitement des en-têtes fixes. Vérifiez le haut et le milieu du PNG à la recherche d’un en-tête manquant ou répété.
- **Annotation.** Arc ne documente aucune édition pour les captures pleine page. Pour ajouter des flèches ou du texte, ouvrez le PNG dans une autre application.
- **Chargement différé.** Les images marquées `loading="lazy"` se chargent seulement quand vous défilez près d’elles. Faites défiler la page avant de la capturer, sinon des parties de l’image peuvent rester vides.
- **Conteneurs à défilement interne.** Des développeurs signalent que les captures pleine page dans Chromium, Firefox et WebKit montrent une seule hauteur d’écran d’un panneau qui défile à l’intérieur d’un cadre de hauteur fixe. Vérifiez les applications web et les sites de documentation dotés d’un panneau de contenu défilant.
- **Défilement infini.** Un flux qui continue de se charger n’a pas de vrai bas de page. La capture contient seulement ce qui était chargé avant de commencer.

## Avec OpenScreenShot

OpenScreenShot fait défiler la page un écran à la fois et assemble les parties en une seule image. Les en-têtes fixes sont capturés une seule fois en haut, et les pages qui font défiler un élément interne fonctionnent aussi. Une page de plus de 32 000 pixels physiques de haut est enregistrée en six images au maximum.

1. Ouvrez la [fiche OpenScreenShot](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp) dans Arc et ajoutez l’extension. Arc explique les installations depuis le Chrome Web Store dans [Extensions in Arc](https://resources.arc.net/hc/en-us/articles/19434259167767-Extensions-in-Arc-How-to-Import-Add-Open).
2. Épinglez l’icône OpenScreenShot.
3. Ouvrez la page et cliquez sur l’icône, ou appuyez sur `⌘⇧S`. Avec les paramètres par défaut, une capture pleine page démarre et le résultat s’ouvre dans l’éditeur.
4. Vérifiez le haut, le bas et toute navigation collante.
5. Cliquez sur **Enregistrer l’image** et choisissez PNG, JPEG, WebP ou PDF, ou cliquez sur **Copier**.

Si l’icône ouvre un menu, sélectionnez **Page entière** ; le réglage **Mode Express en un clic** contrôle ce comportement. Pour mettre en forme la capture dans OpenScreenShot, ouvrez le panneau **Beautify** dans l’éditeur : il ajoute des marges, des coins arrondis, une ombre et un fond en dégradé, uni ou transparent, et le cadre est inclus dans chaque export. La [référence des modes de capture](/fr/docs/#modes) et la [référence d’export](/fr/docs/#export) listent chaque option.

## Quelle méthode choisir

- Utilisez **Capture Full Page** (Capturer la page entière) dans Arc sur macOS pour un PNG rapide d’une page qui fait défiler toute la fenêtre.
- Utilisez OpenScreenShot sur les pages qui font défiler un panneau interne, ou quand vous voulez annoter, masquer ou enregistrer la capture en PDF, comme pour une [revue de design](/fr/use-cases/design-review/).
- Utilisez le panneau **Beautify** d’OpenScreenShot pour une image mise en forme avec vos propres marges et votre propre fond, comme pour les [captures d’écran sur les réseaux sociaux](/fr/use-cases/social-media/).

Le [guide Chrome](/fr/full-page-screenshot/chrome/) compare la capture DevTools de Chrome avec l’extension, et le [guide Brave](/fr/full-page-screenshot/brave/) traite d’un autre navigateur Chromium doté d’un outil intégré. Pour les pages qui bloquent les extensions, comme les paramètres du navigateur, consultez [support et limites connues](/fr/support/).
