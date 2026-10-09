---
title: Comment enregistrer une capture de page entière en PDF
description: Exportez une capture sur une seule page PDF, ajustez-la au format A4 ou Letter, ou répartissez une longue capture sur plusieurs pages.
audience: everyday
order: 2
---

Pour enregistrer une capture en PDF dans OpenScreenShot, ouvrez-la dans l’éditeur, cliquez sur **Enregistrer l’image** pour ouvrir la boîte **Exporter**, puis sélectionnez **PDF**. Le bouton **PDF** de la barre du haut en enregistre un en un seul clic avec vos réglages PDF enregistrés : A4, portrait et plusieurs pages, tant que vous ne les modifiez pas dans la boîte de dialogue. Choisissez une seule page image, une mise en page A4 ou Letter, ou un export sur plusieurs pages selon la façon dont le document sera lu.

## Capturer et préparer la capture

Commencez par une [capture de page entière](/fr/blog/full-page-screenshot-chrome/) si vous avez besoin de toute la page web. Utilisez une zone sélectionnée quand une seule partie a sa place dans le document. Vous pouvez aussi déposer une image existante sur la scène de l’éditeur pour l’annoter et l’exporter.

Avant l’export, recadrez les marges inutiles et ajoutez les flèches, le texte ou les numéros d’étape dont votre lecteur a besoin. Couvrez les informations privées d’un masquage opaque. Vos annotations et le cadre Beautify apparaissent dans l’export : vérifiez-les avant d’enregistrer.

Cliquez sur **Enregistrer l’image** dans la barre du haut de l’éditeur, ou utilisez **Ctrl+S** sous Windows/Linux ou **⌘S** sur macOS, puis choisissez PDF dans la boîte **Exporter**.

## Quelle mise en page PDF choisir ?

### Une seule page image

Cette option garde la capture d’un seul tenant sur une page PDF. Elle convient quand le lecteur va zoomer et se déplacer dans le document à l’écran. Une capture très haute peut être difficile à lire au zoom par défaut de la visionneuse : vérifiez-la dans une visionneuse PDF avant de l’envoyer.

### Ajuster au format A4 ou Letter

Utilisez un format de papier standard quand la capture doit tenir dans un document ou être imprimée. Faire tenir une longue page web sur une seule feuille réduit la taille de son texte. Recadrez sur la partie utile ou utilisez plusieurs pages si l’ajustement rend les libellés illisibles.

### Plusieurs pages

Un export sur plusieurs pages découpe la capture en sections de la taille d’une page. OpenScreenShot ajoute un chevauchement de 5 mm entre les sections pour aider le lecteur à suivre le contenu d’une coupure à l’autre. Vérifiez ces coupures : l’export travaille sur une image, il ne peut donc pas réorganiser les paragraphes comme un traitement de texte.

## Le texte du PDF est-il consultable ?

OpenScreenShot exporte la capture sous forme d’image dans un PDF. Il ne transforme pas la capture en texte sélectionnable et n’ajoute pas de couche de texte OCR. Si vous avez besoin de texte consultable ou d’une structure de document accessible, utilisez l’export de document du site lui-même quand il existe, ou un processus OCR séparé.

Un PDF de capture est utile quand l’apparence visible compte : une revue d’interface, un rapport de bug ou une trace visuelle. L’impression en PDF du navigateur peut produire une mise en page différente, car les sites peuvent appliquer des styles d’impression. Choisissez selon votre besoin : l’écran rendu ou le document imprimable du site.

## Vérifier le fichier enregistré

Ouvrez le PDF exporté lui-même et vérifiez la taille du texte, les annotations, les masquages et les coupures de page. Ne vous fiez pas seulement à l’aperçu de l’éditeur. Le réglage d’échelle d’image utilisé pour le PNG, le JPEG et le WebP est masqué pour le PDF, car la sortie PDF s’ajuste à sa mise en page.

Pour les réglages de format et de qualité, consultez la [documentation de l’export](/fr/docs/#export). Si le document contient des informations privées, suivez la [procédure de masquage](/fr/blog/redact-screenshot/) avant de le partager.
