---
title: Comment faire une capture d’écran pleine page dans Brave
description: Activez le bouton de capture de Brave et capturez une page entière en PNG, vérifiez les limites, et utilisez OpenScreenShot depuis le Chrome Web Store.
order: 5
---

Brave 1.94 et les versions ultérieures ont un outil de capture d’écran intégré. Activez le bouton de capture dans `brave://settings/appearance`, cliquez dessus et sélectionnez **Full page** (Page entière). Dans Brave 1.96 et les versions ultérieures, un aperçu s’ouvre, où vous téléchargez un PNG ou copiez l’image. OpenScreenShot fonctionne aussi dans Brave : Brave est un navigateur Chromium et installe les extensions depuis le Chrome Web Store.

## Méthode intégrée

Brave n’a pas d’article d’aide pour cet outil. Les étapes ci-dessous suivent les [notes de version](https://brave.com/latest/) de Brave et son [suivi des tickets](https://github.com/brave/brave-browser/issues/57937).

1. Allez sur `brave://settings/appearance` et activez le bouton de capture dans la section de la barre d’outils.
2. Ouvrez la page à capturer.
3. Cliquez sur le bouton **Take a screenshot** (Faire une capture d’écran) dans la barre d’outils.
4. Dans la bulle **Capture screenshot** (Capturer l’écran), sélectionnez **Full page** (Page entière). La bulle propose aussi **Selected area** (Zone sélectionnée) et **Visible area** (Zone visible).
5. Dans la boîte **Screenshot preview** (Aperçu de la capture), sélectionnez **Download** (Télécharger) pour enregistrer un PNG, ou **Copy to clipboard** (Copier dans le presse-papiers).

`Ctrl+Shift+S` (`Shift+Cmd+S` sur macOS) ouvre l’outil de capture de Brave dans Brave 1.75 et les versions ultérieures. Le suivi des tickets de Brave décrit ce raccourci comme une capture par sélection : utilisez donc le bouton de la barre d’outils pour **Full page** (Page entière). Dans Brave 1.96, l’entrée de capture du menu de l’application est passée dans la section Save de **Save and share** (Enregistrer et partager).

L’aperçu propose **Download** (Télécharger) et **Copy to clipboard** (Copier dans le presse-papiers). Pour ajouter des flèches ou du texte, ouvrez le PNG dans une autre application.

## Limites

- **Taille de page.** L’option **Full page** (Page entière) utilise la commande de capture des DevTools de Chromium. Cette commande refuse une page de 131 072 pixels CSS ou plus en largeur ou en hauteur, avec l’erreur « Page is too large. »
- **Éléments collants et fixes.** Pour cette commande, Chromium redimensionne la vue à la taille de la page entière. Les sections dimensionnées sur la hauteur de la fenêtre (`100vh`) et les en-têtes ou pieds de page fixes peuvent alors se placer par rapport à cette vue très haute : un pied de page fixe peut apparaître une seule fois en bas de l’image.
- **Chargement différé.** Les images marquées `loading="lazy"` se chargent seulement quand vous défilez près d’elles. Faites défiler la page avant de la capturer, sinon des parties de l’image peuvent rester vides.
- **Conteneurs à défilement interne.** Chromium dimensionne la capture selon la taille de défilement propre de la page. Quand une page fait défiler un panneau à l’intérieur d’un cadre de hauteur fixe, la capture montre une seule hauteur d’écran de ce panneau.
- **Défilement infini.** Un flux qui continue de se charger n’a pas de vrai bas de page. La capture contient seulement ce qui était chargé avant de commencer.

## Avec OpenScreenShot

OpenScreenShot fait défiler la page un écran à la fois et assemble les parties en une seule image. Les en-têtes fixes sont capturés une seule fois en haut, et les pages qui font défiler un élément interne fonctionnent aussi. Une page de plus de 32 000 pixels physiques de haut est enregistrée en six images au maximum.

1. Ouvrez la [fiche OpenScreenShot](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp) dans Brave et ajoutez l’extension. Brave explique les installations depuis le Chrome Web Store dans [Using Chrome extensions in Brave](https://brave.com/learn/using-chrome-extensions-in-brave/).
2. Épinglez l’icône OpenScreenShot dans la barre d’outils.
3. Ouvrez la page et cliquez sur l’icône. Avec les paramètres par défaut, une capture pleine page démarre et le résultat s’ouvre dans l’éditeur.
4. Vérifiez le haut, le bas et toute navigation collante.
5. Cliquez sur **Enregistrer l’image** et choisissez PNG, JPEG, WebP ou PDF, ou cliquez sur **Copier**.

Le raccourci pleine page d’OpenScreenShot est `Ctrl+Shift+S` (`⌘⇧S` sur macOS), les mêmes touches que l’outil de capture de Brave. Si les touches ouvrent l’outil de Brave, cliquez plutôt sur l’icône, ou définissez une autre touche avec le lien **Raccourcis** du menu de capture. Si l’icône ouvre un menu, sélectionnez **Page entière** ; le réglage **Mode Express en un clic** contrôle ce comportement.

## Quelle méthode choisir

- Utilisez le bouton **Full page** (Page entière) de Brave pour un PNG rapide d’une page qui fait défiler toute la fenêtre.
- Utilisez OpenScreenShot pour les pages qui font défiler un panneau interne, pour l’export en PDF, JPEG ou WebP, ou pour annoter et masquer avant de partager, comme pour les [rapports de bug](/fr/use-cases/bug-reports/).
- Utilisez le panneau **Beautify** d’OpenScreenShot quand la capture va dans une publication : il ajoute des marges, des coins arrondis, une ombre et un fond. Consultez [captures d’écran pour les réseaux sociaux](/fr/use-cases/social-media/).

La [référence des modes de capture](/fr/docs/#modes) et la [référence d’export](/fr/docs/#export) listent chaque option. Le [guide Chrome](/fr/full-page-screenshot/chrome/) décrit la capture DevTools, que Brave possède aussi. Pour les pages qui bloquent les extensions, comme les paramètres du navigateur, consultez [support et limites connues](/fr/support/).
