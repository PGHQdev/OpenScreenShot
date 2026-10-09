---
title: Cómo hacer una captura de página completa en Opera
description: La herramienta Snapshot de Opera solo guarda la página completa como PDF. Conoce los pasos y los límites, y cómo capturar una imagen con OpenScreenShot.
order: 6
---

La herramienta Snapshot integrada en Opera captura una selección o el área visible como imagen, y la página completa solo como PDF. Pulsa `Shift+Ctrl+5` (`Shift+Cmd+2` en macOS) y selecciona **Save page as PDF** (guardar página como PDF). Para un archivo de imagen de la página completa, instala OpenScreenShot. Opera es un navegador Chromium y lo instala desde la Chrome Web Store después de añadir el complemento **Install Chrome Extensions** de Opera.

## Método integrado

Opera describe Snapshot en su [página de ayuda sobre funciones](https://help.opera.com/en/latest/features/) y en su [página de Snapshot](https://www.opera.com/features/snapshot).

1. Abre la página que quieres capturar.
2. Pulsa `Shift+Ctrl+5` en Windows y Linux, o `Shift+Cmd+2` en macOS. También puedes hacer clic en el icono de la cámara, a la derecha de la barra de herramientas.
3. Selecciona **Save page as PDF**. Opera guarda la página completa, de arriba abajo, como PDF.

Snapshot tiene dos opciones de imagen. **Capture Full Screen** (capturar pantalla completa) captura solo el área visible de la página, y **Capture** (capturar) captura un marco que tú ajustas. Ambas dan una imagen que puedes marcar con zoom, flecha, desenfoque, resaltado, lápiz, cámara selfie, emojis y texto, y después guardar como PNG con **Save Image** (guardar imagen) o copiar al portapapeles.

## Límites

- **PDF solo para la página completa.** Las capturas de imagen cubren el área visible o una selección. Para obtener la página entera, obtienes un PDF.
- **Diseño no documentado.** Opera no documenta si el PDF es una sola página larga o varias páginas, cómo trata las cabeceras fijas ni cómo gestiona una página que desplaza un panel dentro de un contenedor de altura fija. Abre el PDF y revísalo antes de compartirlo.
- **Carga diferida.** Las imágenes marcadas con `loading="lazy"` solo se cargan cuando te desplazas cerca de ellas. Desplázate por la página antes de guardarla, o algunas partes pueden quedar en blanco.
- **Desplazamiento infinito.** Un feed que sigue cargando no tiene un final real. Cualquier captura contiene solo lo que se cargó antes de empezar.

## Con OpenScreenShot

OpenScreenShot desplaza la página, la captura por partes y une las partes en una imagen. Las cabeceras fijas se capturan una vez arriba, y las páginas que desplazan un elemento interno también funcionan. Una página de más de 32.000 píxeles de dispositivo de alto se guarda en hasta seis imágenes.

1. Añade el complemento **Install Chrome Extensions** desde los complementos de Opera. Opera lo explica en [Using add-ons from Chrome in Opera](https://blogs.opera.com/tips-and-tricks/2021/10/using-addons-from-chrome-in-opera/).
2. Abre la [ficha de OpenScreenShot](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp) y añade la extensión.
3. Fija el icono de OpenScreenShot en la barra de herramientas.
4. Abre la página y haz clic en el icono, o pulsa `Ctrl+Shift+S` (`⌘⇧S` en macOS). Con los ajustes por defecto, empieza una captura de página completa y el resultado se abre en el editor.
5. Revisa la parte superior, la parte inferior y cualquier navegación fija.
6. Haz clic en **Guardar imagen** y elige PNG, JPEG, WebP o PDF, o haz clic en **Copiar**.

Si el icono abre un menú, selecciona **Página completa**; el ajuste **Modo Express de un clic** controla este comportamiento. Un PDF de OpenScreenShot contiene la captura como imagen, así que se ve como la página en pantalla, pero su texto no se puede buscar ni seleccionar. En **Tamaño de página**, **Completa** crea una sola página del tamaño de la imagen, y **A4** o **Carta** pueden dividir una captura larga en varias páginas. La [guía de captura a PDF](/es/blog/save-screenshot-as-pdf/) compara estos diseños.

## Cuál usar

- Usa **Save page as PDF** de Snapshot para un PDF rápido de la página completa sin instalar nada.
- Usa las opciones de imagen de Snapshot para el área visible o una selección con unas pocas marcas.
- Usa OpenScreenShot para un PNG, JPEG o WebP de la página completa, para páginas que desplazan un panel interno o para un PDF que coincida con la pantalla, como en una [revisión de diseño](/es/use-cases/design-review/) o en una [copia guardada de una página](/es/use-cases/archive-web-pages/).

La [referencia de modos de captura](/es/docs/#modes) y la [referencia de exportación](/es/docs/#export) enumeran todas las opciones. La [guía de Vivaldi](/es/full-page-screenshot/vivaldi/) trata otro navegador Chromium con su propia herramienta de captura. Para páginas que bloquean las extensiones, como los ajustes del navegador, consulta [soporte y limitaciones conocidas](/es/support/).
