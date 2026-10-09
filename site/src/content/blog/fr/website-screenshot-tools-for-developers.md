---
title: Outils de capture de sites web pour les développeurs, la CI et les agents IA
description: 'Comparez la CLI et le serveur MCP openscreenshot, shot-scraper, capture-website-cli, pageres-cli, Playwright, Puppeteer et Playwright MCP : runtime, page entière, CLI, MCP, vidéo, licence.'
audience: developers
order: 9
---

Pour obtenir un PNG d’une page publique depuis un script shell ou une tâche de CI, un outil en ligne de commande suffit : openscreenshot, shot-scraper, capture-website-cli ou pageres-cli. Quand la capture demande une connexion, des clics, des assertions ou une vidéo, écrivez-la avec Playwright ou Puppeteer. Pour un agent IA, un serveur MCP local renvoie les captures au modèle : `openscreenshot serve` prend une capture par appel, et Playwright MCP pilote toute une session de navigateur.

Le paquet `openscreenshot` est notre produit, et cette page indique les cas où il est le choix le plus faible. Elle compare les fonctionnalités et ne classe pas les outils. Tous les faits datent du 9 octobre 2026 et proviennent du dépôt, du registre de paquets ou de la documentation officielle de chaque projet, avec les liens ci-dessous.

## Les outils en un coup d’œil

| Outil               | Langage / runtime                                 | Page entière         | CLI                | MCP                | Vidéo                | Licence    |
| ------------------- | ------------------------------------------------- | -------------------- | ------------------ | ------------------ | -------------------- | ---------- |
| openscreenshot      | Node.js 22.12+, Chrome, Chromium ou Edge installé | `--full`             | Oui                | Oui, stdio         | Non                  | MIT        |
| shot-scraper        | Python 3.10+, navigateurs Playwright              | Par défaut           | Oui                | Non mentionné      | Oui, WebM ou MP4     | Apache-2.0 |
| capture-website-cli | Node.js 20+, Chrome de Puppeteer                  | `--full-page`        | Oui                | Non mentionné      | Non                  | MIT        |
| pageres-cli         | Node.js 20+, Chrome de Puppeteer                  | Par défaut           | Oui                | Non mentionné      | Non                  | MIT        |
| Playwright          | Node.js, Python, Java, .NET                       | `fullPage: true`     | Lanceur de tests   | Via Playwright MCP | Oui                  | Apache-2.0 |
| Puppeteer           | Node.js 22.12+                                    | `fullPage: true`     | Non mentionné      | Non mentionné      | Oui, MP4 dans Chrome | Apache-2.0 |
| Playwright MCP      | Node.js via `npx`, ou Docker                      | Paramètre `fullPage` | Serveur uniquement | Oui, stdio ou HTTP | Oui, sur activation  | Apache-2.0 |

« Non mentionné » signifie que la documentation du projet que nous avons consultée ne décrit pas la fonctionnalité.

## openscreenshot (CLI et serveur MCP)

