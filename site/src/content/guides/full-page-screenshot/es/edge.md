---
title: Cómo hacer una captura de página completa en Microsoft Edge
description: Captura una página entera con la herramienta Screenshot de Edge o con su comando de DevTools, conoce los límites y usa OpenScreenShot.
order: 2
---

Microsoft Edge tiene una herramienta de captura integrada, Screenshot, que antes se llamaba Web capture. Pulsa `Ctrl+Shift+S`, selecciona **Capture full page** (capturar página completa) y, después, copia la captura o guárdala en tu dispositivo. OpenScreenShot también funciona en Edge: Edge es un navegador Chromium y lo instala desde la Chrome Web Store una vez que permites las extensiones de otras tiendas.

## Método integrado

Microsoft describe la herramienta en su [guía de capturas de pantalla en Edge](https://www.microsoft.com/en-us/edge/learning-center/screenshot-webpage).

1. Abre la página que quieres capturar.
2. Pulsa `Ctrl+Shift+S`. También puedes hacer clic derecho en la página y seleccionar **Screenshot** (captura de pantalla), o abrir **Settings and more** (configuración y más) (**...**) y seleccionar **Screenshot**.
3. Selecciona **Capture full page**, la opción central.
4. En la vista previa, usa las herramientas de dibujo para marcar la captura si lo necesitas.
5. Copia la captura o guárdala en tu dispositivo.

Microsoft indica que la disponibilidad de la función puede variar según el tipo de dispositivo, el mercado y la versión del navegador. Los administradores también pueden desactivar la herramienta con la [directiva WebCaptureEnabled](https://learn.microsoft.com/en-us/deployedge/microsoft-edge-policies/webcaptureenabled). En un ordenador del trabajo, que falte la opción **Screenshot** puede significar que esa directiva está activa.

Edge también tiene la captura de DevTools de Chromium. Abre DevTools, activa la emulación de dispositivos, abre **More options** (más opciones) y selecciona **Capture a full size screenshot** (hacer una captura de tamaño completo). Microsoft lo documenta en su [artículo sobre el modo de dispositivo](https://learn.microsoft.com/en-us/microsoft-edge/devtools/device-mode/). La [guía de Chrome](/es/full-page-screenshot/chrome/) compara esa vía con una extensión.

## Límites

- **Comportamiento no documentado.** Microsoft no documenta cómo construye la herramienta Screenshot una imagen de página completa, la longitud máxima de página ni cómo trata las cabeceras fijas, la carga diferida y los contenedores con desplazamiento interno. Revisa cada captura antes de compartirla.
- **Contenedores con desplazamiento interno.** Algunos usuarios de Microsoft Q&A informan de que la captura de página completa falló en páginas que se desplazan dentro de un elemento interno, por ejemplo una aplicación web con un panel de contenido desplazable. Microsoft no lo ha confirmado.
- **Tamaño de página en DevTools.** La captura de DevTools usa el comando de captura de Chromium, que rechaza una página de 131.072 píxeles CSS o más de ancho o de alto con el error «Page is too large.».
- **Carga diferida.** Las imágenes marcadas con `loading="lazy"` solo se cargan cuando te desplazas cerca de ellas. Desplázate por la página antes de capturarla, o partes de la imagen pueden quedar en blanco.
- **Cabeceras fijas.** Una herramienta de captura que desplaza la página y une varias partes repite cualquier elemento que se queda en pantalla. Busca una cabecera que aparezca más de una vez a lo largo de la imagen.

## Con OpenScreenShot

OpenScreenShot desplaza la página, la captura por partes y une las partes en una imagen. Las cabeceras fijas se capturan una vez arriba, y las páginas que desplazan un elemento interno también funcionan. Una página de más de 32.000 píxeles de dispositivo de alto se guarda en hasta seis imágenes.

1. Abre la [ficha de OpenScreenShot](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp) en Edge. Cuando Edge lo pregunte, selecciona **Allow extensions from other stores** (permitir extensiones de otras tiendas) y, después, añade la extensión. Microsoft explica este paso en su [ayuda sobre extensiones](https://support.microsoft.com/en-us/edge/add-turn-off-or-remove-extensions-in-microsoft-edge).
2. Fija el icono de OpenScreenShot en la barra de herramientas.
3. Abre la página y haz clic en el icono. Con los ajustes por defecto, empieza una captura de página completa y el resultado se abre en el editor.
4. Revisa la parte superior, la parte inferior y cualquier sección que se carga al desplazarte.
5. Haz clic en **Guardar imagen** y elige PNG, JPEG, WebP o PDF, o haz clic en **Copiar**.

El atajo de página completa de OpenScreenShot es `Ctrl+Shift+S`, las mismas teclas que la herramienta Screenshot de Edge. Si las teclas abren la herramienta de Edge, haz clic en el icono, o asigna otra tecla con el enlace **Atajos** del menú de captura. La [referencia de modos de captura](/es/docs/#modes) enumera los demás modos.

## Cuál usar

- Usa la herramienta Screenshot de Edge para una captura rápida con unos pocos trazos de lápiz, en una página que desplaza la ventana entera.
- Usa OpenScreenShot cuando una página desplaza un panel interno, cuando necesitas exportar a PDF, JPEG o WebP, o cuando necesitas números de paso y ocultación sólida, como en la [documentación de ayuda y tutoriales](/es/use-cases/documentation/) o en las [respuestas de soporte](/es/use-cases/customer-support/).
- Usa la captura de DevTools cuando tu administrador ha desactivado la herramienta Screenshot y no puedes instalar extensiones.

La [referencia de exportación](/es/docs/#export) trata los formatos de archivo y la escala. Para páginas que OpenScreenShot no puede capturar, como los ajustes del navegador, consulta [soporte y limitaciones conocidas](/es/support/).
