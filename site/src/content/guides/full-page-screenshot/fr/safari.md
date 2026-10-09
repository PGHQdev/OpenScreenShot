---
title: Comment faire une capture d’écran pleine page dans Safari
description: Safari sur Mac n’a pas de capture d’image pleine page. Enregistrez la page en PDF, capturez un élément dans Web Inspector ou utilisez un autre navigateur.
order: 4
---

Safari sur Mac n’a pas de commande de capture d’écran pleine page. L’option intégrée la plus proche est un PDF : choisissez **File** (Fichier) > **Print** (Imprimer), cliquez sur **PDF** en bas de la boîte de dialogue et enregistrez le fichier. Pour un fichier image, le Web Inspector de Safari peut capturer un élément de la page. OpenScreenShot n’a pas de version Safari. Safari installe les Safari Web Extensions depuis le Mac App Store et ne peut pas installer les paquets du Chrome Web Store ni les modules Firefox. Sur un Mac, Chrome, Firefox, Edge et d’autres navigateurs peuvent exécuter OpenScreenShot.

## Méthode intégrée

### Enregistrer la page en PDF

Apple décrit cette méthode dans [Print or create a PDF of a webpage in Safari](https://support.apple.com/guide/safari/print-or-create-a-pdf-of-a-webpage-ibrw1060/18.0/mac/15.0).

1. Ouvrez la page à conserver.
2. Faites défiler la page une fois pour que les images qui se chargent tard soient chargées.
3. Choisissez **File** (Fichier) > **Print** (Imprimer).
4. Pour garder les couleurs de la page, activez l’impression des images et des couleurs d’arrière-plan dans les options d’impression. Vous pouvez aussi ajouter l’adresse web et la date dans les en-têtes et les pieds de page.
5. Cliquez sur **PDF** en bas de la boîte de dialogue et enregistrez le fichier.

### Capturer un élément dans Web Inspector

1. Choisissez **Safari** > **Settings** (Réglages) > **Advanced** (Avancés) et sélectionnez **Show features for web developers** (Afficher les fonctionnalités pour les développeurs web). WebKit l’explique dans [Enabling Web Inspector](https://webkit.org/web-inspector/enabling-web-inspector/).
2. Ouvrez la page et appuyez sur `Option+Cmd+I` pour ouvrir Web Inspector.
3. Dans l’onglet **Elements** (Éléments), faites un clic droit sur un nœud, par exemple `<html>` ou `<body>`, et sélectionnez **Capture Screenshot** (Prendre une capture d’écran).
4. Safari enregistre l’instantané de ce nœud dans un fichier.

Apple ne documente pas si une capture de `<html>` inclut le contenu sous la partie visible de la page, ni le format d’image produit. Vérifiez le fichier avant de vous y fier.

## Limites

- **Pas d’image pleine page.** Aucune des deux méthodes ne donne la capture que produirait un outil de capture pleine page. Le PDF est une version imprimée de la page, et l’entrée de Web Inspector capture un seul nœud.
- **Mise en page d’impression.** Le PDF utilise la mise en page d’impression : la page du fichier peut donc différer de la page à l’écran. Activez les images et les couleurs d’arrière-plan si le design en dépend.
- **Chargement différé.** Les images marquées `loading="lazy"` se chargent seulement quand vous défilez près d’elles. Faites défiler la page avant de l’imprimer ou de la capturer, sinon des parties peuvent rester vides.
- **Conteneurs à défilement interne.** Des développeurs signalent que les captures pleine page automatisées dans WebKit, le moteur de Safari, montrent une seule hauteur d’écran quand une page fait défiler un panneau à l’intérieur d’un cadre de hauteur fixe. Vérifiez avec soin les pages construites de cette façon.
- **En-têtes collants.** Vérifiez dans le résultat qu’aucun en-tête n’est manquant, répété ou mal placé.

## Avec OpenScreenShot

OpenScreenShot n’est pas disponible pour Safari. Si vous avez Chrome, Firefox, Edge, Brave, Opera, Vivaldi ou Arc sur le même Mac, ouvrez la page dans ce navigateur et utilisez l’extension. Chrome et les autres navigateurs Chromium l’installent depuis le [Chrome Web Store](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp). Firefox l’installe depuis [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/openscreenshot/).

1. Installez OpenScreenShot dans l’autre navigateur et épinglez son icône dans la barre d’outils.
2. Ouvrez la page et cliquez sur l’icône. Dans Chrome, `⌘⇧S` lance aussi une capture pleine page.
3. Vérifiez le résultat dans l’éditeur.
4. Cliquez sur **Enregistrer l’image** et choisissez PNG, JPEG, WebP ou PDF.

L’extension fait défiler la page, assemble les parties en une seule image et place les en-têtes fixes une seule fois en haut. Une page de plus de 32 000 pixels physiques de haut est enregistrée en six images au maximum. Le [guide Chrome](/fr/full-page-screenshot/chrome/) et le [guide Firefox](/fr/full-page-screenshot/firefox/) donnent les étapes pour chaque navigateur, y compris leurs propres outils intégrés.

## Quelle méthode choisir

- Utilisez **File** (Fichier) > **Print** (Imprimer) > **PDF** dans Safari pour garder une copie lisible d’un article ou d’une page de reçu.
- Utilisez **Capture Screenshot** (Prendre une capture d’écran) de Web Inspector pour une image d’une partie de page, comme une carte ou un graphique.
- Utilisez OpenScreenShot dans un autre navigateur de votre Mac pour une image pleine page à annoter, ou pour un PDF de la page telle qu’elle apparaît à l’écran. Le [guide capture vers PDF](/fr/blog/save-screenshot-as-pdf/) compare les mises en page PDF, et [enregistrer une copie visuelle d’une page](/fr/use-cases/archive-web-pages/) traite du nommage et du stockage.

Pour d’autres questions, consultez [support et limites connues](/fr/support/).
