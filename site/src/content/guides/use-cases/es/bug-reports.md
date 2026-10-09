---
title: Cómo hacer capturas de pantalla para informes de errores
description: Captura la parte de la página que falla, márcala con flechas y números de paso, oculta tokens y correos, y pega la imagen en una incidencia.
order: 1
---

Para un informe de errores, captura solo la parte de la página que muestra el problema, marca lo que falla y oculta todo lo privado antes de pegar la imagen en la incidencia. En OpenScreenShot, usa **Región** o **Capturar elemento** para la captura, las herramientas **Flecha** y **Número de paso** para las marcas, y **Desenfocar** con el relleno **Sólido** para ocultar datos. Escribe la URL, el navegador y los pasos para reproducir el error en el texto de la incidencia, porque la captura muestra el contenido de la página sin la barra de direcciones.

## Capturar y marcar un error paso a paso

1. Abre la página y llévala al estado en el que falla. Cierra los banners que tapan el problema.
2. Haz clic derecho en la página, abre el submenú **OpenScreenShot** y elige **Región** o **Capturar elemento**. Con los ajustes por defecto, un clic en el icono de la barra de herramientas captura la página completa.
3. Para una región, arrastra un rectángulo alrededor del problema con suficiente interfaz alrededor para identificar dónde está. Pulsa `Enter` para confirmar. Para un elemento, pasa el cursor hasta que se resalte la tarjeta, la tabla o el formulario que quieres y, después, haz clic o pulsa `Enter`.
4. En el **Editor**, añade una **Flecha** (`A`) en el detalle que falla. Añade un **Número de paso** (`S`) para cada acción cuando el error necesita varios clics para reproducirse.
5. Selecciona **Desenfocar** (`B`), elige **Sólido** en **Ocultación** y cubre los tokens de acceso, las direcciones de correo, los nombres de cuenta y los nombres de host internos.
6. Haz clic en **Copiar**, o pulsa `Ctrl+C` (`⌘C` en macOS), y pega la imagen en la incidencia.

En el modo de elemento, `↑` selecciona el elemento padre y `↓` el hijo, lo que ayuda cuando el contorno cae sobre un contenedor demasiado pequeño o demasiado grande. Si el elemento no se ve entero, el selector ofrece una captura de página completa.

## Capturar estados hover, menús desplegables y tooltips

Un menú o un tooltip suele cerrarse cuando haces clic en otro sitio. Ajusta **Retardo** a 3, 5 o 10 segundos en el menú o en **Ajustes**, inicia la captura y abre el menú antes de que la insignia de la barra de herramientas termine la cuenta atrás.

El retardo se aplica antes de que empiece la selección de región, así que arrastrar puede cerrar el menú igualmente. Para un estado hover, usa **Área visible** con un retardo y recorta después con **Recortar** (`C`). También puedes seleccionar la región una vez y luego usar **Repetir región** desde el menú del clic derecho con un retardo: captura el mismo rectángulo sin volver a arrastrar.

## Saltarse el editor con la acción Portapapeles

Cuando una captura no necesita marcas, ajusta **Tras capturar** a **Portapapeles** en el menú o en **Ajustes**. Cada captura va entonces directamente al portapapeles, y la insignia de la barra de herramientas lo confirma. Pega la imagen en la incidencia con `Ctrl+V` o `⌘V`.

Este ajuste también se aplica a los atajos de teclado y al menú del clic derecho. Vuelve a ponerlo en **Editor** cuando necesites anotar u ocultar datos. Una captura al portapapeles se salta el paso de ocultación, así que revisa la página en busca de datos privados antes de capturarla.

## Qué escribir junto a la captura

Una captura muestra qué ha fallado. El texto de la incidencia da el contexto que un desarrollador necesita para reproducirlo:

- la URL de la página, sin los parámetros de consulta privados
- el nombre y la versión del navegador, y el sistema operativo
- los pasos para reproducirlo, en el mismo orden que los números de paso de la imagen
- lo que esperabas y lo que ocurrió en su lugar
- la hora del problema, si la página muestra datos en tiempo real

Usa una captura por problema. Un segundo error en la misma imagen hace que no quede claro a cuál apunta la flecha.

## Límites

El desenfoque y el mosaico suavizan los píxeles, pero pueden dejar pistas sobre un texto corto. **Sólido** cubre el área por completo en la exportación; la [guía de ocultación de datos](/es/blog/redact-screenshot/) explica cómo comprobar el resultado. Las páginas internas del navegador y otras páginas protegidas bloquean la captura desde extensiones; consulta [soporte y limitaciones conocidas](/es/support/).

La [referencia de modos de captura](/es/docs/#modes) explica los controles de selección, y la [referencia de anotación](/es/docs/#annotate) enumera cada herramienta y cada atajo. Para responder a usuarios que informan de un problema, consulta [capturas para atención al cliente](/es/use-cases/customer-support/). Para mostrar el error en movimiento, consulta [vídeos de demostración de producto](/es/use-cases/product-demos/).
