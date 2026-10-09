---
title: Cómo hacer una captura de página completa en Safari
description: Safari en el Mac no captura la página completa como imagen. Guarda la página entera como PDF, captura un elemento en Web Inspector o usa otro navegador.
order: 4
---

Safari en el Mac no tiene ningún comando de captura de página completa. La opción integrada más parecida es un PDF: elige **File** > **Print** (Archivo > Imprimir), haz clic en **PDF** en la parte inferior del diálogo y guarda el archivo. Para un archivo de imagen, el Web Inspector de Safari puede capturar un elemento de la página. OpenScreenShot no tiene versión para Safari. Safari instala Safari Web Extensions desde la Mac App Store y no puede instalar paquetes de la Chrome Web Store ni complementos de Firefox. En un Mac, Chrome, Firefox, Edge y otros navegadores pueden ejecutar OpenScreenShot.

## Método integrado

### Guardar la página como PDF

Apple describe esta vía en [Print or create a PDF of a webpage in Safari](https://support.apple.com/guide/safari/print-or-create-a-pdf-of-a-webpage-ibrw1060/18.0/mac/15.0).

1. Abre la página que quieres conservar.
2. Desplázate por la página una vez para que se carguen las imágenes que tardan en cargar.
3. Elige **File** > **Print**.
4. Para conservar los colores de la página, activa la impresión de imágenes y colores de fondo en las opciones de impresión. También puedes añadir la dirección web y la fecha en los encabezados y pies de página.
5. Haz clic en **PDF** en la parte inferior del diálogo y guarda el archivo.

### Capturar un elemento en Web Inspector

1. Elige **Safari** > **Settings** > **Advanced** (Safari > Ajustes > Avanzado) y selecciona **Show features for web developers** (mostrar funciones para desarrolladores web). WebKit lo explica en [Enabling Web Inspector](https://webkit.org/web-inspector/enabling-web-inspector/).
2. Abre la página y pulsa `Option+Cmd+I` para abrir Web Inspector.
3. En la pestaña **Elements** (elementos), haz clic derecho en un nodo, por ejemplo `<html>` o `<body>`, y selecciona **Capture Screenshot** (capturar pantalla).
4. Safari guarda la instantánea de ese nodo en un archivo.

Apple no documenta si una captura de `<html>` incluye el contenido que queda por debajo de la parte visible de la página, ni qué formato de imagen escribe. Revisa el archivo antes de confiar en él.

## Límites

- **Sin imagen de página completa.** Ninguna de las dos vías da la captura que obtendrías con una herramienta de captura de página completa. El PDF es una versión impresa de la página, y la opción de Web Inspector captura un nodo.
- **Diseño de impresión.** El PDF usa el diseño de impresión, así que la página del archivo puede verse distinta de la página en pantalla. Activa las imágenes y los colores de fondo si el diseño depende de ellos.
- **Carga diferida.** Las imágenes marcadas con `loading="lazy"` solo se cargan cuando te desplazas cerca de ellas. Desplázate por la página antes de imprimirla o capturarla, o algunas partes pueden quedar en blanco.
- **Contenedores con desplazamiento interno.** Algunos desarrolladores informan de que las capturas automáticas de página completa en WebKit, el motor de Safari, muestran solo una pantalla de alto cuando una página desplaza un panel dentro de un contenedor de altura fija. Revisa con cuidado las páginas construidas así.
- **Cabeceras fijas.** Revisa el resultado en busca de una cabecera que falte, se repita o esté en el lugar equivocado.

## Con OpenScreenShot

OpenScreenShot no está disponible para Safari. Si tienes Chrome, Firefox, Edge, Brave, Opera, Vivaldi o Arc en el mismo Mac, abre allí la página y usa la extensión. Chrome y los demás navegadores Chromium la instalan desde la [Chrome Web Store](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp). Firefox la instala desde [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/openscreenshot/).

1. Instala OpenScreenShot en el otro navegador y fija su icono en la barra de herramientas.
2. Abre la página y haz clic en el icono. En Chrome, `⌘⇧S` también inicia una captura de página completa.
3. Revisa el resultado en el editor.
4. Haz clic en **Guardar imagen** y elige PNG, JPEG, WebP o PDF.

La extensión desplaza la página, une las partes en una imagen y coloca las cabeceras fijas una vez arriba. Una página de más de 32.000 píxeles de dispositivo de alto se guarda en hasta seis imágenes. La [guía de Chrome](/es/full-page-screenshot/chrome/) y la [guía de Firefox](/es/full-page-screenshot/firefox/) dan los pasos para cada navegador, incluidas sus propias herramientas integradas.

## Cuál usar

- Usa **File** > **Print** > **PDF** en Safari para conservar una copia legible de un artículo o de una página de recibo.
- Usa **Capture Screenshot** de Web Inspector para una imagen de una parte de una página, como una tarjeta o un gráfico.
- Usa OpenScreenShot en otro navegador de tu Mac para una imagen de página completa que puedas marcar, o para un PDF de la página tal como se ve en pantalla. La [guía de captura a PDF](/es/blog/save-screenshot-as-pdf/) compara los diseños de PDF, y [guardar una copia visual de una página](/es/use-cases/archive-web-pages/) trata los nombres y el almacenamiento.

Para otras preguntas, consulta [soporte y limitaciones conocidas](/es/support/).
