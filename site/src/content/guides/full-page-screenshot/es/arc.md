---
title: Cómo hacer una captura de página completa en Arc
description: Ejecuta el comando Capture Full Page de Arc en macOS para guardar un PNG, conoce lo que Arc no documenta y usa OpenScreenShot desde la Chrome Web Store.
order: 8
---

Arc para macOS tiene un comando **Capture Full Page** (capturar página completa). Pulsa `Cmd+T` para abrir la barra de comandos, escribe `Capture Full Page` y selecciónalo. Arc descarga un PNG de la página entera en tu ubicación de descargas predeterminada. La ayuda de Arc documenta este comando solo para macOS. OpenScreenShot también funciona en Arc: Arc es un navegador Chromium e instala extensiones desde la Chrome Web Store.

## Método integrado

Arc describe el comando en [How to take full page screen captures in Arc](https://resources.arc.net/hc/en-us/articles/25481392111895-How-To-Take-Full-Page-Screen-Captures-in-Arc).

1. Abre la página que quieres capturar.
2. Pulsa `Cmd+T` para abrir la barra de comandos, escribe `Capture Full Page` y selecciónalo. También puedes elegir **File** > **Capture Full Page** (Archivo > Capturar página completa).
3. Arc descarga un PNG en tu ubicación de descargas predeterminada.

El comando no tiene un atajo por defecto. Para añadir uno, abre **Arc** > **Settings** > **Shortcuts** (Arc > Ajustes > Atajos), busca `capture` y asigna una tecla a **Capture Full Page**.

Para una captura con estilo, activa el [modo de desarrollador](https://resources.arc.net/hc/en-us/articles/20468488031511-Developer-Mode-Instant-Dev-Tools) y usa el botón de captura de la barra de herramientas, o ejecuta **Capture in Portrait Mode** (capturar en modo vertical) desde la barra de comandos. La herramienta Capture independiente de Arc captura una selección con edición y Easels, y también es solo para macOS.

## Límites

- **Solo macOS.** Arc no documenta ningún comando de página completa para Arc en Windows.
- **Comportamiento no documentado.** Arc no documenta cómo construye la imagen, su límite de tamaño ni cómo trata las cabeceras fijas. Revisa la parte superior y la parte central del PNG en busca de una cabecera que falte o se repita.
- **Marcado.** Arc no documenta la edición de las capturas de página completa. Para añadir flechas o texto, abre el PNG en otra aplicación.
- **Carga diferida.** Las imágenes marcadas con `loading="lazy"` solo se cargan cuando te desplazas cerca de ellas. Desplázate por la página antes de capturarla, o partes de la imagen pueden quedar en blanco.
- **Contenedores con desplazamiento interno.** Algunos desarrolladores informan de que las capturas de página completa en Chromium, Firefox y WebKit muestran solo una pantalla de alto de un panel que se desplaza dentro de un contenedor de altura fija. Revisa las aplicaciones web y los sitios de documentación con un panel de contenido desplazable.
- **Desplazamiento infinito.** Un feed que sigue cargando no tiene un final real. La captura contiene solo lo que se cargó antes de empezar.

## Con OpenScreenShot

OpenScreenShot desplaza la página de pantalla en pantalla y une las partes en una imagen. Las cabeceras fijas se capturan una vez arriba, y las páginas que desplazan un elemento interno también funcionan. Una página de más de 32.000 píxeles de dispositivo de alto se guarda en hasta seis imágenes.

1. Abre la [ficha de OpenScreenShot](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp) en Arc y añade la extensión. Arc explica la instalación desde la Chrome Web Store en [Extensions in Arc](https://resources.arc.net/hc/en-us/articles/19434259167767-Extensions-in-Arc-How-to-Import-Add-Open).
2. Fija el icono de OpenScreenShot.
3. Abre la página y haz clic en el icono, o pulsa `⌘⇧S`. Con los ajustes por defecto, empieza una captura de página completa y el resultado se abre en el editor.
4. Revisa la parte superior, la parte inferior y cualquier navegación fija.
5. Haz clic en **Guardar imagen** y elige PNG, JPEG, WebP o PDF, o haz clic en **Copiar**.

Si el icono abre un menú, selecciona **Página completa**; el ajuste **Modo Express de un clic** controla este comportamiento. Para dar estilo a la captura en OpenScreenShot, abre el panel **Beautify** en el editor: añade relleno, esquinas redondeadas, una sombra y un fondo degradado, sólido o transparente, y el marco se incluye en cada exportación. La [referencia de modos de captura](/es/docs/#modes) y la [referencia de exportación](/es/docs/#export) enumeran todas las opciones.

## Cuál usar

- Usa **Capture Full Page** en Arc para macOS para un PNG rápido de una página que desplaza la ventana entera.
- Usa OpenScreenShot en páginas que desplazan un panel interno, o cuando quieras marcar la captura, ocultar datos o guardarla como PDF, como en una [revisión de diseño](/es/use-cases/design-review/).
- Usa el panel **Beautify** de OpenScreenShot para una imagen con estilo, con tu propio relleno y fondo, como en las [capturas para redes sociales](/es/use-cases/social-media/).

La [guía de Chrome](/es/full-page-screenshot/chrome/) compara la captura de DevTools de Chrome con la extensión, y la [guía de Brave](/es/full-page-screenshot/brave/) trata otro navegador Chromium con una herramienta integrada. Para páginas que bloquean las extensiones, como los ajustes del navegador, consulta [soporte y limitaciones conocidas](/es/support/).
