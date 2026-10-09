---
title: Configurer un serveur MCP local de capture d’écran pour un agent IA
description: Connectez OpenScreenShot à un client MCP stdio et demandez des captures PNG avec des options explicites d’URL, de zone d’affichage et de page entière.
audience: developers
order: 5
---

OpenScreenShot fournit un serveur MCP local avec un seul outil : `capture_screenshot`. Un client MCP peut l’appeler avec l’URL d’une page web et recevoir un contenu image PNG. Le serveur lance un navigateur headless compatible Chrome séparé sur votre machine ; l’extension de navigateur n’est pas nécessaire.

## Ajouter le serveur à votre client MCP

Installez d’abord Node.js, pnpm et un navigateur compatible Chrome. Ajoutez une entrée de serveur dans le format de configuration de votre client. Les clients qui acceptent un objet `mcpServers` peuvent utiliser :

```json
{
  "mcpServers": {
    "openscreenshot": {
      "command": "pnpm",
      "args": ["dlx", "openscreenshot", "serve"]
    }
  }
}
```

Le client doit pouvoir trouver `pnpm` dans son chemin d’exécutables. Redémarrez ou rechargez ses connexions MCP après avoir enregistré la configuration. Le serveur utilise stdio : le client démarre donc un processus local, et il n’y a aucune URL MCP hébergée à saisir.

Si Chrome est installé à un emplacement inhabituel, transmettez `CHROME_PATH` par la configuration d’environnement du client. Utilisez le chemin complet de l’exécutable, et non le dossier qui contient l’application.

## Appeler capture_screenshot

Une entrée minimale de l’outil est :

```json
{ "url": "https://example.com" }
```

Elle produit une capture de la zone d’affichage à la taille par défaut de 1280 × 800. Définissez explicitement la zone d’affichage et l’option de page entière pour une requête reproductible :

```json
{
  "url": "https://example.com",
  "fullPage": true,
  "width": 1440,
  "height": 900
}
```

`width` accepte des entiers de 200 à 3840 et `height` de 200 à 2160. L’outil renvoie un contenu image MCP de type MIME `image/png`. Cet outil n’a pas d’argument de chemin de sortie. L’affichage ou l’enregistrement du résultat dépend du client ; utilisez la [CLI](/fr/blog/screenshot-cli/) quand vous avez besoin directement d’un fichier nommé.

## Ce que l’agent peut voir et ne peut pas voir

La capture démarre dans un navigateur headless neuf. Elle n’hérite ni des cookies ni de la session connectée de votre fenêtre Chrome habituelle. Une page derrière une authentification peut donc produire un écran de connexion. L’outil actuel ne propose ni étapes de connexion, ni injection de cookies, ni attente de sélecteur, ni clics interactifs.

Demandez à l’agent d’identifier ce qui est réellement visible dans l’image renvoyée avant de tirer des conclusions. Une capture peut aider à examiner la mise en page, les espacements et les erreurs visibles ; elle ne peut pas établir qu’un formulaire s’envoie correctement ni que la navigation au clavier fonctionne.

## Où va la capture ?

La capture est générée en local et renvoyée au client MCP. Si ce client utilise un modèle hébergé, il peut transmettre l’image renvoyée au fournisseur du modèle selon ses propres réglages. Une capture locale ne signifie pas que toute la conversation avec l’agent reste sur l’appareil.

Pour des captures automatisées aux dimensions prévisibles, consultez [les captures en CI](/fr/blog/screenshots-for-ci/). Le [skill de capture pour agents](/skills/capture-screenshot.md) et le [code source du serveur](https://github.com/pghqdev/OpenScreenShot/blob/main/mcp/src/serve.ts) fournissent les instructions destinées aux machines et la définition de l’outil.
