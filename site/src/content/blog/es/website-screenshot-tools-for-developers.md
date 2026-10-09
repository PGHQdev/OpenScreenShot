---
title: Herramientas de captura de sitios web para desarrolladores, CI y agentes de IA
description: La CLI y el servidor MCP de openscreenshot, shot-scraper, capture-website-cli, pageres-cli, Playwright, Puppeteer y Playwright MCP, comparados.
audience: developers
order: 9
---

Para obtener un PNG de una página pública desde un script de shell o un trabajo de CI, basta con una herramienta de línea de comandos: openscreenshot, shot-scraper, capture-website-cli o pageres-cli. Cuando la captura necesita inicio de sesión, clics, aserciones o vídeo, escríbela con Playwright o Puppeteer. Para un agente de IA, un servidor MCP local devuelve capturas al modelo: `openscreenshot serve` hace una captura por llamada, y Playwright MCP controla una sesión de navegador completa.

El paquete `openscreenshot` es nuestro producto, y esta página dice dónde es la opción más débil. Compara funciones y no clasifica las herramientas. Todos los datos son a fecha de 9 de octubre de 2026 y proceden del repositorio, el registro de paquetes o la documentación oficial de cada proyecto, enlazados abajo.

## Las herramientas de un vistazo

| Herramienta         | Lenguaje / entorno                                | Página completa      | CLI           | MCP                     | Vídeo             | Licencia   |
| ------------------- | ------------------------------------------------- | -------------------- | ------------- | ----------------------- | ----------------- | ---------- |
| openscreenshot      | Node.js 22.12+, Chrome, Chromium o Edge instalado | `--full`             | Sí            | Sí, stdio               | No                | MIT        |
| shot-scraper        | Python 3.10+, navegadores de Playwright           | Por defecto          | Sí            | No indicado             | Sí, WebM o MP4    | Apache-2.0 |
| capture-website-cli | Node.js 20+, Chrome de Puppeteer                  | `--full-page`        | Sí            | No indicado             | No                | MIT        |
| pageres-cli         | Node.js 20+, Chrome de Puppeteer                  | Por defecto          | Sí            | No indicado             | No                | MIT        |
| Playwright          | Node.js, Python, Java, .NET                       | `fullPage: true`     | Test runner   | Mediante Playwright MCP | Sí                | Apache-2.0 |
| Puppeteer           | Node.js 22.12+                                    | `fullPage: true`     | No indicado   | No indicado             | Sí, MP4 en Chrome | Apache-2.0 |
| Playwright MCP      | Node.js mediante `npx`, o Docker                  | Parámetro `fullPage` | Solo servidor | Sí, stdio o HTTP        | Sí, opcional      | Apache-2.0 |

«No indicado» significa que la documentación propia del proyecto que revisamos no describe la función.

## openscreenshot (CLI y servidor MCP)