[openscreenshot](https://www.npmjs.com/package/openscreenshot) pilote le Chrome, Chromium ou Edge déjà présent sur votre machine via `puppeteer-core` : il ne télécharge donc aucun navigateur. Une seule commande enregistre un PNG de la page entière :

```sh
npx openscreenshot shot https://example.com --out example.png --full
```

Les options sont `--out` (un fichier, ou `-` pour stdout), `--full`, `--width` (de 200 à 3840, 1280 par défaut) et `--height` (de 200 à 2160, 800 par défaut). Le code de sortie 0 signifie qu’un PNG a été écrit, 1 que la capture a échoué et 2 que l’utilisation est incorrecte. `openscreenshot serve` démarre un serveur MCP sur stdio avec un seul outil, `capture_screenshot`, qui prend `url`, `fullPage`, `width` et `height` et renvoie un contenu image PNG. Le [guide de la CLI](/fr/blog/screenshot-cli/), le [guide MCP](/fr/blog/screenshot-mcp-server/) et le [guide CI](/fr/blog/screenshots-for-ci/) couvrent la configuration, et le [code source](https://github.com/pghqdev/OpenScreenShot/tree/main/mcp/src) fait référence.

Les cas où il est le choix le plus faible :

- Chaque capture démarre un nouveau navigateur avec un profil vide. Il n’a ni cookies, ni connexion, ni clics, ni attente de sélecteur : une page protégée par une connexion affiche donc l’écran de connexion.
- La navigation attend `networkidle2` pendant 30 secondes au maximum, sans option d’attente supplémentaire. Les pages qui s’affichent après le calme du réseau peuvent sortir à moitié chargées.
- La sortie est uniquement en PNG, sans PDF ni vidéo.
- Le serveur MCP fonctionne uniquement en local sur stdio, sans URL hébergée ni transport HTTP. L’outil renvoie une image et n’écrit pas de fichier.
- Le navigateur s’exécute avec `--no-sandbox` pour fonctionner dans les conteneurs. Ne capturez que des URL de confiance.
- Sous Windows, Edge et les installations de Chrome par utilisateur ne sont pas détectés ; définissez `CHROME_PATH`.

Pour les pages connectées, l’annotation ou l’export PDF à la main, utilisez l’[extension de navigateur](/fr/docs/).

## shot-scraper

[shot-scraper](https://github.com/simonw/shot-scraper) est un outil Python construit sur Playwright. Installez-le, téléchargez son navigateur et prenez une capture, selon sa [documentation sur les captures](https://github.com/simonw/shot-scraper/blob/main/docs/screenshots.md) :

```sh
pip install shot-scraper
shot-scraper install
shot-scraper https://example.com -o example.png
```

Si vous omettez `--height`, la capture couvre la page entière. `--selector` capture un seul élément, `shot-scraper pdf` enregistre un PDF et `multi` exécute une liste YAML de captures. La commande `video`, ajoutée dans la [1.10](https://github.com/simonw/shot-scraper/releases/tag/1.10), enregistre du WebM à partir d’un storyboard YAML, et `--mp4` le convertit avec ffmpeg. Chromium est le navigateur par défaut, et Firefox et WebKit peuvent être installés. Choisissez-le si votre équipe travaille en Python ou si vous voulez des captures, des PDF et des vidéos de démonstration scriptées avec un seul outil.

## capture-website-cli

[capture-website-cli](https://github.com/sindresorhus/capture-website-cli) est un outil Node.js de Sindre Sorhus qui capture des pages avec Puppeteer. Par défaut, il capture la zone d’affichage ; `--full-page` capture toute la page défilante :

```sh
npm install --global capture-website-cli
capture-website https://example.com --output=screenshot.png --full-page
```

Sans `--output`, il écrit l’image sur stdout. Il produit du PNG, du JPEG ou du WebP. Des options comme `--element`, `--hide-elements`, `--remove-elements`, `--click-element`, `--dark-mode`, `--style` et `--script` préparent la page avant la capture, ce que openscreenshot ne sait pas faire. Choisissez-le si vous devez masquer des bannières de cookies ou injecter du CSS avant une capture.

## pageres-cli

[pageres-cli](https://github.com/sindresorhus/pageres-cli) capture plusieurs URL à plusieurs résolutions en une seule exécution :

```sh
pageres https://example.com 1366x768 1600x900
```

Il capture chaque paire URL et résolution, en page entière par défaut ; `--crop` limite chaque image à la hauteur définie. La sortie est en PNG ou en JPEG, et la taille par défaut est 1366x768. Les mots-clés d’appareil comme `iphone5s` ne sont plus pris en charge. L’activité est faible : la dernière version, v9.0.0 du 9 septembre 2025, a relevé l’exigence de Node.js à 20 et ajouté trois options. Choisissez-le pour une vérification rapide du responsive sur plusieurs largeurs.

## Playwright

[Playwright](https://github.com/microsoft/playwright) est le framework d’automatisation et de test de Microsoft pour Chromium, Firefox et WebKit, avec des bindings pour Node.js, Python, Java et .NET. Une capture de page entière est une option de [`page.screenshot`](https://playwright.dev/docs/api/class-page#page-screenshot) :

```js
await page.screenshot({ path: 'page.png', fullPage: true });
```

[`page.pdf()`](https://playwright.dev/docs/api/class-page#page-pdf) fonctionne uniquement dans Chromium headless. L’[enregistrement vidéo](https://playwright.dev/docs/videos) est une option du contexte, et le lanceur de tests peut ne garder la vidéo que pour les tests en échec. Choisissez Playwright quand la capture est une étape d’un test qui se connecte, clique et vérifie des assertions.

## Puppeteer

[Puppeteer](https://github.com/puppeteer/puppeteer) est la bibliothèque Node.js de Google pour Chrome et Firefox. `npm i puppeteer` télécharge Chrome for Testing. Les [options de capture](https://pptr.dev/api/puppeteer.screenshotoptions) ont la même forme :

```js
await page.screenshot({ path: 'page.png', fullPage: true });
```

[`page.pdf()`](https://pptr.dev/api/puppeteer.page.pdf) génère un PDF avec le CSS d’impression. [`page.record()`](https://pptr.dev/api/puppeteer.page.record), ajouté dans puppeteer-core 25.10.0, enregistre du MP4 dans Chrome. Firefox fonctionne via WebDriver BiDi, où certaines fonctionnalités ne sont pas prises en charge. openscreenshot est une fine couche au-dessus de `puppeteer-core` : utilisez donc Puppeteer directement si vous avez besoin de plus que ses quatre options de capture.

## Playwright MCP

[Playwright MCP](https://github.com/microsoft/playwright-mcp) permet à un agent de piloter un navigateur au moyen d’instantanés d’accessibilité : il n’a donc pas besoin de modèle de vision. Son [README](https://github.com/microsoft/playwright-mcp/blob/v0.0.83/README.md) donne cette configuration standard :

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"]
    }
  }
}
```

L’outil `browser_take_screenshot` prend un paramètre `fullPage` et renvoie du PNG, du JPEG ou du WebP. Les outils PDF et vidéo s’activent via `--caps`. Par défaut, le navigateur s’exécute avec une fenêtre visible et garde un profil persistant, donc les connexions peuvent être conservées ; `--isolated`, `--storage-state` et `--extension` (pour se connecter à un Chrome ou un Edge déjà ouvert) changent ce comportement. `--port` sert en HTTP au lieu de stdio. Il s’agit toujours d’une version 0.0.x (v0.0.83). Préférez-le à `openscreenshot serve` quand l’agent doit se connecter, cliquer ou remplir des formulaires.

## Lequel choisir

- **Un PNG d’une page publique dans un script ou un artefact de CI :** openscreenshot, shot-scraper ou capture-website-cli.
- **La même page à plusieurs largeurs :** pageres-cli.
- **Masquer des éléments ou injecter du CSS d’abord :** capture-website-cli ou shot-scraper.
- **Un PDF ou une vidéo de démonstration scriptée en ligne de commande :** shot-scraper.
- **Connexion, clics et assertions dans une suite de tests :** Playwright ou Puppeteer.
- **Un agent qui doit seulement regarder une page :** `openscreenshot serve`.
- **Un agent qui doit interagir avec la page ou se connecter :** Playwright MCP.
- **Une personne qui capture et annote des pages connectées :** une extension ; consultez le [comparatif des extensions de capture de page entière](/fr/blog/full-page-screenshot-extensions/).
