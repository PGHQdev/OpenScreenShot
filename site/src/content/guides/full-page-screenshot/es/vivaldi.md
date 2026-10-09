---
title: Cómo hacer una captura de página completa en Vivaldi
description: Captura una página entera con la herramienta Capture de Vivaldi como PNG o JPEG, conoce su límite de 30.000 píxeles y usa OpenScreenShot.
order: 7
---

Vivaldi tiene una herramienta de captura integrada, Capture. Haz clic en el icono de la cámara en la barra de estado, selecciona **Full Page** (página completa), elige PNG, JPEG o el portapapeles, y haz clic en **Capture** (capturar). Las capturas de página completa se detienen en 30.000 píxeles. OpenScreenShot también funciona en Vivaldi: Vivaldi es un navegador Chromium e instala extensiones desde la Chrome Web Store.

## Método integrado

Vivaldi describe la herramienta en [Capture a screenshot](https://help.vivaldi.com/desktop/tools/capture-a-screenshot/).

1. Abre la página que quieres capturar.
2. Haz clic en el icono de la cámara en la barra de estado. También puedes abrir los comandos rápidos con `F2` en Windows y Linux, o `Cmd+E` en macOS, y escribir `Capture`.
3. Selecciona **Full Page**.
4. Selecciona el resultado: **Save as PNG** (guardar como PNG), **Save as JPEG** (guardar como JPEG) o **Copy to Clipboard** (copiar al portapapeles).
5. Haz clic en **Capture**. Los archivos guardados van a la carpeta configurada en **Settings** > **Webpages** > **Image Capture** > **Capture Storage Folder** (Ajustes > Páginas web > Captura de imagen > Carpeta de capturas).

Vivaldi también puede convertir una captura en una nota nueva del panel de notas, con la fecha de la captura y la URL de la página.

La [lista de atajos de teclado de Vivaldi](https://help.vivaldi.com/desktop/shortcuts/keyboard-shortcuts/) no muestra ninguna tecla por defecto para capturar la página. Para tener una, abre **Settings** > **Keyboard** (Ajustes > Teclado) y asigna una tecla a **Capture Page to disk** (capturar página en disco) o a **Capture Page to Clipboard** (capturar página al portapapeles).

## Límites

- **Tamaño.** Las capturas de página completa llegan como máximo a 30.000 píxeles. En una página más larga, captura las secciones que necesitas.
- **Comportamiento no documentado.** Vivaldi no documenta cómo construye la imagen de página completa ni cómo trata las cabeceras fijas. Revisa la parte superior y la parte central de la imagen en busca de una cabecera que falte o se repita.
- **Carga diferida.** Las imágenes marcadas con `loading="lazy"` solo se cargan cuando te desplazas cerca de ellas. Desplázate por la página antes de capturarla, o partes de la imagen pueden quedar en blanco.
- **Contenedores con desplazamiento interno.** Algunos desarrolladores informan de que las capturas de página completa en Chromium, Firefox y WebKit muestran solo una pantalla de alto de un panel que se desplaza dentro de un contenedor de altura fija. Vivaldi no documenta su comportamiento en este caso, así que revisa las aplicaciones web y los sitios de documentación con un panel de contenido desplazable.
- **Marcado.** Vivaldi no documenta herramientas de dibujo ni de marcado para las capturas. Para añadir flechas o texto, abre el archivo en otra aplicación.

## Con OpenScreenShot

OpenScreenShot desplaza la página de pantalla en pantalla y une las partes en una imagen. Las cabeceras fijas se capturan una vez arriba, y las páginas que desplazan un elemento interno también funcionan. Una página de más de 32.000 píxeles de dispositivo de alto se guarda en hasta seis imágenes.

1. Abre la [ficha de OpenScreenShot](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp) en Vivaldi y añade la extensión. Vivaldi explica la instalación desde la Chrome Web Store en su [ayuda sobre extensiones](https://help.vivaldi.com/desktop/appearance-customization/extensions/).
2. Fija el icono de OpenScreenShot en la barra de herramientas.
3. Abre la página y haz clic en el icono, o pulsa `Ctrl+Shift+S` (`⌘⇧S` en macOS). Con los ajustes por defecto, empieza una captura de página completa y el resultado se abre en el editor.
4. Revisa la parte superior, la parte inferior y cualquier navegación fija.
5. Haz clic en **Guardar imagen** y elige PNG, JPEG, WebP o PDF, o haz clic en **Copiar**.

Si el icono abre un menú, selecciona **Página completa**; el ajuste **Modo Express de un clic** controla este comportamiento. El editor añade flechas, texto, números de paso, desenfoque y recorte antes de exportar. La [referencia de modos de captura](/es/docs/#modes) y la [referencia de exportación](/es/docs/#export) enumeran todas las opciones.

## Cuál usar

- Usa la herramienta Capture de Vivaldi para un PNG o un JPEG de una página de menos de 30.000 píxeles, sobre todo cuando quieres la captura en una nota con su URL.
- Usa OpenScreenShot para páginas más largas, páginas que desplazan un panel interno o capturas que quieres marcar o guardar como PDF, como en la [documentación de ayuda y tutoriales](/es/use-cases/documentation/) o en una [revisión de diseño](/es/use-cases/design-review/).
- Asigna un atajo en Vivaldi si capturas a menudo y no necesitas marcas.

La [guía de Opera](/es/full-page-screenshot/opera/) y la [guía de Brave](/es/full-page-screenshot/brave/) tratan otros navegadores Chromium con sus propias herramientas de captura. Para páginas que bloquean las extensiones, como los ajustes del navegador, consulta [soporte y limitaciones conocidas](/es/support/).
