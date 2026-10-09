---
title: Comment faire une capture d’écran pleine page dans Vivaldi
description: Capturez une page entière en PNG ou JPEG avec l’outil Capture de Vivaldi, limité à 30 000 pixels, et utilisez OpenScreenShot du Chrome Web Store.
order: 7
---

Vivaldi a un outil Capture intégré. Cliquez sur l’icône d’appareil photo dans la barre d’état, sélectionnez **Full Page** (Page entière), choisissez PNG, JPEG ou le presse-papiers, puis cliquez sur **Capture** (Capturer). Les captures Full Page s’arrêtent à 30 000 pixels. OpenScreenShot fonctionne aussi dans Vivaldi : Vivaldi est un navigateur Chromium et installe les extensions depuis le Chrome Web Store.

## Méthode intégrée

Vivaldi décrit l’outil dans [Capture a screenshot](https://help.vivaldi.com/desktop/tools/capture-a-screenshot/).

1. Ouvrez la page à capturer.
2. Cliquez sur l’icône d’appareil photo dans la barre d’état. Vous pouvez aussi ouvrir les Quick Commands avec `F2` sous Windows et Linux, ou `Cmd+E` sous macOS, et taper `Capture`.
3. Sélectionnez **Full Page** (Page entière).
4. Sélectionnez la sortie : **Save as PNG** (Enregistrer en PNG), **Save as JPEG** (Enregistrer en JPEG) ou **Copy to Clipboard** (Copier dans le presse-papiers).
5. Cliquez sur **Capture** (Capturer). Les fichiers enregistrés vont dans le dossier défini sous **Settings** (Paramètres) > **Webpages** (Pages web) > **Image Capture** (Capture d’image) > **Capture Storage Folder** (Dossier de stockage des captures).

Vivaldi peut aussi transformer une capture en nouvelle note dans le panneau Notes, avec la date de capture et l’URL de la page.

La [liste des raccourcis clavier de Vivaldi](https://help.vivaldi.com/desktop/shortcuts/keyboard-shortcuts/) n’indique aucune touche par défaut pour la capture de page. Pour en obtenir une, ouvrez **Settings** (Paramètres) > **Keyboard** (Clavier) et associez une touche à **Capture Page to disk** (Capturer la page sur le disque) ou à **Capture Page to Clipboard** (Capturer la page dans le presse-papiers).

## Limites

- **Taille.** Les captures Full Page vont jusqu’à 30 000 pixels au maximum. Sur une page plus longue, capturez les sections utiles.
- **Comportement non documenté.** Vivaldi ne documente pas comment il construit l’image pleine page, ni comment il traite les en-têtes fixes. Vérifiez le haut et le milieu de l’image à la recherche d’un en-tête manquant ou répété.
- **Chargement différé.** Les images marquées `loading="lazy"` se chargent seulement quand vous défilez près d’elles. Faites défiler la page avant de la capturer, sinon des parties de l’image peuvent rester vides.
- **Conteneurs à défilement interne.** Des développeurs signalent que les captures pleine page dans Chromium, Firefox et WebKit montrent une seule hauteur d’écran d’un panneau qui défile à l’intérieur d’un cadre de hauteur fixe. Vivaldi ne documente pas son comportement sur ce point : vérifiez donc les applications web et les sites de documentation dotés d’un panneau de contenu défilant.
- **Annotation.** Vivaldi ne documente aucun outil de dessin ou d’annotation pour les captures. Pour ajouter des flèches ou du texte, ouvrez le fichier dans une autre application.

## Avec OpenScreenShot

OpenScreenShot fait défiler la page un écran à la fois et assemble les parties en une seule image. Les en-têtes fixes sont capturés une seule fois en haut, et les pages qui font défiler un élément interne fonctionnent aussi. Une page de plus de 32 000 pixels physiques de haut est enregistrée en six images au maximum.

1. Ouvrez la [fiche OpenScreenShot](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp) dans Vivaldi et ajoutez l’extension. Vivaldi explique les installations depuis le Chrome Web Store dans son [aide sur les extensions](https://help.vivaldi.com/desktop/appearance-customization/extensions/).
2. Épinglez l’icône OpenScreenShot dans la barre d’outils.
3. Ouvrez la page et cliquez sur l’icône, ou appuyez sur `Ctrl+Shift+S` (`⌘⇧S` sur macOS). Avec les paramètres par défaut, une capture pleine page démarre et le résultat s’ouvre dans l’éditeur.
4. Vérifiez le haut, le bas et toute navigation collante.
5. Cliquez sur **Enregistrer l’image** et choisissez PNG, JPEG, WebP ou PDF, ou cliquez sur **Copier**.

Si l’icône ouvre un menu, sélectionnez **Page entière** ; le réglage **Mode Express en un clic** contrôle ce comportement. L’éditeur ajoute des flèches, du texte, des numéros d’étape, du flou et un recadrage avant l’export. La [référence des modes de capture](/fr/docs/#modes) et la [référence d’export](/fr/docs/#export) listent chaque option.

## Quelle méthode choisir

- Utilisez l’outil Capture de Vivaldi pour un PNG ou un JPEG d’une page de moins de 30 000 pixels, en particulier quand vous voulez la capture dans une note avec son URL.
- Utilisez OpenScreenShot pour les pages plus longues, les pages qui font défiler un panneau interne, ou les captures à annoter ou à enregistrer en PDF, comme pour la [documentation et les tutoriels](/fr/use-cases/documentation/) ou une [revue de design](/fr/use-cases/design-review/).
- Associez un raccourci Vivaldi si vous capturez souvent et n’avez pas besoin d’annotation.

Le [guide Opera](/fr/full-page-screenshot/opera/) et le [guide Brave](/fr/full-page-screenshot/brave/) traitent d’autres navigateurs Chromium dotés de leur propre outil de capture. Pour les pages qui bloquent les extensions, comme les paramètres du navigateur, consultez [support et limites connues](/fr/support/).
