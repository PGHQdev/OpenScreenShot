---
title: Comment faire une capture de page entière dans Chrome
description: Capturez une page web défilante entière avec OpenScreenShot, vérifiez le résultat et exportez-le en image ou en PDF.
audience: everyday
order: 1
---

Pour faire une capture de page entière avec OpenScreenShot, ouvrez la page web et cliquez sur l’icône de l’extension dans la barre d’outils. Avec les réglages par défaut, la capture démarre immédiatement et l’image terminée s’ouvre dans l’éditeur. L’extension fait défiler la page et assemble les sections capturées en une seule image.

## Capturer la page étape par étape

1. Installez [OpenScreenShot depuis le Chrome Web Store](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp) et épinglez son icône dans la barre d’outils.
2. Ouvrez la page à capturer. Fermez les bannières ou les boîtes de dialogue que vous ne voulez pas dans l’image.
3. Attendez que le contenu nécessaire se charge. Sur les pages dont les images se chargent à la demande, faites défiler le contenu utile avant de commencer.
4. Cliquez sur l’icône OpenScreenShot. Restez sur l’onglet pendant que la capture se termine.
5. Examinez l’image dans l’éditeur, en particulier la première et la dernière section et toute navigation fixe.
6. Cliquez sur **Enregistrer l’image** et choisissez PNG, JPEG, WebP ou PDF dans la boîte **Exporter**.

Si le clic sur l’icône ouvre plutôt le sélecteur de modes, choisissez **Page entière**. Le réglage **Mode Express en un clic** détermine le comportement obtenu. Si l’éditeur ne s’ouvre pas, vérifiez **Après capture** : Presse-papiers et Télécharger envoient directement le résultat à leur destination.

## Page entière, zone visible ou zone sélectionnée ?

**Page entière** sert à relire une page d’accueil, à garder une copie visuelle d’un article ou à montrer un long écran de réglages. Elle inclut le contenu situé au-delà de la zone affichée.

**Zone visible** capture ce qui est affiché à l’écran, sans défilement. Utilisez-la quand l’interface autour apporte un contexte utile mais que le reste de la page n’a pas d’intérêt.

**Zone sélectionnée** capture un rectangle que vous choisissez. C’est souvent l’option la plus claire pour un rapport de bug : capturez le composant défaillant et assez de contenu autour pour l’identifier. Consultez la [référence des modes de capture](/fr/docs/#modes) pour les commandes de sélection et les raccourcis.

## Pourquoi une partie de la page manque-t-elle ou se répète-t-elle ?

Une capture de page entière enregistre la page telle qu’elle est rendue. Ce n’est pas un export de tout ce qu’un site pourrait finir par charger. Les fils infinis, les listes virtualisées, le contenu en mouvement et les zones de défilement intégrées peuvent rendre cette différence visible.

OpenScreenShot gère les en-têtes fixes et les zones de défilement imbriquées, mais une page qui remplace son contenu pendant le défilement peut quand même produire un résultat incomplet. Laissez la page se stabiliser, chargez la section utile, puis réessayez. Pour un fil qui s’allonge sans fin, capturez plutôt la zone importante. Les pages internes du navigateur et d’autres surfaces protégées peuvent bloquer la capture par une extension ; consultez [l’assistance et les limites connues](/fr/support/).

## Choisir un export adapté à la destination

Utilisez le PNG pour le texte d’interface et les schémas quand un résultat sans perte compte. JPEG et WebP proposent un réglage de qualité quand la taille du fichier compte davantage. Pour une pièce jointe à un document, suivez le [guide de la capture en PDF](/fr/blog/save-screenshot-as-pdf/).

Avant de partager, retirez les informations dont votre lecteur n’a pas besoin. Le [guide de masquage](/fr/blog/redact-screenshot/) explique comment couvrir le contenu sensible et vérifier le fichier exporté. La capture et la modification dans l’extension se font en local ; téléverser ensuite la capture exportée ailleurs est une action distincte que vous contrôlez.
