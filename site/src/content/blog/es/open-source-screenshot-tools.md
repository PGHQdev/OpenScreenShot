---
title: Herramientas de captura de código abierto para cada plataforma
description: 'Herramientas de captura de código abierto según dónde se ejecutan: OpenScreenShot, Screenity, ShareX, Flameshot, Firefox, shot-scraper, Playwright y Puppeteer.'
audience: everyday
order: 8
---

Elige una herramienta de captura de código abierto según dónde está lo que quieres capturar. Para cualquier cosa en una pantalla de Windows, usa ShareX. Para escritorios de Linux, macOS o Windows, usa Flameshot. Para páginas web, usa una herramienta de navegador como OpenScreenShot o la herramienta Screenshots integrada en Firefox, y para capturas desde un script, usa shot-scraper, Playwright o Puppeteer.

OpenScreenShot es nuestro producto. Esta página dice dónde no encaja, y no clasifica las herramientas. Todos los datos son a fecha de 9 de octubre de 2026 y proceden del repositorio, la ficha en la tienda o el sitio oficial de cada proyecto, enlazados abajo.

## Qué herramienta cubre qué plataforma

| Herramienta         | Funciona en                                                | Captura                                                                                   | Licencia         | Página completa    | Vídeo                                                 |
| ------------------- | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ---------------- | ------------------ | ----------------------------------------------------- |
| OpenScreenShot      | Chrome, Firefox                                            | Páginas web en una pestaña                                                                | MIT              | Sí                 | Grabación de pestañas, solo en la versión para Chrome |
| Screenity           | Chrome y navegadores Chromium que usan la Chrome Web Store | Grabaciones de una pestaña, un área, el escritorio, una ventana de aplicación o la cámara | GPL-3.0          | No documentado     | Sí                                                    |
| ShareX              | Windows                                                    | Cualquier cosa en pantalla                                                                | GPL-3.0          | Captura con scroll | Vídeo y GIF                                           |
| Flameshot           | Linux, macOS, Windows                                      | Un área de la pantalla                                                                    | GPL-3.0          | No                 | No documentado                                        |
| Firefox Screenshots | Firefox de escritorio                                      | Páginas web                                                                               | Parte de Firefox | Sí                 | No documentado                                        |
| shot-scraper        | Python 3.10 o posterior                                    | Páginas web, desde un comando                                                             | Apache-2.0       | Sí, por defecto    | Sí, desde un archivo de script                        |
| Playwright          | Node.js, Python, Java, .NET                                | Páginas web, desde código                                                                 | Apache-2.0       | Sí                 | Sí                                                    |
| Puppeteer           | Node.js                                                    | Páginas web, desde código                                                                 | Apache-2.0       | Sí                 | Sí, Chrome                                            |

Ninguna de estas herramientas funciona en Android ni en iOS. Una extensión del navegador solo ve la página web de su pestaña. Una aplicación de escritorio ve toda la pantalla, pero no sabe dónde termina una página web.

## En el navegador: OpenScreenShot