[openscreenshot](https://www.npmjs.com/package/openscreenshot) controla el Chrome, Chromium o Edge que ya tienes en tu equipo mediante `puppeteer-core`, así que no descarga ningún navegador. Un solo comando guarda un PNG de página completa:

```sh
npx openscreenshot shot https://example.com --out example.png --full
```

Las opciones son `--out` (un archivo, o `-` para stdout), `--full`, `--width` (de 200 a 3840, por defecto 1280) y `--height` (de 200 a 2160, por defecto 800). El código de salida 0 significa que se escribió un PNG, 1 que la captura falló y 2 que el uso es incorrecto. `openscreenshot serve` inicia un servidor MCP por stdio con una herramienta, `capture_screenshot`, que recibe `url`, `fullPage`, `width` y `height` y devuelve contenido de imagen PNG. La [guía de la CLI](/es/blog/screenshot-cli/), la [guía de MCP](/es/blog/screenshot-mcp-server/) y la [guía de CI](/es/blog/screenshots-for-ci/) explican la configuración, y el [código fuente](https://github.com/pghqdev/OpenScreenShot/tree/main/mcp/src) es la referencia.

Dónde es la opción más débil:

- Cada captura inicia un navegador nuevo con un perfil vacío. No tiene cookies, inicio de sesión, clics ni esperas por selector, así que una página que requiere iniciar sesión muestra la pantalla de inicio de sesión.
- La navegación espera a `networkidle2` hasta 30 segundos, sin ninguna opción de espera adicional. Las páginas que se renderizan después de que la red se calma pueden salir a medio cargar.
- La salida es solo PNG, sin PDF ni vídeo.
- El servidor MCP es solo local por stdio, sin URL alojada ni transporte HTTP. La herramienta devuelve una imagen y no escribe ningún archivo.
- El navegador se ejecuta con `--no-sandbox` para que funcione en contenedores. Captura solo URLs de confianza.
- En Windows, Edge y las instalaciones de Chrome por usuario no se detectan; define `CHROME_PATH`.

Para páginas con sesión iniciada, anotación o exportación manual a PDF, usa la [extensión del navegador](/es/docs/).

## shot-scraper

[shot-scraper](https://github.com/simonw/shot-scraper) es una herramienta en Python basada en Playwright. Instálala, descarga su navegador y haz una captura, según su [documentación de capturas](https://github.com/simonw/shot-scraper/blob/main/docs/screenshots.md):

```sh
pip install shot-scraper
shot-scraper install
shot-scraper https://example.com -o example.png
```

Si omites `--height`, la captura es de página completa. `--selector` captura un elemento, `shot-scraper pdf` guarda un PDF y `multi` ejecuta una lista YAML de capturas. El comando `video`, añadido en la [1.10](https://github.com/simonw/shot-scraper/releases/tag/1.10), graba WebM desde un guion YAML, y `--mp4` lo convierte con ffmpeg. Chromium es el navegador por defecto, y Firefox y WebKit se pueden instalar. Elígela cuando tu equipo trabaja en Python o quieres capturas, PDF y vídeos de demostración con guion desde una sola herramienta.

## capture-website-cli

[capture-website-cli](https://github.com/sindresorhus/capture-website-cli) es una herramienta de Node.js de Sindre Sorhus que captura páginas con Puppeteer. Por defecto captura el viewport; `--full-page` captura toda la página con scroll:

```sh
npm install --global capture-website-cli
capture-website https://example.com --output=screenshot.png --full-page
```

Sin `--output`, escribe la imagen a stdout. Genera PNG, JPEG o WebP. Opciones como `--element`, `--hide-elements`, `--remove-elements`, `--click-element`, `--dark-mode`, `--style` y `--script` preparan la página antes de la captura, algo que openscreenshot no puede hacer. Elígela cuando necesites ocultar banners de cookies o inyectar CSS antes de una captura.

## pageres-cli

[pageres-cli](https://github.com/sindresorhus/pageres-cli) captura varias URLs a varias resoluciones en una sola ejecución:

```sh
pageres https://example.com 1366x768 1600x900
```

Captura cada par de URL y resolución, a página completa por defecto; `--crop` limita cada imagen a la altura indicada. La salida es PNG o JPEG, y el tamaño por defecto es 1366x768. Las palabras clave de dispositivo como `iphone5s` ya no se admiten. La actividad es baja: la última versión, v9.0.0 del 9 de septiembre de 2025, subió el requisito de Node.js a 20 y añadió tres opciones. Elígela para una comprobación rápida del diseño responsive a varios anchos.

## Playwright

[Playwright](https://github.com/microsoft/playwright) es el framework de automatización y pruebas de Microsoft para Chromium, Firefox y WebKit, con bindings para Node.js, Python, Java y .NET. Una captura de página completa es una opción de [`page.screenshot`](https://playwright.dev/docs/api/class-page#page-screenshot):

```js
await page.screenshot({ path: 'page.png', fullPage: true });
```

[`page.pdf()`](https://playwright.dev/docs/api/class-page#page-pdf) solo funciona en Chromium headless. La [grabación de vídeo](https://playwright.dev/docs/videos) es una opción del contexto, y el test runner puede conservar el vídeo solo de las pruebas fallidas. Elige Playwright cuando la captura es un paso de una prueba que inicia sesión, hace clic y comprueba aserciones.

## Puppeteer

[Puppeteer](https://github.com/puppeteer/puppeteer) es la biblioteca de Node.js de Google para Chrome y Firefox. `npm i puppeteer` descarga Chrome for Testing. Las [opciones de captura](https://pptr.dev/api/puppeteer.screenshotoptions) tienen la misma forma:

```js
await page.screenshot({ path: 'page.png', fullPage: true });
```

[`page.pdf()`](https://pptr.dev/api/puppeteer.page.pdf) genera un PDF con el CSS de impresión. [`page.record()`](https://pptr.dev/api/puppeteer.page.record), añadido en puppeteer-core 25.10.0, graba MP4 en Chrome. Firefox funciona mediante WebDriver BiDi, donde algunas funciones no se admiten. openscreenshot es una capa fina sobre `puppeteer-core`, así que usa Puppeteer directamente cuando necesites más que sus cuatro opciones de captura.

## Playwright MCP

[Playwright MCP](https://github.com/microsoft/playwright-mcp) permite que un agente controle un navegador mediante instantáneas de accesibilidad, así que no necesita un modelo de visión. Su [README](https://github.com/microsoft/playwright-mcp/blob/v0.0.83/README.md) da esta configuración estándar:

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

La herramienta `browser_take_screenshot` recibe un parámetro `fullPage` y devuelve PNG, JPEG o WebP. Las herramientas de PDF y vídeo se activan de forma opcional con `--caps`. El navegador se ejecuta con ventana por defecto y mantiene un perfil persistente, así que los inicios de sesión pueden conservarse; `--isolated`, `--storage-state` y `--extension` (para conectarse a un Chrome o Edge en ejecución) cambian eso. `--port` sirve HTTP en lugar de stdio. Sigue siendo una versión 0.0.x (v0.0.83). Elígelo antes que `openscreenshot serve` cuando el agente tenga que iniciar sesión, hacer clic o rellenar formularios.

## Cuál elegir

- **Un PNG de una página pública en un script o un artefacto de CI:** openscreenshot, shot-scraper o capture-website-cli.
- **La misma página a varios anchos:** pageres-cli.
- **Ocultar elementos o inyectar CSS antes:** capture-website-cli o shot-scraper.
- **PDF o un vídeo de demostración con guion desde la línea de comandos:** shot-scraper.
- **Inicio de sesión, clics y aserciones en una batería de pruebas:** Playwright o Puppeteer.
- **Un agente que solo necesita mirar una página:** `openscreenshot serve`.
- **Un agente que tiene que interactuar con la página o iniciar sesión:** Playwright MCP.
- **Una persona que captura y anota páginas con sesión iniciada:** una extensión; consulta la [comparativa de extensiones de página completa](/es/blog/full-page-screenshot-extensions/).
