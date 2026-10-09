---
title: Comment faire une capture d’écran pleine page dans Firefox
description: Capturez une page entière avec l’outil Screenshots intégré de Firefox ou la commande :screenshot, vérifiez les limites, et utilisez le module OpenScreenShot.
order: 3
---

Firefox a un outil Screenshots intégré. Appuyez sur `Ctrl+Shift+S` (`Cmd+Shift+S` sur macOS), sélectionnez **Save full page** (Enregistrer la page complète), puis **Download** (Télécharger) pour enregistrer un PNG, ou **Copy** (Copier) pour placer l’image dans le presse-papiers. Le module OpenScreenShot pour Firefox ajoute un éditeur pour les flèches, le texte et le masquage, et exporte en PNG, JPEG, WebP ou PDF.

## Méthode intégrée

Mozilla décrit l’outil dans [Take screenshots in Firefox](https://support.mozilla.org/en-US/kb/take-screenshots-firefox).

1. Ouvrez la page à capturer.
2. Appuyez sur `Ctrl+Shift+S` sous Windows et Linux, ou sur `Cmd+Shift+S` sous macOS. Vous pouvez aussi faire un clic droit sur une partie vide de la page et sélectionner **Take Screenshot** (Effectuer une capture d’écran).
3. Sélectionnez **Save full page** (Enregistrer la page complète) en haut à droite.
4. Dans l’aperçu, sélectionnez **Download** (Télécharger) pour enregistrer un PNG dans votre dossier de téléchargement Firefox, ou sélectionnez **Copy** (Copier).

L’aperçu propose **Copy** (Copier) et **Download** (Télécharger). Pour ajouter des flèches ou du texte, ouvrez le PNG dans une autre application.

Les DevTools de Firefox offrent une deuxième méthode. Ouvrez la Console web et tapez `:screenshot --fullpage` : Firefox enregistre un PNG de toute la page. Vous pouvez aussi activer le bouton **Take a screenshot of the entire page** (Prendre une capture d’écran de la page entière) sous **Available Toolbox Buttons** (Boutons de la boîte à outils disponibles) dans les paramètres des DevTools. Mozilla documente les deux dans son [guide des captures dans les DevTools](https://firefox-source-docs.mozilla.org/devtools-user/taking_screenshots/index.html).

## Limites

- **Taille.** Firefox rogne une capture de plus de 32 766 pixels de côté ou de 472 907 776 pixels de surface, et affiche « Your screenshot was cropped because it was too large. » Le message d’erreur de Firefox pour une capture trop grande donne d’autres chiffres : moins de 32 700 pixels sur le côté le plus long ou 124 900 000 pixels de surface totale.
- **Échelle d’affichage.** Firefox compte ces limites en pixels physiques : la largeur et la hauteur de la page multipliées par le rapport de pixels de l’écran. Sur un écran 2x, la limite de hauteur de page en pixels CSS est divisée par deux, environ 16 383.
- **Conteneurs à défilement interne.** Firefox prend les limites de la page entière dans la largeur et la hauteur de défilement de la fenêtre. Quand une page fait défiler un panneau à l’intérieur d’un cadre de hauteur fixe, le contenu de ce panneau ne s’étend pas : la capture en montre donc une seule hauteur d’écran.
- **Chargement différé.** Les images marquées `loading="lazy"` se chargent seulement quand vous défilez près d’elles. Faites défiler la page avant de la capturer, sinon des parties de l’image peuvent rester vides.
- **Défilement infini.** Un flux qui charge plus de contenu pendant le défilement n’a pas de vrai bas de page. La capture contient seulement ce qui était chargé avant de commencer.
- **En-têtes collants.** Avant de partager l’image, vérifiez en haut et au milieu qu’aucun en-tête n’est manquant, répété ou mal placé.

## Avec OpenScreenShot

La version Firefox d’OpenScreenShot prend seulement des captures d’écran. L’enregistrement d’onglet est dans la version Chrome. Son mode pleine page fait défiler la page, la capture en plusieurs parties et assemble les parties en une seule image, avec les en-têtes fixes placés une seule fois en haut. Les pages qui font défiler un élément interne plutôt que la fenêtre fonctionnent aussi.

1. Installez [OpenScreenShot depuis Firefox Add-ons](https://addons.mozilla.org/firefox/addon/openscreenshot/) et épinglez son icône dans la barre d’outils.
2. Ouvrez la page et faites-la défiler une fois pour charger les images en chargement différé, puis revenez en haut.
3. Cliquez sur l’icône OpenScreenShot et choisissez **Page entière** si le menu des modes s’ouvre.
4. Vérifiez le résultat dans l’éditeur, en particulier le haut, le bas et toute navigation collante.
5. Cliquez sur **Enregistrer l’image** et choisissez PNG, JPEG, WebP ou PDF, ou cliquez sur **Copier**.

Firefox utilise `Ctrl+Shift+S` pour son propre outil Screenshots : cliquez donc sur l’icône de la barre d’outils quand vous voulez OpenScreenShot. La [référence des modes de capture](/fr/docs/#modes) décrit chaque mode, et la [référence d’export](/fr/docs/#export) décrit les formats et l’échelle.

## Quelle méthode choisir

- Utilisez Firefox Screenshots pour un PNG rapide d’une page qui fait défiler toute la fenêtre et qui respecte la limite de taille.
- Utilisez la commande `:screenshot --fullpage` quand vous travaillez déjà dans la Console web.
- Utilisez OpenScreenShot pour les pages qui font défiler un panneau interne, et pour les captures à annoter ou à enregistrer en PDF, comme pour les [rapports de bug](/fr/use-cases/bug-reports/) ou une [copie enregistrée d’une page](/fr/use-cases/archive-web-pages/).

Le [guide Chrome](/fr/full-page-screenshot/chrome/) et le [guide Edge](/fr/full-page-screenshot/edge/) traitent de la même tâche dans les navigateurs Chromium, où OpenScreenShot peut aussi enregistrer des onglets. Pour les pages qui bloquent les extensions, comme les paramètres de Firefox, consultez [support et limites connues](/fr/support/).
