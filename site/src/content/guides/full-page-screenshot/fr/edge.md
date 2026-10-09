---
title: Comment faire une capture d’écran pleine page dans Microsoft Edge
description: Capturez une page entière avec l’outil Screenshot d’Edge ou sa commande DevTools, voyez les limites, et utilisez OpenScreenShot du Chrome Web Store.
order: 2
---

Microsoft Edge a un outil Screenshot intégré, autrefois nommé Web capture. Appuyez sur `Ctrl+Shift+S`, sélectionnez **Capture full page** (Capturer la page entière), puis copiez la capture ou enregistrez-la sur votre appareil. OpenScreenShot fonctionne aussi dans Edge : Edge est un navigateur Chromium et l’installe depuis le Chrome Web Store une fois que vous autorisez les extensions d’autres boutiques.

## Méthode intégrée

Microsoft décrit l’outil dans son [guide des captures d’écran dans Edge](https://www.microsoft.com/en-us/edge/learning-center/screenshot-webpage).

1. Ouvrez la page à capturer.
2. Appuyez sur `Ctrl+Shift+S`. Vous pouvez aussi faire un clic droit sur la page et sélectionner **Screenshot** (Capture d’écran), ou ouvrir **Settings and more** (Paramètres et plus) (**...**) et sélectionner **Screenshot** (Capture d’écran).
3. Sélectionnez **Capture full page** (Capturer la page entière), l’option du milieu.
4. Dans l’aperçu, utilisez les outils de dessin pour annoter la capture si besoin.
5. Copiez la capture, ou enregistrez-la sur votre appareil.

Microsoft indique que la disponibilité des fonctionnalités peut varier selon le type d’appareil, le marché et la version du navigateur. Les administrateurs peuvent aussi désactiver l’outil avec la [stratégie WebCaptureEnabled](https://learn.microsoft.com/en-us/deployedge/microsoft-edge-policies/webcaptureenabled). Sur un ordinateur professionnel, l’absence de l’entrée **Screenshot** (Capture d’écran) peut signifier que cette stratégie est définie.

Edge a aussi la capture des DevTools de Chromium. Ouvrez les DevTools, activez la Device Emulation, ouvrez **More options** (Plus d’options) et sélectionnez **Capture a full size screenshot** (Capturer une capture d’écran en taille réelle). Microsoft le documente dans son [article sur le Device Mode](https://learn.microsoft.com/en-us/microsoft-edge/devtools/device-mode/). Le [guide Chrome](/fr/full-page-screenshot/chrome/) compare cette méthode avec une extension.

## Limites

- **Comportement non documenté.** Microsoft ne documente pas comment l’outil Screenshot construit une image pleine page, la longueur maximale d’une page, ni son traitement des en-têtes collants, du chargement différé et des conteneurs à défilement interne. Vérifiez chaque capture avant de la partager.
- **Conteneurs à défilement interne.** Des utilisateurs de Microsoft Q&A signalent que la capture pleine page a échoué sur des pages qui défilent à l’intérieur d’un élément interne, par exemple une application web dotée d’un panneau de contenu défilant. Microsoft ne l’a pas confirmé.
- **Taille de page des DevTools.** La capture des DevTools utilise la commande de capture de Chromium, qui refuse une page de 131 072 pixels CSS ou plus en largeur ou en hauteur, avec l’erreur « Page is too large. »
- **Chargement différé.** Les images marquées `loading="lazy"` se chargent seulement quand vous défilez près d’elles. Faites défiler la page avant de la capturer, sinon des parties de l’image peuvent rester vides.
- **En-têtes collants.** Un outil de capture qui fait défiler la page et assemble plusieurs parties répète tout élément qui reste à l’écran. Cherchez un en-tête qui apparaît plusieurs fois le long de l’image.

## Avec OpenScreenShot

OpenScreenShot fait défiler la page, la capture en plusieurs parties et assemble les parties en une seule image. Les en-têtes fixes sont capturés une seule fois en haut, et les pages qui font défiler un élément interne fonctionnent aussi. Une page de plus de 32 000 pixels physiques de haut est enregistrée en six images au maximum.

1. Ouvrez la [fiche OpenScreenShot](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp) dans Edge. Quand Edge le demande, sélectionnez **Allow extensions from other stores** (Autoriser les extensions provenant d’autres magasins), puis ajoutez l’extension. Microsoft explique cette étape dans son [aide sur les extensions](https://support.microsoft.com/en-us/edge/add-turn-off-or-remove-extensions-in-microsoft-edge).
2. Épinglez l’icône OpenScreenShot dans la barre d’outils.
3. Ouvrez la page et cliquez sur l’icône. Avec les paramètres par défaut, une capture pleine page démarre et le résultat s’ouvre dans l’éditeur.
4. Vérifiez le haut, le bas et chaque section qui se charge pendant le défilement.
5. Cliquez sur **Enregistrer l’image** et choisissez PNG, JPEG, WebP ou PDF, ou cliquez sur **Copier**.

Le raccourci pleine page d’OpenScreenShot est `Ctrl+Shift+S`, les mêmes touches que l’outil Screenshot d’Edge. Si les touches ouvrent l’outil d’Edge, cliquez plutôt sur l’icône, ou définissez une autre touche avec le lien **Raccourcis** du menu de capture. La [référence des modes de capture](/fr/docs/#modes) liste les autres modes.

## Quelle méthode choisir

- Utilisez l’outil Screenshot d’Edge pour une capture rapide avec quelques traits de stylo, sur une page qui fait défiler toute la fenêtre.
- Utilisez OpenScreenShot quand une page fait défiler un panneau interne, quand vous avez besoin d’un export en PDF, JPEG ou WebP, ou quand il vous faut des numéros d’étape et un masquage uni, comme pour la [documentation et les tutoriels](/fr/use-cases/documentation/) ou les [réponses du support](/fr/use-cases/customer-support/).
- Utilisez la capture des DevTools quand votre administrateur a désactivé l’outil Screenshot et que vous ne pouvez pas installer d’extensions.

La [référence d’export](/fr/docs/#export) décrit les formats de fichier et l’échelle. Pour les pages qu’OpenScreenShot ne peut pas capturer, comme les paramètres du navigateur, consultez [support et limites connues](/fr/support/).
