---
title: 'Comment faire une capture d’écran pleine page dans Chrome : DevTools ou extension'
description: Utilisez la commande Capture full size screenshot des DevTools de Chrome, voyez ses limites, et comparez-la à une capture pleine page dans OpenScreenShot.
order: 1
---

Chrome peut faire une capture d’écran pleine page sans extension, mais seulement depuis les DevTools. Ouvrez les DevTools, ouvrez le Command Menu, tapez `screenshot` et lancez **Capture full size screenshot** (Capturer une capture d’écran en taille réelle). Chrome enregistre toute la page dans un fichier PNG. Les menus habituels de Chrome n’ont aucune entrée de capture d’écran : l’aide de Google liste Share, Send to your devices et Create QR code sous **Cast, save, and share** (Caster, enregistrer et partager). Pour une capture à annoter, à exporter en PDF ou à prendre sur une page qui défile à l’intérieur d’un panneau, installez OpenScreenShot et cliquez sur son icône.

## Méthode intégrée

1. Ouvrez la page à capturer.
2. [Ouvrez les DevTools](https://developer.chrome.com/docs/devtools/open) : appuyez sur `F12` ou `Ctrl+Shift+I` sous Windows et Linux, ou sur `Cmd+Option+I` sous macOS.
3. Ouvrez le [Command Menu](https://developer.chrome.com/docs/devtools/command-menu) : appuyez sur `Ctrl+Shift+P`, ou sur `Cmd+Shift+P` sous macOS.
4. Tapez `screenshot` et sélectionnez **Capture full size screenshot** (Capturer une capture d’écran en taille réelle).
5. Chrome enregistre un fichier PNG de toute la page.

La même capture existe dans le Device Mode. Activez la barre d’outils de l’appareil, ouvrez son menu **More options** (Plus d’options) et sélectionnez l’entrée de capture en taille réelle. La [documentation du Device Mode](https://developer.chrome.com/docs/devtools/device-mode) de Google l’appelle **Capture a full size screenshot** (Capturer une capture d’écran en taille réelle).

Il n’existe pas de raccourci unique pour toute la séquence. Google ne documente aucun outil d’annotation pour la capture : les flèches, le texte et le masquage se font dans une autre application.

## Limites

- **Les DevTools doivent être ouverts.** La commande se trouve uniquement dans le Command Menu et dans le menu du Device Mode.
- **Taille de page.** Chromium refuse une page de 131 072 pixels CSS ou plus en largeur ou en hauteur, avec l’erreur « Page is too large. »
- **Éléments collants et fixes.** Pour la capture, Chromium redimensionne la vue à la taille de la page entière et masque les barres de défilement. Les sections dimensionnées sur la hauteur de la fenêtre (`100vh`) et les en-têtes ou pieds de page fixes peuvent alors se placer par rapport à cette vue très haute. Un pied de page fixe peut apparaître une seule fois en bas de l’image, et une section d’en-tête pleine hauteur peut s’étirer.
- **Chargement différé.** Les images et les cadres marqués `loading="lazy"` se chargent seulement quand vous défilez près d’eux. Faites défiler la page avant de lancer la commande, sinon des parties de l’image peuvent rester vides.
- **Conteneurs à défilement interne.** Chromium dimensionne la capture selon la taille de défilement propre de la page. Quand une page fait défiler un panneau à l’intérieur d’un cadre de hauteur fixe, par exemple une application web ou un site de documentation doté d’un panneau de contenu défilant, la capture montre une seule hauteur d’écran de ce panneau.

## Avec OpenScreenShot

OpenScreenShot fait défiler la page un écran à la fois, capture chaque partie et assemble les parties en une seule image. Il capture les en-têtes fixes sur la première partie et les place une seule fois en haut. Les pages qui font défiler un élément interne plutôt que la fenêtre fonctionnent aussi. Une page de plus de 32 000 pixels physiques de haut est enregistrée en six images au maximum.

1. Installez [OpenScreenShot depuis le Chrome Web Store](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp) et épinglez son icône dans la barre d’outils.
2. Ouvrez la page et cliquez sur l’icône, ou appuyez sur `Ctrl+Shift+S` (`⌘⇧S` sur macOS).
3. Vérifiez le résultat dans l’éditeur, en particulier le haut, le bas et toute navigation collante.
4. Cliquez sur **Enregistrer l’image** et choisissez PNG, JPEG, WebP ou PDF. **Copier** et **PDF**, juste à côté, terminent en un clic.

Si un menu s’ouvre au lieu d’une capture, sélectionnez **Page entière**. Le réglage **Mode Express en un clic** contrôle ce comportement. Le [guide de capture pleine page dans Chrome](/fr/blog/full-page-screenshot-chrome/) détaille l’extension étape par étape, y compris les sections manquantes ou répétées. La [référence des modes de capture](/fr/docs/#modes) et la [référence d’export](/fr/docs/#export) listent chaque option.

## DevTools et OpenScreenShot côte à côte

- **Démarrage :** les DevTools demandent deux raccourcis et une commande tapée. OpenScreenShot demande un clic ou un raccourci.
- **Sortie :** les DevTools enregistrent un PNG. OpenScreenShot exporte en PNG, JPEG, WebP ou PDF, ou copie l’image.
- **Édition :** les DevTools n’en proposent aucune. OpenScreenShot ouvre un éditeur avec flèches, texte, numéros d’étape, flou et recadrage.
- **Installation :** les DevTools sont déjà dans Chrome. OpenScreenShot est une extension sous licence MIT qui traite les captures en local.

## Quelle méthode choisir

- Utilisez les DevTools pour un PNG ponctuel d’une page ordinaire, sur un ordinateur où vous ne pouvez pas ajouter d’extensions.
- Utilisez OpenScreenShot pour les pages qui font défiler un panneau interne, les pages avec des en-têtes collants et les captures à annoter avant de les partager, comme pour les [rapports de bug](/fr/use-cases/bug-reports/) ou une [revue de design](/fr/use-cases/design-review/).
- Les deux fonctionnent aussi dans Microsoft Edge ; le [guide Edge](/fr/full-page-screenshot/edge/) décrit l’outil Screenshot propre à Edge.

Si une capture échoue sur une page du navigateur comme `chrome://settings`, consultez [support et limites connues](/fr/support/).
