---
title: Capturer des sites web pour la CI et les revues de version
description: Créez des artefacts PNG reproductibles avec la CLI OpenScreenShot et comprenez ce qu’une capture peut vérifier dans un pipeline de build.
audience: developers
order: 6
---

Utilisez la CLI OpenScreenShot en CI pour enregistrer un PNG d’une application en cours d’exécution en vue d’une revue. Installez un navigateur compatible Chrome, démarrez l’application, attendez qu’elle soit prête, puis capturez une URL et une zone d’affichage fixes. Téléversez le fichier obtenu avec le mécanisme d’artefacts de votre fournisseur de CI.

## Rendre l’environnement reproductible

Pour un projet qui utilise déjà pnpm, ajoutez la CLI comme dépendance de développement et commitez les modifications du manifeste et du fichier de verrouillage :

```sh
pnpm add -D -E openscreenshot
```

En CI, installez les dépendances avec le fichier de verrouillage figé du projet. Le paquet utilise `puppeteer-core` et ne télécharge pas de navigateur : le runner a donc aussi besoin de Chrome ou de Chromium. Définissez `CHROME_PATH` si l’exécutable ne se trouve pas dans un emplacement par défaut pris en charge.

Gardez stables la version du navigateur, les polices, la zone d’affichage, les données de l’application et la version du paquet quand vous comparez des captures. Une police ou un moteur de rendu modifié peut changer une image même quand le code de l’application n’a pas changé.

## Capturer une fois l’application prête

Démarrez votre serveur de développement ou d’aperçu avec la commande du projet. Attendez que la route et ses dépendances soient prêtes avant d’exécuter cet exemple ; le port 4321 n’est qu’un exemple et doit correspondre à votre application :

```sh
mkdir -p artifacts
pnpm exec openscreenshot shot http://127.0.0.1:4321 --out artifacts/desktop.png --width 1440 --height 900
pnpm exec openscreenshot shot http://127.0.0.1:4321 --out artifacts/narrow.png --width 390 --height 844
```

Ces commandes produisent des captures de la zone d’affichage. Ajoutez `--full` pour une revue de la page entière. Donnez le dossier `artifacts/` à l’étape de téléversement d’artefacts de votre CI pour qu’un relecteur puisse ouvrir les fichiers à côté d’une pull request ou d’une version.

La CLI attend l’inactivité du réseau pendant la navigation, mais cela ne garantit pas que le travail propre à l’application est terminé. Elle n’a ni attente de sélecteur configurable ni script de préparation injecté. Utilisez une route de revue dédiée et stable, avec des données déterministes, quand la route habituelle contient des animations, du contenu variable ou une authentification.

## Une image capturée n’est pas un test visuel réussi

La commande peut se terminer avec succès après avoir capturé une erreur serveur ou un écran de chargement. Traitez le PNG comme un artefact de revue. Un système de test de régression visuelle demande aussi une référence, une méthode de comparaison d’images, des seuils et un processus pour accepter les changements voulus ; la CLI d’OpenScreenShot ne fournit pas ces éléments.

Une capture étroite est une vérification utile de la mise en page responsive, mais ce n’est pas une émulation d’appareil mobile. De même, une capture ne vérifie ni les interactions, ni l’accessibilité, ni le comportement des API. Gardez les vérifications utiles de l’application à côté de l’étape de capture.

## Dépanner le pipeline

**Chrome introuvable :** vérifiez que l’image du runner contient un navigateur et que `CHROME_PATH` pointe vers son exécutable.

**Navigation en échec ou délai dépassé :** vérifiez que le serveur est joignable depuis le processus de capture, qu’il utilise le port attendu et qu’il est prêt avant le début de la capture. La navigation a un délai d’expiration de 30 secondes.

**Une page de connexion inattendue apparaît :** la CLI démarre une session de navigateur neuve. Elle ne réutilise pas votre profil local et ne propose pas d’injection de cookies.

**Le fichier de sortie est absent :** créez le dossier de sortie, examinez le code de sortie de la commande et vérifiez le chemin de l’artefact par rapport au dossier de travail de la CI.

Le [guide de référence de la CLI](/fr/blog/screenshot-cli/) présente les options et les codes de sortie. Si un humain ou un agent doit décider quelle page examiner ensuite, utilisez le [processus de capture MCP](/fr/blog/screenshot-mcp-server/).
