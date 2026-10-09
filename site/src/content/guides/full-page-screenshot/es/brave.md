---
title: Cómo hacer una captura de página completa en Brave
description: Activa el botón de captura de Brave en la barra de herramientas y captura una página completa como PNG, revisa los límites y usa OpenScreenShot.
order: 5
---

Brave 1.94 y versiones posteriores tienen una herramienta de captura integrada. Activa el botón de captura en `brave://settings/appearance`, haz clic en él y selecciona **Full page** (página completa). En Brave 1.96 y versiones posteriores, se abre una vista previa en la que descargas un PNG o copias la imagen. OpenScreenShot también funciona en Brave: Brave es un navegador Chromium e instala extensiones desde la Chrome Web Store.

## Método integrado

Brave no tiene ningún artículo de ayuda sobre la herramienta. Los pasos siguientes se basan en las [notas de la versión](https://brave.com/latest/) de Brave y en su [gestor de incidencias](https://github.com/brave/brave-browser/issues/57937).

1. Ve a `brave://settings/appearance` y activa el botón de captura en la sección de la barra de herramientas.
2. Abre la página que quieres capturar.
3. Haz clic en el botón **Take a screenshot** (hacer una captura de pantalla) de la barra de herramientas.
4. En la burbuja **Capture screenshot** (capturar pantalla), selecciona **Full page**. La burbuja también ofrece **Selected area** (área seleccionada) y **Visible area** (área visible).
5. En el diálogo **Screenshot preview** (vista previa de la captura), selecciona **Download** (descargar) para guardar un PNG, o selecciona **Copy to clipboard** (copiar al portapapeles).

`Ctrl+Shift+S` (`Shift+Cmd+S` en macOS) abre la herramienta de captura de Brave en Brave 1.75 y versiones posteriores. El gestor de incidencias de Brave describe ese atajo como una captura de tipo selección, así que usa el botón de la barra de herramientas para **Full page**. En Brave 1.96, la opción de captura del menú de la aplicación pasó a la sección Save de **Save and share** (guardar y compartir).

La vista previa ofrece **Download** y **Copy to clipboard**. Para añadir flechas o texto, abre el PNG en otra aplicación.

## Límites

- **Tamaño de página.** La opción **Full page** usa el comando de captura de DevTools de Chromium. Ese comando rechaza una página de 131.072 píxeles CSS o más de ancho o de alto, con el error «Page is too large.».
- **Elementos fijos y sticky.** Para ese comando, Chromium redimensiona la vista al tamaño completo de la página. Las secciones con la altura de la ventana (`100vh`) y las cabeceras o pies fijos pueden entonces maquetarse según esa vista tan alta, así que un pie fijo puede aparecer una vez al final de la imagen.
- **Carga diferida.** Las imágenes marcadas con `loading="lazy"` solo se cargan cuando te desplazas cerca de ellas. Desplázate por la página antes de capturarla, o partes de la imagen pueden quedar en blanco.
- **Contenedores con desplazamiento interno.** Chromium calcula el tamaño de la captura a partir del tamaño de desplazamiento propio de la página. Cuando una página desplaza un panel dentro de un contenedor de altura fija, la captura muestra solo una pantalla de alto de ese panel.
- **Desplazamiento infinito.** Un feed que sigue cargando no tiene un final real. La captura contiene solo lo que se cargó antes de empezar.

## Con OpenScreenShot

OpenScreenShot desplaza la página de pantalla en pantalla y une las partes en una imagen. Las cabeceras fijas se capturan una vez arriba, y las páginas que desplazan un elemento interno también funcionan. Una página de más de 32.000 píxeles de dispositivo de alto se guarda en hasta seis imágenes.

1. Abre la [ficha de OpenScreenShot](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp) en Brave y añade la extensión. Brave explica la instalación desde la Chrome Web Store en [Using Chrome extensions in Brave](https://brave.com/learn/using-chrome-extensions-in-brave/).
2. Fija el icono de OpenScreenShot en la barra de herramientas.
3. Abre la página y haz clic en el icono. Con los ajustes por defecto, empieza una captura de página completa y el resultado se abre en el editor.
4. Revisa la parte superior, la parte inferior y cualquier navegación fija.
5. Haz clic en **Guardar imagen** y elige PNG, JPEG, WebP o PDF, o haz clic en **Copiar**.

El atajo de página completa de OpenScreenShot es `Ctrl+Shift+S` (`⌘⇧S` en macOS), las mismas teclas que la herramienta de captura de Brave. Si las teclas abren la herramienta de Brave, haz clic en el icono, o asigna otra tecla con el enlace **Atajos** del menú de captura. Si el icono abre un menú, selecciona **Página completa**; el ajuste **Modo Express de un clic** controla este comportamiento.

## Cuál usar

- Usa el botón **Full page** de Brave para un PNG rápido de una página que desplaza la ventana entera.
- Usa OpenScreenShot para páginas que desplazan un panel interno, para exportar a PDF, JPEG o WebP, o para marcar la captura y ocultar datos antes de compartirla, como en los [informes de errores](/es/use-cases/bug-reports/).
- Usa el panel **Beautify** de OpenScreenShot cuando la captura va a una publicación: añade relleno, esquinas redondeadas, una sombra y un fondo. Consulta [capturas para redes sociales](/es/use-cases/social-media/).

La [referencia de modos de captura](/es/docs/#modes) y la [referencia de exportación](/es/docs/#export) enumeran todas las opciones. La [guía de Chrome](/es/full-page-screenshot/chrome/) trata la captura de DevTools, que Brave también tiene. Para páginas que bloquean las extensiones, como los ajustes del navegador, consulta [soporte y limitaciones conocidas](/es/support/).
