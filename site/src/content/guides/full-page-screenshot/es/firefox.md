---
title: Cómo hacer una captura de página completa en Firefox
description: Captura una página entera con Screenshots de Firefox o el comando :screenshot, revisa los límites de tamaño y usa el complemento OpenScreenShot.
order: 3
---

Firefox tiene una herramienta de captura integrada, Screenshots. Pulsa `Ctrl+Shift+S` (`Cmd+Shift+S` en macOS), selecciona **Save full page** (guardar página completa) y, después, selecciona **Download** (descargar) para guardar un PNG o **Copy** (copiar) para poner la imagen en el portapapeles. El complemento OpenScreenShot para Firefox añade un editor para flechas, texto y ocultación de datos, y exporta a PNG, JPEG, WebP o PDF.

## Método integrado

Mozilla describe la herramienta en [Take screenshots in Firefox](https://support.mozilla.org/en-US/kb/take-screenshots-firefox).

1. Abre la página que quieres capturar.
2. Pulsa `Ctrl+Shift+S` en Windows y Linux, o `Cmd+Shift+S` en macOS. También puedes hacer clic derecho en una parte vacía de la página y seleccionar **Take Screenshot** (hacer captura de pantalla).
3. Selecciona **Save full page** arriba a la derecha.
4. En la vista previa, selecciona **Download** para guardar un PNG en tu carpeta de descargas de Firefox, o selecciona **Copy**.

La vista previa ofrece **Copy** y **Download**. Para añadir flechas o texto, abre el PNG en otra aplicación.

Las DevTools de Firefox ofrecen una segunda vía. Abre la consola web y escribe `:screenshot --fullpage`, y Firefox guarda un PNG de la página entera. También puedes activar el botón **Take a screenshot of the entire page** (hacer una captura de la página entera) en **Available Toolbox Buttons** (botones disponibles de la caja de herramientas), en los ajustes de DevTools. Mozilla documenta ambas vías en su [guía de capturas de DevTools](https://firefox-source-docs.mozilla.org/devtools-user/taking_screenshots/index.html).

## Límites

- **Tamaño.** Firefox recorta una captura de más de 32.766 píxeles por lado o de 472.907.776 píxeles de área, y muestra «Your screenshot was cropped because it was too large.». El mensaje de error de Firefox para una captura demasiado grande da otras cifras: menos de 32.700 píxeles en el lado más largo o 124.900.000 píxeles de área total.
- **Escala de la pantalla.** Firefox cuenta estos límites en píxeles de dispositivo: el ancho y el alto de la página multiplicados por la proporción de píxeles de la pantalla. En una pantalla 2x, el límite de altura de página en píxeles CSS es la mitad, unos 16.383.
- **Contenedores con desplazamiento interno.** Firefox toma los límites de la página completa del ancho y el alto de desplazamiento de la ventana. Cuando una página desplaza un panel dentro de un contenedor de altura fija, el contenido de ese panel no se expande, así que la captura muestra solo una pantalla de alto de él.
- **Carga diferida.** Las imágenes marcadas con `loading="lazy"` solo se cargan cuando te desplazas cerca de ellas. Desplázate por la página antes de capturarla, o partes de la imagen pueden quedar en blanco.
- **Desplazamiento infinito.** Un feed que carga más contenido al desplazarte no tiene un final real. La captura contiene solo lo que se cargó antes de empezar.
- **Cabeceras fijas.** Revisa la parte superior y la parte central de la imagen en busca de una cabecera que falte, se repita o esté en el lugar equivocado antes de compartirla.

## Con OpenScreenShot

La versión de OpenScreenShot para Firefox solo hace capturas de pantalla. La grabación de pestañas está en la versión para Chrome. Su modo de página completa desplaza la página, la captura por partes y une las partes en una imagen, con las cabeceras fijas colocadas una vez arriba. Las páginas que desplazan un elemento interno en lugar de la ventana también funcionan.

1. Instala [OpenScreenShot desde Firefox Add-ons](https://addons.mozilla.org/firefox/addon/openscreenshot/) y fija su icono en la barra de herramientas.
2. Abre la página y desplázate por ella una vez para que se carguen las imágenes con carga diferida, y vuelve arriba.
3. Haz clic en el icono de OpenScreenShot y elige **Página completa** si se abre el menú de modos.
4. Revisa el resultado en el editor, sobre todo la parte superior, la parte inferior y cualquier navegación fija.
5. Haz clic en **Guardar imagen** y elige PNG, JPEG, WebP o PDF, o haz clic en **Copiar**.

Firefox usa `Ctrl+Shift+S` para su propia herramienta Screenshots, así que haz clic en el icono de la barra de herramientas cuando quieras usar OpenScreenShot. La [referencia de modos de captura](/es/docs/#modes) describe cada modo, y la [referencia de exportación](/es/docs/#export) trata los formatos y la escala.

## Cuál usar

- Usa Firefox Screenshots para un PNG rápido de una página que desplaza la ventana entera y cabe dentro del límite de tamaño.
- Usa el comando `:screenshot --fullpage` cuando ya trabajas en la consola web.
- Usa OpenScreenShot para páginas que desplazan un panel interno, y para capturas que quieres marcar o guardar como PDF, como en los [informes de errores](/es/use-cases/bug-reports/) o en una [copia guardada de una página](/es/use-cases/archive-web-pages/).

La [guía de Chrome](/es/full-page-screenshot/chrome/) y la [guía de Edge](/es/full-page-screenshot/edge/) tratan la misma tarea en navegadores Chromium, donde OpenScreenShot también puede grabar pestañas. Para páginas que bloquean las extensiones, como los ajustes de Firefox, consulta [soporte y limitaciones conocidas](/es/support/).
