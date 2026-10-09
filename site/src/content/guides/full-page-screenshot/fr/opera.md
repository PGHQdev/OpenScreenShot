---
title: Comment faire une capture d’écran pleine page dans Opera
description: L’outil Snapshot d’Opera enregistre une page entière en PDF uniquement. Voyez les étapes et les limites, et capturez une image pleine page avec OpenScreenShot.
order: 6
---

L’outil Snapshot intégré d’Opera capture une sélection ou la zone visible en image, et la page entière seulement en PDF. Appuyez sur `Shift+Ctrl+5` (`Shift+Cmd+2` sur macOS) et sélectionnez **Save page as PDF** (Enregistrer la page en PDF). Pour un fichier image de la page entière, installez OpenScreenShot. Opera est un navigateur Chromium et l’installe depuis le Chrome Web Store une fois que vous avez ajouté le module **Install Chrome Extensions** d’Opera.

## Méthode intégrée

Opera décrit Snapshot sur sa [page d’aide des fonctionnalités](https://help.opera.com/en/latest/features/) et sur sa [page Snapshot](https://www.opera.com/features/snapshot).

1. Ouvrez la page à capturer.
2. Appuyez sur `Shift+Ctrl+5` sous Windows et Linux, ou sur `Shift+Cmd+2` sous macOS. Vous pouvez aussi cliquer sur l’icône d’appareil photo à droite de la barre d’outils.
3. Sélectionnez **Save page as PDF** (Enregistrer la page en PDF). Opera enregistre la page entière, de haut en bas, en PDF.

Snapshot a deux options d’image. **Capture Full Screen** (Capturer tout l’écran) capture seulement la zone visible de la page, et **Capture** (Capturer) capture un cadre que vous ajustez. Les deux donnent une image que vous pouvez annoter avec Zoom, Arrow, Blur, Highlight, Pencil, Selfie camera, Emojis et Text, puis enregistrer en PNG avec **Save Image** (Enregistrer l’image) ou copier dans le presse-papiers.

## Limites

- **PDF seulement pour la page entière.** Les captures en image couvrent la zone visible ou une sélection. Pour obtenir toute la page, vous obtenez un PDF.
- **Mise en page non documentée.** Opera ne documente pas si le PDF tient sur une longue page ou sur plusieurs pages, comment il traite les en-têtes fixes, ni comment il gère une page qui fait défiler un panneau à l’intérieur d’un cadre de hauteur fixe. Ouvrez le PDF et vérifiez-le avant de le partager.
- **Chargement différé.** Les images marquées `loading="lazy"` se chargent seulement quand vous défilez près d’elles. Faites défiler la page avant de l’enregistrer, sinon des parties peuvent rester vides.
- **Défilement infini.** Un flux qui continue de se charger n’a pas de vrai bas de page. Toute capture contient seulement ce qui était chargé avant de commencer.

## Avec OpenScreenShot

OpenScreenShot fait défiler la page, la capture en plusieurs parties et assemble les parties en une seule image. Les en-têtes fixes sont capturés une seule fois en haut, et les pages qui font défiler un élément interne fonctionnent aussi. Une page de plus de 32 000 pixels physiques de haut est enregistrée en six images au maximum.

1. Ajoutez le module **Install Chrome Extensions** depuis les modules Opera. Opera l’explique dans [Using add-ons from Chrome in Opera](https://blogs.opera.com/tips-and-tricks/2021/10/using-addons-from-chrome-in-opera/).
2. Ouvrez la [fiche OpenScreenShot](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp) et ajoutez l’extension.
3. Épinglez l’icône OpenScreenShot dans la barre d’outils.
4. Ouvrez la page et cliquez sur l’icône, ou appuyez sur `Ctrl+Shift+S` (`⌘⇧S` sur macOS). Avec les paramètres par défaut, une capture pleine page démarre et le résultat s’ouvre dans l’éditeur.
5. Vérifiez le haut, le bas et toute navigation collante.
6. Cliquez sur **Enregistrer l’image** et choisissez PNG, JPEG, WebP ou PDF, ou cliquez sur **Copier**.

Si l’icône ouvre un menu, sélectionnez **Page entière** ; le réglage **Mode Express en un clic** contrôle ce comportement. Un PDF d’OpenScreenShot contient la capture sous forme d’image : il ressemble à la page à l’écran, mais son texte n’est ni cherchable ni sélectionnable. Sous **Taille de page**, **Entière** crée une seule page à la taille de l’image, et **A4** ou **Letter** peut répartir une longue capture sur plusieurs pages. Le [guide capture vers PDF](/fr/blog/save-screenshot-as-pdf/) compare ces mises en page.

## Quelle méthode choisir

- Utilisez **Save page as PDF** (Enregistrer la page en PDF) de Snapshot pour un PDF rapide de la page entière, sans installation.
- Utilisez les options d’image de Snapshot pour la zone visible ou une sélection avec quelques annotations.
- Utilisez OpenScreenShot pour un PNG, un JPEG ou un WebP de la page entière, pour les pages qui font défiler un panneau interne, ou pour un PDF fidèle à l’écran, comme pour une [revue de design](/fr/use-cases/design-review/) ou une [copie enregistrée d’une page](/fr/use-cases/archive-web-pages/).

La [référence des modes de capture](/fr/docs/#modes) et la [référence d’export](/fr/docs/#export) listent chaque option. Le [guide Vivaldi](/fr/full-page-screenshot/vivaldi/) traite d’un autre navigateur Chromium doté de son propre outil de capture. Pour les pages qui bloquent les extensions, comme les paramètres du navigateur, consultez [support et limites connues](/fr/support/).