[OpenScreenShot](https://github.com/pghqdev/OpenScreenShot) es una extensión con licencia MIT para [Chrome](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp) y [Firefox](https://addons.mozilla.org/firefox/addon/openscreenshot/). Captura una página completa, el área visible, una región o un elemento. Después abre un editor con flechas, formas, texto, números de paso, desenfoque y recorte, y exporta PNG, JPEG, WebP o PDF. La captura y la edición se ejecutan en tu navegador, y la extensión no sube tus capturas ni grabaciones a ningún servidor. La [documentación](/es/docs/) explica cada modo.

La versión para Chrome también [graba una pestaña](/es/docs/#record) con micrófono, audio de la pestaña y webcam opcionales, y exporta MP4 o WebM. La versión para Firefox solo hace capturas de pantalla.

OpenScreenShot no es la herramienta adecuada cuando lo que necesitas está fuera de una pestaña del navegador. No puede capturar el escritorio, otra aplicación ni una página de ajustes del navegador, y no graba toda la pantalla.

## Grabación en el navegador: Screenity

[Screenity](https://github.com/alyssaxuu/screenity) es una extensión de grabación de pantalla y anotación para Chrome. Graba una pestaña, un área, el escritorio, cualquier ventana de aplicación o la cámara, con micrófono y audio interno. Exporta MP4, GIF o WebM, o guarda en Google Drive. Puedes dibujar, añadir texto, flechas y formas, y desenfocar contenido sensible de la página.

La licencia es [GPL-3.0](https://github.com/alyssaxuu/screenity/blob/master/LICENSE). El README dice que la licencia cambió a GPLv3 para la versión Manifest V3, a partir de la versión 3.0.0. La extensión es gratuita y no requiere iniciar sesión para las grabaciones locales. [Screenity Pro](https://screenity.io/pro) cuesta 10 $ al mes o 120 $ al año tras una prueba de 7 días y añade un editor, enlaces para compartir y alojamiento en la nube en servidores de la UE, con una cuenta. El README dice que algunas partes del código se conectan a Screenity Pro, y que solo están activas en la versión de la Chrome Web Store.

Screenity pide acceso a todos los sitios web al instalarse. Su documentación no describe capturas de página completa. Elígela antes que OpenScreenShot cuando necesites grabar el escritorio u otra aplicación; consulta las [alternativas a Screenity](/es/alternatives/screenity/).

## Windows: ShareX

[ShareX](https://getsharex.com/) es una aplicación gratuita para Windows sin anuncios, con licencia [GPL-3.0](https://github.com/ShareX/ShareX). Captura la pantalla, una ventana o una región, y su [captura con scroll](https://getsharex.com/docs/scrolling-screenshot) compara capturas sucesivas y añade las secciones que cambian, así que una sola imagen puede contener contenido que va más allá de la pantalla. También graba vídeo y GIF, y su README incluye OCR y lectura de códigos QR.

El editor de imágenes tiene formas, flechas, texto, bocadillos, desenfoque, pixelado, resaltado y spotlight. ShareX puede subir a muchos servicios, y las tareas tras la captura pueden subir automáticamente si las configuras. Revisa esos ajustes antes de capturar contenido privado. Puedes obtenerla como instalador, como versión portable o desde Microsoft Store o Steam. La última versión, v21.0.0, salió el 3 de julio de 2026.

ShareX no funciona en macOS ni en Linux.

## Linux, macOS y Windows: Flameshot

[Flameshot](https://flameshot.org/) es una herramienta de captura gratuita para Linux, macOS y Windows, con licencia [GPL-3.0](https://github.com/flameshot-org/flameshot). Seleccionas un área y la anotas ahí mismo con flechas, resaltados, desenfoque o pixelado, texto, trazos a mano alzada, recuadros y números de contador. También tiene una interfaz de línea de comandos. Su README incluye una subida opcional a Imgur, que inicia la tecla Intro, así que aprende esa tecla antes de capturar contenido privado.

La [versión 14.0.0](https://github.com/flameshot-org/flameshot/releases/tag/v14.0.0) (junio de 2026) pregunta qué monitor capturar y usa xdg-desktop-portal como vía principal de captura en Linux. El README califica de experimental la compatibilidad con GNOME y Plasma en Wayland.

Flameshot no tiene captura con scroll. La [solicitud de función](https://github.com/flameshot-org/flameshot/issues/1130) sigue abierta. No encontramos ninguna función de grabación en su documentación. Para una página web completa en Linux, combina Flameshot con una herramienta de navegador.

## Integrada: Firefox Screenshots

Firefox es de código abierto, y su herramienta Screenshots no necesita instalación. Haz clic derecho en una página, elige **Take Screenshot** (hacer captura de pantalla) y selecciona una región, el área visible o **Save full page** (guardar página completa), según la [guía de Mozilla](https://blog.mozilla.org/en/firefox/how-to-capture-screenshots-with-firefox/). Copias o descargas el resultado. Mozilla [terminó las subidas](https://blog.mozilla.org/futurereleases/2019/01/24/clarifying-the-future-of-firefox-screenshots/) a su servidor de Screenshots en Firefox 67 (mayo de 2019), así que las capturas se quedan en local.

Para usar un comando, la consola de Firefox DevTools acepta `:screenshot --fullpage`, que guarda un PNG en Descargas, según la [documentación de DevTools](https://firefox-source-docs.mozilla.org/devtools-user/taking_screenshots/index.html). El front end de DevTools de Chrome también es de código abierto, con licencia [BSD-3-Clause](https://github.com/ChromeDevTools/devtools-frontend), y su comando **Capture full size screenshot** (capturar una captura de pantalla a tamaño completo) guarda un PNG. Las [guías de captura de página completa](/es/full-page-screenshot/) cubren cada navegador.

## Desde un script: shot-scraper, Playwright, Puppeteer

Estas herramientas capturan páginas web desde un comando o desde código, para trabajo repetitivo y CI. Cargan la página en su propio navegador, así que no ven tus pestañas con sesión iniciada.

- [shot-scraper](https://github.com/simonw/shot-scraper) es una herramienta de línea de comandos en Python basada en Playwright. Hace capturas de página completa por defecto y también guarda PDF y graba vídeos desde un script YAML.
- [Playwright](https://github.com/microsoft/playwright) es el framework de automatización y pruebas de navegador de Microsoft para Chromium, Firefox y WebKit, con API de captura, PDF y vídeo.
- [Puppeteer](https://github.com/puppeteer/puppeteer) es la biblioteca de Node.js de Google para Chrome y Firefox, con API de captura, PDF y grabación en MP4.

Nuestro propio paquete `openscreenshot`, con licencia MIT, añade una herramienta de línea de comandos y un servidor MCP para agentes de IA. La [comparativa para desarrolladores](/es/blog/website-screenshot-tools-for-developers/) cubre todas estas herramientas con comandos.

## Cuál elegir

- **Cualquier cosa en una pantalla de Windows, con captura con scroll:** ShareX.
- **Un área de la pantalla en Linux o macOS:** Flameshot.
- **Una página web completa con marcado y exportación a PDF:** OpenScreenShot, o Firefox Screenshots para una captura rápida sin instalar nada.
- **Una grabación del escritorio o de otra aplicación:** Screenity, o ShareX en Windows.
- **Capturas desde un script o CI:** shot-scraper, Playwright o Puppeteer.

Si la herramienta no tiene que ser de código abierto, la [comparativa de extensiones de página completa](/es/blog/full-page-screenshot-extensions/) añade GoFullPage, FireShot y otras. La [página de comparación](/es/compare/) pone lado a lado OpenScreenShot, GoFullPage y FullPage Capture.
