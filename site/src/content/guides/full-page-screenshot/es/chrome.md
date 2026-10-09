---
title: 'Cómo hacer una captura de página completa en Chrome: DevTools o una extensión'
description: Usa el comando Capture full size screenshot de Chrome DevTools, conoce sus límites y compáralo con una captura de página completa en OpenScreenShot.
order: 1
---

Chrome puede hacer una captura de página completa sin extensiones, pero solo desde DevTools. Abre DevTools, abre el menú de comandos, escribe `screenshot` y ejecuta **Capture full size screenshot** (capturar una captura de tamaño completo). Chrome guarda la página entera como archivo PNG. Los menús normales de Chrome no tienen ninguna opción de captura: la ayuda de Google enumera Share, Send to your devices y Create QR code (Compartir, Enviar a tus dispositivos y Crear código QR) en **Cast, save, and share** (enviar, guardar y compartir). Para una captura que puedas marcar, exportar como PDF o hacer en una página que se desplaza dentro de un panel, instala OpenScreenShot y haz clic en su icono.

## Método integrado

1. Abre la página que quieres capturar.
2. [Abre DevTools](https://developer.chrome.com/docs/devtools/open): pulsa `F12` o `Ctrl+Shift+I` en Windows y Linux, o `Cmd+Option+I` en macOS.
3. Abre el [menú de comandos](https://developer.chrome.com/docs/devtools/command-menu): pulsa `Ctrl+Shift+P`, o `Cmd+Shift+P` en macOS.
4. Escribe `screenshot` y selecciona **Capture full size screenshot** (capturar una captura de tamaño completo).
5. Chrome guarda un archivo PNG de la página entera.

La misma captura está en el modo de dispositivo. Activa la barra de herramientas de dispositivo, abre su menú **More options** (más opciones) y selecciona la opción de captura de tamaño completo. La [documentación del modo de dispositivo](https://developer.chrome.com/docs/devtools/device-mode) de Google la llama **Capture a full size screenshot** (hacer una captura de tamaño completo).

No hay un único atajo para toda la secuencia. Google no documenta herramientas para marcar la captura, así que las flechas, el texto y la ocultación de datos se hacen en otra aplicación.

## Límites

- **DevTools debe estar abierto.** El comando solo está en el menú de comandos y en el menú del modo de dispositivo.
- **Tamaño de página.** Chromium rechaza una página de 131.072 píxeles CSS o más de ancho o de alto, con el error «Page is too large.».
- **Elementos fijos y sticky.** Para la captura, Chromium redimensiona la vista al tamaño completo de la página y oculta las barras de desplazamiento. Las secciones con la altura de la ventana (`100vh`) y las cabeceras o pies fijos pueden entonces maquetarse según esa vista tan alta. Un pie fijo puede aparecer una vez al final de la imagen, y una sección hero de altura completa puede estirarse.
- **Carga diferida.** Las imágenes y los frames marcados con `loading="lazy"` solo se cargan cuando te desplazas cerca de ellos. Desplázate por la página antes de ejecutar el comando, o partes de la imagen pueden quedar en blanco.
- **Contenedores con desplazamiento interno.** Chromium calcula el tamaño de la captura a partir del tamaño de desplazamiento propio de la página. Cuando una página desplaza un panel dentro de un contenedor de altura fija, por ejemplo una aplicación web o un sitio de documentación con un panel de contenido desplazable, la captura muestra solo una pantalla de alto de ese panel.

## Con OpenScreenShot

OpenScreenShot desplaza la página de pantalla en pantalla, captura cada parte y une las partes en una imagen. Captura las cabeceras fijas en la primera parte y las coloca una vez arriba. Las páginas que desplazan un elemento interno en lugar de la ventana también funcionan. Una página de más de 32.000 píxeles de dispositivo de alto se guarda en hasta seis imágenes.

1. Instala [OpenScreenShot desde la Chrome Web Store](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp) y fija su icono en la barra de herramientas.
2. Abre la página y haz clic en el icono, o pulsa `Ctrl+Shift+S` (`⌘⇧S` en macOS).
3. Revisa el resultado en el editor, sobre todo la parte superior, la parte inferior y cualquier navegación fija.
4. Haz clic en **Guardar imagen** y elige PNG, JPEG, WebP o PDF. **Copiar** y **PDF**, a su lado, terminan con un clic.

Si se abre un menú en lugar de una captura, selecciona **Página completa**. El ajuste **Modo Express de un clic** controla este comportamiento. La [guía de capturas de página completa en Chrome](/es/blog/full-page-screenshot-chrome/) explica la extensión paso a paso, incluidas las secciones que faltan o se repiten. La [referencia de modos de captura](/es/docs/#modes) y la [referencia de exportación](/es/docs/#export) enumeran todas las opciones.

## DevTools y OpenScreenShot frente a frente

- **Inicio:** DevTools necesita dos atajos y un comando escrito. OpenScreenShot necesita un clic o un atajo.
- **Resultado:** DevTools guarda un PNG. OpenScreenShot exporta PNG, JPEG, WebP o PDF, o copia la imagen.
- **Edición:** DevTools no tiene. OpenScreenShot abre un editor con flechas, texto, números de paso, desenfoque y recorte.
- **Instalación:** DevTools ya viene en Chrome. OpenScreenShot es una extensión con licencia MIT que procesa las capturas localmente.

## Cuál usar

- Usa DevTools para un PNG puntual de una página normal en un ordenador en el que no puedes añadir extensiones.
- Usa OpenScreenShot para páginas que desplazan un panel interno, páginas con cabeceras fijas y capturas que quieres marcar antes de compartirlas, como en [informes de errores](/es/use-cases/bug-reports/) o en una [revisión de diseño](/es/use-cases/design-review/).
- Usa cualquiera de los dos también en Microsoft Edge; la [guía de Edge](/es/full-page-screenshot/edge/) trata la herramienta de captura propia de Edge.

Si una captura falla en una página del navegador como `chrome://settings`, consulta [soporte y limitaciones conocidas](/es/support/).
