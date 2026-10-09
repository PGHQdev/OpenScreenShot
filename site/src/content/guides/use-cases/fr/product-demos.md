---
title: Comment enregistrer une vidéo de démonstration produit dans Chrome
description: Enregistrez un onglet avec webcam et voix, ajoutez un zoom à chaque clic, coupez la prise et exportez un MP4, le tout dans Chrome sur votre ordinateur.
order: 6
---

Pour enregistrer une courte démonstration produit depuis un onglet du navigateur, utilisez **Enregistrer** dans l’extension Chrome d’OpenScreenShot. Choisissez l’onglet entier ou une partie, activez le micro, l’audio de l’onglet ou la webcam, et enregistrez la démonstration. L’éditeur ajoute ensuite un zoom à chaque clic, vous permet de couper la prise et exporte un MP4. La version Firefox gère seulement les captures d’écran et n’a pas d’enregistreur.

## Enregistrer une démonstration, étape par étape

1. Préparez la démonstration dans un onglet normal : connectez-vous, chargez des données d’exemple et fermez les notifications. Les pages internes du navigateur ne peuvent pas être enregistrées.
2. Avec les paramètres par défaut, un clic sur l’icône de la barre d’outils prend une capture d’écran. Faites un clic droit sur l’icône et décochez **Mode Express en un clic** : le clic suivant ouvre alors le popup.
3. Cliquez sur **Enregistrer** dans le popup. L’onglet d’enregistrement s’ouvre à côté de votre page. La première fois, Chrome demande une seule fois l’autorisation de capturer l’onglet.
4. Activez **Micro**, **Audio onglet** ou **Webcam** selon vos besoins, et acceptez la demande d’autorisation de votre navigateur.
5. Gardez **Onglet entier**, ou faites glisser sur l’image de votre page pour n’en enregistrer qu’une partie.
6. Cliquez sur **Démarrer l’enregistrement**. OpenScreenShot passe à votre page. Faites la démonstration à un rythme régulier, avec des clics délibérés.
7. Appuyez sur `Alt+Shift+X` pour arrêter, ou revenez à l’onglet d’enregistrement et cliquez sur **Arrêter**. L’éditeur d’enregistrement s’ouvre dans le même onglet.
8. Ajustez les zooms, coupez le début et la fin, et cliquez sur **Exporter en MP4**.

L’onglet d’enregistrement a aussi des boutons Pause/Reprendre et Annuler. Rien n’est ajouté à la page enregistrée : aucun contrôle n’apparaît donc dans la vidéo.

## Zoom aux clics

L’éditeur ajoute un zoom 2x fluide à chaque clic de votre curseur. Sur la chronologie, vous pouvez ajuster ou supprimer chaque bloc de zoom. Cliquez sur **Ajouter un zoom** pour placer votre propre bloc à 1,5x, 2x ou 3x, par exemple sur un nombre qui change sans clic.

Des ondes marquent l’endroit de chaque clic. Le réglage du curseur peut afficher un pointeur fluide qui suit le trajet enregistré, afficher seulement les clics, ou masquer le pointeur.

Si la démonstration passe sur un autre site, le suivi des clics a besoin de l’autorisation facultative **Enregistrer partout** dans les **Paramètres**. Sans elle, le badge de la barre d’outils passe à l’ambre, et les effets de zoom et de clic s’arrêtent pour le reste de la vidéo. La vidéo elle-même continue de s’enregistrer.

## Webcam, voix et audio de l’onglet

La webcam rejoint l’export sous forme de bulle ronde. Dans l’éditeur, placez-la dans n’importe quel coin, changez sa taille ou masquez-la. Des curseurs séparés règlent le volume du micro et celui de l’onglet : vous gardez ainsi votre voix au-dessus des sons du produit.

Enregistrez d’abord une courte prise de test pour vérifier les niveaux et la position de la bulle.

## Couper et encadrer la prise

Faites glisser les poignées au début ou à la fin d’un segment pour le couper. Annuler et rétablir fonctionnent sur la chronologie. Le panneau **Beautify**, dans le panneau latéral, ajoute des marges, des coins, une ombre et un fond autour de la vidéo : le même cadre que celui de l’éditeur de captures.

## Exporter la vidéo

**Exporter en MP4** produit la prise avec vos zooms, vos pistes audio, la bulle webcam et le cadre, puis télécharge un fichier MP4 avec une vidéo H.264 et un audio AAC. Choisissez WebM dans le sélecteur à côté du bouton pour obtenir un fichier WebM. Gardez l’onglet de l’éditeur visible pendant le rendu, car le rendu se met en pause quand l’onglet est masqué.

Le MP4 est limité à 4096×2304 pixels : un onglet plus grand est réduit pour tenir dans cette taille. Un navigateur sans enregistrement MP4 exporte seulement en WebM. Le fichier est nommé selon votre **Nom de fichier** défini dans les **Paramètres**.

## Limites et stockage

L’enregistreur capture un seul onglet du navigateur. Il n’enregistre ni les autres fenêtres, ni les autres applications, ni votre bureau. Une page interne du navigateur ou une page protégée ne peut pas être enregistrée.

Les enregistrements, les journaux du curseur et les flux de la webcam et du micro restent dans le stockage du navigateur sur votre appareil jusqu’à ce que vous les supprimiez. Activez **Supprimer l’enregistrement après l’export** pour retirer la prise une fois le fichier enregistré. Rien n’est envoyé en ligne, sauf si vous partagez le fichier exporté.

La [référence de l’enregistrement](/fr/docs/#record) décrit chaque contrôle. Pour des images fixes du même bug ou de la même fonctionnalité, consultez [captures d’écran pour les rapports de bug](/fr/use-cases/bug-reports/).
