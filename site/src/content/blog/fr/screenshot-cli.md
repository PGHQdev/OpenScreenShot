---
title: Faire des captures de sites web en ligne de commande
description: Utilisez la CLI OpenScreenShot pour enregistrer des captures PNG avec une zone d’affichage fixe, une capture de page entière ou une sortie binaire sur stdout.
audience: developers
order: 4
---

La CLI OpenScreenShot capture une page web en PNG avec un navigateur compatible Chrome installé en local. C’est un paquet séparé de l’extension de navigateur. Avec Node.js, pnpm et Chrome installés, exécutez :

```sh
pnpm dlx openscreenshot shot https://example.com --out screenshot.png --full
```

La commande démarre un navigateur headless séparé, ouvre l’URL, écrit l’image et ferme le navigateur. Elle ne se connecte ni aux onglets ni au profil connecté de votre navigateur habituel.

## Définir la zone d’affichage explicitement

Pour une capture de la zone d’affichage, omettez `--full`. La largeur par défaut est de 1280 pixels et la hauteur par défaut de 800 pixels. Définissez les deux quand une mise en page demande une taille précise :

```sh
pnpm dlx openscreenshot shot https://example.com --out desktop.png --width 1440 --height 900
pnpm dlx openscreenshot shot https://example.com --out narrow.png --width 390 --height 844
```

La largeur accepte des entiers de 200 à 3840 ; la hauteur accepte des entiers de 200 à 2160. Une zone d’affichage étroite teste la mise en page responsive à cette largeur. Elle n’émule pas la saisie tactile d’un téléphone, son ratio de pixels ni un navigateur mobile : la CLI utilise un user agent d’ordinateur.

Ajoutez `--full` pour capturer au-delà de la zone d’affichage. La capture de page entière du navigateur headless diffère de la méthode de l’extension, qui fait défiler puis assemble ; ne supposez pas que chaque page dynamique aura exactement le même rendu dans les deux.

## Enregistrer un fichier ou écrire sur stdout

Sans `--out`, la commande écrit `screenshot.png` dans le dossier courant. Utilisez un nom de fichier explicite pour que les artefacts soient faciles à identifier. Créez le dossier de sortie parent avant d’exécuter la commande.

`--out -` écrit les octets PNG sur stdout :

```sh
pnpm dlx openscreenshot shot https://example.com --out - > screenshot.png
```

Utilisez une redirection compatible avec les données binaires. La CLI produit toujours du PNG ; nommer la sortie `capture.jpg` ou `capture.pdf` ne la convertit pas. Pour des images annotées ou une sortie PDF, utilisez l’[éditeur de l’extension](/fr/docs/#export).

## Résoudre les échecs courants

Si Chrome est introuvable, installez-le ou définissez `CHROME_PATH` sur l’exécutable du navigateur. Par exemple, sur un système Linux où Chromium est installé à cet emplacement :

```sh
CHROME_PATH=/usr/bin/chromium pnpm dlx openscreenshot shot https://example.com --out screenshot.png
```

La navigation attend `networkidle2` avec un délai d’expiration de 30 secondes. La commande actuelle n’a pas d’option d’attente personnalisée, de sélecteur, de cookie ni de connexion. Une capture réussie ne prouve pas non plus que l’application s’est chargée correctement : examinez le PNG à la recherche de pages d’erreur, d’états de chargement et de ressources manquantes.

Le code de sortie 0 indique que la commande de capture s’est terminée, 1 indique un échec de capture et 2 indique un usage invalide ou des arguments refusés à la validation. Utilisez ces codes pour enchaîner des commandes, puis examinez l’image elle-même.

Pour des artefacts reproductibles, lisez [le guide de capture en CI](/fr/blog/screenshots-for-ci/). Pour un processus piloté par un agent, consultez [le guide de configuration MCP](/fr/blog/screenshot-mcp-server/). Le [code source de la CLI](https://github.com/pghqdev/OpenScreenShot/tree/main/mcp/src) fait référence pour les options disponibles.
