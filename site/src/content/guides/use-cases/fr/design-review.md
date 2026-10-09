---
title: Comment capturer une page web pour une revue de design
description: Capturez une page entière ou un seul composant, guidez les relecteurs avec le spotlight et des notes, et partagez un PDF de plusieurs pages.
order: 2
---

Pour une revue de design, capturez toute la page avec **Page entière**, marquez les points sur lesquels vous voulez un retour, et partagez un PDF que les relecteurs lisent page par page. Dans OpenScreenShot, **Spotlight** assombrit tout ce qui est hors de la zone discutée, et **Texte** et **Flèche** ajoutent des notes. Utilisez **Capturer un élément** quand la revue porte sur un seul composant, comme une carte, un graphique ou un tableau.

## Préparer une page pour une revue, étape par étape

1. Ouvrez la page à la largeur de fenêtre à examiner. La capture montre la mise en page à la largeur actuelle : redimensionnez d’abord la fenêtre pour examiner un autre point de rupture.
2. Faites défiler la page une fois pour charger les images en chargement différé, puis revenez en haut. Fermez les bandeaux de cookies et les widgets de chat qui ne font pas partie de la revue.
3. Cliquez sur l’icône OpenScreenShot. Avec les paramètres par défaut, cela lance une capture **Page entière**. Laissez l’onglet en place jusqu’à l’ouverture de l’éditeur.
4. Vérifiez la première et la dernière section, l’en-tête et chaque zone animée, comme un carrousel.
5. Sélectionnez **Spotlight** (`O`) et faites glisser sur chaque zone que les relecteurs doivent regarder. Plusieurs découpes fusionnent en un seul calque assombri.
6. Ajoutez une note **Texte** (`T`) à côté de chaque zone, et une **Flèche** (`A`) quand une note doit désigner un petit détail.
7. Cliquez sur **Enregistrer l’image** pour ouvrir la boîte **Exporter**. Choisissez **PDF**, puis suivez les étapes d’export ci-dessous.

## Capturer un seul composant

Faites un clic droit sur la page, ouvrez le sous-menu **OpenScreenShot** et choisissez **Capturer un élément**. Survolez le composant jusqu’à ce qu’il soit entouré, puis cliquez ou appuyez sur `Enter` pour capturer ses limites. Appuyez sur `↑` pour sélectionner l’élément parent, par exemple la section qui contient une carte, et sur `←` ou `→` pour passer à un élément voisin.

Une capture d’élément donne une image serrée sans recadrage manuel, ce qui est utile pour comparer deux versions du même composant. Si l’élément n’est pas entièrement visible à l’écran, le sélecteur propose une capture pleine page à la place.

## Marquer les retours pour que les relecteurs les suivent

Les découpes du spotlight peuvent être un rectangle, un rectangle arrondi ou une ellipse. Utilisez une image spotlight par sujet : une image avec beaucoup de zones éclairées oblige les relecteurs à deviner quelle note va avec quelle zone. Pour des retours numérotés, ajoutez un **Numéro d’étape** (`S`) à chaque point et citez les numéros dans le fil de la revue. Les numéros s’incrémentent seuls et sont renumérotés quand vous en supprimez un.

L’outil **Forme** (`R`) trace un contour autour d’une zone sans assombrir le reste de la page. L’outil **Flèche** propose des pointes pleine, ouverte, double et ronde, et vous pouvez faire glisser sa poignée centrale pour la courber autour d’autres contenus.

## Partager la revue en PDF

Dans la boîte **Exporter**, choisissez **PDF**, sélectionnez **A4** ou **Letter** sous **Taille de page**, et activez **Répartir sur plusieurs pages**. Les pages consécutives se chevauchent de 5 mm : une ligne de texte coupée par un saut de page apparaît sur les deux pages. Choisissez **Entière** sous **Taille de page** pour garder la page sur une seule page PDF haute, à lire à l’écran.

Le PDF contient la capture sous forme d’image, avec vos annotations. Il n’a pas de texte sélectionnable. Le [guide capture vers PDF](/fr/blog/save-screenshot-as-pdf/) compare les mises en page, et la [référence d’export](/fr/docs/#export) liste les autres formats.

## Limites d’une capture pleine page

Une capture pleine page enregistre la page telle qu’elle s’affiche pendant que l’extension la fait défiler. Certains contenus changent pendant ce défilement :

- Un en-tête fixe est capturé sur la première tuile et ajouté une seule fois en haut. Vérifiez que les autres éléments collants, comme les barres latérales ou les barres du bas, apparaissent là où vous les attendez.
- Les images qui se chargent seulement quand elles deviennent visibles peuvent apparaître comme des cadres vides si la capture les atteint en premier. Faites défiler la page avant de capturer.
- Les carrousels, les animations, les compteurs en direct et les flux infinis peuvent changer d’une tuile à l’autre. Mettez-les en pause, ou capturez plutôt la zone importante.

Une page de plus de 32 000 pixels physiques de haut est enregistrée en six images au maximum, chacune dans son propre onglet d’éditeur. Le [guide de capture pleine page](/fr/blog/full-page-screenshot-chrome/) donne d’autres pistes de dépannage. Pour les captures destinées aux articles d’aide, consultez [captures d’écran pour la documentation](/fr/use-cases/documentation/).
